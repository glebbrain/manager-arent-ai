const express = require('express');
const router = express.Router();
const analyticsEngine = require('../modules/analytics-engine');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/analytics-routes.log' })
  ]
});

// Process data
router.post('/process', async (req, res) => {
  try {
    const { data, metadata } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const result = await analyticsEngine.processData(data, metadata);
    res.json(result);
  } catch (error) {
    logger.error('Error processing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get aggregated metrics
router.get('/metrics', async (req, res) => {
  try {
    const { timeRange = '1h', aggregationType = 'sum' } = req.query;
    
    const metrics = await analyticsEngine.getAggregatedMetrics(timeRange, aggregationType);
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get real-time data
router.get('/realtime', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const data = analyticsEngine.getRealTimeData(parseInt(limit));
    res.json(data);
  } catch (error) {
    logger.error('Error getting real-time data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear old data
router.delete('/clear', async (req, res) => {
  try {
    const { maxAge = 24 * 60 * 60 * 1000 } = req.body; // 24 hours default
    
    analyticsEngine.clearOldData(maxAge);
    res.json({ success: true, message: 'Old data cleared successfully' });
  } catch (error) {
    logger.error('Error clearing old data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
