import { Router } from 'express';
import { checkDependencies } from '../services/dependencies.js';

export const systemRouter = Router();

systemRouter.get('/health', (_req, res) => {
  res.json({ ok: true, time: Date.now() });
});

systemRouter.get('/dependencies', async (_req, res) => {
  const deps = await checkDependencies();
  res.json(deps);
});
