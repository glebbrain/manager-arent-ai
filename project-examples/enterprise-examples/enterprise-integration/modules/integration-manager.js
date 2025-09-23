const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/integration-manager.log' })
  ]
});

class IntegrationManager {
  constructor() {
    this.integrations = new Map();
    this.activeIntegrations = new Map();
    this.integrationStatus = new Map();
    this.scheduledTasks = new Map();
    this.initializeDefaultIntegrations();
  }

  /**
   * Initialize default integrations
   */
  initializeDefaultIntegrations() {
    const defaultIntegrations = [
      {
        id: 'salesforce-crm',
        name: 'Salesforce CRM',
        type: 'crm',
        category: 'customer_management',
        description: 'Salesforce CRM integration for customer data management',
        status: 'available',
        configuration: {
          authType: 'oauth2',
          endpoints: {
            baseUrl: 'https://api.salesforce.com',
            authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
            tokenUrl: 'https://login.salesforce.com/services/oauth2/token'
          },
          scopes: ['api', 'refresh_token'],
          rateLimit: {
            requestsPerMinute: 1000,
            requestsPerDay: 100000
          }
        }
      },
      {
        id: 'microsoft-365',
        name: 'Microsoft 365',
        type: 'productivity',
        category: 'office_suite',
        description: 'Microsoft 365 integration for productivity tools',
        status: 'available',
        configuration: {
          authType: 'oauth2',
          endpoints: {
            baseUrl: 'https://graph.microsoft.com',
            authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
          },
          scopes: ['https://graph.microsoft.com/.default'],
          rateLimit: {
            requestsPerMinute: 10000,
            requestsPerDay: 1000000
          }
        }
      },
      {
        id: 'google-workspace',
        name: 'Google Workspace',
        type: 'productivity',
        category: 'office_suite',
        description: 'Google Workspace integration for productivity tools',
        status: 'available',
        configuration: {
          authType: 'oauth2',
          endpoints: {
            baseUrl: 'https://www.googleapis.com',
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token'
          },
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
          rateLimit: {
            requestsPerMinute: 1000,
            requestsPerDay: 100000
          }
        }
      },
      {
        id: 'slack',
        name: 'Slack',
        type: 'communication',
        category: 'team_collaboration',
        description: 'Slack integration for team communication',
        status: 'available',
        configuration: {
          authType: 'oauth2',
          endpoints: {
            baseUrl: 'https://slack.com/api',
            authUrl: 'https://slack.com/oauth/v2/authorize',
            tokenUrl: 'https://slack.com/api/oauth.v2.access'
          },
          scopes: ['chat:write', 'channels:read', 'users:read'],
          rateLimit: {
            requestsPerMinute: 100,
            requestsPerDay: 10000
          }
        }
      },
      {
        id: 'jira',
        name: 'Jira',
        type: 'project_management',
        category: 'issue_tracking',
        description: 'Jira integration for project and issue management',
        status: 'available',
        configuration: {
          authType: 'basic',
          endpoints: {
            baseUrl: 'https://your-domain.atlassian.net/rest/api/3'
          },
          rateLimit: {
            requestsPerMinute: 300,
            requestsPerDay: 30000
          }
        }
      },
      {
        id: 'github',
        name: 'GitHub',
        type: 'development',
        category: 'version_control',
        description: 'GitHub integration for code repository management',
        status: 'available',
        configuration: {
          authType: 'oauth2',
          endpoints: {
            baseUrl: 'https://api.github.com',
            authUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token'
          },
          scopes: ['repo', 'user', 'admin:org'],
          rateLimit: {
            requestsPerMinute: 5000,
            requestsPerDay: 500000
          }
        }
      },
      {
        id: 'aws',
        name: 'Amazon Web Services',
        type: 'cloud',
        category: 'infrastructure',
        description: 'AWS integration for cloud infrastructure management',
        status: 'available',
        configuration: {
          authType: 'aws_signature',
          endpoints: {
            baseUrl: 'https://aws.amazon.com'
          },
          rateLimit: {
            requestsPerMinute: 1000,
            requestsPerDay: 100000
          }
        }
      },
      {
        id: 'azure',
        name: 'Microsoft Azure',
        type: 'cloud',
        category: 'infrastructure',
        description: 'Azure integration for cloud infrastructure management',
        status: 'available',
        configuration: {
          authType: 'oauth2',
          endpoints: {
            baseUrl: 'https://management.azure.com',
            authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
          },
          scopes: ['https://management.azure.com/.default'],
          rateLimit: {
            requestsPerMinute: 1000,
            requestsPerDay: 100000
          }
        }
      }
    ];

    defaultIntegrations.forEach(integration => {
      this.integrations.set(integration.id, integration);
    });

    logger.info('Default integrations initialized', { 
      count: defaultIntegrations.length 
    });
  }

