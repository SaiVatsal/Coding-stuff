/**
 * Brave Search API Provider
 * Integration with Brave Web Search REST API.
 */

const config = require('../../config');
const logger = require('../../utils/logger');
const { sanitizeText, sanitizeUrl } = require('../../utils/sanitizer');

class BraveSearchProvider {
  constructor() {
    this.name = 'brave';
    this.baseUrl = 'https://api.search.brave.com/res/v1/web/search';
  }

  /**
   * Search Brave Web Search API
   * @param {string} query - Search query
   * @param {number} maxResults - Max results count
   * @returns {Promise<Array>} Array of results
   */
  async search(query, maxResults = 8) {
    if (!config.search.braveApiKey) {
      logger.debug('Brave Search API key not configured, skipping');
      return [];
    }

    try {
      const url = `${this.baseUrl}?q=${encodeURIComponent(query)}&count=${maxResults}&text_decorations=false&safesearch=moderate`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': config.search.braveApiKey,
        },
        signal: AbortSignal.timeout(config.search.timeoutMs),
      });

      if (!response.ok) {
        logger.warn(`Brave Search API returned HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();
      const results = [];

      if (data.web && Array.isArray(data.web.results)) {
        for (const item of data.web.results) {
          results.push({
            title: sanitizeText(item.title),
            snippet: sanitizeText(item.description),
            source_url: sanitizeUrl(item.url),
            thumbnail_url: sanitizeUrl(item.thumbnail?.src || ''),
          });
        }
      }

      return results;
    } catch (err) {
      logger.warn(`Brave Search API error: ${err.message}`);
      return [];
    }
  }
}

module.exports = new BraveSearchProvider();
