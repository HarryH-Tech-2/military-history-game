// Jest global setup. Intentionally empty in v1.
export {};

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Eagerly resolve expo winter lazy globals to prevent Jest 30 "outside of scope" errors.
// jest-expo sets lazy getters on global (structuredClone, __ExpoImportMetaRegistry, etc.)
// via expo/src/winter. In Jest 30, requiring modules from a lazy getter fires outside
// the allowed module-execution window. Mocking the leaf modules avoids the issue.
jest.mock('expo/src/winter/ImportMetaRegistry', () => ({
  ImportMetaRegistry: { url: null },
}));
jest.mock('@ungap/structured-clone', () => ({ default: (v: unknown) => JSON.parse(JSON.stringify(v)) }));

// Reanimated mock — prevents native module errors in jest-expo component tests.
// react-native-reanimated/mock itself requires react-native-worklets (not installed),
// so we provide a minimal manual mock instead.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Animated = {
    View,
    Text: View,
    ScrollView: View,
    FlatList: View,
    createAnimatedComponent: (C: any) => C,
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: (fn: any) => ({}),
    withTiming: (v: any) => v,
    withRepeat: (v: any) => v,
    withSpring: (v: any) => v,
    withDelay: (d: any, v: any) => v,
    Easing: {
      inOut: () => () => 0,
      quad: () => 0,
      linear: (t: any) => t,
    },
    FadeIn: { duration: () => ({ delay: () => ({}) }) },
    FadeOut: { duration: () => ({}) },
    FadeInDown: { duration: () => ({ delay: () => ({}) }) },
    Layout: { duration: () => ({}) },
    SlideInRight: { duration: () => ({}) },
  };
});

// expo-haptics mock — no native module available in test environment.
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  selectionAsync: jest.fn(),
}));

// expo-linear-gradient — render as plain View in tests (no native gradient).
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

// @react-native-firebase/auth mock — provides the minimum surface used by useAuth.
jest.mock('@react-native-firebase/auth', () => {
  const auth: any = () => ({
    currentUser: null,
    onAuthStateChanged: (_cb: unknown) => () => {},
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithCredential: jest.fn(),
    signOut: jest.fn(),
  });
  auth.GoogleAuthProvider = { credential: jest.fn() };
  auth.AppleAuthProvider = { credential: jest.fn() };
  return { __esModule: true, default: auth };
});

// @react-native-firebase/firestore — minimal mock.
jest.mock('@react-native-firebase/firestore', () => {
  const firestore: any = () => ({
    collection: () => ({ doc: () => ({ get: jest.fn(), set: jest.fn(), update: jest.fn() }) }),
    runTransaction: jest.fn(),
  });
  firestore.FieldValue = { serverTimestamp: () => null, increment: (n: number) => n };
  return { __esModule: true, default: firestore };
});
