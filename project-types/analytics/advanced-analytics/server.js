const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cluster = require('cluster');
const numCPUs = os.cpus().length;

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'advanced-analytics' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Import modules
const analyticsEngine = require('./modules/analytics-engine');
const reportGenerator = require('./modules/report-generator');
const dashboardManager = require('./modules/dashboard-manager');
const kpiCalculator = require('./modules/kpi-calculator');
const dataVisualizer = require('./modules/data-visualizer');
const insightEngine = require('./modules/insight-engine');
const alertManager = require('./modules/alert-manager');
const exportService = require('./modules/export-service');

// Import routes
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboards');
const kpiRoutes = require('./routes/kpis');
const visualizationRoutes = require('./routes/visualizations');
const insightRoutes = require('./routes/insights');
const alertRoutes = require('./routes/alerts');
const exportRoutes = require('./routes/exports');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3007;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
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
    service: 'advanced-analytics',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('./package.json').version
  });
});

// API routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/visualizations', visualizationRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/exports', exportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
if (cluster.isMaster) {
  logger.info(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  app.listen(PORT, () => {
    logger.info(`Advanced Analytics service running on port ${PORT} (Worker ${process.pid})`);
  });
}

module.exports = app;
