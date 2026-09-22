import path from 'node:path';
import { randomBytes } from 'node:crypto';

const URL_REGEX = /^https?:\/\/[^\s<>"'`]+$/i;

export function isValidUrl(input: unknown): input is string {
  return typeof input === 'string' && URL_REGEX.test(input) && input.length <= 2048;
}

export function safeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200) || 'download';
}

export function safePath(base: string, filename: string): string {
  const cleaned = safeFilename(filename);
  const resolved = path.resolve(base, cleaned);
  if (!resolved.startsWith(path.resolve(base) + path.sep) && resolved !== path.resolve(base)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

export function newId(): string {
  return randomBytes(8).toString('hex');
}

const RESERVED = new Set(['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'LPT1', 'LPT2']);
export function windowsSafeName(name: string): string {
  const base = name.split('.')[0].toUpperCase();
  if (RESERVED.has(base)) return `_${name}`;
  return name;
}
