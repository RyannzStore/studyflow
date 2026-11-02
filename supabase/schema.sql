-- =====================================================================
-- StudyFlow — X TKJ 1
-- 1) SCHEMA  (jalankan PERTAMA di Supabase → SQL Editor)
-- Urutan file: schema.sql → rls.sql → seed.sql
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Helper: otomatis isi updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. profiles  (1 baris per akun auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  full_name   text not null check (char_length(full_name) between 2 and 80),
  role        text not null default 'student' check (role in ('student', 'admin')),
  class_name  text not null default 'X TKJ 1',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Profil dibuat otomatis saat akun dibuat (oleh admin / script seed).
-- PENTING: role hanya dibaca dari raw_app_meta_data (tidak bisa diubah user).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    lower(coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(new.email, '@', 1))),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    case when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper cek admin (dipakai oleh RLS)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 2. subjects  (mata pelajaran, dibaca semua akun)
-- ---------------------------------------------------------------------
create table if not exists public.subjects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 2 and 100),
  short_name  text not null check (char_length(short_name) between 1 and 30),
  book_name   text not null check (char_length(book_name) between 1 and 100),
  color       text not null default '#6366f1' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. schedules  (jadwal kelas X TKJ 1, sama untuk semua akun)
-- day_of_week: 1 = Senin ... 6 = Sabtu
-- ---------------------------------------------------------------------
create table if not exists public.schedules (
  id           uuid primary key default gen_random_uuid(),
  day_of_week  smallint not null check (day_of_week between 1 and 6),
  start_time   time not null,
  end_time     time not null,
  subject_id   uuid not null references public.subjects (id) on delete restrict,
  teacher      text not null check (char_length(teacher) between 1 and 100),
  room         text not null default 'Ruang 16' check (char_length(room) between 1 and 40),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint schedules_time_order check (end_time > start_time)
);

create index if not exists idx_schedules_day on public.schedules (day_of_week, start_time);

drop trigger if exists trg_schedules_updated on public.schedules;
create trigger trg_schedules_updated
  before update on public.schedules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. tasks  (katalog tugas — pribadi)
-- ---------------------------------------------------------------------
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 2 and 120),
  subject_id    uuid references public.subjects (id) on delete set null,
  teacher       text check (teacher is null or char_length(teacher) <= 100),
  instructions  text check (instructions is null or char_length(instructions) <= 2000),
  given_date    date not null default current_date,
  deadline      date,
  notes         text check (notes is null or char_length(notes) <= 1000),
  status        text not null default 'belum_dikerjakan'
                check (status in ('belum_dikerjakan', 'sedang_dikerjakan', 'selesai', 'sudah_dikumpulkan')),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint tasks_deadline_after_given check (deadline is null or deadline >= given_date)
);

create index if not exists idx_tasks_user_status   on public.tasks (user_id, status);
create index if not exists idx_tasks_user_deadline on public.tasks (user_id, deadline);

drop trigger if exists trg_tasks_updated on public.tasks;
create trigger trg_tasks_updated
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. lks_tracker  (pelacak LKS — pribadi, TIDAK PERNAH dihapus permanen)
-- ---------------------------------------------------------------------
create table if not exists public.lks_tracker (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 2 and 120),
  subject_id    uuid references public.subjects (id) on delete set null,
  due_date      date,
  notes         text check (notes is null or char_length(notes) <= 1000),
  status        text not null default 'belum_dikerjakan'
                check (status in (
                  'belum_dikerjakan', 'sudah_dikerjakan', 'belum_dikumpulkan',
                  'sudah_dikumpulkan', 'sedang_diperiksa', 'sudah_dikembalikan'
                )),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint lks_completed_when_returned check (status <> 'sudah_dikembalikan' or completed_at is not null)
);

create index if not exists idx_lks_user_status on public.lks_tracker (user_id, status);

drop trigger if exists trg_lks_updated on public.lks_tracker;
create trigger trg_lks_updated
  before update on public.lks_tracker
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 6. book_checklists  (checklist buku per hari — pribadi)
-- ---------------------------------------------------------------------
create table if not exists public.book_checklists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject_id  uuid not null references public.subjects (id) on delete cascade,
  check_date  date not null,
  status      text not null default 'belum_disiapkan'
              check (status in ('belum_disiapkan', 'sudah_dimasukkan')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint book_checklists_unique unique (user_id, subject_id, check_date)
);

create index if not exists idx_books_user_date on public.book_checklists (user_id, check_date);

drop trigger if exists trg_books_updated on public.book_checklists;
create trigger trg_books_updated
  before update on public.book_checklists
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 7. announcements  (pengumuman kelas — dibaca semua, ditulis admin)
-- ---------------------------------------------------------------------
create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid default auth.uid() references public.profiles (id) on delete set null,
  author_name  text,
  title        text not null check (char_length(title) between 2 and 120),
  body         text not null check (char_length(body) between 1 and 3000),
  category     text not null default 'kegiatan_kelas'
               check (category in ('perubahan_jadwal', 'ulangan', 'tugas_tambahan', 'info_guru', 'kegiatan_kelas')),
  pinned       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_announcements_created on public.announcements (pinned desc, created_at desc);

drop trigger if exists trg_announcements_updated on public.announcements;
create trigger trg_announcements_updated
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 8. activity_logs  (riwayat aktivitas — pribadi, hanya bisa ditambah)
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type         text not null check (type in (
                 'task_created', 'task_done', 'task_submitted',
                 'lks_created', 'lks_status', 'lks_returned',
                 'book_packed', 'book_unpacked', 'book_reset'
               )),
  entity_type  text,
  entity_id    uuid,
  subject_id   uuid references public.subjects (id) on delete set null,
  title        text not null check (char_length(title) between 1 and 200),
  detail       text check (detail is null or char_length(detail) <= 300),
  created_at   timestamptz not null default now()
);

create index if not exists idx_activity_user_created on public.activity_logs (user_id, created_at desc);
