'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html, Preload, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { SITE, UNITS, type SeasonKey } from '@/app/lib/energy/constants';
import { sunState, cardinalFromAzimuth, SEASON_DAY } from '@/app/lib/energy/solar';
import { Sun, Maximize2 } from 'lucide-react';

interface Complex3DProps {
  season: SeasonKey;
  hour?: number;
  selectedUnit: string | null;
  onSelectUnit: (id: string | null) => void;
  /** dati live del villino selezionato per i flussi */
  pvKw?: number;
  pvPeakKw?: number;
  loadKw?: number;
  batterySoc?: number;
  gridKw?: number;
}

/* ---------- palette (render Monteporzio: grigio antracite, pietra, legno) ---------- */
const M = {
  facadeGrey: '#3C3F45',
  facadeGreyLight: '#4A4E55',
  stone: '#D9D2C6',
  stoneDark: '#BBB2A2',
  white: '#ECE9E3',
  woodSlat: '#B07D49',
  woodDeck: '#9A6B3F',
  glass: '#1C2A36',
  frame: '#15171A',
  railing: '#2A2D31',
  pvDark: '#0C1726',
  pvLine: '#1B2D4E',
  hotTub: '#2C5A7A',
  grass: '#5E8C43',
  hedge: '#3E6B34',
} as const;

/* spaziatura unità lungo X */
const UNIT_W = 7;
const UNIT_GAP = 1.6;
const SPAN = UNIT_W + UNIT_GAP;
const UNIT_X = [-SPAN, 0, SPAN]; // ponente, centrale, levante
const GROUND_Y = 0;

