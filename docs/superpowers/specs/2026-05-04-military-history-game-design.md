# Military History Game — Design Spec

**Date:** 2026-05-04
**Status:** Draft, pending plan
**Target:** Expo (custom dev client / EAS build), Android + iOS

## 1. Summary

A Duolingo-style game where users guess historical battles from a hero image. The user is shown the year and one initial clue, can reveal up to three more clues at a points cost, and types the battle name. Players progress through 8 chronological eras (Ancient → Modern); each era is a round of 10 battles, and 7+ correct unlocks the next era. Scores feed weekly and all-time leaderboards backed by Firebase. Auth uses Android Credential Manager and iOS AuthenticationServices on top of Firebase Auth.

## 2. Goals & Non-Goals

### Goals
- Polished, distinctive visual identity (not a Duolingo clone aesthetically).
- Smooth onboarding: 4-slide carousel ending in sign-in.
- Modern auth: Credential Manager on Android, Sign in with Apple on iOS, email fallback.
- Locked, sequential era progression to drive engagement.
- Weekly + all-time leaderboards with sticky "your rank" row.
- Offline-first solo play; cloud sync on auth.

### Non-Goals (v1)
- Passkey *registration* flows (read-only stub only).
- Replaying completed eras.
- Friends / social graph.
- Share-to-social after a round.
- Push notifications, streak reminders.
- i18n.
- In-app purchases or ads.
- Editing profile (display name, avatar) post-signup.

## 3. Visual Direction

- **Palette:** ink-navy `#0E1B2C` background, parchment `#F2E8D5` text, bronze `#C8923B` accent, victory green `#3FAE7B`, defeat red `#D7544A`.
- **Type:** Inter (UI), Fraunces or system serif (battle names, era titles).
- **Surfaces:** rounded cards (radius 20), soft shadows, subtle parchment grain on hero surfaces only.
- **Motion:** spring entrances; clue tiles fade in sequentially; correct = confetti, wrong = brief shake. ≤300ms, never blocking input.
- **Battle image:** full-bleed hero with a slow Ken-Burns idle and parchment-vignette edges.

## 4. Game Mechanics

### Round structure
- A round = 10 battles within one era, played in order.
- Each battle starts with **1 clue** revealed (random pick from `battle.hints`).
- User may reveal up to **3 more** clues. Points scale: 10 → 8 → 6 → 4 → 2.
- The **year is always shown** as a chip alongside the hero image. The user types the battle name only.
- Submit → fuzzy match against `battle.acceptedAnswers` (lowercased/trimmed; Levenshtein ≤ 2 OR substring containment when name length > 6).
- Correct → award current `pointsAvailable`. Wrong → 0, reveal correct answer.
- After all 10 → era summary: total correct, total points. ≥ 7/10 → next era unlocked. < 7/10 → "Try again" reshuffles the same 10.

### Era buckets (chronological by `battle.year`)

| # | Id | Label | Year range |
|---|---|---|---|
| 1 | `ancient` | Ancient World | year ≤ 500 |
| 2 | `dark-ages` | Dark Ages | 501 – 1000 |
| 3 | `medieval` | Medieval | 1001 – 1500 |
| 4 | `early-modern` | Early Modern | 1501 – 1700 |
| 5 | `napoleonic` | Napoleonic & Colonial | 1701 – 1850 |
| 6 | `industrial` | Industrial Age | 1851 – 1913 |
| 7 | `world-wars` | World Wars | 1914 – 1945 |
| 8 | `modern` | Modern | 1946 – present |

`getBattlesForEra(eraId, uid)`:
1. Filter `BATTLES` by year range.
2. Deterministically shuffle using `uid` as seed.
3. Return first 10. If < 10 exist, return all available and log a dev warning.

### Progression
- Locked, sequential. Only the next-up era is playable; earlier eras display as completed (no replay v1); later eras are locked.
- `unlockedEras` starts at `["ancient"]`; appends on each successful era completion.

## 5. Architecture

### Stack
- Expo SDK 54, RN 0.81, TypeScript.
- **Custom dev client via EAS** (no Expo Go) — required for native auth modules.
- Zustand (client state) + AsyncStorage persistence.
- Firebase JS SDK (Firestore) + `@react-native-firebase/auth` (native auth).
- React Navigation v7 (already installed).
- Reanimated + Gesture Handler (motion).
- `expo-auth-session`, `expo-crypto`, `expo-apple-authentication`, `expo-haptics`.
- `react-hook-form` + `zod` (email-fallback form).
- Google Fonts: Inter, Fraunces.

