import 'server-only';
import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';

/** Password sementara acak & kuat, mis. "k7Hm-Q2xP-9aTz". Tidak pernah disimpan. */
export function generateTempPassword(): string {
  const alphabet = LETTERS + DIGITS;
  for (;;) {
    let raw = '';
    for (let i = 0; i < 12; i++) raw += alphabet[randomInt(alphabet.length)];
    if (/[A-Za-z]/.test(raw) && /\d/.test(raw)) {
      return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
    }
  }
}

export function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Pastikan pemanggil login dan berperan admin (dibaca dari tabel profiles lewat RLS). */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, response: noStoreJson({ error: 'Belum login.' }, 401) };

  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (error || profile?.role !== 'admin') {
    return { ok: false as const, response: noStoreJson({ error: 'Hanya admin yang boleh melakukan ini.' }, 403) };
  }
  return { ok: true as const, user };
}
