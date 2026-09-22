import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MediaInfo, DownloadMode, OutputFormat } from '@shared/types';
import { VIDEO_QUALITIES } from '@shared/types';
import { useSettingsStore } from '../stores/settings.store';
import * as api from '../services/api';
import toast from 'react-hot-toast';

interface DownloadOptionsProps {
  info: MediaInfo;
}

export function DownloadOptions({ info }: DownloadOptionsProps) {
  const settings = useSettingsStore((s) => s.settings);

  const [mode, setMode] = useState<DownloadMode>(settings.defaultMode);
  const [quality, setQuality] = useState(settings.defaultQuality);
  const [format, setFormat] = useState<OutputFormat>(settings.defaultFormat);
  const [submitting, setSubmitting] = useState(false);

  const isAudio = mode === 'audio_only';

  const handleDownload = async () => {
    setSubmitting(true);
    try {
      const selectedQuality = VIDEO_QUALITIES.find((q) => q.value === quality);

      await api.startDownload({
        url: info.url,
        mode,
        outputFormat: isAudio ? (format === 'mp3' ? 'mp3' : 'original') : format,
        qualityLabel: quality,
        height: selectedQuality?.height ?? undefined,
      });

      toast.success('Download started!', {
        style: { background: '#1a1a2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' },
        iconTheme: { primary: '#10b981', secondary: '#1a1a2e' },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start download.', {
        style: { background: '#1a1a2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const modes: { value: DownloadMode; label: string }[] = [
    { value: 'video_audio', label: 'Video + Audio' },
    { value: 'video_only', label: 'Video Only' },
    { value: 'audio_only', label: 'Audio Only' },
  ];

  const videoFormats: { value: OutputFormat; label: string }[] = [
    { value: 'mp4', label: 'MP4' },
    { value: 'mkv', label: 'MKV' },
    { value: 'webm', label: 'WebM' },
    { value: 'original', label: 'Original' },
  ];

  const audioFormats: { value: OutputFormat; label: string }[] = [
    { value: 'mp3', label: 'MP3' },
    { value: 'original', label: 'Best Audio' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="glass-card-static p-5 w-full max-w-2xl mx-auto"
    >
      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 bg-[rgba(255,255,255,0.03)] rounded-lg mb-5">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`tab-btn flex-1 ${mode === m.value ? 'tab-btn-active' : ''}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Quality */}
        {!isAudio && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
              Quality
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="select-glass w-full"
            >
              {VIDEO_QUALITIES.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Format */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
            Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as OutputFormat)}
            className="select-glass w-full"
          >
            {(isAudio ? audioFormats : videoFormats).map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={submitting}
        className="btn-gradient w-full py-3.5 text-base"
      >
        <span className="flex items-center justify-center gap-2">
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          {submitting ? 'Starting...' : 'Download'}
        </span>
      </button>
    </motion.div>
  );
}
