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
    new winston.transports.File({ filename: 'logs/ai-optimizer.log' }),
    new winston.transports.Console()
  ]
});

class ResourceAnalyzer {
  constructor() {
    this.metrics = {
      cpu: { current: 0, average: 0, peak: 0, utilization: 0 },
      memory: { current: 0, average: 0, peak: 0, utilization: 0 },
      storage: { current: 0, average: 0, peak: 0, utilization: 0 },
      network: { current: 0, average: 0, peak: 0, utilization: 0 }
    };
    this.historicalData = [];
  }

  async analyzeResourceUsage(resourceData) {
    try {
      // Calculate current metrics
      this.metrics.cpu = this.calculateMetrics(resourceData.cpu);
      this.metrics.memory = this.calculateMetrics(resourceData.memory);
      this.metrics.storage = this.calculateMetrics(resourceData.storage);
      this.metrics.network = this.calculateMetrics(resourceData.network);

      // Store historical data
      this.historicalData.push({
        timestamp: new Date().toISOString(),
        metrics: { ...this.metrics }
      });

      // Keep only last 1000 data points
      if (this.historicalData.length > 1000) {
        this.historicalData = this.historicalData.slice(-1000);
      }

      // Analyze patterns
      const patterns = this.analyzePatterns();
      const waste = this.detectWaste();
      const recommendations = this.generateRecommendations();

      return {
        metrics: this.metrics,
        patterns,
        waste,
        recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Resource analysis failed', { error: error.message });
      throw error;
    }
  }

  calculateMetrics(data) {
    if (!data || data.length === 0) {
      return { current: 0, average: 0, peak: 0, utilization: 0 };
    }

    const current = data[data.length - 1] || 0;
    const average = data.reduce((sum, val) => sum + val, 0) / data.length;
    const peak = Math.max(...data);
    const utilization = (current / 100) * 100; // Assuming data is in percentage

    return { current, average, peak, utilization };
  }

  analyzePatterns() {
    if (this.historicalData.length < 10) {
      return { trend: 'insufficient_data', confidence: 0 };
    }

    const recentData = this.historicalData.slice(-24); // Last 24 data points
    const cpuTrend = this.calculateTrend(recentData.map(d => d.metrics.cpu.average));
    const memoryTrend = this.calculateTrend(recentData.map(d => d.metrics.memory.average));

    return {
      cpu: cpuTrend,
      memory: memoryTrend,
      overall: this.calculateOverallTrend(cpuTrend, memoryTrend)
    };
  }

  calculateTrend(data) {
    if (data.length < 2) return { direction: 'stable', slope: 0, confidence: 0 };

    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    // Simple linear regression
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const confidence = Math.abs(slope) * 0.1; // Simple confidence calculation

    return {
      direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
      slope,
      confidence: Math.min(confidence, 1)
    };
  }

  calculateOverallTrend(cpuTrend, memoryTrend) {
    const avgSlope = (cpuTrend.slope + memoryTrend.slope) / 2;
    const avgConfidence = (cpuTrend.confidence + memoryTrend.confidence) / 2;

    return {
      direction: avgSlope > 0.1 ? 'increasing' : avgSlope < -0.1 ? 'decreasing' : 'stable',
      slope: avgSlope,
      confidence: avgConfidence
    };
  }

  detectWaste() {
    const waste = {
      cpu: this.metrics.cpu.average < 30, // Under 30% average CPU usage
      memory: this.metrics.memory.average < 40, // Under 40% average memory usage
      storage: this.metrics.storage.utilization < 20, // Under 20% storage usage
      network: this.metrics.network.average < 10 // Under 10% network usage
    };

    const wasteScore = Object.values(waste).filter(Boolean).length / Object.keys(waste).length;
    const totalWaste = Object.values(waste).some(Boolean);

    return {
      detected: totalWaste,
      score: wasteScore,
      details: waste,
      recommendations: this.getWasteRecommendations(waste)
    };
  }

  getWasteRecommendations(waste) {
    const recommendations = [];

    if (waste.cpu) {
      recommendations.push({
        type: 'cpu',
        action: 'downsize',
        description: 'CPU utilization is low, consider reducing CPU allocation',
        potentialSavings: '20-40%'
      });
    }

    if (waste.memory) {
      recommendations.push({
        type: 'memory',
        action: 'downsize',
        description: 'Memory utilization is low, consider reducing memory allocation',
        potentialSavings: '15-30%'
      });
    }

    if (waste.storage) {
      recommendations.push({
        type: 'storage',
        action: 'optimize',
        description: 'Storage utilization is low, consider using smaller storage tiers',
        potentialSavings: '10-25%'
      });
    }

    if (waste.network) {
      recommendations.push({
        type: 'network',
        action: 'optimize',
        description: 'Network utilization is low, consider reducing bandwidth allocation',
        potentialSavings: '5-15%'
      });
    }

    return recommendations;
  }

  generateRecommendations() {
    const recommendations = [];

    // CPU recommendations
    if (this.metrics.cpu.average > 80) {
      recommendations.push({
        type: 'cpu',
        action: 'upsize',
        priority: 'high',
        description: 'CPU utilization is high, consider increasing CPU allocation',
        current: this.metrics.cpu.average,
        target: 70
      });
    } else if (this.metrics.cpu.average < 30) {
      recommendations.push({
        type: 'cpu',
        action: 'downsize',
        priority: 'medium',
        description: 'CPU utilization is low, consider reducing CPU allocation',
        current: this.metrics.cpu.average,
        target: 50
      });
    }

    // Memory recommendations
    if (this.metrics.memory.average > 85) {
      recommendations.push({
        type: 'memory',
        action: 'upsize',
        priority: 'high',
        description: 'Memory utilization is high, consider increasing memory allocation',
        current: this.metrics.memory.average,
        target: 75
      });
    } else if (this.metrics.memory.average < 40) {
      recommendations.push({
        type: 'memory',
        action: 'downsize',
        priority: 'medium',
        description: 'Memory utilization is low, consider reducing memory allocation',
        current: this.metrics.memory.average,
        target: 60
      });
    }

    // Storage recommendations
    if (this.metrics.storage.utilization > 90) {
      recommendations.push({
        type: 'storage',
        action: 'upsize',
        priority: 'high',
        description: 'Storage utilization is high, consider increasing storage allocation',
        current: this.metrics.storage.utilization,
        target: 80
      });
    } else if (this.metrics.storage.utilization < 20) {
      recommendations.push({
        type: 'storage',
        action: 'downsize',
        priority: 'low',
        description: 'Storage utilization is low, consider reducing storage allocation',
        current: this.metrics.storage.utilization,
        target: 40
      });
    }

    return recommendations;
  }
}

class CostAnalyzer {
  constructor() {
    this.costData = {
      current: 0,
      daily: 0,
      monthly: 0,
      yearly: 0
    };
    this.costHistory = [];
    this.pricing = {
      cpu: { per_hour: 0.05, per_month: 36 },
      memory: { per_hour: 0.01, per_month: 7.2 },
      storage: { per_gb_month: 0.1 },
      network: { per_gb: 0.09 }
    };
  }

