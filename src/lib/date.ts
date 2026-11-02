/**
 * Helper tanggal & waktu — semua berbasis zona waktu Asia/Jakarta (WIB),
 * supaya hari/jadwal benar walau perangkat memakai zona waktu lain.
 * "dateKey" = string 'YYYY-MM-DD'. "dow" = 1 (Senin) … 7 (Minggu).
 */

export const TZ = 'Asia/Jakarta';

export interface JakartaNow {
  dateKey: string;
  dow: number;
  minutes: number;
}

const WEEKDAY_MAP: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function jakartaNow(date: Date = new Date()): JakartaNow {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
    dow: WEEKDAY_MAP[get('weekday')] ?? 1,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

function keyToUTC(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function utcToKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateKey: string, days: number): string {
  const d = keyToUTC(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return utcToKey(d);
}

export function dowOfDateKey(dateKey: string): number {
  const day = keyToUTC(dateKey).getUTCDay(); // 0 = Minggu
  return day === 0 ? 7 : day;
}

export function diffDays(fromKey: string, toKey: string): number {
  return Math.round((keyToUTC(toKey).getTime() - keyToUTC(fromKey).getTime()) / 86400000);
}

/** Hari sekolah berikutnya setelah dateKey (Minggu dilewati). */
export function nextSchoolDate(dateKey: string): string {
  let next = addDays(dateKey, 1);
  if (dowOfDateKey(next) === 7) next = addDays(next, 1);
  return next;
}

/** Target tampilan: hari ini bila Senin–Sabtu, selain itu Senin berikutnya. */
export function schoolTarget(now: JakartaNow) {
  if (now.dow <= 6) return { dateKey: now.dateKey, dow: now.dow, isToday: true };
  const dateKey = nextSchoolDate(now.dateKey);
  return { dateKey, dow: dowOfDateKey(dateKey), isToday: false };
}

/** Tanggal untuk hari ke-dow pada pekan berjalan (Minggu → pekan depan). */
export function dateKeyForDow(now: JakartaNow, dow: number): string {
  const diff = now.dow === 7 ? dow : dow - now.dow;
  return addDays(now.dateKey, diff);
}

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const DAYS_ID = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const DAYS_SHORT_UP = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

export function parseKey(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return { y, m, d };
}

export function formatDateLong(dateKey: string): string {
  const { y, m, d } = parseKey(dateKey);
  return `${DAYS_ID[dowOfDateKey(dateKey) - 1]}, ${d} ${MONTHS_ID[m - 1]} ${y}`;
}

export function formatDateShort(dateKey: string): string {
  const { y, m, d } = parseKey(dateKey);
  return `${d} ${MONTHS_ID[m - 1].slice(0, 3)} ${y}`;
}

export function formatDayMonth(dateKey: string): string {
  const { m, d } = parseKey(dateKey);
  return `${d} ${MONTHS_ID[m - 1].slice(0, 3)}`;
}

export function formatTime(t: string): string {
  return t.slice(0, 5);
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function isoToDateKey(iso: string): string {
  return jakartaNow(new Date(iso)).dateKey;
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(iso))
    .replace('.', ':');
}

export function formatRelativeTime(iso: string, nowMs: number = Date.now()): string {
  const diff = Math.max(0, nowMs - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Baru saja';
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} hari lalu`;
  return formatDateShort(isoToDateKey(iso));
}

export function deadlineInfo(deadline: string | null, todayKey: string): { label: string; tone: 'rose' | 'amber' | 'slate' | 'emerald' } {
  if (!deadline) return { label: 'Tanpa deadline', tone: 'slate' };
  const diff = diffDays(todayKey, deadline);
  if (diff < 0) return { label: `Terlambat ${Math.abs(diff)} hari`, tone: 'rose' };
  if (diff === 0) return { label: 'Deadline hari ini', tone: 'rose' };
  if (diff === 1) return { label: 'Besok', tone: 'amber' };
  if (diff <= 3) return { label: `${diff} hari lagi`, tone: 'amber' };
  return { label: formatDayMonth(deadline), tone: 'slate' };
}

export function greeting(minutes: number): string {
  if (minutes < 11 * 60) return 'Selamat pagi';
  if (minutes < 15 * 60) return 'Selamat siang';
  if (minutes < 18 * 60) return 'Selamat sore';
  return 'Selamat malam';
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function historyGroupLabel(dateKey: string, todayKey: string): string {
  const diff = diffDays(dateKey, todayKey);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  return formatDateLong(dateKey);
}
