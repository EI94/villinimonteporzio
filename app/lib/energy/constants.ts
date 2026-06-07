/**
 * Costanti di sistema per la simulazione energetica
 * Progetto: Monteporzio Living — tre villini a schiera, Monteporzio Catone (RM)
 *   Lat ~41.81°N, Lon ~12.72°E, Alt ~450 m s.l.m. — Castelli Romani
 *   Zona climatica D (~1.450 GG), clima mediterraneo mite
 */

export const SITE = {
  name: 'Monteporzio Catone (RM)',
  project: 'Monteporzio Living',
  latitude: 41.813,
  longitude: 12.722,
  altitude: 450,
  climateZone: 'D',
  heatingDegreeDays: 1450,
  timezone: 'Europe/Rome',
} as const;

/**
 * Climatologia mensile media Monteporzio / Castelli Romani.
 *   tMean / tMin / tMax: °C (medie mensili)
 *   ghiDaily: kWh/m²/giorno radiazione orizzontale globale (Atlante ENEA, Lazio collinare)
 *   snowProb: probabilità di neve sui pannelli (quasi nulla)
 *   daylightHours: ore di luce medie
 */
export interface MonthClimate {
  month: number;
  tMin: number;
  tMean: number;
  tMax: number;
  ghiDaily: number;
  snowProb: number;
  daylightHours: number;
}

export const SITE_CLIMATE: MonthClimate[] = [
  { month: 1,  tMin: 3,  tMean: 7.5,  tMax: 12, ghiDaily: 2.10, snowProb: 0.04, daylightHours: 9.6 },
  { month: 2,  tMin: 3,  tMean: 8.0,  tMax: 13, ghiDaily: 2.95, snowProb: 0.02, daylightHours: 10.6 },
  { month: 3,  tMin: 5,  tMean: 10.5, tMax: 16, ghiDaily: 4.20, snowProb: 0,    daylightHours: 11.9 },
  { month: 4,  tMin: 8,  tMean: 13.5, tMax: 19, ghiDaily: 5.35, snowProb: 0,    daylightHours: 13.3 },
  { month: 5,  tMin: 12, tMean: 18.0, tMax: 24, ghiDaily: 6.40, snowProb: 0,    daylightHours: 14.6 },
  { month: 6,  tMin: 16, tMean: 22.5, tMax: 29, ghiDaily: 7.05, snowProb: 0,    daylightHours: 15.2 },
  { month: 7,  tMin: 19, tMean: 25.5, tMax: 33, ghiDaily: 7.25, snowProb: 0,    daylightHours: 14.9 },
  { month: 8,  tMin: 19, tMean: 25.0, tMax: 32, ghiDaily: 6.45, snowProb: 0,    daylightHours: 13.9 },
  { month: 9,  tMin: 16, tMean: 21.0, tMax: 27, ghiDaily: 5.10, snowProb: 0,    daylightHours: 12.5 },
  { month: 10, tMin: 12, tMean: 16.5, tMax: 22, ghiDaily: 3.65, snowProb: 0,    daylightHours: 11.1 },
  { month: 11, tMin: 7,  tMean: 11.5, tMax: 16, ghiDaily: 2.35, snowProb: 0,    daylightHours: 9.9 },
  { month: 12, tMin: 4,  tMean: 8.5,  tMax: 13, ghiDaily: 1.85, snowProb: 0.02, daylightHours: 9.2 },
];

/** Profili stagionali */
export const SEASONS = {
  winter: { months: [12, 1, 2], label: 'Inverno', icon: 'snowflake', color: '#359EFE' },
  spring: { months: [3, 4, 5], label: 'Primavera', icon: 'flower', color: '#22C55E' },
  summer: { months: [6, 7, 8], label: 'Estate', icon: 'sun', color: '#FFE42B' },
  autumn: { months: [9, 10, 11], label: 'Autunno', icon: 'leaf', color: '#F59E0B' },
} as const;

export type SeasonKey = keyof typeof SEASONS;

/**
 * Caratteristiche del villino tipo (Monteporzio Living).
 *   - 136 m² su due livelli (PT living open-space, P1 zona notte + terrazza)
 *   - Riscaldamento a pavimento radiante alimentato da pompa di calore aria-acqua
 *   - Split elettrici per raffrescamento estivo e integrazione
 *   - Involucro: facciata grigia + rivestimento pietra locale, cappotto
 *   - Infissi PVC o legno (parametrizzabile), tapparelle motorizzate
 *   - Copertura piana in c.a. (travi rovesce) con vespaio areato a igloo
 */
export const BUILDING = {
  grossFloorArea: 136,
  netFloorArea: 118,
  heatedArea: 110,
  /** superficie disperdente involucro di una unità tipo (m²) */
  envelopeArea: 280,
  volumeM3: 320,
  floorsCount: 2,
  /** Trasmittanza media equivalente involucro (W/m²K), cappotto + infissi performanti */
  uMean: 0.30,
  /** Ricambi d'aria con VMC + recupero */
  airChangeRate: 0.4,
  vmcRecoveryEff: 0.78,
  setpointHeating: 20,
  setpointCooling: 26,
  setbackHeating: 16,
  internalGains: 4,
  floors: [
    { id: 'pt', label: 'Piano terra · living', kwTotal: 6.0, kwRid: 3.6, kwHp2: 3.0 },
    { id: 'p1', label: 'Piano primo · notte', kwTotal: 4.5, kwRid: 2.7, kwHp2: 2.2 },
    { id: 'terrazza', label: 'Terrazza panoramica', kwTotal: 1.2, kwRid: 0.7, kwHp2: 0.6 },
  ],
  totalConnectedKw: 11.7,
  reducedKwHp1: 7.0,
  reducedKwHp2: 5.8,
} as const;

