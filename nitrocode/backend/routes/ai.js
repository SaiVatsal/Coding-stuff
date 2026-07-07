import express from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSettings } from './settings.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Helper to get active API keys from settings
async function getApiKeys() {
  const settings = await getSettings();
  return {
    openaiKey: settings.openaiKey,
    anthropicKey: settings.anthropicKey,
    googleKey: settings.googleKey
  };
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const { model, messages, stream } = req.body;
  const keys = await getApiKeys();

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
    }

    const isClaude = model.startsWith('claude-');
    const isOpenAI = model.startsWith('gpt-') || model.toLowerCase().includes('codex');
    const isGemini = model.startsWith('gemini-');

    if (isClaude) {
      if (!keys.anthropicKey) throw new Error('Anthropic API key is not configured.');
      const anthropic = new Anthropic({ apiKey: keys.anthropicKey });
      
      const systemMsg = messages.find(m => m.role === 'system')?.content || '';
      const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      if (stream) {
        const anthropicStream = await anthropic.messages.create({
          model: model,
          max_tokens: 4096,
          system: systemMsg,
          messages: userMessages,
          stream: true
        });

        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta') {
            res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        const response = await anthropic.messages.create({
          model: model,
          max_tokens: 4096,
          system: systemMsg,
          messages: userMessages
        });
        res.json({ text: response.content[0].text });
      }

    } else if (isOpenAI) {
      if (!keys.openaiKey) throw new Error('OpenAI API key is not configured.');
      const openai = new OpenAI({ apiKey: keys.openaiKey });

      if (stream) {
        const openaiStream = await openai.chat.completions.create({
          model: model,
          messages: messages,
          stream: true
        });

        for await (const chunk of openaiStream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        const response = await openai.chat.completions.create({
          model: model,
          messages: messages
        });
        res.json({ text: response.choices[0].message.content });
      }

    } else if (isGemini) {
      if (!keys.googleKey) throw new Error('Google Gemini API key is not configured.');
      const genAI = new GoogleGenerativeAI(keys.googleKey);
      // Map system instruction
      const systemInstruction = messages.find(m => m.role === 'system')?.content;
      const cleanMessages = messages.filter(m => m.role !== 'system');
      
      const geminiModel = genAI.getGenerativeModel({
        model: model,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
      });

      const history = cleanMessages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const lastMsg = cleanMessages[cleanMessages.length - 1];

      const chat = geminiModel.startChat({ history });

      if (stream) {
        const result = await chat.sendMessageStream(lastMsg.content);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        const result = await chat.sendMessage(lastMsg.content);
        res.json({ text: result.response.text() });
      }

    } else {
      // Local Ollama routing
      const ollamaUrl = 'http://localhost:11434/api/chat';
      const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: formattedMessages,
          stream: stream
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Ollama Error: ${err}`);
      }

      if (stream) {
        const reader = response.body;
        if (!reader) throw new Error('No readable stream from Ollama');

        // Pipe chunks to Express response
        for await (const chunk of reader) {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsed = JSON.parse(line);
                const text = parsed.message?.content || '';
                if (text) {
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
              } catch (e) {
                // Ignore json parsing issues on partial chunks
              }
            }
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        const data = await response.json();
        res.json({ text: data.message?.content || '' });
      }
    }
  } catch (error) {
    console.error('AI Error:', error);
    if (stream) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /api/ai/complete - Ghost text inline completion
router.post('/complete', async (req, res) => {
  const { model, prefix, suffix, filename } = req.body;
  const keys = await getApiKeys();

  const prompt = `You are a code completion engine. Continue the code below.
Filename: ${filename}

[BEFORE_CURSOR]
${prefix}
[AFTER_CURSOR]
${suffix}

Provide ONLY the exact code to be inserted at the cursor position. Do NOT wrap the answer in markdown codeblocks. Do NOT repeat the prefix or suffix. Just return the code completion.`;

  try {
    const isClaude = model.startsWith('claude-');
    const isOpenAI = model.startsWith('gpt-') || model.toLowerCase().includes('codex');
    const isGemini = model.startsWith('gemini-');

    let text = '';
    if (isClaude && keys.anthropicKey) {
      const anthropic = new Anthropic({ apiKey: keys.anthropicKey });
      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }]
      });
      text = response.content[0].text;
    } else if (isOpenAI && keys.openaiKey) {
      const openai = new OpenAI({ apiKey: keys.openaiKey });
      const response = await openai.chat.completions.create({
        model: model,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }]
      });
      text = response.choices[0].message.content;
    } else if (isGemini && keys.googleKey) {
      const genAI = new GoogleGenerativeAI(keys.googleKey);
      const geminiModel = genAI.getGenerativeModel({ model: model });
      const response = await geminiModel.generateContent(prompt);
      text = response.response.text();
    } else {
      // Local Ollama completion
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: { num_predict: 256 }
        })
      });
      if (response.ok) {
        const data = await response.json();
        text = data.response;
      }
    }

    res.json({ suggestion: text });
  } catch (error) {
    console.error('Autocomplete Error:', error.message);
    res.json({ suggestion: '' }); // Fail silently for autocompletes
  }
});

// POST /api/ai/whisper - Audio speech-to-text transcription
router.post('/whisper', upload.single('audio'), async (req, res) => {
  try {
    const keys = await getApiKeys();
    if (!keys.openaiKey) {
      return res.status(400).json({ error: 'OpenAI API Key is required for Whisper fallback.' });
    }

    const openai = new OpenAI({ apiKey: keys.openaiKey });
    
    // Create read stream for the uploaded file
    const fileStream = fs.createReadStream(req.file.path);

    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1'
    });

    // Cleanup local temp file
    await fs.remove(req.file.path);

    res.json({ text: transcription.text });
  } catch (error) {
    console.error('Whisper Error:', error);
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
