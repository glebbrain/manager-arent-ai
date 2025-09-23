/**
 * Task Dependency Management Service Server
 * Express server for automatic management of task dependencies
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const IntegratedDependencySystem = require('./integrated-dependency-system');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3012;

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

// Initialize integrated dependency system
const dependencySystem = new IntegratedDependencySystem({
    dependency: {
        autoDetection: true,
        conflictResolution: true,
        circularDependencyDetection: true,
        criticalPathAnalysis: true,
        impactAnalysis: true,
        optimizationEnabled: true
    },
    ai: {
        modelType: 'ensemble',
        learningRate: 0.01,
        predictionAccuracy: 0.85,
        contextWindow: 30
    },
    monitoring: {
        realTimeUpdates: true,
        alertThresholds: {
            criticalPathDelay: 0.2,
            dependencyConflict: 0.1,
            circularDependency: 0.0
        }
    },
    autoManagement: true,
    aiEnabled: true,
    monitoringEnabled: true
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
        service: 'task-dependency-management',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.post('/api/dependencies', async (req, res) => {
    try {
        const { taskId, dependencies, projectId, options = {} } = req.body;
        
        if (!taskId || !dependencies) {
            return res.status(400).json({
                success: false,
                error: 'TaskId and dependencies are required'
            });
        }
        
        const result = await dependencySystem.addDependencies(taskId, dependencies, {
            projectId,
            ...options
        });
        
        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error adding dependencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add dependencies',
            message: error.message
        });
    }
});

app.get('/api/dependencies/:taskId', (req, res) => {
    try {
        const { taskId } = req.params;
        const { includeTransitive = false, includeConflicts = false } = req.query;
        
        const dependencies = dependencySystem.getDependencies(taskId, {
            includeTransitive: includeTransitive === 'true',
            includeConflicts: includeConflicts === 'true'
        });
        
        res.json({
            success: true,
            dependencies,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting dependencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dependencies',
            message: error.message
        });
    }
});

app.put('/api/dependencies/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { dependencies, options = {} } = req.body;
        
        const result = await dependencySystem.updateDependencies(taskId, dependencies, options);
        
        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error updating dependencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update dependencies',
            message: error.message
        });
    }
});

app.delete('/api/dependencies/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { dependencyIds, options = {} } = req.body;
        
        const result = await dependencySystem.removeDependencies(taskId, dependencyIds, options);
        
        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error removing dependencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove dependencies',
            message: error.message
        });
    }
});

app.post('/api/dependencies/analyze', async (req, res) => {
    try {
        const { taskIds, projectId, analysisType = 'comprehensive' } = req.body;
        
        if (!taskIds || !Array.isArray(taskIds)) {
            return res.status(400).json({
                success: false,
                error: 'TaskIds array is required'
            });
        }
        
        const analysis = await dependencySystem.analyzeDependencies(taskIds, {
            projectId,
            analysisType
        });
        
        res.json({
            success: true,
            analysis,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error analyzing dependencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze dependencies',
            message: error.message
        });
    }
});

app.post('/api/dependencies/optimize', async (req, res) => {
    try {
        const { taskIds, projectId, optimizationType = 'comprehensive' } = req.body;
        
        if (!taskIds || !Array.isArray(taskIds)) {
            return res.status(400).json({
                success: false,
                error: 'TaskIds array is required'
            });
        }
        
        const optimization = await dependencySystem.optimizeDependencies(taskIds, {
            projectId,
            optimizationType
        });
        
        res.json({
            success: true,
            optimization,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error optimizing dependencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to optimize dependencies',
            message: error.message
        });
    }
});

app.get('/api/critical-path', (req, res) => {
    try {
        const { projectId, taskIds } = req.query;
        
        const criticalPath = dependencySystem.getCriticalPath({
            projectId,
            taskIds: taskIds ? taskIds.split(',') : null
        });
        
        res.json({
            success: true,
            criticalPath,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting critical path:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get critical path',
            message: error.message
        });
    }
});

app.post('/api/dependencies/conflicts', async (req, res) => {
    try {
        const { taskIds, projectId } = req.body;
        
        const conflicts = await dependencySystem.detectConflicts(taskIds, { projectId });
        
        res.json({
            success: true,
            conflicts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error detecting conflicts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to detect conflicts',
            message: error.message
        });
    }
});

app.post('/api/dependencies/circular', async (req, res) => {
    try {
        const { taskIds, projectId } = req.body;
        
        const circularDependencies = await dependencySystem.detectCircularDependencies(taskIds, { projectId });
        
        res.json({
            success: true,
            circularDependencies,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error detecting circular dependencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to detect circular dependencies',
            message: error.message
        });
    }
});

app.post('/api/dependencies/impact', async (req, res) => {
    try {
        const { taskId, changeType, options = {} } = req.body;
        
        if (!taskId || !changeType) {
            return res.status(400).json({
                success: false,
                error: 'TaskId and changeType are required'
            });
        }
        
        const impact = await dependencySystem.analyzeImpact(taskId, changeType, options);
        
        res.json({
            success: true,
            impact,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error analyzing impact:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze impact',
            message: error.message
        });
    }
});

app.get('/api/dependencies/visualization', (req, res) => {
    try {
        const { projectId, taskIds, format = 'json' } = req.query;
        
        const visualization = dependencySystem.generateVisualization({
            projectId,
            taskIds: taskIds ? taskIds.split(',') : null,
            format
        });
        
        res.json({
            success: true,
            visualization,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generating visualization:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate visualization',
            message: error.message
        });
    }
});

app.get('/api/analytics', (req, res) => {
    try {
        const analytics = dependencySystem.getAnalytics();
        
        res.json({
            success: true,
            analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get analytics',
            message: error.message
        });
    }
});

app.get('/api/system/status', (req, res) => {
    try {
        const status = {
            isRunning: dependencySystem.isRunning,
            lastUpdate: dependencySystem.lastUpdate,
            totalDependencies: dependencySystem.getTotalDependencies(),
            activeTasks: dependencySystem.getActiveTasks().length,
            criticalPaths: dependencySystem.getCriticalPaths().length,
            conflicts: dependencySystem.getConflicts().length,
            uptime: process.uptime()
        };
        
        res.json({
            success: true,
            status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting system status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve system status',
            message: error.message
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
    logger.info(`Task Dependency Management Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`AI Management enabled: ${dependencySystem.config.aiEnabled}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    dependencySystem.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    dependencySystem.stop();
    process.exit(0);
});

module.exports = app;
