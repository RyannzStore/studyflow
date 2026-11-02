# StudyFlow — Organize Your School Life

Personal school organizer untuk **kelas X TKJ 1**: jadwal, katalog tugas, LKS tracker, checklist buku, pengumuman, dan riwayat.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Supabase (Auth + PostgreSQL + RLS) · Framer Motion · Lucide · deploy Vercel (tanpa VPS).

---

## 1. Struktur folder

```
studyflow/
├── supabase/
│   ├── schema.sql          # 1) tabel, trigger, fungsi
│   ├── rls.sql             # 2) Row Level Security + grant
│   └── seed.sql            # 3) mapel + jadwal X TKJ 1
├── scripts/
│   └── seed-users.mjs      # buat 3 akun murid (password sementara acak)
├── src/
│   ├── middleware.ts       # gerbang login + paksa ganti password
│   ├── app/
│   │   ├── layout.tsx, globals.css, error.tsx, not-found.tsx, icon.svg, manifest.ts
│   │   ├── login/page.tsx
│   │   ├── ganti-password/page.tsx
│   │   ├── api/auth/change-password/route.ts
│   │   ├── api/admin/students/route.ts            # GET daftar, POST buat akun
│   │   ├── api/admin/students/[id]/reset/route.ts # reset password
│   │   └── (app)/                                 # area setelah login
│   │       ├── layout.tsx (AppShell), loading.tsx
│   │       ├── page.tsx            # Dashboard
│   │       ├── jadwal/ tugas/ lks/ buku/ pengumuman/ riwayat/ pengaturan/
│   ├── components/
│   │   ├── svg/    # Logo, LoginLines, FloatingIcons, ProgressRing, AnimatedCheck,
│   │   │           # CalendarSvg, EmptyState, Loader  (semua SVG animasi)
│   │   ├── ui/     # Button, Modal, Fields, Toast, misc
│   │   ├── layout/ # AppShell (sidebar desktop + bottom nav mobile)
│   │   └── auth/, schedule/, activity/
│   └── lib/        # supabase clients, date (WIB), constants, validators, hooks
├── .env.example
└── package.json
```

## 2. Konfigurasi Supabase

1. Buat project di <https://supabase.com> → **New project**.
2. **SQL Editor** → jalankan **berurutan**: `supabase/schema.sql` → `supabase/rls.sql` → `supabase/seed.sql`.
3. **Authentication → Providers → Email**: pastikan *Enable Email provider* aktif, **matikan** "Confirm email" dan **matikan** "Allow new users to sign up" (akun hanya dibuat admin).
4. **Authentication → Policies/Settings**: set minimum password length ≥ 10 (opsional, aplikasi juga memvalidasi).
5. **Project Settings → API**: salin `Project URL`, `anon` key, dan `service_role` key.
6. Salin `.env.example` → `.env.local` lalu isi:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # server-only, jangan dibagikan
   NEXT_PUBLIC_AUTH_EMAIL_DOMAIN=studyflow.app
   ```

## 3. Buat akun murid

```bash
npm install
npm run seed:users
```

Script membuat 3 akun dengan **password sementara acak** yang dicetak **sekali** di terminal (tidak disimpan di mana pun):

| Nama | Username | Peran |
|---|---|---|
| Miftaah Dhiya Ulhaq | `miftaah` | murid |
| Rangga Raditya Saputra | `rangga` | **admin** |
| Abdurahman Naufal | `naufal` | murid |

Username & peran bisa diubah di `scripts/seed-users.mjs` sebelum dijalankan. Saat login pertama, murid **wajib mengganti password**. Akun berikutnya dibuat admin lewat **Pengaturan → Kelola akun murid**.

## 4. Jalankan lokal

```bash
npm run dev      # http://localhost:3000
npm run build    # cek build produksi
```

## 5. Deploy ke Vercel

1. Push project ke GitHub (`.env.local` sudah di-`.gitignore`).
2. Vercel → **Add New → Project** → import repo (framework terdeteksi otomatis: Next.js).
3. **Environment Variables**: isi keempat variabel di atas. `SUPABASE_SERVICE_ROLE_KEY` **tanpa** awalan `NEXT_PUBLIC_`.
4. **Deploy**. Selesai — tidak perlu VPS.
5. (Opsional) Supabase → **Authentication → URL Configuration**: isi Site URL dengan domain Vercel kamu.

## 6. Keamanan (ringkas)

- **RLS aktif di semua tabel.** Data pribadi (`tasks`, `lks_tracker`, `book_checklists`, `activity_logs`) hanya bisa dibaca/diubah pemilik (`user_id = auth.uid()`). Role `anon` tidak punya akses.
- Jadwal, mapel, pengumuman: dibaca semua akun login; **hanya admin** yang bisa menulis.
- LKS **tanpa** policy/grant `DELETE` → tidak bisa dihapus permanen; `activity_logs` append-only.
- Role admin dan flag `must_change_password` disimpan di `app_metadata` (hanya bisa diubah server). Murid hanya bisa mengubah `full_name` di profilnya.
- Password tidak pernah disimpan plaintext (Supabase menyimpan hash bcrypt); password sementara hanya tampil sekali.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di `src/lib/supabase/admin.ts` (`import 'server-only'`) dan script seed.
- Tidak ada signup publik di frontend; pembuatan akun hanya lewat API admin yang memverifikasi peran.

## 7. Catatan perilaku

- Jadwal otomatis mengikuti hari **Senin–Sabtu (WIB)**; hari Minggu menampilkan Senin berikutnya.
- Seni Musik hari Rabu = **12:30–13:40** (koreksi dari sumber "00:30"). Jadwal bisa diedit admin di halaman Jadwal → *Edit jadwal*.
- Animasi mengikuti `prefers-reduced-motion` dan toggle **Kurangi animasi** di Pengaturan.
- "Reset checklist buku" hanya mengembalikan status centang; riwayat aktivitas tetap tersimpan.
- LKS "Sudah dikembalikan" → hilang dari daftar aktif, `completed_at` tersimpan, tampil di Riwayat.
