import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import { config } from '../config.js';
import { isPathWithinDownloadDir } from '../utils/sanitize.js';

const router = Router();

/**
 * GET /api/files/:filename
 * Serves a downloaded file for browser download.
 */
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(config.downloadDir, filename);
  const resolved = path.resolve(filePath);

  // Security: verify path is within download directory
  if (!isPathWithinDownloadDir(resolved)) {
    res.status(403).json({ success: false, error: 'Access denied.' });
    return;
  }

  if (!fs.existsSync(resolved)) {
    res.status(404).json({ success: false, error: 'File not found.' });
    return;
  }

  res.download(resolved, filename);
});

/**
 * POST /api/files/open-folder
 * Opens the download folder in the OS file explorer.
 */
router.post('/open-folder', (_req, res) => {
  const folder = path.resolve(config.downloadDir);

  let cmd: string;
  switch (process.platform) {
    case 'win32':
      cmd = `explorer "${folder}"`;
      break;
    case 'darwin':
      cmd = `open "${folder}"`;
      break;
    default:
      cmd = `xdg-open "${folder}"`;
  }

  exec(cmd, (err) => {
    if (err) {
      console.error('[Files] Failed to open folder:', err.message);
      res.status(500).json({ success: false, error: 'Could not open folder.' });
      return;
    }
    res.json({ success: true });
  });
});

export default router;
