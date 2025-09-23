const express = require('express');
const router = express.Router();
const budgetManager = require('../modules/budget-manager');

// Initialize budget manager
budgetManager.initialize();

// Create budget
router.post('/', async (req, res) => {
  try {
    const budget = await budgetManager.createBudget(req.body);
    res.status(201).json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get budgets
router.get('/', async (req, res) => {
  try {
    const budgets = await budgetManager.listBudgets(req.query);
    res.json({
      success: true,
      data: budgets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get budget by ID
router.get('/:id', async (req, res) => {
  try {
    const budget = await budgetManager.getBudget(req.params.id);
    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Update budget
router.put('/:id', async (req, res) => {
  try {
    const budget = await budgetManager.updateBudget(req.params.id, req.body);
    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    await budgetManager.deleteBudget(req.params.id);
    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check budget status
router.post('/:id/status', async (req, res) => {
  try {
    const { currentCosts = [] } = req.body;
    const status = await budgetManager.checkBudgetStatus(req.params.id, currentCosts);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get budget alerts
router.get('/alerts', async (req, res) => {
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

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
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

// Resolve alert
router.post('/alerts/:alertId/resolve', async (req, res) => {
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

// Get budget templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await budgetManager.getBudgetTemplates();
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

// Create budget from template
router.post('/templates/:templateId', async (req, res) => {
  try {
    const budget = await budgetManager.createBudgetFromTemplate(req.params.templateId, req.body);
    res.status(201).json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get budget analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await budgetManager.getBudgetAnalytics(req.query);
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

// Get budget data
router.get('/data', async (req, res) => {
  try {
    const data = await budgetManager.getBudgetData();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
