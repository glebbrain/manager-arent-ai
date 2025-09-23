const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');
const WebSocket = require('ws');
const http = require('http');

const InteractiveDashboardSystem = require('./integrated-dashboard-system');
const DashboardEngine = require('./dashboard-engine');
const VisualizationEngine = require('./visualization-engine');
const RealTimeUpdater = require('./real-time-updater');
const DashboardManager = require('./dashboard-manager');
const WidgetLibrary = require('./widget-library');
const ThemeManager = require('./theme-manager');
const UserPreferences = require('./user-preferences');
const DashboardSharing = require('./dashboard-sharing');
const AnalyticsTracker = require('./analytics-tracker');

/**
 * Interactive Dashboards Service v2.4
 * Advanced interactive dashboard system with real-time updates and customization
 */
class InteractiveDashboardService {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = process.env.PORT || 3017;
        
        // Initialize components
        this.dashboardSystem = new InteractiveDashboardSystem();
        this.dashboardEngine = new DashboardEngine();
        this.visualizationEngine = new VisualizationEngine();
        this.realTimeUpdater = new RealTimeUpdater();
        this.dashboardManager = new DashboardManager();
        this.widgetLibrary = new WidgetLibrary();
        this.themeManager = new ThemeManager();
        this.userPreferences = new UserPreferences();
        this.dashboardSharing = new DashboardSharing();
        this.analyticsTracker = new AnalyticsTracker();
        
