const express = require('express');
const router = express.Router();
const exportService = require('../modules/export-service');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/exports-routes.log' })
  ]
});

// Create export
router.post('/', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.data) {
      return res.status(400).json({ error: 'Name and data are required' });
    }

    const exportJob = await exportService.createExport(config);
    res.json(exportJob);
  } catch (error) {
    logger.error('Error creating export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process export
router.post('/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    
    const exportJob = await exportService.processExport(id);
    res.json(exportJob);
  } catch (error) {
    logger.error('Error processing export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get export
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const exportJob = await exportService.getExport(id);
    res.json(exportJob);
  } catch (error) {
    logger.error('Error getting export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List exports
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    
    const exports = await exportService.listExports(filters);
    res.json(exports);
  } catch (error) {
    logger.error('Error listing exports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete export
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await exportService.deleteExport(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get export file
router.get('/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    
    const fileInfo = await exportService.getExportFile(id);
    res.json(fileInfo);
  } catch (error) {
    logger.error('Error getting export file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download export file
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    const fileInfo = await exportService.getExportFile(id);
    
    res.download(fileInfo.filePath, fileInfo.fileName, (err) => {
      if (err) {
        logger.error('Error downloading file:', err);
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
  } catch (error) {
    logger.error('Error downloading export file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'exports',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
