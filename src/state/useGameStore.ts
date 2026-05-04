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
