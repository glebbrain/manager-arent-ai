const express = require('express');
const router = express.Router();
const gcpProvider = require('../modules/providers/gcp-provider');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/gcp-routes.log' })
  ]
});

// Create compute instance
router.post('/instances', async (req, res) => {
  try {
    const config = req.body;
    
    const instance = await gcpProvider.createInstance(config);
    res.json(instance);
  } catch (error) {
    logger.error('Error creating compute instance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create storage bucket
router.post('/buckets', async (req, res) => {
  try {
    const config = req.body;
    
    const bucket = await gcpProvider.createBucket(config);
    res.json(bucket);
  } catch (error) {
    logger.error('Error creating storage bucket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create cloud function
router.post('/functions', async (req, res) => {
  try {
    const config = req.body;
    
    const function = await gcpProvider.createFunction(config);
    res.json(function);
  } catch (error) {
    logger.error('Error creating cloud function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Cloud SQL instance
router.post('/databases', async (req, res) => {
  try {
    const config = req.body;
    
    const database = await gcpProvider.createSqlInstance(config);
    res.json(database);
  } catch (error) {
    logger.error('Error creating Cloud SQL instance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Redis instance
router.post('/caches', async (req, res) => {
  try {
    const config = req.body;
    
    const cache = await gcpProvider.createRedisInstance(config);
    res.json(cache);
  } catch (error) {
    logger.error('Error creating Redis instance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Kubernetes cluster
router.post('/clusters', async (req, res) => {
  try {
    const config = req.body;
    
    const cluster = await gcpProvider.createKubernetesCluster(config);
    res.json(cluster);
  } catch (error) {
    logger.error('Error creating Kubernetes cluster:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List resources
router.get('/resources', async (req, res) => {
  try {
    const { type } = req.query;
    
    const resources = await gcpProvider.listResources(type);
    res.json(resources);
  } catch (error) {
    logger.error('Error listing GCP resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get resource
router.get('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const resource = await gcpProvider.getResource(id);
    res.json(resource);
  } catch (error) {
    logger.error('Error getting GCP resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete resource
router.delete('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await gcpProvider.deleteResource(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting GCP resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await gcpProvider.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting GCP metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get costs
router.get('/costs', async (req, res) => {
  try {
    const costs = await gcpProvider.getCosts();
    res.json(costs);
  } catch (error) {
    logger.error('Error getting GCP costs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'gcp',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
