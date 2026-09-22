/**
 * DuckDuckGo Search Provider
 * Queries DuckDuckGo Instant Answer API and HTML search endpoint.
 */

const logger = require('../../utils/logger');
const { sanitizeText, sanitizeUrl } = require('../../utils/sanitizer');

class DuckDuckGoProvider {
  constructor() {
    this.name = 'duckduckgo';
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    ];
  }

  /**
   * Search DuckDuckGo with fallback to HTML parsing
   * @param {string} query - Search query
   * @param {number} maxResults - Max items
   * @returns {Promise<Array>} Array of { title, snippet, source_url, thumbnail_url }
   */
  async search(query, maxResults = 8) {
    const results = [];

    try {
      // 1. First attempt: DuckDuckGo Instant Answer API
      const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=0`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': this.userAgents[0],
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const data = await response.json();

        // Primary Abstract
        if (data.Heading && (data.AbstractText || data.Abstract)) {
          results.push({
            title: sanitizeText(data.Heading),
            snippet: sanitizeText(data.AbstractText || data.Abstract),
            source_url: sanitizeUrl(data.AbstractURL || 'https://duckduckgo.com'),
            thumbnail_url: sanitizeUrl(data.Image ? `https://duckduckgo.com${data.Image}` : ''),
          });
        }

        // Related Topics
        if (Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics) {
            if (results.length >= maxResults) break;

            if (topic.Text && topic.FirstURL) {
              const parts = topic.Text.split(' - ');
              const title = parts.length > 1 ? parts[0] : topic.Text.substring(0, 60);
              const snippet = parts.length > 1 ? parts.slice(1).join(' - ') : topic.Text;

              results.push({
                title: sanitizeText(title),
                snippet: sanitizeText(snippet),
                source_url: sanitizeUrl(topic.FirstURL),
                thumbnail_url: sanitizeUrl(topic.Icon?.URL ? `https://duckduckgo.com${topic.Icon.URL}` : ''),
              });
            } else if (Array.isArray(topic.Topics)) {
              for (const subTopic of topic.Topics) {
                if (results.length >= maxResults) break;
                if (subTopic.Text && subTopic.FirstURL) {
                  results.push({
                    title: sanitizeText(subTopic.Text.substring(0, 60)),
                    snippet: sanitizeText(subTopic.Text),
                    source_url: sanitizeUrl(subTopic.FirstURL),
                    thumbnail_url: sanitizeUrl(subTopic.Icon?.URL ? `https://duckduckgo.com${subTopic.Icon.URL}` : ''),
                  });
                }
              }
            }
          }
        }
      }
    } catch (err) {
      logger.warn(`DuckDuckGo Instant API query error: ${err.message}`);
    }

    // 2. If results are insufficient, query HTML search lite
    if (results.length < 3) {
      try {
        const htmlResults = await this._searchHtml(query, maxResults - results.length);
        results.push(...htmlResults);
      } catch (err) {
        logger.warn(`DuckDuckGo HTML query fallback error: ${err.message}`);
      }
    }

    return results.slice(0, maxResults);
  }

  /**
   * HTML lite scraper for DuckDuckGo
   */
  async _searchHtml(query, limit = 5) {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'User-Agent': this.userAgents[Math.floor(Math.random() * this.userAgents.length)],
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html,application/xhtml+xml',
      },
      body: `q=${encodeURIComponent(query)}&b=`,
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) return [];

    const html = await response.text();
    const items = [];

    // Parse HTML search results with regex
    const resultBlockRegex = /<div[^>]*class="[^"]*result\s+results_links[^"]*"[^>]*>([\s\S]*?)<\/div\s*>/gi;
    let match;

    while ((match = resultBlockRegex.exec(html)) !== null && items.length < limit) {
      const block = match[1];

      // Extract Title & URL
      const linkMatch = /<a[^>]*class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block) ||
                        /<a[^>]*class="result__url[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);

      const titleMatch = /<a[^>]*class="result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      const snippetMatch = /<a[^>]*class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);

      if (titleMatch) {
        const rawUrl = titleMatch[1];
        let actualUrl = rawUrl;
        const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          actualUrl = decodeURIComponent(uddgMatch[1]);
        }

        const title = sanitizeText(titleMatch[2]);
        const snippet = snippetMatch ? sanitizeText(snippetMatch[1]) : title;

        if (title && actualUrl) {
          items.push({
            title,
            snippet,
            source_url: sanitizeUrl(actualUrl),
            thumbnail_url: '',
          });
        }
      }
    }

    return items;
  }
}

module.exports = new DuckDuckGoProvider();
