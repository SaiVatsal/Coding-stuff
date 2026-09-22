import { useState, useRef, DragEvent, KeyboardEvent } from 'react';

interface Props {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export function UrlInput({ onSubmit, loading }: Props) {
  const [url, setUrl] = useState('');
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const v = url.trim();
    if (v) onSubmit(v);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      ref.current?.focus();
    } catch {
      ref.current?.focus();
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const dt = e.dataTransfer;
    const text = dt.getData('text');
    if (text) setUrl(text);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={`relative card transition-all ${drag ? 'ring-2 ring-brand-500/50' : ''}`}
    >
      <textarea
        ref={ref}
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={onKey}
        placeholder="Paste a media URL here (YouTube, Vimeo, Twitter, etc.)"
        rows={2}
        className="w-full bg-transparent border-0 outline-none resize-none text-zinc-100 placeholder-zinc-500 px-1 py-2"
      />
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="text-xs text-zinc-500">⏎ Ctrl/⌘ + Enter to fetch</div>
        <div className="flex gap-2">
          <button onClick={paste} className="btn-ghost text-sm" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="8" y="3" width="8" height="4" rx="1" /><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
            </svg>
            Paste
          </button>
          <button onClick={submit} disabled={!url.trim() || loading} className="btn-primary">
            {loading ? 'Fetching…' : 'Fetch Info'}
          </button>
        </div>
      </div>
    </div>
  );
}
