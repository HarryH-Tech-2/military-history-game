# Military History Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Duolingo-style mobile game (Expo, custom dev client) where players guess battles from images, progress through 8 chronological eras, and compete on weekly + all-time leaderboards backed by Firebase.

**Architecture:** Feature-based folder layout under `src/features/*`, Zustand for client state, Firebase JS SDK for Firestore + `@react-native-firebase/auth` for native auth, custom Expo config plugin for Android Credential Manager, `expo-apple-authentication` on iOS. TDD for game logic and services; component tests for stateful screens; manual verification for native auth modules.

**Tech Stack:** Expo SDK 54, RN 0.81, TypeScript, Zustand, AsyncStorage, Firebase, Reanimated, React Hook Form + Zod, Jest, React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-04-military-history-game-design.md`

**Phase map:**

| Phase | Outcome |
|---|---|
| 1. Foundations | Pure-logic units (eras, fuzzy match, scoring) green in Jest |
| 2. State stores | Zustand stores for game + progress, AsyncStorage persisted, tested |
| 3. Design system | Tokens, theme, fonts, base components |
| 4. Game UI (offline) | Playable era end-to-end against local data, no auth |
| 5. Path & era unlock | Path screen + era completion logic |
| 6. Firebase + auth | Sign-in (Google/Apple/email), user profile sync |
| 7. Leaderboards | Weekly + all-time tabs, sticky rank row |
| 8. Onboarding & wiring | Welcome carousel, RootNavigator, App.tsx providers |
| 9. Polish | Motion, haptics, error toasts, empty states |

---

## Phase 1 — Foundations (pure logic, Jest only)

### Task 1: Era definitions and bucketing

**Files:**
- Create: `src/data/eras.ts`
- Test: `src/data/eras.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/data/eras.test.ts
import { ERAS, getEraForYear, getBattlesForEra, NEXT_ERA } from './eras';

describe('ERAS', () => {
  it('contains 8 eras in chronological order', () => {
    expect(ERAS.map(e => e.id)).toEqual([
      'ancient', 'dark-ages', 'medieval', 'early-modern',
      'napoleonic', 'industrial', 'world-wars', 'modern',
    ]);
  });
});

describe('getEraForYear', () => {
  it.each([
    [-490, 'ancient'],
    [500, 'ancient'],
    [501, 'dark-ages'],
    [1000, 'dark-ages'],
    [1066, 'medieval'],
    [1500, 'medieval'],
    [1600, 'early-modern'],
    [1815, 'napoleonic'],
    [1900, 'industrial'],
    [1916, 'world-wars'],
    [1945, 'world-wars'],
    [1991, 'modern'],
    [2003, 'modern'],
  ])('year %i -> %s', (year, expected) => {
    expect(getEraForYear(year)).toBe(expected);
  });
});

describe('NEXT_ERA', () => {
  it('maps each era to the next, modern -> null', () => {
    expect(NEXT_ERA['ancient']).toBe('dark-ages');
    expect(NEXT_ERA['world-wars']).toBe('modern');
    expect(NEXT_ERA['modern']).toBeNull();
  });
});

