const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const winston = require('winston');

// Import existing analytics modules
const AnalyticsEngine = require('../advanced-analytics/modules/analytics-engine');
const AnalyticsTracker = require('../interactive-dashboards/analytics-tracker');

// Enhanced AI Performance Prediction
class AIPerformancePredictor {
    constructor() {
        this.predictionModels = new Map();
        this.historicalData = new Map();
        this.predictionAccuracy = 0.85; // Default accuracy
    }

    // Train prediction model for a specific AI model
    async trainPredictionModel(modelId, historicalData) {
        try {
            // Simple linear regression for prediction
            const data = historicalData.slice(-100); // Use last 100 data points
            if (data.length < 10) return false;

            const model = this.calculateLinearRegression(data);
            this.predictionModels.set(modelId, {
                model,
                lastTrained: new Date(),
                accuracy: this.predictionAccuracy
            });

            return true;
        } catch (error) {
            console.error('Error training prediction model:', error);
            return false;
        }
    }

    // Calculate linear regression for time series data
    calculateLinearRegression(data) {
        const n = data.length;
        const x = data.map((_, i) => i);
        const y = data.map(d => d.metrics.responseTime);

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    }

    // Predict future performance
    predictPerformance(modelId, timeSteps = 10) {
        const predictionModel = this.predictionModels.get(modelId);
        if (!predictionModel) return null;

        const predictions = [];
        const { slope, intercept } = predictionModel.model;
        const lastDataPoint = this.historicalData.get(modelId)?.slice(-1)[0];
        
        if (!lastDataPoint) return null;

        for (let i = 1; i <= timeSteps; i++) {
            const predictedValue = slope * (lastDataPoint.timestamp + i * 60000) + intercept;
            predictions.push({
                timestamp: new Date(lastDataPoint.timestamp.getTime() + i * 60000),
                predictedResponseTime: Math.max(0, predictedValue),
                confidence: predictionModel.accuracy
            });
        }

        return predictions;
    }

    // Update historical data
    updateHistoricalData(modelId, data) {
        if (!this.historicalData.has(modelId)) {
            this.historicalData.set(modelId, []);
        }
        
        const historical = this.historicalData.get(modelId);
        historical.push(data);
        
        // Keep only last 1000 records
        if (historical.length > 1000) {
            historical.splice(0, historical.length - 1000);
        }

        // Retrain model every 50 new data points
        if (historical.length % 50 === 0) {
            this.trainPredictionModel(modelId, historical);
        }
    }
}

