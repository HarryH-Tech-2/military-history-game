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
