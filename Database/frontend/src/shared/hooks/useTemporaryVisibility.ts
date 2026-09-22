import { useEffect, useState } from 'react';

export function useTemporaryVisibility(durationMs: number): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setIsVisible(false), durationMs);
    return () => clearTimeout(hideTimer);
  }, [durationMs]);

  return isVisible;
}
