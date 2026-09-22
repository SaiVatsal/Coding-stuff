import { Router } from 'express';
import { getHistory, deleteHistoryItem, clearHistory } from '../services/db.service.js';

const router = Router();

/**
 * GET /api/history
 * Returns paginated download history with optional search.
 */
router.get('/', (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string, 10) || 50, 100);
  const search = (req.query.search as string) || undefined;

  const result = getHistory(page, pageSize, search);
  res.json({
    success: true,
    data: {
      items: result.items,
      total: result.total,
      page,
      pageSize,
    },
  });
});

/**
 * DELETE /api/history/:id
 * Deletes a single history entry.
 */
router.delete('/:id', (req, res) => {
  const deleted = deleteHistoryItem(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'History item not found.' });
    return;
  }
  res.json({ success: true });
});

/**
 * DELETE /api/history
 * Clears all download history.
 */
router.delete('/', (_req, res) => {
  const count = clearHistory();
  res.json({ success: true, data: { deletedCount: count } });
});

export default router;
