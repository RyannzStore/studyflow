import type { HTMLAttributes, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { TONE_CLASSES, type Tone } from '@/lib/constants';
import type { Subject } from '@/lib/types';
import { Button } from './Button';

export function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Badge({
  tone = 'slate',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Label mata pelajaran dengan warna khasnya. */
export function SubjectBadge({ subject, className = '' }: { subject: Pick<Subject, 'short_name' | 'color'> | null | undefined; className?: string }) {
  if (!subject) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
      style={{ backgroundColor: `${subject.color}1f`, color: subject.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
      {subject.short_name}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`} />;
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 shrink-0 !rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertCircle size={26} />
      </span>
      <div>
        <h3 className="font-bold text-slate-800">Gagal memuat data</h3>
        <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
      </div>
      {onRetry && (
        <Button variant="soft" size="sm" icon={<RefreshCw size={16} />} onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-extrabold text-slate-900">{children}</h2>
      {action}
    </div>
  );
}
