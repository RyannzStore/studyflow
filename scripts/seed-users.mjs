#!/usr/bin/env node
/**
 * Seed 3 akun murid awal StudyFlow (X TKJ 1) lewat Supabase Admin API.
 *
 * Pakai:  npm run seed:users
 *   (membaca .env.local → butuh NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY, Node >= 20.6)
 *
 * - Password sementara dibuat ACAK untuk tiap akun, dicetak SEKALI di terminal,
 *   dan TIDAK disimpan di file/DB mana pun (Supabase hanya menyimpan hash bcrypt).
 * - Setiap akun wajib mengganti password saat login pertama (must_change_password).
 * - Aman dijalankan ulang: akun yang sudah ada dilewati.
 * - Service role key hanya dipakai di script ini (server/terminal), tidak pernah ke browser.
 */
import { randomInt } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || 'studyflow.app';

if (!url || !serviceKey) {
  console.error('✖ Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local terlebih dulu.');
  process.exit(1);
}

// Admin = Rangga (bisa edit jadwal, buat pengumuman, kelola akun). Ubah bila perlu.
const ACCOUNTS = [
  { full_name: 'Miftaah Dhiya Ulhaq', username: 'miftaah', role: 'student' },
  { full_name: 'Rangga Raditya Saputra', username: 'rangga', role: 'admin' },
  { full_name: 'Abdurahman Naufal', username: 'naufal', role: 'student' },
];

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function tempPassword() {
  for (;;) {
    let raw = '';
    for (let i = 0; i < 12; i++) raw += ALPHABET[randomInt(ALPHABET.length)];
    if (/[A-Za-z]/.test(raw) && /\d/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
  }
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const created = [];
const skipped = [];
const failed = [];

for (const acc of ACCOUNTS) {
  const email = `${acc.username}@${domain}`;
  const password = tempPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: acc.full_name, username: acc.username },
    app_metadata: { role: acc.role, must_change_password: true },
  });

  if (error || !data?.user) {
    if (/already|registered|exists/i.test(error?.message ?? '')) skipped.push(acc.username);
    else failed.push(`${acc.username}: ${error?.message ?? 'unknown error'}`);
    continue;
  }

  // Pastikan profil ada (trigger biasanya sudah membuatnya).
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: data.user.id, username: acc.username, full_name: acc.full_name, role: acc.role }, { onConflict: 'id' });
  if (profileError) {
    failed.push(`${acc.username}: akun dibuat tetapi profil gagal (${profileError.message}). Jalankan schema.sql dulu.`);
    await admin.auth.admin.deleteUser(data.user.id);
    continue;
  }

  created.push({ ...acc, password });
}

console.log('\n=== StudyFlow — seed akun ===\n');

if (created.length) {
  console.log('Akun BARU (simpan sekarang — password tidak akan ditampilkan lagi):\n');
  for (const a of created) {
    console.log(`  ${a.full_name.padEnd(26)} username: ${a.username.padEnd(10)} password sementara: ${a.password}${a.role === 'admin' ? '   [ADMIN]' : ''}`);
  }
  console.log('\nBagikan password ke masing-masing murid secara pribadi. Mereka wajib menggantinya saat login pertama.');
}
if (skipped.length) console.log(`\nDilewati (sudah ada): ${skipped.join(', ')}`);
if (failed.length) {
  console.error('\nGagal:');
  failed.forEach((f) => console.error('  ✖', f));
  process.exitCode = 1;
}
console.log('');
