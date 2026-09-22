import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import {
  enqueueDownload,
  cancelDownload,
  retryDownload,
  getAllProgress,
  getProgress,
} from '../services/queue.service.js';

const router = Router();

const downloadSchema = z.object({
  url: z.string().url('Please provide a valid URL.'),
  formatId: z.string().optional(),
  qualityLabel: z.string().optional(),
  height: z.number().int().positive().optional(),
  mode: z.enum(['video_audio', 'video_only', 'audio_only']),
  outputFormat: z.enum(['mp4', 'mkv', 'webm', 'mp3', 'original']),
  downloadSubtitles: z.boolean().optional(),
  subtitleLanguages: z.array(z.string()).optional(),
});

/**
 * POST /api/download
 * Starts a download (adds to queue).
 */
router.post('/', validateBody(downloadSchema), async (req, res, next) => {
  try {
    const request = req.body as z.infer<typeof downloadSchema>;
    const progress = await enqueueDownload(request);
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/download
 * Returns all active/queued download progress.
 */
router.get('/', (_req, res) => {
  res.json({ success: true, data: getAllProgress() });
});

/**
 * GET /api/download/:id
 * Returns progress for a specific download.
 */
router.get('/:id', (req, res) => {
  const progress = getProgress(req.params.id);
  if (!progress) {
    res.status(404).json({ success: false, error: 'Download not found.' });
    return;
  }
  res.json({ success: true, data: progress });
});

/**
 * DELETE /api/download/:id
 * Cancels a download.
 */
router.delete('/:id', (req, res) => {
  const cancelled = cancelDownload(req.params.id);
  if (!cancelled) {
    res.status(404).json({ success: false, error: 'Download not found or already finished.' });
    return;
  }
  res.json({ success: true });
});

/**
 * POST /api/download/:id/retry
 * Retries a failed download.
 */
router.post('/:id/retry', async (req, res, next) => {
  try {
    const progress = await retryDownload(req.params.id);
    if (!progress) {
      res.status(404).json({ success: false, error: 'Download not found or not in error state.' });
      return;
    }
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
});

export default router;
