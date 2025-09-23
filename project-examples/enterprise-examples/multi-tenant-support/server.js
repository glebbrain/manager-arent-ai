const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Import modules
const tenantManager = require('./modules/tenant-manager');
const organizationService = require('./modules/organization-service');
const userManagement = require('./modules/user-management');
const dataIsolation = require('./modules/data-isolation');
const billingService = require('./modules/billing-service');
const securityManager = require('./modules/security-manager');
const auditLogger = require('./modules/audit-logger');

const app = express();
const PORT = process.env.PORT || 3007;

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Tenant context middleware
app.use(async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    if (tenantId) {
      req.tenant = await tenantManager.getTenant(tenantId);
      if (!req.tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
    }
    next();
  } catch (error) {
    logger.error('Tenant context error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Routes
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/audit', require('./routes/audit'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'multi-tenant-support',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', {
    requestId: req.requestId,
    error: error.message,
    stack: error.stack
  });

  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    requestId: req.requestId
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    requestId: req.requestId
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Multi-tenant support service running on port ${PORT}`);
  console.log(`🚀 Multi-tenant Support Service running on port ${PORT}`);
});

module.exports = app;
