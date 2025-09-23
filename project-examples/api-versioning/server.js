/**
 * API Versioning Service Server
 * Express server for API versioning management
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const VersionManager = require('./version-manager');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3008;

// Configure logging
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

// Initialize version manager
const versionManager = new VersionManager({
    defaultVersion: 'v1',
    supportedVersions: ['v1', 'v2', 'v3', 'v4'],
    versioningStrategy: 'header',
    deprecatedVersions: []
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'api-versioning',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API versioning middleware
app.use('/api', versionManager.middleware);

// Register version configurations
versionManager.registerVersion('v1', {
    description: 'Initial API version',
    baseUrl: '/api/v1',
    endpoints: {
        '/tasks': {
            methods: ['GET', 'POST'],
            description: 'Task management endpoints'
        },
        '/projects': {
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'Project management endpoints'
        }
    },
    changelog: [
        'Initial release',
        'Basic CRUD operations for tasks and projects'
    ]
});

versionManager.registerVersion('v2', {
    description: 'Enhanced API version with AI features',
    baseUrl: '/api/v2',
    endpoints: {
        '/tasks': {
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'Enhanced task management with AI predictions'
        },
        '/projects': {
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'Enhanced project management with analytics'
        },
        '/predictions': {
            methods: ['GET', 'POST'],
            description: 'AI prediction endpoints'
        },
        '/analytics': {
            methods: ['GET'],
            description: 'Analytics and reporting endpoints'
        }
    },
    changelog: [
        'Added AI prediction capabilities',
        'Enhanced analytics and reporting',
        'Improved error handling',
        'Added batch operations'
    ]
});

versionManager.registerVersion('v3', {
    description: 'Advanced AI Features API version',
    baseUrl: '/api/v3',
    endpoints: {
        '/tasks/ai-recommendations': {
            methods: ['GET'],
            description: 'AI-powered task recommendations'
        },
        '/analytics/advanced': {
            methods: ['GET'],
            description: 'Advanced analytics with AI insights'
        },
        '/updates/stream': {
            methods: ['GET'],
            description: 'Real-time updates via Server-Sent Events'
        },
        '/code/analyze': {
            methods: ['POST'],
            description: 'AI-powered code analysis'
        },
        '/performance/metrics': {
            methods: ['GET'],
            description: 'Advanced performance monitoring'
        }
    },
    changelog: [
        'Added AI-powered code analysis',
        'Implemented real-time updates',
        'Enhanced performance monitoring',
        'Added advanced analytics',
        'Improved AI recommendations'
    ]
});

versionManager.registerVersion('v4', {
    description: 'Enterprise Features API version',
    baseUrl: '/api/v4',
    endpoints: {
        '/tenants/:tenantId/projects': {
            methods: ['GET'],
            description: 'Multi-tenant project management'
        },
        '/security/audit': {
            methods: ['GET'],
            description: 'Advanced security audit logs'
        },
        '/compliance/report': {
            methods: ['GET'],
            description: 'Compliance reporting (SOC2, ISO27001, GDPR)'
        },
        '/analytics/enterprise': {
            methods: ['GET'],
            description: 'Enterprise-grade analytics'
        },
        '/data/export': {
            methods: ['POST'],
            description: 'Compliant data export'
        }
    },
    changelog: [
        'Added multi-tenant support',
        'Implemented enterprise security',
        'Added compliance reporting',
        'Enhanced audit logging',
        'Added data export capabilities'
    ]
});

// API routes
app.get('/api/versions', (req, res) => {
    try {
        const versions = versionManager.getAllVersionsInfo();
        res.json({
            success: true,
            versions,
            currentVersion: req.apiVersion,
            versioningStrategy: versionManager.versioningStrategy
        });
    } catch (error) {
        logger.error('Error getting versions:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/api/versions/:version', (req, res) => {
    try {
        const version = req.params.version;
        const versionInfo = versionManager.getVersionInfo(version);
        
        if (!versionInfo) {
            return res.status(404).json({
                success: false,
                error: 'Version not found'
            });
        }
        
        res.json({
            success: true,
            version: versionInfo
        });
    } catch (error) {
        logger.error('Error getting version info:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/api/migration/:fromVersion/:toVersion', (req, res) => {
    try {
        const { fromVersion, toVersion } = req.params;
        const migrationGuide = versionManager.getMigrationGuide(fromVersion, toVersion);
        
        if (!migrationGuide) {
            return res.status(404).json({
                success: false,
                error: 'Migration guide not found'
            });
        }
        
        res.json({
            success: true,
            migration: migrationGuide
        });
    } catch (error) {
        logger.error('Error getting migration guide:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/api/docs/:version', (req, res) => {
    try {
        const version = req.params.version;
        const docs = versionManager.generateApiDocs(version);
        
        if (!docs) {
            return res.status(404).json({
                success: false,
                error: 'API documentation not found for this version'
            });
        }
        
        res.json({
            success: true,
            documentation: docs
        });
    } catch (error) {
        logger.error('Error generating API docs:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`API Versioning Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Supported versions: ${versionManager.supportedVersions.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
