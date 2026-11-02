/** Loader SVG: busur berputar (CSS keyframes) di atas lingkaran jejak. */
export function SvgLoader({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      className={className}
      role="status"
      aria-label="Memuat"
    >
      <circle cx="25" cy="25" r="20" stroke="currentColor" strokeOpacity=".2" strokeWidth="5" />
      <g className="animate-orbit-spin" style={{ transformOrigin: '25px 25px' }}>
        <path d="M25 5a20 20 0 0 1 20 20" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function PageLoader({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="grid min-h-[50dvh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-brand-600">
        <SvgLoader size={44} />
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
}
