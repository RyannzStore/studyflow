'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Megaphone, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/svg/EmptyState';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Fields';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Badge, Card, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/misc';
import { useApp } from '@/lib/app-context';
import { ANNOUNCEMENT_CATEGORIES, announcementMeta } from '@/lib/constants';
import { formatClock, formatDateShort, isoToDateKey } from '@/lib/date';
import { friendlyError, unwrap } from '@/lib/data';
import { getSupabase } from '@/lib/supabase/client';
import type { Announcement, AnnouncementCategory } from '@/lib/types';
import { useQuery } from '@/lib/use-query';
import { hasErrors, validateRequired } from '@/lib/validators';

interface FormState {
  id: string | null;
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
}

const EMPTY: FormState = { id: null, title: '', body: '', category: 'kegiatan_kelas', pinned: false };

export default function AnnouncementsPage() {
  const { profile, isAdmin } = useApp();
  const toast = useToast();

  const [filter, setFilter] = useState<'' | AnnouncementCategory>('');
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data, error, loading, reload } = useQuery(async () => {
    const res = await getSupabase()
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    return unwrap(res) as Announcement[];
  });

  const list = useMemo(() => (data ?? []).filter((a) => !filter || a.category === filter), [data, filter]);

  function openNew() {
    setErrors({});
    setForm({ ...EMPTY });
  }

  function openEdit(a: Announcement) {
    setErrors({});
    setForm({ id: a.id, title: a.title, body: a.body, category: a.category, pinned: a.pinned });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const errs: Record<string, string | null> = {
      title: validateRequired(form.title, 'Judul', 2, 120),
      body: validateRequired(form.body, 'Isi pengumuman', 1, 3000),
    };
    setErrors(errs);
    if (hasErrors(errs)) return;

    setSaving(true);
    try {
      const sb = getSupabase();
      const payload = { title: form.title.trim(), body: form.body.trim(), category: form.category, pinned: form.pinned };
      const res = form.id
        ? await sb.from('announcements').update(payload).eq('id', form.id)
        : await sb.from('announcements').insert({ ...payload, author_id: profile.id, author_name: profile.full_name });
      if (res.error) throw new Error(res.error.message);
      toast.success(form.id ? 'Pengumuman diperbarui.' : 'Pengumuman dipublikasikan.');
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
      const { error: delErr } = await getSupabase().from('announcements').delete().eq('id', deleting.id);
      if (delErr) throw new Error(delErr.message);
      toast.success('Pengumuman dihapus.');
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
        title="Pengumuman Kelas"
        subtitle="Info perubahan jadwal, ulangan, tugas tambahan, dan kegiatan kelas."
        actions={
          isAdmin ? (
            <Button icon={<Plus size={18} />} onClick={openNew}>
              Buat pengumuman
            </Button>
          ) : undefined
        }
      />

      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter kategori">
        {[{ value: '' as const, label: 'Semua' }, ...ANNOUNCEMENT_CATEGORIES].map((c) => (
          <button
            key={c.value || 'all'}
            type="button"
            aria-pressed={filter === c.value}
            onClick={() => setFilter(c.value)}
            className={`chip shrink-0 ${filter === c.value ? 'bg-brand-600 text-white shadow-glow' : 'bg-white text-slate-600 shadow-soft hover:bg-slate-50'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <ListSkeleton rows={3} />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada pengumuman"
            description={filter ? 'Tidak ada pengumuman pada kategori ini.' : isAdmin ? 'Buat pengumuman pertama untuk kelas.' : 'Admin belum membuat pengumuman.'}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => {
            const meta = announcementMeta(a.category);
            return (
              <li key={a.id} className={`card p-4 sm:p-5 ${a.pinned ? '!border-brand-200 bg-brand-50/40' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Megaphone size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {a.pinned && (
                        <Badge tone="indigo">
                          <Pin size={11} /> Disematkan
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-2 font-bold leading-snug text-slate-900">{a.title}</h3>
                    <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-slate-600">{a.body}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      {a.author_name ?? 'Admin'} · {formatDateShort(isoToDateKey(a.created_at))}, {formatClock(a.created_at)}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                      <IconButton label="Edit pengumuman" onClick={() => openEdit(a)}>
                        <Pencil size={17} />
                      </IconButton>
                      <IconButton label="Hapus pengumuman" onClick={() => setDeleting(a)} className="hover:!bg-rose-50 hover:!text-rose-600">
                        <Trash2 size={17} />
                      </IconButton>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={!!form}
        onClose={() => !saving && setForm(null)}
        title={form?.id ? 'Edit pengumuman' : 'Buat pengumuman'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" form="ann-form" loading={saving}>
              {form?.id ? 'Simpan' : 'Publikasikan'}
            </Button>
          </>
        }
      >
        {form && (
          <form id="ann-form" onSubmit={onSave} noValidate className="space-y-4">
            <Field label="Judul" error={errors.title} htmlFor="a-title" required>
              <Input id="a-title" value={form.title} invalid={!!errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Kategori" htmlFor="a-cat">
              <Select id="a-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as AnnouncementCategory })}>
                {ANNOUNCEMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Isi pengumuman" error={errors.body} htmlFor="a-body" required>
              <Textarea id="a-body" rows={6} value={form.body} invalid={!!errors.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </Field>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                className="h-5 w-5 rounded accent-indigo-600"
              />
              Sematkan di bagian atas
            </label>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Hapus pengumuman?"
        message={`"${deleting?.title ?? ''}" akan dihapus untuk semua murid.`}
        confirmLabel="Hapus"
        danger
        loading={deleteBusy}
        onConfirm={onDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
