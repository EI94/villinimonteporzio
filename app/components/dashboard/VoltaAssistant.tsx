'use client';

import { Sparkles, ChevronRight } from 'lucide-react';
import { VoltaCard, VoltaPill } from '@/app/components/ui';
import type { SimulationTotals } from '@/app/lib/energy/simulator';
import { formatEur, formatKwh, formatPct } from '@/app/lib/energy/format';
import type { DashboardParams } from './ControlsPanel';

interface AssistantProps {
  totals: SimulationTotals;
  params: DashboardParams;
}

interface Suggestion {
  text: string;
  impact?: string;
  type: 'optimize' | 'invest' | 'tariff' | 'thermal';
}

function buildSuggestions(totals: SimulationTotals, params: DashboardParams): Suggestion[] {
  const out: Suggestion[] = [];

  // Suggerimento batteria
  if (totals.gridExportKwh > totals.gridImportKwh * 1.5 && params.batteryCapacityKwh < 15) {
    out.push({
      text: 'Hai surplus PV importante esportato. Aumentare la batteria di 5 kWh ridurrebbe gli scambi con la rete.',
      impact: `Stima: +${formatEur((totals.gridExportKwh * 0.15) * 0.1, 0)}/anno di autoconsumo extra`,
      type: 'invest',
    });
  }

  // Suggerimento PV
  if (totals.selfSufficiencyRate < 0.4 && params.pvPeakKw < 12) {
    out.push({
      text: `Autosufficienza ${formatPct(totals.selfSufficiencyRate, 0)}: incrementa il PV di 3 kWp se la falda lo consente.`,
      impact: 'Potenziale: +12% di autoconsumo annuo',
      type: 'invest',
    });
  }

  // Suggerimento tariffa
  if (params.tariffType === 'fixed' && totals.gridImportKwh > 3000) {
    out.push({
      text: 'Con import elevato e PV attivo, la tariffa bioraria sposta consumi su F3 (notturna) e migliora il TCO.',
      impact: 'Risparmio stimato: 6-9% annuo',
      type: 'tariff',
    });
  }

  // CER
  if (params.cerEnabled && totals.sharedWithCerKwh < totals.gridExportKwh * 0.4) {
    out.push({
      text: 'La condivisione CER è bassa rispetto all\'export. Passa la strategia batteria a "cer_max" per allinearti al carico dei membri.',
      impact: `Potenziale extra: +${formatEur((totals.gridExportKwh * 0.4 - totals.sharedWithCerKwh) * 0.12 * params.cerProsumerShare, 0)}/anno`,
      type: 'optimize',
    });
  }

  // Termico
  if (params.setpointHeating > 21) {
    out.push({
      text: `Setpoint a ${params.setpointHeating}°C: ogni grado in meno taglia ~7% di consumo termico.`,
      type: 'thermal',
    });
  }

  // Casa vuota
  if (params.occupancy.weeksPerYear > 8 && params.setbackHeating > 10) {
    out.push({
      text: 'Setback a casa vuota troppo alto: scendere a 8°C protegge dal gelo e risparmia 15-20% di energia HP in inverno.',
      type: 'thermal',
    });
  }

  // Volta App
  if (!params.voltaOptimizer) {
    out.push({
      text: 'Attiva l\'ottimizzatore Volta App per spostare lavatrice, asciugatrice e ACS sulle ore di surplus PV.',
      impact: 'Risparmio tipico: 8-15% sulla bolletta',
      type: 'optimize',
    });
  }

  return out.slice(0, 5);
}

export function VoltaAssistant({ totals, params }: AssistantProps) {
  const suggestions = buildSuggestions(totals, params);

  return (
    <VoltaCard variant="elevated" glowColor="yellow" padding="lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-volta-yellow/20 text-volta-yellow">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <p
              style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
              className="text-base text-volta-white"
            >
              Assistente energia Volta
            </p>
            <p className="text-[11px] text-volta-white/55">Suggerimenti basati sulla simulazione corrente</p>
          </div>
        </div>
        <VoltaPill variant="accent">Live</VoltaPill>
      </div>
      <ul className="mt-4 space-y-2">
        {suggestions.length === 0 ? (
          <li className="rounded-xl border border-volta-green/20 bg-volta-green/[0.05] p-3 text-xs text-volta-white/75">
            Configurazione equilibrata. Continua a monitorare l'efficacia stagione per stagione.
          </li>
        ) : (
          suggestions.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-xl border border-volta-white/10 bg-volta-white/[0.03] p-3 hover:border-volta-yellow/30 transition-colors duration-200"
            >
              <ChevronRight className="h-4 w-4 mt-0.5 text-volta-yellow shrink-0" strokeWidth={2} />
              <div className="min-w-0">
                <p
                  style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
                  className="text-xs text-volta-white leading-relaxed"
                >
                  {s.text}
                </p>
                {s.impact && (
                  <p className="mt-1 text-[10px] text-volta-green">{s.impact}</p>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
      <p className="mt-4 text-[10px] text-volta-white/40 leading-snug">
        Le stime sono indicative. Non costituiscono garanzia di rendimento o consulenza fiscale.
      </p>
    </VoltaCard>
  );
}
