const ForecastingEngine = require('./forecasting-engine');
const ResourceForecaster = require('./resource-forecaster');
const CapacityForecaster = require('./capacity-forecaster');
const DemandForecaster = require('./demand-forecaster');
const RiskForecaster = require('./risk-forecaster');
const ScenarioPlanner = require('./scenario-planner');
const WhatIfAnalyzer = require('./what-if-analyzer');
const ModelManager = require('./model-manager');
const AccuracyAssessor = require('./accuracy-assessor');
const { v4: uuidv4 } = require('uuid');

/**
 * Integrated Forecasting System v2.4
 * Comprehensive forecasting system for future needs and resource planning
 */
class IntegratedForecastingSystem {
    constructor(options = {}) {
        this.options = {
            database: {
                url: 'postgresql://postgres:password@localhost:5432/manager_agent_ai'
            },
            redis: {
                url: 'redis://localhost:6379'
            },
            eventBus: {
                url: 'http://localhost:4000'
            },
            forecasting: {
                defaultHorizon: '30d',
                minDataPoints: 20,
                confidenceThreshold: 0.8,
                ensembleWeighting: true,
                adaptiveLearning: true
            },
            ai: {
                modelType: 'ensemble',
                learningRate: 0.001,
                maxEpochs: 100,
                batchSize: 32,
                validationSplit: 0.2
            },
            ...options
        };

        // Initialize components
        this.forecastingEngine = new ForecastingEngine(this.options.forecasting);
        this.resourceForecaster = new ResourceForecaster(this.options.forecasting);
        this.capacityForecaster = new CapacityForecaster(this.options.forecasting);
        this.demandForecaster = new DemandForecaster(this.options.forecasting);
        this.riskForecaster = new RiskForecaster(this.options.forecasting);
        this.scenarioPlanner = new ScenarioPlanner(this.options.forecasting);
        this.whatIfAnalyzer = new WhatIfAnalyzer(this.options.forecasting);
        this.modelManager = new ModelManager(this.options.ai);
        this.accuracyAssessor = new AccuracyAssessor(this.options.forecasting);

        // Initialize data stores
        this.forecasts = new Map();
        this.models = new Map();
        this.scenarios = new Map();
        this.accuracyReports = new Map();

        // Initialize background processes
        this.initializeBackgroundProcesses();
    }

