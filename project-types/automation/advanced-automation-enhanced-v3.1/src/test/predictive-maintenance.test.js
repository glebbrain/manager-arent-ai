const PredictiveMaintenance = require('../modules/predictive-maintenance');
const logger = require('../modules/logger');

// Mock logger
jest.mock('../modules/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('PredictiveMaintenance', () => {
  let maintenance;

  beforeEach(() => {
    maintenance = new PredictiveMaintenance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (maintenance) {
      maintenance.stop();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(maintenance.isRunning).toBe(false);
      expect(maintenance.models).toEqual({});
      expect(maintenance.predictions).toEqual({});
    });

    test('should start successfully', async () => {
      await maintenance.start();
      expect(maintenance.isRunning).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Predictive maintenance system started');
    });

    test('should stop successfully', async () => {
      await maintenance.start();
      await maintenance.stop();
      expect(maintenance.isRunning).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('Predictive maintenance system stopped');
    });
  });

  describe('Model Management', () => {
    test('should load model successfully', async () => {
      const modelData = {
        name: 'test-model',
        type: 'regression',
        features: ['temperature', 'pressure'],
        target: 'failure_probability'
      };

      await maintenance.loadModel('test-model', modelData);
      expect(maintenance.models['test-model']).toEqual(modelData);
      expect(logger.info).toHaveBeenCalledWith('Model loaded: test-model');
    });

    test('should handle model loading errors', async () => {
      const invalidModel = null;

      await expect(maintenance.loadModel('invalid-model', invalidModel))
        .rejects.toThrow('Invalid model data');
    });

    test('should get model by name', () => {
      const modelData = {
        name: 'test-model',
        type: 'regression'
      };

      maintenance.models['test-model'] = modelData;
      const model = maintenance.getModel('test-model');
      expect(model).toEqual(modelData);
    });

    test('should return null for non-existent model', () => {
      const model = maintenance.getModel('non-existent');
      expect(model).toBeNull();
    });
  });

  describe('Data Collection', () => {
    test('should collect sensor data', async () => {
      const sensorData = {
        deviceId: 'device-1',
        temperature: 75.5,
        pressure: 1013.25,
        vibration: 0.02,
        timestamp: new Date()
      };

      await maintenance.collectSensorData(sensorData);
      expect(maintenance.sensorData['device-1']).toContain(sensorData);
    });

    test('should handle invalid sensor data', async () => {
      const invalidData = {
        deviceId: 'device-1',
        // Missing required fields
      };

      await expect(maintenance.collectSensorData(invalidData))
        .rejects.toThrow('Invalid sensor data');
    });

    test('should get sensor data for device', () => {
      const deviceData = [
        { temperature: 75, pressure: 1013, timestamp: new Date() },
        { temperature: 76, pressure: 1014, timestamp: new Date() }
      ];

      maintenance.sensorData['device-1'] = deviceData;
      const data = maintenance.getSensorData('device-1');
      expect(data).toEqual(deviceData);
    });
  });

  describe('Predictions', () => {
    test('should generate prediction', async () => {
      const modelData = {
        name: 'test-model',
        type: 'regression',
        features: ['temperature', 'pressure'],
        target: 'failure_probability',
        predict: jest.fn().mockReturnValue(0.75)
      };

      maintenance.models['test-model'] = modelData;
      const prediction = await maintenance.generatePrediction('test-model', {
        temperature: 80,
        pressure: 1020
      });

      expect(prediction).toEqual({
        model: 'test-model',
        prediction: 0.75,
        confidence: expect.any(Number),
        timestamp: expect.any(Date)
      });
    });

    test('should handle prediction errors', async () => {
      const modelData = {
        name: 'test-model',
        type: 'regression',
        features: ['temperature', 'pressure'],
        target: 'failure_probability',
        predict: jest.fn().mockImplementation(() => {
          throw new Error('Prediction failed');
        })
      };

      maintenance.models['test-model'] = modelData;

      await expect(maintenance.generatePrediction('test-model', {
        temperature: 80,
        pressure: 1020
      })).rejects.toThrow('Prediction failed');
    });

    test('should get predictions for device', () => {
      const predictions = [
        { model: 'test-model', prediction: 0.75, timestamp: new Date() },
        { model: 'test-model', prediction: 0.80, timestamp: new Date() }
      ];

      maintenance.predictions['device-1'] = predictions;
      const devicePredictions = maintenance.getPredictions('device-1');
      expect(devicePredictions).toEqual(predictions);
    });
  });

  describe('Maintenance Scheduling', () => {
    test('should schedule maintenance', async () => {
      const maintenanceTask = {
        deviceId: 'device-1',
        type: 'preventive',
        priority: 'high',
        scheduledDate: new Date(),
        description: 'Replace filter'
      };

      await maintenance.scheduleMaintenance(maintenanceTask);
      expect(maintenance.maintenanceSchedule).toContain(maintenanceTask);
      expect(logger.info).toHaveBeenCalledWith('Maintenance scheduled for device-1');
    });

    test('should get maintenance schedule', () => {
      const schedule = [
        { deviceId: 'device-1', type: 'preventive', scheduledDate: new Date() },
        { deviceId: 'device-2', type: 'corrective', scheduledDate: new Date() }
      ];

      maintenance.maintenanceSchedule = schedule;
      const retrievedSchedule = maintenance.getMaintenanceSchedule();
      expect(retrievedSchedule).toEqual(schedule);
    });

    test('should get maintenance for device', () => {
      const schedule = [
        { deviceId: 'device-1', type: 'preventive', scheduledDate: new Date() },
        { deviceId: 'device-2', type: 'corrective', scheduledDate: new Date() }
      ];

      maintenance.maintenanceSchedule = schedule;
      const deviceMaintenance = maintenance.getMaintenanceForDevice('device-1');
      expect(deviceMaintenance).toHaveLength(1);
      expect(deviceMaintenance[0].deviceId).toBe('device-1');
    });
  });

  describe('Alerts', () => {
    test('should generate alert for high failure probability', async () => {
      const modelData = {
        name: 'test-model',
        type: 'regression',
        features: ['temperature', 'pressure'],
        target: 'failure_probability',
        predict: jest.fn().mockReturnValue(0.95) // High failure probability
      };

      maintenance.models['test-model'] = modelData;
      maintenance.threshold = 0.8;

      const prediction = await maintenance.generatePrediction('test-model', {
        temperature: 90,
        pressure: 1030
      });

      expect(prediction.prediction).toBeGreaterThan(maintenance.threshold);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('High failure probability detected')
      );
    });

    test('should not generate alert for low failure probability', async () => {
      const modelData = {
        name: 'test-model',
        type: 'regression',
        features: ['temperature', 'pressure'],
        target: 'failure_probability',
        predict: jest.fn().mockReturnValue(0.3) // Low failure probability
      };

      maintenance.models['test-model'] = modelData;
      maintenance.threshold = 0.8;

      const prediction = await maintenance.generatePrediction('test-model', {
        temperature: 70,
        pressure: 1010
      });

      expect(prediction.prediction).toBeLessThan(maintenance.threshold);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});
