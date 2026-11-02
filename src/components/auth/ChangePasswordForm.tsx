'use client';

import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Fields';
import { useToast } from '@/components/ui/Toast';
import { friendlyError } from '@/lib/data';
import { getSupabase } from '@/lib/supabase/client';
import { hasErrors, validatePassword } from '@/lib/validators';

interface Props {
  /** true = wajib ganti password sementara (login pertama). */
  forced?: boolean;
  onDone?: () => void;
}

export function ChangePasswordForm({ forced = false, onDone }: Props) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errs: Record<string, string | null> = {
      current: current ? null : forced ? 'Masukkan password sementara dari admin.' : 'Masukkan password saat ini.',
      next: validatePassword(next),
      confirm: confirm !== next ? 'Konfirmasi password tidak sama.' : null,
    };
    if (!errs.next && next === current) errs.next = 'Password baru harus berbeda dari yang lama.';
    setErrors(errs);
    if (hasErrors(errs)) return;

    setLoading(true);
    try {
      const sb = getSupabase();
      const {
        data: { user },
      } = await sb.auth.getUser();
      const email = user?.email;
      if (!email) throw new Error('Sesi tidak valid. Silakan login ulang.');

      // Validasi aturan username dilakukan juga di server (tidak boleh mengandung username).
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Gagal mengganti password.');

      // Masuk ulang dengan password baru agar sesi & token segar.
      const { error } = await sb.auth.signInWithPassword({ email, password: next });
      if (error) throw error;

      toast.success('Password berhasil diganti.');
      setCurrent('');
      setNext('');
      setConfirm('');
      onDone?.();
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  const type = show ? 'text' : 'password';

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field
        label={forced ? 'Password sementara' : 'Password saat ini'}
        error={errors.current}
        htmlFor="cp-current"
        required
      >
        <Input
          id="cp-current"
          type={type}
          autoComplete="current-password"
          value={current}
          invalid={!!errors.current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field
        label="Password baru"
        error={errors.next}
        hint="Minimal 10 karakter, kombinasi huruf dan angka."
        htmlFor="cp-new"
        required
      >
        <Input
          id="cp-new"
          type={type}
          autoComplete="new-password"
          value={next}
          invalid={!!errors.next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <Field label="Ulangi password baru" error={errors.confirm} htmlFor="cp-confirm" required>
        <Input
          id="cp-confirm"
          type={type}
          autoComplete="new-password"
          value={confirm}
          invalid={!!errors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>

      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
        {show ? 'Sembunyikan password' : 'Tampilkan password'}
      </button>

      {formError && (
        <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {formError}
        </p>
      )}

      <Button type="submit" full loading={loading}>
        {forced ? 'Simpan & lanjutkan' : 'Ganti password'}
      </Button>
    </form>
  );
}
