'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { AnimatedCheck } from '@/components/svg/AnimatedCheck';
import { EmptyState } from '@/components/svg/EmptyState';
import { ProgressRing } from '@/components/svg/ProgressRing';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Fields';
import { useToast } from '@/components/ui/Toast';
import { Card, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/misc';
import { useApp } from '@/lib/app-context';
import { DAYS, DAY_NAMES } from '@/lib/constants';
import { dateKeyForDow, formatDateLong, schoolTarget } from '@/lib/date';
import { friendlyError, logActivity, unwrap } from '@/lib/data';
import { getSupabase } from '@/lib/supabase/client';
import type { BookCheck, BookStatus, ScheduleItem, Subject } from '@/lib/types';
import { useNow } from '@/lib/use-now';
import { useQuery } from '@/lib/use-query';

export default function BooksPage() {
  const { profile } = useApp();
  const toast = useToast();
  const now = useNow();
  const target = now ? schoolTarget(now) : null;

  const [pickedDow, setPickedDow] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const dow = pickedDow ?? target?.dow ?? 1;
  const dateKey = now ? (pickedDow ? dateKeyForDow(now, pickedDow) : target!.dateKey) : null;

  const { data, error, loading, reload, setData } = useQuery(
    async () => {
      const sb = getSupabase();
      const [sched, checks] = await Promise.all([
        sb.from('schedules').select('*, subjects(*)').eq('day_of_week', dow).order('start_time'),
        sb.from('book_checklists').select('*').eq('check_date', dateKey!),
      ]);
      return { schedule: unwrap(sched) as ScheduleItem[], checks: unwrap(checks) as BookCheck[] };
    },
    [dow, dateKey],
    !!dateKey,
  );

  const books = useMemo(() => {
    const seen = new Set<string>();
    const list: Subject[] = [];
    for (const it of data?.schedule ?? []) {
      if (it.subjects && !seen.has(it.subject_id)) {
        seen.add(it.subject_id);
        list.push(it.subjects);
      }
    }
    return list;
  }, [data]);

  const packed = useMemo(
    () => new Set((data?.checks ?? []).filter((c) => c.status === 'sudah_dimasukkan').map((c) => c.subject_id)),
    [data],
  );
  const packedCount = books.filter((b) => packed.has(b.id)).length;
  const percent = books.length ? (packedCount / books.length) * 100 : 0;

  function applyLocal(subjectId: string, status: BookStatus) {
    setData((d) => {
      if (!d || !dateKey) return d;
      const exists = d.checks.some((c) => c.subject_id === subjectId);
      const checks = exists
        ? d.checks.map((c) => (c.subject_id === subjectId ? { ...c, status } : c))
        : [...d.checks, { id: `tmp-${subjectId}`, user_id: profile.id, subject_id: subjectId, check_date: dateKey, status }];
      return { ...d, checks };
    });
  }

  async function toggle(subject: Subject) {
    if (!dateKey) return;
    const next: BookStatus = packed.has(subject.id) ? 'belum_disiapkan' : 'sudah_dimasukkan';
    setBusy(subject.id);
    applyLocal(subject.id, next);
    try {
      const sb = getSupabase();
      const { error: upErr } = await sb
        .from('book_checklists')
        .upsert(
          { user_id: profile.id, subject_id: subject.id, check_date: dateKey, status: next },
          { onConflict: 'user_id,subject_id,check_date' },
        );
      if (upErr) throw new Error(upErr.message);
      await logActivity(sb, profile.id, {
        type: next === 'sudah_dimasukkan' ? 'book_packed' : 'book_unpacked',
        entity_type: 'book',
        subject_id: subject.id,
        title: subject.book_name,
        detail: formatDateLong(dateKey),
      });
    } catch (err) {
      applyLocal(subject.id, next === 'sudah_dimasukkan' ? 'belum_disiapkan' : 'sudah_dimasukkan');
      toast.error(friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  async function resetAll() {
    if (!dateKey) return;
    setResetBusy(true);
    try {
      const sb = getSupabase();
      const { error: upErr } = await sb
        .from('book_checklists')
        .update({ status: 'belum_disiapkan' })
        .eq('check_date', dateKey)
        .eq('status', 'sudah_dimasukkan');
      if (upErr) throw new Error(upErr.message);
      await logActivity(sb, profile.id, {
        type: 'book_reset',
        entity_type: 'book',
        title: `Reset checklist ${DAY_NAMES[dow]}`,
        detail: formatDateLong(dateKey),
      });
      toast.success('Checklist di-reset. Riwayat tetap tersimpan.');
      setConfirmReset(false);
      reload();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Checklist Buku"
        subtitle={dateKey ? `Untuk ${formatDateLong(dateKey)}` : 'Menyiapkan tanggal…'}
        actions={
          <>
            <div className="w-40">
              <Select aria-label="Pilih hari" value={dow} onChange={(e) => setPickedDow(Number(e.target.value))}>
                {DAYS.map((d) => (
                  <option key={d.dow} value={d.dow}>
                    {d.name}
                    {target && d.dow === target.dow ? ' (berikutnya)' : ''}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="secondary" icon={<RotateCcw size={16} />} disabled={packedCount === 0} onClick={() => setConfirmReset(true)}>
              Reset
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <ListSkeleton rows={4} />
      ) : books.length === 0 ? (
        <Card>
          <EmptyState title={`Tidak ada pelajaran hari ${DAY_NAMES[dow]}`} description="Belum ada buku yang perlu disiapkan untuk hari ini." />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
          <ul className="space-y-3">
            {books.map((b) => {
              const isPacked = packed.has(b.id);
              return (
                <motion.li key={b.id} layout="position">
                  <button
                    type="button"
                    disabled={busy === b.id}
                    onClick={() => toggle(b)}
                    aria-pressed={isPacked}
                    className={`card flex w-full items-center gap-4 p-4 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-brand-200 ${
                      isPacked ? '!border-emerald-200 !bg-emerald-50/50' : 'hover:-translate-y-0.5'
                    }`}
                  >
                    <AnimatedCheck checked={isPacked} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold ${isPacked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{b.book_name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                        {b.name}
                      </p>
                    </div>
                    <span className={`text-xs font-bold ${isPacked ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isPacked ? 'Sudah dimasukkan' : 'Belum disiapkan'}
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ul>

          <aside>
            <Card className="flex flex-col items-center gap-3 p-6 text-center">
              <ProgressRing value={percent} size={120} stroke={12} label="Buku sudah dimasukkan ke tas">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {packedCount}/{books.length}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">buku</p>
                </div>
              </ProgressRing>
              <p className="text-sm font-semibold text-slate-600">
                {packedCount === books.length ? 'Tas sudah siap! 🎒' : `${books.length - packedCount} buku lagi yang perlu dimasukkan`}
              </p>
            </Card>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Reset checklist?"
        message={`Semua centang untuk hari ${DAY_NAMES[dow]} dikembalikan ke "Belum disiapkan". Riwayat aktivitas buku tetap tersimpan.`}
        confirmLabel="Reset"
        loading={resetBusy}
        onConfirm={resetAll}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}
