const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./modules/logger');
const EdgeAIProcessor = require('./modules/edge-ai-processor');
const EdgeAnalytics = require('./modules/edge-analytics');
const EdgeSecurity = require('./modules/edge-security');
const EdgeOrchestrator = require('./modules/edge-orchestrator');
const EdgeOptimizer = require('./modules/edge-optimizer');

/**
 * Edge Computing Enhanced v3.1 - Main Application
 * Version: 3.1.0
 * Features:
 * - Edge AI Processing
 * - Edge Analytics
 * - Edge Security
 * - Edge Orchestration
 * - Edge Optimization
 */
class EdgeComputingEnhanced {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3000,
      host: config.host || '0.0.0.0',
      environment: config.environment || 'development',
      logLevel: config.logLevel || 'info',
      
      // Edge AI Processing
      aiProcessing: {
        enabled: config.aiProcessing?.enabled !== false,
        modelPath: config.aiProcessing?.modelPath || './models',
        inferenceTimeout: config.aiProcessing?.inferenceTimeout || 1000,
        batchSize: config.aiProcessing?.batchSize || 1,
        quantization: config.aiProcessing?.quantization !== false
      },
      
      // Edge Analytics
      analytics: {
        enabled: config.analytics?.enabled !== false,
        realTimeProcessing: config.analytics?.realTimeProcessing !== false,
        dataRetention: config.analytics?.dataRetention || 3600,
        compressionEnabled: config.analytics?.compressionEnabled !== false
      },
      
      // Edge Security
      security: {
        enabled: config.security?.enabled !== false,
        zeroTrust: config.security?.zeroTrust !== false,
        encryptionLevel: config.security?.encryptionLevel || 'AES-256',
        deviceAuthentication: config.security?.deviceAuthentication !== false
      },
      
      // Edge Orchestration
      orchestration: {
        enabled: config.orchestration?.enabled !== false,
        loadBalancing: config.orchestration?.loadBalancing || 'round-robin',
        autoScaling: config.orchestration?.autoScaling !== false,
        healthCheckInterval: config.orchestration?.healthCheckInterval || 30000
      },
      
      // Edge Optimization
      optimization: {
        enabled: config.optimization?.enabled !== false,
        optimizationLevel: config.optimization?.optimizationLevel || 'balanced',
        latencyOptimization: config.optimization?.latencyOptimization !== false,
        throughputOptimization: config.optimization?.throughputOptimization !== false,
        resourceOptimization: config.optimization?.resourceOptimization !== false,
        energyOptimization: config.optimization?.energyOptimization !== false,
        costOptimization: config.optimization?.costOptimization !== false
      },
      
