'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyIllustration } from '@/components/svg/EmptyState';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isConfig = /supabase|konfigurasi/i.test(error.message);

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="card max-w-md p-8 text-center">
        <div className="flex justify-center">
          <EmptyIllustration size={150} />
        </div>
        <h1 className="mt-2 text-xl font-extrabold text-slate-900">Ups, ada yang tidak beres</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {isConfig
            ? 'Konfigurasi Supabase belum lengkap. Pastikan environment variable sudah diisi (lihat .env.example).'
            : 'Terjadi kesalahan saat memuat halaman. Coba muat ulang.'}
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={reset}>Coba lagi</Button>
        </div>
      </div>
    </div>
  );
}
