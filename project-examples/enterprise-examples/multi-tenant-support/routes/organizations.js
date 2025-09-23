const express = require('express');
const Joi = require('joi');
const organizationService = require('../modules/organization-service');
const auditLogger = require('../modules/audit-logger');

const router = express.Router();

// Validation schemas
const createOrganizationSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  domain: Joi.string().required().min(3).max(100),
  industry: Joi.string().required().min(2).max(50),
  size: Joi.string().valid('small', 'medium', 'large', 'enterprise').required(),
  timezone: Joi.string().default('UTC'),
  language: Joi.string().default('en'),
  currency: Joi.string().default('USD'),
  plan: Joi.string().valid('basic', 'professional', 'enterprise').default('basic'),
  billingAddress: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
    postalCode: Joi.string()
  }).optional(),
  createdBy: Joi.string().required()
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  domain: Joi.string().min(3).max(100),
  industry: Joi.string().min(2).max(50),
  size: Joi.string().valid('small', 'medium', 'large', 'enterprise'),
  settings: Joi.object({
    timezone: Joi.string(),
    language: Joi.string(),
    currency: Joi.string(),
    dateFormat: Joi.string(),
    notifications: Joi.object({
      email: Joi.boolean(),
      slack: Joi.boolean(),
      webhook: Joi.boolean()
    }),
    security: Joi.object({
      requireMFA: Joi.boolean(),
      sessionTimeout: Joi.number(),
      passwordPolicy: Joi.string()
    }),
    features: Joi.object({
      singleSignOn: Joi.boolean(),
      customBranding: Joi.boolean(),
      advancedAnalytics: Joi.boolean(),
      apiAccess: Joi.boolean()
    })
  }),
  billing: Joi.object({
    plan: Joi.string().valid('basic', 'professional', 'enterprise'),
    status: Joi.string().valid('active', 'suspended', 'cancelled'),
    paymentMethod: Joi.string(),
    billingAddress: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      postalCode: Joi.string()
    })
  })
});

// Create organization
router.post('/', async (req, res) => {
  try {
    const { error, value } = createOrganizationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const organization = await organizationService.createOrganization(value);

    // Log audit event
    await auditLogger.logEvent({
      action: 'organization_created',
      organizationId: organization.id,
      userId: req.user?.id,
      details: { organizationName: organization.name, plan: organization.billing.plan }
    });

    res.status(201).json({
      success: true,
      data: organization,
      message: 'Organization created successfully'
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organization by ID
router.get('/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const organization = await organizationService.getOrganization(organizationId);

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if user has access to this organization
    const userOrgs = await organizationService.getUserOrganizations(req.user?.id);
    const hasAccess = userOrgs.some(org => org.organizationId === organizationId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Error getting organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update organization
router.put('/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { error, value } = updateOrganizationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if organization exists
    const existingOrg = await organizationService.getOrganization(organizationId);
    if (!existingOrg) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if user has admin access to this organization
    const userOrgs = await organizationService.getUserOrganizations(req.user?.id);
    const userOrg = userOrgs.find(org => org.organizationId === organizationId);
    
    if (!userOrg || userOrg.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const updatedOrganization = await organizationService.updateOrganization(organizationId, value);

    // Log audit event
    await auditLogger.logEvent({
      action: 'organization_updated',
      organizationId: organizationId,
      userId: req.user?.id,
      details: { changes: value }
    });

    res.json({
      success: true,
      data: updatedOrganization,
      message: 'Organization updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete organization
router.delete('/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Check if organization exists
    const organization = await organizationService.getOrganization(organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if user has admin access to this organization
    const userOrgs = await organizationService.getUserOrganizations(req.user?.id);
    const userOrg = userOrgs.find(org => org.organizationId === organizationId);
    
    if (!userOrg || userOrg.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await organizationService.deleteOrganization(organizationId);

    // Log audit event
    await auditLogger.logEvent({
      action: 'organization_deleted',
      organizationId: organizationId,
      userId: req.user?.id,
      details: { organizationName: organization.name }
    });

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List organizations
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      plan: req.query.plan,
      industry: req.query.industry,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    // If user is not admin, only show their organizations
    if (req.user?.role !== 'admin') {
      const userOrgs = await organizationService.getUserOrganizations(req.user?.id);
      const orgIds = userOrgs.map(org => org.organizationId);
      
      // Filter organizations by user's access
      const result = await organizationService.listOrganizations(filters);
      result.organizations = result.organizations.filter(org => orgIds.includes(org.id));
      
      return res.json({
        success: true,
        data: result.organizations,
        pagination: result.pagination
      });
    }

    const result = await organizationService.listOrganizations(filters);

    res.json({
      success: true,
      data: result.organizations,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error listing organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organization statistics
router.get('/:organizationId/stats', async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Check if user has access to this organization
    const userOrgs = await organizationService.getUserOrganizations(req.user?.id);
    const hasAccess = userOrgs.some(org => org.organizationId === organizationId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await organizationService.getOrganizationStats(organizationId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting organization stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add user to organization
router.post('/:organizationId/users', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { userId, role = 'member' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user has admin access to this organization
    const userOrgs = await organizationService.getUserOrganizations(req.user?.id);
    const userOrg = userOrgs.find(org => org.organizationId === organizationId);
    
    if (!userOrg || userOrg.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userOrgRelation = await organizationService.addUserToOrganization(organizationId, userId, role);

    // Log audit event
    await auditLogger.logEvent({
      action: 'user_added_to_organization',
      organizationId: organizationId,
      userId: req.user?.id,
      details: { addedUserId: userId, role }
    });

    res.status(201).json({
      success: true,
      data: userOrgRelation,
      message: 'User added to organization successfully'
    });
  } catch (error) {
    console.error('Error adding user to organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove user from organization
router.delete('/:organizationId/users/:userId', async (req, res) => {
  try {
    const { organizationId, userId } = req.params;

    // Check if user has admin access to this organization
    const userOrgs = await organizationService.getUserOrganizations(req.user?.id);
    const userOrg = userOrgs.find(org => org.organizationId === organizationId);
    
    if (!userOrg || userOrg.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await organizationService.removeUserFromOrganization(organizationId, userId);

    // Log audit event
    await auditLogger.logEvent({
      action: 'user_removed_from_organization',
      organizationId: organizationId,
      userId: req.user?.id,
      details: { removedUserId: userId }
    });

    res.json({
      success: true,
      message: 'User removed from organization successfully'
    });
  } catch (error) {
    console.error('Error removing user from organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organization users
router.get('/:organizationId/users', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { role } = req.query;

    // Check if user has access to this organization
    const userOrgs = await organizationService.getUserOrganizations(req.user?.id);
    const hasAccess = userOrgs.some(org => org.organizationId === organizationId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await organizationService.getOrganizationUsers(organizationId, { role });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting organization users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's organizations
router.get('/user/:userId/organizations', async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only see their own organizations unless they're admin
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const organizations = await organizationService.getUserOrganizations(userId);

    res.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error('Error getting user organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
