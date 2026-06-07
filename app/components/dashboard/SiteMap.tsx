'use client';

import { MapPin } from 'lucide-react';
import { VoltaCard, VoltaPill } from '@/app/components/ui';

/**
 * Mini-mappa schematica Monteporzio Catone — Castelli Romani.
 * Coordinate: 41.813°N, 12.722°E, ~450 m s.l.m.
 */
export function SiteMap() {
  return (
    <VoltaCard variant="elevated" padding="none" glowColor="blue" className="overflow-hidden">
      <div className="relative h-44 w-full">
        <svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <defs>
            <linearGradient id="terrain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2230" />
              <stop offset="100%" stopColor="#0E141C" />
            </linearGradient>
            <radialGradient id="pulse" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FFE42B" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#FFE42B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFE42B" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="320" height="160" fill="url(#terrain)" />

          {/* Strade dei Castelli */}
          <path d="M 10 120 Q 110 100 180 78 T 312 40" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2.2" />
          <path d="M 30 150 Q 120 120 200 116 T 315 96" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.6" />
          <path d="M 180 78 L 150 158" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />

          {/* Macchia verde collinare (boschi dei Castelli) */}
          <path d="M 20 24 Q 70 8 130 20 Q 170 28 150 56 Q 110 70 60 60 Q 20 50 20 24 Z" fill="rgba(34,197,94,0.10)" stroke="rgba(34,197,94,0.25)" strokeWidth="0.6" />
          <text x="78" y="42" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="Instrument Sans, sans-serif" fontWeight="500">
            PARCO DEI CASTELLI
          </text>

          {/* Indicazione Roma */}
          <text x="34" y="134" fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="Instrument Sans, sans-serif" fontWeight="600" letterSpacing="0.5">
            ROMA ←
          </text>
          {/* Indicazione Frascati */}
          <text x="250" y="120" fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="Instrument Sans, sans-serif" fontWeight="500">
            FRASCATI
          </text>

          {/* Pin Monteporzio Living */}
          <g transform="translate(196, 84)">
            <circle r="22" fill="url(#pulse)">
              <animate attributeName="r" values="14;26;14" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle r="3.6" fill="#FFE42B" stroke="#000" strokeWidth="0.5" />
            <text x="0" y="-9" textAnchor="middle" fontSize="6.5" fill="#FFE42B" fontFamily="Instrument Sans, sans-serif" fontWeight="600">
              MONTEPORZIO LIVING
            </text>
          </g>

          {/* Scala */}
          <line x1="240" y1="148" x2="298" y2="148" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="240" y1="145" x2="240" y2="151" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="298" y1="145" x2="298" y2="151" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <text x="269" y="156" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.5)" fontFamily="Instrument Sans, sans-serif">
            2 km
          </text>

          {/* Nord */}
          <g transform="translate(298, 22)">
            <circle r="9" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <path d="M 0 -5 L 2 3 L 0 1 L -2 3 Z" fill="#FFE42B" />
            <text x="0" y="14" textAnchor="middle" fontSize="4.5" fill="rgba(255,255,255,0.55)" fontFamily="Instrument Sans, sans-serif" fontWeight="600">
              N
            </text>
          </g>
        </svg>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-volta-white/10 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-volta-blue/15 text-volta-blue">
            <MapPin className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p
              style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
              className="text-xs text-volta-white truncate"
            >
              Monteporzio Catone (RM)
            </p>
            <p className="text-[10px] text-volta-white/55">41.813°N · 12.722°E · 450 m s.l.m.</p>
          </div>
        </div>
        <VoltaPill variant="info">Zona D</VoltaPill>
      </div>
    </VoltaCard>
  );
}
