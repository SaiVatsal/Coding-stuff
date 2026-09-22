// components/ReaderView.tsx — Distraction-free reading mode
//
// Renders the pruned Markdown content in a clean, typographically optimized view.
// Controls for font size, serif/sans-serif, and light/dark/sepia themes.
// Activated via Ctrl+Shift+R or the reader icon in the OmniBar.

import { useState } from "react";
import { X, Type, Sun, Moon, BookOpen, Minus, Plus } from "lucide-react";

interface ReaderViewProps {
  content: string;
  open: boolean;
  onClose: () => void;
}

type Theme = "dark" | "light" | "sepia";

const THEME_STYLES: Record<Theme, { bg: string; text: string; muted: string }> = {
  dark: { bg: "#0a0a0f", text: "#e4e4e7", muted: "#71717a" },
  light: { bg: "#fafaf9", text: "#1c1917", muted: "#78716c" },
  sepia: { bg: "#f5f0e8", text: "#3d3429", muted: "#8a7e6e" },
};

export default function ReaderView({ content, open, onClose }: ReaderViewProps) {
  const [fontSize, setFontSize] = useState(18);
  const [serif, setSerif] = useState(true);
  const [theme, setTheme] = useState<Theme>("dark");

  if (!open) return null;

  const themeStyle = THEME_STYLES[theme];
  const fontFamily = serif
    ? "Georgia, 'Times New Roman', serif"
    : "'Inter', system-ui, sans-serif";

  const cycleTheme = () => {
    const order: Theme[] = ["dark", "light", "sepia"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col overflow-hidden animate-fade-in"
      style={{ backgroundColor: themeStyle.bg }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 h-12 border-b flex-shrink-0"
        style={{ borderColor: themeStyle.muted + "30" }}
      >
        <div className="flex items-center gap-1">
          <BookOpen size={16} style={{ color: themeStyle.muted }} />
          <span
            className="text-sm font-medium ml-2"
            style={{ color: themeStyle.text }}
          >
            Reader View
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Font size controls */}
          <button
            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
            className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ color: themeStyle.muted }}
            title="Decrease font size"
          >
            <Minus size={14} />
          </button>
          <span
            className="text-xs font-mono w-8 text-center"
            style={{ color: themeStyle.muted }}
          >
            {fontSize}
          </span>
          <button
            onClick={() => setFontSize((s) => Math.min(28, s + 2))}
            className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ color: themeStyle.muted }}
            title="Increase font size"
          >
            <Plus size={14} />
          </button>

          <div
            className="w-px h-5 mx-1"
            style={{ backgroundColor: themeStyle.muted + "30" }}
          />

          {/* Serif / Sans toggle */}
          <button
            onClick={() => setSerif(!serif)}
            className="h-7 px-2 rounded text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ color: themeStyle.muted }}
            title={serif ? "Switch to sans-serif" : "Switch to serif"}
          >
            <Type size={13} />
            <span>{serif ? "Serif" : "Sans"}</span>
          </button>

          {/* Theme cycle */}
          <button
            onClick={cycleTheme}
            className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ color: themeStyle.muted }}
            title={`Theme: ${theme}`}
          >
            {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          <div
            className="w-px h-5 mx-1"
            style={{ backgroundColor: themeStyle.muted + "30" }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ color: themeStyle.muted }}
            title="Exit reader view (Ctrl+Shift+R)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <article
          className="mx-auto px-6 py-10"
          style={{
            maxWidth: "680px",
            fontFamily,
            fontSize: `${fontSize}px`,
            lineHeight: 1.75,
            color: themeStyle.text,
          }}
        >
          {content ? (
            content.split("\n").map((line, i) => {
              // Basic Markdown rendering without a full parser
              if (line.startsWith("# "))
                return (
                  <h1
                    key={i}
                    className="text-3xl font-bold mt-8 mb-4"
                    style={{ lineHeight: 1.3 }}
                  >
                    {line.slice(2)}
                  </h1>
                );
              if (line.startsWith("## "))
                return (
                  <h2
                    key={i}
                    className="text-2xl font-semibold mt-6 mb-3"
                    style={{ lineHeight: 1.3 }}
                  >
                    {line.slice(3)}
                  </h2>
                );
              if (line.startsWith("### "))
                return (
                  <h3
                    key={i}
                    className="text-xl font-semibold mt-5 mb-2"
                    style={{ lineHeight: 1.3 }}
                  >
                    {line.slice(4)}
                  </h3>
                );
              if (line.startsWith("- "))
                return (
                  <li key={i} className="ml-6 mb-1">
                    {line.slice(2)}
                  </li>
                );
              if (line.startsWith("> "))
                return (
                  <blockquote
                    key={i}
                    className="border-l-2 pl-4 italic my-3 opacity-80"
                    style={{
                      borderColor: themeStyle.muted + "50",
                    }}
                  >
                    {line.slice(2)}
                  </blockquote>
                );
              if (line.startsWith("---"))
                return (
                  <hr
                    key={i}
                    className="my-8"
                    style={{ borderColor: themeStyle.muted + "20" }}
                  />
                );
              if (line.trim() === "") return <br key={i} />;
              return (
                <p key={i} className="mb-4">
                  {line}
                </p>
              );
            })
          ) : (
            <div
              className="text-center py-20 opacity-50"
              style={{ color: themeStyle.muted }}
            >
              <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
              <p>No content to display in reader mode.</p>
              <p className="text-sm mt-2">
                Navigate to a page first, then activate reader view.
              </p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
