const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const winston = require('winston');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const multer = require('multer');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3022;

// Configure Winston logger
const logger = winston.createLogger({
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
        new winston.transports.File({ filename: 'logs/custom-dashboards-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/custom-dashboards-combined.log' })
    ]
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /json|yaml|yml|xml|csv|xlsx|txt|png|jpg|jpeg|gif|svg/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        
        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only JSON, YAML, XML, CSV, XLSX, TXT, and image files are allowed'));
        }
    }
});

// Custom Dashboards Configuration v2.7.0
const dashboardConfig = {
    version: '2.7.0',
    features: {
        dragAndDrop: true,
        realTimeData: true,
        customWidgets: true,
        dataVisualization: true,
        responsiveDesign: true,
        collaborativeEditing: true,
        versionControl: true,
        templateLibrary: true,
        dataConnections: true,
        advancedFiltering: true,
        exportCapabilities: true,
        mobileOptimization: true,
        accessibility: true,
        performanceOptimization: true,
        security: true,
        analytics: true,
        sharing: true,
        embedding: true,
        automation: true,
        aiInsights: true
    },
    widgetTypes: {
        chart: 'Charts and Graphs',
        kpi: 'Key Performance Indicators',
        table: 'Data Tables',
        gauge: 'Gauge Charts',
        map: 'Geographic Maps',
        heatmap: 'Heat Maps',
        treemap: 'Tree Maps',
        scatter: 'Scatter Plots',
        funnel: 'Funnel Charts',
        sankey: 'Sankey Diagrams',
        timeline: 'Timeline Views',
        text: 'Text and Rich Content',
        image: 'Images and Media',
        iframe: 'Embedded Content',
        custom: 'Custom Widgets'
    },
    chartTypes: {
        bar: 'Bar Charts',
        line: 'Line Charts',
        pie: 'Pie Charts',
        area: 'Area Charts',
        scatter: 'Scatter Plots',
        bubble: 'Bubble Charts',
        radar: 'Radar Charts',
        polar: 'Polar Charts',
        candlestick: 'Candlestick Charts',
        boxplot: 'Box Plot Charts',
        histogram: 'Histogram Charts',
        waterfall: 'Waterfall Charts'
    },
    layoutTypes: {
        grid: 'Grid Layout',
        flex: 'Flexbox Layout',
        masonry: 'Masonry Layout',
        freeform: 'Freeform Layout',
        responsive: 'Responsive Layout'
    },
    dataSources: {
        database: 'Database Connections',
        api: 'API Endpoints',
        file: 'File Uploads',
        realtime: 'Real-time Data Streams',
        external: 'External Data Sources',
        csv: 'CSV Files',
        excel: 'Excel Files',
        json: 'JSON Data'
    },
    exportFormats: {
        pdf: 'PDF Documents',
        png: 'PNG Images',
        jpg: 'JPEG Images',
        svg: 'SVG Vector Graphics',
        html: 'HTML Files',
        json: 'JSON Data'
    },
    limits: {
        maxDashboards: 1000,
        maxWidgetsPerDashboard: 100,
        maxDataPoints: 1000000,
        maxDashboardSize: 50 * 1024 * 1024, // 50MB
        maxConcurrentUsers: 100,
        dashboardTimeout: 30 * 60 * 1000, // 30 minutes
        maxFileSize: 10 * 1024 * 1024 // 10MB
    }
};

// Custom Dashboards Data Storage
let dashboardData = {
    dashboards: new Map(),
    widgets: new Map(),
    templates: new Map(),
    users: new Map(),
    analytics: {
        totalDashboards: 0,
        totalWidgets: 0,
        totalUsers: 0,
        averageLoadTime: 0,
        successRate: 0,
        errorRate: 0
    },
    performance: {
        loadTimes: [],
        renderTimes: [],
        errorRates: [],
        throughput: []
    }
};

// Utility Functions
function generateDashboardId() {
    return uuidv4();
}

