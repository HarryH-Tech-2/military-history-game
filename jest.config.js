module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      setupFiles: ['<rootDir>/jest-setup.ts'],
    },
    {
      displayName: 'component',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/src/**/*.test.tsx'],
      setupFiles: ['<rootDir>/jest-setup.ts'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|zustand|react-native-reanimated|react-native-gesture-handler|expo-haptics))',
      ],
    },
  ],
};
