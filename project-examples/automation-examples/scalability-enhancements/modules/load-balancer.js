const winston = require('winston');
const _ = require('lodash');

class LoadBalancer {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/load-balancer.log' })
      ]
    });
    
    this.servers = new Map();
    this.healthChecks = new Map();
    this.routingStrategies = new Map();
    this.stickySessions = new Map();
  }

  // Add server to load balancer
  async addServer(serverConfig) {
    try {
      const server = {
        id: this.generateId(),
        host: serverConfig.host,
        port: serverConfig.port,
        weight: serverConfig.weight || 1,
        maxConnections: serverConfig.maxConnections || 1000,
        currentConnections: 0,
        health: 'unknown',
        lastHealthCheck: null,
        responseTime: 0,
        errorCount: 0,
        successCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.servers.set(server.id, server);
      
      // Start health check for this server
      await this.startHealthCheck(server.id);
      
      this.logger.info('Server added to load balancer', { id: server.id, host: server.host, port: server.port });
      return server;
    } catch (error) {
      this.logger.error('Error adding server:', error);
      throw error;
    }
  }

  // Remove server from load balancer
  async removeServer(serverId) {
    try {
      const server = this.servers.get(serverId);
      if (!server) {
        throw new Error('Server not found');
      }

      // Stop health check
      this.stopHealthCheck(serverId);
      
      this.servers.delete(serverId);
      this.logger.info('Server removed from load balancer', { id: serverId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error removing server:', error);
      throw error;
    }
  }

  // Get next server based on strategy
  async getNextServer(strategy = 'round-robin', sessionId = null) {
    try {
      const availableServers = Array.from(this.servers.values())
        .filter(server => server.health === 'healthy' && server.currentConnections < server.maxConnections);

      if (availableServers.length === 0) {
        throw new Error('No healthy servers available');
      }

      let selectedServer;
      
      switch (strategy) {
        case 'round-robin':
          selectedServer = this.roundRobinSelection(availableServers);
          break;
        case 'least-connections':
          selectedServer = this.leastConnectionsSelection(availableServers);
          break;
        case 'weighted-round-robin':
          selectedServer = this.weightedRoundRobinSelection(availableServers);
          break;
        case 'weighted-least-connections':
          selectedServer = this.weightedLeastConnectionsSelection(availableServers);
          break;
        case 'ip-hash':
          selectedServer = this.ipHashSelection(availableServers, sessionId);
          break;
        case 'least-response-time':
          selectedServer = this.leastResponseTimeSelection(availableServers);
          break;
        default:
          selectedServer = this.roundRobinSelection(availableServers);
      }

      // Update connection count
      selectedServer.currentConnections++;
      selectedServer.updatedAt = new Date();
      this.servers.set(selectedServer.id, selectedServer);

      this.logger.info('Server selected', { 
        serverId: selectedServer.id, 
        strategy, 
        connections: selectedServer.currentConnections 
      });

      return selectedServer;
    } catch (error) {
      this.logger.error('Error getting next server:', error);
      throw error;
    }
  }

  // Round robin selection
  roundRobinSelection(servers) {
    const sortedServers = servers.sort((a, b) => a.id.localeCompare(b.id));
    const index = Math.floor(Math.random() * sortedServers.length);
    return sortedServers[index];
  }

  // Least connections selection
  leastConnectionsSelection(servers) {
    return servers.reduce((min, server) => 
      server.currentConnections < min.currentConnections ? server : min
    );
  }

  // Weighted round robin selection
  weightedRoundRobinSelection(servers) {
    const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const server of servers) {
      random -= server.weight;
      if (random <= 0) {
        return server;
      }
    }
    
    return servers[0];
  }

  // Weighted least connections selection
  weightedLeastConnectionsSelection(servers) {
    const weightedServers = servers.map(server => ({
      ...server,
      weightedConnections: server.currentConnections / server.weight
    }));
    
    return weightedServers.reduce((min, server) => 
      server.weightedConnections < min.weightedConnections ? server : min
    );
  }

  // IP hash selection
  ipHashSelection(servers, sessionId) {
    if (!sessionId) {
      return this.roundRobinSelection(servers);
    }
    
    const hash = this.hashCode(sessionId);
    const index = hash % servers.length;
    return servers[index];
  }

  // Least response time selection
  leastResponseTimeSelection(servers) {
    return servers.reduce((min, server) => 
      server.responseTime < min.responseTime ? server : min
    );
  }

  // Hash function for IP hashing
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Start health check for server
  async startHealthCheck(serverId) {
    const server = this.servers.get(serverId);
    if (!server) return;

    const healthCheck = {
      serverId,
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      path: '/health',
      expectedStatus: 200,
      intervalId: null
    };

    const checkHealth = async () => {
      try {
        const startTime = Date.now();
        const response = await this.performHealthCheck(server);
        const responseTime = Date.now() - startTime;

        server.health = 'healthy';
        server.responseTime = responseTime;
        server.lastHealthCheck = new Date();
        server.successCount++;

        this.servers.set(serverId, server);
        this.logger.debug('Health check passed', { serverId, responseTime });
      } catch (error) {
        server.health = 'unhealthy';
        server.errorCount++;
        server.lastHealthCheck = new Date();

        this.servers.set(serverId, server);
        this.logger.warn('Health check failed', { serverId, error: error.message });
      }
    };

    // Perform initial health check
    await checkHealth();

    // Set up interval
    healthCheck.intervalId = setInterval(checkHealth, healthCheck.interval);
    this.healthChecks.set(serverId, healthCheck);
  }

  // Stop health check for server
  stopHealthCheck(serverId) {
    const healthCheck = this.healthChecks.get(serverId);
    if (healthCheck && healthCheck.intervalId) {
      clearInterval(healthCheck.intervalId);
      this.healthChecks.delete(serverId);
    }
  }

  // Perform health check
  async performHealthCheck(server) {
    const axios = require('axios');
    const url = `http://${server.host}:${server.port}${this.healthCheck.path}`;
    
    const response = await axios.get(url, {
      timeout: this.healthCheck.timeout,
      validateStatus: (status) => status === this.healthCheck.expectedStatus
    });

    return response.data;
  }

  // Update server connection count
  async updateConnectionCount(serverId, delta) {
    try {
      const server = this.servers.get(serverId);
      if (!server) {
        throw new Error('Server not found');
      }

      server.currentConnections = Math.max(0, server.currentConnections + delta);
      server.updatedAt = new Date();
      
      this.servers.set(serverId, server);
      
      this.logger.debug('Connection count updated', { 
        serverId, 
        connections: server.currentConnections,
        delta 
      });
      
      return server;
    } catch (error) {
      this.logger.error('Error updating connection count:', error);
      throw error;
    }
  }

  // Get server statistics
  async getServerStats(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    return {
      id: server.id,
      host: server.host,
      port: server.port,
      weight: server.weight,
      maxConnections: server.maxConnections,
      currentConnections: server.currentConnections,
      health: server.health,
      lastHealthCheck: server.lastHealthCheck,
      responseTime: server.responseTime,
      errorCount: server.errorCount,
      successCount: server.successCount,
      successRate: server.successCount / (server.successCount + server.errorCount) || 0,
      uptime: Date.now() - server.createdAt.getTime()
    };
  }

  // Get all server statistics
  async getAllServerStats() {
    const stats = [];
    for (const [serverId] of this.servers) {
      try {
        const serverStats = await this.getServerStats(serverId);
        stats.push(serverStats);
      } catch (error) {
        this.logger.error('Error getting server stats:', { serverId, error: error.message });
      }
    }
    return stats;
  }

  // Get load balancer statistics
  async getLoadBalancerStats() {
    const servers = Array.from(this.servers.values());
    const healthyServers = servers.filter(s => s.health === 'healthy');
    const totalConnections = servers.reduce((sum, s) => sum + s.currentConnections, 0);
    const totalErrors = servers.reduce((sum, s) => sum + s.errorCount, 0);
    const totalSuccess = servers.reduce((sum, s) => sum + s.successCount, 0);

    return {
      totalServers: servers.length,
      healthyServers: healthyServers.length,
      totalConnections,
      totalErrors,
      totalSuccess,
      overallSuccessRate: totalSuccess / (totalSuccess + totalErrors) || 0,
      averageResponseTime: servers.reduce((sum, s) => sum + s.responseTime, 0) / servers.length || 0
    };
  }

  // Configure routing strategy
  async configureRoutingStrategy(strategy, config) {
    this.routingStrategies.set(strategy, {
      ...config,
      updatedAt: new Date()
    });
    
    this.logger.info('Routing strategy configured', { strategy, config });
  }

  // Enable sticky sessions
  async enableStickySessions(serverId, sessionId, ttl = 3600000) { // 1 hour default
    this.stickySessions.set(sessionId, {
      serverId,
      createdAt: new Date(),
      ttl,
      expiresAt: new Date(Date.now() + ttl)
    });
    
    this.logger.info('Sticky session enabled', { serverId, sessionId, ttl });
  }

  // Get sticky session server
  async getStickySessionServer(sessionId) {
    const session = this.stickySessions.get(sessionId);
    if (!session) return null;
    
    if (session.expiresAt < new Date()) {
      this.stickySessions.delete(sessionId);
      return null;
    }
    
    return this.servers.get(session.serverId);
  }

  // Clean up expired sticky sessions
  async cleanupExpiredSessions() {
    const now = new Date();
    let cleaned = 0;
    
    for (const [sessionId, session] of this.stickySessions.entries()) {
      if (session.expiresAt < now) {
        this.stickySessions.delete(sessionId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.info('Expired sticky sessions cleaned up', { cleaned });
    }
  }

  // Generate unique ID
  generateId() {
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new LoadBalancer();
