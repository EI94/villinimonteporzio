'use client';

import { VoltaCard, VoltaSlider, VoltaSelect, VoltaToggle, SegmentedControl } from '@/app/components/ui';
import { BatteryFull, Car, Coins, Flame, Home, ShieldCheck, Sparkles, Sun, Users, Wallet, Wind } from 'lucide-react';
import type { BatteryMode } from '@/app/lib/energy/battery';
import type { OccupancyConfig } from '@/app/lib/energy/occupancy';
import { estimateCapex, CER_MATURITY, type CerMaturity } from '@/app/lib/energy/finance';
import { formatKwh, formatKw, formatEur } from '@/app/lib/energy/format';

export interface DashboardParams {
  occupancy: OccupancyConfig;
  // PV
  pvPeakKw: number;
  pvTilt: number;
  pvAzimuth: number;
  pvSnowDerate: number;
  // Battery
  batteryCapacityKwh: number;
  batteryMaxKw: number;
  batteryMode: BatteryMode;
  batteryTech: 'LiFePO4' | 'NMC' | 'Salt';
  // Backup
  backupGenerator: boolean;
  backupGeneratorKw: number;
  backupFuel: 'pellet' | 'gpl' | 'diesel';
  // Heat pump
  hpUnitsCount: number;
  hpBackupT: number;
  // Involucro e impianti
  windowType: 'pvc' | 'legno';
  shuttersMotorized: boolean;
  splitCount: number;
  // Tariffs
  tariffType: 'fixed' | 'indexed' | 'variable';
  fixedPrice: number;
  indexedSpread: number;
  variableF1: number;
  variableF2: number;
  variableF3: number;
  ritiroDedicatoPrice: number;
  cerIncentivePrice: number;
  cerProsumerShare: number;
  // Climate
  setpointHeating: number;
  setpointCooling: number;
  setbackHeating: number;
  winterMinT: number;
  summerMaxT: number;
  // EV
  ev: boolean;
  evDailyKwh: number;
  evNight: boolean;
  // App Volta
  voltaOptimizer: boolean;
  // CER
  cerEnabled: boolean;
  cerPeakKw: number;
  cerMaturity: CerMaturity;
  // Investimento e incentivi
  autoCapex: boolean;
  capexEur: number;
  detrazione50: boolean;
}

interface ControlsPanelProps {
  params: DashboardParams;
  onChange: (next: DashboardParams) => void;
}

