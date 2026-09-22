import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDownloadDir(): string {
  const dir = process.env.DOWNLOAD_DIR || './downloads';
  const resolved = path.isAbsolute(dir) ? dir : path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }
  return resolved;
}

function resolveDataDir(): string {
  const dir = path.resolve(__dirname, '..', 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export const config = {
  port: parseInt(process.env.PORT || '5174', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  downloadDir: resolveDownloadDir(),
  dataDir: resolveDataDir(),
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '3', 10),
  maxRequestSize: '1mb',
  rateLimitWindowMs: 60_000,
  rateLimitMax: 100,
} as const;