  /**
   * Create new integration
   * @param {Object} integrationData - Integration data
   * @returns {Object} Created integration
   */
  async createIntegration(integrationData) {
    try {
      const integrationId = uuidv4();
      const integration = {
        id: integrationId,
        name: integrationData.name,
        type: integrationData.type,
        category: integrationData.category,
        description: integrationData.description,
        status: 'inactive',
        configuration: integrationData.configuration,
        tenantId: integrationData.tenantId,
        createdBy: integrationData.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSyncAt: null,
        syncCount: 0,
        errorCount: 0,
        lastError: null
      };

      this.integrations.set(integrationId, integration);
      logger.info('Integration created', { integrationId, name: integration.name });
      return integration;
    } catch (error) {
      logger.error('Error creating integration:', error);
      throw error;
    }
  }

  /**
   * Get integration by ID
   * @param {string} integrationId - Integration ID
   * @returns {Object|null} Integration object or null
   */
  async getIntegration(integrationId) {
    try {
      return this.integrations.get(integrationId) || null;
    } catch (error) {
      logger.error('Error getting integration:', error);
      throw error;
    }
  }

  /**
   * Update integration
   * @param {string} integrationId - Integration ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated integration
   */
  async updateIntegration(integrationId, updateData) {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const updatedIntegration = {
        ...integration,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.integrations.set(integrationId, updatedIntegration);
      logger.info('Integration updated', { integrationId });
      return updatedIntegration;
    } catch (error) {
      logger.error('Error updating integration:', error);
      throw error;
    }
  }

