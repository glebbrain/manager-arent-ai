const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const winston = require('winston');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
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

const PORT = process.env.PORT || 3020;

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
        new winston.transports.File({ filename: 'logs/enterprise-integration-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/enterprise-integration-combined.log' })
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

// Enterprise Integration Configuration v2.7.0
const integrationConfig = {
    version: '2.7.0',
    features: {
        erpIntegration: true,
        crmIntegration: true,
        hrmIntegration: true,
        apiIntegration: true,
        dataSynchronization: true,
        realTimeSync: true,
        batchProcessing: true,
        dataTransformation: true,
        errorHandling: true,
        monitoring: true,
        security: true,
        compliance: true,
        auditing: true,
        reporting: true,
        automation: true
    },
    supportedSystems: {
        erp: ['SAP', 'Oracle', 'Microsoft Dynamics', 'NetSuite', 'Sage', 'Infor'],
        crm: ['Salesforce', 'HubSpot', 'Microsoft Dynamics CRM', 'Pipedrive', 'Zoho CRM'],
        hrm: ['Workday', 'BambooHR', 'ADP', 'Paychex', 'UltiPro'],
        database: ['MySQL', 'PostgreSQL', 'Oracle', 'SQL Server', 'MongoDB'],
        messaging: ['RabbitMQ', 'Apache Kafka', 'Amazon SQS', 'Azure Service Bus'],
        cloud: ['AWS', 'Azure', 'Google Cloud', 'Salesforce Cloud']
    },
    integrationTypes: {
        api: 'REST/SOAP API Integration',
        database: 'Direct Database Integration',
        file: 'File-based Integration',
        message: 'Message Queue Integration',
        webhook: 'Webhook Integration',
        sftp: 'SFTP Integration',
        realtime: 'Real-time Integration'
    },
    dataFormats: {
        input: ['JSON', 'XML', 'CSV', 'XLSX', 'YAML', 'TXT'],
        output: ['JSON', 'XML', 'CSV', 'XLSX', 'YAML', 'TXT']
    },
    limits: {
        maxIntegrations: 1000,
        maxDataSize: 100 * 1024 * 1024, // 100MB
        maxConcurrentSyncs: 50,
        maxRetryAttempts: 5,
        syncTimeout: 30 * 60 * 1000, // 30 minutes
        batchSize: 10000
    }
};

// Enterprise Integration Data Storage
let integrationData = {
    integrations: new Map(),
    syncJobs: new Map(),
    analytics: {
        totalIntegrations: 0,
        totalSyncs: 0,
        totalDataProcessed: 0,
        successRate: 0,
        errorRate: 0,
        averageSyncTime: 0
    }
};

// Utility Functions
function generateIntegrationId() {
    return uuidv4();
}

function generateSyncJobId() {
    return uuidv4();
}

// Enterprise Integration Engine
class EnterpriseIntegrationEngine {
    constructor() {
        this.integrations = new Map();
        this.syncJobs = new Map();
    }
    
    async createIntegration(integrationData) {
        const integrationId = generateIntegrationId();
        const integration = {
            id: integrationId,
            name: integrationData.name,
            description: integrationData.description,
            type: integrationData.type,
            sourceSystem: integrationData.sourceSystem,
            targetSystem: integrationData.targetSystem,
            configuration: integrationData.configuration,
            mapping: integrationData.mapping,
            schedule: integrationData.schedule,
            status: 'inactive',
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: integrationData.createdBy || 'system'
        };
        
        this.integrations.set(integrationId, integration);
        return integration;
    }
    
    async executeSync(integrationId, options = {}) {
        const syncJobId = generateSyncJobId();
        const startTime = Date.now();
        
        try {
            const integration = this.integrations.get(integrationId);
            if (!integration) {
                throw new Error('Integration not found');
            }
            
            // Create sync job record
            const syncJob = {
                id: syncJobId,
                integrationId,
                status: 'running',
                startTime: new Date().toISOString(),
                options,
                dataProcessed: 0,
                recordsProcessed: 0,
                errors: [],
                logs: []
            };
            
            this.syncJobs.set(syncJobId, syncJob);
            
            // Simulate sync execution
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update sync job status
            syncJob.status = 'completed';
            syncJob.endTime = new Date().toISOString();
            syncJob.dataProcessed = 1024;
            syncJob.recordsProcessed = 10;
            syncJob.logs.push('Sync completed successfully');
            
            this.syncJobs.set(syncJobId, syncJob);
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                syncJobId,
                result: {
                    dataProcessed: 1024,
                    recordsProcessed: 10
                },
                duration
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('Integration sync error:', error);
            throw error;
        }
    }
}

