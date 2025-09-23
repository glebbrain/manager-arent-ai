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
    new winston.transports.File({ filename: 'logs/resource-monitor.log' }),
    new winston.transports.Console()
  ]
});

class ResourceCollector {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      storage: [],
      network: [],
      disk: [],
      processes: []
    };
    this.collectionInterval = 30000; // 30 seconds
    this.isCollecting = false;
  }

  async startCollection() {
    if (this.isCollecting) {
      logger.warn('Resource collection already running');
      return;
    }

    this.isCollecting = true;
    logger.info('Starting resource collection');

    // Start collection loop
    this.collectionLoop();
  }

  stopCollection() {
    this.isCollecting = false;
    logger.info('Stopped resource collection');
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

      // Collect storage metrics
      const storageMetrics = await this.collectStorageMetrics();
      this.metrics.storage.push({ timestamp, ...storageMetrics });

      // Collect network metrics
      const networkMetrics = await this.collectNetworkMetrics();
      this.metrics.network.push({ timestamp, ...networkMetrics });

      // Collect disk metrics
      const diskMetrics = await this.collectDiskMetrics();
      this.metrics.disk.push({ timestamp, ...diskMetrics });

      // Collect process metrics
      const processMetrics = await this.collectProcessMetrics();
      this.metrics.processes.push({ timestamp, ...processMetrics });

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

  async collectStorageMetrics() {
    try {
      // In a real implementation, this would check actual disk usage
      // For this example, we'll simulate storage metrics
      const totalSpace = 100 * 1024 * 1024 * 1024; // 100GB
      const usedSpace = Math.random() * totalSpace;
      const freeSpace = totalSpace - usedSpace;
      const usage = (usedSpace / totalSpace) * 100;

      return {
        total: totalSpace,
        used: usedSpace,
        free: freeSpace,
        usage: Math.round(usage * 100) / 100
      };
    } catch (error) {
      logger.error('Failed to collect storage metrics', { error: error.message });
      return { total: 0, used: 0, free: 0, usage: 0 };
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

  async collectDiskMetrics() {
    try {
      // In a real implementation, this would check disk I/O
      // For this example, we'll simulate disk metrics
      const readBytes = Math.random() * 1000000;
      const writeBytes = Math.random() * 1000000;
      const readOps = Math.random() * 100;
      const writeOps = Math.random() * 100;

      return {
        readBytes: Math.round(readBytes),
        writeBytes: Math.round(writeBytes),
        readOps: Math.round(readOps),
        writeOps: Math.round(writeOps),
        totalBytes: Math.round(readBytes + writeBytes),
        totalOps: Math.round(readOps + writeOps)
      };
    } catch (error) {
      logger.error('Failed to collect disk metrics', { error: error.message });
      return { readBytes: 0, writeBytes: 0, readOps: 0, writeOps: 0, totalBytes: 0, totalOps: 0 };
    }
  }

  async collectProcessMetrics() {
    try {
      // In a real implementation, this would get actual process information
      // For this example, we'll simulate process metrics
      const totalProcesses = Math.floor(Math.random() * 200) + 100;
      const runningProcesses = Math.floor(Math.random() * 50) + 20;
      const sleepingProcesses = totalProcesses - runningProcesses;

      return {
        total: totalProcesses,
        running: runningProcesses,
        sleeping: sleepingProcesses,
        zombie: Math.floor(Math.random() * 5)
      };
    } catch (error) {
      logger.error('Failed to collect process metrics', { error: error.message });
      return { total: 0, running: 0, sleeping: 0, zombie: 0 };
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

class AlertManager {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      cpu: { warning: 80, critical: 95 },
      memory: { warning: 85, critical: 95 },
      storage: { warning: 80, critical: 90 },
      network: { warning: 80, critical: 95 }
    };
    this.alertHistory = [];
  }

  checkAlerts(metrics) {
    const newAlerts = [];

    // Check CPU alerts
    if (metrics.cpu && metrics.cpu.usage) {
      const cpuUsage = metrics.cpu.usage;
      if (cpuUsage >= this.thresholds.cpu.critical) {
        newAlerts.push(this.createAlert('cpu', 'critical', `CPU usage is ${cpuUsage}%`, metrics.cpu));
      } else if (cpuUsage >= this.thresholds.cpu.warning) {
        newAlerts.push(this.createAlert('cpu', 'warning', `CPU usage is ${cpuUsage}%`, metrics.cpu));
      }
    }

    // Check memory alerts
    if (metrics.memory && metrics.memory.usage) {
      const memoryUsage = metrics.memory.usage;
      if (memoryUsage >= this.thresholds.memory.critical) {
        newAlerts.push(this.createAlert('memory', 'critical', `Memory usage is ${memoryUsage}%`, metrics.memory));
      } else if (memoryUsage >= this.thresholds.memory.warning) {
        newAlerts.push(this.createAlert('memory', 'warning', `Memory usage is ${memoryUsage}%`, metrics.memory));
      }
    }

    // Check storage alerts
    if (metrics.storage && metrics.storage.usage) {
      const storageUsage = metrics.storage.usage;
      if (storageUsage >= this.thresholds.storage.critical) {
        newAlerts.push(this.createAlert('storage', 'critical', `Storage usage is ${storageUsage}%`, metrics.storage));
      } else if (storageUsage >= this.thresholds.storage.warning) {
        newAlerts.push(this.createAlert('storage', 'warning', `Storage usage is ${storageUsage}%`, metrics.storage));
      }
    }

    // Check network alerts
    if (metrics.network && metrics.network.totalBytes) {
      const networkUsage = Math.min(100, (metrics.network.totalBytes / 1000000) * 100); // Simulate network usage
      if (networkUsage >= this.thresholds.network.critical) {
        newAlerts.push(this.createAlert('network', 'critical', `Network usage is high`, metrics.network));
      } else if (networkUsage >= this.thresholds.network.warning) {
        newAlerts.push(this.createAlert('network', 'warning', `Network usage is elevated`, metrics.network));
      }
    }

    // Add new alerts
    this.alerts.push(...newAlerts);
    this.alertHistory.push(...newAlerts);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    if (this.alertHistory.length > 10000) {
      this.alertHistory = this.alertHistory.slice(-10000);
    }

    return newAlerts;
  }

  createAlert(type, severity, message, data) {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      data,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  getAllAlerts() {
    return this.alerts;
  }

  getAlertHistory() {
    return this.alertHistory;
  }

  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Alert thresholds updated', { thresholds: this.thresholds });
  }
}

class ResourceMonitor {
  constructor() {
    this.collector = new ResourceCollector();
    this.alertManager = new AlertManager();
    this.isMonitoring = false;
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      logger.warn('Resource monitoring already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting resource monitoring');

    // Start resource collection
    await this.collector.startCollection();

    // Start alert checking loop
    this.alertLoop();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.collector.stopCollection();
    logger.info('Stopped resource monitoring');
  }

  async alertLoop() {
    while (this.isMonitoring) {
      try {
        const currentMetrics = this.collector.getCurrentMetrics();
        const newAlerts = this.alertManager.checkAlerts(currentMetrics);
        
        if (newAlerts.length > 0) {
          logger.warn('New alerts generated', { count: newAlerts.length, alerts: newAlerts });
        }

        await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
      } catch (error) {
        logger.error('Error in alert loop', { error: error.message });
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  getCurrentStatus() {
    const currentMetrics = this.collector.getCurrentMetrics();
    const activeAlerts = this.alertManager.getActiveAlerts();

    return {
      status: activeAlerts.length > 0 ? 'warning' : 'healthy',
      metrics: currentMetrics,
      alerts: {
        active: activeAlerts.length,
        total: this.alertManager.getAllAlerts().length
      },
      timestamp: new Date().toISOString()
    };
  }

  getResourceMetrics(timeRange = '1h') {
    return this.collector.getHistoricalMetrics(timeRange);
  }

  getAlerts() {
    return this.alertManager.getAllAlerts();
  }

  getActiveAlerts() {
    return this.alertManager.getActiveAlerts();
  }

  acknowledgeAlert(alertId) {
    return this.alertManager.acknowledgeAlert(alertId);
  }

  updateAlertThresholds(thresholds) {
    this.alertManager.updateThresholds(thresholds);
  }
}

// Express server for API endpoints
const express = require('express');
const app = express();
const port = process.env.PORT || 3008;

app.use(express.json());

const resourceMonitor = new ResourceMonitor();

// Start monitoring on server start
resourceMonitor.startMonitoring().catch(error => {
  logger.error('Failed to start resource monitoring', { error: error.message });
});

// API Routes
app.get('/api/monitor/resources', (req, res) => {
  try {
    const timeRange = req.query.range || '1h';
    const metrics = resourceMonitor.getResourceMetrics(timeRange);
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('Get resources failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/monitor/status', (req, res) => {
  try {
    const status = resourceMonitor.getCurrentStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Get status failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/monitor/alerts', (req, res) => {
  try {
    const alerts = resourceMonitor.getAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Get alerts failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/monitor/alerts/active', (req, res) => {
  try {
    const alerts = resourceMonitor.getActiveAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Get active alerts failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/monitor/alerts/:alertId/acknowledge', (req, res) => {
  try {
    const { alertId } = req.params;
    const acknowledged = resourceMonitor.acknowledgeAlert(alertId);
    
    if (acknowledged) {
      res.json({ success: true, message: 'Alert acknowledged' });
    } else {
      res.status(404).json({ success: false, error: 'Alert not found' });
    }
  } catch (error) {
    logger.error('Acknowledge alert failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/monitor/configure', (req, res) => {
  try {
    const { thresholds } = req.body;
    resourceMonitor.updateAlertThresholds(thresholds);
    res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    logger.error('Configure monitoring failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'resource-monitor'
  });
});

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Resource Monitor running on port ${port}`);
  });
}

module.exports = { ResourceMonitor, ResourceCollector, AlertManager };
