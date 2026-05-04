function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

export function fuzzyMatch(input: string, accepted: string[]): boolean {
  const guess = normalize(input);
  if (!guess) return false;
  for (const raw of accepted) {
    const target = normalize(raw);
    if (guess === target) return true;
    if (target.length > 6 && target.includes(guess) && guess.length >= 4) return true;
    if (levenshtein(guess, target) <= 2) return true;
  }
  return false;
}
