import auth from '@react-native-firebase/auth';

export async function emailSignIn(email: string, password: string) {
  return auth().signInWithEmailAndPassword(email, password);
}

export async function emailSignUp(email: string, password: string, displayName: string) {
  const cred = await auth().createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName });
  return cred;
}
