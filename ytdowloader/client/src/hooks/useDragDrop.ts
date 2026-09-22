import { useState, useCallback, useEffect, useRef } from 'react';

interface UseDragDropReturn {
  isDragging: boolean;
  dragRef: React.RefObject<HTMLDivElement | null>;
}

export function useDragDrop(onDrop: (url: string) => void): UseDragDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.items.length) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const text = e.dataTransfer?.getData('text/plain') || e.dataTransfer?.getData('text/uri-list');
      if (text) {
        const trimmed = text.trim();
        try {
          new URL(trimmed);
          onDrop(trimmed);
        } catch {
          // Not a valid URL, ignore
        }
      }
    },
    [onDrop],
  );

  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    el.addEventListener('dragenter', handleDragEnter);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);

    return () => {
      el.removeEventListener('dragenter', handleDragEnter);
      el.removeEventListener('dragleave', handleDragLeave);
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return { isDragging, dragRef };
}
