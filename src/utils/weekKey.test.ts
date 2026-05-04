import { weekKey } from './weekKey';

describe('weekKey', () => {
  it('formats as YYYY-Www with zero-padded week', () => {
    expect(weekKey(new Date('2026-01-05T12:00:00Z'))).toBe('2026-W02');
  });
  it('returns same key for two days in the same ISO week', () => {
    const mon = new Date('2026-05-04T00:00:00Z');
    const sun = new Date('2026-05-10T23:00:00Z');
    expect(weekKey(mon)).toBe(weekKey(sun));
  });
  it('returns different keys across week boundaries', () => {
    const sun = new Date('2026-05-10T23:00:00Z');
    const mon = new Date('2026-05-11T00:00:00Z');
    expect(weekKey(sun)).not.toBe(weekKey(mon));
  });
});
