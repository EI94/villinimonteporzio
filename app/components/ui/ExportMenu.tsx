'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';

export type ExportFormat = 'pdf' | 'csv' | 'json';

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
}

const items: { format: ExportFormat; label: string; description: string; icon: React.ReactNode }[] = [
  { format: 'pdf', label: 'Report PDF', description: 'Documento grafico, pronto da stampare', icon: <FileText className="h-4 w-4" strokeWidth={1.75} /> },
  { format: 'csv', label: 'Foglio dati CSV', description: 'Serie oraria completa per Excel', icon: <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} /> },
  { format: 'json', label: 'Dati JSON', description: 'Per integrazioni e sviluppo', icon: <FileJson className="h-4 w-4" strokeWidth={1.75} /> },
];

export function ExportMenu({ onExport }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-lg border border-volta-white/20 bg-volta-black px-4 text-sm text-volta-white',
          'hover:bg-volta-white/5 transition-colors duration-200 touch-manipulation',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volta-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-volta-black',
        )}
      >
        <Download className="h-4 w-4" strokeWidth={1.75} />
        Esporta
        <ChevronDown className={cn('h-3.5 w-3.5 text-volta-white/50 transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.75} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-64 animate-dropdown-in rounded-xl border border-volta-white/15 bg-volta-black p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          {items.map((item) => (
            <button
              key={item.format}
              type="button"
              onClick={() => {
                onExport(item.format);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-volta-white/5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-volta-yellow/15 text-volta-yellow">
                {item.icon}
              </span>
              <div className="min-w-0">
                <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
                  {item.label}
                </p>
                <p className="text-[11px] text-volta-white/50">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