export function ControlsPanel({ params, onChange }: ControlsPanelProps) {
  const set = <K extends keyof DashboardParams>(key: K, value: DashboardParams[K]) =>
    onChange({ ...params, [key]: value });
  const setOcc = (key: keyof OccupancyConfig, value: number) =>
    onChange({ ...params, occupancy: { ...params.occupancy, [key]: value } });

  return (
    <div className="space-y-3">
      {/* Occupazione */}
      <VoltaCard variant="elevated" padding="md" glowColor="yellow">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-yellow/15 text-volta-yellow">
            <Home className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3
            style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
            className="text-sm text-volta-white"
          >
            Occupazione casa
          </h3>
        </div>
        <div className="space-y-4">
          <VoltaSlider
            label="Settimane abitate/anno"
            valueLabel={`${params.occupancy.weeksPerYear} settimane`}
            value={params.occupancy.weeksPerYear}
            min={0}
            max={52}
            step={1}
            onChange={(e) => setOcc('weeksPerYear', Number(e.target.value))}
            helper={`Equivalente a ${Math.round(params.occupancy.weeksPerYear * 7)} giorni nell'anno`}
          />
          <VoltaSlider
            label="Persone presenti"
            valueLabel={`${params.occupancy.occupants}`}
            value={params.occupancy.occupants}
            min={1}
            max={8}
            step={1}
            onChange={(e) => setOcc('occupants', Number(e.target.value))}
            accentColor="yellow"
          />
          <div className="grid grid-cols-2 gap-2">
            {(['winter', 'spring', 'summer', 'autumn'] as const).map((s) => (
              <div key={s} className="rounded-lg border border-volta-white/10 bg-volta-white/[0.03] px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-volta-white/45">
                  {s === 'winter' && 'Inverno'}
                  {s === 'spring' && 'Primavera'}
                  {s === 'summer' && 'Estate'}
                  {s === 'autumn' && 'Autunno'}
                </p>
                <input
                  type="range"
                  className="volta-range mt-1"
                  min={0}
                  max={1}
                  step={0.05}
                  value={params.occupancy.seasonalSplit[s]}
                  onChange={(e) =>
                    onChange({
                      ...params,
                      occupancy: {
                        ...params.occupancy,
                        seasonalSplit: { ...params.occupancy.seasonalSplit, [s]: Number(e.target.value) },
                      },
                    })
                  }
                />
                <p className="mt-0.5 text-[10px] text-volta-white/55">
                  {Math.round(params.occupancy.seasonalSplit[s] * 100)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </VoltaCard>

      {/* Impianto PV */}
      <VoltaCard variant="elevated" padding="md" glowColor="yellow">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-yellow/15 text-volta-yellow">
            <Sun className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
            Impianto fotovoltaico
          </h3>
        </div>
        <div className="space-y-3">
          <VoltaSlider
            label="Potenza picco PV"
            valueLabel={formatKw(params.pvPeakKw, 1)}
            value={params.pvPeakKw}
            min={3}
            max={20}
            step={0.3}
            onChange={(e) => set('pvPeakKw', Number(e.target.value))}
            helper={`${Math.round(params.pvPeakKw / 0.45)} pannelli da 450 Wp · falda sud`}
          />
          <div className="grid grid-cols-2 gap-3">
            <VoltaSlider
              label="Tilt (inclinazione)"
              valueLabel={`${params.pvTilt}°`}
              value={params.pvTilt}
              min={0}
              max={45}
              step={1}
              onChange={(e) => set('pvTilt', Number(e.target.value))}
              helper="Copertura piana: tilt 10-15°"
            />
            <VoltaSlider
              label="Azimuth (orientamento)"
              valueLabel={`${params.pvAzimuth > 0 ? '+' : ''}${params.pvAzimuth}°`}
              value={params.pvAzimuth}
              min={-90}
              max={90}
              step={5}
              onChange={(e) => set('pvAzimuth', Number(e.target.value))}
              helper="0° = sud, +est / -ovest"
            />
          </div>
          <VoltaSlider
            label="Penalità neve sui moduli"
            valueLabel={`${Math.round(params.pvSnowDerate * 100)}%`}
            value={params.pvSnowDerate}
            min={0}
            max={0.5}
            step={0.05}
            onChange={(e) => set('pvSnowDerate', Number(e.target.value))}
            helper="Quota produzione persa in mesi nevosi"
          />
        </div>
      </VoltaCard>

      {/* Batteria */}
      <VoltaCard variant="elevated" padding="md" glowColor="green">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-green/15 text-volta-green">
            <BatteryFull className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
            Accumulo
          </h3>
        </div>
        <div className="space-y-3">
          <VoltaSlider
            label="Capacità utile batteria"
            valueLabel={formatKwh(params.batteryCapacityKwh, 1)}
            value={params.batteryCapacityKwh}
            min={0}
            max={40}
            step={2.5}
            onChange={(e) => set('batteryCapacityKwh', Number(e.target.value))}
            accentColor="green"
            helper="Capacità nominale dell'accumulo"
          />
          <VoltaSlider
            label="Potenza di carica/scarica"
            valueLabel={formatKw(params.batteryMaxKw, 1)}
            value={params.batteryMaxKw}
            min={1.5}
            max={15}
            step={0.5}
            onChange={(e) => set('batteryMaxKw', Number(e.target.value))}
            accentColor="green"
            helper="Limite picco istantaneo inverter ibrido"
          />
          <VoltaSelect
            label="Tecnologia celle"
            value={params.batteryTech}
            onChange={(v) => set('batteryTech', v)}
            options={[
              { value: 'LiFePO4', label: 'LiFePO4 — sicura, 92% RTE, 8000 cicli' },
              { value: 'NMC', label: 'NMC — densa, 94% RTE, 6000 cicli' },
              { value: 'Salt', label: 'Sodio (salt) — robusta freddo, 86% RTE' },
            ]}
          />
          <VoltaSelect<BatteryMode>
            label="Strategia dispatch"
            value={params.batteryMode}
            onChange={(v) => set('batteryMode', v)}
            options={[
              { value: 'self_consumption', label: 'Massimo autoconsumo' },
              { value: 'tou_arbitrage', label: 'Arbitraggio orario (F1/F3)' },
              { value: 'cer_max', label: 'Massimizza condivisione CER' },
              { value: 'backup_reserve', label: 'Riserva backup 50%' },
            ]}
          />
        </div>
      </VoltaCard>

      {/* Backup */}
      <VoltaCard variant="elevated" padding="md" glowColor={params.backupGenerator ? 'yellow' : 'none'}>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-yellow/15 text-volta-yellow">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
            Backup energia
          </h3>
        </div>
        <div className="space-y-3">
          <VoltaToggle
            label="Generatore di backup"
            description="Garantisce continuità con T < -10°C o black-out rete"
            checked={params.backupGenerator}
            onChange={(v) => set('backupGenerator', v)}
            icon={<Flame className="h-4 w-4" strokeWidth={1.75} />}
          />
          {params.backupGenerator && (
            <>
              <VoltaSlider
                label="Potenza generatore"
                valueLabel={formatKw(params.backupGeneratorKw, 1)}
                value={params.backupGeneratorKw}
                min={3}
                max={20}
                step={0.5}
                onChange={(e) => set('backupGeneratorKw', Number(e.target.value))}
              />
              <VoltaSelect
                label="Combustibile"
                value={params.backupFuel}
                onChange={(v) => set('backupFuel', v)}
                options={[
                  { value: 'pellet', label: 'Pellet (caldaia integrazione)' },
                  { value: 'gpl', label: 'GPL (gruppo elettrogeno)' },
                  { value: 'diesel', label: 'Diesel (gruppo elettrogeno)' },
                ]}
              />
            </>
          )}
          <VoltaSlider
            label="Pompe di calore (aria-acqua)"
            valueLabel={`${params.hpUnitsCount} × 3 kWe`}
            value={params.hpUnitsCount}
            min={1}
            max={2}
            step={1}
            onChange={(e) => set('hpUnitsCount', Number(e.target.value))}
            accentColor="blue"
            helper="1 PdC + pavimento radiante per villino"
          />
        </div>
      </VoltaCard>

      {/* Involucro e impianti */}
      <VoltaCard variant="elevated" padding="md" glowColor="blue">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-blue/15 text-volta-blue">
            <Home className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
            Involucro e impianti
          </h3>
        </div>
        <div className="space-y-3">
          <VoltaSelect
            label="Infissi"
            value={params.windowType}
            onChange={(v) => set('windowType', v)}
            options={[
              { value: 'pvc', label: 'PVC — doppio/triplo vetro (U ≈ 1,1)' },
              { value: 'legno', label: 'Legno — doppio vetro (U ≈ 1,5)' },
            ]}
          />
          <VoltaToggle
            label="Tapparelle motorizzate"
            description="Chiusura notturna: meno dispersioni, comfort migliore"
            checked={params.shuttersMotorized}
            onChange={(v) => set('shuttersMotorized', v)}
            icon={<Home className="h-4 w-4" strokeWidth={1.75} />}
          />
          <VoltaSlider
            label="Split di raffrescamento"
            valueLabel={`${params.splitCount} unità`}
            value={params.splitCount}
            min={0}
            max={5}
            step={1}
            onChange={(e) => set('splitCount', Number(e.target.value))}
            accentColor="blue"
            helper="Integrazione estiva e deumidificazione"
          />
        </div>
      </VoltaCard>

      {/* Termico */}
      <VoltaCard variant="elevated" padding="md" glowColor="blue">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-blue/15 text-volta-blue">
            <Wind className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
            Clima e setpoint
          </h3>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <VoltaSlider
              label="Setpoint riscaldamento"
              valueLabel={`${params.setpointHeating}°C`}
              value={params.setpointHeating}
              min={16}
              max={24}
              step={0.5}
              onChange={(e) => set('setpointHeating', Number(e.target.value))}
              accentColor="blue"
            />
            <VoltaSlider
              label="Setpoint raffrescamento"
              valueLabel={`${params.setpointCooling}°C`}
              value={params.setpointCooling}
              min={22}
              max={28}
              step={0.5}
              onChange={(e) => set('setpointCooling', Number(e.target.value))}
              accentColor="blue"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <VoltaSlider
              label="Setback casa vuota"
              valueLabel={`${params.setbackHeating}°C`}
              value={params.setbackHeating}
              min={4}
              max={16}
              step={1}
              onChange={(e) => set('setbackHeating', Number(e.target.value))}
              accentColor="blue"
              helper="Anti-gelo impianto"
            />
            <VoltaSlider
              label="Min inverno custom"
              valueLabel={`${params.winterMinT}°C`}
              value={params.winterMinT}
              min={-25}
              max={0}
              step={1}
              onChange={(e) => set('winterMinT', Number(e.target.value))}
              accentColor="blue"
              helper="Picchi notturni gennaio"
            />
          </div>
          <VoltaSlider
            label="Max estate custom"
            valueLabel={`${params.summerMaxT}°C`}
            value={params.summerMaxT}
            min={20}
            max={35}
            step={1}
            onChange={(e) => set('summerMaxT', Number(e.target.value))}
            accentColor="blue"
          />
        </div>
      </VoltaCard>

      {/* Tariffe */}
      <VoltaCard variant="elevated" padding="md" glowColor="yellow">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-yellow/15 text-volta-yellow">
            <Wallet className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
            Tariffe fornitura
          </h3>
        </div>
        <div className="space-y-3">
          <SegmentedControl
            value={params.tariffType}
            onChange={(v) => set('tariffType', v)}
            options={[
              { value: 'fixed', label: 'Fissa' },
              { value: 'indexed', label: 'Indicizzata PUN' },
              { value: 'variable', label: 'Bioraria F1/F2/F3' },
            ]}
            fullWidth
          />
          {params.tariffType === 'fixed' && (
            <VoltaSlider
              label="Prezzo monorario tutto compreso"
              valueLabel={`${params.fixedPrice.toFixed(3)} €/kWh`}
              value={params.fixedPrice}
              min={0.15}
              max={0.50}
              step={0.005}
              onChange={(e) => set('fixedPrice', Number(e.target.value))}
              helper="Stesso prezzo h24, tutti i giorni"
            />
          )}
          {params.tariffType === 'indexed' && (
            <VoltaSlider
              label="Spread sul PUN (over baseline)"
              valueLabel={`+${params.indexedSpread.toFixed(3)} €/kWh`}
              value={params.indexedSpread}
              min={0.02}
              max={0.20}
              step={0.005}
              onChange={(e) => set('indexedSpread', Number(e.target.value))}
              helper="Prezzo = PUN orario + spread fornitore + oneri"
            />
          )}
          {params.tariffType === 'variable' && (
            <div className="grid grid-cols-3 gap-2">
              <VoltaSlider label="F1 picco (8-19 feriali)" valueLabel={`${params.variableF1.toFixed(3)}`} value={params.variableF1} min={0.2} max={0.6} step={0.005} onChange={(e) => set('variableF1', Number(e.target.value))} />
              <VoltaSlider label="F2 intermedia" valueLabel={`${params.variableF2.toFixed(3)}`} value={params.variableF2} min={0.18} max={0.5} step={0.005} onChange={(e) => set('variableF2', Number(e.target.value))} />
              <VoltaSlider label="F3 base/weekend" valueLabel={`${params.variableF3.toFixed(3)}`} value={params.variableF3} min={0.12} max={0.4} step={0.005} onChange={(e) => set('variableF3', Number(e.target.value))} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <VoltaSlider
              label="Ritiro Dedicato GSE"
              valueLabel={`${params.ritiroDedicatoPrice} €/MWh`}
              value={params.ritiroDedicatoPrice}
              min={50}
              max={250}
              step={1}
              onChange={(e) => set('ritiroDedicatoPrice', Number(e.target.value))}
              accentColor="blue"
              helper="Prezzo medio orario PUN"
            />
            <VoltaSlider
              label="Incentivo CER"
              valueLabel={`${params.cerIncentivePrice} €/MWh`}
              value={params.cerIncentivePrice}
              min={60}
              max={130}
              step={1}
              onChange={(e) => set('cerIncentivePrice', Number(e.target.value))}
              accentColor="green"
              helper="DM MASE per energia condivisa"
            />
          </div>
          <VoltaSlider
            label="Quota benefici al prosumer"
            valueLabel={`${Math.round(params.cerProsumerShare * 100)}%`}
            value={params.cerProsumerShare}
            min={0.3}
            max={1}
            step={0.05}
            onChange={(e) => set('cerProsumerShare', Number(e.target.value))}
            accentColor="green"
            helper="Configurabile in statuto CER"
          />
        </div>
      </VoltaCard>

      {/* CER + EV + Volta */}
      <VoltaCard variant="elevated" padding="md" glowColor="green">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-green/15 text-volta-green">
            <Users className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
            Comunità energetica
          </h3>
        </div>
        <div className="space-y-3">
          <VoltaToggle
            label="Comunità Energetica attiva"
            description="Autoconsumo collettivo tra i tre villini"
            checked={params.cerEnabled}
            onChange={(v) => set('cerEnabled', v)}
            icon={<Users className="h-4 w-4" strokeWidth={1.75} />}
          />
          {params.cerEnabled && (
            <>
              <VoltaSlider
                label="Carico aggregato membri (a regime)"
                valueLabel={formatKw(params.cerPeakKw, 1)}
                value={params.cerPeakKw}
                min={2}
                max={30}
                step={1}
                onChange={(e) => set('cerPeakKw', Number(e.target.value))}
                accentColor="green"
                helper="Picco simultaneo della comunità a maturità"
              />
              <VoltaSelect<CerMaturity>
                label="Maturità della CER"
                value={params.cerMaturity}
                onChange={(v) => set('cerMaturity', v)}
                options={[
                  { value: 'startup', label: 'Avvio — parte al 25%, matura in 7 anni' },
                  { value: 'growing', label: 'In crescita — 55% ora, matura in 4 anni' },
                  { value: 'mature', label: 'Matura — già a regime' },
                ]}
              />
              <p className="text-[11px] text-volta-white/45">
                Le CER nascono piccole e crescono: l'anno 1 condivide il{' '}
                {Math.round(CER_MATURITY[params.cerMaturity].year1Factor * 100)}% del potenziale.
              </p>
            </>
          )}
        </div>
      </VoltaCard>

      {/* EV */}
      <VoltaCard variant="elevated" padding="md">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-white/10 text-volta-white">
            <Car className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
            Veicolo elettrico
          </h3>
        </div>
        <div className="space-y-3">
          <VoltaToggle
            label="Wallbox installata"
            description="Carica solo quando casa abitata"
            checked={params.ev}
            onChange={(v) => set('ev', v)}
            icon={<Car className="h-4 w-4" strokeWidth={1.75} />}
          />
          {params.ev && (
            <>
              <VoltaSlider
                label="Energia giornaliera EV"
                valueLabel={formatKwh(params.evDailyKwh, 1)}
                value={params.evDailyKwh}
                min={0}
                max={40}
                step={1}
                onChange={(e) => set('evDailyKwh', Number(e.target.value))}
              />
              <VoltaToggle
                label="Carica notturna preferenziale"
                description="Sfrutta fascia F3 + batteria"
                checked={params.evNight}
                onChange={(v) => set('evNight', v)}
              />
            </>
          )}
        </div>
      </VoltaCard>

      {/* Volta optimizer */}
      <VoltaCard variant="elevated" padding="md" glowColor="yellow">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-yellow/15 text-volta-yellow">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
            Ottimizzatore Volta App
          </h3>
        </div>
        <VoltaToggle
          label="Smart scheduling carichi"
          description="Sposta lavatrice, asciugatrice, accumulo ACS sulle ore di surplus PV"
          checked={params.voltaOptimizer}
          onChange={(v) => set('voltaOptimizer', v)}
          icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
        />
      </VoltaCard>

      {/* Investimento e incentivi */}
      <VoltaCard variant="elevated" padding="md" glowColor="green">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volta-green/15 text-volta-green">
            <Coins className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-sm text-volta-white">
            Investimento e incentivi
          </h3>
        </div>
        <div className="space-y-3">
          <VoltaToggle
            label="Stima automatica investimento"
            description={`FV ${formatEur(params.pvPeakKw * 1250, 0)} + accumulo ${formatEur(params.batteryCapacityKwh * 550, 0)} + opere`}
            checked={params.autoCapex}
            onChange={(v) =>
              onChange({
                ...params,
                autoCapex: v,
                capexEur: v ? estimateCapex(params.pvPeakKw, params.batteryCapacityKwh) : params.capexEur,
              })
            }
            icon={<Wallet className="h-4 w-4" strokeWidth={1.75} />}
          />
          {!params.autoCapex && (
            <VoltaSlider
              label="Investimento totale (CAPEX)"
              valueLabel={formatEur(params.capexEur, 0)}
              value={params.capexEur}
              min={5000}
              max={60000}
              step={500}
              onChange={(e) => set('capexEur', Number(e.target.value))}
              accentColor="green"
              helper="FV + inverter + accumulo + posa e pratiche"
            />
          )}
          <VoltaToggle
            label="Detrazione fiscale 50%"
            description="Bonus Ristrutturazione recuperato in 10 quote annuali"
            checked={params.detrazione50}
            onChange={(v) => set('detrazione50', v)}
            icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.75} />}
          />
        </div>
      </VoltaCard>
    </div>
  );
}
