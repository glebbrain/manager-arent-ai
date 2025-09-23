const express = require('express');
const router = express.Router();
const awsProvider = require('../modules/providers/aws-provider');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/aws-routes.log' })
  ]
});

// Create EC2 instance
router.post('/instances', async (req, res) => {
  try {
    const config = req.body;
    
    const instance = await awsProvider.createInstance(config);
    res.json(instance);
  } catch (error) {
    logger.error('Error creating EC2 instance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create S3 bucket
router.post('/buckets', async (req, res) => {
  try {
    const config = req.body;
    
    const bucket = await awsProvider.createBucket(config);
    res.json(bucket);
  } catch (error) {
    logger.error('Error creating S3 bucket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Lambda function
router.post('/functions', async (req, res) => {
  try {
    const config = req.body;
    
    const lambda = await awsProvider.createFunction(config);
    res.json(lambda);
  } catch (error) {
    logger.error('Error creating Lambda function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create RDS instance
router.post('/databases', async (req, res) => {
  try {
    const config = req.body;
    
    const database = await awsProvider.createDatabase(config);
    res.json(database);
  } catch (error) {
    logger.error('Error creating RDS instance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create ElastiCache cluster
router.post('/caches', async (req, res) => {
  try {
    const config = req.body;
    
    const cache = await awsProvider.createCache(config);
    res.json(cache);
  } catch (error) {
    logger.error('Error creating ElastiCache cluster:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create CloudFormation stack
router.post('/stacks', async (req, res) => {
  try {
    const config = req.body;
    
    const stack = await awsProvider.createStack(config);
    res.json(stack);
  } catch (error) {
    logger.error('Error creating CloudFormation stack:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List resources
router.get('/resources', async (req, res) => {
  try {
    const { type } = req.query;
    
    const resources = await awsProvider.listResources(type);
    res.json(resources);
  } catch (error) {
    logger.error('Error listing AWS resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get resource
router.get('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const resource = await awsProvider.getResource(id);
    res.json(resource);
  } catch (error) {
    logger.error('Error getting AWS resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete resource
router.delete('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await awsProvider.deleteResource(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting AWS resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await awsProvider.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting AWS metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get costs
router.get('/costs', async (req, res) => {
  try {
    const costs = await awsProvider.getCosts();
    res.json(costs);
  } catch (error) {
    logger.error('Error getting AWS costs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'aws',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
