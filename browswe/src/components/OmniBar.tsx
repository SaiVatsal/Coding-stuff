// components/OmniBar.tsx — Unified URL / Search / AI prompt bar
//
// Three modes driven by input content:
//   1. URL mode:    input looks like a URL → navigate directly
//   2. Search mode: plain text → DuckDuckGo search
//   3. AI mode:     prefixed with @ai or toggled via Ctrl+K → send to agent
//
// Visual states: focused (expanded glow), loading (pulse animation), AI active (violet accent)

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import {
  Search,
  Globe,
  Sparkles,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";

interface OmniBarProps {
  currentUrl: string;
  isLoading: boolean;
  aiMode: boolean;
  onNavigate: (url: string) => void;
  onSearch: (query: string) => void;
  onAIPrompt: (prompt: string) => void;
  onToggleAI: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const URL_PATTERN =
  /^(https?:\/\/|localhost|[\w-]+\.(com|org|net|io|dev|app|co|me|ai|xyz|page|tech)(\/|$))/i;

function isLikelyUrl(input: string): boolean {
  const trimmed = input.trim();
  if (URL_PATTERN.test(trimmed)) return true;
  // Handle bare "example.com" without protocol
  if (/^[\w-]+\.[\w]{2,}(\/.*)?$/.test(trimmed)) return true;
  return false;
}

function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export default function OmniBar({
  currentUrl,
  isLoading,
  aiMode,
  onNavigate,
  onSearch,
  onAIPrompt,
  onToggleAI,
  inputRef: externalRef,
}: OmniBarProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = externalRef || internalRef;

  const displayValue = focused ? value : currentUrl;

  const handleFocus = useCallback(() => {
    setFocused(true);
    setValue(currentUrl);
    // Select all text on focus for easy overwrite
    setTimeout(() => ref.current?.select(), 0);
  }, [currentUrl, ref]);

  const handleBlur = useCallback(() => {
    setFocused(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const input = value.trim();
    if (!input) return;

    if (aiMode || input.startsWith("@ai ")) {
      const prompt = input.replace(/^@ai\s*/i, "");
      onAIPrompt(prompt);
    } else if (isLikelyUrl(input)) {
      onNavigate(ensureProtocol(input));
    } else {
      onSearch(input);
    }

    ref.current?.blur();
  }, [value, aiMode, onNavigate, onSearch, onAIPrompt, ref]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        setValue("");
        ref.current?.blur();
      }
    },
    [handleSubmit, ref]
  );

  const modeIcon = aiMode ? (
    <Sparkles size={15} className="text-april-primary" />
  ) : isLoading ? (
    <Loader2 size={15} className="text-april-muted animate-spin" />
  ) : (
    <Globe size={15} className="text-april-muted" />
  );

  return (
    <div className="h-9 px-2 flex items-center gap-2 bg-april-bg border-b border-april-border select-none">
      {/* Mode icon */}
      <div className="flex-shrink-0 w-6 flex justify-center">{modeIcon}</div>

      {/* Input field */}
      <div
        className={`
          flex-1 flex items-center gap-2 h-7 px-3 rounded-lg
          transition-all duration-200
          ${
            focused
              ? aiMode
                ? "bg-april-surface ring-1 ring-april-primary/50 shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                : "bg-april-surface ring-1 ring-april-border"
              : "bg-april-surface/50 hover:bg-april-surface"
          }
        `}
      >
        <Search size={13} className="text-april-muted flex-shrink-0" />
        <input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={(e) => setValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={
            aiMode
              ? "Ask April AI anything..."
              : "Search or enter URL — Ctrl+K for AI"
          }
          className="flex-1 bg-transparent text-sm text-april-text placeholder:text-april-muted/60 outline-none"
          spellCheck={false}
          autoComplete="off"
        />
        {focused && value && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setValue("");
            }}
            className="text-april-muted hover:text-april-text transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* AI toggle button */}
      <button
        onClick={onToggleAI}
        className={`
          flex-shrink-0 h-7 px-2.5 rounded-md text-xs font-medium
          flex items-center gap-1.5 transition-all duration-200
          ${
            aiMode
              ? "bg-april-primary/20 text-april-primary-light border border-april-primary/30 hover:bg-april-primary/30"
              : "text-april-muted hover:text-april-text hover:bg-april-surface"
          }
        `}
        title="Toggle AI mode (Ctrl+K)"
      >
        <Sparkles size={12} />
        <span className="hidden sm:inline">AI</span>
      </button>

      {/* Submit arrow (visible when focused) */}
      {focused && value.trim() && (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex-shrink-0 h-7 w-7 rounded-md bg-april-primary/20 text-april-primary
                     hover:bg-april-primary/30 flex items-center justify-center transition-colors"
        >
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
