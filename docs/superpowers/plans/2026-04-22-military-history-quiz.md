# Military History Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable-in-Expo-Go React Native quiz app that serves 10-round Military History games across three difficulties, using 235 bundled battle images and battle data ported from the `battleguess-website` reference repo.

**Architecture:** Expo managed workflow with React Navigation native stack (Home → Game → Results). Zustand owns all game-session state. Pure game logic (selection, scoring, fuzzy matching) lives in `src/game/` and is fully unit-tested with Jest. Battle data is imported as typed TypeScript modules; all 235 webp images are bundled under `assets/battles/` and resolved through a generated `battleImages.ts` that uses static `require()`s so Metro can package them.

**Tech Stack:** Expo SDK 52 (managed), React Native, TypeScript, React Navigation (native-stack), Zustand, expo-image, Jest + jest-expo, ts-node (for the image-map generator script).

**Reference repo:** [HarryH-Tech-2/battleguess-website](https://github.com/HarryH-Tech-2/battleguess-website). Battle TS modules live at `src/data/battles/*.ts` and images at `public/battles/battle-1.webp` … `battle-235.webp`.

**Canonical Battle shape (from reference repo, reused verbatim in this plan):**

```ts
export type Difficulty = 'easy' | 'medium' | 'hard';
export type CivilizationId =
  | 'ancient-egypt-mesopotamia'
  | 'ancient-greece-rome'
  | 'medieval-europe'
  | 'ottoman-islamic'
  | 'east-asia'
  | 'colonial-napoleonic'
  | 'american-wars'
  | 'world-wars'
  | 'south-america';

export interface Battle {
  id: number;
  name: string;
  civilization: CivilizationId;
  acceptedAnswers: string[];
  prompt: string;          // image-generation prompt; unused at runtime in v1 but kept
  hints: string[];         // exactly 4 hints per battle
  difficulty: Difficulty;
  year: number;            // negative = BC
  location: string;
  description: string;
}

export interface RoundResult {
  battleId: number;
  battleName: string;
  userAnswer: string;      // the option text or typed string; '' if skipped
  correct: boolean;
  pointsEarned: number;
  hintsUsed: number;
}
```

**Filter dimension:** The spec mentions an "era" dropdown. The reference data has no `era` field — battles are grouped by `civilization`. This plan uses `civilization` as the filter dimension; the Home-screen dropdown is labelled "Era / Region" with the 9 civilization values as options plus "All".

---

## File Structure

Files created by this plan:

```
military-history-app/
├── app.json
├── babel.config.js
├── package.json
├── tsconfig.json
├── jest.config.js
├── jest-setup.ts
├── App.tsx
├── scripts/
│   └── generate-battle-images.ts         # dev-time generator
├── src/
│   ├── types.ts
│   ├── theme.ts
│   ├── data/
│   │   ├── battles/
│   │   │   ├── index.ts
│   │   │   ├── americanWars.ts
│   │   │   ├── ancientEgyptMesopotamia.ts
│   │   │   ├── ancientGreeceRome.ts
│   │   │   ├── colonialNapoleonic.ts
│   │   │   ├── eastAsia.ts
│   │   │   ├── medievalEurope.ts
│   │   │   ├── ottomanIslamic.ts
│   │   │   ├── southAmerica.ts
│   │   │   └── worldWars.ts
│   │   └── battleImages.ts               # generated — 235 require() entries
│   ├── game/
│   │   ├── fuzzyMatch.ts
│   │   ├── fuzzyMatch.test.ts
│   │   ├── scoring.ts
│   │   ├── scoring.test.ts
│   │   ├── selectBattles.ts
│   │   └── selectBattles.test.ts
│   ├── store/
│   │   ├── gameStore.ts
│   │   └── gameStore.test.ts
│   ├── components/
│   │   ├── BattleImage.tsx
│   │   ├── HintPanel.tsx
│   │   ├── MultipleChoice.tsx
│   │   ├── TextAnswer.tsx
│   │   └── RevealCard.tsx
│   ├── navigation/
│   │   └── types.ts
│   └── screens/
│       ├── HomeScreen.tsx
│       ├── GameScreen.tsx
│       └── ResultsScreen.tsx
└── assets/
    ├── icon.png                          # Expo default placeholder
    ├── splash.png                        # Expo default placeholder
    └── battles/
        └── battle-1.webp … battle-235.webp
```

---

## Task 1: Scaffold the Expo project

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `babel.config.js`
- Create: `App.tsx`
- Create: `jest.config.js`
- Create: `jest-setup.ts`
- Create: `.gitignore`

- [ ] **Step 1: Initialise an Expo TypeScript project non-interactively**

Run (from the repo root):

```bash
npx --yes create-expo-app@latest . --template blank-typescript
```

Expected: a complete Expo scaffold appears. If the directory-not-empty prompt blocks you, move the existing `docs/` and `.claude/` aside temporarily, re-run, then move them back.

- [ ] **Step 2: Install runtime dependencies**

```bash
npx expo install expo-image @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
npm install zustand
```

Expected: `package.json` now lists all of the above with Expo-compatible versions.

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev jest jest-expo @types/jest ts-node
```

- [ ] **Step 4: Configure Jest**

Create `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|zustand))',
  ],
  testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
};
```

Create `jest-setup.ts` (empty for now, we'll add mocks later if needed):

```ts
// Jest global setup. Intentionally empty in v1.
export {};
```

- [ ] **Step 5: Add npm scripts**

Edit `package.json` — add inside `"scripts"`:

```json
"test": "jest",
"test:watch": "jest --watch",
"gen:images": "ts-node scripts/generate-battle-images.ts"
```

(Keep the existing `start`, `android`, `ios`, `web` scripts from the Expo template.)

- [ ] **Step 6: Smoke-test the scaffold**

```bash
npm test -- --passWithNoTests
```

Expected: `No tests found, exiting with code 0` (because of the flag). Confirms Jest loads.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo + TypeScript + Jest"
```

---

## Task 2: Core domain types

**Files:**
- Create: `src/types.ts`
- Create: `src/navigation/types.ts`

- [ ] **Step 1: Create `src/types.ts`**

