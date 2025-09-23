const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cluster = require('cluster');
const os = require('os');
const EventEmitter = require('events');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;
const WORKERS = process.env.WORKERS || os.cpus().length;

// Enhanced Service Mesh Orchestrator Class
class EnhancedServiceMeshOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.server = null;
        this.wss = null;
        this.services = new Map();
        this.meshConfig = new Map();
        this.performanceMetrics = new Map();
        this.circuitBreakers = new Map();
        this.loadBalancers = new Map();
        this.redis = null;
        this.logger = this.initializeLogger();
        this.aiEngine = new AIOrchestrationEngine();
        
        this.initializeMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.initializeRedis();
        this.initializeMeshMonitoring();
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
                new winston.transports.File({ filename: 'logs/orchestrator-error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/orchestrator-combined.log' })
            ]
        });
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
            this.logger.warn('Redis connection failed, using in-memory storage');
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
            message: 'Too many requests from this IP, please try again later.'
        });
        this.app.use('/api/', limiter);
        
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
                services: Array.from(this.services.keys()),
                meshStatus: this.getMeshStatus()
            });
        });

        // Service discovery endpoint
        this.app.get('/api/services', (req, res) => {
            const services = Array.from(this.services.entries()).map(([name, config]) => ({
                name,
                endpoint: config.endpoint,
                health: config.health,
                status: this.getServiceStatus(name),
                lastCheck: this.performanceMetrics.get(name)?.lastCheck || null,
                metrics: this.performanceMetrics.get(name) || {}
            }));
            res.json(services);
        });

        // Service registration endpoint
        this.app.post('/api/services/register', (req, res) => {
            try {
                const { name, endpoint, health, config } = req.body;
                this.registerService(name, endpoint, health, config);
                res.json({ message: 'Service registered successfully', service: name });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Service unregistration endpoint
        this.app.delete('/api/services/:name', (req, res) => {
            try {
                const { name } = req.params;
                this.unregisterService(name);
                res.json({ message: 'Service unregistered successfully', service: name });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Mesh configuration endpoint
        this.app.get('/api/mesh/config', (req, res) => {
            res.json(Object.fromEntries(this.meshConfig));
        });

        this.app.post('/api/mesh/config', (req, res) => {
            try {
                const { key, value } = req.body;
                this.updateMeshConfig(key, value);
                res.json({ message: 'Mesh configuration updated successfully' });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Performance metrics endpoint
        this.app.get('/api/metrics', (req, res) => {
            res.json({
                services: Object.fromEntries(this.performanceMetrics),
                mesh: this.getMeshMetrics(),
                timestamp: new Date().toISOString()
            });
        });

        // AI orchestration endpoint
        this.app.post('/api/orchestrate', async (req, res) => {
            try {
                const { workflow, context } = req.body;
                const result = await this.aiEngine.orchestrateWorkflow(workflow, context);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Service scaling endpoint
        this.app.post('/api/services/:name/scale', async (req, res) => {
            try {
                const { name } = req.params;
                const { replicas } = req.body;
                await this.scaleService(name, replicas);
                res.json({ message: `Service ${name} scaled to ${replicas} replicas` });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Circuit breaker management
        this.app.get('/api/circuit-breakers', (req, res) => {
            res.json(Object.fromEntries(this.circuitBreakers));
        });

        this.app.post('/api/circuit-breakers/:service/reset', (req, res) => {
            try {
                const { service } = req.params;
                this.resetCircuitBreaker(service);
                res.json({ message: `Circuit breaker reset for service ${service}` });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    }

    setupWebSocket() {
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            this.logger.info('WebSocket client connected');
            
            // Send initial mesh status
            ws.send(JSON.stringify({
                type: 'mesh_status',
                data: this.getMeshStatus()
            }));

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    this.logger.error('WebSocket message error:', error);
                }
            });

            ws.on('close', () => {
                this.logger.info('WebSocket client disconnected');
            });
        });
    }

    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe_metrics':
                // Send periodic metrics updates
                const interval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'metrics_update',
                            data: this.getMeshMetrics()
                        }));
                    } else {
                        clearInterval(interval);
                    }
                }, 5000);
                break;
            case 'get_service_status':
                ws.send(JSON.stringify({
                    type: 'service_status',
                    data: this.getServiceStatus(data.service)
                }));
                break;
        }
    }

    initializeMeshMonitoring() {
        // Health check interval
        setInterval(() => {
            this.performHealthChecks();
        }, 30000); // Check every 30 seconds

        // Metrics collection interval
        setInterval(() => {
            this.collectMetrics();
        }, 60000); // Collect every minute

        // Circuit breaker monitoring
        setInterval(() => {
            this.monitorCircuitBreakers();
        }, 10000); // Check every 10 seconds
    }

    async performHealthChecks() {
        for (const [serviceName, config] of this.services) {
            try {
                const startTime = Date.now();
                const response = await fetch(`${config.endpoint}${config.health}`, {
                    method: 'GET',
                    timeout: 5000
                });
                const responseTime = Date.now() - startTime;
                
                const isHealthy = response.ok;
                this.updateServiceMetrics(serviceName, {
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    lastCheck: new Date().toISOString(),
                    responseTime: responseTime,
                    success: isHealthy
                });

                // Update circuit breaker
                this.updateCircuitBreaker(serviceName, isHealthy);

            } catch (error) {
                this.updateServiceMetrics(serviceName, {
                    status: 'unhealthy',
                    lastCheck: new Date().toISOString(),
                    error: error.message,
                    success: false
                });
                this.updateCircuitBreaker(serviceName, false);
            }
        }
    }

    async collectMetrics() {
        const meshMetrics = {
            totalServices: this.services.size,
            healthyServices: 0,
            unhealthyServices: 0,
            totalRequests: 0,
            totalErrors: 0,
            averageResponseTime: 0,
            circuitBreakersOpen: 0
        };

        let totalResponseTime = 0;
        let responseCount = 0;

        for (const [serviceName, metrics] of this.performanceMetrics) {
            if (metrics.status === 'healthy') {
                meshMetrics.healthyServices++;
            } else {
                meshMetrics.unhealthyServices++;
            }

            meshMetrics.totalRequests += metrics.requests || 0;
            meshMetrics.totalErrors += metrics.errors || 0;
            
            if (metrics.responseTime) {
                totalResponseTime += metrics.responseTime;
                responseCount++;
            }

            if (this.circuitBreakers.get(serviceName)?.state === 'open') {
                meshMetrics.circuitBreakersOpen++;
            }
        }

        if (responseCount > 0) {
            meshMetrics.averageResponseTime = totalResponseTime / responseCount;
        }

        // Store in Redis if available
        if (this.redis) {
            try {
                await this.redis.setex('mesh:metrics', 300, JSON.stringify(meshMetrics));
            } catch (error) {
                this.logger.error('Failed to store metrics in Redis:', error);
            }
        }

        // Broadcast to WebSocket clients
        this.broadcastMetrics(meshMetrics);
    }

    broadcastMetrics(metrics) {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'metrics_update',
                        data: metrics
                    }));
                }
            });
        }
    }

    // Service Management
    registerService(name, endpoint, health, config = {}) {
        this.services.set(name, {
            endpoint,
            health,
            config,
            registeredAt: new Date().toISOString()
        });

        // Initialize performance metrics
        this.performanceMetrics.set(name, {
            requests: 0,
            errors: 0,
            responseTime: 0,
            status: 'unknown',
            lastCheck: null
        });

        // Initialize circuit breaker
        this.circuitBreakers.set(name, {
            state: 'closed',
            failureCount: 0,
            lastFailureTime: 0,
            timeout: 60000
        });

        this.logger.info(`Service registered: ${name} -> ${endpoint}`);
        this.emit('service_registered', { name, endpoint });
    }

    unregisterService(name) {
        this.services.delete(name);
        this.performanceMetrics.delete(name);
        this.circuitBreakers.delete(name);
        this.logger.info(`Service unregistered: ${name}`);
        this.emit('service_unregistered', { name });
    }

    getServiceStatus(name) {
        const metrics = this.performanceMetrics.get(name);
        return metrics ? metrics.status : 'unknown';
    }

    updateServiceMetrics(name, metrics) {
        const current = this.performanceMetrics.get(name) || {};
        this.performanceMetrics.set(name, { ...current, ...metrics });
    }

    // Circuit Breaker Management
    updateCircuitBreaker(serviceName, success) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker) return;

        if (success) {
            breaker.failureCount = 0;
            breaker.state = 'closed';
        } else {
            breaker.failureCount++;
            breaker.lastFailureTime = Date.now();
            
            if (breaker.failureCount >= 5) {
                breaker.state = 'open';
                this.logger.warn(`Circuit breaker opened for service: ${serviceName}`);
            }
        }

        this.circuitBreakers.set(serviceName, breaker);
    }

    resetCircuitBreaker(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (breaker) {
            breaker.state = 'closed';
            breaker.failureCount = 0;
            this.circuitBreakers.set(serviceName, breaker);
            this.logger.info(`Circuit breaker reset for service: ${serviceName}`);
        }
    }

    monitorCircuitBreakers() {
        const now = Date.now();
        for (const [serviceName, breaker] of this.circuitBreakers) {
            if (breaker.state === 'open' && now - breaker.lastFailureTime > breaker.timeout) {
                breaker.state = 'half-open';
                this.circuitBreakers.set(serviceName, breaker);
                this.logger.info(`Circuit breaker half-open for service: ${serviceName}`);
            }
        }
    }

    // Mesh Configuration
    updateMeshConfig(key, value) {
        this.meshConfig.set(key, value);
        this.logger.info(`Mesh configuration updated: ${key} = ${value}`);
    }

    getMeshStatus() {
        return {
            totalServices: this.services.size,
            healthyServices: Array.from(this.performanceMetrics.values())
                .filter(m => m.status === 'healthy').length,
            circuitBreakersOpen: Array.from(this.circuitBreakers.values())
                .filter(b => b.state === 'open').length,
            lastUpdate: new Date().toISOString()
        };
    }

    getMeshMetrics() {
        return {
            services: Object.fromEntries(this.performanceMetrics),
            circuitBreakers: Object.fromEntries(this.circuitBreakers),
            meshConfig: Object.fromEntries(this.meshConfig),
            timestamp: new Date().toISOString()
        };
    }

    // Service Scaling
    async scaleService(name, replicas) {
        // This would integrate with Kubernetes or Docker Swarm
        this.logger.info(`Scaling service ${name} to ${replicas} replicas`);
        // Implementation would depend on the orchestration platform
    }

    // Start orchestrator
    start(port = PORT) {
        this.server = server.listen(port, () => {
            this.logger.info(`Enhanced Service Mesh Orchestrator v2.9 started on port ${port}`);
            this.logger.info(`Workers: ${WORKERS}`);
        });
    }

    // Stop orchestrator
    stop() {
        if (this.server) {
            this.server.close();
            this.logger.info('Enhanced Service Mesh Orchestrator stopped');
        }
    }
}

