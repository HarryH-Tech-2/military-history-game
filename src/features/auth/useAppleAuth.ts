import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

export async function signInWithApple() {
  if (Platform.OS !== 'ios') throw new Error('Apple Sign-In is iOS-only');
  const rawNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${Date.now()}-${Math.random()}`,
  );
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: rawNonce,
  });
  if (!credential.identityToken) throw new Error('No identity token from Apple');
  const fbCredential = auth.AppleAuthProvider.credential(credential.identityToken, rawNonce);
  return auth().signInWithCredential(fbCredential);
}
