import { cn } from '@/app/lib/utils/cn';
import type { ReactNode } from 'react';

interface MetricTileProps {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  accent?: 'yellow' | 'blue' | 'green' | 'red' | 'none';
  icon?: ReactNode;
  className?: string;
}

const accentBorders = {
  yellow: 'border-volta-yellow/35',
  blue: 'border-volta-blue/35',
  green: 'border-volta-green/35',
  red: 'border-volta-red/35',
  none: 'border-volta-white/10',
};
const accentText = {
  yellow: 'text-volta-yellow',
  blue: 'text-volta-blue',
  green: 'text-volta-green',
  red: 'text-volta-red',
  none: 'text-volta-white',
};

export function MetricTile({ label, value, trend, accent = 'none', icon, className }: MetricTileProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-volta-white/[0.03] p-3',
        accentBorders[accent],
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wide text-volta-white/45">{label}</p>
        {icon && (
          <span className={cn('flex h-6 w-6 items-center justify-center rounded-md', `bg-volta-${accent === 'none' ? 'white' : accent}/15`, accentText[accent])}>
            {icon}
          </span>
        )}
      </div>
      <p
        style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
        className={cn('mt-1 text-lg', accentText[accent])}
      >
        {value}
      </p>
      {trend && <p className="mt-0.5 text-[11px] text-volta-white/50">{trend}</p>}
    </div>
  );
}
