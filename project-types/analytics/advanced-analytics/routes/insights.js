const express = require('express');
const router = express.Router();
const insightEngine = require('../modules/insight-engine');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/insights-routes.log' })
  ]
});

// Generate insights
router.post('/generate', async (req, res) => {
  try {
    const { data, options } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const insights = await insightEngine.generateInsights(data, options);
    res.json(insights);
  } catch (error) {
    logger.error('Error generating insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get insights
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const insights = await insightEngine.getInsights(id);
    res.json(insights);
  } catch (error) {
    logger.error('Error getting insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List insights
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    
    const insights = await insightEngine.listInsights(filters);
    res.json(insights);
  } catch (error) {
    logger.error('Error listing insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'insights',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
