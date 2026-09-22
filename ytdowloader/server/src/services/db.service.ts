import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import type { HistoryItem, SettingsConfig } from '../../../shared/types.js';
import { DEFAULT_SETTINGS } from '../../../shared/types.js';

// ─── JSON File Store ─────────────────────────────────────────────────────────

interface StoreData {
  downloads: HistoryItem[];
  settings: Partial<SettingsConfig>;
}

const STORE_FILE = () => path.join(config.dataDir, 'store.json');

function readStore(): StoreData {
  try {
    const raw = fs.readFileSync(STORE_FILE(), 'utf-8');
    return JSON.parse(raw) as StoreData;
  } catch {
    return { downloads: [], settings: {} };
  }
}

function writeStore(data: StoreData): void {
  fs.writeFileSync(STORE_FILE(), JSON.stringify(data, null, 2), 'utf-8');
}

export function initDatabase(): void {
  // Ensure data directory exists
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
  // Ensure store file exists
  if (!fs.existsSync(STORE_FILE())) {
    writeStore({ downloads: [], settings: {} });
  }
}

// ─── History ─────────────────────────────────────────────────────────────────

export function addHistoryItem(item: HistoryItem): void {
  const store = readStore();
  // Replace if exists, otherwise push
  const idx = store.downloads.findIndex((d) => d.id === item.id);
  if (idx !== -1) {
    store.downloads[idx] = item;
  } else {
    store.downloads.unshift(item); // newest first
  }
  writeStore(store);
}

export function getHistory(
  page: number = 1,
  pageSize: number = 50,
  search?: string,
): { items: HistoryItem[]; total: number } {
  const store = readStore();
  let items = store.downloads;

  // Filter by search
  if (search && search.trim().length > 0) {
    const q = search.trim().toLowerCase();
    items = items.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.uploader && d.uploader.toLowerCase().includes(q)),
    );
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = items.length;
  const offset = (page - 1) * pageSize;
  const paged = items.slice(offset, offset + pageSize);

  return { items: paged, total };
}

export function deleteHistoryItem(id: string): boolean {
  const store = readStore();
  const before = store.downloads.length;
  store.downloads = store.downloads.filter((d) => d.id !== id);
  if (store.downloads.length < before) {
    writeStore(store);
    return true;
  }
  return false;
}

export function clearHistory(): number {
  const store = readStore();
  const count = store.downloads.length;
  store.downloads = [];
  writeStore(store);
  return count;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function getSettings(): SettingsConfig {
  const store = readStore();
  return { ...DEFAULT_SETTINGS, ...store.settings };
}

export function updateSettings(updates: Partial<SettingsConfig>): SettingsConfig {
  const store = readStore();
  store.settings = { ...store.settings, ...updates };
  writeStore(store);
  return { ...DEFAULT_SETTINGS, ...store.settings };
}
