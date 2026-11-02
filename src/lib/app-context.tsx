'use client';

import { createContext, useContext } from 'react';
import type { Profile } from './types';

interface AppContextValue {
  profile: Profile;
  isAdmin: boolean;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp harus dipakai di dalam AppShell.');
  return ctx;
}
