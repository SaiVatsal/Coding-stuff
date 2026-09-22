// components/TabStrip.tsx — Horizontal tab manager with split-view toggle
//
// Each tab shows a truncated title with a close button. The active tab gets a
// violet accent underline. "New tab" and split-view toggle live at the ends.

import type { TabInfo } from "../lib/bridge";
import { Plus, Columns2, X } from "lucide-react";

interface TabStripProps {
  tabs: TabInfo[];
  activeTabId: string | null;
  splitMode: boolean;
  onNewTab: () => void;
  onCloseTab: (id: string) => void;
  onSwitchTab: (id: string) => void;
  onToggleSplit: () => void;
}

export default function TabStrip({
  tabs,
  activeTabId,
  splitMode,
  onNewTab,
  onCloseTab,
  onSwitchTab,
  onToggleSplit,
}: TabStripProps) {
  return (
    <div className="h-9 flex items-stretch bg-april-bg border-b border-april-border select-none">
      {/* Scrollable tab list */}
      <div className="flex-1 flex items-stretch overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const displayTitle =
            tab.url === "" || tab.url === "april://hub"
              ? "New Tab"
              : tab.title || new URL(tab.url).hostname || "Untitled";

          return (
            <div
              key={tab.id}
              onClick={() => onSwitchTab(tab.id)}
              className={`
                group relative flex items-center gap-1.5 px-3 min-w-[120px] max-w-[200px]
                cursor-pointer transition-all duration-150
                ${
                  isActive
                    ? "bg-april-surface text-april-text"
                    : "text-april-muted hover:text-april-text hover:bg-april-surface/50"
                }
              `}
            >
              {/* Active tab indicator — violet underline */}
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-april-primary rounded-full" />
              )}

              {/* Favicon placeholder — shows first letter of domain */}
              <div
                className={`
                w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[9px] font-bold
                ${isActive ? "bg-april-primary/20 text-april-primary" : "bg-april-card text-april-muted"}
              `}
              >
                {(tab.url ? new URL(ensureUrl(tab.url)).hostname[0] : "A")
                  ?.toUpperCase() ?? "A"}
              </div>

              {/* Title */}
              <span className="flex-1 text-xs truncate">{displayTitle}</span>

              {/* Close button — appears on hover or if active */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`
                  flex-shrink-0 w-4 h-4 rounded flex items-center justify-center
                  transition-all duration-100
                  ${
                    isActive
                      ? "text-april-muted hover:text-april-text hover:bg-april-card"
                      : "opacity-0 group-hover:opacity-100 text-april-muted hover:text-april-text hover:bg-april-card"
                  }
                `}
              >
                <X size={10} />
              </button>

              {/* Separator between tabs */}
              {!isActive && (
                <div className="absolute right-0 top-2 bottom-2 w-px bg-april-border/50" />
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 px-1 border-l border-april-border">
        {/* New tab */}
        <button
          onClick={onNewTab}
          className="w-7 h-7 rounded-md flex items-center justify-center
                     text-april-muted hover:text-april-text hover:bg-april-surface transition-colors"
          title="New tab (Ctrl+T)"
        >
          <Plus size={14} />
        </button>

        {/* Split view toggle */}
        <button
          onClick={onToggleSplit}
          disabled={tabs.length < 2}
          className={`
            w-7 h-7 rounded-md flex items-center justify-center transition-colors
            ${
              splitMode
                ? "bg-april-primary/20 text-april-primary"
                : "text-april-muted hover:text-april-text hover:bg-april-surface"
            }
            disabled:opacity-30 disabled:cursor-not-allowed
          `}
          title={
            splitMode
              ? "Exit split view"
              : tabs.length < 2
                ? "Need 2+ tabs to split"
                : "Split view"
          }
        >
          <Columns2 size={14} />
        </button>
      </div>
    </div>
  );
}

/** Safety net for URL parsing — handles empty and invalid URLs. */
function ensureUrl(raw: string): string {
  if (!raw || raw === "april://hub") return "https://april.local";
  try {
    new URL(raw);
    return raw;
  } catch {
    return `https://${raw}`;
  }
}

/* Hide scrollbar but keep scroll functionality */
const _scrollbarHide = `
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;
// Inject this once (done in index.css @layer utilities is cleaner,
// but this is a safety fallback)
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = _scrollbarHide;
  document.head.appendChild(style);
}
