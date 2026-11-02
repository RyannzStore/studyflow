import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/misc';
import { formatTime, timeToMinutes } from '@/lib/date';
import type { ScheduleItem } from '@/lib/types';

export type LessonState = 'now' | 'next' | 'done';

/** Tentukan pelajaran yang sedang berlangsung / berikutnya / sudah lewat (items harus urut jam mulai). */
export function computeLessonStates(items: ScheduleItem[], nowMinutes: number | null): Record<string, LessonState> {
  const out: Record<string, LessonState> = {};
  if (nowMinutes === null) return out;
  let nextAssigned = false;
  for (const it of items) {
    const start = timeToMinutes(it.start_time);
    const end = timeToMinutes(it.end_time);
    if (nowMinutes >= start && nowMinutes < end) out[it.id] = 'now';
    else if (nowMinutes >= end) out[it.id] = 'done';
    else if (!nextAssigned) {
      out[it.id] = 'next';
      nextAssigned = true;
    }
  }
  return out;
}

export function LessonRow({
  item,
  state,
  actions,
}: {
  item: ScheduleItem;
  state?: LessonState;
  actions?: ReactNode;
}) {
  const color = item.subjects?.color ?? '#6366f1';
  return (
    <li
      className={`flex items-stretch gap-3 rounded-3xl border p-3.5 transition sm:gap-4 sm:p-4 ${
        state === 'now' ? 'border-brand-200 bg-brand-50/70 shadow-soft' : 'border-slate-100 bg-white'
      } ${state === 'done' ? 'opacity-60' : ''}`}
    >
      <div className="flex w-14 shrink-0 flex-col items-center justify-center text-center sm:w-16">
        <span className="text-sm font-extrabold text-slate-800">{formatTime(item.start_time)}</span>
        <span className="my-0.5 h-3 w-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400">{formatTime(item.end_time)}</span>
      </div>
      <span className="w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold leading-snug text-slate-900">{item.subjects?.name ?? 'Mata pelajaran'}</h3>
          {state === 'now' && <Badge tone="indigo">Sedang berlangsung</Badge>}
          {state === 'next' && <Badge tone="amber">Berikutnya</Badge>}
        </div>
        <p className="mt-1 text-sm text-slate-500">{item.teacher}</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
          <MapPin size={13} />
          {item.room}
        </p>
      </div>
      {actions && <div className="flex shrink-0 items-start gap-1">{actions}</div>}
    </li>
  );
}
