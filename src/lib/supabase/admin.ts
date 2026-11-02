import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Client dengan SERVICE ROLE KEY — melewati RLS.
 * HANYA boleh dipakai di server (API route). Import 'server-only' membuat build
 * gagal bila file ini tidak sengaja ikut ter-bundle ke browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belum diisi di environment server.');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
