'use client';

import { type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/app/lib/utils/cn';

interface VoltaSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  valueLabel: ReactNode;
  helper?: string;
  accentColor?: 'yellow' | 'blue' | 'green' | 'red';
}

export function VoltaSlider({
  label,
  valueLabel,
  helper,
  accentColor = 'yellow',
  className,
  ...props
}: VoltaSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
          className="text-xs uppercase tracking-wide text-volta-white/60"
        >
          {label}
        </span>
        <span
          style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
          className={cn(
            'text-sm font-semibold',
            accentColor === 'yellow' && 'text-volta-yellow',
            accentColor === 'blue' && 'text-volta-blue',
            accentColor === 'green' && 'text-volta-green',
            accentColor === 'red' && 'text-volta-red',
          )}
        >
          {valueLabel}
        </span>
      </div>
      <input type="range" className={cn('volta-range', className)} {...props} />
      {helper && <span className="text-[11px] text-volta-white/45">{helper}</span>}
    </div>
  );
}
