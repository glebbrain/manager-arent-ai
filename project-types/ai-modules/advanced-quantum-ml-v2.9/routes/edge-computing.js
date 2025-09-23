const express = require('express');
const router = express.Router();
const edgeComputing = require('../modules/edge-computing');
const logger = require('../modules/logger');

// Initialize edge computing
router.post('/initialize', async (req, res) => {
  try {
    const options = req.body || {};
    const result = edgeComputing.initialize(options);
    
    logger.info('Edge computing initialized via API', {
      options,
      success: result.success
    });

    res.json({
      success: true,
      message: 'Edge computing system initialized successfully',
      data: result
    });
  } catch (error) {
    logger.error('Edge computing initialization failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Initialization failed',
      message: error.message
    });
  }
});

// Register edge device
router.post('/devices/register', async (req, res) => {
  try {
    const deviceInfo = req.body;

    if (!deviceInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'deviceInfo is required'
      });
    }

    const result = edgeComputing.registerEdgeDevice(deviceInfo);
    
    logger.info('Edge device registered via API', {
      deviceId: result.deviceId,
      name: result.device.name
    });

    res.json({
      success: true,
      message: 'Edge device registered successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to register edge device:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Device registration failed',
      message: error.message
    });
  }
});

// Unregister edge device
router.delete('/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = edgeComputing.unregisterEdgeDevice(deviceId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        message: result.error
      });
    }

    logger.info('Edge device unregistered via API', { deviceId });

    res.json({
      success: true,
      message: 'Edge device unregistered successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to unregister edge device:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Device unregistration failed',
      message: error.message
    });
  }
});

// Get edge device
router.get('/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = edgeComputing.getEdgeDevice(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        message: `Edge device '${deviceId}' not found`
      });
    }

    res.json({
      success: true,
      message: 'Edge device retrieved successfully',
      data: { device }
    });
  } catch (error) {
    logger.error('Failed to get edge device:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get device',
      message: error.message
    });
  }
});

// Get all edge devices
router.get('/devices', async (req, res) => {
  try {
    const devices = edgeComputing.getAllEdgeDevices();
    
    res.json({
      success: true,
      message: 'Edge devices retrieved successfully',
      data: {
        devices: devices,
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.status === 'online').length
      }
    });
  } catch (error) {
    logger.error('Failed to get edge devices:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get devices',
      message: error.message
    });
  }
});

// Deploy model to edge device
router.post('/devices/:deviceId/models', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const modelInfo = req.body;

    if (!modelInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'modelInfo is required'
      });
    }

    const result = edgeComputing.deployModelToEdge(deviceId, modelInfo);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Model deployment failed',
        message: result.error
      });
    }

    logger.info('Model deployed to edge device via API', {
      deviceId,
      modelId: result.modelId,
      modelName: result.model.name
    });

    res.json({
      success: true,
      message: 'Model deployed to edge device successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to deploy model to edge:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Model deployment failed',
      message: error.message
    });
  }
});

// Get edge model
router.get('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = edgeComputing.getEdgeModel(modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
        message: `Edge model '${modelId}' not found`
      });
    }

    res.json({
      success: true,
      message: 'Edge model retrieved successfully',
      data: { model }
    });
  } catch (error) {
    logger.error('Failed to get edge model:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get model',
      message: error.message
    });
  }
});

// Get all edge models
router.get('/models', async (req, res) => {
  try {
    const models = edgeComputing.getAllEdgeModels();
    
    res.json({
      success: true,
      message: 'Edge models retrieved successfully',
      data: {
        models: models,
        totalModels: models.length
      }
    });
  } catch (error) {
    logger.error('Failed to get edge models:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get models',
      message: error.message
    });
  }
});

// Execute task on edge device
router.post('/devices/:deviceId/tasks', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const taskInfo = req.body;

    if (!taskInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'taskInfo is required'
      });
    }

    const result = await edgeComputing.executeEdgeTask(deviceId, taskInfo);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Task execution failed',
        message: result.error
      });
    }

    logger.info('Edge task executed via API', {
      deviceId,
      taskId: result.taskId,
      success: result.success
    });

    res.json({
      success: true,
      message: 'Edge task executed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to execute edge task:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Task execution failed',
      message: error.message
    });
  }
});

// Get edge task
router.get('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = edgeComputing.getEdgeTask(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: `Edge task '${taskId}' not found`
      });
    }

    res.json({
      success: true,
      message: 'Edge task retrieved successfully',
      data: { task }
    });
  } catch (error) {
    logger.error('Failed to get edge task:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get task',
      message: error.message
    });
  }
});

// Batch execute tasks
router.post('/tasks/batch', async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        message: 'tasks must be an array'
      });
    }

    const results = [];
    for (const taskInfo of tasks) {
      const { deviceId } = taskInfo;
      const result = await edgeComputing.executeEdgeTask(deviceId, taskInfo);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info('Batch edge tasks executed via API', {
      totalTasks: tasks.length,
      successCount,
      failureCount
    });

    res.json({
      success: true,
      message: `Batch execution completed: ${successCount} successful, ${failureCount} failed`,
      data: {
        results: results,
        summary: {
          total: tasks.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });
  } catch (error) {
    logger.error('Failed to execute batch tasks:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Batch execution failed',
      message: error.message
    });
  }
});

// Get edge metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = edgeComputing.getEdgeMetrics();
    
    res.json({
      success: true,
      message: 'Edge computing metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get edge metrics:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

// Synchronize edge devices
router.post('/synchronize', async (req, res) => {
  try {
    await edgeComputing.synchronizeEdgeDevices();
    
    logger.info('Edge devices synchronized via API');

    res.json({
      success: true,
      message: 'Edge devices synchronized successfully'
    });
  } catch (error) {
    logger.error('Failed to synchronize edge devices:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Synchronization failed',
      message: error.message
    });
  }
});

// Health check for edge computing
router.get('/health', async (req, res) => {
  try {
    const metrics = edgeComputing.getEdgeMetrics();
    
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      totalDevices: metrics.totalDevices,
      activeDevices: metrics.activeDevices,
      totalTasks: metrics.totalTasks,
      completedTasks: metrics.completedTasks,
      successRate: metrics.successRate,
      averageLatency: metrics.averageLatency,
      uptime: process.uptime()
    };

    res.json({
      success: true,
      message: 'Edge computing health check passed',
      data: health
    });
  } catch (error) {
    logger.error('Edge computing health check failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Get device capabilities
router.get('/devices/:deviceId/capabilities', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = edgeComputing.getEdgeDevice(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        message: `Edge device '${deviceId}' not found`
      });
    }

    res.json({
      success: true,
      message: 'Device capabilities retrieved successfully',
      data: {
        deviceId: deviceId,
        capabilities: device.capabilities,
        resources: device.resources,
        models: device.models.length,
        tasks: device.tasks.length
      }
    });
  } catch (error) {
    logger.error('Failed to get device capabilities:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get capabilities',
      message: error.message
    });
  }
});

// Get device status
router.get('/devices/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = edgeComputing.getEdgeDevice(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        message: `Edge device '${deviceId}' not found`
      });
    }

    const status = {
      deviceId: deviceId,
      status: device.status,
      lastSeen: device.lastSeen,
      uptime: Date.now() - device.lastSeen,
      activeTasks: device.tasks.filter(t => t.status === 'running').length,
      deployedModels: device.models.length,
      resources: device.resources
    };

    res.json({
      success: true,
      message: 'Device status retrieved successfully',
      data: status
    });
  } catch (error) {
    logger.error('Failed to get device status:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      message: error.message
    });
  }
});

module.exports = router;
