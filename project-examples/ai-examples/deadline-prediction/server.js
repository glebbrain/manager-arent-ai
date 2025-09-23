/**
 * Deadline Prediction Service Server
 * Express server for AI deadline prediction
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const IntegratedDeadlinePredictionSystem = require('./integrated-prediction-system');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3009;

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

// Initialize integrated prediction system
const predictionSystem = new IntegratedDeadlinePredictionSystem({
    prediction: {
        confidenceThreshold: 0.7,
        learningRate: 0.01,
        maxHistoryDays: 365,
        adaptationRate: 0.1
    },
    riskMonitoring: {
        riskThresholds: {
            deadline: 0.7,
            complexity: 0.6,
            resource: 0.8,
            dependency: 0.5
        },
        alertCooldown: 300000,
        monitoringInterval: 60000
    },
    autoPrediction: true,
    riskMonitoring: true,
    analyticsEnabled: true
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
        service: 'deadline-prediction',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.post('/api/predict', async (req, res) => {
    try {
        const { task, developerId, method = 'ensemble', options = {} } = req.body;
        
        if (!task || !developerId) {
            return res.status(400).json({
                success: false,
                error: 'Task and developerId are required'
            });
        }
        
        const prediction = await predictionSystem.predictDeadline(task, developerId, { method, ...options });
        
        res.json({
            success: true,
            prediction,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error predicting deadline:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to predict deadline',
            message: error.message
        });
    }
});

app.post('/api/historical-data', (req, res) => {
    try {
        const { taskData } = req.body;
        
        if (!taskData) {
            return res.status(400).json({
                success: false,
                error: 'Task data is required'
            });
        }
        
        predictionSystem.predictionEngine.addHistoricalData(taskData);
        
        res.json({
            success: true,
            message: 'Historical data added successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error adding historical data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add historical data',
            message: error.message
        });
    }
});

app.get('/api/analytics', (req, res) => {
    try {
        const analytics = predictionSystem.getAnalytics();
        
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

app.get('/api/developers/:developerId/profile', (req, res) => {
    try {
        const { developerId } = req.params;
        const developer = predictionEngine.developerProfiles.get(developerId);
        
        if (!developer) {
            return res.status(404).json({
                success: false,
                error: 'Developer profile not found'
            });
        }
        
        res.json({
            success: true,
            developer: {
                id: developer.id,
                totalTasks: developer.totalTasks,
                completedTasks: developer.completedTasks,
                averageCompletionTime: developer.averageCompletionTime,
                averageQuality: developer.averageQuality,
                skillLevels: developer.skillLevels,
                accuracy: developer.accuracy
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting developer profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get developer profile',
            message: error.message
        });
    }
});

app.get('/api/task-patterns', (req, res) => {
    try {
        const patterns = {};
        for (const [key, pattern] of predictionSystem.predictionEngine.taskPatterns) {
            patterns[key] = {
                type: pattern.type,
                complexity: pattern.complexity,
                totalTasks: pattern.totalTasks,
                averageHours: pattern.averageHours,
                completionRate: pattern.completionRate
            };
        }
        
        res.json({
            success: true,
            patterns,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting task patterns:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get task patterns',
            message: error.message
        });
    }
});

app.post('/api/batch-predict', (req, res) => {
    try {
        const { tasks, developerId, method = 'ensemble' } = req.body;
        
        if (!tasks || !Array.isArray(tasks) || !developerId) {
            return res.status(400).json({
                success: false,
                error: 'Tasks array and developerId are required'
            });
        }
        
        const predictions = tasks.map(task => {
            try {
                return predictionSystem.predictDeadline(task, developerId, { method });
            } catch (error) {
                return {
                    error: error.message,
                    taskId: task.id
                };
            }
        });
        
        res.json({
            success: true,
            predictions,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error in batch prediction:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform batch prediction',
            message: error.message
        });
    }
});

// New API endpoints for enhanced functionality
app.post('/api/batch-predict-advanced', async (req, res) => {
    try {
        const { tasks, developers, options = {} } = req.body;
        
        if (!tasks || !developers) {
            return res.status(400).json({
                success: false,
                error: 'Tasks and developers are required'
            });
        }
        
        const result = await predictionSystem.batchPredictDeadlines(tasks, developers, options);
        
        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error in advanced batch prediction:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform advanced batch prediction',
            message: error.message
        });
    }
});

app.get('/api/risks', (req, res) => {
    try {
        const riskDashboard = predictionSystem.riskMonitor.getRiskDashboard();
        
        res.json({
            success: true,
            risks: riskDashboard,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting risk data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve risk data',
            message: error.message
        });
    }
});

app.get('/api/system/status', (req, res) => {
    try {
        const status = {
            isRunning: predictionSystem.isRunning,
            lastUpdate: predictionSystem.lastUpdate,
            cacheSize: predictionSystem.config.predictionCache.size,
            queueLength: predictionSystem.predictionQueue.length,
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

app.post('/api/update-predictions', async (req, res) => {
    try {
        await predictionSystem.updatePredictions();
        
        res.json({
            success: true,
            message: 'Predictions updated successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error updating predictions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update predictions',
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
    logger.info(`Deadline Prediction Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Confidence threshold: ${predictionSystem.predictionEngine.confidenceThreshold}`);
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
