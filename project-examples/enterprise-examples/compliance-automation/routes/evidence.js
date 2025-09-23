const express = require('express');
const router = express.Router();
const evidenceCollector = require('../modules/evidence-collector');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/evidence-routes.log' })
  ]
});

// Initialize evidence collector
router.post('/initialize', async (req, res) => {
  try {
    await evidenceCollector.initialize();
    res.json({ success: true, message: 'Evidence collector initialized' });
  } catch (error) {
    logger.error('Error initializing evidence collector:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Collect evidence
router.post('/evidence', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const evidence = await evidenceCollector.collectEvidence(config);
    res.json(evidence);
  } catch (error) {
    logger.error('Error collecting evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Store evidence
router.post('/evidence/:id/store', async (req, res) => {
  try {
    const { id } = req.params;
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const storedPath = await evidenceCollector.storeEvidence(id, filePath);
    res.json({ storedPath });
  } catch (error) {
    logger.error('Error storing evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get evidence
router.get('/evidence/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const evidence = await evidenceCollector.getEvidence(id);
    res.json(evidence);
  } catch (error) {
    logger.error('Error getting evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List evidence
router.get('/evidence', async (req, res) => {
  try {
    const filters = req.query;
    
    const evidence = await evidenceCollector.listEvidence(filters);
    res.json(evidence);
  } catch (error) {
    logger.error('Error listing evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search evidence
router.get('/evidence/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const evidence = await evidenceCollector.searchEvidence(q);
    res.json(evidence);
  } catch (error) {
    logger.error('Error searching evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get evidence by hash
router.get('/evidence/hash/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    const evidence = await evidenceCollector.getEvidenceByHash(hash);
    res.json(evidence);
  } catch (error) {
    logger.error('Error getting evidence by hash:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update evidence
router.put('/evidence/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const evidence = await evidenceCollector.updateEvidence(id, updates);
    res.json(evidence);
  } catch (error) {
    logger.error('Error updating evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete evidence
router.delete('/evidence/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await evidenceCollector.deleteEvidence(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get evidence types
router.get('/types', async (req, res) => {
  try {
    const types = await evidenceCollector.getEvidenceTypes();
    res.json(types);
  } catch (error) {
    logger.error('Error getting evidence types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get evidence sources
router.get('/sources', async (req, res) => {
  try {
    const sources = await evidenceCollector.getEvidenceSources();
    res.json(sources);
  } catch (error) {
    logger.error('Error getting evidence sources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await evidenceCollector.getMetrics();
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
    service: 'evidence',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
