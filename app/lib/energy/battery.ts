import { BATTERY_DEFAULT } from './constants';

/**
 * Dispatch batteria con strategia ottimizzazione Volta:
 *   - Modalità "self_consumption": carica con surplus PV, scarica per evitare prelievo
 *   - Modalità "tou_arbitrage": carica in fasce basse (F3), scarica in F1 (con override)
 *   - Modalità "cer_max": massimizza condivisione con CER (scarica quando richiedono i membri)
 *   - Rispetta SoC min/max, efficiency round trip ed eventuale self discharge
 */

export interface BatterySystem {
  capacityKwh: number;
  maxChargeKw: number;
  maxDischargeKw: number;
  roundTripEff: number;
  minSoc: number;
  maxSoc: number;
  selfDischargeDaily: number;
}

export type BatteryMode = 'self_consumption' | 'tou_arbitrage' | 'cer_max' | 'backup_reserve';

export interface BatteryDispatchInput {
  /** Energia disponibile da PV dopo aver alimentato i carichi (kWh) — positivo se surplus, 0 se deficit */
  pvSurplusKwh: number;
  /** Carico residuo da coprire (kWh) — positivo se serve energia ulteriore */
  netLoadKwh: number;
  socStart: number;
  mode: BatteryMode;
  hour: number;
  isPeakTariff: boolean;
  cerNeedsKwh?: number;
  bat?: BatterySystem;
}

export interface BatteryDispatchResult {
  chargedKwh: number;
  dischargedKwh: number;
  socEnd: number;
  surplusToGridKwh: number;
  unmetLoadKwh: number;
}

export function dispatchBattery(input: BatteryDispatchInput): BatteryDispatchResult {
  const bat = input.bat ?? BATTERY_DEFAULT;
  const minE = bat.capacityKwh * bat.minSoc;
  const maxE = bat.capacityKwh * bat.maxSoc;
  let stored = input.socStart * bat.capacityKwh;

  let surplus = input.pvSurplusKwh;
  let deficit = input.netLoadKwh;
  let charged = 0;
  let discharged = 0;
  let toGrid = 0;
  let unmet = 0;

  // Self discharge oraria
  stored *= 1 - bat.selfDischargeDaily / 24;

  // === FASE 1: carica con surplus PV ===
  if (surplus > 0) {
    const headroom = Math.max(0, maxE - stored);
    const allowedCharge = Math.min(surplus * Math.sqrt(bat.roundTripEff), bat.maxChargeKw, headroom);
    charged = allowedCharge;
    stored += allowedCharge;
    surplus -= allowedCharge / Math.sqrt(bat.roundTripEff);
    toGrid += surplus;
    surplus = 0;
  }

  // === FASE 2: scarica per coprire deficit ===
  if (deficit > 0) {
    let allowed = 0;
    switch (input.mode) {
      case 'self_consumption':
        allowed = Math.min(deficit, bat.maxDischargeKw, Math.max(0, stored - minE) * Math.sqrt(bat.roundTripEff));
        break;
      case 'tou_arbitrage':
        // scarica solo in fascia di picco
        allowed = input.isPeakTariff
          ? Math.min(deficit, bat.maxDischargeKw, Math.max(0, stored - minE) * Math.sqrt(bat.roundTripEff))
          : 0;
        break;
      case 'cer_max':
        // priorità carico, ma riserva un 30% per condivisione attiva nelle ore richieste dalla CER
        const reserveForCer = (input.cerNeedsKwh ?? 0) > 0 ? bat.capacityKwh * 0.3 : 0;
        const availableE = Math.max(0, stored - minE - reserveForCer);
        allowed = Math.min(deficit, bat.maxDischargeKw, availableE * Math.sqrt(bat.roundTripEff));
        break;
      case 'backup_reserve':
        // mantieni 50% di riserva
        const reservE = bat.capacityKwh * 0.5;
        const availE = Math.max(0, stored - reservE);
        allowed = Math.min(deficit, bat.maxDischargeKw, availE * Math.sqrt(bat.roundTripEff));
        break;
    }
    discharged = Math.max(0, allowed);
    stored -= discharged / Math.sqrt(bat.roundTripEff);
    deficit -= discharged;
    unmet = Math.max(0, deficit);
  }

  // === FASE 3: opportunistic charge dalla rete in fascia bassa (solo in tou_arbitrage) ===
  // L'energia caricata dalla rete viene contabilizzata come prelievo (unmetLoad → costo),
  // così non si crea energia "gratis" che falserebbe il bilancio economico.
  let gridCharge = 0;
  if (input.mode === 'tou_arbitrage' && !input.isPeakTariff && stored < maxE * 0.8) {
    gridCharge = Math.min(bat.maxChargeKw, maxE - stored);
    stored += gridCharge * Math.sqrt(bat.roundTripEff);
  }

  return {
    chargedKwh: charged,
    dischargedKwh: discharged,
    socEnd: Math.max(bat.minSoc, Math.min(bat.maxSoc, stored / bat.capacityKwh)),
    surplusToGridKwh: toGrid,
    unmetLoadKwh: unmet + gridCharge,
  };
}
