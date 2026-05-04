import { ERAS, getEraForYear, getBattlesForEra, NEXT_ERA } from './eras';

describe('ERAS', () => {
  it('contains 8 eras in chronological order', () => {
    expect(ERAS.map(e => e.id)).toEqual([
      'ancient', 'dark-ages', 'medieval', 'early-modern',
      'napoleonic', 'industrial', 'world-wars', 'modern',
    ]);
  });
});

describe('getEraForYear', () => {
  it.each([
    [-490, 'ancient'],
    [500, 'ancient'],
    [501, 'dark-ages'],
    [1000, 'dark-ages'],
    [1066, 'medieval'],
    [1500, 'medieval'],
    [1600, 'early-modern'],
    [1815, 'napoleonic'],
    [1900, 'industrial'],
    [1916, 'world-wars'],
    [1945, 'world-wars'],
    [1991, 'modern'],
    [2003, 'modern'],
  ])('year %i -> %s', (year, expected) => {
    expect(getEraForYear(year)).toBe(expected);
  });
});

describe('NEXT_ERA', () => {
  it('maps each era to the next, modern -> null', () => {
    expect(NEXT_ERA['ancient']).toBe('dark-ages');
    expect(NEXT_ERA['world-wars']).toBe('modern');
    expect(NEXT_ERA['modern']).toBeNull();
  });
});

describe('getBattlesForEra', () => {
  it('returns only battles within the era year range', () => {
    const battles = getBattlesForEra('medieval', 'seed-uid');
    battles.forEach(b => {
      expect(b.year).toBeGreaterThanOrEqual(1001);
      expect(b.year).toBeLessThanOrEqual(1500);
    });
  });

  it('returns at most 10 battles', () => {
    expect(getBattlesForEra('ancient', 'seed-uid').length).toBeLessThanOrEqual(10);
  });

  it('is deterministic for the same uid', () => {
    const a = getBattlesForEra('medieval', 'uid-A').map(b => b.id);
    const b = getBattlesForEra('medieval', 'uid-A').map(b => b.id);
    expect(a).toEqual(b);
  });

  it('produces different orderings for different uids', () => {
    const a = getBattlesForEra('medieval', 'uid-A').map(b => b.id);
    const b = getBattlesForEra('medieval', 'uid-B').map(b => b.id);
    expect(a).not.toEqual(b);
  });
});
