'use client';

import { Banknote, Coins, ShieldCheck, TrendingUp, Users, Zap } from 'lucide-react';
import { VoltaCard, VoltaPill } from '@/app/components/ui';
import type { SimulationTotals } from '@/app/lib/energy/simulator';
import type { computeFinance } from '@/app/lib/energy/finance';
import { formatEur, formatKwh } from '@/app/lib/energy/format';

interface EconomicsTableProps {
  totals: SimulationTotals;
  cerEnabled: boolean;
  ritiroDedicatoPrice: number;
  cerIncentivePrice: number;
  prosumerShare: number;
  finance: ReturnType<typeof computeFinance>;
  detrazione50: boolean;
}

export function EconomicsTable({
  totals,
  cerEnabled,
  ritiroDedicatoPrice,
  cerIncentivePrice,
  prosumerShare,
  finance,
  detrazione50,
}: EconomicsTableProps) {
  const rdRevenue = totals.revenueRdEur;
  const cerEnergyShared = totals.sharedWithCerKwh;
  const cerIncentiveTotal = (cerEnergyShared * (cerIncentivePrice + 9.7)) / 1000;
  const cerProsumerBonus = cerIncentiveTotal * prosumerShare;
  const bestResidual = cerEnabled ? totals.residualBillCerEur : totals.residualBillRdEur;

  return (
    <div className="space-y-3">
      {/* Banda confronto bolletta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Summary
          label="Bolletta senza impianto"
          value={formatEur(totals.baselineBillEur, 0)}
          hint="Tutta l'energia comprata dalla rete"
          icon={<Zap className="h-4 w-4" strokeWidth={1.75} />}
          accent="red"
        />
        <Summary
          label="Bolletta con impianto"
          value={formatEur(Math.max(0, bestResidual), 0)}
          hint={bestResidual < 0 ? 'Saldo a credito grazie ai ricavi' : 'Solo prelievi residui, al netto ricavi'}
          icon={<Banknote className="h-4 w-4" strokeWidth={1.75} />}
          accent="blue"
        />
        <Summary
          label="Guadagno netto annuo"
          value={formatEur(cerEnabled ? totals.netCashFlowCerEur : totals.netCashFlowRdEur, 0)}
          hint="Risparmio autoconsumo + ricavi"
          icon={<TrendingUp className="h-4 w-4" strokeWidth={1.75} />}
          accent="green"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Colonna Ritiro Dedicato */}
        <VoltaCard variant="elevated" glowColor="blue" padding="lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-volta-blue/20 text-volta-blue">
                <Banknote className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-base text-volta-white">
                  Ritiro Dedicato
                </p>
                <p className="text-[11px] text-volta-white/55">GSE · prezzo zonale PUN</p>
              </div>
            </div>
            <VoltaPill variant="info">Semplice</VoltaPill>
          </div>
          <div className="mt-4 space-y-3">
            <Row label="Energia immessa in rete" value={formatKwh(totals.gridExportKwh, 0)} />
            <Row label={`Prezzo medio (${ritiroDedicatoPrice} €/MWh)`} value={formatEur(rdRevenue, 0)} accent="green" />
            <Row label="Risparmio da autoconsumo" value={formatEur(totals.avoidedCostEur, 0)} accent="green" helper="Valorizzato al prezzo orario" />
            <Row label="Bolletta residua (import + fissa)" value={formatEur(totals.costEur + 216, 0)} accent="red" />
            <div className="border-t border-volta-white/10 pt-3">
              <Row
                label="Guadagno netto annuo"
                value={formatEur(totals.netCashFlowRdEur, 0)}
                accent={totals.netCashFlowRdEur >= 0 ? 'green' : 'red'}
                bold
              />
            </div>
          </div>
        </VoltaCard>

        {/* Colonna CER */}
        <VoltaCard variant="elevated" glowColor={cerEnabled ? 'green' : 'none'} padding="lg" className={!cerEnabled ? 'opacity-50' : ''}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-volta-green/20 text-volta-green">
                <Users className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-base text-volta-white">
                  Comunità Energetica
                </p>
                <p className="text-[11px] text-volta-white/55">CER · DM MASE 2024 + ARERA</p>
              </div>
            </div>
            <VoltaPill variant={cerEnabled ? 'success' : 'subtle'}>{cerEnabled ? 'Attiva' : 'Off'}</VoltaPill>
          </div>
          <div className="mt-4 space-y-3">
            <Row label="Energia condivisa con membri" value={formatKwh(cerEnergyShared, 0)} accent="green" />
            <Row label="Ricavo vendita (PUN)" value={formatEur(rdRevenue, 0)} accent="green" helper="Su tutto l'export" />
            <Row label={`Quota incentivo CER (${Math.round(prosumerShare * 100)}%)`} value={formatEur(cerProsumerBonus, 0)} accent="green" helper={`${cerIncentivePrice + 9.7} €/MWh condivisi`} />
            <Row label="Risparmio da autoconsumo" value={formatEur(totals.avoidedCostEur, 0)} accent="green" />
            <Row label="Bolletta residua (import + fissa)" value={formatEur(totals.costEur + 216, 0)} accent="red" />
            <div className="border-t border-volta-white/10 pt-3">
              <Row
                label="Guadagno netto annuo"
                value={formatEur(totals.netCashFlowCerEur, 0)}
                accent={totals.netCashFlowCerEur >= 0 ? 'green' : 'red'}
                bold
              />
              <p className="mt-1 text-[10px] text-volta-green">
                {totals.netCashFlowCerEur >= totals.netCashFlowRdEur
                  ? `+${formatEur(totals.netCashFlowCerEur - totals.netCashFlowRdEur, 0)} rispetto al Ritiro Dedicato`
                  : `${formatEur(totals.netCashFlowCerEur - totals.netCashFlowRdEur, 0)} vs Ritiro Dedicato`}
              </p>
            </div>
          </div>
        </VoltaCard>
      </div>

      {/* Sezione investimento / ROI */}
      <VoltaCard variant="elevated" glowColor="yellow" padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-volta-yellow/20 text-volta-yellow">
              <Coins className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className="text-base text-volta-white">
                Investimento e ritorno
              </p>
              <p className="text-[11px] text-volta-white/55">FV + accumulo · orizzonte {finance.horizonYears} anni</p>
            </div>
          </div>
          <VoltaPill variant={detrazione50 ? 'success' : 'subtle'}>
            {detrazione50 ? 'Detrazione 50%' : 'No detrazione'}
          </VoltaPill>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RoiTile label="Investimento" value={formatEur(finance.capexEur, 0)} />
          <RoiTile
            label="Rientro con detrazione"
            value={finance.paybackYearsDetrazione ? `${finance.paybackYearsDetrazione.toFixed(1)} anni` : '—'}
            accent="green"
          />
          <RoiTile
            label="Rientro senza detrazione"
            value={finance.paybackYears ? `${finance.paybackYears.toFixed(1)} anni` : '—'}
            accent="yellow"
          />
          <RoiTile label="ROI 25 anni" value={`${Math.round(finance.roiPct)}%`} accent="green" />
        </div>
        {finance.cerMaturity !== 'mature' && finance.benefitMatureEur > finance.benefitYear1Eur && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-volta-green/20 bg-volta-green/[0.05] p-2.5">
            <TrendingUp className="h-4 w-4 text-volta-green mt-0.5 shrink-0" strokeWidth={1.75} />
            <p className="text-[11px] text-volta-white/70 leading-relaxed">
              Comunità in crescita: il guadagno annuo sale da {formatEur(finance.benefitYear1Eur, 0)} (anno 1) a{' '}
              {formatEur(finance.benefitMatureEur, 0)} a regime, man mano che entrano nuovi membri. Il ROI tiene già conto
              di questa crescita.
            </p>
          </div>
        )}
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-volta-white/10 bg-volta-white/[0.03] p-2.5">
          <ShieldCheck className="h-4 w-4 text-volta-green mt-0.5 shrink-0" strokeWidth={1.75} />
          <p className="text-[11px] text-volta-white/70 leading-relaxed">
            {detrazione50 ? (
              <>
                Detrazione 50% (Bonus Ristrutturazione): {formatEur(finance.detrazioneTotaleEur, 0)} recuperati in 10 quote
                annuali da {formatEur(finance.detrazioneAnnuaEur, 0)}. Investimento netto {formatEur(finance.capexNetto, 0)}.
              </>
            ) : (
              <>Senza detrazione il rientro è più lungo. Attivando il Bonus 50% scende a {finance.paybackYearsDetrazione ? finance.paybackYearsDetrazione.toFixed(1) : '—'} anni.</>
            )}{' '}
            Stime indicative (DM MASE 414/2023, Regola Tecnica GSE): non sono garanzia di rendimento né consulenza fiscale.
          </p>
        </div>
      </VoltaCard>
    </div>
  );
}

