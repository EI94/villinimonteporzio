'use client';

import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SimulationTotals } from '@/app/lib/energy/simulator';
import { SEASONS, type SeasonKey } from '@/app/lib/energy/constants';

interface SeasonalChartProps {
  data: Record<SeasonKey, SimulationTotals>;
}

export function SeasonalEnergyChart({ data }: SeasonalChartProps) {
  const chartData = (Object.keys(SEASONS) as SeasonKey[]).map((key) => ({
    season: SEASONS[key].label,
    Produzione: Math.round(data[key].pvKwh),
    Consumo: Math.round(data[key].loadKwh),
    'Autoconsumo': Math.round(data[key].selfConsumedKwh),
    color: SEASONS[key].color,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="season" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} unit=" kWh" />
        <Tooltip
          contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: '#FFE42B', fontWeight: 600 }}
          formatter={(v: number) => `${v.toLocaleString('it-IT')} kWh`}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }} />
        <Bar dataKey="Produzione" fill="#FFE42B" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Consumo" fill="#818CF8" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Autoconsumo" fill="#009336" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SeasonalEconomicsChart({ data }: SeasonalChartProps) {
  const chartData = (Object.keys(SEASONS) as SeasonKey[]).map((key) => ({
    season: SEASONS[key].label,
    'Ritiro Dedicato': Math.round(data[key].revenueRdEur),
    CER: Math.round(data[key].revenueCerEur),
    'Risparmio': Math.round(data[key].avoidedCostEur),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="season" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} unit=" €" />
        <Tooltip
          contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: '#FFE42B', fontWeight: 600 }}
          formatter={(v: number) => `${v.toLocaleString('it-IT')} €`}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }} />
        <Bar dataKey="Ritiro Dedicato" fill="#359EFE" radius={[6, 6, 0, 0]} />
        <Bar dataKey="CER" fill="#009336" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Risparmio" fill="#FFE42B" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
