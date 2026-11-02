import { Backpack, Check, FileCheck2, ListTodo, RefreshCw, RotateCcw, Send, type LucideIcon } from 'lucide-react';
import { ACTIVITY_META, TONE_CLASSES } from '@/lib/constants';
import type { ActivityType } from '@/lib/types';

const ICONS: Record<ActivityType, LucideIcon> = {
  task_created: ListTodo,
  task_done: Check,
  task_submitted: Send,
  lks_created: FileCheck2,
  lks_status: RefreshCw,
  lks_returned: FileCheck2,
  book_packed: Backpack,
  book_unpacked: Backpack,
  book_reset: RotateCcw,
};

export function ActivityIcon({ type, size = 20 }: { type: ActivityType; size?: number }) {
  const Icon = ICONS[type] ?? Check;
  const tone = ACTIVITY_META[type]?.tone ?? 'slate';
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${TONE_CLASSES[tone]}`}>
      <Icon size={size} />
    </span>
  );
}
