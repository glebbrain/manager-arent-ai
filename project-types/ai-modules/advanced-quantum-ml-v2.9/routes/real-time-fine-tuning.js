const express = require('express');
const router = express.Router();
const realTimeFineTuning = require('../modules/real-time-fine-tuning');
const logger = require('../modules/logger');

// Initialize real-time fine-tuning
router.post('/initialize', async (req, res) => {
  try {
    const options = req.body || {};
    const result = realTimeFineTuning.initialize(options);
    
    logger.info('Real-time fine-tuning initialized via API', {
      options,
      result: result.success
    });

    res.json({
      success: true,
      message: 'Real-time fine-tuning initialized successfully',
      data: result
    });
  } catch (error) {
    logger.error('Real-time fine-tuning initialization failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Initialization failed',
      message: error.message
    });
  }
});

// Add training data
router.post('/add-data', async (req, res) => {
  try {
    const { inputData, targetData, metadata } = req.body;

    if (!inputData || !targetData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'inputData and targetData are required'
      });
    }

    const result = realTimeFineTuning.addTrainingData(inputData, targetData, metadata);
    
    logger.info('Training data added via API', {
      queueSize: result.queueSize,
      timestamp: result.timestamp
    });

    res.json({
      success: true,
      message: 'Training data added successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to add training data:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to add training data',
      message: error.message
    });
  }
});

// Trigger adaptation
router.post('/trigger-adaptation', async (req, res) => {
  try {
    const result = await realTimeFineTuning.triggerAdaptation();
    
    logger.info('Adaptation triggered via API', {
      adaptationPerformed: result.adaptationPerformed,
      success: result.success
    });

    res.json({
      success: true,
      message: 'Adaptation process completed',
      data: result
    });
  } catch (error) {
    logger.error('Adaptation trigger failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Adaptation trigger failed',
      message: error.message
    });
  }
});

// Get adaptation status
router.get('/status', (req, res) => {
  try {
    const status = realTimeFineTuning.getAdaptationStatus();
    
    res.json({
      success: true,
      message: 'Adaptation status retrieved successfully',
      data: status
    });
  } catch (error) {
    logger.error('Failed to get adaptation status:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      message: error.message
    });
  }
});

// Get model versions
router.get('/versions', (req, res) => {
  try {
    const versions = realTimeFineTuning.getModelVersions();
    
    res.json({
      success: true,
      message: 'Model versions retrieved successfully',
      data: versions
    });
  } catch (error) {
    logger.error('Failed to get model versions:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get versions',
      message: error.message
    });
  }
});

// Get performance analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = realTimeFineTuning.getPerformanceAnalytics();
    
    res.json({
      success: true,
      message: 'Performance analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    logger.error('Failed to get performance analytics:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      message: error.message
    });
  }
});

// Update configuration
router.put('/configuration', (req, res) => {
  try {
    const newConfig = req.body;
    const result = realTimeFineTuning.updateConfiguration(newConfig);
    
    logger.info('Configuration updated via API', {
      newConfig,
      success: result.success
    });

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Configuration update failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Configuration update failed',
      message: error.message
    });
  }
});

// Reset adaptation system
router.post('/reset', (req, res) => {
  try {
    const result = realTimeFineTuning.reset();
    
    logger.info('Adaptation system reset via API', {
      success: result.success
    });

    res.json({
      success: true,
      message: 'Adaptation system reset successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to reset adaptation system:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Reset failed',
      message: error.message
    });
  }
});

// Batch add training data
router.post('/add-batch-data', async (req, res) => {
  try {
    const { trainingData } = req.body;

    if (!Array.isArray(trainingData)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        message: 'trainingData must be an array'
      });
    }

    const results = [];
    for (const sample of trainingData) {
      const { inputData, targetData, metadata } = sample;
      const result = realTimeFineTuning.addTrainingData(inputData, targetData, metadata);
      results.push(result);
    }

    logger.info('Batch training data added via API', {
      samplesCount: trainingData.length,
      resultsCount: results.length
    });

    res.json({
      success: true,
      message: `Successfully added ${trainingData.length} training samples`,
      data: {
        samplesAdded: results.length,
        results: results
      }
    });
  } catch (error) {
    logger.error('Failed to add batch training data:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Batch data addition failed',
      message: error.message
    });
  }
});

// Get real-time metrics (WebSocket-like endpoint for polling)
router.get('/metrics', (req, res) => {
  try {
    const status = realTimeFineTuning.getAdaptationStatus();
    const analytics = realTimeFineTuning.getPerformanceAnalytics();
    
    const metrics = {
      timestamp: Date.now(),
      status: {
        isTraining: status.isTraining,
        queueSize: status.queueSize,
        currentVersion: status.currentVersion,
        adaptationCount: status.adaptationCount
      },
      performance: analytics,
      recentActivity: {
        lastAdaptation: status.lastAdaptation,
        recentAccuracy: status.recentAccuracy,
        recentLoss: status.recentLoss
      }
    };

    res.json({
      success: true,
      message: 'Real-time metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get real-time metrics:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

// Health check for real-time fine-tuning
router.get('/health', (req, res) => {
  try {
    const status = realTimeFineTuning.getAdaptationStatus();
    
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      isTraining: status.isTraining,
      queueSize: status.queueSize,
      currentVersion: status.currentVersion,
      uptime: process.uptime()
    };

    res.json({
      success: true,
      message: 'Real-time fine-tuning health check passed',
      data: health
    });
  } catch (error) {
    logger.error('Health check failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

module.exports = router;
