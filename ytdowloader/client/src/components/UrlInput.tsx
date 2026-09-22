import { useState, useRef } from 'react';
import { Search, Clipboard, Loader2, ArrowRight } from 'lucide-react';
import { useDragDrop } from '../hooks/useDragDrop';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export function UrlInput({ onSubmit, loading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (droppedUrl: string) => {
    setUrl(droppedUrl);
    onSubmit(droppedUrl);
  };

  const { isDragging, dragRef } = useDragDrop(handleDrop);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (trimmed) {
        setUrl(trimmed);
        onSubmit(trimmed);
      }
    } catch {
      // Clipboard permission denied — user can paste manually
    }
  };

  return (
    <div ref={dragRef} className={`w-full ${isDragging ? 'drag-active' : ''}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">
          Download Your Media
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">
          Paste a URL to download media you have rights to. Supports YouTube, Vimeo, and{' '}
          <span className="text-[var(--color-accent-blue)]">1000+ sites</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste media URL here..."
              className="input-glass pl-12 pr-4 py-4 text-base"
              disabled={loading}
              autoFocus
              id="url-input"
            />
          </div>

          <button
            type="button"
            onClick={handlePaste}
            className="btn-ghost flex items-center gap-2 py-4 px-4 shrink-0"
            disabled={loading}
            title="Paste from clipboard"
          >
            <Clipboard className="w-4 h-4" />
            <span className="hidden sm:inline">Paste</span>
          </button>

          <button
            type="submit"
            className="btn-gradient flex items-center gap-2 py-4 px-6 shrink-0"
            disabled={loading || !url.trim()}
          >
            <span className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">{loading ? 'Fetching...' : 'Fetch'}</span>
            </span>
          </button>
        </div>

        {isDragging && (
          <p className="text-center text-sm text-[var(--color-accent-purple)] mt-3 animate-pulse">
            Drop URL here...
          </p>
        )}
      </form>
    </div>
  );
}
