import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { useDownloadStore } from '../stores/download.store';
import { useHistoryStore } from '../stores/history.store';

/**
 * Connects to Socket.io and syncs download progress events to Zustand store.
 * Should be called once in the root component.
 */
export function useSocket(): void {
  const initialized = useRef(false);
  const { setDownload, updateDownload, removeDownload } = useDownloadStore();
  const { fetchHistory } = useHistoryStore();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket();

    socket.on('download:progress', (data) => {
      setDownload(data.id, data);
    });

    socket.on('download:queued', (data) => {
      setDownload(data.id, data);
    });

    socket.on('download:complete', (data) => {
      setDownload(data.id, data);
      // Refresh history when a download completes
      fetchHistory();
    });

    socket.on('download:error', (data) => {
      setDownload(data.id, data);
    });

    socket.on('download:cancelled', ({ id }) => {
      updateDownload(id, { status: 'cancelled' });
    });

    return () => {
      socket.off('download:progress');
      socket.off('download:queued');
      socket.off('download:complete');
      socket.off('download:error');
      socket.off('download:cancelled');
    };
  }, [setDownload, updateDownload, removeDownload, fetchHistory]);
}
