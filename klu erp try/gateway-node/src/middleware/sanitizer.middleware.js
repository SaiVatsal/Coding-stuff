/**
 * Sanitization Middleware
 * Cleans incoming query parameters and request bodies to prevent
 * injection attacks from propagating into downstream services.
 */

const { sanitizeText, sanitizePayload } = require('../utils/sanitizer');

function sanitizeRequestMiddleware(req, res, next) {
  // Sanitize query params
  if (req.query && typeof req.query === 'object') {
    const cleanQuery = {};
    for (const [key, value] of Object.entries(req.query)) {
      const cleanKey = sanitizeText(key, 64);
      if (typeof value === 'string') {
        cleanQuery[cleanKey] = sanitizeText(value, 1024);
      } else {
        cleanQuery[cleanKey] = value;
      }
    }
    req.query = cleanQuery;
  }

  // Sanitize body if present
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizePayload(req.body);
  }

  // Security response headers for Unreal Engine and API clients
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'none'");

  next();
}

module.exports = sanitizeRequestMiddleware;
