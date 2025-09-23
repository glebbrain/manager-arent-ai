const express = require('express');
const Joi = require('joi');
const billingService = require('../modules/billing-service');
const auditLogger = require('../modules/audit-logger');

const router = express.Router();

// Validation schemas
const createSubscriptionSchema = Joi.object({
  plan: Joi.string().valid('basic', 'professional', 'enterprise').required(),
  billingCycle: Joi.string().valid('monthly', 'yearly').default('monthly'),
  currency: Joi.string().default('USD'),
  trialPeriod: Joi.number().min(0).max(30).optional() // days
});

const updateSubscriptionSchema = Joi.object({
  plan: Joi.string().valid('basic', 'professional', 'enterprise'),
  billingCycle: Joi.string().valid('monthly', 'yearly'),
  status: Joi.string().valid('active', 'suspended', 'cancelled')
});

const processPaymentSchema = Joi.object({
  paymentMethod: Joi.string().required(),
  amount: Joi.number().positive().optional(),
  currency: Joi.string().default('USD')
});

// Create subscription
router.post('/subscriptions', async (req, res) => {
  try {
    const { error, value } = createSubscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const organizationId = req.tenant?.organizationId || req.body.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const subscription = await billingService.createSubscription(organizationId, value);

    // Log audit event
    await auditLogger.logEvent({
      action: 'subscription_created',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { 
        subscriptionId: subscription.id, 
        plan: subscription.plan, 
        billingCycle: subscription.billingCycle 
      }
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription created successfully'
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscription
router.get('/subscriptions/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await billingService.getSubscription(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if user has access to this subscription
    if (req.tenant?.organizationId !== subscription.organizationId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscription by organization
router.get('/organizations/:organizationId/subscription', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const subscription = await billingService.getSubscriptionByOrganization(organizationId);

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Check if user has access to this organization
    if (req.tenant?.organizationId !== organizationId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error getting subscription by organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subscription
router.put('/subscriptions/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { error, value } = updateSubscriptionSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const subscription = await billingService.getSubscription(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if user has access to this subscription
    if (req.tenant?.organizationId !== subscription.organizationId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedSubscription = await billingService.updateSubscription(subscriptionId, value);

    // Log audit event
    await auditLogger.logEvent({
      action: 'subscription_updated',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { 
        subscriptionId, 
        changes: value 
      }
    });

    res.json({
      success: true,
      data: updatedSubscription,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel subscription
router.delete('/subscriptions/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;

    const subscription = await billingService.getSubscription(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if user has access to this subscription
    if (req.tenant?.organizationId !== subscription.organizationId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cancelledSubscription = await billingService.cancelSubscription(subscriptionId, reason);

    // Log audit event
    await auditLogger.logEvent({
      action: 'subscription_cancelled',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { 
        subscriptionId, 
        reason 
      }
    });

    res.json({
      success: true,
      data: cancelledSubscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create invoice
router.post('/invoices', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const subscription = await billingService.getSubscription(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if user has access to this subscription
    if (req.tenant?.organizationId !== subscription.organizationId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const invoice = await billingService.createInvoice(subscriptionId);

    // Log audit event
    await auditLogger.logEvent({
      action: 'invoice_created',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { 
        invoiceId: invoice.id, 
        subscriptionId, 
        amount: invoice.total 
      }
    });

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process payment
router.post('/invoices/:invoiceId/payment', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { error, value } = processPaymentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const invoice = await billingService.processPayment(invoiceId, value);

    // Log audit event
    await auditLogger.logEvent({
      action: 'payment_processed',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { 
        invoiceId, 
        amount: invoice.amount, 
        success: invoice.success 
      }
    });

    res.json({
      success: true,
      data: invoice,
      message: invoice.success ? 'Payment processed successfully' : 'Payment failed'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invoices
router.get('/invoices', async (req, res) => {
  try {
    const organizationId = req.tenant?.organizationId || req.query.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const filters = {
      status: req.query.status,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    };

    const invoices = await billingService.getInvoices(organizationId, filters);

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invoice by ID
router.get('/invoices/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await billingService.getInvoices(req.tenant?.organizationId)
      .then(invoices => invoices.find(inv => inv.id === invoiceId));

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error getting invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track usage
router.post('/usage', async (req, res) => {
  try {
    const { metric, value } = req.body;
    
    if (!metric || value === undefined) {
      return res.status(400).json({ error: 'Metric and value are required' });
    }

    const organizationId = req.tenant?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const usageRecord = await billingService.trackUsage(organizationId, metric, value);

    res.status(201).json({
      success: true,
      data: usageRecord,
      message: 'Usage tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get usage statistics
router.get('/usage/stats', async (req, res) => {
  try {
    const organizationId = req.tenant?.organizationId || req.query.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const period = req.query.period || 'current';
    const stats = await billingService.getUsageStats(organizationId, period);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get billing summary
router.get('/summary', async (req, res) => {
  try {
    const organizationId = req.tenant?.organizationId || req.query.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const summary = await billingService.getBillingSummary(organizationId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting billing summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get plan information
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        description: 'Perfect for small teams getting started',
        price: {
          monthly: 29,
          yearly: 290
        },
        features: [
          'Up to 10 users',
          'Up to 5 projects',
          'Basic analytics',
          'Email support'
        ],
        limits: {
          maxUsers: 10,
          maxProjects: 5,
          maxStorage: 1024, // MB
          apiCallsPerMonth: 10000
        }
      },
      {
        id: 'professional',
        name: 'Professional Plan',
        description: 'Advanced features for growing teams',
        price: {
          monthly: 99,
          yearly: 990
        },
        features: [
          'Up to 50 users',
          'Up to 25 projects',
          'Advanced analytics',
          'AI analysis',
          'Priority support',
          'API access'
        ],
        limits: {
          maxUsers: 50,
          maxProjects: 25,
          maxStorage: 10240, // 10GB
          apiCallsPerMonth: 100000
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        description: 'Full-featured solution for large organizations',
        price: {
          monthly: 299,
          yearly: 2990
        },
        features: [
          'Unlimited users',
          'Unlimited projects',
          'Advanced analytics',
          'AI analysis',
          'Custom integrations',
          'Dedicated support',
          'Full API access',
          'Custom branding',
          'SSO integration'
        ],
        limits: {
          maxUsers: -1, // Unlimited
          maxProjects: -1, // Unlimited
          maxStorage: -1, // Unlimited
          apiCallsPerMonth: -1 // Unlimited
        }
      }
    ];

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
