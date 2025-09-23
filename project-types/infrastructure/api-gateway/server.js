const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    new winston.transports.File({ filename: 'logs/api-gateway.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.4.0'
  });
});

// Service discovery and routing
const services = {
  'project-manager': 'http://project-manager:3000',
  'ai-planner': 'http://ai-planner:3000',
  'workflow-orchestrator': 'http://workflow-orchestrator:3000',
  'smart-notifications': 'http://smart-notifications:3000',
  'template-generator': 'http://template-generator:3000',
  'consistency-manager': 'http://consistency-manager:3000',
  'api-versioning': 'http://api-versioning:3008',
  'deadline-prediction': 'http://deadline-prediction:3009',
  'task-distribution': 'http://task-distribution:3010'
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// API routes with authentication
app.use('/api/v1/projects', authenticateToken, createProxyMiddleware({
  target: services['project-manager'],
  changeOrigin: true,
  pathRewrite: { '^/api/v1/projects': '/api/projects' }
}));

app.use('/api/v1/ai', authenticateToken, createProxyMiddleware({
  target: services['ai-planner'],
  changeOrigin: true,
  pathRewrite: { '^/api/v1/ai': '/api/ai' }
}));

app.use('/api/v1/workflows', authenticateToken, createProxyMiddleware({
  target: services['workflow-orchestrator'],
  changeOrigin: true,
  pathRewrite: { '^/api/v1/workflows': '/api/workflows' }
}));

app.use('/api/v1/notifications', authenticateToken, createProxyMiddleware({
  target: services['smart-notifications'],
  changeOrigin: true,
  pathRewrite: { '^/api/v1/notifications': '/api/notifications' }
}));

app.use('/api/v1/templates', authenticateToken, createProxyMiddleware({
  target: services['template-generator'],
  changeOrigin: true,
  pathRewrite: { '^/api/v1/templates': '/api/templates' }
}));

app.use('/api/v1/consistency', authenticateToken, createProxyMiddleware({
  target: services['consistency-manager'],
  changeOrigin: true,
  pathRewrite: { '^/api/v1/consistency': '/api/consistency' }
}));

app.use('/api/v1/versioning', createProxyMiddleware({
  target: services['api-versioning'],
  changeOrigin: true,
  pathRewrite: { '^/api/v1/versioning': '/api/versioning' }
}));

app.use('/api/v1/predictions', authenticateToken, createProxyMiddleware({
  target: services['deadline-prediction'],
  changeOrigin: true,
  pathRewrite: { '^/api/v1/predictions': '/api/predictions' }
}));

app.use('/api/v1/distribution', authenticateToken, createProxyMiddleware({
  target: services['task-distribution'],
  changeOrigin: true,
  pathRewrite: { '^/api/v1/distribution': '/api/distribution' }
}));

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const schema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // In a real application, you would validate against a database
    // For now, using a simple hardcoded user
    const validUser = {
      username: 'admin',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // password
    };

    const isValidPassword = await bcrypt.compare(value.password, validUser.password);
    if (value.username !== validUser.username || !isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username: value.username, id: 1 },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { username: value.username, id: 1 } });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('API Gateway Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
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
