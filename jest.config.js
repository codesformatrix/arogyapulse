/**
 * Jest configuration (ESM).
 *
 * Run through `npm test`, which sets NODE_OPTIONS=--experimental-vm-modules so
 * Jest can execute native ES modules.
 */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  transform: {},
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/public/**',
    '!src/config/env.js',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  verbose: false,
  testTimeout: 20_000,
};
