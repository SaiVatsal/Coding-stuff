import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void; resolved: 'dark' | 'light' }>(
  { theme: 'dark', setTheme: () => {}, resolved: 'dark' }
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('pmd-theme') as Theme | null;
    return stored || 'dark';
  });
  const [resolved, setResolved] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const apply = () => {
      const isLight = theme === 'light' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
      setResolved(isLight ? 'light' : 'dark');
      document.documentElement.classList.toggle('light', isLight);
      document.documentElement.classList.toggle('dark', !isLight);
    };
    apply();
    localStorage.setItem('pmd-theme', theme);
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, setTheme: setThemeState, resolved }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
