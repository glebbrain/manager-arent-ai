const winston = require('winston');
const { EC2Client, DescribeInstancesCommand, RunInstancesCommand, TerminateInstancesCommand } = require('@aws-sdk/client-ec2');
const { S3Client, CreateBucketCommand, ListBucketsCommand, DeleteBucketCommand } = require('@aws-sdk/client-s3');
const { LambdaClient, CreateFunctionCommand, ListFunctionsCommand, DeleteFunctionCommand } = require('@aws-sdk/client-lambda');
const { RDSClient, DescribeDBInstancesCommand, CreateDBInstanceCommand, DeleteDBInstanceCommand } = require('@aws-sdk/client-rds');
const { ElastiCacheClient, DescribeCacheClustersCommand, CreateCacheClusterCommand, DeleteCacheClusterCommand } = require('@aws-sdk/client-elasticache');
const { CloudFormationClient, CreateStackCommand, DescribeStacksCommand, DeleteStackCommand } = require('@aws-sdk/client-cloudformation');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { IAMClient, ListUsersCommand, CreateUserCommand, DeleteUserCommand } = require('@aws-sdk/client-iam');

class AWSProvider {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/aws-provider.log' })
      ]
    });
    
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
    
    this.clients = this.initializeClients();
    this.resources = new Map();
    this.metrics = {
      totalResources: 0,
      runningResources: 0,
      stoppedResources: 0,
      totalCost: 0
    };
  }

  // Initialize AWS clients
  initializeClients() {
    const config = {
      region: this.region,
      credentials: this.credentials
    };

    return {
      ec2: new EC2Client(config),
      s3: new S3Client(config),
      lambda: new LambdaClient(config),
      rds: new RDSClient(config),
      elasticache: new ElastiCacheClient(config),
      cloudformation: new CloudFormationClient(config),
      cloudwatch: new CloudWatchClient(config),
      iam: new IAMClient(config)
    };
  }

  // Create EC2 instance
  async createInstance(config) {
    try {
      const command = new RunInstancesCommand({
        ImageId: config.imageId || 'ami-12345678',
        MinCount: 1,
        MaxCount: config.count || 1,
        InstanceType: config.instanceType || 't3.medium',
        KeyName: config.keyName || 'default-key',
        SecurityGroupIds: config.securityGroups || ['sg-12345678'],
        SubnetId: config.subnetId,
        TagSpecifications: [{
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: config.name || 'aws-instance' },
            { Key: 'Environment', Value: config.environment || 'production' },
            ...(config.tags || []).map(tag => ({ Key: tag.key, Value: tag.value }))
          ]
        }]
      });

      const response = await this.clients.ec2.send(command);
      
      const instance = {
        id: response.Instances[0].InstanceId,
        type: 'ec2',
        name: config.name || 'aws-instance',
        status: 'pending',
        region: this.region,
        instanceType: config.instanceType || 't3.medium',
        publicIp: response.Instances[0].PublicIpAddress,
        privateIp: response.Instances[0].PrivateIpAddress,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(instance.id, instance);
      this.metrics.totalResources++;

      this.logger.info('EC2 instance created successfully', { 
        id: instance.id, 
        name: instance.name,
        instanceType: instance.instanceType 
      });

      return instance;
    } catch (error) {
      this.logger.error('Error creating EC2 instance:', error);
      throw error;
    }
  }

  // Create S3 bucket
  async createBucket(config) {
    try {
      const command = new CreateBucketCommand({
        Bucket: config.name || `aws-bucket-${Date.now()}`,
        Region: this.region,
        CreateBucketConfiguration: {
          LocationConstraint: this.region
        }
      });

      const response = await this.clients.s3.send(command);
      
      const bucket = {
        id: config.name || `aws-bucket-${Date.now()}`,
        type: 's3',
        name: config.name || `aws-bucket-${Date.now()}`,
        status: 'available',
        region: this.region,
        location: response.Location,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(bucket.id, bucket);
      this.metrics.totalResources++;

      this.logger.info('S3 bucket created successfully', { 
        id: bucket.id, 
        name: bucket.name 
      });

      return bucket;
    } catch (error) {
      this.logger.error('Error creating S3 bucket:', error);
      throw error;
    }
  }

  // Create Lambda function
  async createFunction(config) {
    try {
      const command = new CreateFunctionCommand({
        FunctionName: config.name || 'aws-lambda-function',
        Runtime: config.runtime || 'nodejs18.x',
        Role: config.role || 'arn:aws:iam::123456789012:role/lambda-execution-role',
        Handler: config.handler || 'index.handler',
        Code: {
          ZipFile: config.code || Buffer.from('exports.handler = async (event) => { return { statusCode: 200, body: "Hello World" }; };')
        },
        Description: config.description || 'AWS Lambda function',
        Timeout: config.timeout || 3,
        MemorySize: config.memorySize || 128,
        Environment: {
          Variables: config.environment || {}
        },
        Tags: {
          Environment: config.environment || 'production',
          ...(config.tags || {}).reduce((acc, tag) => ({ ...acc, [tag.key]: tag.value }), {})
        }
      });

      const response = await this.clients.lambda.send(command);
      
      const lambda = {
        id: response.FunctionName,
        type: 'lambda',
        name: response.FunctionName,
        status: 'active',
        region: this.region,
        runtime: response.Runtime,
        handler: response.Handler,
        memorySize: response.MemorySize,
        timeout: response.Timeout,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(lambda.id, lambda);
      this.metrics.totalResources++;

      this.logger.info('Lambda function created successfully', { 
        id: lambda.id, 
        name: lambda.name 
      });

      return lambda;
    } catch (error) {
      this.logger.error('Error creating Lambda function:', error);
      throw error;
    }
  }

  // Create RDS instance
  async createDatabase(config) {
    try {
      const command = new CreateDBInstanceCommand({
        DBInstanceIdentifier: config.name || 'aws-rds-instance',
        DBInstanceClass: config.instanceClass || 'db.t3.micro',
        Engine: config.engine || 'postgres',
        MasterUsername: config.username || 'admin',
        MasterUserPassword: config.password || 'password123',
        AllocatedStorage: config.allocatedStorage || 20,
        MultiAZ: config.multiAZ || false,
        PubliclyAccessible: config.publiclyAccessible || false,
        VpcSecurityGroupIds: config.securityGroups || ['sg-12345678'],
        DBSubnetGroupName: config.subnetGroup || 'default',
        Tags: [
          { Key: 'Name', Value: config.name || 'aws-rds-instance' },
          { Key: 'Environment', Value: config.environment || 'production' },
          ...(config.tags || []).map(tag => ({ Key: tag.key, Value: tag.value }))
        ]
      });

      const response = await this.clients.rds.send(command);
      
      const database = {
        id: response.DBInstance.DBInstanceIdentifier,
        type: 'rds',
        name: response.DBInstance.DBInstanceIdentifier,
        status: 'creating',
        region: this.region,
        engine: response.DBInstance.Engine,
        instanceClass: response.DBInstance.DBInstanceClass,
        allocatedStorage: response.DBInstance.AllocatedStorage,
        multiAZ: response.DBInstance.MultiAZ,
        endpoint: response.DBInstance.Endpoint?.Address,
        port: response.DBInstance.Endpoint?.Port,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(database.id, database);
      this.metrics.totalResources++;

      this.logger.info('RDS instance created successfully', { 
        id: database.id, 
        name: database.name 
      });

      return database;
    } catch (error) {
      this.logger.error('Error creating RDS instance:', error);
      throw error;
    }
  }

  // Create ElastiCache cluster
  async createCache(config) {
    try {
      const command = new CreateCacheClusterCommand({
        CacheClusterId: config.name || 'aws-elasticache-cluster',
        CacheNodeType: config.nodeType || 'cache.t3.micro',
        Engine: config.engine || 'redis',
        NumCacheNodes: config.numNodes || 1,
        Port: config.port || 6379,
        SecurityGroupIds: config.securityGroups || ['sg-12345678'],
        SubnetGroupName: config.subnetGroup || 'default',
        Tags: [
          { Key: 'Name', Value: config.name || 'aws-elasticache-cluster' },
          { Key: 'Environment', Value: config.environment || 'production' },
          ...(config.tags || []).map(tag => ({ Key: tag.key, Value: tag.value }))
        ]
      });

      const response = await this.clients.elasticache.send(command);
      
      const cache = {
        id: response.CacheCluster.CacheClusterId,
        type: 'elasticache',
        name: response.CacheCluster.CacheClusterId,
        status: 'creating',
        region: this.region,
        engine: response.CacheCluster.Engine,
        nodeType: response.CacheCluster.CacheNodeType,
        numNodes: response.CacheCluster.NumCacheNodes,
        port: response.CacheCluster.Port,
        endpoint: response.CacheCluster.Endpoint?.Address,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(cache.id, cache);
      this.metrics.totalResources++;

      this.logger.info('ElastiCache cluster created successfully', { 
        id: cache.id, 
        name: cache.name 
      });

      return cache;
    } catch (error) {
      this.logger.error('Error creating ElastiCache cluster:', error);
      throw error;
    }
  }

  // Create CloudFormation stack
  async createStack(config) {
    try {
      const command = new CreateStackCommand({
        StackName: config.name || 'aws-cloudformation-stack',
        TemplateBody: config.templateBody || this.getDefaultTemplate(),
        Parameters: config.parameters || [],
        Capabilities: config.capabilities || ['CAPABILITY_IAM'],
        Tags: [
          { Key: 'Name', Value: config.name || 'aws-cloudformation-stack' },
          { Key: 'Environment', Value: config.environment || 'production' },
          ...(config.tags || []).map(tag => ({ Key: tag.key, Value: tag.value }))
        ]
      });

      const response = await this.clients.cloudformation.send(command);
      
      const stack = {
        id: response.StackId,
        type: 'cloudformation',
        name: config.name || 'aws-cloudformation-stack',
        status: 'creating',
        region: this.region,
        stackId: response.StackId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.resources.set(stack.id, stack);
      this.metrics.totalResources++;

      this.logger.info('CloudFormation stack created successfully', { 
        id: stack.id, 
        name: stack.name 
      });

      return stack;
    } catch (error) {
      this.logger.error('Error creating CloudFormation stack:', error);
      throw error;
    }
  }

  // Get default CloudFormation template
  getDefaultTemplate() {
    return JSON.stringify({
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Default CloudFormation template',
      Resources: {
        MyInstance: {
          Type: 'AWS::EC2::Instance',
          Properties: {
            ImageId: 'ami-12345678',
            InstanceType: 't3.micro',
            SecurityGroups: ['default']
          }
        }
      }
    });
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

      let command;
      switch (resource.type) {
        case 'ec2':
          command = new TerminateInstancesCommand({ InstanceIds: [id] });
          await this.clients.ec2.send(command);
          break;
        case 's3':
          command = new DeleteBucketCommand({ Bucket: id });
          await this.clients.s3.send(command);
          break;
        case 'lambda':
          command = new DeleteFunctionCommand({ FunctionName: id });
          await this.clients.lambda.send(command);
          break;
        case 'rds':
          command = new DeleteDBInstanceCommand({ 
            DBInstanceIdentifier: id,
            SkipFinalSnapshot: true
          });
          await this.clients.rds.send(command);
          break;
        case 'elasticache':
          command = new DeleteCacheClusterCommand({ CacheClusterId: id });
          await this.clients.elasticache.send(command);
          break;
        case 'cloudformation':
          command = new DeleteStackCommand({ StackName: id });
          await this.clients.cloudformation.send(command);
          break;
        default:
          throw new Error(`Unsupported resource type: ${resource.type}`);
      }

      this.resources.delete(id);
      this.metrics.totalResources--;

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
      const command = new GetMetricStatisticsCommand({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [
          {
            Name: 'InstanceId',
            Value: 'i-1234567890abcdef0'
          }
        ],
        StartTime: new Date(Date.now() - 3600000), // 1 hour ago
        EndTime: new Date(),
        Period: 300, // 5 minutes
        Statistics: ['Average']
      });

      const response = await this.clients.cloudwatch.send(command);
      
      return {
        ...this.metrics,
        cloudwatchMetrics: response.Datapoints || []
      };
    } catch (error) {
      this.logger.error('Error getting metrics:', error);
      return this.metrics;
    }
  }

  // Get cost information
  async getCosts() {
    try {
      // This would typically use AWS Cost Explorer API
      // For now, return mock data
      return {
        totalCost: this.metrics.totalCost,
        monthlyCost: this.metrics.totalCost * 30,
        costByService: {
          ec2: this.metrics.totalCost * 0.4,
          s3: this.metrics.totalCost * 0.2,
          lambda: this.metrics.totalCost * 0.1,
          rds: this.metrics.totalCost * 0.2,
          elasticache: this.metrics.totalCost * 0.1
        }
      };
    } catch (error) {
      this.logger.error('Error getting costs:', error);
      throw error;
    }
  }

  // Generate unique ID
  generateId() {
    return `aws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new AWSProvider();
