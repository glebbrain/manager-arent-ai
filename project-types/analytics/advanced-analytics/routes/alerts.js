const express = require('express');
const router = express.Router();
const alertManager = require('../modules/alert-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/alerts-routes.log' })
  ]
});

// Create alert rule
router.post('/rules', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.condition || !config.threshold) {
      return res.status(400).json({ error: 'Name, condition, and threshold are required' });
    }

    const rule = await alertManager.createAlertRule(config);
    res.json(rule);
  } catch (error) {
    logger.error('Error creating alert rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alert rule
router.get('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const rule = await alertManager.getAlertRule(id);
    res.json(rule);
  } catch (error) {
    logger.error('Error getting alert rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update alert rule
router.put('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const rule = await alertManager.updateAlertRule(id, updates);
    res.json(rule);
  } catch (error) {
    logger.error('Error updating alert rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete alert rule
router.delete('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await alertManager.deleteAlertRule(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting alert rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List alert rules
router.get('/rules', async (req, res) => {
  try {
    const filters = req.query;
    
    const rules = await alertManager.listAlertRules(filters);
    res.json(rules);
  } catch (error) {
    logger.error('Error listing alert rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Evaluate alert rules
router.post('/evaluate', async (req, res) => {
  try {
    const { data, options } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const alerts = await alertManager.evaluateAlertRules(data, options);
    res.json(alerts);
  } catch (error) {
    logger.error('Error evaluating alert rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alert
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await alertManager.getAlert(id);
    res.json(alert);
  } catch (error) {
    logger.error('Error getting alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List alerts
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    
    const alerts = await alertManager.listAlerts(filters);
    res.json(alerts);
  } catch (error) {
    logger.error('Error listing alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Acknowledge alert
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const alert = await alertManager.acknowledgeAlert(id, userId);
    res.json(alert);
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve alert
router.post('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const alert = await alertManager.resolveAlert(id, userId);
    res.json(alert);
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notifications
router.get('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await alertManager.getNotification(id);
    res.json(notification);
  } catch (error) {
    logger.error('Error getting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List notifications
router.get('/notifications', async (req, res) => {
  try {
    const filters = req.query;
    
    const notifications = await alertManager.listNotifications(filters);
    res.json(notifications);
  } catch (error) {
    logger.error('Error listing notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'alerts',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
