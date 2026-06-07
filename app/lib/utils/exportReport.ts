import type { SimulationResult, SimulationTotals } from '@/app/lib/energy/simulator';
import type { SeasonKey } from '@/app/lib/energy/constants';
import type { DashboardParams } from '@/app/components/dashboard/ControlsPanel';
import type { computeFinance } from '@/app/lib/energy/finance';

type Finance = ReturnType<typeof computeFinance>;

const REPORT_DATE = '2026-06-03';
const SEASON_LABELS: Record<SeasonKey, string> = {
  winter: 'Inverno',
  spring: 'Primavera',
  summer: 'Estate',
  autumn: 'Autunno',
};

function num(n: number, d = 0) {
  return Number.isFinite(n)
    ? n.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d })
    : '—';
}
function eur(n: number, d = 0) {
  return Number.isFinite(n)
    ? n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d })
    : '—';
}
function kwh(n: number) {
  return n >= 1000 ? `${num(n / 1000, 1)} MWh` : `${num(n, 0)} kWh`;
}
function pct(n: number) {
  return `${num(n * 100, 0)}%`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================== CSV ============================== */

function tariffSummary(p: DashboardParams): string {
  if (p.tariffType === 'fixed') return `Fissa ${num(p.fixedPrice, 3)} eur/kWh`;
  if (p.tariffType === 'indexed') return `Indicizzata PUN + ${num(p.indexedSpread, 3)} eur/kWh`;
  return `Bioraria F1 ${num(p.variableF1, 3)} / F2 ${num(p.variableF2, 3)} / F3 ${num(p.variableF3, 3)}`;
}

export function downloadReportCsv(
  result: SimulationResult,
  bySeason: Record<SeasonKey, SimulationTotals>,
  params: DashboardParams,
  finance: Finance,
) {
  const t = result.totals;
  const f = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : '');
  const lines: string[] = [];
  lines.push('Volta — Report energetico Monteporzio Living · Castelli Romani');
  lines.push(`Generato il;${REPORT_DATE}`);
  lines.push('');
  lines.push('CONFIGURAZIONE');
  lines.push(`PV picco kWp;${f(params.pvPeakKw, 2)}`);
  lines.push(`Batteria kWh;${f(params.batteryCapacityKwh, 1)}`);
  lines.push(`Potenza batteria kW;${f(params.batteryMaxKw, 1)}`);
  lines.push(`Pompe di calore;${params.hpUnitsCount}`);
  lines.push(`Occupazione settimane/anno;${params.occupancy.weeksPerYear}`);
  lines.push(`Tariffa;${tariffSummary(params)}`);
  lines.push('');
  lines.push('BILANCIO ANNUO');
  lines.push(`Produzione PV kWh;${f(t.pvKwh, 0)}`);
  lines.push(`Consumo kWh;${f(t.loadKwh, 0)}`);
  lines.push(`Autoconsumo kWh;${f(t.selfConsumedKwh, 0)}`);
  lines.push(`Autosufficienza %;${f(t.selfSufficiencyRate * 100, 1)}`);
  lines.push(`Import rete kWh;${f(t.gridImportKwh, 0)}`);
  lines.push(`Export rete kWh;${f(t.gridExportKwh, 0)}`);
  lines.push(`Condivisa CER kWh;${f(t.sharedWithCerKwh, 0)}`);
  lines.push('');
  lines.push('ECONOMIA (annua)');
  lines.push(`Bolletta SENZA impianto eur;${f(t.baselineBillEur, 0)}`);
  lines.push(`Risparmio autoconsumo eur;${f(t.avoidedCostEur, 0)}`);
  lines.push(`Ricavo Ritiro Dedicato eur;${f(t.revenueRdEur, 0)}`);
  lines.push(`Ricavo CER (RD+incentivo) eur;${f(t.revenueCerEur, 0)}`);
  lines.push(`Guadagno netto Ritiro Dedicato eur;${f(t.netCashFlowRdEur, 0)}`);
  lines.push(`Guadagno netto Comunita Energetica eur;${f(t.netCashFlowCerEur, 0)}`);
  lines.push('');
  lines.push('INVESTIMENTO E ROI');
  lines.push(`Investimento CAPEX eur;${f(finance.capexEur, 0)}`);
  lines.push(`Detrazione 50% totale eur;${f(finance.detrazioneTotaleEur, 0)}`);
  lines.push(`Investimento netto eur;${f(finance.capexNetto, 0)}`);
  lines.push(`Rientro con detrazione anni;${finance.paybackYearsDetrazione ? f(finance.paybackYearsDetrazione, 1) : 'n.d.'}`);
  lines.push(`Rientro senza detrazione anni;${finance.paybackYears ? f(finance.paybackYears, 1) : 'n.d.'}`);
  lines.push(`ROI ${finance.horizonYears} anni %;${f(finance.roiPct, 0)}`);
  lines.push(`CER maturita;${finance.cerMaturity}`);
  lines.push(`Guadagno anno 1 eur;${f(finance.benefitYear1Eur, 0)}`);
  lines.push(`Guadagno a regime eur;${f(finance.benefitMatureEur, 0)}`);
  lines.push('');
  lines.push('KPI STAGIONALI');
  lines.push('Stagione;PV kWh;Consumo kWh;Autosuff %;Import kWh;Export kWh;Cash flow RD eur;Cash flow CER eur');
  (Object.keys(SEASON_LABELS) as SeasonKey[]).forEach((s) => {
    const x = bySeason[s];
    lines.push([SEASON_LABELS[s], f(x.pvKwh, 0), f(x.loadKwh, 0), f(x.selfSufficiencyRate * 100, 1), f(x.gridImportKwh, 0), f(x.gridExportKwh, 0), f(x.netCashFlowRdEur, 0), f(x.netCashFlowCerEur, 0)].join(';'));
  });
  lines.push('');
  lines.push('SERIE ORARIA (8760 h)');
  lines.push('giorno;ora;mese;occupata;tEst_C;pv_kWh;carico_kWh;hp_kWh;cop;soc;import_kWh;export_kWh;condCER_kWh;costo_eur;ricavoRD_eur;ricavoCER_eur');
  result.hours.forEach((h) => {
    lines.push([h.dayOfYear, h.hour, h.month, h.occupied ? 1 : 0, f(h.tOut, 1), f(h.pvKwh, 3), f(h.totalLoadKwh, 3), f(h.hpKwh, 3), f(h.hpCop, 2), f(h.socEnd, 3), f(h.gridImportKwh, 3), f(h.gridExportKwh, 3), f(h.sharedWithCerKwh, 3), f(h.costEur, 4), f(h.revenueRdEur, 4), f(h.revenueCerEur, 4)].join(';'));
  });
  triggerDownload(new Blob(['﻿', lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `volta-monteporzio-report-${REPORT_DATE}.csv`);
}

/* ============================== JSON ============================== */

export function downloadReportJson(
  result: SimulationResult,
  bySeason: Record<SeasonKey, SimulationTotals>,
  params: DashboardParams,
  finance: Finance,
) {
  const payload = {
    meta: { site: 'Monteporzio Living · Monteporzio Catone (RM)', generated: REPORT_DATE, tool: 'Volta Energy' },
    configuration: params,
    annual: result.totals,
    finance,
    bySeason,
    hourly: result.hours,
  };
  triggerDownload(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `volta-monteporzio-report-${REPORT_DATE}.json`);
}

/* ============================== PDF (HTML print) ============================== */

function bar(value: number, max: number, color: string): string {
  const w = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  return `<div class="bar-track"><div class="bar-fill" style="width:${w}%;background:${color}"></div></div>`;
}

export function openReportPdf(
  result: SimulationResult,
  bySeason: Record<SeasonKey, SimulationTotals>,
  params: DashboardParams,
  finance: Finance,
  render?: { renderImage?: string; renderCaption?: string },
) {
  const t = result.totals;
  const renderImage = render?.renderImage;
  const renderCaption = render?.renderCaption ?? '';
  const seasons = Object.keys(SEASON_LABELS) as SeasonKey[];
  const maxPv = Math.max(...seasons.map((s) => bySeason[s].pvKwh), 1);
  const maxLoad = Math.max(...seasons.map((s) => bySeason[s].loadKwh), 1);
  const cerBest = t.netCashFlowCerEur >= t.netCashFlowRdEur;
  const cerDelta = Math.abs(t.netCashFlowCerEur - t.netCashFlowRdEur);

  const seasonRows = seasons
    .map((s) => {
      const x = bySeason[s];
      return `<tr>
        <td class="s-name">${SEASON_LABELS[s]}</td>
        <td>${kwh(x.pvKwh)}${bar(x.pvKwh, maxPv, '#FFE42B')}</td>
        <td>${kwh(x.loadKwh)}${bar(x.loadKwh, maxLoad, '#359EFE')}</td>
        <td class="center">${pct(x.selfSufficiencyRate)}</td>
        <td class="right ${x.netCashFlowCerEur >= 0 ? 'pos' : 'neg'}">${eur(x.netCashFlowCerEur)}</td>
      </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"/>
<title>Volta — Report Monteporzio Living</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
  /* Forza la stampa dei colori di sfondo (barre, hero, badge) su tutti i browser */
  *, *::before, *::after {
    margin:0; padding:0; box-sizing:border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family:'Instrument Sans',Arial,sans-serif; font-weight:500; color:#16181D; background:#F4F5F7; padding:0; }
  .page { width:100%; max-width:880px; margin:0 auto; background:#fff; }
  .hero { background:#000; color:#fff; padding:40px 48px 36px; }
  .brand { display:flex; align-items:center; gap:12px; margin-bottom:28px; }
  .brand svg { height:22px; width:auto; }
  .pill { display:inline-block; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; padding:4px 10px; border-radius:99px; background:rgba(255,228,43,.15); color:#FFE42B; border:1px solid rgba(255,228,43,.3); }
  h1 { font-size:30px; font-weight:600; letter-spacing:-.01em; margin:10px 0 6px; }
  .sub { color:rgba(255,255,255,.6); font-size:14px; }
  .section { padding:32px 48px; }
  .section h2 { font-size:13px; text-transform:uppercase; letter-spacing:.08em; color:#8A8F98; font-weight:600; margin-bottom:16px; }
  .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:-26px; padding:0 48px 8px; position:relative; }
  .kpi { background:#fff; border:1px solid #E7E9ED; border-radius:14px; padding:16px; box-shadow:0 4px 16px rgba(0,0,0,.05); min-width:0; }
  .kpi .label { font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:#8A8F98; font-weight:600; }
  .kpi .value { font-size:22px; font-weight:600; margin-top:6px; }
  .kpi .hint { font-size:11px; color:#9AA0A8; margin-top:3px; }
  .yellow { color:#B8A200; } .green { color:#009336; } .blue { color:#2178D4; } .red { color:#D62D10; }
  .cards2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .card { border:1px solid #E7E9ED; border-radius:14px; padding:20px; min-width:0; }
  .card.best { border-color:#009336; background:#F1FBF4; }
  .card h3 { font-size:16px; font-weight:600; margin-bottom:4px; }
  .card .meta { font-size:11px; color:#8A8F98; margin-bottom:14px; }
  .row { display:flex; justify-content:space-between; align-items:baseline; padding:7px 0; border-bottom:1px solid #EEF0F3; font-size:13px; gap:8px; }
  .row:last-child { border-bottom:none; }
  .row .k { color:#5A5F68; } .row .v { font-weight:600; white-space:nowrap; }
  .row.total { border-top:2px solid #16181D; border-bottom:none; margin-top:8px; padding-top:12px; }
  .row.total .v { font-size:20px; }
  .badge-best { display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#fff; background:#009336; padding:3px 9px; border-radius:99px; }
  /* Tabella stagionale: layout fisso così le colonne (e le barre) non collassano in stampa */
  table { width:100%; border-collapse:collapse; font-size:13px; table-layout:fixed; }
  col.c-season { width:18%; } col.c-bar { width:26%; } col.c-mid { width:12%; } col.c-right { width:18%; }
  th { text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:#8A8F98; font-weight:600; padding:0 10px 10px; }
  th.center,td.center{text-align:center;} th.right,td.right{text-align:right;}
  td { padding:10px; border-top:1px solid #EEF0F3; vertical-align:middle; }
  td.s-name { font-weight:600; }
  td.pos { color:#009336; font-weight:600; } td.neg { color:#D62D10; font-weight:600; }
  /* Barra: rettangolo sottile a larghezza piena, mantiene proporzioni e colore in stampa */
  .bar-track { display:block; width:100%; height:6px; background:#EEF0F3; border-radius:99px; margin-top:5px; overflow:hidden; }
  .bar-fill { display:block; height:6px; border-radius:99px; }
  .cfg { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .cfg .item { background:#F7F8FA; border:1px solid #EEF0F3; border-radius:10px; padding:11px 13px; min-width:0; }
  .cfg .item .l { font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:#8A8F98; font-weight:600; }
  .cfg .item .v { font-size:15px; font-weight:600; margin-top:3px; }
  .foot { padding:24px 48px 40px; color:#9AA0A8; font-size:11px; line-height:1.6; border-top:1px solid #EEF0F3; }
  .actions { position:fixed; top:16px; right:16px; display:flex; gap:8px; z-index:10; }
  .btn { font-family:inherit; font-weight:600; font-size:13px; border:none; border-radius:10px; padding:10px 16px; cursor:pointer; }
  .btn-print { background:#FFE42B; color:#000; }
  .btn-close { background:#16181D; color:#fff; }
  /* KPI nella sezione ROI: niente overlap, dentro al flusso */
  .roi-kpis { position:static; margin:0; padding:0; }
  /* Immagine del render 3D */
  .render-wrap { position:relative; border-radius:16px; overflow:hidden; border:1px solid #E7E9ED; background:#0B0F18; }
  .render-img { width:100%; height:auto; display:block; }
  .render-cap { margin-top:8px; font-size:11px; color:#8A8F98; }

  /* ===== Responsive a schermo (finestra stretta) ===== */
  @media (max-width: 760px) {
    .hero { padding:28px 22px 26px; }
    .section { padding:24px 22px; }
    .kpis { grid-template-columns:repeat(2,1fr); padding:0 22px 8px; }
    .cards2 { grid-template-columns:1fr; }
    .cfg { grid-template-columns:repeat(2,1fr); }
    h1 { font-size:24px; }
    .foot { padding:20px 22px 32px; }
  }
  @media (max-width: 420px) {
    .kpis { grid-template-columns:1fr 1fr; gap:8px; }
    .cfg { grid-template-columns:1fr 1fr; }
  }

  /* ===== Stampa / Salva PDF ===== */
  @page { size:A4; margin:12mm; }
  @media print {
    .actions { display:none !important; }
    body { background:#fff; }
    .page { max-width:none; width:100%; }
    /* Mantiene SEMPRE le griglie in stampa (no collasso → niente quadrati) */
    .kpis { grid-template-columns:repeat(4,1fr) !important; margin-top:12px !important; padding:0 0 8px !important; }
    .cards2 { grid-template-columns:1fr 1fr !important; }
    .cfg { grid-template-columns:repeat(3,1fr) !important; }
    .section, .hero, .foot { padding-left:0; padding-right:0; }
    .hero { border-radius:0; }
    table { table-layout:fixed !important; }
    .bar-track, .bar-fill { height:6px !important; }
    .render-wrap, .render-img { break-inside:avoid; }
    .section, .kpis, .cards2, .card, .foot, table, tr { break-inside:avoid; }
  }
</style></head>
<body>
  <div class="actions">
    <button class="btn btn-print" onclick="window.print()">Stampa / Salva PDF</button>
    <button class="btn btn-close" onclick="window.close()">Chiudi</button>
  </div>
  <div class="page">
    <div class="hero">
      <div class="brand">
        <svg viewBox="0 0 922.2 256.5" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M554.1,246.7h-89V9.8h89V246.7z M680.7,58.7h-23.1V9.8h-85.1v200.9c0,19.9,16.1,36,36,36h49.1V121.4h23.1V58.7z M446.8,94.7v116c0,19.9-16.1,36-36,36h-141c-19.9,0-36-16.1-36-36v-116c0-19.9,16.1-36,36-36h141C430.7,58.7,446.8,74.8,446.8,94.7z M348,113.7h-15.4v77.9H348V113.7z M876.1,58.7h-177v62.8h114.2v70.1h-15.4v-54.7h-98.8v73.8c0,19.9,16.1,36,36,36h177v-152C912.1,74.8,896,58.7,876.1,58.7z M134.1,58.7l-17.5,128l-17.5-128h-89l25.7,188h72.6h16.4H166c18,0,33.2-13.3,35.7-31.1l21.5-156.9H134.1z"/></svg>
        <span class="pill">Report energetico</span>
      </div>
      <h1>${renderCaption || 'Monteporzio Living'}</h1>
      <p class="sub">Monteporzio Living · Castelli Romani · simulazione oraria annuale · ${REPORT_DATE}</p>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="label">Produzione PV</div><div class="value yellow">${kwh(t.pvKwh)}</div><div class="hint">${num(t.pvKwh / params.pvPeakKw, 0)} kWh/kWp</div></div>
      <div class="kpi"><div class="label">Autosufficienza</div><div class="value green">${pct(t.selfSufficiencyRate)}</div><div class="hint">Autoconsumo PV ${pct(t.selfConsumptionRate)}</div></div>
      <div class="kpi"><div class="label">Energia dalla rete</div><div class="value blue">${kwh(t.gridImportKwh)}</div><div class="hint">Picco ${num(t.peakImportKw, 1)} kW</div></div>
      <div class="kpi"><div class="label">Cash flow / anno</div><div class="value ${(cerBest ? t.netCashFlowCerEur : t.netCashFlowRdEur) >= 0 ? 'green' : 'red'}">${eur(cerBest ? t.netCashFlowCerEur : t.netCashFlowRdEur)}</div><div class="hint">${cerBest ? 'con Comunità Energetica' : 'con Ritiro Dedicato'}</div></div>
    </div>

    ${
      renderImage
        ? `<div class="section">
      <h2>Vista del modello</h2>
      <div class="render-wrap"><img class="render-img" src="${renderImage}" alt="Render 3D del modello energetico"/></div>
      <p class="render-cap">${renderCaption}</p>
    </div>`
        : ''
    }

    <div class="section">
      <h2>Valorizzazione energia immessa</h2>
      <div class="cards2">
        <div class="card">
          <h3>Ritiro Dedicato</h3>
          <div class="meta">GSE · prezzo zonale PUN</div>
          <div class="row"><span class="k">Energia immessa</span><span class="v">${kwh(t.gridExportKwh)}</span></div>
          <div class="row"><span class="k">Ricavo vendita</span><span class="v green">${eur(t.revenueRdEur)}</span></div>
          <div class="row"><span class="k">Risparmio autoconsumo</span><span class="v green">${eur(t.avoidedCostEur)}</span></div>
          <div class="row total"><span class="k">Guadagno netto annuo</span><span class="v ${t.netCashFlowRdEur >= 0 ? 'green' : 'red'}">${eur(t.netCashFlowRdEur)}</span></div>
        </div>
        <div class="card ${cerBest ? 'best' : ''}">
          <h3>Comunità Energetica ${cerBest ? '<span class="badge-best">Migliore</span>' : ''}</h3>
          <div class="meta">CER · DM MASE + ARERA</div>
          <div class="row"><span class="k">Energia condivisa</span><span class="v">${kwh(t.sharedWithCerKwh)}</span></div>
          <div class="row"><span class="k">Ricavo vendita + incentivo</span><span class="v green">${eur(t.revenueCerEur)}</span></div>
          <div class="row"><span class="k">Risparmio autoconsumo</span><span class="v green">${eur(t.avoidedCostEur)}</span></div>
          <div class="row total"><span class="k">Guadagno netto annuo</span><span class="v ${t.netCashFlowCerEur >= 0 ? 'green' : 'red'}">${eur(t.netCashFlowCerEur)}</span></div>
        </div>
      </div>
      <p style="margin-top:14px;font-size:12px;color:#5A5F68;">Guadagno netto = risparmio in bolletta (autoconsumo) + ricavi da vendita/CER, rispetto allo scenario senza impianto. Bolletta senza impianto: <strong>${eur(t.baselineBillEur)}/anno</strong>. ${cerBest ? `La CER rende <strong>${eur(cerDelta)}/anno in più</strong> del Ritiro Dedicato.` : `Il Ritiro Dedicato rende <strong>${eur(cerDelta)}/anno in più</strong>.`}</p>
    </div>

    <div class="section" style="padding-top:0;">
      <h2>Investimento e ritorno</h2>
      <div class="kpis roi-kpis">
        <div class="kpi"><div class="label">Investimento</div><div class="value">${eur(finance.capexEur)}</div><div class="hint">${params.detrazione50 ? `netto ${eur(finance.capexNetto)} con detrazione` : 'senza detrazione'}</div></div>
        <div class="kpi"><div class="label">Rientro con detrazione 50%</div><div class="value green">${finance.paybackYearsDetrazione ? finance.paybackYearsDetrazione.toFixed(1) + ' anni' : 'n.d.'}</div><div class="hint">${eur(finance.detrazioneAnnuaEur)}/anno × 10</div></div>
        <div class="kpi"><div class="label">Rientro senza detrazione</div><div class="value yellow">${finance.paybackYears ? finance.paybackYears.toFixed(1) + ' anni' : 'n.d.'}</div><div class="hint">solo risparmi + ricavi</div></div>
        <div class="kpi"><div class="label">ROI ${finance.horizonYears} anni</div><div class="value green">${Math.round(finance.roiPct)}%</div><div class="hint">su investimento netto</div></div>
      </div>
    </div>

    <div class="section" style="padding-top:0;">
      <h2>Andamento stagionale</h2>
      <table>
        <colgroup><col class="c-season"/><col class="c-bar"/><col class="c-bar"/><col class="c-mid"/><col class="c-right"/></colgroup>
        <thead><tr><th>Stagione</th><th>Produzione</th><th>Consumo</th><th class="center">Autosuff.</th><th class="right">Guadagno</th></tr></thead>
        <tbody>${seasonRows}</tbody>
      </table>
    </div>

    <div class="section" style="padding-top:0;">
      <h2>Configurazione impianto</h2>
      <div class="cfg">
        <div class="item"><div class="l">Fotovoltaico</div><div class="v">${num(params.pvPeakKw, 1)} kWp</div></div>
        <div class="item"><div class="l">Accumulo</div><div class="v">${num(params.batteryCapacityKwh, 0)} kWh · ${num(params.batteryMaxKw, 1)} kW</div></div>
        <div class="item"><div class="l">Pompe di calore</div><div class="v">${params.hpUnitsCount} × 4,6 kWe</div></div>
        <div class="item"><div class="l">Tariffa</div><div class="v" style="font-size:13px;">${tariffSummary(params)}</div></div>
        <div class="item"><div class="l">Occupazione</div><div class="v">${params.occupancy.weeksPerYear} sett./anno</div></div>
        <div class="item"><div class="l">Setpoint inverno</div><div class="v">${params.setpointHeating}°C</div></div>
      </div>
    </div>

    <div class="foot">
      Stime indicative basate su simulazione oraria (8.760 h) con dati climatici Castelli Romani (Monteporzio Catone, ~450 m s.l.m., zona D).
      Non costituiscono garanzia di rendimento né consulenza fiscale. Gli eventuali incentivi per l'autoconsumo collettivo sono soggetti a registrazione GSE.
      <br/>Generato da Volta Energy · ${REPORT_DATE}.
    </div>
  </div>
  <script>window.addEventListener('load',function(){setTimeout(function(){try{window.focus();}catch(e){}},200);});</script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    // Fallback: scarica l'HTML se i popup sono bloccati
    triggerDownload(new Blob([html], { type: 'text/html' }), `volta-monteporzio-report-${REPORT_DATE}.html`);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