function Summary({ label, value, hint, icon, accent }: { label: string; value: string; hint: string; icon: React.ReactNode; accent: 'red' | 'blue' | 'green' }) {
  const color = accent === 'red' ? 'text-volta-red' : accent === 'blue' ? 'text-volta-blue' : 'text-volta-green';
  const border = accent === 'red' ? 'border-volta-red/25' : accent === 'blue' ? 'border-volta-blue/25' : 'border-volta-green/30';
  return (
    <div className={`rounded-xl border ${border} bg-volta-white/[0.03] p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wide text-volta-white/45">{label}</p>
        <span className={color}>{icon}</span>
      </div>
      <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className={`mt-1.5 text-2xl tabular-nums ${color}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-volta-white/50">{hint}</p>
    </div>
  );
}

function RoiTile({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'yellow' }) {
  const color = accent === 'green' ? 'text-volta-green' : accent === 'yellow' ? 'text-volta-yellow' : 'text-volta-white';
  return (
    <div className="rounded-lg border border-volta-white/10 bg-volta-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-volta-white/45">{label}</p>
      <p style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }} className={`mt-0.5 text-base tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, value, accent, helper, bold }: { label: string; value: string; accent?: 'green' | 'red'; helper?: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className={`${bold ? 'text-sm' : 'text-xs'} text-volta-white/70`}>{label}</p>
        {helper && <p className="text-[10px] text-volta-white/40">{helper}</p>}
      </div>
      <p
        style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: bold ? 700 : 600 }}
        className={`tabular-nums whitespace-nowrap ${bold ? 'text-lg' : 'text-sm'} ${
          accent === 'green' ? 'text-volta-green' : accent === 'red' ? 'text-volta-red' : 'text-volta-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
