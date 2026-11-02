export type Role = 'student' | 'admin';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  class_name: string;
}

export interface Subject {
  id: string;
  name: string;
  short_name: string;
  book_name: string;
  color: string;
}

export interface ScheduleItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: string;
  teacher: string;
  room: string;
  subjects: Subject | null;
}

export type TaskStatus = 'belum_dikerjakan' | 'sedang_dikerjakan' | 'selesai' | 'sudah_dikumpulkan';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  subject_id: string | null;
  teacher: string | null;
  instructions: string | null;
  given_date: string;
  deadline: string | null;
  notes: string | null;
  status: TaskStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LksStatus =
  | 'belum_dikerjakan'
  | 'sudah_dikerjakan'
  | 'belum_dikumpulkan'
  | 'sudah_dikumpulkan'
  | 'sedang_diperiksa'
  | 'sudah_dikembalikan';

export interface Lks {
  id: string;
  user_id: string;
  title: string;
  subject_id: string | null;
  due_date: string | null;
  notes: string | null;
  status: LksStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BookStatus = 'belum_disiapkan' | 'sudah_dimasukkan';

export interface BookCheck {
  id: string;
  user_id: string;
  subject_id: string;
  check_date: string;
  status: BookStatus;
}

export type AnnouncementCategory =
  | 'perubahan_jadwal'
  | 'ulangan'
  | 'tugas_tambahan'
  | 'info_guru'
  | 'kegiatan_kelas';

export interface Announcement {
  id: string;
  author_id: string | null;
  author_name: string | null;
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export type ActivityType =
  | 'task_created'
  | 'task_done'
  | 'task_submitted'
  | 'lks_created'
  | 'lks_status'
  | 'lks_returned'
  | 'book_packed'
  | 'book_unpacked'
  | 'book_reset';

export interface ActivityLog {
  id: string;
  user_id: string;
  type: ActivityType;
  entity_type: string | null;
  entity_id: string | null;
  subject_id: string | null;
  title: string;
  detail: string | null;
  created_at: string;
}

export interface StudentAccount {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  must_change_password: boolean;
  last_sign_in_at: string | null;
}
