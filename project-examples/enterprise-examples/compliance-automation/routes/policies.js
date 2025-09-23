const express = require('express');
const router = express.Router();
const policyManager = require('../modules/policy-manager');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/policies-routes.log' })
  ]
});

// Initialize policy manager
router.post('/initialize', async (req, res) => {
  try {
    await policyManager.initialize();
    res.json({ success: true, message: 'Policy manager initialized' });
  } catch (error) {
    logger.error('Error initializing policy manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create policy
router.post('/policies', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.name || !config.category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const policy = await policyManager.createPolicy(config);
    res.json(policy);
  } catch (error) {
    logger.error('Error creating policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update policy
router.put('/policies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const policy = await policyManager.updatePolicy(id, updates);
    res.json(policy);
  } catch (error) {
    logger.error('Error updating policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit for approval
router.post('/policies/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvers } = req.body;
    
    const approval = await policyManager.submitForApproval(id, approvers);
    res.json(approval);
  } catch (error) {
    logger.error('Error submitting policy for approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve policy
router.post('/approvals/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approver, comments } = req.body;
    
    if (!approver) {
      return res.status(400).json({ error: 'Approver is required' });
    }

    const approval = await policyManager.approvePolicy(id, approver, comments);
    res.json(approval);
  } catch (error) {
    logger.error('Error approving policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject policy
router.post('/approvals/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { approver, reason } = req.body;
    
    if (!approver || !reason) {
      return res.status(400).json({ error: 'Approver and reason are required' });
    }

    const approval = await policyManager.rejectPolicy(id, approver, reason);
    res.json(approval);
  } catch (error) {
    logger.error('Error rejecting policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Schedule review
router.post('/policies/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewDate, reviewers } = req.body;
    
    if (!reviewDate) {
      return res.status(400).json({ error: 'Review date is required' });
    }

    const review = await policyManager.schedulePolicyReview(id, reviewDate, reviewers);
    res.json(review);
  } catch (error) {
    logger.error('Error scheduling policy review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete review
router.post('/reviews/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { findings, recommendations } = req.body;
    
    const review = await policyManager.completePolicyReview(id, findings, recommendations);
    res.json(review);
  } catch (error) {
    logger.error('Error completing policy review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get policy
router.get('/policies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const policy = await policyManager.getPolicy(id);
    res.json(policy);
  } catch (error) {
    logger.error('Error getting policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List policies
router.get('/policies', async (req, res) => {
  try {
    const filters = req.query;
    
    const policies = await policyManager.listPolicies(filters);
    res.json(policies);
  } catch (error) {
    logger.error('Error listing policies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get policy versions
router.get('/policies/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    
    const versions = await policyManager.getPolicyVersions(id);
    res.json(versions);
  } catch (error) {
    logger.error('Error getting policy versions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get policy approvals
router.get('/approvals', async (req, res) => {
  try {
    const filters = req.query;
    
    const approvals = await policyManager.getPolicyApprovals(filters);
    res.json(approvals);
  } catch (error) {
    logger.error('Error getting policy approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get policy reviews
router.get('/reviews', async (req, res) => {
  try {
    const filters = req.query;
    
    const reviews = await policyManager.getPolicyReviews(filters);
    res.json(reviews);
  } catch (error) {
    logger.error('Error getting policy reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overdue reviews
router.get('/reviews/overdue', async (req, res) => {
  try {
    const overdueReviews = await policyManager.getOverdueReviews();
    res.json(overdueReviews);
  } catch (error) {
    logger.error('Error getting overdue reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get expiring policies
router.get('/policies/expiring', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const expiringPolicies = await policyManager.getExpiringPolicies(parseInt(days));
    res.json(expiringPolicies);
  } catch (error) {
    logger.error('Error getting expiring policies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await policyManager.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'policies',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
