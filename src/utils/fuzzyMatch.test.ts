import { fuzzyMatch } from './fuzzyMatch';

describe('fuzzyMatch', () => {
  const accepted = ['Battle of Hastings', 'Hastings'];

  it('matches exact name (case insensitive)', () => {
    expect(fuzzyMatch('battle of hastings', accepted)).toBe(true);
  });

  it('matches with leading/trailing whitespace', () => {
    expect(fuzzyMatch('  Hastings  ', accepted)).toBe(true);
  });

  it('matches one-character typos via Levenshtein <= 2', () => {
    expect(fuzzyMatch('Hastngs', accepted)).toBe(true);
  });

  it('matches substring containment for long names', () => {
    expect(fuzzyMatch('hastings', ['Battle of Hastings'])).toBe(true);
  });

  it('rejects clearly wrong answers', () => {
    expect(fuzzyMatch('Marathon', accepted)).toBe(false);
  });

  it('rejects empty input', () => {
    expect(fuzzyMatch('', accepted)).toBe(false);
    expect(fuzzyMatch('   ', accepted)).toBe(false);
  });
});
