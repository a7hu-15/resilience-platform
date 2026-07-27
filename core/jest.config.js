const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@react-pdf/renderer|@react-pdf/primitives)/)',
  ],
  moduleNameMapper: {
    '^@kubernetes/client-node$': '<rootDir>/__mocks__/@kubernetes/client-node.js',
  },
};

module.exports = createJestConfig(customJestConfig);