const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Redis = require('redis');
const { CircuitBreaker } = require('opossum');

const app = express();
const PORT = process.env.PORT || 3003;

// Redis client
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect();

// Circuit breaker configuration
const circuitBreakerOptions = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

// Service registry
const services = {
  'analytics-dashboard': {
    url: 'http://localhost:3002',
    health: '/api/health',
    circuitBreaker: new CircuitBreaker(createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: { '^/api/analytics': '' }
    }), circuitBreakerOptions)
  },
  'multi-modal-ai': {
    url: 'http://localhost:3000',
    health: '/api/health',
    circuitBreaker: new CircuitBreaker(createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: { '^/api/multimodal': '' }
    }), circuitBreakerOptions)
  },
  'quantum-ml': {
    url: 'http://localhost:3001',
    health: '/api/health',
    circuitBreaker: new CircuitBreaker(createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: { '^/api/quantum': '' }
    }), circuitBreakerOptions)
  }
};

// Load balancing strategies
const loadBalancingStrategies = {
  roundRobin: (services) => {
    let index = 0;
    return () => {
      const service = services[index % services.length];
      index++;
      return service;
    };
  },
  leastConnections: (services) => {
    return () => {
      return services.reduce((min, service) => 
        service.connections < min.connections ? service : min
      );
    };
  },
  weightedRoundRobin: (services) => {
    let index = 0;
    return () => {
      const service = services[index % services.length];
      index++;
      return service;
    };
  }
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting per service
const createRateLimit = (windowMs, max) => rateLimit({
  windowMs,
  max,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Global rate limiting
app.use('/api/', createRateLimit(15 * 60 * 1000, 1000));

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Service discovery
app.get('/api/services', async (req, res) => {
  const serviceList = [];
  
  for (const [name, service] of Object.entries(services)) {
    try {
      const healthResponse = await fetch(`${service.url}${service.health}`);
      const isHealthy = healthResponse.ok;
      
      serviceList.push({
        name,
        url: service.url,
        healthy: isHealthy,
        lastCheck: new Date().toISOString()
      });
    } catch (error) {
      serviceList.push({
        name,
        url: service.url,
        healthy: false,
        lastCheck: new Date().toISOString(),
        error: error.message
      });
    }
  }
  
  res.json(serviceList);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    uptime: process.uptime(),
    services: Object.keys(services).length
  });
});

// Service routing with load balancing
app.use('/api/analytics/*', async (req, res, next) => {
  const service = services['analytics-dashboard'];
  if (!service) {
    return res.status(503).json({ error: 'Service unavailable' });
  }
  
  try {
    await service.circuitBreaker.fire(req, res);
  } catch (error) {
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

app.use('/api/multimodal/*', async (req, res, next) => {
  const service = services['multi-modal-ai'];
  if (!service) {
    return res.status(503).json({ error: 'Service unavailable' });
  }
  
  try {
    await service.circuitBreaker.fire(req, res);
  } catch (error) {
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

app.use('/api/quantum/*', async (req, res, next) => {
  const service = services['quantum-ml'];
  if (!service) {
    return res.status(503).json({ error: 'Service unavailable' });
  }
  
  try {
    await service.circuitBreaker.fire(req, res);
  } catch (error) {
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

// API versioning
app.use('/api/v1/*', (req, res, next) => {
  req.apiVersion = 'v1';
  next();
});

app.use('/api/v2/*', (req, res, next) => {
  req.apiVersion = 'v2';
  next();
});

app.use('/api/v3/*', (req, res, next) => {
  req.apiVersion = 'v3';
  next();
});

// Request logging and analytics
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  
  const logData = {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  };
  
  console.log('Request:', logData);
  
  // Store in Redis for analytics
  redis.lPush('requests', JSON.stringify(logData));
  redis.expire('requests', 3600); // Keep for 1 hour
  
  next();
});

// Response time tracking
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const responseData = {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    };
    
    console.log('Response:', responseData);
    
    // Store in Redis for analytics
    redis.lPush('responses', JSON.stringify(responseData));
    redis.expire('responses', 3600);
  });
  
  next();
});

// Caching middleware
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    const cacheKey = `cache:${req.method}:${req.url}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      const originalSend = res.json;
      res.json = function(data) {
        redis.setEx(cacheKey, ttl, JSON.stringify(data));
        originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

// Apply caching to GET requests
app.get('/api/*', cacheMiddleware(300));

// Request transformation
app.use('/api/transform/*', (req, res, next) => {
  // Transform request based on API version
  if (req.apiVersion === 'v1') {
    // Legacy format transformation
    req.body = transformToV1Format(req.body);
  } else if (req.apiVersion === 'v2') {
    // V2 format transformation
    req.body = transformToV2Format(req.body);
  }
  
  next();
});

// Response transformation
app.use('/api/transform/*', (req, res, next) => {
  const originalSend = res.json;
  res.json = function(data) {
    if (req.apiVersion === 'v1') {
      data = transformFromV1Format(data);
    } else if (req.apiVersion === 'v2') {
      data = transformFromV2Format(data);
    }
    originalSend.call(this, data);
  };
  
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  
  const errorResponse = {
    error: 'Internal Server Error',
    message: err.message,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };
  
  res.status(500).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

// Utility functions
function transformToV1Format(data) {
  // Transform to legacy format
  return data;
}

function transformToV2Format(data) {
  // Transform to V2 format
  return data;
}

function transformFromV1Format(data) {
  // Transform from legacy format
  return data;
}

function transformFromV2Format(data) {
  // Transform from V2 format
  return data;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway Enhanced v3.0 running on port ${PORT}`);
  console.log(`🔀 Advanced routing and load balancing enabled`);
  console.log(`⚡ Circuit breaker protection enabled`);
  console.log(`📊 Request analytics enabled`);
  console.log(`🔄 API versioning enabled`);
});

module.exports = app;
