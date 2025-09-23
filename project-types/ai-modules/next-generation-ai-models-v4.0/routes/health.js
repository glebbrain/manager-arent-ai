const express = require('express');
const router = express.Router();
const aiEngine = require('../modules/ai-engine');
const modelManager = require('../modules/model-manager');
const vectorStore = require('../modules/vector-store');
const multimodalProcessor = require('../modules/multimodal-processor');
const realTimeProcessor = require('../modules/real-time-processor');
const logger = require('../modules/logger');

// Overall health check
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check all services
    const [aiStatus, modelStatus, vectorStatus, multimodalStatus, realTimeStatus] = await Promise.allSettled([
      aiEngine.healthCheck(),
      modelManager.healthCheck(),
      vectorStore.healthCheck(),
      multimodalProcessor.healthCheck(),
      realTimeProcessor.healthCheck()
    ]);

    const services = {
      aiEngine: aiStatus.status === 'fulfilled' ? aiStatus.value : { status: 'unhealthy', error: aiStatus.reason?.message },
      modelManager: modelStatus.status === 'fulfilled' ? modelStatus.value : { status: 'unhealthy', error: modelStatus.reason?.message },
      vectorStore: vectorStatus.status === 'fulfilled' ? vectorStatus.value : { status: 'unhealthy', error: vectorStatus.reason?.message },
      multimodalProcessor: multimodalStatus.status === 'fulfilled' ? multimodalStatus.value : { status: 'unhealthy', error: multimodalStatus.reason?.message },
      realTimeProcessor: realTimeStatus.status === 'fulfilled' ? realTimeStatus.value : { status: 'unhealthy', error: realTimeStatus.reason?.message }
    };

    // Determine overall status
    const allHealthy = Object.values(services).every(service => service.status === 'healthy');
    const overallStatus = allHealthy ? 'healthy' : 'degraded';

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        services,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid
        }
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check all services with detailed information
    const [aiStatus, modelStatus, vectorStatus, multimodalStatus, realTimeStatus] = await Promise.allSettled([
      aiEngine.healthCheck(),
      modelManager.healthCheck(),
      vectorStore.healthCheck(),
      multimodalProcessor.healthCheck(),
      realTimeProcessor.healthCheck()
    ]);

    const services = {
      aiEngine: {
        status: aiStatus.status === 'fulfilled' ? aiStatus.value.status : 'unhealthy',
        details: aiStatus.status === 'fulfilled' ? aiStatus.value.details : null,
        error: aiStatus.status === 'rejected' ? aiStatus.reason?.message : null
      },
      modelManager: {
        status: modelStatus.status === 'fulfilled' ? modelStatus.value.status : 'unhealthy',
        details: modelStatus.status === 'fulfilled' ? modelStatus.value.details : null,
        error: modelStatus.status === 'rejected' ? modelStatus.reason?.message : null
      },
      vectorStore: {
        status: vectorStatus.status === 'fulfilled' ? vectorStatus.value.status : 'unhealthy',
        details: vectorStatus.status === 'fulfilled' ? vectorStatus.value.details : null,
        error: vectorStatus.status === 'rejected' ? vectorStatus.reason?.message : null
      },
      multimodalProcessor: {
        status: multimodalStatus.status === 'fulfilled' ? multimodalStatus.value.status : 'unhealthy',
        details: multimodalStatus.status === 'fulfilled' ? multimodalStatus.value.details : null,
        error: multimodalStatus.status === 'rejected' ? multimodalStatus.reason?.message : null
      },
      realTimeProcessor: {
        status: realTimeStatus.status === 'fulfilled' ? realTimeStatus.value.status : 'unhealthy',
        details: realTimeStatus.status === 'fulfilled' ? realTimeStatus.value.details : null,
        error: realTimeStatus.status === 'rejected' ? realTimeStatus.reason?.message : null
      }
    };

    // Determine overall status
    const allHealthy = Object.values(services).every(service => service.status === 'healthy');
    const overallStatus = allHealthy ? 'healthy' : 'degraded';

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        services,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid,
          cpuUsage: process.cpuUsage(),
          env: process.env.NODE_ENV || 'development'
        }
      }
    });
  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Service-specific health checks
router.get('/ai-engine', async (req, res) => {
  try {
    const status = await aiEngine.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('AI Engine health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/model-manager', async (req, res) => {
  try {
    const status = await modelManager.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Model Manager health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/vector-store', async (req, res) => {
  try {
    const status = await vectorStore.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Vector Store health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/multimodal-processor', async (req, res) => {
  try {
    const status = await multimodalProcessor.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Multimodal Processor health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/real-time-processor', async (req, res) => {
  try {
    const status = await realTimeProcessor.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Real-time Processor health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// System metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      },
      services: {
        aiEngine: {
          initialized: aiEngine.isInitialized,
          loadedModels: aiEngine.models ? aiEngine.models.size : 0
        },
        modelManager: {
          initialized: modelManager.isInitialized,
          totalModels: modelManager.modelRegistry ? modelManager.modelRegistry.size : 0,
          loadedModels: modelManager.models ? modelManager.models.size : 0
        },
        vectorStore: {
          initialized: vectorStore.isInitialized,
          providers: vectorStore.stores ? Array.from(vectorStore.stores.keys()) : [],
          indexes: vectorStore.stores ? Object.values(Object.fromEntries(vectorStore.stores)).reduce((acc, store) => acc + store.indexes.size, 0) : 0
        },
        multimodalProcessor: {
          initialized: multimodalProcessor.isInitialized,
          processors: multimodalProcessor.processors ? Array.from(multimodalProcessor.processors.keys()) : []
        },
        realTimeProcessor: {
          initialized: realTimeProcessor.isInitialized,
          connections: realTimeProcessor.connections ? realTimeProcessor.connections.size : 0,
          streams: realTimeProcessor.streams ? realTimeProcessor.streams.size : 0
        }
      }
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Readiness check
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    const [aiReady, modelReady, vectorReady] = await Promise.allSettled([
      aiEngine.healthCheck(),
      modelManager.healthCheck(),
      vectorStore.healthCheck()
    ]);

    const allReady = [aiReady, modelReady, vectorReady].every(
      result => result.status === 'fulfilled' && result.value.status === 'healthy'
    );

    if (allReady) {
      res.json({
        success: true,
        data: {
          status: 'ready',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(503).json({
        success: false,
        data: {
          status: 'not ready',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    logger.error('Readiness check error:', error);
    res.status(503).json({
      success: false,
      error: error.message
    });
  }
});

// Liveness check
router.get('/live', (req, res) => {
  try {
    // Simple liveness check - just verify the process is running
    res.json({
      success: true,
      data: {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    logger.error('Liveness check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
