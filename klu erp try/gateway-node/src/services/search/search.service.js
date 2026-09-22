/**
 * Eyefind Core Search Service
 * Orchestrates multi-provider search fallback (Brave -> DuckDuckGo -> Mock),
 * runs Satire Ingestion Layer, and sanitizes payload for Unreal Engine C++ stability.
 */

const config = require('../../config');
const logger = require('../../utils/logger');
const duckduckgoProvider = require('./duckduckgo.provider');
const braveProvider = require('./brave.provider');
const mockProvider = require('./mock.provider');
const satireEngine = require('../satire/satire.engine');
const { sanitizeText, sanitizePayload } = require('../../utils/sanitizer');

class SearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTtlMs = config.search.cacheTtlSeconds * 1000;
  }

  /**
   * Execute full Eyefind search workflow
   * @param {string} query - Raw search query
   * @param {string} mode - 'satire' | 'direct' | 'raw'
   * @param {string} category - 'web' | 'news' | 'stocks' | 'social'
   * @param {number} limit - max results
   * @returns {Promise<Object>} Formatted search response
   */
  async executeSearch(query, mode = 'satire', category = 'web', limit = 8) {
    const cleanQuery = sanitizeText(query, 128);
    const cacheKey = `${cleanQuery.toLowerCase()}_${mode}_${category}_${limit}`;
    const now = Date.now();

    // 1. Check in-memory LRU cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < this.cacheTtlMs) {
        logger.debug(`Eyefind search cache hit for: "${cleanQuery}"`);
        return { ...cached.data, cached: true };
      }
      this.cache.delete(cacheKey);
    }

    let rawResults = [];
    let usedProvider = 'none';

    // 2. Fallback Chain: Brave -> DuckDuckGo -> Mock
    // Priority 1: Brave Search API
    if (config.search.braveApiKey) {
      try {
        rawResults = await braveProvider.search(cleanQuery, limit);
        if (rawResults && rawResults.length > 0) {
          usedProvider = 'brave';
        }
      } catch (err) {
        logger.warn(`Brave Search failed: ${err.message}. Falling back to DuckDuckGo...`);
      }
    }

    // Priority 2: DuckDuckGo API / Parser
    if (rawResults.length === 0) {
      try {
        rawResults = await duckduckgoProvider.search(cleanQuery, limit);
        if (rawResults && rawResults.length > 0) {
          usedProvider = 'duckduckgo';
        }
      } catch (err) {
        logger.warn(`DuckDuckGo Search failed: ${err.message}. Falling back to GTA Mock Generator...`);
      }
    }

    // Priority 3: Built-in GTA Lore Mock Generator (Guaranteed 100% success)
    if (rawResults.length === 0) {
      rawResults = await mockProvider.search(cleanQuery, limit);
      usedProvider = 'mock_gta';
    }

    // 3. Apply Satirical Transformation if mode is 'satire'
    let processedResults = [];
    if (mode === 'satire') {
      processedResults = await satireEngine.satirizeBatch(rawResults, cleanQuery, category);
    } else {
      // Direct mode: pass sanitized results with neutral metadata
      processedResults = rawResults.map((item) => ({
        title: sanitizeText(item.title, config.safety.maxTitleLength),
        snippet: sanitizeText(item.snippet, config.safety.maxSnippetLength),
        source_url: item.source_url || '',
        thumbnail_url: item.thumbnail_url || '',
        satirical_author: 'Eyefind Direct Web Feed',
        market_impact: 0.0,
      }));
    }

    // 4. Final Safety Sanitization pass
    const sanitizedResults = sanitizePayload(processedResults);

    const responsePayload = {
      query: cleanQuery,
      mode,
      category,
      count: sanitizedResults.length,
      results: sanitizedResults,
      provider: usedProvider,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    // 5. Store in Cache (with LRU eviction if too big)
    if (this.cache.size > 256) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, { timestamp: now, data: responsePayload });

    return responsePayload;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

const searchService = new SearchService();

module.exports = searchService;
module.exports.executeSearch = searchService.executeSearch.bind(searchService);
module.exports.clearSearchCache = searchService.clearCache.bind(searchService);
