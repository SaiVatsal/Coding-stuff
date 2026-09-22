/**
 * Search Controller for Eyefind Internet Gateway
 * Handles GET /api/v1/search?q={query}&mode={satire|direct}&category={web|news|stocks}
 */

const searchService = require('../services/search/search.service');
const logger = require('../utils/logger');

async function handleSearch(req, res, next) {
  try {
    const query = req.query.q || '';
    const mode = (req.query.mode || 'satire').toLowerCase(); // 'satire' | 'direct' | 'raw'
    const category = (req.query.category || 'web').toLowerCase(); // 'web' | 'news' | 'stocks' | 'social' | 'commerce' | 'all'

    if (!query.trim()) {
      return res.status(200).json({
        query: '',
        mode,
        category,
        count: 0,
        results: [],
        provider: 'none',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`Processing Eyefind search: query="${query}", mode=${mode}, category=${category}`);

    const searchResponse = await searchService.executeSearch(query, mode, category);
    return res.status(200).json(searchResponse);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  handleSearch,
};
