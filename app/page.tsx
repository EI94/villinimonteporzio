'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Banknote,
  Building2,
  Gauge,
  Leaf,
  LineChart as LineChartIcon,
  MapPin,
  Settings2,
  Sparkles,
  Sun as SunIcon,
  Thermometer,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/app/components/layout/AppShell';
import { PageContainer, PageHeader, PageSection } from '@/app/components/layout/PageContainer';
import {
  Collapsible,
  Drawer,
  ExportMenu,
  type ExportFormat,
  MetricTile,
  SegmentedControl,
  VoltaButton,
  VoltaCard,
  VoltaPill,
} from '@/app/components/ui';
import { ControlsPanel, type DashboardParams } from '@/app/components/dashboard/ControlsPanel';
import { EconomicsTable } from '@/app/components/dashboard/EconomicsTable';
import { SeasonScenarios, SeasonNarrative } from '@/app/components/dashboard/SeasonScenarios';
import { VoltaAssistant } from '@/app/components/dashboard/VoltaAssistant';
import { SiteMap } from '@/app/components/dashboard/SiteMap';
import { downloadReportCsv, downloadReportJson, openReportPdf } from '@/app/lib/utils/exportReport';
import { EnergyTimeline, GridFlowChart, SocChart } from '@/app/components/charts/EnergyTimeline';
import { SeasonalEconomicsChart, SeasonalEnergyChart } from '@/app/components/charts/SeasonalChart';
import {
  BATTERY_DEFAULT,
  BUILDING,
  HEATPUMP_DEFAULT,
  PV_DEFAULT,
  SEASONS,
  SITE,
  TARIFF_DEFAULT,
  UNITS,
  type SeasonKey,
  type UnitDef,
} from '@/app/lib/energy/constants';
import { DEFAULT_OCCUPANCY } from '@/app/lib/energy/occupancy';
import { aggregateBySeason, simulateYear, typicalDay, type SimulationResult } from '@/app/lib/energy/simulator';
import { computeFinance, CER_MATURITY } from '@/app/lib/energy/finance';
import { formatEur, formatKwh, formatPct } from '@/app/lib/energy/format';

const Complex3D = dynamic(() => import('@/app/components/house3d/Complex3D').then((m) => m.Complex3D), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-2xl border border-volta-white/10 bg-volta-white/[0.02] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 rounded-full border-2 border-volta-yellow border-t-transparent animate-spin" />
        <p className="mt-3 text-xs text-volta-white/55">Caricamento del complesso 3D…</p>
      </div>
    </div>
  ),
});

function envelopeUFromWindows(windowType: 'pvc' | 'legno', shutters: boolean): number {
  let u = windowType === 'legno' ? 0.33 : 0.29;
  if (shutters) u *= 0.97;
  return u;
}

function defaultParamsForUnit(unit: UnitDef): DashboardParams {
  return {
    occupancy: DEFAULT_OCCUPANCY,
    pvPeakKw: unit.pvDefaultKw,
    pvTilt: 12,
    pvAzimuth: 0,
    pvSnowDerate: 0.02,
    batteryCapacityKwh: 10,
    batteryMaxKw: 5,
    batteryMode: 'self_consumption',
    batteryTech: 'LiFePO4',
    backupGenerator: false,
    backupGeneratorKw: 4,
    backupFuel: 'gpl',
    hpUnitsCount: 1,
    hpBackupT: -8,
    windowType: 'pvc',
    shuttersMotorized: true,
    splitCount: 2,
    tariffType: 'variable',
    fixedPrice: TARIFF_DEFAULT.fixedPriceEurPerKwh,
    indexedSpread: 0.07,
    variableF1: TARIFF_DEFAULT.variable.f1,
    variableF2: TARIFF_DEFAULT.variable.f2,
    variableF3: TARIFF_DEFAULT.variable.f3,
    ritiroDedicatoPrice: TARIFF_DEFAULT.ritiroDedicatoEurPerMwh,
    cerIncentivePrice: TARIFF_DEFAULT.cerIncentiveEurPerMwh,
    cerProsumerShare: TARIFF_DEFAULT.prosumerShareCer,
    setpointHeating: 20,
    setpointCooling: 26,
    setbackHeating: 16,
    winterMinT: 0,
    summerMaxT: 33,
    ev: false,
    evDailyKwh: 8,
    evNight: true,
    voltaOptimizer: true,
    cerEnabled: false,
    cerPeakKw: 5,
    cerMaturity: 'growing',
    autoCapex: true,
    capexEur: 14000,
    detrazione50: true,
  };
}

