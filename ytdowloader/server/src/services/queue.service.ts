import type { ChildProcess } from 'node:child_process';
import { v4 as uuid } from 'uuid';
import type {
  DownloadRequest,
  DownloadProgress,
  MediaInfo,
  HistoryItem,
} from '../../../shared/types.js';
import { getMediaInfo, startDownload } from './ytdlp.service.js';
import { addHistoryItem, getSettings } from './db.service.js';
import {
  emitProgress,
  emitComplete,
  emitError,
  emitQueued,
  emitCancelled,
} from './socket.service.js';
import { config } from '../config.js';

// ─── Internal state ──────────────────────────────────────────────────────────

interface QueueItem {
  id: string;
  request: DownloadRequest;
  info: MediaInfo | null;
}

interface ActiveDownload {
  id: string;
  process: ChildProcess;
  progress: DownloadProgress;
}

const queue: QueueItem[] = [];
const active = new Map<string, ActiveDownload>();
const allProgress = new Map<string, DownloadProgress>();

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Add a download request to the queue.
 */
export async function enqueueDownload(request: DownloadRequest): Promise<DownloadProgress> {
  const id = uuid();
  const now = new Date().toISOString();

  const progress: DownloadProgress = {
    id,
    url: request.url,
    title: 'Fetching info...',
    thumbnail: null,
    status: 'queued',
    percent: 0,
    speed: null,
    eta: null,
    filesize: null,
    filesizeBytes: null,
    error: null,
    qualityLabel: request.qualityLabel || null,
    outputFormat: request.outputFormat,
    filename: null,
    createdAt: now,
  };

  allProgress.set(id, progress);
  queue.push({ id, request, info: null });
  emitQueued(progress);

  // Try to start immediately if slots available
  processQueue();

  return progress;
}

/**
 * Cancel an active or queued download.
 */
export function cancelDownload(id: string): boolean {
  // Check if active
  const activeItem = active.get(id);
  if (activeItem) {
    activeItem.process.kill('SIGTERM');
    active.delete(id);
    updateProgress(id, { status: 'cancelled' });
    emitCancelled(id);
    processQueue();
    return true;
  }

  // Check if in queue
  const queueIdx = queue.findIndex((q) => q.id === id);
  if (queueIdx !== -1) {
    queue.splice(queueIdx, 1);
    updateProgress(id, { status: 'cancelled' });
    emitCancelled(id);
    return true;
  }

  return false;
}

/**
 * Retry a failed download.
 */
export async function retryDownload(id: string): Promise<DownloadProgress | null> {
  const existing = allProgress.get(id);
  if (!existing || existing.status !== 'error') return null;

  // Re-enqueue with a new ID is simpler and avoids stale state
  // But we keep the same ID for UX consistency
  updateProgress(id, {
    status: 'queued',
    percent: 0,
    speed: null,
    eta: null,
    error: null,
  });

  // Find the original request — we store it in the queue item
  // For retry, we need to reconstruct
  const retryItem: QueueItem = {
    id,
    request: {
      url: existing.url,
      mode: 'video_audio',
      outputFormat: existing.outputFormat,
      qualityLabel: existing.qualityLabel || undefined,
    },
    info: null,
  };

  queue.push(retryItem);
  emitQueued(allProgress.get(id)!);
  processQueue();

  return allProgress.get(id) || null;
}

/**
 * Get all tracked download progress.
 */
export function getAllProgress(): DownloadProgress[] {
  return Array.from(allProgress.values());
}

/**
 * Get a single download progress by ID.
 */
export function getProgress(id: string): DownloadProgress | null {
  return allProgress.get(id) || null;
}

// ─── Queue Processing ────────────────────────────────────────────────────────

function getMaxConcurrent(): number {
  try {
    const settings = getSettings();
    return settings.maxConcurrent || config.maxConcurrent;
  } catch {
    return config.maxConcurrent;
  }
}

async function processQueue(): Promise<void> {
  const maxConcurrent = getMaxConcurrent();

  while (active.size < maxConcurrent && queue.length > 0) {
    const item = queue.shift()!;
    await startQueueItem(item);
  }
}

async function startQueueItem(item: QueueItem): Promise<void> {
  const { id, request } = item;

  try {
    // Step 1: Fetch info if not already fetched
    updateProgress(id, { status: 'fetching_info' });
    emitProgress(allProgress.get(id)!);

    const info = await getMediaInfo(request.url);

    updateProgress(id, {
      title: info.title,
      thumbnail: info.thumbnail,
    });
    emitProgress(allProgress.get(id)!);

    // Step 2: Start the download
    updateProgress(id, { status: 'downloading' });

    const proc = startDownload(id, request, info, {
      onProgress: (partial) => {
        updateProgress(id, partial);
        emitProgress(allProgress.get(id)!);
      },
      onComplete: (filename, filesize) => {
        updateProgress(id, {
          status: 'complete',
          percent: 100,
          filename,
          filesizeBytes: filesize,
        });
        emitComplete(allProgress.get(id)!);
        active.delete(id);

        // Save to history
        const historyItem: HistoryItem = {
          id,
          url: request.url,
          title: info.title,
          thumbnail: info.thumbnail,
          date: new Date().toISOString(),
          qualityLabel: request.qualityLabel || 'Best',
          format: request.outputFormat,
          filename,
          filesize,
          duration: info.duration,
          uploader: info.uploader,
        };
        try {
          addHistoryItem(historyItem);
        } catch (err) {
          console.error('[Queue] Failed to save history:', err);
        }

        processQueue();
      },
      onError: (error) => {
        updateProgress(id, {
          status: 'error',
          error,
        });
        emitError(allProgress.get(id)!);
        active.delete(id);
        processQueue();
      },
    });

    active.set(id, {
      id,
      process: proc,
      progress: allProgress.get(id)!,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    updateProgress(id, {
      status: 'error',
      error: message,
    });
    emitError(allProgress.get(id)!);
    processQueue();
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function updateProgress(id: string, partial: Partial<DownloadProgress>): void {
  const existing = allProgress.get(id);
  if (existing) {
    Object.assign(existing, partial);
  }
}
