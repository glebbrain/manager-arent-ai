const EdgeOptimizer = require('../modules/edge-optimizer');
const logger = require('../modules/logger');

describe('EdgeOptimizer', () => {
  let optimizer;
  
  beforeEach(() => {
    optimizer = new EdgeOptimizer({
      optimizationEnabled: true,
      optimizationLevel: 'balanced',
      latencyOptimization: true,
      throughputOptimization: true,
      resourceOptimization: true,
      energyOptimization: true,
      costOptimization: true
    });
  });
  
  afterEach(async () => {
    if (optimizer) {
      await optimizer.dispose();
    }
  });
  
  describe('Initialization', () => {
    test('should initialize with default config', () => {
      expect(optimizer.config).toBeDefined();
      expect(optimizer.config.optimizationEnabled).toBe(true);
      expect(optimizer.config.optimizationLevel).toBe('balanced');
      expect(optimizer.config.latencyOptimization).toBe(true);
      expect(optimizer.config.throughputOptimization).toBe(true);
      expect(optimizer.config.resourceOptimization).toBe(true);
      expect(optimizer.config.energyOptimization).toBe(true);
      expect(optimizer.config.costOptimization).toBe(true);
    });
    
    test('should initialize with custom config', () => {
      const customOptimizer = new EdgeOptimizer({
        optimizationEnabled: false,
        optimizationLevel: 'aggressive',
        latencyOptimization: false,
        throughputOptimization: false,
        resourceOptimization: false,
        energyOptimization: false,
        costOptimization: false
      });
      
      expect(customOptimizer.config.optimizationEnabled).toBe(false);
      expect(customOptimizer.config.optimizationLevel).toBe('aggressive');
      expect(customOptimizer.config.latencyOptimization).toBe(false);
      expect(customOptimizer.config.throughputOptimization).toBe(false);
      expect(customOptimizer.config.resourceOptimization).toBe(false);
      expect(customOptimizer.config.energyOptimization).toBe(false);
      expect(customOptimizer.config.costOptimization).toBe(false);
    });
  });
  
  describe('Optimization Status', () => {
    test('should get optimization status', () => {
      const status = optimizer.getOptimizationStatus();
      
      expect(status).toBeDefined();
      expect(status.enabled).toBe(true);
      expect(status.level).toBe('balanced');
      expect(status.interval).toBeDefined();
      expect(status.metrics).toBeDefined();
      expect(status.recentOptimizations).toBeDefined();
      expect(status.activeOptimizations).toBeDefined();
      expect(Array.isArray(status.recentOptimizations)).toBe(true);
      expect(Array.isArray(status.activeOptimizations)).toBe(true);
    });
  });
  
  describe('Metrics', () => {
    test('should get metrics', () => {
      const metrics = optimizer.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalOptimizations).toBe(0);
      expect(metrics.successfulOptimizations).toBe(0);
      expect(metrics.failedOptimizations).toBe(0);
      expect(metrics.averageLatency).toBe(0);
      expect(metrics.averageThroughput).toBe(0);
      expect(metrics.averageCpuUsage).toBe(0);
      expect(metrics.averageMemoryUsage).toBe(0);
      expect(metrics.averageBandwidthUsage).toBe(0);
      expect(metrics.averageEnergyUsage).toBe(0);
      expect(metrics.costSavings).toBe(0);
      expect(metrics.energySavings).toBe(0);
      expect(metrics.performanceImprovement).toBe(0);
    });
  });
  
  describe('Recommendations', () => {
    test('should get recommendations', () => {
      const recommendations = optimizer.getRecommendations();
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
  
  describe('Performance Measurement', () => {
    test('should measure latency', async () => {
      const latency = await optimizer.measureLatency();
      
      expect(latency).toBeDefined();
      expect(typeof latency).toBe('number');
      expect(latency).toBeGreaterThanOrEqual(0);
    });
    
    test('should measure throughput', async () => {
      const throughput = await optimizer.measureThroughput();
      
      expect(throughput).toBeDefined();
      expect(typeof throughput).toBe('number');
      expect(throughput).toBeGreaterThanOrEqual(0);
    });
    
    test('should measure CPU usage', async () => {
      const cpuUsage = await optimizer.measureCpuUsage();
      
      expect(cpuUsage).toBeDefined();
      expect(typeof cpuUsage).toBe('number');
      expect(cpuUsage).toBeGreaterThanOrEqual(0);
      expect(cpuUsage).toBeLessThanOrEqual(1);
    });
    
    test('should measure memory usage', async () => {
      const memoryUsage = await optimizer.measureMemoryUsage();
      
      expect(memoryUsage).toBeDefined();
      expect(typeof memoryUsage).toBe('number');
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
      expect(memoryUsage).toBeLessThanOrEqual(1);
    });
    
    test('should measure bandwidth usage', async () => {
      const bandwidthUsage = await optimizer.measureBandwidthUsage();
      
      expect(bandwidthUsage).toBeDefined();
      expect(typeof bandwidthUsage).toBe('number');
      expect(bandwidthUsage).toBeGreaterThanOrEqual(0);
      expect(bandwidthUsage).toBeLessThanOrEqual(1);
    });
    
    test('should measure energy usage', async () => {
      const energyUsage = await optimizer.measureEnergyUsage();
      
      expect(energyUsage).toBeDefined();
      expect(typeof energyUsage).toBe('number');
      expect(energyUsage).toBeGreaterThanOrEqual(0);
      expect(energyUsage).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Cost Calculation', () => {
    test('should calculate cost', async () => {
      const cost = await optimizer.calculateCost();
      
      expect(cost).toBeDefined();
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Performance Calculation', () => {
    test('should calculate performance', async () => {
      const performance = await optimizer.calculatePerformance();
      
      expect(performance).toBeDefined();
      expect(typeof performance).toBe('number');
      expect(performance).toBeGreaterThanOrEqual(0);
      expect(performance).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Optimization Algorithms', () => {
    test('should have latency optimizer', () => {
      expect(optimizer.algorithms.latency).toBeDefined();
      expect(optimizer.algorithms.latency.generateRecommendations).toBeDefined();
      expect(typeof optimizer.algorithms.latency.generateRecommendations).toBe('function');
    });
    
    test('should have throughput optimizer', () => {
      expect(optimizer.algorithms.throughput).toBeDefined();
      expect(optimizer.algorithms.throughput.generateRecommendations).toBeDefined();
      expect(typeof optimizer.algorithms.throughput.generateRecommendations).toBe('function');
    });
    
    test('should have resource optimizer', () => {
      expect(optimizer.algorithms.resource).toBeDefined();
      expect(optimizer.algorithms.resource.generateRecommendations).toBeDefined();
      expect(typeof optimizer.algorithms.resource.generateRecommendations).toBe('function');
    });
    
    test('should have energy optimizer', () => {
      expect(optimizer.algorithms.energy).toBeDefined();
      expect(optimizer.algorithms.energy.generateRecommendations).toBeDefined();
      expect(typeof optimizer.algorithms.energy.generateRecommendations).toBe('function');
    });
    
    test('should have cost optimizer', () => {
      expect(optimizer.algorithms.cost).toBeDefined();
      expect(optimizer.algorithms.cost.generateRecommendations).toBeDefined();
      expect(typeof optimizer.algorithms.cost.generateRecommendations).toBe('function');
    });
  });
  
  describe('Latency Optimizer', () => {
    test('should generate recommendations for latency optimization', () => {
      const analysis = {
        current: 200,
        target: 100,
        improvement: 0.5
      };
      
      const recommendations = optimizer.algorithms.latency.generateRecommendations(analysis);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec.type).toBe('latency');
        expect(rec.description).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.action).toBeDefined();
      });
    });
  });
  
  describe('Throughput Optimizer', () => {
    test('should generate recommendations for throughput optimization', () => {
      const analysis = {
        current: 500,
        target: 1000,
        improvement: 0.5
      };
      
      const recommendations = optimizer.algorithms.throughput.generateRecommendations(analysis);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec.type).toBe('throughput');
        expect(rec.description).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.action).toBeDefined();
      });
    });
  });
  
  describe('Resource Optimizer', () => {
    test('should generate recommendations for resource optimization', () => {
      const analysis = {
        cpu: {
          current: 0.3,
          target: 0.7,
          improvement: 0.4
        },
        memory: {
          current: 0.2,
          target: 0.7,
          improvement: 0.5
        }
      };
      
      const recommendations = optimizer.algorithms.resource.generateRecommendations(analysis);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec.type).toBe('resource');
        expect(rec.description).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.action).toBeDefined();
      });
    });
  });
  
  describe('Energy Optimizer', () => {
    test('should generate recommendations for energy optimization', () => {
      const analysis = {
        current: 0.4,
        target: 0.8,
        improvement: 0.4
      };
      
      const recommendations = optimizer.algorithms.energy.generateRecommendations(analysis);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec.type).toBe('energy');
        expect(rec.description).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.action).toBeDefined();
      });
    });
  });
  
  describe('Cost Optimizer', () => {
    test('should generate recommendations for cost optimization', () => {
      const analysis = {
        current: 0.1,
        target: 0,
        improvement: 0.1
      };
      
      const recommendations = optimizer.algorithms.cost.generateRecommendations(analysis);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec.type).toBe('cost');
        expect(rec.description).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.action).toBeDefined();
      });
    });
  });
});
