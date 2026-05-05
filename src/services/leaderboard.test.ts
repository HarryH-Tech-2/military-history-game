const mockUsersGet = jest.fn();
const mockScoresGet = jest.fn();
const mockUserOrderBy = jest.fn(() => ({ limit: jest.fn(() => ({ get: mockUsersGet })) }));
const mockScoresWhere = jest.fn(() => ({ get: mockScoresGet }));

jest.mock('@react-native-firebase/firestore', () => {
  const fn: any = jest.fn(() => ({
    collection: jest.fn((name: string) => name === 'users'
      ? { orderBy: mockUserOrderBy }
      : { where: mockScoresWhere }),
  }));
  return { __esModule: true, default: fn };
});

import { fetchAllTimeTop, fetchWeeklyTop } from './leaderboard';

beforeEach(() => { mockUsersGet.mockReset(); mockScoresGet.mockReset(); });

it('fetchAllTimeTop returns mapped rows', async () => {
  mockUsersGet.mockResolvedValueOnce({
    docs: [
      { id: 'u1', data: () => ({ displayName: 'A', photoURL: null, totalPoints: 90 }) },
      { id: 'u2', data: () => ({ displayName: 'B', photoURL: null, totalPoints: 50 }) },
    ],
  });
  const rows = await fetchAllTimeTop(100);
  expect(rows).toEqual([
    { uid: 'u1', displayName: 'A', photoURL: null, points: 90 },
    { uid: 'u2', displayName: 'B', photoURL: null, points: 50 },
  ]);
});

it('fetchWeeklyTop aggregates scores by uid', async () => {
  mockScoresGet.mockResolvedValueOnce({
    docs: [
      { data: () => ({ uid: 'u1', displayName: 'A', photoURL: null, pointsEarned: 10 }) },
      { data: () => ({ uid: 'u1', displayName: 'A', photoURL: null, pointsEarned: 20 }) },
      { data: () => ({ uid: 'u2', displayName: 'B', photoURL: null, pointsEarned: 25 }) },
    ],
  });
  const rows = await fetchWeeklyTop(100);
  expect(rows[0]).toEqual({ uid: 'u1', displayName: 'A', photoURL: null, points: 30 });
  expect(rows[1]).toEqual({ uid: 'u2', displayName: 'B', photoURL: null, points: 25 });
});
