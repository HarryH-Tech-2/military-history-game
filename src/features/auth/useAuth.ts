import { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { ensureUserProfile, fetchUserProfile } from '../../services/userProfile';
import { useProgressStore } from '../../state/useProgressStore';

export function useAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(auth().currentUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return auth().onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await ensureUserProfile({
          uid: u.uid,
          displayName: u.displayName ?? u.email?.split('@')[0] ?? 'Player',
          photoURL: u.photoURL,
        });
        const profile = await fetchUserProfile(u.uid);
        if (profile) useProgressStore.getState().hydrate({
          totalPoints: profile.totalPoints,
          unlockedEras: profile.unlockedEras,
          currentEra: profile.currentEra,
          eraScores: profile.eraScores,
        });
      } else {
        useProgressStore.getState().reset();
      }
      setInitializing(false);
    });
  }, []);

  return { user, initializing, signOut: () => auth().signOut() };
}
