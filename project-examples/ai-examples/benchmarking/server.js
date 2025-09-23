/**
 * Benchmarking Service Server
 * Express server for comparing project performance with industry best practices
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const IntegratedBenchmarkingSystem = require('./integrated-benchmarking-system');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3014;

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

// Initialize integrated benchmarking system
const benchmarkingSystem = new IntegratedBenchmarkingSystem({
    benchmarking: {
        industryStandards: true,
        performanceMetrics: true,
        qualityMetrics: true,
        securityMetrics: true,
        complianceMetrics: true,
        comparativeAnalysis: true,
        trendAnalysis: true,
        recommendations: true
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
            performanceGap: 0.2,
            qualityGap: 0.15,
            securityGap: 0.1
        }
    },
    autoBenchmarking: true,
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
        service: 'benchmarking',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.post('/api/benchmarks', async (req, res) => {
    try {
        const { projectId, benchmarkType, metrics = {} } = req.body;
        
        if (!projectId || !benchmarkType) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId and benchmarkType are required'
            });
        }
        
        const result = await benchmarkingSystem.runBenchmark(projectId, benchmarkType, {
            metrics,
            includeRecommendations: true
        });
        
        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error running benchmark:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to run benchmark',
            message: error.message
        });
    }
});

app.get('/api/benchmarks/:projectId', (req, res) => {
    try {
        const { projectId } = req.params;
        const { benchmarkType, includeHistory = false, limit = 50 } = req.query;
        
        const benchmarks = benchmarkingSystem.getBenchmarks(projectId, {
            benchmarkType,
            includeHistory: includeHistory === 'true',
            limit: parseInt(limit)
        });
        
        res.json({
            success: true,
            benchmarks,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting benchmarks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get benchmarks',
            message: error.message
        });
    }
});

app.post('/api/benchmarks/compare', async (req, res) => {
    try {
        const { projectId, comparisonTargets, benchmarkType = 'comprehensive' } = req.body;
        
        if (!projectId || !comparisonTargets) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId and comparisonTargets are required'
            });
        }
        
        const result = await benchmarkingSystem.compareBenchmarks(projectId, comparisonTargets, {
            benchmarkType
        });
        
        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error comparing benchmarks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compare benchmarks',
            message: error.message
        });
    }
});

app.get('/api/benchmarks/industry-standards', (req, res) => {
    try {
        const { category, metric } = req.query;
        
        const standards = benchmarkingSystem.getIndustryStandards({
            category,
            metric
        });
        
        res.json({
            success: true,
            standards,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting industry standards:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get industry standards',
            message: error.message
        });
    }
});

app.post('/api/benchmarks/trends', async (req, res) => {
    try {
        const { projectId, timeRange = '30d', benchmarkType } = req.body;
        
        if (!projectId) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId is required'
            });
        }
        
        const trends = await benchmarkingSystem.analyzeTrends(projectId, {
            timeRange,
            benchmarkType
        });
        
        res.json({
            success: true,
            trends,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error analyzing trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze trends',
            message: error.message
        });
    }
});

app.get('/api/benchmarks/recommendations', (req, res) => {
    try {
        const { projectId, category, priority } = req.query;
        
        const recommendations = benchmarkingSystem.getRecommendations({
            projectId,
            category,
            priority
        });
        
        res.json({
            success: true,
            recommendations,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting recommendations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get recommendations',
            message: error.message
        });
    }
});

app.post('/api/benchmarks/improvement-plan', async (req, res) => {
    try {
        const { projectId, focusAreas = [], timeline = '3m' } = req.body;
        
        if (!projectId) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId is required'
            });
        }
        
        const plan = await benchmarkingSystem.generateImprovementPlan(projectId, {
            focusAreas,
            timeline
        });
        
        res.json({
            success: true,
            plan,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generating improvement plan:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate improvement plan',
            message: error.message
        });
    }
});

app.get('/api/benchmarks/analytics', (req, res) => {
    try {
        const { 
            projectId, 
            startDate, 
            endDate, 
            groupBy = 'day' 
        } = req.query;
        
        const analytics = benchmarkingSystem.getBenchmarkAnalytics({
            projectId,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            groupBy
        });
        
        res.json({
            success: true,
            analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting benchmark analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get benchmark analytics',
            message: error.message
        });
    }
});

app.get('/api/benchmarks/leaderboard', (req, res) => {
    try {
        const { category, metric, timeRange = '30d' } = req.query;
        
        const leaderboard = benchmarkingSystem.getLeaderboard({
            category,
            metric,
            timeRange
        });
        
        res.json({
            success: true,
            leaderboard,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get leaderboard',
            message: error.message
        });
    }
});

app.get('/api/system/status', (req, res) => {
    try {
        const status = {
            isRunning: benchmarkingSystem.isRunning,
            lastUpdate: benchmarkingSystem.lastUpdate,
            totalBenchmarks: benchmarkingSystem.getTotalBenchmarks(),
            activeProjects: benchmarkingSystem.getActiveProjects().length,
            pendingBenchmarks: benchmarkingSystem.getPendingBenchmarks().length,
            recommendations: benchmarkingSystem.getRecommendations().length,
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
    logger.info(`Benchmarking Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`AI Benchmarking enabled: ${benchmarkingSystem.config.aiEnabled}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    benchmarkingSystem.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    benchmarkingSystem.stop();
    process.exit(0);
});

module.exports = app;
