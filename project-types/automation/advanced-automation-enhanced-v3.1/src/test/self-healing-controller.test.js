const SelfHealingController = require('../modules/self-healing-controller');
const logger = require('../modules/logger');

// Mock logger
jest.mock('../modules/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('SelfHealingController', () => {
  let controller;

  beforeEach(() => {
    controller = new SelfHealingController();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (controller) {
      controller.stop();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(controller.isRunning).toBe(false);
      expect(controller.healthChecks).toEqual([]);
      expect(controller.recoveryStrategies).toEqual([]);
    });

    test('should start successfully', async () => {
      await controller.start();
      expect(controller.isRunning).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Self-healing system started');
    });

    test('should stop successfully', async () => {
      await controller.start();
      await controller.stop();
      expect(controller.isRunning).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('Self-healing system stopped');
    });
  });

  describe('Health Monitoring', () => {
    test('should register health check', () => {
      const healthCheck = {
        name: 'test-check',
        check: jest.fn().mockResolvedValue(true),
        interval: 1000
      };

      controller.registerHealthCheck(healthCheck);
      expect(controller.healthChecks).toContain(healthCheck);
    });

    test('should execute health checks', async () => {
      const healthCheck = {
        name: 'test-check',
        check: jest.fn().mockResolvedValue(true),
        interval: 1000
      };

      controller.registerHealthCheck(healthCheck);
      await controller.start();

      // Wait for health check to execute
      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(healthCheck.check).toHaveBeenCalled();
    });

    test('should handle health check failures', async () => {
      const healthCheck = {
        name: 'failing-check',
        check: jest.fn().mockResolvedValue(false),
        interval: 100
      };

      controller.registerHealthCheck(healthCheck);
      await controller.start();

      // Wait for health check to execute
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Health check failed')
      );
    });
  });

  describe('Recovery Strategies', () => {
    test('should register recovery strategy', () => {
      const strategy = {
        name: 'test-strategy',
        canHandle: jest.fn().mockReturnValue(true),
        execute: jest.fn().mockResolvedValue(true)
      };

      controller.registerRecoveryStrategy(strategy);
      expect(controller.recoveryStrategies).toContain(strategy);
    });

    test('should execute recovery strategy on failure', async () => {
      const strategy = {
        name: 'test-strategy',
        canHandle: jest.fn().mockReturnValue(true),
        execute: jest.fn().mockResolvedValue(true)
      };

      controller.registerRecoveryStrategy(strategy);
      await controller.start();

      // Simulate failure
      await controller.handleFailure('test-error', { component: 'test' });

      expect(strategy.canHandle).toHaveBeenCalled();
      expect(strategy.execute).toHaveBeenCalled();
    });

    test('should not execute strategy if it cannot handle the error', async () => {
      const strategy = {
        name: 'test-strategy',
        canHandle: jest.fn().mockReturnValue(false),
        execute: jest.fn().mockResolvedValue(true)
      };

      controller.registerRecoveryStrategy(strategy);
      await controller.start();

      // Simulate failure
      await controller.handleFailure('test-error', { component: 'test' });

      expect(strategy.canHandle).toHaveBeenCalled();
      expect(strategy.execute).not.toHaveBeenCalled();
    });
  });

  describe('Auto-scaling', () => {
    test('should scale up when needed', async () => {
      const mockScaleUp = jest.fn().mockResolvedValue(true);
      controller.scaleUp = mockScaleUp;

      await controller.start();
      await controller.handleScaling('up', { reason: 'high-load' });

      expect(mockScaleUp).toHaveBeenCalledWith({ reason: 'high-load' });
    });

    test('should scale down when needed', async () => {
      const mockScaleDown = jest.fn().mockResolvedValue(true);
      controller.scaleDown = mockScaleDown;

      await controller.start();
      await controller.handleScaling('down', { reason: 'low-load' });

      expect(mockScaleDown).toHaveBeenCalledWith({ reason: 'low-load' });
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully', async () => {
      const healthCheck = {
        name: 'error-check',
        check: jest.fn().mockRejectedValue(new Error('Check failed')),
        interval: 100
      };

      controller.registerHealthCheck(healthCheck);
      await controller.start();

      // Wait for health check to execute
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Health check error')
      );
    });

    test('should handle recovery strategy errors', async () => {
      const strategy = {
        name: 'error-strategy',
        canHandle: jest.fn().mockReturnValue(true),
        execute: jest.fn().mockRejectedValue(new Error('Recovery failed'))
      };

      controller.registerRecoveryStrategy(strategy);
      await controller.start();

      await controller.handleFailure('test-error', { component: 'test' });

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Recovery strategy failed')
      );
    });
  });
});