/* ====================== UN VILLINO ====================== */
function Villa({
  index,
  unitId,
  selected,
  dimmed,
  onSelect,
  pvActive,
  pvRatio,
}: {
  index: number;
  unitId: string;
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
  pvActive: boolean;
  pvRatio: number;
}) {
  const x = UNIT_X[index];
  const W = UNIT_W;
  const D = 9;
  const floorH = 3.1;
  const H = floorH * 2; // 6.2
  const base = 1.0;
  const south = D / 2; // facciata fronte
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  const op = dimmed ? 0.5 : 1;
  const isCorner = UNITS[index].type === 'corner';

  return (
    <group
      position={[x, 0, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(unitId);
      }}
    >
      {/* Zoccolo in pietra */}
      <mesh position={[0, base / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.04, base, D + 0.04]} />
        <meshStandardMaterial color={M.stone} roughness={0.92} transparent opacity={op} />
      </mesh>

      {/* Corpo: piano terra antracite */}
      <mesh position={[0, base + floorH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, floorH, D]} />
        <meshStandardMaterial color={M.facadeGrey} roughness={0.82} transparent opacity={op} />
      </mesh>
      {/* Corpo: piano primo intonaco chiaro (volume più chiaro come nei render) */}
      <mesh position={[0, base + floorH + floorH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, floorH, D]} />
        <meshStandardMaterial color={M.white} roughness={0.9} transparent opacity={op} />
      </mesh>
      {/* Rivestimento in pietra travertino sul volume superiore (sud + fianco est) */}
      <StoneClad position={[1.2, base + floorH + floorH / 2, south + 0.03]} w={W - 2.6} h={floorH - 0.1} op={op} />
      {isCorner && (
        <StoneClad position={[W / 2 + 0.03, base + floorH + floorH / 2, -1.5]} w={D - 3} h={floorH - 0.1} op={op} rotY={Math.PI / 2} />
      )}

      {/* Pilastro d'angolo in pietra chiara, tutta altezza (fronte-est) */}
      <mesh position={[W / 2 - 0.06, base + H / 2, south - 1.4]} castShadow>
        <boxGeometry args={[0.16, H, 2.8]} />
        <meshStandardMaterial color={M.stone} roughness={0.9} transparent opacity={op} />
      </mesh>
      <mesh position={[W / 2 + 0.02, base + H / 2, south - 1.4]}>
        <boxGeometry args={[0.06, H, 2.8]} />
        <meshStandardMaterial color={M.stoneDark} roughness={0.95} transparent opacity={op} />
      </mesh>

      {/* === FACCIATA SUD === */}
      {/* Portale in pietra attorno alla grande vetrata scorrevole (PT) */}
      <StonePortal x={-0.6} y={base + 1.45} w={3.9} h={2.7} z={south} op={op} />
      <BigSlider position={[-0.6, base + 1.45, south + 0.07]} w={3.5} h={2.5} op={op} />
      {/* Ingresso (porta scura) a destra */}
      <mesh position={[W / 2 - 1.4, base + 1.1, south + 0.04]}>
        <planeGeometry args={[1.0, 2.2]} />
        <meshStandardMaterial color={M.frame} roughness={0.5} metalness={0.3} transparent opacity={op} />
      </mesh>
      {/* Fioriera in pietra al piede della vetrata (verde cascante) */}
      <Planter position={[-2.0, base + 0.15, south + 0.55]} w={1.6} op={op} />
      {/* Finestra a nastro al primo piano */}
      <BigSlider position={[-1.4, base + floorH + 1.35, south + 0.05]} w={2.6} h={1.5} op={op} />
      {/* Plafoniere ovali */}
      <OvalSconce position={[W / 2 - 0.5, base + floorH + 0.5, south + 0.06]} op={op} />
      <OvalSconce position={[-W / 2 + 0.7, base + floorH + 0.5, south + 0.06]} op={op} />
      <OvalSconce position={[W / 2 - 0.5, base + 1.8, south + 0.06]} op={op} />

      {/* === FIANCO EST (per gli angolari, visibile) === */}
      {isCorner && (
        <>
          <BigSlider position={[W / 2 + 0.05, base + 1.5, -1.0]} w={2.2} h={2.4} op={op} rotY={Math.PI / 2} />
          <OvalSconce position={[W / 2 + 0.06, base + floorH + 0.6, 1.6]} op={op} rotY={Math.PI / 2} />
          <OvalSconce position={[W / 2 + 0.06, base + floorH + 0.6, -2.2]} op={op} rotY={Math.PI / 2} />
        </>
      )}

      {/* Cordolo grigio scuro sotto la copertura */}
      <mesh position={[0, base + H + 0.1, 0]}>
        <boxGeometry args={[W + 0.22, 0.2, D + 0.22]} />
        <meshStandardMaterial color={M.facadeGreyLight} roughness={0.7} transparent opacity={op} />
      </mesh>
      {/* Edera cascante dal parapetto (lato sud, sopra la vetrata) */}
      <Ivy position={[-1.4, base + H - 0.05, south + 0.12]} w={W - 2.6} drop={1.9} op={op} />

      {/* ===== COPERTURA: PV (nord) + terrazza lounge (sud) ===== */}
      <group position={[0, base + H + 0.22, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[W, 0.12, D]} />
          <meshStandardMaterial color="#5A5E66" roughness={0.9} transparent opacity={op} />
        </mesh>

        {/* Campo fotovoltaico inclinato */}
        <group position={[-0.5, 0.2, -D / 4]} rotation={[-0.2, 0, 0]}>
          <PvField w={W - 2.0} d={D / 2 - 0.6} active={pvActive} ratio={pvRatio} opacity={op} />
        </group>
        {/* Lucernario complanare accanto al PV */}
        <group position={[W / 2 - 1.0, 0.1, -D / 4 + 0.2]}>
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.1, 1.5]} />
            <meshStandardMaterial color={M.glass} metalness={0.85} roughness={0.1} transparent opacity={op * 0.9} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[1.2, 0.1, 1.6]} />
            <meshStandardMaterial color={M.frame} roughness={0.5} transparent opacity={op} wireframe />
          </mesh>
        </group>

        {/* Terrazza panoramica */}
        <group position={[0, 0.12, D / 4 + 0.5]}>
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <boxGeometry args={[W - 0.5, 0.06, D / 2 - 0.5]} />
            <meshStandardMaterial color={M.woodDeck} roughness={0.85} transparent opacity={op} />
          </mesh>
          {/* doghe del deck */}
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={i} position={[0, 0.06, -(D / 2 - 0.5) / 2 + 0.3 + i * 0.55]}>
              <boxGeometry args={[W - 0.6, 0.005, 0.04]} />
              <meshStandardMaterial color={M.woodSlat} roughness={0.9} transparent opacity={op} />
            </mesh>
          ))}
          {/* lounge in rattan + tavolino */}
          <Lounge position={[-1.5, 0.2, 0.2]} op={op} />
          <Lounge position={[-1.5, 0.2, 1.4]} op={op} rot={Math.PI} />
          <mesh position={[-1.5, 0.32, 0.8]} castShadow>
            <boxGeometry args={[0.7, 0.12, 0.5]} />
            <meshStandardMaterial color={M.woodSlat} roughness={0.7} transparent opacity={op} />
          </mesh>
          {/* idromassaggio con acqua */}
          <HotTub position={[1.7, 0.18, 0.9]} op={op} />
          {/* pergola triangolare a listelli (lato corpo) */}
          <SlatCanopy position={[0, 0, -(D / 2 - 0.5) / 2 + 0.2]} w={W - 1.0} op={op} />
          {/* piante in vaso */}
          <PottedPlant position={[1.6, 0.1, -0.4]} op={op} />
          {/* ringhiera a barre orizzontali + fioriere cascanti */}
          <HBarRail w={W - 0.5} d={D / 2 - 0.5} op={op} />
          <Planter position={[0, 0.1, (D / 2 - 0.5) / 2 - 0.1]} w={W - 1.6} op={op} cascade />
        </group>
      </group>

      {/* Giardino privato fronte (sud): deck + prato + arbusto fiorito */}
      <mesh position={[0, 0.04, south + 2.2]} receiveShadow>
        <boxGeometry args={[W - 0.4, 0.06, 3.4]} />
        <meshStandardMaterial color={M.woodDeck} roughness={0.9} transparent opacity={op} />
      </mesh>
      <mesh position={[0, 0.02, south + 5.2]} receiveShadow>
        <boxGeometry args={[W, 0.04, 2.6]} />
        <meshStandardMaterial color={M.grass} roughness={1} transparent opacity={op} />
      </mesh>
      <FloweringShrub position={[-W / 2 + 0.5, 0, south + 4.6]} op={op} />
      <FloweringShrub position={[W / 2 - 0.6, 0, south + 5.2]} op={op} />

      {/* Etichetta nome */}
      {(selected || hovered) && (
        <Html position={[0, base + H + 3.6, 1]} center distanceFactor={26} zIndexRange={[40, 0]}>
          <div
            className="whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-semibold shadow-xl backdrop-blur"
            style={{
              fontFamily: 'Instrument Sans, sans-serif',
              background: 'rgba(0,0,0,0.82)',
              borderColor: selected ? 'rgba(255,228,43,0.5)' : 'rgba(255,255,255,0.18)',
              color: selected ? '#FFE42B' : '#fff',
            }}
          >
            {UNITS[index].name}
          </div>
        </Html>
      )}

      {selected && (
        <mesh position={[0, 0.06, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[W * 0.82, W * 0.9, 48]} />
          <meshBasicMaterial color="#FFE42B" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

/* Portale in pietra chiara attorno a una vetrata */
function StonePortal({ x, y, w, h, z, op }: { x: number; y: number; w: number; h: number; z: number; op: number }) {
  const t = 0.22;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, h / 2 + t / 2, 0]}>
        <boxGeometry args={[w + t * 2, t, 0.18]} />
        <meshStandardMaterial color={M.stone} roughness={0.9} transparent opacity={op} />
      </mesh>
      <mesh position={[0, -h / 2 - t / 2, 0]}>
        <boxGeometry args={[w + t * 2, t, 0.18]} />
        <meshStandardMaterial color={M.stone} roughness={0.9} transparent opacity={op} />
      </mesh>
      <mesh position={[-w / 2 - t / 2, 0, 0]}>
        <boxGeometry args={[t, h, 0.18]} />
        <meshStandardMaterial color={M.stone} roughness={0.9} transparent opacity={op} />
      </mesh>
      <mesh position={[w / 2 + t / 2, 0, 0]}>
        <boxGeometry args={[t, h, 0.18]} />
        <meshStandardMaterial color={M.stone} roughness={0.9} transparent opacity={op} />
      </mesh>
    </group>
  );
}

