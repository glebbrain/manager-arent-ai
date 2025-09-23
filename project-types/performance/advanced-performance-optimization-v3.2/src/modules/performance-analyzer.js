const EventEmitter = require('events');
const logger = require('./logger');

/**
 * Performance Analyzer Module
 * Provides historical performance analysis and trends
 */
class PerformanceAnalyzer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled || true,
      analysisInterval: config.analysisInterval || 60000, // 1 minute
      historyRetention: config.historyRetention || 24 * 60 * 60 * 1000, // 24 hours
      trendWindow: config.trendWindow || 10, // 10 data points for trend analysis
      ...config
    };

    this.isRunning = false;
    this.analysisInterval = null;
    this.performanceData = [];
    this.trends = {
      cpu: 'stable',
      memory: 'stable',
      responseTime: 'stable',
      throughput: 'stable',
      errorRate: 'stable'
    };
    this.anomalies = [];
    this.predictions = {};
  }

  /**
   * Start performance analyzer
   */
  async start() {
    if (!this.config.enabled) {
      logger.info('Performance analyzer is disabled');
      return;
    }

    try {
      this.analysisInterval = setInterval(() => {
        this.performAnalysis();
      }, this.config.analysisInterval);

      this.isRunning = true;
      logger.info('Performance analyzer started');
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start performance analyzer:', error);
      throw error;
    }
  }

  /**
   * Stop performance analyzer
   */
  async stop() {
    try {
      if (this.analysisInterval) {
        clearInterval(this.analysisInterval);
        this.analysisInterval = null;
      }

      this.isRunning = false;
      logger.info('Performance analyzer stopped');
      this.emit('stopped');
    } catch (error) {
      logger.error('Error stopping performance analyzer:', error);
      throw error;
    }
  }

  /**
   * Add performance data point
   */
  addDataPoint(data) {
    const dataPoint = {
      timestamp: new Date(),
      cpu: data.cpu || 0,
      memory: data.memory || 0,
      responseTime: data.responseTime || 0,
      throughput: data.throughput || 0,
      errorRate: data.errorRate || 0,
      activeConnections: data.activeConnections || 0,
      ...data
    };

    this.performanceData.push(dataPoint);
    
    // Clean up old data
    this.cleanupOldData();
    
    this.emit('dataPointAdded', dataPoint);
  }

  /**
   * Clean up old performance data
   */
  cleanupOldData() {
    const cutoffTime = new Date(Date.now() - this.config.historyRetention);
    this.performanceData = this.performanceData.filter(
      data => data.timestamp > cutoffTime
    );
  }

  /**
   * Perform performance analysis
   */
  performAnalysis() {
    if (this.performanceData.length < 2) return;

    try {
      this.analyzeTrends();
      this.detectAnomalies();
      this.generatePredictions();
      this.emit('analysisCompleted', {
        trends: this.trends,
        anomalies: this.anomalies,
        predictions: this.predictions
      });
    } catch (error) {
      logger.error('Error performing performance analysis:', error);
    }
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends() {
    const recentData = this.getRecentData(this.config.trendWindow);
    if (recentData.length < 2) return;

    const metrics = ['cpu', 'memory', 'responseTime', 'throughput', 'errorRate'];
    
    metrics.forEach(metric => {
      this.trends[metric] = this.calculateTrend(recentData, metric);
    });
  }

  /**
   * Calculate trend for a specific metric
   */
  calculateTrend(data, metric) {
    if (data.length < 2) return 'stable';

    const values = data.map(d => d[metric]);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Detect performance anomalies
   */
  detectAnomalies() {
    const recentData = this.getRecentData(20);
    if (recentData.length < 10) return;

    const metrics = ['cpu', 'memory', 'responseTime', 'throughput', 'errorRate'];
    
    metrics.forEach(metric => {
      const values = recentData.map(d => d[metric]);
      const anomalies = this.findAnomalies(values, metric);
      
      anomalies.forEach(anomaly => {
        this.anomalies.push({
          metric,
          value: anomaly.value,
          timestamp: recentData[anomaly.index].timestamp,
          severity: anomaly.severity,
          description: anomaly.description
        });
      });
    });

    // Keep only recent anomalies
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
    this.anomalies = this.anomalies.filter(a => a.timestamp > cutoffTime);
  }

  /**
   * Find anomalies in a data series
   */
  findAnomalies(values, metric) {
    const anomalies = [];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    values.forEach((value, index) => {
      const zScore = Math.abs(value - mean) / stdDev;
      
      if (zScore > 3) {
        anomalies.push({
          index,
          value,
          severity: 'high',
          description: `Extreme ${metric} value detected: ${value}`
        });
      } else if (zScore > 2) {
        anomalies.push({
          index,
          value,
          severity: 'medium',
          description: `Unusual ${metric} value detected: ${value}`
        });
      }
    });

    return anomalies;
  }

  /**
   * Generate performance predictions
   */
  generatePredictions() {
    const recentData = this.getRecentData(30);
    if (recentData.length < 10) return;

    const metrics = ['cpu', 'memory', 'responseTime', 'throughput', 'errorRate'];
    
    metrics.forEach(metric => {
      const values = recentData.map(d => d[metric]);
      this.predictions[metric] = this.predictNextValue(values);
    });
  }

  /**
   * Predict next value using simple linear regression
   */
  predictNextValue(values) {
    if (values.length < 2) return values[0] || 0;

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    // Calculate linear regression
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next value
    const nextX = n;
    const predictedValue = slope * nextX + intercept;

    return {
      value: Math.max(0, predictedValue),
      confidence: this.calculateConfidence(values, predictedValue),
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
    };
  }

  /**
   * Calculate prediction confidence
   */
  calculateConfidence(values, predictedValue) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const error = Math.abs(predictedValue - mean);
    const confidence = Math.max(0, Math.min(100, 100 - (error / stdDev) * 100));
    
    return Math.round(confidence);
  }

  /**
   * Get recent performance data
   */
  getRecentData(count) {
    return this.performanceData.slice(-count);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    if (this.performanceData.length === 0) {
      return {
        totalDataPoints: 0,
        timeRange: null,
        averages: {},
        maximums: {},
        minimums: {},
        trends: this.trends,
        anomalies: this.anomalies.length,
        predictions: this.predictions
      };
    }

    const metrics = ['cpu', 'memory', 'responseTime', 'throughput', 'errorRate', 'activeConnections'];
    const summary = {
      totalDataPoints: this.performanceData.length,
      timeRange: {
        start: this.performanceData[0].timestamp,
        end: this.performanceData[this.performanceData.length - 1].timestamp
      },
      averages: {},
      maximums: {},
      minimums: {},
      trends: this.trends,
      anomalies: this.anomalies.length,
      predictions: this.predictions
    };

    metrics.forEach(metric => {
      const values = this.performanceData.map(d => d[metric]);
      summary.averages[metric] = Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100;
      summary.maximums[metric] = Math.max(...values);
      summary.minimums[metric] = Math.min(...values);
    });

    return summary;
  }

  /**
   * Get performance trends
   */
  getTrends() {
    return { ...this.trends };
  }

  /**
   * Get performance anomalies
   */
  getAnomalies(limit = 50) {
    return this.anomalies.slice(-limit);
  }

  /**
   * Get performance predictions
   */
  getPredictions() {
    return { ...this.predictions };
  }

  /**
   * Get performance data for time range
   */
  getDataForTimeRange(startTime, endTime) {
    return this.performanceData.filter(
      data => data.timestamp >= startTime && data.timestamp <= endTime
    );
  }

  /**
   * Get performance data aggregated by time interval
   */
  getAggregatedData(intervalMs = 300000) { // 5 minutes default
    if (this.performanceData.length === 0) return [];

    const aggregated = [];
    const intervalStart = this.performanceData[0].timestamp.getTime();
    const intervalEnd = intervalStart + intervalMs;

    let currentInterval = {
      start: new Date(intervalStart),
      end: new Date(intervalEnd),
      data: []
    };

    this.performanceData.forEach(dataPoint => {
      if (dataPoint.timestamp.getTime() >= intervalEnd) {
        // Process current interval
        if (currentInterval.data.length > 0) {
          aggregated.push(this.aggregateIntervalData(currentInterval));
        }

        // Start new interval
        const newStart = intervalEnd;
        const newEnd = newStart + intervalMs;
        currentInterval = {
          start: new Date(newStart),
          end: new Date(newEnd),
          data: [dataPoint]
        };
      } else {
        currentInterval.data.push(dataPoint);
      }
    });

    // Process last interval
    if (currentInterval.data.length > 0) {
      aggregated.push(this.aggregateIntervalData(currentInterval));
    }

    return aggregated;
  }

  /**
   * Aggregate data for a time interval
   */
  aggregateIntervalData(interval) {
    const metrics = ['cpu', 'memory', 'responseTime', 'throughput', 'errorRate', 'activeConnections'];
    const aggregated = {
      start: interval.start,
      end: interval.end,
      dataPoints: interval.data.length
    };

    metrics.forEach(metric => {
      const values = interval.data.map(d => d[metric]);
      aggregated[metric] = {
        average: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100,
        maximum: Math.max(...values),
        minimum: Math.min(...values)
      };
    });

    return aggregated;
  }

  /**
   * Get performance analyzer status
   */
  getStatus() {
    return {
      running: this.isRunning,
      dataPoints: this.performanceData.length,
      anomalies: this.anomalies.length,
      trends: Object.keys(this.trends).length,
      predictions: Object.keys(this.predictions).length
    };
  }

  /**
   * Clear performance data
   */
  clearData() {
    this.performanceData = [];
    this.anomalies = [];
    this.predictions = {};
    logger.info('Performance data cleared');
  }

  /**
   * Export performance data
   */
  exportData(format = 'json') {
    const data = {
      summary: this.getPerformanceSummary(),
      rawData: this.performanceData,
      trends: this.trends,
      anomalies: this.anomalies,
      predictions: this.predictions
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(this.performanceData);
    }

    return data;
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = ['timestamp', 'cpu', 'memory', 'responseTime', 'throughput', 'errorRate', 'activeConnections'];
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }
}

module.exports = PerformanceAnalyzer;
