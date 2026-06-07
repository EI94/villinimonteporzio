'use client';

import { ArrowDownRight, ArrowUpRight, BatteryFull, Sparkles, Sun, TrendingUp, Wallet, Wind } from 'lucide-react';
import { VoltaCard, VoltaPill } from '@/app/components/ui';
import type { SimulationTotals } from '@/app/lib/energy/simulator';
import { formatEur, formatKwh, formatPct } from '@/app/lib/energy/format';

interface HeroKpiProps {
  totals: SimulationTotals;
  pvPeakKw: number;
  batteryKwh: number;
  cerEnabled: boolean;
}

export function HeroKpi({ totals, pvPeakKw, batteryKwh, cerEnabled }: HeroKpiProps) {
  const ssr = formatPct(totals.selfSufficiencyRate, 0);
  const scr = formatPct(totals.selfConsumptionRate, 0);
  const bestNet = cerEnabled ? totals.netCashFlowCerEur : totals.netCashFlowRdEur;
  const cerVsRd = totals.netCashFlowCerEur - totals.netCashFlowRdEur;

  const items = [
    {
      label: 'Produzione PV annua',
      value: formatKwh(totals.pvKwh, 0),
      trend: `${(totals.pvKwh / pvPeakKw).toFixed(0)} kWh/kWp · ${formatPct(totals.pvKwh / (pvPeakKw * 8760), 1)} CF`,
      icon: <Sun className="h-4 w-4" strokeWidth={1.75} />,
      accent: 'yellow' as const,
    },
    {
      label: 'Autosufficienza',
      value: ssr,
      trend: `Autoconsumo PV ${scr} · batteria ${batteryKwh.toFixed(0)} kWh`,
      icon: <Sparkles className="h-4 w-4" strokeWidth={1.75} />,
      accent: 'green' as const,
    },
    {
      label: 'Energia da rete',
      value: formatKwh(totals.gridImportKwh, 0),
      trend: `Picco prelievo ${totals.peakImportKw.toFixed(1)} kW`,
      icon: <ArrowDownRight className="h-4 w-4" strokeWidth={1.75} />,
      accent: 'red' as const,
    },
    {
      label: 'Energia immessa',
      value: formatKwh(totals.gridExportKwh, 0),
      trend: `Condivisa CER ${formatKwh(totals.sharedWithCerKwh, 0)}`,
      icon: <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />,
      accent: 'green' as const,
    },
    {
      label: 'Cash flow netto/anno',
      value: formatEur(bestNet, 0),
      trend: cerVsRd > 0
        ? `CER +${formatEur(cerVsRd, 0)} vs Ritiro Ded.`
        : `Ritiro Ded. +${formatEur(-cerVsRd, 0)} vs CER`,
      icon: <Wallet className="h-4 w-4" strokeWidth={1.75} />,
      accent: bestNet >= 0 ? ('green' as const) : ('red' as const),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item) => (
        <VoltaCard key={item.label} variant="elevated" glowColor={item.accent === 'green' ? 'green' : item.accent === 'yellow' ? 'yellow' : 'none'} padding="md">
          <div className="flex items-center justify-between gap-2">
            <p
              style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
              className="text-[10px] uppercase tracking-wide text-volta-white/45"
            >
              {item.label}
            </p>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-md ${
                item.accent === 'yellow'
                  ? 'bg-volta-yellow/20 text-volta-yellow'
                  : item.accent === 'green'
                  ? 'bg-volta-green/20 text-volta-green'
                  : 'bg-volta-red/20 text-volta-red'
              }`}
            >
              {item.icon}
            </span>
          </div>
          <p
            style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
            className="mt-2 text-xl md:text-2xl text-volta-white tabular-nums"
          >
            {item.value}
          </p>
          <p className="mt-1 text-[11px] text-volta-white/50 leading-snug">{item.trend}</p>
        </VoltaCard>
      ))}
    </div>
  );
}
