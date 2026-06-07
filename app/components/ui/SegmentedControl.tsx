'use client';

import { cn } from '@/app/lib/utils/cn';
import type { ReactNode } from 'react';

interface SegmentedOption<T> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex gap-1 rounded-lg border border-volta-white/10 bg-volta-white/5 p-1',
        fullWidth && 'w-full',
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value as string}
            type="button"
            onClick={() => onChange(o.value)}
            style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md transition-all duration-200 touch-manipulation',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volta-yellow ring-offset-volta-black',
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
              fullWidth && 'flex-1',
              active
                ? 'bg-volta-yellow text-volta-black shadow-[0_0_12px_rgba(255,228,43,0.25)]'
                : 'text-volta-white/55 hover:bg-volta-white/10 hover:text-volta-white',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
