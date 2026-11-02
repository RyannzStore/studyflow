'use client';

import { useEffect, useState } from 'react';
import { jakartaNow, type JakartaNow } from './date';

/**
 * Waktu sekarang (WIB). Bernilai null saat render pertama (SSR) supaya tidak terjadi
 * hydration mismatch; terisi setelah mount lalu diperbarui tiap menit berganti.
 */
export function useNow(intervalMs = 20000): JakartaNow | null {
  const [now, setNow] = useState<JakartaNow | null>(null);

  useEffect(() => {
    const tick = () =>
      setNow((prev) => {
        const next = jakartaNow();
        return prev && prev.dateKey === next.dateKey && prev.minutes === next.minutes ? prev : next;
      });
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
