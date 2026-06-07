'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface VoltaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-volta-yellow text-volta-black hover:opacity-90 active:opacity-80',
  secondary: 'bg-volta-black border border-volta-white/20 text-volta-white hover:bg-volta-white/5',
  ghost: 'text-volta-white hover:bg-volta-white/5',
  danger: 'bg-volta-red text-volta-white hover:opacity-90',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2',
  icon: 'h-10 w-10 rounded-lg justify-center',
};

export const VoltaButton = forwardRef<HTMLButtonElement, VoltaButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
        className={cn(
          'inline-flex items-center justify-center select-none transition-all duration-200 touch-manipulation',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volta-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-volta-black',
          'active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : icon}
        {children}
        {iconRight}
      </button>
    );
  },
);
VoltaButton.displayName = 'VoltaButton';