```ts
export type Difficulty = 'easy' | 'medium' | 'hard';

export type CivilizationId =
  | 'ancient-egypt-mesopotamia'
  | 'ancient-greece-rome'
  | 'medieval-europe'
  | 'ottoman-islamic'
  | 'east-asia'
  | 'colonial-napoleonic'
  | 'american-wars'
  | 'world-wars'
  | 'south-america';

export const CIVILIZATIONS: { id: CivilizationId; label: string }[] = [
  { id: 'ancient-egypt-mesopotamia', label: 'Ancient Egypt & Mesopotamia' },
  { id: 'ancient-greece-rome',       label: 'Ancient Greece & Rome' },
  { id: 'medieval-europe',           label: 'Medieval Europe' },
  { id: 'ottoman-islamic',           label: 'Ottoman & Islamic' },
  { id: 'east-asia',                 label: 'East Asia' },
  { id: 'colonial-napoleonic',       label: 'Colonial & Napoleonic' },
  { id: 'american-wars',             label: 'American Wars' },
  { id: 'world-wars',                label: 'World Wars' },
  { id: 'south-america',             label: 'South America' },
];

export interface Battle {
  id: number;
  name: string;
  civilization: CivilizationId;
  acceptedAnswers: string[];
  prompt: string;
  hints: string[];
  difficulty: Difficulty;
  year: number;
  location: string;
  description: string;
}

export interface RoundResult {
  battleId: number;
  battleName: string;
  userAnswer: string;
  correct: boolean;
  pointsEarned: number;
  hintsUsed: number;
}

export interface GameFilter {
  civilization?: CivilizationId; // undefined = all
}
```

- [ ] **Step 2: Create `src/navigation/types.ts`**

```ts
import type { Difficulty, GameFilter, RoundResult } from '../types';

export type RootStackParamList = {
  Home: undefined;
  Game: { difficulty: Difficulty; filter: GameFilter };
  Results: {
    difficulty: Difficulty;
    filter: GameFilter;
    score: number;
    results: RoundResult[];
  };
};
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/navigation/types.ts
git commit -m "feat(types): add Battle, RoundResult, navigation param list"
```

---

## Task 3: Port battle data from the reference repo

**Files:**
- Create: `src/data/battles/index.ts`
- Create: `src/data/battles/americanWars.ts`
- Create: `src/data/battles/ancientEgyptMesopotamia.ts`
- Create: `src/data/battles/ancientGreeceRome.ts`
- Create: `src/data/battles/colonialNapoleonic.ts`
- Create: `src/data/battles/eastAsia.ts`
- Create: `src/data/battles/medievalEurope.ts`
- Create: `src/data/battles/ottomanIslamic.ts`
- Create: `src/data/battles/southAmerica.ts`
- Create: `src/data/battles/worldWars.ts`

- [ ] **Step 1: Clone the reference repo to a scratch location**

```bash
git clone --depth 1 https://github.com/HarryH-Tech-2/battleguess-website.git /tmp/battleguess-ref
```

Expected: a shallow clone lands at `/tmp/battleguess-ref`.

- [ ] **Step 2: Copy the 10 battle TS files verbatim**

```bash
mkdir -p src/data/battles
cp /tmp/battleguess-ref/src/data/battles/*.ts src/data/battles/
```

- [ ] **Step 3: Rewrite the `Battle` import path in each file**

Each ported file begins with `import type { Battle } from '../../types';` — which resolves to `src/types.ts` in *this* repo's structure, so no change is needed. Confirm with:

```bash
grep -n "import type { Battle }" src/data/battles/*.ts
```

Expected: every file shows `from '../../types';`. If any file uses a different path (e.g. `'../../types/index'`), edit it to `'../../types'`.

- [ ] **Step 4: Simplify `index.ts` to only what v1 needs**

The reference `index.ts` exports five helpers (`getBattlesByCivilization`, `getRandomBattle`, `getBattleById`, `getCanonicalBattleByName`, `getTimelineBattleSet`). V1 only needs `allBattles` and `getBattleById`. Replace `src/data/battles/index.ts` wholesale with:

```ts
import type { Battle } from '../../types';
import { americanWars } from './americanWars';
import { ancientEgyptMesopotamia } from './ancientEgyptMesopotamia';
import { ancientGreeceRome } from './ancientGreeceRome';
import { colonialNapoleonic } from './colonialNapoleonic';
import { eastAsia } from './eastAsia';
import { medievalEurope } from './medievalEurope';
import { ottomanIslamic } from './ottomanIslamic';
import { southAmerica } from './southAmerica';
import { worldWars } from './worldWars';

export const allBattles: Battle[] = [
  ...americanWars,
  ...ancientEgyptMesopotamia,
  ...ancientGreeceRome,
  ...colonialNapoleonic,
  ...eastAsia,
  ...medievalEurope,
  ...ottomanIslamic,
  ...southAmerica,
  ...worldWars,
];

export function getBattleById(id: number): Battle | undefined {
  return allBattles.find(b => b.id === id);
}
```

- [ ] **Step 5: Confirm each category file exports the named constant `index.ts` imports**

```bash
grep -nE "export const (americanWars|ancientEgyptMesopotamia|ancientGreeceRome|colonialNapoleonic|eastAsia|medievalEurope|ottomanIslamic|southAmerica|worldWars)" src/data/battles/*.ts
```

Expected: one match per file. If any file uses a different export name (e.g. a default export), rename the export to match the import in `index.ts`.

- [ ] **Step 6: Type-check the port**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors reference helper types the reference repo had (e.g. `CivilizationId` mismatches), adjust `src/types.ts` until the port compiles **without modifying the battle data itself**.

- [ ] **Step 7: Sanity-check counts**

Create a throwaway file `tmp-count.ts`:

```ts
import { allBattles } from './src/data/battles';
console.log('battles:', allBattles.length);
console.log('ids unique:', new Set(allBattles.map(b => b.id)).size === allBattles.length);
```

Run:

```bash
npx ts-node tmp-count.ts
rm tmp-count.ts
```

Expected: `battles: 235` (or close — the reference grows occasionally; acceptable range 230–240) and `ids unique: true`. If IDs are not unique, stop and reconcile.

- [ ] **Step 8: Commit**

```bash
git add src/data/battles
git commit -m "feat(data): port battle data from battleguess-website"
```

---

## Task 4: Bundle battle images and generate the image-require map

**Files:**
- Create: `assets/battles/battle-1.webp` … `battle-235.webp`
- Create: `scripts/generate-battle-images.ts`
- Create: `src/data/battleImages.ts` (generated)

- [ ] **Step 1: Copy the 235 webp files into `assets/battles/`**

```bash
mkdir -p assets/battles
cp /tmp/battleguess-ref/public/battles/battle-*.webp assets/battles/
ls assets/battles | wc -l
```

Expected: the count printed should match the number of battles reported in Task 3 Step 7 (235 ± a few). If the reference has `battle-placeholder.webp` or other non-numbered files, leave them out:

```bash
ls assets/battles | grep -vE '^battle-[0-9]+\.webp$' || true
```

Expected: no unexpected files listed.

- [ ] **Step 2: Write the generator script**

