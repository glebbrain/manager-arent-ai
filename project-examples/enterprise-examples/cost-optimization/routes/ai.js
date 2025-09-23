const express = require('express');
const router = express.Router();
const aiOptimizer = require('../modules/ai-optimizer');

// Initialize AI optimizer
aiOptimizer.initialize();

// Generate cost prediction
router.post('/predict', async (req, res) => {
  try {
    const { modelId, inputData } = req.body;
    
    if (!modelId || !inputData) {
      return res.status(400).json({
        success: false,
        error: 'modelId and inputData are required'
      });
    }

    const prediction = await aiOptimizer.generateCostPrediction(modelId, inputData);
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { recommendationType, context } = req.body;
    
    if (!recommendationType) {
      return res.status(400).json({
        success: false,
        error: 'recommendationType is required'
      });
    }

    const recommendation = await aiOptimizer.generateRecommendations(recommendationType, context);
    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get AI models
router.get('/models', async (req, res) => {
  try {
    const models = await aiOptimizer.getAIModels();
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get predictions
router.get('/predictions', async (req, res) => {
  try {
    const predictions = await aiOptimizer.getPredictions(req.query);
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await aiOptimizer.getRecommendations(req.query);
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get AI data
router.get('/data', async (req, res) => {
  try {
    const data = await aiOptimizer.getAIData();
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
