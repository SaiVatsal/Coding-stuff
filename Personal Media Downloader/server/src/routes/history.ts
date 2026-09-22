import { Router } from 'express';
import fs from 'node:fs';
import { readHistory, deleteHistory, clearHistory } from '../services/history.js';
import { safePath } from '../services/sanitizer.js';
import { config } from '../config.js';

export const historyRouter = Router();

historyRouter.get('/', (_req, res) => {
  res.json(readHistory());
});

historyRouter.get('/file/:id', (req, res) => {
  const item = readHistory().find(i => i.id === req.params.id);
  if (!item || !item.filepath || !fs.existsSync(item.filepath)) {
    return res.status(404).json({ error: 'File not found', code: 'NOT_FOUND' });
  }
  res.download(item.filepath, item.filename);
});

historyRouter.get('/stream/:id', (req, res) => {
  const item = readHistory().find(i => i.id === req.params.id);
  if (!item || !item.filepath || !fs.existsSync(item.filepath)) {
    return res.status(404).json({ error: 'File not found', code: 'NOT_FOUND' });
  }
  const stat = fs.statSync(item.filepath);
  const range = req.headers.range;
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${item.filename.replace(/"/g, '')}"`);
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', end - start + 1);
    fs.createReadStream(item.filepath, { start, end }).pipe(res);
  } else {
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(item.filepath).pipe(res);
  }
});

historyRouter.delete('/:id', (req, res) => {
  deleteHistory(req.params.id);
  res.json({ success: true });
});

historyRouter.post('/clear', (_req, res) => {
  clearHistory();
  res.json({ success: true });
});
