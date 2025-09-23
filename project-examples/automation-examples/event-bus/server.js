const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/event-bus.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory event store (in production, use Redis or database)
const eventStore = new Map();
const subscriptions = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'event-bus',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.4.0',
    events: eventStore.size,
    subscribers: subscriptions.size
  });
});

// Event publishing endpoint
app.post('/api/events', (req, res) => {
  try {
    const schema = Joi.object({
      type: Joi.string().required(),
      data: Joi.object().required(),
      source: Joi.string().required(),
      timestamp: Joi.date().default(Date.now)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const event = {
      id: uuidv4(),
      type: value.type,
      data: value.data,
      source: value.source,
      timestamp: value.timestamp
    };

    // Store event
    eventStore.set(event.id, event);

    // Emit to all connected clients
    io.emit('event', event);

    // Emit to specific subscribers
    if (subscriptions.has(value.type)) {
      const subscribers = subscriptions.get(value.type);
      subscribers.forEach(socketId => {
        io.to(socketId).emit('event', event);
      });
    }

    logger.info(`Event published: ${event.type} from ${event.source}`);

    res.status(201).json({
      success: true,
      eventId: event.id,
      message: 'Event published successfully'
    });
  } catch (error) {
    logger.error('Event publishing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Event subscription endpoint
app.post('/api/subscribe', (req, res) => {
  try {
    const schema = Joi.object({
      eventType: Joi.string().required(),
      socketId: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!subscriptions.has(value.eventType)) {
      subscriptions.set(value.eventType, new Set());
    }

    subscriptions.get(value.eventType).add(value.socketId);

    logger.info(`Socket ${value.socketId} subscribed to ${value.eventType}`);

    res.json({
      success: true,
      message: 'Subscribed successfully'
    });
  } catch (error) {
    logger.error('Subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Event unsubscription endpoint
app.post('/api/unsubscribe', (req, res) => {
  try {
    const schema = Joi.object({
      eventType: Joi.string().required(),
      socketId: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (subscriptions.has(value.eventType)) {
      subscriptions.get(value.eventType).delete(value.socketId);
    }

    logger.info(`Socket ${value.socketId} unsubscribed from ${value.eventType}`);

    res.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
  } catch (error) {
    logger.error('Unsubscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get events endpoint
app.get('/api/events', (req, res) => {
  try {
    const { type, limit = 100, offset = 0 } = req.query;
    
    let events = Array.from(eventStore.values());
    
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    events = events
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      events,
      total: eventStore.size,
      count: events.length
    });
  } catch (error) {
    logger.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe', (eventType) => {
    if (!subscriptions.has(eventType)) {
      subscriptions.set(eventType, new Set());
    }
    subscriptions.get(eventType).add(socket.id);
    logger.info(`Socket ${socket.id} subscribed to ${eventType}`);
  });

  socket.on('unsubscribe', (eventType) => {
    if (subscriptions.has(eventType)) {
      subscriptions.get(eventType).delete(socket.id);
    }
    logger.info(`Socket ${socket.id} unsubscribed from ${eventType}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    
    // Remove from all subscriptions
    subscriptions.forEach((subscribers, eventType) => {
      subscribers.delete(socket.id);
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Event Bus Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Event Bus running on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
