'use client';

import type { SimulationTotals } from '@/app/lib/energy/simulator';
import { SEASONS, type SeasonKey } from '@/app/lib/energy/constants';
import { formatEur, formatKwh, formatPct } from '@/app/lib/energy/format';
import { VoltaCard, VoltaPill } from '@/app/components/ui';
import { Cloud, Flower2, Leaf, Snowflake, Sun } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';

interface SeasonScenariosProps {
  bySeason: Record<SeasonKey, SimulationTotals>;
  selected: SeasonKey;
  onSelect: (s: SeasonKey) => void;
  cerEnabled: boolean;
}

const seasonIcon: Record<SeasonKey, React.ReactNode> = {
  winter: <Snowflake className="h-4 w-4" strokeWidth={1.75} />,
  spring: <Flower2 className="h-4 w-4" strokeWidth={1.75} />,
  summer: <Sun className="h-4 w-4" strokeWidth={1.75} />,
  autumn: <Leaf className="h-4 w-4" strokeWidth={1.75} />,
};

const seasonNarrative: Record<SeasonKey, { headline: string; detail: string; warning?: string }> = {
  winter: {
    headline: 'Inverni miti: pompa di calore e pavimento radiante in alto rendimento',
    detail:
      'Con mandata bassa del radiante la pompa di calore lavora con COP 3,5-4,5. Il fabbisogno termico è contenuto; il fotovoltaico copre comunque una parte dei consumi diurni.',
  },
  spring: {
    headline: 'Stagione di equilibrio, ottima produzione fotovoltaica',
    detail:
      'Riscaldamento quasi spento e tanto sole: il surplus fotovoltaico è elevato, ideale per caricare l’accumulo e ridurre i prelievi serali.',
  },
  summer: {
    headline: 'Picco di produzione e raffrescamento con split a pavimento',
    detail:
      'Il fotovoltaico produce al massimo proprio quando servono i raffrescamenti: gli split e la deumidificazione lavorano in gran parte con energia autoprodotta.',
  },
  autumn: {
    headline: 'Transizione dolce, buon autoconsumo nelle giornate serene',
    detail:
      'Il riscaldamento riparte gradualmente. Con accumulo e gestione smart dei carichi l’autoconsumo resta alto anche con giornate più corte.',
  },
};

export function SeasonScenarios({ bySeason, selected, onSelect, cerEnabled }: SeasonScenariosProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {(Object.keys(SEASONS) as SeasonKey[]).map((key) => {
        const totals = bySeason[key];
        const isActive = selected === key;
        const net = cerEnabled ? totals.netCashFlowCerEur : totals.netCashFlowRdEur;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              'text-left rounded-2xl border p-4 transition-all duration-300 touch-manipulation',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volta-yellow ring-offset-2 ring-offset-volta-black',
              isActive
                ? 'border-volta-yellow/40 bg-volta-yellow/[0.05] shadow-[0_0_20px_rgba(255,228,43,0.10)]'
                : 'border-volta-white/10 bg-volta-white/[0.03] hover:border-volta-white/25 hover:bg-volta-white/[0.05]',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${SEASONS[key].color}22`, color: SEASONS[key].color }}
                >
                  {seasonIcon[key]}
                </span>
                <div>
                  <p
                    style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
                    className="text-sm text-volta-white"
                  >
                    {SEASONS[key].label}
                  </p>
                  <p className="text-[10px] text-volta-white/45">
                    {SEASONS[key].months.map((m) => ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'][m - 1]).join(' · ')}
                  </p>
                </div>
              </div>
              {isActive && <VoltaPill variant="accent">Selezionato</VoltaPill>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Mini label="Produzione" value={formatKwh(totals.pvKwh, 0)} accent="text-volta-yellow" />
              <Mini label="Consumo" value={formatKwh(totals.loadKwh, 0)} accent="text-volta-blue" />
              <Mini label="Autosuff." value={formatPct(totals.selfSufficiencyRate, 0)} accent="text-volta-green" />
              <Mini label="Guadagno" value={formatEur(net, 0)} accent={net >= 0 ? 'text-volta-green' : 'text-volta-red'} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-volta-white/10 bg-volta-black/40 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wide text-volta-white/45">{label}</p>
      <p
        style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
        className={`mt-0.5 text-sm tabular-nums ${accent}`}
      >
        {value}
      </p>
    </div>
  );
}

export function SeasonNarrative({ season }: { season: SeasonKey }) {
  const n = seasonNarrative[season];
  return (
    <VoltaCard variant="elevated" padding="md" glowColor={season === 'winter' ? 'blue' : season === 'summer' ? 'yellow' : 'green'}>
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${SEASONS[season].color}22`, color: SEASONS[season].color }}
        >
          {seasonIcon[season]}
        </span>
        <div className="min-w-0 flex-1">
          <p
            style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
            className="text-sm text-volta-white"
          >
            {n.headline}
          </p>
          <p className="mt-1.5 text-xs text-volta-white/65 leading-relaxed">{n.detail}</p>
          {n.warning && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-volta-yellow/15 px-2 py-0.5 text-[10px] text-volta-yellow">
              <Cloud className="h-3 w-3" strokeWidth={2} /> {n.warning}
            </div>
          )}
        </div>
      </div>
    </VoltaCard>
  );
}
