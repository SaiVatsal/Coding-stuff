import type { MediaInfo, DownloadOptions, DownloadProgress, HistoryItem, AppSettings } from '@pmd/shared';

const base = '/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(base + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getInfo: (url: string) => req<MediaInfo>('/info', { method: 'POST', body: JSON.stringify({ url }) }),
  startDownload: (opts: DownloadOptions) =>
    req<DownloadProgress>('/download', { method: 'POST', body: JSON.stringify(opts) }),
  listDownloads: () => req<DownloadProgress[]>('/download/list'),
  getProgress: (id: string) => req<DownloadProgress>(`/download/progress/${id}`),
  cancel: (id: string) => req<{ success: boolean }>(`/download/cancel/${id}`, { method: 'POST' }),
  pause: (id: string) => req<{ success: boolean }>(`/download/pause/${id}`, { method: 'POST' }),
  resume: (id: string) => req<{ success: boolean }>(`/download/resume/${id}`, { method: 'POST' }),
  retry: (id: string) => req<DownloadProgress>(`/download/retry/${id}`, { method: 'POST' }),
  removeDownload: (id: string) => req<{ success: boolean }>(`/download/${id}`, { method: 'DELETE' }),

  getHistory: () => req<HistoryItem[]>('/history'),
  deleteHistory: (id: string) => req<{ success: boolean }>(`/history/${id}`, { method: 'DELETE' }),
  clearHistory: () => req<{ success: boolean }>('/history/clear', { method: 'POST' }),
  downloadFileUrl: (id: string) => `${base}/history/stream/${id}`,

  getSettings: () => req<AppSettings>('/settings'),
  updateSettings: (patch: Partial<AppSettings>) =>
    req<AppSettings>('/settings', { method: 'PATCH', body: JSON.stringify(patch) }),

  checkDeps: () => req<{ ytdlp: { ok: boolean; version?: string }; ffmpeg: { ok: boolean; version?: string } }>('/system/dependencies'),
};
