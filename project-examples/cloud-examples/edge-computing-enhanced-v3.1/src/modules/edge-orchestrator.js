const EventEmitter = require('events');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * Edge Orchestrator - Intelligent edge device orchestration
 * Version: 3.1.0
 * Features:
 * - Intelligent workload distribution across edge nodes
 * - Dynamic resource allocation based on demand
 * - Edge service mesh for microservice management
 * - Automatic failover and recovery
 * - Edge cluster management
 */
class EdgeOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Orchestration Configuration
      loadBalancing: config.loadBalancing || 'round-robin', // round-robin, least-connections, weighted, ip-hash
      autoScaling: config.autoScaling !== false,
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      failoverTimeout: config.failoverTimeout || 5000, // 5 seconds
      
      // Resource Management
      maxCpuUsage: config.maxCpuUsage || 0.8, // 80%
      maxMemoryUsage: config.maxMemoryUsage || 0.8, // 80%
      minResources: config.minResources || { cpu: 0.1, memory: 128 }, // 10% CPU, 128MB RAM
      maxResources: config.maxResources || { cpu: 4.0, memory: 8192 }, // 4 CPU cores, 8GB RAM
      
      // Scaling Configuration
      scaleUpThreshold: config.scaleUpThreshold || 0.7, // 70% resource usage
      scaleDownThreshold: config.scaleDownThreshold || 0.3, // 30% resource usage
      scaleUpCooldown: config.scaleUpCooldown || 300000, // 5 minutes
      scaleDownCooldown: config.scaleDownCooldown || 600000, // 10 minutes
      
      // Service Mesh
      serviceMeshEnabled: config.serviceMeshEnabled !== false,
      serviceDiscovery: config.serviceDiscovery !== false,
      circuitBreaker: config.circuitBreaker !== false,
      retryPolicy: config.retryPolicy || { maxRetries: 3, backoff: 'exponential' },
      
      // Monitoring
      metricsEnabled: config.metricsEnabled !== false,
      alertingEnabled: config.alertingEnabled !== false,
      
      ...config
    };
    
    // Internal state
    this.cluster = new Map();
    this.services = new Map();
    this.workloads = new Map();
    this.routes = new Map();
    this.healthChecks = new Map();
    this.circuitBreakers = new Map();
    this.scalingHistory = [];
    this.alerts = [];
    
    this.metrics = {
      totalNodes: 0,
      activeNodes: 0,
      failedNodes: 0,
      totalServices: 0,
      activeServices: 0,
      failedServices: 0,
      totalWorkloads: 0,
      completedWorkloads: 0,
      failedWorkloads: 0,
      averageLatency: 0,
      averageThroughput: 0,
      resourceUtilization: { cpu: 0, memory: 0 },
      scalingEvents: 0,
      failoverEvents: 0,
      lastHealthCheck: null
    };
    
    // Performance monitoring
    this.performanceHistory = [];
    this.isScaling = false;
    this.lastScaleTime = 0;
    
    // Initialize orchestrator
    this.initialize();
  }

  /**
   * Initialize orchestrator
   */
  async initialize() {
    try {
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start resource monitoring
      this.startResourceMonitoring();
      
      // Start scaling monitor
      this.startScalingMonitor();
      
      // Start cleanup
      this.startCleanup();
      
      logger.info('Edge Orchestrator initialized', {
        loadBalancing: this.config.loadBalancing,
        autoScaling: this.config.autoScaling,
        serviceMeshEnabled: this.config.serviceMeshEnabled
      });
      
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Edge Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Register edge node
   */
  async registerNode(nodeInfo) {
    try {
      const nodeId = nodeInfo.id || uuidv4();
      
      // Validate node information
      this.validateNodeInfo(nodeInfo);
      
      // Create node record
      const node = {
        id: nodeId,
        name: nodeInfo.name,
        type: nodeInfo.type || 'edge-node',
        location: nodeInfo.location,
        capabilities: nodeInfo.capabilities || [],
        resources: {
          cpu: nodeInfo.resources?.cpu || 1.0,
          memory: nodeInfo.resources?.memory || 1024,
          storage: nodeInfo.resources?.storage || 10000,
          network: nodeInfo.resources?.network || 1000
        },
        status: 'registered',
        health: {
          status: 'unknown',
          lastCheck: null,
          consecutiveFailures: 0,
          uptime: 0
        },
        workload: {
          current: 0,
          max: nodeInfo.maxWorkload || 10,
          queue: []
        },
        metadata: nodeInfo.metadata || {},
        createdAt: Date.now(),
        lastSeen: Date.now()
      };
      
      // Store node
      this.cluster.set(nodeId, node);
      
      // Initialize health check
      this.initializeHealthCheck(nodeId);
      
      // Initialize circuit breaker
      this.initializeCircuitBreaker(nodeId);
      
      // Update metrics
      this.metrics.totalNodes++;
      this.metrics.activeNodes++;
      
      logger.info('Edge node registered', {
        nodeId,
        name: node.name,
        type: node.type,
        resources: node.resources
      });
      
      this.emit('nodeRegistered', { nodeId, node });
      
      return { nodeId, node };
      
    } catch (error) {
      logger.error('Failed to register edge node:', { nodeInfo, error: error.message });
      throw error;
    }
  }

  /**
   * Validate node information
   */
  validateNodeInfo(nodeInfo) {
    const required = ['name', 'type'];
    
    for (const field of required) {
      if (!nodeInfo[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
    
    // Validate node type
    const validTypes = ['edge-node', 'gateway', 'compute', 'storage', 'network'];
    if (!validTypes.includes(nodeInfo.type)) {
      throw new Error(`Invalid node type: ${nodeInfo.type}`);
    }
    
    // Validate resources
    if (nodeInfo.resources) {
      const { cpu, memory } = nodeInfo.resources;
      if (cpu && (cpu < 0 || cpu > this.config.maxResources.cpu)) {
        throw new Error(`Invalid CPU resource: ${cpu}`);
      }
      if (memory && (memory < 0 || memory > this.config.maxResources.memory)) {
        throw new Error(`Invalid memory resource: ${memory}`);
      }
    }
  }

  /**
   * Initialize health check for node
   */
  initializeHealthCheck(nodeId) {
    const healthCheck = {
      nodeId,
      interval: this.config.healthCheckInterval,
      timeout: 5000,
      retries: 3,
      lastCheck: null,
      consecutiveFailures: 0,
      isHealthy: false
    };
    
    this.healthChecks.set(nodeId, healthCheck);
  }

  /**
   * Initialize circuit breaker for node
   */
  initializeCircuitBreaker(nodeId) {
    const circuitBreaker = {
      nodeId,
      state: 'closed', // closed, open, half-open
      failureCount: 0,
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      lastFailureTime: null,
      successCount: 0,
      successThreshold: 3
    };
    
    this.circuitBreakers.set(nodeId, circuitBreaker);
  }

  /**
   * Register service
   */
  async registerService(serviceInfo) {
    try {
      const serviceId = serviceInfo.id || uuidv4();
      
      // Validate service information
      this.validateServiceInfo(serviceInfo);
      
      // Create service record
      const service = {
        id: serviceId,
        name: serviceInfo.name,
        version: serviceInfo.version || '1.0.0',
        type: serviceInfo.type || 'microservice',
        endpoints: serviceInfo.endpoints || [],
        dependencies: serviceInfo.dependencies || [],
        resources: {
          cpu: serviceInfo.resources?.cpu || 0.1,
          memory: serviceInfo.resources?.memory || 128,
          storage: serviceInfo.resources?.storage || 0
        },
        scaling: {
          minInstances: serviceInfo.scaling?.minInstances || 1,
          maxInstances: serviceInfo.scaling?.maxInstances || 10,
          targetCpu: serviceInfo.scaling?.targetCpu || 0.7,
          targetMemory: serviceInfo.scaling?.targetMemory || 0.7
        },
        health: {
          status: 'unknown',
          lastCheck: null,
          consecutiveFailures: 0
        },
        instances: new Map(),
        status: 'registered',
        metadata: serviceInfo.metadata || {},
        createdAt: Date.now(),
        lastSeen: Date.now()
      };
      
      // Store service
      this.services.set(serviceId, service);
      
      // Update metrics
      this.metrics.totalServices++;
      this.metrics.activeServices++;
      
      logger.info('Service registered', {
        serviceId,
        name: service.name,
        type: service.type,
        version: service.version
      });
      
      this.emit('serviceRegistered', { serviceId, service });
      
      return { serviceId, service };
      
    } catch (error) {
      logger.error('Failed to register service:', { serviceInfo, error: error.message });
      throw error;
    }
  }

  /**
   * Validate service information
   */
  validateServiceInfo(serviceInfo) {
    const required = ['name', 'type'];
    
    for (const field of required) {
      if (!serviceInfo[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
    
    // Validate service type
    const validTypes = ['microservice', 'api', 'worker', 'scheduler', 'monitor'];
    if (!validTypes.includes(serviceInfo.type)) {
      throw new Error(`Invalid service type: ${serviceInfo.type}`);
    }
  }

  /**
   * Deploy service instance
   */
  async deployServiceInstance(serviceId, nodeId, instanceConfig = {}) {
    try {
      const service = this.services.get(serviceId);
      const node = this.cluster.get(nodeId);
      
      if (!service) {
        throw new Error(`Service not found: ${serviceId}`);
      }
      
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }
      
      // Check node health
      if (node.health.status !== 'healthy') {
        throw new Error(`Node is not healthy: ${nodeId}`);
      }
      
      // Check resource availability
      if (!this.checkResourceAvailability(node, service.resources)) {
        throw new Error(`Insufficient resources on node: ${nodeId}`);
      }
      
      // Create instance
      const instanceId = uuidv4();
      const instance = {
        id: instanceId,
        serviceId,
        nodeId,
        status: 'deploying',
        resources: { ...service.resources },
        endpoints: instanceConfig.endpoints || [],
        health: {
          status: 'unknown',
          lastCheck: null,
          consecutiveFailures: 0
        },
        metadata: { ...instanceConfig.metadata },
        createdAt: Date.now(),
        startedAt: null
      };
      
      // Store instance
      service.instances.set(instanceId, instance);
      
      // Update node workload
      node.workload.current++;
      node.workload.queue.push(instanceId);
      
      // Simulate deployment
      setTimeout(() => {
        this.completeDeployment(instanceId, serviceId, nodeId);
      }, 5000);
      
      logger.info('Service instance deployment started', {
        instanceId,
        serviceId,
        nodeId,
        serviceName: service.name
      });
      
      this.emit('instanceDeploying', { instanceId, serviceId, nodeId });
      
      return { instanceId, instance };
      
    } catch (error) {
      logger.error('Failed to deploy service instance:', { serviceId, nodeId, error: error.message });
      throw error;
    }
  }

  /**
   * Complete service instance deployment
   */
  async completeDeployment(instanceId, serviceId, nodeId) {
    try {
      const service = this.services.get(serviceId);
      const node = this.cluster.get(nodeId);
      const instance = service.instances.get(instanceId);
      
      if (!instance) {
        return;
      }
      
      // Update instance status
      instance.status = 'running';
      instance.startedAt = Date.now();
      instance.health.status = 'healthy';
      instance.health.lastCheck = Date.now();
      
      // Update service status
      service.status = 'running';
      service.lastSeen = Date.now();
      
      // Update node status
      node.status = 'active';
      node.lastSeen = Date.now();
      
      logger.info('Service instance deployment completed', {
        instanceId,
        serviceId,
        nodeId,
        serviceName: service.name
      });
      
      this.emit('instanceDeployed', { instanceId, serviceId, nodeId });
      
    } catch (error) {
      logger.error('Failed to complete deployment:', { instanceId, error: error.message });
    }
  }

  /**
   * Check resource availability
   */
  checkResourceAvailability(node, requiredResources) {
    const availableCpu = node.resources.cpu - (node.workload.current * 0.1); // Assume 0.1 CPU per workload
    const availableMemory = node.resources.memory - (node.workload.current * 128); // Assume 128MB per workload
    
    return availableCpu >= requiredResources.cpu && 
           availableMemory >= requiredResources.memory;
  }

  /**
   * Distribute workload
   */
  async distributeWorkload(workload) {
    try {
      const workloadId = uuidv4();
      
      // Create workload record
      const workloadRecord = {
        id: workloadId,
        type: workload.type || 'task',
        priority: workload.priority || 'normal',
        resources: workload.resources || { cpu: 0.1, memory: 128 },
        data: workload.data,
        status: 'pending',
        assignedNode: null,
        createdAt: Date.now(),
        startedAt: null,
        completedAt: null,
        result: null,
        error: null
      };
      
      // Store workload
      this.workloads.set(workloadId, workloadRecord);
      
      // Find suitable node
      const suitableNode = await this.findSuitableNode(workloadRecord);
      
      if (!suitableNode) {
        workloadRecord.status = 'failed';
        workloadRecord.error = 'No suitable node available';
        this.metrics.failedWorkloads++;
        
        logger.warn('No suitable node found for workload', { workloadId });
        return { workloadId, status: 'failed', error: 'No suitable node available' };
      }
      
      // Assign workload to node
      await this.assignWorkloadToNode(workloadId, suitableNode.id);
      
      this.metrics.totalWorkloads++;
      
      logger.info('Workload distributed', {
        workloadId,
        nodeId: suitableNode.id,
        nodeName: suitableNode.name
      });
      
      this.emit('workloadDistributed', { workloadId, nodeId: suitableNode.id });
      
      return { workloadId, status: 'assigned', nodeId: suitableNode.id };
      
    } catch (error) {
      logger.error('Failed to distribute workload:', { workload, error: error.message });
      throw error;
    }
  }

  /**
   * Find suitable node for workload
   */
  async findSuitableNode(workload) {
    const suitableNodes = [];
    
    for (const [nodeId, node] of this.cluster) {
      // Check if node is healthy
      if (node.health.status !== 'healthy') {
        continue;
      }
      
      // Check if node has available capacity
      if (node.workload.current >= node.workload.max) {
        continue;
      }
      
      // Check resource availability
      if (!this.checkResourceAvailability(node, workload.resources)) {
        continue;
      }
      
      // Check capabilities
      if (workload.capabilities && !this.checkNodeCapabilities(node, workload.capabilities)) {
        continue;
      }
      
      // Calculate node score
      const score = this.calculateNodeScore(node, workload);
      suitableNodes.push({ nodeId, node, score });
    }
    
    if (suitableNodes.length === 0) {
      return null;
    }
    
    // Sort by score (highest first)
    suitableNodes.sort((a, b) => b.score - a.score);
    
    return suitableNodes[0].node;
  }

  /**
   * Check node capabilities
   */
  checkNodeCapabilities(node, requiredCapabilities) {
    return requiredCapabilities.every(capability => 
      node.capabilities.includes(capability)
    );
  }

  /**
   * Calculate node score
   */
  calculateNodeScore(node, workload) {
    let score = 0;
    
    // Resource availability score
    const cpuUtilization = (node.workload.current * 0.1) / node.resources.cpu;
    const memoryUtilization = (node.workload.current * 128) / node.resources.memory;
    
    score += (1 - cpuUtilization) * 0.4;
    score += (1 - memoryUtilization) * 0.4;
    
    // Workload capacity score
    const capacityUtilization = node.workload.current / node.workload.max;
    score += (1 - capacityUtilization) * 0.2;
    
    return score;
  }

  /**
   * Assign workload to node
   */
  async assignWorkloadToNode(workloadId, nodeId) {
    const workload = this.workloads.get(workloadId);
    const node = this.cluster.get(nodeId);
    
    if (!workload || !node) {
      throw new Error('Workload or node not found');
    }
    
    // Update workload
    workload.status = 'assigned';
    workload.assignedNode = nodeId;
    workload.startedAt = Date.now();
    
    // Update node
    node.workload.current++;
    node.workload.queue.push(workloadId);
    
    // Simulate workload execution
    setTimeout(() => {
      this.completeWorkload(workloadId);
    }, 10000); // 10 seconds simulation
  }

  /**
   * Complete workload
   */
  async completeWorkload(workloadId) {
    try {
      const workload = this.workloads.get(workloadId);
      if (!workload) {
        return;
      }
      
      // Update workload
      workload.status = 'completed';
      workload.completedAt = Date.now();
      workload.result = { success: true, data: 'Workload completed successfully' };
      
      // Update node
      const node = this.cluster.get(workload.assignedNode);
      if (node) {
        node.workload.current--;
        const queueIndex = node.workload.queue.indexOf(workloadId);
        if (queueIndex > -1) {
          node.workload.queue.splice(queueIndex, 1);
        }
      }
      
      // Update metrics
      this.metrics.completedWorkloads++;
      
      logger.info('Workload completed', {
        workloadId,
        nodeId: workload.assignedNode,
        duration: workload.completedAt - workload.startedAt
      });
      
      this.emit('workloadCompleted', { workloadId, result: workload.result });
      
    } catch (error) {
      logger.error('Failed to complete workload:', { workloadId, error: error.message });
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks
   */
  async performHealthChecks() {
    try {
      for (const [nodeId, node] of this.cluster) {
        await this.checkNodeHealth(nodeId);
      }
      
      for (const [serviceId, service] of this.services) {
        await this.checkServiceHealth(serviceId);
      }
      
      this.metrics.lastHealthCheck = Date.now();
      
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }

  /**
   * Check node health
   */
  async checkNodeHealth(nodeId) {
    try {
      const node = this.cluster.get(nodeId);
      if (!node) {
        return;
      }
      
      // Simulate health check
      const isHealthy = Math.random() > 0.1; // 90% success rate
      
      if (isHealthy) {
        node.health.status = 'healthy';
        node.health.consecutiveFailures = 0;
        node.status = 'active';
      } else {
        node.health.status = 'unhealthy';
        node.health.consecutiveFailures++;
        node.status = 'failed';
        
        // Trigger failover if too many failures
        if (node.health.consecutiveFailures >= 3) {
          await this.handleNodeFailure(nodeId);
        }
      }
      
      node.health.lastCheck = Date.now();
      
    } catch (error) {
      logger.error('Node health check failed:', { nodeId, error: error.message });
    }
  }

  /**
   * Check service health
   */
  async checkServiceHealth(serviceId) {
    try {
      const service = this.services.get(serviceId);
      if (!service) {
        return;
      }
      
      let healthyInstances = 0;
      let totalInstances = 0;
      
      for (const [instanceId, instance] of service.instances) {
        totalInstances++;
        
        // Simulate instance health check
        const isHealthy = Math.random() > 0.05; // 95% success rate
        
        if (isHealthy) {
          instance.health.status = 'healthy';
          instance.health.consecutiveFailures = 0;
          healthyInstances++;
        } else {
          instance.health.status = 'unhealthy';
          instance.health.consecutiveFailures++;
          
          // Remove failed instance
          if (instance.health.consecutiveFailures >= 3) {
            await this.removeServiceInstance(serviceId, instanceId);
          }
        }
        
        instance.health.lastCheck = Date.now();
      }
      
      // Update service health
      if (healthyInstances === 0) {
        service.health.status = 'unhealthy';
        service.status = 'failed';
        this.metrics.failedServices++;
      } else if (healthyInstances < totalInstances) {
        service.health.status = 'degraded';
        service.status = 'running';
      } else {
        service.health.status = 'healthy';
        service.status = 'running';
      }
      
    } catch (error) {
      logger.error('Service health check failed:', { serviceId, error: error.message });
    }
  }

  /**
   * Handle node failure
   */
  async handleNodeFailure(nodeId) {
    try {
      const node = this.cluster.get(nodeId);
      if (!node) {
        return;
      }
      
      // Mark node as failed
      node.status = 'failed';
      node.health.status = 'unhealthy';
      
      // Migrate workloads to other nodes
      for (const workloadId of node.workload.queue) {
        await this.migrateWorkload(workloadId, nodeId);
      }
      
      // Migrate service instances
      for (const [serviceId, service] of this.services) {
        for (const [instanceId, instance] of service.instances) {
          if (instance.nodeId === nodeId) {
            await this.migrateServiceInstance(serviceId, instanceId, nodeId);
          }
        }
      }
      
      this.metrics.failedNodes++;
      this.metrics.failoverEvents++;
      
      logger.warn('Node failure handled', {
        nodeId,
        nodeName: node.name,
        migratedWorkloads: node.workload.queue.length
      });
      
      this.emit('nodeFailed', { nodeId, node });
      
    } catch (error) {
      logger.error('Failed to handle node failure:', { nodeId, error: error.message });
    }
  }

  /**
   * Migrate workload
   */
  async migrateWorkload(workloadId, fromNodeId) {
    try {
      const workload = this.workloads.get(workloadId);
      if (!workload) {
        return;
      }
      
      // Find new node
      const newNode = await this.findSuitableNode(workload);
      if (!newNode) {
        workload.status = 'failed';
        workload.error = 'No suitable node for migration';
        return;
      }
      
      // Update workload
      workload.assignedNode = newNode.id;
      
      // Update old node
      const oldNode = this.cluster.get(fromNodeId);
      if (oldNode) {
        oldNode.workload.current--;
        const queueIndex = oldNode.workload.queue.indexOf(workloadId);
        if (queueIndex > -1) {
          oldNode.workload.queue.splice(queueIndex, 1);
        }
      }
      
      // Update new node
      newNode.workload.current++;
      newNode.workload.queue.push(workloadId);
      
      logger.info('Workload migrated', {
        workloadId,
        fromNodeId,
        toNodeId: newNode.id
      });
      
    } catch (error) {
      logger.error('Failed to migrate workload:', { workloadId, error: error.message });
    }
  }

  /**
   * Migrate service instance
   */
  async migrateServiceInstance(serviceId, instanceId, fromNodeId) {
    try {
      const service = this.services.get(serviceId);
      const instance = service.instances.get(instanceId);
      
      if (!service || !instance) {
        return;
      }
      
      // Find new node
      const newNode = await this.findSuitableNode({ resources: instance.resources });
      if (!newNode) {
        // Remove instance if no suitable node
        service.instances.delete(instanceId);
        return;
      }
      
      // Update instance
      instance.nodeId = newNode.id;
      instance.status = 'migrating';
      
      // Update old node
      const oldNode = this.cluster.get(fromNodeId);
      if (oldNode) {
        oldNode.workload.current--;
      }
      
      // Update new node
      newNode.workload.current++;
      
      // Complete migration
      setTimeout(() => {
        instance.status = 'running';
        instance.startedAt = Date.now();
      }, 2000);
      
      logger.info('Service instance migrated', {
        serviceId,
        instanceId,
        fromNodeId,
        toNodeId: newNode.id
      });
      
    } catch (error) {
      logger.error('Failed to migrate service instance:', { serviceId, instanceId, error: error.message });
    }
  }

  /**
   * Remove service instance
   */
  async removeServiceInstance(serviceId, instanceId) {
    try {
      const service = this.services.get(serviceId);
      const instance = service.instances.get(instanceId);
      
      if (!service || !instance) {
        return;
      }
      
      // Update node
      const node = this.cluster.get(instance.nodeId);
      if (node) {
        node.workload.current--;
        const queueIndex = node.workload.queue.indexOf(instanceId);
        if (queueIndex > -1) {
          node.workload.queue.splice(queueIndex, 1);
        }
      }
      
      // Remove instance
      service.instances.delete(instanceId);
      
      logger.info('Service instance removed', {
        serviceId,
        instanceId,
        nodeId: instance.nodeId
      });
      
    } catch (error) {
      logger.error('Failed to remove service instance:', { serviceId, instanceId, error: error.message });
    }
  }

  /**
   * Start resource monitoring
   */
  startResourceMonitoring() {
    setInterval(() => {
      this.updateResourceMetrics();
    }, 10000); // Run every 10 seconds
  }

  /**
   * Update resource metrics
   */
  updateResourceMetrics() {
    let totalCpu = 0;
    let totalMemory = 0;
    let usedCpu = 0;
    let usedMemory = 0;
    
    for (const [nodeId, node] of this.cluster) {
      if (node.status === 'active') {
        totalCpu += node.resources.cpu;
        totalMemory += node.resources.memory;
        usedCpu += node.workload.current * 0.1;
        usedMemory += node.workload.current * 128;
      }
    }
    
    this.metrics.resourceUtilization = {
      cpu: totalCpu > 0 ? usedCpu / totalCpu : 0,
      memory: totalMemory > 0 ? usedMemory / totalMemory : 0
    };
  }

  /**
   * Start scaling monitor
   */
  startScalingMonitor() {
    if (!this.config.autoScaling) {
      return;
    }
    
    setInterval(() => {
      this.checkScalingNeeds();
    }, 30000); // Run every 30 seconds
  }

  /**
   * Check scaling needs
   */
  async checkScalingNeeds() {
    try {
      if (this.isScaling) {
        return; // Already scaling
      }
      
      const now = Date.now();
      const { cpu, memory } = this.metrics.resourceUtilization;
      
      // Check if we need to scale up
      if (cpu > this.config.scaleUpThreshold || memory > this.config.scaleUpThreshold) {
        if (now - this.lastScaleTime > this.config.scaleUpCooldown) {
          await this.scaleUp();
        }
      }
      
      // Check if we need to scale down
      if (cpu < this.config.scaleDownThreshold && memory < this.config.scaleDownThreshold) {
        if (now - this.lastScaleTime > this.config.scaleDownCooldown) {
          await this.scaleDown();
        }
      }
      
    } catch (error) {
      logger.error('Scaling check failed:', error);
    }
  }

  /**
   * Scale up cluster
   */
  async scaleUp() {
    try {
      this.isScaling = true;
      
      // Find services that need scaling
      const servicesToScale = [];
      
      for (const [serviceId, service] of this.services) {
        if (service.instances.size < service.scaling.maxInstances) {
          servicesToScale.push(service);
        }
      }
      
      // Scale up services
      for (const service of servicesToScale) {
        await this.scaleUpService(service.id);
      }
      
      this.isScaling = false;
      this.lastScaleTime = Date.now();
      this.metrics.scalingEvents++;
      
      logger.info('Cluster scaled up', {
        servicesScaled: servicesToScale.length,
        resourceUtilization: this.metrics.resourceUtilization
      });
      
      this.emit('clusterScaledUp', { servicesScaled: servicesToScale.length });
      
    } catch (error) {
      this.isScaling = false;
      logger.error('Scale up failed:', error);
    }
  }

  /**
   * Scale down cluster
   */
  async scaleDown() {
    try {
      this.isScaling = true;
      
      // Find services that can be scaled down
      const servicesToScale = [];
      
      for (const [serviceId, service] of this.services) {
        if (service.instances.size > service.scaling.minInstances) {
          servicesToScale.push(service);
        }
      }
      
      // Scale down services
      for (const service of servicesToScale) {
        await this.scaleDownService(service.id);
      }
      
      this.isScaling = false;
      this.lastScaleTime = Date.now();
      this.metrics.scalingEvents++;
      
      logger.info('Cluster scaled down', {
        servicesScaled: servicesToScale.length,
        resourceUtilization: this.metrics.resourceUtilization
      });
      
      this.emit('clusterScaledDown', { servicesScaled: servicesToScale.length });
      
    } catch (error) {
      this.isScaling = false;
      logger.error('Scale down failed:', error);
    }
  }

  /**
   * Scale up service
   */
  async scaleUpService(serviceId) {
    try {
      const service = this.services.get(serviceId);
      if (!service) {
        return;
      }
      
      // Find suitable node
      const node = await this.findSuitableNode({ resources: service.resources });
      if (!node) {
        return;
      }
      
      // Deploy new instance
      await this.deployServiceInstance(serviceId, node.id);
      
      logger.info('Service scaled up', {
        serviceId,
        serviceName: service.name,
        nodeId: node.id,
        totalInstances: service.instances.size
      });
      
    } catch (error) {
      logger.error('Failed to scale up service:', { serviceId, error: error.message });
    }
  }

  /**
   * Scale down service
   */
  async scaleDownService(serviceId) {
    try {
      const service = this.services.get(serviceId);
      if (!service) {
        return;
      }
      
      // Find instance to remove (least recently used)
      let instanceToRemove = null;
      let oldestTime = Date.now();
      
      for (const [instanceId, instance] of service.instances) {
        if (instance.startedAt && instance.startedAt < oldestTime) {
          instanceToRemove = instanceId;
          oldestTime = instance.startedAt;
        }
      }
      
      if (instanceToRemove) {
        await this.removeServiceInstance(serviceId, instanceToRemove);
        
        logger.info('Service scaled down', {
          serviceId,
          serviceName: service.name,
          removedInstance: instanceToRemove,
          totalInstances: service.instances.size
        });
      }
      
    } catch (error) {
      logger.error('Failed to scale down service:', { serviceId, error: error.message });
    }
  }

  /**
   * Start cleanup
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 300000); // Run every 5 minutes
  }

  /**
   * Cleanup old data
   */
  cleanup() {
    // Cleanup old workloads
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    for (const [workloadId, workload] of this.workloads) {
      if (workload.createdAt < cutoff && workload.status === 'completed') {
        this.workloads.delete(workloadId);
      }
    }
    
    // Cleanup old scaling history
    this.scalingHistory = this.scalingHistory.filter(entry => entry.timestamp > cutoff);
  }

  /**
   * Get cluster status
   */
  getClusterStatus() {
    const nodes = [];
    const services = [];
    
    for (const [nodeId, node] of this.cluster) {
      nodes.push({
        id: node.id,
        name: node.name,
        type: node.type,
        status: node.status,
        health: node.health.status,
        resources: node.resources,
        workload: node.workload
      });
    }
    
    for (const [serviceId, service] of this.services) {
      services.push({
        id: service.id,
        name: service.name,
        type: service.type,
        status: service.status,
        health: service.health.status,
        instances: service.instances.size,
        resources: service.resources
      });
    }
    
    return {
      nodes,
      services,
      metrics: this.metrics,
      resourceUtilization: this.metrics.resourceUtilization
    };
  }

  /**
   * Get node information
   */
  getNodeInfo(nodeId) {
    const node = this.cluster.get(nodeId);
    if (!node) {
      return null;
    }
    
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      status: node.status,
      health: node.health,
      resources: node.resources,
      workload: node.workload,
      createdAt: node.createdAt,
      lastSeen: node.lastSeen
    };
  }

  /**
   * Get service information
   */
  getServiceInfo(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) {
      return null;
    }
    
    const instances = [];
    for (const [instanceId, instance] of service.instances) {
      instances.push({
        id: instance.id,
        nodeId: instance.nodeId,
        status: instance.status,
        health: instance.health,
        resources: instance.resources,
        createdAt: instance.createdAt,
        startedAt: instance.startedAt
      });
    }
    
    return {
      id: service.id,
      name: service.name,
      type: service.type,
      status: service.status,
      health: service.health,
      instances,
      resources: service.resources,
      scaling: service.scaling,
      createdAt: service.createdAt,
      lastSeen: service.lastSeen
    };
  }

  /**
   * Get workload information
   */
  getWorkloadInfo(workloadId) {
    const workload = this.workloads.get(workloadId);
    if (!workload) {
      return null;
    }
    
    return {
      id: workload.id,
      type: workload.type,
      status: workload.status,
      priority: workload.priority,
      assignedNode: workload.assignedNode,
      resources: workload.resources,
      createdAt: workload.createdAt,
      startedAt: workload.startedAt,
      completedAt: workload.completedAt,
      result: workload.result,
      error: workload.error
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      isScaling: this.isScaling,
      lastScaleTime: this.lastScaleTime
    };
  }

  /**
   * Dispose resources
   */
  async dispose() {
    try {
      // Clear all data
      this.cluster.clear();
      this.services.clear();
      this.workloads.clear();
      this.routes.clear();
      this.healthChecks.clear();
      this.circuitBreakers.clear();
      this.scalingHistory = [];
      this.alerts = [];
      
      logger.info('Edge Orchestrator disposed');
      
    } catch (error) {
      logger.error('Failed to dispose Edge Orchestrator:', error);
      throw error;
    }
  }
}

module.exports = EdgeOrchestrator;
