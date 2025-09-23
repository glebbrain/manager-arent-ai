const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const Redis = require('redis');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/tenant-manager.log' })
  ]
});

// Redis client for caching
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => logger.error('Redis Client Error:', err));
redis.connect();

class TenantManager {
  constructor() {
    this.tenants = new Map(); // In-memory cache
    this.tenantConfigs = new Map();
  }

  /**
   * Create a new tenant
   * @param {Object} tenantData - Tenant information
   * @returns {Object} Created tenant
   */
  async createTenant(tenantData) {
    try {
      const tenantId = uuidv4();
      const tenant = {
        id: tenantId,
        name: tenantData.name,
        domain: tenantData.domain,
        subdomain: tenantData.subdomain,
        status: 'active',
        plan: tenantData.plan || 'basic',
        features: tenantData.features || [],
        settings: tenantData.settings || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: tenantData.createdBy,
        organizationId: tenantData.organizationId
      };

      // Store in memory cache
      this.tenants.set(tenantId, tenant);

      // Store in Redis for persistence
      await redis.setEx(`tenant:${tenantId}`, 3600, JSON.stringify(tenant));

      // Store tenant configuration
      const config = this.generateTenantConfig(tenant);
      this.tenantConfigs.set(tenantId, config);
      await redis.setEx(`tenant:config:${tenantId}`, 3600, JSON.stringify(config));

      logger.info('Tenant created successfully', { tenantId, name: tenant.name });
      return tenant;
    } catch (error) {
      logger.error('Error creating tenant:', error);
      throw error;
    }
  }

  /**
   * Get tenant by ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object|null} Tenant object or null
   */
  async getTenant(tenantId) {
    try {
      // Check memory cache first
      if (this.tenants.has(tenantId)) {
        return this.tenants.get(tenantId);
      }

      // Check Redis cache
      const cachedTenant = await redis.get(`tenant:${tenantId}`);
      if (cachedTenant) {
        const tenant = JSON.parse(cachedTenant);
        this.tenants.set(tenantId, tenant);
        return tenant;
      }

      // If not found in cache, return null
      return null;
    } catch (error) {
      logger.error('Error getting tenant:', error);
      throw error;
    }
  }

  /**
   * Get tenant by domain or subdomain
   * @param {string} domain - Domain or subdomain
   * @returns {Object|null} Tenant object or null
   */
  async getTenantByDomain(domain) {
    try {
      // Search through cached tenants
      for (const [tenantId, tenant] of this.tenants) {
        if (tenant.domain === domain || tenant.subdomain === domain) {
          return tenant;
        }
      }

      // If not found in cache, search in database
      // This would typically query a database
      logger.warn('Tenant not found in cache, database search not implemented', { domain });
      return null;
    } catch (error) {
      logger.error('Error getting tenant by domain:', error);
      throw error;
    }
  }

  /**
   * Update tenant information
   * @param {string} tenantId - Tenant ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated tenant
   */
  async updateTenant(tenantId, updateData) {
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const updatedTenant = {
        ...tenant,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Update memory cache
      this.tenants.set(tenantId, updatedTenant);

      // Update Redis cache
      await redis.setEx(`tenant:${tenantId}`, 3600, JSON.stringify(updatedTenant));

      // Update configuration if needed
      if (updateData.plan || updateData.features || updateData.settings) {
        const config = this.generateTenantConfig(updatedTenant);
        this.tenantConfigs.set(tenantId, config);
        await redis.setEx(`tenant:config:${tenantId}`, 3600, JSON.stringify(config));
      }

      logger.info('Tenant updated successfully', { tenantId });
      return updatedTenant;
    } catch (error) {
      logger.error('Error updating tenant:', error);
      throw error;
    }
  }

  /**
   * Delete tenant
   * @param {string} tenantId - Tenant ID
   * @returns {boolean} Success status
   */
  async deleteTenant(tenantId) {
    try {
      // Remove from memory cache
      this.tenants.delete(tenantId);
      this.tenantConfigs.delete(tenantId);

      // Remove from Redis cache
      await redis.del(`tenant:${tenantId}`);
      await redis.del(`tenant:config:${tenantId}`);

      logger.info('Tenant deleted successfully', { tenantId });
      return true;
    } catch (error) {
      logger.error('Error deleting tenant:', error);
      throw error;
    }
  }

