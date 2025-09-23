const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');

// Import routes
const securityRoutes = require('./routes/security');
const threatRoutes = require('./routes/threats');
const complianceRoutes = require('./routes/compliance');
const vulnerabilityRoutes = require('./routes/vulnerabilities');
const incidentRoutes = require('./routes/incidents');
const monitoringRoutes = require('./routes/monitoring');
const analyticsRoutes = require('./routes/analytics');
const alertsRoutes = require('./routes/alerts');

// Import modules
const securityManager = require('./modules/security-manager');
const threatDetector = require('./modules/threat-detector');
const complianceChecker = require('./modules/compliance-checker');
const vulnerabilityScanner = require('./modules/vulnerability-scanner');
const incidentManager = require('./modules/incident-manager');
const securityMonitor = require('./modules/security-monitor');
const securityAnalytics = require('./modules/security-analytics');

const app = express();
const PORT = process.env.PORT || 3008;

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
    service: 'cloud-security-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/security', securityRoutes);
app.use('/api/threats', threatRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/vulnerabilities', vulnerabilityRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cloud Security Service API',
    version: '1.0.0',
    description: 'Cloud-native security and monitoring for comprehensive security management',
    endpoints: {
      health: '/health',
      security: '/api/security',
      threats: '/api/threats',
      compliance: '/api/compliance',
      vulnerabilities: '/api/vulnerabilities',
      incidents: '/api/incidents',
      monitoring: '/api/monitoring',
      analytics: '/api/analytics',
      alerts: '/api/alerts'
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
    await securityManager.initialize();
    await threatDetector.initialize();
    await complianceChecker.initialize();
    await vulnerabilityScanner.initialize();
    await incidentManager.initialize();
    await securityMonitor.initialize();
    await securityAnalytics.initialize();
    
    logger.info('All security modules initialized successfully');
  } catch (error) {
    logger.error('Error initializing security modules:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await initializeModules();
    
    app.listen(PORT, () => {
      logger.info(`Cloud Security Service running on port ${PORT}`);
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
