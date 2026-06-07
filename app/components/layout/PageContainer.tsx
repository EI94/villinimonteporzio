import { cn } from '@/app/lib/utils/cn';
import type { ReactNode } from 'react';

interface PageContainerProps {
  size?: 'default' | 'wide' | 'full';
  bleed?: boolean;
  children: ReactNode;
  className?: string;
}

const sizeMax = {
  default: 'max-w-[1280px]',
  wide: 'max-w-[1480px]',
  full: 'max-w-none',
};

export function PageContainer({ size = 'default', bleed = false, children, className }: PageContainerProps) {
  return (
    <div className={cn('w-full mx-auto', sizeMax[size], !bleed && 'px-4 md:px-6 lg:px-8 py-6 md:py-8', className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, eyebrow, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8', className)}>
      <div className="space-y-2">
        {eyebrow}
        <h1
          style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
          className="text-2xl md:text-4xl text-volta-white leading-tight"
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
            className="text-sm md:text-base text-volta-white/65 max-w-2xl"
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

interface PageSectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  divider?: boolean;
  children: ReactNode;
  className?: string;
}

export function PageSection({ title, description, action, divider, children, className }: PageSectionProps) {
  return (
    <section className={cn('mb-8', divider && 'border-b border-volta-white/10 pb-8', className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            {title && (
              <h2
                style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
                className="text-xl md:text-2xl text-volta-white"
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
                className="text-xs md:text-sm text-volta-white/60 mt-1 max-w-2xl"
              >
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

interface PageGridProps {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}

const colsMap = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
  6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
  12: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12',
};
const gapMap = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export function PageGrid({ cols = 3, gap = 'md', children, className }: PageGridProps) {
  return <div className={cn('grid', colsMap[cols], gapMap[gap], className)}>{children}</div>;
}
