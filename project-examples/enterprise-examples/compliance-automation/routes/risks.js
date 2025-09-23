const express = require('express');
const router = express.Router();
const riskAssessor = require('../modules/risk-assessor');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/risks-routes.log' })
  ]
});

// Initialize risk assessor
router.post('/initialize', async (req, res) => {
  try {
    await riskAssessor.initialize();
    res.json({ success: true, message: 'Risk assessor initialized' });
  } catch (error) {
    logger.error('Error initializing risk assessor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create risk
router.post('/risks', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const risk = await riskAssessor.createRisk(config);
    res.json(risk);
  } catch (error) {
    logger.error('Error creating risk:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assess risk
router.post('/risks/:id/assess', async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = req.body;
    
    if (!assessment.impact || !assessment.likelihood) {
      return res.status(400).json({ error: 'Impact and likelihood are required' });
    }

    const riskAssessment = await riskAssessor.assessRisk(id, assessment);
    res.json(riskAssessment);
  } catch (error) {
    logger.error('Error assessing risk:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add mitigation
router.post('/risks/:id/mitigations', async (req, res) => {
  try {
    const { id } = req.params;
    const mitigation = req.body;
    
    if (!mitigation.name) {
      return res.status(400).json({ error: 'Mitigation name is required' });
    }

    const riskMitigation = await riskAssessor.addRiskMitigation(id, mitigation);
    res.json(riskMitigation);
  } catch (error) {
    logger.error('Error adding risk mitigation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update mitigation status
router.put('/mitigations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completionDate } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const mitigation = await riskAssessor.updateMitigationStatus(id, status, completionDate);
    res.json(mitigation);
  } catch (error) {
    logger.error('Error updating mitigation status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add incident
router.post('/risks/:id/incidents', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = req.body;
    
    if (!incident.title) {
      return res.status(400).json({ error: 'Incident title is required' });
    }

    const riskIncident = await riskAssessor.addRiskIncident(id, incident);
    res.json(riskIncident);
  } catch (error) {
    logger.error('Error adding risk incident:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get risk
router.get('/risks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const risk = await riskAssessor.getRisk(id);
    res.json(risk);
  } catch (error) {
    logger.error('Error getting risk:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List risks
router.get('/risks', async (req, res) => {
  try {
    const filters = req.query;
    
    const risks = await riskAssessor.listRisks(filters);
    res.json(risks);
  } catch (error) {
    logger.error('Error listing risks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get risk assessments
router.get('/assessments', async (req, res) => {
  try {
    const { riskId } = req.query;
    
    const assessments = await riskAssessor.getRiskAssessments(riskId);
    res.json(assessments);
  } catch (error) {
    logger.error('Error getting risk assessments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get risk mitigations
router.get('/mitigations', async (req, res) => {
  try {
    const { riskId } = req.query;
    
    const mitigations = await riskAssessor.getRiskMitigations(riskId);
    res.json(mitigations);
  } catch (error) {
    logger.error('Error getting risk mitigations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get risk categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await riskAssessor.getRiskCategories();
    res.json(categories);
  } catch (error) {
    logger.error('Error getting risk categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get risk matrix
router.get('/matrix', async (req, res) => {
  try {
    const matrix = await riskAssessor.getRiskMatrix();
    res.json(matrix);
  } catch (error) {
    logger.error('Error getting risk matrix:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get risk trends
router.get('/trends', async (req, res) => {
  try {
    const { timeRange = '6months' } = req.query;
    
    const trends = await riskAssessor.getRiskTrends(timeRange);
    res.json(trends);
  } catch (error) {
    logger.error('Error getting risk trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await riskAssessor.getMetrics();
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
    service: 'risks',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
