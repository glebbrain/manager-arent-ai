const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class AlertManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/alert-manager.log' })
      ]
    });
    
    this.alerts = new Map();
    this.rules = new Map();
    this.notifications = new Map();
  }

  // Create alert rule
  async createAlertRule(config) {
    try {
      const rule = {
        id: this.generateId(),
        name: config.name,
        description: config.description || '',
        condition: config.condition,
        threshold: config.threshold,
        operator: config.operator || 'gt',
        dataSource: config.dataSource,
        metric: config.metric,
        timeWindow: config.timeWindow || '5m',
        severity: config.severity || 'medium',
        enabled: config.enabled !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.rules.set(rule.id, rule);
      this.logger.info('Alert rule created successfully', { id: rule.id });
      return rule;
    } catch (error) {
      this.logger.error('Error creating alert rule:', error);
      throw error;
    }
  }

  // Evaluate alert rules
  async evaluateAlertRules(data, options = {}) {
    try {
      const triggeredAlerts = [];

      for (const [ruleId, rule] of this.rules.entries()) {
        if (!rule.enabled) continue;

        try {
          const isTriggered = await this.evaluateRule(rule, data, options);
          
          if (isTriggered) {
            const alert = await this.createAlert(rule, data, options);
            triggeredAlerts.push(alert);
          }
        } catch (error) {
          this.logger.error('Error evaluating rule:', { ruleId, error: error.message });
        }
      }

      return triggeredAlerts;
    } catch (error) {
      this.logger.error('Error evaluating alert rules:', error);
      throw error;
    }
  }

  // Evaluate single rule
  async evaluateRule(rule, data, options) {
    const { condition, threshold, operator, metric, timeWindow } = rule;
    
    // Extract metric value from data
    const metricValue = this.extractMetricValue(data, metric);
    
    if (metricValue === null || metricValue === undefined) {
      return false;
    }

    // Apply time window filter if needed
    const filteredData = this.applyTimeWindow(data, timeWindow);
    const filteredMetricValue = this.extractMetricValue(filteredData, metric);
    
    if (filteredMetricValue === null || filteredMetricValue === undefined) {
      return false;
    }

    // Evaluate condition
    return this.evaluateCondition(filteredMetricValue, threshold, operator, condition);
  }

  // Extract metric value
  extractMetricValue(data, metric) {
    if (typeof data === 'number') return data;
    if (typeof data === 'object' && data !== null) {
      return this.getNestedValue(data, metric);
    }
    if (Array.isArray(data)) {
      return data.length;
    }
    return null;
  }

  // Get nested value
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  // Apply time window
  applyTimeWindow(data, timeWindow) {
    if (!Array.isArray(data)) return data;
    
    const endTime = new Date();
    const startTime = moment(endTime).subtract(this.parseTimeWindow(timeWindow)).toDate();
    
    return data.filter(item => {
      const itemTime = new Date(item.timestamp || item.date || item.time);
      return itemTime >= startTime && itemTime <= endTime;
    });
  }

  // Parse time window
  parseTimeWindow(timeWindow) {
    const match = timeWindow.match(/^(\d+)([smhd])$/);
    if (!match) return { amount: 5, unit: 'minutes' };
    
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

  // Evaluate condition
  evaluateCondition(value, threshold, operator, condition) {
    const numericValue = parseFloat(value);
    const numericThreshold = parseFloat(threshold);
    
    if (isNaN(numericValue) || isNaN(numericThreshold)) {
      return false;
    }

    switch (operator) {
      case 'gt':
        return numericValue > numericThreshold;
      case 'gte':
        return numericValue >= numericThreshold;
      case 'lt':
        return numericValue < numericThreshold;
      case 'lte':
        return numericValue <= numericThreshold;
      case 'eq':
        return numericValue === numericThreshold;
      case 'ne':
        return numericValue !== numericThreshold;
      default:
        return false;
    }
  }

  // Create alert
  async createAlert(rule, data, options) {
    try {
      const alert = {
        id: this.generateId(),
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        message: this.generateAlertMessage(rule, data),
        data: data,
        metric: rule.metric,
        value: this.extractMetricValue(data, rule.metric),
        threshold: rule.threshold,
        operator: rule.operator,
        triggeredAt: new Date(),
        status: 'active',
        acknowledged: false,
        acknowledgedAt: null,
        acknowledgedBy: null,
        resolvedAt: null,
        resolvedBy: null
      };

      this.alerts.set(alert.id, alert);
      
      // Send notifications
      await this.sendNotifications(alert, options);
      
      this.logger.info('Alert created successfully', { id: alert.id, ruleId: rule.id });
      return alert;
    } catch (error) {
      this.logger.error('Error creating alert:', error);
      throw error;
    }
  }

  // Generate alert message
  generateAlertMessage(rule, data) {
    const value = this.extractMetricValue(data, rule.metric);
    const threshold = rule.threshold;
    const operator = rule.operator;
    
    const operatorText = {
      'gt': 'greater than',
      'gte': 'greater than or equal to',
      'lt': 'less than',
      'lte': 'less than or equal to',
      'eq': 'equal to',
      'ne': 'not equal to'
    };
    
    return `${rule.name}: ${rule.metric} (${value}) is ${operatorText[operator]} ${threshold}`;
  }

  // Send notifications
  async sendNotifications(alert, options) {
    try {
      const notification = {
        id: this.generateId(),
        alertId: alert.id,
        type: 'alert',
        message: alert.message,
        severity: alert.severity,
        sentAt: new Date(),
        status: 'sent',
        channels: options.channels || ['email', 'webhook']
      };

      this.notifications.set(notification.id, notification);
      
      // In a real implementation, this would send actual notifications
      this.logger.info('Notification sent', { 
        id: notification.id, 
        alertId: alert.id,
        channels: notification.channels
      });
      
      return notification;
    } catch (error) {
      this.logger.error('Error sending notifications:', error);
      throw error;
    }
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId, userId) {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = userId;

      this.alerts.set(alertId, alert);
      this.logger.info('Alert acknowledged', { id: alertId, userId });
      return alert;
    } catch (error) {
      this.logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Resolve alert
  async resolveAlert(alertId, userId) {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.resolvedBy = userId;

      this.alerts.set(alertId, alert);
      this.logger.info('Alert resolved', { id: alertId, userId });
      return alert;
    } catch (error) {
      this.logger.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Get alert
  async getAlert(id) {
    const alert = this.alerts.get(id);
    if (!alert) {
      throw new Error('Alert not found');
    }
    return alert;
  }

  // List alerts
  async listAlerts(filters = {}) {
    let alerts = Array.from(this.alerts.values());
    
    if (filters.status) {
      alerts = alerts.filter(a => a.status === filters.status);
    }
    
    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    
    if (filters.ruleId) {
      alerts = alerts.filter(a => a.ruleId === filters.ruleId);
    }
    
    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === filters.acknowledged);
    }
    
    // Sort by triggeredAt desc
    alerts.sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));
    
    return alerts;
  }

  // Get alert rule
  async getAlertRule(id) {
    const rule = this.rules.get(id);
    if (!rule) {
      throw new Error('Alert rule not found');
    }
    return rule;
  }

  // List alert rules
  async listAlertRules(filters = {}) {
    let rules = Array.from(this.rules.values());
    
    if (filters.enabled !== undefined) {
      rules = rules.filter(r => r.enabled === filters.enabled);
    }
    
    if (filters.severity) {
      rules = rules.filter(r => r.severity === filters.severity);
    }
    
    return rules;
  }

  // Update alert rule
  async updateAlertRule(id, updates) {
    try {
      const rule = await this.getAlertRule(id);
      
      const updatedRule = {
        ...rule,
        ...updates,
        updatedAt: new Date()
      };

      this.rules.set(id, updatedRule);
      this.logger.info('Alert rule updated successfully', { id });
      return updatedRule;
    } catch (error) {
      this.logger.error('Error updating alert rule:', error);
      throw error;
    }
  }

  // Delete alert rule
  async deleteAlertRule(id) {
    try {
      const rule = await this.getAlertRule(id);
      this.rules.delete(id);
      this.logger.info('Alert rule deleted successfully', { id });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting alert rule:', error);
      throw error;
    }
  }

  // Get notification
  async getNotification(id) {
    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    return notification;
  }

  // List notifications
  async listNotifications(filters = {}) {
    let notifications = Array.from(this.notifications.values());
    
    if (filters.alertId) {
      notifications = notifications.filter(n => n.alertId === filters.alertId);
    }
    
    if (filters.status) {
      notifications = notifications.filter(n => n.status === filters.status);
    }
    
    if (filters.type) {
      notifications = notifications.filter(n => n.type === filters.type);
    }
    
    // Sort by sentAt desc
    notifications.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    
    return notifications;
  }

  // Generate unique ID
  generateId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new AlertManager();
