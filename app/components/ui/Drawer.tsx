'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg';
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'md' }: DrawerProps) {
  // Monta il portal solo lato client (evita mismatch di hydration)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={cn('fixed inset-0 z-[80] transition-opacity duration-300', open ? 'opacity-100' : 'pointer-events-none opacity-0')}>
      <div className="absolute inset-0 bg-volta-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute right-0 top-0 flex h-full w-full flex-col border-l border-volta-white/10 bg-volta-black transition-transform duration-300',
          width === 'lg' ? 'max-w-[560px]' : 'max-w-[440px]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-volta-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2
              style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
              className="text-lg text-volta-white"
            >
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-volta-white/55">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-volta-white/15 text-volta-white/70 hover:text-volta-white hover:border-volta-white/30 transition-colors duration-200"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-volta-white/10 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
