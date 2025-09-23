const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const cluster = require('cluster');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'multi-cloud-support' },
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
const cloudManager = require('./modules/cloud-manager');
const awsProvider = require('./modules/providers/aws-provider');
const azureProvider = require('./modules/providers/azure-provider');
const gcpProvider = require('./modules/providers/gcp-provider');
const deploymentManager = require('./modules/deployment-manager');
const resourceManager = require('./modules/resource-manager');
const costOptimizer = require('./modules/cost-optimizer');
const monitoringManager = require('./modules/monitoring-manager');
const securityManager = require('./modules/security-manager');

// Import routes
const cloudRoutes = require('./routes/cloud');
const awsRoutes = require('./routes/aws');
const azureRoutes = require('./routes/azure');
const gcpRoutes = require('./routes/gcp');
const deploymentRoutes = require('./routes/deployment');
const resourceRoutes = require('./routes/resources');
const costRoutes = require('./routes/cost');
const monitoringRoutes = require('./routes/monitoring');
const securityRoutes = require('./routes/security');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3010;
const numCPUs = os.cpus().length;

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

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Slow down middleware
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 50
});

app.use(speedLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'multi-cloud-support',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('./package.json').version,
    cluster: {
      isMaster: cluster.isMaster,
      workerId: cluster.worker ? cluster.worker.id : 'master'
    }
  });
});

// API routes
app.use('/api/cloud', cloudRoutes);
app.use('/api/aws', awsRoutes);
app.use('/api/azure', azureRoutes);
app.use('/api/gcp', gcpRoutes);
app.use('/api/deployment', deploymentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/cost', costRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/security', securityRoutes);

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
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });
} else {
  app.listen(PORT, () => {
    logger.info(`Multi-Cloud Support service running on port ${PORT} (Worker ${process.pid})`);
  });
}

module.exports = app;
