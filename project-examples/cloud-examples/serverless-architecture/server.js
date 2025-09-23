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
  defaultMeta: { service: 'serverless-architecture' },
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
const serverlessManager = require('./modules/serverless-manager');
const functionManager = require('./modules/function-manager');
const eventManager = require('./modules/event-manager');
const triggerManager = require('./modules/trigger-manager');
const coldStartOptimizer = require('./modules/cold-start-optimizer');
const performanceMonitor = require('./modules/performance-monitor');
const costAnalyzer = require('./modules/cost-analyzer');
const securityManager = require('./modules/security-manager');

// Import routes
const serverlessRoutes = require('./routes/serverless');
const functionRoutes = require('./routes/functions');
const eventRoutes = require('./routes/events');
const triggerRoutes = require('./routes/triggers');
const performanceRoutes = require('./routes/performance');
const costRoutes = require('./routes/cost');
const securityRoutes = require('./routes/security');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3011;
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
    service: 'serverless-architecture',
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
app.use('/api/serverless', serverlessRoutes);
app.use('/api/functions', functionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/triggers', triggerRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/cost', costRoutes);
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
    logger.info(`Serverless Architecture service running on port ${PORT} (Worker ${process.pid})`);
  });
}

module.exports = app;