const cerDemandProfile = [
  0.3, 0.26, 0.24, 0.24, 0.24, 0.28, 0.4, 0.6, 0.55, 0.45, 0.4, 0.45, 0.55, 0.5, 0.45, 0.5, 0.6, 0.78, 0.92, 0.92, 0.82,
  0.66, 0.5, 0.38,
];

function buildSimParams(params: DashboardParams, unit: UnitDef) {
  const pv = {
    ...PV_DEFAULT,
    peakKw: params.pvPeakKw,
    tiltDeg: params.pvTilt,
    azimuthDeg: params.pvAzimuth,
    snowDerateFactor: 1 - params.pvSnowDerate,
  };
  const battery = {
    ...BATTERY_DEFAULT,
    capacityKwh: params.batteryCapacityKwh,
    maxChargeKw: params.batteryMaxKw,
    maxDischargeKw: params.batteryMaxKw,
    roundTripEff: params.batteryTech === 'NMC' ? 0.94 : params.batteryTech === 'Salt' ? 0.86 : 0.92,
  };
  const heatpump = { ...HEATPUMP_DEFAULT, unitsCount: params.hpUnitsCount, backupActivationT: params.hpBackupT };
  const tariff = {
    ...TARIFF_DEFAULT,
    fixedPriceEurPerKwh: params.fixedPrice,
    variable: { f1: params.variableF1, f2: params.variableF2, f3: params.variableF3 },
    ritiroDedicatoEurPerMwh: params.ritiroDedicatoPrice,
    cerIncentiveEurPerMwh: params.cerIncentivePrice,
    prosumerShareCer: params.cerProsumerShare,
  };
  return simulateYear({
    occupancy: params.occupancy,
    pv,
    battery,
    heatpump,
    batteryMode: params.batteryMode,
    tariff,
    tariffType: params.tariffType,
    indexedSpread: params.indexedSpread,
    exposedFactor: unit.exposedFactor,
    envelopeU: envelopeUFromWindows(params.windowType, params.shuttersMotorized),
    setpointHeating: params.setpointHeating,
    setpointCooling: params.setpointCooling,
    setbackHeating: params.setbackHeating,
    climateOverride: { winterMinT: params.winterMinT, summerMaxT: params.summerMaxT },
    cerDemandProfile: params.cerEnabled ? cerDemandProfile : undefined,
    cerPeakKw: params.cerEnabled ? params.cerPeakKw * CER_MATURITY[params.cerMaturity].year1Factor : 0,
    ev: { enabled: params.ev, dailyKwh: params.evDailyKwh, preferNight: params.evNight },
    voltaOptimizer: params.voltaOptimizer,
  });
}

