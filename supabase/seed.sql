-- =====================================================================
-- StudyFlow — X TKJ 1
-- 3) SEED DATA: mata pelajaran + jadwal  (jalankan KETIGA)
-- Aman dijalankan ulang (tidak menggandakan data).
-- Akun murid TIDAK dibuat di sini — pakai `npm run seed:users` atau
-- panel admin (Pengaturan → Kelola Akun Murid).
-- =====================================================================

insert into public.subjects (name, short_name, book_name, color) values
  ('Sejarah',                                   'Sejarah',      'Buku Sejarah',                  '#f59e0b'),
  ('Pendidikan Agama Islam & Budi Pekerti',     'PAI',          'Buku PAI & Budi Pekerti',       '#10b981'),
  ('Koding',                                    'Koding',       'Buku Koding',                   '#6366f1'),
  ('Dasar Jaringan Komputer & Telekomunikasi',  'DJKT',         'Buku Dasar Jaringan Komputer',  '#0ea5e9'),
  ('Bahasa Inggris',                            'B. Inggris',   'Buku Bahasa Inggris',           '#ef4444'),
  ('Pendidikan Jasmani & Kesehatan',            'PJOK',         'Buku PJOK',                     '#84cc16'),
  ('Proyek IPAS',                               'IPAS',         'Buku Proyek IPAS',              '#14b8a6'),
  ('Seni Musik',                                'Seni Musik',   'Buku Seni Musik',               '#ec4899'),
  ('Bahasa Indonesia',                          'B. Indonesia', 'Buku Bahasa Indonesia',         '#f97316'),
  ('Matematika',                                'Matematika',   'Buku Matematika',               '#8b5cf6'),
  ('Bimbingan Konseling',                       'BK',           'Buku BK',                       '#a855f7'),
  ('Mulok Pencak Silat',                        'Pencak Silat', 'Perlengkapan Pencak Silat',     '#64748b'),
  ('Pendidikan Pancasila',                      'Pancasila',    'Buku Pendidikan Pancasila',     '#dc2626')
on conflict (name) do nothing;

-- Jadwal (semua pelajaran di Ruang 16).
-- Catatan: Seni Musik hari Rabu = 12:30–13:40 (sumber menulis 00:30, salah ketik).
with data (dow, st, en, subj, teacher) as (
  values
    -- SENIN
    (1, '12:30', '13:40', 'Sejarah',                                   'Heni Alamsari'),
    (1, '13:40', '14:40', 'Pendidikan Agama Islam & Budi Pekerti',     'Ihsan Ramdhani'),
    (1, '14:40', '15:10', 'Koding',                                    'Afan Gaffar'),
    (1, '16:00', '17:40', 'Dasar Jaringan Komputer & Telekomunikasi',  'Suprayitno'),
    -- SELASA
    (2, '12:30', '13:40', 'Bahasa Inggris',                            'Hasani, SPDI.'),
    (2, '13:40', '14:40', 'Pendidikan Jasmani & Kesehatan',            'Yuda Nurhidayat'),
    (2, '14:40', '16:30', 'Dasar Jaringan Komputer & Telekomunikasi',  'Susilo, M.Kom'),
    (2, '16:30', '17:40', 'Proyek IPAS',                               'Irsy aad Hafizd'),
    -- RABU
    (3, '12:30', '13:40', 'Seni Musik',                                'Albert Allen'),
    (3, '13:40', '14:40', 'Bahasa Inggris',                            'Hasani, SPDI.'),
    (3, '14:40', '15:10', 'Bahasa Indonesia',                          'Ade Wiryanti'),
    (3, '15:10', '16:30', 'Proyek IPAS',                               'Irsy aad Hafizd'),
    (3, '16:30', '17:40', 'Matematika',                                'Dewi Pebriyanti'),
    -- KAMIS
    (4, '12:30', '13:40', 'Matematika',                                'Dewi Pebriyanti'),
    (4, '13:40', '14:40', 'Koding',                                    'Afan Gaffar'),
    (4, '14:40', '15:40', 'Proyek IPAS',                               'Irsy aad Hafizd'),
    (4, '16:00', '17:40', 'Dasar Jaringan Komputer & Telekomunikasi',  'Susilo, M.Kom'),
    -- JUMAT
    (5, '13:30', '14:10', 'Bimbingan Konseling',                       'Arif Ghofirin'),
    (5, '14:10', '16:10', 'Dasar Jaringan Komputer & Telekomunikasi',  'Suprayitno'),
    (5, '16:30', '17:40', 'Mulok Pencak Silat',                        'Untung Sudarto'),
    -- SABTU
    (6, '12:30', '13:50', 'Pendidikan Pancasila',                      'Muisah'),
    (6, '13:50', '15:50', 'Bahasa Indonesia',                          'Ade Wiryanti')
)
insert into public.schedules (day_of_week, start_time, end_time, subject_id, teacher, room)
select d.dow, d.st::time, d.en::time, s.id, d.teacher, 'Ruang 16'
from data d
join public.subjects s on s.name = d.subj
where not exists (select 1 from public.schedules);
