import type {
  MediaInfo,
  DownloadRequest,
  DownloadProgress,
  HistoryItem,
  SettingsConfig,
  ApiResponse,
  PaginatedResponse,
} from '@shared/types';

const API_BASE = '/api';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }

  return json.data as T;
}

// ─── Info ────────────────────────────────────────────────────────────────

export async function fetchMediaInfo(url: string): Promise<MediaInfo> {
  return request<MediaInfo>('/info', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

// ─── Downloads ───────────────────────────────────────────────────────────

export async function startDownload(req: DownloadRequest): Promise<DownloadProgress> {
  return request<DownloadProgress>('/download', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function getActiveDownloads(): Promise<DownloadProgress[]> {
  return request<DownloadProgress[]>('/download');
}

export async function cancelDownload(id: string): Promise<void> {
  return request<void>(`/download/${id}`, { method: 'DELETE' });
}

export async function retryDownload(id: string): Promise<DownloadProgress> {
  return request<DownloadProgress>(`/download/${id}/retry`, { method: 'POST' });
}

// ─── History ─────────────────────────────────────────────────────────────

export async function fetchHistory(
  page: number = 1,
  pageSize: number = 50,
  search?: string,
): Promise<PaginatedResponse<HistoryItem>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set('search', search);
  return request<PaginatedResponse<HistoryItem>>(`/history?${params.toString()}`);
}

export async function deleteHistoryItem(id: string): Promise<void> {
  return request<void>(`/history/${id}`, { method: 'DELETE' });
}

export async function clearAllHistory(): Promise<void> {
  return request<void>('/history', { method: 'DELETE' });
}

// ─── Settings ────────────────────────────────────────────────────────────

export async function fetchSettings(): Promise<SettingsConfig> {
  return request<SettingsConfig>('/settings');
}

export async function updateSettings(updates: Partial<SettingsConfig>): Promise<SettingsConfig> {
  return request<SettingsConfig>('/settings', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// ─── Files ───────────────────────────────────────────────────────────────

export function getFileDownloadUrl(filename: string): string {
  return `${API_BASE}/files/${encodeURIComponent(filename)}`;
}

export async function openDownloadFolder(): Promise<void> {
  return request<void>('/files/open-folder', { method: 'POST' });
}
