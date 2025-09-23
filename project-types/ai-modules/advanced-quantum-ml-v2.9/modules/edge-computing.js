const { create, all } = require('mathjs');
const logger = require('./logger');
const EventEmitter = require('events');

// Create mathjs instance with complex number support
const math = create(all, {
  number: 'Complex'
});

class EdgeComputing extends EventEmitter {
  constructor() {
    super();
    this.edgeDevices = new Map();
    this.edgeModels = new Map();
    this.edgeTasks = new Map();
    this.edgeMetrics = {
      totalDevices: 0,
      activeDevices: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageLatency: 0,
      totalBandwidth: 0,
      lastSync: null
    };
    this.edgeConfig = {
      maxDevices: 1000,
      taskTimeout: 30000, // 30 seconds
      syncInterval: 60000, // 1 minute
      compressionEnabled: true,
      cachingEnabled: true,
      fallbackEnabled: true
    };
  }

  // Initialize edge computing system
  initialize(options = {}) {
    try {
      this.edgeConfig = {
        ...this.edgeConfig,
        ...options
      };

      // Start edge synchronization
      this.startEdgeSync();

      logger.info('Edge computing system initialized', {
        maxDevices: this.edgeConfig.maxDevices,
        taskTimeout: this.edgeConfig.taskTimeout,
        syncInterval: this.edgeConfig.syncInterval,
        compressionEnabled: this.edgeConfig.compressionEnabled,
        cachingEnabled: this.edgeConfig.cachingEnabled,
        fallbackEnabled: this.edgeConfig.fallbackEnabled
      });

      return {
        success: true,
        configuration: this.edgeConfig,
        capabilities: [
          'Lightweight Model Deployment',
          'Edge Device Management',
          'Distributed Task Processing',
          'Real-time Synchronization',
          'Bandwidth Optimization',
          'Offline Processing',
          'Edge Caching',
          'Fault Tolerance'
        ]
      };
    } catch (error) {
      logger.error('Edge computing initialization failed:', { error: error.message });
      throw error;
    }
  }

  // Register edge device
  registerEdgeDevice(deviceInfo) {
    try {
      const deviceId = deviceInfo.id || this.generateDeviceId();
      const device = {
        id: deviceId,
        name: deviceInfo.name || `Edge Device ${deviceId}`,
        type: deviceInfo.type || 'generic',
        capabilities: deviceInfo.capabilities || [],
        resources: {
          cpu: deviceInfo.cpu || 0,
          memory: deviceInfo.memory || 0,
          storage: deviceInfo.storage || 0,
          bandwidth: deviceInfo.bandwidth || 0
        },
        location: deviceInfo.location || { lat: 0, lng: 0 },
        status: 'online',
        lastSeen: Date.now(),
        tasks: [],
        models: []
      };

      this.edgeDevices.set(deviceId, device);
      this.edgeMetrics.totalDevices++;
      this.edgeMetrics.activeDevices++;

      logger.info('Edge device registered', {
        deviceId,
        name: device.name,
        type: device.type,
        capabilities: device.capabilities.length
      });

      this.emit('deviceRegistered', device);

      return {
        success: true,
        deviceId: deviceId,
        device: device
      };
    } catch (error) {
      logger.error('Failed to register edge device:', { error: error.message });
      throw error;
    }
  }

  // Unregister edge device
  unregisterEdgeDevice(deviceId) {
    try {
      if (!this.edgeDevices.has(deviceId)) {
        return {
          success: false,
          error: 'Device not found'
        };
      }

      const device = this.edgeDevices.get(deviceId);
      device.status = 'offline';
      this.edgeDevices.delete(deviceId);
      this.edgeMetrics.activeDevices--;

      logger.info('Edge device unregistered', { deviceId });

      this.emit('deviceUnregistered', { deviceId, device });

      return {
        success: true,
        deviceId: deviceId
      };
    } catch (error) {
      logger.error('Failed to unregister edge device:', { error: error.message });
      throw error;
    }
  }

