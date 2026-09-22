import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import type { HistoryItem } from '@pmd/shared';

function ensure() {
  const dir = path.dirname(config.historyFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(config.historyFile)) fs.writeFileSync(config.historyFile, '[]');
}

export function readHistory(): HistoryItem[] {
  try {
    ensure();
    const data = fs.readFileSync(config.historyFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addHistory(item: HistoryItem) {
  const list = readHistory();
  list.unshift(item);
  const trimmed = list.slice(0, 500);
  fs.writeFileSync(config.historyFile, JSON.stringify(trimmed, null, 2));
}

export function deleteHistory(id: string) {
  const list = readHistory().filter(i => i.id !== id);
  fs.writeFileSync(config.historyFile, JSON.stringify(list, null, 2));
}

export function clearHistory() {
  fs.writeFileSync(config.historyFile, '[]');
}
