/**
 * Geometria solare reale (NOAA semplificato).
 * Calcola elevazione e azimut del sole da:
 *  - latitudine del sito (gradi)
 *  - giorno dell'anno (1..365) → declinazione
 *  - ora solare locale (0..24) → angolo orario
 *
 * Convenzione scena 3D: +Z = sud (fronte), +X = est, +Y = su.
 * azimuth: 0 = sud, positivo verso ovest, negativo verso est.
 */

const DEG = Math.PI / 180;

export interface SunState {
  altitude: number; // rad sopra l'orizzonte
  azimuth: number; // rad da sud (+ovest)
  altitudeDeg: number;
  azimuthDeg: number;
  /** vettore unitario verso il sole nello spazio scena */
  vec: { x: number; y: number; z: number };
  isUp: boolean;
}

export function sunState(dayOfYear: number, hour: number, latitudeDeg: number): SunState {
  const lat = latitudeDeg * DEG;
  // Declinazione solare (Cooper)
  const decl = 23.45 * DEG * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365);
  // Angolo orario: 0 a mezzogiorno solare, +15°/h al pomeriggio
  const H = (hour - 12) * 15 * DEG;

  const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAlt = Math.cos(altitude);

  let azimuth: number;
  if (cosAlt < 1e-4) {
    azimuth = 0;
  } else {
    const sinAz = (Math.cos(decl) * Math.sin(H)) / cosAlt;
    const cosAz = (sinAlt * Math.sin(lat) - Math.sin(decl)) / (cosAlt * Math.cos(lat));
    azimuth = Math.atan2(Math.max(-1, Math.min(1, sinAz)), Math.max(-1, Math.min(1, cosAz)));
  }

  const ca = Math.cos(altitude);
  const vec = {
    x: ca * -Math.sin(azimuth), // mattino (az<0) → +X est
    y: Math.sin(altitude),
    z: ca * Math.cos(azimuth), // mezzogiorno → +Z sud
  };

  return {
    altitude,
    azimuth,
    altitudeDeg: altitude / DEG,
    azimuthDeg: azimuth / DEG,
    vec,
    isUp: altitude > 0.01,
  };
}

/** Giorno rappresentativo dell'anno per ciascuna stagione (emisfero nord) */
export const SEASON_DAY: Record<'winter' | 'spring' | 'summer' | 'autumn', number> = {
  winter: 21, // ~21 gennaio, sole basso
  spring: 105, // ~15 aprile
  summer: 196, // ~15 luglio, sole alto
  autumn: 288, // ~15 ottobre
};

/** Punto cardinale leggibile dall'azimut (0=sud,+ovest) */
export function cardinalFromAzimuth(azimuthDeg: number): string {
  // azimuth da sud; converto a bussola (0=N) per leggibilità
  const fromNorth = (180 + azimuthDeg + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(fromNorth / 45) % 8];
}
