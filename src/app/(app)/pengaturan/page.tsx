'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, KeyRound, LogOut, Plus, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Fields';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Badge, Card, ErrorState, ListSkeleton, PageHeader, SectionTitle } from '@/components/ui/misc';
import { useMotionPref } from '@/components/Providers';
import { useApp } from '@/lib/app-context';
import { formatRelativeTime, initials } from '@/lib/date';
import { friendlyError } from '@/lib/data';
import { getSupabase } from '@/lib/supabase/client';
import type { StudentAccount } from '@/lib/types';
import { useQuery } from '@/lib/use-query';
import { hasErrors, validateFullName, validateUsername } from '@/lib/validators';

interface Credentials {
  full_name: string;
  username: string;
  temp_password: string;
  reset: boolean;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error || 'Permintaan gagal.');
  return json;
}

function AccountsAdmin() {
  const toast = useToast();
  const { profile } = useApp();
  const [creating, setCreating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [resetTarget, setResetTarget] = useState<StudentAccount | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  const { data, error, loading, reload } = useQuery(async () => (await api<{ students: StudentAccount[] }>('/api/admin/students')).students);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    const errs = { full_name: validateFullName(fullName), username: validateUsername(u) };
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    try {
      const res = await api<{ username: string; full_name: string; temp_password: string }>('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), username: u }),
      });
      setCreating(false);
      setFullName('');
      setUsername('');
      setCopied(false);
      setCreds({ ...res, reset: false });
      reload();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!resetTarget) return;
    setResetBusy(true);
    try {
      const res = await api<{ temp_password: string }>(`/api/admin/students/${resetTarget.id}/reset`, { method: 'POST' });
      setCopied(false);
      setCreds({ full_name: resetTarget.full_name, username: resetTarget.username, temp_password: res.temp_password, reset: true });
      setResetTarget(null);
      reload();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setResetBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info('Salin manual password di atas.');
    }
  }

  return (
    <section>
      <SectionTitle
        action={
          <Button size="sm" icon={<Plus size={16} />} onClick={() => { setErrors({}); setCreating(true); }}>
            Akun baru
          </Button>
        }
      >
        Kelola akun murid (admin)
      </SectionTitle>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <ListSkeleton rows={3} />
      ) : (
        <Card className="divide-y divide-slate-100">
          {data.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-sm font-bold text-brand-700">{initials(s.full_name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-800">{s.full_name}</p>
                <p className="truncate text-xs text-slate-500">
                  @{s.username} · {s.last_sign_in_at ? `login ${formatRelativeTime(s.last_sign_in_at)}` : 'belum pernah login'}
                </p>
                <div className="mt-1 flex gap-1.5">
                  {s.role === 'admin' && <Badge tone="violet">Admin</Badge>}
                  {s.must_change_password && <Badge tone="amber">Belum ganti password</Badge>}
                </div>
              </div>
              {s.id !== profile.id && (
                <Button size="sm" variant="secondary" icon={<RefreshCw size={14} />} onClick={() => setResetTarget(s)}>
                  Reset
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}

      <Modal
        open={creating}
        onClose={() => !busy && setCreating(false)}
        title="Buat akun murid"
        description="Password sementara dibuat otomatis dan wajib diganti saat login pertama."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" form="create-account" loading={busy}>
              Buat akun
            </Button>
          </>
        }
      >
        <form id="create-account" onSubmit={onCreate} noValidate className="space-y-4">
          <Field label="Nama lengkap" error={errors.full_name} htmlFor="n-name" required>
            <Input id="n-name" value={fullName} invalid={!!errors.full_name} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Username" error={errors.username} hint="Huruf kecil, angka, titik, strip, underscore (3–30)." htmlFor="n-user" required>
            <Input id="n-user" autoCapitalize="none" value={username} invalid={!!errors.username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={!!creds}
        onClose={() => setCreds(null)}
        title={creds?.reset ? 'Password direset' : 'Akun dibuat'}
        footer={<Button onClick={() => setCreds(null)}>Saya sudah menyimpannya</Button>}
      >
        {creds && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Berikan data ini ke <b>{creds.full_name}</b> secara pribadi. Password sementara <b>hanya ditampilkan sekali</b> dan tidak bisa dilihat lagi.
            </p>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Username</p>
              <p className="font-mono text-base font-bold text-slate-900">{creds.username}</p>
              <p className="mt-3 text-xs font-semibold text-slate-500">Password sementara</p>
              <p className="select-all break-all font-mono text-lg font-bold tracking-wide text-brand-700">{creds.temp_password}</p>
            </div>
            <Button
              variant="soft"
              full
              icon={copied ? <Check size={16} /> : <Copy size={16} />}
              onClick={() => copy(`Username: ${creds.username}\nPassword sementara: ${creds.temp_password}`)}
            >
              {copied ? 'Tersalin' : 'Salin username & password'}
            </Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!resetTarget}
        title="Reset password?"
        message={`Password ${resetTarget?.full_name ?? ''} akan diganti dengan password sementara baru dan wajib diubah saat login berikutnya.`}
        confirmLabel="Reset password"
        danger
        loading={resetBusy}
        onConfirm={onReset}
        onClose={() => setResetTarget(null)}
      />
    </section>
  );
}

export default function SettingsPage() {
  const { profile, isAdmin } = useApp();
  const router = useRouter();
  const { reduced, setReduced } = useMotionPref();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await getSupabase().auth.signOut();
    } catch {
      /* lanjut */
    }
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Pengaturan" subtitle="Kelola akun dan preferensi tampilan." />

      <Card className="flex items-center gap-4 p-5">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-violet-600 text-xl font-extrabold text-white">
          {initials(profile.full_name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold text-slate-900">{profile.full_name}</p>
          <p className="text-sm text-slate-500">
            @{profile.username} · {profile.class_name}
          </p>
          {isAdmin && (
            <div className="mt-1.5">
              <Badge tone="violet">
                <ShieldCheck size={12} /> Admin
              </Badge>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <KeyRound size={18} className="text-brand-600" /> Ganti password
            </span>
          </SectionTitle>
          <Card className="p-5">
            <ChangePasswordForm />
          </Card>
        </section>

        <section>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand-600" /> Tampilan
            </span>
          </SectionTitle>
          <Card className="space-y-4 p-5">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span>
                <span className="block font-bold text-slate-800">Kurangi animasi</span>
                <span className="block text-sm text-slate-500">Matikan gerakan untuk menghemat baterai atau jika animasi terasa mengganggu.</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
                className="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-slate-300 transition-colors checked:bg-brand-600 relative before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition-transform before:content-[''] checked:before:translate-x-5"
              />
            </label>
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
              StudyFlow juga otomatis mengikuti pengaturan “Kurangi gerakan” dari perangkatmu.
            </p>
          </Card>

          <Button variant="secondary" full className="mt-4" icon={<LogOut size={17} />} loading={loggingOut} onClick={logout}>
            Keluar dari akun
          </Button>
        </section>
      </div>

      {isAdmin && <AccountsAdmin />}
    </div>
  );
}