/* Grande vetrata scorrevole con telai e maniglia */
function BigSlider({
  position,
  w,
  h,
  op,
  rotY = 0,
}: {
  position: [number, number, number];
  w: number;
  h: number;
  op: number;
  rotY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={M.glass} metalness={0.9} roughness={0.08} transparent opacity={op * 0.92} />
      </mesh>
      {/* riflesso cielo */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#9DBBD8" transparent opacity={op * 0.12} />
      </mesh>
      {/* montanti */}
      {[-w / 2, -w / 6, w / 6, w / 2].map((mx, i) => (
        <mesh key={i} position={[mx, 0, 0.03]}>
          <boxGeometry args={[0.06, h, 0.05]} />
          <meshStandardMaterial color={M.frame} roughness={0.5} metalness={0.3} transparent opacity={op} />
        </mesh>
      ))}
      <mesh position={[0, h / 2, 0.03]}>
        <boxGeometry args={[w + 0.04, 0.06, 0.06]} />
        <meshStandardMaterial color={M.frame} transparent opacity={op} />
      </mesh>
      <mesh position={[0, -h / 2, 0.03]}>
        <boxGeometry args={[w + 0.04, 0.06, 0.06]} />
        <meshStandardMaterial color={M.frame} transparent opacity={op} />
      </mesh>
    </group>
  );
}

/* Plafoniera ovale (sconce) come nei render */
function OvalSconce({ position, op, rotY = 0 }: { position: [number, number, number]; op: number; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[0.7, 1.2, 1]}>
      <mesh>
        <circleGeometry args={[0.17, 24]} />
        <meshStandardMaterial color="#F6F4EF" emissive="#FFF3D0" emissiveIntensity={0.7} transparent opacity={op} />
      </mesh>
    </group>
  );
}

