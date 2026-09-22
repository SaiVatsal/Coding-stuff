/**
 * Main Server Entry Point
 * GTA 6 / Vice City Live Internet Middleware API Gateway
 * Copyright (c) 2026 Vice City / Leonida Open World Studios
 */

const http = require('http');
const express = require('express');
const cors = require('cors');

const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const sanitizeMiddleware = require('./middleware/sanitizer.middleware');
const rateLimiter = require('./middleware/rateLimiter.middleware');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler.middleware');
const radioBroadcaster = require('./services/radio/radio.broadcaster');

// Create Express App
const app = express();

// Trust proxy for rate limiting behind load balancers
app.set('trust proxy', 1);

// Standard Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent', 'Accept'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Custom Sanitization & Rate Limiting Middlewares
app.use(sanitizeMiddleware);
app.use(rateLimiter);

// Mount Application Routes
app.use('/', routes);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Create HTTP and WebSocket Server
const server = http.createServer(app);

// Initialize WebSocket Radio Broadcaster
radioBroadcaster.initialize(server);

// Start Server Listening
if (require.main === module) {
  server.listen(config.port, config.host, () => {
    logger.info(`=======================================================`);
    logger.info(`Eyefind Middleware Gateway started on http://${config.host}:${config.port}`);
    logger.info(`Environment: [${config.env}] | LLM Satire Mode: [${config.satire.provider}]`);
    logger.info(`REST API: http://${config.host}:${config.port}/api/v1/search`);
    logger.info(`BAWSAQ:   http://${config.host}:${config.port}/api/v1/stocks/bawsaq`);
    logger.info(`News:     http://${config.host}:${config.port}/api/v1/news/trending`);
    logger.info(`Radio WS: ws://${config.host}:${config.port}/ws/radio-broadcast`);
    logger.info(`=======================================================`);
  });

  // Graceful Shutdown
  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down Eyefind Gateway gracefully...`);
    radioBroadcaster.shutdown();
    server.close(() => {
      logger.info('HTTP & WebSocket server closed.');
      process.exit(0);
    });

    // Force exit after 5 seconds if connections hang
    setTimeout(() => {
      logger.error('Forced shutdown timeout exceeded.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { app, server };
