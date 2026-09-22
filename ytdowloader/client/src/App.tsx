import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { UrlInput } from './components/UrlInput';
import { MediaPreview } from './components/MediaPreview';
import { DownloadOptions } from './components/DownloadOptions';
import { DownloadQueue } from './components/DownloadQueue';
import { HistoryList } from './components/HistoryList';
import { SettingsModal } from './components/SettingsModal';
import { useSocket } from './hooks/useSocket';
import { useMediaInfo } from './hooks/useMediaInfo';
import { useSettingsStore } from './stores/settings.store';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function App() {
  // Connect Socket.io once
  useSocket();

  // Load settings on mount
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Media info state
  const { info, loading, error, fetchInfo, reset } = useMediaInfo();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center px-4 py-8 gap-6">
        {/* URL Input — Hero Section */}
        <section className="w-full flex flex-col items-center pt-8 pb-4">
          <UrlInput onSubmit={fetchInfo} loading={loading} />
        </section>

        {/* Loading skeleton */}
        {loading && (
          <div className="w-full max-w-2xl mx-auto">
            <div className="glass-card-static p-5 flex items-center gap-4">
              <div className="skeleton w-48 h-28 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        <AnimatePresence>
          {error && !loading && (
            <div className="w-full max-w-2xl mx-auto glass-card-static p-4 flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-[var(--color-error)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-error)]">Error</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Media Preview + Download Options */}
        <AnimatePresence>
          {info && !loading && (
            <>
              <MediaPreview info={info} />
              <DownloadOptions info={info} />
            </>
          )}
        </AnimatePresence>

        {/* Active Downloads */}
        <DownloadQueue />

        {/* Divider */}
        <div className="w-full max-w-2xl mx-auto border-t border-[var(--color-border)]" />

        {/* History */}
        <HistoryList />
      </main>

      {/* Settings Modal */}
      <SettingsModal />

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
        }}
      />
    </div>
  );
}
