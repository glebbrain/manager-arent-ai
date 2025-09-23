const express = require('express');
const router = express.Router();
const complianceChecker = require('../modules/compliance-checker');

// Initialize compliance checker
complianceChecker.initialize();

// Run compliance check
router.post('/check', async (req, res) => {
  try {
    const { checkId, frameworkId } = req.body;
    
    if (!checkId) {
      return res.status(400).json({
        success: false,
        error: 'checkId is required'
      });
    }

    const result = await complianceChecker.runComplianceCheck(checkId, frameworkId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get compliance frameworks
router.get('/frameworks', async (req, res) => {
  try {
    const frameworks = await complianceChecker.getComplianceFrameworks();
    res.json({
      success: true,
      data: frameworks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get compliance checks
router.get('/checks', async (req, res) => {
  try {
    const checks = await complianceChecker.getComplianceChecks();
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

// Get compliance results
router.get('/results', async (req, res) => {
  try {
    const results = await complianceChecker.getComplianceResults(req.query);
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

// Get checker data
router.get('/data', async (req, res) => {
  try {
    const data = await complianceChecker.getCheckerData();
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
