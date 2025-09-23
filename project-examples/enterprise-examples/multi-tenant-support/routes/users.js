const express = require('express');
const Joi = require('joi');
const userManagement = require('../modules/user-management');
const organizationService = require('../modules/organization-service');
const auditLogger = require('../modules/audit-logger');

const router = express.Router();

// Validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required().min(2).max(50),
  lastName: Joi.string().required().min(2).max(50),
  role: Joi.string().valid('admin', 'manager', 'user').default('user'),
  timezone: Joi.string().default('UTC'),
  language: Joi.string().default('en')
});

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  role: Joi.string().valid('admin', 'manager', 'user'),
  status: Joi.string().valid('active', 'inactive'),
  preferences: Joi.object({
    timezone: Joi.string(),
    language: Joi.string(),
    notifications: Joi.object({
      email: Joi.boolean(),
      push: Joi.boolean(),
      sms: Joi.boolean()
    }),
    theme: Joi.string().valid('light', 'dark', 'auto')
  })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if user already exists
    const existingUser = await userManagement.getUserByEmail(value.email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const user = await userManagement.createUser(value);

    // Log audit event
    await auditLogger.logEvent({
      action: 'user_created',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { 
        createdUserId: user.id, 
        email: user.email, 
        role: user.role 
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userManagement.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has access to this user's data
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if user exists
    const existingUser = await userManagement.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permissions
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedUser = await userManagement.updateUser(userId, value);

    // Log audit event
    await auditLogger.logEvent({
      action: 'user_updated',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { 
        updatedUserId: userId, 
        changes: value 
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt
      },
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await userManagement.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permissions (only admins can delete users)
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await userManagement.deleteUser(userId);

    // Log audit event
    await auditLogger.logEvent({
      action: 'user_deleted',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { 
        deletedUserId: userId, 
        email: user.email 
      }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List users
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      role: req.query.role,
      emailVerified: req.query.emailVerified ? req.query.emailVerified === 'true' : undefined,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await userManagement.listUsers(filters);

    // Remove sensitive data
    const sanitizedUsers = result.users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      data: sanitizedUsers,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.post('/:userId/change-password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { error, value } = changePasswordSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check permissions
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await userManagement.changePassword(userId, value.currentPassword, value.newPassword);

    // Log audit event
    await auditLogger.logEvent({
      action: 'password_changed',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { changedUserId: userId }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await userManagement.resetPassword(email);

    // Log audit event
    await auditLogger.logEvent({
      action: 'password_reset_requested',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { email }
    });

    res.json({
      success: true,
      message: 'Password reset instructions sent to email',
      data: {
        resetToken: result.resetToken,
        expiresAt: result.expiresAt
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set password with reset token
router.post('/set-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    await userManagement.setPasswordWithToken(token, newPassword);

    // Log audit event
    await auditLogger.logEvent({
      action: 'password_reset_completed',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { token }
    });

    res.json({
      success: true,
      message: 'Password set successfully'
    });
  } catch (error) {
    console.error('Error setting password:', error);
    if (error.message === 'Invalid or expired reset token') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await userManagement.getUserStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's organizations
router.get('/:userId/organizations', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permissions
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

// Add user to organization
router.post('/:userId/organizations', async (req, res) => {
  try {
    const { userId } = req.params;
    const { organizationId, role = 'member' } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Check permissions (only admins can add users to organizations)
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userOrgRelation = await organizationService.addUserToOrganization(organizationId, userId, role);

    // Log audit event
    await auditLogger.logEvent({
      action: 'user_added_to_organization',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { 
        addedUserId: userId, 
        organizationId, 
        role 
      }
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
router.delete('/:userId/organizations/:organizationId', async (req, res) => {
  try {
    const { userId, organizationId } = req.params;

    // Check permissions (only admins can remove users from organizations)
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await organizationService.removeUserFromOrganization(organizationId, userId);

    // Log audit event
    await auditLogger.logEvent({
      action: 'user_removed_from_organization',
      tenantId: req.tenant?.id,
      userId: req.user?.id,
      details: { 
        removedUserId: userId, 
        organizationId 
      }
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

module.exports = router;
