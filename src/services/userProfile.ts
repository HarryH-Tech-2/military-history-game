import firestore from '@react-native-firebase/firestore';
import { EraId } from '../data/eras';
import { EraScore } from '../state/useProgressStore';

export interface UserProfile {
  displayName: string;
  photoURL: string | null;
  totalPoints: number;
  unlockedEras: EraId[];
  currentEra: EraId;
  eraScores: Partial<Record<EraId, EraScore>>;
}

const usersCol = () => firestore().collection('users');

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await usersCol().doc(uid).get();
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function ensureUserProfile(args: { uid: string; displayName: string; photoURL: string | null }) {
  const ref = usersCol().doc(args.uid);
  const snap = await ref.get();
  if (snap.exists()) return;
  await ref.set({
    displayName: args.displayName,
    photoURL: args.photoURL,
    totalPoints: 0,
    unlockedEras: ['ancient'],
    currentEra: 'ancient',
    eraScores: {},
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
}
