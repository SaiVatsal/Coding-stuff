// ─── Media Info (returned from yt-dlp --dump-single-json) ────────────────────

export interface FormatOption {
  formatId: string;
  ext: string;
  resolution: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  vcodec: string | null;
  acodec: string | null;
  filesize: number | null;
  filesizeApprox: number | null;
  tbr: number | null;
  hasVideo: boolean;
  hasAudio: boolean;
  hdr: boolean;
  qualityLabel: string;
}

export interface SubtitleTrack {
  language: string;
  name: string;
  ext: string;
  url: string;
}

export interface MediaInfo {
  id: string;
  url: string;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  durationString: string | null;
  uploader: string | null;
  uploaderUrl: string | null;
  description: string | null;
  viewCount: number | null;
  likeCount: number | null;
  uploadDate: string | null;
  formats: FormatOption[];
  subtitles: Record<string, SubtitleTrack[]>;
  bestVideoFormat: FormatOption | null;
  bestAudioFormat: FormatOption | null;
}

// ─── Download Request / Response ─────────────────────────────────────────────

export type DownloadMode = 'video_audio' | 'video_only' | 'audio_only';
export type OutputFormat = 'mp4' | 'mkv' | 'webm' | 'mp3' | 'original';

export interface DownloadRequest {
  url: string;
  formatId?: string;
  qualityLabel?: string;
  height?: number;
  mode: DownloadMode;
  outputFormat: OutputFormat;
  downloadSubtitles?: boolean;
  subtitleLanguages?: string[];
}

export type DownloadStatus =
  | 'queued'
  | 'fetching_info'
  | 'downloading'
  | 'merging'
  | 'converting'
  | 'complete'
  | 'error'
  | 'cancelled'
  | 'paused';

export interface DownloadProgress {
  id: string;
  url: string;
  title: string;
  thumbnail: string | null;
  status: DownloadStatus;
  percent: number;
  speed: string | null;
  eta: string | null;
  filesize: string | null;
  filesizeBytes: number | null;
  error: string | null;
  qualityLabel: string | null;
  outputFormat: OutputFormat;
  filename: string | null;
  createdAt: string;
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string | null;
  date: string;
  qualityLabel: string;
  format: string;
  filename: string;
  filesize: number | null;
  duration: number | null;
  uploader: string | null;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'system';

export interface SettingsConfig {
  defaultQuality: string;
  defaultFormat: OutputFormat;
  defaultMode: DownloadMode;
  downloadFolder: string;
  theme: ThemeMode;
  maxConcurrent: number;
}

export const DEFAULT_SETTINGS: SettingsConfig = {
  defaultQuality: 'highest',
  defaultFormat: 'mp4',
  defaultMode: 'video_audio',
  downloadFolder: './downloads',
  theme: 'dark',
  maxConcurrent: 3,
};

// ─── Quality Presets ─────────────────────────────────────────────────────────

export const VIDEO_QUALITIES = [
  { label: 'Highest Available', value: 'highest', height: null },
  { label: '2160p (4K)', value: '2160p', height: 2160 },
  { label: '1440p', value: '1440p', height: 1440 },
  { label: '1080p', value: '1080p', height: 1080 },
  { label: '720p', value: '720p', height: 720 },
  { label: '480p', value: '480p', height: 480 },
  { label: '360p', value: '360p', height: 360 },
  { label: '240p', value: '240p', height: 240 },
  { label: '144p', value: '144p', height: 144 },
] as const;

export const AUDIO_QUALITIES = [
  { label: 'Best Audio', value: 'bestaudio' },
  { label: 'MP3', value: 'mp3' },
] as const;

// ─── Socket Events ───────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  'download:progress': (data: DownloadProgress) => void;
  'download:complete': (data: DownloadProgress) => void;
  'download:error': (data: DownloadProgress) => void;
  'download:queued': (data: DownloadProgress) => void;
  'download:cancelled': (data: { id: string }) => void;
}

export interface ClientToServerEvents {
  'download:cancel': (data: { id: string }) => void;
  'download:pause': (data: { id: string }) => void;
  'download:resume': (data: { id: string }) => void;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