function generateWidgetId() {
    return uuidv4();
}

function generateUserId() {
    return uuidv4();
}

function updateAnalytics(dashboardType, loadTime, success) {
    dashboardData.analytics.totalDashboards++;
    
    if (dashboardType === 'widget') {
        dashboardData.analytics.totalWidgets++;
    }
    
    // Update performance metrics
    dashboardData.performance.loadTimes.push(loadTime);
    
    if (success) {
        dashboardData.analytics.successRate = (dashboardData.analytics.successRate * (dashboardData.analytics.totalDashboards - 1) + 1) / dashboardData.analytics.totalDashboards;
    } else {
        dashboardData.analytics.errorRate = (dashboardData.analytics.errorRate * (dashboardData.analytics.totalDashboards - 1) + 1) / dashboardData.analytics.totalDashboards;
    }
    
    // Calculate average load time
    const totalLoadTime = dashboardData.performance.loadTimes.reduce((a, b) => a + b, 0);
    dashboardData.analytics.averageLoadTime = totalLoadTime / dashboardData.performance.loadTimes.length;
}

// Custom Dashboard Engine
class CustomDashboardEngine {
    constructor() {
        this.dashboards = new Map();
        this.widgets = new Map();
        this.templates = new Map();
        this.users = new Map();
    }
    
    async createDashboard(dashboardData) {
        const dashboardId = generateDashboardId();
        const dashboard = {
            id: dashboardId,
            name: dashboardData.name,
            description: dashboardData.description,
            layout: dashboardData.layout || { type: 'grid', columns: 12, rows: 8 },
            widgets: dashboardData.widgets || [],
            theme: dashboardData.theme || 'default',
            settings: dashboardData.settings || {},
            permissions: dashboardData.permissions || { public: false, users: [] },
            status: 'draft',
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: dashboardData.createdBy || 'system'
        };
        
        this.dashboards.set(dashboardId, dashboard);
        return dashboard;
    }
    
    async createWidget(widgetData) {
        const widgetId = generateWidgetId();
        const widget = {
            id: widgetId,
            type: widgetData.type,
            title: widgetData.title,
            description: widgetData.description,
            position: widgetData.position || { x: 0, y: 0, width: 4, height: 3 },
            configuration: widgetData.configuration || {},
            dataSource: widgetData.dataSource || {},
            styling: widgetData.styling || {},
            filters: widgetData.filters || {},
            status: 'active',
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: widgetData.createdBy || 'system'
        };
        
        this.widgets.set(widgetId, widget);
        return widget;
    }
    
    async renderDashboard(dashboardId, options = {}) {
        const startTime = Date.now();
        
        try {
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }
            
            // Simulate dashboard rendering
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const duration = Date.now() - startTime;
            updateAnalytics('dashboard', duration, true);
            
            const renderedDashboard = {
                id: dashboardId,
                name: dashboard.name,
                layout: dashboard.layout,
                widgets: await this.renderWidgets(dashboard.widgets, options),
                theme: dashboard.theme,
                settings: dashboard.settings,
                renderedAt: new Date().toISOString(),
                loadTime: duration
            };
            
            return {
                success: true,
                dashboard: renderedDashboard,
                loadTime: duration
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            updateAnalytics('dashboard', duration, false);
            
            logger.error('Dashboard rendering error:', error);
            throw error;
        }
    }
    
    async renderWidgets(widgetIds, options) {
        const renderedWidgets = [];
        
        for (const widgetId of widgetIds) {
            const widget = this.widgets.get(widgetId);
            if (widget) {
                const renderedWidget = await this.renderWidget(widget, options);
                renderedWidgets.push(renderedWidget);
            }
        }
        
        return renderedWidgets;
    }
    
