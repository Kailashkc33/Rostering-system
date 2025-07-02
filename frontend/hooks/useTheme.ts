'use client';

import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem("theme", theme);
  }, [theme]);

  // On first mount, sync with localStorage (for SSR hydration)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as 'light' | 'dark' | null;
      if (stored && stored !== theme) setTheme(stored);
    }
    // eslint-disable-next-line
  }, []);

  return { theme, setTheme };
}