  // Deploy model to edge device
  deployModelToEdge(deviceId, modelInfo) {
    try {
      if (!this.edgeDevices.has(deviceId)) {
        return {
          success: false,
          error: 'Device not found'
        };
      }

      const device = this.edgeDevices.get(deviceId);
      const modelId = modelInfo.id || this.generateModelId();
      
      const edgeModel = {
        id: modelId,
        name: modelInfo.name || `Model ${modelId}`,
        type: modelInfo.type || 'quantum',
        version: modelInfo.version || '1.0.0',
        size: modelInfo.size || 0,
        accuracy: modelInfo.accuracy || 0,
        latency: modelInfo.latency || 0,
        memoryUsage: modelInfo.memoryUsage || 0,
        cpuUsage: modelInfo.cpuUsage || 0,
        deployedAt: Date.now(),
        status: 'deployed',
        config: modelInfo.config || {}
      };

      // Check if device has enough resources
      if (!this.checkDeviceResources(device, edgeModel)) {
        return {
          success: false,
          error: 'Insufficient device resources'
        };
      }

      device.models.push(edgeModel);
      this.edgeModels.set(modelId, { ...edgeModel, deviceId });

      logger.info('Model deployed to edge device', {
        deviceId,
        modelId,
        modelName: edgeModel.name,
        modelType: edgeModel.type
      });

      this.emit('modelDeployed', { deviceId, modelId, model: edgeModel });

      return {
        success: true,
        modelId: modelId,
        deviceId: deviceId,
        model: edgeModel
      };
    } catch (error) {
      logger.error('Failed to deploy model to edge:', { error: error.message });
      throw error;
    }
  }

  // Check device resources
  checkDeviceResources(device, model) {
    const availableMemory = device.resources.memory - 
      device.models.reduce((sum, m) => sum + m.memoryUsage, 0);
    const availableCPU = device.resources.cpu - 
      device.models.reduce((sum, m) => sum + m.cpuUsage, 0);

    return availableMemory >= model.memoryUsage && availableCPU >= model.cpuUsage;
  }

  // Execute task on edge device
  async executeEdgeTask(deviceId, taskInfo) {
    try {
      if (!this.edgeDevices.has(deviceId)) {
        return {
          success: false,
          error: 'Device not found'
        };
      }

      const device = this.edgeDevices.get(deviceId);
      const taskId = taskInfo.id || this.generateTaskId();
      
      const task = {
        id: taskId,
        deviceId: deviceId,
        type: taskInfo.type || 'inference',
        modelId: taskInfo.modelId,
        input: taskInfo.input,
        priority: taskInfo.priority || 'normal',
        status: 'pending',
        createdAt: Date.now(),
        startedAt: null,
        completedAt: null,
        result: null,
        error: null,
        metadata: taskInfo.metadata || {}
      };

      device.tasks.push(task);
      this.edgeTasks.set(taskId, task);
      this.edgeMetrics.totalTasks++;

      // Execute task
      const result = await this.processEdgeTask(task);

      logger.info('Edge task executed', {
        taskId,
        deviceId,
        type: task.type,
        status: result.success ? 'completed' : 'failed'
      });

      this.emit('taskExecuted', { taskId, deviceId, result });

      return result;
    } catch (error) {
      logger.error('Failed to execute edge task:', { error: error.message });
      throw error;
    }
  }

