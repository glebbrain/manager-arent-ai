const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class BudgetManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/budget-manager.log' })
      ]
    });
    
    this.budgets = new Map();
    this.budgetAlerts = new Map();
    this.budgetTemplates = new Map();
    this.budgetData = {
      totalBudgets: 0,
      activeBudgets: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      lastUpdateTime: null
    };
  }

  // Initialize budget manager
  async initialize() {
    try {
      this.initializeBudgetTemplates();
      this.initializeDefaultBudgets();
      
      this.logger.info('Budget manager initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing budget manager:', error);
      throw error;
    }
  }

  // Initialize budget templates
  initializeBudgetTemplates() {
    this.budgetTemplates = new Map([
      ['monthly', {
        id: 'monthly',
        name: 'Monthly Budget',
        description: 'Standard monthly budget template',
        period: 'monthly',
        categories: ['all'],
        thresholds: {
          warning: 80,
          critical: 95
        },
        rollover: false,
        notifications: true
      }],
      ['quarterly', {
        id: 'quarterly',
        name: 'Quarterly Budget',
        description: 'Quarterly budget template',
        period: 'quarterly',
        categories: ['all'],
        thresholds: {
          warning: 75,
          critical: 90
        },
        rollover: false,
        notifications: true
      }],
      ['yearly', {
        id: 'yearly',
        name: 'Yearly Budget',
        description: 'Annual budget template',
        period: 'yearly',
        categories: ['all'],
        thresholds: {
          warning: 70,
          critical: 85
        },
        rollover: true,
        notifications: true
      }],
      ['project', {
        id: 'project',
        name: 'Project Budget',
        description: 'Project-specific budget template',
        period: 'custom',
        categories: ['compute', 'storage', 'network'],
        thresholds: {
          warning: 85,
          critical: 95
        },
        rollover: false,
        notifications: true
      }],
      ['department', {
        id: 'department',
        name: 'Department Budget',
        description: 'Department-specific budget template',
        period: 'monthly',
        categories: ['all'],
        thresholds: {
          warning: 80,
          critical: 95
        },
        rollover: false,
        notifications: true
      }]
    ]);
  }

  // Initialize default budgets
  initializeDefaultBudgets() {
    const defaultBudgets = [
      {
        id: 'default-monthly',
        name: 'Default Monthly Budget',
        description: 'Default monthly budget for all services',
        amount: 50000,
        currency: 'USD',
        period: 'monthly',
        categories: ['all'],
        thresholds: {
          warning: 80,
          critical: 95
        },
        startDate: moment().startOf('month').toDate(),
        endDate: moment().endOf('month').toDate(),
        status: 'active',
        rollover: false,
        notifications: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'compute-budget',
        name: 'Compute Resources Budget',
        description: 'Budget for compute resources only',
        amount: 30000,
        currency: 'USD',
        period: 'monthly',
        categories: ['compute'],
        thresholds: {
          warning: 85,
          critical: 95
        },
        startDate: moment().startOf('month').toDate(),
        endDate: moment().endOf('month').toDate(),
        status: 'active',
        rollover: false,
        notifications: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultBudgets.forEach(budget => {
      this.budgets.set(budget.id, budget);
      this.budgetData.totalBudgets++;
      if (budget.status === 'active') {
        this.budgetData.activeBudgets++;
      }
    });
  }

  // Create budget
  async createBudget(config) {
    try {
      const budget = {
        id: config.id || this.generateId(),
        name: config.name,
        description: config.description || '',
        amount: config.amount,
        currency: config.currency || 'USD',
        period: config.period || 'monthly',
        categories: config.categories || ['all'],
        thresholds: config.thresholds || {
          warning: 80,
          critical: 95
        },
        startDate: config.startDate || new Date(),
        endDate: config.endDate || this.calculateEndDate(config.startDate, config.period),
        status: config.status || 'active',
        rollover: config.rollover || false,
        notifications: config.notifications !== false,
        createdBy: config.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: config.metadata || {}
      };

      this.budgets.set(budget.id, budget);
      this.budgetData.totalBudgets++;

      if (budget.status === 'active') {
        this.budgetData.activeBudgets++;
      }

      this.logger.info('Budget created successfully', {
        budgetId: budget.id,
        name: budget.name,
        amount: budget.amount,
        period: budget.period
      });

      return budget;
    } catch (error) {
      this.logger.error('Error creating budget:', error);
      throw error;
    }
  }

  // Calculate end date based on period
  calculateEndDate(startDate, period) {
    const start = moment(startDate);
    
    switch (period) {
      case 'daily':
        return start.endOf('day').toDate();
      case 'weekly':
        return start.add(1, 'week').endOf('day').toDate();
      case 'monthly':
        return start.add(1, 'month').endOf('day').toDate();
      case 'quarterly':
        return start.add(3, 'months').endOf('day').toDate();
      case 'yearly':
        return start.add(1, 'year').endOf('day').toDate();
      default:
        return start.add(1, 'month').endOf('day').toDate();
    }
  }

  // Update budget
  async updateBudget(budgetId, updates) {
    try {
      const budget = this.budgets.get(budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      const wasActive = budget.status === 'active';
      Object.assign(budget, updates);
      budget.updatedAt = new Date();

      this.budgets.set(budgetId, budget);

      // Update active budgets count
      if (wasActive !== (budget.status === 'active')) {
        if (budget.status === 'active') {
          this.budgetData.activeBudgets++;
        } else {
          this.budgetData.activeBudgets--;
        }
      }

      this.logger.info('Budget updated successfully', { budgetId });
      return budget;
    } catch (error) {
      this.logger.error('Error updating budget:', error);
      throw error;
    }
  }

  // Delete budget
  async deleteBudget(budgetId) {
    try {
      const budget = this.budgets.get(budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      this.budgets.delete(budgetId);
      this.budgetData.totalBudgets--;

      if (budget.status === 'active') {
        this.budgetData.activeBudgets--;
      }

      this.logger.info('Budget deleted successfully', { budgetId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting budget:', error);
      throw error;
    }
  }

  // Get budget
  async getBudget(budgetId) {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error('Budget not found');
    }
    return budget;
  }

  // List budgets
  async listBudgets(filters = {}) {
    let budgets = Array.from(this.budgets.values());
    
    if (filters.status) {
      budgets = budgets.filter(b => b.status === filters.status);
    }
    
    if (filters.period) {
      budgets = budgets.filter(b => b.period === filters.period);
    }
    
    if (filters.categories && filters.categories.length > 0) {
      budgets = budgets.filter(b => 
        filters.categories.some(cat => b.categories.includes(cat))
      );
    }
    
    if (filters.createdBy) {
      budgets = budgets.filter(b => b.createdBy === filters.createdBy);
    }
    
    return budgets.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Check budget status
  async checkBudgetStatus(budgetId, currentCosts = []) {
    try {
      const budget = await this.getBudget(budgetId);
      const totalCost = currentCosts.reduce((sum, cost) => sum + cost.amount, 0);
      const percentage = (totalCost / budget.amount) * 100;
      
      const status = {
        budgetId: budgetId,
        budgetName: budget.name,
        budgetAmount: budget.amount,
        currentCost: totalCost,
        percentage: Math.round(percentage * 100) / 100,
        remaining: budget.amount - totalCost,
        status: this.getBudgetStatus(percentage, budget.thresholds),
        daysRemaining: this.calculateDaysRemaining(budget.endDate),
        projectedOverspend: this.calculateProjectedOverspend(totalCost, budget.amount, budget.endDate),
        lastChecked: new Date()
      };

      // Check for alerts
      if (status.status === 'warning' || status.status === 'critical') {
        await this.createBudgetAlert(budgetId, status);
      }

      return status;
    } catch (error) {
      this.logger.error('Error checking budget status:', error);
      throw error;
    }
  }

  // Get budget status based on percentage and thresholds
  getBudgetStatus(percentage, thresholds) {
    if (percentage >= thresholds.critical) return 'critical';
    if (percentage >= thresholds.warning) return 'warning';
    if (percentage >= 100) return 'exceeded';
    return 'normal';
  }

  // Calculate days remaining
  calculateDaysRemaining(endDate) {
    const now = moment();
    const end = moment(endDate);
    return Math.max(0, end.diff(now, 'days'));
  }

  // Calculate projected overspend
  calculateProjectedOverspend(currentCost, budgetAmount, endDate) {
    const now = moment();
    const end = moment(endDate);
    const totalDays = end.diff(moment().startOf('month'), 'days');
    const daysPassed = now.diff(moment().startOf('month'), 'days');
    
    if (daysPassed <= 0) return 0;
    
    const dailyRate = currentCost / daysPassed;
    const projectedTotal = dailyRate * totalDays;
    
    return Math.max(0, projectedTotal - budgetAmount);
  }

  // Create budget alert
  async createBudgetAlert(budgetId, status) {
    try {
      const alert = {
        id: this.generateId(),
        budgetId: budgetId,
        type: 'budget_threshold',
        severity: status.status === 'critical' ? 'critical' : 'warning',
        title: `Budget ${status.status}: ${status.budgetName}`,
        message: `Budget has reached ${status.percentage}% of allocated amount`,
        details: {
          budgetAmount: status.budgetAmount,
          currentCost: status.currentCost,
          percentage: status.percentage,
          remaining: status.remaining,
          daysRemaining: status.daysRemaining
        },
        timestamp: new Date(),
        acknowledged: false,
        resolved: false
      };

      this.budgetAlerts.set(alert.id, alert);
      this.budgetData.totalAlerts++;

      if (alert.severity === 'critical') {
        this.budgetData.criticalAlerts++;
      } else {
        this.budgetData.warningAlerts++;
      }

      this.logger.warn('Budget alert created', {
        alertId: alert.id,
        budgetId: budgetId,
        severity: alert.severity,
        percentage: status.percentage
      });

      return alert;
    } catch (error) {
      this.logger.error('Error creating budget alert:', error);
      throw error;
    }
  }

  // Get budget alerts
  async getBudgetAlerts(filters = {}) {
    let alerts = Array.from(this.budgetAlerts.values());
    
    if (filters.budgetId) {
      alerts = alerts.filter(a => a.budgetId === filters.budgetId);
    }
    
    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    
    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === filters.acknowledged);
    }
    
    if (filters.resolved !== undefined) {
      alerts = alerts.filter(a => a.resolved === filters.resolved);
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId) {
    try {
      const alert = this.budgetAlerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      this.budgetAlerts.set(alertId, alert);

      this.logger.info('Alert acknowledged', { alertId });
      return alert;
    } catch (error) {
      this.logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Resolve alert
  async resolveAlert(alertId) {
    try {
      const alert = this.budgetAlerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.budgetAlerts.set(alertId, alert);

      this.logger.info('Alert resolved', { alertId });
      return alert;
    } catch (error) {
      this.logger.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Get budget templates
  async getBudgetTemplates() {
    return Array.from(this.budgetTemplates.values());
  }

  // Create budget from template
  async createBudgetFromTemplate(templateId, config) {
    try {
      const template = this.budgetTemplates.get(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const budgetConfig = {
        ...template,
        ...config,
        id: config.id || this.generateId(),
        name: config.name || template.name,
        amount: config.amount,
        startDate: config.startDate || new Date(),
        endDate: config.endDate || this.calculateEndDate(config.startDate || new Date(), template.period),
        createdBy: config.createdBy || 'system'
      };

      return await this.createBudget(budgetConfig);
    } catch (error) {
      this.logger.error('Error creating budget from template:', error);
      throw error;
    }
  }

  // Get budget analytics
  async getBudgetAnalytics(filters = {}) {
    const budgets = await this.listBudgets(filters);
    const alerts = await this.getBudgetAlerts(filters);
    
    const analytics = {
      totalBudgets: budgets.length,
      activeBudgets: budgets.filter(b => b.status === 'active').length,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: alerts.filter(a => a.severity === 'warning').length,
      totalBudgetAmount: budgets.reduce((sum, b) => sum + b.amount, 0),
      averageBudgetAmount: budgets.length > 0 ? 
        budgets.reduce((sum, b) => sum + b.amount, 0) / budgets.length : 0,
      budgetDistribution: this.calculateBudgetDistribution(budgets),
      alertTrends: this.calculateAlertTrends(alerts)
    };

    return analytics;
  }

  // Calculate budget distribution
  calculateBudgetDistribution(budgets) {
    const distribution = {};
    
    budgets.forEach(budget => {
      const period = budget.period;
      if (!distribution[period]) {
        distribution[period] = { count: 0, totalAmount: 0 };
      }
      distribution[period].count++;
      distribution[period].totalAmount += budget.amount;
    });
    
    return distribution;
  }

  // Calculate alert trends
  calculateAlertTrends(alerts) {
    const trends = {};
    const last30Days = moment().subtract(30, 'days');
    
    alerts.filter(alert => moment(alert.timestamp).isAfter(last30Days))
      .forEach(alert => {
        const date = moment(alert.timestamp).format('YYYY-MM-DD');
        if (!trends[date]) {
          trends[date] = { critical: 0, warning: 0 };
        }
        trends[date][alert.severity]++;
      });
    
    return trends;
  }

  // Get budget data
  async getBudgetData() {
    return this.budgetData;
  }

  // Generate unique ID
  generateId() {
    return `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new BudgetManager();
