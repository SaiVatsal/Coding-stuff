// browser/window_manager.rs — Multi-tab lifecycle, dynamic WebView bounds, and split-view logic
//
// This is the beating heart of April Browser's tab system. Each tab maps to a
// native child WebView positioned beneath the React chrome (TabStrip + OmniBar = 72px).
// When the AI drawer opens, all visible WebViews shrink horizontally to avoid
// the native-layer clipping problem (OS WebViews render above HTML DOM elements).

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::Manager;

// Layout constants (in logical pixels, DPI-independent)
const CHROME_HEIGHT: f64 = 72.0; // TabStrip (36px) + OmniBar (36px)
const DRAWER_WIDTH: f64 = 400.0;
const MIN_CONTENT_WIDTH: f64 = 300.0;
const MIN_CONTENT_HEIGHT: f64 = 200.0;

// ─── Data Structures ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabInfo {
    pub id: String,
    pub url: String,
    pub title: String,
    pub has_webview: bool,
}

#[derive(Debug)]
pub struct Tab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub has_webview: bool,
}

#[derive(Debug)]
pub struct BrowserState {
    pub tabs: Vec<Tab>,
    pub active_tab_id: Option<String>,
    pub split_mode: bool,
    pub split_right_id: Option<String>,
    pub drawer_open: bool,
    pub bounds: WindowBounds,
}

#[derive(Debug, Clone)]
pub struct WindowBounds {
    pub width: f64,
    pub height: f64,
}

/// Computed position and size for a child WebView.
struct ViewRect {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

impl BrowserState {
    pub fn new() -> Self {
        Self {
            tabs: Vec::new(),
            active_tab_id: None,
            split_mode: false,
            split_right_id: None,
            drawer_open: false,
            bounds: WindowBounds {
                width: 1280.0,
                height: 800.0,
            },
        }
    }

    fn find_tab(&self, id: &str) -> Option<&Tab> {
        self.tabs.iter().find(|t| t.id == id)
    }