// AI Performance Monitoring
class AIPerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.alerts = [];
        this.predictor = new AIPerformancePredictor();
        this.thresholds = {
            responseTime: 1000, // ms
            accuracy: 0.85, // 85%
            throughput: 100, // requests per minute
            errorRate: 0.05, // 5%
            memoryUsage: 0.8, // 80%
            cpuUsage: 0.8 // 80%
        };
        this.anomalyDetection = {
            enabled: true,
            sensitivity: 0.7, // 0-1, higher = more sensitive
            windowSize: 20 // number of data points to analyze
        };
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/ai-performance.log' })
            ]
        });
    }

    // Track AI model performance
    async trackAIModel(modelId, metrics) {
        try {
            const timestamp = new Date();
            const performanceData = {
                modelId,
                timestamp,
                metrics: {
                    responseTime: metrics.responseTime || 0,
                    accuracy: metrics.accuracy || 0,
                    throughput: metrics.throughput || 0,
                    errorRate: metrics.errorRate || 0,
                    memoryUsage: metrics.memoryUsage || 0,
                    cpuUsage: metrics.cpuUsage || 0,
                    requests: metrics.requests || 0,
                    errors: metrics.errors || 0
                },
                metadata: metrics.metadata || {}
            };

            // Store metrics
            if (!this.metrics.has(modelId)) {
                this.metrics.set(modelId, []);
            }
            
            const modelMetrics = this.metrics.get(modelId);
            modelMetrics.push(performanceData);

            // Keep only last 1000 records per model
            if (modelMetrics.length > 1000) {
                modelMetrics.splice(0, modelMetrics.length - 1000);
            }

            // Update prediction system
            this.predictor.updateHistoricalData(modelId, performanceData);

            // Anomaly detection
            if (this.anomalyDetection.enabled) {
                const anomaly = await this.detectAnomaly(modelId, performanceData);
                if (anomaly) {
                    performanceData.anomaly = anomaly;
                }
            }

            // Check thresholds and generate alerts
            await this.checkThresholds(modelId, performanceData);

            // Update analytics engine
            await AnalyticsEngine.processData(performanceData, {
                source: 'ai-performance',
                modelId,
                type: 'ai-model-performance'
            });

            this.logger.info('AI model performance tracked', { modelId, metrics: performanceData.metrics });
            return performanceData;
        } catch (error) {
            this.logger.error('Error tracking AI model performance:', error);
            throw error;
        }
    }

    // Check performance thresholds
    async checkThresholds(modelId, data) {
        const { metrics } = data;
        const alerts = [];

        // Response time check
        if (metrics.responseTime > this.thresholds.responseTime) {
            alerts.push({
                type: 'response_time',
                severity: 'warning',
                message: `Response time ${metrics.responseTime}ms exceeds threshold ${this.thresholds.responseTime}ms`,
                modelId,
                value: metrics.responseTime,
                threshold: this.thresholds.responseTime
            });
        }

        // Accuracy check
        if (metrics.accuracy < this.thresholds.accuracy) {
            alerts.push({
                type: 'accuracy',
                severity: 'critical',
                message: `Accuracy ${(metrics.accuracy * 100).toFixed(2)}% below threshold ${(this.thresholds.accuracy * 100).toFixed(2)}%`,
                modelId,
                value: metrics.accuracy,
                threshold: this.thresholds.accuracy
            });
        }

        // Error rate check
        if (metrics.errorRate > this.thresholds.errorRate) {
            alerts.push({
                type: 'error_rate',
                severity: 'critical',
                message: `Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds threshold ${(this.thresholds.errorRate * 100).toFixed(2)}%`,
                modelId,
                value: metrics.errorRate,
                threshold: this.thresholds.errorRate
            });
        }

        // Memory usage check
        if (metrics.memoryUsage > this.thresholds.memoryUsage) {
            alerts.push({
                type: 'memory_usage',
                severity: 'warning',
                message: `Memory usage ${(metrics.memoryUsage * 100).toFixed(2)}% exceeds threshold ${(this.thresholds.memoryUsage * 100).toFixed(2)}%`,
                modelId,
                value: metrics.memoryUsage,
                threshold: this.thresholds.memoryUsage
            });
        }

        // CPU usage check
        if (metrics.cpuUsage > this.thresholds.cpuUsage) {
            alerts.push({
                type: 'cpu_usage',
                severity: 'warning',
                message: `CPU usage ${(metrics.cpuUsage * 100).toFixed(2)}% exceeds threshold ${(this.thresholds.cpuUsage * 100).toFixed(2)}%`,
                modelId,
                value: metrics.cpuUsage,
                threshold: this.thresholds.cpuUsage
            });
        }

        // Add alerts to global list
        alerts.forEach(alert => {
            alert.timestamp = new Date();
            alert.id = this.generateAlertId();
            this.alerts.push(alert);
        });

        // Keep only last 1000 alerts
        if (this.alerts.length > 1000) {
            this.alerts.splice(0, this.alerts.length - 1000);
        }

        return alerts;
    }

    // Get real-time performance data
    getRealTimePerformance(modelId = null, timeRange = '1h') {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - this.parseTimeRange(timeRange));

        let data = [];
        
        if (modelId) {
            const modelMetrics = this.metrics.get(modelId) || [];
            data = modelMetrics.filter(d => d.timestamp >= startTime && d.timestamp <= endTime);
        } else {
            // Get data for all models
            for (const [id, modelMetrics] of this.metrics) {
                const filtered = modelMetrics.filter(d => d.timestamp >= startTime && d.timestamp <= endTime);
                data = data.concat(filtered);
            }
        }

        return data.sort((a, b) => a.timestamp - b.timestamp);
    }

    // Get performance summary
    getPerformanceSummary(modelId = null, timeRange = '24h') {
        const data = this.getRealTimePerformance(modelId, timeRange);
        
        if (data.length === 0) {
            return {
                totalRequests: 0,
                averageResponseTime: 0,
                averageAccuracy: 0,
                averageThroughput: 0,
                averageErrorRate: 0,
                averageMemoryUsage: 0,
                averageCpuUsage: 0,
                totalErrors: 0,
                uptime: 0
            };
        }

        const summary = {
            totalRequests: data.reduce((sum, d) => sum + d.metrics.requests, 0),
            averageResponseTime: this.calculateAverage(data.map(d => d.metrics.responseTime)),
            averageAccuracy: this.calculateAverage(data.map(d => d.metrics.accuracy)),
            averageThroughput: this.calculateAverage(data.map(d => d.metrics.throughput)),
            averageErrorRate: this.calculateAverage(data.map(d => d.metrics.errorRate)),
            averageMemoryUsage: this.calculateAverage(data.map(d => d.metrics.memoryUsage)),
            averageCpuUsage: this.calculateAverage(data.map(d => d.metrics.cpuUsage)),
            totalErrors: data.reduce((sum, d) => sum + d.metrics.errors, 0),
            uptime: this.calculateUptime(data)
        };

        return summary;
    }

    // Get active alerts
    getActiveAlerts(severity = null) {
        let alerts = this.alerts;
        
        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }

        // Return only alerts from last 24 hours
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return alerts.filter(alert => alert.timestamp >= dayAgo);
    }

    // Calculate average
    calculateAverage(values) {
        const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        if (numericValues.length === 0) return 0;
        return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
    }

    // Calculate uptime
    calculateUptime(data) {
        if (data.length === 0) return 0;
        
        const totalTime = data[data.length - 1].timestamp - data[0].timestamp;
        const errorTime = data.reduce((sum, d) => sum + (d.metrics.errorRate * 60000), 0); // Assuming 1 minute intervals
        return Math.max(0, (totalTime - errorTime) / totalTime);
    }

    // Parse time range
    parseTimeRange(timeRange) {
        const match = timeRange.match(/^(\d+)([smhd])$/);
        if (!match) return 60 * 60 * 1000; // Default 1 hour
        
        const amount = parseInt(match[1]);
        const unit = match[2];
        
        const unitMap = {
            's': 1000, // seconds
            'm': 60 * 1000, // minutes
            'h': 60 * 60 * 1000, // hours
            'd': 24 * 60 * 60 * 1000 // days
        };
        
        return amount * unitMap[unit];
    }

    // Generate alert ID
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get model list
    getModelList() {
        return Array.from(this.metrics.keys()).map(modelId => ({
            id: modelId,
            name: modelId,
            lastActivity: this.getLastActivity(modelId),
            status: this.getModelStatus(modelId)
        }));
    }

    // Get last activity for model
    getLastActivity(modelId) {
        const modelMetrics = this.metrics.get(modelId);
        if (!modelMetrics || modelMetrics.length === 0) return null;
        return modelMetrics[modelMetrics.length - 1].timestamp;
    }

    // Get model status
    getModelStatus(modelId) {
        const recentAlerts = this.getActiveAlerts().filter(alert => alert.modelId === modelId);
        const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
        
        if (criticalAlerts.length > 0) return 'critical';
        if (recentAlerts.length > 0) return 'warning';
        return 'healthy';
    }

    // Detect anomalies in performance data
    async detectAnomaly(modelId, currentData) {
        try {
            const modelMetrics = this.metrics.get(modelId) || [];
            if (modelMetrics.length < this.anomalyDetection.windowSize) {
                return null; // Not enough data for anomaly detection
            }

            const recentData = modelMetrics.slice(-this.anomalyDetection.windowSize);
            const currentMetrics = currentData.metrics;

            // Check for anomalies in response time
            const responseTimes = recentData.map(d => d.metrics.responseTime);
            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const responseTimeStdDev = Math.sqrt(
                responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length
            );

            const responseTimeZScore = Math.abs(currentMetrics.responseTime - avgResponseTime) / responseTimeStdDev;
            
            if (responseTimeZScore > (2 / this.anomalyDetection.sensitivity)) {
                return {
                    type: 'response_time_anomaly',
                    severity: responseTimeZScore > 3 ? 'critical' : 'warning',
                    message: `Response time anomaly detected: ${currentMetrics.responseTime}ms (expected: ${avgResponseTime.toFixed(0)}ms ± ${responseTimeStdDev.toFixed(0)}ms)`,
                    zScore: responseTimeZScore,
                    threshold: 2 / this.anomalyDetection.sensitivity
                };
            }

            // Check for anomalies in accuracy
            const accuracies = recentData.map(d => d.metrics.accuracy);
            const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
            const accuracyStdDev = Math.sqrt(
                accuracies.reduce((sum, acc) => sum + Math.pow(acc - avgAccuracy, 2), 0) / accuracies.length
            );

            const accuracyZScore = Math.abs(currentMetrics.accuracy - avgAccuracy) / accuracyStdDev;
            
            if (accuracyZScore > (2 / this.anomalyDetection.sensitivity)) {
                return {
                    type: 'accuracy_anomaly',
                    severity: accuracyZScore > 3 ? 'critical' : 'warning',
                    message: `Accuracy anomaly detected: ${(currentMetrics.accuracy * 100).toFixed(2)}% (expected: ${(avgAccuracy * 100).toFixed(2)}% ± ${(accuracyStdDev * 100).toFixed(2)}%)`,
                    zScore: accuracyZScore,
                    threshold: 2 / this.anomalyDetection.sensitivity
                };
            }

            return null;
        } catch (error) {
            this.logger.error('Error detecting anomaly:', error);
            return null;
        }
    }

    // Get performance predictions
    getPerformancePredictions(modelId, timeSteps = 10) {
        return this.predictor.predictPerformance(modelId, timeSteps);
    }

    // Get anomaly detection status
    getAnomalyDetectionStatus() {
        return {
            enabled: this.anomalyDetection.enabled,
            sensitivity: this.anomalyDetection.sensitivity,
            windowSize: this.anomalyDetection.windowSize
        };
    }

    // Update anomaly detection settings
    updateAnomalyDetectionSettings(settings) {
        if (settings.sensitivity !== undefined) {
            this.anomalyDetection.sensitivity = Math.max(0.1, Math.min(1.0, settings.sensitivity));
        }
        if (settings.windowSize !== undefined) {
            this.anomalyDetection.windowSize = Math.max(5, Math.min(100, settings.windowSize));
        }
        if (settings.enabled !== undefined) {
            this.anomalyDetection.enabled = settings.enabled;
        }
    }

    // Get comprehensive model analytics
    getModelAnalytics(modelId, timeRange = '24h') {
        const data = this.getRealTimePerformance(modelId, timeRange);
        const summary = this.getPerformanceSummary(modelId, timeRange);
        const predictions = this.getPerformancePredictions(modelId, 10);
        const alerts = this.getActiveAlerts().filter(alert => alert.modelId === modelId);
        
        return {
            summary,
            predictions,
            alerts,
            anomalyDetection: this.getAnomalyDetectionStatus(),
            dataPoints: data.length,
            timeRange,
            lastUpdated: new Date().toISOString()
        };
    }
}

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Initialize AI Performance Monitor
const aiMonitor = new AIPerformanceMonitor();
const analyticsTracker = new AnalyticsTracker();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.9.0',
        services: {
            aiMonitor: 'running',
            analyticsTracker: 'running',
            websocket: io.engine.clientsCount > 0 ? 'connected' : 'disconnected'
        }
    });
});

