import { createClient as createSupabaseJs } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { noStoreJson } from '@/lib/server-utils';
import { validatePassword } from '@/lib/validators';

/**
 * Ganti password (dipakai untuk "wajib ganti password" & Pengaturan).
 * Aman karena flag `must_change_password` hanya dihapus SETELAH:
 *   1) password saat ini terverifikasi, dan
 *   2) password baru lolos kebijakan & berbeda dari yang lama.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return noStoreJson({ error: 'Belum login.' }, 401);

  let body: { current_password?: unknown; new_password?: unknown };
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: 'Permintaan tidak valid.' }, 400);
  }

  const current = typeof body.current_password === 'string' ? body.current_password : '';
  const next = typeof body.new_password === 'string' ? body.new_password : '';

  if (!current) return noStoreJson({ error: 'Password saat ini wajib diisi.' }, 400);

  const problem = validatePassword(next, user.email.split('@')[0]);
  if (problem) return noStoreJson({ error: problem }, 400);
  if (next === current) return noStoreJson({ error: 'Password baru harus berbeda dari password saat ini.' }, 400);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return noStoreJson({ error: 'Server belum dikonfigurasi.' }, 500);

  // Verifikasi password saat ini dengan client terpisah (sesi tidak disimpan, tidak di-signOut).
  const verifier = createSupabaseJs(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: verifyError } = await verifier.auth.signInWithPassword({ email: user.email, password: current });
  if (verifyError) return noStoreJson({ error: 'Password saat ini salah.' }, 400);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: next,
    app_metadata: { ...user.app_metadata, must_change_password: false },
  });
  if (error) return noStoreJson({ error: 'Gagal menyimpan password baru. Coba lagi.' }, 500);

  return noStoreJson({ ok: true });
}
