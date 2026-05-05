import firestore from '@react-native-firebase/firestore';
import { weekKey } from '../utils/weekKey';

export interface LeaderboardRow {
  uid: string;
  displayName: string;
  photoURL: string | null;
  points: number;
}

export async function fetchAllTimeTop(limit: number): Promise<LeaderboardRow[]> {
  const snap = await firestore().collection('users').orderBy('totalPoints', 'desc').limit(limit).get();
  return snap.docs.map(d => {
    const data = d.data() as any;
    return { uid: d.id, displayName: data.displayName, photoURL: data.photoURL ?? null, points: data.totalPoints ?? 0 };
  });
}

export async function fetchWeeklyTop(limit: number): Promise<LeaderboardRow[]> {
  const snap = await firestore().collection('scores').where('weekKey', '==', weekKey()).get();
  const byUid = new Map<string, LeaderboardRow>();
  for (const doc of snap.docs) {
    const d = doc.data() as any;
    const existing = byUid.get(d.uid);
    if (existing) {
      existing.points += d.pointsEarned;
    } else {
      byUid.set(d.uid, {
        uid: d.uid, displayName: d.displayName, photoURL: d.photoURL ?? null, points: d.pointsEarned,
      });
    }
  }
  return Array.from(byUid.values()).sort((a, b) => b.points - a.points).slice(0, limit);
}

export async function fetchUserRank(uid: string, points: number): Promise<number> {
  const snap = await firestore()
    .collection('users')
    .where('totalPoints', '>', points)
    .count()
    .get();
  return snap.data().count + 1;
}
