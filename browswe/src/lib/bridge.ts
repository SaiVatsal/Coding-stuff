// lib/bridge.ts — Strongly typed Tauri IPC wrappers
//
// Single import point for all backend communication. Every Rust command has a
// matching typed function here so the frontend never passes untyped data over
// the IPC bridge. Errors propagate as rejected promises.

import { invoke } from "@tauri-apps/api/core";

// ─── Shared Types ───────────────────────────────────────────────────────────

export interface TabInfo {
  id: string;
  url: string;
  title: string;
  has_webview: boolean;
}

export interface PrunedContent {
  markdown: string;
  token_estimate: number;
}

export interface CacheCheckResult {
  is_stale: boolean;
  content: string | null;
  token_estimate: number;
}

// ─── Browser Commands ───────────────────────────────────────────────────────

export function createTab(url?: string): Promise<TabInfo> {
  return invoke<TabInfo>("create_tab", { url: url ?? null });
}

export function closeTab(tabId: string): Promise<string | null> {
  return invoke<string | null>("close_tab", { tabId });
}

export function switchTab(tabId: string): Promise<void> {
  return invoke<void>("switch_tab", { tabId });
}

export function navigateTab(tabId: string, url: string): Promise<TabInfo> {
  return invoke<TabInfo>("navigate_tab", { tabId, url });
}

export function listTabs(): Promise<TabInfo[]> {
  return invoke<TabInfo[]>("list_tabs");
}

export function toggleSplitView(): Promise<boolean> {
  return invoke<boolean>("toggle_split_view");
}

export function syncWebviewBounds(
  windowWidth: number,
  windowHeight: number,
  drawerOpen: boolean
): Promise<void> {
  return invoke<void>("sync_webview_bounds", {
    windowWidth,
    windowHeight,
    drawerOpen,
  });
}

export function setDrawerOpen(open: boolean): Promise<void> {
  return invoke<void>("set_drawer_open", { open });
}

// ─── Ad Blocker Commands ────────────────────────────────────────────────────

export function checkShouldBlock(url: string): Promise<boolean> {
  return invoke<boolean>("check_should_block", { url });
}

export function getBlockStats(): Promise<number> {
  return invoke<number>("get_block_stats");
}

// ─── AI Commands ────────────────────────────────────────────────────────────

export function runAgentQuery(
  query: string,
  pageContext: string
): Promise<string> {
  return invoke<string>("run_agent_query", { query, pageContext });
}

export function detectProviders(): Promise<string[]> {
  return invoke<string[]>("detect_providers");
}

export function prunePageContent(html: string): Promise<PrunedContent> {
  return invoke<PrunedContent>("prune_page_content", { html });
}

// ─── Cache Commands ─────────────────────────────────────────────────────────

export function checkCache(tabId: string): Promise<CacheCheckResult> {
  return invoke<CacheCheckResult>("check_cache", { tabId });
}

export function clearCache(): Promise<void> {
  return invoke<void>("clear_cache");
}

// ─── Storage Commands ───────────────────────────────────────────────────────

export function storeApiKey(provider: string, key: string): Promise<void> {
  return invoke<void>("store_api_key", { provider, key });
}

export function getApiKey(provider: string): Promise<string | null> {
  return invoke<string | null>("get_api_key", { provider });
}

export function deleteApiKey(provider: string): Promise<void> {
  return invoke<void>("delete_api_key", { provider });
}

export function listConfiguredProviders(): Promise<string[]> {
  return invoke<string[]>("list_providers");
}
