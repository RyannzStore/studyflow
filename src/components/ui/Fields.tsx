import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export function Field({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
}: {
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ invalid, className = '', ...rest }: InputProps) {
  return <input className={`input ${invalid ? 'input-error' : ''} ${className}`} aria-invalid={invalid || undefined} {...rest} />;
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export function Textarea({ invalid, className = '', rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={`input resize-y ${invalid ? 'input-error' : ''} ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ invalid, className = '', children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`input appearance-none pr-10 ${invalid ? 'input-error' : ''} ${className}`}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
