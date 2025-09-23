module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/test/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  globalSetup: '<rootDir>/src/test/global-setup.js',
  globalTeardown: '<rootDir>/src/test/global-teardown.js',
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
