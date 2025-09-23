const winston = require('winston');
const { Compute } = require('@google-cloud/compute');
const { Storage } = require('@google-cloud/storage');
const { FunctionsServiceClient } = require('@google-cloud/functions');
const { SQL } = require('@google-cloud/sql');
const { Redis } = require('@google-cloud/redis');
const { Monitoring } = require('@google-cloud/monitoring');
const { IAM } = require('@google-cloud/iam');

class GCPProvider {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/gcp-provider.log' })
      ]
    });
    
    this.projectId = process.env.GCP_PROJECT_ID;
    this.region = process.env.GCP_REGION || 'us-central1';
    this.zone = process.env.GCP_ZONE || 'us-central1-a';
    
    this.clients = this.initializeClients();
    this.resources = new Map();
    this.metrics = {
      totalResources: 0,
      runningResources: 0,
      stoppedResources: 0,
      totalCost: 0
    };
  }

  // Initialize GCP clients
  initializeClients() {
    const projectId = this.projectId;

    return {
      compute: new Compute({ projectId }),
      storage: new Storage({ projectId }),
      functions: new FunctionsServiceClient({ projectId }),
      sql: new SQL({ projectId }),
      redis: new Redis({ projectId }),
      monitoring: new Monitoring({ projectId }),
      iam: new IAM({ projectId })
    };
  }

  // Create compute instance
  async createInstance(config) {
    try {
      const instanceName = config.name || 'gcp-instance';
      const zone = this.zone;

      const instanceConfig = {
        machineType: `zones/${zone}/machineTypes/${config.machineType || 'e2-micro'}`,
        disks: [{
          boot: true,
          autoDelete: true,
          initializeParams: {
            sourceImage: config.image || 'projects/debian-cloud/global/images/family/debian-11',
            diskSizeGb: config.diskSize || 10
          }
        }],
        networkInterfaces: [{
          network: 'global/networks/default',
          accessConfigs: [{
            type: 'ONE_TO_ONE_NAT',
            name: 'External NAT'
          }]
        }],
        tags: {
          items: config.tags || ['gcp-instance']
        },
        metadata: {
          items: [
            {
              key: 'startup-script',
              value: config.startupScript || '#!/bin/bash\necho "Hello World"'
            }
          ]
        }
      };

      const [instance] = await this.clients.compute.zone(zone).vm(instanceName).create(instanceConfig);
      
      const gcpInstance = {
        id: instance.id,
        type: 'compute',
        name: instance.name,
        status: 'running',
        region: this.region,
        zone: zone,
        machineType: config.machineType || 'e2-micro',
        externalIp: instance.networkInterfaces[0].accessConfigs[0].natIP,
        internalIp: instance.networkInterfaces[0].networkIP,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(gcpInstance.id, gcpInstance);
      this.metrics.totalResources++;
      this.metrics.runningResources++;

      this.logger.info('Compute instance created successfully', { 
        id: gcpInstance.id, 
        name: gcpInstance.name,
        machineType: gcpInstance.machineType 
      });

      return gcpInstance;
    } catch (error) {
      this.logger.error('Error creating compute instance:', error);
      throw error;
    }
  }

  // Create storage bucket
  async createBucket(config) {
    try {
      const bucketName = config.name || `gcp-bucket-${Date.now()}`;
      const location = this.region;

      const bucketConfig = {
        location: location,
        storageClass: config.storageClass || 'STANDARD',
        versioning: {
          enabled: config.versioning || false
        },
        lifecycle: config.lifecycle || {
          rule: [{
            action: { type: 'Delete' },
            condition: { age: 365 }
          }]
        },
        labels: {
          environment: config.environment || 'production',
          ...(config.tags || {}).reduce((acc, tag) => ({ ...acc, [tag.key]: tag.value }), {})
        }
      };

      const [bucket] = await this.clients.storage.bucket(bucketName).create(bucketConfig);
      
      const gcpBucket = {
        id: bucket.id,
        type: 'storage',
        name: bucket.name,
        status: 'available',
        region: location,
        storageClass: bucketConfig.storageClass,
        location: bucket.metadata.location,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(gcpBucket.id, gcpBucket);
      this.metrics.totalResources++;

      this.logger.info('Storage bucket created successfully', { 
        id: gcpBucket.id, 
        name: gcpBucket.name 
      });

      return gcpBucket;
    } catch (error) {
      this.logger.error('Error creating storage bucket:', error);
      throw error;
    }
  }

  // Create cloud function
  async createFunction(config) {
    try {
      const functionName = config.name || 'gcp-function';
      const region = this.region;

      const functionConfig = {
        name: `projects/${this.projectId}/locations/${region}/functions/${functionName}`,
        description: config.description || 'GCP Cloud Function',
        sourceArchiveUrl: config.sourceArchiveUrl || `gs://${this.projectId}-functions/${functionName}.zip`,
        entryPoint: config.entryPoint || 'helloWorld',
        runtime: config.runtime || 'nodejs18',
        availableMemoryMb: config.memory || 256,
        timeout: config.timeout || '60s',
        environmentVariables: config.environmentVariables || {},
        labels: {
          environment: config.environment || 'production',
          ...(config.tags || {}).reduce((acc, tag) => ({ ...acc, [tag.key]: tag.value }), {})
        }
      };

      const [operation] = await this.clients.functions.createFunction({
        parent: `projects/${this.projectId}/locations/${region}`,
        function: functionConfig
      });
      
      const gcpFunction = {
        id: operation.name,
        type: 'function',
        name: functionName,
        status: 'deploying',
        region: region,
        runtime: config.runtime || 'nodejs18',
        memory: config.memory || 256,
        timeout: config.timeout || '60s',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(gcpFunction.id, gcpFunction);
      this.metrics.totalResources++;

      this.logger.info('Cloud function created successfully', { 
        id: gcpFunction.id, 
        name: gcpFunction.name 
      });

      return gcpFunction;
    } catch (error) {
      this.logger.error('Error creating cloud function:', error);
      throw error;
    }
  }

  // Create Cloud SQL instance
  async createSqlInstance(config) {
    try {
      const instanceName = config.name || 'gcp-sql-instance';
      const region = this.region;

      const sqlConfig = {
        name: instanceName,
        databaseVersion: config.databaseVersion || 'POSTGRES_13',
        region: region,
        settings: {
          tier: config.tier || 'db-f1-micro',
          dataDiskSizeGb: config.diskSize || 10,
          dataDiskType: config.diskType || 'PD_SSD',
          backupConfiguration: {
            enabled: config.backupEnabled || true,
            startTime: config.backupStartTime || '03:00'
          },
          ipConfiguration: {
            ipv4Enabled: config.publicIp || false,
            authorizedNetworks: config.authorizedNetworks || []
          },
          locationPreference: {
            zone: this.zone
          }
        },
        labels: {
          environment: config.environment || 'production',
          ...(config.tags || {}).reduce((acc, tag) => ({ ...acc, [tag.key]: tag.value }), {})
        }
      };

      const [operation] = await this.clients.sql.instances.create(sqlConfig);
      
      const sqlInstance = {
        id: operation.name,
        type: 'sql',
        name: instanceName,
        status: 'creating',
        region: region,
        databaseVersion: config.databaseVersion || 'POSTGRES_13',
        tier: config.tier || 'db-f1-micro',
        diskSize: config.diskSize || 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(sqlInstance.id, sqlInstance);
      this.metrics.totalResources++;

      this.logger.info('Cloud SQL instance created successfully', { 
        id: sqlInstance.id, 
        name: sqlInstance.name 
      });

      return sqlInstance;
    } catch (error) {
      this.logger.error('Error creating Cloud SQL instance:', error);
      throw error;
    }
  }

  // Create Redis instance
  async createRedisInstance(config) {
    try {
      const instanceName = config.name || 'gcp-redis-instance';
      const region = this.region;

      const redisConfig = {
        name: `projects/${this.projectId}/locations/${region}/instances/${instanceName}`,
        tier: config.tier || 'BASIC',
        memorySizeGb: config.memorySize || 1,
        redisVersion: config.redisVersion || 'REDIS_6_X',
        displayName: instanceName,
        labels: {
          environment: config.environment || 'production',
          ...(config.tags || {}).reduce((acc, tag) => ({ ...acc, [tag.key]: tag.value }), {})
        }
      };

      const [operation] = await this.clients.redis.createInstance({
        parent: `projects/${this.projectId}/locations/${region}`,
        instanceId: instanceName,
        instance: redisConfig
      });
      
      const redisInstance = {
        id: operation.name,
        type: 'redis',
        name: instanceName,
        status: 'creating',
        region: region,
        tier: config.tier || 'BASIC',
        memorySize: config.memorySize || 1,
        redisVersion: config.redisVersion || 'REDIS_6_X',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(redisInstance.id, redisInstance);
      this.metrics.totalResources++;

      this.logger.info('Redis instance created successfully', { 
        id: redisInstance.id, 
        name: redisInstance.name 
      });

      return redisInstance;
    } catch (error) {
      this.logger.error('Error creating Redis instance:', error);
      throw error;
    }
  }

  // Create Kubernetes cluster
  async createKubernetesCluster(config) {
    try {
      const clusterName = config.name || 'gcp-gke-cluster';
      const region = this.region;

      const clusterConfig = {
        name: clusterName,
        location: region,
        initialNodeCount: config.nodeCount || 1,
        nodeConfig: {
          machineType: config.machineType || 'e2-medium',
          diskSizeGb: config.diskSize || 20,
          diskType: config.diskType || 'pd-standard',
          imageType: config.imageType || 'COS',
          oauthScopes: [
            'https://www.googleapis.com/auth/cloud-platform'
          ]
        },
        masterAuth: {
          username: config.masterUsername || 'admin',
          password: config.masterPassword || 'password123'
        },
        network: config.network || 'default',
        subnetwork: config.subnetwork || 'default',
        addonsConfig: {
          httpLoadBalancing: {
            disabled: false
          },
          horizontalPodAutoscaling: {
            disabled: false
          }
        },
        labels: {
          environment: config.environment || 'production',
          ...(config.tags || {}).reduce((acc, tag) => ({ ...acc, [tag.key]: tag.value }), {})
        }
      };

      const [operation] = await this.clients.compute.zone(region).cluster.create(clusterConfig);
      
      const gkeCluster = {
        id: operation.name,
        type: 'gke',
        name: clusterName,
        status: 'creating',
        region: region,
        nodeCount: config.nodeCount || 1,
        machineType: config.machineType || 'e2-medium',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(gkeCluster.id, gkeCluster);
      this.metrics.totalResources++;

      this.logger.info('Kubernetes cluster created successfully', { 
        id: gkeCluster.id, 
        name: gkeCluster.name 
      });

      return gkeCluster;
    } catch (error) {
      this.logger.error('Error creating Kubernetes cluster:', error);
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

      switch (resource.type) {
        case 'compute':
          await this.clients.compute.zone(this.zone).vm(resource.name).delete();
          break;
        case 'storage':
          await this.clients.storage.bucket(resource.name).delete();
          break;
        case 'function':
          await this.clients.functions.deleteFunction({
            name: resource.id
          });
          break;
        case 'sql':
          await this.clients.sql.instances.delete({
            name: resource.id
          });
          break;
        case 'redis':
          await this.clients.redis.deleteInstance({
            name: resource.id
          });
          break;
        case 'gke':
          await this.clients.compute.zone(this.region).cluster(resource.name).delete();
          break;
        default:
          throw new Error(`Unsupported resource type: ${resource.type}`);
      }

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
      // This would typically use Google Cloud Monitoring API
      // For now, return mock data
      return {
        ...this.metrics,
        gcpMetrics: []
      };
    } catch (error) {
      this.logger.error('Error getting metrics:', error);
      return this.metrics;
    }
  }

  // Get cost information
  async getCosts() {
    try {
      // This would typically use Google Cloud Billing API
      // For now, return mock data
      return {
        totalCost: this.metrics.totalCost,
        monthlyCost: this.metrics.totalCost * 30,
        costByService: {
          compute: this.metrics.totalCost * 0.4,
          storage: this.metrics.totalCost * 0.2,
          function: this.metrics.totalCost * 0.1,
          sql: this.metrics.totalCost * 0.2,
          redis: this.metrics.totalCost * 0.1
        }
      };
    } catch (error) {
      this.logger.error('Error getting costs:', error);
      throw error;
    }
  }

  // Generate unique ID
  generateId() {
    return `gcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new GCPProvider();
