// lib/tokenLimiter.ts — Client-side token estimation and budget enforcement
//
// Mirrors the Rust-side 1,500 token cap. Used by the frontend to show budget
// indicators before content is sent to the AI — gives the user visibility into
// how much of the page will actually reach the LLM.

export const TOKEN_BUDGET = 1500;
const CHARS_PER_TOKEN = 4;
export const MAX_CHARS = TOKEN_BUDGET * CHARS_PER_TOKEN;

/** Rough token estimate: ~4 chars/token (works well for English prose). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/** Truncate text to fit within the token budget, breaking at word boundaries. */
export function truncateToTokenBudget(
  text: string,
  maxTokens: number = TOKEN_BUDGET
): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;

  // Find the last space before the limit to avoid mid-word cuts
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  const cleanCut = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;

  return cleanCut + "\n\n[...truncated to " + maxTokens + " token budget...]";
}

export type BudgetLevel = "low" | "medium" | "high" | "over";

/** Format token usage for display with color-coded budget level. */
export function formatTokenUsage(
  used: number,
  max: number = TOKEN_BUDGET
): { label: string; color: string; level: BudgetLevel; percentage: number } {
  const percentage = Math.min((used / max) * 100, 100);
  let color: string;
  let level: BudgetLevel;

  if (percentage < 50) {
    color = "#22c55e"; // green
    level = "low";
  } else if (percentage < 80) {
    color = "#f59e0b"; // amber
    level = "medium";
  } else if (percentage <= 100) {
    color = "#ef4444"; // red
    level = "high";
  } else {
    color = "#ef4444";
    level = "over";
  }

  return {
    label: `${used.toLocaleString()} / ${max.toLocaleString()} tokens`,
    color,
    level,
    percentage,
  };
}
