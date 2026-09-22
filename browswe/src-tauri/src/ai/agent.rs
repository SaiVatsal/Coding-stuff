// ai/agent.rs — Streaming ReAct agent with multi-provider fallback
//
// Architecture:
//   1. Detect the best available provider (Ollama → OpenAI → Anthropic)
//   2. Build a ReAct system prompt instructing structured reasoning
//   3. Stream the response token-by-token via Tauri events
//   4. Parse [PLAN], [ACT], [OBSERVE], [RESULT] tags in-flight
//   5. Emit typed step events so the frontend can render a live reasoning trace
//
// Token flow: query + pruned page context → LLM → streamed response → frontend
// Cost guard: page context is pre-capped at 1,500 tokens by token_pruner.rs

use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::Emitter;

// ─── Types ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Provider {
    Ollama,
    OpenAI,
    Groq,
    Anthropic,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub provider: Provider,
    pub api_key: Option<String>,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChunk {
    /// "token" | "step" | "done" | "error" | "provider"
    pub r#type: String,
    pub content: String,
    /// For "step" type: "plan" | "act" | "observe" | "result"
    pub step_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

// ─── System Prompt ──────────────────────────────────────────────────────────

const REACT_SYSTEM_PROMPT: &str = r#"You are April AI, an intelligent assistant embedded in the April Browser. You help users understand, analyze, and interact with web pages.

When responding, structure your thinking using these tags:
[PLAN] Briefly state your approach to the user's question
[ACT] Perform your analysis on the provided page content
[OBSERVE] Note key findings from your analysis
[RESULT] Provide your final, clear answer to the user

Keep responses concise and directly useful. The page content provided has already been pruned and token-budgeted, so work with what you have. If the page content is insufficient, say so rather than hallucinating.

Do not repeat the page content back verbatim — synthesize, summarize, or extract as requested."#;

// ─── Provider Detection ────────────────────────────────────────────────────

async fn detect_ollama() -> bool {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build()
        .unwrap_or_default();

    client
        .get("http://localhost:11434/api/tags")
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

async fn resolve_config() -> Result<AgentConfig, String> {
    // Priority 1: Local Ollama (free, no API key needed)
    if detect_ollama().await {
        return Ok(AgentConfig {
            provider: Provider::Ollama,
            api_key: None,
            model: "llama3.2".to_string(),
        });
    }

    // Priority 2: OpenAI
    if let Ok(Some(key)) = crate::storage::secure_keys::read_key("openai") {
        return Ok(AgentConfig {
            provider: Provider::OpenAI,
            api_key: Some(key),
            model: "gpt-4o-mini".to_string(),
        });
    }

    // Priority 3: Groq (fast, cheap)
    if let Ok(Some(key)) = crate::storage::secure_keys::read_key("groq") {
        return Ok(AgentConfig {
            provider: Provider::Groq,
            api_key: Some(key),
            model: "llama-3.1-8b-instant".to_string(),
        });
    }

    // Priority 4: Anthropic
    if let Ok(Some(key)) = crate::storage::secure_keys::read_key("anthropic") {
        return Ok(AgentConfig {
            provider: Provider::Anthropic,
            api_key: Some(key),
            model: "claude-sonnet-4-20250514".to_string(),
        });
    }

    Err("No AI provider available. Install Ollama locally or configure an API key in Settings.".to_string())
}

// ─── Streaming Implementations ──────────────────────────────────────────────

fn emit_chunk(app: &tauri::AppHandle, chunk: StreamChunk) {
    let _ = app.emit("ai-token-stream", &chunk);
}

/// Stream from Ollama's /api/chat endpoint (JSONL format)
async fn stream_ollama(
    app: &tauri::AppHandle,
    messages: &[ChatMessage],
    model: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post("http://localhost:11434/api/chat")
        .json(&serde_json::json!({
            "model": model,
            "messages": messages,
            "stream": true,
        }))
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Ollama returned {}: {}", status, body));
    }

    let mut full_response = String::new();
    let mut stream = resp.bytes_stream();
    let mut step_parser = StepParser::new();

    while let Some(chunk_result) = stream.next().await {
        let bytes = chunk_result.map_err(|e| format!("Stream read error: {}", e))?;
        let text = String::from_utf8_lossy(&bytes);

        for line in text.lines() {
            if line.trim().is_empty() {
                continue;
            }
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                if let Some(content) = json["message"]["content"].as_str() {
                    full_response.push_str(content);
                    // Check for step tags and emit appropriately
                    step_parser.feed(app, content);
                }
            }
        }
    }

    Ok(full_response)
}

/// Stream from OpenAI-compatible API (SSE format)
/// Works for both OpenAI and Groq (same API format).
async fn stream_openai_compatible(
    app: &tauri::AppHandle,
    messages: &[ChatMessage],
    config: &AgentConfig,
    base_url: &str,
) -> Result<String, String> {
    let api_key = config
        .api_key
        .as_ref()
        .ok_or("API key required for this provider")?;

    let client = reqwest::Client::new();
    let resp = client
        .post(&format!("{}/chat/completions", base_url))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": config.model,
            "messages": messages,
            "stream": true,
            "max_tokens": 2048,
        }))
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("API returned {}: {}", status, body));
    }

    let mut full_response = String::new();
    let mut stream = resp.bytes_stream();
    let mut step_parser = StepParser::new();

    while let Some(chunk_result) = stream.next().await {
        let bytes = chunk_result.map_err(|e| format!("Stream read error: {}", e))?;
        let text = String::from_utf8_lossy(&bytes);

        for line in text.lines() {
            let line = line.trim();
            if line.is_empty() || line == "data: [DONE]" {
                continue;
            }
            if let Some(data) = line.strip_prefix("data: ") {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                        full_response.push_str(content);
                        step_parser.feed(app, content);
                    }
                }
            }
        }
    }

    Ok(full_response)
}