### File structure
```
src/
  app/                    # entry + providers
    App.tsx
    providers/            # Firebase, Theme, Auth, GameStore
  navigation/             # RootNavigator, AuthStack, OnboardingStack, AppStack
  features/
    onboarding/           # carousel slides + screen
    auth/                 # SignInScreen, useCredentialManager, useAppleAuth
    game/                 # RoundScreen, BattleHero, ClueList, GuessInput, ResultSheet
    progress/             # EraMapScreen (path UI), useProgress
    leaderboard/          # LeaderboardScreen, Weekly + AllTime tabs
    profile/              # ProfileScreen, sign-out
  data/
    battles/              # (existing)
    battleImages.ts       # (existing, auto-generated)
    eras.ts               # NEW: chronological era definitions + bucketing
  services/
    firebase.ts           # init
    leaderboard.ts        # Firestore queries
    userProfile.ts        # CRUD on users/{uid}
  state/
    useGameStore.ts       # round state
    useProgressStore.ts   # eras/progress, AsyncStorage-persisted
  design/
    tokens.ts             # colors, spacing, radii, type
    components/           # Button, Card, Chip, Screen, ParchmentBackground
  utils/
    fuzzyMatch.ts
```

### Navigation tree
- `RootNavigator` selects on (auth state, `seenOnboarding` flag):
  - First launch ever → `OnboardingStack` (carousel → `AuthStack`).
  - Logged out → `AuthStack` (SignIn).
  - Logged in → `AppStack` (Tabs: Path / Leaderboard / Profile + modal `RoundScreen`).

## 6. Data Model

### Firestore schema
```
users/{uid}
  displayName: string
  photoURL: string | null
  createdAt: timestamp
  totalPoints: number
  unlockedEras: string[]      # e.g. ["ancient", "dark-ages"]
  currentEra: string          # next era to play

scores/{auto-id}
  uid: string
  displayName: string         # denormalized for leaderboard reads
  photoURL: string | null
  eraId: string
  pointsEarned: number
  correctCount: number        # 0..10
  attemptedAt: timestamp
  weekKey: string             # ISO week, e.g. "2026-W18"
```

### Persistence
- `useProgressStore` mirrors to AsyncStorage on every change AND to Firestore at era completion via `runTransaction`. Firestore = source of truth on login; local cache enables offline play.

## 7. Auth Flow

### Onboarding stack (first launch only; `seenOnboarding` AsyncStorage flag)
```
WelcomeCarousel (4 slides, swipeable, skippable)
  1: "Guess history's greatest battles."
  2: "One clue. One guess. Up to 10 points."
  3: "Use clues if you need them — they cost points."
  4: "Climb from antiquity to the modern age."
  → "Get started" → SignInScreen
```

### Sign-in screen (priority order, platform-conditional)
1. Sign in with Google (Android: Credential Manager · iOS: AuthSession OAuth).
2. Sign in with Apple (iOS only).
3. "or use email" link → email/password form.

Passkey is **not** in v1 — added in a follow-up once the Cloud Function for assertion verification is built.

### Android — Credential Manager
1. `CredentialManager.getCredential()` with `GetGoogleIdOption` + `GetPasswordOption` + `GetPublicKeyCredentialOption`.
2. On result:
   - `GoogleIdTokenCredential` → `firebase.auth().signInWithCredential(GoogleAuthProvider.credential(idToken))`.
   - Password credential → `signInWithEmailAndPassword`.
   - Passkey assertion → Cloud Function exchanges for Firebase custom token (deferred to post-v1).
3. Implemented as a thin Expo config plugin adding `androidx.credentials:credentials` + `googleid` Gradle deps and a Kotlin module exposing `getCredential(request)` to JS. Use `react-native-credential-manager-client` if its API is current; otherwise a custom ~60-line module.

### iOS — AuthenticationServices
1. `expo-apple-authentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL] })`.
2. `firebase.auth().signInWithCredential(OAuthProvider('apple.com').credential({ idToken, rawNonce }))`.
3. Passkey via `ASAuthorizationPlatformPublicKeyCredentialProvider` — deferred to post-v1.

### Email fallback (both platforms)
- Sign up: email + password + display name → `createUserWithEmailAndPassword` → write `users/{uid}`.
- Sign in: `signInWithEmailAndPassword`.

