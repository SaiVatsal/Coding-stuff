/**
 * API v1 Routes
 */

const express = require('express');
const router = express.Router();

const searchController = require('../controllers/search.controller');
const stocksController = require('../controllers/stocks.controller');
const newsController = require('../controllers/news.controller');
const radioBroadcaster = require('../services/radio/radio.broadcaster');
const { sanitizeText } = require('../utils/sanitizer');

// 1. In-Game Search Endpoint (Eyefind Engine)
// GET /api/v1/search?q={query}&mode={satire|direct}&category={web|news|stocks}
router.get('/search', searchController.handleSearch);

// 2. BAWSAQ Stock Market Endpoint
// GET /api/v1/stocks/bawsaq
router.get('/stocks/bawsaq', stocksController.handleGetBawsaqMarket);
router.get('/stocks/bawsaq/:ticker', stocksController.handleGetBawsaqTicker);

// 3. Trending Vice City News Endpoint
// GET /api/v1/news/trending
router.get('/news/trending', newsController.handleGetTrendingNews);

// 4. Radio Broadcast Trigger Endpoint (Admin / Game Event Trigger)
// POST /api/v1/radio/broadcast
router.post('/radio/broadcast', (req, res) => {
  const { headline, script, station_id, audio_url } = req.body || {};

  if (!headline || !script) {
    return res.status(400).json({
      error: 'Invalid Payload',
      message: 'Both "headline" and "script" fields are required to trigger an in-game radio bulletin.',
      status: 400,
    });
  }

  const packet = radioBroadcaster.broadcastBulletin(
    sanitizeText(headline, 180),
    sanitizeText(script, 512),
    station_id || 'all',
    audio_url || null
  );

  return res.status(200).json({
    success: true,
    message: 'Bulletin broadcasted to in-game radio stream',
    packet,
  });
});

module.exports = router;
