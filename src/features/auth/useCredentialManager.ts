import { NativeModules, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';

type GoogleCredentialResult = {
  type: 'google';
  idToken: string;
};
type PasswordCredentialResult = {
  type: 'password';
  username: string;
  password: string;
};
type CredentialResult = GoogleCredentialResult | PasswordCredentialResult;

export async function signInWithCredentialManager(): Promise<void> {
  if (Platform.OS !== 'android') throw new Error('Credential Manager is Android-only');
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
  const result: CredentialResult = await NativeModules.CredentialManager.getCredential({
    googleWebClientId: webClientId,
  });
  if (result.type === 'google') {
    const cred = auth.GoogleAuthProvider.credential(result.idToken);
    await auth().signInWithCredential(cred);
  } else {
    await auth().signInWithEmailAndPassword(result.username, result.password);
  }
}