        // WebSocket connections
        this.connections = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "ws:", "wss:"]
                }
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use(limiter);

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Logging
        this.app.use(morgan('combined'));
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'interactive-dashboards',
                version: '2.4.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Status endpoint
        this.app.get('/status', async (req, res) => {
            try {
                const status = await this.getSystemStatus();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Dashboard management
        this.app.post('/dashboards', async (req, res) => {
            try {
                const dashboard = await this.dashboardManager.createDashboard(req.body);
                res.json(dashboard);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/dashboards', async (req, res) => {
            try {
                const dashboards = await this.dashboardManager.getDashboards(req.query);
                res.json(dashboards);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/dashboards/:id', async (req, res) => {
            try {
                const dashboard = await this.dashboardManager.getDashboard(req.params.id);
                if (!dashboard) {
                    return res.status(404).json({ error: 'Dashboard not found' });
                }
                res.json(dashboard);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.put('/dashboards/:id', async (req, res) => {
            try {
                const dashboard = await this.dashboardManager.updateDashboard(req.params.id, req.body);
                res.json(dashboard);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.delete('/dashboards/:id', async (req, res) => {
            try {
                await this.dashboardManager.deleteDashboard(req.params.id);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Widget management
        this.app.get('/widgets', async (req, res) => {
            try {
                const widgets = await this.widgetLibrary.getWidgets(req.query);
                res.json(widgets);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/widgets', async (req, res) => {
            try {
                const widget = await this.widgetLibrary.createWidget(req.body);
                res.json(widget);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/widgets/:id', async (req, res) => {
            try {
                const widget = await this.widgetLibrary.getWidget(req.params.id);
                if (!widget) {
                    return res.status(404).json({ error: 'Widget not found' });
                }
                res.json(widget);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.put('/widgets/:id', async (req, res) => {
            try {
                const widget = await this.widgetLibrary.updateWidget(req.params.id, req.body);
                res.json(widget);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.delete('/widgets/:id', async (req, res) => {
            try {
                await this.widgetLibrary.deleteWidget(req.params.id);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Visualization
        this.app.post('/visualize', async (req, res) => {
            try {
                const visualization = await this.visualizationEngine.createVisualization(req.body);
                res.json(visualization);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/visualize/:id', async (req, res) => {
            try {
                const visualization = await this.visualizationEngine.getVisualization(req.params.id);
                if (!visualization) {
                    return res.status(404).json({ error: 'Visualization not found' });
                }
                res.json(visualization);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Real-time data
        this.app.get('/data/real-time/:dashboardId', async (req, res) => {
            try {
                const data = await this.realTimeUpdater.getRealTimeData(req.params.dashboardId);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/data/real-time/:dashboardId/subscribe', async (req, res) => {
            try {
                const subscription = await this.realTimeUpdater.subscribeToUpdates(req.params.dashboardId, req.body);
                res.json(subscription);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Themes
        this.app.get('/themes', async (req, res) => {
            try {
                const themes = await this.themeManager.getThemes();
                res.json(themes);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/themes', async (req, res) => {
            try {
                const theme = await this.themeManager.createTheme(req.body);
                res.json(theme);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/themes/:id', async (req, res) => {
            try {
                const theme = await this.themeManager.getTheme(req.params.id);
                if (!theme) {
                    return res.status(404).json({ error: 'Theme not found' });
                }
                res.json(theme);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // User preferences
        this.app.get('/preferences/:userId', async (req, res) => {
            try {
                const preferences = await this.userPreferences.getPreferences(req.params.userId);
                res.json(preferences);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.put('/preferences/:userId', async (req, res) => {
            try {
                const preferences = await this.userPreferences.updatePreferences(req.params.userId, req.body);
                res.json(preferences);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Dashboard sharing
        this.app.post('/dashboards/:id/share', async (req, res) => {
            try {
                const shareLink = await this.dashboardSharing.shareDashboard(req.params.id, req.body);
                res.json(shareLink);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/dashboards/shared/:token', async (req, res) => {
            try {
                const dashboard = await this.dashboardSharing.getSharedDashboard(req.params.token);
                if (!dashboard) {
                    return res.status(404).json({ error: 'Shared dashboard not found' });
                }
                res.json(dashboard);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Analytics
        this.app.get('/analytics/dashboard/:id', async (req, res) => {
            try {
                const analytics = await this.analyticsTracker.getDashboardAnalytics(req.params.id, req.query);
                res.json(analytics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/analytics/user/:userId', async (req, res) => {
            try {
                const analytics = await this.analyticsTracker.getUserAnalytics(req.params.userId, req.query);
                res.json(analytics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Export functionality
        this.app.post('/export/dashboard/:id', async (req, res) => {
            try {
                const exportData = await this.dashboardManager.exportDashboard(req.params.id, req.body);
                res.json(exportData);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/export/widget/:id', async (req, res) => {
            try {
                const exportData = await this.widgetLibrary.exportWidget(req.params.id, req.body);
                res.json(exportData);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Import functionality
        this.app.post('/import/dashboard', async (req, res) => {
            try {
                const dashboard = await this.dashboardManager.importDashboard(req.body);
                res.json(dashboard);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/import/widget', async (req, res) => {
            try {
                const widget = await this.widgetLibrary.importWidget(req.body);
                res.json(widget);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Dashboard templates
        this.app.get('/templates', async (req, res) => {
            try {
                const templates = await this.dashboardManager.getTemplates();
                res.json(templates);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/templates', async (req, res) => {
            try {
                const template = await this.dashboardManager.createTemplate(req.body);
                res.json(template);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/templates/:id', async (req, res) => {
            try {
                const template = await this.dashboardManager.getTemplate(req.params.id);
                if (!template) {
                    return res.status(404).json({ error: 'Template not found' });
                }
                res.json(template);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/dashboards/:id/apply-template', async (req, res) => {
            try {
                const dashboard = await this.dashboardManager.applyTemplate(req.params.id, req.body.templateId);
                res.json(dashboard);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const connectionId = this.generateId();
            this.connections.set(connectionId, {
                ws,
                dashboardId: null,
                userId: null,
                subscriptions: new Set()
            });

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(connectionId, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({ error: 'Invalid message format' }));
                }
            });

            ws.on('close', () => {
                this.connections.delete(connectionId);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.connections.delete(connectionId);
            });

            // Send connection confirmation
            ws.send(JSON.stringify({
                type: 'connection',
                connectionId,
                status: 'connected'
            }));
        });
    }

    async handleWebSocketMessage(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        switch (data.type) {
            case 'subscribe':
                await this.handleSubscribe(connectionId, data);
                break;
            case 'unsubscribe':
                await this.handleUnsubscribe(connectionId, data);
                break;
            case 'update_preferences':
                await this.handleUpdatePreferences(connectionId, data);
                break;
            case 'ping':
                connection.ws.send(JSON.stringify({ type: 'pong' }));
                break;
            default:
                connection.ws.send(JSON.stringify({ error: 'Unknown message type' }));
        }
    }

    async handleSubscribe(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        try {
            const subscription = await this.realTimeUpdater.subscribeToUpdates(data.dashboardId, {
                connectionId,
                userId: data.userId,
                filters: data.filters || {}
            });

            connection.dashboardId = data.dashboardId;
            connection.userId = data.userId;
            connection.subscriptions.add(data.dashboardId);

            connection.ws.send(JSON.stringify({
                type: 'subscription',
                status: 'success',
                subscription
            }));
        } catch (error) {
            connection.ws.send(JSON.stringify({
                type: 'subscription',
                status: 'error',
                error: error.message
            }));
        }
    }

    async handleUnsubscribe(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        try {
            await this.realTimeUpdater.unsubscribeFromUpdates(data.dashboardId, connectionId);
            connection.subscriptions.delete(data.dashboardId);

            connection.ws.send(JSON.stringify({
                type: 'unsubscription',
                status: 'success'
            }));
        } catch (error) {
            connection.ws.send(JSON.stringify({
                type: 'unsubscription',
                status: 'error',
                error: error.message
            }));
        }
    }

    async handleUpdatePreferences(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        try {
            await this.userPreferences.updatePreferences(data.userId, data.preferences);
            
            connection.ws.send(JSON.stringify({
                type: 'preferences_updated',
                status: 'success'
            }));
        } catch (error) {
            connection.ws.send(JSON.stringify({
                type: 'preferences_updated',
                status: 'error',
                error: error.message
            }));
        }
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Global error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
    }

    async getSystemStatus() {
        return {
            isRunning: true,
            totalDashboards: await this.dashboardManager.getTotalDashboards(),
            totalWidgets: await this.widgetLibrary.getTotalWidgets(),
            activeConnections: this.connections.size,
            realTimeSubscriptions: await this.realTimeUpdater.getActiveSubscriptions(),
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`Interactive Dashboards Service running on port ${this.port}`);
            console.log(`WebSocket server running on port ${this.port}`);
        });
    }

    stop() {
        this.server.close(() => {
            console.log('Interactive Dashboards Service stopped');
        });
    }
}

// Start the service
const service = new InteractiveDashboardService();
service.start();

module.exports = InteractiveDashboardService;
