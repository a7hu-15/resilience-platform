const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@kubernetes/client-node$': '<rootDir>/__mocks__/@kubernetes/client-node.js',
  },
};

module.exports = createJestConfig(customJestConfig);