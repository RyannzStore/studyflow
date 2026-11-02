import type { ReactNode } from 'react';

function Sparkle({ x, y, delay, size = 1 }: { x: number; y: number; delay: string; size?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path
        d="M0-8 L2-2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2-2Z"
        fill="#a5b4fc"
        className="animate-twinkle"
        style={{ animationDelay: delay, transformOrigin: '0px 0px' }}
      />
    </g>
  );
}

/** Ilustrasi empty-state SVG orisinal: clipboard kosong, pensil melayang, kilau berkedip. */
export function EmptyIllustration({ size = 180 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 160) / 200} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      {/* bayangan tanah */}
      <ellipse
        cx="100"
        cy="142"
        rx="46"
        ry="6"
        fill="#4338ca"
        className="animate-shadow-pulse"
        style={{ transformOrigin: '100px 142px' }}
      />
      {/* clipboard (melayang pelan) */}
      <g className="animate-float">
        <rect x="56" y="26" width="88" height="108" rx="16" fill="#fff" stroke="#c7d2fe" strokeWidth="3" />
        <rect x="80" y="17" width="40" height="18" rx="7" fill="#6366f1" />
        <circle cx="100" cy="26" r="3" fill="#e0e7ff" />
        <rect x="72" y="52" width="56" height="7" rx="3.5" fill="#e0e7ff" />
        <rect x="72" y="68" width="40" height="7" rx="3.5" fill="#eef2ff" />
        <rect x="72" y="84" width="48" height="7" rx="3.5" fill="#e0e7ff" />
        <rect x="72" y="100" width="30" height="7" rx="3.5" fill="#eef2ff" />
        <circle cx="122" cy="108" r="9" fill="#eef2ff" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="3 3" />
      </g>
      {/* pensil (melayang lambat) */}
      <g className="animate-float-slow" style={{ animationDelay: '-3s' }}>
        <g transform="translate(150 70) rotate(35)">
          <rect x="-5" y="-26" width="10" height="38" rx="3" fill="#8b5cf6" />
          <rect x="-5" y="-26" width="10" height="8" rx="3" fill="#c4b5fd" />
          <path d="M-5 12 L0 24 L5 12 Z" fill="#fde68a" />
          <path d="M-1.8 20 L0 24 L1.8 20 Z" fill="#4338ca" />
        </g>
      </g>
      <Sparkle x={34} y={44} delay="0s" />
      <Sparkle x={164} y={30} delay="-1s" size={0.8} />
      <Sparkle x={42} y={110} delay="-2s" size={0.7} />
      <Sparkle x={170} y={120} delay="-1.5s" size={0.9} />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'py-6' : 'py-12'}`}>
      <EmptyIllustration size={compact ? 130 : 180} />
      <h3 className="mt-2 text-lg font-bold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
