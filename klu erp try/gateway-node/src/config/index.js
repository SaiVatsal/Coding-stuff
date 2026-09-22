/**
 * Configuration module for GTA 6 Live Internet Middleware Gateway
 * Copyright (c) 2026 Vice City / Leonida Open World Studios
 */

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8080,
  host: process.env.HOST || '0.0.0.0',

  // Gateway Base URL for audio CDN and client references
  baseUrl: process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 8080}`,

  // Search API Configuration
  search: {
    braveApiKey: process.env.BRAVE_SEARCH_API_KEY || '',
    defaultProvider: process.env.DEFAULT_SEARCH_PROVIDER || 'duckduckgo', // 'brave' | 'duckduckgo' | 'mock'
    maxResults: parseInt(process.env.MAX_SEARCH_RESULTS, 10) || 10,
    timeoutMs: parseInt(process.env.SEARCH_TIMEOUT_MS, 10) || 5000,
    cacheTtlSeconds: parseInt(process.env.SEARCH_CACHE_TTL, 10) || 300,
  },

  // LLM / Satire Ingestion Configuration
  satire: {
    provider: process.env.LLM_PROVIDER || 'heuristic', // 'openai' | 'anthropic' | 'ollama' | 'heuristic'
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.85'),
  },

  // Stocks / BAWSAQ Market Configuration
  stocks: {
    cacheTtlSeconds: parseInt(process.env.STOCKS_CACHE_TTL, 10) || 60,
    volatilityMultiplier: parseFloat(process.env.STOCKS_VOLATILITY_MULTIPLIER || '1.0'),
    marketStatus: process.env.BAWSAQ_MARKET_STATUS || 'OPEN',
  },

  // News Configuration
  news: {
    cacheTtlSeconds: parseInt(process.env.NEWS_CACHE_TTL, 10) || 180,
    fetchLimit: parseInt(process.env.NEWS_FETCH_LIMIT, 10) || 12,
  },

  // Radio Broadcast WebSocket Configuration
  radio: {
    broadcastIntervalMs: parseInt(process.env.RADIO_BROADCAST_INTERVAL_MS, 10) || 20000, // broadcast every 20s
    audioCdnUrl: process.env.AUDIO_CDN_URL || 'http://127.0.0.1:8080/audio',
    enableMockAudio: process.env.ENABLE_MOCK_AUDIO !== 'false',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequestsPerWindow: parseInt(process.env.RATE_LIMIT_MAX, 10) || 120,
  },

  // Unreal Engine Safety Rules
  safety: {
    maxStringLength: 2048,
    maxSnippetLength: 512,
    maxTitleLength: 180,
    allowedProtocols: ['http:', 'https:'],
  },
};

module.exports = config;
