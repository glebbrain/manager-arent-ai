const EventEmitter = require('events');
const logger = require('./logger');

class EdgeManager extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.edges = new Map();
    this.federation = new Map();
    this.config = {
      maxEdges: 1000,
      heartbeatInterval: 30000,
      discoveryTimeout: 5000,
      federationEnabled: true,
      autoDiscovery: true,
      loadBalancing: true,
      failover: true
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Edge Manager...');
      
      // Initialize edge discovery
      await this.initializeEdgeDiscovery();
      
      // Initialize federation
      await this.initializeFederation();
      
      // Initialize load balancing
      await this.initializeLoadBalancing();
      
      // Initialize failover
      await this.initializeFailover();
      
      this.isInitialized = true;
      logger.info('Edge Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Edge Manager:', error);
      throw error;
    }
  }

  async initializeEdgeDiscovery() {
    this.discovery = {
      active: true,
      interval: setInterval(() => {
        this.discoverEdges();
      }, this.config.discoveryTimeout),
      discovered: new Map()
    };
    
    logger.info('Edge discovery initialized');
  }

  async initializeFederation() {
    if (this.config.federationEnabled) {
      this.federation = {
        active: true,
        edges: new Map(),
        topology: new Map(),
        routing: new Map()
      };
      
      logger.info('Edge federation initialized');
    }
  }

  async initializeLoadBalancing() {
    if (this.config.loadBalancing) {
      this.loadBalancer = {
        active: true,
        strategy: 'round_robin', // 'round_robin', 'least_connections', 'weighted', 'random'
        weights: new Map(),
        connections: new Map()
      };
      
      logger.info('Load balancing initialized');
    }
  }

  async initializeFailover() {
    if (this.config.failover) {
      this.failover = {
        active: true,
        healthChecks: new Map(),
        backupEdges: new Map(),
        failoverTime: 5000
      };
      
      logger.info('Failover system initialized');
    }
  }

  // Edge Management
  async registerEdge(edgeInfo) {
    try {
      const edgeId = edgeInfo.id || this.generateEdgeId();
      
      const edge = {
        id: edgeId,
        name: edgeInfo.name || `Edge-${edgeId}`,
        type: edgeInfo.type || 'generic',
        location: edgeInfo.location || { lat: 0, lng: 0 },
        capabilities: edgeInfo.capabilities || [],
        resources: edgeInfo.resources || {},
        status: 'online',
        lastSeen: new Date(),
        registered: new Date(),
        metadata: edgeInfo.metadata || {}
      };
      
      this.edges.set(edgeId, edge);
      
      // Add to federation if enabled
      if (this.config.federationEnabled) {
        this.addToFederation(edge);
      }
      
      // Start health monitoring
      this.startHealthMonitoring(edgeId);
      
      this.emit('edgeRegistered', edge);
      logger.info(`Edge ${edgeId} registered successfully`);
      
      return edge;
    } catch (error) {
      logger.error(`Failed to register edge:`, error);
      throw error;
    }
  }

  async unregisterEdge(edgeId) {
    try {
      const edge = this.edges.get(edgeId);
      if (!edge) {
        throw new Error(`Edge ${edgeId} not found`);
      }
      
      // Remove from federation
      if (this.config.federationEnabled) {
        this.removeFromFederation(edgeId);
      }
      
      // Stop health monitoring
      this.stopHealthMonitoring(edgeId);
      
      this.edges.delete(edgeId);
      
      this.emit('edgeUnregistered', edge);
      logger.info(`Edge ${edgeId} unregistered successfully`);
      
      return edge;
    } catch (error) {
      logger.error(`Failed to unregister edge ${edgeId}:`, error);
      throw error;
    }
  }

  async updateEdge(edgeId, updates) {
    try {
      const edge = this.edges.get(edgeId);
      if (!edge) {
        throw new Error(`Edge ${edgeId} not found`);
      }
      
      // Update edge properties
      Object.assign(edge, updates);
      edge.lastSeen = new Date();
      
      // Update federation if enabled
      if (this.config.federationEnabled) {
        this.updateFederation(edgeId, updates);
      }
      
      this.emit('edgeUpdated', edge);
      logger.info(`Edge ${edgeId} updated successfully`);
      
      return edge;
    } catch (error) {
      logger.error(`Failed to update edge ${edgeId}:`, error);
      throw error;
    }
  }

  getEdge(edgeId) {
    return this.edges.get(edgeId);
  }

  listEdges(filter = {}) {
    const edges = Array.from(this.edges.values());
    
    return edges.filter(edge => {
      if (filter.type && edge.type !== filter.type) return false;
      if (filter.status && edge.status !== filter.status) return false;
      if (filter.location && !this.isInLocation(edge, filter.location)) return false;
      if (filter.capabilities && !this.hasCapabilities(edge, filter.capabilities)) return false;
      return true;
    });
  }

  // Edge Discovery
  async discoverEdges() {
    try {
      // This would typically involve network scanning, service discovery, etc.
      // For now, we'll simulate discovery
      const discoveredEdges = await this.scanNetwork();
      
      for (const edgeInfo of discoveredEdges) {
        if (!this.edges.has(edgeInfo.id)) {
          await this.registerEdge(edgeInfo);
        }
      }
      
      logger.info(`Discovered ${discoveredEdges.length} edges`);
    } catch (error) {
      logger.error('Edge discovery failed:', error);
    }
  }

  async scanNetwork() {
    // Simulate network scanning
    // In practice, this would involve actual network discovery protocols
    const discoveredEdges = [];
    
    // Simulate discovering some edges
    for (let i = 0; i < Math.floor(Math.random() * 5); i++) {
      discoveredEdges.push({
        id: `discovered_${Date.now()}_${i}`,
        name: `Discovered Edge ${i}`,
        type: 'generic',
        location: {
          lat: Math.random() * 180 - 90,
          lng: Math.random() * 360 - 180
        },
        capabilities: ['compute', 'storage'],
        resources: {
          cpu: Math.floor(Math.random() * 8) + 1,
          memory: Math.floor(Math.random() * 16) + 1,
          storage: Math.floor(Math.random() * 100) + 10
        }
      });
    }
    
    return discoveredEdges;
  }

  // Federation Management
  addToFederation(edge) {
    this.federation.edges.set(edge.id, edge);
    this.updateFederationTopology();
    logger.info(`Edge ${edge.id} added to federation`);
  }

  removeFromFederation(edgeId) {
    this.federation.edges.delete(edgeId);
    this.updateFederationTopology();
    logger.info(`Edge ${edgeId} removed from federation`);
  }

  updateFederation(edgeId, updates) {
    const edge = this.federation.edges.get(edgeId);
    if (edge) {
      Object.assign(edge, updates);
      this.updateFederationTopology();
    }
  }

  updateFederationTopology() {
    // Update federation topology based on edge locations and capabilities
    this.federation.topology.clear();
    
    for (const [edgeId, edge] of this.federation.edges) {
      const neighbors = this.findNeighbors(edge);
      this.federation.topology.set(edgeId, neighbors);
    }
  }

  findNeighbors(edge) {
    const neighbors = [];
    const maxDistance = 100; // km
    
    for (const [otherId, otherEdge] of this.federation.edges) {
      if (otherId !== edge.id) {
        const distance = this.calculateDistance(edge.location, otherEdge.location);
        if (distance <= maxDistance) {
          neighbors.push({
            id: otherId,
            distance,
            capabilities: otherEdge.capabilities,
            resources: otherEdge.resources
          });
        }
      }
    }
    
    return neighbors;
  }

  calculateDistance(loc1, loc2) {
    // Calculate distance between two locations using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(loc2.lat - loc1.lat);
    const dLng = this.toRadians(loc2.lng - loc1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(loc1.lat)) * Math.cos(this.toRadians(loc2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Load Balancing
  selectEdge(task, strategy = null) {
    const availableEdges = this.getAvailableEdges(task);
    if (availableEdges.length === 0) {
      throw new Error('No available edges for task');
    }
    
    const loadBalancingStrategy = strategy || this.loadBalancer.strategy;
    
    switch (loadBalancingStrategy) {
      case 'round_robin':
        return this.roundRobinSelection(availableEdges);
      case 'least_connections':
        return this.leastConnectionsSelection(availableEdges);
      case 'weighted':
        return this.weightedSelection(availableEdges);
      case 'random':
        return this.randomSelection(availableEdges);
      default:
        return this.roundRobinSelection(availableEdges);
    }
  }

  getAvailableEdges(task) {
    return Array.from(this.edges.values()).filter(edge => {
      return edge.status === 'online' && 
             this.hasCapabilities(edge, task.requiredCapabilities) &&
             this.hasResources(edge, task.requiredResources);
    });
  }

  hasCapabilities(edge, requiredCapabilities) {
    return requiredCapabilities.every(capability => 
      edge.capabilities.includes(capability)
    );
  }

  hasResources(edge, requiredResources) {
    for (const [resource, amount] of Object.entries(requiredResources)) {
      if (!edge.resources[resource] || edge.resources[resource] < amount) {
        return false;
      }
    }
    return true;
  }

  roundRobinSelection(edges) {
    const edgeIds = edges.map(edge => edge.id);
    const currentIndex = this.loadBalancer.currentIndex || 0;
    const selectedEdge = edges[currentIndex % edges.length];
    this.loadBalancer.currentIndex = (currentIndex + 1) % edges.length;
    return selectedEdge;
  }

  leastConnectionsSelection(edges) {
    return edges.reduce((min, edge) => {
      const connections = this.loadBalancer.connections.get(edge.id) || 0;
      const minConnections = this.loadBalancer.connections.get(min.id) || 0;
      return connections < minConnections ? edge : min;
    });
  }

  weightedSelection(edges) {
    const totalWeight = edges.reduce((sum, edge) => {
      const weight = this.loadBalancer.weights.get(edge.id) || 1;
      return sum + weight;
    }, 0);
    
    let random = Math.random() * totalWeight;
    
    for (const edge of edges) {
      const weight = this.loadBalancer.weights.get(edge.id) || 1;
      random -= weight;
      if (random <= 0) {
        return edge;
      }
    }
    
    return edges[edges.length - 1];
  }

  randomSelection(edges) {
    return edges[Math.floor(Math.random() * edges.length)];
  }

  // Health Monitoring
  startHealthMonitoring(edgeId) {
    const interval = setInterval(async () => {
      try {
        const isHealthy = await this.checkEdgeHealth(edgeId);
        if (!isHealthy) {
          await this.handleEdgeFailure(edgeId);
        }
      } catch (error) {
        logger.error(`Health check failed for edge ${edgeId}:`, error);
      }
    }, this.config.heartbeatInterval);
    
    this.failover.healthChecks.set(edgeId, interval);
  }

  stopHealthMonitoring(edgeId) {
    const interval = this.failover.healthChecks.get(edgeId);
    if (interval) {
      clearInterval(interval);
      this.failover.healthChecks.delete(edgeId);
    }
  }

  async checkEdgeHealth(edgeId) {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;
    
    // Check if edge is responsive
    const now = new Date();
    const timeSinceLastSeen = now - edge.lastSeen;
    
    if (timeSinceLastSeen > this.config.heartbeatInterval * 2) {
      return false;
    }
    
    // In practice, this would involve actual health checks
    // like ping, HTTP requests, etc.
    return true;
  }

  async handleEdgeFailure(edgeId) {
    const edge = this.edges.get(edgeId);
    if (!edge) return;
    
    edge.status = 'offline';
    
    // Find backup edges
    const backupEdges = this.findBackupEdges(edge);
    this.failover.backupEdges.set(edgeId, backupEdges);
    
    this.emit('edgeFailed', edge);
    logger.warn(`Edge ${edgeId} failed, backup edges: ${backupEdges.map(e => e.id).join(', ')}`);
  }

  findBackupEdges(failedEdge) {
    return Array.from(this.edges.values()).filter(edge => {
      return edge.id !== failedEdge.id &&
             edge.status === 'online' &&
             this.hasCapabilities(edge, failedEdge.capabilities) &&
             this.calculateDistance(edge.location, failedEdge.location) <= 200; // 200km radius
    });
  }

  // Utility Functions
  generateEdgeId() {
    return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isInLocation(edge, location) {
    if (!location.radius) return true;
    
    const distance = this.calculateDistance(edge.location, location);
    return distance <= location.radius;
  }

  // Statistics
  getStatistics() {
    const edges = Array.from(this.edges.values());
    const onlineEdges = edges.filter(edge => edge.status === 'online');
    const offlineEdges = edges.filter(edge => edge.status === 'offline');
    
    return {
      total: edges.length,
      online: onlineEdges.length,
      offline: offlineEdges.length,
      federation: this.config.federationEnabled ? this.federation.edges.size : 0,
      loadBalancing: this.config.loadBalancing,
      failover: this.config.failover
    };
  }

  // Health Check
  async healthCheck() {
    try {
      const status = {
        initialized: this.isInitialized,
        edges: this.edges.size,
        federation: this.config.federationEnabled ? this.federation.edges.size : 0,
        loadBalancing: this.loadBalancer?.active || false,
        failover: this.failover?.active || false,
        statistics: this.getStatistics(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      };

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: status
      };
    } catch (error) {
      logger.error('Edge Manager health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Cleanup
  async cleanup() {
    try {
      logger.info('Cleaning up Edge Manager...');
      
      // Stop health monitoring
      for (const [edgeId, interval] of this.failover.healthChecks) {
        clearInterval(interval);
      }
      
      // Stop discovery
      if (this.discovery?.interval) {
        clearInterval(this.discovery.interval);
      }
      
      this.edges.clear();
      this.federation.edges.clear();
      this.federation.topology.clear();
      this.federation.routing.clear();
      this.failover.healthChecks.clear();
      this.failover.backupEdges.clear();
      this.loadBalancer.weights.clear();
      this.loadBalancer.connections.clear();
      
      this.isInitialized = false;
      
      logger.info('Edge Manager cleanup completed');
    } catch (error) {
      logger.error('Edge Manager cleanup failed:', error);
    }
  }
}

module.exports = new EdgeManager();
