/**
 * Centralized Error Handling Middleware
 */

const logger = require('../utils/logger');
const { sanitizeText } = require('../utils/sanitizer');

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Endpoint Not Found',
    path: sanitizeText(req.originalUrl, 256),
    message: 'The requested Eyefind internet resource does not exist on this server.',
    status: 404,
  });
}

function globalErrorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Gateway Error';

  logger.error(`Unhandled error on [${req.method}] ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    error: err.name || 'GatewayError',
    message: sanitizeText(message, 512),
    status: statusCode,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