/* Fioriera con verde (eventualmente cascante) */
function Planter({ position, w, op, cascade = false }: { position: [number, number, number]; w: number; op: number; cascade?: boolean }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[w, 0.34, 0.4]} />
        <meshStandardMaterial color={M.stone} roughness={0.92} transparent opacity={op} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[w - 0.1, 0.18, 0.34]} />
        <meshStandardMaterial color="#4E7A3A" roughness={1} transparent opacity={op} />
      </mesh>
      {cascade &&
        Array.from({ length: Math.max(3, Math.round(w / 0.5)) }).map((_, i) => {
          const px = -w / 2 + 0.3 + i * (w / Math.max(3, Math.round(w / 0.5)));
          return (
            <mesh key={i} position={[px, -0.25, 0.2]}>
              <boxGeometry args={[0.18, 0.7, 0.06]} />
              <meshStandardMaterial color="#5E8C43" roughness={1} transparent opacity={op} />
            </mesh>
          );
        })}
    </group>
  );
}

/* Idromassaggio con acqua */
function HotTub({ position, op }: { position: [number, number, number]; op: number }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.5, 0.55, 1.5]} />
        <meshStandardMaterial color="#23252A" roughness={0.5} metalness={0.3} transparent opacity={op} />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <boxGeometry args={[1.2, 0.1, 1.2]} />
        <meshStandardMaterial color={M.hotTub} roughness={0.15} metalness={0.4} transparent opacity={op * 0.92} />
      </mesh>
    </group>
  );
}

/* Pianta in vaso (strelitzia/banano stilizzato) */
function PottedPlant({ position, op }: { position: [number, number, number]; op: number }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.22, 0.18, 0.4, 12]} />
        <meshStandardMaterial color="#C9C2B4" roughness={0.9} transparent opacity={op} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.7, 0]} rotation={[0.5, (i * Math.PI) / 2, 0]}>
          <boxGeometry args={[0.5, 0.9, 0.02]} />
          <meshStandardMaterial color="#3E6B34" roughness={1} side={THREE.DoubleSide} transparent opacity={op} />
        </mesh>
      ))}
    </group>
  );
}

/* Arbusto fiorito (oleandro) */
function FloweringShrub({ position, op }: { position: [number, number, number]; op: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color="#3E6B34" roughness={1} transparent opacity={op} />
      </mesh>
      <mesh position={[0.2, 0.8, 0.1]}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial color="#E9D7E0" roughness={1} transparent opacity={op} />
      </mesh>
    </group>
  );
}

