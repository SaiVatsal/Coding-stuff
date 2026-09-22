import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { config } from './config.js';
import { infoRouter } from './routes/info.js';
import { downloadRouter } from './routes/download.js';
import { historyRouter } from './routes/history.js';
import { settingsRouter } from './routes/settings.js';
import { systemRouter } from './routes/system.js';
import { setupSocket } from './socket/index.js';

if (!fs.existsSync(config.root)) fs.mkdirSync(config.root, { recursive: true });

const app = express();
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: config.maxRequestSize }));
app.use(express.urlencoded({ extended: false, limit: config.maxRequestSize }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use('/api/info', infoRouter);
app.use('/api/download', downloadRouter);
app.use('/api/history', historyRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/system', systemRouter);

app.get('/', (_req, res) => res.json({ name: 'Personal Media Downloader API', version: '1.0.0' }));

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

const server = createServer(app);
setupSocket(server, config.allowedOrigins);

server.listen(config.port, config.host, () => {
  console.log(`[server] listening on http://${config.host}:${config.port}`);
  console.log(`[server] download dir: ${config.root}`);
});
