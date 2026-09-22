// lib.rs — Application bootstrap and Tauri Builder configuration
//
// Wires together every module: browser (tabs, ad blocker), AI (agent, cache,
// pruner), and storage (keychain). Registers managed state and all IPC commands.

mod ai;
mod browser;
mod storage;

use std::sync::Mutex;

use browser::adblocker::AdBlocker;
use browser::window_manager::BrowserState;
use ai::cache::ContentCache;

pub fn run() {
    tauri::Builder::default()
        // ── Plugins ──
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        // ── Managed State ──
        // BrowserState and ContentCache need interior mutability → Mutex.
        // AdBlocker is read-only after init → no Mutex, just shared ownership.
        .manage(Mutex::new(BrowserState::new()))
        .manage(AdBlocker::new())
        .manage(Mutex::new(ContentCache::new()))
        // ── IPC Command Registry ──
        .invoke_handler(tauri::generate_handler![
            // Browser: tab lifecycle and WebView bounds
            browser::window_manager::create_tab,
            browser::window_manager::close_tab,
            browser::window_manager::switch_tab,
            browser::window_manager::navigate_tab,
            browser::window_manager::list_tabs,
            browser::window_manager::toggle_split_view,
            browser::window_manager::sync_webview_bounds,
            browser::window_manager::set_drawer_open,
            // Browser: ad blocker
            browser::adblocker::check_should_block,
            browser::adblocker::get_block_stats,
            // AI: agent and context
            ai::agent::run_agent_query,
            ai::agent::detect_providers,
            ai::token_pruner::prune_page_content,
            ai::cache::check_cache,
            ai::cache::clear_cache,
            // Storage: OS keychain
            storage::secure_keys::store_api_key,
            storage::secure_keys::get_api_key,
            storage::secure_keys::delete_api_key,
            storage::secure_keys::list_providers,
        ])
        .run(tauri::generate_context!())
        .expect("fatal: failed to start April Browser");
}
