/** Formatter numerici Volta */

export function formatKwh(v: number, decimals = 0): string {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1000) {
    return `${(v / 1000).toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals + 1 })} MWh`;
  }
  return `${v.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} kWh`;
}

export function formatKw(v: number, decimals = 1): string {
  if (!Number.isFinite(v)) return '—';
  return `${v.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} kW`;
}

export function formatEur(v: number, decimals = 0): string {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPct(v: number, decimals = 0): string {
  if (!Number.isFinite(v)) return '—';
  return `${(v * 100).toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}

export function formatTemp(v: number, decimals = 1): string {
  if (!Number.isFinite(v)) return '—';
  return `${v.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}°C`;
}
