/** Validator ringan yang dipakai di client DAN server (tanpa dependensi). */

export function validatePassword(password: string, username?: string): string | null {
  if (password.length < 10) return 'Password minimal 10 karakter.';
  if (password.length > 72) return 'Password maksimal 72 karakter.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password harus mengandung huruf dan angka.';
  if (username && username.length >= 3 && password.toLowerCase().includes(username.toLowerCase())) {
    return 'Password tidak boleh mengandung username.';
  }
  return null;
}

export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return 'Username 3–30 karakter: huruf kecil, angka, titik, strip, atau underscore.';
  }
  return null;
}

export function validateFullName(name: string): string | null {
  const n = name.trim();
  if (n.length < 2) return 'Nama minimal 2 karakter.';
  if (n.length > 80) return 'Nama maksimal 80 karakter.';
  return null;
}

export function validateRequired(value: string, label: string, min = 1, max = 200): string | null {
  const v = value.trim();
  if (v.length < min) return min <= 1 ? `${label} wajib diisi.` : `${label} minimal ${min} karakter.`;
  if (v.length > max) return `${label} maksimal ${max} karakter.`;
  return null;
}

export function validateMax(value: string, label: string, max: number): string | null {
  return value.trim().length > max ? `${label} maksimal ${max} karakter.` : null;
}

export function hasErrors(errors: Record<string, string | null | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

export function emailFromUsername(username: string, domain?: string): string {
  const u = username.trim().toLowerCase();
  if (u.includes('@')) return u;
  return `${u}@${domain || 'studyflow.app'}`;
}
