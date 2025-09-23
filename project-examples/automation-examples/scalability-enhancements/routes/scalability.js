const express = require('express');
const router = express.Router();
const loadBalancer = require('../modules/load-balancer');
const autoScaler = require('../modules/auto-scaler');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/scalability-routes.log' })
  ]
});

// Load Balancer Routes

// Add server to load balancer
router.post('/load-balancer/servers', async (req, res) => {
  try {
    const serverConfig = req.body;
    
    if (!serverConfig.host || !serverConfig.port) {
      return res.status(400).json({ error: 'Host and port are required' });
    }

    const server = await loadBalancer.addServer(serverConfig);
    res.json(server);
  } catch (error) {
    logger.error('Error adding server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove server from load balancer
router.delete('/load-balancer/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await loadBalancer.removeServer(id);
    res.json(result);
  } catch (error) {
    logger.error('Error removing server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get next server
router.get('/load-balancer/next-server', async (req, res) => {
  try {
    const { strategy = 'round-robin', sessionId } = req.query;
    
    const server = await loadBalancer.getNextServer(strategy, sessionId);
    res.json(server);
  } catch (error) {
    logger.error('Error getting next server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get load balancer stats
router.get('/load-balancer/stats', async (req, res) => {
  try {
    const stats = await loadBalancer.getLoadBalancerStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting load balancer stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get server stats
router.get('/load-balancer/servers/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await loadBalancer.getServerStats(id);
    res.json(stats);
  } catch (error) {
    logger.error('Error getting server stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update connection count
router.put('/load-balancer/servers/:id/connections', async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body;
    
    if (delta === undefined) {
      return res.status(400).json({ error: 'Delta is required' });
    }

    const server = await loadBalancer.updateConnectionCount(id, delta);
    res.json(server);
  } catch (error) {
    logger.error('Error updating connection count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auto Scaler Routes

// Add scaling policy
router.post('/auto-scaler/policies', async (req, res) => {
  try {
    const { name, policy } = req.body;
    
    if (!name || !policy) {
      return res.status(400).json({ error: 'Name and policy are required' });
    }

    const scalingPolicy = await autoScaler.addScalingPolicy(name, policy);
    res.json(scalingPolicy);
  } catch (error) {
    logger.error('Error adding scaling policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update scaling policy
router.put('/auto-scaler/policies/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const updates = req.body;
    
    const policy = await autoScaler.updateScalingPolicy(name, updates);
    res.json(policy);
  } catch (error) {
    logger.error('Error updating scaling policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete scaling policy
router.delete('/auto-scaler/policies/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    const result = await autoScaler.deleteScalingPolicy(name);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting scaling policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scaling policies
router.get('/auto-scaler/policies', async (req, res) => {
  try {
    const policies = await autoScaler.getScalingPolicies();
    res.json(policies);
  } catch (error) {
    logger.error('Error getting scaling policies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scaling status
router.get('/auto-scaler/status', async (req, res) => {
  try {
    const status = await autoScaler.getScalingStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting scaling status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scaling history
router.get('/auto-scaler/history', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const history = await autoScaler.getScalingHistory(parseInt(limit));
    res.json(history);
  } catch (error) {
    logger.error('Error getting scaling history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Force scale
router.post('/auto-scaler/force-scale', async (req, res) => {
  try {
    const { action, targetInstances, reason } = req.body;
    
    if (!action || targetInstances === undefined) {
      return res.status(400).json({ error: 'Action and targetInstances are required' });
    }

    const scalingEvent = await autoScaler.forceScale(action, targetInstances, reason);
    res.json(scalingEvent);
  } catch (error) {
    logger.error('Error force scaling:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enable auto scaling
router.post('/auto-scaler/enable', async (req, res) => {
  try {
    await autoScaler.startScaling();
    res.json({ success: true, message: 'Auto scaling enabled' });
  } catch (error) {
    logger.error('Error enabling auto scaling:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disable auto scaling
router.post('/auto-scaler/disable', async (req, res) => {
  try {
    await autoScaler.stopScaling();
    res.json({ success: true, message: 'Auto scaling disabled' });
  } catch (error) {
    logger.error('Error disabling auto scaling:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'scalability',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
