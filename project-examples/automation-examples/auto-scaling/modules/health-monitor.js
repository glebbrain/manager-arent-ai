const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class HealthMonitor {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/health-monitor.log' })
      ]
    });
    
    this.healthChecks = new Map();
    this.healthStatuses = new Map();
    this.healthAlerts = new Map();
    this.healthData = {
      totalChecks: 0,
      activeChecks: 0,
      healthyInstances: 0,
      unhealthyInstances: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
      warningAlerts: 0
    };
  }

  // Initialize health monitor
  async initialize() {
    try {
      this.initializeHealthChecks();
      this.initializeHealthAlerts();
      
      this.logger.info('Health monitor initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing health monitor:', error);
      throw error;
    }
  }

  // Initialize health checks
  initializeHealthChecks() {
    this.healthChecks = new Map([
      ['http', {
        id: 'http',
        name: 'HTTP Health Check',
        description: 'Check HTTP endpoint availability',
        type: 'http',
        config: {
          path: '/health',
          method: 'GET',
          timeout: 5000,
          expectedStatus: 200,
          expectedResponse: 'OK'
        },
        enabled: true
      }],
      ['tcp', {
        id: 'tcp',
        name: 'TCP Health Check',
        description: 'Check TCP port availability',
        type: 'tcp',
        config: {
          port: 8080,
          timeout: 3000
        },
        enabled: true
      }],
      ['database', {
        id: 'database',
        name: 'Database Health Check',
        description: 'Check database connectivity',
        type: 'database',
        config: {
          query: 'SELECT 1',
          timeout: 5000
        },
        enabled: true
      }],
      ['disk', {
        id: 'disk',
        name: 'Disk Health Check',
        description: 'Check disk space availability',
        type: 'disk',
        config: {
          path: '/',
          threshold: 90, // 90% usage
          timeout: 2000
        },
        enabled: true
      }],
      ['memory', {
        id: 'memory',
        name: 'Memory Health Check',
        description: 'Check memory usage',
        type: 'memory',
        config: {
          threshold: 95, // 95% usage
          timeout: 1000
        },
        enabled: true
      }],
      ['cpu', {
        id: 'cpu',
        name: 'CPU Health Check',
        description: 'Check CPU usage',
        type: 'cpu',
        config: {
          threshold: 90, // 90% usage
          timeout: 1000
        },
        enabled: true
      }],
      ['custom', {
        id: 'custom',
        name: 'Custom Health Check',
        description: 'Custom application health check',
        type: 'custom',
        config: {
          script: 'check_health.sh',
          timeout: 10000
        },
        enabled: true
      }]
    ]);

    this.healthData.totalChecks = this.healthChecks.size;
    this.healthData.activeChecks = Array.from(this.healthChecks.values()).filter(c => c.enabled).length;
  }

  // Initialize health alerts
  initializeHealthAlerts() {
    this.healthAlerts = new Map([
      ['instance_unhealthy', {
        id: 'instance_unhealthy',
        name: 'Instance Unhealthy',
        description: 'Instance failed health check',
        severity: 'critical',
        threshold: 1,
        duration: 0,
        enabled: true
      }],
      ['multiple_instances_unhealthy', {
        id: 'multiple_instances_unhealthy',
        name: 'Multiple Instances Unhealthy',
        description: 'Multiple instances failed health check',
        severity: 'critical',
        threshold: 2,
        duration: 300, // 5 minutes
        enabled: true
      }],
      ['high_error_rate', {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'High error rate detected',
        severity: 'warning',
        threshold: 10, // 10%
        duration: 600, // 10 minutes
        enabled: true
      }],
      ['slow_response_time', {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        description: 'Slow response time detected',
        severity: 'warning',
        threshold: 5000, // 5 seconds
        duration: 300, // 5 minutes
        enabled: true
      }],
      ['resource_exhaustion', {
        id: 'resource_exhaustion',
        name: 'Resource Exhaustion',
        description: 'System resources are exhausted',
        severity: 'critical',
        threshold: 95, // 95%
        duration: 0,
        enabled: true
      }]
    ]);
  }

  // Perform health check
  async performHealthCheck(instanceId, checkId, config = {}) {
    try {
      const check = this.healthChecks.get(checkId);
      if (!check) {
        throw new Error(`Health check not found: ${checkId}`);
      }

      const startTime = Date.now();
      let result;

      switch (check.type) {
        case 'http':
          result = await this.performHttpHealthCheck(instanceId, check.config, config);
          break;
        case 'tcp':
          result = await this.performTcpHealthCheck(instanceId, check.config, config);
          break;
        case 'database':
          result = await this.performDatabaseHealthCheck(instanceId, check.config, config);
          break;
        case 'disk':
          result = await this.performDiskHealthCheck(instanceId, check.config, config);
          break;
        case 'memory':
          result = await this.performMemoryHealthCheck(instanceId, check.config, config);
          break;
        case 'cpu':
          result = await this.performCpuHealthCheck(instanceId, check.config, config);
          break;
        case 'custom':
          result = await this.performCustomHealthCheck(instanceId, check.config, config);
          break;
        default:
          throw new Error(`Unknown health check type: ${check.type}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      const healthStatus = {
        id: this.generateId(),
        instanceId: instanceId,
        checkId: checkId,
        checkName: check.name,
        status: result.healthy ? 'healthy' : 'unhealthy',
        healthy: result.healthy,
        message: result.message,
        details: result.details,
        duration: duration,
        timestamp: new Date(),
        config: check.config
      };

      this.healthStatuses.set(healthStatus.id, healthStatus);
      await this.updateHealthMetrics(instanceId, healthStatus);
      await this.checkHealthAlerts(instanceId, healthStatus);

      this.logger.info('Health check completed', {
        instanceId,
        checkId,
        status: healthStatus.status,
        duration: duration
      });

      return healthStatus;
    } catch (error) {
      this.logger.error('Error performing health check:', error);
      throw error;
    }
  }

  // Perform HTTP health check
  async performHttpHealthCheck(instanceId, config, options = {}) {
    const startTime = Date.now();
    
    try {
      // Simulate HTTP health check
      const responseTime = Math.random() * 1000 + 100; // 100-1100ms
      const statusCode = Math.random() > 0.1 ? 200 : 500; // 90% success rate
      const response = statusCode === 200 ? 'OK' : 'Error';
      
      const healthy = statusCode === config.expectedStatus && 
                     response === config.expectedResponse &&
                     responseTime < config.timeout;
      
      return {
        healthy: healthy,
        message: healthy ? 'HTTP check passed' : 'HTTP check failed',
        details: {
          statusCode: statusCode,
          responseTime: responseTime,
          response: response
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `HTTP check error: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  // Perform TCP health check
  async performTcpHealthCheck(instanceId, config, options = {}) {
    try {
      // Simulate TCP health check
      const responseTime = Math.random() * 500 + 50; // 50-550ms
      const healthy = responseTime < config.timeout;
      
      return {
        healthy: healthy,
        message: healthy ? 'TCP check passed' : 'TCP check failed',
        details: {
          port: config.port,
          responseTime: responseTime
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `TCP check error: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  // Perform database health check
  async performDatabaseHealthCheck(instanceId, config, options = {}) {
    try {
      // Simulate database health check
      const responseTime = Math.random() * 2000 + 100; // 100-2100ms
      const healthy = responseTime < config.timeout;
      
      return {
        healthy: healthy,
        message: healthy ? 'Database check passed' : 'Database check failed',
        details: {
          query: config.query,
          responseTime: responseTime
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Database check error: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  // Perform disk health check
  async performDiskHealthCheck(instanceId, config, options = {}) {
    try {
      // Simulate disk health check
      const usage = Math.random() * 100; // 0-100%
      const healthy = usage < config.threshold;
      
      return {
        healthy: healthy,
        message: healthy ? 'Disk check passed' : 'Disk check failed',
        details: {
          path: config.path,
          usage: usage,
          threshold: config.threshold
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Disk check error: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  // Perform memory health check
  async performMemoryHealthCheck(instanceId, config, options = {}) {
    try {
      // Simulate memory health check
      const usage = Math.random() * 100; // 0-100%
      const healthy = usage < config.threshold;
      
      return {
        healthy: healthy,
        message: healthy ? 'Memory check passed' : 'Memory check failed',
        details: {
          usage: usage,
          threshold: config.threshold
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Memory check error: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  // Perform CPU health check
  async performCpuHealthCheck(instanceId, config, options = {}) {
    try {
      // Simulate CPU health check
      const usage = Math.random() * 100; // 0-100%
      const healthy = usage < config.threshold;
      
      return {
        healthy: healthy,
        message: healthy ? 'CPU check passed' : 'CPU check failed',
        details: {
          usage: usage,
          threshold: config.threshold
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `CPU check error: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  // Perform custom health check
  async performCustomHealthCheck(instanceId, config, options = {}) {
    try {
      // Simulate custom health check
      const responseTime = Math.random() * 5000 + 500; // 500-5500ms
      const healthy = responseTime < config.timeout;
      
      return {
        healthy: healthy,
        message: healthy ? 'Custom check passed' : 'Custom check failed',
        details: {
          script: config.script,
          responseTime: responseTime
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Custom check error: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  // Update health metrics
  async updateHealthMetrics(instanceId, healthStatus) {
    // Update instance health status
    const instanceHealth = this.healthStatuses.get(instanceId) || {
      instanceId: instanceId,
      status: 'unknown',
      healthy: false,
      lastCheck: null,
      checks: []
    };

    instanceHealth.status = healthStatus.status;
    instanceHealth.healthy = healthStatus.healthy;
    instanceHealth.lastCheck = healthStatus.timestamp;
    instanceHealth.checks.push(healthStatus);

    this.healthStatuses.set(instanceId, instanceHealth);

    // Update global metrics
    if (healthStatus.healthy) {
      this.healthData.healthyInstances++;
    } else {
      this.healthData.unhealthyInstances++;
    }
  }

  // Check health alerts
  async checkHealthAlerts(instanceId, healthStatus) {
    for (const alert of this.healthAlerts.values()) {
      if (!alert.enabled) continue;

      const shouldTrigger = await this.evaluateAlert(alert, instanceId, healthStatus);
      if (shouldTrigger) {
        await this.triggerAlert(alert, instanceId, healthStatus);
      }
    }
  }

  // Evaluate alert
  async evaluateAlert(alert, instanceId, healthStatus) {
    // Simple alert evaluation logic
    switch (alert.id) {
      case 'instance_unhealthy':
        return !healthStatus.healthy;
      case 'multiple_instances_unhealthy':
        return this.healthData.unhealthyInstances >= alert.threshold;
      case 'high_error_rate':
        return healthStatus.details?.errorRate >= alert.threshold;
      case 'slow_response_time':
        return healthStatus.details?.responseTime >= alert.threshold;
      case 'resource_exhaustion':
        return healthStatus.details?.usage >= alert.threshold;
      default:
        return false;
    }
  }

  // Trigger alert
  async triggerAlert(alert, instanceId, healthStatus) {
    const alertInstance = {
      id: this.generateId(),
      alertId: alert.id,
      instanceId: instanceId,
      severity: alert.severity,
      message: alert.description,
      details: healthStatus,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    };

    this.healthAlerts.set(alertInstance.id, alertInstance);
    this.healthData.totalAlerts++;

    if (alert.severity === 'critical') {
      this.healthData.criticalAlerts++;
    } else if (alert.severity === 'warning') {
      this.healthData.warningAlerts++;
    }

    this.logger.warn('Health alert triggered', {
      alertId: alert.id,
      instanceId: instanceId,
      severity: alert.severity,
      message: alert.description
    });

    return alertInstance;
  }

  // Get health status
  async getHealthStatus(instanceId) {
    return this.healthStatuses.get(instanceId);
  }

  // Get health checks
  async getHealthChecks() {
    return Array.from(this.healthChecks.values());
  }

  // Get health alerts
  async getHealthAlerts(filters = {}) {
    let alerts = Array.from(this.healthAlerts.values());
    
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

  // Get health data
  async getHealthData() {
    return this.healthData;
  }

  // Generate unique ID
  generateId() {
    return `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new HealthMonitor();
