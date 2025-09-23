const express = require('express');
const router = express.Router();
const azureProvider = require('../modules/providers/azure-provider');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/azure-routes.log' })
  ]
});

// Create virtual machine
router.post('/virtualmachines', async (req, res) => {
  try {
    const config = req.body;
    
    const vm = await azureProvider.createVirtualMachine(config);
    res.json(vm);
  } catch (error) {
    logger.error('Error creating virtual machine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create storage account
router.post('/storageaccounts', async (req, res) => {
  try {
    const config = req.body;
    
    const storage = await azureProvider.createStorageAccount(config);
    res.json(storage);
  } catch (error) {
    logger.error('Error creating storage account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create function app
router.post('/functionapps', async (req, res) => {
  try {
    const config = req.body;
    
    const functionApp = await azureProvider.createFunctionApp(config);
    res.json(functionApp);
  } catch (error) {
    logger.error('Error creating function app:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create SQL database
router.post('/databases', async (req, res) => {
  try {
    const config = req.body;
    
    const database = await azureProvider.createSqlDatabase(config);
    res.json(database);
  } catch (error) {
    logger.error('Error creating SQL database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Redis cache
router.post('/caches', async (req, res) => {
  try {
    const config = req.body;
    
    const cache = await azureProvider.createRedisCache(config);
    res.json(cache);
  } catch (error) {
    logger.error('Error creating Redis cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List resources
router.get('/resources', async (req, res) => {
  try {
    const { type } = req.query;
    
    const resources = await azureProvider.listResources(type);
    res.json(resources);
  } catch (error) {
    logger.error('Error listing Azure resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get resource
router.get('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const resource = await azureProvider.getResource(id);
    res.json(resource);
  } catch (error) {
    logger.error('Error getting Azure resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete resource
router.delete('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await azureProvider.deleteResource(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting Azure resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await azureProvider.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting Azure metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get costs
router.get('/costs', async (req, res) => {
  try {
    const costs = await azureProvider.getCosts();
    res.json(costs);
  } catch (error) {
    logger.error('Error getting Azure costs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'azure',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
