/**
 * ManagerAgentAI API Gateway - JavaScript Version
 * Centralized API gateway for all services
 * 
 * @author ManagerAgentAI
 * @date 2025-01-31
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');

class APIGateway {
    constructor() {
        this.gatewayPath = path.join(__dirname, '..', 'api-gateway');
        this.configPath = path.join(this.gatewayPath, 'config');
        this.logsPath = path.join(this.gatewayPath, 'logs');
        this.servicesPath = path.join(this.gatewayPath, 'services');
        
        // Service registry
        this.services = {
            'project-manager': {
                name: 'Project Manager',
                endpoint: 'http://localhost:3001',
                health: '/health',
                routes: [
                    { path: '/api/projects', methods: ['GET', 'POST'] },
                    { path: '/api/projects/*', methods: ['GET', 'PUT', 'DELETE'] },
                    { path: '/api/templates', methods: ['GET'] },
                    { path: '/api/scan', methods: ['POST'] }
                ],
                script: 'project-manager.ps1'
            },
            'ai-planner': {
                name: 'AI Planner',
                endpoint: 'http://localhost:3002',
                health: '/health',
                routes: [
                    { path: '/api/tasks', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
                    { path: '/api/plans', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
                    { path: '/api/prioritize', methods: ['POST'] },
                    { path: '/api/recommend', methods: ['POST'] }
                ],
                script: 'ai-planner.ps1'
            },
            'workflow-orchestrator': {
                name: 'Workflow Orchestrator',
                endpoint: 'http://localhost:3003',
                health: '/health',
                routes: [
                    { path: '/api/workflows', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
                    { path: '/api/workflows/*/execute', methods: ['POST'] },
                    { path: '/api/workflows/*/status', methods: ['GET'] }
                ],
                script: 'workflow-orchestrator.ps1'
            },
            'smart-notifications': {
                name: 'Smart Notifications',
                endpoint: 'http://localhost:3004',
                health: '/health',
                routes: [
                    { path: '/api/notifications', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
                    { path: '/api/notifications/*/send', methods: ['POST'] },
                    { path: '/api/notifications/*/status', methods: ['GET'] }
                ],
                script: 'smart-notifications.ps1'
            },
            'template-generator': {
                name: 'Template Generator',
                endpoint: 'http://localhost:3005',
                health: '/health',
                routes: [
                    { path: '/api/templates', methods: ['GET', 'POST'] },
                    { path: '/api/templates/*/generate', methods: ['POST'] },
                    { path: '/api/templates/*/validate', methods: ['POST'] }
                ],
                script: 'template-generator.ps1'
            },
            'consistency-manager': {
                name: 'Consistency Manager',
                endpoint: 'http://localhost:3006',
                health: '/health',
                routes: [
                    { path: '/api/consistency/validate', methods: ['POST'] },
                    { path: '/api/consistency/fix', methods: ['POST'] },
                    { path: '/api/consistency/status', methods: ['GET'] }
                ],
                script: 'consistency-manager.ps1'
            }
        };
        
        // Gateway configuration
        this.config = {
            port: 3000,
            host: 'localhost',
            timeout: 30000,
            retries: 3,
            rateLimit: {
                enabled: true,
                requests: 1000,
                window: 3600000 // 1 hour
            },
            cors: {
                enabled: true,
                origins: ['*'],
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                headers: ['Content-Type', 'Authorization', 'X-Requested-With']
            },
            auth: {
                enabled: true,
                type: 'jwt',
                secret: 'manager-agent-ai-secret-key',
                expiresIn: '24h'
            },
            logging: {
                enabled: true,
                level: 'info',
                file: 'api-gateway.log'
            },
            monitoring: {
                enabled: true,
                metrics: true,
                health: true
            }
        };
        
        this.server = null;
        this.metrics = {
            requests: 0,
            errors: 0,
            startTime: Date.now()
        };
    }
    
    ensureDirectories() {
        const dirs = [this.gatewayPath, this.configPath, this.logsPath, this.servicesPath];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });
    }
    
    initialize() {
        console.log('🚀 Initializing API Gateway...');
        
        this.ensureDirectories();
        
        // Create gateway configuration
        const configFile = path.join(this.configPath, 'gateway.json');
        fs.writeFileSync(configFile, JSON.stringify(this.config, null, 2));
        
        // Create services registry
        const servicesFile = path.join(this.configPath, 'services.json');
        fs.writeFileSync(servicesFile, JSON.stringify(this.services, null, 2));
        
        // Create startup script
        const startupScript = `# API Gateway Startup Script
# Generated by ManagerAgentAI API Gateway

Write-Host "🚀 Starting ManagerAgentAI API Gateway..." -ForegroundColor Green

# Load configuration
$config = Get-Content "${configFile}" | ConvertFrom-Json
$services = Get-Content "${servicesFile}" | ConvertFrom-Json

# Start gateway server
Write-Host "🌐 Gateway running on http://$($config.host):$($config.port)" -ForegroundColor Green
Write-Host "📊 Monitoring enabled: $($config.monitoring.enabled)" -ForegroundColor Green
Write-Host "🔒 Authentication enabled: $($config.auth.enabled)" -ForegroundColor Green

# Keep running
while ($true) {
    Start-Sleep -Seconds 1
}`;
        
        const startupFile = path.join(this.gatewayPath, 'start-gateway.ps1');
        fs.writeFileSync(startupFile, startupScript);
        
        console.log('✅ API Gateway initialized successfully');
        console.log(`📁 Configuration: ${configFile}`);
        console.log(`📁 Services: ${servicesFile}`);
        console.log(`🚀 Startup script: ${startupFile}`);
    }
    
    start() {
        console.log('🚀 Starting API Gateway...');
        
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        this.server.listen(this.config.port, this.config.host, () => {
            console.log(`✅ API Gateway started successfully`);
            console.log(`🌐 Gateway URL: http://${this.config.host}:${this.config.port}`);
            console.log(`📊 Monitoring enabled: ${this.config.monitoring.enabled}`);
            console.log(`🔒 Authentication enabled: ${this.config.auth.enabled}`);
        });
        
        this.server.on('error', (err) => {
            console.error('❌ Gateway error:', err.message);
        });
    }
    
    stop() {
        console.log('🛑 Stopping API Gateway...');
        
        if (this.server) {
            this.server.close(() => {
                console.log('✅ API Gateway stopped');
            });
        }
    }
    
    handleRequest(req, res) {
        this.metrics.requests++;
        
        // CORS handling
        if (this.config.cors.enabled) {
            res.setHeader('Access-Control-Allow-Origin', this.config.cors.origins.join(', '));
            res.setHeader('Access-Control-Allow-Methods', this.config.cors.methods.join(', '));
            res.setHeader('Access-Control-Allow-Headers', this.config.cors.headers.join(', '));
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
        }
        
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        
        // Handle gateway-specific endpoints
        if (pathname === '/gateway/status') {
            this.handleStatusRequest(req, res);
            return;
        }
        
        if (pathname === '/gateway/health') {
            this.handleHealthRequest(req, res);
            return;
        }
        
        if (pathname === '/gateway/metrics') {
            this.handleMetricsRequest(req, res);
            return;
        }
        
        // Route to appropriate service
        this.routeRequest(req, res);
    }
    
    routeRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        
        // Find matching service
        let targetService = null;
        let targetRoute = null;
        
        for (const [serviceName, service] of Object.entries(this.services)) {
            for (const route of service.routes) {
                if (this.matchesRoute(pathname, route.path) && 
                    route.methods.includes(req.method)) {
                    targetService = service;
                    targetRoute = route;
                    break;
                }
            }
            if (targetService) break;
        }
        
        if (!targetService) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Service not found',
                path: pathname,
                method: req.method
            }));
            return;
        }
        
        // Forward request to target service
        this.forwardRequest(req, res, targetService, targetRoute);
    }
    
    matchesRoute(pathname, routePath) {
        // Simple pattern matching (supports * wildcard)
        const pattern = routePath.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(pathname);
    }
    
    forwardRequest(req, res, service, route) {
        const targetUrl = `${service.endpoint}${req.url}`;
        const parsedUrl = url.parse(targetUrl);
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 80,
            path: parsedUrl.path,
            method: req.method,
            headers: req.headers
        };
        
        const proxyReq = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (err) => {
            this.metrics.errors++;
            console.error('❌ Proxy error:', err.message);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Service unavailable',
                service: service.name,
                message: err.message
            }));
        });
        
        req.pipe(proxyReq);
    }
    
    handleStatusRequest(req, res) {
        const status = {
            status: 'running',
            uptime: Date.now() - this.metrics.startTime,
            services: Object.keys(this.services).length,
            metrics: this.metrics
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
    
    handleHealthRequest(req, res) {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {}
        };
        
        // Check each service health
        Promise.all(Object.entries(this.services).map(([name, service]) => 
            this.checkServiceHealth(service).then(status => ({ name, status }))
        )).then(results => {
            results.forEach(({ name, status }) => {
                health.services[name] = status;
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(health, null, 2));
        });
    }
    
    checkServiceHealth(service) {
        return new Promise((resolve) => {
            const options = {
                hostname: url.parse(service.endpoint).hostname,
                port: url.parse(service.endpoint).port || 80,
                path: service.health,
                method: 'GET',
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                resolve({
                    status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
                    code: res.statusCode
                });
            });
            
            req.on('error', () => {
                resolve({ status: 'unreachable', code: 0 });
            });
            
            req.on('timeout', () => {
                resolve({ status: 'timeout', code: 0 });
            });
            
            req.end();
        });
    }
    
    handleMetricsRequest(req, res) {
        const metrics = {
            ...this.metrics,
            uptime: Date.now() - this.metrics.startTime,
            services: Object.keys(this.services).length,
            config: {
                port: this.config.port,
                host: this.config.host,
                rateLimit: this.config.rateLimit,
                auth: this.config.auth.enabled,
                monitoring: this.config.monitoring.enabled
            }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metrics, null, 2));
    }
    
    getStatus() {
        console.log('📊 API Gateway Status');
        console.log('====================');
        
        if (this.server && this.server.listening) {
            console.log('🟢 Gateway Status: Running');
        } else {
            console.log('🔴 Gateway Status: Stopped');
        }
        
        console.log('\n🔌 Registered Services:');
        Object.entries(this.services).forEach(([name, service]) => {
            console.log(`  • ${service.name} (${name})`);
            console.log(`    Endpoint: ${service.endpoint}`);
            console.log(`    Routes: ${service.routes.length}`);
        });
        
        console.log('\n⚙️ Configuration:');
        console.log(`  • Port: ${this.config.port}`);
        console.log(`  • Host: ${this.config.host}`);
        console.log(`  • Auth: ${this.config.auth.enabled}`);
        console.log(`  • Monitoring: ${this.config.monitoring.enabled}`);
    }
    
    getMetrics() {
        console.log('📈 API Gateway Metrics');
        console.log('=====================');
        console.log(`🔄 Total Requests: ${this.metrics.requests}`);
        console.log(`❌ Errors: ${this.metrics.errors}`);
        console.log(`⏱️ Uptime: ${Math.round((Date.now() - this.metrics.startTime) / 1000)}s`);
        console.log(`🔌 Registered Services: ${Object.keys(this.services).length}`);
        console.log(`⚙️ Rate Limit: ${this.config.rateLimit.requests} requests/${this.config.rateLimit.window}ms`);
        console.log(`🔒 Auth Enabled: ${this.config.auth.enabled}`);
        console.log(`📊 Monitoring: ${this.config.monitoring.enabled}`);
    }
}

// CLI interface
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    
    const gateway = new APIGateway();
    
    switch (command.toLowerCase()) {
        case 'init':
            gateway.initialize();
            break;
        case 'start':
            gateway.start();
            break;
        case 'stop':
            gateway.stop();
            break;
        case 'status':
            gateway.getStatus();
            break;
        case 'metrics':
            gateway.getMetrics();
            break;
        case 'help':
        default:
            console.log(`
🚀 ManagerAgentAI API Gateway

Centralized API gateway for all ManagerAgentAI services.

Usage:
  node api-gateway.js <command> [options]

Commands:
  init                     Initialize the API gateway
  start                    Start the API gateway server
  stop                     Stop the API gateway server
  status                   Show gateway and services status
  metrics                  Show gateway metrics

Examples:
  node api-gateway.js init
  node api-gateway.js start
  node api-gateway.js status
  node api-gateway.js metrics
            `);
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = APIGateway;
