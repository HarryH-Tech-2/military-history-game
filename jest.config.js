module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: [],
  setupFiles: ['<rootDir>/jest-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|zustand))',
  ],
  testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
};
