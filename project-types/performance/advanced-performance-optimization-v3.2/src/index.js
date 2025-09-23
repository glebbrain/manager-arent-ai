const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./modules/logger');

// Import performance optimization modules
const PerformanceMonitor = require('./modules/performance-monitor');
const CacheManager = require('./modules/cache-manager');
const LoadBalancer = require('./modules/load-balancer');
const ResourceOptimizer = require('./modules/resource-optimizer');
const PerformanceAnalyzer = require('./modules/performance-analyzer');

class AdvancedPerformanceApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.host = process.env.HOST || '0.0.0.0';
    
    // Initialize performance optimization modules
    this.performanceMonitor = new PerformanceMonitor();
    this.cacheManager = new CacheManager();
    this.loadBalancer = new LoadBalancer();
    this.resourceOptimizer = new ResourceOptimizer();
    this.performanceAnalyzer = new PerformanceAnalyzer();
    
    this.isRunning = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Initialize performance modules
      await this.initializeModules();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      logger.info('Advanced Performance Optimization v3.2 initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS middleware
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
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
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Health check endpoints
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '3.2.0'
      });
    });

    this.app.get('/ready', (req, res) => {
      const modules = {
        performanceMonitor: this.performanceMonitor.isRunning,
        cacheManager: this.cacheManager.isRunning,
        loadBalancer: this.loadBalancer.isRunning,
        resourceOptimizer: this.resourceOptimizer.isRunning,
        performanceAnalyzer: this.performanceAnalyzer.isRunning
      };

      const allReady = Object.values(modules).every(status => status);
      
      res.status(allReady ? 200 : 503).json({
        status: allReady ? 'ready' : 'not ready',
        modules,
        timestamp: new Date().toISOString()
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const metrics = {
        performance: this.performanceMonitor.getMetrics(),
        cache: this.cacheManager.getStats(),
        loadBalancer: this.loadBalancer.getStats(),
        resources: this.resourceOptimizer.getResourceStats(),
        analyzer: this.performanceAnalyzer.getPerformanceSummary(),
        system: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime()
        }
      };

      res.json(metrics);
    });

    // Performance Monitoring routes
    this.app.get('/api/performance/metrics', (req, res) => {
      const metrics = this.performanceMonitor.getMetrics();
      res.json(metrics);
    });

    this.app.get('/api/performance/history', (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      const history = this.performanceMonitor.getHistory(limit);
      res.json(history);
    });

    this.app.get('/api/performance/alerts', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      const alerts = this.performanceMonitor.getAlerts(limit);
      res.json(alerts);
    });

    this.app.post('/api/performance/benchmark', async (req, res) => {
      try {
        const options = req.body || {};
        const results = await this.performanceMonitor.runBenchmark(options);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Cache Management routes
    this.app.get('/api/cache/stats', (req, res) => {
      const stats = this.cacheManager.getStats();
      res.json(stats);
    });

    this.app.post('/api/cache/warm', async (req, res) => {
      try {
        const data = req.body;
        const result = await this.cacheManager.warm(data);
        res.json({ success: result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/api/cache/clear', async (req, res) => {
      try {
        const result = await this.cacheManager.clear();
        res.json({ success: result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/cache/keys', (req, res) => {
      const keys = this.cacheManager.getKeys();
      res.json(keys);
    });

    this.app.get('/api/cache/:key', async (req, res) => {
      try {
        const value = await this.cacheManager.get(req.params.key);
        if (value === null) {
          return res.status(404).json({ error: 'Key not found' });
        }
        res.json({ key: req.params.key, value });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/cache/:key', async (req, res) => {
      try {
        const { value, ttl } = req.body;
        const result = await this.cacheManager.set(req.params.key, value, ttl);
        res.json({ success: result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/api/cache/:key', async (req, res) => {
      try {
        const result = await this.cacheManager.delete(req.params.key);
        res.json({ success: result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Load Balancer routes
    this.app.get('/api/loadbalancer/status', (req, res) => {
      const status = this.loadBalancer.getStatus();
      res.json(status);
    });

    this.app.post('/api/loadbalancer/backend', async (req, res) => {
      try {
        const { id, url, options } = req.body;
        const backend = await this.loadBalancer.addBackend(id, url, options);
        res.status(201).json(backend);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.delete('/api/loadbalancer/backend/:id', async (req, res) => {
      try {
        await this.loadBalancer.removeBackend(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/loadbalancer/health', (req, res) => {
      const backends = this.loadBalancer.getAllBackends();
      res.json(backends);
    });

    this.app.post('/api/loadbalancer/forward', async (req, res) => {
      try {
        const { request, clientIP } = req.body;
        const response = await this.loadBalancer.forwardRequest(request, clientIP);
        res.json(response.data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Resource Optimization routes
    this.app.get('/api/resources/status', (req, res) => {
      const status = this.resourceOptimizer.getStatus();
      res.json(status);
    });

    this.app.post('/api/resources/optimize', async (req, res) => {
      try {
        const { type } = req.body;
        if (type === 'cpu') {
          await this.resourceOptimizer.optimizeCPU();
        } else if (type === 'memory') {
          await this.resourceOptimizer.optimizeMemory();
        } else if (type === 'io') {
          await this.resourceOptimizer.optimizeIO();
        } else {
          // Run all optimizations
          await this.resourceOptimizer.performOptimizations();
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/resources/recommendations', (req, res) => {
      const recommendations = this.resourceOptimizer.getOptimizationRecommendations();
      res.json(recommendations);
    });

    this.app.get('/api/resources/history', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      const history = this.resourceOptimizer.getPerformanceHistory(limit);
      res.json(history);
    });

    // Performance Analytics routes
    this.app.get('/api/analytics/summary', (req, res) => {
      const summary = this.performanceAnalyzer.getPerformanceSummary();
      res.json(summary);
    });

    this.app.get('/api/analytics/trends', (req, res) => {
      const trends = this.performanceAnalyzer.getTrends();
      res.json(trends);
    });

    this.app.get('/api/analytics/anomalies', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      const anomalies = this.performanceAnalyzer.getAnomalies(limit);
      res.json(anomalies);
    });

    this.app.get('/api/analytics/predictions', (req, res) => {
      const predictions = this.performanceAnalyzer.getPredictions();
      res.json(predictions);
    });

    this.app.get('/api/analytics/data', (req, res) => {
      const { start, end, interval } = req.query;
      let data;
      
      if (start && end) {
        data = this.performanceAnalyzer.getDataForTimeRange(
          new Date(start),
          new Date(end)
        );
      } else if (interval) {
        data = this.performanceAnalyzer.getAggregatedData(parseInt(interval));
      } else {
        data = this.performanceAnalyzer.getRecentData(100);
      }
      
      res.json(data);
    });

    this.app.get('/api/analytics/export', (req, res) => {
      const format = req.query.format || 'json';
      const data = this.performanceAnalyzer.exportData(format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=performance-data.csv');
        res.send(data);
      } else {
        res.json(data);
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Initialize performance modules
   */
  async initializeModules() {
    const modules = [
      { name: 'Performance Monitor', module: this.performanceMonitor },
      { name: 'Cache Manager', module: this.cacheManager },
      { name: 'Load Balancer', module: this.loadBalancer },
      { name: 'Resource Optimizer', module: this.resourceOptimizer },
      { name: 'Performance Analyzer', module: this.performanceAnalyzer }
    ];

    for (const { name, module } of modules) {
      try {
        await module.start();
        logger.info(`${name} module started`);
      } catch (error) {
        logger.warn(`${name} module failed to start:`, error.message);
      }
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor request performance
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const isError = res.statusCode >= 400;
        
        this.performanceMonitor.recordRequest(responseTime, isError);
        this.performanceAnalyzer.addDataPoint({
          responseTime,
          errorRate: isError ? 1 : 0
        });
      });
      
      next();
    });

    // Monitor system performance
    this.performanceMonitor.on('metricsUpdated', (metrics) => {
      this.performanceAnalyzer.addDataPoint(metrics);
    });
  }

  /**
   * Start the application
   */
  async start() {
    try {
      await this.initialize();
      
      this.server = this.app.listen(this.port, this.host, () => {
        this.isRunning = true;
        logger.info(`Advanced Performance Optimization v3.2 server running on ${this.host}:${this.port}`);
        logger.info('Available endpoints:');
        logger.info('  GET  /health - Health check');
        logger.info('  GET  /ready - Readiness check');
        logger.info('  GET  /metrics - System metrics');
        logger.info('  Performance: /api/performance/*');
        logger.info('  Cache: /api/cache/*');
        logger.info('  Load Balancer: /api/loadbalancer/*');
        logger.info('  Resources: /api/resources/*');
        logger.info('  Analytics: /api/analytics/*');
      });
    } catch (error) {
      logger.error('Failed to start application:', error);
      throw error;
    }
  }

  /**
   * Stop the application
   */
  async stop() {
    try {
      if (this.server) {
        this.server.close();
      }

      // Stop performance modules
      await this.performanceMonitor.stop();
      await this.cacheManager.stop();
      await this.loadBalancer.stop();
      await this.resourceOptimizer.stop();
      await this.performanceAnalyzer.stop();

      this.isRunning = false;
      logger.info('Advanced Performance Optimization v3.2 server stopped');
    } catch (error) {
      logger.error('Error stopping application:', error);
      throw error;
    }
  }
}

// Create and start application
const app = new AdvancedPerformanceApp();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await app.stop();
  process.exit(0);
});

// Start the application
if (require.main === module) {
  app.start().catch(error => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

module.exports = AdvancedPerformanceApp;
