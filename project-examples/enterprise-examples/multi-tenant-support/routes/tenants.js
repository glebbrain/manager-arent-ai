const express = require('express');
const Joi = require('joi');
const tenantManager = require('../modules/tenant-manager');
const organizationService = require('../modules/organization-service');
const dataIsolation = require('../modules/data-isolation');
const auditLogger = require('../modules/audit-logger');

const router = express.Router();

// Validation schemas
const createTenantSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  domain: Joi.string().required().min(3).max(100),
  subdomain: Joi.string().optional().min(2).max(50),
  plan: Joi.string().valid('basic', 'professional', 'enterprise').default('basic'),
  features: Joi.array().items(Joi.string()).default([]),
  settings: Joi.object().default({}),
  organizationId: Joi.string().required(),
  createdBy: Joi.string().required()
});

const updateTenantSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  domain: Joi.string().min(3).max(100),
  subdomain: Joi.string().min(2).max(50),
  plan: Joi.string().valid('basic', 'professional', 'enterprise'),
  features: Joi.array().items(Joi.string()),
  settings: Joi.object(),
  status: Joi.string().valid('active', 'inactive', 'suspended')
});

// Create tenant
router.post('/', async (req, res) => {
  try {
    const { error, value } = createTenantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if organization exists
    const organization = await organizationService.getOrganization(value.organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Create tenant
    const tenant = await tenantManager.createTenant(value);

    // Initialize data isolation
    await dataIsolation.initializeTenantIsolation(tenant.id, {
      encryptionRequired: true,
      retentionPeriod: 90,
      dataResidency: 'global'
    });

    // Log audit event
    await auditLogger.logEvent({
      action: 'tenant_created',
      tenantId: tenant.id,
      userId: req.user?.id,
      details: { tenantName: tenant.name, plan: tenant.plan }
    });

    res.status(201).json({
      success: true,
      data: tenant,
      message: 'Tenant created successfully'
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tenant by ID
router.get('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await tenantManager.getTenant(tenantId);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check access permissions
    const hasAccess = await tenantManager.validateTenantAccess(tenantId, req.user?.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Error getting tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tenant by domain
router.get('/domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const tenant = await tenantManager.getTenantByDomain(domain);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Error getting tenant by domain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tenant
router.put('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { error, value } = updateTenantSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if tenant exists
    const existingTenant = await tenantManager.getTenant(tenantId);
    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check access permissions
    const hasAccess = await tenantManager.validateTenantAccess(tenantId, req.user?.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update tenant
    const updatedTenant = await tenantManager.updateTenant(tenantId, value);

    // Log audit event
    await auditLogger.logEvent({
      action: 'tenant_updated',
      tenantId: tenantId,
      userId: req.user?.id,
      details: { changes: value }
    });

    res.json({
      success: true,
      data: updatedTenant,
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete tenant
router.delete('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if tenant exists
    const tenant = await tenantManager.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check access permissions (only admins can delete)
    const hasAccess = await tenantManager.validateTenantAccess(tenantId, req.user?.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete tenant
    await tenantManager.deleteTenant(tenantId);

    // Log audit event
    await auditLogger.logEvent({
      action: 'tenant_deleted',
      tenantId: tenantId,
      userId: req.user?.id,
      details: { tenantName: tenant.name }
    });

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List tenants
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      plan: req.query.plan,
      organizationId: req.query.organizationId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await tenantManager.listTenants(filters);

    res.json({
      success: true,
      data: result.tenants,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error listing tenants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tenant configuration
router.get('/:tenantId/config', async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check access permissions
    const hasAccess = await tenantManager.validateTenantAccess(tenantId, req.user?.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const config = await tenantManager.getTenantConfig(tenantId);

    if (!config) {
      return res.status(404).json({ error: 'Tenant configuration not found' });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting tenant config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tenant statistics
router.get('/:tenantId/stats', async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check access permissions
    const hasAccess = await tenantManager.validateTenantAccess(tenantId, req.user?.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await tenantManager.getTenantStats(tenantId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting tenant stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suspend tenant
router.post('/:tenantId/suspend', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    // Check if tenant exists
    const tenant = await tenantManager.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update tenant status
    await tenantManager.updateTenant(tenantId, { 
      status: 'suspended',
      suspensionReason: reason,
      suspendedAt: new Date().toISOString()
    });

    // Log audit event
    await auditLogger.logEvent({
      action: 'tenant_suspended',
      tenantId: tenantId,
      userId: req.user?.id,
      details: { reason }
    });

    res.json({
      success: true,
      message: 'Tenant suspended successfully'
    });
  } catch (error) {
    console.error('Error suspending tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reactivate tenant
router.post('/:tenantId/reactivate', async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if tenant exists
    const tenant = await tenantManager.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update tenant status
    await tenantManager.updateTenant(tenantId, { 
      status: 'active',
      reactivatedAt: new Date().toISOString()
    });

    // Log audit event
    await auditLogger.logEvent({
      action: 'tenant_reactivated',
      tenantId: tenantId,
      userId: req.user?.id,
      details: {}
    });

    res.json({
      success: true,
      message: 'Tenant reactivated successfully'
    });
  } catch (error) {
    console.error('Error reactivating tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
