import { Settings, Download } from 'lucide-react';
import { useSettingsStore } from '../stores/settings.store';

export function Header() {
  const openSettings = useSettingsStore((s) => s.openSettings);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-purple)] to-[var(--color-accent-blue)]">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">
            Media Downloader
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">Personal · Rights-Respecting</p>
        </div>
      </div>

      <button
        onClick={openSettings}
        className="flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-all duration-200"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </header>
  );
}