Create `scripts/generate-battle-images.ts`:

```ts
import * as fs from 'fs';
import * as path from 'path';

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'battles');
const OUT = path.join(__dirname, '..', 'src', 'data', 'battleImages.ts');

const files = fs.readdirSync(ASSETS_DIR)
  .filter(f => /^battle-\d+\.webp$/.test(f))
  .sort((a, b) => {
    const na = Number(a.match(/\d+/)![0]);
    const nb = Number(b.match(/\d+/)![0]);
    return na - nb;
  });

if (files.length === 0) {
  console.error(`No battle-N.webp files found in ${ASSETS_DIR}`);
  process.exit(1);
}

const lines: string[] = [];
lines.push('// AUTO-GENERATED by scripts/generate-battle-images.ts — do not edit by hand.');
lines.push('// Run: npm run gen:images');
lines.push('');
lines.push('export const battleImages: Record<number, number> = {');
for (const f of files) {
  const id = Number(f.match(/\d+/)![0]);
  lines.push(`  ${id}: require('../../assets/battles/${f}'),`);
}
lines.push('};');
lines.push('');
lines.push('export function getBattleImage(id: number): number | undefined {');
lines.push('  return battleImages[id];');
lines.push('}');
lines.push('');

fs.writeFileSync(OUT, lines.join('\n'));
console.log(`Wrote ${OUT} with ${files.length} entries.`);
```

- [ ] **Step 3: Run the generator**

```bash
npm run gen:images
```

Expected: `Wrote .../src/data/battleImages.ts with N entries.` where N matches Step 1.

- [ ] **Step 4: Verify the generated file type-checks**

```bash
npx tsc --noEmit
```

Expected: no errors. The `require(...)` return type (`number`, a Metro asset-reference) is intentional — RN's `Image`/`expo-image` accept it as the `source` prop value.

- [ ] **Step 5: Commit**

```bash
git add assets/battles scripts/generate-battle-images.ts src/data/battleImages.ts package.json
git commit -m "feat(data): bundle battle images and generated require map"
```

---

## Task 5: Fuzzy matching (TDD)

**Files:**
- Create: `src/game/fuzzyMatch.ts`
- Test: `src/game/fuzzyMatch.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/game/fuzzyMatch.test.ts`:

```ts
import { normalize, levenshtein, isAcceptedAnswer } from './fuzzyMatch';

describe('normalize', () => {
  it('lowercases', () => {
    expect(normalize('Thermopylae')).toBe('thermopylae');
  });
  it('strips diacritics', () => {
    expect(normalize('Poitiers — Château')).toBe('poitiers chateau');
  });
  it('removes punctuation', () => {
    expect(normalize('300 Spartans!')).toBe('300 spartans');
  });
  it('collapses whitespace', () => {
    expect(normalize('  battle   of   hastings  ')).toBe('battle of hastings');
  });
});

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
  });
  it('returns 1 for a single substitution', () => {
    expect(levenshtein('cat', 'bat')).toBe(1);
  });
  it('returns 2 for two edits', () => {
    expect(levenshtein('kitten', 'sittin')).toBe(2);
  });
});

describe('isAcceptedAnswer', () => {
  const accepted = ['thermopylae', 'battle of thermopylae', '300 spartans'];

  it('accepts exact canonical', () => {
    expect(isAcceptedAnswer('thermopylae', accepted)).toBe(true);
  });
  it('accepts case/punctuation variants', () => {
    expect(isAcceptedAnswer('Thermopylae!', accepted)).toBe(true);
  });
  it('accepts diacritic variants', () => {
    expect(isAcceptedAnswer('Thermopylaé', accepted)).toBe(true);
  });
  it('accepts typos within edit distance 2 for long entries', () => {
    expect(isAcceptedAnswer('thermopylea', accepted)).toBe(true);  // distance 1
    expect(isAcceptedAnswer('thermopilee', accepted)).toBe(true);  // distance 2
  });
  it('rejects typos beyond edit distance 2', () => {
    expect(isAcceptedAnswer('thermopiles', accepted)).toBe(true);  // distance 2 — still accept
    expect(isAcceptedAnswer('thermoxxxxx', accepted)).toBe(false); // distance > 2
  });
  it('does NOT fuzzy-match short entries (<6 chars)', () => {
    expect(isAcceptedAnswer('abc', ['abd'])).toBe(false);
  });
  it('rejects empty input', () => {
    expect(isAcceptedAnswer('', accepted)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- fuzzyMatch
```

Expected: FAIL — `Cannot find module './fuzzyMatch'`.

- [ ] **Step 3: Implement `fuzzyMatch.ts`**

Create `src/game/fuzzyMatch.ts`:

```ts
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // strip diacritics
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')     // replace punctuation with space
    .replace(/\s+/g, ' ')                  // collapse whitespace
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev: number[] = new Array(b.length + 1);
  const cur: number[] = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(
        cur[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

export function isAcceptedAnswer(input: string, accepted: string[]): boolean {
  const n = normalize(input);
  if (n.length === 0) return false;
  for (const a of accepted) {
    const na = normalize(a);
    if (n === na) return true;
    if (na.length >= 6 && levenshtein(n, na) <= 2) return true;
  }
  return false;
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- fuzzyMatch
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/fuzzyMatch.ts src/game/fuzzyMatch.test.ts
git commit -m "feat(game): fuzzy matching with diacritic-stripping and Levenshtein"
```

---

## Task 6: Scoring (TDD)

**Files:**
- Create: `src/game/scoring.ts`
- Test: `src/game/scoring.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/game/scoring.test.ts`:

```ts
import { scoreRound } from './scoring';

describe('scoreRound', () => {
  describe('easy', () => {
    it('10 for correct', () => {
      expect(scoreRound('easy', true, 0)).toBe(10);
    });
    it('0 for wrong', () => {
      expect(scoreRound('easy', false, 0)).toBe(0);
    });
    it('ignores hintsUsed (hints are pre-shown)', () => {
      expect(scoreRound('easy', true, 3)).toBe(10);
    });
  });

  describe('medium / hard', () => {
    it('10 for correct with no hints', () => {
      expect(scoreRound('medium', true, 0)).toBe(10);
      expect(scoreRound('hard',   true, 0)).toBe(10);
    });
    it('deducts 2 per hint used', () => {
      expect(scoreRound('medium', true, 1)).toBe(8);
      expect(scoreRound('medium', true, 2)).toBe(6);
      expect(scoreRound('medium', true, 3)).toBe(4);
    });
    it('floors at 2 when correct, even with 4 hints', () => {
      expect(scoreRound('medium', true, 4)).toBe(2);
      expect(scoreRound('hard',   true, 4)).toBe(2);
    });
    it('0 for wrong regardless of hints', () => {
      expect(scoreRound('medium', false, 0)).toBe(0);
      expect(scoreRound('medium', false, 4)).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- scoring
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `scoring.ts`**

Create `src/game/scoring.ts`:

```ts
import type { Difficulty } from '../types';