function PvField({ w, d, active, ratio, opacity }: { w: number; d: number; active: boolean; ratio: number; opacity: number }) {
  const cols = 4;
  const rows = 3;
  const pw = (w - (cols + 1) * 0.06) / cols;
  const ph = (d - (rows + 1) * 0.06) / rows;
  return (
    <group>
      <mesh>
        <planeGeometry args={[w + 0.08, d + 0.08]} />
        <meshStandardMaterial color="#0A0F18" roughness={0.4} side={THREE.DoubleSide} transparent opacity={opacity} />
      </mesh>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const px = -w / 2 + 0.06 + pw / 2 + c * (pw + 0.06);
          const py = d / 2 - 0.06 - ph / 2 - r * (ph + 0.06);
          return (
            <mesh key={`${r}-${c}`} position={[px, py, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[pw, ph]} />
              <meshStandardMaterial
                color={M.pvDark}
                metalness={0.9}
                roughness={0.2}
                emissive="#FFE42B"
                emissiveIntensity={active ? ratio * 0.18 : 0}
                side={THREE.DoubleSide}
                transparent
                opacity={opacity}
              />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

/* Lounge in rattan con cuscini bianchi */
function Lounge({ position, op, rot = 0 }: { position: [number, number, number]; op: number; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.3, 0.26, 0.7]} />
        <meshStandardMaterial color="#5C5A54" roughness={0.95} transparent opacity={op} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[1.18, 0.16, 0.58]} />
        <meshStandardMaterial color={M.white} roughness={0.95} transparent opacity={op} />
      </mesh>
      <mesh position={[0, 0.42, -0.27]}>
        <boxGeometry args={[1.18, 0.42, 0.13]} />
        <meshStandardMaterial color={M.white} roughness={0.95} transparent opacity={op} />
      </mesh>
    </group>
  );
}

/* Pergola/canopy a falda triangolare con listelli di legno (firma dei render) */
function SlatCanopy({ position, w, op }: { position: [number, number, number]; w: number; op: number }) {
  const n = Math.max(10, Math.round(w / 0.32));
  const backY = 2.0; // alta sul retro (verso il corpo)
  const frontY = 0.6; // bassa sul fronte
  const span = 2.1;
  const slatLen = Math.sqrt(span * span + (backY - frontY) * (backY - frontY));
  const tilt = Math.atan2(backY - frontY, span);
  return (
    <group position={position}>
      {/* montanti posteriori */}
      {[-w / 2 + 0.15, w / 2 - 0.15].map((px, i) => (
        <mesh key={`p${i}`} position={[px, backY / 2, -span / 2]}>
          <boxGeometry args={[0.1, backY, 0.1]} />
          <meshStandardMaterial color={M.frame} roughness={0.6} transparent opacity={op} />
        </mesh>
      ))}
      {/* trave alta (retro) e trave bassa (fronte) */}
      <mesh position={[0, backY, -span / 2]}>
        <boxGeometry args={[w, 0.12, 0.12]} />
        <meshStandardMaterial color={M.frame} roughness={0.6} transparent opacity={op} />
      </mesh>
      <mesh position={[0, frontY, span / 2]}>
        <boxGeometry args={[w, 0.1, 0.1]} />
        <meshStandardMaterial color={M.frame} roughness={0.6} transparent opacity={op} />
      </mesh>
      {/* listelli di legno inclinati che formano la falda */}
      {Array.from({ length: n }).map((_, i) => {
        const px = -w / 2 + 0.18 + i * ((w - 0.36) / (n - 1));
        return (
          <mesh key={i} position={[px, (backY + frontY) / 2, 0]} rotation={[tilt, 0, 0]}>
            <boxGeometry args={[0.07, 0.06, slatLen]} />
            <meshStandardMaterial color={M.woodSlat} roughness={0.7} transparent opacity={op} />
          </mesh>
        );
      })}
    </group>
  );
}

/* Pannello di rivestimento in pietra chiara con fughe orizzontali (travertino) */
function StoneClad({
  position,
  w,
  h,
  op,
  rotY = 0,
}: {
  position: [number, number, number];
  w: number;
  h: number;
  op: number;
  rotY?: number;
}) {
  const rows = Math.max(2, Math.round(h / 0.55));
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={M.stone} roughness={0.92} transparent opacity={op} />
      </mesh>
      {/* fughe orizzontali */}
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <mesh key={`h${i}`} position={[0, -h / 2 + (i + 1) * (h / rows), 0.01]}>
          <planeGeometry args={[w, 0.012]} />
          <meshStandardMaterial color={M.stoneDark} roughness={1} transparent opacity={op} />
        </mesh>
      ))}
      {/* qualche fuga verticale */}
      {[-w / 4, w / 4].map((vx, i) => (
        <mesh key={`v${i}`} position={[vx, 0, 0.01]}>
          <planeGeometry args={[0.012, h]} />
          <meshStandardMaterial color={M.stoneDark} roughness={1} transparent opacity={op} />
        </mesh>
      ))}
    </group>
  );
}

/* Edera cascante dal parapetto lungo la facciata (firma dei render) */
function Ivy({ position, w, drop, op }: { position: [number, number, number]; w: number; drop: number; op: number }) {
  const n = Math.max(4, Math.round(w / 0.32));
  return (
    <group position={position}>
      {/* fascia superiore */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w, 0.18, 0.12]} />
        <meshStandardMaterial color="#3E6B34" roughness={1} transparent opacity={op} />
      </mesh>
      {Array.from({ length: n }).map((_, i) => {
        const px = -w / 2 + 0.16 + i * ((w - 0.32) / (n - 1));
        const d = drop * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7)));
        return (
          <mesh key={i} position={[px, -d / 2, 0.04]}>
            <boxGeometry args={[0.16, d, 0.05]} />
            <meshStandardMaterial color={i % 2 ? '#4E7A3A' : '#5E8C43'} roughness={1} transparent opacity={op} />
          </mesh>
        );
      })}
    </group>
  );
}

