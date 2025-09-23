const express = require('express');
const router = express.Router();
const threatDetector = require('../modules/threat-detector');

// Initialize threat detector
threatDetector.initialize();

// Detect threats
router.post('/detect', async (req, res) => {
  try {
    const { eventData } = req.body;
    
    if (!eventData) {
      return res.status(400).json({
        success: false,
        error: 'eventData is required'
      });
    }

    const threats = await threatDetector.detectThreats(eventData);
    res.json({
      success: true,
      data: threats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get threats
router.get('/', async (req, res) => {
  try {
    const threats = await threatDetector.getThreats(req.query);
    res.json({
      success: true,
      data: threats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get threat rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await threatDetector.getThreatRules();
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

// Get threat patterns
router.get('/patterns', async (req, res) => {
  try {
    const patterns = await threatDetector.getThreatPatterns();
    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get detector data
router.get('/data', async (req, res) => {
  try {
    const data = await threatDetector.getDetectorData();
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
