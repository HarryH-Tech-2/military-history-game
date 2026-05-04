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
