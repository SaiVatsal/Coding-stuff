import { estimateTokenCount } from './ai.js';

export function routeModel(promptText, settings, availableModels) {
  // If auto-routing is disabled, use default configured model
  if (settings.autoRouting === false) {
    return settings.defaultModel || 'gemini-2.5-flash';
  }

  const tokenCount = estimateTokenCount(promptText);
  const hasOpenAI = !!settings.openaiKey;
  const hasAnthropic = !!settings.anthropicKey;
  const hasGoogle = !!settings.googleKey;

  // Check if any cloud credentials exist
  const cloudAvailable = hasOpenAI || hasAnthropic || hasGoogle;

  // Scan local Ollama models
  const ollamaModels = availableModels.filter(m => m.type === 'local' && m.status === 'ready');
  const largestOllamaModel = ollamaModels.length > 0 
    ? ollamaModels.sort((a, b) => b.size - a.size)[0]?.name 
    : null;

  // Rule 1: No Cloud API keys set -> Use largest available Ollama model, or default
  if (!cloudAvailable) {
    return largestOllamaModel || settings.defaultModel || 'gemini-2.5-flash';
  }

  // Rule 2: Short query (< 50 tokens) and local Ollama is active -> Use fastest local model
  const fastestOllama = ollamaModels.find(m => m.name.includes('llama') || m.name.includes('gemma') || m.name.includes('mistral'))?.name;
  if (tokenCount < 50 && fastestOllama) {
    return fastestOllama;
  }

  // Rule 3: Code generation / Multi-file -> Claude Sonnet or GPT-4o
  if (hasAnthropic) {
    return 'claude-3-5-sonnet-20241022';
  } else if (hasOpenAI) {
    return 'gpt-4o';
  } else if (hasGoogle) {
    return 'gemini-1.5-pro';
  }

  // Fallback
  return settings.defaultModel || 'gemini-2.5-flash';
}
