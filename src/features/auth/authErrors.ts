// Maps Firebase Auth (and our native Credential Manager) error codes to friendly messages.

const FIREBASE_MAP: Record<string, string> = {
  'auth/invalid-credential': 'That email and password don\'t match. Try again or reset your password.',
  'auth/invalid-email': 'That email address doesn\'t look right.',
  'auth/user-not-found': 'No account found with that email. Want to sign up instead?',
  'auth/wrong-password': 'Incorrect password. Try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account already exists with that email. Try signing in.',
  'auth/weak-password': 'Choose a stronger password (at least 6 characters).',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
};

const NATIVE_MAP: Record<string, string> = {
  CM_NATIVE_MODULE_MISSING:
    'Google Sign-In isn\'t available in this build. Please update the app and try again.',
  CM_MISSING_CLIENT_ID: 'Google Sign-In isn\'t configured for this build.',
  CM_ERROR: 'Google Sign-In was cancelled or failed. Try again.',
  ERR_REQUEST_CANCELED: 'Sign-in was cancelled.',
  NO_ACTIVITY: 'Could not start sign-in. Please try again.',
};

export function mapAuthError(err: unknown): string {
  if (!err) return 'Something went wrong. Please try again.';
  const e = err as { code?: string; message?: string };

  if (e.code && FIREBASE_MAP[e.code]) return FIREBASE_MAP[e.code];
  if (e.code && NATIVE_MAP[e.code]) return NATIVE_MAP[e.code];

  // Try to extract a Firebase-style code from the message body.
  // @react-native-firebase often surfaces messages like:
  //   "[auth/invalid-credential] The supplied auth credential ..."
  if (typeof e.message === 'string') {
    const match = e.message.match(/\[(auth\/[a-z-]+)\]/i);
    if (match && FIREBASE_MAP[match[1]]) return FIREBASE_MAP[match[1]];
    // Fallback: return our own message if we threw it directly.
    if (e.code && e.code.startsWith('CM_') && e.message) return e.message;
  }

  return 'Sign-in failed. Please try again.';
}
