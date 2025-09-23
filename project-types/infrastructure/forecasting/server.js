const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');
const IntegratedForecastingSystem = require('./integrated-forecasting-system');

const app = express();
const PORT = process.env.PORT || 3016;

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
        new winston.transports.File({ filename: 'logs/forecasting.log' })
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

// Initialize forecasting system
const forecastingSystem = new IntegratedForecastingSystem({
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/manager_agent_ai'
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    eventBus: {
        url: process.env.EVENT_BUS_URL || 'http://localhost:4000'
    },
    forecasting: {
        defaultHorizon: process.env.DEFAULT_HORIZON || '30d',
        minDataPoints: parseInt(process.env.MIN_DATA_POINTS) || 20,
        confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.8,
        ensembleWeighting: process.env.ENSEMBLE_WEIGHTING === 'true',
        adaptiveLearning: process.env.ADAPTIVE_LEARNING === 'true'
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
        service: 'forecasting',
        version: '2.7.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes

// Forecasting endpoints
app.post('/api/forecast/generate', async (req, res) => {
    try {
        const { projectId, metrics, horizon, options = {} } = req.body;
        
        if (!projectId || !metrics || !horizon) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, metrics, and horizon are required'
            });
        }

        const result = await forecastingSystem.generateForecast(projectId, metrics, horizon, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Error generating forecast:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/forecast/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { horizon, metrics, includeHistory } = req.query;
        
        const result = await forecastingSystem.getForecasts(projectId, {
            horizon,
            metrics: metrics ? metrics.split(',') : undefined,
            includeHistory: includeHistory === 'true'
        });
        
        res.json({
            success: true,
            forecasts: result
        });
    } catch (error) {
        logger.error('Error getting forecasts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Resource forecasting endpoints
app.post('/api/forecast/resources', async (req, res) => {
    try {
        const { projectId, resourceTypes, horizon, options = {} } = req.body;
        
        if (!projectId || !resourceTypes || !horizon) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, resourceTypes, and horizon are required'
            });
        }

        const result = await forecastingSystem.forecastResources(projectId, resourceTypes, horizon, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Error forecasting resources:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Capacity forecasting endpoints
app.post('/api/forecast/capacity', async (req, res) => {
    try {
        const { projectId, teamId, horizon, options = {} } = req.body;
        
        if (!projectId || !teamId || !horizon) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, teamId, and horizon are required'
            });
        }

        const result = await forecastingSystem.forecastCapacity(projectId, teamId, horizon, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Error forecasting capacity:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Demand forecasting endpoints
app.post('/api/forecast/demand', async (req, res) => {
    try {
        const { projectId, demandTypes, horizon, options = {} } = req.body;
        
        if (!projectId || !demandTypes || !horizon) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, demandTypes, and horizon are required'
            });
        }

        const result = await forecastingSystem.forecastDemand(projectId, demandTypes, horizon, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Error forecasting demand:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Risk forecasting endpoints
app.post('/api/forecast/risks', async (req, res) => {
    try {
        const { projectId, riskTypes, horizon, options = {} } = req.body;
        
        if (!projectId || !riskTypes || !horizon) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, riskTypes, and horizon are required'
            });
        }

        const result = await forecastingSystem.forecastRisks(projectId, riskTypes, horizon, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Error forecasting risks:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Scenario planning endpoints
app.post('/api/forecast/scenarios', async (req, res) => {
    try {
        const { projectId, scenarios, horizon, options = {} } = req.body;
        
        if (!projectId || !scenarios || !horizon) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, scenarios, and horizon are required'
            });
        }

        const result = await forecastingSystem.generateScenarios(projectId, scenarios, horizon, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Error generating scenarios:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// What-if analysis endpoints
app.post('/api/forecast/what-if', async (req, res) => {
    try {
        const { projectId, assumptions, horizon, options = {} } = req.body;
        
        if (!projectId || !assumptions || !horizon) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, assumptions, and horizon are required'
            });
        }

        const result = await forecastingSystem.whatIfAnalysis(projectId, assumptions, horizon, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Error performing what-if analysis:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Model management endpoints
app.get('/api/forecast/models', async (req, res) => {
    try {
        const { projectId, modelType } = req.query;
        
        const result = await forecastingSystem.getModels(projectId, { modelType });
        
        res.json({
            success: true,
            models: result
        });
    } catch (error) {
        logger.error('Error getting models:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/forecast/models/train', async (req, res) => {
    try {
        const { projectId, modelType, data, options = {} } = req.body;
        
        if (!projectId || !modelType || !data) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, modelType, and data are required'
            });
        }

        const result = await forecastingSystem.trainModel(projectId, modelType, data, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Error training model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Accuracy assessment endpoints
app.post('/api/forecast/accuracy', async (req, res) => {
    try {
        const { projectId, forecastId, actualData, options = {} } = req.body;
        
        if (!projectId || !forecastId || !actualData) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, forecastId, and actualData are required'
            });
        }

        const result = await forecastingSystem.assessAccuracy(projectId, forecastId, actualData, options);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Error assessing accuracy:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Analytics endpoints
app.get('/api/forecast/analytics', async (req, res) => {
    try {
        const { projectId, startDate, endDate, groupBy } = req.query;
        
        const result = await forecastingSystem.getAnalytics({
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
        const status = await forecastingSystem.getSystemStatus();
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

// Advanced Predictive Analytics API Endpoints

// Advanced time series analysis
app.post('/api/analytics/timeseries', async (req, res) => {
    try {
        const { projectId, metrics, analysisType, options = {} } = req.body;
        
        if (!projectId || !metrics || !analysisType) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, metrics, and analysisType are required'
            });
        }

        const result = await forecastingSystem.performTimeSeriesAnalysis(projectId, metrics, analysisType, options);
        
        res.json({
            success: true,
            analysis: result
        });
    } catch (error) {
        logger.error('Error performing time series analysis:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Anomaly detection
app.post('/api/analytics/anomaly-detection', async (req, res) => {
    try {
        const { projectId, metrics, detectionMethod, options = {} } = req.body;
        
        if (!projectId || !metrics || !detectionMethod) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, metrics, and detectionMethod are required'
            });
        }

        const result = await forecastingSystem.detectAnomalies(projectId, metrics, detectionMethod, options);
        
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

// Pattern recognition
app.post('/api/analytics/pattern-recognition', async (req, res) => {
    try {
        const { projectId, metrics, patternTypes, options = {} } = req.body;
        
        if (!projectId || !metrics || !patternTypes) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, metrics, and patternTypes are required'
            });
        }

        const result = await forecastingSystem.recognizePatterns(projectId, metrics, patternTypes, options);
        
        res.json({
            success: true,
            patterns: result
        });
    } catch (error) {
        logger.error('Error recognizing patterns:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Predictive modeling
app.post('/api/analytics/predictive-modeling', async (req, res) => {
    try {
        const { projectId, metrics, modelType, targetVariable, options = {} } = req.body;
        
        if (!projectId || !metrics || !modelType || !targetVariable) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, metrics, modelType, and targetVariable are required'
            });
        }

        const result = await forecastingSystem.buildPredictiveModel(projectId, metrics, modelType, targetVariable, options);
        
        res.json({
            success: true,
            model: result
        });
    } catch (error) {
        logger.error('Error building predictive model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Correlation analysis
app.post('/api/analytics/correlation', async (req, res) => {
    try {
        const { projectId, metrics, correlationType, options = {} } = req.body;
        
        if (!projectId || !metrics || !correlationType) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, metrics, and correlationType are required'
            });
        }

        const result = await forecastingSystem.analyzeCorrelations(projectId, metrics, correlationType, options);
        
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

// Trend analysis
app.post('/api/analytics/trend-analysis', async (req, res) => {
    try {
        const { projectId, metrics, trendTypes, options = {} } = req.body;
        
        if (!projectId || !metrics || !trendTypes) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, metrics, and trendTypes are required'
            });
        }

        const result = await forecastingSystem.analyzeTrends(projectId, metrics, trendTypes, options);
        
        res.json({
            success: true,
            trends: result
        });
    } catch (error) {
        logger.error('Error analyzing trends:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Statistical analysis
app.post('/api/analytics/statistical', async (req, res) => {
    try {
        const { projectId, metrics, analysisType, options = {} } = req.body;
        
        if (!projectId || !metrics || !analysisType) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, metrics, and analysisType are required'
            });
        }

        const result = await forecastingSystem.performStatisticalAnalysis(projectId, metrics, analysisType, options);
        
        res.json({
            success: true,
            statistics: result
        });
    } catch (error) {
        logger.error('Error performing statistical analysis:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Machine learning insights
app.post('/api/analytics/ml-insights', async (req, res) => {
    try {
        const { projectId, metrics, insightTypes, options = {} } = req.body;
        
        if (!projectId || !metrics || !insightTypes) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, metrics, and insightTypes are required'
            });
        }

        const result = await forecastingSystem.generateMLInsights(projectId, metrics, insightTypes, options);
        
        res.json({
            success: true,
            insights: result
        });
    } catch (error) {
        logger.error('Error generating ML insights:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Predictive dashboard data
app.get('/api/analytics/dashboard/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { timeRange = '30d', metrics } = req.query;
        
        const result = await forecastingSystem.getPredictiveDashboard(projectId, {
            timeRange,
            metrics: metrics ? metrics.split(',') : undefined
        });
        
        res.json({
            success: true,
            dashboard: result
        });
    } catch (error) {
        logger.error('Error getting predictive dashboard:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Model performance evaluation
app.post('/api/analytics/model-evaluation', async (req, res) => {
    try {
        const { projectId, modelId, evaluationMetrics, options = {} } = req.body;
        
        if (!projectId || !modelId || !evaluationMetrics) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, modelId, and evaluationMetrics are required'
            });
        }

        const result = await forecastingSystem.evaluateModel(projectId, modelId, evaluationMetrics, options);
        
        res.json({
            success: true,
            evaluation: result
        });
    } catch (error) {
        logger.error('Error evaluating model:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Feature importance analysis
app.post('/api/analytics/feature-importance', async (req, res) => {
    try {
        const { projectId, modelId, options = {} } = req.body;
        
        if (!projectId || !modelId) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId and modelId are required'
            });
        }

        const result = await forecastingSystem.analyzeFeatureImportance(projectId, modelId, options);
        
        res.json({
            success: true,
            featureImportance: result
        });
    } catch (error) {
        logger.error('Error analyzing feature importance:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Predictive analytics configuration
app.get('/api/analytics/config', (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                version: '2.7.0',
                features: {
                    timeSeriesAnalysis: true,
                    anomalyDetection: true,
                    patternRecognition: true,
                    predictiveModeling: true,
                    correlationAnalysis: true,
                    trendAnalysis: true,
                    statisticalAnalysis: true,
                    mlInsights: true,
                    modelEvaluation: true,
                    featureImportance: true
                },
                supportedAnalysisTypes: [
                    'arima',
                    'exponential_smoothing',
                    'seasonal_decomposition',
                    'fourier_transform',
                    'wavelet_analysis',
                    'spectral_analysis'
                ],
                supportedDetectionMethods: [
                    'isolation_forest',
                    'one_class_svm',
                    'local_outlier_factor',
                    'statistical_threshold',
                    'machine_learning'
                ],
                supportedPatternTypes: [
                    'seasonal',
                    'cyclical',
                    'trend',
                    'irregular',
                    'periodic',
                    'random'
                ],
                supportedModelTypes: [
                    'linear_regression',
                    'polynomial_regression',
                    'random_forest',
                    'gradient_boosting',
                    'neural_network',
                    'svm',
                    'lstm',
                    'arima',
                    'prophet'
                ],
                supportedCorrelationTypes: [
                    'pearson',
                    'spearman',
                    'kendall',
                    'mutual_information',
                    'distance_correlation'
                ],
                supportedTrendTypes: [
                    'linear',
                    'polynomial',
                    'exponential',
                    'logarithmic',
                    'power',
                    'sigmoid'
                ],
                supportedStatisticalTypes: [
                    'descriptive',
                    'inferential',
                    'hypothesis_testing',
                    'confidence_intervals',
                    'regression_analysis',
                    'variance_analysis'
                ]
            }
        });
    } catch (error) {
        logger.error('Error getting analytics config:', error);
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
    logger.info(`🔮 Advanced Predictive Analytics v2.7.0 started on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔍 API documentation: http://localhost:${PORT}/api/analytics/config`);
    logger.info(`🤖 Features: Time Series Analysis, Anomaly Detection, Pattern Recognition`);
    logger.info(`📈 Analytics: Predictive Modeling, Correlation Analysis, ML Insights`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
