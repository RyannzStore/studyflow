'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from './data';

interface QueryState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook pengambilan data sederhana: loading / error / reload.
 * - `deps`  : ambil ulang ketika nilai ini berubah
 * - `enabled`: tunda pengambilan sampai true (mis. menunggu tanggal siap)
 * Saat reload, data lama tetap tampil (tidak berkedip jadi skeleton).
 */
export function useQuery<T>(fn: () => Promise<T>, deps: readonly unknown[] = [], enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const [state, setState] = useState<QueryState<T>>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: s.data === null, error: null }));
    fnRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((err) => {
        if (!cancelled) setState((s) => ({ data: s.data, error: friendlyError(err), loading: false }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater: (prev: T | null) => T | null) => {
    setState((s) => ({ ...s, data: updater(s.data) }));
  }, []);

  return { ...state, reload, setData };
}
