const express = require('express');
const router = express.Router();
const costAnalyzer = require('../modules/cost-analyzer');
const budgetManager = require('../modules/budget-manager');
const optimizationEngine = require('../modules/optimization-engine');
const aiOptimizer = require('../modules/ai-optimizer');

// Initialize modules
costAnalyzer.initialize();
budgetManager.initialize();
optimizationEngine.initialize();
aiOptimizer.initialize();

// Generate cost report
router.post('/cost', async (req, res) => {
  try {
    const { format = 'json', filters = {} } = req.body;
    
    const analysis = await costAnalyzer.analyzeCosts('cost-breakdown', filters);
    const report = generateCostReport(analysis, format);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate budget report
router.post('/budget', async (req, res) => {
  try {
    const { format = 'json', filters = {} } = req.body;
    
    const analytics = await budgetManager.getBudgetAnalytics(filters);
    const report = generateBudgetReport(analytics, format);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate optimization report
router.post('/optimization', async (req, res) => {
  try {
    const { format = 'json', filters = {} } = req.body;
    
    const engineData = await optimizationEngine.getEngineData();
    const results = await optimizationEngine.getOptimizationResults(filters);
    const report = generateOptimizationReport(engineData, results, format);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate AI report
router.post('/ai', async (req, res) => {
  try {
    const { format = 'json', filters = {} } = req.body;
    
    const aiData = await aiOptimizer.getAIData();
    const predictions = await aiOptimizer.getPredictions(filters);
    const recommendations = await aiOptimizer.getRecommendations(filters);
    const report = generateAIReport(aiData, predictions, recommendations, format);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate comprehensive report
router.post('/comprehensive', async (req, res) => {
  try {
    const { format = 'json', filters = {} } = req.body;
    
    const costData = await costAnalyzer.getAnalyzerData();
    const budgetData = await budgetManager.getBudgetData();
    const optimizationData = await optimizationEngine.getEngineData();
    const aiData = await aiOptimizer.getAIData();
    
    const report = generateComprehensiveReport({
      cost: costData,
      budget: budgetData,
      optimization: optimizationData,
      ai: aiData
    }, format);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate cost report
function generateCostReport(analysis, format) {
  const report = {
    id: `cost_report_${Date.now()}`,
    type: 'cost',
    title: 'Cost Analysis Report',
    generatedAt: new Date(),
    summary: {
      totalCost: analysis.results?.totalCost || 0,
      categories: Object.keys(analysis.results?.byCategory || {}).length,
      resources: Object.keys(analysis.results?.byResource || {}).length,
      timeRange: '30 days'
    },
    details: analysis.results,
    recommendations: generateCostRecommendations(analysis.results),
    format: format
  };
  
  return report;
}

// Generate budget report
function generateBudgetReport(analytics, format) {
  const report = {
    id: `budget_report_${Date.now()}`,
    type: 'budget',
    title: 'Budget Analysis Report',
    generatedAt: new Date(),
    summary: {
      totalBudgets: analytics.totalBudgets,
      activeBudgets: analytics.activeBudgets,
      totalAlerts: analytics.totalAlerts,
      criticalAlerts: analytics.criticalAlerts,
      totalBudgetAmount: analytics.totalBudgetAmount
    },
    details: analytics,
    recommendations: generateBudgetRecommendations(analytics),
    format: format
  };
  
  return report;
}

// Generate optimization report
function generateOptimizationReport(engineData, results, format) {
  const report = {
    id: `optimization_report_${Date.now()}`,
    type: 'optimization',
    title: 'Optimization Analysis Report',
    generatedAt: new Date(),
    summary: {
      totalOptimizations: engineData.totalOptimizations,
      successfulOptimizations: engineData.successfulOptimizations,
      totalSavings: engineData.totalSavings,
      averageSavings: engineData.averageSavings,
      successRate: engineData.successRate
    },
    details: {
      engineData: engineData,
      recentResults: results.slice(0, 10)
    },
    recommendations: generateOptimizationRecommendations(engineData, results),
    format: format
  };
  
  return report;
}

// Generate AI report
function generateAIReport(aiData, predictions, recommendations, format) {
  const report = {
    id: `ai_report_${Date.now()}`,
    type: 'ai',
    title: 'AI Analysis Report',
    generatedAt: new Date(),
    summary: {
      totalModels: aiData.totalModels,
      activeModels: aiData.activeModels,
      totalPredictions: aiData.totalPredictions,
      totalRecommendations: aiData.totalRecommendations,
      predictionAccuracy: aiData.predictionAccuracy,
      recommendationSuccessRate: aiData.recommendationSuccessRate
    },
    details: {
      aiData: aiData,
      recentPredictions: predictions.slice(0, 10),
      recentRecommendations: recommendations.slice(0, 10)
    },
    recommendations: generateAIRecommendations(aiData, predictions, recommendations),
    format: format
  };
  
  return report;
}

// Generate comprehensive report
function generateComprehensiveReport(data, format) {
  const report = {
    id: `comprehensive_report_${Date.now()}`,
    type: 'comprehensive',
    title: 'Comprehensive Cost Optimization Report',
    generatedAt: new Date(),
    executiveSummary: {
      totalCosts: data.cost.totalCosts,
      totalBudgets: data.budget.totalBudgets,
      totalSavings: data.optimization.totalSavings,
      predictionAccuracy: data.ai.predictionAccuracy,
      overallHealth: calculateOverallHealth(data)
    },
    sections: {
      cost: generateCostReport({ results: data.cost }, format),
      budget: generateBudgetReport(data.budget, format),
      optimization: generateOptimizationReport(data.optimization, [], format),
      ai: generateAIReport(data.ai, [], [], format)
    },
    recommendations: generateComprehensiveRecommendations(data),
    format: format
  };
  
  return report;
}

// Calculate overall health score
function calculateOverallHealth(data) {
  const costHealth = data.cost.totalCosts > 0 ? 0.8 : 0.5;
  const budgetHealth = data.budget.totalBudgets > 0 ? 0.9 : 0.6;
  const optimizationHealth = data.optimization.successRate / 100;
  const aiHealth = data.ai.predictionAccuracy / 100;
  
  return (costHealth + budgetHealth + optimizationHealth + aiHealth) / 4;
}

// Generate cost recommendations
function generateCostRecommendations(results) {
  const recommendations = [];
  
  if (results?.totalCost > 50000) {
    recommendations.push({
      priority: 'high',
      title: 'High Cost Alert',
      description: 'Total costs exceed $50,000. Consider implementing cost optimization strategies.',
      action: 'Review and optimize high-cost resources'
    });
  }
  
  if (results?.byCategory) {
    const categories = Object.keys(results.byCategory);
    if (categories.length > 5) {
      recommendations.push({
        priority: 'medium',
        title: 'Cost Category Optimization',
        description: 'Consider consolidating cost categories for better management.',
        action: 'Review and merge similar cost categories'
      });
    }
  }
  
  return recommendations;
}

// Generate budget recommendations
function generateBudgetRecommendations(analytics) {
  const recommendations = [];
  
  if (analytics.criticalAlerts > 0) {
    recommendations.push({
      priority: 'critical',
      title: 'Critical Budget Alerts',
      description: `${analytics.criticalAlerts} critical budget alerts require immediate attention.`,
      action: 'Review and address critical budget alerts'
    });
  }
  
  if (analytics.totalAlerts > analytics.totalBudgets) {
    recommendations.push({
      priority: 'high',
      title: 'High Alert Volume',
      description: 'Alert volume is high compared to budget count. Consider adjusting thresholds.',
      action: 'Review and adjust budget alert thresholds'
    });
  }
  
  return recommendations;
}

// Generate optimization recommendations
function generateOptimizationRecommendations(engineData, results) {
  const recommendations = [];
  
  if (engineData.successRate < 80) {
    recommendations.push({
      priority: 'high',
      title: 'Low Optimization Success Rate',
      description: `Optimization success rate is ${engineData.successRate.toFixed(1)}%. Review failed optimizations.`,
      action: 'Analyze failed optimizations and improve rules'
    });
  }
  
  if (engineData.totalSavings < 10000) {
    recommendations.push({
      priority: 'medium',
      title: 'Low Total Savings',
      description: 'Total savings are below expectations. Consider more aggressive optimization strategies.',
      action: 'Implement more aggressive optimization rules'
    });
  }
  
  return recommendations;
}

// Generate AI recommendations
function generateAIRecommendations(aiData, predictions, recommendations) {
  const recommendations_list = [];
  
  if (aiData.predictionAccuracy < 85) {
    recommendations_list.push({
      priority: 'high',
      title: 'Low Prediction Accuracy',
      description: `Prediction accuracy is ${aiData.predictionAccuracy.toFixed(1)}%. Consider retraining models.`,
      action: 'Retrain AI models with more recent data'
    });
  }
  
  if (aiData.totalPredictions < 100) {
    recommendations_list.push({
      priority: 'medium',
      title: 'Limited Prediction Data',
      description: 'Limited prediction data available. Increase prediction frequency.',
      action: 'Increase prediction frequency and data collection'
    });
  }
  
  return recommendations_list;
}

// Generate comprehensive recommendations
function generateComprehensiveRecommendations(data) {
  const recommendations = [];
  
  // Overall health recommendations
  const overallHealth = calculateOverallHealth(data);
  if (overallHealth < 0.7) {
    recommendations.push({
      priority: 'critical',
      title: 'Overall System Health',
      description: `Overall system health is ${(overallHealth * 100).toFixed(1)}%. Immediate attention required.`,
      action: 'Review all system components and implement improvements'
    });
  }
  
  // Cost optimization recommendations
  if (data.cost.totalCosts > 0 && data.optimization.totalSavings < data.cost.totalCosts * 0.1) {
    recommendations.push({
      priority: 'high',
      title: 'Cost Optimization Opportunity',
      description: 'Significant cost optimization opportunities available.',
      action: 'Implement aggressive cost optimization strategies'
    });
  }
  
  // AI enhancement recommendations
  if (data.ai.predictionAccuracy < 90) {
    recommendations.push({
      priority: 'medium',
      title: 'AI Model Enhancement',
      description: 'AI models can be improved for better predictions.',
      action: 'Enhance AI models and training data'
    });
  }
  
  return recommendations;
}

// Get report templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'cost-summary',
        name: 'Cost Summary Report',
        description: 'High-level cost overview and trends',
        type: 'cost',
        format: 'json'
      },
      {
        id: 'budget-analysis',
        name: 'Budget Analysis Report',
        description: 'Detailed budget performance and variance analysis',
        type: 'budget',
        format: 'json'
      },
      {
        id: 'optimization-results',
        name: 'Optimization Results Report',
        description: 'Optimization performance and savings analysis',
        type: 'optimization',
        format: 'json'
      },
      {
        id: 'ai-insights',
        name: 'AI Insights Report',
        description: 'AI predictions and recommendations analysis',
        type: 'ai',
        format: 'json'
      },
      {
        id: 'executive-summary',
        name: 'Executive Summary Report',
        description: 'Comprehensive executive-level cost optimization report',
        type: 'comprehensive',
        format: 'json'
      }
    ];
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
