const express = require('express');
const router = express.Router();
const costAnalyzer = require('../modules/cost-analyzer');
const budgetManager = require('../modules/budget-manager');
const optimizationEngine = require('../modules/optimization-engine');
const aiOptimizer = require('../modules/ai-optimizer');

// Initialize modules
costAnalyzer.initialize();
budgetManager.initialize();
optimizationEngine.initialize();
aiOptimizer.initialize();

// Get comprehensive analytics
router.get('/overview', async (req, res) => {
  try {
    const costData = await costAnalyzer.getAnalyzerData();
    const budgetData = await budgetManager.getBudgetData();
    const optimizationData = await optimizationEngine.getEngineData();
    const aiData = await aiOptimizer.getAIData();

    const overview = {
      cost: costData,
      budget: budgetData,
      optimization: optimizationData,
      ai: aiData,
      summary: {
        totalCosts: costData.totalCosts,
        totalBudgets: budgetData.totalBudgets,
        totalOptimizations: optimizationData.totalOptimizations,
        totalSavings: optimizationData.totalSavings,
        predictionAccuracy: aiData.predictionAccuracy
      }
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get cost analytics
router.get('/cost', async (req, res) => {
  try {
    const analytics = await costAnalyzer.getAnalyzerData();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get budget analytics
router.get('/budget', async (req, res) => {
  try {
    const analytics = await budgetManager.getBudgetAnalytics(req.query);
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get optimization analytics
router.get('/optimization', async (req, res) => {
  try {
    const analytics = await optimizationEngine.getEngineData();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get AI analytics
router.get('/ai', async (req, res) => {
  try {
    const analytics = await aiOptimizer.getAIData();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
