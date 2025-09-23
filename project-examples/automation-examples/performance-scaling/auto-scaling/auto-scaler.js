const fs = require('fs');
const path = require('path');
const winston = require('winston');
const axios = require('axios');
const { promisify } = require('util');
require('dotenv').config();

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/auto-scaler.log' }),
    new winston.transports.Console()
  ]
});

class MetricsCollector {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      network: [],
      custom: []
    };
    this.collectionInterval = 30000; // 30 seconds
    this.isCollecting = false;
  }

  async startCollection() {
    if (this.isCollecting) {
      logger.warn('Metrics collection already running');
      return;
    }

    this.isCollecting = true;
    logger.info('Starting metrics collection');

    // Start collection loop
    this.collectionLoop();
  }

  stopCollection() {
    this.isCollecting = false;
    logger.info('Stopped metrics collection');
  }

  async collectionLoop() {
    while (this.isCollecting) {
      try {
        await this.collectMetrics();
        await new Promise(resolve => setTimeout(resolve, this.collectionInterval));
      } catch (error) {
        logger.error('Error in collection loop', { error: error.message });
        await new Promise(resolve => setTimeout(resolve, this.collectionInterval));
      }
    }
  }

  async collectMetrics() {
    try {
      const timestamp = new Date().toISOString();
      
      // Collect CPU metrics
      const cpuMetrics = await this.collectCPUMetrics();
      this.metrics.cpu.push({ timestamp, ...cpuMetrics });

      // Collect memory metrics
      const memoryMetrics = await this.collectMemoryMetrics();
      this.metrics.memory.push({ timestamp, ...memoryMetrics });

      // Collect network metrics
      const networkMetrics = await this.collectNetworkMetrics();
      this.metrics.network.push({ timestamp, ...networkMetrics });

      // Collect custom metrics
      const customMetrics = await this.collectCustomMetrics();
      this.metrics.custom.push({ timestamp, ...customMetrics });

      // Keep only last 1000 data points per metric
      Object.keys(this.metrics).forEach(key => {
        if (this.metrics[key].length > 1000) {
          this.metrics[key] = this.metrics[key].slice(-1000);
        }
      });

      logger.debug('Metrics collected successfully', { timestamp });
    } catch (error) {
      logger.error('Failed to collect metrics', { error: error.message });
    }
  }

  async collectCPUMetrics() {
    try {
      // In a real implementation, this would use system APIs
      // For this example, we'll simulate CPU metrics
      const cpuUsage = Math.random() * 100;
      const loadAverage = Math.random() * 4;
      const cores = require('os').cpus().length;

      return {
        usage: Math.round(cpuUsage * 100) / 100,
        loadAverage: Math.round(loadAverage * 100) / 100,
        cores: cores,
        idle: Math.round((100 - cpuUsage) * 100) / 100
      };
    } catch (error) {
      logger.error('Failed to collect CPU metrics', { error: error.message });
      return { usage: 0, loadAverage: 0, cores: 0, idle: 100 };
    }
  }

  async collectMemoryMetrics() {
    try {
      const totalMemory = require('os').totalmem();
      const freeMemory = require('os').freemem();
      const usedMemory = totalMemory - freeMemory;
      const usage = (usedMemory / totalMemory) * 100;

      return {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usage: Math.round(usage * 100) / 100,
        available: freeMemory
      };
    } catch (error) {
      logger.error('Failed to collect memory metrics', { error: error.message });
      return { total: 0, used: 0, free: 0, usage: 0, available: 0 };
    }
  }

  async collectNetworkMetrics() {
    try {
      // In a real implementation, this would monitor network interfaces
      // For this example, we'll simulate network metrics
      const bytesIn = Math.random() * 1000000;
      const bytesOut = Math.random() * 1000000;
      const packetsIn = Math.random() * 1000;
      const packetsOut = Math.random() * 1000;

      return {
        bytesIn: Math.round(bytesIn),
        bytesOut: Math.round(bytesOut),
        packetsIn: Math.round(packetsIn),
        packetsOut: Math.round(packetsOut),
        totalBytes: Math.round(bytesIn + bytesOut),
        totalPackets: Math.round(packetsIn + packetsOut)
      };
    } catch (error) {
      logger.error('Failed to collect network metrics', { error: error.message });
      return { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0, totalBytes: 0, totalPackets: 0 };
    }
  }

  async collectCustomMetrics() {
    try {
      // In a real implementation, this would collect application-specific metrics
      // For this example, we'll simulate custom metrics
      const requestRate = Math.random() * 1000;
      const responseTime = Math.random() * 1000;
      const errorRate = Math.random() * 10;

      return {
        requestRate: Math.round(requestRate),
        responseTime: Math.round(responseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        activeConnections: Math.floor(Math.random() * 100)
      };
    } catch (error) {
      logger.error('Failed to collect custom metrics', { error: error.message });
      return { requestRate: 0, responseTime: 0, errorRate: 0, activeConnections: 0 };
    }
  }

  getCurrentMetrics() {
    const current = {};
    
    Object.keys(this.metrics).forEach(key => {
      const data = this.metrics[key];
      if (data.length > 0) {
        current[key] = data[data.length - 1];
      } else {
        current[key] = null;
      }
    });

    return current;
  }

  getHistoricalMetrics(timeRange = '1h') {
    const now = new Date();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const range = timeRanges[timeRange] || timeRanges['1h'];
    const cutoff = new Date(now.getTime() - range);

    const filtered = {};
    Object.keys(this.metrics).forEach(key => {
      filtered[key] = this.metrics[key].filter(item => 
        new Date(item.timestamp) >= cutoff
      );
    });

    return filtered;
  }
}

