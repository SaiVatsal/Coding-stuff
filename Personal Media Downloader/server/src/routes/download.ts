import { Router } from 'express';
import { z } from 'zod';
import { queue } from '../services/queue.js';
import { validateUrl } from '../middleware/validation.js';
import type { DownloadOptions, VideoQuality, Container, DownloadMode, AudioFormat } from '@pmd/shared';

export const downloadRouter = Router();

const schema = z.object({
  url: z.string().url(),
  mode: z.enum(['video_audio', 'video_only', 'audio_only']),
  quality: z.enum(['144', '240', '360', '480', '720', '1080', '1440', '2160', 'highest']),
  container: z.enum(['original', 'mp4', 'mkv', 'webm']),
  audioFormat: z.enum(['best', 'mp3']),
  downloadSubs: z.boolean().default(false),
  subLangs: z.string().optional(),
});

downloadRouter.post('/', validateUrl, (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', code: 'INVALID_BODY', details: parsed.error.message });
  }
  const opts: DownloadOptions = {
    url: parsed.data.url,
    mode: parsed.data.mode as DownloadMode,
    quality: parsed.data.quality as VideoQuality,
    container: parsed.data.container as Container,
    audioFormat: parsed.data.audioFormat as AudioFormat,
    downloadSubs: parsed.data.downloadSubs,
    subLangs: parsed.data.subLangs,
  };
  const progress = queue.add(opts);
  res.json(progress);
});

downloadRouter.get('/list', (_req, res) => {
  res.json(queue.list());
});

downloadRouter.get('/progress/:id', (req, res) => {
  const p = queue.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  res.json(p);
});

downloadRouter.post('/cancel/:id', (req, res) => {
  const ok = queue.cancel(req.params.id);
  res.json({ success: ok });
});

downloadRouter.post('/pause/:id', (req, res) => {
  const ok = queue.pause(req.params.id);
  res.json({ success: ok });
});

downloadRouter.post('/resume/:id', (req, res) => {
  const ok = queue.resume(req.params.id);
  res.json({ success: ok });
});

downloadRouter.post('/retry/:id', (req, res) => {
  const p = queue.retry(req.params.id);
  if (!p) return res.status(400).json({ error: 'Cannot retry this job', code: 'CANNOT_RETRY' });
  res.json(p);
});

downloadRouter.delete('/:id', (req, res) => {
  queue.remove(req.params.id);
  res.json({ success: true });
});
