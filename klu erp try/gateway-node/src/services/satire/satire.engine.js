/**
 * Satirical LLM Ingestion Layer
 * Transforms real-world search results and news into biting Vice City / Leonida satire.
 * Supports OpenAI, Anthropic, Ollama, with high-velocity heuristic rule-based engine fallback.
 */

const config = require('../../config');
const logger = require('../../utils/logger');
const { LORE_MAPPINGS, SATIRICAL_AUTHORS, SATIRICAL_TEMPLATES } = require('./lore.dictionary');
const { SYSTEM_PROMPT, buildSearchTransformationPrompt } = require('./prompt.templates');
const { sanitizeText } = require('../../utils/sanitizer');

class SatireEngine {
  constructor() {
    this.provider = config.satire.provider;
  }

  /**
   * Main entry point to satirize a single search item
   * @param {Object} item - { title, snippet, source_url, thumbnail_url }
   * @param {string} query - user query
   * @param {string} category - search category
   * @returns {Promise<Object>} Satirized item
   */
  async satirizeSearchItem(item, query = '', category = 'web') {
    // If provider is set to an LLM and API key exists, try LLM first
    if (this.provider === 'openai' && config.satire.openaiApiKey) {
      try {
        const result = await this._transformWithOpenAI(item.title, item.snippet, query, category);
        if (result) return this._mergeResult(item, result);
      } catch (err) {
        logger.warn(`OpenAI satire generation failed, falling back to heuristic: ${err.message}`);
      }
    } else if (this.provider === 'anthropic' && config.satire.anthropicApiKey) {
      try {
        const result = await this._transformWithAnthropic(item.title, item.snippet, query, category);
        if (result) return this._mergeResult(item, result);
      } catch (err) {
        logger.warn(`Anthropic satire generation failed, falling back to heuristic: ${err.message}`);
      }
    } else if (this.provider === 'ollama') {
      try {
        const result = await this._transformWithOllama(item.title, item.snippet, query, category);
        if (result) return this._mergeResult(item, result);
      } catch (err) {
        logger.warn(`Ollama satire generation failed, falling back to heuristic: ${err.message}`);
      }
    }

    // Default High-Velocity Heuristic Satire Engine
    return this._transformHeuristic(item, query, category);
  }

  /**
   * Batch satirize multiple items concurrently
   */
  async satirizeBatch(items, query = '', category = 'web') {
    return Promise.all(items.map((item) => this.satirizeSearchItem(item, query, category)));
  }

  /**
   * Heuristic Rule-Based Satire Engine (Zero latency, 100% offline reliable)
   */
  _transformHeuristic(item, query = '', category = 'web') {
    let title = item.title || '';
    let snippet = item.snippet || '';

    // 1. Apply Lore Replacements across all categories
    for (const group of Object.values(LORE_MAPPINGS)) {
      for (const mapping of group) {
        title = title.replace(mapping.pattern, mapping.replacement);
        snippet = snippet.replace(mapping.pattern, mapping.replacement);
      }
    }

    // 2. Inject Vice City Satire Framing
    const hash = this._simpleHash(title + query);
    const punchIndex = hash % SATIRICAL_TEMPLATES.satiricalPunches.length;
    const suffixIndex = (hash >> 2) % SATIRICAL_TEMPLATES.newsSuffixes.length;
    const authorIndex = (hash >> 4) % SATIRICAL_AUTHORS.length;

    // Satirize title with punch if not already heavily modified
    if (!title.toLowerCase().includes('vice city') && !title.toLowerCase().includes('weazel')) {
      const punchPrefixes = [
        'WEAZEL EXCLUSIVE: ',
        'BREAKING FROM VICE CITY: ',
        'BAWSAQ ALERT: ',
        'LEONIDA MAN REPORT: ',
        'LIFEINVADER LEAK: ',
      ];
      const prefix = punchPrefixes[hash % punchPrefixes.length];
      title = `${prefix}${title}`;
    }

    // Append satirical ending to snippet
    snippet = `${snippet}${SATIRICAL_TEMPLATES.newsSuffixes[suffixIndex]}`;

    // 3. Compute Market Impact (-1.0 to 1.0)
    const marketImpact = this._calculateMarketImpact(title + ' ' + snippet, hash);

    const author = SATIRICAL_AUTHORS[authorIndex];

    return {
      title: sanitizeText(title, config.safety.maxTitleLength),
      snippet: sanitizeText(snippet, config.safety.maxSnippetLength),
      source_url: item.source_url || '',
      thumbnail_url: item.thumbnail_url || '',
      satirical_author: author,
      market_impact: marketImpact,
    };
  }

