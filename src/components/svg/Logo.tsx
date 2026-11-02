'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';

/** Logo StudyFlow: buku terbuka + garis "flow" yang tergambar lalu bergerak terus. */
export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `sf-logo-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <motion.rect
        width="48"
        height="48"
        rx="14"
        fill={`url(#${gradId})`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      />
      <motion.path
        d="M13 17.5c3.5-1.6 7-1.6 11 .6 4-2.2 7.5-2.2 11-.6V32c-3.5-1.4-7-1.4-11 .8-4-2.2-7.5-2.2-11-.8V17.5Z"
        fill="#fff"
        fillOpacity=".95"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      />
      <path d="M24 18.1V32.8" stroke="#6366F1" strokeWidth="1.6" strokeLinecap="round" />
      {/* garis flow: tergambar sekali */}
      <motion.path
        d="M9 38c5-4 9 2 15-1s9-5 15-2"
        stroke="#fff"
        strokeOpacity=".92"
        strokeWidth="2.2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 1, ease: 'easeInOut' }}
      />
      {/* garis putus-putus yang terus mengalir */}
      <path
        d="M9 38c5-4 9 2 15-1s9-5 15-2"
        stroke="#C7D2FE"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 12"
        className="animate-dash-flow"
      />
    </svg>
  );
}

export function LogoFull({
  size = 40,
  light = false,
  showTagline = false,
}: {
  size?: number;
  light?: boolean;
  showTagline?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} />
      <div className="leading-tight">
        <p className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
          Study<span className={light ? 'text-indigo-200' : 'text-brand-600'}>Flow</span>
        </p>
        {showTagline && (
          <p className={`text-xs font-medium ${light ? 'text-indigo-100' : 'text-slate-500'}`}>
            Organize Your School Life
          </p>
        )}
      </div>
    </div>
  );
}
