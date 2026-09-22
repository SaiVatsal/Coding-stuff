// components/OnboardingModal.tsx — First-launch setup wizard
//
// Three-step modal that blocks all interaction until completed:
//   1. Welcome + Terms of Use acceptance (checkbox required)
//   2. Privacy Disclosure (what data stays local, what doesn't)
//   3. AI Provider Setup (API keys + Ollama detection)
//
// Completion state is persisted in localStorage so it only runs once.

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Key,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { storeApiKey, detectProviders } from "../lib/bridge";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function OnboardingModal({
  open,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // AI setup state
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [ollamaStatus, setOllamaStatus] = useState<"checking" | "found" | "not_found">("checking");
  const [saving, setSaving] = useState(false);

  // Check Ollama on mount
  useEffect(() => {
    if (!open) return;
    detectProviders()
      .then((providers) => {
        setOllamaStatus(
          providers.includes("ollama") ? "found" : "not_found"
        );
      })
      .catch(() => setOllamaStatus("not_found"));
  }, [open]);

  const handleFinish = useCallback(async () => {
    setSaving(true);
    try {
      // Store any provided API keys
      if (openaiKey.trim()) await storeApiKey("openai", openaiKey.trim());
      if (anthropicKey.trim()) await storeApiKey("anthropic", anthropicKey.trim());
      if (groqKey.trim()) await storeApiKey("groq", groqKey.trim());

      // Persist onboarding completion
      localStorage.setItem("april-onboarding-complete", "true");
      onComplete();
    } catch (err) {
      console.error("Failed to save onboarding state:", err);
    } finally {
      setSaving(false);
    }
  }, [openaiKey, anthropicKey, groqKey, onComplete]);

  if (!open) return null;

  const canProceedStep0 = termsAccepted;
  const canProceedStep1 = privacyAccepted;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[480px] bg-april-card border border-april-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-fade-in">
        {/* Progress indicator */}
        <div className="flex items-center gap-1 px-6 pt-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-april-primary" : "bg-april-border"
              }`}
            />
          ))}
        </div>

        {/* Content area */}
        <div className="px-6 py-5 min-h-[360px] flex flex-col">
          {/* ── Step 0: Terms ── */}
          {step === 0 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-april-primary to-purple-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">A</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-april-text">
                    Welcome to April Browser
                  </h2>
                  <p className="text-xs text-april-muted">
                    Fast, private, AI-powered
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-april-surface rounded-lg p-4 text-xs text-april-text/70 leading-relaxed space-y-3 mb-4">
                <p className="font-semibold text-april-text text-sm">
                  Terms of Use
                </p>
                <p>
                  April Browser is provided as-is for personal use. By using
                  this software, you acknowledge that:
                </p>
                <ul className="list-disc ml-4 space-y-1.5">
                  <li>
                    The browser includes an AI assistant that may connect to
                    third-party APIs (OpenAI, Anthropic, Groq) if you provide
                    API keys. You are responsible for your API usage and costs.
                  </li>
                  <li>
                    The built-in ad blocker filters known advertising and
                    tracking domains. Some websites may not function correctly
                    with blocking enabled.
                  </li>
                  <li>
                    April Browser does not collect telemetry, usage analytics,
                    or personal data. All browsing data remains on your device.
                  </li>
                  <li>
                    This software is provided without warranty. The developers
                    are not liable for data loss, security vulnerabilities, or
                    other damages.
                  </li>
                </ul>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-april-border bg-april-surface accent-april-primary"
                />
                <span className="text-sm text-april-text group-hover:text-white transition-colors">
                  I accept the Terms of Use
                </span>
              </label>
            </div>
          )}

          {/* ── Step 1: Privacy ── */}
          {step === 1 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={20} className="text-april-success" />
                <h2 className="text-lg font-semibold text-april-text">
                  Privacy & Local Storage
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                <InfoBlock
                  title="What stays on your device"
                  items={[
                    "Browsing history, bookmarks, and tab state",
                    "AI conversation context and cached page summaries",
                    "API keys (stored in OS keychain, never transmitted to us)",
                    "Ad blocker statistics and settings",
                  ]}
                  type="safe"
                />
                <InfoBlock
                  title="What leaves your device (only if you configure AI)"
                  items={[
                    "Page content summaries sent to your chosen AI provider",
                    "Your prompts and questions sent to the AI provider",
                    "API keys transmitted directly to the provider (OpenAI, Anthropic, etc.)",
                  ]}
                  type="warn"
                />
                <InfoBlock
                  title="What we NEVER do"
                  items={[
                    "Collect telemetry or usage analytics",
                    "Phone home or transmit data to April servers",
                    "Track your browsing across sessions",
                    "Share any data with third parties",
                  ]}
                  type="safe"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-april-border bg-april-surface accent-april-primary"
                />
                <span className="text-sm text-april-text group-hover:text-white transition-colors">
                  I understand how my data is handled
                </span>
              </label>
            </div>
          )}

          {/* ── Step 2: AI Setup ── */}
          {step === 2 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Key size={20} className="text-april-accent" />
                <div>
                  <h2 className="text-lg font-semibold text-april-text">
                    AI Configuration
                  </h2>
                  <p className="text-xs text-april-muted">
                    Optional — you can set this up later in Settings
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {/* Ollama status */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-april-surface border border-april-border">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      ollamaStatus === "found"
                        ? "bg-april-success"
                        : ollamaStatus === "checking"
                          ? "bg-april-warning animate-pulse"
                          : "bg-april-muted"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-april-text">
                      Ollama (Local AI)
                    </p>
                    <p className="text-[11px] text-april-muted">
                      {ollamaStatus === "found"
                        ? "Running at localhost:11434 — free, no API key needed"
                        : ollamaStatus === "checking"
                          ? "Checking..."
                          : "Not detected — install from ollama.com for free local AI"}
                    </p>
                  </div>
                  {ollamaStatus === "found" && (
                    <CheckCircle2 size={16} className="text-april-success" />
                  )}
                </div>

                {/* API key inputs */}
                <KeyInput
                  label="OpenAI API Key"
                  value={openaiKey}
                  onChange={setOpenaiKey}
                  placeholder="sk-..."
                />
                <KeyInput
                  label="Groq API Key"
                  value={groqKey}
                  onChange={setGroqKey}
                  placeholder="gsk_..."
                />
                <KeyInput
                  label="Anthropic API Key"
                  value={anthropicKey}
                  onChange={setAnthropicKey}
                  placeholder="sk-ant-..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-april-border bg-april-surface/30">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 text-sm text-april-muted hover:text-april-text transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 0 && !canProceedStep0) ||
                (step === 1 && !canProceedStep1)
              }
              className="flex items-center gap-1 h-9 px-4 rounded-lg text-sm font-medium
                         bg-april-primary text-white hover:bg-april-primary/90
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-medium
                         bg-april-primary text-white hover:bg-april-primary/90
                         disabled:opacity-50 transition-all"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {saving ? "Saving..." : "Start Browsing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function InfoBlock({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type: "safe" | "warn";
}) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        type === "safe"
          ? "bg-april-success/5 border-april-success/20"
          : "bg-april-warning/5 border-april-warning/20"
      }`}
    >
      <p
        className={`text-xs font-semibold mb-1.5 ${
          type === "safe" ? "text-april-success" : "text-april-warning"
        }`}
      >
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-april-text/70">
            <span className="mt-1 w-1 h-1 rounded-full bg-current flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeyInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-april-muted">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 px-3 rounded-lg bg-april-surface border border-april-border
                   text-sm text-april-text placeholder:text-april-muted/40
                   focus:border-april-primary/50 focus:outline-none transition-colors"
        autoComplete="off"
      />
    </div>
  );
}
