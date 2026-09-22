import { Request, Response, NextFunction } from 'express';
import { isValidUrl } from '../services/sanitizer.js';

export function validateUrl(req: Request, res: Response, next: NextFunction) {
  const { url } = req.body || {};
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid or missing URL', code: 'INVALID_URL' });
  }
  next();
}

export function requireFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const f of fields) {
      if (req.body?.[f] === undefined) {
        return res.status(400).json({ error: `Missing field: ${f}`, code: 'MISSING_FIELD' });
      }
    }
    next();
  };
}