export function scoreRound(
  difficulty: Difficulty,
  correct: boolean,
  hintsUsed: number,
): number {
  if (!correct) return 0;
  if (difficulty === 'easy') return 10;
  // medium / hard: 10 − 2*hintsUsed, floored at 2 when correct
  return Math.max(2, 10 - 2 * hintsUsed);
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- scoring
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/scoring.ts src/game/scoring.test.ts
git commit -m "feat(game): per-round scoring rules with hint penalty floor"
```

---

## Task 7: Battle selection (TDD)

**Files:**
- Create: `src/game/selectBattles.ts`
- Test: `src/game/selectBattles.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/game/selectBattles.test.ts`:

```ts
import { selectBattles, selectDistractors } from './selectBattles';
import type { Battle } from '../types';

function b(overrides: Partial<Battle>): Battle {
  return {
    id: 0,
    name: 'X',
    civilization: 'ancient-greece-rome',
    acceptedAnswers: [],
    prompt: '',
    hints: ['h1', 'h2', 'h3', 'h4'],
    difficulty: 'easy',
    year: 0,
    location: '',
    description: '',
    ...overrides,
  };
}

describe('selectBattles', () => {
  const pool: Battle[] = [];
  for (let i = 1; i <= 30; i++) {
    pool.push(b({ id: i, name: `B${i}`, difficulty: i % 3 === 0 ? 'hard' : i % 2 === 0 ? 'medium' : 'easy' }));
  }

  it('returns exactly 10 battles', () => {
    expect(selectBattles(pool, { difficulty: 'easy', filter: {} }).length).toBe(10);
  });

  it('all returned battles match the requested difficulty', () => {
    const picks = selectBattles(pool, { difficulty: 'hard', filter: {} });
    expect(picks.every(x => x.difficulty === 'hard')).toBe(true);
  });

  it('contains no duplicate ids', () => {
    const picks = selectBattles(pool, { difficulty: 'easy', filter: {} });
    expect(new Set(picks.map(p => p.id)).size).toBe(picks.length);
  });

  it('applies civilization filter when provided', () => {
    const mixed = [
      ...pool,
      b({ id: 100, difficulty: 'easy', civilization: 'east-asia' }),
      b({ id: 101, difficulty: 'easy', civilization: 'east-asia' }),
    ];
    const picks = selectBattles(mixed, {
      difficulty: 'easy',
      filter: { civilization: 'east-asia' },
    });
    expect(picks.every(p => p.civilization === 'east-asia')).toBe(true);
  });

  it('throws if fewer than 10 battles match', () => {
    const tiny = pool.slice(0, 5);
    expect(() =>
      selectBattles(tiny, { difficulty: 'easy', filter: {} }),
    ).toThrow(/not enough/i);
  });
});

describe('selectDistractors', () => {
  const correct = b({ id: 1, name: 'Thermopylae', civilization: 'ancient-greece-rome' });
  const pool: Battle[] = [
    correct,
    b({ id: 2, name: 'Marathon',  civilization: 'ancient-greece-rome' }),
    b({ id: 3, name: 'Cannae',    civilization: 'ancient-greece-rome' }),
    b({ id: 4, name: 'Zama',      civilization: 'ancient-greece-rome' }),
    b({ id: 5, name: 'Hastings',  civilization: 'medieval-europe' }),
    b({ id: 6, name: 'Agincourt', civilization: 'medieval-europe' }),
  ];

  it('returns 3 distractors prioritising same civilization', () => {
    const d = selectDistractors(correct, pool);
    expect(d).toHaveLength(3);
    expect(d.every(x => x.id !== correct.id)).toBe(true);
    expect(d.every(x => x.civilization === 'ancient-greece-rome')).toBe(true);
  });

  it('falls back to other civilizations if same-civ pool is too small', () => {
    const small: Battle[] = [
      correct,
      b({ id: 2, name: 'Marathon', civilization: 'ancient-greece-rome' }),
      b({ id: 5, name: 'Hastings', civilization: 'medieval-europe' }),
      b({ id: 6, name: 'Agincourt', civilization: 'medieval-europe' }),
    ];
    const d = selectDistractors(correct, small);
    expect(d).toHaveLength(3);
    const ids = d.map(x => x.id).sort();
    expect(ids).toEqual([2, 5, 6]);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- selectBattles
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `selectBattles.ts`**

Create `src/game/selectBattles.ts`:

```ts
import type { Battle, Difficulty, GameFilter } from '../types';

export const ROUNDS_PER_GAME = 10;

export interface SelectArgs {
  difficulty: Difficulty;
  filter: GameFilter;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function selectBattles(pool: Battle[], args: SelectArgs): Battle[] {
  const eligible = pool.filter(
    b =>
      b.difficulty === args.difficulty &&
      (!args.filter.civilization || b.civilization === args.filter.civilization),
  );
  if (eligible.length < ROUNDS_PER_GAME) {
    throw new Error(
      `not enough battles: need ${ROUNDS_PER_GAME}, got ${eligible.length} for ` +
      `${args.difficulty}${args.filter.civilization ? '/' + args.filter.civilization : ''}`,
    );
  }
  return shuffle(eligible).slice(0, ROUNDS_PER_GAME);
}

export function selectDistractors(correct: Battle, pool: Battle[]): Battle[] {
  const others = pool.filter(b => b.id !== correct.id);
  const sameCiv = others.filter(b => b.civilization === correct.civilization);
  const picks: Battle[] = [];
  const shuffledSame = shuffle(sameCiv);
  for (const b of shuffledSame) {
    if (picks.length === 3) break;
    picks.push(b);
  }
  if (picks.length < 3) {
    const rest = shuffle(others.filter(b => !picks.includes(b)));
    for (const b of rest) {
      if (picks.length === 3) break;
      picks.push(b);
    }
  }
  return picks;
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- selectBattles
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/selectBattles.ts src/game/selectBattles.test.ts
git commit -m "feat(game): battle selection and multiple-choice distractors"
```

---

## Task 8: Zustand game store (TDD)

**Files:**
- Create: `src/store/gameStore.ts`
- Test: `src/store/gameStore.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/store/gameStore.test.ts`:

```ts
import { useGameStore } from './gameStore';
import type { Battle } from '../types';

function makeBattles(): Battle[] {
  const out: Battle[] = [];
  for (let i = 1; i <= 12; i++) {
    out.push({
      id: i,
      name: `Battle ${i}`,
      civilization: 'ancient-greece-rome',
      acceptedAnswers: [`battle ${i}`, `b${i}`],
      prompt: '',
      hints: ['h1', 'h2', 'h3', 'h4'],
      difficulty: 'medium',
      year: i,
      location: 'loc',
      description: 'desc',
    });
  }
  return out;
}

beforeEach(() => {
  useGameStore.getState().reset();
});

describe('useGameStore', () => {
  it('starts with 10 battles at round 0, score 0', () => {
    const battles = makeBattles();
    useGameStore.getState().startGameWithBattles('medium', {}, battles.slice(0, 10));
    const s = useGameStore.getState();
    expect(s.battles).toHaveLength(10);
    expect(s.currentRound).toBe(0);
    expect(s.score).toBe(0);
    expect(s.hintsUsedThisRound).toBe(0);
    expect(s.roundResults).toHaveLength(0);
  });

  it('submitAnswer records a correct result and adds score (medium, 0 hints → 10)', () => {
    const battles = makeBattles();
    useGameStore.getState().startGameWithBattles('medium', {}, battles.slice(0, 10));
    const r = useGameStore.getState().submitAnswer('Battle 1');
    expect(r).toEqual({ correct: true, points: 10 });
    const s = useGameStore.getState();
    expect(s.score).toBe(10);
    expect(s.roundResults).toHaveLength(1);
    expect(s.roundResults[0].correct).toBe(true);
  });

  it('useHint increments hintsUsedThisRound and penalises next submit', () => {
    const battles = makeBattles();
    useGameStore.getState().startGameWithBattles('medium', {}, battles.slice(0, 10));
    useGameStore.getState().useHint();
    useGameStore.getState().useHint();
    const r = useGameStore.getState().submitAnswer('Battle 1');
    expect(r.points).toBe(6); // 10 − 2*2
  });

  it('nextRound advances and resets hints for the new round', () => {
    const battles = makeBattles();
    useGameStore.getState().startGameWithBattles('medium', {}, battles.slice(0, 10));
    useGameStore.getState().useHint();
    useGameStore.getState().submitAnswer('Battle 1');
    useGameStore.getState().nextRound();
    const s = useGameStore.getState();
    expect(s.currentRound).toBe(1);
    expect(s.hintsUsedThisRound).toBe(0);
  });

  it('records a wrong answer with 0 points', () => {
    const battles = makeBattles();
    useGameStore.getState().startGameWithBattles('medium', {}, battles.slice(0, 10));
    const r = useGameStore.getState().submitAnswer('something else');
    expect(r).toEqual({ correct: false, points: 0 });
    expect(useGameStore.getState().score).toBe(0);
  });

  it('reset clears state', () => {
    const battles = makeBattles();
    useGameStore.getState().startGameWithBattles('easy', {}, battles.slice(0, 10));
    useGameStore.getState().submitAnswer('Battle 1');
    useGameStore.getState().reset();
    const s = useGameStore.getState();
    expect(s.battles).toHaveLength(0);
    expect(s.score).toBe(0);
    expect(s.currentRound).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- gameStore
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the store**

Create `src/store/gameStore.ts`:

```ts
import { create } from 'zustand';
import type { Battle, Difficulty, GameFilter, RoundResult } from '../types';
import { isAcceptedAnswer } from '../game/fuzzyMatch';
import { scoreRound } from '../game/scoring';
import { selectBattles } from '../game/selectBattles';
import { allBattles } from '../data/battles';

interface GameState {
  difficulty: Difficulty;
  filter: GameFilter;
  battles: Battle[];
  currentRound: number;
  score: number;
  hintsUsedThisRound: number;
  roundResults: RoundResult[];

  startGame: (difficulty: Difficulty, filter: GameFilter) => void;
  /** Test hook: start with an explicit battle list, bypassing selection. */
  startGameWithBattles: (difficulty: Difficulty, filter: GameFilter, battles: Battle[]) => void;

  submitAnswer: (answer: string) => { correct: boolean; points: number };
  useHint: () => void;
  nextRound: () => void;
  reset: () => void;
}

const initial = {
  difficulty: 'easy' as Difficulty,
  filter: {} as GameFilter,
  battles: [] as Battle[],
  currentRound: 0,
  score: 0,
  hintsUsedThisRound: 0,
  roundResults: [] as RoundResult[],
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initial,

  startGame: (difficulty, filter) => {
    const battles = selectBattles(allBattles, { difficulty, filter });
    set({ ...initial, difficulty, filter, battles });
  },

  startGameWithBattles: (difficulty, filter, battles) => {
    set({ ...initial, difficulty, filter, battles });
  },

  submitAnswer: (answer) => {
    const { battles, currentRound, difficulty, hintsUsedThisRound, roundResults, score } = get();
    const battle = battles[currentRound];
    const correct = isAcceptedAnswer(answer, battle.acceptedAnswers);
    const points = scoreRound(difficulty, correct, hintsUsedThisRound);
    const result: RoundResult = {
      battleId: battle.id,
      battleName: battle.name,
      userAnswer: answer,
      correct,
      pointsEarned: points,
      hintsUsed: hintsUsedThisRound,
    };
    set({
      score: score + points,
      roundResults: [...roundResults, result],
    });
    return { correct, points };
  },

  useHint: () => {
    set({ hintsUsedThisRound: get().hintsUsedThisRound + 1 });
  },

  nextRound: () => {
    set({
      currentRound: get().currentRound + 1,
      hintsUsedThisRound: 0,
    });
  },

  reset: () => set({ ...initial }),
}));
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- gameStore
```

Expected: all pass. If a test fails because `startGame` tries to pull from `allBattles` during import (tests use `startGameWithBattles`), nothing needs changing — the tests are already designed to avoid that code path.

- [ ] **Step 5: Full test suite sanity check**

```bash
npm test
```

Expected: all prior suites plus this one pass.

- [ ] **Step 6: Commit**

```bash
git add src/store/gameStore.ts src/store/gameStore.test.ts
git commit -m "feat(store): Zustand game store with answer/hint/round actions"
```

---

## Task 9: Theme tokens and navigation shell

**Files:**
- Create: `src/theme.ts`
- Modify: `App.tsx`

- [ ] **Step 1: Create `src/theme.ts`**

```ts
export const colors = {
  bg:         '#0f172a',
  surface:    '#1e293b',
  surfaceAlt: '#334155',
  text:       '#f8fafc',
  textMuted:  '#94a3b8',
  primary:    '#f59e0b',
  primaryOn:  '#0f172a',
  correct:    '#10b981',
  wrong:      '#ef4444',
  border:     '#475569',
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };

export const font = {
  sizeXs: 12, sizeSm: 14, sizeMd: 16, sizeLg: 20, sizeXl: 28, sizeXxl: 36,
  weightRegular: '400' as const,
  weightBold: '700' as const,
};
```

- [ ] **Step 2: Replace `App.tsx` with the navigation root**

```tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './src/navigation/types';
import { colors } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import ResultsScreen from './src/screens/ResultsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Home"    component={HomeScreen}    options={{ title: 'Military History Quiz' }} />
          <Stack.Screen name="Game"    component={GameScreen}    options={{ title: 'Game' }} />
          <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Results' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
```

The three screen modules don't exist yet, so TypeScript will complain. That's expected — they land in Tasks 11–13. Proceed anyway; we'll verify at the end of Task 13.

- [ ] **Step 3: Commit**

```bash
git add src/theme.ts App.tsx
git commit -m "feat(app): theme tokens and navigation shell"
```

---

## Task 10: Reusable UI components

**Files:**
- Create: `src/components/BattleImage.tsx`
- Create: `src/components/HintPanel.tsx`
- Create: `src/components/MultipleChoice.tsx`
- Create: `src/components/TextAnswer.tsx`
- Create: `src/components/RevealCard.tsx`

- [ ] **Step 1: Create `BattleImage.tsx`**

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { getBattleImage } from '../data/battleImages';
import { colors, radius } from '../theme';

export default function BattleImage({ battleId }: { battleId: number }) {
  const src = getBattleImage(battleId);
  return (
    <View style={styles.wrap}>
      {src !== undefined ? (
        <Image source={src} style={styles.img} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.img, styles.placeholder]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', aspectRatio: 16 / 10, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface },
  img: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: colors.surfaceAlt },
});
```

- [ ] **Step 2: Create `HintPanel.tsx`**

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  hints: string[];          // all 4 hints for the battle
  revealedCount: number;    // how many to show
  onRequestHint?: () => void;
  maxHints: number;         // 1 for easy, 4 for medium/hard
  onDemand: boolean;        // false = easy (hint 1 shown); true = medium/hard
}

export default function HintPanel({ hints, revealedCount, onRequestHint, maxHints, onDemand }: Props) {
  const visible = hints.slice(0, revealedCount);
  const canAskForMore = onDemand && revealedCount < maxHints;
  return (
    <View style={styles.wrap}>
      {visible.map((h, i) => (
        <Text key={i} style={styles.hint}>• {h}</Text>
      ))}
      {canAskForMore && (
        <Pressable onPress={onRequestHint} style={styles.btn}>
          <Text style={styles.btnText}>
            Show hint {revealedCount + 1} / {maxHints} (−2 pts)
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingVertical: spacing.md },
  hint: { color: colors.text, fontSize: font.sizeMd },
  btn: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  btnText: { color: colors.text, fontSize: font.sizeSm, fontWeight: font.weightBold },
});
```

- [ ] **Step 3: Create `MultipleChoice.tsx`**

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  options: string[];
  disabled?: boolean;
  onPick: (choice: string) => void;
}

export default function MultipleChoice({ options, disabled, onPick }: Props) {
  return (
    <View style={styles.wrap}>
      {options.map(opt => (
        <Pressable
          key={opt}
          disabled={disabled}
          onPress={() => onPick(opt)}
          style={({ pressed }) => [styles.opt, pressed && !disabled && styles.optPressed]}
        >
          <Text style={styles.optText}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  opt: { backgroundColor: colors.surface, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  optPressed: { backgroundColor: colors.surfaceAlt },
  optText: { color: colors.text, fontSize: font.sizeMd },
});
```

- [ ] **Step 4: Create `TextAnswer.tsx`**

```tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  disabled?: boolean;
  onSubmit: (answer: string) => void;
}

export default function TextAnswer({ disabled, onSubmit }: Props) {
  const [value, setValue] = useState('');
  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={setValue}
        editable={!disabled}
        placeholder="Type the battle name…"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="words"
        autoCorrect={false}
        style={styles.input}
        onSubmitEditing={() => value.trim() && onSubmit(value.trim())}
      />
      <Pressable
        disabled={disabled || !value.trim()}
        onPress={() => onSubmit(value.trim())}
        style={({ pressed }) => [
          styles.btn,
          (disabled || !value.trim()) && styles.btnDisabled,
          pressed && styles.btnPressed,
        ]}
      >
        <Text style={styles.btnText}>Submit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  input: { backgroundColor: colors.surface, color: colors.text, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, fontSize: font.sizeMd },
  btn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: colors.primaryOn, fontWeight: font.weightBold, fontSize: font.sizeMd },
});
```

- [ ] **Step 5: Create `RevealCard.tsx`**

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Battle } from '../types';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  battle: Battle;
  correct: boolean;
  pointsEarned: number;
  onNext: () => void;
  lastRound: boolean;
}

export default function RevealCard({ battle, correct, pointsEarned, onNext, lastRound }: Props) {
  const yearLabel = battle.year < 0 ? `${Math.abs(battle.year)} BC` : `${battle.year}`;
  return (
    <View style={[styles.card, correct ? styles.cardCorrect : styles.cardWrong]}>
      <Text style={styles.badge}>{correct ? `✓ Correct · +${pointsEarned}` : '✗ Incorrect'}</Text>
      <Text style={styles.name}>{battle.name}</Text>
      <Text style={styles.meta}>{yearLabel} · {battle.location}</Text>
      <Text style={styles.desc} numberOfLines={3}>{battle.description}</Text>
      <Pressable onPress={onNext} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
        <Text style={styles.btnText}>{lastRound ? 'See results' : 'Next'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2 },
  cardCorrect: { borderColor: colors.correct },
  cardWrong:   { borderColor: colors.wrong },
  badge: { color: colors.text, fontWeight: font.weightBold, fontSize: font.sizeSm },
  name:  { color: colors.text, fontWeight: font.weightBold, fontSize: font.sizeLg },
  meta:  { color: colors.textMuted, fontSize: font.sizeSm },
  desc:  { color: colors.text, fontSize: font.sizeMd },
  btn: { marginTop: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  btnPressed: { opacity: 0.85 },
  btnText: { color: colors.primaryOn, fontWeight: font.weightBold, fontSize: font.sizeMd },
});
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: only errors are about missing screen modules (coming in Tasks 11–13). Component files themselves must compile.

- [ ] **Step 7: Commit**

```bash
git add src/components
git commit -m "feat(components): BattleImage, HintPanel, MC, TextAnswer, RevealCard"
```

---

## Task 11: Home screen

**Files:**
- Create: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Implement `HomeScreen.tsx`**

```tsx
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { CivilizationId, Difficulty } from '../types';
import { CIVILIZATIONS } from '../types';
import { colors, font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const DIFFICULTIES: { id: Difficulty; title: string; sub: string }[] = [
  { id: 'easy',   title: 'Easy',   sub: '4 choices · 1 free hint · 10 pts correct' },
  { id: 'medium', title: 'Medium', sub: 'Type answer · 4 hints on demand · −2 each' },
  { id: 'hard',   title: 'Hard',   sub: 'Type answer · 4 hints on demand · −2 each' },
];

export default function HomeScreen({ navigation }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [civ, setCiv] = useState<CivilizationId | undefined>(undefined);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.hero}>Military History Quiz</Text>
      <Text style={styles.sub}>Guess the battle from the image.</Text>

      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.cards}>
        {DIFFICULTIES.map(d => {
          const selected = d.id === difficulty;
          return (
            <Pressable
              key={d.id}
              onPress={() => setDifficulty(d.id)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <Text style={styles.cardTitle}>{d.title}</Text>
              <Text style={styles.cardSub}>{d.sub}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Era / Region</Text>
      <View style={styles.chips}>
        <Chip label="All" selected={!civ} onPress={() => setCiv(undefined)} />
        {CIVILIZATIONS.map(c => (
          <Chip key={c.id} label={c.label} selected={civ === c.id} onPress={() => setCiv(c.id)} />
        ))}
      </View>

      <Pressable
        onPress={() => navigation.navigate('Game', { difficulty, filter: { civilization: civ } })}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaText}>Start Game</Text>
      </Pressable>

      <Text style={styles.footer}>Images from battleguess.app</Text>
    </ScrollView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md },
  hero: { color: colors.text, fontSize: font.sizeXxl, fontWeight: font.weightBold },
  sub:  { color: colors.textMuted, fontSize: font.sizeMd, marginBottom: spacing.lg },
  label: { color: colors.textMuted, fontSize: font.sizeSm, marginTop: spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  cards: { gap: spacing.sm },
  card:  { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: 'transparent' },
  cardSelected: { borderColor: colors.primary },
  cardTitle: { color: colors.text, fontSize: font.sizeLg, fontWeight: font.weightBold },
  cardSub:   { color: colors.textMuted, fontSize: font.sizeSm, marginTop: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: font.sizeSm },
  chipTextSelected: { color: colors.primaryOn, fontWeight: font.weightBold },
  cta: { marginTop: spacing.xl, backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: colors.primaryOn, fontWeight: font.weightBold, fontSize: font.sizeLg },
  footer: { color: colors.textMuted, fontSize: font.sizeXs, textAlign: 'center', marginTop: spacing.xxl },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat(home): difficulty + era picker and Start button"
```

---

## Task 12: Game screen

**Files:**
- Create: `src/screens/GameScreen.tsx`

- [ ] **Step 1: Implement `GameScreen.tsx`**

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/gameStore';
import { allBattles } from '../data/battles';
import { selectDistractors } from '../game/selectBattles';
import { ROUNDS_PER_GAME } from '../game/selectBattles';
import BattleImage from '../components/BattleImage';
import HintPanel from '../components/HintPanel';
import MultipleChoice from '../components/MultipleChoice';
import TextAnswer from '../components/TextAnswer';
import RevealCard from '../components/RevealCard';
import { colors, font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ route, navigation }: Props) {
  const { difficulty, filter } = route.params;

  const startGame           = useGameStore(s => s.startGame);
  const reset               = useGameStore(s => s.reset);
  const submitAnswer        = useGameStore(s => s.submitAnswer);
  const useHint             = useGameStore(s => s.useHint);
  const nextRound           = useGameStore(s => s.nextRound);
  const battles             = useGameStore(s => s.battles);
  const currentRound        = useGameStore(s => s.currentRound);
  const score               = useGameStore(s => s.score);
  const hintsUsedThisRound  = useGameStore(s => s.hintsUsedThisRound);
  const roundResults        = useGameStore(s => s.roundResults);

  const [lastAnswerResult, setLastAnswerResult] = useState<{
    correct: boolean;
    points: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      startGame(difficulty, filter);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    return () => {
      // leave the store in place; Results reads from it
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const battle = battles[currentRound];

  const distractors = useMemo(() => {
    if (!battle || difficulty !== 'easy') return [];
    return selectDistractors(battle, allBattles).map(b => b.name);
  }, [battle?.id, difficulty]);

  const options = useMemo(() => {
    if (!battle) return [];
    return shuffle([battle.name, ...distractors]);
  }, [battle?.id, distractors]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{error}</Text>
      </View>
    );
  }
  if (!battle) {
    return <View style={styles.center}><Text style={styles.meta}>Loading…</Text></View>;
  }

  const handleAnswer = (answer: string) => {
    const r = submitAnswer(answer);
    setLastAnswerResult(r);
  };

  const handleNext = () => {
    const isLast = currentRound === ROUNDS_PER_GAME - 1;
    if (isLast) {
      const finalScore = score; // already includes last round
      const finalResults = roundResults;
      navigation.replace('Results', {
        difficulty,
        filter,
        score: finalScore,
        results: finalResults,
      });
      reset();
    } else {
      setLastAnswerResult(null);
      nextRound();
    }
  };

  const onDemand    = difficulty !== 'easy';
  const maxHints    = difficulty === 'easy' ? 1 : 4;
  const revealedCount = difficulty === 'easy' ? 1 : hintsUsedThisRound;
  const answered      = lastAnswerResult !== null;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.topbar}>
        <Text style={styles.meta}>Round {currentRound + 1} / {ROUNDS_PER_GAME}</Text>
        <Text style={styles.meta}>Score {score}</Text>
        <Text style={[styles.meta, styles.badge]}>{difficulty.toUpperCase()}</Text>
      </View>

      <BattleImage battleId={battle.id} />

      <HintPanel
        hints={battle.hints}
        revealedCount={revealedCount}
        onRequestHint={useHint}
        maxHints={maxHints}
        onDemand={onDemand}
      />

      {difficulty === 'easy' ? (
        <MultipleChoice options={options} onPick={handleAnswer} disabled={answered} />
      ) : (
        <TextAnswer onSubmit={handleAnswer} disabled={answered} />
      )}

      {answered && lastAnswerResult && (
        <View style={{ marginTop: spacing.md }}>
          <RevealCard
            battle={battle}
            correct={lastAnswerResult.correct}
            pointsEarned={lastAnswerResult.points}
            lastRound={currentRound === ROUNDS_PER_GAME - 1}
            onNext={handleNext}
          />
        </View>
      )}
    </ScrollView>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  err: { color: colors.wrong, fontSize: font.sizeMd, textAlign: 'center' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { color: colors.textMuted, fontSize: font.sizeSm },
  badge: { color: colors.primaryOn, backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, fontWeight: font.weightBold, overflow: 'hidden' },
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors (ResultsScreen is still the only missing piece).

- [ ] **Step 3: Commit**

```bash
git add src/screens/GameScreen.tsx
git commit -m "feat(game-screen): 10-round flow with MC/text input and reveal"
```

---

## Task 13: Results screen

**Files:**
- Create: `src/screens/ResultsScreen.tsx`

- [ ] **Step 1: Implement `ResultsScreen.tsx`**

```tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ROUNDS_PER_GAME } from '../game/selectBattles';
import { colors, font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export default function ResultsScreen({ route, navigation }: Props) {
  const { score, results, difficulty, filter } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.score}>{score} / {ROUNDS_PER_GAME * 10}</Text>
      <Text style={styles.sub}>{results.filter(r => r.correct).length} of {ROUNDS_PER_GAME} correct</Text>

      <View style={styles.list}>
        {results.map((r, i) => (
          <View key={`${r.battleId}-${i}`} style={styles.row}>
            <Text style={styles.idx}>{i + 1}.</Text>
            <Text style={styles.name} numberOfLines={1}>{r.battleName}</Text>
            <Text style={[styles.mark, r.correct ? styles.markOk : styles.markNo]}>
              {r.correct ? '✓' : '✗'} {r.pointsEarned}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => navigation.replace('Game', { difficulty, filter })}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaText}>Play Again</Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.popToTop()}
        style={({ pressed }) => [styles.ctaAlt, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaAltText}>Home</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.sm },
  score:  { color: colors.text, fontSize: font.sizeXxl, fontWeight: font.weightBold, textAlign: 'center', marginTop: spacing.lg },
  sub:    { color: colors.textMuted, fontSize: font.sizeMd, textAlign: 'center', marginBottom: spacing.lg },
  list:   { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  row:    { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, gap: spacing.sm },
  idx:    { color: colors.textMuted, width: 28, fontSize: font.sizeSm },
  name:   { color: colors.text, flex: 1, fontSize: font.sizeMd },
  mark:   { fontWeight: font.weightBold, fontSize: font.sizeMd },
  markOk: { color: colors.correct },
  markNo: { color: colors.wrong },
  cta:    { marginTop: spacing.xl, backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  ctaAlt: { marginTop: spacing.sm, backgroundColor: colors.surface, paddingVertical: spacing.lg, borderRadius: radius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: colors.primaryOn, fontWeight: font.weightBold, fontSize: font.sizeLg },
  ctaAltText: { color: colors.text, fontWeight: font.weightBold, fontSize: font.sizeLg },
});
```

- [ ] **Step 2: Full type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Full test suite**

```bash
npm test
```

Expected: all prior suites still pass.

- [ ] **Step 4: Commit**

```bash
git add src/screens/ResultsScreen.tsx
git commit -m "feat(results): final score, per-round recap, play-again"
```

---

## Task 14: End-to-end smoke test in Expo Go

**Files:** none.

- [ ] **Step 1: Start the Expo dev server**

```bash
npx expo start
```

Expected: a QR code appears in the terminal and the Metro bundler waits for connections.

- [ ] **Step 2: Load on a real device via Expo Go**

Scan the QR code with the Expo Go app (iOS or Android). Expected: the bundle downloads and the Home screen renders.

- [ ] **Step 3: Verify acceptance criteria from the spec (manual checklist)**

Run through each criterion from the spec once and confirm:

1. QR → Expo Go loads the app. ✓ / ✗
2. Home shows three difficulty options + Start. ✓ / ✗
3. Easy mode: 4 MC buttons + 1 pre-revealed hint. ✓ / ✗
4. Medium/Hard: text input + up to 4 on-demand hints. ✓ / ✗
5. A game = exactly 10 rounds, no duplicates. (Count rounds; check that no battle name repeats.) ✓ / ✗
6. Fuzzy matcher: try a diacritic variant (`é` vs `e`) and a 1–2 char typo; confirm both accepted. ✓ / ✗
7. Results screen: score / 100, per-round ✓/✗ list, Play Again button. ✓ / ✗
8. All 235 battle images bundled. (A shallow check: run several games at each difficulty; image always renders, never the grey placeholder.) ✓ / ✗

- [ ] **Step 4: If any criterion fails, file follow-up tasks rather than patching blindly**

Open a new plan or task list for fixes. Do not edit the current plan — it is frozen once acceptance is started.

- [ ] **Step 5: Commit nothing (smoke test only). Tag the release candidate:**

```bash
git tag v1.0.0-rc1
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task(s) |
|---|---|
| Expo Go, `npx expo start` → QR | 1, 14 |
| Three difficulty levels with different gameplay | 6, 10, 11, 12 |
| All 235 images bundled | 4 |
| Offline capable | 4 (local `require()`s) |
| Tech stack (Expo 52, RN, TS, RN-Nav, Zustand, expo-image) | 1, 8, 9 |
| Fixed 10 rounds, no duplicates | 7, 8 |
| Distractor rules for Easy | 7, 12 |
| Fuzzy match with normalize + Levenshtein ≤ 2 (length ≥ 6) | 5 |
| Reveal card after each answer | 10, 12 |
| Home / Game / Results screens | 11, 12, 13 |
| Zustand store shape | 8 |
| Battle data port from reference repo | 3 |
| Script for generated image map | 4 |
| Unit tests for pure logic | 5, 6, 7, 8 |

All 8 acceptance criteria are covered.

**Placeholder scan:** No TODOs, no "handle errors appropriately", no "similar to above". Each step contains the actual code or the exact command it runs.

**Type consistency:** `Battle` shape is defined once in Task 2 and imported everywhere. Store method names (`startGame`, `startGameWithBattles`, `submitAnswer`, `useHint`, `nextRound`, `reset`) are consistent across Task 8 tests, Task 8 implementation, Task 12 consumer. `ROUNDS_PER_GAME` is defined once in Task 7 and imported by Tasks 12 and 13. `CivilizationId` string literals in Task 2 match those used in the distractor test (Task 7). `getBattleImage` is defined in Task 4 and consumed in Task 10.

**Known drifts from the spec (called out above):**

- Spec's `battleImages` keyed by string; this plan uses numeric keys to match the reference repo's `Battle.id: number`.
- Spec's Home "era" filter is implemented as a civilization filter, since the reference data has no `era` field. Label remains "Era / Region".
