const express = require('express');
const router = express.Router();
const queueManager = require('../modules/queue-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/queue-routes.log' })
  ]
});

// Initialize queue manager
router.post('/initialize', async (req, res) => {
  try {
    const config = req.body;
    
    await queueManager.initialize(config);
    res.json({ success: true, message: 'Queue manager initialized' });
  } catch (error) {
    logger.error('Error initializing queue manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create queue
router.post('/queues', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name) {
      return res.status(400).json({ error: 'Queue name is required' });
    }

    const queue = await queueManager.createQueue(config.name, config);
    res.json(queue);
  } catch (error) {
    logger.error('Error creating queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get queue
router.get('/queues/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    const queue = await queueManager.getQueue(name);
    res.json(queue);
  } catch (error) {
    logger.error('Error getting queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add job to queue
router.post('/queues/:name/jobs', async (req, res) => {
  try {
    const { name } = req.params;
    const { jobData, options } = req.body;
    
    if (!jobData) {
      return res.status(400).json({ error: 'Job data is required' });
    }

    const job = await queueManager.addJob(name, jobData, options);
    res.json(job);
  } catch (error) {
    logger.error('Error adding job to queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job status
router.get('/queues/:name/jobs/:jobId', async (req, res) => {
  try {
    const { name, jobId } = req.params;
    
    const status = await queueManager.getJobStatus(name, jobId);
    res.json(status);
  } catch (error) {
    logger.error('Error getting job status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Schedule job
router.post('/queues/:name/schedule', async (req, res) => {
  try {
    const { name } = req.params;
    const { jobData, schedule, options } = req.body;
    
    if (!jobData || !schedule) {
      return res.status(400).json({ error: 'Job data and schedule are required' });
    }

    const job = await queueManager.scheduleJob(name, jobData, schedule, options);
    res.json(job);
  } catch (error) {
    logger.error('Error scheduling job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get queue statistics
router.get('/queues/:name/stats', async (req, res) => {
  try {
    const { name } = req.params;
    
    const stats = await queueManager.getQueueStats(name);
    res.json(stats);
  } catch (error) {
    logger.error('Error getting queue stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all queue statistics
router.get('/queues/stats', async (req, res) => {
  try {
    const stats = await queueManager.getAllQueueStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting all queue stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pause queue
router.post('/queues/:name/pause', async (req, res) => {
  try {
    const { name } = req.params;
    
    const result = await queueManager.pauseQueue(name);
    res.json(result);
  } catch (error) {
    logger.error('Error pausing queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resume queue
router.post('/queues/:name/resume', async (req, res) => {
  try {
    const { name } = req.params;
    
    const result = await queueManager.resumeQueue(name);
    res.json(result);
  } catch (error) {
    logger.error('Error resuming queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clean queue
router.post('/queues/:name/clean', async (req, res) => {
  try {
    const { name } = req.params;
    const { grace = 0, status = 'completed' } = req.body;
    
    const result = await queueManager.cleanQueue(name, grace, status);
    res.json(result);
  } catch (error) {
    logger.error('Error cleaning queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove job
router.delete('/queues/:name/jobs/:jobId', async (req, res) => {
  try {
    const { name, jobId } = req.params;
    
    const result = await queueManager.removeJob(name, jobId);
    res.json(result);
  } catch (error) {
    logger.error('Error removing job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retry job
router.post('/queues/:name/jobs/:jobId/retry', async (req, res) => {
  try {
    const { name, jobId } = req.params;
    
    const result = await queueManager.retryJob(name, jobId);
    res.json(result);
  } catch (error) {
    logger.error('Error retrying job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job logs
router.get('/queues/:name/jobs/:jobId/logs', async (req, res) => {
  try {
    const { name, jobId } = req.params;
    const { limit = 100 } = req.query;
    
    const logs = await queueManager.getJobLogs(name, jobId, parseInt(limit));
    res.json(logs);
  } catch (error) {
    logger.error('Error getting job logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await queueManager.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset metrics
router.post('/metrics/reset', async (req, res) => {
  try {
    await queueManager.resetMetrics();
    res.json({ success: true, message: 'Metrics reset successfully' });
  } catch (error) {
    logger.error('Error resetting metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete queue
router.delete('/queues/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    const result = await queueManager.deleteQueue(name);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'queue',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
