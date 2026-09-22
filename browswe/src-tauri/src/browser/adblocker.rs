// browser/adblocker.rs — Two-layer ad & tracker blocker
//
// Layer 1: Domain-level blocking via a compile-time HashSet. Checked in the
//          `on_navigation` handler of every child WebView so blocked domains
//          never even begin loading.
//
// Layer 2: Cosmetic filtering via a CSS + MutationObserver script injected
//          before any page JS runs (`.initialization_script()`). This hides
//          residual ad containers that slip through on allowed domains.

use std::collections::HashSet;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

/// Embedded blocklist — baked into the binary at compile time.
const BLOCKLIST_RAW: &str = include_str!("blocklist.txt");

pub struct AdBlocker {
    /// Arc-wrapped so we can cheaply clone into `on_navigation` closures.
    pub domains: Arc<HashSet<String>>,
    blocked_count: AtomicU64,
}

impl AdBlocker {
    /// Parse the embedded blocklist. Runs once at startup; the Arc means
    /// subsequent clones for per-tab closures are just pointer bumps.
    pub fn new() -> Self {
        let domains: HashSet<String> = BLOCKLIST_RAW
            .lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty() && !line.starts_with('#'))
            .map(|line| line.to_lowercase())
            .collect();

        log::info!("AdBlocker loaded {} blocked domains", domains.len());

        Self {
            domains: Arc::new(domains),
            blocked_count: AtomicU64::new(0),
        }
    }

    /// Check if a host (or any of its parent domains) appears in the blocklist.
    /// e.g. "ads.example.doubleclick.net" matches if "doubleclick.net" is listed.
    pub fn is_blocked_host(host: &str, domains: &HashSet<String>) -> bool {
        let host_lower = host.to_lowercase();

        // Direct match
        if domains.contains(&host_lower) {
            return true;
        }

        // Walk up the domain hierarchy: "a.b.c.com" → "b.c.com" → "c.com"
        let mut remainder = host_lower.as_str();
        while let Some(dot_pos) = remainder.find('.') {
            remainder = &remainder[dot_pos + 1..];
            if domains.contains(remainder) {
                return true;
            }
        }
        false
    }

    /// Check a full URL against the blocklist. Extracts the host first.
    pub fn should_block(&self, raw_url: &str) -> bool {
        if let Ok(parsed) = url::Url::parse(raw_url) {
            if let Some(host) = parsed.host_str() {
                let blocked = Self::is_blocked_host(host, &self.domains);
                if blocked {
                    self.blocked_count.fetch_add(1, Ordering::Relaxed);
                }
                return blocked;
            }
        }
        false
    }

    /// Returns the cosmetic filter JavaScript to inject via `.initialization_script()`.
    /// This runs before any page scripts, setting up:
    ///   1. A <style> block that hides common ad selectors
    ///   2. A MutationObserver that catches dynamically-inserted ad elements
    pub fn cosmetic_script(&self) -> String {
        r#"
(function() {
  'use strict';

  // ── Layer 2: Cosmetic CSS ──
  // These selectors target the most common ad containers across the web.
  // The `!important` ensures they override inline styles set by ad scripts.
  var css = [
    '[id*="google_ads"]', '[id*="GoogleAds"]', '.adsbygoogle', 'ins.adsbygoogle',
    '[id*="ad-container"]', '[class*="ad-container"]', '[class*="ad-wrapper"]',
    '[class*="advertisement"]', '[class*="ad-banner"]', '[class*="ad-slot"]',
    '[data-ad]', '[data-ad-slot]', '[data-google-query-id]',
    'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
    'iframe[src*="amazon-adsystem"]', 'iframe[src*="facebook.com/plugins"]',
    '[id*="taboola"]', '[class*="taboola"]',
    '[id*="outbrain"]', '[class*="outbrain"]',
    '[class*="sponsored-content"]', '[class*="promoted-content"]',
    '[id*="sponsor"]', '[class*="sponsor"]',
  ].join(',\n');

  var style = document.createElement('style');
  style.id = 'april-cosmetic-filter';
  style.textContent = css + ' {\n' +
    '  display: none !important;\n' +
    '  visibility: hidden !important;\n' +
    '  height: 0 !important;\n' +
    '  min-height: 0 !important;\n' +
    '  max-height: 0 !important;\n' +
    '  overflow: hidden !important;\n' +
    '  pointer-events: none !important;\n' +
    '}';
  (document.head || document.documentElement).appendChild(style);

  // ── MutationObserver for dynamic ad injection ──
  var AD_PATTERNS = /ad[-_]?(container|wrapper|banner|slot|unit|frame|block)|google_ads|adsbygoogle|taboola|outbrain|sponsored/i;

  var observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (node.nodeType !== 1) continue;
        var el = node;
        var id = el.id || '';
        var cls = el.className || '';
        var clsStr = typeof cls === 'string' ? cls : '';
        if (AD_PATTERNS.test(id) || AD_PATTERNS.test(clsStr)) {
          el.style.setProperty('display', 'none', 'important');
        }
      }
    }
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }
})();
"#
        .to_string()
    }

    pub fn stats(&self) -> u64 {
        self.blocked_count.load(Ordering::Relaxed)
    }
}

// ─── Tauri Commands ─────────────────────────────────────────────────────────

/// Frontend can ask "should I block this URL?" for display/logging purposes.
#[tauri::command]
pub fn check_should_block(
    url: String,
    blocker: tauri::State<'_, AdBlocker>,
) -> bool {
    blocker.should_block(&url)
}

/// Returns the total number of blocked requests since launch.
#[tauri::command]
pub fn get_block_stats(blocker: tauri::State<'_, AdBlocker>) -> u64 {
    blocker.stats()
}
