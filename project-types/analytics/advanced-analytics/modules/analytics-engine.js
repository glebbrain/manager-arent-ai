const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class AnalyticsEngine {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/analytics-engine.log' })
      ]
    });
    
    this.metrics = new Map();
    this.aggregations = new Map();
    this.realTimeData = new Map();
  }

  // Process incoming data
  async processData(data, metadata = {}) {
    try {
      const processedData = {
        id: this.generateId(),
        timestamp: new Date(),
        data: data,
        metadata: metadata,
        processedAt: new Date()
      };

      // Store in real-time data
      this.realTimeData.set(processedData.id, processedData);

      // Update metrics
      await this.updateMetrics(processedData);

      // Trigger real-time updates
      await this.triggerRealTimeUpdates(processedData);

      this.logger.info('Data processed successfully', { id: processedData.id });
      return processedData;
    } catch (error) {
      this.logger.error('Error processing data:', error);
      throw error;
    }
  }

  // Update metrics based on processed data
  async updateMetrics(data) {
    const { data: rawData, metadata } = data;
    
    // Extract key metrics
    const metrics = this.extractMetrics(rawData, metadata);
    
    for (const [key, value] of Object.entries(metrics)) {
      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }
      
      this.metrics.get(key).push({
        value,
        timestamp: data.timestamp
      });
    }
  }

  // Extract metrics from data
  extractMetrics(data, metadata) {
    const metrics = {};
    
    // Basic metrics
    metrics.count = 1;
    metrics.timestamp = new Date();
    
    // Data-specific metrics
    if (typeof data === 'object') {
      metrics.keys = Object.keys(data).length;
      metrics.size = JSON.stringify(data).length;
    }
    
    // Metadata metrics
    if (metadata.source) {
      metrics.source = metadata.source;
    }
    
    if (metadata.userId) {
      metrics.userId = metadata.userId;
    }
    
    return metrics;
  }

  // Get aggregated metrics
  async getAggregatedMetrics(timeRange = '1h', aggregationType = 'sum') {
    const endTime = new Date();
    const startTime = moment(endTime).subtract(this.parseTimeRange(timeRange)).toDate();
    
    const aggregated = {};
    
    for (const [key, values] of this.metrics.entries()) {
      const filteredValues = values.filter(v => 
        v.timestamp >= startTime && v.timestamp <= endTime
      );
      
      if (filteredValues.length > 0) {
        aggregated[key] = this.aggregateValues(filteredValues, aggregationType);
      }
    }
    
    return aggregated;
  }

  // Aggregate values based on type
  aggregateValues(values, type) {
    const numericValues = values.map(v => v.value).filter(v => typeof v === 'number');
    
    if (numericValues.length === 0) return null;
    
    switch (type) {
      case 'sum':
        return numericValues.reduce((a, b) => a + b, 0);
      case 'avg':
        return numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      case 'min':
        return Math.min(...numericValues);
      case 'max':
        return Math.max(...numericValues);
      case 'count':
        return numericValues.length;
      default:
        return numericValues;
    }
  }

  // Parse time range string
  parseTimeRange(timeRange) {
    const match = timeRange.match(/^(\d+)([smhd])$/);
    if (!match) return { amount: 1, unit: 'h' };
    
    const amount = parseInt(match[1]);
    const unit = match[2];
    
    const unitMap = {
      's': 'seconds',
      'm': 'minutes',
      'h': 'hours',
      'd': 'days'
    };
    
    return { amount, unit: unitMap[unit] };
  }

  // Trigger real-time updates
  async triggerRealTimeUpdates(data) {
    // This would typically send updates to connected clients
    // via WebSocket or Server-Sent Events
    this.logger.info('Real-time update triggered', { id: data.id });
  }

  // Generate unique ID
  generateId() {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get real-time data
  getRealTimeData(limit = 100) {
    const data = Array.from(this.realTimeData.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    return data;
  }

  // Clear old data
  clearOldData(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    
    // Clear real-time data
    for (const [id, data] of this.realTimeData.entries()) {
      if (data.timestamp < cutoff) {
        this.realTimeData.delete(id);
      }
    }
    
    // Clear metrics
    for (const [key, values] of this.metrics.entries()) {
      const filtered = values.filter(v => v.timestamp >= cutoff);
      this.metrics.set(key, filtered);
    }
  }
}

module.exports = new AnalyticsEngine();