    fn find_tab_mut(&mut self, id: &str) -> Option<&mut Tab> {
        self.tabs.iter_mut().find(|t| t.id == id)
    }
}

// ─── Bounds Calculation ─────────────────────────────────────────────────────

fn content_rect(state: &BrowserState) -> ViewRect {
    let available_width = if state.drawer_open {
        (state.bounds.width - DRAWER_WIDTH).max(MIN_CONTENT_WIDTH)
    } else {
        state.bounds.width
    };
    ViewRect {
        x: 0.0,
        y: CHROME_HEIGHT,
        width: available_width,
        height: (state.bounds.height - CHROME_HEIGHT).max(MIN_CONTENT_HEIGHT),
    }
}

fn split_rects(state: &BrowserState) -> (ViewRect, ViewRect) {
    let full = content_rect(state);
    let half = (full.width / 2.0).max(MIN_CONTENT_WIDTH / 2.0);
    (
        ViewRect {
            x: 0.0,
            y: full.y,
            width: half,
            height: full.height,
        },
        ViewRect {
            x: half,
            y: full.y,
            width: full.width - half,
            height: full.height,
        },
    )
}

// ─── WebView Helpers ────────────────────────────────────────────────────────

/// Move a WebView off-screen so it's invisible but stays alive (preserving page state).
fn park_webview(app: &tauri::AppHandle, tab_id: &str) {
    if let Some(wv) = app.get_webview(tab_id) {
        let _ = wv.set_position(tauri::LogicalPosition::new(-10000.0, -10000.0));
    }
}

/// Position a WebView within the visible content area.
fn place_webview(app: &tauri::AppHandle, tab_id: &str, rect: &ViewRect) -> Result<(), String> {
    let wv = app
        .get_webview(tab_id)
        .ok_or_else(|| format!("WebView '{}' not found", tab_id))?;
    wv.set_position(tauri::LogicalPosition::new(rect.x, rect.y))
        .map_err(|e| format!("set_position failed: {}", e))?;
    wv.set_size(tauri::LogicalSize::new(rect.width, rect.height))
        .map_err(|e| format!("set_size failed: {}", e))?;
    Ok(())
}

/// Park every WebView that currently has a native child.
fn park_all(app: &tauri::AppHandle, state: &BrowserState) {
    for tab in &state.tabs {
        if tab.has_webview {
            park_webview(app, &tab.id);
        }
    }
}

/// Reposition all visible WebViews according to current layout state.
fn relayout(app: &tauri::AppHandle, state: &BrowserState) -> Result<(), String> {
    park_all(app, state);

    if state.split_mode {
        let (left_rect, right_rect) = split_rects(state);
        if let Some(ref active_id) = state.active_tab_id {
            if state.find_tab(active_id).map_or(false, |t| t.has_webview) {
                let _ = place_webview(app, active_id, &left_rect);
            }
        }
        if let Some(ref right_id) = state.split_right_id {
            if state.find_tab(right_id).map_or(false, |t| t.has_webview) {
                let _ = place_webview(app, right_id, &right_rect);
            }
        }
    } else if let Some(ref active_id) = state.active_tab_id {
        if state.find_tab(active_id).map_or(false, |t| t.has_webview) {
            let rect = content_rect(state);
            place_webview(app, active_id, &rect)?;
        }
    }
    Ok(())
}

// ─── Tauri Commands ─────────────────────────────────────────────────────────

/// Create a new tab. If `url` is provided and non-empty, a child WebView is
/// spawned immediately. Otherwise we treat it as an "April Hub" new-tab page
/// (rendered by React, no native WebView needed).
#[tauri::command]
pub fn create_tab(
    app: tauri::AppHandle,
    url: Option<String>,
    state: tauri::State<'_, Mutex<BrowserState>>,
    blocker: tauri::State<'_, super::adblocker::AdBlocker>,
) -> Result<TabInfo, String> {
    let mut browser = state.lock().map_err(|e| e.to_string())?;
    let tab_id = format!("tab-{}", uuid::Uuid::new_v4());
    let url_str = url.unwrap_or_default();
    let mut has_webview = false;

    if !url_str.is_empty() {
        spawn_child_webview(&app, &tab_id, &url_str, &blocker, &browser)?;
        has_webview = true;
    }

    browser.tabs.push(Tab {
        id: tab_id.clone(),
        url: url_str.clone(),
        title: "New Tab".to_string(),
        has_webview,
    });
    browser.active_tab_id = Some(tab_id.clone());

    relayout(&app, &browser)?;

    Ok(TabInfo {
        id: tab_id,
        url: url_str,
        title: "New Tab".to_string(),
        has_webview,
    })
}

/// Close a tab and destroy its WebView if one exists.
#[tauri::command]
pub fn close_tab(
    app: tauri::AppHandle,
    tab_id: String,
    state: tauri::State<'_, Mutex<BrowserState>>,
) -> Result<Option<String>, String> {
    let mut browser = state.lock().map_err(|e| e.to_string())?;

    // Destroy the native WebView
    if let Some(wv) = app.get_webview(&tab_id) {
        let _ = wv.close();
    }

    browser.tabs.retain(|t| t.id != tab_id);

    // If we closed the active tab, activate the last remaining tab (or none)
    if browser.active_tab_id.as_deref() == Some(&tab_id) {
        browser.active_tab_id = browser.tabs.last().map(|t| t.id.clone());
    }

    // If the split-right tab was closed, exit split mode
    if browser.split_right_id.as_deref() == Some(&tab_id) {
        browser.split_mode = false;
        browser.split_right_id = None;
    }

    relayout(&app, &browser)?;
    Ok(browser.active_tab_id.clone())
}

/// Switch the active tab.
#[tauri::command]
pub fn switch_tab(
    app: tauri::AppHandle,
    tab_id: String,
    state: tauri::State<'_, Mutex<BrowserState>>,
) -> Result<(), String> {
    let mut browser = state.lock().map_err(|e| e.to_string())?;

    if browser.find_tab(&tab_id).is_none() {
        return Err(format!("Tab '{}' does not exist", tab_id));
    }

    browser.active_tab_id = Some(tab_id);
    relayout(&app, &browser)
}

/// Navigate an existing tab to a new URL. Creates a child WebView if one
/// doesn't exist yet (e.g., navigating away from April Hub).
#[tauri::command]
pub fn navigate_tab(
    app: tauri::AppHandle,
    tab_id: String,
    url: String,
    state: tauri::State<'_, Mutex<BrowserState>>,
    blocker: tauri::State<'_, super::adblocker::AdBlocker>,
) -> Result<TabInfo, String> {
    let mut browser = state.lock().map_err(|e| e.to_string())?;

    let tab = browser
        .find_tab_mut(&tab_id)
        .ok_or_else(|| format!("Tab '{}' not found", tab_id))?;

    if tab.has_webview {
        // WebView already exists — navigate in-place via JS eval
        if let Some(wv) = app.get_webview(&tab_id) {
            let escaped = url.replace('\\', "\\\\").replace('\'', "\\'");
            wv.eval(&format!("window.location.href = '{}'", escaped))
                .map_err(|e| format!("Navigation eval failed: {}", e))?;
        }
    } else {
        // First navigation from April Hub — spawn a real WebView
        spawn_child_webview(&app, &tab_id, &url, &blocker, &browser)?;
        tab.has_webview = true;
    }

    tab.url = url.clone();

    let info = TabInfo {
        id: tab.id.clone(),
        url: tab.url.clone(),
        title: tab.title.clone(),
        has_webview: tab.has_webview,
    };

    relayout(&app, &browser)?;
    Ok(info)
}

/// Returns metadata for every open tab.
#[tauri::command]
pub fn list_tabs(state: tauri::State<'_, Mutex<BrowserState>>) -> Result<Vec<TabInfo>, String> {
    let browser = state.lock().map_err(|e| e.to_string())?;
    Ok(browser
        .tabs
        .iter()
        .map(|t| TabInfo {
            id: t.id.clone(),
            url: t.url.clone(),
            title: t.title.clone(),
            has_webview: t.has_webview,
        })
        .collect())
}

/// Toggle split-view mode. When enabling, picks the next-to-active tab for the
/// right pane. When disabling, collapses back to single-tab view.
#[tauri::command]
pub fn toggle_split_view(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<BrowserState>>,
) -> Result<bool, String> {
    let mut browser = state.lock().map_err(|e| e.to_string())?;

    if browser.split_mode {
        browser.split_mode = false;
        browser.split_right_id = None;
    } else if browser.tabs.len() >= 2 {
        browser.split_mode = true;
        // Pick the first tab that isn't the active one for the right pane
        let active = browser.active_tab_id.clone();
        browser.split_right_id = browser
            .tabs
            .iter()
            .find(|t| Some(&t.id) != active.as_ref())
            .map(|t| t.id.clone());
    }

    relayout(&app, &browser)?;
    Ok(browser.split_mode)
}

/// Called by the frontend on window resize and drawer toggle to keep child
/// WebViews perfectly aligned with the visible content area.
#[tauri::command]
pub fn sync_webview_bounds(
    app: tauri::AppHandle,
    window_width: f64,
    window_height: f64,
    drawer_open: bool,
    state: tauri::State<'_, Mutex<BrowserState>>,
) -> Result<(), String> {
    let mut browser = state.lock().map_err(|e| e.to_string())?;
    browser.bounds.width = window_width;
    browser.bounds.height = window_height;
    browser.drawer_open = drawer_open;
    relayout(&app, &browser)
}

/// Explicitly set the AI drawer open/closed state. Triggers a relayout so
/// WebViews shrink or expand accordingly.
#[tauri::command]
pub fn set_drawer_open(
    app: tauri::AppHandle,
    open: bool,
    state: tauri::State<'_, Mutex<BrowserState>>,
) -> Result<(), String> {
    let mut browser = state.lock().map_err(|e| e.to_string())?;
    browser.drawer_open = open;
    relayout(&app, &browser)
}

// ─── Internal: WebView Spawning ─────────────────────────────────────────────

/// Create a native child WebView attached to the main window. Injects the
/// cosmetic ad-blocking script and wires up the navigation filter.
fn spawn_child_webview(
    app: &tauri::AppHandle,
    tab_id: &str,
    url: &str,
    blocker: &super::adblocker::AdBlocker,
    state: &BrowserState,
) -> Result<(), String> {
    let window = app
        .get_window("main")
        .ok_or("Main window not found — has it been closed?")?;

    let parsed = url::Url::parse(url).map_err(|e| format!("Invalid URL '{}': {}", url, e))?;
    let cosmetic_js = blocker.cosmetic_script();
    let blocked_domains = blocker.domains.clone();
    let rect = content_rect(state);

    window
        .add_child(
            tauri::webview::WebviewBuilder::new(tab_id, tauri::WebviewUrl::External(parsed))
                .initialization_script(&cosmetic_js)
                .on_navigation(move |nav_url| {
                    // Allow all non-HTTP schemes (tauri://, data:, etc.)
                    match nav_url.scheme() {
                        "http" | "https" => {
                            if let Some(host) = nav_url.host_str() {
                                let dominated =
                                    super::adblocker::AdBlocker::is_blocked_host(host, &blocked_domains);
                                !dominated // return false to cancel navigation
                            } else {
                                true
                            }
                        }
                        _ => true,
                    }
                }),
            tauri::LogicalPosition::new(rect.x, rect.y),
            tauri::LogicalSize::new(rect.width, rect.height),
        )
        .map_err(|e| format!("Failed to create child WebView: {}", e))?;

    Ok(())
}
