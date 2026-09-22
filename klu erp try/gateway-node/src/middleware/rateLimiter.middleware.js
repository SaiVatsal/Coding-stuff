/**
 * Rate Limiting Middleware
 * Protects Eyefind Gateway against DDoS or infinite loops from game engine clients.
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequestsPerWindow,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Eyefind Gateway rate limit exceeded. Please wait before issuing new requests.',
    status: 429,
  },
});

module.exports = limiter;
