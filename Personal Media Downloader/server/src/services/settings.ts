import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import type { AppSettings } from '@pmd/shared';

const defaults: AppSettings = {
  defaultQuality: '1080',
  defaultContainer: 'mp4',
  defaultMode: 'video_audio',
  defaultAudioFormat: 'best',
  downloadSubtitles: false,
  downloadFolder: config.root,
  maxConcurrent: config.maxConcurrent,
  theme: 'dark',
  filenameTemplate: '%(title)s.%(ext)s',
};

function ensure() {
  const dir = path.dirname(config.settingsFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getSettings(): AppSettings {
  try {
    ensure();
    if (!fs.existsSync(config.settingsFile)) {
      fs.writeFileSync(config.settingsFile, JSON.stringify(defaults, null, 2));
      return { ...defaults };
    }
    const data = JSON.parse(fs.readFileSync(config.settingsFile, 'utf-8'));
    return { ...defaults, ...data };
  } catch {
    return { ...defaults };
  }
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const next = { ...current, ...patch };
  ensure();
  fs.writeFileSync(config.settingsFile, JSON.stringify(next, null, 2));
  return next;
}