/* Ringhiera a barre orizzontali (montanti + 5 correnti) */
function HBarRail({ w, d, op }: { w: number; d: number; op: number }) {
  const heights = [0.18, 0.36, 0.54, 0.72, 0.9];
  const side = (length: number, horizontal: boolean) => (
    <>
      {heights.map((hy, i) => (
        <mesh key={`b${i}`} position={[0, hy, 0]}>
          <boxGeometry args={horizontal ? [length, 0.022, 0.022] : [0.022, 0.022, length]} />
          <meshStandardMaterial color={M.railing} roughness={0.5} metalness={0.6} transparent opacity={op} />
        </mesh>
      ))}
      {/* corrimano superiore */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={horizontal ? [length, 0.05, 0.05] : [0.05, 0.05, length]} />
        <meshStandardMaterial color={M.railing} roughness={0.4} metalness={0.7} transparent opacity={op} />
      </mesh>
    </>
  );
  return (
    <group>
      <group position={[0, 0, d / 2]}>{side(w, true)}</group>
      <group position={[w / 2, 0, 0]}>{side(d, false)}</group>
      <group position={[-w / 2, 0, 0]}>{side(d, false)}</group>
    </group>
  );
}

/* ====================== CONTORNO LOTTO ====================== */
function Lot({ season }: { season: SeasonKey }) {
  const grass = season === 'autumn' ? '#7C7A45' : season === 'winter' ? '#7E8C6A' : M.grass;
  return (
    <group>
      {/* prato del lotto (trapezio approssimato con un piano ampio) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[60, 34]} />
        <meshStandardMaterial color={grass} roughness={1} />
      </mesh>
      {/* vialetto/parcheggio sul fronte */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 9]} receiveShadow>
        <planeGeometry args={[44, 5]} />
        <meshStandardMaterial color="#7C7C80" roughness={0.95} />
      </mesh>
      {/* siepi perimetrali */}
      <Hedge position={[0, 0, -10]} length={40} />
      <Hedge position={[-19, 0, 0]} length={20} rot={Math.PI / 2} />
      <Hedge position={[19, 0, 0]} length={20} rot={Math.PI / 2} />
      {/* siepi divisorie tra i villini */}
      <Hedge position={[-SPAN / 2, 0, 2]} length={11} rot={Math.PI / 2} thin />
      <Hedge position={[SPAN / 2, 0, 2]} length={11} rot={Math.PI / 2} thin />
      {/* siepi angolate agli estremi (lotto trapezoidale) */}
      <Hedge position={[-16.5, 0, -6]} length={9} rot={Math.PI / 3.2} />
      <Hedge position={[16.5, 0, -6]} length={9} rot={-Math.PI / 3.2} />
      {/* posti auto agli estremi */}
      <ParkedCar position={[-17, 0, 9.5]} color="#B23A2E" />
      <ParkedCar position={[17, 0, 9.5]} color="#C2502A" />
      {/* Alberi: salice piangente + alberi tondi sullo sfondo */}
      <WillowTree position={[-15, 0, -7]} season={season} />
      <RoundTree position={[14.5, 0, -8]} season={season} scale={1.2} />
      <RoundTree position={[8, 0, -9.2]} season={season} scale={0.9} />
      <RoundTree position={[-8, 0, -9.2]} season={season} scale={1.0} />
      {/* aiuole fiorite verso il fronte */}
      {[-SPAN, 0, SPAN].map((gx, i) => (
        <mesh key={i} position={[gx, 0.05, 7.6]} receiveShadow>
          <boxGeometry args={[4, 0.08, 1.0]} />
          <meshStandardMaterial color="#4E7A3A" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function WillowTree({ position, season }: { position: [number, number, number]; season: SeasonKey }) {
  const leaf = season === 'autumn' ? '#9AA24A' : '#6FA050';
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.34, 4, 8]} />
        <meshStandardMaterial color="#5A4632" roughness={0.95} />
      </mesh>
      <mesh position={[0, 4.4, 0]} castShadow>
        <sphereGeometry args={[2.6, 14, 14]} />
        <meshStandardMaterial color={leaf} roughness={1} />
      </mesh>
      {/* rami cascanti */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.2, 3.1, Math.sin(a) * 2.2]}>
            <boxGeometry args={[0.12, 2.4, 0.12]} />
            <meshStandardMaterial color={leaf} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function RoundTree({ position, season, scale = 1 }: { position: [number, number, number]; season: SeasonKey; scale?: number }) {
  const leaf = season === 'autumn' ? '#A07A35' : season === 'winter' ? '#5E7350' : '#3E6B34';
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 2.8, 8]} />
        <meshStandardMaterial color="#4A3525" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.4, 0]} castShadow>
        <sphereGeometry args={[1.9, 14, 14]} />
        <meshStandardMaterial color={leaf} roughness={1} />
      </mesh>
    </group>
  );
}

