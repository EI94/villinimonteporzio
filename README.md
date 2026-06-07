# Volta · Monteporzio Living — Energy OS

Modello digitale e simulazione energetica oraria di **Monteporzio Living** — tre villini a schiera ai Castelli Romani (Monteporzio Catone, RM), in pieno Volta Design System.

## Esperienza

- **Vista aerea** del complesso → **tocca un villino** → compare il nome e la **camera zooma** sull'unità → **dashboard energetica** dedicata.
- Tre unità con prestazioni distinte: una **interna** (meno disperdente) e due **angolari**.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS · Volta Design System
- **Three.js + React Three Fiber** per il complesso 3D (aerial → zoom)
- **Recharts** per i grafici energia / SoC / scambio rete / stagioni

## Modello energetico (clima Castelli Romani, zona D)

- Pompa di calore aria-acqua + **pavimento radiante** (COP elevato), **split** di raffrescamento
- Infissi **PVC o legno**, **tapparelle motorizzate**, copertura in c.a. (travi rovesce) + vespaio **igloo**
- Fotovoltaico in copertura, accumulo, **sole geolocalizzato** (lat 41,81°N) per ombre realistiche
- 4 scenari stagionali, economia (vendita in rete vs autoconsumo collettivo), **CAPEX + detrazione 50% + ROI/payback**
- Report **PDF / CSV / JSON** con immagine del render

## Sviluppo

```bash
npm install
npm run dev
# http://localhost:3000
```

## Deploy (Vercel)

Progetto Next.js standard: Vercel lo rileva e builda con `next build`. Nessuna configurazione aggiuntiva richiesta.

## Sito

Monteporzio Catone (RM) — **41,813°N · 12,722°E · ~450 m s.l.m.** — zona climatica D.
