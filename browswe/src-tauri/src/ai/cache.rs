// ai/cache.rs — SHA-256 content cache for tab context deduplication
//
// Every time the user queries the AI about a page, we hash the pruned content
// and compare it to the last known hash. If identical → skip re-extraction,
// saving both compute and API tokens. Cheap insurance against the user
// spamming "summarize this" on the same page.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone)]
pub struct CacheEntry {
    pub hash: String,
    pub pruned_content: String,
    pub timestamp_ms: u64,
}

pub struct ContentCache {
    entries: HashMap<String, CacheEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheCheckResult {
    pub is_stale: bool,
    pub content: Option<String>,
    pub token_estimate: usize,
}

impl ContentCache {
    pub fn new() -> Self {
        Self {
            entries: HashMap::new(),
        }
    }

    /// Compute SHA-256 hash of the given content string.
    fn hash_content(content: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    fn now_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64
    }

    /// Update the cache for a tab. Returns the cache entry (new or existing).
    pub fn update(&mut self, tab_id: &str, pruned_content: &str) -> CacheEntry {
        let new_hash = Self::hash_content(pruned_content);

        if let Some(existing) = self.entries.get(tab_id) {
            if existing.hash == new_hash {
                // Content unchanged — just return the existing entry
                return existing.clone();
            }
        }

        // New or changed content
        let entry = CacheEntry {
            hash: new_hash,
            pruned_content: pruned_content.to_string(),
            timestamp_ms: Self::now_ms(),
        };
        self.entries.insert(tab_id.to_string(), entry.clone());
        entry
    }

    /// Check if we have cached content for a tab, and whether it's still fresh.
    /// "Stale" here means older than 5 minutes — a reasonable heuristic for
    /// pages that might have updated (live feeds, dashboards, etc.).
    pub fn check(&self, tab_id: &str) -> CacheCheckResult {
        match self.entries.get(tab_id) {
            Some(entry) => {
                let age_ms = Self::now_ms().saturating_sub(entry.timestamp_ms);
                let is_stale = age_ms > 5 * 60 * 1000; // 5 minutes
                CacheCheckResult {
                    is_stale,
                    content: Some(entry.pruned_content.clone()),
                    token_estimate: entry.pruned_content.len() / 4,
                }
            }
            None => CacheCheckResult {
                is_stale: true,
                content: None,
                token_estimate: 0,
            },
        }
    }

    pub fn remove(&mut self, tab_id: &str) {
        self.entries.remove(tab_id);
    }

    pub fn clear_all(&mut self) {
        self.entries.clear();
    }
}

// ─── Tauri Commands ─────────────────────────────────────────────────────────

#[tauri::command]
pub fn check_cache(
    tab_id: String,
    cache: tauri::State<'_, Mutex<ContentCache>>,
) -> Result<CacheCheckResult, String> {
    let cache = cache.lock().map_err(|e| e.to_string())?;
    Ok(cache.check(&tab_id))
}

#[tauri::command]
pub fn clear_cache(cache: tauri::State<'_, Mutex<ContentCache>>) -> Result<(), String> {
    let mut cache = cache.lock().map_err(|e| e.to_string())?;
    cache.clear_all();
    Ok(())
}