      ...config
    };
    
    // Initialize Express app
    this.app = express();
    
    // Initialize modules
    this.modules = {
      aiProcessor: null,
      analytics: null,
      security: null,
      orchestrator: null,
      optimizer: null
    };
    
    // Initialize Express app
    this.initializeExpress();
  }

  /**
   * Initialize Express application
   */
  initializeExpress() {
    try {
      // Security middleware
      this.app.use(helmet());
      this.app.use(cors());
      
      // Compression middleware
      this.app.use(compression());
      
      // Logging middleware
      this.app.use(morgan('combined', {
        stream: { write: message => logger.info(message.trim()) }
      }));
      
      // Body parsing middleware
      this.app.use(express.json({ limit: '10mb' }));
      this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
      
      // Initialize routes
      this.initializeRoutes();
      
      // Error handling middleware
      this.app.use(this.errorHandler.bind(this));
      
      logger.info('Express application initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Express application:', error);
      throw error;
    }
  }

  /**
   * Initialize routes
   */
  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '3.1.0',
        modules: Object.keys(this.modules).filter(key => this.modules[key] !== null)
      });
    });
    
    // Status endpoint
    this.app.get('/status', (req, res) => {
      const status = {
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '3.1.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        modules: {}
      };
      
      // Get module statuses
      for (const [name, module] of Object.entries(this.modules)) {
        if (module && typeof module.getMetrics === 'function') {
          status.modules[name] = module.getMetrics();
        }
      }
      
      res.json(status);
    });
    
    // AI Processing routes
    if (this.config.aiProcessing.enabled) {
      this.app.use('/api/ai', this.createAIRoutes());
    }
    
    // Analytics routes
    if (this.config.analytics.enabled) {
      this.app.use('/api/analytics', this.createAnalyticsRoutes());
    }
    
    // Security routes
    if (this.config.security.enabled) {
      this.app.use('/api/security', this.createSecurityRoutes());
    }
    
    // Orchestration routes
    if (this.config.orchestration.enabled) {
      this.app.use('/api/orchestration', this.createOrchestrationRoutes());
    }
    
    // Optimization routes
    if (this.config.optimization.enabled) {
      this.app.use('/api/optimization', this.createOptimizationRoutes());
    }
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Edge Computing Enhanced v3.1',
        version: '3.1.0',
        description: 'Advanced Edge Computing Platform with AI, Analytics, Security, Orchestration, and Optimization',
        endpoints: {
          health: '/health',
          status: '/status',
          ai: this.config.aiProcessing.enabled ? '/api/ai' : null,
          analytics: this.config.analytics.enabled ? '/api/analytics' : null,
          security: this.config.security.enabled ? '/api/security' : null,
          orchestration: this.config.orchestration.enabled ? '/api/orchestration' : null,
          optimization: this.config.optimization.enabled ? '/api/optimization' : null
        }
      });
    });
  }

  /**
   * Create AI Processing routes
   */
  createAIRoutes() {
    const router = express.Router();
    
    // Initialize AI processor
    router.use((req, res, next) => {
      if (!this.modules.aiProcessor) {
        this.modules.aiProcessor = new EdgeAIProcessor(this.config.aiProcessing);
      }
      next();
    });
    
    // Load model
    router.post('/models/:modelId/load', async (req, res) => {
      try {
        const { modelId } = req.params;
        const modelData = req.body;
        
        const result = await this.modules.aiProcessor.loadModel(modelId, modelData);
        
        res.json({
          success: true,
          message: 'Model loaded successfully',
          data: result
        });
      } catch (error) {
        logger.error('Failed to load model:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Run inference
    router.post('/inference/:modelId', async (req, res) => {
      try {
        const { modelId } = req.params;
        const { inputData, options = {} } = req.body;
        
        const result = await this.modules.aiProcessor.runInference(modelId, inputData, options);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Failed to run inference:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get model info
    router.get('/models/:modelId', (req, res) => {
      try {
        const { modelId } = req.params;
        const info = this.modules.aiProcessor.getModelInfo(modelId);
        
        if (!info) {
          return res.status(404).json({
            success: false,
            error: 'Model not found'
          });
        }
        
        res.json({
          success: true,
          data: info
        });
      } catch (error) {
        logger.error('Failed to get model info:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get all models
    router.get('/models', (req, res) => {
      try {
        const models = this.modules.aiProcessor.getAllModels();
        
        res.json({
          success: true,
          data: models
        });
      } catch (error) {
        logger.error('Failed to get models:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get metrics
    router.get('/metrics', (req, res) => {
      try {
        const metrics = this.modules.aiProcessor.getMetrics();
        
        res.json({
          success: true,
          data: metrics
        });
      } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    return router;
  }

  /**
   * Create Analytics routes
   */
  createAnalyticsRoutes() {
    const router = express.Router();
    
    // Initialize analytics
    router.use((req, res, next) => {
      if (!this.modules.analytics) {
        this.modules.analytics = new EdgeAnalytics(this.config.analytics);
      }
      next();
    });
    
    // Create stream
    router.post('/streams', async (req, res) => {
      try {
        const { streamId, config } = req.body;
        
        const result = await this.modules.analytics.createStream(streamId, config);
        
        res.json({
          success: true,
          message: 'Stream created successfully',
          data: result
        });
      } catch (error) {
        logger.error('Failed to create stream:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Add data point
    router.post('/streams/:streamId/data', async (req, res) => {
      try {
        const { streamId } = req.params;
        const dataPoint = req.body;
        
        await this.modules.analytics.addDataPoint(streamId, dataPoint);
        
        res.json({
          success: true,
          message: 'Data point added successfully'
        });
      } catch (error) {
        logger.error('Failed to add data point:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get analytics results
    router.get('/streams/:streamId/results', (req, res) => {
      try {
        const { streamId } = req.params;
        const { timeRange } = req.query;
        
        let timeRangeObj = null;
        if (timeRange) {
          const [start, end] = timeRange.split(',').map(t => parseInt(t));
          timeRangeObj = { start, end };
        }
        
        const results = this.modules.analytics.getAnalyticsResults(streamId, timeRangeObj);
        
        res.json({
          success: true,
          data: results
        });
      } catch (error) {
        logger.error('Failed to get analytics results:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get stream info
    router.get('/streams/:streamId', (req, res) => {
      try {
        const { streamId } = req.params;
        const info = this.modules.analytics.getStreamInfo(streamId);
        
        if (!info) {
          return res.status(404).json({
            success: false,
            error: 'Stream not found'
          });
        }
        
        res.json({
          success: true,
          data: info
        });
      } catch (error) {
        logger.error('Failed to get stream info:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get all streams
    router.get('/streams', (req, res) => {
      try {
        const streams = this.modules.analytics.getAllStreams();
        
        res.json({
          success: true,
          data: streams
        });
      } catch (error) {
        logger.error('Failed to get streams:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get metrics
    router.get('/metrics', (req, res) => {
      try {
        const metrics = this.modules.analytics.getMetrics();
        
        res.json({
          success: true,
          data: metrics
        });
      } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    return router;
  }

  /**
   * Create Security routes
   */
  createSecurityRoutes() {
    const router = express.Router();
    
    // Initialize security
    router.use((req, res, next) => {
      if (!this.modules.security) {
        this.modules.security = new EdgeSecurity(this.config.security);
      }
      next();
    });
    
    // Register device
    router.post('/devices/register', async (req, res) => {
      try {
        const deviceInfo = req.body;
        
        const result = await this.modules.security.registerDevice(deviceInfo);
        
        res.json({
          success: true,
          message: 'Device registered successfully',
          data: result
        });
      } catch (error) {
        logger.error('Failed to register device:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Authenticate device
    router.post('/devices/:deviceId/authenticate', async (req, res) => {
      try {
        const { deviceId } = req.params;
        const credentials = req.body;
        
        const result = await this.modules.security.authenticateDevice(deviceId, credentials);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Failed to authenticate device:', error);
        res.status(401).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Encrypt data
    router.post('/encrypt', async (req, res) => {
      try {
        const { data, deviceId } = req.body;
        
        const result = await this.modules.security.encryptData(data, deviceId);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Failed to encrypt data:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Decrypt data
    router.post('/decrypt', async (req, res) => {
      try {
        const { encryptedData, deviceId } = req.body;
        
        const result = await this.modules.security.decryptData(encryptedData, deviceId);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Failed to decrypt data:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get device info
    router.get('/devices/:deviceId', (req, res) => {
      try {
        const { deviceId } = req.params;
        const info = this.modules.security.getDeviceInfo(deviceId);
        
        if (!info) {
          return res.status(404).json({
            success: false,
            error: 'Device not found'
          });
        }
        
        res.json({
          success: true,
          data: info
        });
      } catch (error) {
        logger.error('Failed to get device info:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get all devices
    router.get('/devices', (req, res) => {
      try {
        const devices = this.modules.security.getAllDevices();
        
        res.json({
          success: true,
          data: devices
        });
      } catch (error) {
        logger.error('Failed to get devices:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get metrics
    router.get('/metrics', (req, res) => {
      try {
        const metrics = this.modules.security.getMetrics();
        
        res.json({
          success: true,
          data: metrics
        });
      } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    return router;
  }

  /**
   * Create Orchestration routes
   */
  createOrchestrationRoutes() {
    const router = express.Router();
    
    // Initialize orchestrator
    router.use((req, res, next) => {
      if (!this.modules.orchestrator) {
        this.modules.orchestrator = new EdgeOrchestrator(this.config.orchestration);
      }
      next();
    });
    
    // Register node
    router.post('/nodes/register', async (req, res) => {
      try {
        const nodeInfo = req.body;
        
        const result = await this.modules.orchestrator.registerNode(nodeInfo);
        
        res.json({
          success: true,
          message: 'Node registered successfully',
          data: result
        });
      } catch (error) {
        logger.error('Failed to register node:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Register service
    router.post('/services/register', async (req, res) => {
      try {
        const serviceInfo = req.body;
        
        const result = await this.modules.orchestrator.registerService(serviceInfo);
        
        res.json({
          success: true,
          message: 'Service registered successfully',
          data: result
        });
      } catch (error) {
        logger.error('Failed to register service:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Deploy service instance
    router.post('/services/:serviceId/deploy', async (req, res) => {
      try {
        const { serviceId } = req.params;
        const { nodeId, instanceConfig } = req.body;
        
        const result = await this.modules.orchestrator.deployServiceInstance(serviceId, nodeId, instanceConfig);
        
        res.json({
          success: true,
          message: 'Service instance deployed successfully',
          data: result
        });
      } catch (error) {
        logger.error('Failed to deploy service instance:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Distribute workload
    router.post('/workloads/distribute', async (req, res) => {
      try {
        const workload = req.body;
        
        const result = await this.modules.orchestrator.distributeWorkload(workload);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Failed to distribute workload:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get cluster status
    router.get('/cluster/status', (req, res) => {
      try {
        const status = this.modules.orchestrator.getClusterStatus();
        
        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        logger.error('Failed to get cluster status:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get node info
    router.get('/nodes/:nodeId', (req, res) => {
      try {
        const { nodeId } = req.params;
        const info = this.modules.orchestrator.getNodeInfo(nodeId);
        
        if (!info) {
          return res.status(404).json({
            success: false,
            error: 'Node not found'
          });
        }
        
        res.json({
          success: true,
          data: info
        });
      } catch (error) {
        logger.error('Failed to get node info:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get service info
    router.get('/services/:serviceId', (req, res) => {
      try {
        const { serviceId } = req.params;
        const info = this.modules.orchestrator.getServiceInfo(serviceId);
        
        if (!info) {
          return res.status(404).json({
            success: false,
            error: 'Service not found'
          });
        }
        
        res.json({
          success: true,
          data: info
        });
      } catch (error) {
        logger.error('Failed to get service info:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get metrics
    router.get('/metrics', (req, res) => {
      try {
        const metrics = this.modules.orchestrator.getMetrics();
        
        res.json({
          success: true,
          data: metrics
        });
      } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    return router;
  }

  /**
   * Create Optimization routes
   */
  createOptimizationRoutes() {
    const router = express.Router();
    
    // Initialize optimizer
    router.use((req, res, next) => {
      if (!this.modules.optimizer) {
        this.modules.optimizer = new EdgeOptimizer(this.config.optimization);
      }
      next();
    });
    
    // Get optimization status
    router.get('/status', (req, res) => {
      try {
        const status = this.modules.optimizer.getOptimizationStatus();
        
        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        logger.error('Failed to get optimization status:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get metrics
    router.get('/metrics', (req, res) => {
      try {
        const metrics = this.modules.optimizer.getMetrics();
        
        res.json({
          success: true,
          data: metrics
        });
      } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get recommendations
    router.get('/recommendations', (req, res) => {
      try {
        const recommendations = this.modules.optimizer.getRecommendations();
        
        res.json({
          success: true,
          data: recommendations
        });
      } catch (error) {
        logger.error('Failed to get recommendations:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    return router;
  }

  /**
   * Error handler middleware
   */
  errorHandler(error, req, res, next) {
    logger.error('Unhandled error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Initialize modules
      await this.initializeModules();
      
      // Start server
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        logger.info(`Edge Computing Enhanced v3.1 started`, {
          port: this.config.port,
          host: this.config.host,
          environment: this.config.environment,
          modules: Object.keys(this.modules).filter(key => this.modules[key] !== null)
        });
      });
      
      // Handle graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
      
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Initialize modules
   */
  async initializeModules() {
    try {
      // Initialize AI Processor
      if (this.config.aiProcessing.enabled) {
        this.modules.aiProcessor = new EdgeAIProcessor(this.config.aiProcessing);
        logger.info('AI Processor initialized');
      }
      
      // Initialize Analytics
      if (this.config.analytics.enabled) {
        this.modules.analytics = new EdgeAnalytics(this.config.analytics);
        logger.info('Analytics initialized');
      }
      
      // Initialize Security
      if (this.config.security.enabled) {
        this.modules.security = new EdgeSecurity(this.config.security);
        logger.info('Security initialized');
      }
      
      // Initialize Orchestrator
      if (this.config.orchestration.enabled) {
        this.modules.orchestrator = new EdgeOrchestrator(this.config.orchestration);
        logger.info('Orchestrator initialized');
      }
      
      // Initialize Optimizer
      if (this.config.optimization.enabled) {
        this.modules.optimizer = new EdgeOptimizer(this.config.optimization);
        logger.info('Optimizer initialized');
      }
      
    } catch (error) {
      logger.error('Failed to initialize modules:', error);
      throw error;
    }
  }

  /**
   * Shutdown the server
   */
  async shutdown() {
    try {
      logger.info('Shutting down Edge Computing Enhanced v3.1...');
      
      // Dispose modules
      for (const [name, module] of Object.entries(this.modules)) {
        if (module && typeof module.dispose === 'function') {
          await module.dispose();
          logger.info(`${name} disposed`);
        }
      }
      
      // Close server
      if (this.server) {
        this.server.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
      
    } catch (error) {
      logger.error('Failed to shutdown gracefully:', error);
      process.exit(1);
    }
  }
}

// Export the class
module.exports = EdgeComputingEnhanced;

// If this file is run directly, start the server
if (require.main === module) {
  const config = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  };
  
  const app = new EdgeComputingEnhanced(config);
  app.start().catch(error => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}