  async analyzeCosts(resourceData, pricing = null) {
    try {
      const currentPricing = pricing || this.pricing;
      
      // Calculate current costs
      const currentCost = this.calculateCurrentCost(resourceData, currentPricing);
      
      // Calculate projected costs
      const projectedCosts = this.calculateProjectedCosts(currentCost);
      
      // Analyze cost trends
      const trends = this.analyzeCostTrends();
      
      // Generate cost optimization recommendations
      const recommendations = this.generateCostRecommendations(resourceData, currentPricing);
      
      // Calculate potential savings
      const savings = this.calculatePotentialSavings(recommendations, currentCost);

      return {
        current: currentCost,
        projected: projectedCosts,
        trends,
        recommendations,
        savings,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Cost analysis failed', { error: error.message });
      throw error;
    }
  }

  calculateCurrentCost(resourceData, pricing) {
    const cpuCost = (resourceData.cpu || 0) * pricing.cpu.per_hour;
    const memoryCost = (resourceData.memory || 0) * pricing.memory.per_hour;
    const storageCost = (resourceData.storage || 0) * pricing.storage.per_gb_month / 24;
    const networkCost = (resourceData.network || 0) * pricing.network.per_gb;

    return {
      cpu: cpuCost,
      memory: memoryCost,
      storage: storageCost,
      network: networkCost,
      total: cpuCost + memoryCost + storageCost + networkCost
    };
  }

  calculateProjectedCosts(currentCost) {
    const daily = currentCost.total * 24;
    const monthly = daily * 30;
    const yearly = monthly * 12;

    return {
      daily,
      monthly,
      yearly,
      breakdown: {
        cpu: currentCost.cpu * 24 * 30,
        memory: currentCost.memory * 24 * 30,
        storage: currentCost.storage * 24 * 30,
        network: currentCost.network * 24 * 30
      }
    };
  }

  analyzeCostTrends() {
    if (this.costHistory.length < 7) {
      return { trend: 'insufficient_data', confidence: 0 };
    }

    const recentCosts = this.costHistory.slice(-7).map(d => d.total);
    const trend = this.calculateTrend(recentCosts);

    return {
      direction: trend.direction,
      slope: trend.slope,
      confidence: trend.confidence,
      change: this.calculateCostChange(recentCosts)
    };
  }

  calculateCostChange(costs) {
    if (costs.length < 2) return 0;
    
    const first = costs[0];
    const last = costs[costs.length - 1];
    
    return ((last - first) / first) * 100;
  }

  generateCostRecommendations(resourceData, pricing) {
    const recommendations = [];

    // CPU cost optimization
    if (resourceData.cpu > 0) {
      const currentCpuCost = resourceData.cpu * pricing.cpu.per_hour;
      const optimizedCpuCost = (resourceData.cpu * 0.8) * pricing.cpu.per_hour;
      const savings = currentCpuCost - optimizedCpuCost;

      if (savings > 0.01) { // Only recommend if savings > $0.01/hour
        recommendations.push({
          type: 'cpu',
          action: 'optimize',
          description: 'Optimize CPU allocation for cost savings',
          currentCost: currentCpuCost,
          optimizedCost: optimizedCpuCost,
          savings: savings,
          savingsPercent: (savings / currentCpuCost) * 100
        });
      }
    }

    // Memory cost optimization
    if (resourceData.memory > 0) {
      const currentMemoryCost = resourceData.memory * pricing.memory.per_hour;
      const optimizedMemoryCost = (resourceData.memory * 0.85) * pricing.memory.per_hour;
      const savings = currentMemoryCost - optimizedMemoryCost;

      if (savings > 0.01) {
        recommendations.push({
          type: 'memory',
          action: 'optimize',
          description: 'Optimize memory allocation for cost savings',
          currentCost: currentMemoryCost,
          optimizedCost: optimizedMemoryCost,
          savings: savings,
          savingsPercent: (savings / currentMemoryCost) * 100
        });
      }
    }

    // Storage cost optimization
    if (resourceData.storage > 0) {
      const currentStorageCost = resourceData.storage * pricing.storage.per_gb_month / 24;
      const optimizedStorageCost = (resourceData.storage * 0.9) * pricing.storage.per_gb_month / 24;
      const savings = currentStorageCost - optimizedStorageCost;

      if (savings > 0.01) {
        recommendations.push({
          type: 'storage',
          action: 'optimize',
          description: 'Optimize storage allocation for cost savings',
          currentCost: currentStorageCost,
          optimizedCost: optimizedStorageCost,
          savings: savings,
          savingsPercent: (savings / currentStorageCost) * 100
        });
      }
    }

    return recommendations;
  }

  calculatePotentialSavings(recommendations, currentCost) {
    const totalSavings = recommendations.reduce((sum, rec) => sum + (rec.savings || 0), 0);
    const savingsPercent = (totalSavings / currentCost.total) * 100;

    return {
      total: totalSavings,
      percent: savingsPercent,
      breakdown: recommendations.map(rec => ({
        type: rec.type,
        savings: rec.savings,
        percent: rec.savingsPercent
      }))
    };
  }

  updateCostHistory(costData) {
    this.costHistory.push({
      timestamp: new Date().toISOString(),
      ...costData
    });

    // Keep only last 30 days of data
    if (this.costHistory.length > 720) { // 30 days * 24 hours
      this.costHistory = this.costHistory.slice(-720);
    }
  }
}

class AIOptimizer {
  constructor() {
    this.resourceAnalyzer = new ResourceAnalyzer();
    this.costAnalyzer = new CostAnalyzer();
    this.optimizationHistory = [];
    this.isOptimizing = false;
  }

