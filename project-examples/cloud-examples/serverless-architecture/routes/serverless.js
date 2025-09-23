const express = require('express');
const router = express.Router();
const serverlessManager = require('../modules/serverless-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/serverless-routes.log' })
  ]
});

// Initialize serverless manager
router.post('/initialize', async (req, res) => {
  try {
    await serverlessManager.initialize();
    res.json({ success: true, message: 'Serverless manager initialized' });
  } catch (error) {
    logger.error('Error initializing serverless manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deploy function
router.post('/deploy', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.runtime) {
      return res.status(400).json({ 
        error: 'Name and runtime are required' 
      });
    }

    const function = await serverlessManager.deployFunction(config);
    res.json(function);
  } catch (error) {
    logger.error('Error deploying function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invoke function
router.post('/functions/:id/invoke', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    
    const invocation = await serverlessManager.invokeFunction(id, payload);
    res.json(invocation);
  } catch (error) {
    logger.error('Error invoking function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update function
router.put('/functions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const function = await serverlessManager.updateFunction(id, updates);
    res.json(function);
  } catch (error) {
    logger.error('Error updating function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get function
router.get('/functions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const function = await serverlessManager.getFunction(id);
    res.json(function);
  } catch (error) {
    logger.error('Error getting function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List functions
router.get('/functions', async (req, res) => {
  try {
    const filters = req.query;
    
    const functions = await serverlessManager.listFunctions(filters);
    res.json(functions);
  } catch (error) {
    logger.error('Error listing functions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete function
router.delete('/functions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await serverlessManager.deleteFunction(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get runtimes
router.get('/runtimes', async (req, res) => {
  try {
    const runtimes = await serverlessManager.getRuntimes();
    res.json(runtimes);
  } catch (error) {
    logger.error('Error getting runtimes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get providers
router.get('/providers', async (req, res) => {
  try {
    const providers = await serverlessManager.getProviders();
    res.json(providers);
  } catch (error) {
    logger.error('Error getting providers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await serverlessManager.getTemplates();
    res.json(templates);
  } catch (error) {
    logger.error('Error getting templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await serverlessManager.getMetrics();
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
    service: 'serverless',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
