/**
 * Garis-garis SVG bergerak untuk latar halaman login.
 * Animasi memakai transform (translateX) pada wadah → di-composite GPU, ringan di Android.
 * Setiap path dibuat periodik (awal = akhir) sehingga loop-nya mulus tanpa patahan.
 */

interface Line {
  y: number;
  amp: number;
  width: number;
  opacity: number;
}

const LAYERS: { anim: string; lines: Line[] }[] = [
  {
    anim: 'animate-slide-x-slow',
    lines: [
      { y: 120, amp: 60, width: 2, opacity: 0.4 },
      { y: 430, amp: 90, width: 2.5, opacity: 0.3 },
    ],
  },
  {
    anim: 'animate-slide-x-mid',
    lines: [
      { y: 230, amp: 90, width: 1.5, opacity: 0.35 },
      { y: 520, amp: 55, width: 1.5, opacity: 0.25 },
    ],
  },
  {
    anim: 'animate-slide-x-fast',
    lines: [{ y: 330, amp: 70, width: 3, opacity: 0.28 }],
  },
];

function pathFor({ y, amp }: Line) {
  return `M0 ${y} C 100 ${y - amp}, 300 ${y - amp}, 400 ${y} S 700 ${y + amp}, 800 ${y}`;
}

export function LoginLines({ tone = 'light', className = '' }: { tone?: 'light' | 'dark'; className?: string }) {
  const stroke = tone === 'light' ? '#ffffff' : '#6366f1';
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {LAYERS.map((layer, li) => (
        <div key={li} className={`absolute inset-0 flex w-[200%] ${layer.anim}`}>
          {[0, 1].map((copy) => (
            <svg key={copy} className="h-full w-1/2" viewBox="0 0 800 600" preserveAspectRatio="none" fill="none">
              {layer.lines.map((line, i) => (
                <path
                  key={i}
                  d={pathFor(line)}
                  stroke={stroke}
                  strokeOpacity={line.opacity}
                  strokeWidth={line.width}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          ))}
        </div>
      ))}
    </div>
  );
}