    async renderWidget(widget, options) {
        // Simulate widget rendering
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const widgetData = {
            id: widget.id,
            type: widget.type,
            title: widget.title,
            position: widget.position,
            configuration: widget.configuration,
            data: await this.generateWidgetData(widget),
            styling: widget.styling,
            renderedAt: new Date().toISOString()
        };
        
        return widgetData;
    }
    
    async generateWidgetData(widget) {
        switch (widget.type) {
            case 'chart':
                return this.generateChartData(widget);
            case 'kpi':
                return this.generateKpiData(widget);
            case 'table':
                return this.generateTableData(widget);
            case 'gauge':
                return this.generateGaugeData(widget);
            case 'map':
                return this.generateMapData(widget);
            case 'text':
                return this.generateTextData(widget);
            case 'image':
                return this.generateImageData(widget);
            default:
                return { message: 'Widget data not available' };
        }
    }
    
    generateChartData(widget) {
        const chartType = widget.configuration.chartType || 'bar';
        const dataPoints = widget.configuration.dataPoints || 10;
        
        const labels = [];
        const datasets = [];
        
        for (let i = 0; i < dataPoints; i++) {
            labels.push(`Point ${i + 1}`);
        }
        
        datasets.push({
            label: widget.title,
            data: Array.from({ length: dataPoints }, () => Math.floor(Math.random() * 100)),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        });
        
        return {
            type: chartType,
            labels,
            datasets,
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        };
    }
    
    generateKpiData(widget) {
        const currentValue = Math.floor(Math.random() * 1000);
        const targetValue = widget.configuration.target || 1000;
        const previousValue = currentValue * (0.8 + Math.random() * 0.4);
        
        return {
            currentValue,
            targetValue,
            previousValue,
            change: ((currentValue - previousValue) / previousValue * 100).toFixed(2),
            trend: currentValue > previousValue ? 'up' : currentValue < previousValue ? 'down' : 'stable',
            unit: widget.configuration.unit || '',
            status: currentValue >= targetValue ? 'exceeded' : currentValue >= targetValue * 0.8 ? 'on_track' : 'below_target'
        };
    }
    
    generateTableData(widget) {
        const rows = widget.configuration.rows || 10;
        const columns = widget.configuration.columns || 5;
        
        const headers = [];
        const data = [];
        
        for (let i = 0; i < columns; i++) {
            headers.push(`Column ${i + 1}`);
        }
        
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < columns; j++) {
                row.push(`Data ${i + 1}-${j + 1}`);
            }
            data.push(row);
        }
        
        return {
            headers,
            data,
            totalRows: rows,
            totalColumns: columns
        };
    }
    
    generateGaugeData(widget) {
        const value = Math.floor(Math.random() * 100);
        const max = widget.configuration.max || 100;
        const min = widget.configuration.min || 0;
        
        return {
            value,
            min,
            max,
            percentage: ((value - min) / (max - min) * 100).toFixed(2),
            color: value >= 80 ? 'green' : value >= 60 ? 'yellow' : 'red'
        };
    }
    
    generateMapData(widget) {
        return {
            type: 'world',
            data: [
                { country: 'USA', value: Math.floor(Math.random() * 100) },
                { country: 'China', value: Math.floor(Math.random() * 100) },
                { country: 'Germany', value: Math.floor(Math.random() * 100) },
                { country: 'Japan', value: Math.floor(Math.random() * 100) },
                { country: 'UK', value: Math.floor(Math.random() * 100) }
            ]
        };
    }
    
    generateTextData(widget) {
        return {
            content: widget.configuration.content || 'Sample text content',
            format: widget.configuration.format || 'plain',
            alignment: widget.configuration.alignment || 'left'
        };
    }
    
    generateImageData(widget) {
        return {
            src: widget.configuration.src || '/images/placeholder.png',
            alt: widget.configuration.alt || 'Image',
            width: widget.configuration.width || '100%',
            height: widget.configuration.height || 'auto'
        };
    }
    
    async createTemplate(templateData) {
        const templateId = uuidv4();
        const template = {
            id: templateId,
            name: templateData.name,
            description: templateData.description,
            category: templateData.category,
            layout: templateData.layout,
            widgets: templateData.widgets,
            theme: templateData.theme,
            settings: templateData.settings,
            isPublic: templateData.isPublic || false,
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: templateData.createdBy || 'system'
        };
        
        this.templates.set(templateId, template);
        return template;
    }
    
    async createUser(userData) {
        const userId = generateUserId();
        const user = {
            id: userId,
            username: userData.username,
            email: userData.email,
            role: userData.role || 'user',
            preferences: userData.preferences || {},
            permissions: userData.permissions || {},
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.users.set(userId, user);
        return user;
    }
}

