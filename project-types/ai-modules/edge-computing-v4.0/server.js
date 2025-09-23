const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import modules
const logger = require('./modules/logger');
const edgeManager = require('./modules/edge-manager');
const deviceManager = require('./modules/device-manager');
const taskScheduler = require('./modules/task-scheduler');
const resourceManager = require('./modules/resource-manager');
const networkManager = require('./modules/network-manager');
const dataManager = require('./modules/data-manager');
const securityManager = require('./modules/security-manager');

// Import routes
const edgeRoutes = require('./routes/edge');
const deviceRoutes = require('./routes/device');
const taskRoutes = require('./routes/task');
const resourceRoutes = require('./routes/resource');
const networkRoutes = require('./routes/network');
const dataRoutes = require('./routes/data');
const securityRoutes = require('./routes/security');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/cache', express.static(path.join(__dirname, 'cache')));

// Routes
app.use('/api/edge', edgeRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/resource', resourceRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/security', securityRoutes);
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
    logger.info('Initializing Edge Computing v4.0...');
    
    // Initialize Edge Manager
    await edgeManager.initialize();
    logger.info('Edge Manager initialized');
    
    // Initialize Device Manager
    await deviceManager.initialize();
    logger.info('Device Manager initialized');
    
    // Initialize Task Scheduler
    await taskScheduler.initialize();
    logger.info('Task Scheduler initialized');
    
    // Initialize Resource Manager
    await resourceManager.initialize();
    logger.info('Resource Manager initialized');
    
    // Initialize Network Manager
    await networkManager.initialize();
    logger.info('Network Manager initialized');
    
    // Initialize Data Manager
    await dataManager.initialize();
    logger.info('Data Manager initialized');
    
    // Initialize Security Manager
    await securityManager.initialize();
    logger.info('Security Manager initialized');
    
    logger.info('All edge computing services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize edge computing services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    logger.info(`Edge Computing v4.0 server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Documentation: http://localhost:${PORT}/api/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await edgeManager.cleanup();
  await deviceManager.cleanup();
  await taskScheduler.cleanup();
  await resourceManager.cleanup();
  await networkManager.cleanup();
  await dataManager.cleanup();
  await securityManager.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await edgeManager.cleanup();
  await deviceManager.cleanup();
  await taskScheduler.cleanup();
  await resourceManager.cleanup();
  await networkManager.cleanup();
  await dataManager.cleanup();
  await securityManager.cleanup();
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
