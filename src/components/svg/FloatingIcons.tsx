import { Atom, BookOpen, Calculator, GraduationCap, PencilRuler, Ruler, Backpack, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FloatingItem {
  Icon: LucideIcon;
  pos: string;
  box: number;
  icon: number;
  anim: string;
  delay: string;
  hideOnMobile?: boolean;
}

const ITEMS: FloatingItem[] = [
  { Icon: GraduationCap, pos: 'left-[8%] top-[14%]', box: 56, icon: 28, anim: 'animate-float', delay: '0s' },
  { Icon: BookOpen, pos: 'right-[10%] top-[10%]', box: 48, icon: 24, anim: 'animate-float-slow', delay: '-2s' },
  { Icon: PencilRuler, pos: 'left-[16%] bottom-[24%]', box: 52, icon: 26, anim: 'animate-float-slow', delay: '-4s' },
  { Icon: Backpack, pos: 'right-[16%] bottom-[18%]', box: 60, icon: 30, anim: 'animate-float', delay: '-1s' },
  { Icon: Calculator, pos: 'left-[46%] top-[40%]', box: 44, icon: 22, anim: 'animate-float', delay: '-3s', hideOnMobile: true },
  { Icon: Atom, pos: 'right-[34%] top-[58%]', box: 40, icon: 20, anim: 'animate-float-slow', delay: '-5s', hideOnMobile: true },
  { Icon: Ruler, pos: 'left-[30%] top-[8%]', box: 36, icon: 18, anim: 'animate-float', delay: '-2.5s', hideOnMobile: true },
  { Icon: Sparkles, pos: 'right-[6%] top-[44%]', box: 36, icon: 18, anim: 'animate-float-slow', delay: '-1.5s', hideOnMobile: true },
];

/** Ikon sekolah melayang (SVG dari Lucide + animasi CSS keyframes ringan). */
export function FloatingIcons({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {ITEMS.map(({ Icon, pos, box, icon, anim, delay, hideOnMobile }, i) => (
        <div
          key={i}
          className={`absolute place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 ${pos} ${anim} ${
            hideOnMobile ? 'hidden sm:grid' : 'grid'
          }`}
          style={{ width: box, height: box, animationDelay: delay }}
        >
          <Icon size={icon} strokeWidth={2} />
        </div>
      ))}
    </div>
  );
}
