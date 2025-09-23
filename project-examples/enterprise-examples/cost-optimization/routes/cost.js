const express = require('express');
const router = express.Router();
const costAnalyzer = require('../modules/cost-analyzer');

// Initialize cost analyzer
costAnalyzer.initialize();

// Analyze costs
router.post('/analyze', async (req, res) => {
  try {
    const { analysisType, filters = {} } = req.body;
    
    if (!analysisType) {
      return res.status(400).json({
        success: false,
        error: 'analysisType is required'
      });
    }

    const analysis = await costAnalyzer.analyzeCosts(analysisType, filters);
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get costs
router.get('/', async (req, res) => {
  try {
    const costs = await costAnalyzer.getCosts(req.query);
    res.json({
      success: true,
      data: costs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get cost categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await costAnalyzer.getCostCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get analysis templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await costAnalyzer.getAnalysisTemplates();
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

// Get analysis results
router.get('/analysis', async (req, res) => {
  try {
    const results = await costAnalyzer.getAnalysisResults(req.query);
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

// Get analyzer data
router.get('/data', async (req, res) => {
  try {
    const data = await costAnalyzer.getAnalyzerData();
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
