const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/connector-registry.log' })
  ]
});

class ConnectorRegistry {
  constructor() {
    this.connectors = new Map();
    this.connectorTypes = new Map();
    this.connectorInstances = new Map();
    this.initializeDefaultConnectors();
  }

  /**
   * Initialize default connectors
   */
  initializeDefaultConnectors() {
    const defaultConnectors = [
      {
        id: 'salesforce-crm-connector',
        name: 'Salesforce CRM Connector',
        type: 'crm',
        version: '1.0.0',
        description: 'Connector for Salesforce CRM integration',
        capabilities: ['read', 'write', 'sync', 'webhook'],
        configuration: {
          authType: 'oauth2',
          requiredFields: ['clientId', 'clientSecret', 'redirectUri'],
          optionalFields: ['instanceUrl', 'apiVersion'],
          endpoints: {
            baseUrl: 'https://api.salesforce.com',
            authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
            tokenUrl: 'https://login.salesforce.com/services/oauth2/token'
          }
        },
        status: 'available'
      },
      {
        id: 'microsoft-365-connector',
        name: 'Microsoft 365 Connector',
        type: 'productivity',
        version: '1.0.0',
        description: 'Connector for Microsoft 365 integration',
        capabilities: ['read', 'write', 'sync', 'webhook'],
        configuration: {
          authType: 'oauth2',
          requiredFields: ['clientId', 'clientSecret', 'tenantId'],
          optionalFields: ['scope'],
          endpoints: {
            baseUrl: 'https://graph.microsoft.com',
            authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
          }
        },
        status: 'available'
      },
      {
        id: 'google-workspace-connector',
        name: 'Google Workspace Connector',
        type: 'productivity',
        version: '1.0.0',
        description: 'Connector for Google Workspace integration',
        capabilities: ['read', 'write', 'sync', 'webhook'],
        configuration: {
          authType: 'oauth2',
          requiredFields: ['clientId', 'clientSecret', 'redirectUri'],
          optionalFields: ['scope'],
          endpoints: {
            baseUrl: 'https://www.googleapis.com',
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token'
          }
        },
        status: 'available'
      },
      {
        id: 'slack-connector',
        name: 'Slack Connector',
        type: 'communication',
        version: '1.0.0',
        description: 'Connector for Slack integration',
        capabilities: ['read', 'write', 'webhook'],
        configuration: {
          authType: 'oauth2',
          requiredFields: ['clientId', 'clientSecret', 'redirectUri'],
          optionalFields: ['scope'],
          endpoints: {
            baseUrl: 'https://slack.com/api',
            authUrl: 'https://slack.com/oauth/v2/authorize',
            tokenUrl: 'https://slack.com/api/oauth.v2.access'
          }
        },
        status: 'available'
      },
      {
        id: 'jira-connector',
        name: 'Jira Connector',
        type: 'project_management',
        version: '1.0.0',
        description: 'Connector for Jira integration',
        capabilities: ['read', 'write', 'sync'],
        configuration: {
          authType: 'basic',
          requiredFields: ['baseUrl', 'username', 'password'],
          optionalFields: ['apiVersion'],
          endpoints: {
            baseUrl: 'https://your-domain.atlassian.net/rest/api/3'
          }
        },
        status: 'available'
      },
      {
        id: 'github-connector',
        name: 'GitHub Connector',
        type: 'development',
        version: '1.0.0',
        description: 'Connector for GitHub integration',
        capabilities: ['read', 'write', 'webhook'],
        configuration: {
          authType: 'oauth2',
          requiredFields: ['clientId', 'clientSecret', 'redirectUri'],
          optionalFields: ['scope'],
          endpoints: {
            baseUrl: 'https://api.github.com',
            authUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token'
          }
        },
        status: 'available'
      },
      {
        id: 'aws-connector',
        name: 'AWS Connector',
        type: 'cloud',
        version: '1.0.0',
        description: 'Connector for AWS integration',
        capabilities: ['read', 'write', 'sync'],
        configuration: {
          authType: 'aws_signature',
          requiredFields: ['accessKeyId', 'secretAccessKey', 'region'],
          optionalFields: ['sessionToken'],
          endpoints: {
            baseUrl: 'https://aws.amazon.com'
          }
        },
        status: 'available'
      },
      {
        id: 'azure-connector',
        name: 'Azure Connector',
        type: 'cloud',
        version: '1.0.0',
        description: 'Connector for Azure integration',
        capabilities: ['read', 'write', 'sync'],
        configuration: {
          authType: 'oauth2',
          requiredFields: ['clientId', 'clientSecret', 'tenantId'],
          optionalFields: ['scope'],
          endpoints: {
            baseUrl: 'https://management.azure.com',
            authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
          }
        },
        status: 'available'
      }
    ];

    defaultConnectors.forEach(connector => {
      this.connectors.set(connector.id, connector);
      this.connectorTypes.set(connector.type, connector);
    });

    logger.info('Default connectors initialized', { 
      count: defaultConnectors.length 
    });
  }

