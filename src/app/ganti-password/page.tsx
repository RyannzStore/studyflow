'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { LoginLines } from '@/components/svg/LoginLines';
import { LogoFull } from '@/components/svg/Logo';
import { getSupabase } from '@/lib/supabase/client';

export default function ForcePasswordPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await getSupabase().auth.signOut();
    } catch {
      /* abaikan */
    }
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-violet-600 px-4 py-10">
      <LoginLines />
      <div className="card relative z-10 w-full max-w-md p-6 sm:p-8">
        <LogoFull size={40} />
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-50 p-4">
          <ShieldCheck className="mt-0.5 shrink-0 text-brand-600" size={22} />
          <div>
            <h1 className="font-extrabold text-slate-900">Buat password baru</h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Kamu masuk dengan password sementara. Demi keamanan, ganti dulu dengan password pribadimu sebelum
              memakai StudyFlow.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <ChangePasswordForm
            forced
            onDone={() => {
              router.replace('/');
              router.refresh();
            }}
          />
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="mx-auto mt-5 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-60"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </div>
  );
}
