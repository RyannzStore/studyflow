import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: {
    default: 'StudyFlow — Organize Your School Life',
    template: '%s · StudyFlow',
  },
  description: 'Personal school organizer untuk kelas X TKJ 1: jadwal, tugas, LKS, checklist buku, dan pengumuman.',
  applicationName: 'StudyFlow',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" data-motion="full" suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
