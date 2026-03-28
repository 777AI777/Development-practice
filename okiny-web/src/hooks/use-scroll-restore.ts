"use client";

import { useEffect } from "react";

interface UseScrollRestoreOptions {
  key: string;
  enabled: boolean;
}

export function useScrollRestore({ key, enabled }: UseScrollRestoreOptions): void {
  useEffect(() => {
    if (enabled) {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        const scrollY = Number(saved);
        sessionStorage.removeItem(key);
        if (Number.isFinite(scrollY)) {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
          });
        }
      }
    }

    return () => {
      if (enabled) {
        sessionStorage.setItem(key, String(window.scrollY));
      }
    };
  }, [key, enabled]);
}