  /**
   * List all tenants
   * @param {Object} filters - Filter options
   * @returns {Array} List of tenants
   */
  async listTenants(filters = {}) {
    try {
      let tenants = Array.from(this.tenants.values());

      // Apply filters
      if (filters.status) {
        tenants = tenants.filter(tenant => tenant.status === filters.status);
      }
      if (filters.plan) {
        tenants = tenants.filter(tenant => tenant.plan === filters.plan);
      }
      if (filters.organizationId) {
        tenants = tenants.filter(tenant => tenant.organizationId === filters.organizationId);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        tenants: tenants.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: tenants.length,
          pages: Math.ceil(tenants.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error listing tenants:', error);
      throw error;
    }
  }

  /**
   * Get tenant configuration
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Tenant configuration
   */
  async getTenantConfig(tenantId) {
    try {
      // Check memory cache first
      if (this.tenantConfigs.has(tenantId)) {
        return this.tenantConfigs.get(tenantId);
      }

      // Check Redis cache
      const cachedConfig = await redis.get(`tenant:config:${tenantId}`);
      if (cachedConfig) {
        const config = JSON.parse(cachedConfig);
        this.tenantConfigs.set(tenantId, config);
        return config;
      }

      // Generate new config if not found
      const tenant = await this.getTenant(tenantId);
      if (tenant) {
        const config = this.generateTenantConfig(tenant);
        this.tenantConfigs.set(tenantId, config);
        await redis.setEx(`tenant:config:${tenantId}`, 3600, JSON.stringify(config));
        return config;
      }

      return null;
    } catch (error) {
      logger.error('Error getting tenant config:', error);
      throw error;
    }
  }

  /**
   * Generate tenant configuration based on plan and features
   * @param {Object} tenant - Tenant object
   * @returns {Object} Tenant configuration
   */
  generateTenantConfig(tenant) {
    const baseConfig = {
      maxUsers: 10,
      maxProjects: 5,
      maxStorage: 1024, // MB
      features: {
        aiAnalysis: false,
        advancedAnalytics: false,
        customIntegrations: false,
        prioritySupport: false,
        apiAccess: false
      },
      limits: {
        apiCallsPerHour: 1000,
        concurrentBuilds: 2,
        maxFileSize: 10 // MB
      }
    };

    // Apply plan-specific configurations
    switch (tenant.plan) {
      case 'basic':
        return baseConfig;
      
      case 'professional':
        return {
          ...baseConfig,
          maxUsers: 50,
          maxProjects: 25,
          maxStorage: 10240, // 10GB
          features: {
            ...baseConfig.features,
            aiAnalysis: true,
            advancedAnalytics: true
          },
          limits: {
            ...baseConfig.limits,
            apiCallsPerHour: 10000,
            concurrentBuilds: 5
          }
        };
      
      case 'enterprise':
        return {
          ...baseConfig,
          maxUsers: -1, // Unlimited
          maxProjects: -1, // Unlimited
          maxStorage: -1, // Unlimited
          features: {
            aiAnalysis: true,
            advancedAnalytics: true,
            customIntegrations: true,
            prioritySupport: true,
            apiAccess: true
          },
          limits: {
            apiCallsPerHour: 100000,
            concurrentBuilds: 20,
            maxFileSize: 100 // 100MB
          }
        };
      
      default:
        return baseConfig;
    }
  }

  /**
   * Validate tenant access
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @returns {boolean} Access validation result
   */
  async validateTenantAccess(tenantId, userId) {
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) {
        return false;
      }

      // Check if user belongs to tenant's organization
      // This would typically query a database
      logger.info('Tenant access validation', { tenantId, userId });
      return true; // Simplified for now
    } catch (error) {
      logger.error('Error validating tenant access:', error);
      return false;
    }
  }

  /**
   * Get tenant statistics
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Tenant statistics
   */
  async getTenantStats(tenantId) {
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // This would typically query various services for statistics
      return {
        tenantId,
        activeUsers: 0, // Would be calculated from user service
        totalProjects: 0, // Would be calculated from project service
        storageUsed: 0, // Would be calculated from storage service
        apiCallsToday: 0, // Would be calculated from API gateway
        lastActivity: tenant.updatedAt
      };
    } catch (error) {
      logger.error('Error getting tenant stats:', error);
      throw error;
    }
  }
}

module.exports = new TenantManager();
