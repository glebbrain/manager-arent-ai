const EventEmitter = require('events');
const os = require('os');
const process = require('process');
const logger = require('./logger');

/**
 * Resource Optimizer Module
 * Provides CPU, memory, and I/O optimization capabilities
 */
class ResourceOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled || process.env.RESOURCE_OPTIMIZATION_ENABLED === 'true',
      cpuLimit: config.cpuLimit || parseInt(process.env.CPU_LIMIT) || 2000,
      memoryLimit: config.memoryLimit || parseInt(process.env.MEMORY_LIMIT) || 4096,
      optimizationInterval: config.optimizationInterval || 30000, // 30 seconds
      thresholds: {
        cpu: config.cpuThreshold || 80,
        memory: config.memoryThreshold || 85,
        disk: config.diskThreshold || 90
      },
      ...config
    };

    this.isRunning = false;
    this.optimizationInterval = null;
    this.resourceStats = {
      cpu: { usage: 0, cores: os.cpus().length, load: [] },
      memory: { used: 0, total: os.totalmem(), free: 0, usage: 0 },
      disk: { used: 0, total: 0, free: 0, usage: 0 },
      network: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 }
    };
    this.optimizations = [];
    this.performanceHistory = [];
  }

  /**
   * Start resource optimizer
   */
  async start() {
    if (!this.config.enabled) {
      logger.info('Resource optimizer is disabled');
      return;
    }

    try {
      await this.initializeOptimizations();
      await this.startMonitoring();
      
      this.isRunning = true;
      logger.info('Resource optimizer started successfully');
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start resource optimizer:', error);
      throw error;
    }
  }

  /**
   * Stop resource optimizer
   */
  async stop() {
    try {
      if (this.optimizationInterval) {
        clearInterval(this.optimizationInterval);
        this.optimizationInterval = null;
      }

      this.isRunning = false;
      logger.info('Resource optimizer stopped');
      this.emit('stopped');
    } catch (error) {
      logger.error('Error stopping resource optimizer:', error);
      throw error;
    }
  }

  /**
   * Initialize optimization strategies
   */
  async initializeOptimizations() {
    this.optimizations = [
      {
        id: 'cpu-optimization',
        name: 'CPU Optimization',
        enabled: true,
        priority: 'high',
        execute: this.optimizeCPU.bind(this)
      },
      {
        id: 'memory-optimization',
        name: 'Memory Optimization',
        enabled: true,
        priority: 'high',
        execute: this.optimizeMemory.bind(this)
      },
      {
        id: 'io-optimization',
        name: 'I/O Optimization',
        enabled: true,
        priority: 'medium',
        execute: this.optimizeIO.bind(this)
      },
      {
        id: 'garbage-collection',
        name: 'Garbage Collection',
        enabled: true,
        priority: 'medium',
        execute: this.triggerGarbageCollection.bind(this)
      },
      {
        id: 'connection-pooling',
        name: 'Connection Pooling',
        enabled: true,
        priority: 'low',
        execute: this.optimizeConnections.bind(this)
      }
    ];

    logger.info(`Initialized ${this.optimizations.length} optimization strategies`);
  }

  /**
   * Start resource monitoring
   */
  async startMonitoring() {
    this.optimizationInterval = setInterval(() => {
      this.collectResourceStats();
      this.performOptimizations();
    }, this.config.optimizationInterval);
  }

  /**
   * Collect current resource statistics
   */
  collectResourceStats() {
    try {
      // CPU stats
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const cpuUsage = 100 - Math.round(100 * idle / total);

      this.resourceStats.cpu = {
        usage: Math.max(0, Math.min(100, cpuUsage)),
        cores: cpus.length,
        load: os.loadavg()
      };

      // Memory stats
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = (usedMemory / totalMemory) * 100;

      this.resourceStats.memory = {
        used: usedMemory,
        total: totalMemory,
        free: freeMemory,
        usage: Math.round(memoryUsage * 100) / 100
      };

      // Process memory stats
      const processMemory = process.memoryUsage();
      this.resourceStats.processMemory = {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external,
        arrayBuffers: processMemory.arrayBuffers
      };

      // Store in history
      this.performanceHistory.push({
        timestamp: new Date(),
        cpu: this.resourceStats.cpu.usage,
        memory: this.resourceStats.memory.usage,
        processMemory: this.resourceStats.processMemory.heapUsed
      });

      // Keep only last 100 entries
      if (this.performanceHistory.length > 100) {
        this.performanceHistory = this.performanceHistory.slice(-100);
      }

      this.emit('statsUpdated', this.resourceStats);
    } catch (error) {
      logger.error('Error collecting resource stats:', error);
    }
  }

  /**
   * Perform optimizations based on current resource usage
   */
  async performOptimizations() {
    const optimizations = this.optimizations
      .filter(opt => opt.enabled)
      .sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));

    for (const optimization of optimizations) {
      try {
        if (this.shouldRunOptimization(optimization)) {
          await optimization.execute();
          this.emit('optimizationExecuted', optimization);
        }
      } catch (error) {
        logger.error(`Error executing optimization ${optimization.name}:`, error);
      }
    }
  }

  /**
   * Check if optimization should run
   */
  shouldRunOptimization(optimization) {
    switch (optimization.id) {
      case 'cpu-optimization':
        return this.resourceStats.cpu.usage > this.config.thresholds.cpu;
      case 'memory-optimization':
        return this.resourceStats.memory.usage > this.config.thresholds.memory;
      case 'io-optimization':
        return this.resourceStats.disk.usage > this.config.thresholds.disk;
      case 'garbage-collection':
        return this.resourceStats.processMemory.heapUsed > this.resourceStats.processMemory.heapTotal * 0.8;
      case 'connection-pooling':
        return true; // Always run connection optimization
      default:
        return false;
    }
  }

  /**
   * Get priority value for sorting
   */
  getPriorityValue(priority) {
    const priorities = { high: 3, medium: 2, low: 1 };
    return priorities[priority] || 0;
  }

  /**
   * Optimize CPU usage
   */
  async optimizeCPU() {
    logger.info('Running CPU optimization...');
    
    // Reduce process priority if CPU usage is high
    if (this.resourceStats.cpu.usage > 90) {
      try {
        process.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL);
        logger.info('Process priority reduced due to high CPU usage');
      } catch (error) {
        logger.warn('Could not reduce process priority:', error.message);
      }
    }

    // Suggest CPU optimizations
    const suggestions = [];
    
    if (this.resourceStats.cpu.load[0] > this.resourceStats.cpu.cores) {
      suggestions.push('Consider reducing concurrent operations');
    }
    
    if (this.resourceStats.cpu.usage > 80) {
      suggestions.push('Consider implementing request throttling');
    }

    if (suggestions.length > 0) {
      this.emit('cpuOptimizationSuggestions', suggestions);
    }

    logger.info('CPU optimization completed');
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemory() {
    logger.info('Running memory optimization...');
    
    // Clear unused variables and objects
    if (global.gc) {
      global.gc();
      logger.info('Garbage collection triggered');
    }

    // Suggest memory optimizations
    const suggestions = [];
    
    if (this.resourceStats.processMemory.heapUsed > this.resourceStats.processMemory.heapTotal * 0.8) {
      suggestions.push('Consider implementing object pooling');
    }
    
    if (this.resourceStats.memory.usage > 80) {
      suggestions.push('Consider implementing memory caching strategies');
    }

    if (suggestions.length > 0) {
      this.emit('memoryOptimizationSuggestions', suggestions);
    }

    logger.info('Memory optimization completed');
  }

  /**
   * Optimize I/O operations
   */
  async optimizeIO() {
    logger.info('Running I/O optimization...');
    
    // Suggest I/O optimizations
    const suggestions = [];
    
    if (this.resourceStats.disk.usage > 80) {
      suggestions.push('Consider implementing disk space cleanup');
    }
    
    suggestions.push('Consider implementing connection pooling for database operations');
    suggestions.push('Consider implementing file caching for frequently accessed files');

    this.emit('ioOptimizationSuggestions', suggestions);
    logger.info('I/O optimization completed');
  }

  /**
   * Trigger garbage collection
   */
  async triggerGarbageCollection() {
    if (global.gc) {
      global.gc();
      logger.info('Garbage collection triggered');
    } else {
      logger.warn('Garbage collection not available (run with --expose-gc flag)');
    }
  }

  /**
   * Optimize connections
   */
  async optimizeConnections() {
    logger.info('Running connection optimization...');
    
    // Suggest connection optimizations
    const suggestions = [
      'Implement connection pooling for database connections',
      'Use keep-alive for HTTP connections',
      'Implement connection timeouts and retry logic',
      'Consider using connection multiplexing'
    ];

    this.emit('connectionOptimizationSuggestions', suggestions);
    logger.info('Connection optimization completed');
  }

  /**
   * Get current resource statistics
   */
  getResourceStats() {
    return { ...this.resourceStats };
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(limit = 50) {
    return this.performanceHistory.slice(-limit);
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];

    // CPU recommendations
    if (this.resourceStats.cpu.usage > this.config.thresholds.cpu) {
      recommendations.push({
        type: 'cpu',
        priority: 'high',
        message: `High CPU usage: ${this.resourceStats.cpu.usage}%`,
        suggestions: [
          'Implement request throttling',
          'Use worker threads for CPU-intensive tasks',
          'Optimize algorithms and data structures',
          'Consider horizontal scaling'
        ]
      });
    }

    // Memory recommendations
    if (this.resourceStats.memory.usage > this.config.thresholds.memory) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: `High memory usage: ${this.resourceStats.memory.usage}%`,
        suggestions: [
          'Implement object pooling',
          'Use streaming for large data processing',
          'Implement memory caching strategies',
          'Consider vertical scaling'
        ]
      });
    }

    // Process memory recommendations
    if (this.resourceStats.processMemory.heapUsed > this.resourceStats.processMemory.heapTotal * 0.8) {
      recommendations.push({
        type: 'process-memory',
        priority: 'medium',
        message: `High process memory usage: ${Math.round(this.resourceStats.processMemory.heapUsed / 1024 / 1024)}MB`,
        suggestions: [
          'Trigger garbage collection more frequently',
          'Review memory leaks in code',
          'Implement memory monitoring',
          'Consider memory profiling'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get resource optimizer status
   */
  getStatus() {
    return {
      running: this.isRunning,
      optimizations: this.optimizations.length,
      enabledOptimizations: this.optimizations.filter(opt => opt.enabled).length,
      resourceStats: this.resourceStats,
      historySize: this.performanceHistory.length
    };
  }

  /**
   * Update optimization configuration
   */
  updateOptimization(id, updates) {
    const optimization = this.optimizations.find(opt => opt.id === id);
    if (!optimization) {
      throw new Error(`Optimization not found: ${id}`);
    }

    Object.assign(optimization, updates);
    logger.info(`Optimization ${id} configuration updated`);
  }

  /**
   * Enable/disable optimization
   */
  setOptimizationEnabled(id, enabled) {
    const optimization = this.optimizations.find(opt => opt.id === id);
    if (!optimization) {
      throw new Error(`Optimization not found: ${id}`);
    }

    optimization.enabled = enabled;
    logger.info(`Optimization ${id} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update resource thresholds
   */
  updateThresholds(thresholds) {
    this.config.thresholds = {
      ...this.config.thresholds,
      ...thresholds
    };
    
    logger.info('Resource thresholds updated:', this.config.thresholds);
  }

  /**
   * Reset performance history
   */
  resetHistory() {
    this.performanceHistory = [];
    logger.info('Performance history reset');
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      uptime: os.uptime(),
      nodeVersion: process.version,
      pid: process.pid,
      memoryUsage: process.memoryUsage()
    };
  }
}

module.exports = ResourceOptimizer;