  /**
   * Compute in-game market sentiment score based on key financial & comedic triggers
   */
  _calculateMarketImpact(text, seed) {
    const lower = text.toLowerCase();
    let score = 0.0;

    // Positive market triggers
    if (lower.includes('profit') || lower.includes('surge') || lower.includes('record') || lower.includes('monopoly') || lower.includes('deregulation') || lower.includes('tax evasion')) {
      score += 0.45;
    }
    if (lower.includes('subscribers') || lower.includes('unveils') || lower.includes('billion') || lower.includes('expansion')) {
      score += 0.3;
    }

    // Negative market triggers
    if (lower.includes('crash') || lower.includes('fraud') || lower.includes('investigation') || lower.includes('fib') || lower.includes('raid') || lower.includes('lawsuit')) {
      score -= 0.55;
    }
    if (lower.includes('explosion') || lower.includes('boycott') || lower.includes('banned') || lower.includes('scandal')) {
      score -= 0.35;
    }

    // Add deterministic micro-variance
    const variance = ((seed % 100) - 50) / 250.0;
    score = Math.max(-1.0, Math.min(1.0, score + variance));

    return parseFloat(score.toFixed(2));
  }

  /**
   * Simple string hash for deterministic randomized selection
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * OpenAI API Integration
   */
  async _transformWithOpenAI(title, snippet, query, category) {
    const prompt = buildSearchTransformationPrompt(title, snippet, query, category);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.satire.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: config.satire.openaiModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: config.satire.temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return JSON.parse(content);
  }

  /**
   * Anthropic API Integration
   */
  async _transformWithAnthropic(title, snippet, query, category) {
    const prompt = buildSearchTransformationPrompt(title, snippet, query, category);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.satire.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.satire.anthropicModel,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: config.satire.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse JSON from Anthropic response');
  }

  /**
   * Ollama Local LLM Integration
   */
  async _transformWithOllama(title, snippet, query, category) {
    const prompt = buildSearchTransformationPrompt(title, snippet, query, category);
    const response = await fetch(`${config.satire.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.satire.ollamaModel,
        system: SYSTEM_PROMPT,
        prompt: prompt,
        format: 'json',
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.response);
  }

  _mergeResult(original, transformed) {
    return {
      title: sanitizeText(transformed.title || original.title, config.safety.maxTitleLength),
      snippet: sanitizeText(transformed.snippet || original.snippet, config.safety.maxSnippetLength),
      source_url: original.source_url || '',
      thumbnail_url: original.thumbnail_url || '',
      satirical_author: sanitizeText(transformed.satirical_author || 'Weazel News Correspondent', 64),
      market_impact: typeof transformed.market_impact === 'number' ? Math.max(-1.0, Math.min(1.0, transformed.market_impact)) : 0.0,
    };
  }
}

const satireEngine = new SatireEngine();

function calculateMarketImpact(text, seed = 42) {
  return satireEngine._calculateMarketImpact(text, seed);
}

function transformWithHeuristics(item, query = '', category = 'web') {
  return satireEngine._transformHeuristic(item, query, category);
}

async function transformContent(item, query = '', category = 'web') {
  return satireEngine.satirizeSearchItem(item, query, category);
}

satireEngine.calculateMarketImpact = calculateMarketImpact;
satireEngine.transformWithHeuristics = transformWithHeuristics;
satireEngine.transformContent = transformContent;

module.exports = satireEngine;
module.exports.calculateMarketImpact = calculateMarketImpact;
module.exports.transformWithHeuristics = transformWithHeuristics;
module.exports.transformContent = transformContent;
