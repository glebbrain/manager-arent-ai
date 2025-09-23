const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./modules/logger');

// Import integration modules
const IoTIntegration = require('./modules/iot-integration');
const FiveGIntegration = require('./modules/5g-integration');
const ARVRIntegration = require('./modules/arvr-integration');
const BlockchainIntegration = require('./modules/blockchain-integration');
const QuantumIntegration = require('./modules/quantum-integration');

class AdvancedIntegrationApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.host = process.env.HOST || '0.0.0.0';
    
    // Initialize integration modules
    this.iot = new IoTIntegration();
    this.fiveG = new FiveGIntegration();
    this.arvr = new ARVRIntegration();
    this.blockchain = new BlockchainIntegration();
    this.quantum = new QuantumIntegration();
    
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
      
      // Initialize integration modules
      await this.initializeModules();
      
      logger.info('Advanced Integration Enhanced v3.1 initialized successfully');
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
        version: '3.1.0'
      });
    });

    this.app.get('/ready', (req, res) => {
      const modules = {
        iot: this.iot.isRunning,
        fiveG: this.fiveG.isRunning,
        arvr: this.arvr.isRunning,
        blockchain: this.blockchain.isRunning,
        quantum: this.quantum.isRunning
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
        iot: this.iot.getStatus(),
        fiveG: this.fiveG.getStatus(),
        arvr: this.arvr.getStatus(),
        blockchain: this.blockchain.getStatus(),
        quantum: this.quantum.getStatus(),
        system: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime()
        }
      };

      res.json(metrics);
    });

    // IoT Integration routes
    this.app.post('/api/iot/devices', async (req, res) => {
      try {
        const device = await this.iot.registerDevice(req.body);
        res.status(201).json(device);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/iot/devices', (req, res) => {
      const devices = this.iot.getAllDevices();
      res.json(devices);
    });

    this.app.get('/api/iot/devices/:id', (req, res) => {
      const device = this.iot.getDevice(req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      res.json(device);
    });

    this.app.put('/api/iot/devices/:id', async (req, res) => {
      try {
        const device = await this.iot.updateDevice(req.params.id, req.body);
        res.json(device);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.delete('/api/iot/devices/:id', async (req, res) => {
      try {
        await this.iot.removeDevice(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.post('/api/iot/devices/:id/data', async (req, res) => {
      try {
        const result = await this.iot.sendData(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/iot/devices/:id/data', async (req, res) => {
      try {
        const data = await this.iot.getDeviceData(req.params.id, req.query);
        res.json(data);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // 5G Integration routes
    this.app.get('/api/5g/network/status', async (req, res) => {
      try {
        const status = await this.fiveG.getNetworkStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/5g/network/slice', async (req, res) => {
      try {
        const slice = await this.fiveG.createNetworkSlice(req.body);
        res.status(201).json(slice);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/5g/network/slice/:id', (req, res) => {
      const slice = this.fiveG.getNetworkSlice(req.params.id);
      if (!slice) {
        return res.status(404).json({ error: 'Network slice not found' });
      }
      res.json(slice);
    });

    this.app.put('/api/5g/network/slice/:id', async (req, res) => {
      try {
        const slice = await this.fiveG.updateNetworkSlice(req.params.id, req.body);
        res.json(slice);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.delete('/api/5g/network/slice/:id', async (req, res) => {
      try {
        await this.fiveG.deleteNetworkSlice(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/5g/network/qos', (req, res) => {
      const metrics = this.fiveG.getQoSMetrics();
      res.json(metrics);
    });

    // AR/VR Integration routes
    this.app.post('/api/arvr/experiences', async (req, res) => {
      try {
        const experience = await this.arvr.createExperience(req.body);
        res.status(201).json(experience);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/arvr/experiences', (req, res) => {
      const experiences = this.arvr.getAllExperiences();
      res.json(experiences);
    });

    this.app.get('/api/arvr/experiences/:id', (req, res) => {
      const experience = this.arvr.getExperience(req.params.id);
      if (!experience) {
        return res.status(404).json({ error: 'Experience not found' });
      }
      res.json(experience);
    });

    this.app.put('/api/arvr/experiences/:id', async (req, res) => {
      try {
        const experience = await this.arvr.updateExperience(req.params.id, req.body);
        res.json(experience);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.delete('/api/arvr/experiences/:id', async (req, res) => {
      try {
        await this.arvr.deleteExperience(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.post('/api/arvr/experiences/:id/launch', async (req, res) => {
      try {
        const session = await this.arvr.launchExperience(req.params.id, req.body);
        res.status(201).json(session);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Blockchain Integration routes
    this.app.post('/api/blockchain/contracts', async (req, res) => {
      try {
        const contract = await this.blockchain.deployContract(req.body);
        res.status(201).json(contract);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/blockchain/contracts', (req, res) => {
      const contracts = this.blockchain.getAllContracts();
      res.json(contracts);
    });

    this.app.post('/api/blockchain/contracts/:id/execute', async (req, res) => {
      try {
        const result = await this.blockchain.executeMethod(
          req.params.id,
          req.body.method,
          req.body.args || [],
          req.body.options || {}
        );
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/blockchain/transactions', (req, res) => {
      const transactions = this.blockchain.getAllTransactions();
      res.json(transactions);
    });

    this.app.get('/api/blockchain/transactions/:id', (req, res) => {
      const transaction = this.blockchain.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json(transaction);
    });

    // Quantum Integration routes
    this.app.post('/api/quantum/circuits', async (req, res) => {
      try {
        const circuit = await this.quantum.createCircuit(req.body);
        res.status(201).json(circuit);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/quantum/circuits', (req, res) => {
      const circuits = this.quantum.getAllCircuits();
      res.json(circuits);
    });

    this.app.post('/api/quantum/circuits/:id/execute', async (req, res) => {
      try {
        const result = await this.quantum.executeCircuit(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/quantum/circuits/:id/results', (req, res) => {
      const results = this.quantum.getResults(req.params.id);
      if (!results) {
        return res.status(404).json({ error: 'Results not found' });
      }
      res.json(results);
    });

    this.app.post('/api/quantum/algorithms', async (req, res) => {
      try {
        const result = await this.quantum.runAlgorithm(
          req.body.algorithmId,
          req.body.input || {},
          req.body.options || {}
        );
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Statistics endpoints
    this.app.get('/api/statistics', (req, res) => {
      const statistics = {
        iot: this.iot.getDeviceStatistics(),
        fiveG: this.fiveG.getNetworkStatistics(),
        arvr: this.arvr.getStatistics(),
        blockchain: this.blockchain.getStatistics(),
        quantum: this.quantum.getStatistics()
      };
      res.json(statistics);
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
   * Initialize integration modules
   */
  async initializeModules() {
    const modules = [
      { name: 'IoT', module: this.iot },
      { name: '5G', module: this.fiveG },
      { name: 'AR/VR', module: this.arvr },
      { name: 'Blockchain', module: this.blockchain },
      { name: 'Quantum', module: this.quantum }
    ];

    for (const { name, module } of modules) {
      try {
        await module.start();
        logger.info(`${name} integration module started`);
      } catch (error) {
        logger.warn(`${name} integration module failed to start:`, error.message);
      }
    }
  }

  /**
   * Start the application
   */
  async start() {
    try {
      await this.initialize();
      
      this.server = this.app.listen(this.port, this.host, () => {
        this.isRunning = true;
        logger.info(`Advanced Integration Enhanced v3.1 server running on ${this.host}:${this.port}`);
        logger.info('Available endpoints:');
        logger.info('  GET  /health - Health check');
        logger.info('  GET  /ready - Readiness check');
        logger.info('  GET  /metrics - System metrics');
        logger.info('  GET  /api/statistics - Integration statistics');
        logger.info('  IoT: /api/iot/*');
        logger.info('  5G:  /api/5g/*');
        logger.info('  AR/VR: /api/arvr/*');
        logger.info('  Blockchain: /api/blockchain/*');
        logger.info('  Quantum: /api/quantum/*');
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

      // Stop integration modules
      await this.iot.stop();
      await this.fiveG.stop();
      await this.arvr.stop();
      await this.blockchain.stop();
      await this.quantum.stop();

      this.isRunning = false;
      logger.info('Advanced Integration Enhanced v3.1 server stopped');
    } catch (error) {
      logger.error('Error stopping application:', error);
      throw error;
    }
  }
}

// Create and start application
const app = new AdvancedIntegrationApp();

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

module.exports = AdvancedIntegrationApp;
