import { useState, useCallback } from 'react';
import type { MediaInfo } from '@shared/types';
import { fetchMediaInfo } from '../services/api';

interface UseMediaInfoReturn {
  info: MediaInfo | null;
  loading: boolean;
  error: string | null;
  fetchInfo: (url: string) => Promise<void>;
  reset: () => void;
}

export function useMediaInfo(): UseMediaInfoReturn {
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const result = await fetchMediaInfo(url);
      setInfo(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch media info.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setInfo(null);
    setError(null);
    setLoading(false);
  }, []);

  return { info, loading, error, fetchInfo, reset };
}
