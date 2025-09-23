const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import modules
const logger = require('./modules/logger');
const aiEngine = require('./modules/ai-engine');
const modelManager = require('./modules/model-manager');
const vectorStore = require('./modules/vector-store');
const multimodalProcessor = require('./modules/multimodal-processor');
const realTimeProcessor = require('./modules/real-time-processor');

// Import routes
const aiRoutes = require('./routes/ai');
const modelRoutes = require('./routes/models');
const vectorRoutes = require('./routes/vector');
const multimodalRoutes = require('./routes/multimodal');
const realTimeRoutes = require('./routes/real-time');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/models', express.static(path.join(__dirname, 'models')));

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/vector', vectorRoutes);
app.use('/api/multimodal', multimodalRoutes);
app.use('/api/realtime', realTimeRoutes);
app.use('/api/health', healthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Initialize services
async function initializeServices() {
  try {
    logger.info('Initializing Next-Generation AI Models v4.0...');
    
    // Initialize AI Engine
    await aiEngine.initialize();
    logger.info('AI Engine initialized');
    
    // Initialize Model Manager
    await modelManager.initialize();
    logger.info('Model Manager initialized');
    
    // Initialize Vector Store
    await vectorStore.initialize();
    logger.info('Vector Store initialized');
    
    // Initialize Multimodal Processor
    await multimodalProcessor.initialize();
    logger.info('Multimodal Processor initialized');
    
    // Initialize Real-time Processor
    await realTimeProcessor.initialize();
    logger.info('Real-time Processor initialized');
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    logger.info(`Next-Generation AI Models v4.0 server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Documentation: http://localhost:${PORT}/api/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await aiEngine.cleanup();
  await modelManager.cleanup();
  await vectorStore.cleanup();
  await multimodalProcessor.cleanup();
  await realTimeProcessor.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await aiEngine.cleanup();
  await modelManager.cleanup();
  await vectorStore.cleanup();
  await multimodalProcessor.cleanup();
  await realTimeProcessor.cleanup();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = app;