### Post-auth
1. If `users/{uid}` doesn't exist, create with `displayName` (from provider or email prefix), `totalPoints: 0`, `unlockedEras: ["ancient"]`, `currentEra: "ancient"`.
2. Hydrate `useProgressStore` from the doc.
3. Navigate to `AppStack`.

### Error handling
- User cancels Credential Manager picker → silently dismiss.
- Network/Firebase error → red toast with retry; preserve form input.
- iOS without Apple ID → fall back to email link.

## 8. Screens

### Path (home tab)
- Vertical scroll, oldest era at top.
- Each era = circular medallion (locked / current / completed states).
- Locked → grey + padlock; tap shows unlock requirement.
- Current → bronze glow + pulse + "Start".
- Completed → gold ring + checkmark + score (e.g. "8/10").
- Top: total points pill, rounds-played-today indicator.

### Round (modal)
```
EraIntro (1 sec) → "Era 1 · Ancient World"
RoundScreen ×10:
  ┌─────────────────────────┐
  │   [battle image hero]   │
  │       Year: 1066        │
  ├─────────────────────────┤
  │  Clue 1: "Fought near…" │
  │  [+ Reveal another clue │
  │     (-2 pts)]           │
  ├─────────────────────────┤
  │  [ guess input ]        │
  │  [   Submit   ]         │
  │  Points available: 10   │
  └─────────────────────────┘
ResultBanner overlay → ✓ "Battle of Marathon · +10 pts" / ✗ "It was Marathon"
EraSummary → "8/10 · 64 points" + unlock animation if ≥7
```

### Leaderboard
- Two tabs: **Weekly** · **All-time**.
- Row: rank · avatar · displayName · points; current user bronze-tinted.
- If user > rank 100: sticky footer with their actual rank.
- Pull-to-refresh.
- Empty state: "Be the first on the board — play your first era."

### Profile
- Avatar, display name, total points, eras completed, sign-out.
- No edit in v1.

## 9. Leaderboard Queries

- **All-time:** `users` ordered by `totalPoints` desc, limit 100.
- **Weekly:** v1 = client-side aggregation of last 7 days of `scores` filtered by current `weekKey`, summed by `uid`, limit 100. Acceptable up to ~thousands of docs/week. Migrate to a Cloud Function rollup if traffic warrants.
- **User's own rank:** Firestore count() aggregation on `users` where `totalPoints > current`.

## 10. State Management

```ts
// useGameStore (Zustand, in-memory only)
{
  eraId: string,
  battles: Battle[],
  currentIndex: number,
  cluesRevealed: number,    // 1..4
  pointsAvailable: number,  // 10/8/6/4/2
  results: RoundResult[],
  status: 'idle' | 'playing' | 'submitting' | 'finished'
}

// useProgressStore (Zustand, AsyncStorage-persisted, hydrated from Firestore on auth)
{
  totalPoints: number,
  unlockedEras: string[],
  currentEra: string,
  eraScores: Record<EraId, { correct: number; points: number }>
}
```

On era completion, batch a single Firestore transaction:
1. Append a `scores/{auto-id}` doc.
2. Update `users/{uid}.totalPoints` (+= round points), `unlockedEras` (append next if ≥7/10), `currentEra` (= next era id).

## 11. Testing Strategy

- **Unit (Jest, already configured):** `eras.ts` bucketing, `fuzzyMatch.ts`, scoring math, weekly-key derivation, transaction-input shape.
- **Component (React Native Testing Library):** `RoundScreen` state transitions (clue reveal, correct submit, wrong submit), `PathScreen` lock/unlock rendering.
- **Integration:** mocked Firestore via `@firebase/rules-unit-testing` (or in-memory fake) covering the era-completion transaction.
- **Native auth modules:** manual verification on EAS dev build only — cannot run in Jest.

## 12. Risks & Open Questions

- Existing battle dataset may have < 10 battles in some chronological buckets (e.g. Dark Ages). Mitigation: dev-time warning + plan to backfill data before launch.
- Credential Manager's GoogleId option requires a configured Web Client ID; we'll need that from the user/Firebase project setup.
- Apple's review may flag a game requiring sign-in; Sign in with Apple satisfies their parity rule.
- Weekly leaderboard client-side aggregation is fine for v1 traffic but will need a Cloud Function rollup at scale.
