-- =====================================================================
-- StudyFlow — X TKJ 1
-- 2) ROW LEVEL SECURITY  (jalankan KEDUA, setelah schema.sql)
-- =====================================================================
-- Prinsip:
--  * Semua tabel RLS aktif. Role "anon" tidak punya akses sama sekali.
--  * Data pribadi (tasks, lks_tracker, book_checklists, activity_logs)
--    hanya bisa dibaca & diubah pemiliknya (user_id = auth.uid()).
--  * Jadwal, mapel, pengumuman: dibaca semua akun terdaftar, ditulis admin.
--  * Role admin hanya diset lewat app_metadata (server) — tidak bisa
--    dinaikkan sendiri oleh murid.
-- =====================================================================

alter table public.profiles         enable row level security;
alter table public.subjects         enable row level security;
alter table public.schedules        enable row level security;
alter table public.tasks            enable row level security;
alter table public.lks_tracker      enable row level security;
alter table public.book_checklists  enable row level security;
alter table public.announcements    enable row level security;
alter table public.activity_logs    enable row level security;

-- Bersihkan policy lama (aman dijalankan ulang)
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','subjects','schedules','tasks','lks_tracker',
                        'book_checklists','announcements','activity_logs')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- (tidak ada policy insert/delete: profil dibuat oleh trigger / service role)

-- ---------------------------------------------------------------------
-- subjects
-- ---------------------------------------------------------------------
create policy "subjects_select_all" on public.subjects
  for select to authenticated using (true);

create policy "subjects_insert_admin" on public.subjects
  for insert to authenticated with check (public.is_admin());

create policy "subjects_update_admin" on public.subjects
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "subjects_delete_admin" on public.subjects
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- schedules
-- ---------------------------------------------------------------------
create policy "schedules_select_all" on public.schedules
  for select to authenticated using (true);

create policy "schedules_insert_admin" on public.schedules
  for insert to authenticated with check (public.is_admin());

create policy "schedules_update_admin" on public.schedules
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "schedules_delete_admin" on public.schedules
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- tasks (pribadi)
-- ---------------------------------------------------------------------
create policy "tasks_select_own" on public.tasks
  for select to authenticated using (user_id = auth.uid());

create policy "tasks_insert_own" on public.tasks
  for insert to authenticated with check (user_id = auth.uid());

create policy "tasks_update_own" on public.tasks
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "tasks_delete_own" on public.tasks
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- lks_tracker (pribadi, TANPA policy delete → tidak bisa dihapus permanen)
-- ---------------------------------------------------------------------
create policy "lks_select_own" on public.lks_tracker
  for select to authenticated using (user_id = auth.uid());

create policy "lks_insert_own" on public.lks_tracker
  for insert to authenticated with check (user_id = auth.uid());

create policy "lks_update_own" on public.lks_tracker
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- book_checklists (pribadi)
-- ---------------------------------------------------------------------
create policy "books_select_own" on public.book_checklists
  for select to authenticated using (user_id = auth.uid());

create policy "books_insert_own" on public.book_checklists
  for insert to authenticated with check (user_id = auth.uid());

create policy "books_update_own" on public.book_checklists
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- announcements
-- ---------------------------------------------------------------------
create policy "announcements_select_all" on public.announcements
  for select to authenticated using (true);

create policy "announcements_insert_admin" on public.announcements
  for insert to authenticated with check (public.is_admin());

create policy "announcements_update_admin" on public.announcements
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "announcements_delete_admin" on public.announcements
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- activity_logs (pribadi, append-only)
-- ---------------------------------------------------------------------
create policy "activity_select_own" on public.activity_logs
  for select to authenticated using (user_id = auth.uid());

create policy "activity_insert_own" on public.activity_logs
  for insert to authenticated with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Hak akses level tabel/kolom (lapisan pertahanan tambahan)
-- ---------------------------------------------------------------------
revoke all on public.profiles, public.subjects, public.schedules, public.tasks,
              public.lks_tracker, public.book_checklists, public.announcements,
              public.activity_logs
  from anon;

-- Murid hanya boleh mengubah full_name di profilnya (role/username terkunci)
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- LKS tidak boleh dihapus; log aktivitas tidak boleh diubah/dihapus
revoke delete on public.lks_tracker from authenticated;
revoke update, delete on public.activity_logs from authenticated;

-- Fungsi helper
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
