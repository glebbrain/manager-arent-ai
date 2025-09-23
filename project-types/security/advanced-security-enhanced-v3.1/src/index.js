const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Import security modules
const ZeroTrustController = require('./modules/zero-trust-controller');
const AIThreatDetection = require('./modules/ai-threat-detection');
const BlockchainIntegration = require('./modules/blockchain-integration');
const HomomorphicEncryption = require('./modules/homomorphic-encryption');
const PrivacyPreservingAnalytics = require('./modules/privacy-preserving-analytics');
const logger = require('./modules/logger');

/**
 * Advanced Security Enhancement v3.1
 * Main application entry point
 */
class AdvancedSecurityApp {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3000,
      host: config.host || '0.0.0.0',
      environment: config.environment || 'development',
      
      // Security Configuration
      security: {
        zeroTrust: config.zeroTrust || {},
        aiThreatDetection: config.aiThreatDetection || {},
        blockchain: config.blockchain || {},
        homomorphicEncryption: config.homomorphicEncryption || {},
        privacyAnalytics: config.privacyAnalytics || {}
      },
      
      // API Configuration
      api: {
        rateLimit: config.rateLimit || 1000,
        timeout: config.timeout || 30000,
        maxRequestSize: config.maxRequestSize || '10mb'
      },
      
