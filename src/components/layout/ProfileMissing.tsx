'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { EmptyIllustration } from '@/components/svg/EmptyState';
import { getSupabase } from '@/lib/supabase/client';

/** Tampil bila akun login tetapi baris profiles belum ada (mis. schema.sql belum dijalankan). */
export function ProfileMissing() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await getSupabase().auth.signOut();
    } catch {
      /* abaikan */
    }
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="card max-w-md p-8 text-center">
        <div className="flex justify-center">
          <EmptyIllustration size={150} />
        </div>
        <h1 className="mt-2 text-xl font-extrabold text-slate-900">Profil akun belum tersedia</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Akun kamu sudah login, tetapi data profilnya belum dibuat. Hubungi admin kelas untuk memeriksa akun ini.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={logout} loading={loading}>
            Keluar
          </Button>
        </div>
      </div>
    </div>
  );
}
