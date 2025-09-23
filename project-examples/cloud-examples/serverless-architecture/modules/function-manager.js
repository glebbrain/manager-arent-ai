const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class FunctionManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/function-manager.log' })
      ]
    });
    
    this.functions = new Map();
    this.versions = new Map();
    this.aliases = new Map();
    this.layers = new Map();
    this.metrics = {
      totalFunctions: 0,
      totalVersions: 0,
      totalAliases: 0,
      totalLayers: 0,
      totalInvocations: 0,
      totalErrors: 0,
      averageDuration: 0
    };
  }

  // Initialize function manager
  async initialize() {
    try {
      this.initializeLayers();
      this.initializeFunctionTemplates();
      
      this.logger.info('Function manager initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing function manager:', error);
      throw error;
    }
  }

  // Initialize function layers
  initializeLayers() {
    this.layers.set('common-utils', {
      id: 'common-utils',
      name: 'Common Utils Layer',
      description: 'Common utility functions and libraries',
      version: '1.0.0',
      runtime: 'nodejs18.x',
      size: 1024000, // 1MB
      compatibleRuntimes: ['nodejs18.x', 'nodejs20.x'],
      createdBy: 'system',
      createdAt: new Date()
    });

    this.layers.set('database-helpers', {
      id: 'database-helpers',
      name: 'Database Helpers Layer',
      description: 'Database connection and query helpers',
      version: '1.0.0',
      runtime: 'nodejs18.x',
      size: 2048000, // 2MB
      compatibleRuntimes: ['nodejs18.x', 'nodejs20.x'],
      createdBy: 'system',
      createdAt: new Date()
    });

    this.layers.set('image-processing', {
      id: 'image-processing',
      name: 'Image Processing Layer',
      description: 'Image processing libraries and utilities',
      version: '1.0.0',
      runtime: 'python3.11',
      size: 5120000, // 5MB
      compatibleRuntimes: ['python3.9', 'python3.11'],
      createdBy: 'system',
      createdAt: new Date()
    });
  }

  // Initialize function templates
  initializeFunctionTemplates() {
    this.functionTemplates = {
      'rest-api': {
        name: 'REST API Function',
        description: 'Function for handling REST API requests',
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        memory: 512,
        timeout: 30,
        layers: ['common-utils', 'database-helpers'],
        environment: {
          NODE_ENV: 'production',
          API_VERSION: 'v1'
        },
        events: [
          {
            type: 'http',
            method: 'ANY',
            path: '/{proxy+}'
          }
        ]
      },
      'data-processor': {
        name: 'Data Processor Function',
        description: 'Function for processing data from various sources',
        runtime: 'python3.11',
        handler: 'main.handler',
        memory: 1024,
        timeout: 300,
        layers: ['image-processing'],
        environment: {
          PROCESSING_MODE: 'batch',
          MAX_RECORDS: '1000'
        },
        events: [
          {
            type: 's3',
            bucket: 'data-bucket',
            event: 's3:ObjectCreated:*'
          }
        ]
      },
      'scheduled-task': {
        name: 'Scheduled Task Function',
        description: 'Function for scheduled tasks and maintenance',
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        memory: 256,
        timeout: 60,
        layers: ['common-utils'],
        environment: {
          TASK_TYPE: 'maintenance',
          SCHEDULE_INTERVAL: '5m'
        },
        events: [
          {
            type: 'schedule',
            schedule: 'rate(5 minutes)'
          }
        ]
      },
      'webhook-handler': {
        name: 'Webhook Handler Function',
        description: 'Function for processing webhook requests',
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        memory: 512,
        timeout: 30,
        layers: ['common-utils'],
        environment: {
          WEBHOOK_SECRET: 'your-secret-key',
          VERIFY_SIGNATURE: 'true'
        },
        events: [
          {
            type: 'http',
            method: 'POST',
            path: '/webhook'
          }
        ]
      }
    };
  }

  // Create function
  async createFunction(config) {
    try {
      const function = {
        id: this.generateId(),
        name: config.name,
        description: config.description || '',
        runtime: config.runtime || 'nodejs18.x',
        handler: config.handler || 'index.handler',
        memory: config.memory || 512,
        timeout: config.timeout || 30,
        environment: config.environment || {},
        layers: config.layers || [],
        events: config.events || [],
        code: config.code || '',
        status: 'creating',
        version: '1.0.0',
        tags: config.tags || [],
        createdBy: config.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastDeployed: null,
        invocations: 0,
        errors: 0,
        averageDuration: 0,
        coldStarts: 0
      };

      this.functions.set(function.id, function);
      this.metrics.totalFunctions++;

      // Create initial version
      await this.createVersion(function.id, {
        code: function.code,
        description: 'Initial version',
        createdBy: function.createdBy
      });

      function.status = 'active';
      function.updatedAt = new Date();

      this.functions.set(function.id, function);

      this.logger.info('Function created successfully', {
        id: function.id,
        name: function.name,
        runtime: function.runtime
      });

      return function;
    } catch (error) {
      this.logger.error('Error creating function:', error);
      throw error;
    }
  }

  // Create function version
  async createVersion(functionId, config) {
    try {
      const function = this.functions.get(functionId);
      if (!function) {
        throw new Error('Function not found');
      }

      const version = {
        id: this.generateId(),
        functionId,
        version: this.getNextVersion(functionId),
        code: config.code,
        description: config.description || '',
        status: 'creating',
        createdBy: config.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: this.calculateCodeSize(config.code),
        checksum: this.calculateChecksum(config.code)
      };

      this.versions.set(version.id, version);
      this.metrics.totalVersions++;

      // Simulate version creation
      await this.simulateVersionCreation(version);

      version.status = 'active';
      version.updatedAt = new Date();

      this.versions.set(version.id, version);

      this.logger.info('Function version created successfully', {
        functionId,
        versionId: version.id,
        version: version.version
      });

      return version;
    } catch (error) {
      this.logger.error('Error creating function version:', error);
      throw error;
    }
  }

  // Create function alias
  async createAlias(functionId, config) {
    try {
      const function = this.functions.get(functionId);
      if (!function) {
        throw new Error('Function not found');
      }

      const alias = {
        id: this.generateId(),
        functionId,
        name: config.name,
        description: config.description || '',
        version: config.version || '1.0.0',
        status: 'active',
        createdBy: config.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.aliases.set(alias.id, alias);
      this.metrics.totalAliases++;

      this.logger.info('Function alias created successfully', {
        functionId,
        aliasId: alias.id,
        name: alias.name
      });

      return alias;
    } catch (error) {
      this.logger.error('Error creating function alias:', error);
      throw error;
    }
  }

  // Create function layer
  async createLayer(config) {
    try {
      const layer = {
        id: this.generateId(),
        name: config.name,
        description: config.description || '',
        version: config.version || '1.0.0',
        runtime: config.runtime || 'nodejs18.x',
        size: config.size || 0,
        compatibleRuntimes: config.compatibleRuntimes || [config.runtime],
        code: config.code || '',
        status: 'creating',
        createdBy: config.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.layers.set(layer.id, layer);
      this.metrics.totalLayers++;

      // Simulate layer creation
      await this.simulateLayerCreation(layer);

      layer.status = 'active';
      layer.updatedAt = new Date();

      this.layers.set(layer.id, layer);

      this.logger.info('Function layer created successfully', {
        id: layer.id,
        name: layer.name,
        runtime: layer.runtime
      });

      return layer;
    } catch (error) {
      this.logger.error('Error creating function layer:', error);
      throw error;
    }
  }

  // Update function
  async updateFunction(functionId, updates) {
    try {
      const function = this.functions.get(functionId);
      if (!function) {
        throw new Error('Function not found');
      }

      Object.assign(function, updates);
      function.updatedAt = new Date();
      function.status = 'updating';

      this.functions.set(functionId, function);

      // Create new version if code is updated
      if (updates.code) {
        await this.createVersion(functionId, {
          code: updates.code,
          description: 'Updated version',
          createdBy: updates.updatedBy || 'system'
        });
      }

      function.status = 'active';
      function.updatedAt = new Date();

      this.functions.set(functionId, function);

      this.logger.info('Function updated successfully', { functionId });
      return function;
    } catch (error) {
      this.logger.error('Error updating function:', error);
      throw error;
    }
  }

  // Delete function
  async deleteFunction(functionId) {
    try {
      const function = this.functions.get(functionId);
      if (!function) {
        throw new Error('Function not found');
      }

      // Delete all versions
      const versions = Array.from(this.versions.values())
        .filter(v => v.functionId === functionId);
      
      for (const version of versions) {
        this.versions.delete(version.id);
        this.metrics.totalVersions--;
      }

      // Delete all aliases
      const aliases = Array.from(this.aliases.values())
        .filter(a => a.functionId === functionId);
      
      for (const alias of aliases) {
        this.aliases.delete(alias.id);
        this.metrics.totalAliases--;
      }

      this.functions.delete(functionId);
      this.metrics.totalFunctions--;

      this.logger.info('Function deleted successfully', { functionId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting function:', error);
      throw error;
    }
  }

  // Get function
  async getFunction(id) {
    const function = this.functions.get(id);
    if (!function) {
      throw new Error('Function not found');
    }
    return function;
  }

  // List functions
  async listFunctions(filters = {}) {
    let functions = Array.from(this.functions.values());
    
    if (filters.runtime) {
      functions = functions.filter(f => f.runtime === filters.runtime);
    }
    
    if (filters.status) {
      functions = functions.filter(f => f.status === filters.status);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      functions = functions.filter(f => 
        filters.tags.some(tag => f.tags.includes(tag))
      );
    }
    
    return functions.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get function versions
  async getFunctionVersions(functionId) {
    const versions = Array.from(this.versions.values())
      .filter(v => v.functionId === functionId)
      .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    
    return versions;
  }

  // Get function aliases
  async getFunctionAliases(functionId) {
    const aliases = Array.from(this.aliases.values())
      .filter(a => a.functionId === functionId)
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return aliases;
  }

  // Get layers
  async getLayers() {
    return Array.from(this.layers.values());
  }

  // Get function templates
  async getFunctionTemplates() {
    return Object.values(this.functionTemplates);
  }

  // Get next version
  getNextVersion(functionId) {
    const versions = Array.from(this.versions.values())
      .filter(v => v.functionId === functionId)
      .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

    if (versions.length === 0) return '1.0.0';

    const lastVersion = versions[0].version;
    const parts = lastVersion.split('.');
    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1]);
    const patch = parseInt(parts[2]) + 1;

    return `${major}.${minor}.${patch}`;
  }

  // Calculate code size
  calculateCodeSize(code) {
    return Buffer.byteLength(code, 'utf8');
  }

  // Calculate checksum
  calculateChecksum(code) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(code).digest('hex');
  }

  // Simulate version creation
  async simulateVersionCreation(version) {
    const creationTime = Math.random() * 5000 + 2000; // 2-7 seconds
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, creationTime);
    });
  }

  // Simulate layer creation
  async simulateLayerCreation(layer) {
    const creationTime = Math.random() * 3000 + 1000; // 1-4 seconds
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, creationTime);
    });
  }

  // Get metrics
  async getMetrics() {
    return {
      ...this.metrics,
      averageVersionsPerFunction: this.metrics.totalFunctions > 0 ? 
        this.metrics.totalVersions / this.metrics.totalFunctions : 0,
      averageAliasesPerFunction: this.metrics.totalFunctions > 0 ? 
        this.metrics.totalAliases / this.metrics.totalFunctions : 0
    };
  }

  // Generate unique ID
  generateId() {
    return `func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new FunctionManager();
