const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');
const IntegratedTrendAnalysisSystem = require('./integrated-trend-analysis-system');

const app = express();
const PORT = process.env.PORT || 3015;

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
        new winston.transports.File({ filename: 'logs/trend-analysis.log' })
    ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Initialize trend analysis system
const trendAnalysisSystem = new IntegratedTrendAnalysisSystem({
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/manager_agent_ai'
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    eventBus: {
        url: process.env.EVENT_BUS_URL || 'http://localhost:4000'
    },
    trendAnalysis: {
        timeWindow: process.env.TREND_TIME_WINDOW || '30d',
        minDataPoints: parseInt(process.env.MIN_DATA_POINTS) || 10,
        confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.8,
        seasonalityDetection: process.env.SEASONALITY_DETECTION === 'true',
        anomalyDetection: process.env.ANOMALY_DETECTION === 'true'
    },
    ai: {
        modelType: process.env.AI_MODEL_TYPE || 'ensemble',
        learningRate: parseFloat(process.env.AI_LEARNING_RATE) || 0.001,
        maxEpochs: parseInt(process.env.AI_MAX_EPOCHS) || 100,
        batchSize: parseInt(process.env.AI_BATCH_SIZE) || 32,
        validationSplit: parseFloat(process.env.AI_VALIDATION_SPLIT) || 0.2
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'trend-analysis',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes

// Trend analysis endpoints
app.post('/api/trends/analyze', async (req, res) => {
    try {
        const { projectId, metrics, timeRange, options = {} } = req.body;
        
        if (!projectId || !metrics) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId and metrics are required'
            });
        }

        const result = await trendAnalysisSystem.analyzeTrends(projectId, metrics, timeRange, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Error analyzing trends:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/trends/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { timeRange, metrics, includeHistory } = req.query;
        
        const result = await trendAnalysisSystem.getTrends(projectId, {
            timeRange,
            metrics: metrics ? metrics.split(',') : undefined,
            includeHistory: includeHistory === 'true'
        });
        
        res.json({
            success: true,
            trends: result
        });
    } catch (error) {
        logger.error('Error getting trends:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Pattern detection endpoints
app.post('/api/trends/patterns/detect', async (req, res) => {
    try {
        const { projectId, data, patternTypes, options = {} } = req.body;
        
        if (!projectId || !data) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId and data are required'
            });
        }

        const result = await trendAnalysisSystem.detectPatterns(projectId, data, patternTypes, options);
        
        res.json({
            success: true,
            patterns: result
        });
    } catch (error) {
        logger.error('Error detecting patterns:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/trends/patterns/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { patternType, timeRange } = req.query;
        
        const result = await trendAnalysisSystem.getPatterns(projectId, {
            patternType,
            timeRange
        });
        
        res.json({
            success: true,
            patterns: result
        });
    } catch (error) {
        logger.error('Error getting patterns:', error);
        res.status(500).json({
            success: false,
        });
    }
});

// Forecasting endpoints
app.post('/api/trends/forecast', async (req, res) => {
    try {
        const { projectId, metrics, horizon, options = {} } = req.body;
        
        if (!projectId || !metrics || !horizon) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, metrics, and horizon are required'
            });
        }

        const result = await trendAnalysisSystem.forecastTrends(projectId, metrics, horizon, options);
        
        res.json({
            success: true,
            forecast: result
        });
    } catch (error) {
        logger.error('Error forecasting trends:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Anomaly detection endpoints
app.post('/api/trends/anomalies/detect', async (req, res) => {
    try {
        const { projectId, data, sensitivity, options = {} } = req.body;
        
        if (!projectId || !data) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId and data are required'
            });
        }

        const result = await trendAnalysisSystem.detectAnomalies(projectId, data, sensitivity, options);
        
        res.json({
            success: true,
            anomalies: result
        });
    } catch (error) {
        logger.error('Error detecting anomalies:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/trends/anomalies/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { timeRange, severity } = req.query;
        
        const result = await trendAnalysisSystem.getAnomalies(projectId, {
            timeRange,
            severity
        });
        
        res.json({
            success: true,
            anomalies: result
        });
    } catch (error) {
        logger.error('Error getting anomalies:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Seasonality analysis endpoints
app.post('/api/trends/seasonality/analyze', async (req, res) => {
    try {
        const { projectId, data, options = {} } = req.body;
        
        if (!projectId || !data) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId and data are required'
            });
        }

        const result = await trendAnalysisSystem.analyzeSeasonality(projectId, data, options);
        
        res.json({
            success: true,
            seasonality: result
        });
    } catch (error) {
        logger.error('Error analyzing seasonality:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Correlation analysis endpoints
app.post('/api/trends/correlation/analyze', async (req, res) => {
    try {
        const { projectId, metrics, options = {} } = req.body;
        
        if (!projectId || !metrics) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId and metrics are required'
            });
        }

        const result = await trendAnalysisSystem.analyzeCorrelations(projectId, metrics, options);
        
        res.json({
            success: true,
            correlations: result
        });
    } catch (error) {
        logger.error('Error analyzing correlations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Analytics endpoints
app.get('/api/trends/analytics', async (req, res) => {
    try {
        const { projectId, startDate, endDate, groupBy } = req.query;
        
        const result = await trendAnalysisSystem.getAnalytics({
            projectId,
            startDate,
            endDate,
            groupBy
        });
        
        res.json({
            success: true,
            analytics: result
        });
    } catch (error) {
        logger.error('Error getting analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// System status endpoint
app.get('/api/system/status', async (req, res) => {
    try {
        const status = await trendAnalysisSystem.getSystemStatus();
        res.json({
            success: true,
            status
        });
    } catch (error) {
        logger.error('Error getting system status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Trend Analysis service started on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
