'use client';

import { Area, AreaChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TypicalDay } from '@/app/lib/energy/simulator';

interface EnergyTimelineProps {
  data: TypicalDay[];
  showHp?: boolean;
}

export function EnergyTimeline({ data, showHp = true }: EnergyTimelineProps) {
  const chartData = data.map((d) => ({
    hour: `${d.hour.toString().padStart(2, '0')}:00`,
    PV: Number(d.pvKwh.toFixed(2)),
    Carico: Number(d.loadKwh.toFixed(2)),
    HP: Number(d.hpKwh.toFixed(2)),
    'Rete (import)': Number(d.gridImportKwh.toFixed(2)),
    'Rete (export)': Number(d.gridExportKwh.toFixed(2)),
    SoC: Number((d.batSoc * 100).toFixed(0)),
    'Temp est.': Number(d.tOut.toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE42B" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#FFE42B" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="load" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818CF8" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#818CF8" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="hour" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} unit=" kW" />
        <Tooltip
          contentStyle={{
            background: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10,
            fontSize: 12,
            fontFamily: 'Instrument Sans, sans-serif',
          }}
          labelStyle={{ color: '#FFE42B', fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Instrument Sans, sans-serif' }} />
        <Area type="monotone" dataKey="PV" stroke="#FFE42B" strokeWidth={2} fill="url(#pv)" />
        <Area type="monotone" dataKey="Carico" stroke="#818CF8" strokeWidth={2} fill="url(#load)" />
        {showHp && <Line type="monotone" dataKey="HP" stroke="#359EFE" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GridFlowChart({ data }: { data: TypicalDay[] }) {
  const chartData = data.map((d) => ({
    hour: `${d.hour.toString().padStart(2, '0')}:00`,
    Import: Number(d.gridImportKwh.toFixed(2)),
    Export: -Number(d.gridExportKwh.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="imp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="exp" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="hour" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} unit=" kW" />
        <Tooltip
          contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: '#FFE42B', fontWeight: 600 }}
        />
        <Area type="monotone" dataKey="Import" stroke="#EF4444" strokeWidth={1.5} fill="url(#imp)" />
        <Area type="monotone" dataKey="Export" stroke="#10B981" strokeWidth={1.5} fill="url(#exp)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SocChart({ data }: { data: TypicalDay[] }) {
  const chartData = data.map((d) => ({
    hour: `${d.hour.toString().padStart(2, '0')}:00`,
    SoC: Number((d.batSoc * 100).toFixed(0)),
    'T esterna': Number(d.tOut.toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="soc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#22C55E" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="hour" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} unit="%" />
        <YAxis yAxisId="right" orientation="right" stroke="rgba(53,158,254,0.6)" fontSize={10} tickLine={false} axisLine={false} unit="°C" />
        <Tooltip
          contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: '#FFE42B', fontWeight: 600 }}
        />
        <Area yAxisId="left" type="monotone" dataKey="SoC" stroke="#22C55E" strokeWidth={2} fill="url(#soc)" />
        <Line yAxisId="right" type="monotone" dataKey="T esterna" stroke="#359EFE" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
