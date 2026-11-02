'use client';

import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { SvgLoader } from '@/components/svg/Loader';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  full?: boolean;
  children?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow hover:brightness-110',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  danger: 'bg-rose-500 text-white shadow-[0_8px_20px_-8px_rgba(244,63,94,.6)] hover:bg-rose-600',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 rounded-xl px-3 text-sm',
  md: 'h-11 gap-2 rounded-2xl px-5 text-[15px]',
  lg: 'h-12 gap-2 rounded-2xl px-6 text-base',
};

/** Tombol dengan micro-interaction: menyusut saat ditekan, sedikit naik saat hover. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  full = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <motion.button
      type={type}
      disabled={inactive}
      whileTap={inactive ? undefined : { scale: 0.95 }}
      whileHover={inactive ? undefined : { y: -1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`inline-flex select-none items-center justify-center whitespace-nowrap font-semibold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${
        full ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {loading ? <SvgLoader size={18} /> : icon}
      {children}
    </motion.button>
  );
}

export function IconButton({
  label,
  children,
  className = '',
  type = 'button',
  ...rest
}: Omit<HTMLMotionProps<'button'>, 'children'> & { label: string; children: ReactNode }) {
  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.88 }}
      className={`grid h-9 w-9 place-items-center rounded-xl text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-4 focus-visible:ring-brand-200 disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
