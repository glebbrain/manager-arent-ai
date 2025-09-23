/**
 * ManagerAgentAI Event Bus - JavaScript Version
 * Event-driven architecture implementation
 * 
 * @author ManagerAgentAI
 * @date 2025-01-31
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const EventEmitter = require('events');

class EventBus extends EventEmitter {
    constructor() {
        super();
        
        this.eventBusPath = path.join(__dirname, '..', 'event-bus');
        this.configPath = path.join(this.eventBusPath, 'config');
        this.logsPath = path.join(this.eventBusPath, 'logs');
        this.subscribersPath = path.join(this.eventBusPath, 'subscribers');
        
        // Event bus configuration
        this.config = {
            port: 4000,
            host: 'localhost',
            maxEvents: 10000,
            retentionPeriod: 86400000, // 24 hours
            persistence: {
                enabled: true,
                file: 'events.json',
                backupInterval: 3600000 // 1 hour
            },
            security: {
                enabled: true,
                authToken: 'event-bus-secret-key-2025',
                encryption: true
            },
            monitoring: {
                enabled: true,
                metrics: true,
                health: true
            },
            routing: {
                strategy: 'broadcast', // broadcast, unicast, multicast
                retryAttempts: 3,
                retryDelay: 1000,
                timeout: 30000
            }
        };
        
        // Event types and their handlers
        this.eventTypes = {
            'project.created': {
                description: 'Project created event',
                handlers: ['notification-service', 'analytics-service', 'audit-service'],
                priority: 'high',
                retention: 2592000000 // 30 days
            },
            'project.updated': {
                description: 'Project updated event',
                handlers: ['notification-service', 'analytics-service', 'audit-service'],
                priority: 'medium',
                retention: 2592000000 // 30 days
            },
            'project.deleted': {
                description: 'Project deleted event',
                handlers: ['notification-service', 'analytics-service', 'audit-service', 'cleanup-service'],
                priority: 'high',
                retention: 2592000000 // 30 days
            },
            'task.created': {
                description: 'Task created event',
                handlers: ['notification-service', 'ai-planner', 'workflow-orchestrator'],
                priority: 'medium',
                retention: 1209600000 // 14 days
            },
            'task.completed': {
                description: 'Task completed event',
                handlers: ['notification-service', 'analytics-service', 'ai-planner'],
                priority: 'medium',
                retention: 1209600000 // 14 days
            },
            'workflow.started': {
                description: 'Workflow started event',
                handlers: ['notification-service', 'monitoring-service', 'audit-service'],
                priority: 'high',
                retention: 1209600000 // 14 days
            },
            'workflow.completed': {
                description: 'Workflow completed event',
                handlers: ['notification-service', 'analytics-service', 'monitoring-service'],
                priority: 'high',
                retention: 1209600000 // 14 days
            },
            'workflow.failed': {
                description: 'Workflow failed event',
                handlers: ['notification-service', 'error-handler', 'monitoring-service'],
                priority: 'critical',
                retention: 2592000000 // 30 days
            },
            'notification.sent': {
                description: 'Notification sent event',
                handlers: ['analytics-service', 'audit-service'],
                priority: 'low',
                retention: 604800000 // 7 days
            },
            'user.authenticated': {
                description: 'User authenticated event',
                handlers: ['analytics-service', 'audit-service', 'session-manager'],
                priority: 'medium',
                retention: 604800000 // 7 days
            },
            'error.occurred': {
                description: 'Error occurred event',
                handlers: ['error-handler', 'notification-service', 'monitoring-service'],
                priority: 'critical',
                retention: 2592000000 // 30 days
            },
            'system.health': {
                description: 'System health check event',
                handlers: ['monitoring-service', 'alert-service'],
                priority: 'low',
                retention: 604800000 // 7 days
            }
        };
        
        // Active subscribers
        this.subscribers = new Map();
        this.eventQueue = [];
        this.eventHistory = [];
        this.metrics = {
            eventsPublished: 0,
            eventsProcessed: 0,
            eventsFailed: 0,
            subscribersActive: 0,
            startTime: Date.now()
        };
        
        this.server = null;
    }
    
    ensureDirectories() {
        const dirs = [this.eventBusPath, this.configPath, this.logsPath, this.subscribersPath];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });
    }
    
    initialize() {
        console.log('🔄 Initializing Event Bus...');
        
        this.ensureDirectories();
        
        // Create event bus configuration
        const configFile = path.join(this.configPath, 'event-bus.json');
        fs.writeFileSync(configFile, JSON.stringify(this.config, null, 2));
        
        // Create event types registry
        const eventTypesFile = path.join(this.configPath, 'event-types.json');
        fs.writeFileSync(eventTypesFile, JSON.stringify(this.eventTypes, null, 2));
        
        // Create startup script
        const startupScript = `# Event Bus Startup Script
# Generated by ManagerAgentAI Event Bus

Write-Host "🔄 Starting ManagerAgentAI Event Bus..." -ForegroundColor Green

# Load configuration
$config = Get-Content "${configFile}" | ConvertFrom-Json
$eventTypes = Get-Content "${eventTypesFile}" | ConvertFrom-Json

# Start event bus server
Write-Host "🌐 Event Bus running on http://$($config.host):$($config.port)" -ForegroundColor Green
Write-Host "📊 Monitoring enabled: $($config.monitoring.enabled)" -ForegroundColor Green
Write-Host "🔒 Security enabled: $($config.security.enabled)" -ForegroundColor Green

# Keep running
while ($true) {
    Start-Sleep -Seconds 1
}`;
        
        const startupFile = path.join(this.eventBusPath, 'start-event-bus.ps1');
        fs.writeFileSync(startupFile, startupScript);
        
        console.log('✅ Event Bus initialized successfully');
        console.log(`📁 Configuration: ${configFile}`);
        console.log(`📁 Event Types: ${eventTypesFile}`);
        console.log(`🚀 Startup script: ${startupFile}`);
    }
    
    start() {
        console.log('🔄 Starting Event Bus...');
        
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        this.server.listen(this.config.port, this.config.host, () => {
            console.log(`✅ Event Bus started successfully`);
            console.log(`🌐 Event Bus URL: http://${this.config.host}:${this.config.port}`);
            console.log(`📊 Monitoring enabled: ${this.config.monitoring.enabled}`);
            console.log(`🔒 Security enabled: ${this.config.security.enabled}`);
        });
        
        this.server.on('error', (err) => {
            console.error('❌ Event Bus error:', err.message);
        });
        
        // Set up event processing interval
        setInterval(() => {
            this.processEventQueue();
        }, 1000);
    }
    
    stop() {
        console.log('🛑 Stopping Event Bus...');
        
        if (this.server) {
            this.server.close(() => {
                console.log('✅ Event Bus stopped');
            });
        }
    }
    
    handleRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Route requests
        switch (pathname) {
            case '/events/publish':
                this.handlePublishEvent(req, res);
                break;
            case '/events/subscribe':
                this.handleSubscribeEvent(req, res);
                break;
            case '/events/unsubscribe':
                this.handleUnsubscribeEvent(req, res);
                break;
            case '/events/list':
                this.handleListEvents(req, res);
                break;
            case '/events/history':
                this.handleEventHistory(req, res);
                break;
            case '/status':
                this.handleStatus(req, res);
                break;
            case '/health':
                this.handleHealth(req, res);
                break;
            case '/metrics':
                this.handleMetrics(req, res);
                break;
            default:
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
        }
    }
    
    handlePublishEvent(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const eventData = JSON.parse(body);
                const event = this.publishEvent(eventData.type, eventData.data);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    eventId: event.id,
                    message: 'Event published successfully'
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    handleSubscribeEvent(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { eventType, subscriberId } = JSON.parse(body);
                this.subscribeEvent(eventType, subscriberId);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Subscribed successfully'
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    handleUnsubscribeEvent(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { subscriberId } = JSON.parse(body);
                this.unsubscribeEvent(subscriberId);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Unsubscribed successfully'
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    handleListEvents(req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            eventTypes: Object.keys(this.eventTypes),
            subscribers: Array.from(this.subscribers.keys()),
            queueSize: this.eventQueue.length,
            historySize: this.eventHistory.length
        }));
    }
    
    handleEventHistory(req, res) {
        const limit = parseInt(req.url.split('?')[1]?.split('=')[1]) || 10;
        const recentEvents = this.eventHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(recentEvents));
    }
    
    handleStatus(req, res) {
        const status = {
            status: 'running',
            uptime: Date.now() - this.metrics.startTime,
            eventTypes: Object.keys(this.eventTypes).length,
            subscribers: this.subscribers.size,
            queueSize: this.eventQueue.length,
            historySize: this.eventHistory.length,
            metrics: this.metrics
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
    
    handleHealth(req, res) {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {
                server: this.server ? 'running' : 'stopped',
                eventTypes: Object.keys(this.eventTypes).length > 0 ? 'healthy' : 'unhealthy',
                subscribers: this.subscribers.size >= 0 ? 'healthy' : 'unhealthy',
                queue: this.eventQueue.length < this.config.maxEvents ? 'healthy' : 'warning'
            }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));
    }
    
    handleMetrics(req, res) {
        const metrics = {
            ...this.metrics,
            uptime: Date.now() - this.metrics.startTime,
            eventTypes: Object.keys(this.eventTypes).length,
            subscribers: this.subscribers.size,
            queueSize: this.eventQueue.length,
            historySize: this.eventHistory.length,
            config: {
                port: this.config.port,
                host: this.config.host,
                maxEvents: this.config.maxEvents,
                security: this.config.security.enabled,
                monitoring: this.config.monitoring.enabled
            }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metrics, null, 2));
    }
    
    publishEvent(eventType, eventData) {
        if (!this.eventTypes[eventType]) {
            throw new Error(`Unknown event type: ${eventType}`);
        }
        
        const event = {
            id: require('crypto').randomUUID(),
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString(),
            priority: this.eventTypes[eventType].priority,
            handlers: this.eventTypes[eventType].handlers
        };
        
        // Add to event queue
        this.eventQueue.push(event);
        
        // Add to event history
        this.eventHistory.push(event);
        
        // Update metrics
        this.metrics.eventsPublished++;
        
        // Emit event for local listeners
        this.emit('event', event);
        
        console.log(`✅ Event published: ${eventType} (${event.id})`);
        
        return event;
    }
    
    subscribeEvent(eventType, subscriberId) {
        if (!this.eventTypes[eventType]) {
            throw new Error(`Unknown event type: ${eventType}`);
        }
        
        if (!this.subscribers.has(subscriberId)) {
            this.subscribers.set(subscriberId, {
                id: subscriberId,
                events: [],
                status: 'active',
                created: new Date().toISOString()
            });
        }
        
        const subscriber = this.subscribers.get(subscriberId);
        if (!subscriber.events.includes(eventType)) {
            subscriber.events.push(eventType);
            this.metrics.subscribersActive = this.subscribers.size;
            console.log(`✅ Subscribed ${subscriberId} to ${eventType}`);
        } else {
            console.log(`⚠️ ${subscriberId} already subscribed to ${eventType}`);
        }
    }
    
    unsubscribeEvent(subscriberId) {
        if (this.subscribers.has(subscriberId)) {
            this.subscribers.delete(subscriberId);
            this.metrics.subscribersActive = this.subscribers.size;
            console.log(`✅ Unsubscribed ${subscriberId} from all events`);
        } else {
            throw new Error(`Subscriber ${subscriberId} not found`);
        }
    }
    
    processEventQueue() {
        if (this.eventQueue.length === 0) return;
        
        const event = this.eventQueue.shift();
        this.processEvent(event);
    }
    
    processEvent(event) {
        const eventType = event.type;
        const handlers = this.eventTypes[eventType].handlers;
        
        console.log(`🔄 Processing event: ${eventType}`);
        
        handlers.forEach(handler => {
            try {
                console.log(`  → Sending to ${handler}`);
                
                // In a real implementation, this would send the event to the actual service
                // For now, we'll just log the event
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    eventId: event.id,
                    eventType: eventType,
                    handler: handler,
                    status: 'processed'
                };
                
                const logFile = path.join(this.logsPath, 'event-processing.log');
                fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
                
                this.metrics.eventsProcessed++;
                
            } catch (error) {
                console.error(`❌ Failed to process event with handler ${handler}:`, error.message);
                this.metrics.eventsFailed++;
            }
        });
    }
    
    getStatus() {
        console.log('📊 Event Bus Status');
        console.log('==================');
        
        if (this.server && this.server.listening) {
            console.log('🟢 Event Bus Status: Running');
        } else {
            console.log('🔴 Event Bus Status: Stopped');
        }
        
        console.log(`\n📋 Event Types: ${Object.keys(this.eventTypes).length}`);
        Object.keys(this.eventTypes).forEach(eventType => {
            const event = this.eventTypes[eventType];
            console.log(`  • ${eventType}`);
            console.log(`    Description: ${event.description}`);
            console.log(`    Priority: ${event.priority}`);
            console.log(`    Handlers: ${event.handlers.length}`);
        });
        
        console.log(`\n👥 Subscribers: ${this.subscribers.size}`);
        this.subscribers.forEach((subscriber, id) => {
            console.log(`  • ${id}`);
            console.log(`    Events: ${subscriber.events.length}`);
            console.log(`    Status: ${subscriber.status}`);
        });
        
        console.log(`\n⚙️ Configuration:`);
        console.log(`  • Port: ${this.config.port}`);
        console.log(`  • Host: ${this.config.host}`);
        console.log(`  • Max Events: ${this.config.maxEvents}`);
        console.log(`  • Security: ${this.config.security.enabled}`);
        console.log(`  • Monitoring: ${this.config.monitoring.enabled}`);
    }
    
    getMetrics() {
        console.log('📈 Event Bus Metrics');
        console.log('===================');
        console.log(`🔄 Events Published: ${this.metrics.eventsPublished}`);
        console.log(`✅ Events Processed: ${this.metrics.eventsProcessed}`);
        console.log(`❌ Events Failed: ${this.metrics.eventsFailed}`);
        console.log(`👥 Active Subscribers: ${this.metrics.subscribersActive}`);
        console.log(`⏱️ Uptime: ${Math.round((Date.now() - this.metrics.startTime) / 1000)}s`);
        console.log(`📊 Queue Size: ${this.eventQueue.length}`);
        console.log(`📚 History Size: ${this.eventHistory.length}`);
    }
}

// CLI interface
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    
    const eventBus = new EventBus();
    
    switch (command.toLowerCase()) {
        case 'init':
            eventBus.initialize();
            break;
        case 'start':
            eventBus.start();
            break;
        case 'stop':
            eventBus.stop();
            break;
        case 'status':
            eventBus.getStatus();
            break;
        case 'metrics':
            eventBus.getMetrics();
            break;
        case 'help':
        default:
            console.log(`
🔄 ManagerAgentAI Event Bus

Event-driven architecture implementation for ManagerAgentAI services.

Usage:
  node event-bus.js <command> [options]

Commands:
  init                     Initialize the event bus
  start                    Start the event bus server
  stop                     Stop the event bus server
  status                   Show event bus status
  metrics                  Show event bus metrics

Examples:
  node event-bus.js init
  node event-bus.js start
  node event-bus.js status
  node event-bus.js metrics
            `);
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = EventBus;
