const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class MetricsCollector {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/metrics-collector.log' })
      ]
    });
    
    this.metrics = new Map();
    this.metricTypes = new Map();
    this.collectors = new Map();
    this.aggregations = new Map();
    this.alerts = new Map();
    this.metricsData = {
      totalMetrics: 0,
      activeCollectors: 0,
      totalDataPoints: 0,
      averageCollectionTime: 0,
      lastCollectionTime: null
    };
  }

  // Initialize metrics collector
  async initialize() {
    try {
      this.initializeMetricTypes();
      this.initializeCollectors();
      this.initializeAggregations();
      
      this.logger.info('Metrics collector initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing metrics collector:', error);
      throw error;
    }
  }

  // Initialize metric types
  initializeMetricTypes() {
    this.metricTypes = new Map([
      ['cpu_utilization', {
        name: 'CPU Utilization',
        description: 'CPU usage percentage',
        unit: 'percent',
        type: 'gauge',
        min: 0,
        max: 100,
        thresholds: {
          warning: 70,
          critical: 90
        }
      }],
      ['memory_utilization', {
        name: 'Memory Utilization',
        description: 'Memory usage percentage',
        unit: 'percent',
        type: 'gauge',
        min: 0,
        max: 100,
        thresholds: {
          warning: 80,
          critical: 95
        }
      }],
      ['disk_utilization', {
        name: 'Disk Utilization',
        description: 'Disk usage percentage',
        unit: 'percent',
        type: 'gauge',
        min: 0,
        max: 100,
        thresholds: {
          warning: 85,
          critical: 95
        }
      }],
      ['network_io', {
        name: 'Network I/O',
        description: 'Network input/output bytes',
        unit: 'bytes',
        type: 'counter',
        thresholds: {
          warning: 1000000000, // 1GB
          critical: 5000000000  // 5GB
        }
      }],
      ['requests_per_second', {
        name: 'Requests Per Second',
        description: 'HTTP requests per second',
        unit: 'requests/sec',
        type: 'rate',
        thresholds: {
          warning: 100,
          critical: 500
        }
      }],
      ['response_time', {
        name: 'Response Time',
        description: 'Average response time',
        unit: 'milliseconds',
        type: 'histogram',
        thresholds: {
          warning: 1000,
          critical: 5000
        }
      }],
      ['error_rate', {
        name: 'Error Rate',
        description: 'Error rate percentage',
        unit: 'percent',
        type: 'gauge',
        min: 0,
        max: 100,
        thresholds: {
          warning: 5,
          critical: 10
        }
      }],
      ['queue_length', {
        name: 'Queue Length',
        description: 'Number of items in queue',
        unit: 'count',
        type: 'gauge',
        thresholds: {
          warning: 50,
          critical: 100
        }
      }],
      ['active_connections', {
        name: 'Active Connections',
        description: 'Number of active connections',
        unit: 'count',
        type: 'gauge',
        thresholds: {
          warning: 1000,
          critical: 5000
        }
      }],
      ['custom_metric', {
        name: 'Custom Metric',
        description: 'Custom application metric',
        unit: 'count',
        type: 'gauge',
        thresholds: {
          warning: 75,
          critical: 90
        }
      }]
    ]);
  }

  // Initialize collectors
  initializeCollectors() {
    this.collectors = new Map([
      ['system', {
        name: 'System Metrics',
        description: 'Collects system-level metrics',
        interval: 30, // seconds
        enabled: true,
        metrics: ['cpu_utilization', 'memory_utilization', 'disk_utilization', 'network_io'],
        lastRun: null,
        nextRun: null
      }],
      ['application', {
        name: 'Application Metrics',
        description: 'Collects application-level metrics',
        interval: 15, // seconds
        enabled: true,
        metrics: ['requests_per_second', 'response_time', 'error_rate', 'active_connections'],
        lastRun: null,
        nextRun: null
      }],
      ['queue', {
        name: 'Queue Metrics',
        description: 'Collects queue-related metrics',
        interval: 10, // seconds
        enabled: true,
        metrics: ['queue_length'],
        lastRun: null,
        nextRun: null
      }],
      ['custom', {
        name: 'Custom Metrics',
        description: 'Collects custom application metrics',
        interval: 60, // seconds
        enabled: true,
        metrics: ['custom_metric'],
        lastRun: null,
        nextRun: null
      }]
    ]);
  }

  // Initialize aggregations
  initializeAggregations() {
    this.aggregations = new Map([
      ['average', {
        name: 'Average',
        description: 'Calculate average value',
        function: (values) => values.reduce((a, b) => a + b, 0) / values.length
      }],
      ['sum', {
        name: 'Sum',
        description: 'Calculate sum of values',
        function: (values) => values.reduce((a, b) => a + b, 0)
      }],
      ['min', {
        name: 'Minimum',
        description: 'Find minimum value',
        function: (values) => Math.min(...values)
      }],
      ['max', {
        name: 'Maximum',
        description: 'Find maximum value',
        function: (values) => Math.max(...values)
      }],
      ['count', {
        name: 'Count',
        description: 'Count number of values',
        function: (values) => values.length
      }],
      ['percentile_95', {
        name: '95th Percentile',
        description: 'Calculate 95th percentile',
        function: (values) => {
          const sorted = values.sort((a, b) => a - b);
          const index = Math.ceil(sorted.length * 0.95) - 1;
          return sorted[index];
        }
      }],
      ['percentile_99', {
        name: '99th Percentile',
        description: 'Calculate 99th percentile',
        function: (values) => {
          const sorted = values.sort((a, b) => a - b);
          const index = Math.ceil(sorted.length * 0.99) - 1;
          return sorted[index];
        }
      }]
    ]);
  }

  // Collect metrics
  async collectMetrics(collectorId = null) {
    try {
      const startTime = Date.now();
      const collectors = collectorId ? 
        [this.collectors.get(collectorId)] : 
        Array.from(this.collectors.values()).filter(c => c.enabled);

      const results = [];

      for (const collector of collectors) {
        if (!collector) continue;

        try {
          const collectorResult = await this.runCollector(collector);
          results.push(collectorResult);
          
          collector.lastRun = new Date();
          collector.nextRun = new Date(Date.now() + collector.interval * 1000);
          
          this.collectors.set(collectorId || collector.name, collector);
        } catch (error) {
          this.logger.error(`Error running collector ${collector.name}:`, error);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.metricsData.totalDataPoints += results.length;
      this.metricsData.averageCollectionTime = 
        (this.metricsData.averageCollectionTime + duration) / 2;
      this.metricsData.lastCollectionTime = new Date();

      this.logger.info('Metrics collection completed', {
        collectors: results.length,
        duration: duration,
        totalDataPoints: this.metricsData.totalDataPoints
      });

      return results;
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
      throw error;
    }
  }

  // Run individual collector
  async runCollector(collector) {
    const startTime = Date.now();
    const metrics = [];

    for (const metricName of collector.metrics) {
      try {
        const metricValue = await this.simulateMetricCollection(metricName);
        const metricData = {
          id: this.generateId(),
          name: metricName,
          value: metricValue,
          timestamp: new Date(),
          collector: collector.name,
          tags: this.getMetricTags(metricName),
          metadata: this.getMetricMetadata(metricName)
        };

        this.storeMetric(metricData);
        metrics.push(metricData);
      } catch (error) {
        this.logger.error(`Error collecting metric ${metricName}:`, error);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      collector: collector.name,
      metrics: metrics,
      duration: duration,
      timestamp: new Date()
    };
  }

  // Simulate metric collection
  async simulateMetricCollection(metricName) {
    const metricType = this.metricTypes.get(metricName);
    if (!metricType) {
      throw new Error(`Unknown metric type: ${metricName}`);
    }

    // Simulate realistic metric values based on type
    let value;
    switch (metricName) {
      case 'cpu_utilization':
        value = Math.random() * 100;
        break;
      case 'memory_utilization':
        value = Math.random() * 100;
        break;
      case 'disk_utilization':
        value = Math.random() * 100;
        break;
      case 'network_io':
        value = Math.random() * 1000000000; // 0-1GB
        break;
      case 'requests_per_second':
        value = Math.random() * 200; // 0-200 RPS
        break;
      case 'response_time':
        value = Math.random() * 5000; // 0-5000ms
        break;
      case 'error_rate':
        value = Math.random() * 10; // 0-10%
        break;
      case 'queue_length':
        value = Math.floor(Math.random() * 200); // 0-200
        break;
      case 'active_connections':
        value = Math.floor(Math.random() * 10000); // 0-10000
        break;
      case 'custom_metric':
        value = Math.random() * 100;
        break;
      default:
        value = Math.random() * 100;
    }

    return Math.round(value * 100) / 100; // Round to 2 decimal places
  }

  // Get metric tags
  getMetricTags(metricName) {
    const baseTags = {
      environment: 'production',
      region: 'us-east-1',
      service: 'auto-scaling'
    };

    switch (metricName) {
      case 'cpu_utilization':
      case 'memory_utilization':
      case 'disk_utilization':
        return { ...baseTags, type: 'system' };
      case 'requests_per_second':
      case 'response_time':
      case 'error_rate':
        return { ...baseTags, type: 'application' };
      case 'queue_length':
        return { ...baseTags, type: 'queue' };
      default:
        return { ...baseTags, type: 'custom' };
    }
  }

  // Get metric metadata
  getMetricMetadata(metricName) {
    const metricType = this.metricTypes.get(metricName);
    return {
      unit: metricType.unit,
      type: metricType.type,
      thresholds: metricType.thresholds
    };
  }

  // Store metric
  storeMetric(metricData) {
    const key = `${metricData.name}_${metricData.timestamp.getTime()}`;
    this.metrics.set(key, metricData);
    this.metricsData.totalMetrics++;
  }

  // Get metrics
  async getMetrics(filters = {}) {
    let metrics = Array.from(this.metrics.values());
    
    if (filters.name) {
      metrics = metrics.filter(m => m.name === filters.name);
    }
    
    if (filters.collector) {
      metrics = metrics.filter(m => m.collector === filters.collector);
    }
    
    if (filters.startTime) {
      metrics = metrics.filter(m => m.timestamp >= new Date(filters.startTime));
    }
    
    if (filters.endTime) {
      metrics = metrics.filter(m => m.timestamp <= new Date(filters.endTime));
    }
    
    if (filters.tags) {
      metrics = metrics.filter(m => 
        Object.entries(filters.tags).every(([key, value]) => 
          m.tags[key] === value
        )
      );
    }
    
    return metrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Aggregate metrics
  async aggregateMetrics(metricName, aggregation, timeRange = '1h') {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - this.parseTimeRange(timeRange));
      
      const metrics = await this.getMetrics({
        name: metricName,
        startTime: startTime,
        endTime: endTime
      });

      if (metrics.length === 0) {
        return { value: 0, count: 0, timeRange };
      }

      const values = metrics.map(m => m.value);
      const aggregationFunc = this.aggregations.get(aggregation);
      
      if (!aggregationFunc) {
        throw new Error(`Unknown aggregation: ${aggregation}`);
      }

      const value = aggregationFunc.function(values);

      return {
        metric: metricName,
        aggregation: aggregation,
        value: Math.round(value * 100) / 100,
        count: values.length,
        timeRange: timeRange,
        startTime: startTime,
        endTime: endTime
      };
    } catch (error) {
      this.logger.error('Error aggregating metrics:', error);
      throw error;
    }
  }

  // Parse time range
  parseTimeRange(timeRange) {
    const units = {
      'm': 60 * 1000,           // minutes
      'h': 60 * 60 * 1000,      // hours
      'd': 24 * 60 * 60 * 1000  // days
    };
    
    const match = timeRange.match(/^(\d+)([mhd])$/);
    if (!match) {
      throw new Error('Invalid time range format. Use format like "1h", "30m", "1d"');
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    return value * units[unit];
  }

  // Get metric types
  async getMetricTypes() {
    return Array.from(this.metricTypes.values());
  }

  // Get collectors
  async getCollectors() {
    return Array.from(this.collectors.values());
  }

  // Get aggregations
  async getAggregations() {
    return Array.from(this.aggregations.values());
  }

  // Get metrics data
  async getMetricsData() {
    return this.metricsData;
  }

  // Generate unique ID
  generateId() {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new MetricsCollector();
