const express = require('express');
const router = express.Router();
const functionManager = require('../modules/function-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/functions-routes.log' })
  ]
});

// Initialize function manager
router.post('/initialize', async (req, res) => {
  try {
    await functionManager.initialize();
    res.json({ success: true, message: 'Function manager initialized' });
  } catch (error) {
    logger.error('Error initializing function manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create function
router.post('/functions', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.runtime) {
      return res.status(400).json({ 
        error: 'Name and runtime are required' 
      });
    }

    const function = await functionManager.createFunction(config);
    res.json(function);
  } catch (error) {
    logger.error('Error creating function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create function version
router.post('/functions/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const config = req.body;
    
    const version = await functionManager.createVersion(id, config);
    res.json(version);
  } catch (error) {
    logger.error('Error creating function version:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create function alias
router.post('/functions/:id/aliases', async (req, res) => {
  try {
    const { id } = req.params;
    const config = req.body;
    
    if (!config.name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const alias = await functionManager.createAlias(id, config);
    res.json(alias);
  } catch (error) {
    logger.error('Error creating function alias:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create function layer
router.post('/layers', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.runtime) {
      return res.status(400).json({ 
        error: 'Name and runtime are required' 
      });
    }

    const layer = await functionManager.createLayer(config);
    res.json(layer);
  } catch (error) {
    logger.error('Error creating function layer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update function
router.put('/functions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const function = await functionManager.updateFunction(id, updates);
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
    
    const function = await functionManager.getFunction(id);
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
    
    const functions = await functionManager.listFunctions(filters);
    res.json(functions);
  } catch (error) {
    logger.error('Error listing functions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get function versions
router.get('/functions/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    
    const versions = await functionManager.getFunctionVersions(id);
    res.json(versions);
  } catch (error) {
    logger.error('Error getting function versions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get function aliases
router.get('/functions/:id/aliases', async (req, res) => {
  try {
    const { id } = req.params;
    
    const aliases = await functionManager.getFunctionAliases(id);
    res.json(aliases);
  } catch (error) {
    logger.error('Error getting function aliases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get layers
router.get('/layers', async (req, res) => {
  try {
    const layers = await functionManager.getLayers();
    res.json(layers);
  } catch (error) {
    logger.error('Error getting layers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get function templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await functionManager.getFunctionTemplates();
    res.json(templates);
  } catch (error) {
    logger.error('Error getting function templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete function
router.delete('/functions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await functionManager.deleteFunction(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await functionManager.getMetrics();
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
    service: 'functions',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
