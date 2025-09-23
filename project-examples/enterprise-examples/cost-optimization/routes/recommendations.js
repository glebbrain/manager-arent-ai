const express = require('express');
const router = express.Router();
const aiOptimizer = require('../modules/ai-optimizer');
const optimizationEngine = require('../modules/optimization-engine');

// Initialize modules
aiOptimizer.initialize();
optimizationEngine.initialize();

// Get AI recommendations
router.get('/ai', async (req, res) => {
  try {
    const { type, context = {} } = req.query;
    const recommendations = await aiOptimizer.getRecommendations({ type });
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate new AI recommendations
router.post('/ai', async (req, res) => {
  try {
    const { recommendationType, context } = req.body;
    
    if (!recommendationType) {
      return res.status(400).json({
        success: false,
        error: 'recommendationType is required'
      });
    }

    const recommendation = await aiOptimizer.generateRecommendations(recommendationType, context);
    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get optimization recommendations
router.get('/optimization', async (req, res) => {
  try {
    const rules = await optimizationEngine.getOptimizationRules();
    const strategies = await optimizationEngine.getOptimizationStrategies();
    
    const recommendations = {
      rules: rules,
      strategies: strategies,
      topRecommendations: this.getTopRecommendations(rules)
    };

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get top recommendations
getTopRecommendations(rules) {
  return rules
    .filter(rule => rule.enabled && rule.potentialSavings === 'high')
    .sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 5)
    .map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      priority: rule.priority,
      potentialSavings: rule.potentialSavings,
      risk: rule.risk,
      category: rule.category
    }));
}

// Get personalized recommendations
router.get('/personalized', async (req, res) => {
  try {
    const { userId, preferences = {} } = req.query;
    
    // Simulate personalized recommendations based on user preferences
    const personalizedRecommendations = await generatePersonalizedRecommendations(userId, preferences);
    
    res.json({
      success: true,
      data: personalizedRecommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate personalized recommendations
async function generatePersonalizedRecommendations(userId, preferences) {
  const riskTolerance = preferences.riskTolerance || 'medium';
  const savingsTarget = preferences.savingsTarget || 20;
  const priorityCategories = preferences.priorityCategories || ['compute', 'storage'];
  
  const recommendations = [];
  
  // High priority recommendations
  if (riskTolerance === 'high' && savingsTarget > 30) {
    recommendations.push({
      id: 'rec-1',
      title: 'Implement Spot Instances',
      description: 'Use spot instances for non-critical workloads to save up to 70% on compute costs',
      priority: 'high',
      potentialSavings: 25000,
      effort: 'medium',
      risk: 'high',
      category: 'compute',
      personalized: true
    });
  }
  
  // Medium priority recommendations
  if (priorityCategories.includes('storage')) {
    recommendations.push({
      id: 'rec-2',
      title: 'Optimize Storage Classes',
      description: 'Move infrequently accessed data to cheaper storage classes',
      priority: 'medium',
      potentialSavings: 8000,
      effort: 'low',
      risk: 'low',
      category: 'storage',
      personalized: true
    });
  }
  
  // Conservative recommendations
  if (riskTolerance === 'low') {
    recommendations.push({
      id: 'rec-3',
      title: 'Implement Reserved Instances',
      description: 'Purchase reserved instances for predictable workloads',
      priority: 'high',
      potentialSavings: 15000,
      effort: 'medium',
      risk: 'low',
      category: 'compute',
      personalized: true
    });
  }
  
  return {
    userId: userId,
    preferences: preferences,
    recommendations: recommendations,
    totalPotentialSavings: recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0),
    generatedAt: new Date()
  };
}

// Get recommendation by ID
router.get('/:id', async (req, res) => {
  try {
    const recommendationId = req.params.id;
    
    // Try to find in AI recommendations
    const aiRecommendations = await aiOptimizer.getRecommendations();
    const aiRecommendation = aiRecommendations.find(rec => rec.id === recommendationId);
    
    if (aiRecommendation) {
      return res.json({
        success: true,
        data: aiRecommendation
      });
    }
    
    // Try to find in optimization rules
    const rules = await optimizationEngine.getOptimizationRules();
    const rule = rules.find(rule => rule.id === recommendationId);
    
    if (rule) {
      return res.json({
        success: true,
        data: {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          type: 'optimization_rule',
          priority: rule.priority,
          potentialSavings: rule.potentialSavings,
          risk: rule.risk,
          category: rule.category
        }
      });
    }
    
    res.status(404).json({
      success: false,
      error: 'Recommendation not found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply recommendation
router.post('/:id/apply', async (req, res) => {
  try {
    const recommendationId = req.params.id;
    const { parameters = {} } = req.body;
    
    // Simulate applying recommendation
    const application = {
      id: `app_${Date.now()}`,
      recommendationId: recommendationId,
      parameters: parameters,
      status: 'applied',
      appliedAt: new Date(),
      result: {
        success: true,
        message: 'Recommendation applied successfully',
        estimatedSavings: 5000,
        actualSavings: 0 // Will be calculated after implementation
      }
    };
    
    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get recommendation analytics
router.get('/analytics', async (req, res) => {
  try {
    const aiRecommendations = await aiOptimizer.getRecommendations();
    const optimizationRules = await optimizationEngine.getOptimizationRules();
    
    const analytics = {
      totalRecommendations: aiRecommendations.length + optimizationRules.length,
      aiRecommendations: aiRecommendations.length,
      optimizationRules: optimizationRules.length,
      averageConfidence: aiRecommendations.reduce((sum, rec) => sum + (rec.confidence || 0), 0) / aiRecommendations.length,
      highPriorityRecommendations: optimizationRules.filter(rule => rule.priority === 'high').length,
      potentialSavings: optimizationRules.reduce((sum, rule) => {
        const savings = rule.potentialSavings === 'high' ? 10000 : 
                      rule.potentialSavings === 'medium' ? 5000 : 1000;
        return sum + savings;
      }, 0)
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
