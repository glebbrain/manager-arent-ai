const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class InsightEngine {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/insight-engine.log' })
      ]
    });
    
    this.insights = new Map();
    this.patterns = new Map();
    this.anomalies = new Map();
  }

  // Generate insights
  async generateInsights(data, options = {}) {
    try {
      const insights = {
        id: this.generateId(),
        data: data,
        options: options,
        generatedAt: new Date(),
        insights: [],
        patterns: [],
        anomalies: [],
        recommendations: [],
        status: 'generating'
      };

      // Analyze data for patterns
      const patterns = await this.analyzePatterns(data, options);
      insights.patterns = patterns;

      // Detect anomalies
      const anomalies = await this.detectAnomalies(data, options);
      insights.anomalies = anomalies;

      // Generate insights
      const generatedInsights = await this.analyzeData(data, options);
      insights.insights = generatedInsights;

      // Generate recommendations
      const recommendations = await this.generateRecommendations(insights);
      insights.recommendations = recommendations;

      insights.status = 'completed';
      this.insights.set(insights.id, insights);

      this.logger.info('Insights generated successfully', { id: insights.id });
      return insights;
    } catch (error) {
      this.logger.error('Error generating insights:', error);
      throw error;
    }
  }

  // Analyze patterns
  async analyzePatterns(data, options) {
    const patterns = [];

    if (Array.isArray(data) && data.length > 0) {
      // Trend analysis
      const trend = this.analyzeTrend(data);
      if (trend) patterns.push(trend);

      // Seasonality analysis
      const seasonality = this.analyzeSeasonality(data);
      if (seasonality) patterns.push(seasonality);

      // Correlation analysis
      const correlations = this.analyzeCorrelations(data);
      patterns.push(...correlations);

      // Distribution analysis
      const distribution = this.analyzeDistribution(data);
      if (distribution) patterns.push(distribution);
    }

    return patterns;
  }

  // Analyze trend
  analyzeTrend(data) {
    if (data.length < 2) return null;

    const values = data.map(item => this.extractNumericValue(item));
    if (values.length < 2) return null;

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trend = {
      type: 'trend',
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      strength: Math.abs(slope),
      slope,
      intercept,
      confidence: this.calculateConfidence(values, slope, intercept)
    };

    return trend;
  }

  // Analyze seasonality
  analyzeSeasonality(data) {
    if (data.length < 7) return null;

    const values = data.map(item => this.extractNumericValue(item));
    if (values.length < 7) return null;

    // Simple seasonality detection
    const period = 7; // Weekly seasonality
    const seasonalValues = [];
    
    for (let i = 0; i < values.length; i += period) {
      const periodData = values.slice(i, i + period);
      if (periodData.length === period) {
        seasonalValues.push(periodData);
      }
    }

    if (seasonalValues.length < 2) return null;

    // Calculate seasonal strength
    const seasonalStrength = this.calculateSeasonalStrength(seasonalValues);

    if (seasonalStrength > 0.5) {
      return {
        type: 'seasonality',
        period,
        strength: seasonalStrength,
        pattern: this.extractSeasonalPattern(seasonalValues)
      };
    }

    return null;
  }

  // Analyze correlations
  analyzeCorrelations(data) {
    const correlations = [];

    if (Array.isArray(data) && data.length > 0) {
      const numericFields = this.extractNumericFields(data[0]);
      
      for (let i = 0; i < numericFields.length; i++) {
        for (let j = i + 1; j < numericFields.length; j++) {
          const field1 = numericFields[i];
          const field2 = numericFields[j];
          
          const correlation = this.calculateCorrelation(data, field1, field2);
          
          if (Math.abs(correlation) > 0.5) {
            correlations.push({
              type: 'correlation',
              field1,
              field2,
              correlation,
              strength: Math.abs(correlation),
              direction: correlation > 0 ? 'positive' : 'negative'
            });
          }
        }
      }
    }

    return correlations;
  }

  // Analyze distribution
  analyzeDistribution(data) {
    const values = data.map(item => this.extractNumericValue(item));
    if (values.length === 0) return null;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      type: 'distribution',
      mean,
      variance,
      stdDev,
      skewness: this.calculateSkewness(values, mean, stdDev),
      kurtosis: this.calculateKurtosis(values, mean, stdDev)
    };
  }

  // Detect anomalies
  async detectAnomalies(data, options) {
    const anomalies = [];

    if (Array.isArray(data) && data.length > 0) {
      const values = data.map(item => this.extractNumericValue(item));
      
      // Z-score method
      const zScoreAnomalies = this.detectZScoreAnomalies(values, options.zScoreThreshold || 2);
      anomalies.push(...zScoreAnomalies);

      // IQR method
      const iqrAnomalies = this.detectIQRAnomalies(values);
      anomalies.push(...iqrAnomalies);

      // Isolation Forest (simplified)
      const isolationAnomalies = this.detectIsolationAnomalies(values);
      anomalies.push(...isolationAnomalies);
    }

    return anomalies;
  }

  // Detect Z-score anomalies
  detectZScoreAnomalies(values, threshold) {
    if (values.length < 3) return [];

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return [];

    const anomalies = [];
    values.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          type: 'z-score',
          index,
          value,
          zScore,
          threshold
        });
      }
    });

    return anomalies;
  }

  // Detect IQR anomalies
  detectIQRAnomalies(values) {
    if (values.length < 4) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = this.percentile(sorted, 25);
    const q3 = this.percentile(sorted, 75);
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const anomalies = [];
    values.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        anomalies.push({
          type: 'iqr',
          index,
          value,
          lowerBound,
          upperBound
        });
      }
    });

    return anomalies;
  }

  // Detect isolation anomalies
  detectIsolationAnomalies(values) {
    // Simplified isolation forest implementation
    const anomalies = [];
    const threshold = 0.5;

    values.forEach((value, index) => {
      const isolationScore = this.calculateIsolationScore(value, values);
      if (isolationScore > threshold) {
        anomalies.push({
          type: 'isolation',
          index,
          value,
          isolationScore,
          threshold
        });
      }
    });

    return anomalies;
  }

  // Calculate isolation score
  calculateIsolationScore(value, values) {
    const distances = values.map(v => Math.abs(v - value));
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    
    return maxDistance > 0 ? avgDistance / maxDistance : 0;
  }

  // Analyze data
  async analyzeData(data, options) {
    const insights = [];

    if (Array.isArray(data) && data.length > 0) {
      // Basic statistics
      const stats = this.calculateBasicStatistics(data);
      insights.push({
        type: 'statistics',
        title: 'Basic Statistics',
        data: stats
      });

      // Data quality
      const quality = this.analyzeDataQuality(data);
      insights.push({
        type: 'quality',
        title: 'Data Quality',
        data: quality
      });

      // Performance metrics
      const performance = this.analyzePerformance(data);
      insights.push({
        type: 'performance',
        title: 'Performance Metrics',
        data: performance
      });
    }

    return insights;
  }

  // Calculate basic statistics
  calculateBasicStatistics(data) {
    const values = data.map(item => this.extractNumericValue(item));
    
    if (values.length === 0) return {};

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: values.length,
      sum,
      mean,
      median: this.percentile(sorted, 50),
      mode: this.calculateMode(values),
      min: Math.min(...values),
      max: Math.max(...values),
      range: Math.max(...values) - Math.min(...values),
      variance,
      stdDev
    };
  }

  // Analyze data quality
  analyzeDataQuality(data) {
    const total = data.length;
    const numeric = data.filter(item => !isNaN(this.extractNumericValue(item))).length;
    const nullValues = data.filter(item => item === null || item === undefined).length;
    const emptyValues = data.filter(item => item === '' || item === 0).length;

    return {
      total,
      numeric,
      nullValues,
      emptyValues,
      completeness: (total - nullValues - emptyValues) / total,
      numericRatio: numeric / total
    };
  }

  // Analyze performance
  analyzePerformance(data) {
    const startTime = Date.now();
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    return {
      processingTime,
      dataSize: JSON.stringify(data).length,
      throughput: data.length / (processingTime / 1000)
    };
  }

  // Generate recommendations
  async generateRecommendations(insights) {
    const recommendations = [];

    // Pattern-based recommendations
    insights.patterns.forEach(pattern => {
      if (pattern.type === 'trend' && pattern.direction === 'decreasing') {
        recommendations.push({
          type: 'trend',
          priority: 'high',
          message: 'Declining trend detected. Consider investigating causes and implementing corrective measures.',
          action: 'investigate_trend'
        });
      }
    });

    // Anomaly-based recommendations
    if (insights.anomalies.length > 0) {
      recommendations.push({
        type: 'anomaly',
        priority: 'medium',
        message: `${insights.anomalies.length} anomalies detected. Review data quality and investigate outliers.`,
        action: 'review_anomalies'
      });
    }

    // Quality-based recommendations
    const qualityInsight = insights.insights.find(i => i.type === 'quality');
    if (qualityInsight && qualityInsight.data.completeness < 0.8) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        message: 'Data completeness is below 80%. Improve data collection processes.',
        action: 'improve_data_quality'
      });
    }

    return recommendations;
  }

  // Helper methods
  extractNumericValue(item) {
    if (typeof item === 'number') return item;
    if (typeof item === 'string') return parseFloat(item);
    if (typeof item === 'object' && item.value !== undefined) return parseFloat(item.value);
    if (typeof item === 'object' && item.amount !== undefined) return parseFloat(item.amount);
    if (typeof item === 'object' && item.count !== undefined) return parseFloat(item.count);
    return 0;
  }

  extractNumericFields(item) {
    if (typeof item !== 'object' || item === null) return [];
    
    return Object.keys(item).filter(key => {
      const value = item[key];
      return typeof value === 'number' || 
             (typeof value === 'string' && !isNaN(parseFloat(value)));
    });
  }

  calculateCorrelation(data, field1, field2) {
    const values1 = data.map(item => this.extractNumericValue(item[field1]));
    const values2 = data.map(item => this.extractNumericValue(item[field2]));

    if (values1.length !== values2.length || values1.length < 2) return 0;

    const n = values1.length;
    const sum1 = values1.reduce((a, b) => a + b, 0);
    const sum2 = values2.reduce((a, b) => a + b, 0);
    const sum1Sq = values1.reduce((sum, val) => sum + val * val, 0);
    const sum2Sq = values2.reduce((sum, val) => sum + val * val, 0);
    const sum12 = values1.reduce((sum, val, i) => sum + val * values2[i], 0);

    const numerator = n * sum12 - sum1 * sum2;
    const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  calculateConfidence(values, slope, intercept) {
    // Simplified confidence calculation
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return Math.max(0, Math.min(1, 1 - (stdDev / mean)));
  }

  calculateSeasonalStrength(seasonalValues) {
    // Simplified seasonal strength calculation
    const periods = seasonalValues.length;
    if (periods < 2) return 0;

    const periodLength = seasonalValues[0].length;
    const seasonalPattern = [];
    
    for (let i = 0; i < periodLength; i++) {
      const periodValues = seasonalValues.map(period => period[i]);
      const avg = periodValues.reduce((a, b) => a + b, 0) / periodValues.length;
      seasonalPattern.push(avg);
    }

    const variance = seasonalPattern.reduce((sum, val) => sum + Math.pow(val - this.mean(seasonalPattern), 2), 0) / periodLength;
    const totalVariance = seasonalValues.flat().reduce((sum, val) => sum + Math.pow(val - this.mean(seasonalValues.flat()), 2), 0) / (periods * periodLength);

    return totalVariance > 0 ? variance / totalVariance : 0;
  }

  extractSeasonalPattern(seasonalValues) {
    const periodLength = seasonalValues[0].length;
    const pattern = [];
    
    for (let i = 0; i < periodLength; i++) {
      const periodValues = seasonalValues.map(period => period[i]);
      const avg = periodValues.reduce((a, b) => a + b, 0) / periodValues.length;
      pattern.push(avg);
    }

    return pattern;
  }

  calculateSkewness(values, mean, stdDev) {
    if (stdDev === 0) return 0;
    
    const n = values.length;
    const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / n;
    return skewness;
  }

  calculateKurtosis(values, mean, stdDev) {
    if (stdDev === 0) return 0;
    
    const n = values.length;
    const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / n - 3;
    return kurtosis;
  }

  calculateMode(values) {
    const frequency = {};
    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    
    let maxFreq = 0;
    let mode = null;
    
    for (const [val, freq] of Object.entries(frequency)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = parseFloat(val);
      }
    }
    
    return mode;
  }

  percentile(sorted, p) {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // Get insights
  async getInsights(id) {
    const insights = this.insights.get(id);
    if (!insights) {
      throw new Error('Insights not found');
    }
    return insights;
  }

  // List insights
  async listInsights(filters = {}) {
    let insights = Array.from(this.insights.values());
    
    if (filters.type) {
      insights = insights.filter(i => i.type === filters.type);
    }
    
    if (filters.status) {
      insights = insights.filter(i => i.status === filters.status);
    }
    
    return insights;
  }

  // Generate unique ID
  generateId() {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new InsightEngine();
