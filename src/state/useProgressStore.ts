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
