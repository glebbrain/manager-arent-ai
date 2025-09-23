const winston = require('winston');
const _ = require('lodash');

class AutoScaler {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/auto-scaler.log' })
      ]
    });
    
    this.scalingPolicies = new Map();
    this.resources = new Map();
    this.metrics = new Map();
    this.scalingHistory = [];
    this.isEnabled = false;
    this.scalingInterval = null;
  }

  // Initialize auto scaler
  async initialize(config = {}) {
    try {
      this.isEnabled = config.enabled || false;
      this.scalingInterval = config.scalingInterval || 30000; // 30 seconds
      
      // Initialize default scaling policies
      this.initializeDefaultPolicies();
      
      if (this.isEnabled) {
        await this.startScaling();
      }
      
      this.logger.info('Auto scaler initialized successfully', { enabled: this.isEnabled });
    } catch (error) {
      this.logger.error('Error initializing auto scaler:', error);
      throw error;
    }
  }

  // Initialize default scaling policies
  initializeDefaultPolicies() {
    // CPU-based scaling
    this.scalingPolicies.set('cpu', {
      name: 'CPU-based Scaling',
      metric: 'cpu.usage',
      scaleUpThreshold: 80,
      scaleDownThreshold: 20,
      scaleUpCooldown: 300000, // 5 minutes
      scaleDownCooldown: 600000, // 10 minutes
      minInstances: 1,
      maxInstances: 10,
      scaleUpStep: 1,
      scaleDownStep: 1,
      enabled: true
    });

    // Memory-based scaling
    this.scalingPolicies.set('memory', {
      name: 'Memory-based Scaling',
      metric: 'memory.usage',
      scaleUpThreshold: 85,
      scaleDownThreshold: 30,
      scaleUpCooldown: 300000,
      scaleDownCooldown: 600000,
      minInstances: 1,
      maxInstances: 10,
      scaleUpStep: 1,
      scaleDownStep: 1,
      enabled: true
    });

    // Request-based scaling
    this.scalingPolicies.set('requests', {
      name: 'Request-based Scaling',
      metric: 'requests.perSecond',
      scaleUpThreshold: 100,
      scaleDownThreshold: 10,
      scaleUpCooldown: 180000, // 3 minutes
      scaleDownCooldown: 300000, // 5 minutes
      minInstances: 1,
      maxInstances: 20,
      scaleUpStep: 2,
      scaleDownStep: 1,
      enabled: true
    });
  }

  // Start auto scaling
  async startScaling() {
    try {
      if (this.scalingInterval) {
        this.scalingInterval = setInterval(() => {
          this.performScaling();
        }, this.scalingInterval);
        
        this.logger.info('Auto scaling started', { interval: this.scalingInterval });
      }
    } catch (error) {
      this.logger.error('Error starting auto scaling:', error);
      throw error;
    }
  }

  // Stop auto scaling
  async stopScaling() {
    try {
      if (this.scalingInterval) {
        clearInterval(this.scalingInterval);
        this.scalingInterval = null;
      }
      
      this.isEnabled = false;
      this.logger.info('Auto scaling stopped');
    } catch (error) {
      this.logger.error('Error stopping auto scaling:', error);
      throw error;
    }
  }

  // Perform scaling
  async performScaling() {
    try {
      if (!this.isEnabled) return;

      for (const [policyName, policy] of this.scalingPolicies) {
        if (!policy.enabled) continue;

        try {
          await this.evaluateScalingPolicy(policyName, policy);
        } catch (error) {
          this.logger.error('Error evaluating scaling policy:', { policyName, error: error.message });
        }
      }
    } catch (error) {
      this.logger.error('Error performing scaling:', error);
    }
  }

  // Evaluate scaling policy
  async evaluateScalingPolicy(policyName, policy) {
    try {
      const currentMetric = await this.getCurrentMetric(policy.metric);
      if (currentMetric === null || currentMetric === undefined) return;

      const currentInstances = await this.getCurrentInstances();
      const shouldScaleUp = currentMetric > policy.scaleUpThreshold && 
                           currentInstances < policy.maxInstances;
      const shouldScaleDown = currentMetric < policy.scaleDownThreshold && 
                             currentInstances > policy.minInstances;

      if (shouldScaleUp) {
        await this.scaleUp(policyName, policy, currentInstances);
      } else if (shouldScaleDown) {
        await this.scaleDown(policyName, policy, currentInstances);
      }
    } catch (error) {
      this.logger.error('Error evaluating scaling policy:', error);
      throw error;
    }
  }

  // Get current metric value
  async getCurrentMetric(metric) {
    try {
      // This would typically fetch from a metrics service
      // For now, return mock data
      const mockMetrics = {
        'cpu.usage': Math.random() * 100,
        'memory.usage': Math.random() * 100,
        'requests.perSecond': Math.random() * 200
      };

      return mockMetrics[metric] || 0;
    } catch (error) {
      this.logger.error('Error getting current metric:', error);
      return null;
    }
  }

  // Get current number of instances
  async getCurrentInstances() {
    try {
      // This would typically fetch from a container orchestration service
      // For now, return mock data
      return Math.floor(Math.random() * 10) + 1;
    } catch (error) {
      this.logger.error('Error getting current instances:', error);
      return 1;
    }
  }

  // Scale up
  async scaleUp(policyName, policy, currentInstances) {
    try {
      const targetInstances = Math.min(
        currentInstances + policy.scaleUpStep,
        policy.maxInstances
      );

      if (targetInstances <= currentInstances) return;

      // Check cooldown
      if (this.isInCooldown(policyName, 'scaleUp')) {
        this.logger.debug('Scale up in cooldown', { policyName });
        return;
      }

      await this.executeScaling('scaleUp', targetInstances, policyName);
      
      this.logger.info('Scaling up triggered', {
        policyName,
        currentInstances,
        targetInstances,
        metric: policy.metric
      });
    } catch (error) {
      this.logger.error('Error scaling up:', error);
      throw error;
    }
  }

  // Scale down
  async scaleDown(policyName, policy, currentInstances) {
    try {
      const targetInstances = Math.max(
        currentInstances - policy.scaleDownStep,
        policy.minInstances
      );

      if (targetInstances >= currentInstances) return;

      // Check cooldown
      if (this.isInCooldown(policyName, 'scaleDown')) {
        this.logger.debug('Scale down in cooldown', { policyName });
        return;
      }

      await this.executeScaling('scaleDown', targetInstances, policyName);
      
      this.logger.info('Scaling down triggered', {
        policyName,
        currentInstances,
        targetInstances,
        metric: policy.metric
      });
    } catch (error) {
      this.logger.error('Error scaling down:', error);
      throw error;
    }
  }

  // Execute scaling
  async executeScaling(action, targetInstances, policyName) {
    try {
      // This would typically interact with a container orchestration service
      // For now, simulate the scaling operation
      const scalingEvent = {
        id: this.generateId(),
        action,
        targetInstances,
        policyName,
        timestamp: new Date(),
        status: 'pending'
      };

      // Simulate scaling operation
      setTimeout(() => {
        scalingEvent.status = 'completed';
        this.logger.info('Scaling operation completed', { id: scalingEvent.id, action, targetInstances });
      }, 5000);

      this.scalingHistory.push(scalingEvent);
      
      // Set cooldown
      this.setCooldown(policyName, action);
      
      this.logger.info('Scaling operation initiated', { id: scalingEvent.id, action, targetInstances });
      
      return scalingEvent;
    } catch (error) {
      this.logger.error('Error executing scaling:', error);
      throw error;
    }
  }

  // Check if in cooldown
  isInCooldown(policyName, action) {
    const cooldownKey = `${policyName}_${action}`;
    const cooldown = this.metrics.get(cooldownKey);
    
    if (!cooldown) return false;
    
    const policy = this.scalingPolicies.get(policyName);
    const cooldownDuration = action === 'scaleUp' ? policy.scaleUpCooldown : policy.scaleDownCooldown;
    
    return Date.now() - cooldown < cooldownDuration;
  }

  // Set cooldown
  setCooldown(policyName, action) {
    const cooldownKey = `${policyName}_${action}`;
    this.metrics.set(cooldownKey, Date.now());
  }

  // Add scaling policy
  async addScalingPolicy(name, policy) {
    try {
      const scalingPolicy = {
        name: policy.name,
        metric: policy.metric,
        scaleUpThreshold: policy.scaleUpThreshold,
        scaleDownThreshold: policy.scaleDownThreshold,
        scaleUpCooldown: policy.scaleUpCooldown || 300000,
        scaleDownCooldown: policy.scaleDownCooldown || 600000,
        minInstances: policy.minInstances || 1,
        maxInstances: policy.maxInstances || 10,
        scaleUpStep: policy.scaleUpStep || 1,
        scaleDownStep: policy.scaleDownStep || 1,
        enabled: policy.enabled !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.scalingPolicies.set(name, scalingPolicy);
      
      this.logger.info('Scaling policy added successfully', { name });
      return scalingPolicy;
    } catch (error) {
      this.logger.error('Error adding scaling policy:', error);
      throw error;
    }
  }

  // Update scaling policy
  async updateScalingPolicy(name, updates) {
    try {
      const policy = this.scalingPolicies.get(name);
      if (!policy) {
        throw new Error(`Scaling policy not found: ${name}`);
      }

      const updatedPolicy = {
        ...policy,
        ...updates,
        updatedAt: new Date()
      };

      this.scalingPolicies.set(name, updatedPolicy);
      
      this.logger.info('Scaling policy updated successfully', { name });
      return updatedPolicy;
    } catch (error) {
      this.logger.error('Error updating scaling policy:', error);
      throw error;
    }
  }

  // Delete scaling policy
  async deleteScalingPolicy(name) {
    try {
      const policy = this.scalingPolicies.get(name);
      if (!policy) {
        throw new Error(`Scaling policy not found: ${name}`);
      }

      this.scalingPolicies.delete(name);
      
      this.logger.info('Scaling policy deleted successfully', { name });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting scaling policy:', error);
      throw error;
    }
  }

  // Get scaling policies
  async getScalingPolicies() {
    return Array.from(this.scalingPolicies.values());
  }

  // Get scaling history
  async getScalingHistory(limit = 100) {
    return this.scalingHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Get scaling status
  async getScalingStatus() {
    const policies = await this.getScalingPolicies();
    const history = await this.getScalingHistory(10);
    
    return {
      enabled: this.isEnabled,
      policies: policies.length,
      activePolicies: policies.filter(p => p.enabled).length,
      recentScaling: history.filter(h => h.timestamp > new Date(Date.now() - 3600000)).length, // Last hour
      cooldowns: Array.from(this.metrics.entries())
        .filter(([key, value]) => key.includes('_') && Date.now() - value < 3600000)
        .map(([key, value]) => ({ key, remaining: 3600000 - (Date.now() - value) }))
    };
  }

  // Force scale
  async forceScale(action, targetInstances, reason = 'manual') {
    try {
      const scalingEvent = await this.executeScaling(action, targetInstances, 'manual');
      scalingEvent.reason = reason;
      
      this.logger.info('Force scaling executed', { action, targetInstances, reason });
      return scalingEvent;
    } catch (error) {
      this.logger.error('Error force scaling:', error);
      throw error;
    }
  }

  // Get metrics
  async getMetrics() {
    return {
      policies: this.scalingPolicies.size,
      scalingEvents: this.scalingHistory.length,
      cooldowns: this.metrics.size,
      enabled: this.isEnabled
    };
  }

  // Generate unique ID
  generateId() {
    return `scale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new AutoScaler();
