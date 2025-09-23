#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class SmartNotificationSystem extends EventEmitter {
  constructor() {
    super();
    this.notificationsPath = path.join(__dirname, '..', 'notifications');
    this.configPath = path.join(__dirname, '..', 'configs');
    this.ensureDirectories();
    this.rules = this.loadNotificationRules();
    this.channels = this.loadNotificationChannels();
    this.subscribers = new Map();
    this.notificationHistory = [];
  }

  ensureDirectories() {
    const dirs = [this.notificationsPath, this.configPath];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadNotificationRules() {
    return {
      project: {
        created: {
          priority: 'info',
          channels: ['console', 'log'],
          message: 'New project created: {{projectName}}',
          conditions: ['always']
        },
        updated: {
          priority: 'info',
          channels: ['console', 'log'],
          message: 'Project updated: {{projectName}} - {{changes}}',
          conditions: ['always']
        },
        completed: {
          priority: 'success',
          channels: ['console', 'log', 'email'],
          message: 'Project completed successfully: {{projectName}}',
          conditions: ['always']
        },
        failed: {
          priority: 'error',
          channels: ['console', 'log', 'email', 'slack'],
          message: 'Project failed: {{projectName}} - {{error}}',
          conditions: ['always']
        }
      },
      task: {
        created: {
          priority: 'info',
          channels: ['console', 'log'],
          message: 'New task created: {{taskTitle}}',
          conditions: ['always']
        },
        assigned: {
          priority: 'info',
          channels: ['console', 'log', 'email'],
          message: 'Task assigned to {{assignee}}: {{taskTitle}}',
          conditions: ['always']
        },
        due_soon: {
          priority: 'warning',
          channels: ['console', 'log', 'email', 'slack'],
          message: 'Task due soon: {{taskTitle}} (due {{dueDate}})',
          conditions: ['due_in_days <= 3']
        },
        overdue: {
          priority: 'error',
          channels: ['console', 'log', 'email', 'slack'],
          message: 'Task overdue: {{taskTitle}} (was due {{dueDate}})',
          conditions: ['due_date < now']
        },
        completed: {
          priority: 'success',
          channels: ['console', 'log'],
          message: 'Task completed: {{taskTitle}}',
          conditions: ['always']
        }
      },
      workflow: {
        started: {
          priority: 'info',
          channels: ['console', 'log'],
          message: 'Workflow started: {{workflowName}}',
          conditions: ['always']
        },
        completed: {
          priority: 'success',
          channels: ['console', 'log'],
          message: 'Workflow completed: {{workflowName}}',
          conditions: ['always']
        },
        failed: {
          priority: 'error',
          channels: ['console', 'log', 'email', 'slack'],
          message: 'Workflow failed: {{workflowName}} - {{error}}',
          conditions: ['always']
        },
        step_failed: {
          priority: 'warning',
          channels: ['console', 'log'],
          message: 'Workflow step failed: {{stepName}} in {{workflowName}}',
          conditions: ['always']
        }
      },
      system: {
        error: {
          priority: 'error',
          channels: ['console', 'log', 'email', 'slack'],
          message: 'System error: {{error}}',
          conditions: ['always']
        },
        warning: {
          priority: 'warning',
          channels: ['console', 'log'],
          message: 'System warning: {{warning}}',
          conditions: ['always']
        },
        info: {
          priority: 'info',
          channels: ['console', 'log'],
          message: 'System info: {{info}}',
          conditions: ['always']
        },
        maintenance: {
          priority: 'info',
          channels: ['console', 'log', 'email'],
          message: 'Maintenance scheduled: {{maintenance}}',
          conditions: ['always']
        }
      },
      quality: {
        check_failed: {
          priority: 'warning',
          channels: ['console', 'log'],
          message: 'Quality check failed: {{checkType}} - {{issues}}',
          conditions: ['always']
        },
        check_passed: {
          priority: 'success',
          channels: ['console', 'log'],
          message: 'Quality check passed: {{checkType}}',
          conditions: ['always']
        },
        score_low: {
          priority: 'warning',
          channels: ['console', 'log', 'email'],
          message: 'Low quality score: {{score}}/100 - {{projectName}}',
          conditions: ['score < 60']
        },
        score_improved: {
          priority: 'success',
          channels: ['console', 'log'],
          message: 'Quality score improved: {{score}}/100 - {{projectName}}',
          conditions: ['score > previous_score']
        }
      }
    };
  }

  loadNotificationChannels() {
    return {
      console: {
        name: 'Console',
        enabled: true,
        send: (notification) => this.sendToConsole(notification)
      },
      log: {
        name: 'Log File',
        enabled: true,
        send: (notification) => this.sendToLog(notification)
      },
      email: {
        name: 'Email',
        enabled: false,
        send: (notification) => this.sendToEmail(notification)
      },
      slack: {
        name: 'Slack',
        enabled: false,
        send: (notification) => this.sendToSlack(notification)
      },
      webhook: {
        name: 'Webhook',
        enabled: false,
        send: (notification) => this.sendToWebhook(notification)
      },
      database: {
        name: 'Database',
        enabled: true,
        send: (notification) => this.sendToDatabase(notification)
      }
    };
  }

  // Notification Management
  sendNotification(type, category, data, options = {}) {
    const notification = this.createNotification(type, category, data, options);
    
    // Check if notification should be sent based on rules
    if (!this.shouldSendNotification(notification)) {
      return notification;
    }

    // Send to appropriate channels
    this.deliverNotification(notification);
    
    // Store in history
    this.notificationHistory.push(notification);
    this.saveNotificationHistory();
    
    // Emit event for other systems
    this.emit('notification:sent', notification);
    
    return notification;
  }

  createNotification(type, category, data, options = {}) {
    const rule = this.rules[category]?.[type];
    if (!rule) {
      throw new Error(`No rule found for ${category}.${type}`);
    }

    const notification = {
      id: this.generateId(),
      type,
      category,
      priority: rule.priority,
      message: this.processTemplate(rule.message, data),
      data,
      channels: rule.channels,
      conditions: rule.conditions,
      timestamp: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      options
    };

    return notification;
  }

  shouldSendNotification(notification) {
    // Check conditions
    for (const condition of notification.conditions) {
      if (!this.evaluateCondition(condition, notification.data)) {
        return false;
      }
    }

    // Check if user is subscribed to this type of notification
    if (this.subscribers.has(notification.category)) {
      const subscribers = this.subscribers.get(notification.category);
      if (subscribers.length === 0) {
        return false;
      }
    }

    // Check rate limiting
    if (!this.checkRateLimit(notification)) {
      return false;
    }

    return true;
  }

  evaluateCondition(condition, data) {
    // Simple condition evaluation
    // In a real system, this would be more sophisticated
    switch (condition) {
      case 'always':
        return true;
      case 'due_in_days <= 3':
        if (data.dueDate) {
          const daysUntilDue = this.getDaysUntilDue(data.dueDate);
          return daysUntilDue <= 3;
        }
        return false;
      case 'due_date < now':
        if (data.dueDate) {
          return new Date(data.dueDate) < new Date();
        }
        return false;
      case 'score < 60':
        return data.score < 60;
      case 'score > previous_score':
        return data.score > (data.previousScore || 0);
      default:
        return true;
    }
  }

  checkRateLimit(notification) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Count notifications of same type in last hour
    const recentNotifications = this.notificationHistory.filter(n => 
      n.category === notification.category &&
      n.type === notification.type &&
      new Date(n.timestamp) > oneHourAgo
    );

    // Rate limit: max 10 notifications per hour per type
    return recentNotifications.length < 10;
  }

  deliverNotification(notification) {
    for (const channelName of notification.channels) {
      const channel = this.channels[channelName];
      if (channel && channel.enabled) {
        try {
          channel.send(notification);
          notification.status = 'delivered';
        } catch (error) {
          console.error(`Failed to send notification via ${channelName}:`, error.message);
          notification.status = 'failed';
          notification.attempts++;
        }
      }
    }
  }

  // Channel Implementations
  sendToConsole(notification) {
    const colors = {
      error: '\x1b[31m',    // Red
      warning: '\x1b[33m',  // Yellow
      info: '\x1b[36m',     // Cyan
      success: '\x1b[32m',  // Green
      default: '\x1b[0m'    // Reset
    };
    
    const color = colors[notification.priority] || colors.default;
    const reset = colors.default;
    
    console.log(`${color}[${notification.priority.toUpperCase()}]${reset} ${notification.message}`);
    if (notification.data && Object.keys(notification.data).length > 0) {
      console.log(`  Data: ${JSON.stringify(notification.data, null, 2)}`);
    }
  }

  sendToLog(notification) {
    const logEntry = {
      timestamp: notification.timestamp,
      level: notification.priority,
      category: notification.category,
      type: notification.type,
      message: notification.message,
      data: notification.data
    };

    const logFile = path.join(this.notificationsPath, 'notifications.log');
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine);
  }

  sendToEmail(notification) {
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    console.log(`[EMAIL] Would send: ${notification.message}`);
  }

  sendToSlack(notification) {
    // This would integrate with Slack API
    console.log(`[SLACK] Would send: ${notification.message}`);
  }

  sendToWebhook(notification) {
    // This would send HTTP POST to configured webhook
    console.log(`[WEBHOOK] Would send: ${notification.message}`);
  }

  sendToDatabase(notification) {
    // This would store in database
    const dbFile = path.join(this.notificationsPath, 'notifications.json');
    let notifications = [];
    
    if (fs.existsSync(dbFile)) {
      notifications = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    }
    
    notifications.push(notification);
    fs.writeFileSync(dbFile, JSON.stringify(notifications, null, 2));
  }

  // Subscription Management
  subscribe(category, subscriber) {
    if (!this.subscribers.has(category)) {
      this.subscribers.set(category, []);
    }
    this.subscribers.get(category).push(subscriber);
  }

  unsubscribe(category, subscriber) {
    if (this.subscribers.has(category)) {
      const subscribers = this.subscribers.get(category);
      const index = subscribers.indexOf(subscriber);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  // Notification Rules Management
  addRule(category, type, rule) {
    if (!this.rules[category]) {
      this.rules[category] = {};
    }
    this.rules[category][type] = rule;
    this.saveRules();
  }

  updateRule(category, type, updates) {
    if (this.rules[category] && this.rules[category][type]) {
      this.rules[category][type] = { ...this.rules[category][type], ...updates };
      this.saveRules();
    }
  }

  removeRule(category, type) {
    if (this.rules[category] && this.rules[category][type]) {
      delete this.rules[category][type];
      this.saveRules();
    }
  }

  saveRules() {
    const rulesFile = path.join(this.configPath, 'notification-rules.json');
    fs.writeFileSync(rulesFile, JSON.stringify(this.rules, null, 2));
  }

  loadRules() {
    const rulesFile = path.join(this.configPath, 'notification-rules.json');
    if (fs.existsSync(rulesFile)) {
      this.rules = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
    }
  }

  // Channel Management
  enableChannel(channelName) {
    if (this.channels[channelName]) {
      this.channels[channelName].enabled = true;
    }
  }

  disableChannel(channelName) {
    if (this.channels[channelName]) {
      this.channels[channelName].enabled = false;
    }
  }

  addChannel(name, channel) {
    this.channels[name] = channel;
  }

  // Notification History and Analytics
  getNotificationHistory(filters = {}) {
    let history = [...this.notificationHistory];
    
    if (filters.category) {
      history = history.filter(n => n.category === filters.category);
    }
    
    if (filters.type) {
      history = history.filter(n => n.type === filters.type);
    }
    
    if (filters.priority) {
      history = history.filter(n => n.priority === filters.priority);
    }
    
    if (filters.startDate) {
      history = history.filter(n => new Date(n.timestamp) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      history = history.filter(n => new Date(n.timestamp) <= new Date(filters.endDate));
    }
    
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getNotificationStats(period = '24h') {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }
    
    const recentNotifications = this.notificationHistory.filter(n => 
      new Date(n.timestamp) >= startDate
    );
    
    const stats = {
      total: recentNotifications.length,
      byPriority: {},
      byCategory: {},
      byType: {},
      byChannel: {},
      successRate: 0,
      failureRate: 0
    };
    
    recentNotifications.forEach(notification => {
      // Count by priority
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      
      // Count by category
      stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
      
      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      
      // Count by channel
      notification.channels.forEach(channel => {
        stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
      });
    });
    
    // Calculate success/failure rates
    const successful = recentNotifications.filter(n => n.status === 'delivered').length;
    const failed = recentNotifications.filter(n => n.status === 'failed').length;
    
    if (recentNotifications.length > 0) {
      stats.successRate = Math.round((successful / recentNotifications.length) * 100);
      stats.failureRate = Math.round((failed / recentNotifications.length) * 100);
    }
    
    return stats;
  }

  // Smart Notification Features
  sendSmartNotification(context, event, data) {
    // Analyze context to determine best notification strategy
    const analysis = this.analyzeContext(context, event, data);
    
    // Adjust notification based on analysis
    const smartNotification = this.createSmartNotification(analysis, data);
    
    // Send notification
    return this.sendNotification(
      smartNotification.type,
      smartNotification.category,
      smartNotification.data,
      smartNotification.options
    );
  }

  analyzeContext(context, event, data) {
    const analysis = {
      urgency: 'normal',
      channels: ['console', 'log'],
      priority: 'info',
      message: event,
      data
    };
    
    // Determine urgency based on context
    if (context.project && context.project.deadline) {
      const daysUntilDeadline = this.getDaysUntilDue(context.project.deadline);
      if (daysUntilDeadline < 1) {
        analysis.urgency = 'critical';
        analysis.priority = 'error';
        analysis.channels.push('email', 'slack');
      } else if (daysUntilDeadline < 3) {
        analysis.urgency = 'high';
        analysis.priority = 'warning';
        analysis.channels.push('email');
      }
    }
    
    // Determine channels based on user preferences and context
    if (context.user && context.user.preferences) {
      analysis.channels = context.user.preferences.notificationChannels || analysis.channels;
    }
    
    // Determine priority based on event type
    if (event.includes('error') || event.includes('failed')) {
      analysis.priority = 'error';
    } else if (event.includes('warning') || event.includes('overdue')) {
      analysis.priority = 'warning';
    } else if (event.includes('completed') || event.includes('success')) {
      analysis.priority = 'success';
    }
    
    return analysis;
  }

  createSmartNotification(analysis, data) {
    return {
      type: analysis.message,
      category: 'smart',
      priority: analysis.priority,
      message: this.processTemplate(analysis.message, data),
      data,
      channels: analysis.channels,
      conditions: ['always'],
      options: {
        urgency: analysis.urgency,
        smart: true
      }
    };
  }

  // Utility Methods
  processTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  getDaysUntilDue(dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  saveNotificationHistory() {
    const historyFile = path.join(this.notificationsPath, 'history.json');
    fs.writeFileSync(historyFile, JSON.stringify(this.notificationHistory, null, 2));
  }

  loadNotificationHistory() {
    const historyFile = path.join(this.notificationsPath, 'history.json');
    if (fs.existsSync(historyFile)) {
      this.notificationHistory = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
  }

  // Cleanup and Maintenance
  cleanupOldNotifications(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.notificationHistory = this.notificationHistory.filter(notification => 
      new Date(notification.timestamp) > cutoffDate
    );
    
    this.saveNotificationHistory();
  }

  // Test and Debug
  testNotification(category, type, data) {
    console.log(`\n🧪 Testing notification: ${category}.${type}`);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    const notification = this.sendNotification(type, category, data);
    console.log('Result:', notification);
    
    return notification;
  }

  // Export/Import
  exportNotifications(format = 'json') {
    const data = {
      rules: this.rules,
      channels: this.channels,
      history: this.notificationHistory
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.notificationsToCSV();
    }
    
    throw new Error(`Unsupported format: ${format}`);
  }

  notificationsToCSV() {
    let csv = 'Timestamp,Category,Type,Priority,Message,Status\n';
    this.notificationHistory.forEach(notification => {
      csv += `"${notification.timestamp}","${notification.category}","${notification.type}","${notification.priority}","${notification.message}","${notification.status}"\n`;
    });
    return csv;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const notificationSystem = new SmartNotificationSystem();

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🔔 ManagerAgentAI Smart Notification System

Usage:
  node smart-notifications.js <command> [options]

Commands:
  send <category> <type> <data>    Send a notification
  test <category> <type> <data>    Test a notification
  stats [period]                   Show notification statistics
  history [filters]                Show notification history
  rules                            Show notification rules
  channels                         Show available channels
  cleanup [days]                   Cleanup old notifications
  export [format]                  Export notifications

Examples:
  node smart-notifications.js send project created '{"projectName":"My App"}'
  node smart-notifications.js test task overdue '{"taskTitle":"Fix bug","dueDate":"2023-01-01"}'
  node smart-notifications.js stats 24h
  node smart-notifications.js history '{"category":"project"}'
  node smart-notifications.js cleanup 30
  node smart-notifications.js export csv
`);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'send':
        if (args.length < 4) {
          console.error('❌ Category, type, and data are required');
          process.exit(1);
        }
        const category = args[1];
        const type = args[2];
        const data = JSON.parse(args[3]);
        const notification = notificationSystem.sendNotification(type, category, data);
        console.log(`✅ Notification sent: ${notification.id}`);
        break;

      case 'test':
        if (args.length < 4) {
          console.error('❌ Category, type, and data are required');
          process.exit(1);
        }
        const testCategory = args[1];
        const testType = args[2];
        const testData = JSON.parse(args[3]);
        notificationSystem.testNotification(testCategory, testType, testData);
        break;

      case 'stats':
        const period = args[1] || '24h';
        const stats = notificationSystem.getNotificationStats(period);
        console.log(`\n📊 Notification Statistics (${period}):`);
        console.log(`Total: ${stats.total}`);
        console.log(`Success Rate: ${stats.successRate}%`);
        console.log(`Failure Rate: ${stats.failureRate}%`);
        console.log('\nBy Priority:');
        Object.entries(stats.byPriority).forEach(([priority, count]) => {
          console.log(`  ${priority}: ${count}`);
        });
        break;

      case 'history':
        const filters = args.length > 1 ? JSON.parse(args[1]) : {};
        const history = notificationSystem.getNotificationHistory(filters);
        console.log(`\n📋 Notification History (${history.length} notifications):`);
        history.slice(0, 10).forEach(notification => {
          console.log(`${notification.timestamp} [${notification.priority}] ${notification.message}`);
        });
        break;

      case 'rules':
        console.log('\n📋 Notification Rules:');
        Object.entries(notificationSystem.rules).forEach(([category, types]) => {
          console.log(`\n${category}:`);
          Object.entries(types).forEach(([type, rule]) => {
            console.log(`  ${type}: ${rule.message}`);
          });
        });
        break;

      case 'channels':
        console.log('\n📡 Available Channels:');
        Object.entries(notificationSystem.channels).forEach(([name, channel]) => {
          console.log(`  ${name}: ${channel.name} (${channel.enabled ? 'enabled' : 'disabled'})`);
        });
        break;

      case 'cleanup':
        const days = parseInt(args[1]) || 30;
        notificationSystem.cleanupOldNotifications(days);
        console.log(`✅ Cleaned up notifications older than ${days} days`);
        break;

      case 'export':
        const format = args[1] || 'json';
        const exported = notificationSystem.exportNotifications(format);
        console.log(exported);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Use --help for available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = SmartNotificationSystem;
