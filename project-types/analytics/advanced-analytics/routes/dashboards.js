const express = require('express');
const router = express.Router();
const dashboardManager = require('../modules/dashboard-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/dashboards-routes.log' })
  ]
});

// Create dashboard
router.post('/', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name) {
      return res.status(400).json({ error: 'Dashboard name is required' });
    }

    const dashboard = await dashboardManager.createDashboard(config);
    res.json(dashboard);
  } catch (error) {
    logger.error('Error creating dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const dashboard = await dashboardManager.getDashboard(id);
    res.json(dashboard);
  } catch (error) {
    logger.error('Error getting dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update dashboard
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const dashboard = await dashboardManager.updateDashboard(id, updates);
    res.json(dashboard);
  } catch (error) {
    logger.error('Error updating dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete dashboard
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dashboardManager.deleteDashboard(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List dashboards
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    
    const dashboards = await dashboardManager.listDashboards(filters);
    res.json(dashboards);
  } catch (error) {
    logger.error('Error listing dashboards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add widget to dashboard
router.post('/:id/widgets', async (req, res) => {
  try {
    const { id } = req.params;
    const widgetConfig = req.body;
    
    const widget = await dashboardManager.addWidget(id, widgetConfig);
    res.json(widget);
  } catch (error) {
    logger.error('Error adding widget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update widget
router.put('/:id/widgets/:widgetId', async (req, res) => {
  try {
    const { id, widgetId } = req.params;
    const updates = req.body;
    
    const widget = await dashboardManager.updateWidget(id, widgetId, updates);
    res.json(widget);
  } catch (error) {
    logger.error('Error updating widget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove widget
router.delete('/:id/widgets/:widgetId', async (req, res) => {
  try {
    const { id, widgetId } = req.params;
    
    const result = await dashboardManager.removeWidget(id, widgetId);
    res.json(result);
  } catch (error) {
    logger.error('Error removing widget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get widget data
router.get('/:id/widgets/:widgetId/data', async (req, res) => {
  try {
    const { id, widgetId } = req.params;
    const { dataSource } = req.query;
    
    const data = await dashboardManager.getWidgetData(widgetId, dataSource);
    res.json(data);
  } catch (error) {
    logger.error('Error getting widget data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create widget template
router.post('/templates', async (req, res) => {
  try {
    const config = req.body;
    
    const template = await dashboardManager.createWidgetTemplate(config);
    res.json(template);
  } catch (error) {
    logger.error('Error creating widget template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get widget template
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await dashboardManager.getWidgetTemplate(id);
    res.json(template);
  } catch (error) {
    logger.error('Error getting widget template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List widget templates
router.get('/templates', async (req, res) => {
  try {
    const filters = req.query;
    
    const templates = await dashboardManager.listWidgetTemplates(filters);
    res.json(templates);
  } catch (error) {
    logger.error('Error listing widget templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'dashboards',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