  async optimizeResources(resourceData, costData, options = {}) {
    if (this.isOptimizing) {
      throw new Error('Optimization already in progress');
    }

    this.isOptimizing = true;

    try {
      logger.info('Starting AI-powered resource optimization', { resourceData, costData });

      // Analyze current resource usage
      const resourceAnalysis = await this.resourceAnalyzer.analyzeResourceUsage(resourceData);
      
      // Analyze current costs
      const costAnalysis = await this.costAnalyzer.analyzeCosts(resourceData, costData.pricing);
      
      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations(
        resourceAnalysis,
        costAnalysis,
        options
      );

      // Calculate potential savings
      const savings = this.calculateOptimizationSavings(recommendations, costAnalysis);

      // Create optimization plan
      const optimizationPlan = {
        id: `opt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        resourceAnalysis,
        costAnalysis,
        recommendations,
        savings,
        status: 'pending'
      };

      // Store optimization history
      this.optimizationHistory.push(optimizationPlan);

      logger.info('Resource optimization completed', optimizationPlan);

      return optimizationPlan;
    } catch (error) {
      logger.error('Resource optimization failed', { error: error.message });
      throw error;
    } finally {
      this.isOptimizing = false;
    }
  }

  generateOptimizationRecommendations(resourceAnalysis, costAnalysis, options) {
    const recommendations = [];

    // Resource-based recommendations
    if (resourceAnalysis.recommendations.length > 0) {
      recommendations.push(...resourceAnalysis.recommendations.map(rec => ({
        ...rec,
        source: 'resource_analysis',
        priority: this.calculatePriority(rec, resourceAnalysis, costAnalysis)
      })));
    }

    // Cost-based recommendations
    if (costAnalysis.recommendations.length > 0) {
      recommendations.push(...costAnalysis.recommendations.map(rec => ({
        ...rec,
        source: 'cost_analysis',
        priority: this.calculatePriority(rec, resourceAnalysis, costAnalysis)
      })));
    }

    // Waste-based recommendations
    if (resourceAnalysis.waste.recommendations.length > 0) {
      recommendations.push(...resourceAnalysis.waste.recommendations.map(rec => ({
        ...rec,
        source: 'waste_detection',
        priority: 'high'
      })));
    }

    // Sort by priority and potential savings
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return (b.savings || 0) - (a.savings || 0);
    });
  }

  calculatePriority(recommendation, resourceAnalysis, costAnalysis) {
    let priority = 'low';

    // High priority for waste detection
    if (recommendation.source === 'waste_detection') {
      priority = 'high';
    }
    // High priority for high utilization
    else if (recommendation.action === 'upsize' && recommendation.priority === 'high') {
      priority = 'high';
    }
    // Medium priority for cost savings
    else if (recommendation.savings && recommendation.savings > 1) {
      priority = 'medium';
    }
    // Low priority for minor optimizations
    else {
      priority = 'low';
    }

    return priority;
  }

  calculateOptimizationSavings(recommendations, costAnalysis) {
    const totalSavings = recommendations.reduce((sum, rec) => sum + (rec.savings || 0), 0);
    const currentCost = costAnalysis.current.total;
    const savingsPercent = (totalSavings / currentCost) * 100;

    return {
      total: totalSavings,
      percent: savingsPercent,
      monthly: totalSavings * 24 * 30,
      yearly: totalSavings * 24 * 365,
      recommendations: recommendations.length
    };
  }

  async applyOptimization(optimizationId, options = {}) {
    const optimization = this.optimizationHistory.find(opt => opt.id === optimizationId);
    
    if (!optimization) {
      throw new Error('Optimization not found');
    }

    if (optimization.status !== 'pending') {
      throw new Error('Optimization already applied or failed');
    }

    try {
      logger.info('Applying optimization', { optimizationId, options });

      // Apply each recommendation
      const results = [];
      for (const recommendation of optimization.recommendations) {
        try {
          const result = await this.applyRecommendation(recommendation, options);
          results.push({ recommendation, result, status: 'success' });
        } catch (error) {
          logger.error('Failed to apply recommendation', { recommendation, error: error.message });
          results.push({ recommendation, error: error.message, status: 'failed' });
        }
      }

      // Update optimization status
      optimization.status = 'applied';
      optimization.appliedAt = new Date().toISOString();
      optimization.results = results;

      logger.info('Optimization applied successfully', { optimizationId, results });

      return {
        optimizationId,
        status: 'applied',
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to apply optimization', { optimizationId, error: error.message });
      optimization.status = 'failed';
      optimization.error = error.message;
      throw error;
    }
  }

  async applyRecommendation(recommendation, options) {
    // In a real implementation, this would apply the actual changes
    // For this example, we'll simulate the application
    
    logger.info('Applying recommendation', { recommendation });

    // Simulate API calls to cloud providers
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      applied: true,
      timestamp: new Date().toISOString(),
      changes: {
        type: recommendation.type,
        action: recommendation.action,
        before: recommendation.current,
        after: recommendation.target
      }
    };
  }

  getOptimizationHistory() {
    return this.optimizationHistory;
  }

  getOptimizationStatus(optimizationId) {
    const optimization = this.optimizationHistory.find(opt => opt.id === optimizationId);
    return optimization || null;
  }
}

// Express server for API endpoints
const express = require('express');
const app = express();
const port = process.env.PORT || 3007;

app.use(express.json());

const aiOptimizer = new AIOptimizer();

// API Routes
app.post('/api/optimizer/analyze', async (req, res) => {
  try {
    const { resourceData, costData, options } = req.body;
    const result = await aiOptimizer.optimizeResources(resourceData, costData, options);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Optimization analysis failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/optimizer/recommendations', (req, res) => {
  try {
    const history = aiOptimizer.getOptimizationHistory();
    const latest = history[history.length - 1];
    
    if (!latest) {
      return res.json({ success: true, data: { recommendations: [] } });
    }
    
    res.json({ success: true, data: { recommendations: latest.recommendations } });
  } catch (error) {
    logger.error('Get recommendations failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/optimizer/apply', async (req, res) => {
  try {
    const { optimizationId, options } = req.body;
    const result = await aiOptimizer.applyOptimization(optimizationId, options);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Apply optimization failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/optimizer/status', (req, res) => {
  try {
    const history = aiOptimizer.getOptimizationHistory();
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Get optimization status failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ai-optimizer'
  });
});

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`AI Optimizer running on port ${port}`);
  });
}

module.exports = { AIOptimizer, ResourceAnalyzer, CostAnalyzer };