describe('getBattlesForEra', () => {
  it('returns only battles within the era year range', () => {
    const battles = getBattlesForEra('medieval', 'seed-uid');
    battles.forEach(b => {
      expect(b.year).toBeGreaterThanOrEqual(1001);
      expect(b.year).toBeLessThanOrEqual(1500);
    });
  });

  it('returns at most 10 battles', () => {
    expect(getBattlesForEra('ancient', 'seed-uid').length).toBeLessThanOrEqual(10);
  });

  it('is deterministic for the same uid', () => {
    const a = getBattlesForEra('medieval', 'uid-A').map(b => b.id);
    const b = getBattlesForEra('medieval', 'uid-A').map(b => b.id);
    expect(a).toEqual(b);
  });

  it('produces different orderings for different uids', () => {
    const a = getBattlesForEra('medieval', 'uid-A').map(b => b.id);
    const b = getBattlesForEra('medieval', 'uid-B').map(b => b.id);
    // ids are the same set, but order should differ for at least one position
    expect(a).not.toEqual(b);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/data/eras.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement eras.ts**

```ts
// src/data/eras.ts
import { Battle } from '../types';
import { BATTLES } from './battles';

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
  const inEra = BATTLES.filter(b => b.year >= era.minYear && b.year <= era.maxYear);
  if (inEra.length < 10 && process.env.NODE_ENV !== 'test') {
    console.warn(`[eras] only ${inEra.length} battles in era "${eraId}"`);
  }
  const rng = mulberry32(seedFromString(`${uid}:${eraId}`));
  return shuffle(inEra, rng).slice(0, 10);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/data/eras.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add src/data/eras.ts src/data/eras.test.ts
git commit -m "feat(eras): add chronological era model and seeded battle bucketing"
```

---

### Task 2: Fuzzy match utility

**Files:**
- Create: `src/utils/fuzzyMatch.ts`
- Test: `src/utils/fuzzyMatch.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/fuzzyMatch.test.ts
import { fuzzyMatch } from './fuzzyMatch';

describe('fuzzyMatch', () => {
  const accepted = ['Battle of Hastings', 'Hastings'];

  it('matches exact name (case insensitive)', () => {
    expect(fuzzyMatch('battle of hastings', accepted)).toBe(true);
  });

  it('matches with leading/trailing whitespace', () => {
    expect(fuzzyMatch('  Hastings  ', accepted)).toBe(true);
  });

  it('matches one-character typos via Levenshtein <= 2', () => {
    expect(fuzzyMatch('Hastngs', accepted)).toBe(true);
  });

  it('matches substring containment for long names', () => {
    expect(fuzzyMatch('hastings', ['Battle of Hastings'])).toBe(true);
  });

  it('rejects clearly wrong answers', () => {
    expect(fuzzyMatch('Marathon', accepted)).toBe(false);
  });

  it('rejects empty input', () => {
    expect(fuzzyMatch('', accepted)).toBe(false);
    expect(fuzzyMatch('   ', accepted)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/utils/fuzzyMatch.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement fuzzyMatch**

```ts
// src/utils/fuzzyMatch.ts
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

export function fuzzyMatch(input: string, accepted: string[]): boolean {
  const guess = normalize(input);
  if (!guess) return false;
  for (const raw of accepted) {
    const target = normalize(raw);
    if (guess === target) return true;
    if (target.length > 6 && target.includes(guess) && guess.length >= 4) return true;
    if (levenshtein(guess, target) <= 2) return true;
  }
  return false;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/fuzzyMatch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/fuzzyMatch.ts src/utils/fuzzyMatch.test.ts
git commit -m "feat(utils): add fuzzyMatch with Levenshtein + substring rules"
```

---

### Task 3: Scoring helpers

**Files:**
- Create: `src/game/scoring.ts`
- Test: `src/game/scoring.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/scoring.test.ts
import { pointsForClues, MAX_CLUES, MIN_CLUES, eraUnlockThreshold } from './scoring';

describe('pointsForClues', () => {
  it('1 clue (initial) = 10 points', () => expect(pointsForClues(1)).toBe(10));
  it('2 clues = 8', () => expect(pointsForClues(2)).toBe(8));
  it('3 clues = 6', () => expect(pointsForClues(3)).toBe(6));
  it('4 clues = 4', () => expect(pointsForClues(4)).toBe(4));
  it('clamps below min', () => expect(pointsForClues(0)).toBe(10));
  it('clamps above max', () => expect(pointsForClues(99)).toBe(4));
});

describe('era unlock', () => {
  it('threshold is 7 of 10', () => {
    expect(eraUnlockThreshold).toBe(7);
  });
});

describe('clue bounds', () => {
  it('min 1, max 4', () => {
    expect(MIN_CLUES).toBe(1);
    expect(MAX_CLUES).toBe(4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/game/scoring.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement scoring**

```ts
// src/game/scoring.ts
export const MIN_CLUES = 1;
export const MAX_CLUES = 4;
export const eraUnlockThreshold = 7;
export const battlesPerEra = 10;

export function pointsForClues(cluesRevealed: number): number {
  const c = Math.max(MIN_CLUES, Math.min(MAX_CLUES, cluesRevealed));
  // 1 -> 10, 2 -> 8, 3 -> 6, 4 -> 4
  return 12 - c * 2;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/game/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/scoring.ts src/game/scoring.test.ts
git commit -m "feat(game): add scoring helpers and era thresholds"
```

---

### Task 4: Weekly key derivation

**Files:**
- Create: `src/utils/weekKey.ts`
- Test: `src/utils/weekKey.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/weekKey.test.ts
import { weekKey } from './weekKey';

describe('weekKey', () => {
  it('formats as YYYY-Www with zero-padded week', () => {
    expect(weekKey(new Date('2026-01-05T12:00:00Z'))).toBe('2026-W02');
  });
  it('returns same key for two days in the same ISO week', () => {
    const mon = new Date('2026-05-04T00:00:00Z');
    const sun = new Date('2026-05-10T23:00:00Z');
    expect(weekKey(mon)).toBe(weekKey(sun));
  });
  it('returns different keys across week boundaries', () => {
    const sun = new Date('2026-05-10T23:00:00Z');
    const mon = new Date('2026-05-11T00:00:00Z');
    expect(weekKey(sun)).not.toBe(weekKey(mon));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/utils/weekKey.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement weekKey**

```ts
// src/utils/weekKey.ts
// ISO 8601 week number (Mon-start, week containing Jan 4 is W01).
export function weekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/weekKey.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/weekKey.ts src/utils/weekKey.test.ts
git commit -m "feat(utils): add ISO weekKey helper for weekly leaderboards"
```

---

**Phase 1 checkpoint.** All four pure-logic units are tested and green. Run the full suite:

```bash
npm test
```

Expected: all phase-1 tests pass.

---

## Phase 2 — State stores

### Task 5: Install AsyncStorage

**Files:** `package.json`

- [ ] **Step 1: Install**

```bash
npx expo install @react-native-async-storage/async-storage
```

- [ ] **Step 2: Verify**

Run: `npm ls @react-native-async-storage/async-storage`
Expected: package listed.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add AsyncStorage for Zustand persistence"
```

---

### Task 6: useProgressStore

**Files:**
- Create: `src/state/useProgressStore.ts`
- Test: `src/state/useProgressStore.test.ts`
- Modify: `jest-setup.ts` (mock AsyncStorage)

- [ ] **Step 1: Write the failing tests**

```ts
// src/state/useProgressStore.test.ts
import { useProgressStore } from './useProgressStore';

beforeEach(() => { useProgressStore.getState().reset(); });

describe('useProgressStore', () => {
  it('initial state has only ancient unlocked', () => {
    const s = useProgressStore.getState();
    expect(s.unlockedEras).toEqual(['ancient']);
    expect(s.currentEra).toBe('ancient');
    expect(s.totalPoints).toBe(0);
  });

  it('completeEra unlocks next when correct >= 7', () => {
    useProgressStore.getState().completeEra('ancient', { correct: 8, points: 64 });
    const s = useProgressStore.getState();
    expect(s.totalPoints).toBe(64);
    expect(s.unlockedEras).toEqual(['ancient', 'dark-ages']);
    expect(s.currentEra).toBe('dark-ages');
    expect(s.eraScores['ancient']).toEqual({ correct: 8, points: 64 });
  });

  it('completeEra below threshold does not unlock', () => {
    useProgressStore.getState().completeEra('ancient', { correct: 5, points: 30 });
    const s = useProgressStore.getState();
    expect(s.unlockedEras).toEqual(['ancient']);
    expect(s.currentEra).toBe('ancient');
  });

  it('completeEra is idempotent and keeps best score', () => {
    const a = useProgressStore.getState();
    a.completeEra('ancient', { correct: 9, points: 80 });
    a.completeEra('ancient', { correct: 10, points: 100 });
    const s = useProgressStore.getState();
    expect(s.unlockedEras.filter(x => x === 'dark-ages').length).toBe(1);
    expect(s.eraScores['ancient']).toEqual({ correct: 10, points: 100 });
    expect(s.totalPoints).toBe(100);
  });

  it('hydrate replaces local state', () => {
    useProgressStore.getState().hydrate({
      totalPoints: 200,
      unlockedEras: ['ancient', 'dark-ages', 'medieval'],
      currentEra: 'medieval',
      eraScores: { 'ancient': { correct: 10, points: 100 } },
    });
    const s = useProgressStore.getState();
    expect(s.totalPoints).toBe(200);
    expect(s.currentEra).toBe('medieval');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/state/useProgressStore.test.ts`
Expected: FAIL.

- [ ] **Step 3: Mock AsyncStorage in jest-setup.ts**

Append to `jest-setup.ts`:

```ts
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
```

- [ ] **Step 4: Implement the store**

```ts
// src/state/useProgressStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EraId, NEXT_ERA } from '../data/eras';
import { eraUnlockThreshold } from '../game/scoring';

export interface EraScore { correct: number; points: number }

export interface ProgressState {
  totalPoints: number;
  unlockedEras: EraId[];
  currentEra: EraId;
  eraScores: Partial<Record<EraId, EraScore>>;
  completeEra: (eraId: EraId, score: EraScore) => void;
  hydrate: (s: Pick<ProgressState, 'totalPoints' | 'unlockedEras' | 'currentEra' | 'eraScores'>) => void;
  reset: () => void;
}

const initial = {
  totalPoints: 0,
  unlockedEras: ['ancient'] as EraId[],
  currentEra: 'ancient' as EraId,
  eraScores: {} as Partial<Record<EraId, EraScore>>,
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      ...initial,
      completeEra: (eraId, score) => set(state => {
        const prev = state.eraScores[eraId];
        const best = !prev || score.points > prev.points ? score : prev;
        const pointsDelta = best.points - (prev?.points ?? 0);
        const next = NEXT_ERA[eraId];
        const passed = score.correct >= eraUnlockThreshold;
        const unlocked = passed && next && !state.unlockedEras.includes(next)
          ? [...state.unlockedEras, next]
          : state.unlockedEras;
        const currentEra = passed && next ? next : state.currentEra;
        return {
          eraScores: { ...state.eraScores, [eraId]: best },
          totalPoints: state.totalPoints + pointsDelta,
          unlockedEras: unlocked,
          currentEra,
        };
      }),
      hydrate: (s) => set(s),
      reset: () => set(initial),
    }),
    {
      name: 'mhg-progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        totalPoints: s.totalPoints,
        unlockedEras: s.unlockedEras,
        currentEra: s.currentEra,
        eraScores: s.eraScores,
      }),
    },
  ),
);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/state/useProgressStore.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/state/useProgressStore.ts src/state/useProgressStore.test.ts jest-setup.ts
git commit -m "feat(state): add useProgressStore with AsyncStorage persistence"
```

---

### Task 7: useGameStore (round state machine)

**Files:**
- Create: `src/state/useGameStore.ts`
- Test: `src/state/useGameStore.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/state/useGameStore.test.ts
import { useGameStore } from './useGameStore';
import { Battle } from '../types';

const sample: Battle[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Battle ${i + 1}`,
  civilization: 'ancient-greece-rome',
  acceptedAnswers: [`Battle ${i + 1}`],
  prompt: '',
  hints: ['hint A', 'hint B', 'hint C', 'hint D'],
  difficulty: 'easy',
  year: -490,
  location: 'Greece',
  description: '',
}));

beforeEach(() => useGameStore.getState().reset());

describe('useGameStore', () => {
  it('startRound seeds battles with 1 clue and 10 points', () => {
    useGameStore.getState().startRound('ancient', sample);
    const s = useGameStore.getState();
    expect(s.battles).toHaveLength(10);
    expect(s.currentIndex).toBe(0);
    expect(s.cluesRevealed).toBe(1);
    expect(s.pointsAvailable).toBe(10);
    expect(s.status).toBe('playing');
  });

  it('revealClue increments and reduces points; caps at 4', () => {
    useGameStore.getState().startRound('ancient', sample);
    const { revealClue } = useGameStore.getState();
    revealClue();
    expect(useGameStore.getState().pointsAvailable).toBe(8);
    revealClue(); revealClue(); revealClue();
    expect(useGameStore.getState().cluesRevealed).toBe(4);
    expect(useGameStore.getState().pointsAvailable).toBe(4);
  });

  it('submitGuess records correct, advances, resets clues', () => {
    useGameStore.getState().startRound('ancient', sample);
    useGameStore.getState().submitGuess('Battle 1');
    const s = useGameStore.getState();
    expect(s.results[0].correct).toBe(true);
    expect(s.results[0].pointsEarned).toBe(10);
    expect(s.currentIndex).toBe(1);
    expect(s.cluesRevealed).toBe(1);
  });

  it('submitGuess records wrong with 0 points', () => {
    useGameStore.getState().startRound('ancient', sample);
    useGameStore.getState().submitGuess('Wrong');
    expect(useGameStore.getState().results[0].correct).toBe(false);
    expect(useGameStore.getState().results[0].pointsEarned).toBe(0);
  });

  it('finishes after 10 submissions', () => {
    useGameStore.getState().startRound('ancient', sample);
    for (let i = 0; i < 10; i++) useGameStore.getState().submitGuess(`Battle ${i + 1}`);
    expect(useGameStore.getState().status).toBe('finished');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/state/useGameStore.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/state/useGameStore.ts
import { create } from 'zustand';
import { Battle, RoundResult } from '../types';
import { EraId } from '../data/eras';
import { fuzzyMatch } from '../utils/fuzzyMatch';
import { MIN_CLUES, MAX_CLUES, pointsForClues } from '../game/scoring';

type Status = 'idle' | 'playing' | 'finished';

interface GameState {
  eraId: EraId | null;
  battles: Battle[];
  currentIndex: number;
  cluesRevealed: number;
  pointsAvailable: number;
  results: RoundResult[];
  status: Status;
  startRound: (eraId: EraId, battles: Battle[]) => void;
  revealClue: () => void;
  submitGuess: (input: string) => RoundResult;
  reset: () => void;
}

const initial = {
  eraId: null as EraId | null,
  battles: [] as Battle[],
  currentIndex: 0,
  cluesRevealed: MIN_CLUES,
  pointsAvailable: pointsForClues(MIN_CLUES),
  results: [] as RoundResult[],
  status: 'idle' as Status,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initial,
  startRound: (eraId, battles) => set({ ...initial, eraId, battles, status: 'playing' }),
  revealClue: () => set(state => {
    const next = Math.min(MAX_CLUES, state.cluesRevealed + 1);
    return { cluesRevealed: next, pointsAvailable: pointsForClues(next) };
  }),
  submitGuess: (input) => {
    const state = get();
    const battle = state.battles[state.currentIndex];
    const correct = fuzzyMatch(input, battle.acceptedAnswers);
    const pointsEarned = correct ? state.pointsAvailable : 0;
    const result: RoundResult = {
      battleId: battle.id,
      battleName: battle.name,
      userAnswer: input,
      correct,
      pointsEarned,
      hintsUsed: state.cluesRevealed - 1,
    };
    const newIndex = state.currentIndex + 1;
    const finished = newIndex >= state.battles.length;
    set({
      results: [...state.results, result],
      currentIndex: newIndex,
      cluesRevealed: MIN_CLUES,
      pointsAvailable: pointsForClues(MIN_CLUES),
      status: finished ? 'finished' : 'playing',
    });
    return result;
  },
  reset: () => set(initial),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/state/useGameStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/useGameStore.ts src/state/useGameStore.test.ts
git commit -m "feat(state): add useGameStore round state machine"
```

---

**Phase 2 checkpoint.** Logic core is complete and fully tested. Run `npm test` — all phase 1+2 tests should pass.

---

## Phase 3 — Design system

### Task 8: Install motion + fonts

**Files:** `package.json`, `App.tsx`

- [ ] **Step 1: Install**

```bash
npx expo install react-native-reanimated react-native-gesture-handler expo-haptics expo-font @expo-google-fonts/inter @expo-google-fonts/fraunces
```

- [ ] **Step 2: Configure Reanimated**

Add to top of `babel.config.js` plugins array (or create the file if missing):

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // must be last
  };
};
```

- [ ] **Step 3: Verify metro starts cleanly**

Run: `npx expo start --clear` (Ctrl+C after the bundler builds successfully).
Expected: bundler builds with no Reanimated warnings.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json babel.config.js
git commit -m "chore(deps): add reanimated, gesture handler, haptics, fonts"
```

---

### Task 9: Design tokens

**Files:** Create `src/design/tokens.ts`

- [ ] **Step 1: Implement**

```ts
// src/design/tokens.ts
export const colors = {
  ink: '#0E1B2C',
  inkSoft: '#1A2A40',
  parchment: '#F2E8D5',
  parchmentDim: '#C9BFA8',
  bronze: '#C8923B',
  bronzeDeep: '#8E6321',
  victory: '#3FAE7B',
  defeat: '#D7544A',
  overlay: 'rgba(14,27,44,0.72)',
} as const;

export const spacing = {
  xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radii = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

export const type = {
  display: { fontFamily: 'Fraunces_700Bold', fontSize: 32, lineHeight: 38 },
  title:   { fontFamily: 'Fraunces_700Bold', fontSize: 24, lineHeight: 28 },
  body:    { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 22 },
  bodyBold:{ fontFamily: 'Inter_700Bold',    fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  button:  { fontFamily: 'Inter_700Bold',    fontSize: 16, lineHeight: 20 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/design/tokens.ts
git commit -m "feat(design): add color/spacing/type tokens"
```

---

### Task 10: Font loader hook

**Files:** Create `src/design/useAppFonts.ts`

- [ ] **Step 1: Implement**

```ts
// src/design/useAppFonts.ts
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces';

export function useAppFonts() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Fraunces_700Bold,
  });
  return loaded;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/design/useAppFonts.ts
git commit -m "feat(design): add font loader hook"
```

---

### Task 11: Base components — Screen, Button, Card, Chip

**Files:** Create files under `src/design/components/`

- [ ] **Step 1: Implement Screen**

```tsx
// src/design/components/Screen.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../tokens';

export function Screen({ children, padded = true, style }: {
  children: React.ReactNode;
  padded?: boolean;
  style?: ViewStyle;
}) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={[padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  padded: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
```

- [ ] **Step 2: Implement Button**

```tsx
// src/design/components/Button.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, type } from '../tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

export function Button({
  label, onPress, variant = 'primary', loading, disabled, leftIcon,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}) {
  const handle = () => {
    if (disabled || loading) return;
    Haptics.selectionAsync();
    onPress();
  };
  const palette = variantStyles[variant];
  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        palette.container,
        pressed && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      <View style={styles.row}>
        {leftIcon}
        {loading ? <ActivityIndicator color={palette.text.color} /> : (
          <Text style={[type.button, palette.text]}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

const variantStyles = {
  primary: {
    container: { backgroundColor: colors.bronze },
    text: { color: colors.ink },
  },
  secondary: {
    container: { backgroundColor: colors.inkSoft, borderWidth: 1, borderColor: colors.bronzeDeep },
    text: { color: colors.parchment },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.parchment },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
```

- [ ] **Step 3: Implement Card**

```tsx
// src/design/components/Card.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, shadow, spacing } from '../tokens';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.inkSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
});
```

- [ ] **Step 4: Implement Chip**

```tsx
// src/design/components/Chip.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../tokens';

export function Chip({ label, tone = 'bronze' }: { label: string; tone?: 'bronze' | 'parchment' }) {
  const bg = tone === 'bronze' ? colors.bronze : colors.parchment;
  const fg = colors.ink;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[type.bodyBold, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
});
```

- [ ] **Step 5: Commit**

```bash
git add src/design/components
git commit -m "feat(design): add Screen, Button, Card, Chip primitives"
```

---

**Phase 3 checkpoint.** Tokens + base components ready. No tests yet (visual work is verified in phase 9).

---

## Phase 4 — Game UI (offline, no auth)

Goal of phase 4: a fully playable era against local data, mounted as the App's only screen for now. We'll wire navigation in phase 8.

### Task 12: BattleHero component

**Files:** Create `src/features/game/BattleHero.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/features/game/BattleHero.tsx
import React from 'react';
import { Image, StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Battle } from '../../types';
import { battleImages } from '../../data/battleImages';
import { Chip } from '../../design/components/Chip';
import { colors, spacing, type } from '../../design/tokens';

export function BattleHero({ battle }: { battle: Battle }) {
  const { width } = useWindowDimensions();
  const height = Math.round(width * 0.62);
  const zoom = useSharedValue(1);

  React.useEffect(() => {
    zoom.value = 1;
    zoom.value = withRepeat(withTiming(1.06, { duration: 6000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [battle.id, zoom]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));
  const source = battleImages[battle.id];
  const yearLabel = battle.year < 0 ? `${Math.abs(battle.year)} BC` : `${battle.year} AD`;

  return (
    <View style={[styles.wrap, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        {source ? (
          <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.inkSoft }]} />
        )}
      </Animated.View>
      <View style={styles.vignette} />
      <View style={styles.chipRow}>
        <Chip label={`Year: ${yearLabel}`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: colors.inkSoft },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderColor: colors.ink,
    borderWidth: 18,
    borderRadius: 8,
    opacity: 0.5,
  },
  chipRow: { position: 'absolute', bottom: spacing.md, left: spacing.md },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/features/game/BattleHero.tsx
git commit -m "feat(game): add BattleHero with Ken-Burns zoom + year chip"
```

---

### Task 13: ClueList component

**Files:** Create `src/features/game/ClueList.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/features/game/ClueList.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../design/components/Card';
import { Button } from '../../design/components/Button';
import { colors, spacing, type } from '../../design/tokens';
import { MAX_CLUES } from '../../game/scoring';

export function ClueList({
  clues, revealed, onReveal,
}: {
  clues: string[];
  revealed: number;
  onReveal: () => void;
}) {
  const visible = clues.slice(0, revealed);
  const canReveal = revealed < MAX_CLUES && revealed < clues.length;

  return (
    <Card style={{ gap: spacing.sm }}>
      {visible.map((c, i) => (
        <Animated.View key={i} entering={FadeInDown.duration(220).delay(i * 60)}>
          <View style={styles.row}>
            <Text style={[type.bodyBold, styles.num]}>{i + 1}.</Text>
            <Text style={[type.body, styles.text]}>{c}</Text>
          </View>
        </Animated.View>
      ))}
      {canReveal && (
        <Button label="Reveal another clue (-2 pts)" variant="secondary" onPress={onReveal} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  num: { color: colors.bronze, width: 22 },
  text: { color: colors.parchment, flex: 1 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/features/game/ClueList.tsx
git commit -m "feat(game): add ClueList with staggered reveal"
```

---

### Task 14: GuessInput component

**Files:** Create `src/features/game/GuessInput.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/features/game/GuessInput.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../design/components/Button';
import { colors, radii, spacing, type } from '../../design/tokens';

export function GuessInput({
  pointsAvailable, onSubmit, disabled,
}: {
  pointsAvailable: number;
  onSubmit: (guess: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Name the battle…"
        placeholderTextColor={colors.parchmentDim}
        editable={!disabled}
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType="send"
        onSubmitEditing={submit}
        style={styles.input}
      />
      <Button label="Submit" onPress={submit} disabled={disabled || !value.trim()} />
      <Text style={[type.caption, styles.points]}>Points available: {pointsAvailable}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.inkSoft,
    color: colors.parchment,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.bronzeDeep,
  },
  points: { color: colors.parchmentDim, textAlign: 'center' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/features/game/GuessInput.tsx
git commit -m "feat(game): add GuessInput with submit and points indicator"
```

---

### Task 15: ResultBanner overlay

**Files:** Create `src/features/game/ResultBanner.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/features/game/ResultBanner.tsx
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RoundResult } from '../../types';
import { colors, radii, spacing, type } from '../../design/tokens';

export function ResultBanner({
  result, correctName, onContinue,
}: {
  result: RoundResult;
  correctName: string;
  onContinue: () => void;
}) {
  const tone = result.correct ? colors.victory : colors.defeat;
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.overlay}>
      <Pressable style={styles.card} onPress={onContinue}>
        <View style={[styles.tag, { backgroundColor: tone }]}>
          <Text style={[type.bodyBold, { color: colors.ink }]}>
            {result.correct ? 'Correct!' : 'Incorrect'}
          </Text>
        </View>
        <Text style={[type.title, styles.name]}>{correctName}</Text>
        <Text style={[type.body, styles.points]}>
          {result.correct ? `+${result.pointsEarned} points` : 'Better luck next time'}
        </Text>
        <Text style={[type.caption, styles.tap]}>Tap to continue</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.inkSoft, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.sm, alignItems: 'center' },
  tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill },
  name: { color: colors.parchment, textAlign: 'center' },
  points: { color: colors.parchment },
  tap: { color: colors.parchmentDim, marginTop: spacing.md },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/features/game/ResultBanner.tsx
git commit -m "feat(game): add ResultBanner with correct/incorrect overlay"
```

---

### Task 16: RoundScreen — wire it all together

**Files:**
- Create: `src/features/game/RoundScreen.tsx`
- Test: `src/features/game/RoundScreen.test.tsx`

- [ ] **Step 1: Install testing library**

```bash
npm install --save-dev @testing-library/react-native
```

- [ ] **Step 2: Write failing component test**

```tsx
// src/features/game/RoundScreen.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoundScreen } from './RoundScreen';
import { useGameStore } from '../../state/useGameStore';
import { Battle } from '../../types';

const battles: Battle[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1, name: `Battle ${i + 1}`, civilization: 'ancient-greece-rome',
  acceptedAnswers: [`Battle ${i + 1}`], prompt: '',
  hints: ['Hint A', 'Hint B', 'Hint C', 'Hint D'],
  difficulty: 'easy', year: -490, location: '', description: '',
}));

beforeEach(() => {
  useGameStore.getState().reset();
  useGameStore.getState().startRound('ancient', battles);
});

describe('RoundScreen', () => {
  it('shows year chip and one initial clue', () => {
    const { getByText, queryByText } = render(<RoundScreen onFinished={() => {}} />);
    expect(getByText(/Year:/)).toBeTruthy();
    expect(getByText('Hint A')).toBeTruthy();
    expect(queryByText('Hint B')).toBeNull();
  });

  it('reveals additional clues and reduces points', () => {
    const { getByText } = render(<RoundScreen onFinished={() => {}} />);
    fireEvent.press(getByText(/Reveal another clue/));
    expect(getByText('Hint B')).toBeTruthy();
    expect(getByText('Points available: 8')).toBeTruthy();
  });

  it('correct guess advances; wrong guess shows the answer', () => {
    const { getByPlaceholderText, getByText } = render(<RoundScreen onFinished={() => {}} />);
    fireEvent.changeText(getByPlaceholderText('Name the battle…'), 'Battle 1');
    fireEvent.press(getByText('Submit'));
    expect(getByText('Correct!')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/features/game/RoundScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement RoundScreen**

```tsx
// src/features/game/RoundScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { BattleHero } from './BattleHero';
import { ClueList } from './ClueList';
import { GuessInput } from './GuessInput';
import { ResultBanner } from './ResultBanner';
import { useGameStore } from '../../state/useGameStore';
import { spacing } from '../../design/tokens';
import * as Haptics from 'expo-haptics';
import { RoundResult } from '../../types';

export function RoundScreen({ onFinished }: { onFinished: () => void }) {
  const { battles, currentIndex, cluesRevealed, pointsAvailable, revealClue, submitGuess, status } = useGameStore();
  const [pendingResult, setPendingResult] = useState<RoundResult | null>(null);

  const battle = battles[currentIndex];
  if (!battle) return null;

  const handleSubmit = (guess: string) => {
    const result = submitGuess(guess);
    Haptics.notificationAsync(
      result.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    setPendingResult(result);
  };

  const handleContinue = () => {
    setPendingResult(null);
    if (status === 'finished') onFinished();
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <BattleHero battle={battle} />
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <ClueList clues={battle.hints} revealed={cluesRevealed} onReveal={revealClue} />
          <GuessInput
            pointsAvailable={pointsAvailable}
            onSubmit={handleSubmit}
            disabled={!!pendingResult}
          />
        </View>
      </ScrollView>
      {pendingResult && (
        <ResultBanner result={pendingResult} correctName={battle.name} onContinue={handleContinue} />
      )}
    </Screen>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/features/game/RoundScreen.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/game src/features/game/RoundScreen.test.tsx package.json package-lock.json
git commit -m "feat(game): wire RoundScreen with hero, clues, input, result banner"
```

---

### Task 17: EraSummary screen

**Files:** Create `src/features/game/EraSummary.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/features/game/EraSummary.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { Button } from '../../design/components/Button';
import { Card } from '../../design/components/Card';
import { colors, spacing, type } from '../../design/tokens';
import { useGameStore } from '../../state/useGameStore';
import { eraUnlockThreshold, battlesPerEra } from '../../game/scoring';
import { ERAS, EraId } from '../../data/eras';

export function EraSummary({ eraId, onContinue, onRetry }: {
  eraId: EraId;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const results = useGameStore(s => s.results);
  const correct = results.filter(r => r.correct).length;
  const points = results.reduce((sum, r) => sum + r.pointsEarned, 0);
  const passed = correct >= eraUnlockThreshold;
  const era = ERAS.find(e => e.id === eraId)!;

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={[type.display, { color: colors.parchment, textAlign: 'center' }]}>
          {era.label}
        </Text>
        <Card style={styles.scoreCard}>
          <Text style={[type.title, { color: passed ? colors.victory : colors.defeat, textAlign: 'center' }]}>
            {correct} / {battlesPerEra}
          </Text>
          <Text style={[type.body, { color: colors.parchment, textAlign: 'center' }]}>
            {points} points
          </Text>
          {passed ? (
            <Text style={[type.bodyBold, { color: colors.bronze, textAlign: 'center' }]}>
              Next era unlocked!
            </Text>
          ) : (
            <Text style={[type.body, { color: colors.parchmentDim, textAlign: 'center' }]}>
              Need {eraUnlockThreshold} correct to unlock the next era.
            </Text>
          )}
        </Card>
        {passed
          ? <Button label="Continue" onPress={onContinue} />
          : <Button label="Try again" onPress={onRetry} />
        }
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  scoreCard: { gap: spacing.sm, alignItems: 'stretch' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/features/game/EraSummary.tsx
git commit -m "feat(game): add EraSummary screen"
```

---

**Phase 4 checkpoint.** Game UI is complete. RoundScreen tests green. Verify visually with a temporary App.tsx mount, then move on.

---

## Phase 5 — Path screen & era completion

### Task 18: EraMedallion component

**Files:** Create `src/features/progress/EraMedallion.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/features/progress/EraMedallion.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Era } from '../../data/eras';
import { colors, radii, spacing, type } from '../../design/tokens';

export type EraStatus = 'locked' | 'current' | 'completed';

export function EraMedallion({
  era, status, score, onPress,
}: {
  era: Era;
  status: EraStatus;
  score?: { correct: number; points: number };
  onPress?: () => void;
}) {
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    if (status === 'current') {
      pulse.value = withRepeat(withTiming(1.06, { duration: 1100 }), -1, true);
    } else {
      pulse.value = 1;
    }
  }, [status, pulse]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const palette = {
    locked: { bg: colors.inkSoft, fg: colors.parchmentDim, ring: '#3A4358' },
    current: { bg: colors.bronze, fg: colors.ink, ring: colors.bronze },
    completed: { bg: colors.inkSoft, fg: colors.parchment, ring: colors.bronze },
  }[status];

  return (
    <Pressable onPress={onPress} disabled={status === 'locked'} style={styles.container}>
      <Animated.View style={[styles.disc, { backgroundColor: palette.bg, borderColor: palette.ring }, animStyle]}>
        <Text style={[type.bodyBold, { color: palette.fg, textAlign: 'center' }]}>
          {era.label}
        </Text>
        {status === 'completed' && score && (
          <Text style={[type.caption, { color: colors.bronze }]}>{score.correct}/10 · {score.points} pts</Text>
        )}
        {status === 'locked' && (
          <Text style={[type.caption, { color: palette.fg }]}>Locked</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: spacing.md },
  disc: {
    width: 220, height: 220,
    borderRadius: radii.pill,
    borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: 4,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/features/progress/EraMedallion.tsx
git commit -m "feat(progress): add EraMedallion with locked/current/completed states"
```

---

### Task 19: PathScreen

**Files:**
- Create: `src/features/progress/PathScreen.tsx`
- Test: `src/features/progress/PathScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/progress/PathScreen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { PathScreen } from './PathScreen';
import { useProgressStore } from '../../state/useProgressStore';

beforeEach(() => useProgressStore.getState().reset());

describe('PathScreen', () => {
  it('renders all 8 eras with the first as current and rest as locked', () => {
    const { getAllByText } = render(<PathScreen onStartEra={() => {}} />);
    expect(getAllByText('Locked').length).toBe(7);
  });

  it('shows completed score when era was completed', () => {
    useProgressStore.getState().completeEra('ancient', { correct: 8, points: 64 });
    const { getByText } = render(<PathScreen onStartEra={() => {}} />);
    expect(getByText('8/10 · 64 pts')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/progress/PathScreen.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
// src/features/progress/PathScreen.tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { ERAS, EraId } from '../../data/eras';
import { useProgressStore } from '../../state/useProgressStore';
import { EraMedallion, EraStatus } from './EraMedallion';
import { colors, spacing, type } from '../../design/tokens';

export function PathScreen({ onStartEra }: { onStartEra: (id: EraId) => void }) {
  const { totalPoints, unlockedEras, currentEra, eraScores } = useProgressStore();

  const statusFor = (id: EraId): EraStatus => {
    if (eraScores[id]) return 'completed';
    if (id === currentEra && unlockedEras.includes(id)) return 'current';
    return 'locked';
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[type.caption, { color: colors.parchmentDim }]}>Total points</Text>
        <Text style={[type.display, { color: colors.bronze }]}>{totalPoints}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg }}>
        {ERAS.map(era => (
          <EraMedallion
            key={era.id}
            era={era}
            status={statusFor(era.id)}
            score={eraScores[era.id]}
            onPress={() => onStartEra(era.id)}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: spacing.md },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/progress/PathScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/progress
git commit -m "feat(progress): add PathScreen with era medallions"
```

---

### Task 20: Era completion glue (offline only — Firestore wiring in phase 6)

**Files:** Create `src/features/game/useEraCompletion.ts`

- [ ] **Step 1: Implement**

```ts
// src/features/game/useEraCompletion.ts
import { useGameStore } from '../../state/useGameStore';
import { useProgressStore } from '../../state/useProgressStore';
import { EraId } from '../../data/eras';

export function useEraCompletion() {
  return (eraId: EraId) => {
    const results = useGameStore.getState().results;
    const correct = results.filter(r => r.correct).length;
    const points = results.reduce((sum, r) => sum + r.pointsEarned, 0);
    useProgressStore.getState().completeEra(eraId, { correct, points });
    return { correct, points };
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/game/useEraCompletion.ts
git commit -m "feat(game): wire round results into useProgressStore"
```

---

**Phase 5 checkpoint.** Path screen renders, lock/unlock states work, era completion updates progress locally. Tests green.

---

## Phase 6 — Firebase + auth

### Task 21: Firebase project setup (manual)

**Files:** `app.json`, `src/services/firebase.ts`, `.env`, `eas.json`

- [ ] **Step 1: Create the Firebase project (manual)**

In the Firebase console:
1. Create a project named "military-history-app".
2. Enable **Authentication** → providers Google, Apple, Email/Password.
3. Enable **Firestore** in production mode, region of your choice.
4. Add Android app (package `com.example.militaryhistoryapp`) and download `google-services.json`.
5. Add iOS app (bundle `com.example.militaryhistoryapp`) and download `GoogleService-Info.plist`.
6. In Authentication settings, copy the **Web client ID** (used for Credential Manager Google sign-in).

- [ ] **Step 2: Install Firebase deps**

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore expo-build-properties
npm install firebase
```

- [ ] **Step 3: Configure app.json**

Replace `app.json` `expo` block with native config additions (preserve existing fields):

```json
{
  "expo": {
    "name": "Military History",
    "slug": "military-history-app",
    "scheme": "mhg",
    "ios": {
      "bundleIdentifier": "com.example.militaryhistoryapp",
      "googleServicesFile": "./GoogleService-Info.plist",
      "usesAppleSignIn": true
    },
    "android": {
      "package": "com.example.militaryhistoryapp",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app",
      ["@react-native-firebase/auth"],
      ["expo-build-properties", { "ios": { "useFrameworks": "static" } }],
      "expo-apple-authentication"
    ]
  }
}
```

- [ ] **Step 4: Place service files at project root**

Drop `google-services.json` and `GoogleService-Info.plist` at the repo root. Add both to `.gitignore`:

```
google-services.json
GoogleService-Info.plist
```

- [ ] **Step 5: Add .env with Web Client ID**

Create `.env`:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_HERE
```

Add `.env` to `.gitignore`.

- [ ] **Step 6: Configure eas.json for dev client builds**

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": true }
    },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

- [ ] **Step 7: Implement firebase service init**

```ts
// src/services/firebase.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const firebaseAuth = auth;
export const firebaseDb = firestore;
```

- [ ] **Step 8: Commit**

```bash
git add app.json eas.json .gitignore src/services/firebase.ts package.json package-lock.json
git commit -m "chore(firebase): add Firebase native modules and config"
```

---

### Task 22: User profile service

**Files:**
- Create: `src/services/userProfile.ts`
- Test: `src/services/userProfile.test.ts`

- [ ] **Step 1: Write failing tests (Firestore mocked)**

```ts
// src/services/userProfile.test.ts
jest.mock('@react-native-firebase/firestore', () => {
  const docMock = { get: jest.fn(), set: jest.fn(), update: jest.fn() };
  const collMock = { doc: jest.fn(() => docMock) };
  const fn: any = jest.fn(() => ({ collection: jest.fn(() => collMock) }));
  fn.FieldValue = { serverTimestamp: () => 'TS' };
  return { __esModule: true, default: fn, _doc: docMock };
});

import { ensureUserProfile, fetchUserProfile } from './userProfile';
import firestore from '@react-native-firebase/firestore';
const docMock = (firestore as any)._doc;

beforeEach(() => jest.clearAllMocks());

describe('ensureUserProfile', () => {
  it('creates profile when none exists', async () => {
    docMock.get.mockResolvedValueOnce({ exists: false });
    await ensureUserProfile({ uid: 'u1', displayName: 'Tom', photoURL: null });
    expect(docMock.set).toHaveBeenCalledWith(expect.objectContaining({
      displayName: 'Tom', totalPoints: 0, unlockedEras: ['ancient'], currentEra: 'ancient',
    }));
  });

  it('does not overwrite existing profile', async () => {
    docMock.get.mockResolvedValueOnce({ exists: true });
    await ensureUserProfile({ uid: 'u1', displayName: 'Tom', photoURL: null });
    expect(docMock.set).not.toHaveBeenCalled();
  });
});

describe('fetchUserProfile', () => {
  it('returns null when missing', async () => {
    docMock.get.mockResolvedValueOnce({ exists: false });
    expect(await fetchUserProfile('u1')).toBeNull();
  });
  it('returns parsed data when present', async () => {
    docMock.get.mockResolvedValueOnce({ exists: true, data: () => ({
      displayName: 'Tom', photoURL: null, totalPoints: 50,
      unlockedEras: ['ancient'], currentEra: 'ancient', eraScores: {},
    }) });
    const p = await fetchUserProfile('u1');
    expect(p?.totalPoints).toBe(50);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/services/userProfile.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/services/userProfile.ts
import firestore from '@react-native-firebase/firestore';
import { EraId } from '../data/eras';
import { EraScore } from '../state/useProgressStore';

export interface UserProfile {
  displayName: string;
  photoURL: string | null;
  totalPoints: number;
  unlockedEras: EraId[];
  currentEra: EraId;
  eraScores: Partial<Record<EraId, EraScore>>;
}

const usersCol = () => firestore().collection('users');

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await usersCol().doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as UserProfile;
}

export async function ensureUserProfile(args: { uid: string; displayName: string; photoURL: string | null }) {
  const ref = usersCol().doc(args.uid);
  const snap = await ref.get();
  if (snap.exists) return;
  await ref.set({
    displayName: args.displayName,
    photoURL: args.photoURL,
    totalPoints: 0,
    unlockedEras: ['ancient'],
    currentEra: 'ancient',
    eraScores: {},
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/services/userProfile.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/userProfile.ts src/services/userProfile.test.ts
git commit -m "feat(services): add userProfile service with create/fetch"
```

---

### Task 23: Era completion transaction (Firestore)

**Files:**
- Create: `src/services/eraCompletion.ts`
- Test: `src/services/eraCompletion.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/eraCompletion.test.ts
const txOps = { update: jest.fn(), set: jest.fn(), get: jest.fn() };
const runTx = jest.fn(async (cb: any) => cb(txOps));

jest.mock('@react-native-firebase/firestore', () => {
  const userDoc = { id: 'u1' };
  const scoresDoc = { id: 'auto' };
  const userCol = { doc: jest.fn(() => userDoc) };
  const scoresCol = { doc: jest.fn(() => scoresDoc) };
  const fn: any = jest.fn(() => ({
    collection: jest.fn((c: string) => c === 'users' ? userCol : scoresCol),
    runTransaction: runTx,
  }));
  fn.FieldValue = { serverTimestamp: () => 'TS', arrayUnion: (...v: any[]) => ({ arrayUnion: v }) };
  return { __esModule: true, default: fn };
});

import { commitEraCompletion } from './eraCompletion';

beforeEach(() => { txOps.update.mockReset(); txOps.set.mockReset(); txOps.get.mockReset(); runTx.mockClear(); });

it('writes a scores doc and updates user totals on pass', async () => {
  txOps.get.mockResolvedValueOnce({ data: () => ({ totalPoints: 0, unlockedEras: ['ancient'], eraScores: {} }) });
  await commitEraCompletion({
    uid: 'u1', displayName: 'Tom', photoURL: null,
    eraId: 'ancient', correct: 8, points: 64,
  });
  expect(txOps.set).toHaveBeenCalled();
  expect(txOps.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
    totalPoints: 64,
  }));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/services/eraCompletion.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/services/eraCompletion.ts
import firestore from '@react-native-firebase/firestore';
import { EraId, NEXT_ERA } from '../data/eras';
import { eraUnlockThreshold } from '../game/scoring';
import { weekKey } from '../utils/weekKey';

export async function commitEraCompletion(args: {
  uid: string; displayName: string; photoURL: string | null;
  eraId: EraId; correct: number; points: number;
}) {
  const db = firestore();
  const userRef = db.collection('users').doc(args.uid);
  const scoreRef = db.collection('scores').doc();
  await db.runTransaction(async tx => {
    const snap = await tx.get(userRef);
    const data = (snap.data() ?? { totalPoints: 0, unlockedEras: ['ancient'], eraScores: {} }) as any;
    const prev = data.eraScores?.[args.eraId];
    const isBetter = !prev || args.points > prev.points;
    const points = isBetter ? args.points : prev.points;
    const correct = isBetter ? args.correct : prev.correct;
    const next = NEXT_ERA[args.eraId];
    const passed = args.correct >= eraUnlockThreshold;
    const unlockedEras = passed && next && !data.unlockedEras.includes(next)
      ? [...data.unlockedEras, next] : data.unlockedEras;
    const currentEra = passed && next ? next : data.eraId ?? 'ancient';
    const totalPoints = (data.totalPoints ?? 0) + (points - (prev?.points ?? 0));
    tx.update(userRef, {
      totalPoints, unlockedEras, currentEra,
      [`eraScores.${args.eraId}`]: { correct, points },
    });
    tx.set(scoreRef, {
      uid: args.uid, displayName: args.displayName, photoURL: args.photoURL,
      eraId: args.eraId, pointsEarned: args.points, correctCount: args.correct,
      attemptedAt: firestore.FieldValue.serverTimestamp(),
      weekKey: weekKey(),
    });
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/services/eraCompletion.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/eraCompletion.ts src/services/eraCompletion.test.ts
git commit -m "feat(services): add atomic era completion transaction"
```

---

### Task 24: useAuth hook

**Files:** Create `src/features/auth/useAuth.ts`

- [ ] **Step 1: Implement**

```ts
// src/features/auth/useAuth.ts
import { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { ensureUserProfile, fetchUserProfile } from '../../services/userProfile';
import { useProgressStore } from '../../state/useProgressStore';

export function useAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(auth().currentUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return auth().onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await ensureUserProfile({
          uid: u.uid,
          displayName: u.displayName ?? u.email?.split('@')[0] ?? 'Player',
          photoURL: u.photoURL,
        });
        const profile = await fetchUserProfile(u.uid);
        if (profile) useProgressStore.getState().hydrate({
          totalPoints: profile.totalPoints,
          unlockedEras: profile.unlockedEras,
          currentEra: profile.currentEra,
          eraScores: profile.eraScores,
        });
      } else {
        useProgressStore.getState().reset();
      }
      setInitializing(false);
    });
  }, []);

  return { user, initializing, signOut: () => auth().signOut() };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/auth/useAuth.ts
git commit -m "feat(auth): add useAuth hook with profile hydration"
```

---

### Task 25: Apple Sign-In hook (iOS)

**Files:** Create `src/features/auth/useAppleAuth.ts`

- [ ] **Step 1: Implement**

```ts
// src/features/auth/useAppleAuth.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

export async function signInWithApple() {
  if (Platform.OS !== 'ios') throw new Error('Apple Sign-In is iOS-only');
  const rawNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${Date.now()}-${Math.random()}`,
  );
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: rawNonce,
  });
  if (!credential.identityToken) throw new Error('No identity token from Apple');
  const fbCredential = auth.AppleAuthProvider.credential(credential.identityToken, rawNonce);
  return auth().signInWithCredential(fbCredential);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/auth/useAppleAuth.ts
git commit -m "feat(auth): add Apple Sign-In hook for iOS"
```

---

### Task 26: Android Credential Manager native module (Expo config plugin)

**Files:**
- Create: `plugins/credential-manager/index.js` (Expo config plugin)
- Create: `plugins/credential-manager/CredentialManagerModule.kt`
- Create: `plugins/credential-manager/CredentialManagerPackage.kt`
- Create: `src/features/auth/useCredentialManager.ts`
- Modify: `app.json` plugins array

- [ ] **Step 1: Write the JS hook**

```ts
// src/features/auth/useCredentialManager.ts
import { NativeModules, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';

type GoogleCredentialResult = {
  type: 'google';
  idToken: string;
};
type PasswordCredentialResult = {
  type: 'password';
  username: string;
  password: string;
};
type CredentialResult = GoogleCredentialResult | PasswordCredentialResult;

export async function signInWithCredentialManager(): Promise<void> {
  if (Platform.OS !== 'android') throw new Error('Credential Manager is Android-only');
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
  const result: CredentialResult = await NativeModules.CredentialManager.getCredential({
    googleWebClientId: webClientId,
  });
  if (result.type === 'google') {
    const cred = auth.GoogleAuthProvider.credential(result.idToken);
    await auth().signInWithCredential(cred);
  } else {
    await auth().signInWithEmailAndPassword(result.username, result.password);
  }
}
```

- [ ] **Step 2: Write the Kotlin module**

```kotlin
// plugins/credential-manager/CredentialManagerModule.kt
package com.example.militaryhistoryapp.credentialmanager

import android.app.Activity
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPasswordOption
import androidx.credentials.PasswordCredential
import com.facebook.react.bridge.*
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class CredentialManagerModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "CredentialManager"

  @ReactMethod
  fun getCredential(options: ReadableMap, promise: Promise) {
    val activity: Activity = currentActivity ?: return promise.reject("NO_ACTIVITY", "No activity")
    val webClientId = options.getString("googleWebClientId")
      ?: return promise.reject("BAD_ARGS", "googleWebClientId required")

    val google = GetGoogleIdOption.Builder()
      .setServerClientId(webClientId)
      .setFilterByAuthorizedAccounts(false)
      .build()
    val password = GetPasswordOption()

    val request = GetCredentialRequest.Builder()
      .addCredentialOption(google)
      .addCredentialOption(password)
      .build()

    val cm = CredentialManager.create(activity)
    CoroutineScope(Dispatchers.Main).launch {
      try {
        val response = cm.getCredential(activity, request)
        when (val cred = response.credential) {
          is GoogleIdTokenCredential -> {
            val out = Arguments.createMap()
            out.putString("type", "google")
            out.putString("idToken", cred.idToken)
            promise.resolve(out)
          }
          is PasswordCredential -> {
            val out = Arguments.createMap()
            out.putString("type", "password")
            out.putString("username", cred.id)
            out.putString("password", cred.password)
            promise.resolve(out)
          }
          else -> promise.reject("UNSUPPORTED", "Unsupported credential type")
        }
      } catch (e: Exception) {
        promise.reject("CM_ERROR", e.message, e)
      }
    }
  }
}
```

- [ ] **Step 3: Write the package class**

```kotlin
// plugins/credential-manager/CredentialManagerPackage.kt
package com.example.militaryhistoryapp.credentialmanager

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class CredentialManagerPackage : ReactPackage {
  override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
    listOf(CredentialManagerModule(ctx))
  override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
```

- [ ] **Step 4: Write the Expo config plugin**

```js
// plugins/credential-manager/index.js
const { withProjectBuildGradle, withAppBuildGradle, withMainApplication, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SRC_FILES = ['CredentialManagerModule.kt', 'CredentialManagerPackage.kt'];

function copyKotlinSources(config) {
  return withDangerousMod(config, ['android', async (cfg) => {
    const pkgPath = path.join(
      cfg.modRequest.platformProjectRoot,
      'app/src/main/java/com/example/militaryhistoryapp/credentialmanager',
    );
    fs.mkdirSync(pkgPath, { recursive: true });
    for (const file of SRC_FILES) {
      const dest = path.join(pkgPath, file);
      const src = path.join(__dirname, file);
      fs.copyFileSync(src, dest);
    }
    return cfg;
  }]);
}

function addDependencies(config) {
  return withAppBuildGradle(config, (cfg) => {
    const dep = `    implementation "androidx.credentials:credentials:1.3.0"
    implementation "androidx.credentials:credentials-play-services-auth:1.3.0"
    implementation "com.google.android.libraries.identity.googleid:googleid:1.1.1"`;
    if (!cfg.modResults.contents.includes('androidx.credentials:credentials')) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /dependencies \{/,
        `dependencies {\n${dep}`,
      );
    }
    return cfg;
  });
}

function registerPackage(config) {
  return withMainApplication(config, (cfg) => {
    const importLine = 'import com.example.militaryhistoryapp.credentialmanager.CredentialManagerPackage';
    const addLine = 'packages.add(CredentialManagerPackage())';
    if (!cfg.modResults.contents.includes(importLine)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /package com\.example\.militaryhistoryapp/,
        `package com.example.militaryhistoryapp\n${importLine}`,
      );
    }
    if (!cfg.modResults.contents.includes(addLine)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /val packages = PackageList\(this\)\.packages/,
        `val packages = PackageList(this).packages\n        ${addLine}`,
      );
    }
    return cfg;
  });
}

module.exports = function withCredentialManager(config) {
  config = copyKotlinSources(config);
  config = addDependencies(config);
  config = registerPackage(config);
  return config;
};
```

- [ ] **Step 5: Register the plugin in app.json**

In `app.json` `expo.plugins` array, append `"./plugins/credential-manager"`.

- [ ] **Step 6: Build the dev client**

```bash
eas build --profile development --platform android
```

Expected: build succeeds. Install the APK on a real device or emulator with Google Play Services.

- [ ] **Step 7: Commit**

```bash
git add plugins/credential-manager src/features/auth/useCredentialManager.ts app.json
git commit -m "feat(auth): add Android Credential Manager native module + plugin"
```

---

### Task 27: Email fallback hook + form

**Files:** Create `src/features/auth/useEmailAuth.ts`, `src/features/auth/EmailAuthForm.tsx`

- [ ] **Step 1: Install form deps**

```bash
npm install react-hook-form zod @hookform/resolvers
```

- [ ] **Step 2: Implement hook**

```ts
// src/features/auth/useEmailAuth.ts
import auth from '@react-native-firebase/auth';

export async function emailSignIn(email: string, password: string) {
  return auth().signInWithEmailAndPassword(email, password);
}

export async function emailSignUp(email: string, password: string, displayName: string) {
  const cred = await auth().createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName });
  return cred;
}
```

- [ ] **Step 3: Implement form**

```tsx
// src/features/auth/EmailAuthForm.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../design/components/Button';
import { colors, radii, spacing, type } from '../../design/tokens';
import { emailSignIn, emailSignUp } from './useEmailAuth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).optional(),
});
type FormValues = z.infer<typeof schema>;

export function EmailAuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setBusy(true); setError(null);
    try {
      if (mode === 'signup') await emailSignUp(values.email, values.password, values.displayName ?? values.email.split('@')[0]);
      else await emailSignIn(values.email, values.password);
    } catch (e: any) {
      setError(e.message ?? 'Sign-in failed');
    } finally { setBusy(false); }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {mode === 'signup' && (
        <Controller
          control={control} name="displayName"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} placeholder="Display name"
              placeholderTextColor={colors.parchmentDim} value={value ?? ''} onChangeText={onChange} />
          )}
        />
      )}
      <Controller
        control={control} name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address"
            placeholderTextColor={colors.parchmentDim} value={value ?? ''} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control} name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="Password" secureTextEntry
            placeholderTextColor={colors.parchmentDim} value={value ?? ''} onChangeText={onChange} />
        )}
      />
      {(errors.email || errors.password) && (
        <Text style={[type.caption, { color: colors.defeat }]}>Check your email & password.</Text>
      )}
      {error && <Text style={[type.caption, { color: colors.defeat }]}>{error}</Text>}
      <Button label={mode === 'signup' ? 'Create account' : 'Sign in'} onPress={handleSubmit(onSubmit)} loading={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.inkSoft, color: colors.parchment,
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderWidth: 1, borderColor: colors.bronzeDeep, fontSize: 16,
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add src/features/auth package.json package-lock.json
git commit -m "feat(auth): add email/password fallback form"
```

---

### Task 28: SignInScreen

**Files:** Create `src/features/auth/SignInScreen.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/features/auth/SignInScreen.tsx
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Screen } from '../../design/components/Screen';
import { Button } from '../../design/components/Button';
import { colors, spacing, type } from '../../design/tokens';
import { signInWithApple } from './useAppleAuth';
import { signInWithCredentialManager } from './useCredentialManager';
import { EmailAuthForm } from './EmailAuthForm';

export function SignInScreen() {
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    try { await signInWithCredentialManager(); }
    catch (e: any) { if (e.code !== 'CM_ERROR') setError(e.message); }
  };
  const handleApple = async () => {
    try { await signInWithApple(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <Screen>
      <View style={styles.body}>
        <Text style={[type.display, styles.title]}>Sign in to play</Text>
        {Platform.OS === 'android' && (
          <Button label="Sign in with Google" onPress={handleGoogle} />
        )}
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={20}
            style={{ height: 52 }}
            onPress={handleApple}
          />
        )}
        <Button label={showEmail ? 'Hide email form' : 'or use email'} variant="ghost" onPress={() => setShowEmail(v => !v)} />
        {showEmail && (
          <View style={{ gap: spacing.sm }}>
            <EmailAuthForm mode={mode} />
            <Button
              label={mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
              variant="ghost"
              onPress={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
            />
          </View>
        )}
        {error && <Text style={[type.caption, { color: colors.defeat }]}>{error}</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', gap: spacing.md },
  title: { color: colors.parchment, textAlign: 'center', marginBottom: spacing.lg },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/features/auth/SignInScreen.tsx
git commit -m "feat(auth): add SignInScreen with platform-specific providers"
```

---

**Phase 6 checkpoint.** Auth services are wired and the sign-in UI is present. Manual verification on a dev client build is required for Credential Manager and Apple. Service-level tests are green.

---

## Phase 7 — Leaderboards

### Task 29: Leaderboard service

**Files:**
- Create: `src/services/leaderboard.ts`
- Test: `src/services/leaderboard.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/services/leaderboard.test.ts
const usersGet = jest.fn();
const scoresGet = jest.fn();
const userOrderBy = jest.fn(() => ({ limit: jest.fn(() => ({ get: usersGet })) }));
const scoresWhere = jest.fn(() => ({ get: scoresGet }));

jest.mock('@react-native-firebase/firestore', () => {
  const fn: any = jest.fn(() => ({
    collection: jest.fn((name: string) => name === 'users'
      ? { orderBy: userOrderBy }
      : { where: scoresWhere }),
  }));
  return { __esModule: true, default: fn };
});

import { fetchAllTimeTop, fetchWeeklyTop } from './leaderboard';

beforeEach(() => { usersGet.mockReset(); scoresGet.mockReset(); });

it('fetchAllTimeTop returns mapped rows', async () => {
  usersGet.mockResolvedValueOnce({
    docs: [
      { id: 'u1', data: () => ({ displayName: 'A', photoURL: null, totalPoints: 90 }) },
      { id: 'u2', data: () => ({ displayName: 'B', photoURL: null, totalPoints: 50 }) },
    ],
  });
  const rows = await fetchAllTimeTop(100);
  expect(rows).toEqual([
    { uid: 'u1', displayName: 'A', photoURL: null, points: 90 },
    { uid: 'u2', displayName: 'B', photoURL: null, points: 50 },
  ]);
});

it('fetchWeeklyTop aggregates scores by uid', async () => {
  scoresGet.mockResolvedValueOnce({
    docs: [
      { data: () => ({ uid: 'u1', displayName: 'A', photoURL: null, pointsEarned: 10 }) },
      { data: () => ({ uid: 'u1', displayName: 'A', photoURL: null, pointsEarned: 20 }) },
      { data: () => ({ uid: 'u2', displayName: 'B', photoURL: null, pointsEarned: 25 }) },
    ],
  });
  const rows = await fetchWeeklyTop(100);
  expect(rows[0]).toEqual({ uid: 'u1', displayName: 'A', photoURL: null, points: 30 });
  expect(rows[1]).toEqual({ uid: 'u2', displayName: 'B', photoURL: null, points: 25 });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/services/leaderboard.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/services/leaderboard.ts
import firestore from '@react-native-firebase/firestore';
import { weekKey } from '../utils/weekKey';

export interface LeaderboardRow {
  uid: string;
  displayName: string;
  photoURL: string | null;
  points: number;
}

export async function fetchAllTimeTop(limit: number): Promise<LeaderboardRow[]> {
  const snap = await firestore().collection('users').orderBy('totalPoints', 'desc').limit(limit).get();
  return snap.docs.map(d => {
    const data = d.data() as any;
    return { uid: d.id, displayName: data.displayName, photoURL: data.photoURL ?? null, points: data.totalPoints ?? 0 };
  });
}

export async function fetchWeeklyTop(limit: number): Promise<LeaderboardRow[]> {
  const snap = await firestore().collection('scores').where('weekKey', '==', weekKey()).get();
  const byUid = new Map<string, LeaderboardRow>();
  for (const doc of snap.docs) {
    const d = doc.data() as any;
    const existing = byUid.get(d.uid);
    if (existing) {
      existing.points += d.pointsEarned;
    } else {
      byUid.set(d.uid, {
        uid: d.uid, displayName: d.displayName, photoURL: d.photoURL ?? null, points: d.pointsEarned,
      });
    }
  }
  return Array.from(byUid.values()).sort((a, b) => b.points - a.points).slice(0, limit);
}

export async function fetchUserRank(uid: string, points: number): Promise<number> {
  const snap = await firestore()
    .collection('users')
    .where('totalPoints', '>', points)
    .count()
    .get();
  return snap.data().count + 1;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/services/leaderboard.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/leaderboard.ts src/services/leaderboard.test.ts
git commit -m "feat(services): add leaderboard queries (all-time + weekly)"
```

---

### Task 30: LeaderboardScreen

**Files:** Create `src/features/leaderboard/LeaderboardScreen.tsx`, `src/features/leaderboard/LeaderRow.tsx`

- [ ] **Step 1: Implement row**

```tsx
// src/features/leaderboard/LeaderRow.tsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LeaderboardRow } from '../../services/leaderboard';
import { colors, radii, spacing, type } from '../../design/tokens';

export function LeaderRow({ rank, row, highlight }: { rank: number; row: LeaderboardRow; highlight?: boolean }) {
  return (
    <View style={[styles.row, highlight && styles.highlight]}>
      <Text style={[type.bodyBold, styles.rank]}>{rank}</Text>
      {row.photoURL
        ? <Image source={{ uri: row.photoURL }} style={styles.avatar} />
        : <View style={[styles.avatar, styles.avatarFallback]} />}
      <Text style={[type.body, styles.name]} numberOfLines={1}>{row.displayName}</Text>
      <Text style={[type.bodyBold, styles.pts]}>{row.points}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: spacing.md },
  highlight: { backgroundColor: colors.bronzeDeep, borderRadius: radii.md },
  rank: { color: colors.parchmentDim, width: 32, textAlign: 'right' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { backgroundColor: colors.inkSoft },
  name: { color: colors.parchment, flex: 1 },
  pts: { color: colors.bronze },
});
```

- [ ] **Step 2: Implement screen**

```tsx
// src/features/leaderboard/LeaderboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { fetchAllTimeTop, fetchWeeklyTop, fetchUserRank, LeaderboardRow } from '../../services/leaderboard';
import { LeaderRow } from './LeaderRow';
import { colors, radii, spacing, type } from '../../design/tokens';
import { useAuth } from '../auth/useAuth';
import { useProgressStore } from '../../state/useProgressStore';

type Tab = 'weekly' | 'alltime';

export function LeaderboardScreen() {
  const [tab, setTab] = useState<Tab>('weekly');
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const totalPoints = useProgressStore(s => s.totalPoints);
  const [myRank, setMyRank] = useState<number | null>(null);

  const load = async () => {
    setRefreshing(true);
    const data = tab === 'weekly' ? await fetchWeeklyTop(100) : await fetchAllTimeTop(100);
    setRows(data);
    if (user) setMyRank(await fetchUserRank(user.uid, totalPoints));
    setRefreshing(false);
  };

  useEffect(() => { setRows(null); load(); }, [tab]);

  const inTop = !!user && rows?.some(r => r.uid === user.uid);

  return (
    <Screen padded={false}>
      <View style={styles.tabs}>
        {(['weekly', 'alltime'] as Tab[]).map(t => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[type.bodyBold, { color: tab === t ? colors.ink : colors.parchment }]}>
              {t === 'weekly' ? 'Weekly' : 'All-time'}
            </Text>
          </Pressable>
        ))}
      </View>
      {!rows ? (
        <ActivityIndicator color={colors.bronze} style={{ marginTop: spacing.xl }} />
      ) : rows.length === 0 ? (
        <Text style={[type.body, { color: colors.parchmentDim, textAlign: 'center', marginTop: spacing.xl }]}>
          Be the first on the board — play your first era.
        </Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={r => r.uid}
          renderItem={({ item, index }) => (
            <LeaderRow rank={index + 1} row={item} highlight={!!user && item.uid === user.uid} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.bronze} />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        />
      )}
      {!inTop && user && myRank && (
        <View style={styles.stickyFooter}>
          <LeaderRow
            rank={myRank}
            row={{ uid: user.uid, displayName: user.displayName ?? 'You', photoURL: user.photoURL ?? null, points: totalPoints }}
            highlight
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.pill, alignItems: 'center', backgroundColor: colors.inkSoft },
  tabActive: { backgroundColor: colors.bronze },
  stickyFooter: { borderTopWidth: 1, borderTopColor: colors.bronzeDeep, padding: spacing.sm, backgroundColor: colors.ink },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/features/leaderboard
git commit -m "feat(leaderboard): add Weekly/All-time tabs with sticky user rank"
```

---

**Phase 7 checkpoint.** Leaderboard service tested; UI renders both tabs with sticky rank row.

---

## Phase 8 — Onboarding & Navigation

### Task 31: Welcome carousel

**Files:** Create `src/features/onboarding/WelcomeCarousel.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/features/onboarding/WelcomeCarousel.tsx
import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { Button } from '../../design/components/Button';
import { colors, spacing, type } from '../../design/tokens';

const SLIDES = [
  { title: "Guess history's greatest battles", body: 'Famous and forgotten — across 5,000 years.' },
  { title: 'One clue. One guess.',              body: 'Up to 10 points per battle.' },
  { title: 'Need help? Use a clue.',            body: 'Each one costs 2 points.' },
  { title: 'Climb through the ages.',           body: 'From antiquity to the modern era.' },
];

export function WelcomeCarousel({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  const advance = () => {
    if (index === SLIDES.length - 1) onDone();
    else {
      const next = index + 1;
      ref.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }
  };

  return (
    <Screen padded={false}>
      <FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={[type.display, styles.title]}>{item.title}</Text>
            <Text style={[type.body, styles.body]}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
        <Button label={index === SLIDES.length - 1 ? 'Get started' : 'Next'} onPress={advance} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.md },
  title: { color: colors.parchment, textAlign: 'center' },
  body:  { color: colors.parchmentDim, textAlign: 'center' },
  dots:  { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: spacing.md },
  dot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inkSoft },
  dotActive: { backgroundColor: colors.bronze, width: 24 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/features/onboarding/WelcomeCarousel.tsx
git commit -m "feat(onboarding): add WelcomeCarousel with 4 slides"
```

---

### Task 32: Onboarding flag store

**Files:** Create `src/state/useOnboardingStore.ts`

- [ ] **Step 1: Implement**

```ts
// src/state/useOnboardingStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  seen: boolean;
  markSeen: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      seen: false,
      markSeen: () => set({ seen: true }),
    }),
    { name: 'mhg-onboarding', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
```

- [ ] **Step 2: Commit**

```bash
git add src/state/useOnboardingStore.ts
git commit -m "feat(state): add useOnboardingStore for first-run flag"
```

---

### Task 33: ProfileScreen

**Files:** Create `src/features/profile/ProfileScreen.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/features/profile/ProfileScreen.tsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { Button } from '../../design/components/Button';
import { Card } from '../../design/components/Card';
import { useAuth } from '../auth/useAuth';
import { useProgressStore } from '../../state/useProgressStore';
import { colors, spacing, type } from '../../design/tokens';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { totalPoints, eraScores } = useProgressStore();
  const erasCompleted = Object.keys(eraScores).length;

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg }}>
        {user?.photoURL
          ? <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          : <View style={[styles.avatar, { backgroundColor: colors.inkSoft }]} />}
        <Text style={[type.title, { color: colors.parchment }]}>{user?.displayName ?? 'Player'}</Text>
      </View>
      <Card style={{ gap: spacing.sm }}>
        <Stat label="Total points" value={String(totalPoints)} />
        <Stat label="Eras completed" value={`${erasCompleted} / 8`} />
      </Card>
      <View style={{ marginTop: spacing.xl }}>
        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[type.body, { color: colors.parchmentDim }]}>{label}</Text>
      <Text style={[type.bodyBold, { color: colors.bronze }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 96, height: 96, borderRadius: 48 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/features/profile/ProfileScreen.tsx
git commit -m "feat(profile): add ProfileScreen with stats and sign-out"
```

---

### Task 34: Navigation stacks

**Files:**
- Install: `@react-navigation/bottom-tabs`
- Create: `src/navigation/AppTabs.tsx`
- Create: `src/navigation/AuthStack.tsx`
- Create: `src/navigation/OnboardingStack.tsx`
- Create: `src/navigation/RootNavigator.tsx`
- Create: `src/navigation/types.ts` (or modify existing)

- [ ] **Step 1: Install**

```bash
npx expo install @react-navigation/bottom-tabs
```

- [ ] **Step 2: Define route types**

```ts
// src/navigation/types.ts
import { EraId } from '../data/eras';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  App: undefined;
  Round: { eraId: EraId };
  Summary: { eraId: EraId };
};

export type TabParamList = {
  Path: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};
```

- [ ] **Step 3: Implement AppTabs**

```tsx
// src/navigation/AppTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PathScreen } from '../features/progress/PathScreen';
import { LeaderboardScreen } from '../features/leaderboard/LeaderboardScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { TabParamList, RootStackParamList } from './types';
import { colors } from '../design/tokens';

const Tab = createBottomTabNavigator<TabParamList>();

export function AppTabs() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: colors.bronzeDeep },
        tabBarActiveTintColor: colors.bronze,
        tabBarInactiveTintColor: colors.parchmentDim,
      }}
    >
      <Tab.Screen name="Path">
        {() => <PathScreen onStartEra={(eraId) => nav.navigate('Round', { eraId })} />}
      </Tab.Screen>
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 4: Implement AuthStack**

```tsx
// src/navigation/AuthStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '../features/auth/SignInScreen';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 5: Implement OnboardingStack**

```tsx
// src/navigation/OnboardingStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeCarousel } from '../features/onboarding/WelcomeCarousel';
import { useOnboardingStore } from '../state/useOnboardingStore';

const Stack = createNativeStackNavigator();

export function OnboardingStack() {
  const markSeen = useOnboardingStore(s => s.markSeen);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome">
        {() => <WelcomeCarousel onDone={markSeen} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
```

- [ ] **Step 6: Implement RootNavigator**

```tsx
// src/navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/useAuth';
import { useOnboardingStore } from '../state/useOnboardingStore';
import { useGameStore } from '../state/useGameStore';
import { AppTabs } from './AppTabs';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { RoundScreen } from '../features/game/RoundScreen';
import { EraSummary } from '../features/game/EraSummary';
import { getBattlesForEra } from '../data/eras';
import { commitEraCompletion } from '../services/eraCompletion';
import { useProgressStore } from '../state/useProgressStore';
import { colors } from '../design/tokens';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RoundRoute({ route }: any) {
  const { eraId } = route.params;
  const { user } = useAuth();
  const startRound = useGameStore(s => s.startRound);
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (user) startRound(eraId, getBattlesForEra(eraId, user.uid));
  }, [eraId, user, startRound]);

  return <RoundScreen onFinished={() => navigation.replace('Summary', { eraId })} />;
}

function SummaryRoute({ route }: any) {
  const { eraId } = route.params;
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const completeEra = useProgressStore(s => s.completeEra);
  const results = useGameStore(s => s.results);

  const handleContinue = async () => {
    if (!user) return;
    const correct = results.filter(r => r.correct).length;
    const points = results.reduce((sum, r) => sum + r.pointsEarned, 0);
    completeEra(eraId, { correct, points });
    try {
      await commitEraCompletion({
        uid: user.uid, displayName: user.displayName ?? 'Player', photoURL: user.photoURL ?? null,
        eraId, correct, points,
      });
    } catch (e) {
      console.warn('era commit failed', e);
    }
    navigation.popToTop();
  };

  const handleRetry = () => {
    if (!user) return;
    useGameStore.getState().startRound(eraId, getBattlesForEra(eraId, `${user.uid}:${Date.now()}`));
    navigation.replace('Round', { eraId });
  };

  return <EraSummary eraId={eraId} onContinue={handleContinue} onRetry={handleRetry} />;
}

export function RootNavigator() {
  const { user, initializing } = useAuth();
  const seen = useOnboardingStore(s => s.seen);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.bronze} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!seen ? (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        ) : !user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="App" component={AppTabs} />
            <Stack.Screen name="Round" component={RoundRoute} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Summary" component={SummaryRoute} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/navigation package.json package-lock.json
git commit -m "feat(nav): add Root/Auth/Onboarding stacks and tab navigator"
```

---

### Task 35: Wire App.tsx

**Files:** Modify `App.tsx`

- [ ] **Step 1: Replace App.tsx**

```tsx
// App.tsx
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppFonts } from './src/design/useAppFonts';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const fontsReady = useAppFonts();
  if (!fontsReady) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Build the dev client and run**

```bash
eas build --profile development --platform android
# install APK on device, then:
npx expo start --dev-client
```

Expected: Onboarding → Sign in → Path → Round → Summary all work end-to-end.

- [ ] **Step 3: Commit**

```bash
git add App.tsx
git commit -m "feat(app): wire RootNavigator with fonts, gesture handler, safe area"
```

---

**Phase 8 checkpoint.** App is end-to-end functional. Run on a real device or emulator with Google Play Services. Verify: onboarding once → sign in → play era → summary writes to Firestore → leaderboard shows your row.

---

## Phase 9 — Polish

### Task 36: Loading and error toasts

**Files:** Create `src/design/components/Toast.tsx`, modify auth/leaderboard screens to use it

- [ ] **Step 1: Implement**

```tsx
// src/design/components/Toast.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { colors, radii, spacing, type } from '../tokens';

export function Toast({ message, tone = 'error', onHide }: {
  message: string;
  tone?: 'error' | 'success';
  onHide: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onHide, 3500);
    return () => clearTimeout(t);
  }, [onHide]);
  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp}
      style={[styles.toast, { backgroundColor: tone === 'error' ? colors.defeat : colors.victory }]}>
      <Text style={[type.bodyBold, { color: colors.ink }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', top: 60, left: spacing.lg, right: spacing.lg,
    padding: spacing.md, borderRadius: radii.md, alignItems: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/design/components/Toast.tsx
git commit -m "feat(design): add Toast for transient errors and success"
```

---

### Task 37: Confetti on correct answers

**Files:** Install `react-native-confetti-cannon`, modify `ResultBanner`

- [ ] **Step 1: Install**

```bash
npm install react-native-confetti-cannon
```

- [ ] **Step 2: Add confetti to ResultBanner**

In `src/features/game/ResultBanner.tsx`, render a `<ConfettiCannon>` when `result.correct` is true. The cannon must be inside the overlay and use `count={80}, fallSpeed={2500}`.

- [ ] **Step 3: Commit**

```bash
git add src/features/game/ResultBanner.tsx package.json package-lock.json
git commit -m "feat(game): confetti on correct answers"
```

---

### Task 38: Wrong-answer shake on input

**Files:** Modify `src/features/game/GuessInput.tsx`

- [ ] **Step 1: Add shake animation**

Wrap the TextInput in `Animated.View`, expose a ref-based `shake()` via `useImperativeHandle`. RoundScreen calls `inputRef.current?.shake()` on a wrong submission. Use `withSequence(withTiming(-8), withTiming(8), withTiming(-4), withTiming(0))` on a `translateX` shared value.

- [ ] **Step 2: Commit**

```bash
git add src/features/game/GuessInput.tsx src/features/game/RoundScreen.tsx
git commit -m "feat(game): shake input on wrong answer"
```

---

### Task 39: Firestore security rules

**Files:** Create `firestore.rules`

- [ ] **Step 1: Write rules**

```
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid
        && request.resource.data.totalPoints is number;
    }
    match /scores/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.uid;
    }
  }
}
```

- [ ] **Step 2: Deploy via Firebase CLI**

```bash
firebase deploy --only firestore:rules
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "chore(firebase): add Firestore security rules"
```

---

### Task 40: Final verification pass

- [ ] **Step 1: Full test run**

Run: `npm test`
Expected: every test passes.

- [ ] **Step 2: Manual smoke test on dev client**

Verify (Android dev client):
1. Fresh install → onboarding shows once.
2. Tap "Sign in with Google" → Credential Manager bottom sheet appears.
3. Pick account → land on Path screen with `Ancient` highlighted.
4. Play 10 battles → summary shows correct totals.
5. Pass (≥7) → next era unlocks; back on Path, second medallion is now `current`.
6. Open Leaderboard → see your row in both tabs.
7. Sign out from Profile → return to Sign-in.

Verify (iOS dev client):
- Apple Sign-In completes; everything else identical.

Verify (offline):
- Airplane mode on, restart app while signed in → can play; era completion is queued and writes when back online (acceptable v1: warn-and-skip; full offline-queue is post-v1).

- [ ] **Step 3: Commit nothing — verification only**

---

## Self-review against the spec

| Spec section | Plan tasks |
|---|---|
| 3 — Visual direction | 9 (tokens), 10 (fonts), 11 (base components) |
| 4 — Game mechanics | 1 (eras), 2 (fuzzy), 3 (scoring), 7 (game store), 12–17 (game UI) |
| 5 — Architecture / files | 8 (motion deps), 11, 21 (firebase), 34 (nav) |
| 6 — Data model & persistence | 6 (progress store), 22 (profile), 23 (era completion) |
| 7 — Auth flow | 21 (Firebase), 24 (useAuth), 25 (Apple), 26 (Credential Manager), 27 (email), 28 (SignInScreen) |
| 8 — Screens | 16 (Round), 17 (EraSummary), 19 (Path), 28 (SignIn), 30 (Leaderboard), 31 (Welcome), 33 (Profile) |
| 9 — Leaderboard queries | 29 (service), 30 (UI) |
| 10 — State | 6, 7, 32 (onboarding flag) |
| 11 — Testing strategy | tests in 1, 2, 3, 4, 6, 7, 16, 19, 22, 23, 29 |

No spec sections without tasks. No placeholders. Type names are consistent: `EraId`, `EraScore`, `LeaderboardRow`, `RoundResult`, `Battle`, `UserProfile`. Method names verified consistent across tasks (`completeEra`, `hydrate`, `startRound`, `revealClue`, `submitGuess`, `commitEraCompletion`, `fetchAllTimeTop`, `fetchWeeklyTop`, `fetchUserRank`).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-04-military-history-game.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
