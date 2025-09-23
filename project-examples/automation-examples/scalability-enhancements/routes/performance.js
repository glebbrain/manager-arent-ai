const express = require('express');
const router = express.Router();
const performanceMonitor = require('../modules/performance-monitor');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/performance-routes.log' })
  ]
});

// Start performance monitoring
router.post('/monitoring/start', async (req, res) => {
  try {
    const { interval = 5000 } = req.body;
    
    await performanceMonitor.startMonitoring(interval);
    res.json({ success: true, message: 'Performance monitoring started' });
  } catch (error) {
    logger.error('Error starting performance monitoring:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stop performance monitoring
router.post('/monitoring/stop', async (req, res) => {
  try {
    await performanceMonitor.stopMonitoring();
    res.json({ success: true, message: 'Performance monitoring stopped' });
  } catch (error) {
    logger.error('Error stopping performance monitoring:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current metrics
router.get('/metrics/current', async (req, res) => {
  try {
    const metrics = await performanceMonitor.getCurrentMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting current metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics history
router.get('/metrics/history', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const history = await performanceMonitor.getMetricsHistory(parseInt(limit));
    res.json(history);
  } catch (error) {
    logger.error('Error getting metrics history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set performance threshold
router.post('/thresholds', async (req, res) => {
  try {
    const { metric, threshold, operator = 'gt' } = req.body;
    
    if (!metric || threshold === undefined) {
      return res.status(400).json({ error: 'Metric and threshold are required' });
    }

    const thresholdConfig = await performanceMonitor.setThreshold(metric, threshold, operator);
    res.json(thresholdConfig);
  } catch (error) {
    logger.error('Error setting performance threshold:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const filters = req.query;
    
    const alerts = await performanceMonitor.getAlerts(filters);
    res.json(alerts);
  } catch (error) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Acknowledge alert
router.post('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await performanceMonitor.acknowledgeAlert(id);
    res.json(alert);
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve alert
router.post('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await performanceMonitor.resolveAlert(id);
    res.json(alert);
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get performance summary
router.get('/summary', async (req, res) => {
  try {
    const summary = await performanceMonitor.getPerformanceSummary();
    res.json(summary);
  } catch (error) {
    logger.error('Error getting performance summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate performance report
router.post('/reports', async (req, res) => {
  try {
    const { timeRange = '1h' } = req.body;
    
    const report = await performanceMonitor.generatePerformanceReport(timeRange);
    res.json(report);
  } catch (error) {
    logger.error('Error generating performance report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'performance',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