/**
 * Le tre unità del complesso.
 *   - "internal": villino interno, condivide entrambe le pareti laterali (più protetto)
 *   - "corner": villino esterno angolare, una parete laterale esposta (più disperdente)
 * exposedFactor moltiplica le dispersioni verticali: l'unità interna disperde meno.
 */
export interface UnitDef {
  id: string;
  name: string;
  type: 'corner' | 'internal';
  exposedFactor: number;
  /** orientamento della falda/terrazza principale */
  exposure: string;
  pvDefaultKw: number;
  accent: string;
}

export const UNITS: UnitDef[] = [
  { id: 'ponente', name: 'Villino Ponente', type: 'corner', exposedFactor: 0.86, exposure: 'Sud-Ovest', pvDefaultKw: 6.0, accent: '#FFE42B' },
  { id: 'centrale', name: 'Villino Centrale', type: 'internal', exposedFactor: 0.66, exposure: 'Sud', pvDefaultKw: 5.4, accent: '#359EFE' },
  { id: 'levante', name: 'Villino Levante', type: 'corner', exposedFactor: 0.86, exposure: 'Sud-Est', pvDefaultKw: 6.0, accent: '#009336' },
];

/**
 * Impianto PV — copertura piana, moduli su struttura a leggera inclinazione (sud, tilt ~10-15°)
 */
export const PV_DEFAULT = {
  peakKw: 5.4,
  tiltDeg: 12,
  azimuthDeg: 0,
  systemLoss: 0.12,
  panelTempCoeff: -0.0035,
  inverterEff: 0.975,
  snowDerateFactor: 0.98,
  modules: 12,
  moduleWp: 450,
};

/** Batteria di accumulo */
export const BATTERY_DEFAULT = {
  capacityKwh: 10,
  maxChargeKw: 5,
  maxDischargeKw: 5,
  roundTripEff: 0.92,
  minSoc: 0.1,
  maxSoc: 0.95,
  selfDischargeDaily: 0.002,
  technology: 'LiFePO4',
};

/** Pompa di calore aria-acqua + pavimento radiante (bassa temperatura → COP elevato) */
export const HEATPUMP_DEFAULT = {
  unitsCount: 1,
  ratedKwElPerUnit: 3.0,
  ratedKwThPerUnit: 12.0,
  /** COP con mandata bassa (radiante ~35°C): più alti che con radiatori */
  copCurve: [
    { tOut: -5, cop: 2.8 },
    { tOut: 0, cop: 3.4 },
    { tOut: 5, cop: 4.1 },
    { tOut: 7, cop: 4.5 },
    { tOut: 12, cop: 5.0 },
    { tOut: 20, cop: 5.4 },
  ],
  /** EER raffrescamento (split + eventuale raffrescamento idronico) */
  eerCurve: [
    { tOut: 22, eer: 5.2 },
    { tOut: 28, eer: 4.3 },
    { tOut: 33, eer: 3.6 },
    { tOut: 38, eer: 3.0 },
  ],
  backupActivationT: -8,
  backupKw: 3,
};

/** Tariffe italiane 2026 (parametrizzabili da UI) */
export const TARIFF_DEFAULT = {
  fixedPriceEurPerKwh: 0.29,
  variable: { f1: 0.34, f2: 0.29, f3: 0.23 },
  fixedMonthlyEur: 16,
  ritiroDedicatoEurPerMwh: 110,
  cerIncentiveEurPerMwh: 110,
  cerRestituzioneEurPerMwh: 9.7,
  prosumerShareCer: 0.7,
};

/** Profilo orario carichi base (esclusi HP, split, EV) — residenza abitata, 0–1 */
export const BASE_LOAD_PROFILE_24H = [
  0.35, 0.3, 0.28, 0.26, 0.26, 0.3, 0.45, 0.7, 0.65, 0.5, 0.45, 0.5, 0.6, 0.5, 0.45, 0.5, 0.6, 0.8, 1.0, 0.95, 0.85,
  0.7, 0.55, 0.42,
];

/** Picco potenza base (kW) quando il villino è abitato — esclude HP/split/EV */
export const BASE_LOAD_PEAK_KW_OCCUPIED = 2.4;

/** Carico minimo continuo villino "vuoto" (stand-by, frigo, allarme, VMC) */
export const BASE_LOAD_VACANT_KW = 0.18;

/** Nessun impianto antighiaccio in questo progetto (clima mite) */
export const ANTI_ICE = {
  thresholdT: -10,
  totalKw: 0,
  dutyCycle: 0,
};

/** Occupazione di default: residenza principale abitata tutto l'anno */
export const DEFAULT_OCCUPANCY_WEEKS_PER_YEAR = 48;
