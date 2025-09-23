const express = require('express');
const router = express.Router();
const scalingManager = require('../modules/scaling-manager');
const scalingEngine = require('../modules/scaling-engine');
const metricsCollector = require('../modules/metrics-collector');
const healthMonitor = require('../modules/health-monitor');

// Initialize modules
scalingManager.initialize();
scalingEngine.initialize();
metricsCollector.initialize();
healthMonitor.initialize();

// Create scaling group
router.post('/groups', async (req, res) => {
  try {
    const scalingGroup = await scalingManager.createScalingGroup(req.body);
    res.status(201).json({
      success: true,
      data: scalingGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scaling groups
router.get('/groups', async (req, res) => {
  try {
    const scalingGroups = await scalingManager.listScalingGroups(req.query);
    res.json({
      success: true,
      data: scalingGroups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scaling group by ID
router.get('/groups/:id', async (req, res) => {
  try {
    const scalingGroup = await scalingManager.getScalingGroup(req.params.id);
    res.json({
      success: true,
      data: scalingGroup
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Update scaling group
router.put('/groups/:id', async (req, res) => {
  try {
    const scalingGroup = await scalingManager.updateScalingGroup(req.params.id, req.body);
    res.json({
      success: true,
      data: scalingGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete scaling group
router.delete('/groups/:id', async (req, res) => {
  try {
    await scalingManager.deleteScalingGroup(req.params.id);
    res.json({
      success: true,
      message: 'Scaling group deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Scale up
router.post('/groups/:id/scale-up', async (req, res) => {
  try {
    const { instances = 1 } = req.body;
    const scalingAction = await scalingManager.scaleUp(req.params.id, instances);
    res.json({
      success: true,
      data: scalingAction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Scale down
router.post('/groups/:id/scale-down', async (req, res) => {
  try {
    const { instances = 1 } = req.body;
    const scalingAction = await scalingManager.scaleDown(req.params.id, instances);
    res.json({
      success: true,
      data: scalingAction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scaling actions
router.get('/actions', async (req, res) => {
  try {
    const scalingActions = await scalingManager.getScalingActions(req.query.scalingGroupId);
    res.json({
      success: true,
      data: scalingActions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scaling strategies
router.get('/strategies', async (req, res) => {
  try {
    const strategies = await scalingManager.getScalingStrategies();
    res.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scaling templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await scalingManager.getScalingTemplates();
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scaling metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await scalingManager.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Evaluate scaling decision
router.post('/evaluate', async (req, res) => {
  try {
    const { scalingGroupId, metrics } = req.body;
    
    if (!scalingGroupId || !metrics) {
      return res.status(400).json({
        success: false,
        error: 'scalingGroupId and metrics are required'
      });
    }

    const decision = await scalingEngine.evaluateScalingDecision(scalingGroupId, metrics);
    res.json({
      success: true,
      data: decision
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scaling rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await scalingEngine.getScalingRules();
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create scaling rule
router.post('/rules', async (req, res) => {
  try {
    const rule = await scalingEngine.createScalingRule(req.body);
    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update scaling rule
router.put('/rules/:id', async (req, res) => {
  try {
    const rule = await scalingEngine.updateScalingRule(req.params.id, req.body);
    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete scaling rule
router.delete('/rules/:id', async (req, res) => {
  try {
    await scalingEngine.deleteScalingRule(req.params.id);
    res.json({
      success: true,
      message: 'Scaling rule deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scaling policies
router.get('/policies', async (req, res) => {
  try {
    const policies = await scalingEngine.getScalingPolicies();
    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scaling decisions
router.get('/decisions', async (req, res) => {
  try {
    const decisions = await scalingEngine.getScalingDecisions(req.query.scalingGroupId);
    res.json({
      success: true,
      data: decisions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get engine data
router.get('/engine/data', async (req, res) => {
  try {
    const data = await scalingEngine.getEngineData();
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
