'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ActivityIcon } from '@/components/activity/ActivityIcon';
import { EmptyState } from '@/components/svg/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Fields';
import { Badge, Card, ErrorState, ListSkeleton, PageHeader, SubjectBadge } from '@/components/ui/misc';
import { ACTIVITY_META, HISTORY_TYPES } from '@/lib/constants';
import { formatClock, historyGroupLabel, isoToDateKey, jakartaNow } from '@/lib/date';
import { unwrap } from '@/lib/data';
import { getSupabase } from '@/lib/supabase/client';
import type { ActivityLog, ActivityType, Subject } from '@/lib/types';
import { useQuery } from '@/lib/use-query';

type Tab = 'semua' | 'lks' | 'tugas' | 'buku';

const TABS: { value: Tab; label: string; types: ActivityType[] | null }[] = [
  { value: 'semua', label: 'Semua', types: null },
  { value: 'lks', label: 'LKS', types: ['lks_returned'] },
  { value: 'tugas', label: 'Tugas', types: ['task_done', 'task_submitted'] },
  { value: 'buku', label: 'Buku', types: ['book_packed', 'book_unpacked', 'book_reset'] },
];

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>('semua');
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Dukung tautan dari LKS Tracker: /riwayat?tab=lks
  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('tab');
      if (t === 'lks' || t === 'tugas' || t === 'buku') setTab(t);
    } catch {
      /* abaikan */
    }
  }, []);

  const { data, error, loading, reload } = useQuery(async () => {
    const sb = getSupabase();
    const [logs, returned, subs] = await Promise.all([
      sb
        .from('activity_logs')
        .select('*')
        .in('type', HISTORY_TYPES.filter((t) => t !== 'lks_returned'))
        .order('created_at', { ascending: false })
        .limit(500),
      sb
        .from('lks_tracker')
        .select('id, user_id, title, subject_id, completed_at')
        .eq('status', 'sudah_dikembalikan')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(300),
      sb.from('subjects').select('*').order('name'),
    ]);
    // Sumber LKS selesai = tabel lks_tracker (tanggal penyelesaian tersimpan permanen di sana).
    const lksEntries: ActivityLog[] = ((unwrap(returned) ?? []) as {
      id: string;
      user_id: string;
      title: string;
      subject_id: string | null;
      completed_at: string;
    }[]).map((l) => ({
      id: `lks-${l.id}`,
      user_id: l.user_id,
      type: 'lks_returned',
      entity_type: 'lks',
      entity_id: l.id,
      subject_id: l.subject_id,
      title: l.title,
      detail: 'LKS sudah dikembalikan & selesai',
      created_at: l.completed_at,
    }));
    const all = [...((unwrap(logs) ?? []) as ActivityLog[]), ...lksEntries].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { entries: all, subjects: unwrap(subs) as Subject[] };
  });

  const subjectMap = useMemo(() => new Map((data?.subjects ?? []).map((s) => [s.id, s])), [data]);
  const todayKey = jakartaNow().dateKey;

  const filtered = useMemo(() => {
    const types = TABS.find((t) => t.value === tab)?.types ?? null;
    const q = search.trim().toLowerCase();
    return (data?.entries ?? []).filter((e) => {
      if (types && !types.includes(e.type)) return false;
      if (subject && e.subject_id !== subject) return false;
      const key = isoToDateKey(e.created_at);
      if (from && key < from) return false;
      if (to && key > to) return false;
      if (q && !`${e.title} ${e.detail ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, tab, search, subject, from, to]);

  const groups = useMemo(() => {
    const map = new Map<string, ActivityLog[]>();
    for (const e of filtered) {
      const key = isoToDateKey(e.created_at);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.entries()];
  }, [filtered]);

  const filtersActive = !!(search || subject || from || to);

  return (
    <div>
      <PageHeader title="Riwayat" subtitle="LKS yang sudah dikembalikan, tugas selesai/dikumpulkan, dan aktivitas checklist buku." />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Jenis riwayat">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`chip shrink-0 ${tab === t.value ? 'bg-brand-600 text-white shadow-glow' : 'bg-white text-slate-600 shadow-soft hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_9.5rem_9.5rem]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input type="search" aria-label="Cari riwayat" placeholder="Cari judul…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select aria-label="Filter mata pelajaran" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">Semua mapel</option>
          {(data?.subjects ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Input type="date" aria-label="Dari tanggal" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" aria-label="Sampai tanggal" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <ListSkeleton rows={4} />
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            title={filtersActive ? 'Tidak ada riwayat yang cocok' : 'Riwayat masih kosong'}
            description={filtersActive ? 'Coba ubah kata kunci, mapel, atau rentang tanggal.' : 'LKS yang dikembalikan, tugas selesai, dan aktivitas buku akan muncul di sini.'}
            action={
              filtersActive ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setSubject('');
                    setFrom('');
                    setTo('');
                  }}
                >
                  Reset filter
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([dateKey, entries]) => (
            <section key={dateKey}>
              <h2 className="mb-2 px-1 text-sm font-extrabold text-slate-500">{historyGroupLabel(dateKey, todayKey)}</h2>
              <Card className="divide-y divide-slate-100">
                {entries.map((e) => {
                  const meta = ACTIVITY_META[e.type];
                  return (
                    <div key={e.id} className="flex items-center gap-3 p-4">
                      <ActivityIcon type={e.type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-800">{e.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          <SubjectBadge subject={e.subject_id ? subjectMap.get(e.subject_id) : null} />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-slate-400">{formatClock(e.created_at)}</span>
                    </div>
                  );
                })}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