// AI Orchestration Engine
class AIOrchestrationEngine {
    constructor() {
        this.workflows = new Map();
        this.aiModels = new Map();
    }

    async orchestrateWorkflow(workflow, context) {
        try {
            // AI-powered workflow orchestration
            const result = await this.executeWorkflow(workflow, context);
            return {
                success: true,
                result,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async executeWorkflow(workflow, context) {
        // Implementation of AI-powered workflow execution
        // This would integrate with AI models for intelligent orchestration
        return { workflow, context, status: 'completed' };
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
    const orchestrator = new EnhancedServiceMeshOrchestrator();
    
    // Register default services
    orchestrator.registerService('api-gateway', 'http://localhost:3000', '/health');
    orchestrator.registerService('project-manager', 'http://localhost:3001', '/health');
    orchestrator.registerService('ai-planner', 'http://localhost:3002', '/health');
    orchestrator.registerService('analytics-dashboard', 'http://localhost:3001', '/api/health');
    
    // Start orchestrator
    orchestrator.start();
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log(`Worker ${process.pid} received SIGTERM`);
        orchestrator.stop();
        process.exit(0);
    });
    
    process.on('SIGINT', () => {
        console.log(`Worker ${process.pid} received SIGINT`);
        orchestrator.stop();
        process.exit(0);
    });
}

module.exports = EnhancedServiceMeshOrchestrator;