// Initialize enterprise integration engine
const integrationEngine = new EnterpriseIntegrationEngine();

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    logger.info('Client connected to enterprise integration engine');
    
    socket.on('disconnect', () => {
        logger.info('Client disconnected from enterprise integration engine');
    });
    
    socket.on('subscribe-integration', (integrationId) => {
        socket.join(`integration-${integrationId}`);
    });
    
    socket.on('unsubscribe-integration', (integrationId) => {
        socket.leave(`integration-${integrationId}`);
    });
});

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Enterprise Integration',
        version: integrationConfig.version,
        timestamp: new Date().toISOString(),
        features: integrationConfig.features,
        integrations: integrationData.integrations.size
    });
});

// Get configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...integrationConfig,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
    }
});

// Create integration
app.post('/api/integrations', async (req, res) => {
    try {
        const { integrationData } = req.body;
        
        if (!integrationData) {
            return res.status(400).json({ error: 'Integration data is required' });
        }
        
        const integration = await integrationEngine.createIntegration(integrationData);
        res.json(integration);
        
    } catch (error) {
        logger.error('Error creating integration:', error);
        res.status(500).json({ error: 'Failed to create integration', details: error.message });
    }
});

// Execute sync
app.post('/api/integrations/:integrationId/sync', async (req, res) => {
    try {
        const { integrationId } = req.params;
        const { options = {} } = req.body;
        
        const result = await integrationEngine.executeSync(integrationId, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error executing sync:', error);
        res.status(500).json({ error: 'Failed to execute sync', details: error.message });
    }
});

// Get integrations
app.get('/api/integrations', (req, res) => {
    try {
        const { type, status, limit = 50, offset = 0 } = req.query;
        
        let integrations = Array.from(integrationEngine.integrations.values());
        
        // Apply filters
        if (type) {
            integrations = integrations.filter(integration => integration.type === type);
        }
        
        if (status) {
            integrations = integrations.filter(integration => integration.status === status);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedIntegrations = integrations.slice(startIndex, endIndex);
        
        res.json({
            integrations: paginatedIntegrations,
            total: integrations.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting integrations:', error);
        res.status(500).json({ error: 'Failed to get integrations', details: error.message });
    }
});

// Get specific integration
app.get('/api/integrations/:integrationId', (req, res) => {
    try {
        const { integrationId } = req.params;
        const integration = integrationEngine.integrations.get(integrationId);
        
        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }
        
        res.json(integration);
        
    } catch (error) {
        logger.error('Error getting integration:', error);
        res.status(500).json({ error: 'Failed to get integration', details: error.message });
    }
});

// Get sync jobs
app.get('/api/sync-jobs', (req, res) => {
    try {
        const { status, integrationId, limit = 50, offset = 0 } = req.query;
        
        let syncJobs = Array.from(integrationEngine.syncJobs.values());
        
        // Apply filters
        if (status) {
            syncJobs = syncJobs.filter(job => job.status === status);
        }
        
        if (integrationId) {
            syncJobs = syncJobs.filter(job => job.integrationId === integrationId);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedSyncJobs = syncJobs.slice(startIndex, endIndex);
        
        res.json({
            syncJobs: paginatedSyncJobs,
            total: syncJobs.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting sync jobs:', error);
        res.status(500).json({ error: 'Failed to get sync jobs', details: error.message });
    }
});

// Get specific sync job
app.get('/api/sync-jobs/:syncJobId', (req, res) => {
    try {
        const { syncJobId } = req.params;
        const syncJob = integrationEngine.syncJobs.get(syncJobId);
        
        if (!syncJob) {
            return res.status(404).json({ error: 'Sync job not found' });
        }
        
        res.json(syncJob);
        
    } catch (error) {
        logger.error('Error getting sync job:', error);
        res.status(500).json({ error: 'Failed to get sync job', details: error.message });
    }
});

// Get analytics
app.get('/api/analytics', (req, res) => {
    try {
        const { period = '24h' } = req.query;
        
        const analytics = {
            period,
            overview: {
                totalIntegrations: integrationData.analytics.totalIntegrations,
                totalSyncs: integrationData.analytics.totalSyncs,
                totalDataProcessed: integrationData.analytics.totalDataProcessed,
                averageSyncTime: integrationData.analytics.averageSyncTime,
                successRate: integrationData.analytics.successRate,
                errorRate: integrationData.analytics.errorRate
            }
        };
        
        res.json(analytics);
        
    } catch (error) {
        logger.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics', details: error.message });
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
    console.log(`🏢 Enterprise Integration Service v2.7.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`🔄 Features: ERP, CRM, HRM Integration, Data Sync, Real-time Processing`);
    console.log(`📈 Capabilities: API, Database, File, Message Queue, Webhook, SFTP Integration`);
    console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
});

module.exports = app;