import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { getMediaInfo } from '../services/ytdlp.service.js';

const router = Router();

const infoSchema = z.object({
  url: z.string().url('Please provide a valid URL.'),
});

/**
 * POST /api/info
 * Fetches metadata for a URL using yt-dlp.
 */
router.post('/', validateBody(infoSchema), async (req, res, next) => {
  try {
    const { url } = req.body as z.infer<typeof infoSchema>;
    const info = await getMediaInfo(url);
    res.json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
});

export default router;
