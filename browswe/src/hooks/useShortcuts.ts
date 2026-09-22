// hooks/useShortcuts.ts — Global keyboard shortcut registration
//
// Binds browser-standard shortcuts (Ctrl+T, Ctrl+W, etc.) to handler callbacks.
// Prevents default browser behavior from leaking through the WebView.

import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onNewTab: () => void;
  onCloseTab: () => void;
  onToggleAI: () => void;
  onToggleDrawer: () => void;
  onToggleReader: () => void;
  onFocusOmnibar: () => void;
}

export function useShortcuts(handlers: ShortcutHandlers) {
  // Wrap handlers in refs via useCallback to avoid re-registering on every render
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case "t":
          e.preventDefault();
          handlers.onNewTab();
          break;
        case "w":
          e.preventDefault();
          handlers.onCloseTab();
          break;
        case "k":
          e.preventDefault();
          handlers.onToggleAI();
          break;
        case "b":
          e.preventDefault();
          handlers.onToggleDrawer();
          break;
        case "l":
          e.preventDefault();
          handlers.onFocusOmnibar();
          break;
      }

      // Ctrl+Shift combos
      if (e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "r":
            e.preventDefault();
            handlers.onToggleReader();
            break;
        }
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
