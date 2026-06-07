/**
 * Volta Design System — Source of truth brand tokens
 * Riferimento: docs/VOLTA_BRAND_GUIDELINES_2026.md
 */

export const voltaColors = {
  black: '#000000',
  white: '#FFFFFF',
  yellow: '#FFE42B',
  green: '#009336',
  red: '#FB3615',
  blue: '#359EFE',
  dark: '#1A1A1A',
} as const;

export const voltaTypography = {
  fontFamily: 'Instrument Sans, Arial, sans-serif',
  weights: {
    body: 500,
    heading: 600,
    bold: 700,
  },
} as const;

export const voltaSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const voltaRadius = {
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const voltaMotion = {
  fast: 150,
  normal: 200,
  slow: 300,
  premium: 500,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/** Colori semantici per i grafici energia (definiti nel design system per i flussi) */
export const energyChartColors = {
  solar: '#FFE42B',
  batteryCharging: '#22C55E',
  batteryDischarging: '#F59E0B',
  batteryIdle: '#3B82F6',
  home: '#818CF8',
  gridExport: '#10B981',
  gridImport: '#EF4444',
  heatPump: '#359EFE',
  community: '#009336',
} as const;
