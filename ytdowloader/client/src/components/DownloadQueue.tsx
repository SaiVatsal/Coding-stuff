import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import type { DownloadProgress, DownloadStatus } from '@shared/types';
import { useDownloadStore } from '../stores/download.store';
import * as api from '../services/api';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: DownloadStatus }) {
  const labels: Record<DownloadStatus, string> = {
    queued: 'Queued',
    fetching_info: 'Fetching',
    downloading: 'Downloading',
    merging: 'Merging',
    converting: 'Converting',
    complete: 'Complete',
    error: 'Failed',
    cancelled: 'Cancelled',
    paused: 'Paused',
  };

  return (
    <span className={`status-badge status-${status}`}>
      {status === 'downloading' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {labels[status]}
    </span>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="progress-bar-container">
      <div
        className="progress-bar-fill"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function DownloadCard({ download }: { download: DownloadProgress }) {
  const removeDownload = useDownloadStore((s) => s.removeDownload);

  const handleCancel = async () => {
    try {
      await api.cancelDownload(download.id);
    } catch {
      toast.error('Failed to cancel download.', {
        style: { background: '#1a1a2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' },
      });
    }
  };

  const handleRetry = async () => {
    try {
      await api.retryDownload(download.id);
    } catch {
      toast.error('Failed to retry download.', {
        style: { background: '#1a1a2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' },
      });
    }
  };

  const handleDismiss = () => {
    removeDownload(download.id);
  };

  const isActive = ['queued', 'fetching_info', 'downloading', 'merging', 'converting'].includes(
    download.status,
  );
  const isError = download.status === 'error';
  const isComplete = download.status === 'complete';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      className="glass-card-static p-4"
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        {download.thumbnail && (
          <div className="shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-[var(--color-bg-secondary)]">
            <img
              src={download.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {download.title}
            </h4>
            <StatusBadge status={download.status} />
          </div>

          {/* Progress bar */}
          {isActive && (
            <div className="mb-2">
              <ProgressBar percent={download.percent} />
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
            {isActive && download.percent > 0 && (
              <span>{download.percent.toFixed(1)}%</span>
            )}
            {download.speed && <span>{download.speed}</span>}
            {download.eta && <span>ETA {download.eta}</span>}
            {download.filesize && <span>{download.filesize}</span>}
            {isError && download.error && (
              <span className="text-[var(--color-error)] truncate">{download.error}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2">
            {isActive && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors px-2 py-1 rounded-lg hover:bg-[rgba(239,68,68,0.08)]"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            )}
            {isError && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-blue)] transition-colors px-2 py-1 rounded-lg hover:bg-[rgba(59,130,246,0.08)]"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}
            {(isComplete || isError || download.status === 'cancelled') && (
              <button
                onClick={handleDismiss}
                className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--color-surface-hover)]"
              >
                <Trash2 className="w-3 h-3" />
                Dismiss
              </button>
            )}
            {isComplete && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-success)] ml-auto">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DownloadQueue() {
  const downloads = useDownloadStore((s) => s.getDownloadList());
  const clearCompleted = useDownloadStore((s) => s.clearCompleted);

  if (downloads.length === 0) return null;

  const hasCompleted = downloads.some(
    (d) => d.status === 'complete' || d.status === 'cancelled',
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Downloads ({downloads.length})
        </h3>
        {hasCompleted && (
          <button
            onClick={clearCompleted}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Clear completed
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {downloads.map((dl) => (
            <DownloadCard key={dl.id} download={dl} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
