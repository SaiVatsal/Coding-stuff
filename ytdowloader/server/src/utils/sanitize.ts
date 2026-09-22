import path from 'node:path';
import sanitizeFilename from 'sanitize-filename';
import { config } from '../config.js';

/**
 * Validates that a URL uses an allowed protocol.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes a filename to prevent path traversal and invalid characters.
 * Strips null bytes, control characters, and path separators.
 */
export function sanitizeOutputFilename(name: string): string {
  // Remove null bytes and control characters
  let clean = name.replace(/[\x00-\x1f\x7f]/g, '');
  // Use sanitize-filename library
  clean = sanitizeFilename(clean, { replacement: '_' });
  // Ensure it's not empty
  if (!clean || clean.trim().length === 0) {
    clean = 'download';
  }
  // Limit length (255 chars is common filesystem limit)
  if (clean.length > 200) {
    const ext = path.extname(clean);
    clean = clean.substring(0, 200 - ext.length) + ext;
  }
  return clean;
}

/**
 * Validates that a resolved path is within the download directory.
 * Prevents path traversal attacks.
 */
export function isPathWithinDownloadDir(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const downloadDir = path.resolve(config.downloadDir);
  return resolved.startsWith(downloadDir + path.sep) || resolved === downloadDir;
}

/**
 * Safely resolves a filename within the download directory.
 * Returns null if the resolved path escapes the download root.
 */
export function safeJoinDownloadPath(filename: string): string | null {
  const sanitized = sanitizeOutputFilename(filename);
  const joined = path.join(config.downloadDir, sanitized);
  const resolved = path.resolve(joined);
  if (!isPathWithinDownloadDir(resolved)) {
    return null;
  }
  return resolved;
}
