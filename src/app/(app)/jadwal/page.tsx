'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { LessonRow, computeLessonStates } from '@/components/schedule/LessonRow';
import { CalendarSvg } from '@/components/svg/CalendarSvg';
import { EmptyState } from '@/components/svg/EmptyState';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Fields';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Card, ErrorState, PageHeader, Skeleton } from '@/components/ui/misc';
import { useApp } from '@/lib/app-context';
import { DAYS, DAY_NAMES, DEFAULT_ROOM } from '@/lib/constants';
import { dateKeyForDow, formatDayMonth, formatTime, timeToMinutes } from '@/lib/date';
import { friendlyError, unwrap } from '@/lib/data';
import { getSupabase } from '@/lib/supabase/client';
import type { ScheduleItem, Subject } from '@/lib/types';
import { useNow } from '@/lib/use-now';
import { useQuery } from '@/lib/use-query';
import { hasErrors, validateRequired } from '@/lib/validators';

interface FormState {
  id: string | null;
  day_of_week: string;
  subject_id: string;
  start_time: string;
  end_time: string;
  teacher: string;
  room: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  day_of_week: '1',
  subject_id: '',
  start_time: '12:30',
  end_time: '13:30',
  teacher: '',
  room: DEFAULT_ROOM,
};

export default function SchedulePage() {
  const { isAdmin } = useApp();
  const toast = useToast();
  const now = useNow();

  const [selectedDow, setSelectedDow] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ScheduleItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data, error, loading, reload } = useQuery(async () => {
    const sb = getSupabase();
    const [sched, subs] = await Promise.all([
      sb.from('schedules').select('*, subjects(*)').order('day_of_week').order('start_time'),
      sb.from('subjects').select('*').order('name'),
    ]);
    return { schedule: unwrap(sched) as ScheduleItem[], subjects: unwrap(subs) as Subject[] };
  });

  // Hari terpilih: default = hari ini (Minggu → Senin)
  const todayDow = now ? (now.dow <= 6 ? now.dow : 1) : 1;
  const dow = selectedDow ?? todayDow;
  const dayItems = useMemo(() => (data?.schedule ?? []).filter((s) => s.day_of_week === dow), [data, dow]);
  const isTodaySelected = !!now && now.dow === dow;
  const states = isTodaySelected && now ? computeLessonStates(dayItems, now.minutes) : {};
  const calendarKey = now ? dateKeyForDow(now, dow) : null;

  const totalMinutes = dayItems.reduce((sum, it) => sum + (timeToMinutes(it.end_time) - timeToMinutes(it.start_time)), 0);

  function openNew() {
    setErrors({});
    setForm({ ...EMPTY_FORM, day_of_week: String(dow), subject_id: data?.subjects[0]?.id ?? '' });
  }

  function openEdit(item: ScheduleItem) {
    setErrors({});
    setForm({
      id: item.id,
      day_of_week: String(item.day_of_week),
      subject_id: item.subject_id,
      start_time: formatTime(item.start_time),
      end_time: formatTime(item.end_time),
      teacher: item.teacher,
      room: item.room,
    });
  }

  function onSubjectChange(subjectId: string) {
    if (!form) return;
    // Bantu isi nama guru dari jadwal yang sudah ada untuk mapel yang sama
    const known = data?.schedule.find((s) => s.subject_id === subjectId)?.teacher;
    setForm({ ...form, subject_id: subjectId, teacher: form.teacher || known || '' });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const errs: Record<string, string | null> = {
      subject: form.subject_id ? null : 'Pilih mata pelajaran.',
      start: form.start_time ? null : 'Jam mulai wajib diisi.',
      end: !form.end_time
        ? 'Jam selesai wajib diisi.'
        : form.start_time && timeToMinutes(form.end_time) <= timeToMinutes(form.start_time)
          ? 'Jam selesai harus setelah jam mulai.'
          : null,
      teacher: validateRequired(form.teacher, 'Nama guru', 1, 100),
      room: validateRequired(form.room, 'Ruang', 1, 40),
    };
    setErrors(errs);
    if (hasErrors(errs)) return;

    setSaving(true);
    try {
      const sb = getSupabase();
      const payload = {
        day_of_week: Number(form.day_of_week),
        subject_id: form.subject_id,
        start_time: form.start_time,
        end_time: form.end_time,
        teacher: form.teacher.trim(),
        room: form.room.trim(),
      };
      const res = form.id
        ? await sb.from('schedules').update(payload).eq('id', form.id)
        : await sb.from('schedules').insert(payload);
      if (res.error) throw new Error(res.error.message);
      toast.success(form.id ? 'Jadwal diperbarui.' : 'Pelajaran ditambahkan.');
      setSelectedDow(Number(form.day_of_week));
      setForm(null);
      reload();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const { error: delError } = await getSupabase().from('schedules').delete().eq('id', deleting.id);
      if (delError) throw new Error(delError.message);
      toast.success('Pelajaran dihapus dari jadwal.');
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
        title="Jadwal Pelajaran"
        subtitle={`Kelas X TKJ 1 · semua pelajaran di ${DEFAULT_ROOM}`}
        actions={
          isAdmin ? (
            <>
              <Button variant={editMode ? 'soft' : 'secondary'} icon={<Pencil size={16} />} onClick={() => setEditMode((v) => !v)}>
                {editMode ? 'Selesai edit' : 'Edit jadwal'}
              </Button>
              {editMode && (
                <Button icon={<Plus size={18} />} onClick={openNew}>
                  Tambah pelajaran
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      {/* Tab hari */}
      <div role="tablist" aria-label="Pilih hari" className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {DAYS.map((d) => {
          const active = d.dow === dow;
          const isToday = now?.dow === d.dow;
          return (
            <button
              key={d.dow}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedDow(d.dow)}
              className={`relative flex min-w-[4.5rem] flex-1 flex-col items-center rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                active ? 'text-white' : 'bg-white text-slate-600 shadow-soft hover:bg-slate-50'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="day-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{d.name}</span>
              {isToday && <span className={`relative mt-0.5 text-[10px] font-bold ${active ? 'text-indigo-100' : 'text-brand-500'}`}>Hari ini</span>}
            </button>
          );
        })}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
          <section aria-live="polite">
            {loading || !data ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 !rounded-3xl" />
                ))}
              </div>
            ) : dayItems.length === 0 ? (
              <Card>
                <EmptyState
                  title={`Tidak ada pelajaran hari ${DAY_NAMES[dow]}`}
                  description={isAdmin ? 'Aktifkan "Edit jadwal" untuk menambahkan pelajaran.' : 'Jadwal hari ini belum diisi.'}
                />
              </Card>
            ) : (
              <motion.ul key={dow} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
                {dayItems.map((item) => (
                  <LessonRow
                    key={item.id}
                    item={item}
                    state={states[item.id]}
                    actions={
                      isAdmin && editMode ? (
                        <>
                          <IconButton label="Edit pelajaran" onClick={() => openEdit(item)}>
                            <Pencil size={17} />
                          </IconButton>
                          <IconButton label="Hapus pelajaran" onClick={() => setDeleting(item)} className="hover:!bg-rose-50 hover:!text-rose-600">
                            <Trash2 size={17} />
                          </IconButton>
                        </>
                      ) : undefined
                    }
                  />
                ))}
              </motion.ul>
            )}
          </section>

          <aside className="order-first lg:order-none">
            <Card className="flex items-center gap-4 p-4 lg:flex-col lg:p-6 lg:text-center">
              {calendarKey ? <CalendarSvg dateKey={calendarKey} size={92} /> : <Skeleton className="h-[92px] w-[92px]" />}
              <div>
                <p className="text-lg font-extrabold text-slate-900">{DAY_NAMES[dow]}</p>
                {calendarKey && <p className="text-sm font-semibold text-slate-500">{formatDayMonth(calendarKey)}</p>}
                <p className="mt-2 text-sm text-slate-500">
                  {dayItems.length} pelajaran
                  {dayItems.length > 0 && ` · ${Math.floor(totalMinutes / 60)} j ${totalMinutes % 60} m`}
                </p>
                {dayItems.length > 0 && (
                  <p className="text-xs font-semibold text-slate-400">
                    {formatTime(dayItems[0].start_time)} – {formatTime(dayItems[dayItems.length - 1].end_time)}
                  </p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      )}

      {/* ---------- Form admin ---------- */}
      <Modal
        open={!!form}
        onClose={() => !saving && setForm(null)}
        title={form?.id ? 'Edit pelajaran' : 'Tambah pelajaran'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" form="schedule-form" loading={saving}>
              Simpan
            </Button>
          </>
        }
      >
        {form && (
          <form id="schedule-form" onSubmit={onSave} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hari" htmlFor="sc-day" required>
                <Select id="sc-day" value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
                  {DAYS.map((d) => (
                    <option key={d.dow} value={d.dow}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Ruang" error={errors.room} htmlFor="sc-room" required>
                <Input id="sc-room" value={form.room} invalid={!!errors.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
              </Field>
            </div>
            <Field label="Mata pelajaran" error={errors.subject} htmlFor="sc-subject" required>
              <Select id="sc-subject" value={form.subject_id} invalid={!!errors.subject} onChange={(e) => onSubjectChange(e.target.value)}>
                <option value="">Pilih mata pelajaran…</option>
                {(data?.subjects ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jam mulai" error={errors.start} htmlFor="sc-start" required>
                <Input id="sc-start" type="time" value={form.start_time} invalid={!!errors.start} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </Field>
              <Field label="Jam selesai" error={errors.end} htmlFor="sc-end" required>
                <Input id="sc-end" type="time" value={form.end_time} invalid={!!errors.end} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </Field>
            </div>
            <Field label="Nama guru" error={errors.teacher} htmlFor="sc-teacher" required>
              <Input id="sc-teacher" value={form.teacher} invalid={!!errors.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
            </Field>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Hapus pelajaran?"
        message={`"${deleting?.subjects?.name ?? 'Pelajaran'}" (${deleting ? formatTime(deleting.start_time) : ''}) akan dihapus dari jadwal untuk semua murid.`}
        confirmLabel="Hapus"
        danger
        loading={deleteBusy}
        onConfirm={onDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
