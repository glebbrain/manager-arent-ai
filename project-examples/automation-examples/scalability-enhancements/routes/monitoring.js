const express = require('express');
const router = express.Router();
const performanceMonitor = require('../modules/performance-monitor');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/monitoring-routes.log' })
  ]
});

// Get system overview
router.get('/overview', async (req, res) => {
  try {
    const summary = await performanceMonitor.getPerformanceSummary();
    res.json(summary);
  } catch (error) {
    logger.error('Error getting system overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get real-time metrics
router.get('/metrics/realtime', async (req, res) => {
  try {
    const metrics = await performanceMonitor.getCurrentMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting real-time metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics history
router.get('/metrics/history', async (req, res) => {
  try {
    const { limit = 100, timeRange = '1h' } = req.query;
    
    const history = await performanceMonitor.getMetricsHistory(parseInt(limit));
    res.json(history);
  } catch (error) {
    logger.error('Error getting metrics history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const { severity, acknowledged, resolved } = req.query;
    const filters = {};
    
    if (severity) filters.severity = severity;
    if (acknowledged !== undefined) filters.acknowledged = acknowledged === 'true';
    if (resolved !== undefined) filters.resolved = resolved === 'true';
    
    const alerts = await performanceMonitor.getAlerts(filters);
    res.json(alerts);
  } catch (error) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Acknowledge alert
router.post('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await performanceMonitor.acknowledgeAlert(id);
    res.json(alert);
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve alert
router.post('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await performanceMonitor.resolveAlert(id);
    res.json(alert);
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alert statistics
router.get('/alerts/stats', async (req, res) => {
  try {
    const alerts = await performanceMonitor.getAlerts();
    
    const stats = {
      total: alerts.length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      },
      byStatus: {
        acknowledged: alerts.filter(a => a.acknowledged).length,
        resolved: alerts.filter(a => a.resolved).length,
        active: alerts.filter(a => !a.resolved).length
      }
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error getting alert statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get performance trends
router.get('/trends', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const history = await performanceMonitor.getMetricsHistory(1000);
    const trends = {
      cpu: calculateTrend(history.map(m => m.cpu.usage.usage)),
      memory: calculateTrend(history.map(m => m.memory.process.usagePercent)),
      load: calculateTrend(history.map(m => m.cpu.loadAverage['1m']))
    };
    
    res.json(trends);
  } catch (error) {
    logger.error('Error getting performance trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get resource utilization
router.get('/resources', async (req, res) => {
  try {
    const metrics = await performanceMonitor.getCurrentMetrics();
    
    if (!metrics) {
      return res.status(404).json({ error: 'No metrics available' });
    }
    
    const utilization = {
      cpu: {
        usage: metrics.cpu.usage.usage,
        cores: metrics.cpu.cores,
        loadAverage: metrics.cpu.loadAverage
      },
      memory: {
        system: {
          total: metrics.system.totalMemory,
          used: metrics.system.totalMemory - metrics.system.freeMemory,
          free: metrics.system.freeMemory,
          usagePercent: ((metrics.system.totalMemory - metrics.system.freeMemory) / metrics.system.totalMemory) * 100
        },
        process: {
          rss: metrics.process.memory.rss,
          heapTotal: metrics.process.memory.heapTotal,
          heapUsed: metrics.process.memory.heapUsed,
          usagePercent: (metrics.process.memory.heapUsed / metrics.process.memory.heapTotal) * 100
        }
      },
      disk: metrics.disk,
      network: metrics.network
    };
    
    res.json(utilization);
  } catch (error) {
    logger.error('Error getting resource utilization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system health score
router.get('/health-score', async (req, res) => {
  try {
    const summary = await performanceMonitor.getPerformanceSummary();
    
    if (!summary) {
      return res.status(404).json({ error: 'No performance data available' });
    }
    
    let score = 100;
    
    // Deduct points for high resource usage
    if (summary.memory.usage > 90) score -= 30;
    else if (summary.memory.usage > 80) score -= 20;
    else if (summary.memory.usage > 70) score -= 10;
    
    if (summary.cpu.usage > 90) score -= 30;
    else if (summary.cpu.usage > 80) score -= 20;
    else if (summary.cpu.usage > 70) score -= 10;
    
    // Deduct points for alerts
    if (summary.alerts.critical > 0) score -= 40;
    else if (summary.alerts.high > 0) score -= 20;
    else if (summary.alerts.total > 5) score -= 10;
    
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    const healthScore = {
      score,
      status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
      factors: {
        memoryUsage: summary.memory.usage,
        cpuUsage: summary.cpu.usage,
        alerts: summary.alerts.total,
        criticalAlerts: summary.alerts.critical
      }
    };
    
    res.json(healthScore);
  } catch (error) {
    logger.error('Error getting system health score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get monitoring configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      monitoringEnabled: true,
      collectionInterval: 5000,
      retentionPeriod: '7d',
      alertThresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 80, critical: 95 }
      }
    };
    
    res.json(config);
  } catch (error) {
    logger.error('Error getting monitoring configuration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update monitoring configuration
router.put('/config', async (req, res) => {
  try {
    const updates = req.body;
    
    // Update configuration (in a real implementation, this would persist to database)
    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    logger.error('Error updating monitoring configuration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate trend
function calculateTrend(values) {
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

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'monitoring',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