  // Process edge task
  async processEdgeTask(task) {
    try {
      const device = this.edgeDevices.get(task.deviceId);
      task.status = 'running';
      task.startedAt = Date.now();

      // Simulate task processing based on type
      let result;
      switch (task.type) {
        case 'inference':
          result = await this.performEdgeInference(task);
          break;
        case 'training':
          result = await this.performEdgeTraining(task);
          break;
        case 'optimization':
          result = await this.performEdgeOptimization(task);
          break;
        case 'synchronization':
          result = await this.performEdgeSynchronization(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = result;
      this.edgeMetrics.completedTasks++;

      return {
        success: true,
        taskId: task.id,
        result: result,
        processingTime: task.completedAt - task.startedAt
      };
    } catch (error) {
      task.status = 'failed';
      task.completedAt = Date.now();
      task.error = error.message;
      this.edgeMetrics.failedTasks++;

      return {
        success: false,
        taskId: task.id,
        error: error.message
      };
    }
  }

  // Perform edge inference
  async performEdgeInference(task) {
    try {
      const model = this.edgeModels.get(task.modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Simulate quantum inference on edge device
      const input = task.input;
      const startTime = Date.now();

      // Lightweight quantum state preparation
      const quantumState = this.prepareLightweightQuantumState(input);
      
      // Simulate quantum operations
      const processedState = this.performLightweightQuantumOperations(quantumState);
      
      // Extract result
      const result = this.extractEdgeResult(processedState);
      
      const processingTime = Date.now() - startTime;

      return {
        prediction: result.prediction,
        confidence: result.confidence,
        processingTime: processingTime,
        modelId: task.modelId,
        deviceId: task.deviceId
      };
    } catch (error) {
      logger.error('Edge inference failed:', { error: error.message });
      throw error;
    }
  }

  // Perform edge training
  async performEdgeTraining(task) {
    try {
      const { trainingData, modelId } = task.input;
      const startTime = Date.now();

      // Simulate lightweight training on edge device
      const trainingResult = this.performLightweightTraining(trainingData, modelId);
      
      const processingTime = Date.now() - startTime;

      return {
        modelId: modelId,
        accuracy: trainingResult.accuracy,
        loss: trainingResult.loss,
        processingTime: processingTime,
        deviceId: task.deviceId
      };
    } catch (error) {
      logger.error('Edge training failed:', { error: error.message });
      throw error;
    }
  }

  // Perform edge optimization
  async performEdgeOptimization(task) {
    try {
      const { modelId, optimizationType } = task.input;
      const startTime = Date.now();

      // Simulate model optimization on edge device
      const optimizationResult = this.performLightweightOptimization(modelId, optimizationType);
      
      const processingTime = Date.now() - startTime;

      return {
        modelId: modelId,
        optimizationType: optimizationType,
        improvement: optimizationResult.improvement,
        processingTime: processingTime,
        deviceId: task.deviceId
      };
    } catch (error) {
      logger.error('Edge optimization failed:', { error: error.message });
      throw error;
    }
  }

  // Perform edge synchronization
  async performEdgeSynchronization(task) {
    try {
      const { syncType, data } = task.input;
      const startTime = Date.now();

      // Simulate data synchronization
      const syncResult = this.performDataSynchronization(syncType, data);
      
      const processingTime = Date.now() - startTime;

      return {
        syncType: syncType,
        syncedItems: syncResult.syncedItems,
        processingTime: processingTime,
        deviceId: task.deviceId
      };
    } catch (error) {
      logger.error('Edge synchronization failed:', { error: error.message });
      throw error;
    }
  }

  // Prepare lightweight quantum state
  prepareLightweightQuantumState(input) {
    try {
      const state = [];
      for (let i = 0; i < Math.min(input.length, 8); i++) { // Limit to 8 qubits for edge
        const amplitude = Math.sqrt(Math.abs(input[i]));
        const phase = Math.random() * 2 * Math.PI;
        state.push(math.complex(amplitude * Math.cos(phase), amplitude * Math.sin(phase)));
      }
      return state;
    } catch (error) {
      logger.error('Lightweight quantum state preparation failed:', { error: error.message });
      throw error;
    }
  }

  // Perform lightweight quantum operations
  performLightweightQuantumOperations(state) {
    try {
      let processedState = [...state];
      
      // Apply lightweight quantum gates
      for (let i = 0; i < processedState.length; i++) {
        // Hadamard gate
        const hResult = this.applyLightweightHadamard(processedState[i]);
        processedState[i] = hResult;
        
        // Rotation gate
        const rResult = this.applyLightweightRotation(processedState[i], Math.PI / 4);
        processedState[i] = rResult;
      }
      
      return processedState;
    } catch (error) {
      logger.error('Lightweight quantum operations failed:', { error: error.message });
      throw error;
    }
  }

  // Apply lightweight Hadamard gate
  applyLightweightHadamard(amplitude) {
    const sqrt2 = Math.sqrt(2);
    const real = (amplitude.re + amplitude.im) / sqrt2;
    const imag = (amplitude.re - amplitude.im) / sqrt2;
    return math.complex(real, imag);
  }

  // Apply lightweight rotation gate
  applyLightweightRotation(amplitude, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const real = amplitude.re * cos - amplitude.im * sin;
    const imag = amplitude.re * sin + amplitude.im * cos;
    return math.complex(real, imag);
  }

  // Extract edge result
  extractEdgeResult(quantumState) {
    try {
      const probabilities = quantumState.map(amplitude => {
        const magnitude = math.abs(amplitude);
        return magnitude * magnitude;
      });
      
      const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0);
      const normalizedProbs = probabilities.map(prob => prob / totalProbability);
      
      const maxIndex = normalizedProbs.indexOf(Math.max(...normalizedProbs));
      
      return {
        prediction: maxIndex,
        confidence: normalizedProbs[maxIndex],
        probabilities: normalizedProbs
      };
    } catch (error) {
      logger.error('Edge result extraction failed:', { error: error.message });
      throw error;
    }
  }

  // Perform lightweight training
  performLightweightTraining(trainingData, modelId) {
    try {
      // Simulate lightweight training process
      let totalLoss = 0;
      let correctPredictions = 0;
      
      for (const sample of trainingData) {
        const prediction = Math.floor(Math.random() * 10);
        const target = sample.target || Math.floor(Math.random() * 10);
        
        const loss = Math.abs(prediction - target);
        totalLoss += loss;
        
        if (prediction === target) {
          correctPredictions++;
        }
      }
      
      const accuracy = correctPredictions / trainingData.length;
      const avgLoss = totalLoss / trainingData.length;
      
      return {
        accuracy: accuracy,
        loss: avgLoss,
        samples: trainingData.length
      };
    } catch (error) {
      logger.error('Lightweight training failed:', { error: error.message });
      throw error;
    }
  }

  // Perform lightweight optimization
  performLightweightOptimization(modelId, optimizationType) {
    try {
      // Simulate model optimization
      const improvements = {
        'quantization': 0.15,
        'pruning': 0.20,
        'distillation': 0.25,
        'compression': 0.30
      };
      
      const improvement = improvements[optimizationType] || 0.10;
      
      return {
        improvement: improvement,
        optimizationType: optimizationType,
        modelId: modelId
      };
    } catch (error) {
      logger.error('Lightweight optimization failed:', { error: error.message });
      throw error;
    }
  }

  // Perform data synchronization
  performDataSynchronization(syncType, data) {
    try {
      let syncedItems = 0;
      
      switch (syncType) {
        case 'model_weights':
          syncedItems = data.weights ? data.weights.length : 0;
          break;
        case 'training_data':
          syncedItems = data.samples ? data.samples.length : 0;
          break;
        case 'configuration':
          syncedItems = data.config ? Object.keys(data.config).length : 0;
          break;
        default:
          syncedItems = 1;
      }
      
      return {
        syncedItems: syncedItems,
        syncType: syncType
      };
    } catch (error) {
      logger.error('Data synchronization failed:', { error: error.message });
      throw error;
    }
  }

  // Start edge synchronization
  startEdgeSync() {
    setInterval(() => {
      this.synchronizeEdgeDevices();
    }, this.edgeConfig.syncInterval);
  }

  // Synchronize edge devices
  async synchronizeEdgeDevices() {
    try {
      const now = Date.now();
      let syncedDevices = 0;
      
      for (const [deviceId, device] of this.edgeDevices.entries()) {
        // Update device status
        if (now - device.lastSeen > this.edgeConfig.taskTimeout) {
          device.status = 'offline';
          this.edgeMetrics.activeDevices--;
        } else {
          device.status = 'online';
          syncedDevices++;
        }
      }
      
      this.edgeMetrics.lastSync = now;
      
      logger.debug('Edge devices synchronized', {
        totalDevices: this.edgeDevices.size,
        activeDevices: syncedDevices,
        lastSync: now
      });
    } catch (error) {
      logger.error('Edge synchronization failed:', { error: error.message });
    }
  }

  // Get edge device information
  getEdgeDevice(deviceId) {
    return this.edgeDevices.get(deviceId);
  }

  // Get all edge devices
  getAllEdgeDevices() {
    return Array.from(this.edgeDevices.values());
  }

  // Get edge model information
  getEdgeModel(modelId) {
    return this.edgeModels.get(modelId);
  }

  // Get all edge models
  getAllEdgeModels() {
    return Array.from(this.edgeModels.values());
  }

  // Get edge task information
  getEdgeTask(taskId) {
    return this.edgeTasks.get(taskId);
  }

  // Get edge metrics
  getEdgeMetrics() {
    return {
      ...this.edgeMetrics,
      successRate: this.edgeMetrics.totalTasks > 0 ? 
        (this.edgeMetrics.completedTasks / this.edgeMetrics.totalTasks) * 100 : 0,
      averageLatency: this.calculateAverageLatency(),
      configuration: this.edgeConfig
    };
  }

  // Calculate average latency
  calculateAverageLatency() {
    const tasks = Array.from(this.edgeTasks.values());
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    if (completedTasks.length === 0) return 0;
    
    const totalLatency = completedTasks.reduce((sum, task) => {
      return sum + (task.completedAt - task.startedAt);
    }, 0);
    
    return totalLatency / completedTasks.length;
  }

  // Generate device ID
  generateDeviceId() {
    return 'edge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate model ID
  generateModelId() {
    return 'model_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate task ID
  generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = new EdgeComputing();
