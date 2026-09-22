/**
 * Main Router Index
 */

const express = require('express');
const router = express.Router();
const apiV1Router = require('./api.routes');

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'GTA6-Eyefind-Middleware-Gateway (Node.js)',
    version: '1.0.0',
    region: 'Leonida / Vice City',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// API Info / Overview
router.get('/', (req, res) => {
  res.status(200).json({
    title: 'Eyefind Live Internet Gateway API',
    description: 'Production-grade Middleware Gateway connecting Unreal Engine 5.5 to live web, BAWSAQ stocks, Weazel News, and radio streams.',
    endpoints: {
      search: 'GET /api/v1/search?q={query}&mode={satire|direct}&category={web|news|stocks|social|commerce}',
      bawsaq: 'GET /api/v1/stocks/bawsaq',
      trending_news: 'GET /api/v1/news/trending',
      radio_websocket: 'WS /ws/radio-broadcast',
      health: 'GET /health',
    },
    version: '1.0.0',
  });
});

// Mount v1 API routes
router.use('/api/v1', apiV1Router);

module.exports = router;