  /**
   * Delete integration
   * @param {string} integrationId - Integration ID
   * @returns {boolean} Success status
   */
  async deleteIntegration(integrationId) {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Stop integration if active
      if (this.activeIntegrations.has(integrationId)) {
        await this.stopIntegration(integrationId);
      }

      this.integrations.delete(integrationId);
      logger.info('Integration deleted', { integrationId });
      return true;
    } catch (error) {
      logger.error('Error deleting integration:', error);
      throw error;
    }
  }

  /**
   * Start integration
   * @param {string} integrationId - Integration ID
   * @returns {Object} Integration status
   */
  async startIntegration(integrationId) {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      if (this.activeIntegrations.has(integrationId)) {
        throw new Error('Integration is already active');
      }

      // Set integration as active
      this.activeIntegrations.set(integrationId, {
        ...integration,
        startedAt: new Date().toISOString(),
        status: 'active'
      });

      // Update integration status
      await this.updateIntegration(integrationId, { status: 'active' });

      // Start scheduled tasks if configured
      if (integration.configuration.schedule) {
        await this.scheduleIntegration(integrationId, integration.configuration.schedule);
      }

      logger.info('Integration started', { integrationId });
      return {
        integrationId,
        status: 'active',
        startedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error starting integration:', error);
      throw error;
    }
  }

  /**
   * Stop integration
   * @param {string} integrationId - Integration ID
   * @returns {Object} Integration status
   */
  async stopIntegration(integrationId) {
    try {
      const integration = this.activeIntegrations.get(integrationId);
      if (!integration) {
        throw new Error('Integration is not active');
      }

      // Remove from active integrations
      this.activeIntegrations.delete(integrationId);

      // Update integration status
      await this.updateIntegration(integrationId, { status: 'inactive' });

      // Stop scheduled tasks
      if (this.scheduledTasks.has(integrationId)) {
        this.scheduledTasks.get(integrationId).destroy();
        this.scheduledTasks.delete(integrationId);
      }

      logger.info('Integration stopped', { integrationId });
      return {
        integrationId,
        status: 'inactive',
        stoppedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error stopping integration:', error);
      throw error;
    }
  }

  /**
   * Schedule integration
   * @param {string} integrationId - Integration ID
   * @param {string} schedule - Cron schedule
   */
  async scheduleIntegration(integrationId, schedule) {
    try {
      const task = cron.schedule(schedule, async () => {
        try {
          await this.runIntegration(integrationId);
        } catch (error) {
          logger.error('Scheduled integration error:', error);
        }
      });

      this.scheduledTasks.set(integrationId, task);
      logger.info('Integration scheduled', { integrationId, schedule });
    } catch (error) {
      logger.error('Error scheduling integration:', error);
      throw error;
    }
  }

  /**
   * Run integration
   * @param {string} integrationId - Integration ID
   * @returns {Object} Run result
   */
  async runIntegration(integrationId) {
    try {
      const integration = this.activeIntegrations.get(integrationId);
      if (!integration) {
        throw new Error('Integration is not active');
      }

      const startTime = Date.now();
      
      // Update last sync time
      await this.updateIntegration(integrationId, {
        lastSyncAt: new Date().toISOString(),
        syncCount: integration.syncCount + 1
      });

      // Simulate integration run
      const result = await this.executeIntegration(integration);

      const duration = Date.now() - startTime;
      
      logger.info('Integration run completed', { 
        integrationId, 
        duration: `${duration}ms`,
        result: result.status
      });

      return {
        integrationId,
        status: 'completed',
        duration,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error running integration:', error);
      
      // Update error count
      const integration = this.activeIntegrations.get(integrationId);
      if (integration) {
        await this.updateIntegration(integrationId, {
          errorCount: integration.errorCount + 1,
          lastError: error.message
        });
      }

      throw error;
    }
  }

  /**
   * Execute integration logic
   * @param {Object} integration - Integration object
   * @returns {Object} Execution result
   */
  async executeIntegration(integration) {
    try {
      // This is a simplified version - in real implementation,
      // you would call the appropriate connector based on integration type
      
      const connector = await this.getConnector(integration.type);
      if (!connector) {
        throw new Error(`Connector not found for type: ${integration.type}`);
      }

      // Execute connector logic
      const result = await connector.execute(integration);
      
      return {
        status: 'success',
        recordsProcessed: result.recordsProcessed || 0,
        errors: result.errors || [],
        duration: result.duration || 0
      };
    } catch (error) {
      logger.error('Error executing integration:', error);
      return {
        status: 'error',
        error: error.message,
        recordsProcessed: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Get connector for integration type
   * @param {string} type - Integration type
   * @returns {Object|null} Connector object or null
   */
  async getConnector(type) {
    // This would typically return a connector instance
    // For now, return a mock connector
    return {
      execute: async (integration) => {
        // Mock execution
        return {
          recordsProcessed: Math.floor(Math.random() * 100),
          errors: [],
          duration: Math.floor(Math.random() * 1000)
        };
      }
    };
  }

  /**
   * List integrations
   * @param {Object} filters - Filter options
   * @returns {Object} List of integrations
   */
  async listIntegrations(filters = {}) {
    try {
      let integrations = Array.from(this.integrations.values());

      // Apply filters
      if (filters.tenantId) {
        integrations = integrations.filter(integration => integration.tenantId === filters.tenantId);
      }
      if (filters.type) {
        integrations = integrations.filter(integration => integration.type === filters.type);
      }
      if (filters.status) {
        integrations = integrations.filter(integration => integration.status === filters.status);
      }
      if (filters.category) {
        integrations = integrations.filter(integration => integration.category === filters.category);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        integrations: integrations.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: integrations.length,
          pages: Math.ceil(integrations.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error listing integrations:', error);
      throw error;
    }
  }

  /**
   * Get active integrations
   * @returns {Array} List of active integrations
   */
  getActiveIntegrations() {
    return Array.from(this.activeIntegrations.values());
  }

  /**
   * Get total integrations
   * @returns {number} Total number of integrations
   */
  getTotalIntegrations() {
    return this.integrations.size;
  }

  /**
   * Get integration statistics
   * @returns {Object} Integration statistics
   */
  getIntegrationStats() {
    const totalIntegrations = this.integrations.size;
    const activeIntegrations = this.activeIntegrations.size;
    const inactiveIntegrations = totalIntegrations - activeIntegrations;

    const integrationsByType = {};
    const integrationsByStatus = {};

    for (const integration of this.integrations.values()) {
      integrationsByType[integration.type] = (integrationsByType[integration.type] || 0) + 1;
      integrationsByStatus[integration.status] = (integrationsByStatus[integration.status] || 0) + 1;
    }

    return {
      totalIntegrations,
      activeIntegrations,
      inactiveIntegrations,
      integrationsByType,
      integrationsByStatus,
      scheduledTasks: this.scheduledTasks.size
    };
  }

  /**
   * Test integration connection
   * @param {string} integrationId - Integration ID
   * @returns {Object} Test result
   */
  async testIntegration(integrationId) {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Test connection based on integration type
      const connector = await this.getConnector(integration.type);
      if (!connector) {
        throw new Error(`Connector not found for type: ${integration.type}`);
      }

      const testResult = await connector.testConnection(integration);
      
      logger.info('Integration test completed', { integrationId, result: testResult.status });
      return testResult;
    } catch (error) {
      logger.error('Error testing integration:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new IntegrationManager();
