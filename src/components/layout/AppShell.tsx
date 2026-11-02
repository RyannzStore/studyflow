'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Backpack,
  CalendarDays,
  FileCheck2,
  History,
  LayoutDashboard,
  LayoutGrid,
  ListTodo,
  LogOut,
  Megaphone,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { LogoFull, LogoMark } from '@/components/svg/Logo';
import { Modal } from '@/components/ui/Modal';
import { AppContext } from '@/lib/app-context';
import { initials } from '@/lib/date';
import { getSupabase } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  short?: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jadwal', label: 'Jadwal', icon: CalendarDays },
  { href: '/tugas', label: 'Katalog Tugas', short: 'Tugas', icon: ListTodo },
  { href: '/lks', label: 'LKS Tracker', short: 'LKS', icon: FileCheck2 },
  { href: '/buku', label: 'Buku', icon: Backpack },
  { href: '/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { href: '/riwayat', label: 'Riwayat', icon: History },
  { href: '/pengaturan', label: 'Pengaturan', icon: Settings },
];

const PRIMARY_MOBILE = NAV.slice(0, 4);
const SECONDARY_MOBILE = NAV.slice(4);

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function AppShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
  const secondaryActive = SECONDARY_MOBILE.some((n) => isActive(n.href));

  async function logout() {
    setLoggingOut(true);
    try {
      await getSupabase().auth.signOut();
    } catch {
      /* tetap lanjut ke halaman login */
    }
    router.replace('/login');
    router.refresh();
  }

  return (
    <AppContext.Provider value={{ profile, isAdmin: profile.role === 'admin' }}>
      {/* ---------- Sidebar desktop ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-100 bg-white px-5 py-7 lg:flex">
        <Link href="/" aria-label="StudyFlow — Dashboard" className="px-2">
          <LogoFull size={42} showTagline />
        </Link>

        <nav aria-label="Navigasi utama" className="mt-9 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${
                  active ? 'text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-pill"
                    className="absolute inset-0 rounded-2xl bg-brand-50"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <item.icon size={20} className="relative" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-3xl bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={profile.full_name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">{profile.full_name}</p>
              <p className="truncate text-xs text-slate-500">
                {profile.class_name}
                {profile.role === 'admin' ? ' · Admin' : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:text-rose-600 disabled:opacity-60"
          >
            <LogOut size={16} />
            {loggingOut ? 'Keluar…' : 'Keluar'}
          </button>
        </div>
      </aside>

      {/* ---------- Konten ---------- */}
      <div className="min-h-dvh lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-canvas px-4 py-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5" aria-label="StudyFlow — Dashboard">
            <LogoMark size={34} />
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Study<span className="text-brand-600">Flow</span>
            </span>
          </Link>
          <Link href="/pengaturan" aria-label="Pengaturan akun">
            <Avatar name={profile.full_name} size={36} />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-2 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* ---------- Bottom navigation mobile ---------- */}
      <nav
        aria-label="Navigasi bawah"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {PRIMARY_MOBILE.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold"
                >
                  {active && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-x-4 top-0 h-1 rounded-b-full bg-brand-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <motion.span whileTap={{ scale: 0.82 }} className={active ? 'text-brand-600' : 'text-slate-400'}>
                    <item.icon size={22} strokeWidth={active ? 2.4 : 2} />
                  </motion.span>
                  <span className={active ? 'text-brand-700' : 'text-slate-500'}>{item.short ?? item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="relative flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold"
            >
              {secondaryActive && <span className="absolute inset-x-4 top-0 h-1 rounded-b-full bg-brand-500" />}
              <motion.span whileTap={{ scale: 0.82 }} className={secondaryActive ? 'text-brand-600' : 'text-slate-400'}>
                <LayoutGrid size={22} strokeWidth={secondaryActive ? 2.4 : 2} />
              </motion.span>
              <span className={secondaryActive ? 'text-brand-700' : 'text-slate-500'}>Menu</span>
            </button>
          </li>
        </ul>
      </nav>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <div className="grid grid-cols-2 gap-3">
          {SECONDARY_MOBILE.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-start gap-3 rounded-3xl border p-4 font-bold transition ${
                  active ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-100 bg-white text-slate-700'
                }`}
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm">
                  <item.icon size={20} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-3xl bg-slate-50 p-3">
          <Avatar name={profile.full_name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">{profile.full_name}</p>
            <p className="truncate text-xs text-slate-500">@{profile.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-2.5 text-sm font-semibold text-rose-600 shadow-sm disabled:opacity-60"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </Modal>
    </AppContext.Provider>
  );
}
