const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/billing-service.log' })
  ]
});

class BillingService {
  constructor() {
    this.subscriptions = new Map(); // In-memory storage
    this.invoices = new Map(); // Invoice storage
    this.paymentMethods = new Map(); // Payment method storage
    this.usageRecords = new Map(); // Usage tracking
  }

  /**
   * Create subscription for organization
   * @param {string} organizationId - Organization ID
   * @param {Object} subscriptionData - Subscription data
   * @returns {Object} Created subscription
   */
  async createSubscription(organizationId, subscriptionData) {
    try {
      const subscriptionId = uuidv4();
      const subscription = {
        id: subscriptionId,
        organizationId,
        plan: subscriptionData.plan,
        status: 'active',
        billingCycle: subscriptionData.billingCycle || 'monthly',
        price: this.getPlanPrice(subscriptionData.plan, subscriptionData.billingCycle),
        currency: subscriptionData.currency || 'USD',
        startDate: new Date().toISOString(),
        nextBillingDate: this.calculateNextBillingDate(subscriptionData.billingCycle),
        trialEndsAt: subscriptionData.trialPeriod ? 
          new Date(Date.now() + subscriptionData.trialPeriod * 24 * 60 * 60 * 1000).toISOString() : null,
        features: this.getPlanFeatures(subscriptionData.plan),
        limits: this.getPlanLimits(subscriptionData.plan),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.subscriptions.set(subscriptionId, subscription);
      logger.info('Subscription created successfully', { subscriptionId, organizationId, plan: subscription.plan });
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription by ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Object|null} Subscription object or null
   */
  async getSubscription(subscriptionId) {
    try {
      return this.subscriptions.get(subscriptionId) || null;
    } catch (error) {
      logger.error('Error getting subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription by organization ID
   * @param {string} organizationId - Organization ID
   * @returns {Object|null} Subscription object or null
   */
  async getSubscriptionByOrganization(organizationId) {
    try {
      for (const [subscriptionId, subscription] of this.subscriptions) {
        if (subscription.organizationId === organizationId && subscription.status === 'active') {
          return subscription;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting subscription by organization:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated subscription
   */
  async updateSubscription(subscriptionId, updateData) {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const updatedSubscription = {
        ...subscription,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Recalculate next billing date if plan or cycle changed
      if (updateData.plan || updateData.billingCycle) {
        updatedSubscription.nextBillingDate = this.calculateNextBillingDate(
          updateData.billingCycle || subscription.billingCycle
        );
        updatedSubscription.price = this.getPlanPrice(
          updateData.plan || subscription.plan,
          updateData.billingCycle || subscription.billingCycle
        );
        updatedSubscription.features = this.getPlanFeatures(updateData.plan || subscription.plan);
        updatedSubscription.limits = this.getPlanLimits(updateData.plan || subscription.plan);
      }

      this.subscriptions.set(subscriptionId, updatedSubscription);
      logger.info('Subscription updated successfully', { subscriptionId });
      return updatedSubscription;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} reason - Cancellation reason
   * @returns {Object} Cancelled subscription
   */
  async cancelSubscription(subscriptionId, reason = '') {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const cancelledSubscription = {
        ...subscription,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
        updatedAt: new Date().toISOString()
      };

      this.subscriptions.set(subscriptionId, cancelledSubscription);
      logger.info('Subscription cancelled successfully', { subscriptionId, reason });
      return cancelledSubscription;
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Create invoice
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} invoiceData - Invoice data
   * @returns {Object} Created invoice
   */
  async createInvoice(subscriptionId, invoiceData = {}) {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const invoiceId = uuidv4();
      const invoice = {
        id: invoiceId,
        subscriptionId,
        organizationId: subscription.organizationId,
        amount: subscription.price,
        currency: subscription.currency,
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        items: [
          {
            description: `${subscription.plan} plan - ${subscription.billingCycle}`,
            amount: subscription.price,
            quantity: 1
          }
        ],
        subtotal: subscription.price,
        tax: this.calculateTax(subscription.price),
        total: subscription.price + this.calculateTax(subscription.price),
        createdAt: new Date().toISOString(),
        paidAt: null
      };

      this.invoices.set(invoiceId, invoice);
      logger.info('Invoice created successfully', { invoiceId, subscriptionId, amount: invoice.total });
      return invoice;
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Process payment for invoice
   * @param {string} invoiceId - Invoice ID
   * @param {Object} paymentData - Payment data
   * @returns {Object} Payment result
   */
  async processPayment(invoiceId, paymentData) {
    try {
      const invoice = this.invoices.get(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'paid') {
        throw new Error('Invoice already paid');
      }

      // Simulate payment processing
      const paymentResult = await this.simulatePaymentProcess(invoice, paymentData);

      if (paymentResult.success) {
        // Update invoice status
        invoice.status = 'paid';
        invoice.paidAt = new Date().toISOString();
        invoice.paymentMethod = paymentData.paymentMethod;
        invoice.transactionId = paymentResult.transactionId;

        this.invoices.set(invoiceId, invoice);

        // Update subscription next billing date
        const subscription = await this.getSubscription(invoice.subscriptionId);
        if (subscription) {
          subscription.nextBillingDate = this.calculateNextBillingDate(subscription.billingCycle);
          this.subscriptions.set(invoice.subscriptionId, subscription);
        }

        logger.info('Payment processed successfully', { invoiceId, transactionId: paymentResult.transactionId });
      }

      return paymentResult;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Simulate payment processing
   * @param {Object} invoice - Invoice object
   * @param {Object} paymentData - Payment data
   * @returns {Object} Payment result
   */
  async simulatePaymentProcess(invoice, paymentData) {
    try {
      // Simulate payment gateway response
      const success = Math.random() > 0.1; // 90% success rate for simulation

      return {
        success,
        transactionId: success ? uuidv4() : null,
        error: success ? null : 'Payment declined by bank',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error simulating payment process:', error);
      return {
        success: false,
        transactionId: null,
        error: 'Payment processing failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get invoices for organization
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Filter options
   * @returns {Array} List of invoices
   */
  async getInvoices(organizationId, filters = {}) {
    try {
      let invoices = Array.from(this.invoices.values())
        .filter(invoice => invoice.organizationId === organizationId);

      // Apply filters
      if (filters.status) {
        invoices = invoices.filter(invoice => invoice.status === filters.status);
      }
      if (filters.fromDate) {
        invoices = invoices.filter(invoice => new Date(invoice.createdAt) >= new Date(filters.fromDate));
      }
      if (filters.toDate) {
        invoices = invoices.filter(invoice => new Date(invoice.createdAt) <= new Date(filters.toDate));
      }

      // Sort by creation date (newest first)
      invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return invoices;
    } catch (error) {
      logger.error('Error getting invoices:', error);
      throw error;
    }
  }

  /**
   * Track usage for billing
   * @param {string} organizationId - Organization ID
   * @param {string} metric - Usage metric
   * @param {number} value - Usage value
   * @returns {Object} Usage record
   */
  async trackUsage(organizationId, metric, value) {
    try {
      const usageId = uuidv4();
      const usageRecord = {
        id: usageId,
        organizationId,
        metric,
        value,
        timestamp: new Date().toISOString(),
        billingPeriod: this.getCurrentBillingPeriod()
      };

      this.usageRecords.set(usageId, usageRecord);
      logger.info('Usage tracked', { organizationId, metric, value });
      return usageRecord;
    } catch (error) {
      logger.error('Error tracking usage:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics for organization
   * @param {string} organizationId - Organization ID
   * @param {string} period - Billing period
   * @returns {Object} Usage statistics
   */
  async getUsageStats(organizationId, period = 'current') {
    try {
      const targetPeriod = period === 'current' ? this.getCurrentBillingPeriod() : period;
      
      const usageRecords = Array.from(this.usageRecords.values())
        .filter(record => 
          record.organizationId === organizationId && 
          record.billingPeriod === targetPeriod
        );

      const stats = {
        organizationId,
        period: targetPeriod,
        metrics: {}
      };

      // Aggregate usage by metric
      usageRecords.forEach(record => {
        if (!stats.metrics[record.metric]) {
          stats.metrics[record.metric] = {
            total: 0,
            count: 0,
            average: 0
          };
        }
        stats.metrics[record.metric].total += record.value;
        stats.metrics[record.metric].count += 1;
      });

      // Calculate averages
      Object.keys(stats.metrics).forEach(metric => {
        const metricData = stats.metrics[metric];
        metricData.average = metricData.count > 0 ? metricData.total / metricData.count : 0;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting usage stats:', error);
      throw error;
    }
  }

  /**
   * Get plan price
   * @param {string} plan - Plan name
   * @param {string} billingCycle - Billing cycle
   * @returns {number} Plan price
   */
  getPlanPrice(plan, billingCycle = 'monthly') {
    const prices = {
      basic: {
        monthly: 29,
        yearly: 290
      },
      professional: {
        monthly: 99,
        yearly: 990
      },
      enterprise: {
        monthly: 299,
        yearly: 2990
      }
    };

    return prices[plan]?.[billingCycle] || 0;
  }

  /**
   * Get plan features
   * @param {string} plan - Plan name
   * @returns {Array} Plan features
   */
  getPlanFeatures(plan) {
    const features = {
      basic: [
        'up_to_10_users',
        'up_to_5_projects',
        'basic_analytics',
        'email_support'
      ],
      professional: [
        'up_to_50_users',
        'up_to_25_projects',
        'advanced_analytics',
        'ai_analysis',
        'priority_support',
        'api_access'
      ],
      enterprise: [
        'unlimited_users',
        'unlimited_projects',
        'advanced_analytics',
        'ai_analysis',
        'custom_integrations',
        'dedicated_support',
        'full_api_access',
        'custom_branding',
        'sso_integration'
      ]
    };

    return features[plan] || features.basic;
  }

  /**
   * Get plan limits
   * @param {string} plan - Plan name
   * @returns {Object} Plan limits
   */
  getPlanLimits(plan) {
    const limits = {
      basic: {
        maxUsers: 10,
        maxProjects: 5,
        maxStorage: 1024, // MB
        apiCallsPerMonth: 10000
      },
      professional: {
        maxUsers: 50,
        maxProjects: 25,
        maxStorage: 10240, // 10GB
        apiCallsPerMonth: 100000
      },
      enterprise: {
        maxUsers: -1, // Unlimited
        maxProjects: -1, // Unlimited
        maxStorage: -1, // Unlimited
        apiCallsPerMonth: -1 // Unlimited
      }
    };

    return limits[plan] || limits.basic;
  }

  /**
   * Calculate next billing date
   * @param {string} billingCycle - Billing cycle
   * @returns {string} Next billing date
   */
  calculateNextBillingDate(billingCycle) {
    const now = new Date();
    if (billingCycle === 'yearly') {
      now.setFullYear(now.getFullYear() + 1);
    } else {
      now.setMonth(now.getMonth() + 1);
    }
    return now.toISOString();
  }

  /**
   * Calculate tax
   * @param {number} amount - Amount
   * @returns {number} Tax amount
   */
  calculateTax(amount) {
    return Math.round(amount * 0.08 * 100) / 100; // 8% tax
  }

  /**
   * Get current billing period
   * @returns {string} Current billing period
   */
  getCurrentBillingPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get billing summary for organization
   * @param {string} organizationId - Organization ID
   * @returns {Object} Billing summary
   */
  async getBillingSummary(organizationId) {
    try {
      const subscription = await this.getSubscriptionByOrganization(organizationId);
      if (!subscription) {
        return {
          organizationId,
          hasActiveSubscription: false,
          message: 'No active subscription found'
        };
      }

      const invoices = await this.getInvoices(organizationId);
      const usageStats = await this.getUsageStats(organizationId);

      return {
        organizationId,
        hasActiveSubscription: true,
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          nextBillingDate: subscription.nextBillingDate,
          price: subscription.price,
          currency: subscription.currency
        },
        recentInvoices: invoices.slice(0, 5),
        usageStats,
        totalInvoices: invoices.length,
        totalPaid: invoices
          .filter(invoice => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + invoice.total, 0)
      };
    } catch (error) {
      logger.error('Error getting billing summary:', error);
      throw error;
    }
  }
}

module.exports = new BillingService();
