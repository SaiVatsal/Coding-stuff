// components/AIAgentDrawer.tsx — Streaming ReAct reasoning drawer
//
// Slides in from the right at 400px wide. Renders live reasoning steps as
// collapsible cards with status indicators. Token counter at the top,
// input bar at the bottom. The drawer does NOT overlay the WebView —
// instead, the Rust window_manager shrinks the WebView to make room.

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import {
  Sparkles,
  X,
  Send,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Zap,
  Eye,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { ReasoningStep } from "../hooks/useAIStream";
import { estimateTokens, formatTokenUsage } from "../lib/tokenLimiter";

interface AIAgentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  fullText: string;
  steps: ReasoningStep[];
  isStreaming: boolean;
  provider: string | null;
  error: string | null;
}

const STEP_ICONS: Record<string, typeof Lightbulb> = {
  plan: Lightbulb,
  act: Zap,
  observe: Eye,
  result: CheckCircle2,
};

const STEP_LABELS: Record<string, string> = {
  plan: "Planning",
  act: "Acting",
  observe: "Observing",
  result: "Result",
};

export default function AIAgentDrawer({
  open,
  onClose,
  onSubmit,
  fullText,
  steps,
  isStreaming,
  provider,
  error,
}: AIAgentDrawerProps) {
  const [input, setInput] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom as new content streams in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [fullText, steps]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  // Auto-expand the latest step
  useEffect(() => {
    if (steps.length > 0) {
      setExpandedSteps((prev) => new Set([...prev, steps.length - 1]));
    }
  }, [steps.length]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSubmit(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const tokenUsage = formatTokenUsage(estimateTokens(fullText));

  if (!open) return null;

  return (
    <div
      className="w-[400px] h-full flex flex-col bg-april-bg border-l border-april-border
                    animate-slide-in flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-april-border">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-april-primary" />
          <span className="text-sm font-semibold text-april-text">
            April AI
          </span>
          {provider && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-april-surface text-april-muted border border-april-border">
              {provider}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Token counter */}
          <span className="text-[10px] font-mono" style={{ color: tokenUsage.color }}>
            {tokenUsage.label}
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center
                       text-april-muted hover:text-april-text hover:bg-april-surface transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Reasoning steps */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {steps.length === 0 && !isStreaming && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-12 h-12 rounded-xl bg-april-primary/10 flex items-center justify-center">
              <Sparkles size={24} className="text-april-primary" />
            </div>
            <p className="text-sm text-april-muted max-w-[260px]">
              Ask me anything about the current page. I'll think step-by-step
              and show my reasoning.
            </p>
            <div className="text-[10px] text-april-muted/60 space-y-1">
              <p>
                Try: <span className="text-april-text/60">"Summarize this page"</span>
              </p>
              <p>
                Try: <span className="text-april-text/60">"Extract key data points"</span>
              </p>
              <p>
                Try: <span className="text-april-text/60">"Compare with the other tab"</span>
              </p>
            </div>
          </div>
        )}

        {steps.map((step, i) => {
          const Icon = STEP_ICONS[step.type] || Lightbulb;
          const label = STEP_LABELS[step.type] || step.type;
          const expanded = expandedSteps.has(i);
          const isLast = i === steps.length - 1;

          return (
            <div
              key={i}
              className={`
                rounded-lg border transition-all duration-200
                ${
                  isLast && step.status === "streaming"
                    ? "border-april-primary/30 bg-april-surface/80"
                    : "border-april-border bg-april-surface/50"
                }
              `}
            >
              {/* Step header */}
              <button
                onClick={() => toggleStep(i)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left"
              >
                {step.status === "streaming" ? (
                  <Loader2
                    size={13}
                    className="text-april-primary animate-spin flex-shrink-0"
                  />
                ) : (
                  <Icon size={13} className="text-april-success flex-shrink-0" />
                )}
                <span className="text-xs font-medium text-april-text flex-1">
                  {label}
                </span>
                {expanded ? (
                  <ChevronDown size={12} className="text-april-muted" />
                ) : (
                  <ChevronRight size={12} className="text-april-muted" />
                )}
              </button>

              {/* Step content */}
              {expanded && step.content && (
                <div className="px-3 pb-3">
                  <p className="text-xs text-april-text/80 leading-relaxed whitespace-pre-wrap">
                    {step.content}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Raw streaming text (shown when no structured steps are detected) */}
        {fullText && steps.length === 0 && (
          <div className="text-xs text-april-text/80 leading-relaxed whitespace-pre-wrap p-2">
            {fullText}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-april-danger/10 border border-april-danger/20">
            <AlertCircle
              size={14}
              className="text-april-danger flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-april-danger">{error}</p>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-april-border">
        <div className="flex items-center gap-2 bg-april-surface rounded-lg px-3 py-2 ring-1 ring-april-border focus-within:ring-april-primary/50 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "Waiting for response..." : "Ask a follow-up..."}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-april-text placeholder:text-april-muted/50
                       outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            className="w-7 h-7 rounded-md flex items-center justify-center
                       bg-april-primary/20 text-april-primary
                       hover:bg-april-primary/30 disabled:opacity-30
                       disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-april-muted/50 mt-1.5 text-center">
          Ctrl+K to prompt · Ctrl+B to toggle drawer
        </p>
      </div>
    </div>
  );
}
