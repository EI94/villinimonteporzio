import { BUILDING, SITE_CLIMATE } from './constants';

/**
 * Modello fabbisogno termico del villino (stazionario semplificato):
 *   Qloss = U·A·ΔT·exposedFactor  +  ρ·c·V·n·ΔT·(1 - η_VMC)
 *   Qgain (radiazione + interni) sottratto/sommato in funzione del mese
 *   Risultato in kW termici (positivo = riscaldamento, negativo = raffrescamento)
 *
 * exposedFactor distingue le unità: il villino interno condivide le pareti
 * laterali (adiabatiche) → disperde meno; gli angolari → disperdono di più.
 */

const RHO_AIR = 1.2;
const CP_AIR = 1005;

export interface BuildingState {
  occupied: boolean;
  setpointHeating: number;
  setpointCooling: number;
  setbackHeating: number;
}

export function targetIndoorTemp(state: BuildingState, mode: 'heating' | 'cooling'): number {
  if (state.occupied) {
    return mode === 'heating' ? state.setpointHeating : state.setpointCooling;
  }
  return mode === 'heating' ? state.setbackHeating : 28;
}

/** Fabbisogno termico istantaneo in kW (positivo = heating, negativo = cooling) */
export function thermalDemandKw(
  hour: number,
  month: number,
  state: BuildingState,
  options?: { internalGainsKw?: number; exposedFactor?: number; envelopeU?: number },
): number {
  const climate = SITE_CLIMATE[month - 1];
  const tOut = climate.tMean + (climate.tMax - climate.tMin) * 0.5 * Math.sin(((hour - 9) * Math.PI) / 12);

  const heatingMode = tOut < state.setpointHeating - 2;
  const coolingMode = tOut > state.setpointCooling;
  if (!heatingMode && !coolingMode) return 0;

  const mode: 'heating' | 'cooling' = heatingMode ? 'heating' : 'cooling';
  const tIn = targetIndoorTemp(state, mode);

  const deltaT = mode === 'heating' ? Math.max(0, tIn - tOut) : Math.max(0, tOut - tIn);
  if (deltaT < 0.1) return 0;

  const exposed = options?.exposedFactor ?? 1;
  const uMean = options?.envelopeU ?? BUILDING.uMean;

  // Dispersioni involucro (W) → kW, modulate dal fattore di esposizione dell'unità
  const qEnvelope = (uMean * BUILDING.envelopeArea * exposed * deltaT) / 1000;

  // Dispersioni ventilazione VMC con recupero
  const ach = state.occupied ? BUILDING.airChangeRate : BUILDING.airChangeRate * 0.6;
  const ventW = RHO_AIR * CP_AIR * BUILDING.volumeM3 * (ach / 3600) * deltaT * (1 - BUILDING.vmcRecoveryEff);
  const qVent = ventW / 1000;

  // Apporti gratuiti (interni + solare)
  const internalKw = (options?.internalGainsKw ?? BUILDING.internalGains) * (BUILDING.heatedArea / 1000);
  const solarGain = climate.ghiDaily * 0.05;
  const totalGain = state.occupied ? internalKw + solarGain : solarGain * 0.5;

  const total = qEnvelope + qVent - (mode === 'heating' ? totalGain : -totalGain);

  return mode === 'heating' ? Math.max(0, total) : -Math.max(0, total);
}

/** Temperatura esterna oraria stimata */
export function outsideTemperature(hour: number, month: number): number {
  const climate = SITE_CLIMATE[month - 1];
  return climate.tMean + (climate.tMax - climate.tMin) * 0.5 * Math.sin(((hour - 9) * Math.PI) / 12);
}
