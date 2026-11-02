'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CalendarClock, Check, History, Pencil, Plus, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/svg/EmptyState';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Fields';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Badge, Card, ErrorState, ListSkeleton, PageHeader, SubjectBadge } from '@/components/ui/misc';
import { useApp } from '@/lib/app-context';
import { LKS_STATUSES, lksStatusIndex } from '@/lib/constants';
import { deadlineInfo, formatDateShort, jakartaNow } from '@/lib/date';
import { friendlyError, logActivity, unwrap } from '@/lib/data';
import { getSupabase } from '@/lib/supabase/client';
import type { Lks, LksStatus, Subject } from '@/lib/types';
import { useQuery } from '@/lib/use-query';
import { hasErrors, validateMax, validateRequired } from '@/lib/validators';

interface FormState {
  id: string | null;
  title: string;
  subject_id: string;
  due_date: string;
  notes: string;
}

const EMPTY: FormState = { id: null, title: '', subject_id: '', due_date: '', notes: '' };
const LAST_INDEX = LKS_STATUSES.length - 1;

/** Stepper 6 tahap — titik terisi sampai tahap saat ini. */
function Stepper({ status }: { status: LksStatus }) {
  const idx = lksStatusIndex(status);
  return (
    <ol className="mt-4 flex items-start" aria-label="Alur status LKS">
      {LKS_STATUSES.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <li key={s.value} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" aria-current={current ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-transparent' : i <= idx ? 'bg-brand-500' : 'bg-slate-200'}`} />
              <motion.span
                initial={false}
                animate={{ scale: current ? 1.15 : 1 }}
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${
                  done ? 'bg-brand-500' : current ? 'bg-brand-500 ring-4 ring-brand-100' : 'bg-slate-200'
                }`}
              >
                {done && <Check size={12} strokeWidth={3.5} />}
              </motion.span>
              <span className={`h-1 flex-1 rounded-full ${i === LAST_INDEX ? 'bg-transparent' : i < idx ? 'bg-brand-500' : 'bg-slate-200'}`} />
            </div>
            <span className={`hidden text-center text-[10px] font-bold leading-tight sm:block ${current ? 'text-brand-700' : 'text-slate-400'}`}>
              {s.short}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function LksPage() {
  const { profile } = useApp();
  const toast = useToast();

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, error, loading, reload, setData } = useQuery(async () => {
    const sb = getSupabase();
    const [lks, subs] = await Promise.all([
      sb.from('lks_tracker').select('*').neq('status', 'sudah_dikembalikan').order('created_at', { ascending: false }),
      sb.from('subjects').select('*').order('name'),
    ]);
    return { items: unwrap(lks) as Lks[], subjects: unwrap(subs) as Subject[] };
  });

  const todayKey = jakartaNow().dateKey;
  const subjectMap = useMemo(() => new Map((data?.subjects ?? []).map((s) => [s.id, s])), [data]);

  const items = useMemo(
    () =>
      [...(data?.items ?? [])].sort((a, b) => {
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return b.created_at.localeCompare(a.created_at);
      }),
    [data],
  );

  function openNew() {
    setErrors({});
    setForm({ ...EMPTY });
  }

  function openEdit(l: Lks) {
    setErrors({});
    setForm({ id: l.id, title: l.title, subject_id: l.subject_id ?? '', due_date: l.due_date ?? '', notes: l.notes ?? '' });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const errs: Record<string, string | null> = {
      title: validateRequired(form.title, 'Nama LKS', 2, 120),
      notes: validateMax(form.notes, 'Catatan', 1000),
    };
    setErrors(errs);
    if (hasErrors(errs)) return;

    setSaving(true);
    try {
      const sb = getSupabase();
      const payload = {
        title: form.title.trim(),
        subject_id: form.subject_id || null,
        due_date: form.due_date || null,
        notes: form.notes.trim() || null,
      };
      if (form.id) {
        const { error: upErr } = await sb.from('lks_tracker').update(payload).eq('id', form.id);
        if (upErr) throw new Error(upErr.message);
        toast.success('LKS diperbarui.');
      } else {
        const { data: row, error: insErr } = await sb
          .from('lks_tracker')
          .insert({ ...payload, user_id: profile.id })
          .select('id')
          .single();
        if (insErr) throw new Error(insErr.message);
        await logActivity(sb, profile.id, {
          type: 'lks_created',
          entity_type: 'lks',
          entity_id: row?.id,
          subject_id: payload.subject_id,
          title: payload.title,
        });
        toast.success('LKS ditambahkan.');
      }
      setForm(null);
      reload();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function moveTo(l: Lks, status: LksStatus) {
    if (l.status === status) return;
    const returned = status === 'sudah_dikembalikan';
    setBusyId(l.id);
    const completed_at = returned ? new Date().toISOString() : null;
    const before = l;
    // Optimistic: bila dikembalikan, langsung hilang dari daftar aktif
    setData((d) =>
      d
        ? {
            ...d,
            items: returned ? d.items.filter((x) => x.id !== l.id) : d.items.map((x) => (x.id === l.id ? { ...x, status, completed_at } : x)),
          }
        : d,
    );
    try {
      const sb = getSupabase();
      const { error: upErr } = await sb.from('lks_tracker').update({ status, completed_at }).eq('id', l.id);
      if (upErr) throw new Error(upErr.message);
      const label = LKS_STATUSES.find((s) => s.value === status)?.label ?? status;
      await logActivity(sb, profile.id, {
        type: returned ? 'lks_returned' : 'lks_status',
        entity_type: 'lks',
        entity_id: l.id,
        subject_id: l.subject_id,
        title: l.title,
        detail: returned ? 'LKS sudah dikembalikan & selesai' : `Status → ${label}`,
      });
      if (returned) toast.success('LKS selesai dan dipindahkan ke Riwayat. 🎉');
    } catch (err) {
      setData((d) => (d ? { ...d, items: [before, ...d.items.filter((x) => x.id !== l.id)] } : d));
      toast.error(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="LKS Tracker"
        subtitle="Lacak perjalanan setiap LKS sampai dikembalikan oleh guru."
        actions={
          <>
            <Link
              href="/riwayat?tab=lks"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <History size={17} /> Riwayat LKS
            </Link>
            <Button icon={<Plus size={18} />} onClick={openNew}>
              Tambah LKS
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <ListSkeleton rows={3} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="Tidak ada LKS aktif"
            description="Semua LKS sudah selesai atau belum ada yang dicatat. LKS yang sudah dikembalikan tersimpan di Riwayat."
            action={
              <Button icon={<Plus size={18} />} onClick={openNew}>
                Tambah LKS
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((l) => {
              const subject = l.subject_id ? subjectMap.get(l.subject_id) : null;
              const idx = lksStatusIndex(l.status);
              const next = LKS_STATUSES[idx + 1];
              const prev = LKS_STATUSES[idx - 1];
              const dl = deadlineInfo(l.due_date, todayKey);
              const isLast = idx === LAST_INDEX - 1; // tahap sebelum "Sudah dikembalikan"
              return (
                <motion.li
                  key={l.id}
                  layout="position"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                  className="card p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold leading-snug text-slate-900">{l.title}</h3>
                        <SubjectBadge subject={subject} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                        {l.due_date && (
                          <span className="flex items-center gap-1">
                            <CalendarClock size={13} /> Batas {formatDateShort(l.due_date)}
                          </span>
                        )}
                        {l.due_date && <Badge tone={dl.tone === 'rose' ? 'rose' : dl.tone === 'amber' ? 'amber' : 'slate'}>{dl.label}</Badge>}
                      </div>
                      {l.notes && <p className="mt-1.5 line-clamp-2 text-sm italic text-slate-400">{l.notes}</p>}
                    </div>
                    <IconButton label="Edit LKS" onClick={() => openEdit(l)}>
                      <Pencil size={17} />
                    </IconButton>
                  </div>

                  <Stepper status={l.status} />

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <Badge tone={LKS_STATUSES[idx].tone}>{LKS_STATUSES[idx].label}</Badge>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      {prev && (
                        <Button size="sm" variant="ghost" icon={<Undo2 size={15} />} disabled={busyId === l.id} onClick={() => moveTo(l, prev.value)}>
                          Mundur
                        </Button>
                      )}
                      {next && (
                        <Button
                          size="sm"
                          variant={isLast ? 'primary' : 'soft'}
                          icon={isLast ? <Check size={16} /> : <ArrowRight size={16} />}
                          loading={busyId === l.id}
                          onClick={() => moveTo(l, next.value)}
                        >
                          {isLast ? 'Sudah dikembalikan' : next.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Modal
        open={!!form}
        onClose={() => !saving && setForm(null)}
        title={form?.id ? 'Edit LKS' : 'Tambah LKS'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" form="lks-form" loading={saving}>
              Simpan
            </Button>
          </>
        }
      >
        {form && (
          <form id="lks-form" onSubmit={onSave} noValidate className="space-y-4">
            <Field label="Nama LKS" error={errors.title} htmlFor="l-title" required>
              <Input id="l-title" placeholder="mis. LKS Matematika Bab 3" value={form.title} invalid={!!errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Mata pelajaran" htmlFor="l-subject">
              <Select id="l-subject" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                <option value="">— Pilih mapel —</option>
                {(data?.subjects ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Batas pengumpulan" htmlFor="l-due">
              <Input id="l-due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </Field>
            <Field label="Catatan" error={errors.notes} htmlFor="l-notes">
              <Textarea id="l-notes" rows={3} value={form.notes} invalid={!!errors.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <p className="rounded-2xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-800">
              LKS baru dimulai dari status “Belum dikerjakan”. Geser tahapnya lewat tombol di kartu LKS.
            </p>
          </form>
        )}
      </Modal>
    </div>
  );
}
