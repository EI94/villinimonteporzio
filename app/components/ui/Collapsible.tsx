'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';

interface CollapsibleProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

export function Collapsible({ title, description, icon, defaultOpen = false, badge, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-volta-white/10 bg-volta-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-volta-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volta-yellow focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-volta-white/5 text-volta-white/70">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <p
              style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
              className="text-sm text-volta-white truncate"
            >
              {title}
            </p>
            {description && <p className="text-[11px] text-volta-white/50 truncate">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <ChevronDown
            className={cn('h-4 w-4 text-volta-white/50 transition-transform duration-300', open && 'rotate-180')}
            strokeWidth={1.75}
          />
        </div>
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-volta-white/10 p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
