import { ANTI_ICE, BASE_LOAD_PEAK_KW_OCCUPIED, BASE_LOAD_PROFILE_24H, BASE_LOAD_VACANT_KW, SITE_CLIMATE } from './constants';
import { outsideTemperature } from './building';

/**
 * Profili occupazione casa-vacanze:
 *   - L'utente indica quante settimane all'anno è abitata (default 4)
 *   - Distribuzione tipica suggerita: Natale 2 settimane, Pasqua 1 settimana, Estate 2-4 settimane, ponti 1 settimana
 *   - Possibilità di override custom (date intervalli)
 */

export interface OccupancyConfig {
  /** Numero settimane totali abitate nell'anno */
  weeksPerYear: number;
  /** Distribuzione percentuale settimane per stagione (deve sommare a 1) */
  seasonalSplit: {
    winter: number;
    spring: number;
    summer: number;
    autumn: number;
  };
  /** Occupanti tipici (adulti + bambini) */
  occupants: number;
  /** Override: lista intervalli abitati (priorità sui pesi stagionali) */
  customStays?: { startMonth: number; startDay: number; endMonth: number; endDay: number }[];
}

export const DEFAULT_OCCUPANCY: OccupancyConfig = {
  weeksPerYear: 48,
  seasonalSplit: { winter: 0.25, spring: 0.25, summer: 0.25, autumn: 0.25 },
  occupants: 3,
};

/** Restituisce true se nel giorno (1..365) il villino è considerato abitato.
 *  Residenza principale: con occupazione alta è abitato quasi sempre, con assenze
 *  distribuite (vacanze). Con occupazione bassa diventa una seconda casa. */
export function isOccupied(dayOfYear: number, cfg: OccupancyConfig): boolean {
  if (cfg.customStays && cfg.customStays.length) {
    const date = new Date(2025, 0, dayOfYear);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return cfg.customStays.some((stay) => {
      const startDate = new Date(2025, stay.startMonth - 1, stay.startDay);
      const endDate = new Date(2025, stay.endMonth - 1, stay.endDay);
      const cur = new Date(2025, month - 1, day);
      return cur >= startDate && cur <= endDate;
    });
  }

  const isInRange = (doy: number, start: number, len: number): boolean => {
    if (len <= 0) return false;
    const end = start + len;
    if (end <= 365) return doy >= start && doy < end;
    return doy >= start || doy < end - 365;
  };

  const occFrac = Math.max(0, Math.min(1, cfg.weeksPerYear / 52));

  // Residenza principale: abitata quasi sempre, con assenze (vacanze) distribuite
  if (occFrac >= 0.5) {
    if (occFrac >= 0.97) return true;
    const awayDays = Math.round((1 - occFrac) * 365);
    const summerAway = Math.round(awayDays * 0.6);
    const winterAway = awayDays - summerAway;
    if (isInRange(dayOfYear, 213, summerAway)) return false; // ferie d'agosto
    if (isInRange(dayOfYear, 358, winterAway)) return false; // ponte di fine anno
    return true;
  }

  // Seconda casa: presenza concentrata nei periodi tipici, secondo lo split stagionale
  const totalDays = Math.round(cfg.weeksPerYear * 7);
  const winterDays = Math.round(totalDays * cfg.seasonalSplit.winter);
  const springDays = Math.round(totalDays * cfg.seasonalSplit.spring);
  const summerDays = Math.round(totalDays * cfg.seasonalSplit.summer);
  const autumnDays = Math.max(0, totalDays - winterDays - springDays - summerDays);

  if (isInRange(dayOfYear, 356, winterDays)) return true;
  if (isInRange(dayOfYear, 95, springDays)) return true;
  if (isInRange(dayOfYear, 205, summerDays)) return true;
  if (isInRange(dayOfYear, 288, autumnDays)) return true;
  return false;
}

/** Carico base orario (kW) — esclude HP e antighiaccio */
export function baseLoadKw(hour: number, occupied: boolean, occupants: number): number {
  if (!occupied) return BASE_LOAD_VACANT_KW;
  const profile = BASE_LOAD_PROFILE_24H[hour];
  const peopleFactor = 0.7 + 0.075 * occupants; // 4 persone → 1.0
  return BASE_LOAD_PEAK_KW_OCCUPIED * profile * peopleFactor;
}

/** Carico antighiaccio orario (kW) — attivo sotto soglia, pesato sulla presenza di neve/ghiaccio */
export function antiIceLoadKw(hour: number, month: number): number {
  if (ANTI_ICE.totalKw <= 0) return 0;
  const tOut = outsideTemperature(hour, month);
  if (tOut > ANTI_ICE.thresholdT) return 0;
  const climate = SITE_CLIMATE[month - 1];
  // duty cycle modulato dalla severità del freddo
  const severity = Math.min(1, Math.max(0, (ANTI_ICE.thresholdT - tOut) / 10));
  // Presenza ghiaccio: il cavo scaldante grondaie lavora col freddo (base 0.35),
  // rampa e pedonale riscaldati intervengono soprattutto in presenza di neve.
  const icePresence = 0.35 + 0.65 * climate.snowProb;
  return ANTI_ICE.totalKw * ANTI_ICE.dutyCycle * (0.4 + 0.6 * severity) * icePresence;
}
