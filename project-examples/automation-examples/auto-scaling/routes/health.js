const express = require('express');
const router = express.Router();
const healthMonitor = require('../modules/health-monitor');

// Initialize health monitor
healthMonitor.initialize();

// Perform health check
router.post('/check', async (req, res) => {
  try {
    const { instanceId, checkId, config = {} } = req.body;
    
    if (!instanceId || !checkId) {
      return res.status(400).json({
        success: false,
        error: 'instanceId and checkId are required'
      });
    }

    const healthStatus = await healthMonitor.performHealthCheck(instanceId, checkId, config);
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get health status
router.get('/status/:instanceId', async (req, res) => {
  try {
    const healthStatus = await healthMonitor.getHealthStatus(req.params.instanceId);
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get health checks
router.get('/checks', async (req, res) => {
  try {
    const checks = await healthMonitor.getHealthChecks();
    res.json({
      success: true,
      data: checks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get health alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await healthMonitor.getHealthAlerts(req.query);
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get health data
router.get('/data', async (req, res) => {
  try {
    const data = await healthMonitor.getHealthData();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
