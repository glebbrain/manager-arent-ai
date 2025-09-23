const express = require('express');
const router = express.Router();
const complianceEngine = require('../modules/compliance-engine');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/compliance-routes.log' })
  ]
});

// Initialize compliance engine
router.post('/initialize', async (req, res) => {
  try {
    await complianceEngine.initialize();
    res.json({ success: true, message: 'Compliance engine initialized' });
  } catch (error) {
    logger.error('Error initializing compliance engine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Run compliance assessment
router.post('/assessments', async (req, res) => {
  try {
    const { frameworkId, scope } = req.body;
    
    if (!frameworkId) {
      return res.status(400).json({ error: 'Framework ID is required' });
    }

    const assessment = await complianceEngine.runAssessment(frameworkId, scope);
    res.json(assessment);
  } catch (error) {
    logger.error('Error running compliance assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assessment
router.get('/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const assessment = await complianceEngine.getAssessment(id);
    res.json(assessment);
  } catch (error) {
    logger.error('Error getting assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List assessments
router.get('/assessments', async (req, res) => {
  try {
    const filters = req.query;
    
    const assessments = await complianceEngine.listAssessments(filters);
    res.json(assessments);
  } catch (error) {
    logger.error('Error listing assessments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get violations
router.get('/violations', async (req, res) => {
  try {
    const filters = req.query;
    
    const violations = await complianceEngine.getViolations(filters);
    res.json(violations);
  } catch (error) {
    logger.error('Error getting violations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get frameworks
router.get('/frameworks', async (req, res) => {
  try {
    const frameworks = await complianceEngine.getFrameworks();
    res.json(frameworks);
  } catch (error) {
    logger.error('Error getting frameworks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get controls
router.get('/controls', async (req, res) => {
  try {
    const { frameworkId } = req.query;
    
    const controls = await complianceEngine.getControls(frameworkId);
    res.json(controls);
  } catch (error) {
    logger.error('Error getting controls:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await complianceEngine.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'compliance',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
