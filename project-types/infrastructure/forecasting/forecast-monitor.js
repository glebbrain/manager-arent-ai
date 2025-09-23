const EventEmitter = require('events');

/**
 * Forecast Monitor v2.4
 * Monitors forecast performance and triggers alerts
 */
class ForecastMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            monitoringInterval: 60000, // 1 minute
            alertThresholds: {
                accuracy: 0.7,
                bias: 0.1,
                volatility: 0.3,
                confidence: 0.6
            },
            alertCooldown: 300000, // 5 minutes
            maxAlerts: 100,
            ...options
        };
        
        this.monitoringData = new Map();
        this.alertHistory = new Map();
        this.performanceMetrics = new Map();
        this.isMonitoring = false;
        this.monitoringInterval = null;
    }

    /**
     * Start monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.performMonitoringCycle();
        }, this.options.monitoringInterval);

        this.emit('monitoring_started', {
            timestamp: new Date().toISOString(),
            interval: this.options.monitoringInterval
        });
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        this.emit('monitoring_stopped', {
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Perform monitoring cycle
     */
    async performMonitoringCycle() {
        try {
            const startTime = Date.now();
            
            // Get all active forecasts
            const activeForecasts = await this.getActiveForecasts();
            
            // Monitor each forecast
            const monitoringResults = [];
            for (const forecast of activeForecasts) {
                try {
                    const result = await this.monitorForecast(forecast);
                    monitoringResults.push(result);
                } catch (error) {
                    console.error(`Error monitoring forecast ${forecast.id}:`, error);
                }
            }
            
            // Analyze monitoring results
            const analysis = this.analyzeMonitoringResults(monitoringResults);
            
            // Check for alerts
            const alerts = this.checkForAlerts(analysis);
            
            // Update performance metrics
            this.updatePerformanceMetrics(monitoringResults);
            
            // Emit monitoring cycle event
            this.emit('monitoring_cycle', {
                timestamp: new Date().toISOString(),
                forecasts: monitoringResults.length,
                alerts: alerts.length,
                processingTime: Date.now() - startTime
            });
            
            // Process alerts
            for (const alert of alerts) {
                await this.processAlert(alert);
            }
            
        } catch (error) {
            console.error('Error in monitoring cycle:', error);
            this.emit('monitoring_error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Monitor individual forecast
     */
    async monitorForecast(forecast) {
        const forecastId = forecast.id;
        const projectId = forecast.projectId;
        
        // Get recent actual data
        const actualData = await this.getRecentActualData(projectId, forecast.metrics);
        
        // Get forecast data
        const forecastData = await this.getForecastData(forecastId);
        
        // Calculate performance metrics
        const performanceMetrics = this.calculatePerformanceMetrics(actualData, forecastData);
        
        // Calculate trend metrics
        const trendMetrics = this.calculateTrendMetrics(performanceMetrics);
        
        // Calculate risk metrics
        const riskMetrics = this.calculateRiskMetrics(performanceMetrics);
        
        // Store monitoring data
        this.monitoringData.set(forecastId, {
            forecastId,
            projectId,
            performanceMetrics,
            trendMetrics,
            riskMetrics,
            timestamp: new Date().toISOString()
        });
        
        return {
            forecastId,
            projectId,
            performanceMetrics,
            trendMetrics,
            riskMetrics,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate performance metrics
     */
    calculatePerformanceMetrics(actualData, forecastData) {
        if (!actualData || !forecastData || actualData.length === 0 || forecastData.length === 0) {
            return {
                accuracy: 0,
                bias: 0,
                volatility: 0,
                confidence: 0,
                mae: 0,
                mape: 0,
                rmse: 0
            };
        }

        const actualValues = actualData.map(d => d.value);
        const forecastValues = forecastData.map(d => d.value);
        
        // Calculate accuracy metrics
        const mae = this.calculateMAE(actualValues, forecastValues);
        const mape = this.calculateMAPE(actualValues, forecastValues);
        const rmse = this.calculateRMSE(actualValues, forecastValues);
        
        // Calculate overall accuracy
        const accuracy = this.calculateAccuracy(mae, mape, rmse);
        
        // Calculate bias
        const bias = this.calculateBias(actualValues, forecastValues);
        
        // Calculate volatility
        const volatility = this.calculateVolatility(actualValues, forecastValues);
        
        // Calculate confidence
        const confidence = this.calculateConfidence(forecastData);
        
        return {
            accuracy,
            bias,
            volatility,
            confidence,
            mae,
            mape,
            rmse
        };
    }

    /**
     * Calculate trend metrics
     */
    calculateTrendMetrics(performanceMetrics) {
        const trends = {
            accuracy: this.calculateTrend(performanceMetrics.accuracy),
            bias: this.calculateTrend(performanceMetrics.bias),
            volatility: this.calculateTrend(performanceMetrics.volatility),
            confidence: this.calculateTrend(performanceMetrics.confidence)
        };
        
        return trends;
    }

    /**
     * Calculate risk metrics
     */
    calculateRiskMetrics(performanceMetrics) {
        const risks = {
            accuracyRisk: this.calculateAccuracyRisk(performanceMetrics.accuracy),
            biasRisk: this.calculateBiasRisk(performanceMetrics.bias),
            volatilityRisk: this.calculateVolatilityRisk(performanceMetrics.volatility),
            confidenceRisk: this.calculateConfidenceRisk(performanceMetrics.confidence)
        };
        
        const overallRisk = (risks.accuracyRisk + risks.biasRisk + risks.volatilityRisk + risks.confidenceRisk) / 4;
        
        return {
            ...risks,
            overallRisk
        };
    }

    /**
     * Analyze monitoring results
     */
    analyzeMonitoringResults(monitoringResults) {
        const analysis = {
            totalForecasts: monitoringResults.length,
            averageAccuracy: 0,
            averageBias: 0,
            averageVolatility: 0,
            averageConfidence: 0,
            riskDistribution: {
                low: 0,
                medium: 0,
                high: 0
            },
            trendAnalysis: {
                improving: 0,
                stable: 0,
                declining: 0
            }
        };
        
        if (monitoringResults.length === 0) {
            return analysis;
        }
        
        // Calculate averages
        analysis.averageAccuracy = this.calculateAverage(monitoringResults, 'performanceMetrics.accuracy');
        analysis.averageBias = this.calculateAverage(monitoringResults, 'performanceMetrics.bias');
        analysis.averageVolatility = this.calculateAverage(monitoringResults, 'performanceMetrics.volatility');
        analysis.averageConfidence = this.calculateAverage(monitoringResults, 'performanceMetrics.confidence');
        
        // Analyze risk distribution
        monitoringResults.forEach(result => {
            const risk = result.riskMetrics.overallRisk;
            if (risk < 0.3) {
                analysis.riskDistribution.low++;
            } else if (risk < 0.7) {
                analysis.riskDistribution.medium++;
            } else {
                analysis.riskDistribution.high++;
            }
        });
        
        // Analyze trends
        monitoringResults.forEach(result => {
            const accuracyTrend = result.trendMetrics.accuracy;
            if (accuracyTrend > 0.1) {
                analysis.trendAnalysis.improving++;
            } else if (accuracyTrend > -0.1) {
                analysis.trendAnalysis.stable++;
            } else {
                analysis.trendAnalysis.declining++;
            }
        });
        
        return analysis;
    }

    /**
     * Check for alerts
     */
    checkForAlerts(analysis) {
        const alerts = [];
        
        // Accuracy alerts
        if (analysis.averageAccuracy < this.options.alertThresholds.accuracy) {
            alerts.push({
                type: 'low_accuracy',
                severity: 'warning',
                message: `Average accuracy (${(analysis.averageAccuracy * 100).toFixed(1)}%) is below threshold`,
                value: analysis.averageAccuracy,
                threshold: this.options.alertThresholds.accuracy,
                timestamp: new Date().toISOString()
            });
        }
        
        // Bias alerts
        if (Math.abs(analysis.averageBias) > this.options.alertThresholds.bias) {
            alerts.push({
                type: 'high_bias',
                severity: 'warning',
                message: `Average bias (${(analysis.averageBias * 100).toFixed(1)}%) exceeds threshold`,
                value: analysis.averageBias,
                threshold: this.options.alertThresholds.bias,
                timestamp: new Date().toISOString()
            });
        }
        
        // Volatility alerts
        if (analysis.averageVolatility > this.options.alertThresholds.volatility) {
            alerts.push({
                type: 'high_volatility',
                severity: 'warning',
                message: `Average volatility (${(analysis.averageVolatility * 100).toFixed(1)}%) exceeds threshold`,
                value: analysis.averageVolatility,
                threshold: this.options.alertThresholds.volatility,
                timestamp: new Date().toISOString()
            });
        }
        
        // Confidence alerts
        if (analysis.averageConfidence < this.options.alertThresholds.confidence) {
            alerts.push({
                type: 'low_confidence',
                severity: 'warning',
                message: `Average confidence (${(analysis.averageConfidence * 100).toFixed(1)}%) is below threshold`,
                value: analysis.averageConfidence,
                threshold: this.options.alertThresholds.confidence,
                timestamp: new Date().toISOString()
            });
        }
        
        // Risk alerts
        if (analysis.riskDistribution.high > analysis.totalForecasts * 0.3) {
            alerts.push({
                type: 'high_risk_distribution',
                severity: 'critical',
                message: `High risk forecasts: ${analysis.riskDistribution.high}/${analysis.totalForecasts}`,
                value: analysis.riskDistribution.high,
                total: analysis.totalForecasts,
                timestamp: new Date().toISOString()
            });
        }
        
        // Trend alerts
        if (analysis.trendAnalysis.declining > analysis.totalForecasts * 0.5) {
            alerts.push({
                type: 'declining_trends',
                severity: 'warning',
                message: `Declining trends: ${analysis.trendAnalysis.declining}/${analysis.totalForecasts}`,
                value: analysis.trendAnalysis.declining,
                total: analysis.totalForecasts,
                timestamp: new Date().toISOString()
            });
        }
        
        return alerts;
    }

    /**
     * Process alert
     */
    async processAlert(alert) {
        const alertId = this.generateId();
        
        // Check cooldown
        if (this.isAlertInCooldown(alert.type)) {
            return;
        }
        
        // Store alert
        this.alertHistory.set(alertId, {
            ...alert,
            alertId,
            processed: true,
            processedAt: new Date().toISOString()
        });
        
        // Emit alert event
        this.emit('alert', {
            ...alert,
            alertId
        });
        
        // Send notification if configured
        if (this.options.notificationHandler) {
            await this.options.notificationHandler(alert);
        }
    }

    /**
     * Check if alert is in cooldown
     */
    isAlertInCooldown(alertType) {
        const lastAlert = Array.from(this.alertHistory.values())
            .filter(alert => alert.type === alertType)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        
        if (!lastAlert) return false;
        
        const timeSinceLastAlert = Date.now() - new Date(lastAlert.timestamp).getTime();
        return timeSinceLastAlert < this.options.alertCooldown;
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(monitoringResults) {
        const timestamp = new Date().toISOString();
        
        monitoringResults.forEach(result => {
            const forecastId = result.forecastId;
            
            if (!this.performanceMetrics.has(forecastId)) {
                this.performanceMetrics.set(forecastId, []);
            }
            
            const history = this.performanceMetrics.get(forecastId);
            history.push({
                timestamp,
                metrics: result.performanceMetrics,
                trends: result.trendMetrics,
                risks: result.riskMetrics
            });
            
            // Keep only last 100 entries
            if (history.length > 100) {
                history.splice(0, history.length - 100);
            }
        });
    }

    /**
     * Get active forecasts
     */
    async getActiveForecasts() {
        // This would typically fetch from database
        // For now, return mock data
        return [
            {
                id: 'forecast_1',
                projectId: 'project_1',
                metrics: ['velocity', 'completion_rate'],
                status: 'active'
            },
            {
                id: 'forecast_2',
                projectId: 'project_2',
                metrics: ['resource_utilization', 'deadline_risk'],
                status: 'active'
            }
        ];
    }

    /**
     * Get recent actual data
     */
    async getRecentActualData(projectId, metrics) {
        // This would typically fetch from database
        // For now, return mock data
        const data = [];
        const now = new Date();
        
        for (let i = 0; i < 10; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            metrics.forEach(metric => {
                data.push({
                    projectId,
                    metric,
                    value: 100 + Math.random() * 20,
                    timestamp: date.toISOString()
                });
            });
        }
        
        return data;
    }

    /**
     * Get forecast data
     */
    async getForecastData(forecastId) {
        // This would typically fetch from database
        // For now, return mock data
        const data = [];
        
        for (let i = 0; i < 10; i++) {
            data.push({
                value: 100 + Math.random() * 20,
                confidence: 0.7 + Math.random() * 0.3,
                timestamp: new Date().toISOString()
            });
        }
        
        return data;
    }

    /**
     * Helper methods for calculations
     */
    calculateMAE(actual, forecast) {
        const errors = actual.map((a, i) => Math.abs(a - forecast[i]));
        return errors.reduce((sum, error) => sum + error, 0) / errors.length;
    }

    calculateMAPE(actual, forecast) {
        const errors = actual.map((a, i) => {
            if (a === 0) return 0;
            return Math.abs((a - forecast[i]) / a);
        });
        return errors.reduce((sum, error) => sum + error, 0) / errors.length * 100;
    }

    calculateRMSE(actual, forecast) {
        const errors = actual.map((a, i) => Math.pow(a - forecast[i], 2));
        return Math.sqrt(errors.reduce((sum, error) => sum + error, 0) / errors.length);
    }

    calculateAccuracy(mae, mape, rmse) {
        const maeScore = Math.max(0, 1 - mae / 100);
        const mapeScore = Math.max(0, 1 - mape / 100);
        const rmseScore = Math.max(0, 1 - rmse / 100);
        return (maeScore + mapeScore + rmseScore) / 3;
    }

    calculateBias(actual, forecast) {
        const errors = actual.map((a, i) => a - forecast[i]);
        return errors.reduce((sum, error) => sum + error, 0) / errors.length;
    }

    calculateVolatility(actual, forecast) {
        const actualReturns = this.calculateReturns(actual);
        const forecastReturns = this.calculateReturns(forecast);
        
        const actualVol = this.calculateStandardDeviation(actualReturns);
        const forecastVol = this.calculateStandardDeviation(forecastReturns);
        
        return Math.abs(actualVol - forecastVol);
    }

    calculateReturns(values) {
        const returns = [];
        for (let i = 1; i < values.length; i++) {
            const ret = (values[i] - values[i - 1]) / values[i - 1];
            returns.push(isFinite(ret) ? ret : 0);
        }
        return returns;
    }

    calculateStandardDeviation(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    calculateConfidence(forecastData) {
        const confidences = forecastData.map(d => d.confidence || 0.5);
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }

    calculateTrend(value) {
        // Simplified trend calculation
        // In practice, this would use more sophisticated methods
        return Math.random() * 0.2 - 0.1; // Random trend between -0.1 and 0.1
    }

    calculateAccuracyRisk(accuracy) {
        return Math.max(0, 1 - accuracy);
    }

    calculateBiasRisk(bias) {
        return Math.min(1, Math.abs(bias) * 2);
    }

    calculateVolatilityRisk(volatility) {
        return Math.min(1, volatility * 2);
    }

    calculateConfidenceRisk(confidence) {
        return Math.max(0, 1 - confidence);
    }

    calculateAverage(results, path) {
        const values = results.map(result => {
            const keys = path.split('.');
            let value = result;
            for (const key of keys) {
                value = value[key];
            }
            return value;
        }).filter(v => typeof v === 'number');
        
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * Get monitoring data
     */
    getMonitoringData(forecastId) {
        return this.monitoringData.get(forecastId) || null;
    }

    /**
     * Get alert history
     */
    getAlertHistory(alertType = null) {
        const alerts = Array.from(this.alertHistory.values());
        
        if (alertType) {
            return alerts.filter(alert => alert.type === alertType);
        }
        
        return alerts;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics(forecastId) {
        return this.performanceMetrics.get(forecastId) || [];
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            isMonitoring: this.isMonitoring,
            totalForecasts: this.monitoringData.size,
            totalAlerts: this.alertHistory.size,
            performanceMetrics: this.performanceMetrics.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

module.exports = ForecastMonitor;
