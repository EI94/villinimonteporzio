'use client';

import { cn } from '@/app/lib/utils/cn';

interface VoltaToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}

export function VoltaToggle({ label, description, checked, onChange, icon }: VoltaToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all duration-200 touch-manipulation',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volta-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-volta-black',
        checked
          ? 'bg-volta-yellow/[0.06] border-volta-yellow/30 shadow-[0_0_20px_rgba(255,228,43,0.1)]'
          : 'bg-volta-white/[0.03] border-volta-white/10 hover:border-volta-white/20',
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200',
              checked ? 'bg-volta-yellow/20 text-volta-yellow' : 'bg-volta-white/5 text-volta-white/50',
            )}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p
            style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
            className="text-sm text-volta-white truncate"
          >
            {label}
          </p>
          {description && <p className="text-[11px] text-volta-white/55 truncate">{description}</p>}
        </div>
      </div>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-volta-yellow' : 'bg-volta-white/15',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-volta-black transition-transform duration-200',
            checked && 'translate-x-5',
          )}
        />
      </span>
    </button>
  );
}
