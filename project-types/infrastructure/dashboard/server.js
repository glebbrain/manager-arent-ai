// Universal Automation Platform - WebSocket Server
// Version: 2.2 - AI Enhanced

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

class DashboardServer {
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.clients = new Set();
        this.metrics = {
            cpuUsage: 0,
            memoryUsage: 0,
            diskUsage: 0,
            networkLatency: 0
        };
        this.projects = [];
        this.builds = [];
        this.activities = [];
        this.alerts = [];
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Universal Automation Platform Server...');
        
        // Setup Express middleware
        this.setupMiddleware();
        
        // Setup routes
        this.setupRoutes();
        
        // Setup WebSocket
        this.setupWebSocket();
        
        // Start data simulation
        this.startDataSimulation();
        
        // Start server
        this.startServer();
    }

    setupMiddleware() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname)));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
        
        // JSON parsing
        this.app.use(express.json());
    }

    setupRoutes() {
        // API routes
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        this.app.get('/api/metrics', (req, res) => {
            res.json(this.metrics);
        });

        this.app.get('/api/projects', (req, res) => {
            res.json(this.projects);
        });

        this.app.get('/api/builds', (req, res) => {
            res.json(this.builds);
        });

        this.app.get('/api/activities', (req, res) => {
            res.json(this.activities);
        });

        this.app.get('/api/alerts', (req, res) => {
            res.json(this.alerts);
        });

        // Dashboard route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New WebSocket connection');
            this.clients.add(ws);
            
            // Send initial data
            this.sendToClient(ws, {
                type: 'system_status',
                payload: {
                    online: true,
                    uptime: this.getUptime()
                }
            });
            
            this.sendToClient(ws, {
                type: 'metrics',
                payload: this.metrics
            });
            
            this.sendToClient(ws, {
                type: 'projects',
                payload: this.projects
            });
            
            this.sendToClient(ws, {
                type: 'builds',
                payload: this.builds
            });
            
            this.sendToClient(ws, {
                type: 'activities',
                payload: this.activities
            });
            
            this.sendToClient(ws, {
                type: 'alerts',
                payload: this.alerts
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }

    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'heartbeat':
                this.sendToClient(ws, {
                    type: 'heartbeat',
                    timestamp: new Date().toISOString()
                });
                break;
            case 'subscribe':
                console.log(`📡 Client subscribed to: ${data.channel}`);
                break;
            case 'unsubscribe':
                console.log(`📡 Client unsubscribed from: ${data.channel}`);
                break;
            case 'request':
                this.handleRequest(ws, data);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    handleRequest(ws, data) {
        switch (data.action) {
            case 'system_status':
                this.sendToClient(ws, {
                    type: 'system_status',
                    payload: {
                        online: true,
                        uptime: this.getUptime()
                    }
                });
                break;
            case 'metrics':
                this.sendToClient(ws, {
                    type: 'metrics',
                    payload: this.metrics
                });
                break;
            case 'projects':
                this.sendToClient(ws, {
                    type: 'projects',
                    payload: this.projects
                });
                break;
            case 'builds':
                this.sendToClient(ws, {
                    type: 'builds',
                    payload: this.builds
                });
                break;
            case 'activities':
                this.sendToClient(ws, {
                    type: 'activities',
                    payload: this.activities
                });
                break;
            case 'alerts':
                this.sendToClient(ws, {
                    type: 'alerts',
                    payload: this.alerts
                });
                break;
            default:
                console.log('Unknown request action:', data.action);
        }
    }

    sendToClient(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(data));
            } catch (error) {
                console.error('❌ Error sending message to client:', error);
            }
        }
    }

    broadcast(data) {
        this.clients.forEach(client => {
            this.sendToClient(client, data);
        });
    }

    startDataSimulation() {
        // Initialize sample data
        this.initializeSampleData();
        
        // Update metrics every 5 seconds
        setInterval(() => {
            this.updateMetrics();
        }, 5000);
        
        // Simulate activities every 10 seconds
        setInterval(() => {
            this.simulateActivity();
        }, 10000);
        
        // Simulate alerts occasionally
        setInterval(() => {
            if (Math.random() < 0.1) {
                this.simulateAlert();
            }
        }, 30000);
    }

    initializeSampleData() {
        // Sample projects
        this.projects = [
            {
                id: 1,
                name: 'ManagerAgentAI',
                type: 'AI/ML Platform',
                status: 'active',
                lastBuild: new Date(Date.now() - 300000),
                progress: 85
            },
            {
                id: 2,
                name: 'Web Dashboard',
                type: 'Frontend',
                status: 'building',
                lastBuild: new Date(Date.now() - 120000),
                progress: 45
            },
            {
                id: 3,
                name: 'API Gateway',
                type: 'Backend',
                status: 'active',
                lastBuild: new Date(Date.now() - 600000),
                progress: 100
            }
        ];

        // Sample builds
        this.builds = [
            {
                id: 1,
                name: 'ManagerAgentAI Build #42',
                status: 'success',
                duration: 120,
                timestamp: new Date(Date.now() - 300000),
                progress: 100
            },
            {
                id: 2,
                name: 'Web Dashboard Build #15',
                status: 'building',
                duration: 45,
                timestamp: new Date(Date.now() - 120000),
                progress: 45
            },
            {
                id: 3,
                name: 'API Gateway Build #8',
                status: 'success',
                duration: 90,
                timestamp: new Date(Date.now() - 600000),
                progress: 100
            }
        ];

        // Sample activities
        this.activities = [
            {
                id: 1,
                type: 'build',
                message: 'Build completed successfully',
                timestamp: new Date(Date.now() - 300000),
                icon: '🔨'
            },
            {
                id: 2,
                type: 'test',
                message: 'All tests passed',
                timestamp: new Date(Date.now() - 240000),
                icon: '🧪'
            },
            {
                id: 3,
                type: 'deploy',
                message: 'Deployment to staging successful',
                timestamp: new Date(Date.now() - 180000),
                icon: '🚀'
            }
        ];

        // Sample alerts
        this.alerts = [
            {
                id: 1,
                type: 'warning',
                title: 'High Memory Usage',
                description: 'Memory usage is above 80%',
                timestamp: new Date(Date.now() - 600000),
                icon: '⚠️'
            },
            {
                id: 2,
                type: 'info',
                title: 'New Version Available',
                description: 'Dashboard v2.3 is ready for deployment',
                timestamp: new Date(Date.now() - 1200000),
                icon: 'ℹ️'
            }
        ];
    }

    updateMetrics() {
        this.metrics = {
            cpuUsage: Math.floor(Math.random() * 40) + 20,
            memoryUsage: Math.floor(Math.random() * 30) + 50,
            diskUsage: Math.floor(Math.random() * 20) + 60,
            networkLatency: Math.floor(Math.random() * 50) + 10
        };

        this.broadcast({
            type: 'metrics',
            payload: this.metrics
        });
    }

    simulateActivity() {
        const activities = [
            { type: 'build', message: 'Build process started', icon: '🔨' },
            { type: 'test', message: 'Running unit tests', icon: '🧪' },
            { type: 'deploy', message: 'Deploying to staging', icon: '🚀' },
            { type: 'build', message: 'Build completed successfully', icon: '✅' },
            { type: 'test', message: 'All tests passed', icon: '🎉' },
            { type: 'deploy', message: 'Production deployment successful', icon: '🚀' }
        ];

        const activity = activities[Math.floor(Math.random() * activities.length)];
        activity.id = Date.now();
        activity.timestamp = new Date();

        this.activities.unshift(activity);
        if (this.activities.length > 50) {
            this.activities = this.activities.slice(0, 50);
        }

        this.broadcast({
            type: 'activity',
            payload: activity
        });
    }

    simulateAlert() {
        const alerts = [
            {
                type: 'warning',
                title: 'High Memory Usage',
                description: 'Memory usage is above 80%',
                icon: '⚠️'
            },
            {
                type: 'info',
                title: 'New Version Available',
                description: 'Dashboard v2.3 is ready for deployment',
                icon: 'ℹ️'
            },
            {
                type: 'critical',
                title: 'Build Failure',
                description: 'Build #42 failed due to test errors',
                icon: '🚨'
            }
        ];

        const alert = alerts[Math.floor(Math.random() * alerts.length)];
        alert.id = Date.now();
        alert.timestamp = new Date();

        this.alerts.unshift(alert);
        if (this.alerts.length > 20) {
            this.alerts = this.alerts.slice(0, 20);
        }

        this.broadcast({
            type: 'alert',
            payload: alert
        });
    }

    getUptime() {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        return `${days}d ${hours}h ${minutes}m`;
    }

    startServer() {
        this.server.listen(this.port, () => {
            console.log(`🚀 Universal Automation Platform Server running on port ${this.port}`);
            console.log(`📊 Dashboard available at: http://localhost:${this.port}`);
            console.log(`🔌 WebSocket endpoint: ws://localhost:${this.port}/ws`);
        });
    }

    stop() {
        console.log('🛑 Stopping server...');
        this.server.close(() => {
            console.log('✅ Server stopped');
        });
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const port = process.env.PORT || 3000;
    const server = new DashboardServer(port);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        server.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        server.stop();
        process.exit(0);
    });
}

module.exports = DashboardServer;