      ...config
    };
    
    // Initialize Express app
    this.app = express();
    
    // Initialize security modules
    this.zeroTrust = null;
    this.aiThreatDetection = null;
    this.blockchain = null;
    this.homomorphicEncryption = null;
    this.privacyAnalytics = null;
    
    // Initialize metrics
    this.metrics = {
      startTime: Date.now(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      activeConnections: 0,
      securityIncidents: 0,
      threatsDetected: 0,
      privacyOperations: 0
    };
    
    // Initialize application
    this.initialize();
  }

  /**
   * Initialize application
   */
  async initialize() {
    try {
      // Setup Express middleware
      this.setupMiddleware();
      
      // Initialize security modules
      await this.initializeSecurityModules();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Setup monitoring
      this.setupMonitoring();
      
      logger.info('Advanced Security Enhancement v3.1 initialized', {
        port: this.config.port,
        environment: this.config.environment
      });
      
    } catch (error) {
      logger.error('Failed to initialize Advanced Security Enhancement:', error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
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
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));
    
    // CORS middleware
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    
    // Compression middleware
    this.app.use(compression());
    
    // Logging middleware
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));
    
    // Body parsing middleware
    this.app.use(express.json({ limit: this.config.api.maxRequestSize }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.api.maxRequestSize }));
    
    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = uuidv4();
      req.startTime = Date.now();
      next();
    });
    
    // Security middleware
    this.app.use((req, res, next) => {
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Rate limiting (simple implementation)
      this.handleRateLimiting(req, res, next);
    });
  }

  /**
   * Handle rate limiting
   */
  handleRateLimiting(req, res, next) {
    // Simple rate limiting implementation
    const clientId = req.ip;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = this.config.api.rateLimit;
    
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }
    
    const clientData = this.rateLimitStore.get(clientId) || { count: 0, resetTime: now + windowMs };
    
    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + windowMs;
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    clientData.count++;
    this.rateLimitStore.set(clientId, clientData);
    
    next();
  }

  /**
   * Initialize security modules
   */
  async initializeSecurityModules() {
    try {
      // Initialize Zero-Trust Controller
      this.zeroTrust = new ZeroTrustController(this.config.security.zeroTrust);
      await this.zeroTrust.initialize();
      
      // Initialize AI Threat Detection
      this.aiThreatDetection = new AIThreatDetection(this.config.security.aiThreatDetection);
      await this.aiThreatDetection.initialize();
      
      // Initialize Blockchain Integration
      this.blockchain = new BlockchainIntegration(this.config.security.blockchain);
      await this.blockchain.initialize();
      
      // Initialize Homomorphic Encryption
      this.homomorphicEncryption = new HomomorphicEncryption(this.config.security.homomorphicEncryption);
      await this.homomorphicEncryption.initialize();
      
      // Initialize Privacy-Preserving Analytics
      this.privacyAnalytics = new PrivacyPreservingAnalytics(this.config.security.privacyAnalytics);
      await this.privacyAnalytics.initialize();
      
      logger.info('All security modules initialized');
      
    } catch (error) {
      logger.error('Failed to initialize security modules:', error);
      throw error;
    }
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '3.1.0'
      });
    });
    
    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json({
        ...this.metrics,
        security: {
          zeroTrust: this.zeroTrust ? this.zeroTrust.getMetrics() : null,
          aiThreatDetection: this.aiThreatDetection ? this.aiThreatDetection.getMetrics() : null,
          blockchain: this.blockchain ? this.blockchain.getMetrics() : null,
          homomorphicEncryption: this.homomorphicEncryption ? this.homomorphicEncryption.getMetrics() : null,
          privacyAnalytics: this.privacyAnalytics ? this.privacyAnalytics.getMetrics() : null
        }
      });
    });
    
    // Zero-Trust routes
    this.app.post('/api/zero-trust/register', async (req, res) => {
      try {
        const { identityData } = req.body;
        const result = await this.zeroTrust.registerIdentity(identityData);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/zero-trust/authenticate', async (req, res) => {
      try {
        const { credentials, context } = req.body;
        const result = await this.zeroTrust.authenticateIdentity(credentials, context);
        res.json(result);
      } catch (error) {
        res.status(401).json({ error: error.message });
      }
    });
    
    this.app.post('/api/zero-trust/check-access', async (req, res) => {
      try {
        const { sessionId, resource, action } = req.body;
        const result = await this.zeroTrust.checkAccess(sessionId, resource, action);
        res.json({ allowed: result });
      } catch (error) {
        res.status(403).json({ error: error.message });
      }
    });
    
    // AI Threat Detection routes
    this.app.post('/api/ai-threat/analyze', async (req, res) => {
      try {
        const { data, type } = req.body;
        const result = await this.aiThreatDetection.analyzeThreats(data, type);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.get('/api/ai-threat/threats', (req, res) => {
      const threats = this.aiThreatDetection.getAllThreats();
      res.json(threats);
    });
    
    // Blockchain Integration routes
    this.app.post('/api/blockchain/create-identity', async (req, res) => {
      try {
        const { identityData } = req.body;
        const result = await this.blockchain.createIdentity(identityData);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/blockchain/verify-identity', async (req, res) => {
      try {
        const { identityId, proof } = req.body;
        const result = await this.blockchain.verifyIdentity(identityId, proof);
        res.json({ verified: result });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/blockchain/audit-log', async (req, res) => {
      try {
        const { logData } = req.body;
        const result = await this.blockchain.createAuditLog(logData);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Homomorphic Encryption routes
    this.app.post('/api/homomorphic/encrypt', async (req, res) => {
      try {
        const { data, keyId } = req.body;
        const result = await this.homomorphicEncryption.encryptData(data, keyId);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/homomorphic/decrypt', async (req, res) => {
      try {
        const { encryptionId, keyId } = req.body;
        const result = await this.homomorphicEncryption.decryptData(encryptionId, keyId);
        res.json({ data: result });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/homomorphic/operation', async (req, res) => {
      try {
        const { operation, encryptedData1, encryptedData2, keyId } = req.body;
        const result = await this.homomorphicEncryption.performHomomorphicOperation(operation, encryptedData1, encryptedData2, keyId);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Privacy-Preserving Analytics routes
    this.app.post('/api/privacy/analytics', async (req, res) => {
      try {
        const { data, analyticsType, options } = req.body;
        const result = await this.privacyAnalytics.performAnalytics(data, analyticsType, options);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/privacy/federated-learning', async (req, res) => {
      try {
        const { participants, globalModel, options } = req.body;
        const result = await this.privacyAnalytics.performFederatedLearning(participants, globalModel, options);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/privacy/anonymize', async (req, res) => {
      try {
        const { data, options } = req.body;
        const result = await this.privacyAnalytics.anonymizeData(data, options);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/privacy/pseudonymize', async (req, res) => {
      try {
        const { data, options } = req.body;
        const result = await this.privacyAnalytics.pseudonymizeData(data, options);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        requestId: req.id,
        url: req.url,
        method: req.method
      });
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    });
    
    // Process error handlers
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.shutdown(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason, promise });
      this.shutdown(1);
    });
    
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown(0);
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown(0);
    });
  }

  /**
   * Setup monitoring
   */
  setupMonitoring() {
    // Request monitoring middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const processingTime = Date.now() - startTime;
        
        // Update metrics
        this.metrics.totalRequests++;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.metrics.successfulRequests++;
        } else {
          this.metrics.failedRequests++;
        }
        
        // Update average response time
        const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + processingTime;
        this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
        
        // Log request
        logger.info('Request processed', {
          requestId: req.id,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          processingTime,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      
      next();
    });
    
    // Security event monitoring
    this.setupSecurityEventMonitoring();
  }

  /**
   * Setup security event monitoring
   */
  setupSecurityEventMonitoring() {
    // Zero-Trust events
    if (this.zeroTrust) {
      this.zeroTrust.on('securityIncident', (incident) => {
        this.metrics.securityIncidents++;
        logger.warn('Security incident detected', incident);
      });
    }
    
    // AI Threat Detection events
    if (this.aiThreatDetection) {
      this.aiThreatDetection.on('threatDetected', (threat) => {
        this.metrics.threatsDetected++;
        logger.warn('Threat detected', threat);
      });
    }
    
    // Privacy Analytics events
    if (this.privacyAnalytics) {
      this.privacyAnalytics.on('analyticsPerformed', (data) => {
        this.metrics.privacyOperations++;
        logger.info('Privacy-preserving analytics performed', data);
      });
    }
  }

  /**
   * Start server
   */
  async start() {
    try {
      const server = this.app.listen(this.config.port, this.config.host, () => {
        logger.info('Advanced Security Enhancement v3.1 started', {
          port: this.config.port,
          host: this.config.host,
          environment: this.config.environment,
          pid: process.pid
        });
      });
      
      // Store server reference
      this.server = server;
      
      // Setup graceful shutdown
      this.setupGracefulShutdown(server);
      
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown(server) {
    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        this.dispose().then(() => {
          process.exit(0);
        });
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Shutdown application
   */
  async shutdown(code = 0) {
    try {
      logger.info('Shutting down Advanced Security Enhancement v3.1');
      
      // Close server
      if (this.server) {
        this.server.close();
      }
      
      // Dispose security modules
      await this.dispose();
      
      logger.info('Advanced Security Enhancement v3.1 shutdown complete');
      process.exit(code);
      
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Dispose resources
   */
  async dispose() {
    try {
      // Dispose security modules
      if (this.zeroTrust) {
        await this.zeroTrust.dispose();
      }
      
      if (this.aiThreatDetection) {
        await this.aiThreatDetection.dispose();
      }
      
      if (this.blockchain) {
        await this.blockchain.dispose();
      }
      
      if (this.homomorphicEncryption) {
        await this.homomorphicEncryption.dispose();
      }
      
      if (this.privacyAnalytics) {
        await this.privacyAnalytics.dispose();
      }
      
      logger.info('All resources disposed');
      
    } catch (error) {
      logger.error('Error disposing resources:', error);
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = AdvancedSecurityApp;

// Start application if run directly
if (require.main === module) {
  const app = new AdvancedSecurityApp({
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    
    security: {
      zeroTrust: {
        enabled: process.env.ZERO_TRUST_ENABLED !== 'false',
        identityProvider: process.env.IDENTITY_PROVIDER || 'oidc',
        accessPolicy: process.env.ACCESS_POLICY || 'dynamic',
        monitoringInterval: parseInt(process.env.MONITORING_INTERVAL) || 5000,
        riskThreshold: parseFloat(process.env.RISK_THRESHOLD) || 0.7
      },
      
      aiThreatDetection: {
        enabled: process.env.AI_THREAT_DETECTION_ENABLED !== 'false',
        modelPath: process.env.MODEL_PATH || './models/threat-detection',
        confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.8,
        responseMode: process.env.RESPONSE_MODE || 'automatic',
        learningEnabled: process.env.LEARNING_ENABLED !== 'false'
      },
      
      blockchain: {
        enabled: process.env.BLOCKCHAIN_ENABLED !== 'false',
        network: process.env.BLOCKCHAIN_NETWORK || 'ethereum',
        rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
        contractAddress: process.env.CONTRACT_ADDRESS || null,
        privateKey: process.env.PRIVATE_KEY || null
      },
      
      homomorphicEncryption: {
        enabled: process.env.HOMOMORPHIC_ENCRYPTION_ENABLED !== 'false',
        scheme: process.env.ENCRYPTION_SCHEME || 'paillier',
        keySize: parseInt(process.env.KEY_SIZE) || 2048,
        securityLevel: parseInt(process.env.SECURITY_LEVEL) || 128
      },
      
      privacyAnalytics: {
        enabled: process.env.PRIVACY_ANALYTICS_ENABLED !== 'false',
        differentialPrivacy: process.env.DIFFERENTIAL_PRIVACY_ENABLED !== 'false',
        federatedLearning: process.env.FEDERATED_LEARNING_ENABLED !== 'false',
        epsilon: parseFloat(process.env.EPSILON) || 1.0,
        delta: parseFloat(process.env.DELTA) || 1e-5,
        privacyBudget: parseFloat(process.env.PRIVACY_BUDGET) || 10.0
      }
    }
  });
  
  app.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}
