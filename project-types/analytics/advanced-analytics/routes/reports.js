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

// Generate report
router.post('/generate', async (req, res) => {
  try {
    const { templateId, data, options } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const report = await reportGenerator.generateReport(templateId, data, options);
    res.json(report);
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get report template
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = reportGenerator.getDefaultTemplate();
    res.json(template);
  } catch (error) {
    logger.error('Error getting template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List report templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [reportGenerator.getDefaultTemplate()];
    res.json(templates);
  } catch (error) {
    logger.error('Error listing templates:', error);
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