// Initialize custom dashboard engine
const dashboardEngine = new CustomDashboardEngine();

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    logger.info('Client connected to custom dashboard engine');
    
    socket.on('disconnect', () => {
        logger.info('Client disconnected from custom dashboard engine');
    });
    
    socket.on('subscribe-dashboard', (dashboardId) => {
        socket.join(`dashboard-${dashboardId}`);
    });
    
    socket.on('unsubscribe-dashboard', (dashboardId) => {
        socket.leave(`dashboard-${dashboardId}`);
    });
    
    socket.on('dashboard-update', (data) => {
        socket.to(`dashboard-${data.dashboardId}`).emit('dashboard-updated', data);
    });
});

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Custom Dashboards',
        version: dashboardConfig.version,
        timestamp: new Date().toISOString(),
        features: dashboardConfig.features,
        dashboards: dashboardData.dashboards.size,
        widgets: dashboardData.widgets.size,
        templates: dashboardData.templates.size
    });
});

// Get configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...dashboardConfig,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
    }
});

// Create dashboard
app.post('/api/dashboards', async (req, res) => {
    try {
        const { dashboardData } = req.body;
        
        if (!dashboardData) {
            return res.status(400).json({ error: 'Dashboard data is required' });
        }
        
        const dashboard = await dashboardEngine.createDashboard(dashboardData);
        res.json(dashboard);
        
    } catch (error) {
        logger.error('Error creating dashboard:', error);
        res.status(500).json({ error: 'Failed to create dashboard', details: error.message });
    }
});