function Hedge({ position, length, rot = 0, thin = false }: { position: [number, number, number]; length: number; rot?: number; thin?: boolean }) {
  return (
    <mesh position={[position[0], 0.5, position[2]]} rotation={[0, rot, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, 1.0, thin ? 0.4 : 0.7]} />
      <meshStandardMaterial color={M.hedge} roughness={1} />
    </mesh>
  );
}

function ParkedCar({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[2, 0.7, 4.2]} radius={0.22} position={[0, 0.55, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
      </RoundedBox>
      <RoundedBox args={[1.7, 0.6, 2.2]} radius={0.2} position={[0, 1.1, -0.2]} castShadow>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
      </RoundedBox>
    </group>
  );
}

/* ====================== SOLE / LUCE ====================== */
function SunLight({ dayOfYear, hour }: { dayOfYear: number; hour: number }) {
  const sun = sunState(dayOfYear, hour, SITE.latitude);
  const elev01 = Math.max(0, Math.sin(Math.max(0, sun.altitude)));
  const up = sun.isUp;
  const R = 34;
  const pos: [number, number, number] = [sun.vec.x * R, Math.max(2, sun.vec.y * R), sun.vec.z * R];
  const col = new THREE.Color().setRGB(1.0, 0.87 + 0.13 * elev01, 0.66 + 0.32 * elev01);
  return (
    <>
      <hemisphereLight intensity={up ? 0.5 + 0.3 * elev01 : 0.15} color={up ? '#cfe0ef' : '#1b2433'} groundColor="#4a4a44" />
      <ambientLight intensity={up ? 0.3 + 0.15 * elev01 : 0.1} />
      {up && (
        <directionalLight
          position={pos}
          intensity={0.4 + 1.6 * Math.pow(elev01, 0.7)}
          color={col}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={120}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-bias={-0.0004}
        />
      )}
    </>
  );
}

function SkyBg({ dayOfYear, hour }: { dayOfYear: number; hour: number }) {
  const e = sunState(dayOfYear, hour, SITE.latitude).altitudeDeg;
  const top = e <= -2 ? '#0A0E16' : e < 6 ? '#C99A6A' : e < 18 ? '#A8C3DE' : '#86B6E8';
  const fog = e <= -2 ? '#0A0E16' : '#CFE0F0';
  return (
    <>
      <color attach="background" args={[top]} />
      <fog attach="fog" args={[fog, 55, 150]} />
    </>
  );
}

/* ====================== CAMERA RIG (aerial ↔ zoom) ====================== */
const AERIAL = { pos: new THREE.Vector3(2, 40, 30), target: new THREE.Vector3(0, 0, 2) };
function unitGoal(index: number) {
  const x = UNIT_X[index];
  return {
    pos: new THREE.Vector3(x + 9, 11, 22),
    target: new THREE.Vector3(x, 4, 2),
  };
}

function CameraRig({
  selectedIndex,
  controlsRef,
  resetKey,
}: {
  selectedIndex: number;
  controlsRef: React.MutableRefObject<any>;
  resetKey: number;
}) {
  const { camera } = useThree();
  const animating = useRef(true);
  const goal = useRef(AERIAL);

  useEffect(() => {
    goal.current = selectedIndex >= 0 ? unitGoal(selectedIndex) : AERIAL;
    animating.current = true;
  }, [selectedIndex, resetKey]);

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    const stop = () => (animating.current = false);
    c.addEventListener('start', stop);
    return () => c.removeEventListener('start', stop);
  }, [controlsRef]);

  useFrame(() => {
    if (!animating.current) return;
    const g = goal.current;
    camera.position.lerp(g.pos, 0.07);
    const c = controlsRef.current;
    if (c) {
      c.target.lerp(g.target, 0.07);
      c.update();
    }
    if (camera.position.distanceTo(g.pos) < 0.4) animating.current = false;
  });
  return null;
}

/* Espone window.__voltaCapture per l'immagine nel report (render sincrono) */
function CaptureBridge() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    (window as unknown as { __voltaCapture?: () => string | undefined }).__voltaCapture = () => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/jpeg', 0.92);
      } catch {
        return undefined;
      }
    };
    return () => {
      delete (window as unknown as { __voltaCapture?: () => string | undefined }).__voltaCapture;
    };
  }, [gl, scene, camera]);
  return null;
}

