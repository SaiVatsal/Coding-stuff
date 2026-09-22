import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { getSettings, updateSettings } from '../services/db.service.js';

const router = Router();

const settingsSchema = z.object({
  defaultQuality: z.string().optional(),
  defaultFormat: z.enum(['mp4', 'mkv', 'webm', 'mp3', 'original']).optional(),
  defaultMode: z.enum(['video_audio', 'video_only', 'audio_only']).optional(),
  downloadFolder: z.string().optional(),
  theme: z.enum(['dark', 'light', 'system']).optional(),
  maxConcurrent: z.number().int().min(1).max(10).optional(),
}).strict();

/**
 * GET /api/settings
 * Returns current settings.
 */
router.get('/', (_req, res) => {
  const settings = getSettings();
  res.json({ success: true, data: settings });
});

/**
 * PUT /api/settings
 * Updates settings.
 */
router.put('/', validateBody(settingsSchema), (req, res) => {
  const updates = req.body as z.infer<typeof settingsSchema>;
  const settings = updateSettings(updates);
  res.json({ success: true, data: settings });
});

export default router;
