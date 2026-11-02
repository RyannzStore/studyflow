import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityType } from './types';

/** Ubah error teknis menjadi pesan yang ramah untuk murid. */
export function friendlyError(err: unknown): string {
  let msg = 'Terjadi kesalahan. Coba lagi.';
  if (err instanceof Error) msg = err.message;
  else if (typeof err === 'string') msg = err;
  else if (err && typeof err === 'object' && 'message' in err) msg = String((err as { message: unknown }).message);

  const m = msg.toLowerCase();
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network request failed') || m.includes('load failed')) {
    return 'Tidak bisa terhubung ke server. Periksa koneksi internet kamu lalu coba lagi.';
  }
  if (m.includes('row-level security') || m.includes('permission denied')) {
    return 'Kamu tidak punya izin untuk melakukan aksi ini.';
  }
  if (m.includes('jwt') || m.includes('not authenticated') || m.includes('refresh token')) {
    return 'Sesi kamu berakhir. Silakan login ulang.';
  }
  if (m.includes('duplicate key')) return 'Data tersebut sudah ada.';
  if (m.includes('violates foreign key')) {
    return 'Data ini masih dipakai oleh data lain sehingga tidak bisa diubah/dihapus.';
  }
  if (m.includes('violates check constraint')) {
    return 'Data yang dimasukkan tidak valid. Periksa kembali isian kamu.';
  }
  return msg;
}

/** Ambil data dari respons Supabase atau lempar Error. */
export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export interface ActivityEntry {
  type: ActivityType;
  entity_type?: string;
  entity_id?: string | null;
  subject_id?: string | null;
  title: string;
  detail?: string | null;
}

/** Catat aktivitas ke activity_logs. Kegagalan pencatatan tidak boleh mengganggu aksi utama. */
export async function logActivity(sb: SupabaseClient, userId: string, entry: ActivityEntry): Promise<void> {
  try {
    const { error } = await sb.from('activity_logs').insert({
      user_id: userId,
      type: entry.type,
      entity_type: entry.entity_type ?? null,
      entity_id: entry.entity_id ?? null,
      subject_id: entry.subject_id ?? null,
      title: entry.title.slice(0, 200),
      detail: entry.detail ? entry.detail.slice(0, 300) : null,
    });
    if (error) console.error('[activity]', error.message);
  } catch (e) {
    console.error('[activity]', e);
  }
}
