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

interface CredentialManagerNativeModule {
  getCredential(options: { googleWebClientId: string }): Promise<CredentialResult>;
}

function getNativeModule(): CredentialManagerNativeModule {
  const mod = (NativeModules as { CredentialManager?: CredentialManagerNativeModule })
    .CredentialManager;
  if (!mod) {
    throw Object.assign(
      new Error(
        'Google Sign-In is unavailable: the Credential Manager native module is not loaded. ' +
          'Rebuild the dev client with `eas build --profile development --platform android` ' +
          'and reinstall the new APK.',
      ),
      { code: 'CM_NATIVE_MODULE_MISSING' },
    );
  }
  return mod;
}

export async function signInWithCredentialManager(): Promise<void> {
  if (Platform.OS !== 'android') throw new Error('Credential Manager is Android-only');
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw Object.assign(
      new Error('Google Sign-In is not configured (missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID).'),
      { code: 'CM_MISSING_CLIENT_ID' },
    );
  }
  const module = getNativeModule();
  const result = await module.getCredential({ googleWebClientId: webClientId });
  if (result.type === 'google') {
    const cred = auth.GoogleAuthProvider.credential(result.idToken);
    await auth().signInWithCredential(cred);
  } else {
    await auth().signInWithEmailAndPassword(result.username, result.password);
  }
}
