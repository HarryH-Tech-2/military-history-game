export const MIN_CLUES = 1;
export const MAX_CLUES = 4;
export const eraUnlockThreshold = 7;
export const battlesPerEra = 10;

export function pointsForClues(cluesRevealed: number): number {
  const c = Math.max(MIN_CLUES, Math.min(MAX_CLUES, cluesRevealed));
  return 12 - c * 2;
}