class ScalingPolicy {
  constructor(name, config) {
    this.name = name;
    this.config = {
      enabled: true,
      minReplicas: 1,
      maxReplicas: 10,
      targetCPUUtilization: 70,
      targetMemoryUtilization: 80,
      scaleUpCooldown: 180000, // 3 minutes
      scaleDownCooldown: 300000, // 5 minutes
      ...config
    };
    this.lastScaleTime = 0;
    this.scalingHistory = [];
  }

  shouldScale(currentMetrics, currentReplicas) {
    const now = Date.now();
    const timeSinceLastScale = now - this.lastScaleTime;

    // Check cooldown periods
    if (this.isScalingUp() && timeSinceLastScale < this.config.scaleUpCooldown) {
      return { shouldScale: false, reason: 'scale-up-cooldown' };
    }

    if (this.isScalingDown() && timeSinceLastScale < this.config.scaleDownCooldown) {
      return { shouldScale: false, reason: 'scale-down-cooldown' };
    }

    // Check scaling conditions
    const scaleUp = this.shouldScaleUp(currentMetrics, currentReplicas);
    const scaleDown = this.shouldScaleDown(currentMetrics, currentReplicas);

    if (scaleUp.shouldScale) {
      return { shouldScale: true, action: 'scale-up', ...scaleUp };
    }

    if (scaleDown.shouldScale) {
      return { shouldScale: true, action: 'scale-down', ...scaleDown };
    }

    return { shouldScale: false, reason: 'no-scaling-needed' };
  }

  shouldScaleUp(currentMetrics, currentReplicas) {
    if (currentReplicas >= this.config.maxReplicas) {
      return { shouldScale: false, reason: 'max-replicas-reached' };
    }

    // Check CPU utilization
    if (currentMetrics.cpu && currentMetrics.cpu.usage > this.config.targetCPUUtilization) {
      return {
        shouldScale: true,
        reason: 'cpu-utilization-high',
        currentValue: currentMetrics.cpu.usage,
        targetValue: this.config.targetCPUUtilization
      };
    }

    // Check memory utilization
    if (currentMetrics.memory && currentMetrics.memory.usage > this.config.targetMemoryUtilization) {
      return {
        shouldScale: true,
        reason: 'memory-utilization-high',
        currentValue: currentMetrics.memory.usage,
        targetValue: this.config.targetMemoryUtilization
      };
    }

    // Check custom metrics
    if (currentMetrics.custom) {
      if (currentMetrics.custom.requestRate > 800) {
        return {
          shouldScale: true,
          reason: 'request-rate-high',
          currentValue: currentMetrics.custom.requestRate,
          targetValue: 800
        };
      }

      if (currentMetrics.custom.responseTime > 500) {
        return {
          shouldScale: true,
          reason: 'response-time-high',
          currentValue: currentMetrics.custom.responseTime,
          targetValue: 500
        };
      }
    }

    return { shouldScale: false, reason: 'no-scale-up-conditions-met' };
  }

