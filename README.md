# Volta · Campotosto Energy OS

Modello digitale e simulazione energetica oraria della casa **Mascioni — Campotosto (AQ)** in pieno Volta Design System.

## Stack

- **Next.js 14** App Router + TypeScript + Tailwind CSS
- **Three.js + React Three Fiber + drei** per il modello 3D dell'edificio
- **Recharts** per i grafici energia, SoC, scambio rete, confronto stagionale
- **Volta Design System** — token brand, Instrument Sans 500/600, palette `volta-*`

## Caratteristiche

- Modello 3D interattivo dell'edificio ricostruito dai render esecutivi DTS
- Simulatore orario annuo (8.760 h) con motori:
  - Produzione PV (Atlante ENEA Campotosto, tilt/azimuth, derate neve/temperatura)
  - Pompa di calore con curva COP/EER e backup resistivo
  - Involucro: dispersioni `U·A·ΔT` + ventilazione VMC + apporti gratuiti
  - Batteria con 4 strategie di dispatch (autoconsumo / arbitraggio F1-F3 / CER / backup)
  - Anti-gelo rampa/pedonale/cavo scaldante
- 4 scenari stagionali (Inverno / Primavera / Estate / Autunno)
- Tabella economica **Ritiro Dedicato vs Comunità Energetica** (DM MASE 414/2023)
- Tutti i parametri controllabili: PV, batteria, backup, occupazione, tariffe, setpoint

## Sviluppo

```bash
npm install
npm run dev
# http://localhost:3000
```

## Build production

```bash
npm run build
npm start
```

## Sito

Coordinate Mascioni (Campotosto, AQ): **42.553°N · 13.391°E · 1.400 m s.l.m.** — Zona climatica F, 3.500 GG.