    /**
     * Generate comprehensive forecast
     */
    async generateForecast(projectId, metrics, horizon, options = {}) {
        try {
            const forecastId = uuidv4();
            const startTime = Date.now();

            // Generate forecasts for each metric
            const forecasts = {};
            const recommendations = [];
            const confidence = {};

            for (const metric of metrics) {
                try {
                    const forecast = await this.forecastingEngine.generateForecast(
                        projectId,
                        metric,
                        horizon,
                        options
                    );
                    
                    forecasts[metric] = forecast;
                    confidence[metric] = forecast.confidence;
                    
                    // Generate recommendations based on forecast
                    const metricRecommendations = this.generateForecastRecommendations(
                        metric,
                        forecast,
                        horizon
                    );
                    recommendations.push(...metricRecommendations);
                } catch (error) {
                    logger.error(`Error forecasting ${metric}:`, error);
                    forecasts[metric] = {
                        error: error.message,
                        confidence: 0
                    };
                }
            }

            // Calculate overall confidence
            const overallConfidence = this.calculateOverallConfidence(confidence);

            // Generate cross-metric insights
            const crossMetricInsights = this.generateCrossMetricInsights(forecasts, metrics);

            const result = {
                forecastId,
                projectId,
                metrics,
                horizon,
                forecasts,
                overallConfidence,
                recommendations,
                crossMetricInsights,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            // Store forecast
            this.forecasts.set(forecastId, result);

            return result;
        } catch (error) {
            throw new Error(`Forecast generation failed: ${error.message}`);
        }
    }

    /**
     * Get forecasts for a project
     */
    async getForecasts(projectId, options = {}) {
        try {
            const forecasts = Array.from(this.forecasts.values())
                .filter(forecast => forecast.projectId === projectId);

            if (options.horizon) {
                return forecasts.filter(forecast => forecast.horizon === options.horizon);
            }

            if (options.metrics) {
                return forecasts.filter(forecast => 
                    options.metrics.some(metric => forecast.metrics.includes(metric))
                );
            }

            if (options.includeHistory) {
                return forecasts;
            }

            // Return only recent forecasts
            const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
            return forecasts.filter(forecast => 
                new Date(forecast.timestamp) >= cutoffDate
            );
        } catch (error) {
            throw new Error(`Failed to get forecasts: ${error.message}`);
        }
    }

    /**
     * Forecast resource needs
     */
    async forecastResources(projectId, resourceTypes, horizon, options = {}) {
        try {
            const forecastId = uuidv4();
            const startTime = Date.now();

            const resourceForecast = await this.resourceForecaster.forecastResources(
                projectId,
                resourceTypes,
                horizon,
                options
            );

            const result = {
                forecastId,
                projectId,
                resourceTypes,
                horizon,
                forecast: resourceForecast,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.forecasts.set(forecastId, result);
            return result;
        } catch (error) {
            throw new Error(`Resource forecasting failed: ${error.message}`);
        }
    }

    /**
     * Forecast team capacity
     */
    async forecastCapacity(projectId, teamId, horizon, options = {}) {
        try {
            const forecastId = uuidv4();
            const startTime = Date.now();

            const capacityForecast = await this.capacityForecaster.forecastCapacity(
                projectId,
                teamId,
                horizon,
                options
            );

            const result = {
                forecastId,
                projectId,
                teamId,
                horizon,
                forecast: capacityForecast,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.forecasts.set(forecastId, result);
            return result;
        } catch (error) {
            throw new Error(`Capacity forecasting failed: ${error.message}`);
        }
    }

    /**
     * Forecast demand
     */
    async forecastDemand(projectId, demandTypes, horizon, options = {}) {
        try {
            const forecastId = uuidv4();
            const startTime = Date.now();

            const demandForecast = await this.demandForecaster.forecastDemand(
                projectId,
                demandTypes,
                horizon,
                options
            );

            const result = {
                forecastId,
                projectId,
                demandTypes,
                horizon,
                forecast: demandForecast,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.forecasts.set(forecastId, result);
            return result;
        } catch (error) {
            throw new Error(`Demand forecasting failed: ${error.message}`);
        }
    }

    /**
     * Forecast risks
     */
    async forecastRisks(projectId, riskTypes, horizon, options = {}) {
        try {
            const forecastId = uuidv4();
            const startTime = Date.now();

            const riskForecast = await this.riskForecaster.forecastRisks(
                projectId,
                riskTypes,
                horizon,
                options
            );

            const result = {
                forecastId,
                projectId,
                riskTypes,
                horizon,
                forecast: riskForecast,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.forecasts.set(forecastId, result);
            return result;
        } catch (error) {
            throw new Error(`Risk forecasting failed: ${error.message}`);
        }
    }

    /**
     * Generate scenarios
     */
    async generateScenarios(projectId, scenarios, horizon, options = {}) {
        try {
            const scenarioId = uuidv4();
            const startTime = Date.now();

            const scenarioResults = await this.scenarioPlanner.generateScenarios(
                projectId,
                scenarios,
                horizon,
                options
            );

            const result = {
                scenarioId,
                projectId,
                scenarios,
                horizon,
                results: scenarioResults,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.scenarios.set(scenarioId, result);
            return result;
        } catch (error) {
            throw new Error(`Scenario generation failed: ${error.message}`);
        }
    }

    /**
     * Perform what-if analysis
     */
    async whatIfAnalysis(projectId, assumptions, horizon, options = {}) {
        try {
            const analysisId = uuidv4();
            const startTime = Date.now();

            const analysisResults = await this.whatIfAnalyzer.performAnalysis(
                projectId,
                assumptions,
                horizon,
                options
            );

            const result = {
                analysisId,
                projectId,
                assumptions,
                horizon,
                results: analysisResults,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            return result;
        } catch (error) {
            throw new Error(`What-if analysis failed: ${error.message}`);
        }
    }

    /**
     * Get models
     */
    async getModels(projectId, options = {}) {
        try {
            const models = await this.modelManager.getModels(projectId, options);
            return models;
        } catch (error) {
            throw new Error(`Failed to get models: ${error.message}`);
        }
    }

    /**
     * Train model
     */
    async trainModel(projectId, modelType, data, options = {}) {
        try {
            const modelId = uuidv4();
            const startTime = Date.now();

            const trainingResult = await this.modelManager.trainModel(
                projectId,
                modelType,
                data,
                options
            );

            const result = {
                modelId,
                projectId,
                modelType,
                trainingResult,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.models.set(modelId, result);
            return result;
        } catch (error) {
            throw new Error(`Model training failed: ${error.message}`);
        }
    }

    /**
     * Assess forecast accuracy
     */
    async assessAccuracy(projectId, forecastId, actualData, options = {}) {
        try {
            const assessmentId = uuidv4();
            const startTime = Date.now();

            const accuracyResult = await this.accuracyAssessor.assessAccuracy(
                projectId,
                forecastId,
                actualData,
                options
            );

            const result = {
                assessmentId,
                projectId,
                forecastId,
                accuracy: accuracyResult,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.accuracyReports.set(assessmentId, result);
            return result;
        } catch (error) {
            throw new Error(`Accuracy assessment failed: ${error.message}`);
        }
    }

    /**
     * Get analytics
     */
    async getAnalytics(options = {}) {
        try {
            const analytics = {
                totalForecasts: this.forecasts.size,
                totalModels: this.models.size,
                totalScenarios: this.scenarios.size,
                totalAccuracyReports: this.accuracyReports.size,
                timestamp: new Date().toISOString()
            };

            if (options.projectId) {
                const projectForecasts = Array.from(this.forecasts.values())
                    .filter(forecast => forecast.projectId === options.projectId);
                
                analytics.projectForecasts = projectForecasts.length;
                analytics.projectModels = Array.from(this.models.values())
                    .filter(model => model.projectId === options.projectId).length;
            }

            if (options.startDate && options.endDate) {
                const startDate = new Date(options.startDate);
                const endDate = new Date(options.endDate);
                
                analytics.forecastsInRange = Array.from(this.forecasts.values())
                    .filter(forecast => {
                        const forecastDate = new Date(forecast.timestamp);
                        return forecastDate >= startDate && forecastDate <= endDate;
                    }).length;
            }

            return analytics;
        } catch (error) {
            throw new Error(`Failed to get analytics: ${error.message}`);
        }
    }

    /**
     * Get system status
     */
    async getSystemStatus() {
        try {
            const status = {
                isRunning: true,
                totalForecasts: this.forecasts.size,
                totalModels: this.models.size,
                totalScenarios: this.scenarios.size,
                totalAccuracyReports: this.accuracyReports.size,
                uptime: process.uptime(),
                lastUpdate: new Date().toISOString(),
                memoryUsage: process.memoryUsage(),
                version: '2.4.0',
                components: {
                    forecastingEngine: this.forecastingEngine.getSystemStatus(),
                    resourceForecaster: this.resourceForecaster.getSystemStatus(),
                    capacityForecaster: this.capacityForecaster.getSystemStatus(),
                    demandForecaster: this.demandForecaster.getSystemStatus(),
                    riskForecaster: this.riskForecaster.getSystemStatus(),
                    scenarioPlanner: this.scenarioPlanner.getSystemStatus(),
                    whatIfAnalyzer: this.whatIfAnalyzer.getSystemStatus(),
                    modelManager: this.modelManager.getSystemStatus(),
                    accuracyAssessor: this.accuracyAssessor.getSystemStatus()
                }
            };

            return status;
        } catch (error) {
            throw new Error(`Failed to get system status: ${error.message}`);
        }
    }

    /**
     * Helper methods
     */
    calculateOverallConfidence(confidence) {
        const values = Object.values(confidence).filter(c => typeof c === 'number');
        if (values.length === 0) return 0;
        
        return values.reduce((sum, conf) => sum + conf, 0) / values.length;
    }

    generateForecastRecommendations(metric, forecast, horizon) {
        const recommendations = [];

        if (forecast.confidence < 0.5) {
            recommendations.push({
                type: 'confidence',
                metric,
                message: `Low confidence forecast for ${metric}. Consider gathering more data.`,
                priority: 'medium'
            });
        }

        if (forecast.trend && forecast.trend.direction === 'increasing') {
            recommendations.push({
                type: 'trend',
                metric,
                message: `${metric} is forecasted to increase. Plan for resource scaling.`,
                priority: 'high'
            });
        }

        if (forecast.anomalies && forecast.anomalies.length > 0) {
            recommendations.push({
                type: 'anomaly',
                metric,
                message: `Forecasted anomalies detected in ${metric}. Monitor closely.`,
                priority: 'high'
            });
        }

        return recommendations;
    }

    generateCrossMetricInsights(forecasts, metrics) {
        const insights = [];

        // Find correlations between forecasts
        const forecastValues = Object.entries(forecasts)
            .filter(([_, forecast]) => forecast.values && forecast.values.length > 0)
            .map(([metric, forecast]) => ({
                metric,
                values: forecast.values,
                trend: forecast.trend
            }));

        if (forecastValues.length > 1) {
            // Simple correlation analysis
            for (let i = 0; i < forecastValues.length; i++) {
                for (let j = i + 1; j < forecastValues.length; j++) {
                    const corr = this.calculateCorrelation(
                        forecastValues[i].values,
                        forecastValues[j].values
                    );
                    
                    if (Math.abs(corr) > 0.7) {
                        insights.push({
                            type: 'correlation',
                            metrics: [forecastValues[i].metric, forecastValues[j].metric],
                            correlation: corr,
                            message: `Strong correlation detected between ${forecastValues[i].metric} and ${forecastValues[j].metric}`,
                            priority: 'medium'
                        });
                    }
                }
            }
        }

        return insights;
    }

    calculateCorrelation(values1, values2) {
        if (values1.length !== values2.length || values1.length < 2) return 0;
        
        const n = values1.length;
        const sum1 = values1.reduce((sum, val) => sum + val, 0);
        const sum2 = values2.reduce((sum, val) => sum + val, 0);
        const sum1Sq = values1.reduce((sum, val) => sum + val * val, 0);
        const sum2Sq = values2.reduce((sum, val) => sum + val * val, 0);
        const sumProduct = values1.reduce((sum, val, i) => sum + val * values2[i], 0);
        
        const numerator = n * sumProduct - sum1 * sum2;
        const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Initialize background processes
     */
    initializeBackgroundProcesses() {
        // Clean up old forecasts every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000);

        // Update model accuracy every 6 hours
        setInterval(() => {
            this.updateModelAccuracy();
        }, 6 * 60 * 60 * 1000);

        // Retrain models daily
        setInterval(() => {
            this.retrainModels();
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * Clean up old data
     */
    cleanupOldData() {
        const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        // Clean up old forecasts
        for (const [id, forecast] of this.forecasts.entries()) {
            if (new Date(forecast.timestamp) < cutoffDate) {
                this.forecasts.delete(id);
            }
        }

        // Clean up old scenarios
        for (const [id, scenario] of this.scenarios.entries()) {
            if (new Date(scenario.timestamp) < cutoffDate) {
                this.scenarios.delete(id);
            }
        }

        // Clean up old accuracy reports
        for (const [id, report] of this.accuracyReports.entries()) {
            if (new Date(report.timestamp) < cutoffDate) {
                this.accuracyReports.delete(id);
            }
        }
    }

    /**
     * Update model accuracy
     */
    updateModelAccuracy() {
        // This would typically update model accuracy based on recent forecasts
        console.log('Updating model accuracy...');
    }

    /**
     * Retrain models
     */
    retrainModels() {
        // This would typically retrain models with new data
        console.log('Retraining models...');
    }
}

module.exports = IntegratedForecastingSystem;
