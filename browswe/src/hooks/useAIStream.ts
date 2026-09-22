// hooks/useAIStream.ts — Real-time event listener for the AI token stream
//
// Listens to "ai-token-stream" events emitted by the Rust agent. Accumulates
// tokens into a full response while also tracking individual reasoning steps
// (Plan → Act → Observe → Result) for the drawer UI.

import { useEffect, useRef, useState, useCallback } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface StreamChunk {
  type: "token" | "step" | "done" | "error" | "provider";
  content: string;
  step_type?: "plan" | "act" | "observe" | "result";
}

export interface ReasoningStep {
  type: "plan" | "act" | "observe" | "result";
  content: string;
  status: "streaming" | "complete";
}

export function useAIStream() {
  const [fullText, setFullText] = useState("");
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      unlistenRef.current = await listen<StreamChunk>(
        "ai-token-stream",
        (event) => {
          if (!mounted) return;
          const chunk = event.payload;

          switch (chunk.type) {
            case "token":
              setFullText((prev) => prev + chunk.content);
              // Update the current step's content if we're tracking one
              if (chunk.step_type) {
                setSteps((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.type === chunk.step_type) {
                    last.content += chunk.content;
                  }
                  return copy;
                });
              }
              break;

            case "step":
              if (chunk.step_type) {
                setSteps((prev) => {
                  const copy = [...prev];
                  // Mark previous step as complete
                  if (copy.length > 0) {
                    copy[copy.length - 1].status = "complete";
                  }
                  // Start new step
                  copy.push({
                    type: chunk.step_type!,
                    content: "",
                    status: "streaming",
                  });
                  return copy;
                });
              }
              break;

            case "provider":
              setProvider(chunk.content);
              break;

            case "done":
              setIsStreaming(false);
              setSteps((prev) => {
                const copy = [...prev];
                if (copy.length > 0) {
                  copy[copy.length - 1].status = "complete";
                }
                return copy;
              });
              break;

            case "error":
              setIsStreaming(false);
              setError(chunk.content);
              break;
          }
        }
      );
    };

    setup();
    return () => {
      mounted = false;
      unlistenRef.current?.();
    };
  }, []);

  const reset = useCallback(() => {
    setFullText("");
    setSteps([]);
    setError(null);
    setProvider(null);
    setIsStreaming(false);
  }, []);

  const startStreaming = useCallback(() => {
    reset();
    setIsStreaming(true);
  }, [reset]);

  return {
    fullText,
    steps,
    isStreaming,
    provider,
    error,
    startStreaming,
    reset,
  };
}
