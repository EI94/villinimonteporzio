/**
 * Modello finanziario impianto FV + accumulo.
 *  - CAPEX stimato (turnkey) o inserito manualmente
 *  - Detrazione fiscale 50% (Bonus Ristrutturazione) recuperata in 10 quote annuali
 *  - Payback (tempo di ritorno) con e senza detrazione
 *  - ROI su orizzonte (default 25 anni) con degrado annuo della resa
 */

export const CAPEX_RATES = {
  /** €/kWp impianto FV turnkey (moduli + inverter + posa) */
  pvPerKwp: 1250,
  /** €/kWh accumulo installato */
  batteryPerKwh: 550,
  /** Costi fissi: pratiche, allaccio, quadri, gestione (€) */
  fixed: 2500,
};

/**
 * Maturità della Comunità Energetica.
 * Le CER nascono piccole e crescono: poca energia condivisa all'inizio,
 * poi più membri → più condivisione → più incentivo, fino a regime.
 *  - year1Factor: frazione della dimensione a regime nell'anno 1
 *  - rampYears: anni per raggiungere il 100%
 */
export type CerMaturity = 'startup' | 'growing' | 'mature';
export const CER_MATURITY: Record<CerMaturity, { year1Factor: number; rampYears: number; label: string }> = {
  startup: { year1Factor: 0.25, rampYears: 7, label: 'Avvio' },
  growing: { year1Factor: 0.55, rampYears: 4, label: 'In crescita' },
  mature: { year1Factor: 1.0, rampYears: 1, label: 'Matura' },
};

/** Fattore di crescita CER all'anno y (relativo alla dimensione a regime) */
export function cerGrowthFactor(year: number, maturity: CerMaturity): number {
  const m = CER_MATURITY[maturity];
  if (m.rampYears <= 1) return 1;
  return Math.min(1, m.year1Factor + (1 - m.year1Factor) * ((year - 1) / (m.rampYears - 1)));
}

export interface FinanceInput {
  /** Investimento totale (€). Se autoCapex true viene ricalcolato da PV+batteria */
  capexEur: number;
  autoCapex: boolean;
  pvPeakKw: number;
  batteryKwh: number;
  /** Detrazione fiscale 50% in 10 anni */
  detrazione50: boolean;
  /** Beneficio base annuo (risparmio autoconsumo + ricavi Ritiro Dedicato), anno 1 */
  baseBenefitEur: number;
  /** Extra incentivo CER all'anno 1 (alla dimensione CER dell'anno 1) */
  cerBonusYear1Eur: number;
  /** Maturità della CER (governa la crescita dell'incentivo nel tempo) */
  cerMaturity: CerMaturity;
  /** Orizzonte di analisi (anni) */
  horizonYears?: number;
  /** Degrado annuo resa impianto (frazione) */
  degradationRate?: number;
  /** Inflazione prezzo energia (frazione) — aumenta il beneficio nel tempo */
  energyInflation?: number;
}

export interface FinanceResult {
  capexEur: number;
  detrazioneTotaleEur: number;
  detrazioneAnnuaEur: number;
  /** Anni di ritorno semplice senza detrazione */
  paybackYears: number | null;
  /** Anni di ritorno con detrazione 50% */
  paybackYearsDetrazione: number | null;
  /** ROI totale sull'orizzonte, % sul capex effettivo */
  roiPct: number;
  /** Flusso cumulato per anno (per grafico) */
  cumulative: { year: number; senza: number; con: number }[];
  /** Capex effettivo dopo detrazione */
  capexNetto: number;
  horizonYears: number;
  /** Beneficio anno 1 (base + CER alla dimensione anno 1) */
  benefitYear1Eur: number;
  /** Beneficio a regime (CER matura) */
  benefitMatureEur: number;
  cerMaturity: CerMaturity;
}

export function estimateCapex(pvPeakKw: number, batteryKwh: number): number {
  return Math.round(
    pvPeakKw * CAPEX_RATES.pvPerKwp + batteryKwh * CAPEX_RATES.batteryPerKwh + CAPEX_RATES.fixed,
  );
}

export function computeFinance(input: FinanceInput): FinanceResult {
  const horizon = input.horizonYears ?? 25;
  const degradation = input.degradationRate ?? 0.006;
  const inflation = input.energyInflation ?? 0.02;
  const capex = input.autoCapex ? estimateCapex(input.pvPeakKw, input.batteryKwh) : input.capexEur;

  const detrazioneTotale = input.detrazione50 ? capex * 0.5 : 0;
  const detrazioneAnnua = detrazioneTotale / 10;

  // L'incentivo CER dell'anno 1 è alla dimensione dell'anno 1; il "pieno" (a regime)
  // si ottiene dividendo per il fattore anno-1 della maturità scelta.
  const m = CER_MATURITY[input.cerMaturity];
  const cerBonusMature = m.year1Factor > 0 ? input.cerBonusYear1Eur / m.year1Factor : 0;

  // Beneficio annuo: base cresce con inflazione e cala col degrado;
  // la quota CER cresce con la maturità della comunità (più membri nel tempo).
  const benefitAt = (year: number) => {
    const escal = Math.pow(1 + inflation, year - 1) * Math.pow(1 - degradation, year - 1);
    const base = input.baseBenefitEur * escal;
    const cer = cerBonusMature * cerGrowthFactor(year, input.cerMaturity) * Math.pow(1 + inflation, year - 1);
    return base + cer;
  };

  const cumulative: { year: number; senza: number; con: number }[] = [{ year: 0, senza: -capex, con: -capex }];
  let cumSenza = -capex;
  let cumCon = -capex;
  for (let y = 1; y <= horizon; y++) {
    const benefit = benefitAt(y);
    cumSenza += benefit;
    cumCon += benefit + (y <= 10 ? detrazioneAnnua : 0);
    cumulative.push({ year: y, senza: Math.round(cumSenza), con: Math.round(cumCon) });
  }

  // payback interpolato (con eventuale detrazione nei primi 10 anni)
  const payback = (withDetr: boolean): number | null => {
    let cum = -capex;
    for (let y = 1; y <= 60; y++) {
      const flow = benefitAt(y) + (withDetr && y <= 10 ? detrazioneAnnua : 0);
      if (flow <= 0) continue;
      const prev = cum;
      cum += flow;
      if (cum >= 0) return y - 1 + -prev / flow;
    }
    return null;
  };

  const totalBenefit = Array.from({ length: horizon }, (_, i) => benefitAt(i + 1)).reduce((a, b) => a + b, 0);
  const capexNetto = capex - detrazioneTotale;
  const roiPct = capexNetto > 0 ? ((totalBenefit - capexNetto) / capexNetto) * 100 : 0;

  return {
    capexEur: capex,
    detrazioneTotaleEur: detrazioneTotale,
    detrazioneAnnuaEur: detrazioneAnnua,
    paybackYears: payback(false),
    paybackYearsDetrazione: payback(true),
    roiPct,
    cumulative,
    capexNetto,
    horizonYears: horizon,
    benefitYear1Eur: input.baseBenefitEur + input.cerBonusYear1Eur,
    benefitMatureEur: input.baseBenefitEur + cerBonusMature,
    cerMaturity: input.cerMaturity,
  };
}
