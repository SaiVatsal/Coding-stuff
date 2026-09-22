// App.tsx — Root application shell for April Browser
//
// Layout: TabStrip → OmniBar → Content Area (AprilHub or WebView background) + AI Drawer
//
// The content area either shows AprilHub (when the active tab has no WebView) or
// acts as a transparent backdrop behind native child WebViews (managed by Rust).
// The AI drawer sits beside the content area, never overlapping native WebViews.

import { useState, useCallback, useRef, useEffect } from "react";

import TabStrip from "./components/TabStrip";
import OmniBar from "./components/OmniBar";
import AIAgentDrawer from "./components/AIAgentDrawer";
import AprilHub from "./components/AprilHub";
import ReaderView from "./components/ReaderView";
import OnboardingModal from "./components/OnboardingModal";

import { useAIStream } from "./hooks/useAIStream";
import { useShortcuts } from "./hooks/useShortcuts";
import { useWebviewBounds } from "./hooks/useWebviewBounds";

import {
  createTab,
  closeTab,
  switchTab,
  navigateTab,
  toggleSplitView,
  setDrawerOpen,
  getBlockStats,
  runAgentQuery,
  checkCache,
  type TabInfo,
} from "./lib/bridge";

export default function App() {
  // ─── Core State ─────────────────────────────────────────────────────────
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [drawerOpen, setDrawerOpenState] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerContent, setReaderContent] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem("april-onboarding-complete") === "true"
  );

  const omnibarRef = useRef<HTMLInputElement>(null);

  // ─── AI Stream ──────────────────────────────────────────────────────────
  const ai = useAIStream();

  // ─── WebView Bounds Sync ────────────────────────────────────────────────
  useWebviewBounds(drawerOpen);

  // ─── Blocked Stats Polling ──────────────────────────────────────────────
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const count = await getBlockStats();
        setBlockedCount(count);
      } catch {
        /* ignore — Rust might not be ready yet */
      }
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  // ─── Create initial tab on mount ────────────────────────────────────────
  useEffect(() => {
    if (onboardingDone && tabs.length === 0) {
      handleNewTab();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingDone]);

  // ─── Tab Actions ────────────────────────────────────────────────────────

  const handleNewTab = useCallback(async () => {
    try {
      const tab = await createTab();
      setTabs((prev) => [...prev, tab]);
      setActiveTabId(tab.id);
      setCurrentUrl("");
    } catch (err) {
      console.error("Failed to create tab:", err);
    }
  }, []);

  const handleCloseTab = useCallback(
    async (id?: string) => {
      const targetId = id || activeTabId;
      if (!targetId) return;
      try {
        const nextActiveId = await closeTab(targetId);
        setTabs((prev) => prev.filter((t) => t.id !== targetId));
        setActiveTabId(nextActiveId);
        // Update URL display for the newly active tab
        if (nextActiveId) {
          setTabs((prev) => {
            const active = prev.find((t) => t.id === nextActiveId);
            setCurrentUrl(active?.url ?? "");
            return prev;
          });
        } else {
          setCurrentUrl("");
        }
      } catch (err) {
        console.error("Failed to close tab:", err);
      }
    },
    [activeTabId]
  );

  const handleSwitchTab = useCallback(
    async (id: string) => {
      if (id === activeTabId) return;
      try {
        await switchTab(id);
        setActiveTabId(id);
        const tab = tabs.find((t) => t.id === id);
        setCurrentUrl(tab?.url ?? "");
      } catch (err) {
        console.error("Failed to switch tab:", err);
      }
    },
    [activeTabId, tabs]
  );

  const handleNavigate = useCallback(
    async (url: string) => {
      if (!activeTabId) return;
      setIsLoading(true);
      try {
        const updated = await navigateTab(activeTabId, url);
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? updated : t))
        );
        setCurrentUrl(updated.url);
      } catch (err) {
        console.error("Navigation failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTabId]
  );

  const handleSearch = useCallback(
    (query: string) => {
      handleNavigate(
        `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
      );
    },
    [handleNavigate]
  );

  const handleToggleSplit = useCallback(async () => {
    try {
      const newSplitMode = await toggleSplitView();
      setSplitMode(newSplitMode);
    } catch (err) {
      console.error("Split toggle failed:", err);
    }
  }, []);

  // ─── AI Actions ─────────────────────────────────────────────────────────

  const handleToggleDrawer = useCallback(async () => {
    const next = !drawerOpen;
    setDrawerOpenState(next);
    try {
      await setDrawerOpen(next);
    } catch {
      /* Rust side will catch up on next bounds sync */
    }
  }, [drawerOpen]);

  const handleAIPrompt = useCallback(
    async (prompt: string) => {
      if (!drawerOpen) {
        setDrawerOpenState(true);
        try {
          await setDrawerOpen(true);
        } catch {}
      }

      ai.startStreaming();

      // Get cached context for the active tab
      let pageContext = "";
      if (activeTabId) {
        try {
          const cache = await checkCache(activeTabId);
          pageContext = cache.content ?? "";
        } catch {
          // No cached content — AI will work without page context
        }
      }

      try {
        await runAgentQuery(prompt, pageContext);
      } catch (err) {
        console.error("AI query failed:", err);
      }
    },
    [activeTabId, drawerOpen, ai]
  );

  const handleToggleAI = useCallback(() => {
    setAiMode((prev) => !prev);
    omnibarRef.current?.focus();
  }, []);

  const handleToggleReader = useCallback(async () => {
    setReaderOpen((prev) => !prev);
    if (!readerOpen && activeTabId) {
      try {
        const cache = await checkCache(activeTabId);
        if (cache.content) {
          setReaderContent(cache.content);
        }
      } catch {
        // Fallback or no cached content
      }
    }
  }, [readerOpen, activeTabId]);

  // ─── Keyboard Shortcuts ─────────────────────────────────────────────────

  useShortcuts({
    onNewTab: handleNewTab,
    onCloseTab: () => handleCloseTab(),
    onToggleAI: handleToggleAI,
    onToggleDrawer: handleToggleDrawer,
    onToggleReader: handleToggleReader,
    onFocusOmnibar: () => omnibarRef.current?.focus(),
  });

  // ─── Derived State ──────────────────────────────────────────────────────

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const showHub = !activeTab?.has_webview;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen flex flex-col bg-april-bg overflow-hidden select-none">
      {/* Onboarding blocks everything until completed */}
      <OnboardingModal
        open={!onboardingDone}
        onComplete={() => setOnboardingDone(true)}
      />

      {/* Browser chrome */}
      <TabStrip
        tabs={tabs}
        activeTabId={activeTabId}
        splitMode={splitMode}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
        onSwitchTab={handleSwitchTab}
        onToggleSplit={handleToggleSplit}
      />

      <OmniBar
        currentUrl={currentUrl}
        isLoading={isLoading}
        aiMode={aiMode}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        onAIPrompt={handleAIPrompt}
        onToggleAI={handleToggleAI}
        inputRef={omnibarRef}
      />

      {/* Content area + AI drawer (side by side, never overlapping) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main content area */}
        <div className="flex-1 relative overflow-hidden">
          {/* AprilHub shown when no native WebView is active */}
          {showHub && (
            <AprilHub
              onNavigate={handleNavigate}
              tabCount={tabs.length}
              blockedCount={blockedCount}
            />
          )}

          {/* When a WebView IS active, this div is just a transparent background
              — the native WebView renders on top at the OS layer */}
          {!showHub && (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-april-muted/20 text-xs">
                {/* Intentionally blank — native WebView renders above this */}
              </div>
            </div>
          )}
        </div>

        {/* AI Agent Drawer (400px, right side) */}
        <AIAgentDrawer
          open={drawerOpen}
          onClose={handleToggleDrawer}
          onSubmit={handleAIPrompt}
          fullText={ai.fullText}
          steps={ai.steps}
          isStreaming={ai.isStreaming}
          provider={ai.provider}
          error={ai.error}
        />
      </div>

      {/* Reader View overlay */}
      <ReaderView
        content={readerContent}
        open={readerOpen}
        onClose={() => setReaderOpen(false)}
      />
    </div>
  );
}
