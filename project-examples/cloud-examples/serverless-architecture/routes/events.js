const express = require('express');
const router = express.Router();
const eventManager = require('../modules/event-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/events-routes.log' })
  ]
});

// Initialize event manager
router.post('/initialize', async (req, res) => {
  try {
    await eventManager.initialize();
    res.json({ success: true, message: 'Event manager initialized' });
  } catch (error) {
    logger.error('Error initializing event manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event
router.post('/events', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.type || !config.source) {
      return res.status(400).json({ 
        error: 'Type and source are required' 
      });
    }

    const event = await eventManager.createEvent(config);
    res.json(event);
  } catch (error) {
    logger.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process event
router.post('/events/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    const { handlerId } = req.body;
    
    const event = await eventManager.processEvent(id, handlerId);
    res.json(event);
  } catch (error) {
    logger.error('Error processing event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event handler
router.post('/handlers', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.functionId) {
      return res.status(400).json({ 
        error: 'Name and functionId are required' 
      });
    }

    const handler = await eventManager.createEventHandler(config);
    res.json(handler);
  } catch (error) {
    logger.error('Error creating event handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update event handler
router.put('/handlers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const handler = await eventManager.updateEventHandler(id, updates);
    res.json(handler);
  } catch (error) {
    logger.error('Error updating event handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await eventManager.getEvent(id);
    res.json(event);
  } catch (error) {
    logger.error('Error getting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List events
router.get('/events', async (req, res) => {
  try {
    const filters = req.query;
    
    const events = await eventManager.listEvents(filters);
    res.json(events);
  } catch (error) {
    logger.error('Error listing events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event types
router.get('/types', async (req, res) => {
  try {
    const types = await eventManager.getEventTypes();
    res.json(types);
  } catch (error) {
    logger.error('Error getting event types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event sources
router.get('/sources', async (req, res) => {
  try {
    const sources = await eventManager.getEventSources();
    res.json(sources);
  } catch (error) {
    logger.error('Error getting event sources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event handlers
router.get('/handlers', async (req, res) => {
  try {
    const handlers = await eventManager.getEventHandlers();
    res.json(handlers);
  } catch (error) {
    logger.error('Error getting event handlers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event handler
router.delete('/handlers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await eventManager.deleteEventHandler(id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting event handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await eventManager.getMetrics();
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
    service: 'events',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
