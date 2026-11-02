'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Pencil, Plus, Search, Trash2, User } from 'lucide-react';
import { AnimatedCheck } from '@/components/svg/AnimatedCheck';
import { EmptyState } from '@/components/svg/EmptyState';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Fields';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Badge, Card, ErrorState, ListSkeleton, PageHeader, SubjectBadge } from '@/components/ui/misc';
import { useApp } from '@/lib/app-context';
import { TASK_FINISHED, TASK_STATUSES, taskStatusMeta } from '@/lib/constants';
import { deadlineInfo, formatDateShort, jakartaNow } from '@/lib/date';
import { friendlyError, logActivity, unwrap } from '@/lib/data';
import { getSupabase } from '@/lib/supabase/client';
import type { Subject, Task, TaskStatus } from '@/lib/types';
import { useQuery } from '@/lib/use-query';
import { hasErrors, validateMax, validateRequired } from '@/lib/validators';

interface FormState {
  id: string | null;
  title: string;
  subject_id: string;
  teacher: string;
  instructions: string;
  given_date: string;
  deadline: string;
  notes: string;
  status: TaskStatus;
}

type SortKey = 'deadline_asc' | 'deadline_desc' | 'newest';

function emptyForm(): FormState {
  return {
    id: null,
    title: '',
    subject_id: '',
    teacher: '',
    instructions: '',
    given_date: jakartaNow().dateKey,
    deadline: '',
    notes: '',
    status: 'belum_dikerjakan',
  };
}

