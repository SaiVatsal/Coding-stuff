/**
 * Trending News Controller
 * Handles GET /api/v1/news/trending
 */

const newsService = require('../services/news/news.service');

async function handleGetTrendingNews(req, res, next) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const trending = await newsService.getTrendingNews(forceRefresh);
    return res.status(200).json(trending);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  handleGetTrendingNews,
};
