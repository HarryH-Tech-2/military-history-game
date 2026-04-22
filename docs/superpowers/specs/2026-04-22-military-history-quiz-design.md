# Military History Quiz — Design Spec

**Date:** 2026-04-22
**Status:** Approved for implementation planning

## Summary

A mobile quiz app (React Native + Expo) that shows AI-generated images of historical battles and asks the player to identify them. Images and battle data are ported from the reference web project [HarryH-Tech-2/battleguess-website](https://github.com/HarryH-Tech-2/battleguess-website).

Scope is a **core quiz with progression** (not a full clone of the reference app). Achievements, campaigns, timeline mode, blog, and i18n are explicitly out of scope for v1.

## Goals

- Playable via Expo Go on a phone (`npx expo start` → scan QR)
- Three difficulty levels with genuinely different gameplay
- Uses all 235 battle images from the reference repo
- Offline-capable (all assets bundled)

## Non-Goals (v1)

- App Store / Play Store submission (Expo Go testing is enough)
- User accounts, cloud saves, leaderboards
- Achievements, campaigns, collections, timelines
- Blog, FAQ, marketing pages
- Internationalization
- Endless / survival mode (fixed-rounds only for v1)

## Tech Stack

- **Expo SDK 52** (managed workflow), **React Native**, **TypeScript**
- **React Navigation** (native stack) — Home → Game → Results
- **Zustand** for game-session state
- **expo-image** for image rendering (caching, webp support)
- Battle data as TypeScript modules (ported from reference repo)
- All 235 battle images bundled locally under `assets/battles/`
- No backend; no persistence in v1

## Core Gameplay

### Difficulty levels

| Difficulty | Answer input       | Hints                       | Scoring                                |
| ---------- | ------------------ | --------------------------- | -------------------------------------- |
| Easy       | 4 multiple-choice  | Hint 1 shown immediately    | 10 for correct, 0 for wrong            |
| Medium     | Free text          | 0 shown; up to 4 on demand  | 10 − (2 × hints used), min 2 if correct |
| Hard       | Free text          | 0 shown; up to 4 on demand  | 10 − (2 × hints used), min 2 if correct |

Difficulty also filters which battles are eligible (via the battle's own `difficulty` field).

### Session structure

- Fixed 10 rounds per game.
- Battles picked at game start, filtered by difficulty and optional era, no duplicates within a session.
- Selection logic ported from the reference repo's `getRandomBattle`.

### Multiple-choice distractor selection (Easy)

For each round, pick 3 wrong answers: same `civilization` as the correct battle, different `id`, shuffled with the correct answer. If fewer than 3 same-civilization battles exist, fall back to random battles from any civilization.

### Fuzzy matching (Medium / Hard)

Normalize both input and each `acceptedAnswers` entry:
1. Lowercase
2. Strip diacritics (`é` → `e`)
3. Remove punctuation
4. Collapse whitespace

Accept if normalized input exactly matches any normalized accepted answer, OR if Levenshtein distance ≤ 2 for entries of length ≥ 6.

### Reveal card (after every answer)

Shows: correct name · year · location · 2-line description · ✓ or ✗ badge · **Next** button.

## Screens

### Home
- Title: **Military History Quiz**
- Difficulty cards: Easy / Medium / Hard (tap to select, visible selected state)
- Era filter: dropdown, defaults to "All eras"
- **Start Game** button (primary CTA)
- Footer: "Images from battleguess.app"

### Game
- Top bar: round counter (`3 / 10`), session score, difficulty badge
- Battle image (full-width, aspect-preserved, rounded corners)
- Hint panel (difficulty-dependent; see Gameplay)
- Answer area (multiple-choice buttons OR text input + Submit)
- Reveal overlay appears after each answer with a **Next** button

### Results
- Final score (e.g. `8 / 10`)
- Per-round list: thumbnail, battle name, ✓/✗, points earned
- **Play Again** (same settings) and **Home** buttons

## Architecture

### State (Zustand store — `useGameStore`)

```ts
interface GameState {
  difficulty: 'easy' | 'medium' | 'hard';
  filter: { era?: string };
  battles: Battle[];          // the 10 picked for this game
  currentRound: number;       // 0-indexed
  score: number;
  hintsUsedThisRound: number;
  roundResults: RoundResult[];
  startGame: (difficulty, filter) => void;
  submitAnswer: (answer: string) => { correct: boolean; points: number };
  useHint: () => void;
  nextRound: () => void;
  reset: () => void;
}
```

### Data flow

1. Home → user picks difficulty & filter → `startGame()`
2. `selectBattles()` picks 10 via filter + no-dupes logic
3. Navigate to Game screen; each round reads `battles[currentRound]`
4. On submit, `submitAnswer()` records result, updates score
5. On round 11 (after 10 answered), navigate to Results
6. **Play Again** → `startGame()` again with same params

### Project layout

```
military-history-app/
├── app.json                        # Expo config
├── package.json
├── tsconfig.json
├── App.tsx                         # Root + NavigationContainer
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── GameScreen.tsx
│   │   └── ResultsScreen.tsx
│   ├── components/
│   │   ├── BattleImage.tsx
│   │   ├── HintPanel.tsx
│   │   ├── MultipleChoice.tsx
│   │   ├── TextAnswer.tsx
│   │   └── RevealCard.tsx
│   ├── store/
│   │   └── gameStore.ts            # Zustand
│   ├── data/
│   │   ├── battles/                # ported from reference repo
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
│   │   └── battleImages.ts         # id → require(...) map (RN-adapted)
│   ├── game/
│   │   ├── selectBattles.ts        # 10 random, filtered, no dupes
│   │   ├── scoring.ts              # points per round
│   │   └── fuzzyMatch.ts           # normalize + Levenshtein
│   └── types.ts
└── assets/
    ├── icon.png
    ├── splash.png
    └── battles/                    # 235 webp files copied from reference repo
        ├── battle-1.webp
        ├── ...
        └── battle-235.webp
```

### Key adaptation from reference repo

The reference `battleImages.ts` uses string paths (`/battles/battle-1.webp`). React Native cannot resolve dynamic paths; it requires static `require()`s so Metro can bundle the asset. The ported file will be:

```ts
export const battleImages: Record<string, number> = {
  '1': require('../../assets/battles/battle-1.webp'),
  '2': require('../../assets/battles/battle-2.webp'),
  // ... 235 entries
};
```

This file will be generated by a small build script that scans `assets/battles/`.

## Testing Strategy

Pure game logic is covered by unit tests (Jest):

- `selectBattles`: filter honouring, no-dupes, correct count, same seed → same result
- `scoring`: each difficulty's point rules, hint penalty floor
- `fuzzyMatch`: exact, diacritics, punctuation, Levenshtein threshold, length guard

UI is verified manually in Expo Go during development.

## Running / Testing

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on iOS or Android. Hot reload works.

## Open Questions (none blocking)

- Splash/icon art — placeholder for now; can be designed later.
- Persisted high score — deferred to v2.
- Dark mode — out of scope for v1. A single neutral theme ships first.

## Acceptance Criteria

1. `npx expo start` produces a QR; scanning it in Expo Go loads the app.
2. Home screen shows three difficulty options and a Start button.
3. Easy mode shows 4 multiple-choice buttons and 1 pre-revealed hint.
4. Medium/Hard modes show a text input and up to 4 on-demand hints.
5. A game consists of exactly 10 rounds with no duplicate battles.
6. Fuzzy matcher accepts the canonical name, `acceptedAnswers` entries, diacritic variants, and typos within Levenshtein distance 2.
7. Results screen shows score out of 10, per-round ✓/✗ recap, and a Play Again button.
8. All 235 battle images from the reference repo are bundled and selectable.
