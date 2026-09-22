import type { MediaInfo } from '@pmd/shared';
import { formatDuration, formatBytes } from '../utils/format';

export function MediaInfoCard({ info, onCopy }: { info: MediaInfo; onCopy: () => void }) {
  return (
    <div className="card animate-slide-up">
      <div className="flex flex-col md:flex-row gap-4">
        {info.thumbnail && (
          <a href={info.webpageUrl} target="_blank" rel="noreferrer" className="shrink-0">
            <img
              src={info.thumbnail}
              alt={info.title}
              className="w-full md:w-56 rounded-xl object-cover aspect-video bg-zinc-800"
              loading="lazy"
            />
          </a>
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="text-lg font-semibold leading-snug line-clamp-2">{info.title}</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {info.uploader && <span className="px-2 py-1 rounded-md bg-white/5">👤 {info.uploader}</span>}
            {info.duration && <span className="px-2 py-1 rounded-md bg-white/5">⏱ {formatDuration(info.duration)}</span>}
            <span className="px-2 py-1 rounded-md bg-white/5 capitalize">📁 {info.type}</span>
            {info.hasHdr && <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-300">HDR</span>}
            {info.subtitles.length > 0 && <span className="px-2 py-1 rounded-md bg-white/5">💬 {info.subtitles.length} subs</span>}
            <span className="px-2 py-1 rounded-md bg-white/5">📊 {info.formats.length} formats</span>
          </div>
          <button onClick={onCopy} className="btn-ghost text-xs">Copy info as JSON</button>
        </div>
      </div>
    </div>
  );
}
