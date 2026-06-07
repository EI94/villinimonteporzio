import { SITE_CLIMATE, PV_DEFAULT, SITE, type MonthClimate } from './constants';

/**
 * Modello PV semplificato hourly basato su:
 *  - Radiazione globale giornaliera (GHI) Atlante ENEA
 *  - Profilo gaussiano centrato sul mezzogiorno solare
 *  - Correzione tilt/azimuth (fattore approssimato per pendenza ottimale)
 *  - Derate per temperatura modulo + perdite sistema + inverter
 *  - Penalità copertura neve (probabilità mensile)
 */

export interface PvSystem {
  peakKw: number;
  tiltDeg: number;
  azimuthDeg: number;
  systemLoss: number;
  panelTempCoeff: number;
  inverterEff: number;
  snowDerateFactor: number;
}

/** Calcola fattore di trasposizione GHI→POA (Plane Of Array) approssimato */
function tiltFactor(tilt: number, latitude: number, month: number): number {
  // tilt ottimale ~ lat - 10 d'inverno, lat + 10 d'estate
  const isWinter = month <= 2 || month >= 11;
  const optimalTilt = isWinter ? latitude + 10 : latitude - 15;
  const delta = Math.abs(tilt - optimalTilt);
  // perdita ~ 0.3% per grado di deviazione
  return Math.max(0.7, 1 - delta * 0.003);
}

/** Distribuzione oraria realistica della radiazione (campana centrata sul mezzogiorno solare) */
function hourlyIrradianceShare(hour: number, daylightHours: number): number {
  const center = 12;
  const sigma = daylightHours / 3.5;
  const exponent = -Math.pow((hour - center) / sigma, 2) / 2;
  const gaussian = Math.exp(exponent);
  // normalizziamo: integrale circa 1
  const norm = sigma * Math.sqrt(2 * Math.PI);
  return gaussian / norm;
}

/** Produzione PV oraria stimata (kWh) per un'ora dell'anno */
export function pvProductionHourly(
  hour: number,
  month: number,
  pv: PvSystem = PV_DEFAULT,
  climate: MonthClimate = SITE_CLIMATE[month - 1],
  options?: { cloudFactor?: number; snowCoverage?: number },
): number {
  const cloudFactor = options?.cloudFactor ?? 1;
  const snowCoverage = options?.snowCoverage ?? climate.snowProb;

  const sunrise = 12 - climate.daylightHours / 2;
  const sunset = 12 + climate.daylightHours / 2;
  if (hour < sunrise || hour > sunset) return 0;

  // GHI istantanea (kW/m²) — ricostruita da daily * profilo orario
  const ghiHourly = climate.ghiDaily * hourlyIrradianceShare(hour, climate.daylightHours);
  // POA tilt corrected
  const poa = ghiHourly * tiltFactor(pv.tiltDeg, SITE.latitude, month);

  // Temperatura modulo: NOCT semplificato Tcell ≈ Tamb + 25 * POA
  const tAmbHour = climate.tMean + (climate.tMax - climate.tMin) * 0.5 * Math.sin(((hour - 9) * Math.PI) / 12);
  const tCell = tAmbHour + 25 * poa;
  const tempDerate = 1 + pv.panelTempCoeff * (tCell - 25);

  // Snow + cloud
  const snowDerate = 1 - snowCoverage * (1 - pv.snowDerateFactor);

  // kWh per ora = Ppeak [kW] × POA [kW/m² rispetto a 1 kW/m²] × derate × eta sistema
  const energy =
    pv.peakKw *
    poa *
    tempDerate *
    snowDerate *
    cloudFactor *
    (1 - pv.systemLoss) *
    pv.inverterEff;

  return Math.max(0, energy);
}

/** Produzione totale di una giornata tipica del mese */
export function pvDailyEnergy(
  month: number,
  pv: PvSystem = PV_DEFAULT,
  options?: { cloudFactor?: number },
): number {
  const climate = SITE_CLIMATE[month - 1];
  let total = 0;
  for (let h = 0; h < 24; h++) {
    total += pvProductionHourly(h, month, pv, climate, options);
  }
  return total;
}

/** Produzione annuale stimata kWh */
export function pvAnnualEnergy(pv: PvSystem = PV_DEFAULT, options?: { cloudFactor?: number }): number {
  return SITE_CLIMATE.reduce((sum, climate) => {
    const daysInMonth = new Date(2025, climate.month, 0).getDate();
    return sum + pvDailyEnergy(climate.month, pv, options) * daysInMonth;
  }, 0);
}
