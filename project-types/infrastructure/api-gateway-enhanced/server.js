const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const winston = require('winston');
const http = require('http');
const https = require('https');
const cluster = require('cluster');
const os = require('os');
const Redis = require('redis');
const CircuitBreaker = require('opossum');
const LRU = require('lru-cache');
const crypto = require('crypto');
require('dotenv').config();

// Enhanced API Gateway v2.9 with Advanced Routing & Load Balancing
class EnhancedAPIGateway {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.clusterMode = process.env.CLUSTER_MODE === 'true';
        this.redisClient = null;
        this.cache = new LRU({ max: 1000, ttl: 1000 * 60 * 5 }); // 5 minutes
        this.loadBalancers = new Map();
        this.circuitBreakers = new Map();
        this.metrics = {
            requests: 0,
            errors: 0,
            responseTime: [],
            activeConnections: 0,
            serviceMetrics: new Map(),
            requestHistory: [],
            performanceAlerts: []
        };
        
        this.initializeLogger();
        this.initializeRedis();
        this.initializeServices();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupLoadBalancers();
        this.setupCircuitBreakers();
        this.setupHealthChecks();
        this.setupMetrics();
    }

    // Initialize logger
    initializeLogger() {
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),
                new winston.transports.File({ filename: 'logs/api-gateway-enhanced.log' }),
                new winston.transports.File({ 
                    filename: 'logs/api-gateway-errors.log', 
                    level: 'error' 
                })
            ]
        });
    }

    // Initialize Redis connection
    async initializeRedis() {
        try {
            if (process.env.REDIS_URL) {
                this.redisClient = Redis.createClient({
                    url: process.env.REDIS_URL
                });
                
                this.redisClient.on('error', (err) => {
                    this.logger.error('Redis connection error:', err);
                });
                
                this.redisClient.on('connect', () => {
                    this.logger.info('Connected to Redis');
                });
                
                await this.redisClient.connect();
            }
        } catch (error) {
            this.logger.warn('Redis not available, using in-memory cache:', error.message);
        }
    }

    // Initialize service configurations
    initializeServices() {
        this.services = {
            'project-manager': {
                instances: [
                    { url: 'http://project-manager-1:3000', weight: 1, healthy: true },
                    { url: 'http://project-manager-2:3000', weight: 1, healthy: true },
                    { url: 'http://project-manager-3:3000', weight: 2, healthy: true }
                ],
                timeout: 5000,
                retries: 3,
                circuitBreaker: {
                    timeout: 3000,
                    errorThresholdPercentage: 50,
                    resetTimeout: 30000
                }
            },
            'ai-planner': {
                instances: [
                    { url: 'http://ai-planner-1:3000', weight: 1, healthy: true },
                    { url: 'http://ai-planner-2:3000', weight: 1, healthy: true }
                ],
                timeout: 10000,
                retries: 2,
                circuitBreaker: {
                    timeout: 5000,
                    errorThresholdPercentage: 40,
                    resetTimeout: 60000
                }
            },
            'workflow-orchestrator': {
                instances: [
                    { url: 'http://workflow-orchestrator:3000', weight: 1, healthy: true }
                ],
                timeout: 15000,
                retries: 3,
                circuitBreaker: {
                    timeout: 10000,
                    errorThresholdPercentage: 60,
                    resetTimeout: 45000
                }
            },
            'smart-notifications': {
                instances: [
                    { url: 'http://smart-notifications:3000', weight: 1, healthy: true }
                ],
                timeout: 3000,
                retries: 2,
                circuitBreaker: {
                    timeout: 2000,
                    errorThresholdPercentage: 70,
                    resetTimeout: 30000
                }
            },
            'analytics-dashboard': {
                instances: [
                    { url: 'http://analytics-dashboard:3001', weight: 1, healthy: true }
                ],
                timeout: 5000,
                retries: 2,
                circuitBreaker: {
                    timeout: 3000,
                    errorThresholdPercentage: 50,
                    resetTimeout: 30000
                }
            }
        };
    }

    // Setup middleware
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
        }));

        // Compression
        this.app.use(compression());

        // Request logging
        this.app.use(morgan('combined', { 
            stream: { write: message => this.logger.info(message.trim()) } 
        }));

        // Body parsing
        this.app.use(express.json({ 
            limit: process.env.MAX_REQUEST_SIZE || '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: process.env.MAX_REQUEST_SIZE || '10mb' 
        }));

        // Rate limiting with Redis support
        this.setupRateLimiting();

        // Request ID middleware
        this.app.use((req, res, next) => {
            req.id = crypto.randomUUID();
            res.setHeader('X-Request-ID', req.id);
            next();
        });

        // Metrics middleware
        this.app.use((req, res, next) => {
            const start = Date.now();
            this.metrics.requests++;
            this.metrics.activeConnections++;

            res.on('finish', () => {
                const duration = Date.now() - start;
                this.metrics.responseTime.push(duration);
                
                if (res.statusCode >= 400) {
                    this.metrics.errors++;
                }

                this.metrics.activeConnections--;
                
                // Keep only last 1000 response times
                if (this.metrics.responseTime.length > 1000) {
                    this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
                }
            });

            next();
        });
    }

    // Setup rate limiting
    setupRateLimiting() {
        const rateLimitConfig = {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // requests per window
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000) / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                this.logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    requestId: req.id
                });
                res.status(429).json({
                    error: 'Too many requests',
                    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000) / 1000)
                });
            }
        };

        // Use Redis for distributed rate limiting if available
        if (this.redisClient) {
            const RedisStore = require('rate-limit-redis');
            rateLimitConfig.store = new RedisStore({
                sendCommand: (...args) => this.redisClient.sendCommand(args)
            });
        }

        this.app.use(rateLimit(rateLimitConfig));
    }

    // Setup load balancers
    setupLoadBalancers() {
        for (const [serviceName, config] of Object.entries(this.services)) {
            this.loadBalancers.set(serviceName, {
                instances: [...config.instances],
                currentIndex: 0,
                algorithm: 'round-robin', // Can be 'round-robin', 'weighted-round-robin', 'least-connections'
                healthCheckInterval: 30000 // 30 seconds
            });

            // Start health checks
            this.startHealthChecks(serviceName);
        }
    }

    // Setup circuit breakers
    setupCircuitBreakers() {
        for (const [serviceName, config] of Object.entries(this.services)) {
            const circuitBreakerOptions = {
                timeout: config.circuitBreaker.timeout,
                errorThresholdPercentage: config.circuitBreaker.errorThresholdPercentage,
                resetTimeout: config.circuitBreaker.resetTimeout,
                rollingCountTimeout: 10000,
                rollingCountBuckets: 10
            };

            const circuitBreaker = new CircuitBreaker(this.makeRequest.bind(this), circuitBreakerOptions);
            
            circuitBreaker.on('open', () => {
                this.logger.warn(`Circuit breaker opened for service: ${serviceName}`);
            });

            circuitBreaker.on('halfOpen', () => {
                this.logger.info(`Circuit breaker half-open for service: ${serviceName}`);
            });

            circuitBreaker.on('close', () => {
                this.logger.info(`Circuit breaker closed for service: ${serviceName}`);
            });

            this.circuitBreakers.set(serviceName, circuitBreaker);
        }
    }

    // Setup health checks
    setupHealthChecks() {
        this.app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                service: 'api-gateway-enhanced',
                version: '2.9.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                metrics: this.getMetrics(),
                services: this.getServiceHealth(),
                cluster: {
                    isMaster: cluster.isMaster,
                    workerId: cluster.worker ? cluster.worker.id : 'master'
                }
            };

            res.status(200).json(health);
        });

        this.app.get('/health/detailed', async (req, res) => {
            const detailedHealth = {
                ...this.app.get('/health'),
                redis: await this.checkRedisHealth(),
                loadBalancers: this.getLoadBalancerStatus(),
                circuitBreakers: this.getCircuitBreakerStatus()
            };

            res.status(200).json(detailedHealth);
        });
    }

    // Setup metrics endpoint
    setupMetrics() {
        this.app.get('/metrics', (req, res) => {
            const metrics = this.getMetrics();
            res.status(200).json(metrics);
        });

        // Prometheus metrics format
        this.app.get('/metrics/prometheus', (req, res) => {
            const metrics = this.getPrometheusMetrics();
            res.setHeader('Content-Type', 'text/plain');
            res.status(200).send(metrics);
        });

        // Enhanced analytics endpoints
        this.app.get('/api/v1/analytics/load-balancers', (req, res) => {
            res.json({
                success: true,
                data: this.getLoadBalancerAnalytics(),
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/api/v1/analytics/circuit-breakers', (req, res) => {
            res.json({
                success: true,
                data: this.getCircuitBreakerAnalytics(),
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/api/v1/analytics/services', (req, res) => {
            res.json({
                success: true,
                data: this.getServiceMetrics(),
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/api/v1/analytics/alerts', (req, res) => {
            const { severity, service } = req.query;
            let alerts = this.metrics.performanceAlerts;
            
            if (severity) {
                alerts = alerts.filter(alert => alert.severity === severity);
            }
            
            if (service) {
                alerts = alerts.filter(alert => alert.service === service);
            }
            
            res.json({
                success: true,
                data: alerts.slice(-50), // Last 50 alerts
                timestamp: new Date().toISOString()
            });
        });

        // Load balancer configuration endpoints
        this.app.get('/api/v1/config/load-balancers', (req, res) => {
            res.json({
                success: true,
                data: this.getLoadBalancerConfig(),
                timestamp: new Date().toISOString()
            });
        });

        this.app.post('/api/v1/config/load-balancers/:serviceName', (req, res) => {
            const { serviceName } = req.params;
            const { algorithm, instances } = req.body;
            
            try {
                this.updateLoadBalancerConfig(serviceName, { algorithm, instances });
                res.json({
                    success: true,
                    message: `Load balancer configuration updated for ${serviceName}`,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Comprehensive analytics dashboard
        this.app.get('/api/v1/analytics/dashboard', (req, res) => {
            res.json({
                success: true,
                data: this.getAnalyticsDashboard(),
                timestamp: new Date().toISOString()
            });
        });
    }

    // Setup routes
    setupRoutes() {
        // Authentication routes
        this.app.post('/api/v1/auth/login', this.handleLogin.bind(this));
        this.app.post('/api/v1/auth/refresh', this.handleRefresh.bind(this));
        this.app.post('/api/v1/auth/logout', this.handleLogout.bind(this));

        // Service routes with load balancing
        this.app.use('/api/v1/projects', this.authenticateToken.bind(this), this.createServiceProxy('project-manager', '/api/projects'));
        this.app.use('/api/v1/ai', this.authenticateToken.bind(this), this.createServiceProxy('ai-planner', '/api/ai'));
        this.app.use('/api/v1/workflows', this.authenticateToken.bind(this), this.createServiceProxy('workflow-orchestrator', '/api/workflows'));
        this.app.use('/api/v1/notifications', this.authenticateToken.bind(this), this.createServiceProxy('smart-notifications', '/api/notifications'));
        this.app.use('/api/v1/analytics', this.authenticateToken.bind(this), this.createServiceProxy('analytics-dashboard', '/api/analytics'));

        // Public routes
        this.app.use('/api/v1/public', this.createServiceProxy('project-manager', '/api/public'));

        // Admin routes
        this.app.use('/api/v1/admin', this.authenticateAdmin.bind(this), this.createServiceProxy('project-manager', '/api/admin'));

        // Error handling
        this.app.use(this.errorHandler.bind(this));
    }

    // Create service proxy with load balancing
    createServiceProxy(serviceName, pathRewrite) {
        return async (req, res, next) => {
            try {
                const loadBalancer = this.loadBalancers.get(serviceName);
                const circuitBreaker = this.circuitBreakers.get(serviceName);
                
                if (!loadBalancer || !circuitBreaker) {
                    return res.status(503).json({ error: 'Service unavailable' });
                }

                // Select instance using load balancing algorithm
                const instance = this.selectInstance(serviceName, req);
                
                if (!instance) {
                    return res.status(503).json({ error: 'No healthy instances available' });
                }

                // Create proxy middleware
                const proxy = createProxyMiddleware({
                    target: instance.url,
                    changeOrigin: true,
                    pathRewrite: { [`^/api/v1/${serviceName.split('-')[0]}`]: pathRewrite },
                    timeout: this.services[serviceName].timeout,
                    onError: (err, req, res) => {
                        this.logger.error(`Proxy error for ${serviceName}:`, err);
                        this.markInstanceUnhealthy(serviceName, instance);
                        res.status(503).json({ error: 'Service temporarily unavailable' });
                    },
                    onProxyReq: (proxyReq, req, res) => {
                        // Add request tracing headers
                        proxyReq.setHeader('X-Request-ID', req.id);
                        proxyReq.setHeader('X-Forwarded-For', req.ip);
                        proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
                    },
                    onProxyRes: (proxyRes, req, res) => {
                        // Add response headers
                        const responseTime = Date.now() - req.startTime;
                        proxyRes.headers['X-Response-Time'] = responseTime;
                        proxyRes.headers['X-Service'] = serviceName;
                        
                        // Update service metrics
                        this.updateServiceMetrics(serviceName, responseTime, proxyRes.statusCode >= 400);
                    }
                });

                // Execute through circuit breaker
                circuitBreaker.fire(instance, req, res, next, proxy);
            } catch (error) {
                this.logger.error(`Service proxy error for ${serviceName}:`, error);
                res.status(500).json({ error: 'Internal server error' });
            }
        };
    }

    // Select instance using load balancing algorithm
    selectInstance(serviceName, req) {
        const loadBalancer = this.loadBalancers.get(serviceName);
        if (!loadBalancer) return null;

        const healthyInstances = loadBalancer.instances.filter(instance => instance.healthy);
        if (healthyInstances.length === 0) return null;

        switch (loadBalancer.algorithm) {
            case 'round-robin':
                const instance = healthyInstances[loadBalancer.currentIndex % healthyInstances.length];
                loadBalancer.currentIndex = (loadBalancer.currentIndex + 1) % healthyInstances.length;
                return instance;

            case 'weighted-round-robin':
                return this.selectWeightedInstance(healthyInstances);

            case 'least-connections':
                return this.selectLeastConnectionsInstance(healthyInstances);

            case 'ip-hash':
                return this.selectIPHashInstance(healthyInstances, req);

            case 'least-response-time':
                return this.selectLeastResponseTimeInstance(healthyInstances);

            case 'adaptive':
                return this.selectAdaptiveInstance(healthyInstances, req);

            case 'geographic':
                return this.selectGeographicInstance(healthyInstances, req);

            default:
                return healthyInstances[0];
        }
    }

    // Select weighted instance
    selectWeightedInstance(instances) {
        const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const instance of instances) {
            random -= instance.weight;
            if (random <= 0) {
                return instance;
            }
        }
        
        return instances[0];
    }

    // Select least connections instance
    selectLeastConnectionsInstance(instances) {
        return instances.reduce((min, instance) => 
            (instance.connections || 0) < (min.connections || 0) ? instance : min
        );
    }

    // Select IP hash instance for sticky sessions
    selectIPHashInstance(instances, req) {
        const clientIP = req.ip || req.connection.remoteAddress;
        const hash = this.hashString(clientIP);
        const index = hash % instances.length;
        return instances[index];
    }

    // Select least response time instance
    selectLeastResponseTimeInstance(instances) {
        return instances.reduce((min, instance) => {
            const minResponseTime = instance.avgResponseTime || 0;
            const currentResponseTime = min.avgResponseTime || 0;
            return minResponseTime < currentResponseTime ? instance : min;
        });
    }

    // Select adaptive instance based on multiple factors
    selectAdaptiveInstance(instances, req) {
        const scores = instances.map(instance => {
            let score = 0;
            
            // Weight factor (higher weight = better score)
            score += instance.weight * 10;
            
            // Response time factor (lower response time = better score)
            const responseTime = instance.avgResponseTime || 1000;
            score += Math.max(0, 1000 - responseTime) / 10;
            
            // Connection count factor (fewer connections = better score)
            const connections = instance.connections || 0;
            score += Math.max(0, 100 - connections);
            
            // CPU usage factor (lower CPU = better score)
            const cpuUsage = instance.cpuUsage || 0;
            score += Math.max(0, 100 - (cpuUsage * 100));
            
            // Memory usage factor (lower memory = better score)
            const memoryUsage = instance.memoryUsage || 0;
            score += Math.max(0, 100 - (memoryUsage * 100));
            
            return { instance, score };
        });

        // Sort by score and select the best one
        scores.sort((a, b) => b.score - a.score);
        return scores[0].instance;
    }

    // Select geographic instance based on client location
    selectGeographicInstance(instances, req) {
        const clientIP = req.ip || req.connection.remoteAddress;
        const clientRegion = this.getClientRegion(clientIP);
        
        // Find instances in the same region first
        const regionalInstances = instances.filter(instance => 
            instance.region === clientRegion
        );
        
        if (regionalInstances.length > 0) {
            return this.selectWeightedInstance(regionalInstances);
        }
        
        // Fallback to weighted selection if no regional instances
        return this.selectWeightedInstance(instances);
    }

    // Hash string for consistent hashing
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    // Get client region based on IP (simplified implementation)
    getClientRegion(ip) {
        // In a real implementation, you would use a GeoIP service
        // For demo purposes, using simple IP range mapping
        const ipParts = ip.split('.');
        const firstOctet = parseInt(ipParts[0]);
        
        if (firstOctet >= 1 && firstOctet <= 126) return 'us-east';
        if (firstOctet >= 128 && firstOctet <= 191) return 'us-west';
        if (firstOctet >= 192 && firstOctet <= 223) return 'eu-west';
        return 'default';
    }

    // Make HTTP request
    async makeRequest(instance, req, res, next, proxy) {
        return new Promise((resolve, reject) => {
            proxy(req, res, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Start health checks for service
    startHealthChecks(serviceName) {
        setInterval(async () => {
            const loadBalancer = this.loadBalancers.get(serviceName);
            if (!loadBalancer) return;

            for (const instance of loadBalancer.instances) {
                try {
                    const response = await this.checkInstanceHealth(instance.url);
                    instance.healthy = response.status === 'healthy';
                    instance.lastCheck = new Date();
                } catch (error) {
                    instance.healthy = false;
                    instance.lastCheck = new Date();
                    this.logger.warn(`Health check failed for ${instance.url}:`, error.message);
                }
            }
        }, loadBalancer.healthCheckInterval);
    }

    // Check instance health
    async checkInstanceHealth(url) {
        return new Promise((resolve, reject) => {
            const request = http.get(`${url}/health`, { timeout: 5000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const health = JSON.parse(data);
                        resolve(health);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Health check timeout'));
            });
        });
    }

    // Mark instance as unhealthy
    markInstanceUnhealthy(serviceName, instance) {
        const loadBalancer = this.loadBalancers.get(serviceName);
        if (loadBalancer) {
            const targetInstance = loadBalancer.instances.find(i => i.url === instance.url);
            if (targetInstance) {
                targetInstance.healthy = false;
                this.logger.warn(`Marked instance as unhealthy: ${instance.url}`);
            }
        }
    }

    // Authentication middleware
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }
            req.user = user;
            next();
        });
    }

    // Admin authentication middleware
    authenticateAdmin(req, res, next) {
        this.authenticateToken(req, res, () => {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            next();
        });
    }

    // Handle login
    async handleLogin(req, res) {
        try {
            const { username, password } = req.body;

            // Validate input
            const schema = Joi.object({
                username: Joi.string().required(),
                password: Joi.string().required()
            });

            const { error } = schema.validate({ username, password });
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            // In a real application, validate against database
            // For demo purposes, using hardcoded credentials
            if (username === 'admin' && password === 'admin123') {
                const token = jwt.sign(
                    { 
                        id: 1, 
                        username: 'admin', 
                        role: 'admin' 
                    },
                    process.env.JWT_SECRET || 'default-secret',
                    { expiresIn: '1h' }
                );

                const refreshToken = jwt.sign(
                    { id: 1, username: 'admin' },
                    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
                    { expiresIn: '7d' }
                );

                res.json({
                    token,
                    refreshToken,
                    user: { id: 1, username: 'admin', role: 'admin' }
                });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (error) {
            this.logger.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Handle refresh token
    async handleRefresh(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token required' });
            }

            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret', (err, user) => {
                if (err) {
                    return res.status(403).json({ error: 'Invalid refresh token' });
                }

                const newToken = jwt.sign(
                    { id: user.id, username: user.username, role: 'admin' },
                    process.env.JWT_SECRET || 'default-secret',
                    { expiresIn: '1h' }
                );

                res.json({ token: newToken });
            });
        } catch (error) {
            this.logger.error('Refresh token error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Handle logout
    async handleLogout(req, res) {
        // In a real application, blacklist the token
        res.json({ message: 'Logged out successfully' });
    }

    // Error handler
    errorHandler(err, req, res, next) {
        this.logger.error('Unhandled error:', err);
        
        res.status(err.status || 500).json({
            error: err.message || 'Internal server error',
            requestId: req.id,
            timestamp: new Date().toISOString()
        });
    }

    // Get metrics
    getMetrics() {
        const avgResponseTime = this.metrics.responseTime.length > 0 
            ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
            : 0;

        return {
            requests: this.metrics.requests,
            errors: this.metrics.errors,
            activeConnections: this.metrics.activeConnections,
            averageResponseTime: Math.round(avgResponseTime),
            errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            serviceMetrics: this.getServiceMetrics(),
            performanceAlerts: this.metrics.performanceAlerts.slice(-10), // Last 10 alerts
            timestamp: new Date().toISOString()
        };
    }

    // Get service-specific metrics
    getServiceMetrics() {
        const serviceMetrics = {};
        
        for (const [serviceName, metrics] of this.metrics.serviceMetrics) {
            serviceMetrics[serviceName] = {
                requests: metrics.requests || 0,
                errors: metrics.errors || 0,
                averageResponseTime: metrics.averageResponseTime || 0,
                errorRate: metrics.errorRate || 0,
                lastUpdated: metrics.lastUpdated || new Date().toISOString()
            };
        }
        
        return serviceMetrics;
    }

    // Update service metrics
    updateServiceMetrics(serviceName, responseTime, isError = false) {
        if (!this.metrics.serviceMetrics.has(serviceName)) {
            this.metrics.serviceMetrics.set(serviceName, {
                requests: 0,
                errors: 0,
                responseTimes: [],
                averageResponseTime: 0,
                errorRate: 0,
                lastUpdated: new Date().toISOString()
            });
        }

        const metrics = this.metrics.serviceMetrics.get(serviceName);
        metrics.requests++;
        
        if (isError) {
            metrics.errors++;
        }
        
        metrics.responseTimes.push(responseTime);
        
        // Keep only last 1000 response times
        if (metrics.responseTimes.length > 1000) {
            metrics.responseTimes = metrics.responseTimes.slice(-1000);
        }
        
        // Calculate average response time
        metrics.averageResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
        
        // Calculate error rate
        metrics.errorRate = (metrics.errors / metrics.requests) * 100;
        
        metrics.lastUpdated = new Date().toISOString();
        
        // Check for performance alerts
        this.checkPerformanceAlerts(serviceName, metrics);
    }

    // Check for performance alerts
    checkPerformanceAlerts(serviceName, metrics) {
        const alerts = [];
        
        // High error rate alert
        if (metrics.errorRate > 10) {
            alerts.push({
                type: 'high_error_rate',
                service: serviceName,
                value: metrics.errorRate,
                threshold: 10,
                severity: 'warning',
                timestamp: new Date().toISOString()
            });
        }
        
        // High response time alert
        if (metrics.averageResponseTime > 5000) {
            alerts.push({
                type: 'high_response_time',
                service: serviceName,
                value: metrics.averageResponseTime,
                threshold: 5000,
                severity: 'warning',
                timestamp: new Date().toISOString()
            });
        }
        
        // Critical error rate alert
        if (metrics.errorRate > 50) {
            alerts.push({
                type: 'critical_error_rate',
                service: serviceName,
                value: metrics.errorRate,
                threshold: 50,
                severity: 'critical',
                timestamp: new Date().toISOString()
            });
        }
        
        // Add new alerts
        this.metrics.performanceAlerts.push(...alerts);
        
        // Keep only last 100 alerts
        if (this.metrics.performanceAlerts.length > 100) {
            this.metrics.performanceAlerts = this.metrics.performanceAlerts.slice(-100);
        }
        
        // Log critical alerts
        alerts.filter(alert => alert.severity === 'critical').forEach(alert => {
            this.logger.error('Critical performance alert:', alert);
        });
    }

    // Get load balancer analytics
    getLoadBalancerAnalytics() {
        const analytics = {};
        
        for (const [serviceName, loadBalancer] of this.loadBalancers) {
            const healthyInstances = loadBalancer.instances.filter(i => i.healthy);
            const totalWeight = healthyInstances.reduce((sum, i) => sum + i.weight, 0);
            
            analytics[serviceName] = {
                algorithm: loadBalancer.algorithm,
                totalInstances: loadBalancer.instances.length,
                healthyInstances: healthyInstances.length,
                totalWeight: totalWeight,
                distribution: healthyInstances.map(instance => ({
                    url: instance.url,
                    weight: instance.weight,
                    weightPercentage: totalWeight > 0 ? (instance.weight / totalWeight) * 100 : 0,
                    healthy: instance.healthy,
                    lastCheck: instance.lastCheck
                })),
                currentIndex: loadBalancer.currentIndex
            };
        }
        
        return analytics;
    }

    // Get circuit breaker analytics
    getCircuitBreakerAnalytics() {
        const analytics = {};
        
        for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
            const stats = circuitBreaker.stats;
            analytics[serviceName] = {
                state: circuitBreaker.state,
                failures: stats.failures,
                successes: stats.successes,
                timeouts: stats.timeouts,
                totalRequests: stats.failures + stats.successes,
                successRate: stats.failures + stats.successes > 0 
                    ? (stats.successes / (stats.failures + stats.successes)) * 100 
                    : 100,
                failureRate: stats.failures + stats.successes > 0 
                    ? (stats.failures / (stats.failures + stats.successes)) * 100 
                    : 0
            };
        }
        
        return analytics;
    }

    // Get load balancer configuration
    getLoadBalancerConfig() {
        const config = {};
        
        for (const [serviceName, loadBalancer] of this.loadBalancers) {
            config[serviceName] = {
                algorithm: loadBalancer.algorithm,
                instances: loadBalancer.instances.map(instance => ({
                    url: instance.url,
                    weight: instance.weight,
                    healthy: instance.healthy,
                    region: instance.region || 'default'
                })),
                healthCheckInterval: loadBalancer.healthCheckInterval
            };
        }
        
        return config;
    }

    // Update load balancer configuration
    updateLoadBalancerConfig(serviceName, config) {
        const loadBalancer = this.loadBalancers.get(serviceName);
        if (!loadBalancer) {
            throw new Error(`Service ${serviceName} not found`);
        }

        if (config.algorithm) {
            loadBalancer.algorithm = config.algorithm;
        }

        if (config.instances) {
            // Validate instances
            for (const instance of config.instances) {
                if (!instance.url) {
                    throw new Error('Instance URL is required');
                }
                if (typeof instance.weight !== 'number' || instance.weight < 0) {
                    throw new Error('Instance weight must be a non-negative number');
                }
            }
            
            loadBalancer.instances = config.instances.map(instance => ({
                ...instance,
                healthy: instance.healthy !== undefined ? instance.healthy : true,
                connections: instance.connections || 0,
                avgResponseTime: instance.avgResponseTime || 0,
                cpuUsage: instance.cpuUsage || 0,
                memoryUsage: instance.memoryUsage || 0,
                lastCheck: instance.lastCheck || new Date()
            }));
        }

        this.logger.info(`Load balancer configuration updated for ${serviceName}`, config);
    }

    // Get comprehensive analytics dashboard data
    getAnalyticsDashboard() {
        return {
            overview: this.getMetrics(),
            loadBalancers: this.getLoadBalancerAnalytics(),
            circuitBreakers: this.getCircuitBreakerAnalytics(),
            services: this.getServiceMetrics(),
            alerts: this.metrics.performanceAlerts.slice(-20),
            health: this.getServiceHealth(),
            timestamp: new Date().toISOString()
        };
    }

    // Get Prometheus metrics
    getPrometheusMetrics() {
        const metrics = this.getMetrics();
        
        return `# HELP api_gateway_requests_total Total number of requests
# TYPE api_gateway_requests_total counter
api_gateway_requests_total ${metrics.requests}

# HELP api_gateway_errors_total Total number of errors
# TYPE api_gateway_errors_total counter
api_gateway_errors_total ${metrics.errors}

# HELP api_gateway_active_connections Current number of active connections
# TYPE api_gateway_active_connections gauge
api_gateway_active_connections ${metrics.activeConnections}

# HELP api_gateway_average_response_time_ms Average response time in milliseconds
# TYPE api_gateway_average_response_time_ms gauge
api_gateway_average_response_time_ms ${metrics.averageResponseTime}

# HELP api_gateway_error_rate Error rate percentage
# TYPE api_gateway_error_rate gauge
api_gateway_error_rate ${metrics.errorRate}`;
    }

    // Get service health
    getServiceHealth() {
        const health = {};
        
        for (const [serviceName, loadBalancer] of this.loadBalancers) {
            const healthyCount = loadBalancer.instances.filter(i => i.healthy).length;
            const totalCount = loadBalancer.instances.length;
            
            health[serviceName] = {
                healthy: healthyCount > 0,
                healthyInstances: healthyCount,
                totalInstances: totalCount,
                instances: loadBalancer.instances.map(i => ({
                    url: i.url,
                    healthy: i.healthy,
                    weight: i.weight,
                    lastCheck: i.lastCheck
                }))
            };
        }
        
        return health;
    }

    // Get load balancer status
    getLoadBalancerStatus() {
        const status = {};
        
        for (const [serviceName, loadBalancer] of this.loadBalancers) {
            status[serviceName] = {
                algorithm: loadBalancer.algorithm,
                currentIndex: loadBalancer.currentIndex,
                instances: loadBalancer.instances.length,
                healthyInstances: loadBalancer.instances.filter(i => i.healthy).length
            };
        }
        
        return status;
    }

    // Get circuit breaker status
    getCircuitBreakerStatus() {
        const status = {};
        
        for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
            status[serviceName] = {
                state: circuitBreaker.state,
                failures: circuitBreaker.stats.failures,
                successes: circuitBreaker.stats.successes,
                timeouts: circuitBreaker.stats.timeouts
            };
        }
        
        return status;
    }

    // Check Redis health
    async checkRedisHealth() {
        if (!this.redisClient) {
            return { connected: false, error: 'Redis not configured' };
        }

        try {
            await this.redisClient.ping();
            return { connected: true };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    // Start server
    async start() {
        try {
            if (this.clusterMode && cluster.isMaster) {
                this.startCluster();
            } else {
                await this.startWorker();
            }
        } catch (error) {
            this.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    // Start cluster
    startCluster() {
        const numCPUs = os.cpus().length;
        this.logger.info(`Starting cluster with ${numCPUs} workers`);

        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            this.logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
            cluster.fork();
        });
    }

    // Start worker
    async startWorker() {
        const server = this.app.listen(this.port, () => {
            this.logger.info(`🚀 Enhanced API Gateway v2.9 running on port ${this.port}`);
            this.logger.info(`📊 Health check: http://localhost:${this.port}/health`);
            this.logger.info(`📈 Metrics: http://localhost:${this.port}/metrics`);
            this.logger.info(`🔧 Load balancers: ${this.loadBalancers.size} services configured`);
            this.logger.info(`⚡ Circuit breakers: ${this.circuitBreakers.size} services protected`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            this.logger.info('SIGTERM received, shutting down gracefully');
            server.close(() => {
                this.logger.info('Process terminated');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            this.logger.info('SIGINT received, shutting down gracefully');
            server.close(() => {
                this.logger.info('Process terminated');
                process.exit(0);
            });
        });
    }
}

// Start the enhanced API Gateway
const gateway = new EnhancedAPIGateway();
gateway.start().catch(error => {
    console.error('Failed to start Enhanced API Gateway:', error);
    process.exit(1);
});

module.exports = EnhancedAPIGateway;
