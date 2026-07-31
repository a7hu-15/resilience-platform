const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  testTimeout: 60000,
  moduleNameMapper: {
    '^@kubernetes/client-node$': '<rootDir>/__mocks__/@kubernetes/client-node.js',
    '^@react-pdf/renderer$': '<rootDir>/__mocks__/@react-pdf/renderer.js',
  },
};

module.exports = createJestConfig(customJestConfig);