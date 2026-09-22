export type MediaType = 'video' | 'audio' | 'unknown';

export type DownloadMode = 'video_audio' | 'video_only' | 'audio_only';

export type Container = 'original' | 'mp4' | 'mkv' | 'webm';

export type AudioFormat = 'best' | 'mp3';

export type VideoQuality =
  | '144' | '240' | '360' | '480' | '720' | '1080' | '1440' | '2160' | 'highest';

export interface FormatInfo {
  formatId: string;
  ext: string;
  resolution?: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesizeApprox?: number;
  tbr?: number;
  abr?: number;
  vbr?: number;
  hdr?: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  note?: string;
}

export interface SubtitleInfo {
  language: string;
  name?: string;
  ext: string;
}

export interface MediaInfo {
  id: string;
  url: string;
  title: string;
  uploader?: string;
  duration?: number;
  thumbnail?: string;
  description?: string;
  type: MediaType;
  formats: FormatInfo[];
  subtitles: SubtitleInfo[];
  hasHdr: boolean;
  webpageUrl: string;
}

export interface DownloadOptions {
  url: string;
  mode: DownloadMode;
  quality: VideoQuality;
  container: Container;
  audioFormat: AudioFormat;
  downloadSubs: boolean;
  subLangs?: string;
  outputTemplate?: string;
}

export type DownloadStatus =
  | 'queued'
  | 'fetching_info'
  | 'downloading'
  | 'merging'
  | 'converting'
  | 'finished'
  | 'error'
  | 'cancelled'
  | 'paused';

export interface DownloadProgress {
  id: string;
  status: DownloadStatus;
  percent: number;
  speed?: number;
  eta?: number;
  downloadedBytes?: number;
  totalBytes?: number;
  filename?: string;
  filepath?: string;
  error?: string;
  stage?: string;
  startedAt: number;
  finishedAt?: number;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  uploader?: string;
  duration?: number;
  quality: string;
  format: string;
  mode: DownloadMode;
  container: Container;
  filesize?: number;
  filename: string;
  filepath: string;
  completedAt: number;
  status: 'finished' | 'error' | 'cancelled';
}

export interface AppSettings {
  defaultQuality: VideoQuality;
  defaultContainer: Container;
  defaultMode: DownloadMode;
  defaultAudioFormat: AudioFormat;
  downloadSubtitles: boolean;
  downloadFolder: string;
  maxConcurrent: number;
  theme: 'dark' | 'light' | 'system';
  filenameTemplate: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: string;
}

export interface SocketEvents {
  progress: (data: DownloadProgress) => void;
  added: (data: DownloadProgress) => void;
  removed: (id: string) => void;
}
