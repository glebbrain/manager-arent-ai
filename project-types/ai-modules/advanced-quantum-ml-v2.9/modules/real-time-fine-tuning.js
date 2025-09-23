const { create, all } = require('mathjs');
const logger = require('./logger');
const EventEmitter = require('events');

// Create mathjs instance with complex number support
const math = create(all, {
  number: 'Complex'
});

class RealTimeFineTuning extends EventEmitter {
  constructor() {
    super();
    this.isTraining = false;
    this.trainingQueue = [];
    this.modelVersions = new Map();
    this.currentVersion = 0;
    this.adaptationThreshold = 0.1; // Threshold for triggering adaptation
    this.learningRateDecay = 0.95;
    this.minLearningRate = 0.001;
    this.maxQueueSize = 1000;
    this.batchSize = 16;
    this.adaptationWindow = 100; // Number of samples for adaptation
    this.performanceHistory = [];
    this.adaptationMetrics = {
      accuracy: [],
      loss: [],
      adaptationCount: 0,
      lastAdaptation: null
    };
  }

  // Initialize real-time fine-tuning
  initialize(options = {}) {
    try {
      this.adaptationThreshold = options.adaptationThreshold || 0.1;
      this.learningRateDecay = options.learningRateDecay || 0.95;
      this.minLearningRate = options.minLearningRate || 0.001;
      this.maxQueueSize = options.maxQueueSize || 1000;
      this.batchSize = options.batchSize || 16;
      this.adaptationWindow = options.adaptationWindow || 100;

      logger.info('Real-time fine-tuning initialized', {
        adaptationThreshold: this.adaptationThreshold,
        learningRateDecay: this.learningRateDecay,
        minLearningRate: this.minLearningRate,
        maxQueueSize: this.maxQueueSize,
        batchSize: this.batchSize,
        adaptationWindow: this.adaptationWindow
      });

      return {
        success: true,
        configuration: {
          adaptationThreshold: this.adaptationThreshold,
          learningRateDecay: this.learningRateDecay,
          minLearningRate: this.minLearningRate,
          maxQueueSize: this.maxQueueSize,
          batchSize: this.batchSize,
          adaptationWindow: this.adaptationWindow
        }
      };
    } catch (error) {
      logger.error('Real-time fine-tuning initialization failed:', { error: error.message });
      throw error;
    }
  }

  // Add new training data to the queue
  addTrainingData(inputData, targetData, metadata = {}) {
    try {
      if (this.trainingQueue.length >= this.maxQueueSize) {
        // Remove oldest data if queue is full
        this.trainingQueue.shift();
      }

      const trainingSample = {
        input: inputData,
        target: targetData,
        timestamp: Date.now(),
        metadata: metadata
      };

      this.trainingQueue.push(trainingSample);
      
      logger.debug('Training data added to queue', {
        queueSize: this.trainingQueue.length,
        timestamp: trainingSample.timestamp
      });

      // Trigger adaptation if enough data is available
      if (this.trainingQueue.length >= this.batchSize) {
        this.triggerAdaptation();
      }

      return {
        success: true,
        queueSize: this.trainingQueue.length,
        timestamp: trainingSample.timestamp
      };
    } catch (error) {
      logger.error('Failed to add training data:', { error: error.message });
      throw error;
    }
  }

