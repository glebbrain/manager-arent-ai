// Test setup file
// This file is run before each test file

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
global.testUtils = {
  // Create mock data for testing
  createMockSensorData: () => ({
    deviceId: 'test-device',
    temperature: 75.5,
    pressure: 1013.25,
    vibration: 0.02,
    timestamp: new Date()
  }),

  // Create mock workflow definition
  createMockWorkflow: () => ({
    id: 'test-workflow',
    name: 'Test Workflow',
    steps: [
      { id: 'step-1', type: 'data-ingestion', config: {} },
      { id: 'step-2', type: 'data-transformation', config: {} }
    ],
    triggers: ['manual'],
    conditions: {}
  }),

  // Create mock task
  createMockTask: () => ({
    id: 'test-task',
    type: 'data-processing',
    priority: 'medium',
    parameters: { input: 'test-data.csv' }
  }),

  // Wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Increase timeout for integration tests
jest.setTimeout(10000);
