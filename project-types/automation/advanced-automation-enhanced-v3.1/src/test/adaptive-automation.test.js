const AdaptiveAutomation = require('../modules/adaptive-automation');
const logger = require('../modules/logger');

// Mock logger
jest.mock('../modules/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('AdaptiveAutomation', () => {
  let automation;

  beforeEach(() => {
    automation = new AdaptiveAutomation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (automation) {
      automation.stop();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(automation.isRunning).toBe(false);
      expect(automation.adaptations).toEqual([]);
      expect(automation.environmentAdaptation).toBe(true);
      expect(automation.learningCapabilities).toBe(true);
    });

    test('should start successfully', async () => {
      await automation.start();
      expect(automation.isRunning).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Adaptive automation system started');
    });

    test('should stop successfully', async () => {
      await automation.start();
      await automation.stop();
      expect(automation.isRunning).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('Adaptive automation system stopped');
    });
  });

  describe('Environment Adaptation', () => {
    test('should adapt to environment changes', async () => {
      const environmentChange = {
        type: 'load-increase',
        metrics: { cpu: 0.9, memory: 0.8 },
        timestamp: new Date()
      };

      const adaptation = await automation.adaptToEnvironment(environmentChange);
      expect(adaptation).toHaveProperty('adaptationId');
      expect(adaptation).toHaveProperty('type');
      expect(adaptation).toHaveProperty('changes');
      expect(adaptation).toHaveProperty('timestamp');
    });

    test('should handle invalid environment data', async () => {
      const invalidChange = null;

      await expect(automation.adaptToEnvironment(invalidChange))
        .rejects.toThrow('Invalid environment change data');
    });

    test('should get adaptation history', () => {
      const history = automation.getAdaptationHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Learning Capabilities', () => {
    test('should learn from patterns', async () => {
      const pattern = {
        type: 'performance-pattern',
        data: { load: 0.8, responseTime: 100 },
        outcome: 'success'
      };

      await automation.learnFromPattern(pattern);
      expect(logger.info).toHaveBeenCalledWith('Learning from pattern: performance-pattern');
    });

    test('should update learning model', async () => {
      const modelUpdate = {
        type: 'reinforcement-learning',
        parameters: { learningRate: 0.01, epsilon: 0.1 },
        data: { episodes: 100, rewards: [1, 0, 1, 1] }
      };

      await automation.updateLearningModel(modelUpdate);
      expect(automation.learningModels['reinforcement-learning']).toEqual(modelUpdate);
    });

    test('should get learning metrics', () => {
      const metrics = automation.getLearningMetrics();
      expect(metrics).toHaveProperty('accuracy');
      expect(metrics).toHaveProperty('loss');
      expect(metrics).toHaveProperty('episodes');
    });
  });

  describe('Flexible Configuration', () => {
    test('should update configuration dynamically', async () => {
      const configUpdate = {
        adaptationThreshold: 0.8,
        learningRate: 0.01,
        maxAdaptations: 10
      };

      await automation.updateConfiguration(configUpdate);
      expect(automation.config.adaptationThreshold).toBe(0.8);
      expect(automation.config.learningRate).toBe(0.01);
      expect(automation.config.maxAdaptations).toBe(10);
    });

    test('should get current configuration', () => {
      const config = automation.getConfiguration();
      expect(config).toHaveProperty('adaptationThreshold');
      expect(config).toHaveProperty('learningRate');
      expect(config).toHaveProperty('maxAdaptations');
    });

    test('should validate configuration', () => {
      const validConfig = {
        adaptationThreshold: 0.8,
        learningRate: 0.01,
        maxAdaptations: 10
      };

      const isValid = automation.validateConfiguration(validConfig);
      expect(isValid).toBe(true);
    });

    test('should reject invalid configuration', () => {
      const invalidConfig = {
        adaptationThreshold: 1.5, // Invalid: should be between 0 and 1
        learningRate: -0.01, // Invalid: should be positive
        maxAdaptations: -5 // Invalid: should be positive
      };

      const isValid = automation.validateConfiguration(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('Adaptive Strategies', () => {
    test('should apply adaptive strategy', async () => {
      const strategy = {
        name: 'load-balancing',
        type: 'performance',
        parameters: { threshold: 0.8, action: 'scale-up' }
      };

      const result = await automation.applyStrategy(strategy);
      expect(result).toHaveProperty('strategyId');
      expect(result).toHaveProperty('applied');
      expect(result).toHaveProperty('timestamp');
    });

    test('should get available strategies', () => {
      const strategies = automation.getAvailableStrategies();
      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBeGreaterThan(0);
    });

    test('should get strategy effectiveness', () => {
      const effectiveness = automation.getStrategyEffectiveness('load-balancing');
      expect(effectiveness).toHaveProperty('successRate');
      expect(effectiveness).toHaveProperty('averageImprovement');
      expect(effectiveness).toHaveProperty('usageCount');
    });
  });

  describe('Performance Monitoring', () => {
    test('should monitor performance', async () => {
      const performance = await automation.monitorPerformance();
      expect(performance).toHaveProperty('throughput');
      expect(performance).toHaveProperty('latency');
      expect(performance).toHaveProperty('errorRate');
      expect(performance).toHaveProperty('adaptationRate');
    });

    test('should get performance trends', () => {
      const trends = automation.getPerformanceTrends();
      expect(trends).toHaveProperty('throughputTrend');
      expect(trends).toHaveProperty('latencyTrend');
      expect(trends).toHaveProperty('errorRateTrend');
    });
  });

  describe('Error Handling', () => {
    test('should handle adaptation errors', async () => {
      const error = new Error('Adaptation failed');
      await automation.handleAdaptationError(error);
      expect(logger.error).toHaveBeenCalledWith('Adaptation error handled', error);
    });

    test('should recover from failures', async () => {
      const failure = {
        component: 'adaptation-engine',
        error: 'Configuration conflict',
        timestamp: new Date()
      };

      await automation.recoverFromFailure(failure);
      expect(logger.info).toHaveBeenCalledWith('Recovery initiated for adaptation-engine');
    });
  });

  describe('Integration', () => {
    test('should integrate with other systems', async () => {
      const integration = {
        system: 'monitoring',
        type: 'metrics',
        configuration: { endpoint: 'http://monitoring:9090' }
      };

      await automation.integrate(integration);
      expect(automation.integrations['monitoring']).toEqual(integration);
    });

    test('should get integration status', () => {
      const status = automation.getIntegrationStatus('monitoring');
      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('lastSync');
      expect(status).toHaveProperty('health');
    });
  });
});