  // Trigger model adaptation
  async triggerAdaptation() {
    try {
      if (this.isTraining || this.trainingQueue.length < this.batchSize) {
        return { success: false, reason: 'Not enough data or already training' };
      }

      this.isTraining = true;
      this.emit('adaptationStarted', { timestamp: Date.now() });

      // Get batch for adaptation
      const batch = this.trainingQueue.slice(-this.batchSize);
      const batchInputs = batch.map(sample => sample.input);
      const batchTargets = batch.map(sample => sample.target);

      // Calculate current performance
      const currentPerformance = await this.evaluateCurrentPerformance(batchInputs, batchTargets);
      
      // Check if adaptation is needed
      const needsAdaptation = this.shouldAdapt(currentPerformance);
      
      if (needsAdaptation) {
        logger.info('Model adaptation triggered', {
          currentPerformance,
          adaptationThreshold: this.adaptationThreshold
        });

        // Perform adaptation
        const adaptationResult = await this.performAdaptation(batchInputs, batchTargets);
        
        // Update metrics
        this.adaptationMetrics.adaptationCount++;
        this.adaptationMetrics.lastAdaptation = Date.now();
        this.adaptationMetrics.accuracy.push(currentPerformance.accuracy);
        this.adaptationMetrics.loss.push(currentPerformance.loss);

        this.emit('adaptationCompleted', {
          result: adaptationResult,
          performance: currentPerformance,
          timestamp: Date.now()
        });

        return {
          success: true,
          adaptationPerformed: true,
          result: adaptationResult,
          performance: currentPerformance
        };
      } else {
        logger.debug('No adaptation needed', { currentPerformance });
        return {
          success: true,
          adaptationPerformed: false,
          performance: currentPerformance
        };
      }
    } catch (error) {
      logger.error('Adaptation trigger failed:', { error: error.message });
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  // Evaluate current model performance
  async evaluateCurrentPerformance(inputs, targets) {
    try {
      let totalLoss = 0;
      let correctPredictions = 0;

      for (let i = 0; i < inputs.length; i++) {
        // This would integrate with the actual QNN model
        // For now, we'll simulate the evaluation
        const prediction = this.simulatePrediction(inputs[i]);
        const target = Array.isArray(targets[i]) ? targets[i].indexOf(1) : targets[i];
        
        const loss = this.calculateLoss(prediction, target);
        totalLoss += loss;

        if (prediction.prediction === target) {
          correctPredictions++;
        }
      }

      const accuracy = correctPredictions / inputs.length;
      const avgLoss = totalLoss / inputs.length;

      return {
        accuracy,
        loss: avgLoss,
        samples: inputs.length
      };
    } catch (error) {
      logger.error('Performance evaluation failed:', { error: error.message });
      throw error;
    }
  }

  // Simulate prediction (placeholder for actual QNN integration)
  simulatePrediction(input) {
    // This would be replaced with actual QNN prediction
    const prediction = Math.floor(Math.random() * 10);
    const confidence = Math.random();
    const probabilities = Array(10).fill(0).map(() => Math.random());
    const totalProb = probabilities.reduce((sum, prob) => sum + prob, 0);
    const normalizedProbs = probabilities.map(prob => prob / totalProb);

    return {
      prediction,
      confidence,
      probabilities: normalizedProbs
    };
  }

  // Calculate loss
  calculateLoss(prediction, target) {
    const predictedProb = prediction.probabilities[prediction.prediction];
    const targetProb = prediction.probabilities[target] || 0;
    return -Math.log(Math.max(targetProb, 1e-10));
  }

  // Determine if adaptation is needed
  shouldAdapt(performance) {
    if (this.adaptationMetrics.accuracy.length === 0) {
      return true; // First adaptation
    }

    const recentAccuracy = this.adaptationMetrics.accuracy.slice(-5);
    const avgRecentAccuracy = recentAccuracy.reduce((sum, acc) => sum + acc, 0) / recentAccuracy.length;
    
    // Adapt if performance drops below threshold
    return (avgRecentAccuracy - performance.accuracy) > this.adaptationThreshold;
  }

  // Perform model adaptation
  async performAdaptation(inputs, targets) {
    try {
      const startTime = Date.now();
      
      // Adaptive learning rate
      const currentLearningRate = Math.max(
        this.minLearningRate,
        this.learningRateDecay * (this.adaptationMetrics.adaptationCount || 1)
      );

      // Simulate adaptation process
      const adaptationSteps = Math.min(10, Math.floor(inputs.length / 2));
      let totalLoss = 0;
      let correctPredictions = 0;

      for (let step = 0; step < adaptationSteps; step++) {
        const batchStart = step * this.batchSize;
        const batchEnd = Math.min(batchStart + this.batchSize, inputs.length);
        const batchInputs = inputs.slice(batchStart, batchEnd);
        const batchTargets = targets.slice(batchStart, batchEnd);

        for (let i = 0; i < batchInputs.length; i++) {
          // Simulate weight updates
          const prediction = this.simulatePrediction(batchInputs[i]);
          const target = Array.isArray(batchTargets[i]) ? batchTargets[i].indexOf(1) : batchTargets[i];
          
          const loss = this.calculateLoss(prediction, target);
          totalLoss += loss;

          if (prediction.prediction === target) {
            correctPredictions++;
          }
        }
      }

      const adaptationTime = Date.now() - startTime;
      const finalAccuracy = correctPredictions / (adaptationSteps * this.batchSize);
      const finalLoss = totalLoss / (adaptationSteps * this.batchSize);

      // Create new model version
      this.currentVersion++;
      this.modelVersions.set(this.currentVersion, {
        version: this.currentVersion,
        timestamp: Date.now(),
        accuracy: finalAccuracy,
        loss: finalLoss,
        learningRate: currentLearningRate,
        adaptationTime: adaptationTime
      });

      logger.info('Model adaptation completed', {
        version: this.currentVersion,
        accuracy: finalAccuracy,
        loss: finalLoss,
        learningRate: currentLearningRate,
        adaptationTime: adaptationTime
      });

      return {
        version: this.currentVersion,
        accuracy: finalAccuracy,
        loss: finalLoss,
        learningRate: currentLearningRate,
        adaptationTime: adaptationTime,
        steps: adaptationSteps
      };
    } catch (error) {
      logger.error('Model adaptation failed:', { error: error.message });
      throw error;
    }
  }

  // Get adaptation status
  getAdaptationStatus() {
    return {
      isTraining: this.isTraining,
      queueSize: this.trainingQueue.length,
      currentVersion: this.currentVersion,
      adaptationCount: this.adaptationMetrics.adaptationCount,
      lastAdaptation: this.adaptationMetrics.lastAdaptation,
      recentAccuracy: this.adaptationMetrics.accuracy.slice(-10),
      recentLoss: this.adaptationMetrics.loss.slice(-10),
      configuration: {
        adaptationThreshold: this.adaptationThreshold,
        learningRateDecay: this.learningRateDecay,
        minLearningRate: this.minLearningRate,
        maxQueueSize: this.maxQueueSize,
        batchSize: this.batchSize,
        adaptationWindow: this.adaptationWindow
      }
    };
  }

  // Get model version history
  getModelVersions() {
    const versions = Array.from(this.modelVersions.values());
    return {
      totalVersions: versions.length,
      currentVersion: this.currentVersion,
      versions: versions.sort((a, b) => b.timestamp - a.timestamp)
    };
  }

  // Reset adaptation system
  reset() {
    try {
      this.trainingQueue = [];
      this.modelVersions.clear();
      this.currentVersion = 0;
      this.adaptationMetrics = {
        accuracy: [],
        loss: [],
        adaptationCount: 0,
        lastAdaptation: null
      };
      this.isTraining = false;

      logger.info('Real-time fine-tuning system reset');
      
      return {
        success: true,
        message: 'Adaptation system reset successfully'
      };
    } catch (error) {
      logger.error('Failed to reset adaptation system:', { error: error.message });
      throw error;
    }
  }

  // Update configuration
  updateConfiguration(newConfig) {
    try {
      if (newConfig.adaptationThreshold !== undefined) {
        this.adaptationThreshold = newConfig.adaptationThreshold;
      }
      if (newConfig.learningRateDecay !== undefined) {
        this.learningRateDecay = newConfig.learningRateDecay;
      }
      if (newConfig.minLearningRate !== undefined) {
        this.minLearningRate = newConfig.minLearningRate;
      }
      if (newConfig.maxQueueSize !== undefined) {
        this.maxQueueSize = newConfig.maxQueueSize;
      }
      if (newConfig.batchSize !== undefined) {
        this.batchSize = newConfig.batchSize;
      }
      if (newConfig.adaptationWindow !== undefined) {
        this.adaptationWindow = newConfig.adaptationWindow;
      }

      logger.info('Adaptation configuration updated', newConfig);

      return {
        success: true,
        configuration: {
          adaptationThreshold: this.adaptationThreshold,
          learningRateDecay: this.learningRateDecay,
          minLearningRate: this.minLearningRate,
          maxQueueSize: this.maxQueueSize,
          batchSize: this.batchSize,
          adaptationWindow: this.adaptationWindow
        }
      };
    } catch (error) {
      logger.error('Configuration update failed:', { error: error.message });
      throw error;
    }
  }

  // Get performance analytics
  getPerformanceAnalytics() {
    const accuracy = this.adaptationMetrics.accuracy;
    const loss = this.adaptationMetrics.loss;

    if (accuracy.length === 0) {
      return {
        noData: true,
        message: 'No performance data available'
      };
    }

    const avgAccuracy = accuracy.reduce((sum, acc) => sum + acc, 0) / accuracy.length;
    const avgLoss = loss.reduce((sum, l) => sum + l, 0) / loss.length;
    const accuracyTrend = this.calculateTrend(accuracy);
    const lossTrend = this.calculateTrend(loss);

    return {
      averageAccuracy: avgAccuracy,
      averageLoss: avgLoss,
      accuracyTrend: accuracyTrend,
      lossTrend: lossTrend,
      totalAdaptations: this.adaptationMetrics.adaptationCount,
      dataPoints: accuracy.length,
      recentPerformance: {
        accuracy: accuracy.slice(-5),
        loss: loss.slice(-5)
      }
    };
  }

  // Calculate trend (simple linear regression)
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
}

module.exports = new RealTimeFineTuning();
