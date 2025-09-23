const express = require('express');
const router = express.Router();
const kpiCalculator = require('../modules/kpi-calculator');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/kpis-routes.log' })
  ]
});

// Define KPI
router.post('/', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.formula) {
      return res.status(400).json({ error: 'KPI name and formula are required' });
    }

    const kpi = await kpiCalculator.defineKPI(config);
    res.json(kpi);
  } catch (error) {
    logger.error('Error defining KPI:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get KPI
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const kpi = await kpiCalculator.getKPI(id);
    res.json(kpi);
  } catch (error) {
    logger.error('Error getting KPI:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update KPI
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const kpi = await kpiCalculator.updateKPI(id, updates);
    res.json(kpi);
  } catch (error) {
    logger.error('Error updating KPI:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete KPI
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await kpiCalculator.deleteKPI(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting KPI:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List KPIs
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    
    const kpis = await kpiCalculator.listKPIs(filters);
    res.json(kpis);
  } catch (error) {
    logger.error('Error listing KPIs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate KPI
router.post('/:id/calculate', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, options } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const calculation = await kpiCalculator.calculateKPI(id, data, options);
    res.json(calculation);
  } catch (error) {
    logger.error('Error calculating KPI:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get calculation history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100 } = req.query;
    
    const history = await kpiCalculator.getCalculationHistory(id, parseInt(limit));
    res.json(history);
  } catch (error) {
    logger.error('Error getting calculation history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'kpis',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
