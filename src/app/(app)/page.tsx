'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Backpack, FileCheck2, ListTodo } from 'lucide-react';
import { ActivityIcon } from '@/components/activity/ActivityIcon';
import { LessonRow, computeLessonStates } from '@/components/schedule/LessonRow';
import { AnimatedCheck } from '@/components/svg/AnimatedCheck';
import { CalendarSvg } from '@/components/svg/CalendarSvg';
import { EmptyState } from '@/components/svg/EmptyState';
import { FloatingIcons } from '@/components/svg/FloatingIcons';
import { ProgressRing } from '@/components/svg/ProgressRing';
import { Badge, Card, ErrorState, SectionTitle, Skeleton } from '@/components/ui/misc';
import { useApp } from '@/lib/app-context';
import {
  ACTIVITY_META,
  DAY_NAMES,
  LKS_UNSUBMITTED,
  TASK_FINISHED,
  TASK_PENDING,
  TONE_CLASSES,
  announcementMeta,
  type Tone,
} from '@/lib/constants';
import { firstName, formatDateLong, formatRelativeTime, greeting, schoolTarget } from '@/lib/date';
import { getSupabase } from '@/lib/supabase/client';
import type { ActivityLog, Announcement, ScheduleItem } from '@/lib/types';
import { useNow } from '@/lib/use-now';
import { useQuery } from '@/lib/use-query';

interface DashboardData {
  schedule: ScheduleItem[];
  pendingTasks: number;
  totalTasks: number;
  finishedTasks: number;
  unsubmittedLks: number;
  packedIds: string[];
  announcements: Announcement[];
  activities: ActivityLog[];
}

