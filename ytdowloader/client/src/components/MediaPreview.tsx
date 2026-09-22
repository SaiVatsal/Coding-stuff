import { motion } from 'framer-motion';
import { Clock, User, Eye, ThumbsUp, Film, Volume2, Subtitles, Copy, Check } from 'lucide-react';
import type { MediaInfo } from '@shared/types';
import { useState } from 'react';

interface MediaPreviewProps {
  info: MediaInfo;
}

export function MediaPreview({ info }: MediaPreviewProps) {
  const [copied, setCopied] = useState(false);

  const copyInfo = () => {
    const text = [
      `Title: ${info.title}`,
      info.uploader ? `Uploader: ${info.uploader}` : '',
      info.durationString ? `Duration: ${info.durationString}` : '',
      `URL: ${info.url}`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const videoFormats = info.formats.filter((f) => f.hasVideo);
  const audioFormats = info.formats.filter((f) => f.hasAudio && !f.hasVideo);
  const subtitleCount = Object.keys(info.subtitles).length;
  const bestVideo = info.bestVideoFormat;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="glass-card-static p-5 w-full max-w-2xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Thumbnail */}
        {info.thumbnail && (
          <div className="relative shrink-0 w-full sm:w-48 aspect-video rounded-lg overflow-hidden bg-[var(--color-bg-secondary)]">
            <img
              src={info.thumbnail}
              alt={info.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {info.durationString && (
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-0.5 rounded">
                {info.durationString}
              </span>
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-2 mb-2 leading-snug">
            {info.title}
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)] mb-3">
            {info.uploader && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {info.uploader}
              </span>
            )}
            {info.durationString && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {info.durationString}
              </span>
            )}
            {info.viewCount != null && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {info.viewCount.toLocaleString()} views
              </span>
            )}
            {info.likeCount != null && (
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {info.likeCount.toLocaleString()}
              </span>
            )}
          </div>

          {/* Format badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {videoFormats.length > 0 && (
              <span className="flex items-center gap-1 text-xs bg-[rgba(124,58,237,0.1)] text-[#a78bfa] px-2 py-0.5 rounded-full">
                <Film className="w-3 h-3" />
                {videoFormats.length} video
              </span>
            )}
            {audioFormats.length > 0 && (
              <span className="flex items-center gap-1 text-xs bg-[rgba(59,130,246,0.1)] text-[#60a5fa] px-2 py-0.5 rounded-full">
                <Volume2 className="w-3 h-3" />
                {audioFormats.length} audio
              </span>
            )}
            {subtitleCount > 0 && (
              <span className="flex items-center gap-1 text-xs bg-[rgba(16,185,129,0.1)] text-[#34d399] px-2 py-0.5 rounded-full">
                <Subtitles className="w-3 h-3" />
                {subtitleCount} subs
              </span>
            )}
            {bestVideo?.hdr && (
              <span className="text-xs bg-[rgba(245,158,11,0.15)] text-[#fbbf24] px-2 py-0.5 rounded-full font-semibold">
                HDR
              </span>
            )}
            {bestVideo?.fps && bestVideo.fps > 30 && (
              <span className="text-xs bg-[rgba(6,182,212,0.1)] text-[#22d3ee] px-2 py-0.5 rounded-full">
                {bestVideo.fps}fps
              </span>
            )}
            {bestVideo && (
              <span className="text-xs bg-[rgba(255,255,255,0.06)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full">
                up to {bestVideo.qualityLabel}
              </span>
            )}
          </div>

          <button
            onClick={copyInfo}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-[var(--color-success)]" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy info'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
