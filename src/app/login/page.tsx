'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { FloatingIcons } from '@/components/svg/FloatingIcons';
import { LoginLines } from '@/components/svg/LoginLines';
import { LogoFull } from '@/components/svg/Logo';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Fields';
import { friendlyError } from '@/lib/data';
import { getSupabase } from '@/lib/supabase/client';
import { emailFromUsername } from '@/lib/validators';

function safeNext(): string {
  try {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login')) return next;
  } catch {
    /* abaikan */
  }
  return '/';
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const u = username.trim();
    const errs = {
      username: u ? undefined : 'Username wajib diisi.',
      password: password ? undefined : 'Password wajib diisi.',
    };
    setErrors(errs);
    if (errs.username || errs.password) return;

    setLoading(true);
    try {
      const sb = getSupabase();
      const { error } = await sb.auth.signInWithPassword({
        email: emailFromUsername(u, process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN),
        password,
      });
      if (error) {
        const m = error.message.toLowerCase();
        setFormError(
          m.includes('invalid') || m.includes('credentials')
            ? 'Username atau password salah.'
            : m.includes('rate') || m.includes('too many')
              ? 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.'
              : friendlyError(error),
        );
        setLoading(false);
        return;
      }
      router.replace(safeNext());
      router.refresh();
    } catch (err) {
      setFormError(friendlyError(err));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Panel visual ---------- */}
      <section className="relative isolate flex min-h-[270px] flex-col justify-between overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-brand-600 via-brand-500 to-violet-600 px-6 pb-16 pt-8 text-white lg:min-h-dvh lg:rounded-none lg:px-14 lg:py-12">
        <LoginLines />
        <FloatingIcons />
        <div className="relative z-10">
          <LogoFull light showTagline size={44} />
        </div>
        <div className="relative z-10 mt-8 max-w-md lg:mt-0">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide ring-1 ring-white/25">
            KELAS X TKJ 1
          </p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">Organize Your School Life.</h1>
          <p className="mt-3 hidden text-base leading-relaxed text-indigo-100 sm:block">
            Jadwal, tugas, LKS, dan buku yang harus dibawa — semuanya rapi di satu tempat.
          </p>
        </div>
        <p className="relative z-10 hidden text-sm text-indigo-100 lg:block">© StudyFlow · X TKJ 1</p>
      </section>

      {/* ---------- Form ---------- */}
      <section className="relative z-10 -mt-10 flex items-start justify-center px-4 pb-10 lg:mt-0 lg:items-center lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="card w-full max-w-md p-6 shadow-soft-lg sm:p-8"
        >
          <h2 className="text-2xl font-extrabold text-slate-900">Selamat datang 👋</h2>
          <p className="mt-1 text-sm text-slate-500">Masuk dengan akun StudyFlow yang diberikan admin.</p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <Field label="Username" error={errors.username} htmlFor="username" required>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="contoh: rangga"
                value={username}
                invalid={!!errors.username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>

            <Field label="Password" error={errors.password} htmlFor="password" required>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  className="pr-12"
                  value={password}
                  invalid={!!errors.password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {formError && (
              <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {formError}
              </p>
            )}

            <Button type="submit" size="lg" full loading={loading} icon={<LogIn size={18} />}>
              Masuk
            </Button>
          </form>

          <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
            Akun dibuat oleh admin kelas. Lupa password atau belum punya akun? Hubungi admin untuk reset.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
