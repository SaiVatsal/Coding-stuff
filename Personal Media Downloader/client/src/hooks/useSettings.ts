import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AppSettings } from '@pmd/shared';

const defaults: AppSettings = {
  defaultQuality: '1080',
  defaultContainer: 'mp4',
  defaultMode: 'video_audio',
  defaultAudioFormat: 'best',
  downloadSubtitles: false,
  downloadFolder: '',
  maxConcurrent: 3,
  theme: 'dark',
  filenameTemplate: '%(title)s.%(ext)s',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getSettings().then(s => { setSettings(s); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const update = async (patch: Partial<AppSettings>) => {
    const next = await api.updateSettings(patch);
    setSettings(next);
    return next;
  };

  return { settings, update, loaded };
}
