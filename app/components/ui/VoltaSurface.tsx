'use client';

import { forwardRef, type HTMLAttributes, type ReactNode, type MouseEvent } from 'react';
import { cn } from '@/app/lib/utils/cn';

type SurfaceVariant = 'default' | 'elevated' | 'subtle';
type GlowColor = 'yellow' | 'blue' | 'green' | 'none';

interface VoltaCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  glowColor?: GlowColor;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses: Record<SurfaceVariant, string> = {
  default: 'bg-volta-black border border-volta-white/10',
  elevated: 'bg-volta-white/[0.03] border border-volta-white/10',
  subtle: 'bg-volta-white/[0.02] border border-volta-white/[0.06]',
};

const glowClasses: Record<GlowColor, string> = {
  yellow: 'shadow-[0_0_24px_rgba(255,228,43,0.10)]',
  blue: 'shadow-[0_0_24px_rgba(53,158,254,0.12)]',
  green: 'shadow-[0_0_24px_rgba(0,147,54,0.10)]',
  none: '',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const VoltaCard = forwardRef<HTMLDivElement, VoltaCardProps>(
  ({ variant = 'default', glowColor = 'none', hover = false, padding = 'md', className, children, onMouseMove, ...props }, ref) => {
    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
      if (hover) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        e.currentTarget.style.setProperty('--mx', `${x}%`);
        e.currentTarget.style.setProperty('--my', `${y}%`);
      }
      onMouseMove?.(e);
    };

    return (
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        className={cn(
          'rounded-xl transition-all duration-300',
          variantClasses[variant],
          glowClasses[glowColor],
          paddingClasses[padding],
          hover && 'volta-radial-hover hover:border-volta-white/20',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
VoltaCard.displayName = 'VoltaCard';

interface VoltaPillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'accent' | 'default' | 'subtle' | 'success' | 'warning' | 'danger' | 'info';
  icon?: ReactNode;
}

const pillVariants: Record<NonNullable<VoltaPillProps['variant']>, string> = {
  accent: 'bg-volta-yellow/15 text-volta-yellow border border-volta-yellow/30',
  default: 'bg-volta-white/10 text-volta-white border border-volta-white/15',
  subtle: 'bg-volta-white/[0.04] text-volta-white/70 border border-volta-white/10',
  success: 'bg-volta-green/15 text-volta-green border border-volta-green/30',
  warning: 'bg-volta-yellow/15 text-volta-yellow border border-volta-yellow/30',
  danger: 'bg-volta-red/15 text-volta-red border border-volta-red/30',
  info: 'bg-volta-blue/15 text-volta-blue border border-volta-blue/30',
};

export function VoltaPill({ variant = 'default', icon, className, children, ...props }: VoltaPillProps) {
  return (
    <span
      style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wide',
        pillVariants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
