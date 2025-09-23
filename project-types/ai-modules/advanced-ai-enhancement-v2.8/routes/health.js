const express = require('express');
const router = express.Router();
const aiEngine = require('../modules/ai-engine');
const quantumProcessor = require('../modules/quantum-processor');
const neuralNetwork = require('../modules/neural-network');
const cognitiveServices = require('../modules/cognitive-services');
const logger = require('../modules/logger');

// GET /api/v2.8/health
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check all services
    const [aiHealth, quantumHealth, neuralHealth, cognitiveHealth] = await Promise.allSettled([
      aiEngine.healthCheck(),
      quantumProcessor.healthCheck(),
      neuralNetwork.healthCheck(),
      cognitiveServices.healthCheck()
    ]);

    const services = {
      aiEngine: aiHealth.status === 'fulfilled' ? aiHealth.value : { status: 'error', error: aiHealth.reason?.message },
      quantumProcessor: quantumHealth.status === 'fulfilled' ? quantumHealth.value : { status: 'error', error: quantumHealth.reason?.message },
      neuralNetwork: neuralHealth.status === 'fulfilled' ? neuralHealth.value : { status: 'error', error: neuralHealth.reason?.message },
      cognitiveServices: cognitiveHealth.status === 'fulfilled' ? cognitiveHealth.value : { status: 'error', error: cognitiveHealth.reason?.message }
    };

    const overallStatus = Object.values(services).every(service => service.status === 'healthy') ? 'healthy' : 'degraded';
    const responseTime = Date.now() - startTime;

    res.json({
      status: overallStatus,
      version: '2.8.0',
      timestamp: new Date().toISOString(),
      responseTime,
      services,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error(`[HEALTH-ROUTE] Health check error: ${error.message}`);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v2.8/health/detailed
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Get detailed status from all services
    const [aiStatus, quantumStatus, neuralStatus, cognitiveStatus] = await Promise.allSettled([
      aiEngine.getModelStatus(),
      quantumProcessor.getQuantumStatus(),
      neuralNetwork.getAllModels(),
      cognitiveServices.getServiceStatus()
    ]);

    const detailedStatus = {
      aiEngine: {
        status: aiStatus.status === 'fulfilled' ? 'healthy' : 'error',
        data: aiStatus.status === 'fulfilled' ? aiStatus.value : null,
        error: aiStatus.status === 'rejected' ? aiStatus.reason?.message : null
      },
      quantumProcessor: {
        status: quantumStatus.status === 'fulfilled' ? 'healthy' : 'error',
        data: quantumStatus.status === 'fulfilled' ? quantumStatus.value : null,
        error: quantumStatus.status === 'rejected' ? quantumStatus.reason?.message : null
      },
      neuralNetwork: {
        status: neuralStatus.status === 'fulfilled' ? 'healthy' : 'error',
        data: neuralStatus.status === 'fulfilled' ? neuralStatus.value : null,
        error: neuralStatus.status === 'rejected' ? neuralStatus.reason?.message : null
      },
      cognitiveServices: {
        status: cognitiveStatus.status === 'fulfilled' ? 'healthy' : 'error',
        data: cognitiveStatus.status === 'fulfilled' ? cognitiveStatus.value : null,
        error: cognitiveStatus.status === 'rejected' ? cognitiveStatus.reason?.message : null
      }
    };

    const responseTime = Date.now() - startTime;

    res.json({
      status: 'detailed',
      version: '2.8.0',
      timestamp: new Date().toISOString(),
      responseTime,
      services: detailedStatus,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    logger.error(`[HEALTH-ROUTE] Detailed health check error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v2.8/health/ready
router.get('/ready', async (req, res) => {
  try {
    // Simple readiness check
    const isReady = aiEngine.isInitialized && 
                   quantumProcessor.isInitialized && 
                   neuralNetwork.isInitialized && 
                   cognitiveServices.isInitialized;

    if (isReady) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error(`[HEALTH-ROUTE] Readiness check error: ${error.message}`);
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v2.8/health/live
router.get('/live', (req, res) => {
  // Simple liveness check
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
