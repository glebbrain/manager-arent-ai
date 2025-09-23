const EventEmitter = require('events');
const axios = require('axios');
const logger = require('./logger');

/**
 * Load Balancer Module
 * Provides dynamic load balancing with health checks
 */
class LoadBalancer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled || process.env.LOAD_BALANCING_ENABLED === 'true',
      algorithm: config.algorithm || 'round-robin', // round-robin, least-connections, weighted, ip-hash
      healthCheckInterval: config.healthCheckInterval || parseInt(process.env.HEALTH_CHECK_INTERVAL) || 5000,
      maxRetries: config.maxRetries || parseInt(process.env.MAX_RETRIES) || 3,
      timeout: config.timeout || 5000,
      retryDelay: config.retryDelay || 1000,
      ...config
    };

    this.backends = new Map();
    this.healthChecks = new Map();
    this.currentIndex = 0;
    this.isRunning = false;
    this.healthCheckInterval = null;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      healthCheckFailures: 0
    };
  }

  /**
   * Start load balancer
   */
  async start() {
    if (!this.config.enabled) {
      logger.info('Load balancer is disabled');
      return;
    }

    try {
      await this.startHealthChecks();
      this.isRunning = true;
      logger.info('Load balancer started successfully');
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start load balancer:', error);
      throw error;
    }
  }

  /**
   * Stop load balancer
   */
  async stop() {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      this.isRunning = false;
      logger.info('Load balancer stopped');
      this.emit('stopped');
    } catch (error) {
      logger.error('Error stopping load balancer:', error);
      throw error;
    }
  }

  /**
   * Add backend server
   */
  async addBackend(id, url, options = {}) {
    const backend = {
      id,
      url: url.endsWith('/') ? url.slice(0, -1) : url,
      weight: options.weight || 1,
      maxConnections: options.maxConnections || 100,
      currentConnections: 0,
      status: 'unknown',
      lastHealthCheck: null,
      consecutiveFailures: 0,
      responseTime: 0,
      metadata: options.metadata || {}
    };

    this.backends.set(id, backend);
    this.healthChecks.set(id, {
      enabled: true,
      path: options.healthPath || '/health',
      timeout: options.healthTimeout || 3000,
      interval: options.healthInterval || this.config.healthCheckInterval
    });

    logger.info(`Backend server added: ${id} (${url})`);
    this.emit('backendAdded', backend);
    
    return backend;
  }

  /**
   * Remove backend server
   */
  async removeBackend(id) {
    const backend = this.backends.get(id);
    if (!backend) {
      throw new Error(`Backend server not found: ${id}`);
    }

    this.backends.delete(id);
    this.healthChecks.delete(id);
    
    logger.info(`Backend server removed: ${id}`);
    this.emit('backendRemoved', backend);
    
    return true;
  }

  /**
   * Get backend server by ID
   */
  getBackend(id) {
    return this.backends.get(id) || null;
  }

  /**
   * Get all backend servers
   */
  getAllBackends() {
    return Array.from(this.backends.values());
  }

  /**
   * Get healthy backend servers
   */
  getHealthyBackends() {
    return Array.from(this.backends.values())
      .filter(backend => backend.status === 'healthy');
  }

  /**
   * Get next backend server based on algorithm
   */
  getNextBackend(clientIP = null) {
    const healthyBackends = this.getHealthyBackends();
    
    if (healthyBackends.length === 0) {
      throw new Error('No healthy backend servers available');
    }

    switch (this.config.algorithm) {
      case 'round-robin':
        return this.getRoundRobinBackend(healthyBackends);
      case 'least-connections':
        return this.getLeastConnectionsBackend(healthyBackends);
      case 'weighted':
        return this.getWeightedBackend(healthyBackends);
      case 'ip-hash':
        return this.getIPHashBackend(healthyBackends, clientIP);
      default:
        return this.getRoundRobinBackend(healthyBackends);
    }
  }

  /**
   * Round-robin algorithm
   */
  getRoundRobinBackend(backends) {
    const backend = backends[this.currentIndex % backends.length];
    this.currentIndex++;
    return backend;
  }

  /**
   * Least connections algorithm
   */
  getLeastConnectionsBackend(backends) {
    return backends.reduce((min, backend) => 
      backend.currentConnections < min.currentConnections ? backend : min
    );
  }

  /**
   * Weighted round-robin algorithm
   */
  getWeightedBackend(backends) {
    const totalWeight = backends.reduce((sum, backend) => sum + backend.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const backend of backends) {
      random -= backend.weight;
      if (random <= 0) {
        return backend;
      }
    }
    
    return backends[0];
  }

  /**
   * IP hash algorithm
   */
  getIPHashBackend(backends, clientIP) {
    if (!clientIP) {
      return this.getRoundRobinBackend(backends);
    }
    
    const hash = this.hashCode(clientIP);
    const index = Math.abs(hash) % backends.length;
    return backends[index];
  }

  /**
   * Simple hash function for IP
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Forward request to backend
   */
  async forwardRequest(request, clientIP = null) {
    if (!this.isRunning) {
      throw new Error('Load balancer is not running');
    }

    let attempts = 0;
    let lastError = null;

    while (attempts < this.config.maxRetries) {
      try {
        const backend = this.getNextBackend(clientIP);
        
        if (backend.currentConnections >= backend.maxConnections) {
          throw new Error(`Backend ${backend.id} is at capacity`);
        }

        backend.currentConnections++;
        this.stats.totalRequests++;

        const startTime = Date.now();
        const response = await this.makeRequest(backend, request);
        const responseTime = Date.now() - startTime;

        backend.currentConnections--;
        backend.responseTime = responseTime;
        this.stats.successfulRequests++;

        this.emit('requestForwarded', {
          backend: backend.id,
          responseTime,
          status: response.status
        });

        return response;
      } catch (error) {
        attempts++;
        lastError = error;
        
        if (attempts < this.config.maxRetries) {
          await this.delay(this.config.retryDelay);
        }
      }
    }

    this.stats.failedRequests++;
    this.emit('requestFailed', { error: lastError, attempts });
    throw lastError;
  }

  /**
   * Make HTTP request to backend
   */
  async makeRequest(backend, request) {
    const config = {
      method: request.method || 'GET',
      url: `${backend.url}${request.path || ''}`,
      headers: request.headers || {},
      data: request.data,
      timeout: this.config.timeout,
      validateStatus: () => true // Accept all status codes
    };

    const response = await axios(config);
    return response;
  }

  /**
   * Start health checks
   */
  async startHealthChecks() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all backends
   */
  async performHealthChecks() {
    const promises = Array.from(this.backends.keys()).map(id => 
      this.checkBackendHealth(id)
    );

    await Promise.all(promises);
  }

  /**
   * Check health of specific backend
   */
  async checkBackendHealth(id) {
    const backend = this.backends.get(id);
    const healthCheck = this.healthChecks.get(id);

    if (!backend || !healthCheck || !healthCheck.enabled) {
      return;
    }

    try {
      const startTime = Date.now();
      const response = await axios.get(`${backend.url}${healthCheck.path}`, {
        timeout: healthCheck.timeout,
        validateStatus: (status) => status >= 200 && status < 300
      });

      const responseTime = Date.now() - startTime;
      
      if (response.status >= 200 && response.status < 300) {
        this.updateBackendHealth(backend, 'healthy', responseTime);
      } else {
        this.updateBackendHealth(backend, 'unhealthy', responseTime);
      }
    } catch (error) {
      this.updateBackendHealth(backend, 'unhealthy', 0);
      this.stats.healthCheckFailures++;
      
      logger.warn(`Health check failed for backend ${id}:`, error.message);
    }
  }

  /**
   * Update backend health status
   */
  updateBackendHealth(backend, status, responseTime) {
    const previousStatus = backend.status;
    backend.status = status;
    backend.lastHealthCheck = new Date();
    backend.responseTime = responseTime;

    if (status === 'healthy') {
      backend.consecutiveFailures = 0;
    } else {
      backend.consecutiveFailures++;
    }

    if (previousStatus !== status) {
      this.emit('backendHealthChanged', {
        id: backend.id,
        status,
        previousStatus,
        responseTime
      });
      
      logger.info(`Backend ${backend.id} health changed: ${previousStatus} -> ${status}`);
    }
  }

  /**
   * Get load balancer statistics
   */
  getStats() {
    const backends = Array.from(this.backends.values());
    const healthyCount = backends.filter(b => b.status === 'healthy').length;
    const unhealthyCount = backends.filter(b => b.status === 'unhealthy').length;
    const totalConnections = backends.reduce((sum, b) => sum + b.currentConnections, 0);

    return {
      ...this.stats,
      backends: {
        total: backends.length,
        healthy: healthyCount,
        unhealthy: unhealthyCount
      },
      connections: {
        total: totalConnections,
        average: backends.length > 0 ? totalConnections / backends.length : 0
      },
      algorithm: this.config.algorithm,
      hitRate: this.stats.totalRequests > 0 
        ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Get load balancer status
   */
  getStatus() {
    return {
      running: this.isRunning,
      algorithm: this.config.algorithm,
      backends: this.backends.size,
      healthyBackends: this.getHealthyBackends().length,
      stats: this.getStats()
    };
  }

  /**
   * Update load balancer configuration
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
    
    logger.info('Load balancer configuration updated');
  }

  /**
   * Update backend configuration
   */
  updateBackend(id, updates) {
    const backend = this.backends.get(id);
    if (!backend) {
      throw new Error(`Backend server not found: ${id}`);
    }

    Object.assign(backend, updates);
    this.emit('backendUpdated', backend);
    
    logger.info(`Backend ${id} configuration updated`);
  }

  /**
   * Enable/disable health checks for backend
   */
  setHealthCheck(id, enabled) {
    const healthCheck = this.healthChecks.get(id);
    if (!healthCheck) {
      throw new Error(`Health check not found for backend: ${id}`);
    }

    healthCheck.enabled = enabled;
    logger.info(`Health check ${enabled ? 'enabled' : 'disabled'} for backend ${id}`);
  }

  /**
   * Reset load balancer statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      healthCheckFailures: 0
    };
    
    logger.info('Load balancer statistics reset');
  }

  /**
   * Utility function for delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = LoadBalancer;
