import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { DownloadProgress } from '@pmd/shared';

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io('/', { transports: ['websocket', 'polling'], autoConnect: true });
  }
  return socket;
}

export function useDownloads() {
  const [items, setItems] = useState<Map<string, DownloadProgress>>(new Map());

  useEffect(() => {
    const s = getSocket();
    const onSnapshot = (list: DownloadProgress[]) => {
      setItems(new Map(list.map(i => [i.id, i])));
    };
    const onProgress = (p: DownloadProgress) => {
      setItems(prev => {
        const next = new Map(prev);
        if (p.status === 'finished' || p.status === 'cancelled' || p.status === 'error') {
          // keep for a while, then auto-remove
          next.set(p.id, p);
          setTimeout(() => {
            setItems(curr => {
              const m = new Map(curr);
              m.delete(p.id);
              return m;
            });
          }, 3000);
        } else {
          next.set(p.id, p);
        }
        return next;
      });
    };
    const onAdded = (p: DownloadProgress) => onProgress(p);
    const onRemoved = (id: string) => {
      setItems(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    };

    s.on('snapshot', onSnapshot);
    s.on('progress', onProgress);
    s.on('added', onAdded);
    s.on('removed', onRemoved);
    if (s.connected) onSnapshot([]);
    s.emit('snapshot-request');

    return () => {
      s.off('snapshot', onSnapshot);
      s.off('progress', onProgress);
      s.off('added', onAdded);
      s.off('removed', onRemoved);
    };
  }, []);

  return { items: Array.from(items.values()).sort((a, b) => b.startedAt - a.startedAt), setItems };
}
