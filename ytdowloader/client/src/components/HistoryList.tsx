import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Trash2,
  FolderOpen,
  Clock,
  ChevronDown,
  X,
} from 'lucide-react';
import type { HistoryItem } from '@shared/types';
import { useHistoryStore } from '../stores/history.store';
import { openDownloadFolder, getFileDownloadUrl } from '../services/api';
import toast from 'react-hot-toast';

function HistoryCard({ item }: { item: HistoryItem }) {
  const deleteItem = useHistoryStore((s) => s.deleteItem);

  const handleDelete = () => {
    deleteItem(item.id);
  };

  const handleOpenFolder = async () => {
    try {
      await openDownloadFolder();
    } catch {
      toast.error('Could not open folder.', {
        style: { background: '#1a1a2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' },
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="glass-card-static p-3 group"
    >
      <div className="flex gap-3 items-center">
        {/* Thumbnail */}
        {item.thumbnail && (
          <div className="shrink-0 w-16 h-11 rounded-lg overflow-hidden bg-[var(--color-bg-secondary)]">
            <img
              src={item.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {item.title}
          </p>
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(item.date)}
            </span>
            {item.qualityLabel && <span>{item.qualityLabel}</span>}
            {item.format && (
              <span className="uppercase font-medium text-[var(--color-text-secondary)]">
                {item.format}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleOpenFolder}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all"
            title="Open folder"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[rgba(239,68,68,0.08)] transition-all"
            title="Remove from history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function HistoryList() {
  const { items, total, loading, searchQuery, fetchHistory, clearAll, setSearch } =
    useHistoryStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  if (items.length === 0 && !searchQuery && !loading) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          History ({total})
        </h3>

        <div className="flex items-center gap-2">
          {/* Search toggle */}
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) setSearch('');
            }}
            className={`p-1.5 rounded-lg transition-all ${
              searchOpen
                ? 'bg-[var(--color-surface-active)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Clear all */}
          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Search input */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-3"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history..."
                className="input-glass pl-10 py-2.5 text-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-[var(--color-text-muted)] py-8">
          {searchQuery ? 'No results found.' : 'No download history yet.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <HistoryCard key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
