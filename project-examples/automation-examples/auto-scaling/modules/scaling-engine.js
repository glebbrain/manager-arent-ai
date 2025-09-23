const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class ScalingEngine {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/scaling-engine.log' })
      ]
    });
    
    this.scalingRules = new Map();
    this.scalingPolicies = new Map();
    this.scalingDecisions = new Map();
    this.engineData = {
      totalRules: 0,
      activeRules: 0,
      totalDecisions: 0,
      successfulDecisions: 0,
      failedDecisions: 0,
      averageDecisionTime: 0
    };
  }

  // Initialize scaling engine
  async initialize() {
    try {
      this.initializeScalingRules();
      this.initializeScalingPolicies();
      
      this.logger.info('Scaling engine initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing scaling engine:', error);
      throw error;
    }
  }

  // Initialize scaling rules
  initializeScalingRules() {
    this.scalingRules = new Map([
      ['cpu_high', {
        id: 'cpu_high',
        name: 'High CPU Utilization',
        description: 'Scale up when CPU utilization is high',
        metric: 'cpu_utilization',
        operator: '>',
        threshold: 70,
        action: 'scale_up',
        instances: 1,
        cooldown: 300, // 5 minutes
        enabled: true,
        priority: 1
      }],
      ['cpu_low', {
        id: 'cpu_low',
        name: 'Low CPU Utilization',
        description: 'Scale down when CPU utilization is low',
        metric: 'cpu_utilization',
        operator: '<',
        threshold: 30,
        action: 'scale_down',
        instances: 1,
        cooldown: 600, // 10 minutes
        enabled: true,
        priority: 2
      }],
      ['memory_high', {
        id: 'memory_high',
        name: 'High Memory Utilization',
        description: 'Scale up when memory utilization is high',
        metric: 'memory_utilization',
        operator: '>',
        threshold: 80,
        action: 'scale_up',
        instances: 1,
        cooldown: 300,
        enabled: true,
        priority: 1
      }],
      ['memory_low', {
        id: 'memory_low',
        name: 'Low Memory Utilization',
        description: 'Scale down when memory utilization is low',
        metric: 'memory_utilization',
        operator: '<',
        threshold: 40,
        action: 'scale_down',
        instances: 1,
        cooldown: 600,
        enabled: true,
        priority: 2
      }],
      ['requests_high', {
        id: 'requests_high',
        name: 'High Request Rate',
        description: 'Scale up when request rate is high',
        metric: 'requests_per_second',
        operator: '>',
        threshold: 100,
        action: 'scale_up',
        instances: 2,
        cooldown: 180, // 3 minutes
        enabled: true,
        priority: 1
      }],
      ['requests_low', {
        id: 'requests_low',
        name: 'Low Request Rate',
        description: 'Scale down when request rate is low',
        metric: 'requests_per_second',
        operator: '<',
        threshold: 20,
        action: 'scale_down',
        instances: 1,
        cooldown: 300,
        enabled: true,
        priority: 2
      }],
      ['queue_high', {
        id: 'queue_high',
        name: 'High Queue Length',
        description: 'Scale up when queue length is high',
        metric: 'queue_length',
        operator: '>',
        threshold: 50,
        action: 'scale_up',
        instances: 1,
        cooldown: 120, // 2 minutes
        enabled: true,
        priority: 1
      }],
      ['queue_low', {
        id: 'queue_low',
        name: 'Low Queue Length',
        description: 'Scale down when queue length is low',
        metric: 'queue_length',
        operator: '<',
        threshold: 10,
        action: 'scale_down',
        instances: 1,
        cooldown: 300,
        enabled: true,
        priority: 2
      }],
      ['response_time_high', {
        id: 'response_time_high',
        name: 'High Response Time',
        description: 'Scale up when response time is high',
        metric: 'response_time',
        operator: '>',
        threshold: 1000, // 1 second
        action: 'scale_up',
        instances: 1,
        cooldown: 240, // 4 minutes
        enabled: true,
        priority: 1
      }],
      ['error_rate_high', {
        id: 'error_rate_high',
        name: 'High Error Rate',
        description: 'Scale up when error rate is high',
        metric: 'error_rate',
        operator: '>',
        threshold: 5, // 5%
        action: 'scale_up',
        instances: 1,
        cooldown: 180,
        enabled: true,
        priority: 1
      }]
    ]);

    this.engineData.totalRules = this.scalingRules.size;
    this.engineData.activeRules = Array.from(this.scalingRules.values()).filter(r => r.enabled).length;
  }

  // Initialize scaling policies
  initializeScalingPolicies() {
    this.scalingPolicies = new Map([
      ['conservative', {
        id: 'conservative',
        name: 'Conservative Scaling',
        description: 'Conservative scaling policy with longer cooldowns',
        rules: ['cpu_high', 'cpu_low', 'memory_high', 'memory_low'],
        cooldownMultiplier: 2,
        instanceMultiplier: 1,
        enabled: true
      }],
      ['aggressive', {
        id: 'aggressive',
        name: 'Aggressive Scaling',
        description: 'Aggressive scaling policy with shorter cooldowns',
        rules: ['cpu_high', 'cpu_low', 'memory_high', 'memory_low', 'requests_high', 'requests_low'],
        cooldownMultiplier: 0.5,
        instanceMultiplier: 2,
        enabled: true
      }],
      ['balanced', {
        id: 'balanced',
        name: 'Balanced Scaling',
        description: 'Balanced scaling policy with moderate settings',
        rules: ['cpu_high', 'cpu_low', 'memory_high', 'memory_low', 'requests_high', 'requests_low', 'queue_high', 'queue_low'],
        cooldownMultiplier: 1,
        instanceMultiplier: 1.5,
        enabled: true
      }],
      ['performance', {
        id: 'performance',
        name: 'Performance Scaling',
        description: 'Performance-focused scaling policy',
        rules: ['cpu_high', 'memory_high', 'requests_high', 'response_time_high', 'error_rate_high'],
        cooldownMultiplier: 0.7,
        instanceMultiplier: 2,
        enabled: true
      }],
      ['cost_optimized', {
        id: 'cost_optimized',
        name: 'Cost Optimized Scaling',
        description: 'Cost-optimized scaling policy',
        rules: ['cpu_high', 'cpu_low', 'memory_high', 'memory_low'],
        cooldownMultiplier: 1.5,
        instanceMultiplier: 1,
        enabled: true
      }]
    ]);
  }

  // Evaluate scaling decision
  async evaluateScalingDecision(scalingGroupId, metrics) {
    try {
      const startTime = Date.now();
      
      const decision = {
        id: this.generateId(),
        scalingGroupId: scalingGroupId,
        timestamp: new Date(),
        metrics: metrics,
        rules: [],
        actions: [],
        status: 'evaluating',
        startTime: startTime,
        endTime: null,
        duration: 0
      };

      this.scalingDecisions.set(decision.id, decision);
      this.engineData.totalDecisions++;

      // Get applicable rules
      const applicableRules = await this.getApplicableRules(scalingGroupId, metrics);
      
      // Evaluate each rule
      for (const rule of applicableRules) {
        const ruleResult = await this.evaluateRule(rule, metrics);
        decision.rules.push(ruleResult);
        
        if (ruleResult.triggered) {
          const action = await this.generateScalingAction(rule, scalingGroupId);
          decision.actions.push(action);
        }
      }

      // Sort actions by priority
      decision.actions.sort((a, b) => a.priority - b.priority);

      // Apply cooldown logic
      decision.actions = await this.applyCooldownLogic(decision.actions, scalingGroupId);

      decision.status = 'completed';
      decision.endTime = new Date();
      decision.duration = decision.endTime - decision.startTime;

      this.scalingDecisions.set(decision.id, decision);
      this.engineData.successfulDecisions++;

      this.logger.info('Scaling decision evaluated', {
        decisionId: decision.id,
        scalingGroupId: scalingGroupId,
        rulesEvaluated: decision.rules.length,
        actionsGenerated: decision.actions.length
      });

      return decision;
    } catch (error) {
      this.logger.error('Error evaluating scaling decision:', error);
      this.engineData.failedDecisions++;
      throw error;
    }
  }

  // Get applicable rules
  async getApplicableRules(scalingGroupId, metrics) {
    const applicableRules = [];
    
    for (const rule of this.scalingRules.values()) {
      if (!rule.enabled) continue;
      
      // Check if rule applies to the metrics
      if (metrics[rule.metric] !== undefined) {
        applicableRules.push(rule);
      }
    }
    
    return applicableRules.sort((a, b) => a.priority - b.priority);
  }

  // Evaluate individual rule
  async evaluateRule(rule, metrics) {
    const metricValue = metrics[rule.metric];
    let triggered = false;
    
    switch (rule.operator) {
      case '>':
        triggered = metricValue > rule.threshold;
        break;
      case '>=':
        triggered = metricValue >= rule.threshold;
        break;
      case '<':
        triggered = metricValue < rule.threshold;
        break;
      case '<=':
        triggered = metricValue <= rule.threshold;
        break;
      case '==':
        triggered = metricValue === rule.threshold;
        break;
      case '!=':
        triggered = metricValue !== rule.threshold;
        break;
      default:
        triggered = false;
    }
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      metric: rule.metric,
      operator: rule.operator,
      threshold: rule.threshold,
      value: metricValue,
      triggered: triggered,
      priority: rule.priority
    };
  }

  // Generate scaling action
  async generateScalingAction(rule, scalingGroupId) {
    const action = {
      id: this.generateId(),
      ruleId: rule.id,
      scalingGroupId: scalingGroupId,
      action: rule.action,
      instances: rule.instances,
      priority: rule.priority,
      cooldown: rule.cooldown,
      reason: `${rule.name}: ${rule.metric} ${rule.operator} ${rule.threshold}`,
      timestamp: new Date()
    };
    
    return action;
  }

  // Apply cooldown logic
  async applyCooldownLogic(actions, scalingGroupId) {
    const filteredActions = [];
    const now = new Date();
    
    for (const action of actions) {
      // Check if action is within cooldown period
      const lastAction = await this.getLastScalingAction(scalingGroupId, action.action);
      
      if (lastAction) {
        const timeSinceLastAction = now - lastAction.timestamp;
        const cooldownPeriod = action.cooldown * 1000; // Convert to milliseconds
        
        if (timeSinceLastAction < cooldownPeriod) {
          this.logger.info('Action skipped due to cooldown', {
            actionId: action.id,
            scalingGroupId: scalingGroupId,
            timeSinceLastAction: timeSinceLastAction,
            cooldownPeriod: cooldownPeriod
          });
          continue;
        }
      }
      
      filteredActions.push(action);
    }
    
    return filteredActions;
  }

  // Get last scaling action
  async getLastScalingAction(scalingGroupId, actionType) {
    // This would typically query a database
    // For now, return null to simulate no previous actions
    return null;
  }

  // Create scaling rule
  async createScalingRule(config) {
    try {
      const rule = {
        id: config.id || this.generateId(),
        name: config.name,
        description: config.description || '',
        metric: config.metric,
        operator: config.operator,
        threshold: config.threshold,
        action: config.action,
        instances: config.instances || 1,
        cooldown: config.cooldown || 300,
        enabled: config.enabled !== false,
        priority: config.priority || 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.scalingRules.set(rule.id, rule);
      this.engineData.totalRules++;
      
      if (rule.enabled) {
        this.engineData.activeRules++;
      }

      this.logger.info('Scaling rule created successfully', { ruleId: rule.id });
      return rule;
    } catch (error) {
      this.logger.error('Error creating scaling rule:', error);
      throw error;
    }
  }

  // Update scaling rule
  async updateScalingRule(ruleId, updates) {
    try {
      const rule = this.scalingRules.get(ruleId);
      if (!rule) {
        throw new Error('Scaling rule not found');
      }

      const wasEnabled = rule.enabled;
      Object.assign(rule, updates);
      rule.updatedAt = new Date();

      this.scalingRules.set(ruleId, rule);

      // Update active rules count
      if (wasEnabled !== rule.enabled) {
        if (rule.enabled) {
          this.engineData.activeRules++;
        } else {
          this.engineData.activeRules--;
        }
      }

      this.logger.info('Scaling rule updated successfully', { ruleId });
      return rule;
    } catch (error) {
      this.logger.error('Error updating scaling rule:', error);
      throw error;
    }
  }

  // Delete scaling rule
  async deleteScalingRule(ruleId) {
    try {
      const rule = this.scalingRules.get(ruleId);
      if (!rule) {
        throw new Error('Scaling rule not found');
      }

      this.scalingRules.delete(ruleId);
      this.engineData.totalRules--;

      if (rule.enabled) {
        this.engineData.activeRules--;
      }

      this.logger.info('Scaling rule deleted successfully', { ruleId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting scaling rule:', error);
      throw error;
    }
  }

  // Get scaling rules
  async getScalingRules() {
    return Array.from(this.scalingRules.values());
  }

  // Get scaling policies
  async getScalingPolicies() {
    return Array.from(this.scalingPolicies.values());
  }

  // Get scaling decisions
  async getScalingDecisions(scalingGroupId = null) {
    let decisions = Array.from(this.scalingDecisions.values());
    
    if (scalingGroupId) {
      decisions = decisions.filter(d => d.scalingGroupId === scalingGroupId);
    }
    
    return decisions.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get engine data
  async getEngineData() {
    return {
      ...this.engineData,
      successRate: this.engineData.totalDecisions > 0 ? 
        (this.engineData.successfulDecisions / this.engineData.totalDecisions) * 100 : 0,
      failureRate: this.engineData.totalDecisions > 0 ? 
        (this.engineData.failedDecisions / this.engineData.totalDecisions) * 100 : 0
    };
  }

  // Generate unique ID
  generateId() {
    return `engine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new ScalingEngine();