// Get AI performance summary
app.get('/api/ai-performance/summary', (req, res) => {
    try {
        const { modelId, timeRange = '24h' } = req.query;
        const summary = aiMonitor.getPerformanceSummary(modelId, timeRange);
        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get real-time performance data
app.get('/api/ai-performance/realtime', (req, res) => {
    try {
        const { modelId, timeRange = '1h' } = req.query;
        const data = aiMonitor.getRealTimePerformance(modelId, timeRange);
        res.json({
            success: true,
            data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get active alerts
app.get('/api/ai-performance/alerts', (req, res) => {
    try {
        const { severity } = req.query;
        const alerts = aiMonitor.getActiveAlerts(severity);
        res.json({
            success: true,
            data: alerts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get model list
app.get('/api/ai-performance/models', (req, res) => {
    try {
        const models = aiMonitor.getModelList();
        res.json({
            success: true,
            data: models,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Track AI model performance
app.post('/api/ai-performance/track', (req, res) => {
    try {
        const { modelId, metrics } = req.body;
        
        if (!modelId || !metrics) {
            return res.status(400).json({
                success: false,
                error: 'modelId and metrics are required'
            });
        }

        aiMonitor.trackAIModel(modelId, metrics).then(performanceData => {
            res.json({
                success: true,
                data: performanceData,
                timestamp: new Date().toISOString()
            });
        }).catch(error => {
            res.status(500).json({
                success: false,
                error: error.message
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get system analytics
app.get('/api/analytics/system', async (req, res) => {
    try {
        const analytics = await analyticsTracker.getSystemAnalytics();
        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get performance predictions
app.get('/api/ai-performance/predictions', (req, res) => {
    try {
        const { modelId, timeSteps = 10 } = req.query;
        
        if (!modelId) {
            return res.status(400).json({
                success: false,
                error: 'modelId is required'
            });
        }

        const predictions = aiMonitor.getPerformancePredictions(modelId, parseInt(timeSteps));
        res.json({
            success: true,
            data: predictions,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get comprehensive model analytics
app.get('/api/ai-performance/analytics', (req, res) => {
    try {
        const { modelId, timeRange = '24h' } = req.query;
        
        if (!modelId) {
            return res.status(400).json({
                success: false,
                error: 'modelId is required'
            });
        }

        const analytics = aiMonitor.getModelAnalytics(modelId, timeRange);
        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get anomaly detection status
app.get('/api/ai-performance/anomaly-detection', (req, res) => {
    try {
        const status = aiMonitor.getAnomalyDetectionStatus();
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update anomaly detection settings
app.post('/api/ai-performance/anomaly-detection', (req, res) => {
    try {
        const settings = req.body;
        aiMonitor.updateAnomalyDetectionSettings(settings);
        
        res.json({
            success: true,
            data: aiMonitor.getAnomalyDetectionStatus(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get AI model health score
app.get('/api/ai-performance/health-score', (req, res) => {
    try {
        const { modelId } = req.query;
        
        if (!modelId) {
            return res.status(400).json({
                success: false,
                error: 'modelId is required'
            });
        }

        const summary = aiMonitor.getPerformanceSummary(modelId, '24h');
        const alerts = aiMonitor.getActiveAlerts().filter(alert => alert.modelId === modelId);
        
        // Calculate health score (0-100)
        let healthScore = 100;
        
        // Deduct points for poor performance
        if (summary.averageResponseTime > 500) healthScore -= 20;
        if (summary.averageAccuracy < 0.9) healthScore -= 30;
        if (summary.averageErrorRate > 0.02) healthScore -= 25;
        if (summary.averageMemoryUsage > 0.8) healthScore -= 15;
        if (summary.averageCpuUsage > 0.8) healthScore -= 10;
        
        // Deduct points for alerts
        const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
        const warningAlerts = alerts.filter(alert => alert.severity === 'warning').length;
        
        healthScore -= criticalAlerts * 20;
        healthScore -= warningAlerts * 5;
        
        healthScore = Math.max(0, Math.min(100, healthScore));
        
        const healthStatus = healthScore >= 80 ? 'excellent' : 
                           healthScore >= 60 ? 'good' : 
                           healthScore >= 40 ? 'fair' : 'poor';

        res.json({
            success: true,
            data: {
                healthScore,
                healthStatus,
                summary,
                alerts: alerts.length,
                criticalAlerts,
                warningAlerts,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected to AI Performance Dashboard');

    // Send initial data
    socket.emit('initial-data', {
        models: aiMonitor.getModelList(),
        summary: aiMonitor.getPerformanceSummary(),
        alerts: aiMonitor.getActiveAlerts(),
        anomalyDetection: aiMonitor.getAnomalyDetectionStatus()
    });

    // Handle model selection
    socket.on('select-model', (modelId) => {
        const data = aiMonitor.getRealTimePerformance(modelId, '1h');
        const analytics = aiMonitor.getModelAnalytics(modelId, '1h');
        socket.emit('model-data', { modelId, data, analytics });
    });

    // Handle time range change
    socket.on('change-time-range', ({ modelId, timeRange }) => {
        const data = aiMonitor.getRealTimePerformance(modelId, timeRange);
        const analytics = aiMonitor.getModelAnalytics(modelId, timeRange);
        socket.emit('time-range-data', { modelId, timeRange, data, analytics });
    });

    // Handle prediction requests
    socket.on('get-predictions', ({ modelId, timeSteps = 10 }) => {
        const predictions = aiMonitor.getPerformancePredictions(modelId, timeSteps);
        socket.emit('predictions-data', { modelId, predictions });
    });

    // Handle health score requests
    socket.on('get-health-score', (modelId) => {
        const summary = aiMonitor.getPerformanceSummary(modelId, '24h');
        const alerts = aiMonitor.getActiveAlerts().filter(alert => alert.modelId === modelId);
        
        let healthScore = 100;
        if (summary.averageResponseTime > 500) healthScore -= 20;
        if (summary.averageAccuracy < 0.9) healthScore -= 30;
        if (summary.averageErrorRate > 0.02) healthScore -= 25;
        if (summary.averageMemoryUsage > 0.8) healthScore -= 15;
        if (summary.averageCpuUsage > 0.8) healthScore -= 10;
        
        const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
        const warningAlerts = alerts.filter(alert => alert.severity === 'warning').length;
        
        healthScore -= criticalAlerts * 20;
        healthScore -= warningAlerts * 5;
        healthScore = Math.max(0, Math.min(100, healthScore));
        
        const healthStatus = healthScore >= 80 ? 'excellent' : 
                           healthScore >= 60 ? 'good' : 
                           healthScore >= 40 ? 'fair' : 'poor';

        socket.emit('health-score-data', { 
            modelId, 
            healthScore, 
            healthStatus,
            alerts: alerts.length,
            criticalAlerts,
            warningAlerts
        });
    });

    // Handle anomaly detection settings update
    socket.on('update-anomaly-detection', (settings) => {
        aiMonitor.updateAnomalyDetectionSettings(settings);
        socket.emit('anomaly-detection-updated', aiMonitor.getAnomalyDetectionStatus());
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected from AI Performance Dashboard');
    });
});

// Real-time data broadcasting
setInterval(() => {
    const summary = aiMonitor.getPerformanceSummary();
    const alerts = aiMonitor.getActiveAlerts();
    
    io.emit('real-time-update', {
        summary,
        alerts,
        timestamp: new Date().toISOString()
    });
}, 5000); // Update every 5 seconds

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Advanced Analytics Dashboard running on port ${PORT}`);
    console.log(`📊 AI Performance Monitoring: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
});

module.exports = { app, server, aiMonitor, analyticsTracker };
