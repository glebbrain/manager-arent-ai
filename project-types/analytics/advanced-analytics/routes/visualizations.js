const express = require('express');
const router = express.Router();
const dataVisualizer = require('../modules/data-visualizer');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/visualizations-routes.log' })
  ]
});

// Create visualization
router.post('/', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.type || !config.data) {
      return res.status(400).json({ error: 'Name, type, and data are required' });
    }

    const visualization = await dataVisualizer.createVisualization(config);
    res.json(visualization);
  } catch (error) {
    logger.error('Error creating visualization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get visualization
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const visualization = await dataVisualizer.getVisualization(id);
    res.json(visualization);
  } catch (error) {
    logger.error('Error getting visualization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update visualization
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const visualization = await dataVisualizer.updateVisualization(id, updates);
    res.json(visualization);
  } catch (error) {
    logger.error('Error updating visualization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete visualization
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dataVisualizer.deleteVisualization(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting visualization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List visualizations
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    
    const visualizations = await dataVisualizer.listVisualizations(filters);
    res.json(visualizations);
  } catch (error) {
    logger.error('Error listing visualizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate chart
router.post('/charts', async (req, res) => {
  try {
    const { type, data, options } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }

    const chart = await dataVisualizer.generateChart(type, data, options);
    res.json(chart);
  } catch (error) {
    logger.error('Error generating chart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'visualizations',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
