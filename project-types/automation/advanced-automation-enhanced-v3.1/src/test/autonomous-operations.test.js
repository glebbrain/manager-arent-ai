const AutonomousOperations = require('../modules/autonomous-operations');
const logger = require('../modules/logger');

// Mock logger
jest.mock('../modules/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('AutonomousOperations', () => {
  let operations;

  beforeEach(() => {
    operations = new AutonomousOperations();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (operations) {
      operations.stop();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(operations.isRunning).toBe(false);
      expect(operations.decisionEngine).toBe('ai');
      expect(operations.resourceManagement).toBe(true);
      expect(operations.learning).toBe(true);
    });

    test('should start successfully', async () => {
      await operations.start();
      expect(operations.isRunning).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Autonomous operations system started');
    });

    test('should stop successfully', async () => {
      await operations.start();
      await operations.stop();
      expect(operations.isRunning).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('Autonomous operations system stopped');
    });
  });

  describe('Decision Making', () => {
    test('should make autonomous decision', async () => {
      const context = {
        systemLoad: 0.8,
        availableResources: 0.6,
        priority: 'high'
      };

      const decision = await operations.makeDecision(context);
      expect(decision).toHaveProperty('action');
      expect(decision).toHaveProperty('confidence');
      expect(decision).toHaveProperty('timestamp');
    });

    test('should handle decision making errors', async () => {
      const invalidContext = null;

      await expect(operations.makeDecision(invalidContext))
        .rejects.toThrow('Invalid context for decision making');
    });

    test('should get decision history', () => {
      const history = operations.getDecisionHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Resource Management', () => {
    test('should allocate resources', async () => {
      const resourceRequest = {
        cpu: 1000,
        memory: 512,
        storage: 1024,
        priority: 'high'
      };

      const allocation = await operations.allocateResources(resourceRequest);
      expect(allocation).toHaveProperty('allocated');
      expect(allocation).toHaveProperty('resources');
    });

    test('should deallocate resources', async () => {
      const resourceId = 'resource-1';
      await operations.deallocateResources(resourceId);
      expect(logger.info).toHaveBeenCalledWith(`Resources deallocated: ${resourceId}`);
    });

    test('should get resource status', () => {
      const status = operations.getResourceStatus();
      expect(status).toHaveProperty('total');
      expect(status).toHaveProperty('allocated');
      expect(status).toHaveProperty('available');
    });
  });

  describe('Learning', () => {
    test('should learn from experience', async () => {
      const experience = {
        action: 'scale-up',
        context: { load: 0.9 },
        outcome: 'success',
        reward: 1.0
      };

      await operations.learnFromExperience(experience);
      expect(logger.info).toHaveBeenCalledWith('Learning from experience');
    });

    test('should update model', async () => {
      const modelData = {
        name: 'decision-model',
        type: 'reinforcement-learning',
        parameters: { learningRate: 0.01 }
      };

      await operations.updateModel(modelData);
      expect(operations.models['decision-model']).toEqual(modelData);
    });

    test('should get learning metrics', () => {
      const metrics = operations.getLearningMetrics();
      expect(metrics).toHaveProperty('accuracy');
      expect(metrics).toHaveProperty('loss');
      expect(metrics).toHaveProperty('episodes');
    });
  });

  describe('Task Execution', () => {
    test('should execute task autonomously', async () => {
      const task = {
        id: 'task-1',
        type: 'data-processing',
        priority: 'medium',
        parameters: { input: 'data.csv' }
      };

      const result = await operations.executeTask(task);
      expect(result).toHaveProperty('taskId');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('result');
    });

    test('should handle task execution errors', async () => {
      const invalidTask = {
        id: 'task-1',
        // Missing required fields
      };

      await expect(operations.executeTask(invalidTask))
        .rejects.toThrow('Invalid task definition');
    });

    test('should get task status', () => {
      const status = operations.getTaskStatus('task-1');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('progress');
    });
  });

  describe('Monitoring', () => {
    test('should monitor system health', async () => {
      const health = await operations.monitorSystemHealth();
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('components');
      expect(health).toHaveProperty('timestamp');
    });

    test('should get performance metrics', () => {
      const metrics = operations.getPerformanceMetrics();
      expect(metrics).toHaveProperty('throughput');
      expect(metrics).toHaveProperty('latency');
      expect(metrics).toHaveProperty('errorRate');
    });

    test('should get operational status', () => {
      const status = operations.getOperationalStatus();
      expect(status).toHaveProperty('autonomous');
      expect(status).toHaveProperty('learning');
      expect(status).toHaveProperty('resourceManagement');
    });
  });

  describe('Configuration', () => {
    test('should update configuration', async () => {
      const config = {
        decisionEngine: 'hybrid',
        resourceManagement: false,
        learning: true
      };

      await operations.updateConfiguration(config);
      expect(operations.decisionEngine).toBe('hybrid');
      expect(operations.resourceManagement).toBe(false);
      expect(operations.learning).toBe(true);
    });

    test('should get current configuration', () => {
      const config = operations.getConfiguration();
      expect(config).toHaveProperty('decisionEngine');
      expect(config).toHaveProperty('resourceManagement');
      expect(config).toHaveProperty('learning');
    });
  });

  describe('Error Handling', () => {
    test('should handle system errors gracefully', async () => {
      const error = new Error('System error');
      await operations.handleSystemError(error);
      expect(logger.error).toHaveBeenCalledWith('System error handled', error);
    });

    test('should recover from failures', async () => {
      const failure = {
        component: 'decision-engine',
        error: 'Connection timeout',
        timestamp: new Date()
      };

      await operations.recoverFromFailure(failure);
      expect(logger.info).toHaveBeenCalledWith('Recovery initiated for decision-engine');
    });
  });
});
