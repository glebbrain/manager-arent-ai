const fs = require('fs');
const path = require('path');
const winston = require('winston');
const axios = require('axios');
const { promisify } = require('util');
require('dotenv').config();

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/load-balancer.log' }),
    new winston.transports.Console()
  ]
});

class BackendService {
  constructor(id, config) {
    this.id = id;
    this.config = {
      url: '',
      weight: 1,
      healthCheck: {
        enabled: true,
        interval: 30000, // 30 seconds
        timeout: 5000, // 5 seconds
        path: '/health'
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        recoveryTimeout: 30000, // 30 seconds
        halfOpenMaxCalls: 3
      },
      ...config
    };
    this.status = 'unknown';
    this.healthCheckInterval = null;
    this.circuitBreakerState = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenCalls = 0;
    this.metrics = {
      requests: 0,
      successes: 0,
      failures: 0,
      responseTime: 0,
      lastResponseTime: 0
    };
  }

  async startHealthCheck() {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheck.interval);

    logger.info('Health check started', { backendId: this.id });
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Health check stopped', { backendId: this.id });
    }
  }

  async performHealthCheck() {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.config.url}${this.config.healthCheck.path}`, {
        timeout: this.config.healthCheck.timeout
      });
      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        this.status = 'healthy';
        this.resetCircuitBreaker();
        this.metrics.lastResponseTime = responseTime;
        logger.debug('Health check passed', { 
          backendId: this.id, 
          responseTime,
          status: this.status 
        });
      } else {
        this.status = 'unhealthy';
        this.recordFailure();
        logger.warn('Health check failed', { 
          backendId: this.id, 
          status: response.status,
          responseTime 
        });
      }
    } catch (error) {
      this.status = 'unhealthy';
      this.recordFailure();
      logger.warn('Health check error', { 
        backendId: this.id, 
        error: error.message 
      });
    }
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.config.circuitBreaker.enabled) {
      if (this.circuitBreakerState === 'closed' && 
          this.failureCount >= this.config.circuitBreaker.failureThreshold) {
        this.circuitBreakerState = 'open';
        logger.warn('Circuit breaker opened', { backendId: this.id });
      }
    }
  }

  resetCircuitBreaker() {
    this.failureCount = 0;
    this.halfOpenCalls = 0;
    
    if (this.circuitBreakerState === 'open') {
      this.circuitBreakerState = 'half-open';
      logger.info('Circuit breaker half-opened', { backendId: this.id });
    } else if (this.circuitBreakerState === 'half-open') {
      this.circuitBreakerState = 'closed';
      logger.info('Circuit breaker closed', { backendId: this.id });
    }
  }

  canHandleRequest() {
    if (this.status !== 'healthy') {
      return false;
    }

    if (this.config.circuitBreaker.enabled) {
      if (this.circuitBreakerState === 'open') {
        // Check if recovery timeout has passed
        const timeSinceLastFailure = Date.now() - this.lastFailureTime;
        if (timeSinceLastFailure >= this.config.circuitBreaker.recoveryTimeout) {
          this.circuitBreakerState = 'half-open';
          this.halfOpenCalls = 0;
        } else {
          return false;
        }
      }

      if (this.circuitBreakerState === 'half-open') {
        if (this.halfOpenCalls >= this.config.circuitBreaker.halfOpenMaxCalls) {
          return false;
        }
      }
    }

    return true;
  }

  async handleRequest(request) {
    if (!this.canHandleRequest()) {
      throw new Error('Backend service cannot handle request');
    }

    try {
      const startTime = Date.now();
      const response = await axios({
        method: request.method,
        url: `${this.config.url}${request.path}`,
        data: request.body,
        headers: request.headers,
        timeout: 30000 // 30 seconds
      });
      const responseTime = Date.now() - startTime;

      // Update metrics
      this.metrics.requests++;
      this.metrics.successes++;
      this.metrics.responseTime = responseTime;
      this.metrics.lastResponseTime = responseTime;

      // Reset circuit breaker on success
      this.resetCircuitBreaker();

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
        responseTime
      };
    } catch (error) {
      // Update metrics
      this.metrics.requests++;
      this.metrics.failures++;

      // Record failure
      this.recordFailure();

      throw error;
    }
  }

  getMetrics() {
    return {
      id: this.id,
      status: this.status,
      circuitBreakerState: this.circuitBreakerState,
      metrics: { ...this.metrics },
      config: this.config
    };
  }
}

class LoadBalancer {
  constructor(config = {}) {
    this.config = {
      algorithm: 'round-robin',
      healthCheck: {
        enabled: true,
        interval: 30000
      },
      sessionAffinity: {
        enabled: false,
        type: 'cookie',
        cookieName: 'lb-session'
      },
      ...config
    };
    this.backends = new Map();
    this.currentIndex = 0;
    this.sessions = new Map();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Load balancer already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting load balancer', { config: this.config });

    // Start health checks for all backends
    for (const backend of this.backends.values()) {
      if (this.config.healthCheck.enabled) {
        await backend.startHealthCheck();
      }
    }
  }

  stop() {
    this.isRunning = false;
    
    // Stop health checks for all backends
    for (const backend of this.backends.values()) {
      backend.stopHealthCheck();
    }

    logger.info('Stopped load balancer');
  }

  addBackend(id, config) {
    const backend = new BackendService(id, config);
    this.backends.set(id, backend);
    
    if (this.isRunning && this.config.healthCheck.enabled) {
      backend.startHealthCheck();
    }

    logger.info('Backend added', { backendId: id, config });
  }

  removeBackend(id) {
    const backend = this.backends.get(id);
    if (backend) {
      backend.stopHealthCheck();
      this.backends.delete(id);
      logger.info('Backend removed', { backendId: id });
    }
  }

  updateBackend(id, config) {
    const backend = this.backends.get(id);
    if (backend) {
      backend.config = { ...backend.config, ...config };
      logger.info('Backend updated', { backendId: id, config });
    }
  }

  getBackend(id) {
    return this.backends.get(id);
  }

  getAllBackends() {
    return Array.from(this.backends.values());
  }

  getHealthyBackends() {
    return Array.from(this.backends.values()).filter(backend => 
      backend.status === 'healthy' && backend.canHandleRequest()
    );
  }

  selectBackend(request) {
    const healthyBackends = this.getHealthyBackends();
    
    if (healthyBackends.length === 0) {
      throw new Error('No healthy backends available');
    }

    // Check session affinity
    if (this.config.sessionAffinity.enabled) {
      const sessionId = this.getSessionId(request);
      if (sessionId && this.sessions.has(sessionId)) {
        const backendId = this.sessions.get(sessionId);
        const backend = this.backends.get(backendId);
        if (backend && backend.canHandleRequest()) {
          return backend;
        }
      }
    }

    // Select backend based on algorithm
    let selectedBackend;
    
    switch (this.config.algorithm) {
      case 'round-robin':
        selectedBackend = this.roundRobinSelection(healthyBackends);
        break;
      case 'weighted-round-robin':
        selectedBackend = this.weightedRoundRobinSelection(healthyBackends);
        break;
      case 'least-connections':
        selectedBackend = this.leastConnectionsSelection(healthyBackends);
        break;
      case 'ip-hash':
        selectedBackend = this.ipHashSelection(healthyBackends, request);
        break;
      case 'least-response-time':
        selectedBackend = this.leastResponseTimeSelection(healthyBackends);
        break;
      case 'random':
        selectedBackend = this.randomSelection(healthyBackends);
        break;
      default:
        selectedBackend = this.roundRobinSelection(healthyBackends);
    }

    // Store session affinity
    if (this.config.sessionAffinity.enabled) {
      const sessionId = this.getSessionId(request);
      if (sessionId) {
        this.sessions.set(sessionId, selectedBackend.id);
      }
    }

    return selectedBackend;
  }

  roundRobinSelection(backends) {
    const backend = backends[this.currentIndex % backends.length];
    this.currentIndex = (this.currentIndex + 1) % backends.length;
    return backend;
  }

  weightedRoundRobinSelection(backends) {
    const totalWeight = backends.reduce((sum, backend) => sum + backend.config.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const backend of backends) {
      random -= backend.config.weight;
      if (random <= 0) {
        return backend;
      }
    }
    
    return backends[0];
  }

  leastConnectionsSelection(backends) {
    return backends.reduce((min, backend) => 
      backend.metrics.requests < min.metrics.requests ? backend : min
    );
  }

  ipHashSelection(backends, request) {
    const clientIP = request.headers['x-forwarded-for'] || 
                    request.headers['x-real-ip'] || 
                    request.connection?.remoteAddress || 
                    '127.0.0.1';
    
    const hash = this.hashString(clientIP);
    const index = hash % backends.length;
    return backends[index];
  }

  leastResponseTimeSelection(backends) {
    return backends.reduce((min, backend) => 
      backend.metrics.lastResponseTime < min.metrics.lastResponseTime ? backend : min
    );
  }

  randomSelection(backends) {
    const index = Math.floor(Math.random() * backends.length);
    return backends[index];
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getSessionId(request) {
    if (this.config.sessionAffinity.type === 'cookie') {
      const cookies = request.headers.cookie;
      if (cookies) {
        const cookieMatch = cookies.match(new RegExp(`${this.config.sessionAffinity.cookieName}=([^;]+)`));
        return cookieMatch ? cookieMatch[1] : null;
      }
    }
    return null;
  }

  async handleRequest(request) {
    try {
      const backend = this.selectBackend(request);
      const response = await backend.handleRequest(request);
      
      logger.debug('Request handled', {
        backendId: backend.id,
        method: request.method,
        path: request.path,
        responseTime: response.responseTime
      });

      return response;
    } catch (error) {
      logger.error('Request handling failed', {
        error: error.message,
        method: request.method,
        path: request.path
      });
      throw error;
    }
  }

  getStatus() {
    const backends = this.getAllBackends();
    const healthyBackends = this.getHealthyBackends();

    return {
      isRunning: this.isRunning,
      algorithm: this.config.algorithm,
      totalBackends: backends.length,
      healthyBackends: healthyBackends.length,
      backends: backends.map(backend => backend.getMetrics()),
      config: this.config
    };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info('Load balancer configuration updated', { config: this.config });
  }
}

// Express server for API endpoints
const express = require('express');
const app = express();
const port = process.env.PORT || 3010;

app.use(express.json());

const loadBalancer = new LoadBalancer();

// Start load balancer on server start
loadBalancer.start().catch(error => {
  logger.error('Failed to start load balancer', { error: error.message });
});

// API Routes
app.get('/api/balancer/status', (req, res) => {
  try {
    const status = loadBalancer.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Get balancer status failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/balancer/backends', (req, res) => {
  try {
    const backends = loadBalancer.getAllBackends();
    res.json({ success: true, data: backends.map(backend => backend.getMetrics()) });
  } catch (error) {
    logger.error('Get backends failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/balancer/backends', (req, res) => {
  try {
    const { id, config } = req.body;
    loadBalancer.addBackend(id, config);
    res.json({ success: true, message: 'Backend added' });
  } catch (error) {
    logger.error('Add backend failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/balancer/backends/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { config } = req.body;
    loadBalancer.updateBackend(id, config);
    res.json({ success: true, message: 'Backend updated' });
  } catch (error) {
    logger.error('Update backend failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/balancer/backends/:id', (req, res) => {
  try {
    const { id } = req.params;
    loadBalancer.removeBackend(id);
    res.json({ success: true, message: 'Backend removed' });
  } catch (error) {
    logger.error('Remove backend failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/balancer/configure', (req, res) => {
  try {
    const { config } = req.body;
    loadBalancer.updateConfig(config);
    res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    logger.error('Configure balancer failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Proxy endpoint for load balancing
app.all('/proxy/*', async (req, res) => {
  try {
    const request = {
      method: req.method,
      path: req.path.replace('/proxy', ''),
      body: req.body,
      headers: req.headers
    };

    const response = await loadBalancer.handleRequest(request);
    
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('Proxy request failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'load-balancer'
  });
});

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Load Balancer running on port ${port}`);
  });
}

module.exports = { LoadBalancer, BackendService };
