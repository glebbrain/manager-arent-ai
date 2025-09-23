const express = require('express');
const http = require('http');
const https = require('https');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const morgan = require('morgan');
const winston = require('winston');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cluster = require('cluster');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const WORKERS = process.env.WORKERS || os.cpus().length;

// Advanced Load Balancer Class
class AdvancedLoadBalancer {
    constructor() {
        this.strategies = {
            'round-robin': this.roundRobin.bind(this),
            'least-connections': this.leastConnections.bind(this),
            'weighted-round-robin': this.weightedRoundRobin.bind(this),
            'ip-hash': this.ipHash.bind(this),
            'random': this.random.bind(this),
            'least-response-time': this.leastResponseTime.bind(this)
        };
        this.connections = new Map();
        this.responseTimes = new Map();
        this.weights = new Map();
        this.currentIndex = 0;
    }

    // Round Robin Strategy
    roundRobin(servers) {
        if (servers.length === 0) return null;
        const server = servers[this.currentIndex % servers.length];
        this.currentIndex++;
        return server;
    }

    // Least Connections Strategy
    leastConnections(servers) {
        if (servers.length === 0) return null;
        return servers.reduce((min, server) => {
            const minConnections = this.connections.get(min.endpoint) || 0;
            const serverConnections = this.connections.get(server.endpoint) || 0;
            return serverConnections < minConnections ? server : min;
        });
    }

    // Weighted Round Robin Strategy
    weightedRoundRobin(servers) {
        if (servers.length === 0) return null;
        
        // Calculate total weight
        const totalWeight = servers.reduce((sum, server) => {
            const weight = this.weights.get(server.endpoint) || 1;
            return sum + weight;
        }, 0);

        // Find server based on weight
        let random = Math.random() * totalWeight;
        for (const server of servers) {
            const weight = this.weights.get(server.endpoint) || 1;
            random -= weight;
            if (random <= 0) {
                return server;
            }
        }
        return servers[0];
    }

    // IP Hash Strategy
    ipHash(servers, clientIP) {
        if (servers.length === 0) return null;
        const hash = crypto.createHash('md5').update(clientIP).digest('hex');
        const index = parseInt(hash.substring(0, 8), 16) % servers.length;
        return servers[index];
    }

    // Random Strategy
    random(servers) {
        if (servers.length === 0) return null;
        return servers[Math.floor(Math.random() * servers.length)];
    }

    // Least Response Time Strategy
    leastResponseTime(servers) {
        if (servers.length === 0) return null;
        return servers.reduce((min, server) => {
            const minTime = this.responseTimes.get(min.endpoint) || Infinity;
            const serverTime = this.responseTimes.get(server.endpoint) || Infinity;
            return serverTime < minTime ? server : min;
        });
    }

    // Select server using specified strategy
    selectServer(servers, strategy = 'round-robin', clientIP = null) {
        const strategyFn = this.strategies[strategy];
        if (!strategyFn) {
            console.warn(`Unknown load balancing strategy: ${strategy}, using round-robin`);
            return this.strategies['round-robin'](servers);
        }
        return strategyFn(servers, clientIP);
    }

    // Track connection
    trackConnection(endpoint, increment = 1) {
        const current = this.connections.get(endpoint) || 0;
        this.connections.set(endpoint, Math.max(0, current + increment));
    }

    // Track response time
    trackResponseTime(endpoint, responseTime) {
        this.responseTimes.set(endpoint, responseTime);
    }

    // Set server weight
    setWeight(endpoint, weight) {
        this.weights.set(endpoint, weight);
    }
}

