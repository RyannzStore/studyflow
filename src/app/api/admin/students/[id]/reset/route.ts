import { createAdminClient } from '@/lib/supabase/admin';
import { generateTempPassword, noStoreJson, requireAdmin } from '@/lib/server-utils';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reset password murid → password sementara baru + wajib ganti saat login (khusus admin). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!UUID_RE.test(id)) return noStoreJson({ error: 'ID akun tidak valid.' }, 400);

  const admin = createAdminClient();
  const { data: existing, error: getError } = await admin.auth.admin.getUserById(id);
  if (getError || !existing.user) return noStoreJson({ error: 'Akun tidak ditemukan.' }, 404);

  const tempPassword = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: tempPassword,
    app_metadata: { ...existing.user.app_metadata, must_change_password: true },
  });
  if (error) return noStoreJson({ error: 'Gagal mereset password. Coba lagi.' }, 500);

  return noStoreJson({ id, temp_password: tempPassword });
}
