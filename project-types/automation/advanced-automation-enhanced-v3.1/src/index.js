const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Import automation modules
const SelfHealingController = require('./modules/self-healing-controller');
const PredictiveMaintenance = require('./modules/predictive-maintenance');
const AutonomousOperations = require('./modules/autonomous-operations');
const IntelligentWorkflows = require('./modules/intelligent-workflows');
const AdaptiveAutomation = require('./modules/adaptive-automation');
const logger = require('./modules/logger');

/**
 * Advanced Automation Enhancement v3.1
 * Main application entry point
 */
class AdvancedAutomationApp {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3000,
      host: config.host || '0.0.0.0',
      environment: config.environment || 'development',
      
      // Automation Configuration
      automation: {
        selfHealing: config.selfHealing || {},
        predictiveMaintenance: config.predictiveMaintenance || {},
        autonomousOperations: config.autonomousOperations || {},
        intelligentWorkflows: config.intelligentWorkflows || {},
        adaptiveAutomation: config.adaptiveAutomation || {}
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
    
    // Initialize automation modules
    this.selfHealing = null;
    this.predictiveMaintenance = null;
    this.autonomousOperations = null;
    this.intelligentWorkflows = null;
    this.adaptiveAutomation = null;
    
    // Initialize metrics
    this.metrics = {
      startTime: Date.now(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      activeConnections: 0,
      automationEvents: 0,
      adaptations: 0,
      optimizations: 0
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
      
      // Initialize automation modules
      await this.initializeAutomationModules();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Setup monitoring
      this.setupMonitoring();
      
      logger.info('Advanced Automation Enhancement v3.1 initialized', {
        port: this.config.port,
        environment: this.config.environment
      });
      
    } catch (error) {
      logger.error('Failed to initialize Advanced Automation Enhancement:', error);
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
   * Initialize automation modules
   */
  async initializeAutomationModules() {
    try {
      // Initialize Self-Healing Controller
      this.selfHealing = new SelfHealingController(this.config.automation.selfHealing);
      await this.selfHealing.initialize();
      
      // Initialize Predictive Maintenance
      this.predictiveMaintenance = new PredictiveMaintenance(this.config.automation.predictiveMaintenance);
      await this.predictiveMaintenance.initialize();
      
      // Initialize Autonomous Operations
      this.autonomousOperations = new AutonomousOperations(this.config.automation.autonomousOperations);
      await this.autonomousOperations.initialize();
      
      // Initialize Intelligent Workflows
      this.intelligentWorkflows = new IntelligentWorkflows(this.config.automation.intelligentWorkflows);
      await this.intelligentWorkflows.initialize();
      
      // Initialize Adaptive Automation
      this.adaptiveAutomation = new AdaptiveAutomation(this.config.automation.adaptiveAutomation);
      await this.adaptiveAutomation.initialize();
      
      logger.info('All automation modules initialized');
      
    } catch (error) {
      logger.error('Failed to initialize automation modules:', error);
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
        automation: {
          selfHealing: this.selfHealing ? this.selfHealing.getMetrics() : null,
          predictiveMaintenance: this.predictiveMaintenance ? this.predictiveMaintenance.getMetrics() : null,
          autonomousOperations: this.autonomousOperations ? this.autonomousOperations.getMetrics() : null,
          intelligentWorkflows: this.intelligentWorkflows ? this.intelligentWorkflows.getMetrics() : null,
          adaptiveAutomation: this.adaptiveAutomation ? this.adaptiveAutomation.getMetrics() : null
        }
      });
    });
    
    // Self-Healing routes
    this.app.get('/api/self-healing/health', async (req, res) => {
      try {
        const health = await this.selfHealing.checkHealth();
        res.json(health);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/self-healing/configure-scaling', async (req, res) => {
      try {
        const { rules } = req.body;
        await this.selfHealing.configureAutoScaling(rules);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Predictive Maintenance routes
    this.app.post('/api/predictive-maintenance/register-asset', async (req, res) => {
      try {
        const { assetData } = req.body;
        const result = await this.predictiveMaintenance.registerAsset(assetData);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/predictive-maintenance/predict', async (req, res) => {
      try {
        const { assetId, options } = req.body;
        const result = await this.predictiveMaintenance.predictMaintenance(assetId, options);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.get('/api/predictive-maintenance/report/:assetId', async (req, res) => {
      try {
        const { assetId } = req.params;
        const { timeRange } = req.query;
        const report = await this.predictiveMaintenance.generateMaintenanceReport(assetId, timeRange ? JSON.parse(timeRange) : null);
        res.json(report);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Autonomous Operations routes
    this.app.get('/api/autonomous/operations', (req, res) => {
      const operations = this.autonomousOperations.getOperationHistory(100);
      res.json(operations);
    });
    
    this.app.get('/api/autonomous/decisions', (req, res) => {
      const decisions = this.autonomousOperations.getDecisionHistory(100);
      res.json(decisions);
    });
    
    // Intelligent Workflows routes
    this.app.post('/api/workflows/create', async (req, res) => {
      try {
        const { workflowData } = req.body;
        const result = await this.intelligentWorkflows.createWorkflow(workflowData);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    this.app.post('/api/workflows/execute', async (req, res) => {
      try {
        const { workflowId, context } = req.body;
        const result = await this.intelligentWorkflows.executeWorkflow(workflowId, context);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Adaptive Automation routes
    this.app.get('/api/adaptive/adaptations', (req, res) => {
      const adaptations = this.adaptiveAutomation.getAdaptationHistory(100);
      res.json(adaptations);
    });
    
    this.app.get('/api/adaptive/context/:type', (req, res) => {
      const { type } = req.params;
      const { limit } = req.query;
      const context = this.adaptiveAutomation.getContextHistory(type, parseInt(limit) || 100);
      res.json(context);
    });
    
    this.app.get('/api/adaptive/evolution', (req, res) => {
      const evolution = this.adaptiveAutomation.getEvolutionHistory(100);
      res.json(evolution);
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
    
    // Automation event monitoring
    this.setupAutomationEventMonitoring();
  }

  /**
   * Setup automation event monitoring
   */
  setupAutomationEventMonitoring() {
    // Self-Healing events
    if (this.selfHealing) {
      this.selfHealing.on('issueDetected', (issue) => {
        this.metrics.automationEvents++;
        logger.warn('Self-healing issue detected', issue);
      });
      
      this.selfHealing.on('recoveryAttempted', (recovery) => {
        this.metrics.automationEvents++;
        logger.info('Self-healing recovery attempted', recovery);
      });
    }
    
    // Predictive Maintenance events
    if (this.predictiveMaintenance) {
      this.predictiveMaintenance.on('maintenancePredicted', (prediction) => {
        this.metrics.automationEvents++;
        logger.info('Maintenance predicted', prediction);
      });
      
      this.predictiveMaintenance.on('maintenanceScheduled', (schedule) => {
        this.metrics.automationEvents++;
        logger.info('Maintenance scheduled', schedule);
      });
    }
    
    // Autonomous Operations events
    if (this.autonomousOperations) {
      this.autonomousOperations.on('decisionMade', (decision) => {
        this.metrics.automationEvents++;
        logger.info('Autonomous decision made', decision);
      });
      
      this.autonomousOperations.on('operationExecuted', (operation) => {
        this.metrics.automationEvents++;
        logger.info('Autonomous operation executed', operation);
      });
    }
    
    // Intelligent Workflows events
    if (this.intelligentWorkflows) {
      this.intelligentWorkflows.on('workflowOptimized', (data) => {
        this.metrics.optimizations++;
        logger.info('Workflow optimized', data);
      });
    }
    
    // Adaptive Automation events
    if (this.adaptiveAutomation) {
      this.adaptiveAutomation.on('adaptationPerformed', (adaptation) => {
        this.metrics.adaptations++;
        logger.info('Adaptation performed', adaptation);
      });
      
      this.adaptiveAutomation.on('evolutionCompleted', (evolution) => {
        this.metrics.automationEvents++;
        logger.info('Evolution completed', evolution);
      });
    }
  }

  /**
   * Start server
   */
  async start() {
    try {
      const server = this.app.listen(this.config.port, this.config.host, () => {
        logger.info('Advanced Automation Enhancement v3.1 started', {
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
      logger.info('Shutting down Advanced Automation Enhancement v3.1');
      
      // Close server
      if (this.server) {
        this.server.close();
      }
      
      // Dispose automation modules
      await this.dispose();
      
      logger.info('Advanced Automation Enhancement v3.1 shutdown complete');
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
      // Dispose automation modules
      if (this.selfHealing) {
        await this.selfHealing.dispose();
      }
      
      if (this.predictiveMaintenance) {
        await this.predictiveMaintenance.dispose();
      }
      
      if (this.autonomousOperations) {
        await this.autonomousOperations.dispose();
      }
      
      if (this.intelligentWorkflows) {
        await this.intelligentWorkflows.dispose();
      }
      
      if (this.adaptiveAutomation) {
        await this.adaptiveAutomation.dispose();
      }
      
      logger.info('All resources disposed');
      
    } catch (error) {
      logger.error('Error disposing resources:', error);
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = AdvancedAutomationApp;

// Start application if run directly
if (require.main === module) {
  const app = new AdvancedAutomationApp({
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    
    automation: {
      selfHealing: {
        enabled: process.env.SELF_HEALING_ENABLED !== 'false',
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 5000,
        autoRecovery: process.env.AUTO_RECOVERY_ENABLED !== 'false',
        autoScaling: process.env.AUTO_SCALING_ENABLED !== 'false'
      },
      
      predictiveMaintenance: {
        enabled: process.env.PREDICTIVE_MAINTENANCE_ENABLED !== 'false',
        modelPath: process.env.MODEL_PATH || './models/maintenance',
        predictionInterval: parseInt(process.env.PREDICTION_INTERVAL) || 3600000,
        maintenanceThreshold: parseFloat(process.env.MAINTENANCE_THRESHOLD) || 0.8
      },
      
      autonomousOperations: {
        enabled: process.env.AUTONOMOUS_OPERATIONS_ENABLED !== 'false',
        decisionEngine: process.env.DECISION_ENGINE || 'ai',
        resourceManagement: process.env.RESOURCE_MANAGEMENT_ENABLED !== 'false',
        learningEnabled: process.env.LEARNING_ENABLED !== 'false'
      },
      
      intelligentWorkflows: {
        enabled: process.env.INTELLIGENT_WORKFLOWS_ENABLED !== 'false',
        optimizationEnabled: process.env.OPTIMIZATION_ENABLED !== 'false',
        dynamicAdjustment: process.env.DYNAMIC_ADJUSTMENT_ENABLED !== 'false',
        orchestration: process.env.ORCHESTRATION_ENABLED !== 'false'
      },
      
      adaptiveAutomation: {
        enabled: process.env.ADAPTIVE_AUTOMATION_ENABLED !== 'false',
        environmentAdaptation: process.env.ENVIRONMENT_ADAPTATION_ENABLED !== 'false',
        learningCapabilities: process.env.LEARNING_CAPABILITIES_ENABLED !== 'false',
        flexibleConfiguration: process.env.FLEXIBLE_CONFIGURATION_ENABLED !== 'false'
      }
    }
  });
  
  app.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}
