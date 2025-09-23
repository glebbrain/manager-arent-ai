const express = require('express');
const router = express.Router();
const resourceOptimizer = require('../modules/resource-optimizer');
const databaseOptimizer = require('../modules/database-optimizer');
const cdnManager = require('../modules/cdn-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/optimization-routes.log' })
  ]
});

// Resource Optimization Routes

// Initialize resource optimizer
router.post('/resources/initialize', async (req, res) => {
  try {
    await resourceOptimizer.initialize();
    res.json({ success: true, message: 'Resource optimizer initialized' });
  } catch (error) {
    logger.error('Error initializing resource optimizer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Optimize image
router.post('/resources/images/optimize', async (req, res) => {
  try {
    const { imageData, options = {} } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const result = await resourceOptimizer.optimizeImage(
      Buffer.from(imageData, 'base64'), 
      options
    );
    
    res.json({
      ...result,
      buffer: result.buffer.toString('base64')
    });
  } catch (error) {
    logger.error('Error optimizing image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Compress data
router.post('/resources/compress', async (req, res) => {
  try {
    const { data, format = 'gzip', level = 6 } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const result = await resourceOptimizer.compressData(data, format, level);
    
    res.json({
      ...result,
      buffer: result.buffer.toString('base64')
    });
  } catch (error) {
    logger.error('Error compressing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Decompress data
router.post('/resources/decompress', async (req, res) => {
  try {
    const { compressedData, format = 'gzip' } = req.body;
    
    if (!compressedData) {
      return res.status(400).json({ error: 'Compressed data is required' });
    }

    const result = await resourceOptimizer.decompressData(
      Buffer.from(compressedData, 'base64'), 
      format
    );
    
    res.json({
      decompressed: result.toString('base64')
    });
  } catch (error) {
    logger.error('Error decompressing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Optimize JSON
router.post('/resources/json/optimize', async (req, res) => {
  try {
    const { data, options = {} } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const result = await resourceOptimizer.optimizeJSON(data, options);
    res.json(result);
  } catch (error) {
    logger.error('Error optimizing JSON:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Optimize CSS
router.post('/resources/css/optimize', async (req, res) => {
  try {
    const { css, options = {} } = req.body;
    
    if (!css) {
      return res.status(400).json({ error: 'CSS is required' });
    }

    const result = await resourceOptimizer.optimizeCSS(css, options);
    res.json(result);
  } catch (error) {
    logger.error('Error optimizing CSS:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Optimize JavaScript
router.post('/resources/javascript/optimize', async (req, res) => {
  try {
    const { js, options = {} } = req.body;
    
    if (!js) {
      return res.status(400).json({ error: 'JavaScript is required' });
    }

    const result = await resourceOptimizer.optimizeJavaScript(js, options);
    res.json(result);
  } catch (error) {
    logger.error('Error optimizing JavaScript:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Optimize HTML
router.post('/resources/html/optimize', async (req, res) => {
  try {
    const { html, options = {} } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML is required' });
    }

    const result = await resourceOptimizer.optimizeHTML(html, options);
    res.json(result);
  } catch (error) {
    logger.error('Error optimizing HTML:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch optimize images
router.post('/resources/images/batch-optimize', async (req, res) => {
  try {
    const { images, options = {} } = req.body;
    
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    const result = await resourceOptimizer.batchOptimizeImages(images, options);
    res.json(result);
  } catch (error) {
    logger.error('Error batch optimizing images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get optimization metrics
router.get('/resources/metrics', async (req, res) => {
  try {
    const metrics = await resourceOptimizer.getOptimizationMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting optimization metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supported formats
router.get('/resources/formats', async (req, res) => {
  try {
    const formats = await resourceOptimizer.getSupportedFormats();
    res.json(formats);
  } catch (error) {
    logger.error('Error getting supported formats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Database Optimization Routes

// Initialize database optimizer
router.post('/database/initialize', async (req, res) => {
  try {
    const config = req.body;
    
    await databaseOptimizer.initialize(config);
    res.json({ success: true, message: 'Database optimizer initialized' });
  } catch (error) {
    logger.error('Error initializing database optimizer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute optimized query
router.post('/database/query', async (req, res) => {
  try {
    const { query, params = [], options = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await databaseOptimizer.executeQuery(query, params, options);
    res.json(result);
  } catch (error) {
    logger.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analyze query performance
router.post('/database/analyze', async (req, res) => {
  try {
    const { query, params = [] } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const analysis = await databaseOptimizer.analyzeQuery(query, params);
    res.json(analysis);
  } catch (error) {
    logger.error('Error analyzing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create index
router.post('/database/indexes', async (req, res) => {
  try {
    const { tableName, columns, options = {} } = req.body;
    
    if (!tableName || !columns) {
      return res.status(400).json({ error: 'Table name and columns are required' });
    }

    const index = await databaseOptimizer.createIndex(tableName, columns, options);
    res.json(index);
  } catch (error) {
    logger.error('Error creating index:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Drop index
router.delete('/database/indexes/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    const result = await databaseOptimizer.dropIndex(name);
    res.json(result);
  } catch (error) {
    logger.error('Error dropping index:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get table statistics
router.get('/database/tables/:name/stats', async (req, res) => {
  try {
    const { name } = req.params;
    
    const stats = await databaseOptimizer.getTableStats(name);
    res.json(stats);
  } catch (error) {
    logger.error('Error getting table statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get slow queries
router.get('/database/slow-queries', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const queries = await databaseOptimizer.getSlowQueries(parseInt(limit));
    res.json(queries);
  } catch (error) {
    logger.error('Error getting slow queries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Optimize table
router.post('/database/tables/:name/optimize', async (req, res) => {
  try {
    const { name } = req.params;
    
    const result = await databaseOptimizer.optimizeTable(name);
    res.json(result);
  } catch (error) {
    logger.error('Error optimizing table:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get database metrics
router.get('/database/metrics', async (req, res) => {
  try {
    const metrics = await databaseOptimizer.getDatabaseMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting database metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CDN Management Routes

// Initialize CDN manager
router.post('/cdn/initialize', async (req, res) => {
  try {
    const config = req.body;
    
    await cdnManager.initialize(config);
    res.json({ success: true, message: 'CDN manager initialized' });
  } catch (error) {
    logger.error('Error initializing CDN manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add CDN provider
router.post('/cdn/providers', async (req, res) => {
  try {
    const { name, config } = req.body;
    
    if (!name || !config) {
      return res.status(400).json({ error: 'Name and config are required' });
    }

    const provider = await cdnManager.addProvider(name, config);
    res.json(provider);
  } catch (error) {
    logger.error('Error adding CDN provider:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Purge cache
router.post('/cdn/purge', async (req, res) => {
  try {
    const { providerName, urls, options = {} } = req.body;
    
    if (!providerName || !urls) {
      return res.status(400).json({ error: 'Provider name and URLs are required' });
    }

    const result = await cdnManager.purgeCache(providerName, urls, options);
    res.json(result);
  } catch (error) {
    logger.error('Error purging cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cache status
router.get('/cdn/cache-status', async (req, res) => {
  try {
    const { providerName, url } = req.query;
    
    if (!providerName || !url) {
      return res.status(400).json({ error: 'Provider name and URL are required' });
    }

    const status = await cdnManager.getCacheStatus(providerName, url);
    res.json(status);
  } catch (error) {
    logger.error('Error getting cache status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics
router.get('/cdn/analytics', async (req, res) => {
  try {
    const { providerName, options = {} } = req.query;
    
    if (!providerName) {
      return res.status(400).json({ error: 'Provider name is required' });
    }

    const analytics = await cdnManager.getAnalytics(providerName, options);
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get CDN metrics
router.get('/cdn/metrics', async (req, res) => {
  try {
    const metrics = await cdnManager.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting CDN metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'optimization',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
