import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = process.env.DOWNLOAD_DIR
  ? path.resolve(process.env.DOWNLOAD_DIR)
  : path.resolve(__dirname, '..', 'downloads-data');

export const config = {
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST || '0.0.0.0',
  root,
  historyFile: path.resolve(process.env.HISTORY_FILE || path.join(root, 'history.json')),
  settingsFile: path.resolve(process.env.SETTINGS_FILE || path.join(root, 'settings.json')),
  maxConcurrent: clamp(Number(process.env.MAX_CONCURRENT) || 3, 1, 10),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  maxRequestSize: process.env.MAX_REQUEST_SIZE || '2mb',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 60,
  },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
