import { HEATPUMP_DEFAULT } from './constants';

/**
 * Modello pompa di calore aria-acqua:
 *  - COP interpolato linearmente lungo la curva fornita
 *  - Backup resistivo elettrico se T esterna < soglia o se carico > capacità
 *  - Modalità heating / cooling / off
 */

export interface HeatPumpSystem {
  unitsCount: number;
  ratedKwElPerUnit: number;
  ratedKwThPerUnit: number;
  copCurve: { tOut: number; cop: number }[];
  eerCurve: { tOut: number; eer: number }[];
  backupActivationT: number;
  backupKw: number;
}

function interpolate(curve: { tOut: number; cop?: number; eer?: number }[], t: number, key: 'cop' | 'eer'): number {
  const sorted = [...curve].sort((a, b) => a.tOut - b.tOut);
  if (t <= sorted[0].tOut) return sorted[0][key]!;
  if (t >= sorted[sorted.length - 1].tOut) return sorted[sorted.length - 1][key]!;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].tOut && t <= sorted[i + 1].tOut) {
      const f = (t - sorted[i].tOut) / (sorted[i + 1].tOut - sorted[i].tOut);
      return sorted[i][key]! + (sorted[i + 1][key]! - sorted[i][key]!) * f;
    }
  }
  return sorted[0][key]!;
}

export function copAt(tOut: number, hp: HeatPumpSystem = HEATPUMP_DEFAULT): number {
  return interpolate(hp.copCurve, tOut, 'cop');
}

export function eerAt(tOut: number, hp: HeatPumpSystem = HEATPUMP_DEFAULT): number {
  return interpolate(hp.eerCurve, tOut, 'eer');
}

/**
 * Calcola la potenza elettrica oraria richiesta per coprire un determinato fabbisogno termico
 *  thermalDemandKw: positivo per riscaldamento, negativo per raffrescamento
 *  Ritorna { elKw, backupKw, mode, cop }
 */
export interface HpDispatch {
  elKw: number;
  backupKw: number;
  mode: 'heating' | 'cooling' | 'off';
  cop: number;
  thermalDeliveredKw: number;
}

export function dispatchHeatPump(
  thermalDemandKw: number,
  tOut: number,
  hp: HeatPumpSystem = HEATPUMP_DEFAULT,
): HpDispatch {
  if (Math.abs(thermalDemandKw) < 0.05) {
    return { elKw: 0, backupKw: 0, mode: 'off', cop: 0, thermalDeliveredKw: 0 };
  }

  const heating = thermalDemandKw > 0;
  const totalRatedThermal = hp.unitsCount * hp.ratedKwThPerUnit;
  const maxRatedEl = hp.unitsCount * hp.ratedKwElPerUnit;
  const performance = heating ? copAt(tOut, hp) : eerAt(tOut, hp);

  const demandAbs = Math.abs(thermalDemandKw);
  const hpThermalDelivered = Math.min(demandAbs, totalRatedThermal);
  const elFromHp = hpThermalDelivered / Math.max(performance, 1);
  const elFromHpCapped = Math.min(elFromHp, maxRatedEl);

  let backupKw = 0;
  let remainingThermal = demandAbs - hpThermalDelivered;

  // Backup attivo se T molto bassa o se demand > capacità
  if (heating && (tOut < hp.backupActivationT || remainingThermal > 0)) {
    backupKw = Math.min(remainingThermal, hp.backupKw);
    remainingThermal -= backupKw;
  }

  return {
    elKw: elFromHpCapped + backupKw,
    backupKw,
    mode: heating ? 'heating' : 'cooling',
    cop: performance,
    thermalDeliveredKw: hpThermalDelivered + backupKw,
  };
}
