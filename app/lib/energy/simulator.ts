import {
  BATTERY_DEFAULT,
  HEATPUMP_DEFAULT,
  PV_DEFAULT,
  TARIFF_DEFAULT,
  type SeasonKey,
  SEASONS,
} from './constants';
import { pvProductionHourly } from './pv';
import { dispatchHeatPump, type HeatPumpSystem } from './heatpump';
import { thermalDemandKw, outsideTemperature } from './building';
import { dispatchBattery, type BatteryMode, type BatterySystem } from './battery';
import { antiIceLoadKw, baseLoadKw, isOccupied, type OccupancyConfig } from './occupancy';

/**
 * Simulatore orario annuale (8760 ore) o per scenario stagionale (24 ore tipiche x 3 mesi).
 * Restituisce vettori dettagliati di flussi energetici e aggregati KPI.
 */

export interface SimulationParams {
  occupancy: OccupancyConfig;
  pv: typeof PV_DEFAULT;
  battery: BatterySystem;
  heatpump: HeatPumpSystem;
  batteryMode: BatteryMode;
  tariff: typeof TARIFF_DEFAULT;
  tariffType: 'fixed' | 'indexed' | 'variable';
  /** Spread fornitore + oneri sopra il PUN per tariffa indicizzata (€/kWh) */
  indexedSpread?: number;
  /** Override climatico extra (temperatura min/max custom) */
  climateOverride?: {
    winterMinT?: number;
    summerMaxT?: number;
  };
  /** Comunità energetica: profilo richiesta dei membri (kWh/h normalizzato 0–1) */
  cerDemandProfile?: number[];
  /** Capacità totale CER (kW di picco richiesto) */
  cerPeakKw?: number;
  /** EV: presenza wallbox + kWh giornalieri caricati quando occupied */
  ev?: { enabled: boolean; dailyKwh: number; preferNight: boolean };
  /** Smart load shifting Volta App */
  voltaOptimizer?: boolean;
  /** Fattore di esposizione dell'unità (interna < angolare) */
  exposedFactor?: number;
  /** Trasmittanza media involucro (W/m²K), dipende dagli infissi */
  envelopeU?: number;
  /** Setpoint riscaldamento/raffrescamento e setback */
  setpointHeating?: number;
  setpointCooling?: number;
  setbackHeating?: number;
}

export interface HourSample {
  hour: number;
  dayOfYear: number;
  month: number;
  occupied: boolean;
  tOut: number;
  pvKwh: number;
  baseLoadKwh: number;
  hpKwh: number;
  hpCop: number;
  antiIceKwh: number;
  evKwh: number;
  totalLoadKwh: number;
  batChargeKwh: number;
  batDischargeKwh: number;
  socEnd: number;
  selfConsumedKwh: number;
  gridImportKwh: number;
  gridExportKwh: number;
  sharedWithCerKwh: number;
  costEur: number;
  /** Valore dell'autoconsumo all'ora corrente (kWh autoconsumati × prezzo orario) */
  savingsEur: number;
  revenueRdEur: number;
  revenueCerEur: number;
}

export interface SimulationResult {
  hours: HourSample[];
  totals: SimulationTotals;
}

export interface SimulationTotals {
  pvKwh: number;
  loadKwh: number;
  hpKwh: number;
  baseLoadKwh: number;
  antiIceKwh: number;
  evKwh: number;
  selfConsumedKwh: number;
  gridImportKwh: number;
  gridExportKwh: number;
  sharedWithCerKwh: number;
  selfConsumptionRate: number;
  selfSufficiencyRate: number;
  /** Costo della sola energia prelevata dalla rete (€), senza quota fissa */
  costEur: number;
  revenueRdEur: number;
  revenueCerEur: number;
  /** Guadagno netto = risparmio autoconsumo + ricavi (miglioramento annuo vs nessun impianto) */
  netCashFlowRdEur: number;
  netCashFlowCerEur: number;
  /** Risparmio da autoconsumo, valorizzato al prezzo orario reale */
  avoidedCostEur: number;
  /** Bolletta annua SENZA impianto (tutta l'energia comprata dalla rete) + quota fissa */
  baselineBillEur: number;
  /** Bolletta residua CON impianto (solo import) + quota fissa, al netto dei ricavi RD */
  residualBillRdEur: number;
  /** Bolletta residua CON impianto al netto dei ricavi/incentivi CER */
  residualBillCerEur: number;
  /** Picco prelievo dalla rete (kW) per stima POD */
  peakImportKw: number;
}