// Advanced Router Class
class AdvancedRouter {
    constructor() {
        this.routes = new Map();
        this.middlewares = new Map();
        this.circuitBreakers = new Map();
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            backoffMultiplier: 2
        };
    }

    // Add route with advanced configuration
    addRoute(path, config) {
        const route = {
            path: path,
            methods: config.methods || ['GET'],
            services: config.services || [],
            loadBalancer: config.loadBalancer || 'round-robin',
            timeout: config.timeout || 30000,
            retries: config.retries || 3,
            circuitBreaker: config.circuitBreaker || false,
            middleware: config.middleware || [],
            rateLimit: config.rateLimit || null,
            cache: config.cache || false,
            cacheTTL: config.cacheTTL || 300
        };
        
        this.routes.set(path, route);
        console.log(`Route added: ${path} -> ${config.services.length} services`);
    }

    // Find matching route
    findRoute(path, method) {
        for (const [routePath, route] of this.routes) {
            if (this.matchPath(routePath, path) && route.methods.includes(method)) {
                return route;
            }
        }
        return null;
    }

    // Match path with wildcards and parameters
    matchPath(routePath, requestPath) {
        if (routePath === requestPath) return true;
        
        // Handle wildcards
        if (routePath.includes('*')) {
            const regex = new RegExp('^' + routePath.replace(/\*/g, '.*') + '$');
            return regex.test(requestPath);
        }
        
        // Handle parameters
        if (routePath.includes(':')) {
            const routeParts = routePath.split('/');
            const pathParts = requestPath.split('/');
            
            if (routeParts.length !== pathParts.length) return false;
            
            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) continue;
                if (routeParts[i] !== pathParts[i]) return false;
            }
            return true;
        }
        
        return false;
    }

    // Circuit breaker implementation
    checkCircuitBreaker(serviceEndpoint) {
        const breaker = this.circuitBreakers.get(serviceEndpoint);
        if (!breaker) return true;
        
        const now = Date.now();
        if (breaker.state === 'open' && now - breaker.lastFailureTime < breaker.timeout) {
            return false; // Circuit is open
        }
        
        if (breaker.state === 'half-open') {
            return true; // Allow one request to test
        }
        
        return true; // Circuit is closed
    }

    // Update circuit breaker state
    updateCircuitBreaker(serviceEndpoint, success) {
        const breaker = this.circuitBreakers.get(serviceEndpoint) || {
            state: 'closed',
            failureCount: 0,
            lastFailureTime: 0,
            timeout: 60000
        };
        
        if (success) {
            breaker.failureCount = 0;
            breaker.state = 'closed';
        } else {
            breaker.failureCount++;
            breaker.lastFailureTime = Date.now();
            
            if (breaker.failureCount >= 5) {
                breaker.state = 'open';
            }
        }
        
        this.circuitBreakers.set(serviceEndpoint, breaker);
    }
}

// Enhanced API Gateway Class
class EnhancedAPIGateway {
    constructor() {
        this.app = express();
        this.server = null;
        this.loadBalancer = new AdvancedLoadBalancer();
        this.router = new AdvancedRouter();
        this.redis = null;
        this.logger = this.initializeLogger();
        this.metrics = this.initializeMetrics();
        this.services = new Map();
        this.healthChecks = new Map();
        this.cache = new Map();
        
        this.initializeMiddleware();
        this.initializeRedis();
        this.setupRoutes();
        this.setupHealthChecks();
        this.setupMetrics();
    }