function StatCard({
  href,
  icon,
  label,
  value,
  tone,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      className="card group flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-soft-lg sm:p-5"
    >
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${TONE_CLASSES[tone]}`}>{icon}</span>
      <div>
        <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { profile } = useApp();
  const now = useNow();
  const target = now ? schoolTarget(now) : null;

  const { data, error, loading, reload } = useQuery<DashboardData>(
    async () => {
      if (!target) throw new Error('Tanggal belum siap.');
      const sb = getSupabase();
      const [sched, pending, unsub, total, finished, books, ann, acts] = await Promise.all([
        sb.from('schedules').select('*, subjects(*)').eq('day_of_week', target.dow).order('start_time'),
        sb.from('tasks').select('id', { count: 'exact', head: true }).in('status', TASK_PENDING),
        sb.from('lks_tracker').select('id', { count: 'exact', head: true }).in('status', LKS_UNSUBMITTED),
        sb.from('tasks').select('id', { count: 'exact', head: true }),
        sb.from('tasks').select('id', { count: 'exact', head: true }).in('status', TASK_FINISHED),
        sb.from('book_checklists').select('subject_id, status').eq('check_date', target.dateKey),
        sb.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
        sb.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      for (const r of [sched, pending, unsub, total, finished, books, ann, acts]) {
        if (r.error) throw new Error(r.error.message);
      }
      const packedIds = ((books.data ?? []) as { subject_id: string; status: string }[])
        .filter((b) => b.status === 'sudah_dimasukkan')
        .map((b) => b.subject_id);
      return {
        schedule: (sched.data ?? []) as ScheduleItem[],
        pendingTasks: pending.count ?? 0,
        totalTasks: total.count ?? 0,
        finishedTasks: finished.count ?? 0,
        unsubmittedLks: unsub.count ?? 0,
        packedIds,
        announcements: (ann.data ?? []) as Announcement[],
        activities: (acts.data ?? []) as ActivityLog[],
      };
    },
    [target?.dateKey],
    !!target,
  );

  // Buku unik untuk hari target (urut sesuai jadwal)
  const books = (() => {
    if (!data) return [];
    const seen = new Set<string>();
    const list: NonNullable<ScheduleItem['subjects']>[] = [];
    for (const it of data.schedule) {
      if (it.subjects && !seen.has(it.subject_id)) {
        seen.add(it.subject_id);
        list.push(it.subjects);
      }
    }
    return list;
  })();
  const toBring = data ? books.filter((b) => !data.packedIds.includes(b.id)) : [];
  const lessonStates = data && target?.isToday && now ? computeLessonStates(data.schedule, now.minutes) : {};
  const percent = data && data.totalTasks > 0 ? (data.finishedTasks / data.totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-600 via-brand-500 to-violet-600 p-6 text-white shadow-soft-lg sm:p-8">
        <FloatingIcons className="hidden opacity-50 md:block" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {now ? (
              <>
                <p className="text-sm font-semibold text-indigo-100">{formatDateLong(now.dateKey)}</p>
                <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
                  {greeting(now.minutes)}, {firstName(profile.full_name)}! 👋
                </h1>
                <p className="mt-2 text-[15px] text-indigo-100">
                  {!data
                    ? 'Menyiapkan harimu…'
                    : data.pendingTasks > 0
                      ? `Kamu punya ${data.pendingTasks} tugas yang belum selesai.`
                      : 'Semua tugas sudah beres. Mantap! 🎉'}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-4 w-40 !bg-white/20" />
                <Skeleton className="h-8 w-64 !bg-white/20" />
              </div>
            )}
          </div>
          {now && (
            <div className="shrink-0">
              <CalendarSvg dateKey={now.dateKey} size={96} />
            </div>
          )}
        </div>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          {/* ---------- Ringkasan ---------- */}
          <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Ringkasan">
            {loading || !data ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 !rounded-3xl" />)
            ) : (
              <>
                <StatCard href="/tugas" icon={<ListTodo size={22} />} label="Tugas belum selesai" value={data.pendingTasks} tone="indigo" />
                <StatCard href="/lks" icon={<FileCheck2 size={22} />} label="LKS belum dikumpulkan" value={data.unsubmittedLks} tone="rose" />
                <StatCard
                  href="/buku"
                  icon={<Backpack size={22} />}
                  label="Buku belum disiapkan"
                  value={books.length === 0 ? '–' : toBring.length}
                  tone="sky"
                />
                <Card className="flex items-center gap-3 p-4 sm:p-5">
                  <ProgressRing value={percent} size={76} stroke={9} label="Penyelesaian tugas" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Tugas selesai</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {data.finishedTasks} dari {data.totalTasks}
                    </p>
                  </div>
                </Card>
              </>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* ---------- Jadwal ---------- */}
            <section className="lg:col-span-2">
              <SectionTitle
                action={
                  <Link href="/jadwal" className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">
                    Semua jadwal <ArrowRight size={16} />
                  </Link>
                }
              >
                {target
                  ? target.isToday
                    ? `Jadwal hari ini · ${DAY_NAMES[target.dow]}`
                    : `Jadwal ${DAY_NAMES[target.dow]} (hari sekolah berikutnya)`
                  : 'Jadwal'}
              </SectionTitle>
              {loading || !data ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 !rounded-3xl" />
                  ))}
                </div>
              ) : data.schedule.length === 0 ? (
                <Card>
                  <EmptyState compact title="Belum ada jadwal" description="Jadwal untuk hari ini belum diisi oleh admin." />
                </Card>
              ) : (
                <ul className="space-y-3">
                  {data.schedule.map((item) => (
                    <LessonRow key={item.id} item={item} state={lessonStates[item.id]} />
                  ))}
                </ul>
              )}
            </section>

            <div className="space-y-6">
              {/* ---------- Buku ---------- */}
              <section>
                <SectionTitle
                  action={
                    <Link href="/buku" className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">
                      Checklist <ArrowRight size={16} />
                    </Link>
                  }
                >
                  Buku yang perlu dibawa
                </SectionTitle>
                <Card className="p-4">
                  {loading || !data ? (
                    <Skeleton className="h-24" />
                  ) : books.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">Tidak ada buku untuk hari ini.</p>
                  ) : toBring.length === 0 ? (
                    <div className="flex items-center gap-3 py-2">
                      <AnimatedCheck checked size={36} />
                      <div>
                        <p className="font-bold text-slate-800">Tas sudah siap! 🎒</p>
                        <p className="text-sm text-slate-500">Semua buku sudah dimasukkan.</p>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {toBring.slice(0, 6).map((b) => (
                        <li key={b.id} className="flex items-center gap-3">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{b.book_name}</span>
                        </li>
                      ))}
                      {toBring.length > 6 && (
                        <li className="text-xs font-semibold text-slate-400">+{toBring.length - 6} lainnya</li>
                      )}
                    </ul>
                  )}
                </Card>
              </section>

              {/* ---------- Pengumuman ---------- */}
              <section>
                <SectionTitle
                  action={
                    <Link href="/pengumuman" className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">
                      Lihat <ArrowRight size={16} />
                    </Link>
                  }
                >
                  Pengumuman terbaru
                </SectionTitle>
                <Card className="divide-y divide-slate-100">
                  {loading || !data ? (
                    <div className="p-4">
                      <Skeleton className="h-20" />
                    </div>
                  ) : data.announcements.length === 0 ? (
                    <p className="p-5 text-center text-sm text-slate-500">Belum ada pengumuman.</p>
                  ) : (
                    data.announcements.map((a) => {
                      const meta = announcementMeta(a.category);
                      return (
                        <Link key={a.id} href="/pengumuman" className="block p-4 transition hover:bg-slate-50/70">
                          <div className="flex items-center gap-2">
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                            <span className="text-xs text-slate-400">{formatRelativeTime(a.created_at)}</span>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-sm font-bold text-slate-800">{a.title}</p>
                        </Link>
                      );
                    })
                  )}
                </Card>
              </section>
            </div>
          </div>

          {/* ---------- Aktivitas ---------- */}
          <section>
            <SectionTitle
              action={
                <Link href="/riwayat" className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">
                  Riwayat <ArrowRight size={16} />
                </Link>
              }
            >
              Aktivitas terakhir
            </SectionTitle>
            <Card className="divide-y divide-slate-100">
              {loading || !data ? (
                <div className="p-4">
                  <Skeleton className="h-20" />
                </div>
              ) : data.activities.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">
                  Belum ada aktivitas. Mulai dengan menambah tugas atau mencentang buku.
                </p>
              ) : (
                data.activities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-4">
                    <ActivityIcon type={a.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{a.title}</p>
                      <p className="text-xs text-slate-500">{ACTIVITY_META[a.type]?.label ?? a.type}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-400">{formatRelativeTime(a.created_at)}</span>
                  </div>
                ))
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
