const winston = require('winston');
const { DefaultAzureCredential } = require('@azure/identity');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { StorageManagementClient } = require('@azure/arm-storage');
const { NetworkManagementClient } = require('@azure/arm-network');
const { ResourceManagementClient } = require('@azure/arm-resources');
const { MonitorClient } = require('@azure/arm-monitor');

class AzureProvider {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/azure-provider.log' })
      ]
    });
    
    this.subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    this.credential = new DefaultAzureCredential();
    this.resourceGroup = process.env.AZURE_RESOURCE_GROUP || 'universal-automation-rg';
    this.location = process.env.AZURE_LOCATION || 'East US';
    
    this.clients = this.initializeClients();
    this.resources = new Map();
    this.metrics = {
      totalResources: 0,
      runningResources: 0,
      stoppedResources: 0,
      totalCost: 0
    };
  }

  // Initialize Azure clients
  initializeClients() {
    const credential = this.credential;
    const subscriptionId = this.subscriptionId;

    return {
      compute: new ComputeManagementClient(credential, subscriptionId),
      storage: new StorageManagementClient(credential, subscriptionId),
      network: new NetworkManagementClient(credential, subscriptionId),
      resources: new ResourceManagementClient(credential, subscriptionId),
      monitor: new MonitorClient(credential, subscriptionId)
    };
  }

  // Create virtual machine
  async createVirtualMachine(config) {
    try {
      const vmName = config.name || 'azure-vm';
      const resourceGroupName = this.resourceGroup;
      const location = this.location;

      const vmParameters = {
        location: location,
        osProfile: {
          computerName: vmName,
          adminUsername: config.adminUsername || 'azureuser',
          adminPassword: config.adminPassword || 'AzurePassword123!'
        },
        hardwareProfile: {
          vmSize: config.vmSize || 'Standard_B1s'
        },
        storageProfile: {
          imageReference: {
            publisher: 'Canonical',
            offer: 'UbuntuServer',
            sku: '18.04-LTS',
            version: 'latest'
          },
          osDisk: {
            createOption: 'FromImage',
            managedDisk: {
              storageAccountType: 'Standard_LRS'
            }
          }
        },
        networkProfile: {
          networkInterfaces: [{
            id: await this.createNetworkInterface(vmName, location)
          }]
        }
      };

      const response = await this.clients.compute.virtualMachines.beginCreateOrUpdateAndWait(
        resourceGroupName,
        vmName,
        vmParameters
      );
      
      const vm = {
        id: response.id,
        type: 'virtualmachine',
        name: response.name,
        status: 'running',
        region: location,
        resourceGroup: resourceGroupName,
        vmSize: response.hardwareProfile.vmSize,
        osType: response.storageProfile.osDisk.osType,
        publicIp: null, // Would be retrieved from network interface
        privateIp: null, // Would be retrieved from network interface
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(vm.id, vm);
      this.metrics.totalResources++;
      this.metrics.runningResources++;

      this.logger.info('Virtual machine created successfully', { 
        id: vm.id, 
        name: vm.name,
        vmSize: vm.vmSize 
      });

      return vm;
    } catch (error) {
      this.logger.error('Error creating virtual machine:', error);
      throw error;
    }
  }

  // Create storage account
  async createStorageAccount(config) {
    try {
      const accountName = config.name || `azurestorage${Date.now()}`;
      const resourceGroupName = this.resourceGroup;
      const location = this.location;

      const storageParameters = {
        location: location,
        kind: config.kind || 'StorageV2',
        sku: {
          name: config.skuName || 'Standard_LRS'
        },
        tags: {
          Environment: config.environment || 'production',
          ...(config.tags || {}).reduce((acc, tag) => ({ ...acc, [tag.key]: tag.value }), {})
        }
      };

      const response = await this.clients.storage.storageAccounts.beginCreateAndWait(
        resourceGroupName,
        accountName,
        storageParameters
      );
      
      const storage = {
        id: response.id,
        type: 'storageaccount',
        name: response.name,
        status: 'available',
        region: location,
        resourceGroup: resourceGroupName,
        kind: response.kind,
        sku: response.sku.name,
        primaryEndpoints: response.primaryEndpoints,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(storage.id, storage);
      this.metrics.totalResources++;

      this.logger.info('Storage account created successfully', { 
        id: storage.id, 
        name: storage.name 
      });

      return storage;
    } catch (error) {
      this.logger.error('Error creating storage account:', error);
      throw error;
    }
  }

  // Create function app
  async createFunctionApp(config) {
    try {
      const functionAppName = config.name || `azure-function-${Date.now()}`;
      const resourceGroupName = this.resourceGroup;
      const location = this.location;

      // First create the storage account for the function app
      const storageAccount = await this.createStorageAccount({
        name: `${functionAppName}storage`,
        environment: config.environment || 'production'
      });

      const functionAppParameters = {
        location: location,
        kind: 'functionapp',
        properties: {
          serverFarmId: await this.createAppServicePlan(functionAppName, location),
          siteConfig: {
            appSettings: [
              {
                name: 'AzureWebJobsStorage',
                value: `DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=core.windows.net`
              },
              {
                name: 'FUNCTIONS_EXTENSION_VERSION',
                value: '~4'
              },
              {
                name: 'FUNCTIONS_WORKER_RUNTIME',
                value: 'node'
              }
            ]
          }
        },
        tags: {
          Environment: config.environment || 'production',
          ...(config.tags || {}).reduce((acc, tag) => ({ ...acc, [tag.key]: tag.value }), {})
        }
      };

      const response = await this.clients.resources.resources.beginCreateOrUpdateAndWait(
        resourceGroupName,
        'Microsoft.Web',
        '',
        `sites/${functionAppName}`,
        '2021-02-01',
        functionAppParameters
      );
      
      const functionApp = {
        id: response.id,
        type: 'functionapp',
        name: functionAppName,
        status: 'running',
        region: location,
        resourceGroup: resourceGroupName,
        runtime: 'node',
        storageAccount: storageAccount.name,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(functionApp.id, functionApp);
      this.metrics.totalResources++;
      this.metrics.runningResources++;

      this.logger.info('Function app created successfully', { 
        id: functionApp.id, 
        name: functionApp.name 
      });

      return functionApp;
    } catch (error) {
      this.logger.error('Error creating function app:', error);
      throw error;
    }
  }

  // Create SQL database
  async createSqlDatabase(config) {
    try {
      const serverName = config.serverName || `azure-sql-server-${Date.now()}`;
      const databaseName = config.name || 'azure-sql-database';
      const resourceGroupName = this.resourceGroup;
      const location = this.location;

      // First create the SQL server
      const serverParameters = {
        location: location,
        administratorLogin: config.adminUsername || 'azureuser',
        administratorLoginPassword: config.adminPassword || 'AzurePassword123!',
        version: '12.0'
      };

      const serverResponse = await this.clients.resources.resources.beginCreateOrUpdateAndWait(
        resourceGroupName,
        'Microsoft.Sql',
        '',
        `servers/${serverName}`,
        '2021-02-01',
        serverParameters
      );

      // Then create the database
      const databaseParameters = {
        location: location,
        properties: {
          collation: 'SQL_Latin1_General_CP1_CI_AS',
          maxSizeBytes: config.maxSizeBytes || 10737418240, // 10GB
          requestedServiceObjectiveName: config.serviceObjective || 'S0'
        }
      };

      const response = await this.clients.resources.resources.beginCreateOrUpdateAndWait(
        resourceGroupName,
        'Microsoft.Sql',
        `servers/${serverName}`,
        `databases/${databaseName}`,
        '2021-02-01',
        databaseParameters
      );
      
      const database = {
        id: response.id,
        type: 'sqldatabase',
        name: databaseName,
        status: 'available',
        region: location,
        resourceGroup: resourceGroupName,
        serverName: serverName,
        collation: databaseParameters.properties.collation,
        maxSizeBytes: databaseParameters.properties.maxSizeBytes,
        serviceObjective: databaseParameters.properties.requestedServiceObjectiveName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(database.id, database);
      this.metrics.totalResources++;

      this.logger.info('SQL database created successfully', { 
        id: database.id, 
        name: database.name 
      });

      return database;
    } catch (error) {
      this.logger.error('Error creating SQL database:', error);
      throw error;
    }
  }

  // Create Redis cache
  async createRedisCache(config) {
    try {
      const cacheName = config.name || `azure-redis-${Date.now()}`;
      const resourceGroupName = this.resourceGroup;
      const location = this.location;

      const redisParameters = {
        location: location,
        sku: {
          name: config.skuName || 'Basic',
          family: config.skuFamily || 'C',
          capacity: config.skuCapacity || 1
        },
        properties: {
          redisVersion: config.redisVersion || '6.0',
          enableNonSslPort: config.enableNonSslPort || false,
          minimumTlsVersion: config.minimumTlsVersion || '1.2'
        },
        tags: {
          Environment: config.environment || 'production',
          ...(config.tags || {}).reduce((acc, tag) => ({ ...acc, [tag.key]: tag.value }), {})
        }
      };

      const response = await this.clients.resources.resources.beginCreateOrUpdateAndWait(
        resourceGroupName,
        'Microsoft.Cache',
        '',
        `Redis/${cacheName}`,
        '2021-06-01',
        redisParameters
      );
      
      const cache = {
        id: response.id,
        type: 'rediscache',
        name: cacheName,
        status: 'creating',
        region: location,
        resourceGroup: resourceGroupName,
        sku: redisParameters.sku.name,
        redisVersion: redisParameters.properties.redisVersion,
        port: 6380, // SSL port
        sslPort: 6380,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(cache.id, cache);
      this.metrics.totalResources++;

      this.logger.info('Redis cache created successfully', { 
        id: cache.id, 
        name: cache.name 
      });

      return cache;
    } catch (error) {
      this.logger.error('Error creating Redis cache:', error);
      throw error;
    }
  }

  // Create network interface
  async createNetworkInterface(vmName, location) {
    try {
      const nicName = `${vmName}-nic`;
      const resourceGroupName = this.resourceGroup;

      const nicParameters = {
        location: location,
        ipConfigurations: [{
          name: 'ipconfig1',
          properties: {
            privateIPAllocationMethod: 'Dynamic',
            subnet: {
              id: await this.createSubnet(vmName, location)
            }
          }
        }]
      };

      const response = await this.clients.network.networkInterfaces.beginCreateOrUpdateAndWait(
        resourceGroupName,
        nicName,
        nicParameters
      );

      return response.id;
    } catch (error) {
      this.logger.error('Error creating network interface:', error);
      throw error;
    }
  }

  // Create subnet
  async createSubnet(vmName, location) {
    try {
      const vnetName = `${vmName}-vnet`;
      const subnetName = `${vmName}-subnet`;
      const resourceGroupName = this.resourceGroup;

      // First create the virtual network
      const vnetParameters = {
        location: location,
        addressSpace: {
          addressPrefixes: ['10.0.0.0/16']
        }
      };

      const vnetResponse = await this.clients.network.virtualNetworks.beginCreateOrUpdateAndWait(
        resourceGroupName,
        vnetName,
        vnetParameters
      );

      // Then create the subnet
      const subnetParameters = {
        addressPrefix: '10.0.1.0/24'
      };

      const response = await this.clients.network.subnets.beginCreateOrUpdateAndWait(
        resourceGroupName,
        vnetName,
        subnetName,
        subnetParameters
      );

      return response.id;
    } catch (error) {
      this.logger.error('Error creating subnet:', error);
      throw error;
    }
  }

  // Create app service plan
  async createAppServicePlan(functionAppName, location) {
    try {
      const planName = `${functionAppName}-plan`;
      const resourceGroupName = this.resourceGroup;

      const planParameters = {
        location: location,
        sku: {
          name: 'Y1',
          tier: 'Dynamic'
        }
      };

      const response = await this.clients.resources.resources.beginCreateOrUpdateAndWait(
        resourceGroupName,
        'Microsoft.Web',
        '',
        `serverfarms/${planName}`,
        '2021-02-01',
        planParameters
      );

      return response.id;
    } catch (error) {
      this.logger.error('Error creating app service plan:', error);
      throw error;
    }
  }

  // List resources
  async listResources(resourceType = null) {
    try {
      let resources = Array.from(this.resources.values());
      
      if (resourceType) {
        resources = resources.filter(r => r.type === resourceType);
      }
      
      return resources.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.logger.error('Error listing resources:', error);
      throw error;
    }
  }

  // Get resource
  async getResource(id) {
    const resource = this.resources.get(id);
    if (!resource) {
      throw new Error('Resource not found');
    }
    return resource;
  }

  // Delete resource
  async deleteResource(id) {
    try {
      const resource = this.resources.get(id);
      if (!resource) {
        throw new Error('Resource not found');
      }

      // Delete resource using Azure Resource Manager
      await this.clients.resources.resources.beginDeleteAndWait(
        this.resourceGroup,
        'Microsoft.Compute',
        '',
        resource.name,
        '2021-03-01'
      );

      this.resources.delete(id);
      this.metrics.totalResources--;

      if (resource.status === 'running') {
        this.metrics.runningResources--;
      } else {
        this.metrics.stoppedResources--;
      }

      this.logger.info('Resource deleted successfully', { id, type: resource.type });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting resource:', error);
      throw error;
    }
  }

  // Get metrics
  async getMetrics() {
    try {
      // This would typically use Azure Monitor API
      // For now, return mock data
      return {
        ...this.metrics,
        azureMetrics: []
      };
    } catch (error) {
      this.logger.error('Error getting metrics:', error);
      return this.metrics;
    }
  }

  // Get cost information
  async getCosts() {
    try {
      // This would typically use Azure Cost Management API
      // For now, return mock data
      return {
        totalCost: this.metrics.totalCost,
        monthlyCost: this.metrics.totalCost * 30,
        costByService: {
          virtualmachine: this.metrics.totalCost * 0.5,
          storageaccount: this.metrics.totalCost * 0.2,
          functionapp: this.metrics.totalCost * 0.1,
          sqldatabase: this.metrics.totalCost * 0.15,
          rediscache: this.metrics.totalCost * 0.05
        }
      };
    } catch (error) {
      this.logger.error('Error getting costs:', error);
      throw error;
    }
  }

  // Generate unique ID
  generateId() {
    return `azure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new AzureProvider();
