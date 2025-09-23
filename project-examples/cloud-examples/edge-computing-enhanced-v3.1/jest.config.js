module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/src/test/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setup.js'
  ],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/test/**',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  
  // Coverage ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/logs/',
    '/models/',
    '/data/'
  ],
  
  // Test results processor
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Global setup
  globalSetup: '<rootDir>/src/test/global-setup.js',
  
  // Global teardown
  globalTeardown: '<rootDir>/src/test/global-teardown.js'
};
