module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
      setupFiles: ['<rootDir>/jest-setup.ts'],
    },
    {
      displayName: 'integration',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/e2e/**/*.test.ts?(x)'],
      setupFiles: ['<rootDir>/jest-setup.ts'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|zustand))',
      ],
    },
  ],
};
