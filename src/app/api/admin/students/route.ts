import { createAdminClient } from '@/lib/supabase/admin';
import { generateTempPassword, noStoreJson, requireAdmin } from '@/lib/server-utils';
import { emailFromUsername, validateFullName, validateUsername } from '@/lib/validators';

/** Daftar akun (khusus admin). */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, username, full_name, role')
    .order('full_name', { ascending: true });
  if (error) return noStoreJson({ error: 'Gagal memuat daftar akun.' }, 500);

  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const byId = new Map((list?.users ?? []).map((u) => [u.id, u]));

  const students = (profiles ?? []).map((p) => {
    const u = byId.get(p.id);
    return {
      ...p,
      must_change_password: u?.app_metadata?.must_change_password === true,
      last_sign_in_at: u?.last_sign_in_at ?? null,
    };
  });

  return noStoreJson({ students });
}

/** Buat akun murid baru (khusus admin). Password sementara dikembalikan SEKALI saja. */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: { full_name?: unknown; username?: unknown };
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: 'Permintaan tidak valid.' }, 400);
  }

  const fullName = typeof body.full_name === 'string' ? body.full_name.trim().replace(/\s+/g, ' ') : '';
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';

  const nameErr = validateFullName(fullName);
  if (nameErr) return noStoreJson({ error: nameErr }, 400);
  const userErr = validateUsername(username);
  if (userErr) return noStoreJson({ error: userErr }, 400);

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email: emailFromUsername(username, process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN),
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, username },
    app_metadata: { role: 'student', must_change_password: true },
  });

  if (error || !data.user) {
    const duplicate = /already|registered|exists/i.test(error?.message ?? '');
    return noStoreJson(
      { error: duplicate ? 'Username sudah dipakai.' : 'Gagal membuat akun. Coba lagi.' },
      duplicate ? 409 : 500,
    );
  }

  // Pastikan baris profil ada & benar (jaga-jaga bila trigger belum terpasang).
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: data.user.id, username, full_name: fullName, role: 'student' }, { onConflict: 'id' });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return noStoreJson(
      { error: 'Profil gagal dibuat (username mungkin bentrok atau schema.sql belum dijalankan).' },
      500,
    );
  }

  return noStoreJson({ id: data.user.id, username, full_name: fullName, temp_password: tempPassword }, 201);
}