export default function HomePage() {
  const [paramsByUnit, setParamsByUnit] = useState<Record<string, DashboardParams>>(() =>
    Object.fromEntries(UNITS.map((u) => [u.id, defaultParamsForUnit(u)])),
  );
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [season, setSeason] = useState<SeasonKey>('summer');
  const [hour, setHour] = useState<number>(13);
  const [paramsOpen, setParamsOpen] = useState(false);

  const unit = selectedUnit ? UNITS.find((u) => u.id === selectedUnit)! : null;
  const params = selectedUnit ? paramsByUnit[selectedUnit] : null;
  const setParams = (next: DashboardParams) =>
    selectedUnit && setParamsByUnit((prev) => ({ ...prev, [selectedUnit]: next }));

  // Simulazioni di tutte le unità (per le card di insieme)
  const simByUnit = useMemo(() => {
    const out: Record<string, SimulationResult> = {};
    UNITS.forEach((u) => {
      out[u.id] = buildSimParams(paramsByUnit[u.id], u);
    });
    return out;
  }, [paramsByUnit]);

  const simulation = selectedUnit ? simByUnit[selectedUnit] : null;
  const t = simulation?.totals;

  const bySeason = useMemo(() => {
    if (!simulation || !params) return null;
    return aggregateBySeason(simulation, {
      tariff: {
        ...TARIFF_DEFAULT,
        fixedPriceEurPerKwh: params.fixedPrice,
        variable: { f1: params.variableF1, f2: params.variableF2, f3: params.variableF3 },
        ritiroDedicatoEurPerMwh: params.ritiroDedicatoPrice,
        cerIncentiveEurPerMwh: params.cerIncentivePrice,
        prosumerShareCer: params.cerProsumerShare,
      },
      tariffType: params.tariffType,
      indexedSpread: params.indexedSpread,
    });
  }, [simulation, params]);

  const dayProfile = useMemo(() => (simulation ? typicalDay(simulation, season) : []), [simulation, season]);
  const seasonT = bySeason ? bySeason[season] : null;

  const finance = useMemo(() => {
    if (!t || !params) return null;
    const baseBenefit = t.netCashFlowRdEur;
    const cerBonusYear1 = params.cerEnabled ? Math.max(0, t.netCashFlowCerEur - t.netCashFlowRdEur) : 0;
    return computeFinance({
      capexEur: params.capexEur,
      autoCapex: params.autoCapex,
      pvPeakKw: params.pvPeakKw,
      batteryKwh: params.batteryCapacityKwh,
      detrazione50: params.detrazione50,
      baseBenefitEur: baseBenefit,
      cerBonusYear1Eur: cerBonusYear1,
      cerMaturity: params.cerMaturity,
    });
  }, [t, params]);

  const liveHourData = dayProfile[hour];
  const liveNetGrid = liveHourData ? liveHourData.gridImportKwh - liveHourData.gridExportKwh : 0;

  const handleExport = (format: ExportFormat) => {
    if (!simulation || !bySeason || !params || !finance) return;
    if (format === 'pdf') {
      const bridge = (window as unknown as { __voltaCapture?: () => string | undefined }).__voltaCapture;
      const renderImage = bridge ? bridge() : undefined;
      openReportPdf(simulation, bySeason, params, finance, {
        renderImage: renderImage && renderImage.length > 5000 ? renderImage : undefined,
        renderCaption: `${unit?.name} · ${SEASONS[season].label} · ore ${hour.toString().padStart(2, '0')}:00`,
      });
    } else if (format === 'csv') downloadReportCsv(simulation, bySeason, params, finance);
    else downloadReportJson(simulation, bySeason, params, finance);
  };

  const the3D = (
    <Complex3D
      season={season}
      hour={hour}
      selectedUnit={selectedUnit}
      onSelectUnit={setSelectedUnit}
      pvKw={liveHourData?.pvKwh ?? 0}
      pvPeakKw={params?.pvPeakKw ?? 6}
      loadKw={liveHourData?.loadKwh ?? 0}
      batterySoc={liveHourData?.batSoc ?? 0.5}
      gridKw={liveNetGrid}
    />
  );

  return (
    <AppShell
      topbarRight={
        <VoltaPill variant="success">
          <Activity className="h-3 w-3" strokeWidth={2} /> Live
        </VoltaPill>
      }
    >
      <PageContainer size="wide">
        {!selectedUnit ? (
          /* ===================== VISTA D'INSIEME ===================== */
          <>
            <PageHeader
              eyebrow={
                <div className="flex flex-wrap items-center gap-2">
                  <VoltaPill variant="accent" icon={<MapPin className="h-3 w-3" strokeWidth={2} />}>
                    Monteporzio Catone (RM)
                  </VoltaPill>
                  <VoltaPill variant="info">Castelli Romani · Zona D</VoltaPill>
                </div>
              }
              title="Monteporzio Living"
              subtitle="Tre villini a schiera — un villino interno e due esterni angolari. 136 m² su due livelli, fotovoltaico in copertura, terrazza panoramica. Tocca un villino per esplorarne i dati energetici."
            />

            <PageSection>
              <div className="h-[420px] md:h-[560px]">{the3D}</div>
            </PageSection>

            <PageSection title="I tre villini" description="Stesso capitolato premium, prestazioni diverse per posizione ed esposizione.">
              <div className="grid gap-3 md:grid-cols-3">
                {UNITS.map((u) => {
                  const tot = simByUnit[u.id].totals;
                  const p = paramsByUnit[u.id];
                  const net = p.cerEnabled ? tot.netCashFlowCerEur : tot.netCashFlowRdEur;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUnit(u.id)}
                      className="text-left rounded-2xl border border-volta-white/10 bg-volta-white/[0.03] p-4 transition-all duration-200 hover:border-volta-white/30 hover:bg-volta-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volta-yellow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${u.accent}22`, color: u.accent }}
                          >
                            <Building2 className="h-4 w-4" strokeWidth={1.75} />
                          </span>
                          <div>
                            <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-volta-white/50">
                              {u.type === 'internal' ? 'Interno' : 'Angolare'} · {u.exposure}
                            </p>
                          </div>
                        </div>
                        <VoltaPill variant="subtle">136 m²</VoltaPill>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <MetricTile label="Produzione" value={formatKwh(tot.pvKwh, 0)} accent="yellow" />
                        <MetricTile label="Autosuff." value={formatPct(tot.selfSufficiencyRate, 0)} accent="green" />
                        <MetricTile label="Guadagno" value={formatEur(net, 0)} accent="green" />
                      </div>
                      <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-volta-yellow">
                        Esplora il villino
                        <ArrowLeft className="h-3 w-3 rotate-180" strokeWidth={2} />
                      </p>
                    </button>
                  );
                })}
              </div>
            </PageSection>

            <PageSection title="Il progetto" description="Luxury accessibile ai Castelli Romani.">
              <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                <VoltaCard variant="elevated" padding="lg">
                  <p className="text-sm text-volta-white/75 leading-relaxed">
                    Monteporzio Living è un piccolo complesso di tre villini a schiera progettato con un linguaggio
                    architettonico contemporaneo: facciate grigie, rivestimenti in pietra locale, soffitti in listelli di
                    legno e ampie vetrate scorrevoli. Ogni villino si sviluppa su due livelli — piano terra con living
                    open-space e accesso diretto al giardino, piano primo con zona notte personalizzabile e terrazza
                    panoramica privata.
                  </p>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <MetricTile label="Superficie" value="136 m²" accent="blue" />
                    <MetricTile label="Livelli" value="2" accent="blue" />
                    <MetricTile label="Riscaldamento" value="PdC + radiante" accent="green" />
                    <MetricTile label="Copertura" value="FV + terrazza" accent="yellow" />
                  </div>
                </VoltaCard>
                <SiteMap />
              </div>
            </PageSection>
          </>
        ) : (
          /* ===================== DETTAGLIO VILLINO ===================== */
          <>
            <PageHeader
              eyebrow={
                <button
                  type="button"
                  onClick={() => setSelectedUnit(null)}
                  className="inline-flex items-center gap-1.5 text-xs text-volta-white/60 hover:text-volta-yellow transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} /> Tutti i villini
                </button>
              }
              title={unit!.name}
              subtitle={`${unit!.type === 'internal' ? 'Villino interno' : 'Villino angolare'} · esposizione ${unit!.exposure} · 136 m² · PV ${params!.pvPeakKw.toFixed(1)} kWp · accumulo ${params!.batteryCapacityKwh.toFixed(0)} kWh`}
              actions={
                <>
                  <VoltaButton
                    variant="secondary"
                    size="md"
                    icon={<Settings2 className="h-4 w-4" strokeWidth={1.75} />}
                    onClick={() => setParamsOpen(true)}
                  >
                    Parametri
                  </VoltaButton>
                  <ExportMenu onExport={handleExport} />
                </>
              }
            />

            <PageSection>
              <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
                <div className="h-[460px] lg:h-[540px]">{the3D}</div>
                <div className="flex flex-col gap-3">
                  <SegmentedControl
                    value={season}
                    onChange={setSeason}
                    fullWidth
                    options={[
                      { value: 'winter', label: 'Inverno' },
                      { value: 'spring', label: 'Primav.' },
                      { value: 'summer', label: 'Estate' },
                      { value: 'autumn', label: 'Autunno' },
                    ]}
                  />
                  <VoltaCard variant="elevated" glowColor="yellow" padding="md">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-wide text-volta-white/45">Ora del giorno</p>
                      <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white tabular-nums">
                        {hour.toString().padStart(2, '0')}:00
                      </p>
                    </div>
                    <input type="range" className="volta-range mt-2.5" min={0} max={23} step={1} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
                    <div className="mt-1 flex justify-between text-[10px] text-volta-white/40">
                      <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
                    </div>
                  </VoltaCard>

                  {seasonT && (
                    <div className="grid grid-cols-3 gap-2">
                      <MetricTile label={`Autosuff. ${SEASONS[season].label.toLowerCase()}`} value={formatPct(seasonT.selfSufficiencyRate, 0)} accent="green" />
                      <MetricTile label="Produzione" value={formatKwh(seasonT.pvKwh, 0)} accent="yellow" />
                      <MetricTile label="Consumo" value={formatKwh(seasonT.loadKwh, 0)} accent="blue" />
                    </div>
                  )}

                  <div className="rounded-xl border border-volta-white/10 bg-volta-white/[0.03] px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-wide text-volta-white/45">Adesso · ore {hour.toString().padStart(2, '0')}:00</p>
                      <span className="text-[10px] text-volta-white/45">{(liveHourData?.tOut ?? 0).toFixed(0)}°C</span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-sm font-semibold text-volta-yellow tabular-nums">{(liveHourData?.pvKwh ?? 0).toFixed(1)} kW</p>
                        <p className="text-[9px] uppercase tracking-wide text-volta-white/40">Solare</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-volta-white tabular-nums">{(liveHourData?.loadKwh ?? 0).toFixed(1)} kW</p>
                        <p className="text-[9px] uppercase tracking-wide text-volta-white/40">Consumo</p>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold tabular-nums ${liveNetGrid > 0.05 ? 'text-volta-red' : 'text-volta-green'}`}>
                          {liveNetGrid > 0.05 ? '↓' : '↑'} {Math.abs(liveNetGrid).toFixed(1)} kW
                        </p>
                        <p className="text-[9px] uppercase tracking-wide text-volta-white/40">Rete</p>
                      </div>
                    </div>
                  </div>

                  {t && finance && (
                    <EconomicsHeadline rd={t.netCashFlowRdEur} cer={t.netCashFlowCerEur} cerEnabled={params!.cerEnabled} finance={finance} detrazione50={params!.detrazione50} />
                  )}
                </div>
              </div>
            </PageSection>

            {bySeason && (
              <PageSection title="Le 4 stagioni" description="Tocca una stagione per aggiornare modello e grafici.">
                <SeasonScenarios bySeason={bySeason} selected={season} onSelect={setSeason} cerEnabled={params!.cerEnabled} />
              </PageSection>
            )}

            <PageSection title="Approfondimenti" description="Apri solo ciò che ti serve.">
              <div className="space-y-2.5">
                <Collapsible
                  title={`Analisi giorno tipico — ${SEASONS[season].label}`}
                  description="Curve orarie di produzione, accumulo e scambio rete"
                  icon={<LineChartIcon className="h-4 w-4" strokeWidth={1.75} />}
                >
                  <SeasonNarrative season={season} />
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <ChartCard title="Produzione PV vs Consumo" pill="kW" glow="yellow">
                      <EnergyTimeline data={dayProfile} />
                    </ChartCard>
                    <ChartCard title="Accumulo e temperatura" pill="% · °C" glow="green">
                      <SocChart data={dayProfile} />
                    </ChartCard>
                    <ChartCard title="Scambio con la rete" pill="Import · Export" glow="blue">
                      <GridFlowChart data={dayProfile} />
                    </ChartCard>
                    {bySeason && (
                      <ChartCard title="Energia per stagione" pill="kWh">
                        <SeasonalEnergyChart data={bySeason} />
                      </ChartCard>
                    )}
                  </div>
                </Collapsible>

                {t && bySeason && finance && (
                  <Collapsible
                    title="Vendita in rete vs Comunità Energetica"
                    description="Confronto economico, investimento e ritorno"
                    icon={<Banknote className="h-4 w-4" strokeWidth={1.75} />}
                    badge={<VoltaPill variant={params!.cerEnabled ? 'success' : 'subtle'}>{params!.cerEnabled ? 'CER attiva' : 'CER off'}</VoltaPill>}
                  >
                    <EconomicsTable
                      totals={t}
                      cerEnabled={params!.cerEnabled}
                      ritiroDedicatoPrice={params!.ritiroDedicatoPrice}
                      cerIncentivePrice={params!.cerIncentivePrice}
                      prosumerShare={params!.cerProsumerShare}
                      finance={finance}
                      detrazione50={params!.detrazione50}
                    />
                    <div className="mt-3">
                      <ChartCard title="Ricavi e risparmi per stagione" pill="€ / stagione">
                        <SeasonalEconomicsChart data={bySeason} />
                      </ChartCard>
                    </div>
                  </Collapsible>
                )}

                {t && (
                  <Collapsible title="Suggerimenti Volta" description="Come migliorare resa e ricavi del villino" icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}>
                    <VoltaAssistant totals={t} params={params!} />
                  </Collapsible>
                )}

                <Collapsible title="Scheda tecnica e sito" description="Impianti del villino · posizione" icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <UnitFactsheet unit={unit!} params={params!} />
                    <SiteMap />
                  </div>
                </Collapsible>
              </div>
            </PageSection>
          </>
        )}
      </PageContainer>

      {params && (
        <Drawer
          open={paramsOpen}
          onClose={() => setParamsOpen(false)}
          title={`Parametri · ${unit?.name ?? ''}`}
          subtitle="Le modifiche aggiornano subito modello, grafici e ricavi"
          width="md"
          footer={
            <VoltaButton variant="primary" size="md" className="w-full" onClick={() => setParamsOpen(false)}>
              Applica e chiudi
            </VoltaButton>
          }
        >
          <ControlsPanel params={params} onChange={setParams} />
        </Drawer>
      )}
    </AppShell>
  );
}

function EconomicsHeadline({
  rd,
  cer,
  cerEnabled,
  finance,
  detrazione50,
}: {
  rd: number;
  cer: number;
  cerEnabled: boolean;
  finance: ReturnType<typeof computeFinance>;
  detrazione50: boolean;
}) {
  const best = cerEnabled && cer >= rd ? 'cer' : 'rd';
  const payback = detrazione50 ? finance.paybackYearsDetrazione : finance.paybackYears;
  return (
    <VoltaCard variant="elevated" glowColor="green" padding="md">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wide text-volta-white/45">Guadagno netto annuo</p>
        <span className="rounded-full bg-volta-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-volta-white/55">fisso / anno</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className={best === 'cer' ? 'opacity-100' : 'opacity-60'}>
          <p className="text-[11px] text-volta-white/55">Comunità Energetica</p>
          <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className={`text-lg tabular-nums ${cer >= 0 ? 'text-volta-green' : 'text-volta-red'}`}>
            {formatEur(cer, 0)}
          </p>
        </div>
        <div className={best === 'rd' ? 'opacity-100' : 'opacity-60'}>
          <p className="text-[11px] text-volta-white/55">Vendita in rete</p>
          <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className={`text-lg tabular-nums ${rd >= 0 ? 'text-volta-white' : 'text-volta-red'}`}>
            {formatEur(rd, 0)}
          </p>
        </div>
      </div>
      <p className="mt-1.5 text-[10px] text-volta-white/45">Risparmio in bolletta + ricavi</p>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-volta-white/10 pt-3">
        <div>
          <p className="text-[9px] uppercase tracking-wide text-volta-white/40">Investimento</p>
          <p className="text-sm font-semibold text-volta-white tabular-nums">{formatEur(finance.capexEur, 0)}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-volta-white/40">Rientro</p>
          <p className="text-sm font-semibold text-volta-yellow tabular-nums">{payback ? `${payback.toFixed(1)} anni` : '—'}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-volta-white/40">ROI 25 anni</p>
          <p className="text-sm font-semibold text-volta-green tabular-nums">{Math.round(finance.roiPct)}%</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-volta-white/45">
        {detrazione50
          ? `Con detrazione 50% (${formatEur(finance.detrazioneAnnuaEur, 0)}/anno × 10 anni).`
          : 'Senza detrazione fiscale.'}
      </p>
    </VoltaCard>
  );
}

function ChartCard({ title, pill, glow, children }: { title: string; pill: string; glow?: 'yellow' | 'green' | 'blue'; children: React.ReactNode }) {
  return (
    <VoltaCard variant="elevated" padding="lg" glowColor={glow ?? 'none'}>
      <div className="mb-2 flex items-center justify-between">
        <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
          {title}
        </h3>
        <VoltaPill variant="default">{pill}</VoltaPill>
      </div>
      {children}
    </VoltaCard>
  );
}

function UnitFactsheet({ unit, params }: { unit: UnitDef; params: DashboardParams }) {
  const rows = [
    { k: 'Tipologia', v: unit.type === 'internal' ? 'Villino interno' : 'Villino angolare' },
    { k: 'Esposizione', v: unit.exposure },
    { k: 'Superficie', v: '136 m² · 2 livelli' },
    { k: 'Riscaldamento', v: `Pompa di calore + radiante (${params.hpUnitsCount} PdC)` },
    { k: 'Raffrescamento', v: `${params.splitCount} split` },
    { k: 'Infissi', v: params.windowType === 'pvc' ? 'PVC doppio/triplo vetro' : 'Legno doppio vetro' },
    { k: 'Tapparelle', v: params.shuttersMotorized ? 'Motorizzate' : 'Manuali' },
    { k: 'Copertura', v: 'C.a. travi rovesce + vespaio igloo' },
    { k: 'Fotovoltaico', v: `${params.pvPeakKw.toFixed(1)} kWp in copertura` },
    { k: 'Accumulo', v: `${params.batteryCapacityKwh.toFixed(0)} kWh` },
  ];
  return (
    <VoltaCard variant="elevated" glowColor="blue" padding="lg">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-volta-blue/20 text-volta-blue">
          <Building2 className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-base text-volta-white">
            Capitolato impianti
          </p>
          <p className="text-[11px] text-volta-white/55">{unit.name}</p>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {rows.map((r) => (
          <li key={r.k} className="flex items-center justify-between gap-3 border-b border-volta-white/5 py-1.5">
            <span className="text-volta-white/55">{r.k}</span>
            <span className="font-semibold text-volta-white text-right">{r.v}</span>
          </li>
        ))}
      </ul>
    </VoltaCard>
  );
}
