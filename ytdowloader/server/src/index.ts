import express from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { initDatabase } from './services/db.service.js';
import { initSocketServer } from './services/socket.service.js';
import { checkDependencies } from './services/ytdlp.service.js';
import { errorHandler } from './middleware/error-handler.js';
import infoRoutes from './routes/info.js';
import downloadRoutes from './routes/download.js';
import historyRoutes from './routes/history.js';
import settingsRoutes from './routes/settings.js';
import filesRoutes from './routes/files.js';

async function main(): Promise<void> {
  // ── Check dependencies ─────────────────────────────────────────────────
  console.log('[Startup] Checking dependencies...');
  const deps = await checkDependencies();

  if (!deps.ytdlp) {
    console.error('❌ yt-dlp is not installed or not found in PATH.');
    console.error('   Install it: pip install yt-dlp  or  brew install yt-dlp');
    process.exit(1);
  }
  console.log('  ✅ yt-dlp found');

  if (!deps.ffmpeg) {
    console.warn('⚠️  FFmpeg is not installed or not found in PATH.');
    console.warn('   Some features (audio extraction, format merging) will not work.');
    console.warn('   Install it: https://ffmpeg.org/download.html');
  } else {
    console.log('  ✅ FFmpeg found');
  }

  // ── Initialize database ────────────────────────────────────────────────
  console.log('[Startup] Initializing database...');
  initDatabase();
  console.log('  ✅ Database ready');

  // ── Create Express app ─────────────────────────────────────────────────
  const app = express();
  const httpServer = createServer(app);

  // ── Security middleware ────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }));
  app.use(rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please try again later.' },
  }));
  app.use(express.json({ limit: config.maxRequestSize }));

  // ── Initialize Socket.io ───────────────────────────────────────────────
  initSocketServer(httpServer);
  console.log('  ✅ Socket.io ready');

  // ── API Routes ─────────────────────────────────────────────────────────
  app.use('/api/info', infoRoutes);
  app.use('/api/download', downloadRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/files', filesRoutes);

  // ── Health check ───────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        ytdlp: deps.ytdlp,
        ffmpeg: deps.ffmpeg,
        downloadDir: config.downloadDir,
      },
    });
  });

  // ── Error handler (must be last) ───────────────────────────────────────
  app.use(errorHandler);

  // ── Start server ───────────────────────────────────────────────────────
  httpServer.listen(config.port, () => {
    console.log('');
    console.log(`🚀 Personal Media Downloader API running on http://localhost:${config.port}`);
    console.log(`   Downloads folder: ${config.downloadDir}`);
    console.log(`   Max concurrent: ${config.maxConcurrent}`);
    console.log('');
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────
  const shutdown = () => {
    console.log('\n[Shutdown] Closing server...');
    httpServer.close(() => {
      console.log('[Shutdown] Server closed.');
      process.exit(0);
    });
    // Force close after 10s
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
