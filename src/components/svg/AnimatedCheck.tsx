'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Checkmark animasi: lingkaran terisi + centang tergambar + pulse saat dicentang.
 * Tidak beranimasi saat pertama kali tampil (hanya ketika status berubah).
 */
export function AnimatedCheck({
  checked,
  size = 28,
  color = '#10b981',
}: {
  checked: boolean;
  size?: number;
  color?: string;
}) {
  const prev = useRef(checked);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const was = prev.current;
    prev.current = checked;
    if (!was && checked) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 600);
      return () => clearTimeout(t);
    }
  }, [checked]);

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      initial={false}
      animate={{ scale: checked ? [1, 1.18, 1] : 1 }}
      transition={{ duration: 0.35 }}
    >
      <motion.circle
        cx="14"
        cy="14"
        r="12"
        strokeWidth="2"
        initial={false}
        animate={{ fill: checked ? color : '#ffffff', stroke: checked ? color : '#cbd5e1' }}
        transition={{ duration: 0.2 }}
      />
      <motion.path
        d="M8.5 14.5l3.8 3.8 7.2-8"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      {burst && (
        <motion.circle
          cx="14"
          cy="14"
          r="12"
          stroke={color}
          strokeWidth="2"
          fill="none"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.svg>
  );
}
