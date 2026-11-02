'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { ToastProvider } from '@/components/ui/Toast';

const STORAGE_KEY = 'sf-reduce-motion';

interface MotionPref {
  reduced: boolean;
  setReduced: (value: boolean) => void;
}

const MotionPrefContext = createContext<MotionPref>({ reduced: false, setReduced: () => {} });

export function useMotionPref() {
  return useContext(MotionPrefContext);
}

/**
 * Provider global:
 *  - MotionConfig: animasi Framer Motion otomatis mengikuti prefers-reduced-motion,
 *    atau dipaksa mati lewat toggle "Kurangi animasi" di Pengaturan.
 *  - ToastProvider: notifikasi singkat.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [reduced, setReducedState] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) === '1';
      setReducedState(saved);
      document.documentElement.dataset.motion = saved ? 'reduced' : 'full';
    } catch {
      /* localStorage bisa diblokir — abaikan */
    }
  }, []);

  const setReduced = useCallback((value: boolean) => {
    setReducedState(value);
    document.documentElement.dataset.motion = value ? 'reduced' : 'full';
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      /* abaikan */
    }
  }, []);

  const pref = useMemo(() => ({ reduced, setReduced }), [reduced, setReduced]);

  return (
    <MotionPrefContext.Provider value={pref}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </MotionPrefContext.Provider>
  );
}
