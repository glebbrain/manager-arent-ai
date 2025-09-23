const winston = require('winston');
const os = require('os');
const process = require('process');
const _ = require('lodash');

class PerformanceMonitor {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/performance-monitor.log' })
      ]
    });
    
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = new Map();
    this.history = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  // Start performance monitoring
  async startMonitoring(interval = 5000) {
    try {
      if (this.isMonitoring) {
        this.logger.warn('Performance monitoring is already running');
        return;
      }

      this.isMonitoring = true;
      this.monitoringInterval = setInterval(() => {
        this.collectMetrics();
      }, interval);

      this.logger.info('Performance monitoring started', { interval });
    } catch (error) {
      this.logger.error('Error starting performance monitoring:', error);
      throw error;
    }
  }

  // Stop performance monitoring
  async stopMonitoring() {
    try {
      if (!this.isMonitoring) {
        this.logger.warn('Performance monitoring is not running');
        return;
      }

      this.isMonitoring = false;
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }

      this.logger.info('Performance monitoring stopped');
    } catch (error) {
      this.logger.error('Error stopping performance monitoring:', error);
      throw error;
    }
  }

  // Collect performance metrics
  async collectMetrics() {
    try {
      const timestamp = new Date();
      const metrics = {
        timestamp,
        system: await this.getSystemMetrics(),
        process: await this.getProcessMetrics(),
        memory: await this.getMemoryMetrics(),
        cpu: await this.getCpuMetrics(),
        network: await this.getNetworkMetrics(),
        disk: await this.getDiskMetrics()
      };

      // Store metrics
      this.metrics.set(timestamp.getTime(), metrics);
      
      // Add to history
      this.history.push(metrics);
      
      // Keep only last 1000 entries
      if (this.history.length > 1000) {
        this.history = this.history.slice(-1000);
      }

      // Check thresholds and generate alerts
      await this.checkThresholds(metrics);

      this.logger.debug('Performance metrics collected', { timestamp });
    } catch (error) {
      this.logger.error('Error collecting performance metrics:', error);
    }
  }

  // Get system metrics
  async getSystemMetrics() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length
    };
  }

  // Get process metrics
  async getProcessMetrics() {
    const usage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    
    return {
      pid: process.pid,
      uptime: process.uptime(),
      cpu: {
        user: usage.user,
        system: usage.system,
        total: usage.user + usage.system
      },
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      },
      versions: process.versions
    };
  }

  // Get memory metrics
  async getMemoryMetrics() {
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };

    const processMemory = process.memoryUsage();
    
    return {
      system: {
        ...systemMemory,
        usagePercent: (systemMemory.used / systemMemory.total) * 100
      },
      process: {
        ...processMemory,
        usagePercent: (processMemory.heapUsed / processMemory.heapTotal) * 100
      }
    };
  }

  // Get CPU metrics
  async getCpuMetrics() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    return {
      cores: cpus.length,
      loadAverage: {
        '1m': loadAvg[0],
        '5m': loadAvg[1],
        '15m': loadAvg[2]
      },
      usage: this.calculateCpuUsage(cpus)
    };
  }

  // Calculate CPU usage
  calculateCpuUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length,
      usage: ((totalTick - totalIdle) / totalTick) * 100
    };
  }

  // Get network metrics
  async getNetworkMetrics() {
    const networkInterfaces = os.networkInterfaces();
    const interfaces = {};
    
    for (const [name, addresses] of Object.entries(networkInterfaces)) {
      interfaces[name] = addresses.map(addr => ({
        address: addr.address,
        family: addr.family,
        internal: addr.internal,
        mac: addr.mac
      }));
    }
    
    return {
      interfaces,
      totalInterfaces: Object.keys(interfaces).length
    };
  }

  // Get disk metrics
  async getDiskMetrics() {
    // This is a simplified version - in production, use a library like 'diskusage'
    return {
      total: 0,
      free: 0,
      used: 0,
      usagePercent: 0
    };
  }

  // Set performance threshold
  async setThreshold(metric, threshold, operator = 'gt') {
    try {
      const thresholdConfig = {
        metric,
        threshold,
        operator,
        enabled: true,
        createdAt: new Date()
      };

      this.thresholds.set(metric, thresholdConfig);
      
      this.logger.info('Performance threshold set', { metric, threshold, operator });
      return thresholdConfig;
    } catch (error) {
      this.logger.error('Error setting performance threshold:', error);
      throw error;
    }
  }

  // Check thresholds and generate alerts
  async checkThresholds(metrics) {
    try {
      for (const [metric, threshold] of this.thresholds.entries()) {
        if (!threshold.enabled) continue;

        const value = this.getMetricValue(metrics, metric);
        if (value === null || value === undefined) continue;

        const isExceeded = this.evaluateThreshold(value, threshold.threshold, threshold.operator);
        
        if (isExceeded) {
          await this.generateAlert(metric, value, threshold);
        }
      }
    } catch (error) {
      this.logger.error('Error checking thresholds:', error);
    }
  }

  // Get metric value from metrics object
  getMetricValue(metrics, metricPath) {
    return _.get(metrics, metricPath);
  }

  // Evaluate threshold
  evaluateThreshold(value, threshold, operator) {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      case 'ne':
        return value !== threshold;
      default:
        return false;
    }
  }

  // Generate alert
  async generateAlert(metric, value, threshold) {
    try {
      const alert = {
        id: this.generateId(),
        metric,
        value,
        threshold: threshold.threshold,
        operator: threshold.operator,
        severity: this.determineSeverity(metric, value, threshold),
        message: this.generateAlertMessage(metric, value, threshold),
        timestamp: new Date(),
        acknowledged: false,
        resolved: false
      };

      this.alerts.set(alert.id, alert);
      
      this.logger.warn('Performance alert generated', {
        id: alert.id,
        metric,
        value,
        threshold: threshold.threshold,
        severity: alert.severity
      });

      return alert;
    } catch (error) {
      this.logger.error('Error generating alert:', error);
    }
  }

  // Determine alert severity
  determineSeverity(metric, value, threshold) {
    const percentage = (value / threshold.threshold) * 100;
    
    if (percentage >= 150) return 'critical';
    if (percentage >= 120) return 'high';
    if (percentage >= 110) return 'medium';
    return 'low';
  }

  // Generate alert message
  generateAlertMessage(metric, value, threshold) {
    const operatorText = {
      'gt': 'greater than',
      'gte': 'greater than or equal to',
      'lt': 'less than',
      'lte': 'less than or equal to',
      'eq': 'equal to',
      'ne': 'not equal to'
    };

    return `Performance threshold exceeded: ${metric} (${value}) is ${operatorText[threshold.operator]} ${threshold.threshold}`;
  }

  // Get current metrics
  async getCurrentMetrics() {
    const latest = Array.from(this.metrics.values()).pop();
    return latest || null;
  }

  // Get metrics history
  async getMetricsHistory(limit = 100) {
    return this.history.slice(-limit);
  }

  // Get alerts
  async getAlerts(filters = {}) {
    let alerts = Array.from(this.alerts.values());
    
    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    
    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === filters.acknowledged);
    }
    
    if (filters.resolved !== undefined) {
      alerts = alerts.filter(a => a.resolved === filters.resolved);
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId) {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      
      this.alerts.set(alertId, alert);
      
      this.logger.info('Alert acknowledged', { alertId });
      return alert;
    } catch (error) {
      this.logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Resolve alert
  async resolveAlert(alertId) {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      this.alerts.set(alertId, alert);
      
      this.logger.info('Alert resolved', { alertId });
      return alert;
    } catch (error) {
      this.logger.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Get performance summary
  async getPerformanceSummary() {
    const current = await this.getCurrentMetrics();
    if (!current) return null;

    const alerts = await this.getAlerts({ resolved: false });
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = alerts.filter(a => a.severity === 'high').length;

    return {
      status: criticalAlerts > 0 ? 'critical' : highAlerts > 0 ? 'warning' : 'healthy',
      uptime: current.process.uptime,
      memory: {
        usage: current.memory.process.usagePercent,
        heap: current.memory.process.usagePercent
      },
      cpu: {
        usage: current.cpu.usage.usage,
        loadAverage: current.cpu.loadAverage['1m']
      },
      alerts: {
        total: alerts.length,
        critical: criticalAlerts,
        high: highAlerts
      }
    };
  }

  // Generate performance report
  async generatePerformanceReport(timeRange = '1h') {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - this.parseTimeRange(timeRange));
      
      const relevantMetrics = this.history.filter(m => 
        m.timestamp >= startTime && m.timestamp <= endTime
      );

      if (relevantMetrics.length === 0) {
        return { error: 'No metrics found for the specified time range' };
      }

      const report = {
        timeRange,
        startTime,
        endTime,
        summary: this.generateMetricsSummary(relevantMetrics),
        trends: this.generateTrends(relevantMetrics),
        alerts: await this.getAlerts({ resolved: false }),
        recommendations: this.generateRecommendations(relevantMetrics)
      };

      return report;
    } catch (error) {
      this.logger.error('Error generating performance report:', error);
      throw error;
    }
  }

  // Generate metrics summary
  generateMetricsSummary(metrics) {
    const memoryUsage = metrics.map(m => m.memory.process.usagePercent);
    const cpuUsage = metrics.map(m => m.cpu.usage.usage);
    const loadAverage = metrics.map(m => m.cpu.loadAverage['1m']);

    return {
      memory: {
        avg: memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length,
        max: Math.max(...memoryUsage),
        min: Math.min(...memoryUsage)
      },
      cpu: {
        avg: cpuUsage.reduce((a, b) => a + b, 0) / cpuUsage.length,
        max: Math.max(...cpuUsage),
        min: Math.min(...cpuUsage)
      },
      load: {
        avg: loadAverage.reduce((a, b) => a + b, 0) / loadAverage.length,
        max: Math.max(...loadAverage),
        min: Math.min(...loadAverage)
      }
    };
  }

  // Generate trends
  generateTrends(metrics) {
    // Simple trend analysis - in production, use more sophisticated algorithms
    const memoryTrend = this.calculateTrend(metrics.map(m => m.memory.process.usagePercent));
    const cpuTrend = this.calculateTrend(metrics.map(m => m.cpu.usage.usage));

    return {
      memory: memoryTrend,
      cpu: cpuTrend
    };
  }

  // Calculate trend
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  // Generate recommendations
  generateRecommendations(metrics) {
    const recommendations = [];
    
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memory.process.usagePercent, 0) / metrics.length;
    const avgCpuUsage = metrics.reduce((sum, m) => sum + m.cpu.usage.usage, 0) / metrics.length;
    
    if (avgMemoryUsage > 80) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'High memory usage detected. Consider optimizing memory usage or increasing available memory.',
        action: 'optimize_memory'
      });
    }
    
    if (avgCpuUsage > 80) {
      recommendations.push({
        type: 'cpu',
        priority: 'high',
        message: 'High CPU usage detected. Consider optimizing CPU-intensive operations or scaling horizontally.',
        action: 'optimize_cpu'
      });
    }
    
    return recommendations;
  }

  // Parse time range
  parseTimeRange(timeRange) {
    const match = timeRange.match(/^(\d+)([smhd])$/);
    if (!match) return 3600000; // 1 hour default
    
    const amount = parseInt(match[1]);
    const unit = match[2];
    
    const unitMap = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    return amount * unitMap[unit];
  }

  // Generate unique ID
  generateId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new PerformanceMonitor();
