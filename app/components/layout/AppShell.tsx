'use client';

import { useState, type ReactNode } from 'react';
import {
  Activity,
  BatteryFull,
  Building2,
  Cog,
  Compass,
  Gauge,
  Home,
  LineChart,
  Mountain,
  Sun,
  Users,
  Wallet,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';
import { VoltaLogo } from '@/app/components/ui/VoltaLogo';

interface NavItem {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  { icon: <Gauge className="h-4 w-4" strokeWidth={1.75} />, label: 'Panoramica', active: true },
  { icon: <Sun className="h-4 w-4" strokeWidth={1.75} />, label: 'Produzione PV' },
  { icon: <BatteryFull className="h-4 w-4" strokeWidth={1.75} />, label: 'Accumulo' },
  { icon: <Activity className="h-4 w-4" strokeWidth={1.75} />, label: 'Flussi live' },
  { icon: <Building2 className="h-4 w-4" strokeWidth={1.75} />, label: 'Edificio' },
  { icon: <Users className="h-4 w-4" strokeWidth={1.75} />, label: 'Comunità', badge: 'CER' },
  { icon: <Wallet className="h-4 w-4" strokeWidth={1.75} />, label: 'Economia' },
  { icon: <LineChart className="h-4 w-4" strokeWidth={1.75} />, label: 'Storico' },
  { icon: <Cog className="h-4 w-4" strokeWidth={1.75} />, label: 'Impostazioni' },
];

interface AppShellProps {
  children: ReactNode;
  topbarRight?: ReactNode;
}

export function AppShell({ children, topbarRight }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-volta-black flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-volta-white/10 bg-volta-black transition-transform duration-300 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-volta-white/10 px-4">
          <VoltaLogo color="#FFFFFF" height={20} />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-volta-white/60 hover:text-volta-white"
            aria-label="Chiudi menu"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          <p className="px-3 pt-2 pb-1.5 text-[10px] uppercase tracking-[0.18em] text-volta-white/35">
            Monteporzio Living
          </p>
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-200 touch-manipulation',
                item.active
                  ? 'bg-volta-yellow/20 text-volta-yellow'
                  : 'text-volta-white/80 hover:bg-volta-white/5 hover:text-volta-white',
              )}
              style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: item.active ? 600 : 500 }}
            >
              <span className="flex items-center gap-2.5 truncate">
                {item.icon}
                {item.label}
              </span>
              {item.badge && (
                <span className="rounded-full bg-volta-green/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-volta-green">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mx-3 mt-2 rounded-xl border border-volta-white/10 bg-volta-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <Mountain className="h-4 w-4 text-volta-blue" strokeWidth={1.75} />
            <span
              style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
              className="text-xs text-volta-white"
            >
              Castelli Romani
            </span>
          </div>
          <p className="mt-1 text-[11px] text-volta-white/55">450 m s.l.m. · Zona D · 1.450 GG</p>
          <div className="mt-2 flex items-center gap-1.5">
            <Compass className="h-3 w-3 text-volta-white/45" strokeWidth={1.75} />
            <p className="text-[10px] text-volta-white/45">41.81°N · 12.72°E</p>
          </div>
        </div>
        <div className="mx-3 mt-3 rounded-xl border border-volta-yellow/20 bg-volta-yellow/[0.05] p-3">
          <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-xs text-volta-yellow">
            Volta App
          </p>
          <p className="mt-1 text-[11px] text-volta-white/65 leading-snug">
            Ottimizzazione produzione, consumo e scambio con la CER in tempo reale.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-volta-yellow/20 px-2 py-0.5 text-[9px] uppercase tracking-wide text-volta-yellow">
            <Home className="h-3 w-3" strokeWidth={2} /> Connessa
          </span>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-volta-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 flex min-w-0 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-volta-white/10 bg-volta-black/95 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-volta-white/70 hover:text-volta-white"
              aria-label="Apri menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-volta-white/45">Complesso</p>
              <p
                style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
                className="text-sm text-volta-white"
              >
                Monteporzio Living · Castelli Romani
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">{topbarRight}</div>
        </header>

        <main className="flex-1 overflow-y-auto bg-volta-black">{children}</main>
      </div>
    </div>
  );
}