export default function TasksPage() {
  const { profile } = useApp();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState<SortKey>('deadline_asc');

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, error, loading, reload, setData } = useQuery(async () => {
    const sb = getSupabase();
    const [tasks, subs, sched] = await Promise.all([
      sb.from('tasks').select('*').order('created_at', { ascending: false }),
      sb.from('subjects').select('*').order('name'),
      sb.from('schedules').select('subject_id, teacher'),
    ]);
    const teachers: Record<string, string> = {};
    for (const s of (unwrap(sched) ?? []) as { subject_id: string; teacher: string }[]) {
      if (!teachers[s.subject_id]) teachers[s.subject_id] = s.teacher;
    }
    return { tasks: unwrap(tasks) as Task[], subjects: unwrap(subs) as Subject[], teachers };
  });

  const todayKey = jakartaNow().dateKey;
  const subjectMap = useMemo(() => new Map((data?.subjects ?? []).map((s) => [s.id, s])), [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (data?.tasks ?? []).filter((t) => {
      if (subjectFilter && t.subject_id !== subjectFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (q) {
        const hay = `${t.title} ${t.instructions ?? ''} ${t.notes ?? ''} ${t.teacher ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const cmpDeadline = (a: Task, b: Task, dir: 1 | -1) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1; // tanpa deadline selalu di bawah
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline) * dir;
    };
    return [...list].sort((a, b) => {
      if (sort === 'newest') return b.created_at.localeCompare(a.created_at);
      return cmpDeadline(a, b, sort === 'deadline_asc' ? 1 : -1);
    });
  }, [data, search, subjectFilter, statusFilter, sort]);

  const filtersActive = !!(search || subjectFilter || statusFilter);

  function openNew() {
    setErrors({});
    setForm(emptyForm());
  }

  function openEdit(t: Task) {
    setErrors({});
    setForm({
      id: t.id,
      title: t.title,
      subject_id: t.subject_id ?? '',
      teacher: t.teacher ?? '',
      instructions: t.instructions ?? '',
      given_date: t.given_date,
      deadline: t.deadline ?? '',
      notes: t.notes ?? '',
      status: t.status,
    });
  }

  function onSubjectChange(subjectId: string) {
    if (!form) return;
    const guess = data?.teachers[subjectId] ?? '';
    setForm({ ...form, subject_id: subjectId, teacher: form.teacher || guess });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const errs: Record<string, string | null> = {
      title: validateRequired(form.title, 'Nama tugas', 2, 120),
      teacher: validateMax(form.teacher, 'Nama guru', 100),
      instructions: validateMax(form.instructions, 'Instruksi', 2000),
      notes: validateMax(form.notes, 'Catatan', 1000),
      given_date: form.given_date ? null : 'Tanggal diberikan wajib diisi.',
      deadline: form.deadline && form.given_date && form.deadline < form.given_date ? 'Deadline tidak boleh sebelum tanggal diberikan.' : null,
    };
    setErrors(errs);
    if (hasErrors(errs)) return;

    setSaving(true);
    try {
      const sb = getSupabase();
      const prev = form.id ? data?.tasks.find((t) => t.id === form.id) : undefined;
      const finishedNow = TASK_FINISHED.includes(form.status);
      const payload = {
        title: form.title.trim(),
        subject_id: form.subject_id || null,
        teacher: form.teacher.trim() || null,
        instructions: form.instructions.trim() || null,
        given_date: form.given_date,
        deadline: form.deadline || null,
        notes: form.notes.trim() || null,
        status: form.status,
        completed_at: finishedNow ? (prev?.completed_at ?? new Date().toISOString()) : null,
      };

      if (form.id) {
        const { error: upErr } = await sb.from('tasks').update(payload).eq('id', form.id);
        if (upErr) throw new Error(upErr.message);
        if (prev && prev.status !== form.status) await logStatus(prev, form.status, payload.title);
        toast.success('Tugas diperbarui.');
      } else {
        const { data: row, error: insErr } = await sb.from('tasks').insert({ ...payload, user_id: profile.id }).select('id').single();
        if (insErr) throw new Error(insErr.message);
        await logActivity(sb, profile.id, {
          type: 'task_created',
          entity_type: 'task',
          entity_id: row?.id,
          subject_id: payload.subject_id,
          title: payload.title,
        });
        if (finishedNow) await logStatus({ id: row?.id ?? '', subject_id: payload.subject_id } as Task, form.status, payload.title);
        toast.success('Tugas ditambahkan.');
      }
      setForm(null);
      reload();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function logStatus(task: Pick<Task, 'id' | 'subject_id'>, status: TaskStatus, title: string) {
    if (status === 'selesai' || status === 'sudah_dikumpulkan') {
      await logActivity(getSupabase(), profile.id, {
        type: status === 'selesai' ? 'task_done' : 'task_submitted',
        entity_type: 'task',
        entity_id: task.id,
        subject_id: task.subject_id,
        title,
      });
    }
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    setBusyId(task.id);
    const before = task;
    const completed_at = TASK_FINISHED.includes(status) ? (task.completed_at ?? new Date().toISOString()) : null;
    setData((d) => (d ? { ...d, tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, status, completed_at } : t)) } : d));
    try {
      const { error: upErr } = await getSupabase().from('tasks').update({ status, completed_at }).eq('id', task.id);
      if (upErr) throw new Error(upErr.message);
      await logStatus(task, status, task.title);
      if (status === 'selesai') toast.success('Mantap, tugas selesai! 🎉');
    } catch (err) {
      setData((d) => (d ? { ...d, tasks: d.tasks.map((t) => (t.id === task.id ? before : t)) } : d));
      toast.error(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const { error: delErr } = await getSupabase().from('tasks').delete().eq('id', deleting.id);
      if (delErr) throw new Error(delErr.message);
      toast.success('Tugas dihapus.');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Katalog Tugas"
        subtitle="Catat semua tugas sekolah dan pantau deadline-nya."
        actions={
          <Button icon={<Plus size={18} />} onClick={openNew}>
            Tambah tugas
          </Button>
        }
      />

      {/* Filter */}
      <Card className="mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_12rem]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            aria-label="Cari tugas"
            placeholder="Cari nama, instruksi, catatan…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select aria-label="Filter mata pelajaran" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">Semua mapel</option>
          {(data?.subjects ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Filter status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Semua status</option>
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select aria-label="Urutkan" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="deadline_asc">Deadline terdekat</option>
          <option value="deadline_desc">Deadline terjauh</option>
          <option value="newest">Terbaru dibuat</option>
        </Select>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <ListSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <Card>
          {filtersActive ? (
            <EmptyState
              title="Tidak ada tugas yang cocok"
              description="Coba ubah kata kunci atau filter."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setSubjectFilter('');
                    setStatusFilter('');
                  }}
                >
                  Reset filter
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Belum ada tugas"
              description="Tambahkan tugas pertamamu supaya tidak ada deadline yang terlewat."
              action={
                <Button icon={<Plus size={18} />} onClick={openNew}>
                  Tambah tugas
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((t) => {
              const subject = t.subject_id ? subjectMap.get(t.subject_id) : null;
              const finished = TASK_FINISHED.includes(t.status);
              const dl = finished ? null : deadlineInfo(t.deadline, todayKey);
              const meta = taskStatusMeta(t.status);
              return (
                <motion.li
                  key={t.id}
                  layout="position"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className={`card flex gap-3 p-4 sm:gap-4 sm:p-5 ${finished ? 'bg-slate-50/60' : ''}`}
                >
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => changeStatus(t, finished ? 'belum_dikerjakan' : 'selesai')}
                    aria-label={finished ? 'Tandai belum selesai' : 'Tandai selesai'}
                    className="mt-0.5 h-8 w-8 shrink-0 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
                  >
                    <AnimatedCheck checked={finished} size={30} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`font-bold leading-snug ${finished ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</h3>
                      <SubjectBadge subject={subject} />
                    </div>

                    {t.instructions && <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{t.instructions}</p>}
                    {t.notes && <p className="mt-1 line-clamp-2 text-sm italic text-slate-400">Catatan: {t.notes}</p>}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
                      {t.teacher && (
                        <span className="flex items-center gap-1">
                          <User size={13} /> {t.teacher}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarClock size={13} /> Diberikan {formatDateShort(t.given_date)}
                      </span>
                      {dl ? (
                        <Badge tone={dl.tone === 'rose' ? 'rose' : dl.tone === 'amber' ? 'amber' : 'slate'}>Deadline: {dl.label}</Badge>
                      ) : t.deadline ? (
                        <span>Deadline {formatDateShort(t.deadline)}</span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Select
                        aria-label={`Status tugas ${t.title}`}
                        value={t.status}
                        disabled={busyId === t.id}
                        onChange={(e) => changeStatus(t, e.target.value as TaskStatus)}
                        className="!h-9 !w-auto !rounded-xl !py-0 !pl-3 !pr-9 !text-sm font-semibold"
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </Select>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                    <IconButton label="Edit tugas" onClick={() => openEdit(t)}>
                      <Pencil size={17} />
                    </IconButton>
                    <IconButton label="Hapus tugas" onClick={() => setDeleting(t)} className="hover:!bg-rose-50 hover:!text-rose-600">
                      <Trash2 size={17} />
                    </IconButton>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* Form */}
      <Modal
        open={!!form}
        onClose={() => !saving && setForm(null)}
        title={form?.id ? 'Edit tugas' : 'Tambah tugas'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" form="task-form" loading={saving}>
              Simpan tugas
            </Button>
          </>
        }
      >
        {form && (
          <form id="task-form" onSubmit={onSave} noValidate className="space-y-4">
            <Field label="Nama tugas" error={errors.title} htmlFor="t-title" required>
              <Input id="t-title" placeholder="mis. Hafalkan lagu" value={form.title} invalid={!!errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mata pelajaran" htmlFor="t-subject">
                <Select id="t-subject" value={form.subject_id} onChange={(e) => onSubjectChange(e.target.value)}>
                  <option value="">— Pilih mapel —</option>
                  {(data?.subjects ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Nama guru" error={errors.teacher} htmlFor="t-teacher">
                <Input id="t-teacher" value={form.teacher} invalid={!!errors.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
              </Field>
            </div>
            <Field label="Instruksi lengkap" error={errors.instructions} htmlFor="t-instr">
              <Textarea
                id="t-instr"
                placeholder="mis. Guru meminta murid menghafalkan lagu."
                value={form.instructions}
                invalid={!!errors.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal diberikan" error={errors.given_date} htmlFor="t-given" required>
                <Input id="t-given" type="date" value={form.given_date} invalid={!!errors.given_date} onChange={(e) => setForm({ ...form, given_date: e.target.value })} />
              </Field>
              <Field label="Deadline" error={errors.deadline} htmlFor="t-deadline">
                <Input id="t-deadline" type="date" value={form.deadline} invalid={!!errors.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </Field>
            </div>
            <Field label="Catatan" error={errors.notes} htmlFor="t-notes">
              <Textarea id="t-notes" rows={2} value={form.notes} invalid={!!errors.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <Field label="Status" htmlFor="t-status">
              <Select id="t-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Hapus tugas?"
        message={`Tugas "${deleting?.title ?? ''}" akan dihapus permanen. Riwayat aktivitas yang sudah tercatat tetap tersimpan.`}
        confirmLabel="Hapus"
        danger
        loading={deleteBusy}
        onConfirm={onDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
