import { Router } from 'express';
import { z } from 'zod';
import { getSettings, updateSettings } from '../services/settings.js';
import { queue } from '../services/queue.js';

export const settingsRouter = Router();

settingsRouter.get('/', (_req, res) => {
  res.json(getSettings());
});

const schema = z.object({
  defaultQuality: z.enum(['144', '240', '360', '480', '720', '1080', '1440', '2160', 'highest']).optional(),
  defaultContainer: z.enum(['original', 'mp4', 'mkv', 'webm']).optional(),
  defaultMode: z.enum(['video_audio', 'video_only', 'audio_only']).optional(),
  defaultAudioFormat: z.enum(['best', 'mp3']).optional(),
  downloadSubtitles: z.boolean().optional(),
  downloadFolder: z.string().max(500).optional(),
  maxConcurrent: z.number().int().min(1).max(10).optional(),
  theme: z.enum(['dark', 'light', 'system']).optional(),
  filenameTemplate: z.string().max(200).optional(),
});

settingsRouter.patch('/', (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid settings', code: 'INVALID_BODY' });
  }
  const next = updateSettings(parsed.data);
  if (parsed.data.maxConcurrent) queue.setMaxConcurrent(parsed.data.maxConcurrent);
  res.json(next);
});
