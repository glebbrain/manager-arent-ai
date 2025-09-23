const express = require('express');
const router = express.Router();
const reportGenerator = require('../modules/report-generator');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/reports-routes.log' })
  ]
});

// Initialize report generator
router.post('/initialize', async (req, res) => {
  try {
    await reportGenerator.initialize();
    res.json({ success: true, message: 'Report generator initialized' });
  } catch (error) {
    logger.error('Error initializing report generator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate report
router.post('/generate', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    const report = await reportGenerator.generateReport(config);
    res.json(report);
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get report
router.get('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await reportGenerator.getReport(id);
    res.json(report);
  } catch (error) {
    logger.error('Error getting report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List reports
router.get('/reports', async (req, res) => {
  try {
    const filters = req.query;
    
    const reports = await reportGenerator.listReports(filters);
    res.json(reports);
  } catch (error) {
    logger.error('Error listing reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download report
router.get('/reports/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await reportGenerator.getReport(id);
    
    if (!report.filePath) {
      return res.status(404).json({ error: 'Report file not found' });
    }

    res.download(report.filePath, report.name);
  } catch (error) {
    logger.error('Error downloading report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Schedule report
router.post('/schedules', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.templateId || !config.frequency) {
      return res.status(400).json({ error: 'Template ID and frequency are required' });
    }

    const schedule = await reportGenerator.scheduleReport(config);
    res.json(schedule);
  } catch (error) {
    logger.error('Error scheduling report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Run scheduled reports
router.post('/schedules/run', async (req, res) => {
  try {
    await reportGenerator.runScheduledReports();
    res.json({ success: true, message: 'Scheduled reports executed' });
  } catch (error) {
    logger.error('Error running scheduled reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await reportGenerator.getMetrics();
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
    service: 'reports',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