/* ====================== FLUSSI ENERGETICI (villino selezionato) ====================== */
function FlowParticles({ from, to, color, count = 5 }: { from: THREE.Vector3; to: THREE.Vector3; color: string; count?: number }) {
  const curve = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y = Math.max(from.y, to.y) + 2;
    return new THREE.CatmullRomCurve3([from, mid, to]);
  }, [from, to]);
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }) => {
    for (let i = 0; i < count; i++) {
      const t = (clock.getElapsedTime() * 0.4 + i / count) % 1;
      const p = curve.getPoint(t);
      const m = refs.current[i];
      if (m) {
        m.position.copy(p);
        (m.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI);
      }
    }
  });
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color={color} transparent />
        </mesh>
      ))}
    </>
  );
}

/* ====================== ROOT ====================== */
export function Complex3D({
  season,
  hour = 12,
  selectedUnit,
  onSelectUnit,
  pvKw = 0,
  pvPeakKw = 6,
  loadKw = 0,
  batterySoc = 0.5,
  gridKw = 0,
}: Complex3DProps) {
  const controlsRef = useRef<any>(null);
  const [resetKey, setResetKey] = useState(0);
  const doy = SEASON_DAY[season];
  const sun = sunState(doy, hour, SITE.latitude);
  const selectedIndex = selectedUnit ? UNITS.findIndex((u) => u.id === selectedUnit) : -1;
  const pvRatio = pvPeakKw > 0 ? Math.min(1, pvKw / pvPeakKw) : 0;

  const selX = selectedIndex >= 0 ? UNIT_X[selectedIndex] : 0;
  const flows =
    selectedIndex >= 0
      ? [
          { from: new THREE.Vector3(selX, 9, -1), to: new THREE.Vector3(selX, 4, 2), color: '#FFE42B', active: pvKw > 0.05 },
          {
            from: new THREE.Vector3(selX, 4, 2),
            to: new THREE.Vector3(selX + 14, 3, 9),
            color: gridKw > 0 ? '#EF4444' : '#10B981',
            active: Math.abs(gridKw) > 0.2,
          },
        ]
      : [];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-volta-white/10 bg-volta-black group">
      <Canvas
        shadows
        camera={{ position: [2, 40, 30], fov: 34, near: 0.5, far: 300 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        onPointerMissed={() => onSelectUnit(null)}
      >
        <SkyBg dayOfYear={doy} hour={hour} />
        <CaptureBridge />
        <Suspense fallback={null}>
          <SunLight dayOfYear={doy} hour={hour} />
          <Lot season={season} />
          {UNITS.map((u, i) => (
            <Villa
              key={u.id}
              index={i}
              unitId={u.id}
              selected={selectedUnit === u.id}
              dimmed={selectedUnit !== null && selectedUnit !== u.id}
              onSelect={onSelectUnit}
              pvActive={selectedUnit === u.id && pvKw > 0.05}
              pvRatio={pvRatio}
            />
          ))}
          {flows.map((f, i) => f.active && <FlowParticles key={i} from={f.from} to={f.to} color={f.color} />)}
          <ContactShadows position={[0, 0.04, 2]} opacity={0.45} scale={70} blur={2.6} far={30} />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          target={[0, 0, 2]}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={14}
          maxDistance={70}
          enableDamping
          dampingFactor={0.08}
        />
        <CameraRig selectedIndex={selectedIndex} controlsRef={controlsRef} resetKey={resetKey} />
        <Preload all />
      </Canvas>

      {/* Sole reale */}
      <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg border border-volta-white/10 bg-volta-black/70 px-2.5 py-1.5 backdrop-blur">
        <Sun className={`h-3.5 w-3.5 ${sun.isUp ? 'text-volta-yellow' : 'text-volta-white/40'}`} strokeWidth={1.75} />
        <span className="text-[10px] text-volta-white/70 tabular-nums">
          {sun.isUp ? `Sole ${Math.round(sun.altitudeDeg)}° · ${cardinalFromAzimuth(sun.azimuthDeg)}` : 'Sole sotto l’orizzonte'}
        </span>
      </div>

      {/* Hint / vista aerea */}
      {selectedUnit === null ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-volta-white/10 bg-volta-black/75 px-3.5 py-1.5 text-[11px] text-volta-white/80 backdrop-blur">
          Tocca un villino per esplorarlo
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            onSelectUnit(null);
            setResetKey((k) => k + 1);
          }}
          className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-volta-white/15 bg-volta-black/80 px-3 py-1.5 text-[11px] font-semibold text-volta-white backdrop-blur hover:border-volta-yellow/40 hover:text-volta-yellow transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Vista aerea
        </button>
      )}
    </div>
  );
}
