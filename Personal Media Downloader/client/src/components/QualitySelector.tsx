import type { VideoQuality } from '@pmd/shared';
import { useSettings } from '../hooks/useSettings';

const qualities: { v: VideoQuality; label: string }[] = [
  { v: '144', label: '144p' },
  { v: '240', label: '240p' },
  { v: '360', label: '360p' },
  { v: '480', label: '480p' },
  { v: '720', label: '720p HD' },
  { v: '1080', label: '1080p FHD' },
  { v: '1440', label: '1440p QHD' },
  { v: '2160', label: '4K UHD' },
  { v: 'highest', label: 'Best Available' },
];

export function QualitySelector({ value, onChange }: { value: VideoQuality; onChange: (v: VideoQuality) => void }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {qualities.map(q => (
        <button
          key={q.v}
          onClick={() => onChange(q.v)}
          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all
            ${value === q.v
              ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'}`}
        >
          {q.label}
        </button>
      ))}
    </div>
  );
}
