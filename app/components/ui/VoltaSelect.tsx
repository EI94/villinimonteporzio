'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';

interface Option<T> {
  value: T;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface VoltaSelectProps<T extends string> {
  label?: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  className?: string;
}

export function VoltaSelect<T extends string>({ label, value, options, onChange, className }: VoltaSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={ref}>
      {label && (
        <span
          style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
          className="text-xs uppercase tracking-wide text-volta-white/60"
        >
          {label}
        </span>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg',
            'bg-volta-black border border-volta-white/20 text-sm text-volta-white',
            'hover:border-volta-white/30 transition-colors duration-200 touch-manipulation',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volta-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-volta-black',
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {current.icon}
            {current.label}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-volta-white/50 transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.75} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 mt-1.5 z-50 animate-dropdown-in rounded-lg border border-volta-white/15 bg-volta-black p-1 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <button
                  key={o.value as string}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm text-left',
                    'transition-colors duration-150',
                    selected
                      ? 'bg-volta-yellow/10 text-volta-yellow'
                      : 'text-volta-white hover:bg-volta-white/5',
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {o.icon}
                    <span className="truncate">{o.label}</span>
                  </span>
                  {selected && <Check className="h-4 w-4 text-volta-yellow" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
