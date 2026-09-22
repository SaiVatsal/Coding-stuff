// ai/token_pruner.rs — DOM → semantic Markdown converter with hard token cap
//
// The goal: turn a bloated 200KB HTML page into a tight ~1,500-token Markdown
// summary that an LLM can reason over without burning your API budget.
//
// Strategy:
//   1. Parse with `scraper` (zero-copy HTML parser)
//   2. Walk the DOM tree in document order, skipping noise elements
//   3. Convert semantic elements (headings, paragraphs, lists) to Markdown
//   4. Estimate tokens at ~4 chars/token and hard-truncate at the budget

use scraper::{ElementRef, Html, Selector};
use serde::{Deserialize, Serialize};

const TOKEN_BUDGET: usize = 1500;
const CHARS_PER_TOKEN: usize = 4;
const MAX_CHARS: usize = TOKEN_BUDGET * CHARS_PER_TOKEN; // 6000

/// Elements that contribute zero useful semantic content.
const SKIP_TAGS: &[&str] = &[
    "script", "style", "noscript", "svg", "iframe", "link", "meta", "head",
    "nav", "footer", "aside", "form", "input", "button", "select", "textarea",
    "dialog", "template", "canvas", "video", "audio", "object", "embed",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrunedContent {
    pub markdown: String,
    pub token_estimate: usize,
}

/// Main entry point: HTML in, Markdown + token count out.
pub fn prune_html(raw_html: &str) -> PrunedContent {
    let document = Html::parse_document(raw_html);
    let mut output = String::with_capacity(MAX_CHARS + 256);

    // Extract <title> as the top-level heading
    if let Some(title_el) = document
        .select(&selector("title"))
        .next()
    {
        let title_text = collect_text(&title_el).trim().to_string();
        if !title_text.is_empty() {
            output.push_str("# ");
            output.push_str(&title_text);
            output.push_str("\n\n");
        }
    }

    // Walk <body> in document order
    if let Some(body) = document.select(&selector("body")).next() {
        walk_element(&body, &mut output, 0);
    }

    // Collapse excessive whitespace runs
    let cleaned = collapse_whitespace(&output);

    // Hard token cap
    let (final_text, truncated) = if cleaned.len() > MAX_CHARS {
        let mut truncated_str = cleaned[..MAX_CHARS].to_string();
        // Don't cut mid-word — back up to the last space
        if let Some(last_space) = truncated_str.rfind(' ') {
            truncated_str.truncate(last_space);
        }
        truncated_str.push_str("\n\n[...content truncated to 1,500 token budget...]");
        (truncated_str, true)
    } else {
        (cleaned, false)
    };

    let token_estimate = if truncated {
        TOKEN_BUDGET
    } else {
        final_text.len() / CHARS_PER_TOKEN
    };

    PrunedContent {
        markdown: final_text,
        token_estimate,
    }
}

/// Recursively walk an element and its children, converting to Markdown.
fn walk_element(element: &ElementRef, output: &mut String, depth: usize) {
    // Bail early if we've already exceeded the budget — no point walking more DOM
    if output.len() > MAX_CHARS + 1000 {
        return;
    }

    let tag = element.value().name();

    // Skip noise elements entirely
    if SKIP_TAGS.contains(&tag) {
        return;
    }

    // Skip hidden elements
    if element.value().attr("aria-hidden") == Some("true") {
        return;
    }
    if let Some(style) = element.value().attr("style") {
        let s = style.to_lowercase();
        if s.contains("display:none") || s.contains("display: none")
            || s.contains("visibility:hidden") || s.contains("visibility: hidden")
        {
            return;
        }
    }

    match tag {
        // Headings → Markdown heading levels
        "h1" => push_heading(output, &collect_text(element), 1),
        "h2" => push_heading(output, &collect_text(element), 2),
        "h3" => push_heading(output, &collect_text(element), 3),
        "h4" | "h5" | "h6" => push_heading(output, &collect_text(element), 4),

        // Paragraphs
        "p" => {
            let text = collect_text(element);
            let trimmed = text.trim();
            if !trimmed.is_empty() {
                output.push_str(trimmed);
                output.push_str("\n\n");
            }
        }

        // List items
        "li" => {
            let text = collect_text(element);
            let trimmed = text.trim();
            if !trimmed.is_empty() {
                output.push_str("- ");
                output.push_str(trimmed);
                output.push('\n');
            }
        }

        // Links — preserve href for context
        "a" => {
            let text = collect_text(element);
            let trimmed = text.trim();
            if !trimmed.is_empty() {
                if let Some(href) = element.value().attr("href") {
                    // Skip javascript: and # links
                    if !href.starts_with("javascript:") && href != "#" {
                        output.push_str(&format!("[{}]({})", trimmed, href));
                    } else {
                        output.push_str(trimmed);
                    }
                } else {
                    output.push_str(trimmed);
                }
                output.push(' ');
            }
        }

        // Images — extract alt text only (no point sending URLs to the LLM)
        "img" => {
            if let Some(alt) = element.value().attr("alt") {
                let alt = alt.trim();
                if !alt.is_empty() {
                    output.push_str(&format!("[Image: {}] ", alt));
                }
            }
        }

        // Code blocks
        "pre" => {
            let text = collect_text(element);
            let trimmed = text.trim();
            if !trimmed.is_empty() {
                output.push_str("```\n");
                // Cap code blocks at 500 chars to avoid blowing the budget
                if trimmed.len() > 500 {
                    output.push_str(&trimmed[..500]);
                    output.push_str("...");
                } else {
                    output.push_str(trimmed);
                }
                output.push_str("\n```\n\n");
            }
        }
        "code" => {
            // Inline code (not inside <pre>)
            let text = collect_text(element);
            let trimmed = text.trim();
            if !trimmed.is_empty() {
                output.push('`');
                output.push_str(trimmed);
                output.push_str("` ");
            }
        }

        // Block quotes
        "blockquote" => {
            let text = collect_text(element);
            for line in text.trim().lines() {
                output.push_str("> ");
                output.push_str(line.trim());
                output.push('\n');
            }
            output.push('\n');
        }

        // Table → simplified text representation
        "table" => {
            output.push_str("[Table]\n");
            recurse_children(element, output, depth + 1);
            output.push('\n');
        }
        "tr" => {
            output.push_str("| ");
            recurse_children(element, output, depth + 1);
            output.push_str("|\n");
        }
        "th" | "td" => {
            let text = collect_text(element);
            output.push_str(text.trim());
            output.push_str(" | ");
        }

        // Thematic break
        "hr" => {
            output.push_str("\n---\n\n");
        }

        // Line break
        "br" => {
            output.push('\n');
        }

        // Container elements — just recurse into children
        _ => {
            recurse_children(element, output, depth + 1);
        }
    }
}

fn recurse_children(element: &ElementRef, output: &mut String, depth: usize) {
    for child in element.children() {
        if let Some(child_el) = ElementRef::wrap(child) {
            walk_element(&child_el, output, depth);
        } else if let Some(text_node) = child.value().as_text() {
            let t = text_node.trim();
            if !t.is_empty() {
                output.push_str(t);
                output.push(' ');
            }
        }
    }
}

fn push_heading(output: &mut String, text: &str, level: usize) {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return;
    }
    output.push('\n');
    for _ in 0..level {
        output.push('#');
    }
    output.push(' ');
    output.push_str(trimmed);
    output.push_str("\n\n");
}

/// Collect all visible text within an element (flattened, whitespace-joined).
fn collect_text(element: &ElementRef) -> String {
    element
        .text()
        .collect::<Vec<_>>()
        .join(" ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

/// Reduce runs of 3+ newlines to 2, and multiple spaces to single.
fn collapse_whitespace(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut newline_count = 0;

    for ch in s.chars() {
        if ch == '\n' {
            newline_count += 1;
            if newline_count <= 2 {
                result.push(ch);
            }
        } else {
            newline_count = 0;
            result.push(ch);
        }
    }
    result
}

/// Convenience wrapper — panics are impossible here since selectors are hardcoded.
fn selector(s: &str) -> Selector {
    Selector::parse(s).expect("hardcoded selector must be valid")
}

// ─── Tauri Command ──────────────────────────────────────────────────────────

/// Prune raw HTML into token-budgeted Markdown. Called by the frontend before
/// feeding page context to the AI agent.
#[tauri::command]
pub fn prune_page_content(html: String) -> PrunedContent {
    prune_html(&html)
}
