const EventEmitter = require('events');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * Edge Analytics - Real-time analytics at the edge
 * Version: 3.1.0
 * Features:
 * - Real-time data processing
 * - Stream analytics with sub-second latency
 * - Edge data aggregation and preprocessing
 * - Intelligent data filtering and compression
 * - Predictive analytics at the edge
 */
class EdgeAnalytics extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Analytics Configuration
      realTimeProcessing: config.realTimeProcessing !== false,
      dataRetention: config.dataRetention || 3600, // 1 hour in seconds
      compressionEnabled: config.compressionEnabled !== false,
      batchSize: config.batchSize || 100,
      processingInterval: config.processingInterval || 100, // 100ms
      
      // Stream Processing
      windowSize: config.windowSize || 1000, // 1 second
      slideSize: config.slideSize || 100, // 100ms
      watermarkDelay: config.watermarkDelay || 5000, // 5 seconds
      
      // Data Processing
      maxDataPoints: config.maxDataPoints || 10000,
      aggregationFunctions: config.aggregationFunctions || ['sum', 'avg', 'min', 'max', 'count'],
      anomalyDetection: config.anomalyDetection !== false,
      trendAnalysis: config.trendAnalysis !== false,
      
      // Performance
      maxConcurrentStreams: config.maxConcurrentStreams || 50,
      memoryLimit: config.memoryLimit || 512 * 1024 * 1024, // 512MB
      cpuLimit: config.cpuLimit || 0.6, // 60% CPU usage
      
      // Monitoring
      metricsEnabled: config.metricsEnabled !== false,
      alertingEnabled: config.alertingEnabled !== false,
      
      ...config
    };
    
    // Internal state
    this.streams = new Map();
    this.dataBuffers = new Map();
    this.aggregatedData = new Map();
    this.analyticsResults = new Map();
    this.alerts = [];
    this.metrics = {
      totalDataPoints: 0,
      processedDataPoints: 0,
      droppedDataPoints: 0,
      averageProcessingTime: 0,
      averageLatency: 0,
      activeStreams: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      alertsGenerated: 0,
      anomaliesDetected: 0,
      trendsIdentified: 0,
      lastProcessed: null
    };
    
    // Performance monitoring
    this.performanceHistory = [];
    this.processingQueue = [];
    this.isProcessing = false;
    
    // Initialize analytics engine
    this.initialize();
  }

  /**
   * Initialize analytics engine
   */
  async initialize() {
    try {
      // Start processing loop
      this.startProcessingLoop();
      
      // Start cleanup loop
      this.startCleanupLoop();
      
      // Start monitoring loop
      this.startMonitoringLoop();
      
      logger.info('Edge Analytics initialized', {
        realTimeProcessing: this.config.realTimeProcessing,
        dataRetention: this.config.dataRetention,
        compressionEnabled: this.config.compressionEnabled
      });
      
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Edge Analytics:', error);
      throw error;
    }
  }

  /**
   * Create analytics stream
   */
  createStream(streamId, config = {}) {
    try {
      const streamConfig = {
        id: streamId,
        name: config.name || `Stream_${streamId}`,
        type: config.type || 'time-series',
        schema: config.schema || {},
        windowSize: config.windowSize || this.config.windowSize,
        slideSize: config.slideSize || this.config.slideSize,
        aggregationFunctions: config.aggregationFunctions || this.config.aggregationFunctions,
        filters: config.filters || [],
        transformations: config.transformations || [],
        alerts: config.alerts || [],
        createdAt: Date.now(),
        isActive: true,
        ...config
      };
      
      // Initialize stream data structures
      this.streams.set(streamId, streamConfig);
      this.dataBuffers.set(streamId, []);
      this.aggregatedData.set(streamId, new Map());
      this.analyticsResults.set(streamId, []);
      
      this.metrics.activeStreams++;
      
      logger.info('Analytics stream created', {
        streamId,
        name: streamConfig.name,
        type: streamConfig.type
      });
      
      this.emit('streamCreated', { streamId, config: streamConfig });
      
      return streamConfig;
      
    } catch (error) {
      logger.error('Failed to create analytics stream:', { streamId, error: error.message });
      throw error;
    }
  }

  /**
   * Add data point to stream
   */
  async addDataPoint(streamId, dataPoint) {
    try {
      const stream = this.streams.get(streamId);
      if (!stream) {
        throw new Error(`Stream not found: ${streamId}`);
      }
      
      if (!stream.isActive) {
        throw new Error(`Stream is not active: ${streamId}`);
      }
      
      // Validate data point
      const validatedDataPoint = this.validateDataPoint(dataPoint, stream.schema);
      
      // Add timestamp if not present
      if (!validatedDataPoint.timestamp) {
        validatedDataPoint.timestamp = Date.now();
      }
      
      // Add to data buffer
      const buffer = this.dataBuffers.get(streamId);
      buffer.push(validatedDataPoint);
      
      // Maintain buffer size
      if (buffer.length > this.config.maxDataPoints) {
        buffer.shift(); // Remove oldest data point
        this.metrics.droppedDataPoints++;
      }
      
      this.metrics.totalDataPoints++;
      
      // Process in real-time if enabled
      if (this.config.realTimeProcessing) {
        await this.processDataPoint(streamId, validatedDataPoint);
      }
      
      logger.debug('Data point added to stream', {
        streamId,
        dataPoint: validatedDataPoint,
        bufferSize: buffer.length
      });
      
      this.emit('dataPointAdded', { streamId, dataPoint: validatedDataPoint });
      
    } catch (error) {
      logger.error('Failed to add data point:', { streamId, error: error.message });
      throw error;
    }
  }

  /**
   * Validate data point against stream schema
   */
  validateDataPoint(dataPoint, schema) {
    const validated = { ...dataPoint };
    
    // Validate required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in validated)) {
          throw new Error(`Required field missing: ${field}`);
        }
      }
    }
    
    // Validate field types
    if (schema.properties) {
      for (const [field, definition] of Object.entries(schema.properties)) {
        if (field in validated) {
          const value = validated[field];
          const expectedType = definition.type;
          
          if (expectedType === 'number' && typeof value !== 'number') {
            validated[field] = parseFloat(value);
          } else if (expectedType === 'integer' && typeof value !== 'number') {
            validated[field] = parseInt(value);
          } else if (expectedType === 'string' && typeof value !== 'string') {
            validated[field] = String(value);
          } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
            validated[field] = Boolean(value);
          }
        }
      }
    }
    
    return validated;
  }

  /**
   * Process data point in real-time
   */
  async processDataPoint(streamId, dataPoint) {
    try {
      const startTime = Date.now();
      
      // Apply filters
      if (!this.passesFilters(dataPoint, streamId)) {
        return;
      }
      
      // Apply transformations
      const transformedDataPoint = await this.applyTransformations(dataPoint, streamId);
      
      // Update aggregations
      await this.updateAggregations(streamId, transformedDataPoint);
      
      // Detect anomalies
      if (this.config.anomalyDetection) {
        await this.detectAnomalies(streamId, transformedDataPoint);
      }
      
      // Analyze trends
      if (this.config.trendAnalysis) {
        await this.analyzeTrends(streamId, transformedDataPoint);
      }
      
      // Check alerts
      await this.checkAlerts(streamId, transformedDataPoint);
      
      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);
      
      this.emit('dataPointProcessed', {
        streamId,
        dataPoint: transformedDataPoint,
        processingTime
      });
      
    } catch (error) {
      logger.error('Failed to process data point:', { streamId, error: error.message });
      this.updateMetrics(0, false);
    }
  }

  /**
   * Check if data point passes filters
   */
  passesFilters(dataPoint, streamId) {
    const stream = this.streams.get(streamId);
    if (!stream.filters || stream.filters.length === 0) {
      return true;
    }
    
    for (const filter of stream.filters) {
      if (!this.evaluateFilter(dataPoint, filter)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Evaluate single filter
   */
  evaluateFilter(dataPoint, filter) {
    const { field, operator, value } = filter;
    const fieldValue = this.getNestedValue(dataPoint, field);
    
    switch (operator) {
      case 'eq':
        return fieldValue === value;
      case 'ne':
        return fieldValue !== value;
      case 'gt':
        return fieldValue > value;
      case 'gte':
        return fieldValue >= value;
      case 'lt':
        return fieldValue < value;
      case 'lte':
        return fieldValue <= value;
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'nin':
        return Array.isArray(value) && !value.includes(fieldValue);
      case 'regex':
        return new RegExp(value).test(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return true;
    }
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Apply transformations to data point
   */
  async applyTransformations(dataPoint, streamId) {
    const stream = this.streams.get(streamId);
    if (!stream.transformations || stream.transformations.length === 0) {
      return dataPoint;
    }
    
    let transformed = { ...dataPoint };
    
    for (const transformation of stream.transformations) {
      transformed = await this.applyTransformation(transformed, transformation);
    }
    
    return transformed;
  }

  /**
   * Apply single transformation
   */
  async applyTransformation(dataPoint, transformation) {
    const { type, config } = transformation;
    
    switch (type) {
      case 'scale':
        return this.scaleDataPoint(dataPoint, config);
      case 'normalize':
        return this.normalizeDataPoint(dataPoint, config);
      case 'log':
        return this.logTransform(dataPoint, config);
      case 'sqrt':
        return this.sqrtTransform(dataPoint, config);
      case 'custom':
        return this.customTransform(dataPoint, config);
      default:
        return dataPoint;
    }
  }

  /**
   * Scale data point
   */
  scaleDataPoint(dataPoint, config) {
    const { field, min, max } = config;
    const value = dataPoint[field];
    const scaled = ((value - min) / (max - min)) * (config.newMax - config.newMin) + config.newMin;
    return { ...dataPoint, [field]: scaled };
  }

  /**
   * Normalize data point
   */
  normalizeDataPoint(dataPoint, config) {
    const { field, mean, std } = config;
    const value = dataPoint[field];
    const normalized = (value - mean) / std;
    return { ...dataPoint, [field]: normalized };
  }

  /**
   * Log transform
   */
  logTransform(dataPoint, config) {
    const { field } = config;
    const value = dataPoint[field];
    const transformed = Math.log(value + 1); // Add 1 to handle zero values
    return { ...dataPoint, [field]: transformed };
  }

  /**
   * Square root transform
   */
  sqrtTransform(dataPoint, config) {
    const { field } = config;
    const value = dataPoint[field];
    const transformed = Math.sqrt(Math.max(0, value));
    return { ...dataPoint, [field]: transformed };
  }

  /**
   * Custom transform
   */
  async customTransform(dataPoint, config) {
    // Implement custom transformation logic
    return dataPoint;
  }

  /**
   * Update aggregations
   */
  async updateAggregations(streamId, dataPoint) {
    const stream = this.streams.get(streamId);
    const aggregated = this.aggregatedData.get(streamId);
    
    // Create time window key
    const windowKey = this.getTimeWindowKey(dataPoint.timestamp, stream.windowSize);
    
    if (!aggregated.has(windowKey)) {
      aggregated.set(windowKey, {
        windowStart: this.getWindowStart(dataPoint.timestamp, stream.windowSize),
        windowEnd: this.getWindowEnd(dataPoint.timestamp, stream.windowSize),
        dataPoints: [],
        aggregations: {}
      });
    }
    
    const window = aggregated.get(windowKey);
    window.dataPoints.push(dataPoint);
    
    // Update aggregations
    for (const field of Object.keys(dataPoint)) {
      if (field === 'timestamp') continue;
      
      if (!window.aggregations[field]) {
        window.aggregations[field] = {
          sum: 0,
          count: 0,
          min: Infinity,
          max: -Infinity,
          values: []
        };
      }
      
      const value = dataPoint[field];
      if (typeof value === 'number') {
        const agg = window.aggregations[field];
        agg.sum += value;
        agg.count++;
        agg.min = Math.min(agg.min, value);
        agg.max = Math.max(agg.max, value);
        agg.values.push(value);
      }
    }
  }

  /**
   * Get time window key
   */
  getTimeWindowKey(timestamp, windowSize) {
    return Math.floor(timestamp / windowSize) * windowSize;
  }

  /**
   * Get window start time
   */
  getWindowStart(timestamp, windowSize) {
    return Math.floor(timestamp / windowSize) * windowSize;
  }

  /**
   * Get window end time
   */
  getWindowEnd(timestamp, windowSize) {
    return this.getWindowStart(timestamp, windowSize) + windowSize;
  }

  /**
   * Detect anomalies in data point
   */
  async detectAnomalies(streamId, dataPoint) {
    try {
      const stream = this.streams.get(streamId);
      const buffer = this.dataBuffers.get(streamId);
      
      if (buffer.length < 10) {
        return; // Need more data for anomaly detection
      }
      
      // Simple statistical anomaly detection
      for (const field of Object.keys(dataPoint)) {
        if (field === 'timestamp' || typeof dataPoint[field] !== 'number') {
          continue;
        }
        
        const values = buffer.slice(-100).map(dp => dp[field]).filter(v => typeof v === 'number');
        if (values.length < 5) continue;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        const zScore = Math.abs((dataPoint[field] - mean) / stdDev);
        const threshold = 3; // 3-sigma rule
        
        if (zScore > threshold) {
          this.metrics.anomaliesDetected++;
          
          const anomaly = {
            id: uuidv4(),
            streamId,
            field,
            value: dataPoint[field],
            zScore,
            threshold,
            timestamp: dataPoint.timestamp,
            detectedAt: Date.now()
          };
          
          this.emit('anomalyDetected', anomaly);
          
          logger.warn('Anomaly detected', anomaly);
        }
      }
    } catch (error) {
      logger.error('Anomaly detection failed:', { streamId, error: error.message });
    }
  }

  /**
   * Analyze trends in data
   */
  async analyzeTrends(streamId, dataPoint) {
    try {
      const buffer = this.dataBuffers.get(streamId);
      
      if (buffer.length < 20) {
        return; // Need more data for trend analysis
      }
      
      // Simple linear trend analysis
      for (const field of Object.keys(dataPoint)) {
        if (field === 'timestamp' || typeof dataPoint[field] !== 'number') {
          continue;
        }
        
        const recentData = buffer.slice(-20);
        const values = recentData.map(dp => dp[field]).filter(v => typeof v === 'number');
        const timestamps = recentData.map(dp => dp.timestamp);
        
        if (values.length < 10) continue;
        
        // Calculate linear regression
        const trend = this.calculateLinearTrend(timestamps, values);
        
        if (Math.abs(trend.slope) > 0.1) { // Significant trend
          this.metrics.trendsIdentified++;
          
          const trendResult = {
            id: uuidv4(),
            streamId,
            field,
            slope: trend.slope,
            rSquared: trend.rSquared,
            direction: trend.slope > 0 ? 'increasing' : 'decreasing',
            strength: Math.abs(trend.slope),
            timestamp: dataPoint.timestamp,
            analyzedAt: Date.now()
          };
          
          this.emit('trendIdentified', trendResult);
          
          logger.info('Trend identified', trendResult);
        }
      }
    } catch (error) {
      logger.error('Trend analysis failed:', { streamId, error: error.message });
    }
  }

  /**
   * Calculate linear trend
   */
  calculateLinearTrend(x, y) {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, val, i) => sum + Math.pow(val - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return { slope, intercept, rSquared };
  }

  /**
   * Check alerts
   */
  async checkAlerts(streamId, dataPoint) {
    const stream = this.streams.get(streamId);
    if (!stream.alerts || stream.alerts.length === 0) {
      return;
    }
    
    for (const alert of stream.alerts) {
      if (this.evaluateAlert(dataPoint, alert)) {
        await this.triggerAlert(streamId, alert, dataPoint);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  evaluateAlert(dataPoint, alert) {
    const { condition, threshold, operator } = alert;
    const value = this.getNestedValue(dataPoint, condition);
    
    if (typeof value !== 'number') {
      return false;
    }
    
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

  /**
   * Trigger alert
   */
  async triggerAlert(streamId, alert, dataPoint) {
    const alertInstance = {
      id: uuidv4(),
      streamId,
      alertId: alert.id,
      condition: alert.condition,
      threshold: alert.threshold,
      operator: alert.operator,
      value: this.getNestedValue(dataPoint, alert.condition),
      timestamp: dataPoint.timestamp,
      triggeredAt: Date.now(),
      severity: alert.severity || 'medium',
      message: alert.message || `Alert triggered: ${alert.condition} ${alert.operator} ${alert.threshold}`
    };
    
    this.alerts.push(alertInstance);
    this.metrics.alertsGenerated++;
    
    logger.warn('Alert triggered', alertInstance);
    
    this.emit('alertTriggered', alertInstance);
  }

  /**
   * Start processing loop
   */
  startProcessingLoop() {
    setInterval(async () => {
      if (this.isProcessing) return;
      
      this.isProcessing = true;
      
      try {
        await this.processBatch();
      } catch (error) {
        logger.error('Batch processing failed:', error);
      } finally {
        this.isProcessing = false;
      }
    }, this.config.processingInterval);
  }

  /**
   * Process batch of data
   */
  async processBatch() {
    for (const [streamId, buffer] of this.dataBuffers) {
      if (buffer.length === 0) continue;
      
      const stream = this.streams.get(streamId);
      if (!stream || !stream.isActive) continue;
      
      // Process data in batches
      const batch = buffer.splice(0, this.config.batchSize);
      
      for (const dataPoint of batch) {
        await this.processDataPoint(streamId, dataPoint);
      }
      
      this.metrics.processedDataPoints += batch.length;
    }
  }

  /**
   * Start cleanup loop
   */
  startCleanupLoop() {
    setInterval(() => {
      this.cleanupOldData();
    }, 60000); // Run every minute
  }

  /**
   * Cleanup old data
   */
  cleanupOldData() {
    const cutoffTime = Date.now() - (this.config.dataRetention * 1000);
    
    for (const [streamId, buffer] of this.dataBuffers) {
      // Remove old data points
      const filtered = buffer.filter(dp => dp.timestamp > cutoffTime);
      this.dataBuffers.set(streamId, filtered);
    }
    
    // Cleanup old aggregated data
    for (const [streamId, aggregated] of this.aggregatedData) {
      for (const [windowKey, window] of aggregated) {
        if (window.windowEnd < cutoffTime) {
          aggregated.delete(windowKey);
        }
      }
    }
  }

  /**
   * Start monitoring loop
   */
  startMonitoringLoop() {
    setInterval(() => {
      this.updateResourceMetrics();
    }, 5000); // Run every 5 seconds
  }

  /**
   * Update resource metrics
   */
  updateResourceMetrics() {
    const memoryUsage = process.memoryUsage();
    this.metrics.memoryUsage = memoryUsage.heapUsed;
    this.metrics.cpuUsage = process.cpuUsage().user / 1000000; // Convert to seconds
    
    this.metrics.lastProcessed = Date.now();
  }

  /**
   * Update performance metrics
   */
  updateMetrics(processingTime, success) {
    if (success) {
      // Update average processing time
      const totalTime = this.metrics.averageProcessingTime * this.metrics.processedDataPoints + processingTime;
      this.metrics.averageProcessingTime = totalTime / (this.metrics.processedDataPoints + 1);
    }
    
    // Update performance history
    this.performanceHistory.push({
      timestamp: Date.now(),
      processingTime,
      success
    });
    
    // Keep only recent history
    const cutoff = Date.now() - 300000; // 5 minutes
    this.performanceHistory = this.performanceHistory.filter(entry => entry.timestamp > cutoff);
  }

  /**
   * Get analytics results
   */
  getAnalyticsResults(streamId, timeRange = null) {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }
    
    const aggregated = this.aggregatedData.get(streamId);
    const results = [];
    
    for (const [windowKey, window] of aggregated) {
      if (timeRange && (window.windowEnd < timeRange.start || window.windowStart > timeRange.end)) {
        continue;
      }
      
      const result = {
        windowStart: window.windowStart,
        windowEnd: window.windowEnd,
        dataPointCount: window.dataPoints.length,
        aggregations: {}
      };
      
      // Calculate final aggregations
      for (const [field, agg] of Object.entries(window.aggregations)) {
        result.aggregations[field] = {
          sum: agg.sum,
          count: agg.count,
          min: agg.min === Infinity ? null : agg.min,
          max: agg.max === -Infinity ? null : agg.max,
          avg: agg.count > 0 ? agg.sum / agg.count : null
        };
      }
      
      results.push(result);
    }
    
    return results.sort((a, b) => a.windowStart - b.windowStart);
  }

  /**
   * Get stream information
   */
  getStreamInfo(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream) {
      return null;
    }
    
    const buffer = this.dataBuffers.get(streamId);
    const aggregated = this.aggregatedData.get(streamId);
    
    return {
      ...stream,
      bufferSize: buffer.length,
      aggregatedWindows: aggregated.size,
      isActive: stream.isActive
    };
  }

  /**
   * Get all streams
   */
  getAllStreams() {
    const streams = [];
    for (const [id, stream] of this.streams) {
      streams.push(this.getStreamInfo(id));
    }
    return streams;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      performanceHistory: this.performanceHistory.slice(-100) // Last 100 entries
    };
  }

  /**
   * Get alerts
   */
  getAlerts(timeRange = null) {
    if (!timeRange) {
      return this.alerts;
    }
    
    return this.alerts.filter(alert => 
      alert.timestamp >= timeRange.start && alert.timestamp <= timeRange.end
    );
  }

  /**
   * Clear alerts
   */
  clearAlerts() {
    this.alerts = [];
    logger.info('Alerts cleared');
  }

  /**
   * Dispose resources
   */
  async dispose() {
    try {
      // Clear all data
      this.streams.clear();
      this.dataBuffers.clear();
      this.aggregatedData.clear();
      this.analyticsResults.clear();
      this.alerts = [];
      this.performanceHistory = [];
      
      logger.info('Edge Analytics disposed');
      
    } catch (error) {
      logger.error('Failed to dispose Edge Analytics:', error);
      throw error;
    }
  }
}

module.exports = EdgeAnalytics;
