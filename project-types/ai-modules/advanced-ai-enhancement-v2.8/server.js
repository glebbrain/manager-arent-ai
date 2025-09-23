const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('rate-limiter-flexible');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./modules/logger');
const aiEngine = require('./modules/ai-engine');
const quantumProcessor = require('./modules/quantum-processor');
const neuralNetwork = require('./modules/neural-network');
const cognitiveServices = require('./modules/cognitive-services');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const rateLimiter = new rateLimit.RateLimiterMemory({
  keyPrefix: 'ai_enhancement',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too Many Requests' });
  }
});

// Routes
app.use('/api/v2.8/ai', require('./routes/ai-engine'));
app.use('/api/v2.8/quantum', require('./routes/quantum'));
app.use('/api/v2.8/neural', require('./routes/neural-network'));
app.use('/api/v2.8/cognitive', require('./routes/cognitive'));
app.use('/api/v2.8/health', require('./routes/health'));

// WebSocket connections for real-time AI processing
io.on('connection', (socket) => {
  logger.info(`[WEBSOCKET] Client connected: ${socket.id}`);
  
  socket.on('ai-request', async (data) => {
    try {
      const result = await aiEngine.processRequest(data);
      socket.emit('ai-response', result);
    } catch (error) {
      logger.error(`[WEBSOCKET] AI processing error: ${error.message}`);
      socket.emit('ai-error', { error: error.message });
    }
  });
  
  socket.on('quantum-request', async (data) => {
    try {
      const result = await quantumProcessor.process(data);
      socket.emit('quantum-response', result);
    } catch (error) {
      logger.error(`[WEBSOCKET] Quantum processing error: ${error.message}`);
      socket.emit('quantum-error', { error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    logger.info(`[WEBSOCKET] Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`[ERROR] ${err.message}`, err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize AI services
async function initializeServices() {
  try {
    await aiEngine.initialize();
    await quantumProcessor.initialize();
    await neuralNetwork.initialize();
    await cognitiveServices.initialize();
    logger.info('[INIT] All AI services initialized successfully');
  } catch (error) {
    logger.error(`[INIT] Failed to initialize services: ${error.message}`);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 3008;
server.listen(PORT, async () => {
  await initializeServices();
  logger.info(`[SERVER] Advanced AI Enhancement v2.8 running on port ${PORT}`);
  logger.info(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('[SHUTDOWN] SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('[SHUTDOWN] SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
