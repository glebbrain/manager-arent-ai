const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const bcrypt = require('bcryptjs');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/organization-service.log' })
  ]
});

class OrganizationService {
  constructor() {
    this.organizations = new Map(); // In-memory storage
    this.organizationUsers = new Map(); // User-organization mappings
  }

  /**
   * Create a new organization
   * @param {Object} orgData - Organization data
   * @returns {Object} Created organization
   */
  async createOrganization(orgData) {
    try {
      const organizationId = uuidv4();
      const organization = {
        id: organizationId,
        name: orgData.name,
        domain: orgData.domain,
        industry: orgData.industry,
        size: orgData.size, // small, medium, large, enterprise
        status: 'active',
        settings: {
          timezone: orgData.timezone || 'UTC',
          language: orgData.language || 'en',
          currency: orgData.currency || 'USD',
          dateFormat: orgData.dateFormat || 'YYYY-MM-DD',
          notifications: {
            email: true,
            slack: false,
            webhook: false
          },
          security: {
            requireMFA: false,
            sessionTimeout: 24, // hours
            passwordPolicy: 'standard'
          },
          features: {
            singleSignOn: false,
            customBranding: false,
            advancedAnalytics: false,
            apiAccess: false
          }
        },
        billing: {
          plan: orgData.plan || 'basic',
          status: 'active',
          paymentMethod: null,
          billingAddress: orgData.billingAddress || null
        },
        limits: {
          maxUsers: this.getUserLimit(orgData.plan || 'basic'),
          maxProjects: this.getProjectLimit(orgData.plan || 'basic'),
          maxStorage: this.getStorageLimit(orgData.plan || 'basic')
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: orgData.createdBy
      };

      this.organizations.set(organizationId, organization);
      logger.info('Organization created successfully', { organizationId, name: organization.name });
      return organization;
    } catch (error) {
      logger.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   * @param {string} organizationId - Organization ID
   * @returns {Object|null} Organization object or null
   */
  async getOrganization(organizationId) {
    try {
      return this.organizations.get(organizationId) || null;
    } catch (error) {
      logger.error('Error getting organization:', error);
      throw error;
    }
  }

  /**
   * Update organization
   * @param {string} organizationId - Organization ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated organization
   */
  async updateOrganization(organizationId, updateData) {
    try {
      const organization = await this.getOrganization(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      const updatedOrganization = {
        ...organization,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Update limits if plan changed
      if (updateData.billing?.plan) {
        updatedOrganization.limits = {
          maxUsers: this.getUserLimit(updateData.billing.plan),
          maxProjects: this.getProjectLimit(updateData.billing.plan),
          maxStorage: this.getStorageLimit(updateData.billing.plan)
        };
      }

      this.organizations.set(organizationId, updatedOrganization);
      logger.info('Organization updated successfully', { organizationId });
      return updatedOrganization;
    } catch (error) {
      logger.error('Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Delete organization
   * @param {string} organizationId - Organization ID
   * @returns {boolean} Success status
   */
  async deleteOrganization(organizationId) {
    try {
      const organization = await this.getOrganization(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Soft delete - mark as inactive
      organization.status = 'inactive';
      organization.updatedAt = new Date().toISOString();
      
      this.organizations.set(organizationId, organization);
      logger.info('Organization deleted (soft delete)', { organizationId });
      return true;
    } catch (error) {
      logger.error('Error deleting organization:', error);
      throw error;
    }
  }

  /**
   * Add user to organization
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID
   * @param {string} role - User role in organization
   * @returns {Object} User-organization relationship
   */
  async addUserToOrganization(organizationId, userId, role = 'member') {
    try {
      const organization = await this.getOrganization(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Check user limit
      const currentUserCount = await this.getOrganizationUserCount(organizationId);
      if (currentUserCount >= organization.limits.maxUsers) {
        throw new Error('Organization user limit reached');
      }

      const userOrg = {
        id: uuidv4(),
        organizationId,
        userId,
        role,
        status: 'active',
        joinedAt: new Date().toISOString(),
        permissions: this.getRolePermissions(role)
      };

      // Store user-organization relationship
      const key = `${organizationId}:${userId}`;
      this.organizationUsers.set(key, userOrg);

      logger.info('User added to organization', { organizationId, userId, role });
      return userOrg;
    } catch (error) {
      logger.error('Error adding user to organization:', error);
      throw error;
    }
  }

  /**
   * Remove user from organization
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async removeUserFromOrganization(organizationId, userId) {
    try {
      const key = `${organizationId}:${userId}`;
      const userOrg = this.organizationUsers.get(key);
      
      if (!userOrg) {
        throw new Error('User not found in organization');
      }

      // Soft delete - mark as inactive
      userOrg.status = 'inactive';
      userOrg.leftAt = new Date().toISOString();
      
      this.organizationUsers.set(key, userOrg);
      logger.info('User removed from organization', { organizationId, userId });
      return true;
    } catch (error) {
      logger.error('Error removing user from organization:', error);
      throw error;
    }
  }

  /**
   * Get organization users
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Filter options
   * @returns {Array} List of organization users
   */
  async getOrganizationUsers(organizationId, filters = {}) {
    try {
      const users = [];
      
      for (const [key, userOrg] of this.organizationUsers) {
        if (key.startsWith(`${organizationId}:`) && userOrg.status === 'active') {
          users.push(userOrg);
        }
      }

      // Apply filters
      if (filters.role) {
        return users.filter(user => user.role === filters.role);
      }

      return users;
    } catch (error) {
      logger.error('Error getting organization users:', error);
      throw error;
    }
  }

  /**
   * Get user's organizations
   * @param {string} userId - User ID
   * @returns {Array} List of user's organizations
   */
  async getUserOrganizations(userId) {
    try {
      const organizations = [];
      
      for (const [key, userOrg] of this.organizationUsers) {
        if (key.endsWith(`:${userId}`) && userOrg.status === 'active') {
          const organization = await this.getOrganization(userOrg.organizationId);
          if (organization) {
            organizations.push({
              ...userOrg,
              organization
            });
          }
        }
      }

      return organizations;
    } catch (error) {
      logger.error('Error getting user organizations:', error);
      throw error;
    }
  }

  /**
   * Get organization statistics
   * @param {string} organizationId - Organization ID
   * @returns {Object} Organization statistics
   */
  async getOrganizationStats(organizationId) {
    try {
      const organization = await this.getOrganization(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      const users = await this.getOrganizationUsers(organizationId);
      const activeUsers = users.filter(user => user.status === 'active').length;

      return {
        organizationId,
        name: organization.name,
        totalUsers: activeUsers,
        maxUsers: organization.limits.maxUsers,
        userUtilization: (activeUsers / organization.limits.maxUsers) * 100,
        plan: organization.billing.plan,
        status: organization.status,
        createdAt: organization.createdAt,
        lastActivity: organization.updatedAt
      };
    } catch (error) {
      logger.error('Error getting organization stats:', error);
      throw error;
    }
  }

  /**
   * List organizations with filters
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated list of organizations
   */
  async listOrganizations(filters = {}) {
    try {
      let organizations = Array.from(this.organizations.values());

      // Apply filters
      if (filters.status) {
        organizations = organizations.filter(org => org.status === filters.status);
      }
      if (filters.plan) {
        organizations = organizations.filter(org => org.billing.plan === filters.plan);
      }
      if (filters.industry) {
        organizations = organizations.filter(org => org.industry === filters.industry);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        organizations: organizations.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: organizations.length,
          pages: Math.ceil(organizations.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error listing organizations:', error);
      throw error;
    }
  }

  /**
   * Get user limit based on plan
   * @param {string} plan - Plan name
   * @returns {number} User limit
   */
  getUserLimit(plan) {
    const limits = {
      basic: 10,
      professional: 50,
      enterprise: -1 // Unlimited
    };
    return limits[plan] || limits.basic;
  }

  /**
   * Get project limit based on plan
   * @param {string} plan - Plan name
   * @returns {number} Project limit
   */
  getProjectLimit(plan) {
    const limits = {
      basic: 5,
      professional: 25,
      enterprise: -1 // Unlimited
    };
    return limits[plan] || limits.basic;
  }

  /**
   * Get storage limit based on plan
   * @param {string} plan - Plan name
   * @returns {number} Storage limit in MB
   */
  getStorageLimit(plan) {
    const limits = {
      basic: 1024, // 1GB
      professional: 10240, // 10GB
      enterprise: -1 // Unlimited
    };
    return limits[plan] || limits.basic;
  }

  /**
   * Get role permissions
   * @param {string} role - User role
   * @returns {Object} Role permissions
   */
  getRolePermissions(role) {
    const permissions = {
      admin: {
        canManageUsers: true,
        canManageProjects: true,
        canManageSettings: true,
        canViewAnalytics: true,
        canManageBilling: true,
        canAccessAPI: true
      },
      manager: {
        canManageUsers: false,
        canManageProjects: true,
        canManageSettings: false,
        canViewAnalytics: true,
        canManageBilling: false,
        canAccessAPI: true
      },
      member: {
        canManageUsers: false,
        canManageProjects: false,
        canManageSettings: false,
        canViewAnalytics: false,
        canManageBilling: false,
        canAccessAPI: false
      }
    };
    return permissions[role] || permissions.member;
  }

  /**
   * Get organization user count
   * @param {string} organizationId - Organization ID
   * @returns {number} User count
   */
  async getOrganizationUserCount(organizationId) {
    try {
      const users = await this.getOrganizationUsers(organizationId);
      return users.filter(user => user.status === 'active').length;
    } catch (error) {
      logger.error('Error getting organization user count:', error);
      return 0;
    }
  }
}

module.exports = new OrganizationService();