  shouldScaleDown(currentMetrics, currentReplicas) {
    if (currentReplicas <= this.config.minReplicas) {
      return { shouldScale: false, reason: 'min-replicas-reached' };
    }

    // Check CPU utilization
    if (currentMetrics.cpu && currentMetrics.cpu.usage < (this.config.targetCPUUtilization * 0.5)) {
      return {
        shouldScale: true,
        reason: 'cpu-utilization-low',
        currentValue: currentMetrics.cpu.usage,
        targetValue: this.config.targetCPUUtilization * 0.5
      };
    }

    // Check memory utilization
    if (currentMetrics.memory && currentMetrics.memory.usage < (this.config.targetMemoryUtilization * 0.5)) {
      return {
        shouldScale: true,
        reason: 'memory-utilization-low',
        currentValue: currentMetrics.memory.usage,
        targetValue: this.config.targetMemoryUtilization * 0.5
      };
    }

    // Check custom metrics
    if (currentMetrics.custom) {
      if (currentMetrics.custom.requestRate < 100) {
        return {
          shouldScale: true,
          reason: 'request-rate-low',
          currentValue: currentMetrics.custom.requestRate,
          targetValue: 100
        };
      }

      if (currentMetrics.custom.responseTime < 100) {
        return {
          shouldScale: true,
          reason: 'response-time-low',
          currentValue: currentMetrics.custom.responseTime,
          targetValue: 100
        };
      }
    }

    return { shouldScale: false, reason: 'no-scale-down-conditions-met' };
  }

  isScalingUp() {
    return this.scalingHistory.length > 0 && 
           this.scalingHistory[this.scalingHistory.length - 1].action === 'scale-up';
  }

  isScalingDown() {
    return this.scalingHistory.length > 0 && 
           this.scalingHistory[this.scalingHistory.length - 1].action === 'scale-down';
  }

  recordScaling(action, fromReplicas, toReplicas, reason) {
    const scalingEvent = {
      timestamp: new Date().toISOString(),
      action,
      fromReplicas,
      toReplicas,
      reason,
      policy: this.name
    };

    this.scalingHistory.push(scalingEvent);
    this.lastScaleTime = Date.now();

    // Keep only last 100 scaling events
    if (this.scalingHistory.length > 100) {
      this.scalingHistory = this.scalingHistory.slice(-100);
    }

    logger.info('Scaling event recorded', scalingEvent);
  }

  getScalingHistory() {
    return this.scalingHistory;
  }
}

class AutoScaler {
  constructor() {
    this.metricsCollector = new MetricsCollector();
    this.policies = new Map();
    this.isRunning = false;
    this.scalingInterval = 30000; // 30 seconds
    this.currentReplicas = 2; // Default starting replicas
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Auto-scaler already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting auto-scaler');

    // Start metrics collection
    await this.metricsCollector.startCollection();

    // Start scaling loop
    this.scalingLoop();
  }

  stop() {
    this.isRunning = false;
    this.metricsCollector.stopCollection();
    logger.info('Stopped auto-scaler');
  }

  async scalingLoop() {
    while (this.isRunning) {
      try {
        await this.checkAndScale();
        await new Promise(resolve => setTimeout(resolve, this.scalingInterval));
      } catch (error) {
        logger.error('Error in scaling loop', { error: error.message });
        await new Promise(resolve => setTimeout(resolve, this.scalingInterval));
      }
    }
  }

  async checkAndScale() {
    const currentMetrics = this.metricsCollector.getCurrentMetrics();
    
    for (const [policyName, policy] of this.policies) {
      if (!policy.config.enabled) {
        continue;
      }

      const scalingDecision = policy.shouldScale(currentMetrics, this.currentReplicas);
      
      if (scalingDecision.shouldScale) {
        await this.executeScaling(policy, scalingDecision);
      }
    }
  }