// Render dashboard
app.post('/api/dashboards/:dashboardId/render', async (req, res) => {
    try {
        const { dashboardId } = req.params;
        const { options = {} } = req.body;
        
        const result = await dashboardEngine.renderDashboard(dashboardId, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error rendering dashboard:', error);
        res.status(500).json({ error: 'Failed to render dashboard', details: error.message });
    }
});

// Get dashboards
app.get('/api/dashboards', (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        
        let dashboards = Array.from(dashboardEngine.dashboards.values());
        
        // Apply filters
        if (status) {
            dashboards = dashboards.filter(dashboard => dashboard.status === status);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedDashboards = dashboards.slice(startIndex, endIndex);
        
        res.json({
            dashboards: paginatedDashboards,
            total: dashboards.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting dashboards:', error);
        res.status(500).json({ error: 'Failed to get dashboards', details: error.message });
    }
});

// Get specific dashboard
app.get('/api/dashboards/:dashboardId', (req, res) => {
    try {
        const { dashboardId } = req.params;
        const dashboard = dashboardEngine.dashboards.get(dashboardId);
        
        if (!dashboard) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        
        res.json(dashboard);
        
    } catch (error) {
        logger.error('Error getting dashboard:', error);
        res.status(500).json({ error: 'Failed to get dashboard', details: error.message });
    }
});

// Create widget
app.post('/api/widgets', async (req, res) => {
    try {
        const { widgetData } = req.body;
        
        if (!widgetData) {
            return res.status(400).json({ error: 'Widget data is required' });
        }
        
        const widget = await dashboardEngine.createWidget(widgetData);
        res.json(widget);
        
    } catch (error) {
        logger.error('Error creating widget:', error);
        res.status(500).json({ error: 'Failed to create widget', details: error.message });
    }
});

// Get widgets
app.get('/api/widgets', (req, res) => {
    try {
        const { type, status, limit = 50, offset = 0 } = req.query;
        
        let widgets = Array.from(dashboardEngine.widgets.values());
        
        // Apply filters
        if (type) {
            widgets = widgets.filter(widget => widget.type === type);
        }
        
        if (status) {
            widgets = widgets.filter(widget => widget.status === status);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedWidgets = widgets.slice(startIndex, endIndex);
        
        res.json({
            widgets: paginatedWidgets,
            total: widgets.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting widgets:', error);
        res.status(500).json({ error: 'Failed to get widgets', details: error.message });
    }
});

// Create template
app.post('/api/templates', async (req, res) => {
    try {
        const { templateData } = req.body;
        
        if (!templateData) {
            return res.status(400).json({ error: 'Template data is required' });
        }
        
        const template = await dashboardEngine.createTemplate(templateData);
        res.json(template);
        
    } catch (error) {
        logger.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template', details: error.message });
    }
});

// Get templates
app.get('/api/templates', (req, res) => {
    try {
        const { category, isPublic, limit = 50, offset = 0 } = req.query;
        
        let templates = Array.from(dashboardEngine.templates.values());
        
        // Apply filters
        if (category) {
            templates = templates.filter(template => template.category === category);
        }
        
        if (isPublic !== undefined) {
            templates = templates.filter(template => template.isPublic === (isPublic === 'true'));
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedTemplates = templates.slice(startIndex, endIndex);
        
        res.json({
            templates: paginatedTemplates,
            total: templates.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting templates:', error);
        res.status(500).json({ error: 'Failed to get templates', details: error.message });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    try {
        const { userData } = req.body;
        
        if (!userData) {
            return res.status(400).json({ error: 'User data is required' });
        }
        
        const user = await dashboardEngine.createUser(userData);
        res.json(user);
        
    } catch (error) {
        logger.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
});

// Get users
app.get('/api/users', (req, res) => {
    try {
        const { role, status, limit = 50, offset = 0 } = req.query;
        
        let users = Array.from(dashboardEngine.users.values());
        
        // Apply filters
        if (role) {
            users = users.filter(user => user.role === role);
        }
        
        if (status) {
            users = users.filter(user => user.status === status);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = users.slice(startIndex, endIndex);
        
        res.json({
            users: paginatedUsers,
            total: users.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to get users', details: error.message });
    }
});

// Get analytics
app.get('/api/analytics', (req, res) => {
    try {
        const { period = '24h' } = req.query;
        
        const analytics = {
            period,
            overview: {
                totalDashboards: dashboardData.analytics.totalDashboards,
                totalWidgets: dashboardData.analytics.totalWidgets,
                totalUsers: dashboardData.analytics.totalUsers,
                averageLoadTime: dashboardData.analytics.averageLoadTime,
                successRate: dashboardData.analytics.successRate,
                errorRate: dashboardData.analytics.errorRate
            },
            performance: {
                averageLoadTime: dashboardData.analytics.averageLoadTime,
                loadTimes: dashboardData.performance.loadTimes,
                renderTimes: dashboardData.performance.renderTimes,
                errorRates: dashboardData.performance.errorRates
            }
        };
        
        res.json(analytics);
        
    } catch (error) {
        logger.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics', details: error.message });
    }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileInfo = {
            id: uuidv4(),
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadedAt: new Date().toISOString()
        };
        
        res.json({
            success: true,
            file: fileInfo
        });
        
    } catch (error) {
        logger.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file', details: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`📊 Custom Dashboards Service v2.7.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`🎨 Features: Drag & Drop, Real-time Data, Custom Widgets, Data Visualization`);
    console.log(`📱 Capabilities: Responsive Design, Collaborative Editing, Template Library, Export`);
    console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
});

module.exports = app;
