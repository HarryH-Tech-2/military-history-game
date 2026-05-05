const mockTxOps = { update: jest.fn(), set: jest.fn(), get: jest.fn() };
const mockRunTx = jest.fn(async (cb: any) => cb(mockTxOps));

jest.mock('@react-native-firebase/firestore', () => {
  const userDoc = { id: 'u1' };
  const scoresDoc = { id: 'auto' };
  const userCol = { doc: jest.fn(() => userDoc) };
  const scoresCol = { doc: jest.fn(() => scoresDoc) };
  const fn: any = jest.fn(() => ({
    collection: jest.fn((c: string) => c === 'users' ? userCol : scoresCol),
    runTransaction: mockRunTx,
  }));
  fn.FieldValue = { serverTimestamp: () => 'TS', arrayUnion: (...v: any[]) => ({ arrayUnion: v }) };
  return { __esModule: true, default: fn };
});

import { commitEraCompletion } from './eraCompletion';

beforeEach(() => { mockTxOps.update.mockReset(); mockTxOps.set.mockReset(); mockTxOps.get.mockReset(); mockRunTx.mockClear(); });

it('writes a scores doc and updates user totals on pass', async () => {
  mockTxOps.get.mockResolvedValueOnce({ data: () => ({ totalPoints: 0, unlockedEras: ['ancient'], eraScores: {} }) });
  await commitEraCompletion({
    uid: 'u1', displayName: 'Tom', photoURL: null,
    eraId: 'ancient', correct: 8, points: 64,
  });
  expect(mockTxOps.set).toHaveBeenCalled();
  expect(mockTxOps.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
    totalPoints: 64,
  }));
});
