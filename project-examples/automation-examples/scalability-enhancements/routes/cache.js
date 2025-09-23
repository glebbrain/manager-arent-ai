const express = require('express');
const router = express.Router();
const cacheManager = require('../modules/cache-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/cache-routes.log' })
  ]
});

// Initialize cache manager
router.post('/initialize', async (req, res) => {
  try {
    const config = req.body;
    
    await cacheManager.initialize(config);
    res.json({ success: true, message: 'Cache manager initialized' });
  } catch (error) {
    logger.error('Error initializing cache manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create cache
router.post('/caches', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name) {
      return res.status(400).json({ error: 'Cache name is required' });
    }

    const cache = await cacheManager.createCache(config);
    res.json(cache);
  } catch (error) {
    logger.error('Error creating cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cache
router.get('/caches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cache = await cacheManager.getCache(id);
    res.json(cache);
  } catch (error) {
    logger.error('Error getting cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set cache value
router.post('/caches/:id/set', async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value, ttl } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    const success = await cacheManager.set(id, key, value, ttl);
    res.json({ success });
  } catch (error) {
    logger.error('Error setting cache value:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cache value
router.get('/caches/:id/get/:key', async (req, res) => {
  try {
    const { id, key } = req.params;
    
    const value = await cacheManager.get(id, key);
    res.json({ value });
  } catch (error) {
    logger.error('Error getting cache value:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete cache value
router.delete('/caches/:id/delete/:key', async (req, res) => {
  try {
    const { id, key } = req.params;
    
    const success = await cacheManager.delete(id, key);
    res.json({ success });
  } catch (error) {
    logger.error('Error deleting cache value:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear cache
router.delete('/caches/:id/clear', async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await cacheManager.clear(id);
    res.json({ success });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cache statistics
router.get('/caches/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await cacheManager.getCacheStats(id);
    res.json(stats);
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all cache statistics
router.get('/caches/stats', async (req, res) => {
  try {
    const stats = await cacheManager.getAllCacheStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting all cache stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get global metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await cacheManager.getGlobalMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting global metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Warm cache
router.post('/caches/:id/warm', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, keyGenerator } = req.body;
    
    if (!data || !keyGenerator) {
      return res.status(400).json({ error: 'Data and keyGenerator are required' });
    }

    const warmed = await cacheManager.warmCache(id, data, keyGenerator);
    res.json({ warmed });
  } catch (error) {
    logger.error('Error warming cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invalidate by pattern
router.post('/caches/:id/invalidate', async (req, res) => {
  try {
    const { id } = req.params;
    const { pattern } = req.body;
    
    if (!pattern) {
      return res.status(400).json({ error: 'Pattern is required' });
    }

    const invalidated = await cacheManager.invalidateByPattern(id, pattern);
    res.json({ invalidated });
  } catch (error) {
    logger.error('Error invalidating cache by pattern:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update cache configuration
router.put('/caches/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const cache = await cacheManager.updateCacheConfig(id, updates);
    res.json(cache);
  } catch (error) {
    logger.error('Error updating cache configuration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete cache
router.delete('/caches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await cacheManager.deleteCache(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cache',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
