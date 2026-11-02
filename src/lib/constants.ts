import type {
  ActivityType,
  AnnouncementCategory,
  LksStatus,
  TaskStatus,
} from './types';

export const CLASS_NAME = 'X TKJ 1';
export const DEFAULT_ROOM = 'Ruang 16';

export type Tone = 'slate' | 'amber' | 'emerald' | 'indigo' | 'violet' | 'sky' | 'rose';

export const DAYS = [
  { dow: 1, name: 'Senin', short: 'Sen' },
  { dow: 2, name: 'Selasa', short: 'Sel' },
  { dow: 3, name: 'Rabu', short: 'Rab' },
  { dow: 4, name: 'Kamis', short: 'Kam' },
  { dow: 5, name: 'Jumat', short: 'Jum' },
  { dow: 6, name: 'Sabtu', short: 'Sab' },
] as const;

export const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const TASK_STATUSES: { value: TaskStatus; label: string; tone: Tone }[] = [
  { value: 'belum_dikerjakan', label: 'Belum dikerjakan', tone: 'slate' },
  { value: 'sedang_dikerjakan', label: 'Sedang dikerjakan', tone: 'amber' },
  { value: 'selesai', label: 'Selesai', tone: 'emerald' },
  { value: 'sudah_dikumpulkan', label: 'Sudah dikumpulkan', tone: 'indigo' },
];

/** Alur LKS (urut). Tahap terakhir = selesai → pindah ke Riwayat. */
export const LKS_STATUSES: { value: LksStatus; label: string; short: string; tone: Tone }[] = [
  { value: 'belum_dikerjakan', label: 'Belum dikerjakan', short: 'Belum dikerjakan', tone: 'slate' },
  { value: 'sudah_dikerjakan', label: 'Sudah dikerjakan', short: 'Dikerjakan', tone: 'amber' },
  { value: 'belum_dikumpulkan', label: 'Belum dikumpulkan', short: 'Siap kumpul', tone: 'rose' },
  { value: 'sudah_dikumpulkan', label: 'Sudah dikumpulkan', short: 'Dikumpulkan', tone: 'sky' },
  { value: 'sedang_diperiksa', label: 'Sedang diperiksa', short: 'Diperiksa', tone: 'violet' },
  { value: 'sudah_dikembalikan', label: 'Sudah dikembalikan', short: 'Dikembalikan', tone: 'emerald' },
];

/** LKS yang dianggap "belum dikumpulkan" (untuk dashboard). */
export const LKS_UNSUBMITTED: LksStatus[] = ['belum_dikerjakan', 'sudah_dikerjakan', 'belum_dikumpulkan'];

export const TASK_PENDING: TaskStatus[] = ['belum_dikerjakan', 'sedang_dikerjakan'];
export const TASK_FINISHED: TaskStatus[] = ['selesai', 'sudah_dikumpulkan'];

export const ANNOUNCEMENT_CATEGORIES: { value: AnnouncementCategory; label: string; tone: Tone }[] = [
  { value: 'perubahan_jadwal', label: 'Perubahan jadwal', tone: 'rose' },
  { value: 'ulangan', label: 'Ulangan', tone: 'amber' },
  { value: 'tugas_tambahan', label: 'Tugas tambahan', tone: 'violet' },
  { value: 'info_guru', label: 'Informasi guru', tone: 'sky' },
  { value: 'kegiatan_kelas', label: 'Kegiatan kelas', tone: 'emerald' },
];

export const ACTIVITY_META: Record<ActivityType, { label: string; tone: Tone }> = {
  task_created: { label: 'Tugas dibuat', tone: 'slate' },
  task_done: { label: 'Tugas selesai', tone: 'emerald' },
  task_submitted: { label: 'Tugas dikumpulkan', tone: 'indigo' },
  lks_created: { label: 'LKS ditambahkan', tone: 'slate' },
  lks_status: { label: 'Status LKS berubah', tone: 'amber' },
  lks_returned: { label: 'LKS dikembalikan', tone: 'emerald' },
  book_packed: { label: 'Buku dimasukkan', tone: 'sky' },
  book_unpacked: { label: 'Buku dikeluarkan', tone: 'slate' },
  book_reset: { label: 'Checklist di-reset', tone: 'amber' },
};

/** Tipe aktivitas yang tampil di halaman Riwayat. */
export const HISTORY_TYPES: ActivityType[] = [
  'lks_returned',
  'task_done',
  'task_submitted',
  'book_packed',
  'book_unpacked',
  'book_reset',
];

export const TONE_CLASSES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  violet: 'bg-violet-50 text-violet-700',
  sky: 'bg-sky-50 text-sky-700',
  rose: 'bg-rose-50 text-rose-700',
};

export function taskStatusMeta(value: TaskStatus) {
  return TASK_STATUSES.find((s) => s.value === value) ?? TASK_STATUSES[0];
}

export function lksStatusIndex(value: LksStatus) {
  return Math.max(0, LKS_STATUSES.findIndex((s) => s.value === value));
}

export function announcementMeta(value: AnnouncementCategory) {
  return ANNOUNCEMENT_CATEGORIES.find((c) => c.value === value) ?? ANNOUNCEMENT_CATEGORIES[4];
}
