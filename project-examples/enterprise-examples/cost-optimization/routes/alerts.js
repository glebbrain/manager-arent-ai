const express = require('express');
const router = express.Router();
const budgetManager = require('../modules/budget-manager');

// Initialize budget manager
budgetManager.initialize();

// Get budget alerts
router.get('/budget', async (req, res) => {
  try {
    const alerts = await budgetManager.getBudgetAlerts(req.query);
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Acknowledge budget alert
router.post('/budget/:alertId/acknowledge', async (req, res) => {
  try {
    const alert = await budgetManager.acknowledgeAlert(req.params.alertId);
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resolve budget alert
router.post('/budget/:alertId/resolve', async (req, res) => {
  try {
    const alert = await budgetManager.resolveAlert(req.params.alertId);
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const budgetAlerts = await budgetManager.getBudgetAlerts();
    
    // Simulate other types of alerts
    const costAlerts = generateCostAlerts();
    const optimizationAlerts = generateOptimizationAlerts();
    
    const allAlerts = [
      ...budgetAlerts.map(alert => ({ ...alert, type: 'budget' })),
      ...costAlerts,
      ...optimizationAlerts
    ];
    
    // Apply filters
    let filteredAlerts = allAlerts;
    
    if (req.query.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === req.query.type);
    }
    
    if (req.query.severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === req.query.severity);
    }
    
    if (req.query.acknowledged !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === (req.query.acknowledged === 'true'));
    }
    
    if (req.query.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === (req.query.resolved === 'true'));
    }
    
    res.json({
      success: true,
      data: filteredAlerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate cost alerts
function generateCostAlerts() {
  return [
    {
      id: 'cost-alert-1',
      type: 'cost',
      severity: 'warning',
      title: 'Unusual Cost Spike Detected',
      message: 'Cost increased by 25% compared to last week',
      details: {
        currentCost: 15000,
        previousCost: 12000,
        increase: 3000,
        percentage: 25
      },
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    },
    {
      id: 'cost-alert-2',
      type: 'cost',
      severity: 'critical',
      title: 'Cost Anomaly Detected',
      message: 'Unusual spending pattern detected in compute resources',
      details: {
        resourceType: 'compute',
        anomalyScore: 0.95,
        affectedResources: 5
      },
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    }
  ];
}

// Generate optimization alerts
function generateOptimizationAlerts() {
  return [
    {
      id: 'opt-alert-1',
      type: 'optimization',
      severity: 'info',
      title: 'Optimization Opportunity Available',
      message: 'Found 3 idle resources that can be stopped to save $500/month',
      details: {
        opportunityType: 'idle-resources',
        potentialSavings: 500,
        affectedResources: 3
      },
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    },
    {
      id: 'opt-alert-2',
      type: 'optimization',
      severity: 'warning',
      title: 'Over-provisioned Resources Detected',
      message: '2 resources are over-provisioned and can be right-sized',
      details: {
        opportunityType: 'over-provisioned',
        potentialSavings: 1200,
        affectedResources: 2
      },
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    }
  ];
}

// Acknowledge alert
router.post('/:alertId/acknowledge', async (req, res) => {
  try {
    const alertId = req.params.alertId;
    
    // Check if it's a budget alert
    if (alertId.startsWith('budget-')) {
      const alert = await budgetManager.acknowledgeAlert(alertId);
      return res.json({
        success: true,
        data: alert
      });
    }
    
    // Simulate acknowledging other types of alerts
    const alert = {
      id: alertId,
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: req.body.acknowledgedBy || 'system'
    };
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resolve alert
router.post('/:alertId/resolve', async (req, res) => {
  try {
    const alertId = req.params.alertId;
    
    // Check if it's a budget alert
    if (alertId.startsWith('budget-')) {
      const alert = await budgetManager.resolveAlert(alertId);
      return res.json({
        success: true,
        data: alert
      });
    }
    
    // Simulate resolving other types of alerts
    const alert = {
      id: alertId,
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: req.body.resolvedBy || 'system',
      resolution: req.body.resolution || 'Alert resolved'
    };
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get alert analytics
router.get('/analytics', async (req, res) => {
  try {
    const budgetAlerts = await budgetManager.getBudgetAlerts();
    const costAlerts = generateCostAlerts();
    const optimizationAlerts = generateOptimizationAlerts();
    
    const allAlerts = [
      ...budgetAlerts.map(alert => ({ ...alert, type: 'budget' })),
      ...costAlerts,
      ...optimizationAlerts
    ];
    
    const analytics = {
      totalAlerts: allAlerts.length,
      byType: {
        budget: allAlerts.filter(a => a.type === 'budget').length,
        cost: allAlerts.filter(a => a.type === 'cost').length,
        optimization: allAlerts.filter(a => a.type === 'optimization').length
      },
      bySeverity: {
        critical: allAlerts.filter(a => a.severity === 'critical').length,
        warning: allAlerts.filter(a => a.severity === 'warning').length,
        info: allAlerts.filter(a => a.severity === 'info').length
      },
      byStatus: {
        acknowledged: allAlerts.filter(a => a.acknowledged).length,
        resolved: allAlerts.filter(a => a.resolved).length,
        pending: allAlerts.filter(a => !a.acknowledged && !a.resolved).length
      },
      recentAlerts: allAlerts
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)
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
