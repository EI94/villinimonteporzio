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
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  const opacity = dimmed ? 0.5 : 1;

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
      {/* Base in pietra */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, 1.0, D]} />
        <meshStandardMaterial color={M.stone} roughness={0.9} transparent opacity={opacity} />
      </mesh>

      {/* Corpo grigio antracite (2 piani) */}
      <mesh position={[0, 1 + H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color={M.facadeGrey} roughness={0.82} transparent opacity={opacity} />
      </mesh>

      {/* Inserto pietra verticale sull'angolo (come render) */}
      <mesh position={[W / 2 - 0.05, 1 + H / 2, D / 2 - 1.2]} castShadow>
        <boxGeometry args={[0.12, H, 2.2]} />
        <meshStandardMaterial color={M.stone} roughness={0.9} transparent opacity={opacity} />
      </mesh>

      {/* Grande vetrata scorrevole a sud (PT) */}
      <GlassWall position={[0, 1 + 1.5, D / 2 + 0.02]} w={W - 1.6} h={2.6} opacity={opacity} />
      {/* Finestra a nastro P1 */}
      <GlassWall position={[-1.2, 1 + floorH + 1.3, D / 2 + 0.02]} w={2.4} h={1.5} opacity={opacity} />
      {/* Porta d'ingresso laterale */}
      <mesh position={[W / 2 - 1.6, 1 + 1.1, D / 2 + 0.02]}>
        <planeGeometry args={[1.0, 2.2]} />
        <meshStandardMaterial color={M.frame} roughness={0.5} metalness={0.3} transparent opacity={opacity} />
      </mesh>
      {/* Plafoniere ovali (render) */}
      <OvalLight position={[W / 2 - 0.4, 1 + floorH + 0.4, D / 2 + 0.04]} opacity={opacity} />
      <OvalLight position={[-W / 2 + 0.6, 1 + floorH + 0.4, D / 2 + 0.04]} opacity={opacity} />

      {/* Cordolo grigio scuro sotto la copertura */}
      <mesh position={[0, 1 + H + 0.12, 0]}>
        <boxGeometry args={[W + 0.2, 0.24, D + 0.2]} />
        <meshStandardMaterial color={M.facadeGreyLight} roughness={0.7} transparent opacity={opacity} />
      </mesh>

      {/* ===== COPERTURA: PV + terrazza panoramica con lounge ===== */}
      <group position={[0, 1 + H + 0.26, 0]}>
        {/* Solaio di copertura */}
        <mesh receiveShadow>
          <boxGeometry args={[W, 0.12, D]} />
          <meshStandardMaterial color={M.facadeGreyLight} roughness={0.85} transparent opacity={opacity} />
        </mesh>

        {/* Campo fotovoltaico (lato nord della copertura), leggermente inclinato */}
        <group position={[0, 0.18, -D / 4]} rotation={[-0.18, 0, 0]}>
          <PvField w={W - 1.4} d={D / 2 - 0.8} active={pvActive} ratio={pvRatio} opacity={opacity} />
        </group>

        {/* Terrazza lounge (lato sud) */}
        <group position={[0, 0.12, D / 4 + 0.4]}>
          {/* pavimento legno */}
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <boxGeometry args={[W - 0.6, 0.06, D / 2 - 0.6]} />
            <meshStandardMaterial color={M.woodDeck} roughness={0.85} transparent opacity={opacity} />
          </mesh>
          {/* divani lounge */}
          <Lounge position={[-1.4, 0.2, 0.4]} opacity={opacity} />
          <Lounge position={[1.0, 0.2, -0.6]} opacity={opacity} rot={Math.PI / 2} />
          {/* vasca idromassaggio */}
          <mesh position={[1.6, 0.22, 1.0]} castShadow>
            <boxGeometry args={[1.4, 0.5, 1.4]} />
            <meshStandardMaterial color={M.frame} roughness={0.6} transparent opacity={opacity} />
          </mesh>
          <mesh position={[1.6, 0.42, 1.0]}>
            <boxGeometry args={[1.1, 0.12, 1.1]} />
            <meshStandardMaterial color={M.hotTub} roughness={0.2} metalness={0.3} transparent opacity={opacity * 0.9} />
          </mesh>
          {/* pergola a listelli di legno */}
          <SlatPergola position={[-1.2, 1.2, -1.0]} opacity={opacity} />
          {/* ringhiera perimetrale terrazza */}
          <Railing w={W - 0.6} d={D / 2 - 0.6} opacity={opacity} />
        </group>
      </group>

      {/* Giardino privato fronte (sud) con deck */}
      <mesh position={[0, 0.03, D / 2 + 2.2]} receiveShadow>
        <boxGeometry args={[W - 0.5, 0.06, 3.6]} />
        <meshStandardMaterial color={M.woodDeck} roughness={0.9} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.02, D / 2 + 5.2]} receiveShadow>
        <boxGeometry args={[W, 0.04, 2.4]} />
        <meshStandardMaterial color={M.grass} roughness={1} transparent opacity={opacity} />
      </mesh>

      {/* Etichetta nome (solo se selezionato o hover) */}
      {(selected || hovered) && (
        <Html position={[0, 1 + H + 3.4, 1]} center distanceFactor={26} zIndexRange={[40, 0]}>
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

      {/* Anello evidenziazione a terra quando selezionato */}
      {selected && (
        <mesh position={[0, 0.06, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[W * 0.78, W * 0.86, 48]} />
          <meshBasicMaterial color="#FFE42B" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

function GlassWall({ position, w, h, opacity }: { position: [number, number, number]; w: number; h: number; opacity: number }) {
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={M.glass} metalness={0.85} roughness={0.12} transparent opacity={opacity * 0.9} />
      </mesh>
      {[-w / 3, w / 6].map((mx, i) => (
        <mesh key={i} position={[mx, 0, 0.02]}>
          <boxGeometry args={[0.05, h, 0.04]} />
          <meshStandardMaterial color={M.frame} transparent opacity={opacity} />
        </mesh>
      ))}
      <mesh position={[0, h / 2, 0.02]}>
        <boxGeometry args={[w + 0.06, 0.07, 0.05]} />
        <meshStandardMaterial color={M.frame} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, -h / 2, 0.02]}>
        <boxGeometry args={[w + 0.06, 0.07, 0.05]} />
        <meshStandardMaterial color={M.frame} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function OvalLight({ position, opacity }: { position: [number, number, number]; opacity: number }) {
  return (
    <mesh position={position}>
      <circleGeometry args={[0.16, 24]} />
      <meshStandardMaterial color="#F3F1EC" emissive="#FFF6D8" emissiveIntensity={0.5} transparent opacity={opacity} />
    </mesh>
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

function Lounge({ position, opacity, rot = 0 }: { position: [number, number, number]; opacity: number; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.3, 0.3, 0.7]} />
        <meshStandardMaterial color="#6E7378" roughness={0.85} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[1.2, 0.16, 0.6]} />
        <meshStandardMaterial color={M.white} roughness={0.9} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.4, -0.27]}>
        <boxGeometry args={[1.2, 0.4, 0.12]} />
        <meshStandardMaterial color={M.white} roughness={0.9} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function SlatPergola({ position, opacity }: { position: [number, number, number]; opacity: number }) {
  return (
    <group position={position}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-1.2 + i * 0.34, 0, 0]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.06, 0.06, 2.0]} />
          <meshStandardMaterial color={M.woodSlat} roughness={0.7} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

function Railing({ w, d, opacity }: { w: number; d: number; opacity: number }) {
  const bars = (length: number, horizontal: boolean) =>
    [0.25, 0.5, 0.75].map((f, i) => (
      <mesh key={i} position={[0, 0.2 + f * 0.8, 0]}>
        <boxGeometry args={horizontal ? [length, 0.03, 0.03] : [0.03, 0.03, length]} />
        <meshStandardMaterial color={M.railing} roughness={0.5} metalness={0.6} transparent opacity={opacity} />
      </mesh>
    ));
  return (
    <group>
      <group position={[0, 0, d / 2]}>{bars(w, true)}</group>
      <group position={[w / 2, 0, 0]}>{bars(d, false)}</group>
      <group position={[-w / 2, 0, 0]}>{bars(d, false)}</group>
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
      {/* posti auto agli estremi */}
      <ParkedCar position={[-17, 0, 9.5]} color="#B23A2E" />
      <ParkedCar position={[17, 0, 9.5]} color="#C2502A" />
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
