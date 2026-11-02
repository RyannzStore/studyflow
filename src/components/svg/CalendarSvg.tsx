'use client';

import { useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DAYS_SHORT_UP, MONTHS_SHORT, dowOfDateKey, formatDateLong, parseKey } from '@/lib/date';

/**
 * Kalender SVG dengan animasi "flip" saat tanggal berganti.
 * Dipakai di Dashboard (tanggal hari ini) dan Jadwal (tanggal hari yang dipilih).
 */
export function CalendarSvg({ dateKey, size = 96 }: { dateKey: string; size?: number }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `sf-cal-${uid}`;
  const { m, d } = parseKey(dateKey);
  const dow = dowOfDateKey(dateKey);
  const headerText = `${DAYS_SHORT_UP[dow - 1]} · ${MONTHS_SHORT[m - 1]}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      role="img"
      aria-label={formatDateLong(dateKey)}
    >
      <defs>
        <linearGradient id={gradId} x1="10" y1="16" x2="86" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      {/* bayangan */}
      <ellipse cx="48" cy="91" rx="28" ry="3.5" fill="#312e81" fillOpacity=".14" />
      {/* badan kalender */}
      <rect x="10" y="16" width="76" height="72" rx="18" fill="#fff" stroke="#e0e7ff" strokeWidth="2" />
      {/* header */}
      <path d="M10 34a18 18 0 0 1 18-18h40a18 18 0 0 1 18 18v8H10v-8Z" fill={`url(#${gradId})`} />
      {/* cincin penjilid */}
      <rect x="27" y="8" width="7" height="17" rx="3.5" fill="#312e81" />
      <rect x="62" y="8" width="7" height="17" rx="3.5" fill="#312e81" />
      <rect x="29" y="10" width="3" height="6" rx="1.5" fill="#a5b4fc" />
      <rect x="64" y="10" width="3" height="6" rx="1.5" fill="#a5b4fc" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.text
          key={headerText}
          x="48"
          y="37"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          letterSpacing="1.2"
          fill="#fff"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {headerText}
        </motion.text>
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.text
          key={dateKey}
          x="48"
          y="76"
          textAnchor="middle"
          fontSize="32"
          fontWeight="800"
          fill="#312e81"
          initial={{ opacity: 0, scaleY: 0.2 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0.2 }}
          transition={{ duration: 0.2 }}
        >
          {d}
        </motion.text>
      </AnimatePresence>
    </svg>
  );
}
