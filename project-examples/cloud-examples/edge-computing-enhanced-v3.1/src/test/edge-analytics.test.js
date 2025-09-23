const EdgeAnalytics = require('../modules/edge-analytics');
const logger = require('../modules/logger');

describe('EdgeAnalytics', () => {
  let analytics;
  
  beforeEach(() => {
    analytics = new EdgeAnalytics({
      realTimeProcessing: true,
      dataRetention: 3600,
      compressionEnabled: true
    });
  });
  
  afterEach(async () => {
    if (analytics) {
      await analytics.dispose();
    }
  });
  
  describe('Initialization', () => {
    test('should initialize with default config', () => {
      expect(analytics.config).toBeDefined();
      expect(analytics.config.realTimeProcessing).toBe(true);
      expect(analytics.config.dataRetention).toBe(3600);
      expect(analytics.config.compressionEnabled).toBe(true);
    });
    
    test('should initialize with custom config', () => {
      const customAnalytics = new EdgeAnalytics({
        realTimeProcessing: false,
        dataRetention: 7200,
        compressionEnabled: false
      });
      
      expect(customAnalytics.config.realTimeProcessing).toBe(false);
      expect(customAnalytics.config.dataRetention).toBe(7200);
      expect(customAnalytics.config.compressionEnabled).toBe(false);
    });
  });
  
  describe('Stream Management', () => {
    test('should create stream successfully', () => {
      const streamConfig = {
        name: 'test-stream',
        type: 'time-series',
        schema: {
          properties: {
            value: { type: 'number' },
            timestamp: { type: 'number' }
          }
        }
      };
      
      const result = analytics.createStream('test-stream', streamConfig);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-stream');
      expect(result.name).toBe('test-stream');
      expect(result.type).toBe('time-series');
    });
    
    test('should get stream info', () => {
      const streamConfig = {
        name: 'test-stream',
        type: 'time-series'
      };
      
      analytics.createStream('test-stream', streamConfig);
      const info = analytics.getStreamInfo('test-stream');
      
      expect(info).toBeDefined();
      expect(info.id).toBe('test-stream');
      expect(info.name).toBe('test-stream');
      expect(info.type).toBe('time-series');
    });
    
    test('should get all streams', () => {
      const streamConfig = {
        name: 'test-stream',
        type: 'time-series'
      };
      
      analytics.createStream('test-stream', streamConfig);
      const streams = analytics.getAllStreams();
      
      expect(streams).toHaveLength(1);
      expect(streams[0].id).toBe('test-stream');
    });
  });
  
  describe('Data Processing', () => {
    test('should add data point successfully', async () => {
      const streamConfig = {
        name: 'test-stream',
        type: 'time-series',
        schema: {
          properties: {
            value: { type: 'number' },
            timestamp: { type: 'number' }
          }
        }
      };
      
      analytics.createStream('test-stream', streamConfig);
      
      const dataPoint = {
        value: 42.5,
        timestamp: Date.now()
      };
      
      await analytics.addDataPoint('test-stream', dataPoint);
      
      const buffer = analytics.dataBuffers.get('test-stream');
      expect(buffer).toHaveLength(1);
      expect(buffer[0].value).toBe(42.5);
    });
    
    test('should validate data point', async () => {
      const streamConfig = {
        name: 'test-stream',
        type: 'time-series',
        schema: {
          required: ['value'],
          properties: {
            value: { type: 'number' },
            timestamp: { type: 'number' }
          }
        }
      };
      
      analytics.createStream('test-stream', streamConfig);
      
      const validDataPoint = {
        value: 42.5,
        timestamp: Date.now()
      };
      
      await expect(analytics.addDataPoint('test-stream', validDataPoint))
        .resolves.not.toThrow();
      
      const invalidDataPoint = {
        timestamp: Date.now()
        // Missing required 'value' field
      };
      
      await expect(analytics.addDataPoint('test-stream', invalidDataPoint))
        .rejects.toThrow('Required field missing: value');
    });
    
    test('should handle non-existent stream', async () => {
      const dataPoint = {
        value: 42.5,
        timestamp: Date.now()
      };
      
      await expect(analytics.addDataPoint('non-existent-stream', dataPoint))
        .rejects.toThrow('Stream not found: non-existent-stream');
    });
  });
  
  describe('Analytics Results', () => {
    test('should get analytics results', () => {
      const streamConfig = {
        name: 'test-stream',
        type: 'time-series'
      };
      
      analytics.createStream('test-stream', streamConfig);
      const results = analytics.getAnalyticsResults('test-stream');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
    
    test('should handle non-existent stream for results', () => {
      expect(() => analytics.getAnalyticsResults('non-existent-stream'))
        .toThrow('Stream not found: non-existent-stream');
    });
  });
  
  describe('Metrics', () => {
    test('should get metrics', () => {
      const metrics = analytics.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalDataPoints).toBe(0);
      expect(metrics.processedDataPoints).toBe(0);
      expect(metrics.droppedDataPoints).toBe(0);
      expect(metrics.activeStreams).toBe(0);
    });
  });
  
  describe('Alerts', () => {
    test('should get alerts', () => {
      const alerts = analytics.getAlerts();
      
      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });
    
    test('should clear alerts', () => {
      analytics.clearAlerts();
      expect(analytics.alerts).toHaveLength(0);
    });
  });
});
