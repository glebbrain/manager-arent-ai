const EdgeAIProcessor = require('../modules/edge-ai-processor');
const logger = require('../modules/logger');

describe('EdgeAIProcessor', () => {
  let processor;
  
  beforeEach(() => {
    processor = new EdgeAIProcessor({
      modelPath: './test-models',
      inferenceTimeout: 1000,
      batchSize: 1,
      quantization: true
    });
  });
  
  afterEach(async () => {
    if (processor) {
      await processor.dispose();
    }
  });
  
  describe('Initialization', () => {
    test('should initialize with default config', () => {
      expect(processor.config).toBeDefined();
      expect(processor.config.modelPath).toBe('./test-models');
      expect(processor.config.inferenceTimeout).toBe(1000);
      expect(processor.config.batchSize).toBe(1);
      expect(processor.config.quantization).toBe(true);
    });
    
    test('should initialize with custom config', () => {
      const customProcessor = new EdgeAIProcessor({
        modelPath: './custom-models',
        inferenceTimeout: 2000,
        batchSize: 2,
        quantization: false
      });
      
      expect(customProcessor.config.modelPath).toBe('./custom-models');
      expect(customProcessor.config.inferenceTimeout).toBe(2000);
      expect(customProcessor.config.batchSize).toBe(2);
      expect(customProcessor.config.quantization).toBe(false);
    });
  });
  
  describe('Model Management', () => {
    test('should load model successfully', async () => {
      const modelData = {
        id: 'test-model',
        path: './test-models/test-model.json',
        format: 'tflite',
        version: '1.0.0',
        type: 'inference',
        inputShape: [1, 224, 224, 3],
        outputShape: [1, 1000],
        metadata: {
          preprocessing: {
            normalize: true,
            resize: { width: 224, height: 224 }
          }
        }
      };
      
      const result = await processor.loadModel('test-model', modelData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-model');
      expect(result.version).toBe('1.0.0');
      expect(result.type).toBe('inference');
    });
    
    test('should get model info', async () => {
      const modelData = {
        id: 'test-model',
        path: './test-models/test-model.json',
        format: 'tflite',
        version: '1.0.0',
        type: 'inference'
      };
      
      await processor.loadModel('test-model', modelData);
      const info = processor.getModelInfo('test-model');
      
      expect(info).toBeDefined();
      expect(info.id).toBe('test-model');
      expect(info.version).toBe('1.0.0');
      expect(info.type).toBe('inference');
    });
    
    test('should get all models', async () => {
      const modelData = {
        id: 'test-model',
        path: './test-models/test-model.json',
        format: 'tflite',
        version: '1.0.0',
        type: 'inference'
      };
      
      await processor.loadModel('test-model', modelData);
      const models = processor.getAllModels();
      
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('test-model');
    });
  });
  
  describe('Inference', () => {
    test('should run inference successfully', async () => {
      const modelData = {
        id: 'test-model',
        path: './test-models/test-model.json',
        format: 'tflite',
        version: '1.0.0',
        type: 'inference',
        inputShape: [1, 224, 224, 3]
      };
      
      await processor.loadModel('test-model', modelData);
      
      const inputData = Array(224 * 224 * 3).fill(0.5);
      const result = await processor.runInference('test-model', inputData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.inferenceId).toBeDefined();
      expect(result.result).toBeDefined();
    });
    
    test('should handle inference failure', async () => {
      const inputData = Array(224 * 224 * 3).fill(0.5);
      
      await expect(processor.runInference('non-existent-model', inputData))
        .rejects.toThrow('Model not found: non-existent-model');
    });
  });
  
  describe('Metrics', () => {
    test('should get metrics', () => {
      const metrics = processor.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalInferences).toBe(0);
      expect(metrics.successfulInferences).toBe(0);
      expect(metrics.failedInferences).toBe(0);
      expect(metrics.averageLatency).toBe(0);
    });
  });
  
  describe('Cache Management', () => {
    test('should clear cache', () => {
      processor.clearCache();
      expect(processor.cache.size).toBe(0);
    });
  });
});
