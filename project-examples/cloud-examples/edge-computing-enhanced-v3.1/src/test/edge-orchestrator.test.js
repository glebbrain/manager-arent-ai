const EdgeOrchestrator = require('../modules/edge-orchestrator');
const logger = require('../modules/logger');

describe('EdgeOrchestrator', () => {
  let orchestrator;
  
  beforeEach(() => {
    orchestrator = new EdgeOrchestrator({
      loadBalancing: 'round-robin',
      autoScaling: true,
      healthCheckInterval: 30000
    });
  });
  
  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.dispose();
    }
  });
  
  describe('Initialization', () => {
    test('should initialize with default config', () => {
      expect(orchestrator.config).toBeDefined();
      expect(orchestrator.config.loadBalancing).toBe('round-robin');
      expect(orchestrator.config.autoScaling).toBe(true);
      expect(orchestrator.config.healthCheckInterval).toBe(30000);
    });
    
    test('should initialize with custom config', () => {
      const customOrchestrator = new EdgeOrchestrator({
        loadBalancing: 'least-connections',
        autoScaling: false,
        healthCheckInterval: 60000
      });
      
      expect(customOrchestrator.config.loadBalancing).toBe('least-connections');
      expect(customOrchestrator.config.autoScaling).toBe(false);
      expect(customOrchestrator.config.healthCheckInterval).toBe(60000);
    });
  });
  
  describe('Node Management', () => {
    test('should register node successfully', async () => {
      const nodeInfo = {
        name: 'test-node',
        type: 'edge-node',
        location: 'test-location',
        capabilities: ['ai-processing', 'analytics'],
        resources: {
          cpu: 2.0,
          memory: 2048,
          storage: 10000,
          network: 1000
        }
      };
      
      const result = await orchestrator.registerNode(nodeInfo);
      
      expect(result).toBeDefined();
      expect(result.nodeId).toBeDefined();
      expect(result.node.name).toBe('test-node');
      expect(result.node.type).toBe('edge-node');
      expect(result.node.resources.cpu).toBe(2.0);
      expect(result.node.resources.memory).toBe(2048);
    });
    
    test('should validate node information', async () => {
      const invalidNodeInfo = {
        type: 'edge-node'
        // Missing required 'name' field
      };
      
      await expect(orchestrator.registerNode(invalidNodeInfo))
        .rejects.toThrow('Required field missing: name');
    });
    
    test('should get node info', async () => {
      const nodeInfo = {
        name: 'test-node',
        type: 'edge-node',
        location: 'test-location',
        resources: {
          cpu: 2.0,
          memory: 2048
        }
      };
      
      const result = await orchestrator.registerNode(nodeInfo);
      const info = orchestrator.getNodeInfo(result.nodeId);
      
      expect(info).toBeDefined();
      expect(info.id).toBe(result.nodeId);
      expect(info.name).toBe('test-node');
      expect(info.type).toBe('edge-node');
    });
  });
  
  describe('Service Management', () => {
    test('should register service successfully', async () => {
      const serviceInfo = {
        name: 'test-service',
        type: 'microservice',
        version: '1.0.0',
        endpoints: ['/api/test'],
        resources: {
          cpu: 0.5,
          memory: 512
        }
      };
      
      const result = await orchestrator.registerService(serviceInfo);
      
      expect(result).toBeDefined();
      expect(result.serviceId).toBeDefined();
      expect(result.service.name).toBe('test-service');
      expect(result.service.type).toBe('microservice');
      expect(result.service.version).toBe('1.0.0');
    });
    
    test('should validate service information', async () => {
      const invalidServiceInfo = {
        type: 'microservice'
        // Missing required 'name' field
      };
      
      await expect(orchestrator.registerService(invalidServiceInfo))
        .rejects.toThrow('Required field missing: name');
    });
    
    test('should get service info', async () => {
      const serviceInfo = {
        name: 'test-service',
        type: 'microservice',
        version: '1.0.0'
      };
      
      const result = await orchestrator.registerService(serviceInfo);
      const info = orchestrator.getServiceInfo(result.serviceId);
      
      expect(info).toBeDefined();
      expect(info.id).toBe(result.serviceId);
      expect(info.name).toBe('test-service');
      expect(info.type).toBe('microservice');
    });
  });
  
  describe('Service Instance Deployment', () => {
    test('should deploy service instance successfully', async () => {
      const nodeInfo = {
        name: 'test-node',
        type: 'edge-node',
        resources: {
          cpu: 2.0,
          memory: 2048
        }
      };
      
      const serviceInfo = {
        name: 'test-service',
        type: 'microservice',
        resources: {
          cpu: 0.5,
          memory: 512
        }
      };
      
      const nodeResult = await orchestrator.registerNode(nodeInfo);
      const serviceResult = await orchestrator.registerService(serviceInfo);
      
      const instanceResult = await orchestrator.deployServiceInstance(
        serviceResult.serviceId,
        nodeResult.nodeId
      );
      
      expect(instanceResult).toBeDefined();
      expect(instanceResult.instanceId).toBeDefined();
      expect(instanceResult.instance.serviceId).toBe(serviceResult.serviceId);
      expect(instanceResult.instance.nodeId).toBe(nodeResult.nodeId);
    });
    
    test('should handle deployment to non-existent node', async () => {
      const serviceInfo = {
        name: 'test-service',
        type: 'microservice',
        resources: {
          cpu: 0.5,
          memory: 512
        }
      };
      
      const serviceResult = await orchestrator.registerService(serviceInfo);
      
      await expect(orchestrator.deployServiceInstance(
        serviceResult.serviceId,
        'non-existent-node'
      )).rejects.toThrow('Node not found: non-existent-node');
    });
    
    test('should handle deployment of non-existent service', async () => {
      const nodeInfo = {
        name: 'test-node',
        type: 'edge-node',
        resources: {
          cpu: 2.0,
          memory: 2048
        }
      };
      
      const nodeResult = await orchestrator.registerNode(nodeInfo);
      
      await expect(orchestrator.deployServiceInstance(
        'non-existent-service',
        nodeResult.nodeId
      )).rejects.toThrow('Service not found: non-existent-service');
    });
  });
  
  describe('Workload Distribution', () => {
    test('should distribute workload successfully', async () => {
      const nodeInfo = {
        name: 'test-node',
        type: 'edge-node',
        resources: {
          cpu: 2.0,
          memory: 2048
        }
      };
      
      const nodeResult = await orchestrator.registerNode(nodeInfo);
      
      const workload = {
        type: 'task',
        priority: 'normal',
        resources: {
          cpu: 0.1,
          memory: 128
        },
        data: { message: 'test workload' }
      };
      
      const result = await orchestrator.distributeWorkload(workload);
      
      expect(result).toBeDefined();
      expect(result.workloadId).toBeDefined();
      expect(result.status).toBe('assigned');
      expect(result.nodeId).toBe(nodeResult.nodeId);
    });
    
    test('should handle workload distribution with no suitable nodes', async () => {
      const workload = {
        type: 'task',
        priority: 'normal',
        resources: {
          cpu: 10.0, // Very high resource requirement
          memory: 10000
        },
        data: { message: 'test workload' }
      };
      
      const result = await orchestrator.distributeWorkload(workload);
      
      expect(result).toBeDefined();
      expect(result.workloadId).toBeDefined();
      expect(result.status).toBe('failed');
      expect(result.error).toBe('No suitable node available');
    });
  });
  
  describe('Cluster Status', () => {
    test('should get cluster status', () => {
      const status = orchestrator.getClusterStatus();
      
      expect(status).toBeDefined();
      expect(status.nodes).toBeDefined();
      expect(status.services).toBeDefined();
      expect(status.metrics).toBeDefined();
      expect(status.resourceUtilization).toBeDefined();
      expect(Array.isArray(status.nodes)).toBe(true);
      expect(Array.isArray(status.services)).toBe(true);
    });
  });
  
  describe('Metrics', () => {
    test('should get metrics', () => {
      const metrics = orchestrator.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalNodes).toBe(0);
      expect(metrics.activeNodes).toBe(0);
      expect(metrics.failedNodes).toBe(0);
      expect(metrics.totalServices).toBe(0);
      expect(metrics.activeServices).toBe(0);
      expect(metrics.failedServices).toBe(0);
      expect(metrics.totalWorkloads).toBe(0);
      expect(metrics.completedWorkloads).toBe(0);
      expect(metrics.failedWorkloads).toBe(0);
    });
  });
});
