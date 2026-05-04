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
