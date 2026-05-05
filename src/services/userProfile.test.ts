jest.mock('@react-native-firebase/firestore', () => {
  const docMock = { get: jest.fn(), set: jest.fn(), update: jest.fn() };
  const collMock = { doc: jest.fn(() => docMock) };
  const fn: any = jest.fn(() => ({ collection: jest.fn(() => collMock) }));
  fn.FieldValue = { serverTimestamp: () => 'TS' };
  fn._doc = docMock;
  return { __esModule: true, default: fn };
});

import { ensureUserProfile, fetchUserProfile } from './userProfile';
import firestore from '@react-native-firebase/firestore';
const docMock = (firestore as any)._doc;

beforeEach(() => jest.clearAllMocks());

describe('ensureUserProfile', () => {
  it('creates profile when none exists', async () => {
    docMock.get.mockResolvedValueOnce({ exists: () => false });
    await ensureUserProfile({ uid: 'u1', displayName: 'Tom', photoURL: null });
    expect(docMock.set).toHaveBeenCalledWith(expect.objectContaining({
      displayName: 'Tom', totalPoints: 0, unlockedEras: ['ancient'], currentEra: 'ancient',
    }));
  });

  it('does not overwrite existing profile', async () => {
    docMock.get.mockResolvedValueOnce({ exists: () => true });
    await ensureUserProfile({ uid: 'u1', displayName: 'Tom', photoURL: null });
    expect(docMock.set).not.toHaveBeenCalled();
  });
});

describe('fetchUserProfile', () => {
  it('returns null when missing', async () => {
    docMock.get.mockResolvedValueOnce({ exists: () => false });
    expect(await fetchUserProfile('u1')).toBeNull();
  });
  it('returns parsed data when present', async () => {
    docMock.get.mockResolvedValueOnce({ exists: () => true, data: () => ({
      displayName: 'Tom', photoURL: null, totalPoints: 50,
      unlockedEras: ['ancient'], currentEra: 'ancient', eraScores: {},
    }) });
    const p = await fetchUserProfile('u1');
    expect(p?.totalPoints).toBe(50);
  });
});
