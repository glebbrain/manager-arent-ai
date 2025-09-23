const express = require('express');
const router = express.Router();
const deploymentManager = require('../modules/deployment-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/deployment-routes.log' })
  ]
});

// Initialize deployment manager
router.post('/initialize', async (req, res) => {
  try {
    await deploymentManager.initialize();
    res.json({ success: true, message: 'Deployment manager initialized' });
  } catch (error) {
    logger.error('Error initializing deployment manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deploy application
router.post('/deploy', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.provider || !config.template) {
      return res.status(400).json({ 
        error: 'Name, provider, and template are required' 
      });
    }

    const deployment = await deploymentManager.deployApplication(config);
    res.json(deployment);
  } catch (error) {
    logger.error('Error deploying application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rollback deployment
router.post('/deployments/:id/rollback', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const rollback = await deploymentManager.rollbackDeployment(id, reason);
    res.json(rollback);
  } catch (error) {
    logger.error('Error rolling back deployment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get deployment
router.get('/deployments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deployment = await deploymentManager.getDeployment(id);
    res.json(deployment);
  } catch (error) {
    logger.error('Error getting deployment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List deployments
router.get('/deployments', async (req, res) => {
  try {
    const filters = req.query;
    
    const deployments = await deploymentManager.listDeployments(filters);
    res.json(deployments);
  } catch (error) {
    logger.error('Error listing deployments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get deployment strategies
router.get('/strategies', async (req, res) => {
  try {
    const strategies = await deploymentManager.getDeploymentStrategies();
    res.json(strategies);
  } catch (error) {
    logger.error('Error getting deployment strategies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get deployment templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await deploymentManager.getDeploymentTemplates();
    res.json(templates);
  } catch (error) {
    logger.error('Error getting deployment templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get rollbacks
router.get('/rollbacks', async (req, res) => {
  try {
    const { deploymentId } = req.query;
    
    const rollbacks = await deploymentManager.getRollbacks(deploymentId);
    res.json(rollbacks);
  } catch (error) {
    logger.error('Error getting rollbacks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await deploymentManager.getMetrics();
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
    service: 'deployment',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
