const EventEmitter = require('events');
const os = require('os');
const process = require('process');
const logger = require('./logger');

/**
 * Performance Monitor Module
 * Provides real-time performance monitoring and alerting capabilities
 */
class PerformanceMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled || process.env.PERFORMANCE_MONITORING_ENABLED === 'true',
      interval: config.interval || parseInt(process.env.METRICS_INTERVAL) || 1000,
      alertThresholds: {
        cpu: config.cpuThreshold || parseFloat(process.env.ALERT_THRESHOLD_CPU) || 80,
        memory: config.memoryThreshold || parseFloat(process.env.ALERT_THRESHOLD_MEMORY) || 85,
        responseTime: config.responseTimeThreshold || 1000,
        errorRate: config.errorRateThreshold || 5
      },
      ...config
    };

    this.metrics = {
      cpu: 0,
      memory: 0,
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      activeConnections: 0,
      timestamp: new Date()
    };

    this.history = [];
    this.alerts = [];
    this.isRunning = false;
    this.intervalId = null;
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
  }

  /**
   * Start performance monitoring
   */
  async start() {
    if (!this.config.enabled) {
      logger.info('Performance monitoring is disabled');
      return;
    }

    try {
      this.intervalId = setInterval(() => {
        this.collectMetrics();
      }, this.config.interval);

      this.isRunning = true;
      logger.info('Performance monitoring started');
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start performance monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop performance monitoring
   */
  async stop() {
    try {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      this.isRunning = false;
      logger.info('Performance monitoring stopped');
      this.emit('stopped');
    } catch (error) {
      logger.error('Error stopping performance monitoring:', error);
      throw error;
    }
  }

  /**
   * Collect performance metrics
   */
  collectMetrics() {
    try {
      const cpuUsage = this.getCPUUsage();
      const memoryUsage = this.getMemoryUsage();
      const responseTime = this.calculateAverageResponseTime();
      const throughput = this.calculateThroughput();
      const errorRate = this.calculateErrorRate();
      const activeConnections = this.getActiveConnections();

      this.metrics = {
        cpu: cpuUsage,
        memory: memoryUsage,
        responseTime: responseTime,
        throughput: throughput,
        errorRate: errorRate,
        activeConnections: activeConnections,
        timestamp: new Date()
      };

      // Store in history
      this.history.push({ ...this.metrics });
      
      // Keep only last 1000 entries
      if (this.history.length > 1000) {
        this.history = this.history.slice(-1000);
      }

      // Check for alerts
      this.checkAlerts();

      this.emit('metricsUpdated', this.metrics);
    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }

  /**
   * Get CPU usage percentage
   */
  getCPUUsage() {
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
    const usage = 100 - Math.round(100 * idle / total);

    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Get memory usage percentage
   */
  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usage = (usedMemory / totalMemory) * 100;

    return Math.round(usage * 100) / 100;
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    
    const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  /**
   * Calculate throughput (requests per second)
   */
  calculateThroughput() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Count requests in the last second
    const recentRequests = this.responseTimes.filter(time => time > oneSecondAgo);
    return recentRequests.length;
  }

  /**
   * Calculate error rate percentage
   */
  calculateErrorRate() {
    if (this.requestCount === 0) return 0;
    
    return Math.round((this.errorCount / this.requestCount) * 100 * 100) / 100;
  }

  /**
   * Get active connections count
   */
  getActiveConnections() {
    // This would be implemented based on your connection tracking
    return Math.floor(Math.random() * 100); // Placeholder
  }

  /**
   * Check for performance alerts
   */
  checkAlerts() {
    const alerts = [];

    if (this.metrics.cpu > this.config.alertThresholds.cpu) {
      alerts.push({
        type: 'cpu',
        level: 'warning',
        message: `High CPU usage: ${this.metrics.cpu}%`,
        value: this.metrics.cpu,
        threshold: this.config.alertThresholds.cpu,
        timestamp: new Date()
      });
    }

    if (this.metrics.memory > this.config.alertThresholds.memory) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `High memory usage: ${this.metrics.memory}%`,
        value: this.metrics.memory,
        threshold: this.config.alertThresholds.memory,
        timestamp: new Date()
      });
    }

    if (this.metrics.responseTime > this.config.alertThresholds.responseTime) {
      alerts.push({
        type: 'responseTime',
        level: 'warning',
        message: `High response time: ${this.metrics.responseTime}ms`,
        value: this.metrics.responseTime,
        threshold: this.config.alertThresholds.responseTime,
        timestamp: new Date()
      });
    }

    if (this.metrics.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'errorRate',
        level: 'error',
        message: `High error rate: ${this.metrics.errorRate}%`,
        value: this.metrics.errorRate,
        threshold: this.config.alertThresholds.errorRate,
        timestamp: new Date()
      });
    }

    // Add new alerts
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.emit('alert', alert);
      logger.warn('Performance alert:', alert);
    });

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Record request metrics
   */
  recordRequest(responseTime, isError = false) {
    this.requestCount++;
    this.responseTimes.push(responseTime);

    if (isError) {
      this.errorCount++;
    }

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get historical metrics
   */
  getHistory(limit = 100) {
    return this.history.slice(-limit);
  }

  /**
   * Get performance alerts
   */
  getAlerts(limit = 50) {
    return this.alerts.slice(-limit);
  }

  /**
   * Get performance statistics
   */
  getStatistics() {
    const history = this.history;
    
    if (history.length === 0) {
      return {
        average: { cpu: 0, memory: 0, responseTime: 0, throughput: 0, errorRate: 0 },
        maximum: { cpu: 0, memory: 0, responseTime: 0, throughput: 0, errorRate: 0 },
        minimum: { cpu: 0, memory: 0, responseTime: 0, throughput: 0, errorRate: 0 },
        trends: { cpu: 'stable', memory: 'stable', responseTime: 'stable', throughput: 'stable', errorRate: 'stable' }
      };
    }

    const metrics = ['cpu', 'memory', 'responseTime', 'throughput', 'errorRate'];
    const stats = {};

    metrics.forEach(metric => {
      const values = history.map(h => h[metric]);
      stats[metric] = {
        average: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100,
        maximum: Math.max(...values),
        minimum: Math.min(...values)
      };
    });

    // Calculate trends
    const trends = {};
    metrics.forEach(metric => {
      const recent = history.slice(-10);
      const older = history.slice(-20, -10);
      
      if (recent.length > 0 && older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b[metric], 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b[metric], 0) / older.length;
        
        if (recentAvg > olderAvg * 1.1) {
          trends[metric] = 'increasing';
        } else if (recentAvg < olderAvg * 0.9) {
          trends[metric] = 'decreasing';
        } else {
          trends[metric] = 'stable';
        }
      } else {
        trends[metric] = 'stable';
      }
    });

    return {
      average: {
        cpu: stats.cpu.average,
        memory: stats.memory.average,
        responseTime: stats.responseTime.average,
        throughput: stats.throughput.average,
        errorRate: stats.errorRate.average
      },
      maximum: {
        cpu: stats.cpu.maximum,
        memory: stats.memory.maximum,
        responseTime: stats.responseTime.maximum,
        throughput: stats.throughput.maximum,
        errorRate: stats.errorRate.maximum
      },
      minimum: {
        cpu: stats.cpu.minimum,
        memory: stats.memory.minimum,
        responseTime: stats.responseTime.minimum,
        throughput: stats.throughput.minimum,
        errorRate: stats.errorRate.minimum
      },
      trends
    };
  }

  /**
   * Run performance benchmark
   */
  async runBenchmark(options = {}) {
    const {
      duration = 60000, // 1 minute
      concurrency = 10,
      endpoint = '/api/health'
    } = options;

    logger.info(`Starting performance benchmark for ${duration}ms with concurrency ${concurrency}`);

    const startTime = Date.now();
    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      requestsPerSecond: 0,
      errors: []
    };

    const responseTimes = [];

    // Simulate load testing
    const promises = [];
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.simulateLoad(endpoint, duration, responseTimes, results));
    }

    await Promise.all(promises);

    const endTime = Date.now();
    const actualDuration = endTime - startTime;

    // Calculate results
    results.totalRequests = responseTimes.length;
    results.successfulRequests = results.totalRequests - results.failedRequests;
    results.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    results.maxResponseTime = Math.max(...responseTimes);
    results.minResponseTime = Math.min(...responseTimes);
    results.requestsPerSecond = (results.totalRequests / actualDuration) * 1000;

    logger.info('Performance benchmark completed:', results);
    this.emit('benchmarkCompleted', results);

    return results;
  }

  /**
   * Simulate load for benchmarking
   */
  async simulateLoad(endpoint, duration, responseTimes, results) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration) {
      const requestStart = Date.now();
      
      try {
        // Simulate request processing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        const responseTime = Date.now() - requestStart;
        responseTimes.push(responseTime);
        results.successfulRequests++;
      } catch (error) {
        results.failedRequests++;
        results.errors.push(error.message);
      }
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      running: this.isRunning,
      interval: this.config.interval,
      metricsCount: this.history.length,
      alertsCount: this.alerts.length,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      uptime: process.uptime()
    };
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(thresholds) {
    this.config.alertThresholds = {
      ...this.config.alertThresholds,
      ...thresholds
    };
    
    logger.info('Alert thresholds updated:', this.config.alertThresholds);
  }

  /**
   * Clear alerts
   */
  clearAlerts() {
    this.alerts = [];
    logger.info('Performance alerts cleared');
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.history = [];
    this.alerts = [];
    
    logger.info('Performance metrics reset');
  }
}

module.exports = PerformanceMonitor;
