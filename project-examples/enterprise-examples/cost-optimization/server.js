const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');

// Import routes
const costRoutes = require('./routes/cost');
const budgetRoutes = require('./routes/budget');
const optimizationRoutes = require('./routes/optimization');
const analyticsRoutes = require('./routes/analytics');
const recommendationsRoutes = require('./routes/recommendations');
const alertsRoutes = require('./routes/alerts');
const reportsRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');

// Import modules
const costAnalyzer = require('./modules/cost-analyzer');
const budgetManager = require('./modules/budget-manager');
const optimizationEngine = require('./modules/optimization-engine');
const aiOptimizer = require('./modules/ai-optimizer');
const alertManager = require('./modules/alert-manager');
const reportGenerator = require('./modules/report-generator');

const app = express();
const PORT = process.env.PORT || 3007;

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cost-optimization-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/cost', costRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/optimization', optimizationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cost Optimization Service API',
    version: '1.0.0',
    description: 'AI-powered cost optimization and management for cloud resources',
    endpoints: {
      health: '/health',
      cost: '/api/cost',
      budget: '/api/budget',
      optimization: '/api/optimization',
      analytics: '/api/analytics',
      recommendations: '/api/recommendations',
      alerts: '/api/alerts',
      reports: '/api/reports',
      ai: '/api/ai'
    },
    documentation: '/api/docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Initialize modules
async function initializeModules() {
  try {
    await costAnalyzer.initialize();
    await budgetManager.initialize();
    await optimizationEngine.initialize();
    await aiOptimizer.initialize();
    await alertManager.initialize();
    await reportGenerator.initialize();
    
    logger.info('All modules initialized successfully');
  } catch (error) {
    logger.error('Error initializing modules:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await initializeModules();
    
    app.listen(PORT, () => {
      logger.info(`Cost Optimization Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API documentation: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