  async executeScaling(policy, scalingDecision) {
    try {
      const { action, reason, currentValue, targetValue } = scalingDecision;
      let newReplicas = this.currentReplicas;

      if (action === 'scale-up') {
        newReplicas = Math.min(this.currentReplicas + 1, policy.config.maxReplicas);
      } else if (action === 'scale-down') {
        newReplicas = Math.max(this.currentReplicas - 1, policy.config.minReplicas);
      }

      if (newReplicas !== this.currentReplicas) {
        // In a real implementation, this would call Kubernetes API
        logger.info('Executing scaling', {
          action,
          fromReplicas: this.currentReplicas,
          toReplicas: newReplicas,
          reason,
          policy: policy.name
        });

        // Simulate scaling delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Record scaling event
        policy.recordScaling(action, this.currentReplicas, newReplicas, reason);
        
        // Update current replicas
        this.currentReplicas = newReplicas;

        logger.info('Scaling completed', {
          action,
          replicas: this.currentReplicas,
          policy: policy.name
        });
      }
    } catch (error) {
      logger.error('Failed to execute scaling', { error: error.message, policy: policy.name });
    }
  }

  addPolicy(name, config) {
    const policy = new ScalingPolicy(name, config);
    this.policies.set(name, policy);
    logger.info('Scaling policy added', { name, config });
  }

  removePolicy(name) {
    if (this.policies.has(name)) {
      this.policies.delete(name);
      logger.info('Scaling policy removed', { name });
    }
  }

  updatePolicy(name, config) {
    if (this.policies.has(name)) {
      const policy = this.policies.get(name);
      policy.config = { ...policy.config, ...config };
      logger.info('Scaling policy updated', { name, config });
    }
  }

  getPolicy(name) {
    return this.policies.get(name);
  }

  getAllPolicies() {
    return Array.from(this.policies.values());
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      currentReplicas: this.currentReplicas,
      policies: this.getAllPolicies().map(policy => ({
        name: policy.name,
        config: policy.config,
        lastScaleTime: policy.lastScaleTime,
        scalingHistory: policy.scalingHistory.slice(-10) // Last 10 scaling events
      })),
      metrics: this.metricsCollector.getCurrentMetrics()
    };
  }

  async scaleTo(targetReplicas, reason = 'manual') {
    if (targetReplicas < 1) {
      throw new Error('Target replicas must be at least 1');
    }

    const action = targetReplicas > this.currentReplicas ? 'scale-up' : 'scale-down';
    
    logger.info('Manual scaling requested', {
      action,
      fromReplicas: this.currentReplicas,
      toReplicas: targetReplicas,
      reason
    });

    // Simulate scaling delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update current replicas
    this.currentReplicas = targetReplicas;

    logger.info('Manual scaling completed', {
      action,
      replicas: this.currentReplicas,
      reason
    });

    return {
      action,
      fromReplicas: this.currentReplicas,
      toReplicas: targetReplicas,
      reason,
      timestamp: new Date().toISOString()
    };
  }
}

// Express server for API endpoints
const express = require('express');
const app = express();
const port = process.env.PORT || 3009;

app.use(express.json());

const autoScaler = new AutoScaler();

// Start auto-scaler on server start
autoScaler.start().catch(error => {
  logger.error('Failed to start auto-scaler', { error: error.message });
});

// API Routes
app.post('/api/scaling/scale', async (req, res) => {
  try {
    const { targetReplicas, reason } = req.body;
    const result = await autoScaler.scaleTo(targetReplicas, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Manual scaling failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/scaling/status', (req, res) => {
  try {
    const status = autoScaler.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Get scaling status failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/scaling/policies', (req, res) => {
  try {
    const policies = autoScaler.getAllPolicies();
    res.json({ success: true, data: policies });
  } catch (error) {
    logger.error('Get scaling policies failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/scaling/policies', (req, res) => {
  try {
    const { name, config } = req.body;
    autoScaler.addPolicy(name, config);
    res.json({ success: true, message: 'Scaling policy created' });
  } catch (error) {
    logger.error('Create scaling policy failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/scaling/policies/:name', (req, res) => {
  try {
    const { name } = req.params;
    const { config } = req.body;
    autoScaler.updatePolicy(name, config);
    res.json({ success: true, message: 'Scaling policy updated' });
  } catch (error) {
    logger.error('Update scaling policy failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/scaling/policies/:name', (req, res) => {
  try {
    const { name } = req.params;
    autoScaler.removePolicy(name);
    res.json({ success: true, message: 'Scaling policy removed' });
  } catch (error) {
    logger.error('Remove scaling policy failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'auto-scaler'
  });
});

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Auto-Scaler running on port ${port}`);
  });
}

module.exports = { AutoScaler, ScalingPolicy, MetricsCollector };
