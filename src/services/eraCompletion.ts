import firestore from '@react-native-firebase/firestore';
import { EraId, NEXT_ERA } from '../data/eras';
import { eraUnlockThreshold } from '../game/scoring';
import { weekKey } from '../utils/weekKey';

export async function commitEraCompletion(args: {
  uid: string; displayName: string; photoURL: string | null;
  eraId: EraId; correct: number; points: number;
}) {
  const db = firestore();
  const userRef = db.collection('users').doc(args.uid);
  const scoreRef = db.collection('scores').doc();
  await db.runTransaction(async tx => {
    const snap = await tx.get(userRef);
    const data = (snap.data() ?? { totalPoints: 0, unlockedEras: ['ancient'], eraScores: {} }) as any;
    const prev = data.eraScores?.[args.eraId];
    const isBetter = !prev || args.points > prev.points;
    const points = isBetter ? args.points : prev.points;
    const correct = isBetter ? args.correct : prev.correct;
    const next = NEXT_ERA[args.eraId];
    const passed = args.correct >= eraUnlockThreshold;
    const unlockedEras = passed && next && !data.unlockedEras.includes(next)
      ? [...data.unlockedEras, next] : data.unlockedEras;
    const currentEra = passed && next ? next : data.currentEra ?? 'ancient';
    const totalPoints = (data.totalPoints ?? 0) + (points - (prev?.points ?? 0));
    tx.update(userRef, {
      totalPoints, unlockedEras, currentEra,
      [`eraScores.${args.eraId}`]: { correct, points },
    });
    tx.set(scoreRef, {
      uid: args.uid, displayName: args.displayName, photoURL: args.photoURL,
      eraId: args.eraId, pointsEarned: args.points, correctCount: args.correct,
      attemptedAt: firestore.FieldValue.serverTimestamp(),
      weekKey: weekKey(),
    });
  });
}
