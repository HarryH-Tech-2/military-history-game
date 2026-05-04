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
