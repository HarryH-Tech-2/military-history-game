import { Battle } from '../types';
import { allBattles } from './battles';

export type EraId =
  | 'ancient' | 'dark-ages' | 'medieval' | 'early-modern'
  | 'napoleonic' | 'industrial' | 'world-wars' | 'modern';

export interface Era {
  id: EraId;
  label: string;
  minYear: number;  // inclusive
  maxYear: number;  // inclusive
}

export const ERAS: Era[] = [
  { id: 'ancient',      label: 'Ancient World',         minYear: -3000, maxYear: 500 },
  { id: 'dark-ages',    label: 'Dark Ages',             minYear: 501,   maxYear: 1000 },
  { id: 'medieval',     label: 'Medieval',              minYear: 1001,  maxYear: 1500 },
  { id: 'early-modern', label: 'Early Modern',          minYear: 1501,  maxYear: 1700 },
  { id: 'napoleonic',   label: 'Napoleonic & Colonial', minYear: 1701,  maxYear: 1850 },
  { id: 'industrial',   label: 'Industrial Age',        minYear: 1851,  maxYear: 1913 },
  { id: 'world-wars',   label: 'World Wars',            minYear: 1914,  maxYear: 1945 },
  { id: 'modern',       label: 'Modern',                minYear: 1946,  maxYear: 9999 },
];

export const NEXT_ERA: Record<EraId, EraId | null> = {
  'ancient': 'dark-ages',
  'dark-ages': 'medieval',
  'medieval': 'early-modern',
  'early-modern': 'napoleonic',
  'napoleonic': 'industrial',
  'industrial': 'world-wars',
  'world-wars': 'modern',
  'modern': null,
};

export function getEraForYear(year: number): EraId {
  const era = ERAS.find(e => year >= e.minYear && year <= e.maxYear);
  if (!era) throw new Error(`No era for year ${year}`);
  return era.id;
}

// Mulberry32: deterministic, fast, good enough for shuffle.
function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function getBattlesForEra(eraId: EraId, uid: string): Battle[] {
  const era = ERAS.find(e => e.id === eraId)!;
  const inEra = allBattles.filter(b => b.year >= era.minYear && b.year <= era.maxYear);
  if (inEra.length < 10 && process.env.NODE_ENV !== 'test') {
    console.warn(`[eras] only ${inEra.length} battles in era "${eraId}"`);
  }
  const rng = mulberry32(seedFromString(`${uid}:${eraId}`));
  return shuffle(inEra, rng).slice(0, 10);
}
