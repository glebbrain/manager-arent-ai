const express = require('express');
const router = express.Router();
const optimizationEngine = require('../modules/optimization-engine');

// Initialize optimization engine
optimizationEngine.initialize();

// Run optimization
router.post('/run', async (req, res) => {
  try {
    const { strategy = 'balanced', filters = {} } = req.body;
    const optimization = await optimizationEngine.runOptimization(strategy, filters);
    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute optimization action
router.post('/actions/:actionId/execute', async (req, res) => {
  try {
    const execution = await optimizationEngine.executeAction(req.params.actionId);
    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get optimization rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await optimizationEngine.getOptimizationRules();
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

// Get optimization strategies
router.get('/strategies', async (req, res) => {
  try {
    const strategies = await optimizationEngine.getOptimizationStrategies();
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

// Get optimization results
router.get('/results', async (req, res) => {
  try {
    const results = await optimizationEngine.getOptimizationResults(req.query);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get engine data
router.get('/data', async (req, res) => {
  try {
    const data = await optimizationEngine.getEngineData();
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