    initializeLogger() {
        return winston.createLogger({
            level: 'info',
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
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' })
            ]
        });
    }

    initializeMetrics() {
        return {
            requests: 0,
            responses: 0,
            errors: 0,
            responseTime: 0,
            activeConnections: 0,
            services: new Map()
        };
    }

    async initializeRedis() {
        try {
            this.redis = redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || null
            });
            
            await this.redis.connect();
            this.logger.info('Redis connected successfully');
        } catch (error) {
            this.logger.warn('Redis connection failed, using in-memory cache');
            this.redis = null;
        }
    }

    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet());
        
        // CORS middleware
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
            credentials: true
        }));
        
        // Compression middleware
        this.app.use(compression());
        
        // Request logging
        this.app.use(morgan('combined', {
            stream: { write: message => this.logger.info(message.trim()) }
        }));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);
        
        // Slow down
        const speedLimiter = slowDown({
            windowMs: 15 * 60 * 1000, // 15 minutes
            delayAfter: 100, // allow 100 requests per 15 minutes, then...
            delayMs: 500 // begin adding 500ms of delay per request above 100
        });
        this.app.use('/api/', speedLimiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '2.9.0',
                services: Array.from(this.services.keys())
            });
        });

        // Metrics endpoint
        this.app.get('/metrics', (req, res) => {
            res.json({
                requests: this.metrics.requests,
                responses: this.metrics.responses,
                errors: this.metrics.errors,
                averageResponseTime: this.metrics.responseTime / Math.max(this.metrics.responses, 1),
                activeConnections: this.metrics.activeConnections,
                services: Object.fromEntries(this.metrics.services)
            });
        });

        // Service discovery endpoint
        this.app.get('/services', (req, res) => {
            const services = Array.from(this.services.entries()).map(([name, config]) => ({
                name,
                endpoint: config.endpoint,
                health: config.health,
                status: this.healthChecks.get(name)?.status || 'unknown',
                lastCheck: this.healthChecks.get(name)?.lastCheck || null
            }));
            res.json(services);
        });

        // Main proxy route
        this.app.all('/api/*', this.proxyRequest.bind(this));
    }

    setupHealthChecks() {
        // Health check interval
        setInterval(() => {
            this.performHealthChecks();
        }, 30000); // Check every 30 seconds
    }

    async performHealthChecks() {
        for (const [serviceName, config] of this.services) {
            try {
                const response = await fetch(`${config.endpoint}${config.health}`, {
                    method: 'GET',
                    timeout: 5000
                });
                
                this.healthChecks.set(serviceName, {
                    status: response.ok ? 'healthy' : 'unhealthy',
                    lastCheck: new Date().toISOString(),
                    responseTime: Date.now()
                });
            } catch (error) {
                this.healthChecks.set(serviceName, {
                    status: 'unhealthy',
                    lastCheck: new Date().toISOString(),
                    error: error.message
                });
            }
        }
    }

    setupMetrics() {
        // Metrics collection interval
        setInterval(() => {
            this.collectMetrics();
        }, 60000); // Collect every minute
    }

    async collectMetrics() {
        // Collect system metrics
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        this.metrics.memoryUsage = memUsage;
        this.metrics.cpuUsage = cpuUsage;
        
        // Store in Redis if available
        if (this.redis) {
            try {
                await this.redis.setex('gateway:metrics', 300, JSON.stringify(this.metrics));
            } catch (error) {
                this.logger.error('Failed to store metrics in Redis:', error);
            }
        }
    }

    // Register service
    registerService(name, config) {
        this.services.set(name, config);
        this.logger.info(`Service registered: ${name} -> ${config.endpoint}`);
    }

    // Add route
    addRoute(path, config) {
        this.router.addRoute(path, config);
    }

    // Main proxy function
    async proxyRequest(req, res) {
        const startTime = Date.now();
        this.metrics.requests++;
        this.metrics.activeConnections++;

        try {
            // Find matching route
            const route = this.router.findRoute(req.path, req.method);
            if (!route) {
                return res.status(404).json({ error: 'Route not found' });
            }

            // Check circuit breakers
            const healthyServices = route.services.filter(service => 
                this.router.checkCircuitBreaker(service.endpoint)
            );

            if (healthyServices.length === 0) {
                return res.status(503).json({ error: 'All services are unavailable' });
            }

            // Select server using load balancer
            const selectedService = this.loadBalancer.selectServer(
                healthyServices,
                route.loadBalancer,
                req.ip
            );

            if (!selectedService) {
                return res.status(503).json({ error: 'No healthy services available' });
            }

            // Track connection
            this.loadBalancer.trackConnection(selectedService.endpoint, 1);

            // Make request with retries
            const response = await this.makeRequestWithRetries(
                selectedService,
                req,
                route.retries
            );

            // Track response time
            const responseTime = Date.now() - startTime;
            this.loadBalancer.trackResponseTime(selectedService.endpoint, responseTime);

            // Update circuit breaker
            this.router.updateCircuitBreaker(selectedService.endpoint, true);

            // Update metrics
            this.metrics.responses++;
            this.metrics.responseTime += responseTime;
            this.metrics.activeConnections--;

            // Send response
            res.status(response.status).json(response.data);

        } catch (error) {
            this.logger.error('Proxy request failed:', error);
            this.metrics.errors++;
            this.metrics.activeConnections--;

            // Update circuit breaker
            if (req.selectedService) {
                this.router.updateCircuitBreaker(req.selectedService.endpoint, false);
            }

            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Make request with retries
    async makeRequestWithRetries(service, req, maxRetries) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.makeRequest(service, req);
                return response;
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = this.router.retryConfig.retryDelay * 
                        Math.pow(this.router.retryConfig.backoffMultiplier, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    // Make single request
    async makeRequest(service, req) {
        const url = `${service.endpoint}${req.path}`;
        const options = {
            method: req.method,
            headers: {
                ...req.headers,
                'x-forwarded-for': req.ip,
                'x-forwarded-proto': req.protocol,
                'x-forwarded-host': req.get('host')
            },
            timeout: 30000
        };

        if (req.body && Object.keys(req.body).length > 0) {
            options.body = JSON.stringify(req.body);
            options.headers['content-type'] = 'application/json';
        }

        const response = await fetch(url, options);
        const data = await response.json();

        return {
            status: response.status,
            data: data
        };
    }

    // Start server
    start(port = PORT) {
        this.server = this.app.listen(port, () => {
            this.logger.info(`Enhanced API Gateway v2.9 started on port ${port}`);
            this.logger.info(`Workers: ${WORKERS}`);
            this.logger.info(`Load balancing strategies: ${Object.keys(this.loadBalancer.strategies).join(', ')}`);
        });
    }

    // Stop server
    stop() {
        if (this.server) {
            this.server.close();
            this.logger.info('Enhanced API Gateway stopped');
        }
    }
}

// Cluster setup
if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    
    // Fork workers
    for (let i = 0; i < WORKERS; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork(); // Restart worker
    });
} else {
    // Worker process
    const gateway = new EnhancedAPIGateway();
    
    // Register default services
    gateway.registerService('project-manager', {
        endpoint: 'http://localhost:3001',
        health: '/health',
        weight: 1
    });
    
    gateway.registerService('ai-planner', {
        endpoint: 'http://localhost:3002',
        health: '/health',
        weight: 1
    });
    
    gateway.registerService('analytics-dashboard', {
        endpoint: 'http://localhost:3001',
        health: '/api/health',
        weight: 1
    });
    
    // Add routes
    gateway.addRoute('/api/projects/*', {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        services: [
            { endpoint: 'http://localhost:3001', weight: 1 }
        ],
        loadBalancer: 'round-robin',
        timeout: 30000,
        retries: 3,
        circuitBreaker: true
    });
    
    gateway.addRoute('/api/tasks/*', {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        services: [
            { endpoint: 'http://localhost:3002', weight: 1 }
        ],
        loadBalancer: 'least-connections',
        timeout: 30000,
        retries: 3,
        circuitBreaker: true
    });
    
    gateway.addRoute('/api/analytics/*', {
        methods: ['GET', 'POST'],
        services: [
            { endpoint: 'http://localhost:3001', weight: 1 }
        ],
        loadBalancer: 'round-robin',
        timeout: 30000,
        retries: 2,
        circuitBreaker: true
    });
    
    // Start gateway
    gateway.start();
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log(`Worker ${process.pid} received SIGTERM`);
        gateway.stop();
        process.exit(0);
    });
    
    process.on('SIGINT', () => {
        console.log(`Worker ${process.pid} received SIGINT`);
        gateway.stop();
        process.exit(0);
    });
}

module.exports = EnhancedAPIGateway;