const F1_HOURS = new Set([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
function isPeakTariff(hour: number, dayOfWeek: number, tariffType: 'fixed' | 'indexed' | 'variable'): boolean {
  if (tariffType === 'fixed') return false;
  if (tariffType === 'indexed') return F1_HOURS.has(hour) && dayOfWeek !== 0 && dayOfWeek !== 6;
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  return F1_HOURS.has(hour);
}

/** Prezzo orario PUN simulato — pattern realistico picchi 8-20, basso notte/weekend */
function indexedPunHour(hour: number, month: number, dayOfWeek: number, baseEurPerMwh: number): number {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isPeak = F1_HOURS.has(hour) && !isWeekend;
  const seasonalMultiplier = month <= 2 || month >= 11 ? 1.15 : month >= 6 && month <= 8 ? 0.9 : 1.0;
  const hourMultiplier = isPeak ? 1.3 : hour >= 19 && hour <= 22 ? 1.1 : hour >= 1 && hour <= 5 ? 0.6 : 0.9;
  return (baseEurPerMwh * seasonalMultiplier * hourMultiplier) / 1000;
}

function priceForHour(
  hour: number,
  dayOfWeek: number,
  month: number,
  tariff: typeof TARIFF_DEFAULT,
  tariffType: 'fixed' | 'indexed' | 'variable',
  indexedSpread = 0.075,
): number {
  if (tariffType === 'fixed') return tariff.fixedPriceEurPerKwh;
  if (tariffType === 'indexed') {
    // PUN orario + spread fornitore + oneri (~0.04 €/kWh fissi)
    return indexedPunHour(hour, month, dayOfWeek, tariff.ritiroDedicatoEurPerMwh) + indexedSpread + 0.04;
  }
  if (dayOfWeek === 0 || dayOfWeek === 6) return tariff.variable.f3;
  if (F1_HOURS.has(hour)) return tariff.variable.f1;
  if (hour >= 7 && hour <= 22) return tariff.variable.f2;
  return tariff.variable.f3;
}

/** Genera un anno completo di simulazione (8760 ore) */
export function simulateYear(params: SimulationParams): SimulationResult {
  const hours: HourSample[] = [];
  let soc = 0.5; // SoC iniziale 50%
  let peakImport = 0;

  for (let dayOfYear = 1; dayOfYear <= 365; dayOfYear++) {
    const date = new Date(2025, 0, dayOfYear);
    const month = date.getMonth() + 1;
    const dayOfWeek = date.getDay();
    const occupied = isOccupied(dayOfYear, params.occupancy);

    for (let h = 0; h < 24; h++) {
      const tOut = outsideTemperature(h, month);
      const climateAdj = params.climateOverride;
      const tOutAdj = climateAdj
        ? (h < 9 || h > 22
            ? (climateAdj.winterMinT !== undefined && month <= 2 ? Math.min(tOut, climateAdj.winterMinT) : tOut)
            : (climateAdj.summerMaxT !== undefined && month >= 6 && month <= 8 ? Math.max(tOut, climateAdj.summerMaxT) : tOut))
        : tOut;

      const pvKwh = pvProductionHourly(h, month, params.pv);
      const base = baseLoadKw(h, occupied, params.occupancy.occupants);
      const antiIce = antiIceLoadKw(h, month);

      const thermal = thermalDemandKw(
        h,
        month,
        {
          occupied,
          setpointHeating: params.setpointHeating ?? 20,
          setpointCooling: params.setpointCooling ?? 26,
          setbackHeating: params.setbackHeating ?? 16,
        },
        { exposedFactor: params.exposedFactor ?? 1, envelopeU: params.envelopeU },
      );
      const hpDisp = dispatchHeatPump(thermal, tOutAdj, params.heatpump);

      // EV: carica preferenzialmente di notte con sorgente PV se diurna possibile
      let evKwh = 0;
      if (params.ev?.enabled && occupied) {
        const dailyKwh = params.ev.dailyKwh;
        if (params.ev.preferNight && h >= 23) evKwh = dailyKwh / 3;
        else if (params.ev.preferNight && (h === 0 || h === 1)) evKwh = dailyKwh / 3;
        else if (!params.ev.preferNight && h >= 11 && h <= 14) evKwh = dailyKwh / 4;
      }

      const totalLoad = base + antiIce + hpDisp.elKw + evKwh;

      // Smart optimizer Volta: shift dei carichi base flessibili verso surplus PV
      let pvSurplus = Math.max(0, pvKwh - totalLoad);
      let netLoad = Math.max(0, totalLoad - pvKwh);
      let selfConsumedDirect = Math.min(pvKwh, totalLoad);

      const peakHourTariff = isPeakTariff(h, dayOfWeek, params.tariffType);

      const cerNeeds = params.cerDemandProfile
        ? (params.cerDemandProfile[h] ?? 0) * (params.cerPeakKw ?? 0)
        : 0;

      const batRes = dispatchBattery({
        pvSurplusKwh: pvSurplus,
        netLoadKwh: netLoad,
        socStart: soc,
        mode: params.batteryMode,
        hour: h,
        isPeakTariff: peakHourTariff,
        cerNeedsKwh: cerNeeds,
        bat: params.battery,
      });

      soc = batRes.socEnd;
      const gridImport = batRes.unmetLoadKwh;
      const gridExportRaw = batRes.surplusToGridKwh;

      // Quota di gridExport condivisa con la CER = min(export, cerNeeds)
      const sharedWithCer = Math.min(gridExportRaw, cerNeeds);

      const selfConsumed = selfConsumedDirect + batRes.dischargedKwh;
      const price = priceForHour(h, dayOfWeek, month, params.tariff, params.tariffType, params.indexedSpread);
      const cost = gridImport * price;
      // Risparmio: ogni kWh autoconsumato è un kWh non comprato al prezzo dell'ora
      const savings = selfConsumed * price;
      // Ritiro Dedicato: tutto l'export al prezzo zonale PUN
      const revenueRd = gridExportRaw * (params.tariff.ritiroDedicatoEurPerMwh / 1000);
      // CER: ricavo RD su TUTTA l'energia immessa + incentivo MASE+ARERA su porzione condivisa,
      // moltiplicato per la quota prosumer prevista dallo statuto della CER
      const cerIncentiveBonus =
        (sharedWithCer *
          (params.tariff.cerIncentiveEurPerMwh + params.tariff.cerRestituzioneEurPerMwh)) /
        1000 *
        params.tariff.prosumerShareCer;
      const revenueCer = revenueRd + cerIncentiveBonus;

      peakImport = Math.max(peakImport, gridImport);

      hours.push({
        hour: h,
        dayOfYear,
        month,
        occupied,
        tOut: tOutAdj,
        pvKwh,
        baseLoadKwh: base,
        hpKwh: hpDisp.elKw,
        hpCop: hpDisp.cop,
        antiIceKwh: antiIce,
        evKwh,
        totalLoadKwh: totalLoad,
        batChargeKwh: batRes.chargedKwh,
        batDischargeKwh: batRes.dischargedKwh,
        socEnd: soc,
        selfConsumedKwh: selfConsumed,
        gridImportKwh: gridImport,
        gridExportKwh: gridExportRaw,
        sharedWithCerKwh: sharedWithCer,
        costEur: cost,
        savingsEur: savings,
        revenueRdEur: revenueRd,
        revenueCerEur: revenueCer,
      });
    }
  }

  const sum = (k: keyof HourSample) => hours.reduce((acc, h) => acc + (h[k] as number), 0);
  const totals: SimulationTotals = {
    pvKwh: sum('pvKwh'),
    loadKwh: sum('totalLoadKwh'),
    hpKwh: sum('hpKwh'),
    baseLoadKwh: sum('baseLoadKwh'),
    antiIceKwh: sum('antiIceKwh'),
    evKwh: sum('evKwh'),
    selfConsumedKwh: sum('selfConsumedKwh'),
    gridImportKwh: sum('gridImportKwh'),
    gridExportKwh: sum('gridExportKwh'),
    sharedWithCerKwh: sum('sharedWithCerKwh'),
    selfConsumptionRate: 0,
    selfSufficiencyRate: 0,
    costEur: sum('costEur'),
    revenueRdEur: sum('revenueRdEur'),
    revenueCerEur: sum('revenueCerEur'),
    netCashFlowRdEur: 0,
    netCashFlowCerEur: 0,
    avoidedCostEur: sum('savingsEur'),
    baselineBillEur: 0,
    residualBillRdEur: 0,
    residualBillCerEur: 0,
    peakImportKw: peakImport,
  };

  totals.selfConsumptionRate = totals.pvKwh > 0 ? totals.selfConsumedKwh / totals.pvKwh : 0;
  totals.selfSufficiencyRate = totals.loadKwh > 0 ? totals.selfConsumedKwh / totals.loadKwh : 0;

  const fixedComponent = params.tariff.fixedMonthlyEur * 12;
  // Guadagno netto annuo = risparmio in bolletta (autoconsumo) + ricavi.
  // È il miglioramento economico annuo rispetto allo scenario SENZA impianto.
  totals.netCashFlowRdEur = totals.avoidedCostEur + totals.revenueRdEur;
  totals.netCashFlowCerEur = totals.avoidedCostEur + totals.revenueCerEur;
  // Bolletta SENZA impianto: tutta l'energia consumata comprata dalla rete + quota fissa
  totals.baselineBillEur = totals.avoidedCostEur + totals.costEur + fixedComponent;
  // Bolletta residua CON impianto (al netto dei ricavi)
  totals.residualBillRdEur = totals.costEur + fixedComponent - totals.revenueRdEur;
  totals.residualBillCerEur = totals.costEur + fixedComponent - totals.revenueCerEur;

  return { hours, totals };
}

/** Aggregato per stagione */
export function aggregateBySeason(
  result: SimulationResult,
  params: { tariff: typeof TARIFF_DEFAULT; tariffType: 'fixed' | 'indexed' | 'variable'; indexedSpread?: number },
): Record<SeasonKey, SimulationTotals> {
  const out = {} as Record<SeasonKey, SimulationTotals>;
  const fixedQuarterly = (params.tariff.fixedMonthlyEur * 12) / 4;

  (Object.keys(SEASONS) as SeasonKey[]).forEach((key) => {
    const months = SEASONS[key].months as readonly number[];
    const hours = result.hours.filter((h) => months.includes(h.month));
    const sum = (k: keyof HourSample) => hours.reduce((acc, h) => acc + (h[k] as number), 0);
    const seasonTotals: SimulationTotals = {
      pvKwh: sum('pvKwh'),
      loadKwh: sum('totalLoadKwh'),
      hpKwh: sum('hpKwh'),
      baseLoadKwh: sum('baseLoadKwh'),
      antiIceKwh: sum('antiIceKwh'),
      evKwh: sum('evKwh'),
      selfConsumedKwh: sum('selfConsumedKwh'),
      gridImportKwh: sum('gridImportKwh'),
      gridExportKwh: sum('gridExportKwh'),
      sharedWithCerKwh: sum('sharedWithCerKwh'),
      selfConsumptionRate: 0,
      selfSufficiencyRate: 0,
      costEur: sum('costEur'),
      revenueRdEur: sum('revenueRdEur'),
      revenueCerEur: sum('revenueCerEur'),
      netCashFlowRdEur: 0,
      netCashFlowCerEur: 0,
      avoidedCostEur: sum('savingsEur'),
      baselineBillEur: 0,
      residualBillRdEur: 0,
      residualBillCerEur: 0,
      peakImportKw: hours.reduce((acc, h) => Math.max(acc, h.gridImportKwh), 0),
    };
    seasonTotals.selfConsumptionRate = seasonTotals.pvKwh > 0 ? seasonTotals.selfConsumedKwh / seasonTotals.pvKwh : 0;
    seasonTotals.selfSufficiencyRate = seasonTotals.loadKwh > 0 ? seasonTotals.selfConsumedKwh / seasonTotals.loadKwh : 0;
    seasonTotals.netCashFlowRdEur = seasonTotals.avoidedCostEur + seasonTotals.revenueRdEur;
    seasonTotals.netCashFlowCerEur = seasonTotals.avoidedCostEur + seasonTotals.revenueCerEur;
    seasonTotals.baselineBillEur = seasonTotals.avoidedCostEur + seasonTotals.costEur + fixedQuarterly;
    seasonTotals.residualBillRdEur = seasonTotals.costEur + fixedQuarterly - seasonTotals.revenueRdEur;
    seasonTotals.residualBillCerEur = seasonTotals.costEur + fixedQuarterly - seasonTotals.revenueCerEur;
    out[key] = seasonTotals;
  });
  return out;
}

/** Aggregato per giorno tipico stagionale (24 ore mediate) */
export interface TypicalDay {
  hour: number;
  pvKwh: number;
  loadKwh: number;
  hpKwh: number;
  baseLoadKwh: number;
  batSoc: number;
  gridImportKwh: number;
  gridExportKwh: number;
  tOut: number;
}

export function typicalDay(result: SimulationResult, season: SeasonKey): TypicalDay[] {
  const months = SEASONS[season].months as readonly number[];
  const filtered = result.hours.filter((h) => months.includes(h.month));
  const out: TypicalDay[] = [];
  for (let h = 0; h < 24; h++) {
    const sample = filtered.filter((x) => x.hour === h);
    if (sample.length === 0) {
      out.push({ hour: h, pvKwh: 0, loadKwh: 0, hpKwh: 0, baseLoadKwh: 0, batSoc: 0.5, gridImportKwh: 0, gridExportKwh: 0, tOut: 0 });
      continue;
    }
    const avg = (k: keyof HourSample) => sample.reduce((acc, x) => acc + (x[k] as number), 0) / sample.length;
    out.push({
      hour: h,
      pvKwh: avg('pvKwh'),
      loadKwh: avg('totalLoadKwh'),
      hpKwh: avg('hpKwh'),
      baseLoadKwh: avg('baseLoadKwh'),
      batSoc: avg('socEnd'),
      gridImportKwh: avg('gridImportKwh'),
      gridExportKwh: avg('gridExportKwh'),
      tOut: avg('tOut'),
    });
  }
  return out;
}
