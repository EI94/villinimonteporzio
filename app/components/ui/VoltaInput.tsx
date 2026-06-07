'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/app/lib/utils/cn';

interface VoltaInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  suffix?: ReactNode;
}

export const VoltaInput = forwardRef<HTMLInputElement, VoltaInputProps>(
  ({ label, helper, error, iconLeft, iconRight, suffix, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
            className="text-xs text-volta-white/60 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {iconLeft && <span className="absolute left-3 text-volta-white/40">{iconLeft}</span>}
          <input
            ref={ref}
            id={inputId}
            style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
            className={cn(
              'w-full bg-volta-black border rounded-lg px-3 py-2.5 text-sm text-volta-white placeholder-volta-white/40',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volta-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-volta-black',
              error ? 'border-volta-red focus:ring-volta-red' : 'border-volta-white/20 hover:border-volta-white/30',
              iconLeft && 'pl-9',
              (iconRight || suffix) && 'pr-12',
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-xs text-volta-white/50 uppercase tracking-wide">{suffix}</span>
          )}
          {iconRight && <span className="absolute right-3 text-volta-white/40">{iconRight}</span>}
        </div>
        {(helper || error) && (
          <span className={cn('text-xs', error ? 'text-volta-red' : 'text-volta-white/50')}>{error ?? helper}</span>
        )}
      </div>
    );
  },
);
VoltaInput.displayName = 'VoltaInput';