/// Stream from Anthropic Messages API (SSE with event types)
async fn stream_anthropic(
    app: &tauri::AppHandle,
    messages: &[ChatMessage],
    config: &AgentConfig,
) -> Result<String, String> {
    let api_key = config
        .api_key
        .as_ref()
        .ok_or("Anthropic API key required")?;

    // Anthropic puts the system message separately
    let system_msg = messages
        .iter()
        .find(|m| m.role == "system")
        .map(|m| m.content.clone())
        .unwrap_or_default();

    let user_messages: Vec<_> = messages
        .iter()
        .filter(|m| m.role != "system")
        .map(|m| {
            serde_json::json!({
                "role": m.role,
                "content": m.content,
            })
        })
        .collect();

    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": config.model,
            "max_tokens": 2048,
            "system": system_msg,
            "messages": user_messages,
            "stream": true,
        }))
        .send()
        .await
        .map_err(|e| format!("Anthropic request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Anthropic returned {}: {}", status, body));
    }

    let mut full_response = String::new();
    let mut stream = resp.bytes_stream();
    let mut step_parser = StepParser::new();

    while let Some(chunk_result) = stream.next().await {
        let bytes = chunk_result.map_err(|e| format!("Stream read error: {}", e))?;
        let text = String::from_utf8_lossy(&bytes);

        for line in text.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with("event:") {
                continue;
            }
            if let Some(data) = line.strip_prefix("data: ") {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    // Anthropic uses "content_block_delta" events
                    if json["type"].as_str() == Some("content_block_delta") {
                        if let Some(text_delta) = json["delta"]["text"].as_str() {
                            full_response.push_str(text_delta);
                            step_parser.feed(app, text_delta);
                        }
                    }
                }
            }
        }
    }

    Ok(full_response)
}

// ─── Step Tag Parser ────────────────────────────────────────────────────────
// Parses [PLAN], [ACT], [OBSERVE], [RESULT] tags from the streaming output
// and emits structured step events to the frontend.

struct StepParser {
    buffer: String,
    current_step: Option<String>,
}

impl StepParser {
    fn new() -> Self {
        Self {
            buffer: String::new(),
            current_step: None,
        }
    }

    fn feed(&mut self, app: &tauri::AppHandle, text: &str) {
        self.buffer.push_str(text);

        // Check for step tags in the accumulated buffer
        let step_tags = &["[PLAN]", "[ACT]", "[OBSERVE]", "[RESULT]"];
        for tag in step_tags {
            if self.buffer.contains(tag) {
                let step_type = tag
                    .trim_start_matches('[')
                    .trim_end_matches(']')
                    .to_lowercase();

                // If we were in a previous step, emit it as complete
                if self.current_step.is_some() {
                    emit_chunk(
                        app,
                        StreamChunk {
                            r#type: "step".to_string(),
                            content: String::new(),
                            step_type: self.current_step.take(),
                        },
                    );
                }
                self.current_step = Some(step_type);
                self.buffer.clear();
            }
        }

        // Emit raw token for live rendering
        emit_chunk(
            app,
            StreamChunk {
                r#type: "token".to_string(),
                content: text.to_string(),
                step_type: self.current_step.clone(),
            },
        );
    }
}

// ─── Tauri Commands ─────────────────────────────────────────────────────────

/// Run the agentic AI query with automatic provider detection and streaming.
#[tauri::command]
pub async fn run_agent_query(
    app: tauri::AppHandle,
    query: String,
    page_context: String,
) -> Result<String, String> {
    let config = resolve_config().await?;

    // Tell the frontend which provider we're using
    emit_chunk(
        &app,
        StreamChunk {
            r#type: "provider".to_string(),
            content: format!("{:?}", config.provider),
            step_type: None,
        },
    );

    // Build the message array
    let user_content = if page_context.is_empty() {
        query.clone()
    } else {
        format!(
            "## Page Context\n{}\n\n## User Question\n{}",
            page_context, query
        )
    };

    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: REACT_SYSTEM_PROMPT.to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: user_content,
        },
    ];

    // Route to the correct streaming implementation
    let result = match config.provider {
        Provider::Ollama => stream_ollama(&app, &messages, &config.model).await,
        Provider::OpenAI => {
            stream_openai_compatible(&app, &messages, &config, "https://api.openai.com/v1").await
        }
        Provider::Groq => {
            stream_openai_compatible(
                &app,
                &messages,
                &config,
                "https://api.groq.com/openai/v1",
            )
            .await
        }
        Provider::Anthropic => stream_anthropic(&app, &messages, &config).await,
    };

    match &result {
        Ok(response) => {
            emit_chunk(
                &app,
                StreamChunk {
                    r#type: "done".to_string(),
                    content: format!("{} tokens", response.len() / 4),
                    step_type: None,
                },
            );
        }
        Err(err) => {
            emit_chunk(
                &app,
                StreamChunk {
                    r#type: "error".to_string(),
                    content: err.clone(),
                    step_type: None,
                },
            );
        }
    }

    result
}

/// Returns the list of currently available providers (for the settings UI).
#[tauri::command]
pub async fn detect_providers() -> Result<Vec<String>, String> {
    let mut available = Vec::new();

    if detect_ollama().await {
        available.push("ollama".to_string());
    }
    if let Ok(Some(_)) = crate::storage::secure_keys::read_key("openai") {
        available.push("openai".to_string());
    }
    if let Ok(Some(_)) = crate::storage::secure_keys::read_key("groq") {
        available.push("groq".to_string());
    }
    if let Ok(Some(_)) = crate::storage::secure_keys::read_key("anthropic") {
        available.push("anthropic".to_string());
    }

    Ok(available)
}
