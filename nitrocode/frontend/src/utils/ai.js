export function estimateTokenCount(text) {
  if (!text) return 0;
  // Standard token representation heuristic: ~4 characters per token
  return Math.ceil(text.length / 4);
}

export function calculateCost(model, inputTokens, outputTokens) {
  let inputRate = 0; // per 1M tokens
  let outputRate = 0; // per 1M tokens

  if (model.includes('sonnet')) {
    inputRate = 3.00;
    outputRate = 15.00;
  } else if (model.includes('opus')) {
    inputRate = 15.00;
    outputRate = 75.00;
  } else if (model.includes('gpt-4o')) {
    inputRate = 5.00;
    outputRate = 15.00;
  } else if (model.includes('gpt-4-turbo')) {
    inputRate = 10.00;
    outputRate = 30.00;
  } else if (model.includes('gemini-1.5-pro')) {
    inputRate = 1.25;
    outputRate = 3.75;
  } else if (model.includes('gemini-2.5-flash')) {
    inputRate = 0.075;
    outputRate = 0.30;
  }

  const inputCost = (inputTokens / 1,000,000) * inputRate;
  const outputCost = (outputTokens / 1,000,000) * outputRate;
  return parseFloat((inputCost + outputCost).toFixed(6));
}

// SSE Chat Request Runner
export async function sendChatMessageStream(model, messages, onChunk) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to communicate with AI');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep partial line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            fullText += parsed.text;
            onChunk(parsed.text);
          }
        } catch (e) {
          // Ignore partial parse failures
        }
      }
    }
  }

  return fullText;
}
