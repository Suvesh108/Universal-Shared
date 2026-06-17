import { useEffect } from 'react';
import { loadTheme, saveTheme } from '../utils/storage';

export function useTheme() {
  useEffect(() => {
    saveTheme(loadTheme());
  }, []);

  const toggle = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    saveTheme(next);
  };

  const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

  return { toggle, isDark };
}
