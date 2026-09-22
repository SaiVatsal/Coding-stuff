import { Router } from 'express';
import { getInfo } from '../services/ytdlp.js';
import { validateUrl } from '../middleware/validation.js';

export const infoRouter = Router();

infoRouter.post('/', validateUrl, async (req, res) => {
  try {
    const info = await getInfo(req.body.url);
    res.json(info);
  } catch (e: any) {
    const msg = String(e?.message || 'Failed to fetch info');
    if (/Unsupported URL/i.test(msg)) {
      return res.status(400).json({ error: 'Unsupported URL', code: 'UNSUPPORTED_URL' });
    }
    if (/HTTP Error|Unable to extract|Private video|Video unavailable/i.test(msg)) {
      return res.status(400).json({ error: 'Could not retrieve media. Check URL and availability.', code: 'FETCH_ERROR' });
    }
    res.status(500).json({ error: msg, code: 'INTERNAL_ERROR' });
  }
});