  /**
   * Register new connector
   * @param {Object} connectorData - Connector data
   * @returns {Object} Registered connector
   */
  async registerConnector(connectorData) {
    try {
      const connectorId = uuidv4();
      const connector = {
        id: connectorId,
        name: connectorData.name,
        type: connectorData.type,
        version: connectorData.version || '1.0.0',
        description: connectorData.description,
        capabilities: connectorData.capabilities || [],
        configuration: connectorData.configuration,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.connectors.set(connectorId, connector);
      this.connectorTypes.set(connector.type, connector);

      logger.info('Connector registered', { connectorId, name: connector.name });
      return connector;
    } catch (error) {
      logger.error('Error registering connector:', error);
      throw error;
    }
  }

  /**
   * Get connector by ID
   * @param {string} connectorId - Connector ID
   * @returns {Object|null} Connector object or null
   */
  async getConnector(connectorId) {
    try {
      return this.connectors.get(connectorId) || null;
    } catch (error) {
      logger.error('Error getting connector:', error);
      throw error;
    }
  }

  /**
   * Get connector by type
   * @param {string} type - Connector type
   * @returns {Object|null} Connector object or null
   */
  async getConnectorByType(type) {
    try {
      return this.connectorTypes.get(type) || null;
    } catch (error) {
      logger.error('Error getting connector by type:', error);
      throw error;
    }
  }

  /**
   * Update connector
   * @param {string} connectorId - Connector ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated connector
   */
  async updateConnector(connectorId, updateData) {
    try {
      const connector = await this.getConnector(connectorId);
      if (!connector) {
        throw new Error('Connector not found');
      }

      const updatedConnector = {
        ...connector,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.connectors.set(connectorId, updatedConnector);
      this.connectorTypes.set(connector.type, updatedConnector);

      logger.info('Connector updated', { connectorId });
      return updatedConnector;
    } catch (error) {
      logger.error('Error updating connector:', error);
      throw error;
    }
  }

  /**
   * Delete connector
   * @param {string} connectorId - Connector ID
   * @returns {boolean} Success status
   */
  async deleteConnector(connectorId) {
    try {
      const connector = await this.getConnector(connectorId);
      if (!connector) {
        throw new Error('Connector not found');
      }

      this.connectors.delete(connectorId);
      this.connectorTypes.delete(connector.type);

      logger.info('Connector deleted', { connectorId });
      return true;
    } catch (error) {
      logger.error('Error deleting connector:', error);
      throw error;
    }
  }

  /**
   * Create connector instance
   * @param {string} connectorId - Connector ID
   * @param {Object} configuration - Instance configuration
   * @returns {Object} Connector instance
   */
  async createConnectorInstance(connectorId, configuration) {
    try {
      const connector = await this.getConnector(connectorId);
      if (!connector) {
        throw new Error('Connector not found');
      }

      const instanceId = uuidv4();
      const instance = {
        id: instanceId,
        connectorId,
        configuration,
        status: 'inactive',
        createdAt: new Date().toISOString(),
        lastUsed: null,
        usageCount: 0
      };

      this.connectorInstances.set(instanceId, instance);

      logger.info('Connector instance created', { instanceId, connectorId });
      return instance;
    } catch (error) {
      logger.error('Error creating connector instance:', error);
      throw error;
    }
  }

  /**
   * Get connector instance
   * @param {string} instanceId - Instance ID
   * @returns {Object|null} Connector instance or null
   */
  async getConnectorInstance(instanceId) {
    try {
      return this.connectorInstances.get(instanceId) || null;
    } catch (error) {
      logger.error('Error getting connector instance:', error);
      throw error;
    }
  }

  /**
   * Execute connector
   * @param {string} instanceId - Instance ID
   * @param {string} action - Action to execute
   * @param {Object} data - Data for action
   * @returns {Object} Execution result
   */
  async executeConnector(instanceId, action, data = {}) {
    try {
      const instance = await this.getConnectorInstance(instanceId);
      if (!instance) {
        throw new Error('Connector instance not found');
      }

      const connector = await this.getConnector(instance.connectorId);
      if (!connector) {
        throw new Error('Connector not found');
      }

      // Update usage statistics
      instance.lastUsed = new Date().toISOString();
      instance.usageCount += 1;
      this.connectorInstances.set(instanceId, instance);

      // Execute connector based on type
      const result = await this.executeConnectorByType(connector.type, action, data, instance.configuration);

      logger.info('Connector executed', { instanceId, action, result: result.status });
      return result;
    } catch (error) {
      logger.error('Error executing connector:', error);
      throw error;
    }
  }

  /**
   * Execute connector by type
   * @param {string} type - Connector type
   * @param {string} action - Action to execute
   * @param {Object} data - Data for action
   * @param {Object} configuration - Connector configuration
   * @returns {Object} Execution result
   */
  async executeConnectorByType(type, action, data, configuration) {
    try {
      switch (type) {
        case 'crm':
          return await this.executeCRMConnector(action, data, configuration);
        case 'productivity':
          return await this.executeProductivityConnector(action, data, configuration);
        case 'communication':
          return await this.executeCommunicationConnector(action, data, configuration);
        case 'project_management':
          return await this.executeProjectManagementConnector(action, data, configuration);
        case 'development':
          return await this.executeDevelopmentConnector(action, data, configuration);
        case 'cloud':
          return await this.executeCloudConnector(action, data, configuration);
        default:
          throw new Error(`Unsupported connector type: ${type}`);
      }
    } catch (error) {
      logger.error('Error executing connector by type:', error);
      throw error;
    }
  }

  /**
   * Execute CRM connector
   * @param {string} action - Action to execute
   * @param {Object} data - Data for action
   * @param {Object} configuration - Connector configuration
   * @returns {Object} Execution result
   */
  async executeCRMConnector(action, data, configuration) {
    // Mock CRM connector execution
    return {
      status: 'success',
      action,
      recordsProcessed: Math.floor(Math.random() * 100),
      duration: Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute productivity connector
   * @param {string} action - Action to execute
   * @param {Object} data - Data for action
   * @param {Object} configuration - Connector configuration
   * @returns {Object} Execution result
   */
  async executeProductivityConnector(action, data, configuration) {
    // Mock productivity connector execution
    return {
      status: 'success',
      action,
      recordsProcessed: Math.floor(Math.random() * 50),
      duration: Math.floor(Math.random() * 800),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute communication connector
   * @param {string} action - Action to execute
   * @param {Object} data - Data for action
   * @param {Object} configuration - Connector configuration
   * @returns {Object} Execution result
   */
  async executeCommunicationConnector(action, data, configuration) {
    // Mock communication connector execution
    return {
      status: 'success',
      action,
      recordsProcessed: Math.floor(Math.random() * 25),
      duration: Math.floor(Math.random() * 500),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute project management connector
   * @param {string} action - Action to execute
   * @param {Object} data - Data for action
   * @param {Object} configuration - Connector configuration
   * @returns {Object} Execution result
   */
  async executeProjectManagementConnector(action, data, configuration) {
    // Mock project management connector execution
    return {
      status: 'success',
      action,
      recordsProcessed: Math.floor(Math.random() * 75),
      duration: Math.floor(Math.random() * 1200),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute development connector
   * @param {string} action - Action to execute
   * @param {Object} data - Data for action
   * @param {Object} configuration - Connector configuration
   * @returns {Object} Execution result
   */
  async executeDevelopmentConnector(action, data, configuration) {
    // Mock development connector execution
    return {
      status: 'success',
      action,
      recordsProcessed: Math.floor(Math.random() * 200),
      duration: Math.floor(Math.random() * 1500),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute cloud connector
   * @param {string} action - Action to execute
   * @param {Object} data - Data for action
   * @param {Object} configuration - Connector configuration
   * @returns {Object} Execution result
   */
  async executeCloudConnector(action, data, configuration) {
    // Mock cloud connector execution
    return {
      status: 'success',
      action,
      recordsProcessed: Math.floor(Math.random() * 150),
      duration: Math.floor(Math.random() * 2000),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test connector connection
   * @param {string} connectorId - Connector ID
   * @param {Object} configuration - Test configuration
   * @returns {Object} Test result
   */
  async testConnector(connectorId, configuration) {
    try {
      const connector = await this.getConnector(connectorId);
      if (!connector) {
        throw new Error('Connector not found');
      }

      // Test connection based on connector type
      const testResult = await this.testConnectorByType(connector.type, configuration);

      logger.info('Connector test completed', { connectorId, result: testResult.status });
      return testResult;
    } catch (error) {
      logger.error('Error testing connector:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test connector by type
   * @param {string} type - Connector type
   * @param {Object} configuration - Test configuration
   * @returns {Object} Test result
   */
  async testConnectorByType(type, configuration) {
    // Mock connector test
    return {
      status: 'success',
      message: 'Connection test successful',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * List connectors
   * @param {Object} filters - Filter options
   * @returns {Object} List of connectors
   */
  async listConnectors(filters = {}) {
    try {
      let connectors = Array.from(this.connectors.values());

      // Apply filters
      if (filters.type) {
        connectors = connectors.filter(connector => connector.type === filters.type);
      }
      if (filters.status) {
        connectors = connectors.filter(connector => connector.status === filters.status);
      }
      if (filters.capability) {
        connectors = connectors.filter(connector => 
          connector.capabilities.includes(filters.capability)
        );
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        connectors: connectors.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: connectors.length,
          pages: Math.ceil(connectors.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error listing connectors:', error);
      throw error;
    }
  }

  /**
   * Get connector statistics
   * @returns {Object} Connector statistics
   */
  getConnectorStats() {
    const totalConnectors = this.connectors.size;
    const totalInstances = this.connectorInstances.size;

    const connectorsByType = {};
    const connectorsByStatus = {};

    for (const connector of this.connectors.values()) {
      connectorsByType[connector.type] = (connectorsByType[connector.type] || 0) + 1;
      connectorsByStatus[connector.status] = (connectorsByStatus[connector.status] || 0) + 1;
    }

    return {
      totalConnectors,
      totalInstances,
      connectorsByType,
      connectorsByStatus
    };
  }
}

module.exports = new ConnectorRegistry();
