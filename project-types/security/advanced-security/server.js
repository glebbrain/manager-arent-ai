const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const Redis = require('redis');

// Import security modules
const authManager = require('./modules/auth-manager');
const encryptionService = require('./modules/encryption-service');
const mfaService = require('./modules/mfa-service');
const ssoService = require('./modules/sso-service');
const threatDetection = require('./modules/threat-detection');
const complianceManager = require('./modules/compliance-manager');
const securityAuditor = require('./modules/security-auditor');
const vulnerabilityScanner = require('./modules/vulnerability-scanner');

const app = express();
const PORT = process.env.PORT || 3008;

// Configure Redis for session storage
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.connect();

// Security middleware stack
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Slow down after rate limit
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 50
});

app.use(limiter);
app.use(speedLimiter);

// Body parsing middleware with security
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for signature verification
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Session configuration
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  const requestId = require('crypto').randomUUID();
  req.requestId = requestId;
  
  // Log security-relevant requests
  if (req.path.includes('/auth') || req.path.includes('/security')) {
    console.log(`[SECURITY] ${req.method} ${req.path} - ${req.ip} - ${req.get('User-Agent')}`);
  }
  
  next();
});

// Security context middleware
app.use(async (req, res, next) => {
  try {
    // Initialize security context
    req.securityContext = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tenantId: req.headers['x-tenant-id'],
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    };

    // Check for suspicious patterns
    await threatDetection.analyzeRequest(req);

    next();
  } catch (error) {
    console.error('Security context error:', error);
    res.status(500).json({ error: 'Security check failed' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/security', require('./routes/security'));
app.use('/api/mfa', require('./routes/mfa'));
app.use('/api/sso', require('./routes/sso'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/vulnerability', require('./routes/vulnerability'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'advanced-security',
    version: '1.0.0',
    security: {
      encryption: 'AES-256-GCM',
      hashing: 'Argon2id',
      mfa: 'TOTP/SMS',
      sso: 'SAML/OAuth2'
    }
  });
});

// Security headers endpoint
app.get('/security/headers', (req, res) => {
  res.json({
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Security error:', {
    requestId: req.requestId,
    error: error.message,
    stack: error.stack,
    securityContext: req.securityContext
  });

  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(error.status || 500).json({
    error: message,
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
  console.log('SIGTERM received, shutting down gracefully');
  redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  redisClient.quit();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🔒 Advanced Security Service running on port ${PORT}`);
  console.log(`🛡️  Security features: MFA, SSO, Encryption, Threat Detection`);
  console.log(`📊 Compliance: GDPR, HIPAA, SOX, SOC2`);
});

module.exports = app;
