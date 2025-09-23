const ss = require('simple-statistics');
const regression = require('regression');

/**
 * Resource Forecaster v2.4
 * Specialized forecasting for resource needs and allocation
 */
class ResourceForecaster {
    constructor(options = {}) {
        this.options = {
            defaultHorizon: '30d',
            minDataPoints: 20,
            confidenceThreshold: 0.8,
            ...options
        };
        
        this.resourceForecasts = new Map();
        this.resourceModels = new Map();
    }

    /**
     * Forecast resource needs
     */
    async forecastResources(projectId, resourceTypes, horizon, options = {}) {
        try {
            const forecastId = this.generateId();
            const startTime = Date.now();

            const forecasts = {};
            const recommendations = [];
            const confidence = {};

            for (const resourceType of resourceTypes) {
                try {
                    const resourceForecast = await this.forecastResourceType(
                        projectId,
                        resourceType,
                        horizon,
                        options
                    );
                    
                    forecasts[resourceType] = resourceForecast;
                    confidence[resourceType] = resourceForecast.confidence;
                    
                    // Generate resource-specific recommendations
                    const resourceRecommendations = this.generateResourceRecommendations(
                        resourceType,
                        resourceForecast,
                        horizon
                    );
                    recommendations.push(...resourceRecommendations);
                } catch (error) {
                    console.error(`Error forecasting ${resourceType}:`, error);
                    forecasts[resourceType] = {
                        error: error.message,
                        confidence: 0
                    };
                }
            }

            // Calculate overall confidence
            const overallConfidence = this.calculateOverallConfidence(confidence);

            // Generate resource allocation insights
            const allocationInsights = this.generateAllocationInsights(forecasts, resourceTypes);

            const result = {
                forecastId,
                projectId,
                resourceTypes,
                horizon,
                forecasts,
                overallConfidence,
                recommendations,
                allocationInsights,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.resourceForecasts.set(forecastId, result);
            return result;
        } catch (error) {
            throw new Error(`Resource forecasting failed: ${error.message}`);
        }
    }

    /**
     * Forecast specific resource type
     */
    async forecastResourceType(projectId, resourceType, horizon, options = {}) {
        // Get historical resource data
        const data = await this.getResourceData(projectId, resourceType, options.timeRange);
        
        if (data.length < this.options.minDataPoints) {
            throw new Error(`Insufficient data for ${resourceType}. Minimum required: ${this.options.minDataPoints}`);
        }

        // Select appropriate forecasting method for resource type
        const method = this.selectResourceMethod(resourceType, data, options);
        
        // Generate forecast
        const forecast = await this.generateResourceForecast(data, horizon, method, options);
        
        // Calculate resource-specific metrics
        const resourceMetrics = this.calculateResourceMetrics(forecast, data, resourceType);
        
        // Generate resource insights
        const insights = this.generateResourceInsights(forecast, data, resourceType, horizon);

        return {
            resourceType,
            method,
            forecast: forecast.values,
            confidence: forecast.confidence,
            metrics: resourceMetrics,
            insights,
            parameters: forecast.parameters
        };
    }

    /**
     * Generate resource forecast
     */
    async generateResourceForecast(data, horizon, method, options = {}) {
        const values = data.map(d => d.value);
        const timestamps = data.map(d => new Date(d.timestamp));

        let forecast;
        switch (method) {
            case 'linear':
                forecast = this.linearResourceForecast(values, horizon, options);
                break;
            case 'exponential':
                forecast = this.exponentialResourceForecast(values, horizon, options);
                break;
            case 'seasonal':
                forecast = this.seasonalResourceForecast(values, timestamps, horizon, options);
                break;
            case 'capacity_based':
                forecast = this.capacityBasedForecast(values, horizon, options);
                break;
            case 'demand_driven':
                forecast = this.demandDrivenForecast(values, horizon, options);
                break;
            default:
                forecast = this.linearResourceForecast(values, horizon, options);
        }

        return forecast;
    }

    /**
     * Linear resource forecast
     */
    linearResourceForecast(values, horizon, options = {}) {
        const xValues = values.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );

        const slope = regressionResult.equation[0];
        const intercept = regressionResult.equation[1];
        const rSquared = regressionResult.r2;

        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            const x = values.length + i;
            const predicted = slope * x + intercept;
            forecast.push(Math.max(0, predicted)); // Ensure non-negative values

            const confidenceScore = rSquared * 0.9; // Slightly lower for resources
            confidence.push(Math.max(0, Math.min(1, confidenceScore)));
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'linear',
            parameters: { slope, intercept, rSquared },
            trend: {
                direction: slope > 0 ? 'increasing' : 'decreasing',
                strength: Math.abs(slope)
            }
        };
    }

    /**
     * Exponential resource forecast
     */
    exponentialResourceForecast(values, horizon, options = {}) {
        const logValues = values.map(v => Math.log(Math.max(v, 0.001)));
        const xValues = values.map((_, i) => i);
        
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, logValues[i]])
        );

        const slope = regressionResult.equation[0];
        const intercept = regressionResult.equation[1];
        const rSquared = regressionResult.r2;

        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            const x = values.length + i;
            const logPredicted = slope * x + intercept;
            const predicted = Math.exp(logPredicted);
            forecast.push(Math.max(0, predicted));

            const confidenceScore = rSquared * 0.8; // Lower confidence for exponential
            confidence.push(Math.max(0, Math.min(1, confidenceScore)));
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'exponential',
            parameters: { slope, intercept, rSquared },
            trend: {
                direction: slope > 0 ? 'increasing' : 'decreasing',
                strength: Math.abs(slope)
            }
        };
    }

    /**
     * Seasonal resource forecast
     */
    seasonalResourceForecast(values, timestamps, horizon, options = {}) {
        const seasonalPeriod = this.detectSeasonalPeriod(values);
        
        if (seasonalPeriod < 2) {
            return this.linearResourceForecast(values, horizon, options);
        }

        const decomposition = this.decomposeTimeSeries(values, timestamps, seasonalPeriod);
        
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            const trendValue = this.extendTrend(decomposition.trend, i + 1);
            const seasonalIndex = (decomposition.trend.length + i) % decomposition.seasonal.length;
            const seasonalValue = decomposition.seasonal[seasonalIndex];
            
            const predicted = Math.max(0, trendValue + seasonalValue);
            forecast.push(predicted);

            const seasonalStrength = this.calculateSeasonalStrength(decomposition.seasonal);
            confidence.push(Math.max(0.6, seasonalStrength));
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'seasonal',
            parameters: {
                seasonalPeriod,
                seasonalStrength: this.calculateSeasonalStrength(decomposition.seasonal)
            },
            trend: {
                direction: this.calculateTrendDirection(decomposition.trend),
                strength: this.calculateTrendStrength(decomposition.trend)
            }
        };
    }

    /**
     * Capacity-based forecast
     */
    capacityBasedForecast(values, horizon, options = {}) {
        const capacity = options.capacity || Math.max(...values) * 1.2;
        const utilization = values.map(v => v / capacity);
        
        const xValues = values.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, utilization[i]])
        );

        const slope = regressionResult.equation[0];
        const intercept = regressionResult.equation[1];

        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            const x = values.length + i;
            const predictedUtilization = slope * x + intercept;
            const predicted = Math.max(0, Math.min(capacity, predictedUtilization * capacity));
            forecast.push(predicted);

            // Confidence based on how close to capacity
            const capacityConfidence = 1 - Math.abs(predictedUtilization - 0.8) / 0.8;
            confidence.push(Math.max(0.5, capacityConfidence));
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'capacity_based',
            parameters: { capacity, slope, intercept },
            trend: {
                direction: slope > 0 ? 'increasing' : 'decreasing',
                strength: Math.abs(slope)
            }
        };
    }

    /**
     * Demand-driven forecast
     */
    demandDrivenForecast(values, horizon, options = {}) {
        const demandData = options.demandData || values;
        const correlation = this.calculateCorrelation(values, demandData);
        
        if (Math.abs(correlation) < 0.3) {
            return this.linearResourceForecast(values, horizon, options);
        }

        // Forecast based on demand correlation
        const demandForecast = this.linearResourceForecast(demandData, horizon, options);
        const resourceForecast = demandForecast.values.map(v => v * correlation);

        return {
            values: resourceForecast,
            confidence: demandForecast.confidence * Math.abs(correlation),
            method: 'demand_driven',
            parameters: { correlation, demandForecast: demandForecast.parameters },
            trend: demandForecast.trend
        };
    }

    /**
     * Select appropriate method for resource type
     */
    selectResourceMethod(resourceType, data, options = {}) {
        if (options.method) {
            return options.method;
        }

        const values = data.map(d => d.value);
        
        // Resource-specific method selection
        switch (resourceType.toLowerCase()) {
            case 'cpu':
            case 'memory':
            case 'storage':
                return 'capacity_based';
            case 'bandwidth':
            case 'api_calls':
                return 'demand_driven';
            case 'users':
            case 'sessions':
                return 'exponential';
            case 'requests':
            case 'transactions':
                return 'seasonal';
            default:
                return 'linear';
        }
    }

    /**
     * Calculate resource-specific metrics
     */
    calculateResourceMetrics(forecast, data, resourceType) {
        const values = data.map(d => d.value);
        const forecastValues = forecast.values;
        
        const metrics = {
            currentUtilization: ss.mean(values),
            peakUtilization: Math.max(...values),
            forecastedUtilization: ss.mean(forecastValues),
            forecastedPeak: Math.max(...forecastValues),
            growthRate: this.calculateGrowthRate(values, forecastValues),
            efficiency: this.calculateEfficiency(values, resourceType)
        };

        return metrics;
    }

    /**
     * Generate resource recommendations
     */
    generateResourceRecommendations(resourceType, forecast, horizon) {
        const recommendations = [];

        // Capacity recommendations
        if (forecast.metrics) {
            const currentUtilization = forecast.metrics.currentUtilization;
            const forecastedUtilization = forecast.metrics.forecastedUtilization;
            
            if (forecastedUtilization > currentUtilization * 1.2) {
                recommendations.push({
                    type: 'capacity',
                    resourceType,
                    message: `${resourceType} utilization is forecasted to increase significantly. Consider scaling up.`,
                    priority: 'high',
                    action: 'scale_up'
                });
            } else if (forecastedUtilization < currentUtilization * 0.8) {
                recommendations.push({
                    type: 'capacity',
                    resourceType,
                    message: `${resourceType} utilization is forecasted to decrease. Consider scaling down.`,
                    priority: 'medium',
                    action: 'scale_down'
                });
            }
        }

        // Trend recommendations
        if (forecast.trend) {
            if (forecast.trend.direction === 'increasing' && forecast.trend.strength > 0.5) {
                recommendations.push({
                    type: 'trend',
                    resourceType,
                    message: `${resourceType} shows strong increasing trend. Plan for capacity expansion.`,
                    priority: 'high',
                    action: 'plan_expansion'
                });
            }
        }

        // Confidence recommendations
        if (forecast.confidence < 0.6) {
            recommendations.push({
                type: 'confidence',
                resourceType,
                message: `Low confidence forecast for ${resourceType}. Monitor closely and gather more data.`,
                priority: 'medium',
                action: 'monitor'
            });
        }

        return recommendations;
    }

    /**
     * Generate allocation insights
     */
    generateAllocationInsights(forecasts, resourceTypes) {
        const insights = [];

        // Resource correlation insights
        const resourceValues = Object.entries(forecasts)
            .filter(([_, forecast]) => forecast.forecast && forecast.forecast.length > 0)
            .map(([type, forecast]) => ({
                type,
                values: forecast.forecast,
                utilization: forecast.metrics?.forecastedUtilization || 0
            }));

        if (resourceValues.length > 1) {
            for (let i = 0; i < resourceValues.length; i++) {
                for (let j = i + 1; j < resourceValues.length; j++) {
                    const corr = this.calculateCorrelation(
                        resourceValues[i].values,
                        resourceValues[j].values
                    );
                    
                    if (Math.abs(corr) > 0.7) {
                        insights.push({
                            type: 'correlation',
                            resources: [resourceValues[i].type, resourceValues[j].type],
                            correlation: corr,
                            message: `Strong correlation between ${resourceValues[i].type} and ${resourceValues[j].type} utilization`
                        });
                    }
                }
            }
        }

        // Resource balance insights
        const utilizations = resourceValues.map(r => r.utilization);
        const maxUtilization = Math.max(...utilizations);
        const minUtilization = Math.min(...utilizations);
        
        if (maxUtilization - minUtilization > 0.3) {
            insights.push({
                type: 'balance',
                message: 'Significant imbalance in resource utilization. Consider rebalancing.',
                maxUtilization,
                minUtilization,
                imbalance: maxUtilization - minUtilization
            });
        }

        return insights;
    }

    /**
     * Helper methods
     */
    async getResourceData(projectId, resourceType, timeRange = '90d') {
        // This would typically fetch from database
        // For now, return mock data
        return this.generateMockResourceData(projectId, resourceType, timeRange);
    }

    generateMockResourceData(projectId, resourceType, timeRange) {
        const data = [];
        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            // Generate resource-specific mock data
            let baseValue, trend, seasonality, noise;
            
            switch (resourceType.toLowerCase()) {
                case 'cpu':
                    baseValue = 50 + Math.sin(i * 0.1) * 20;
                    trend = i * 0.3;
                    seasonality = Math.sin(i * 2 * Math.PI / 7) * 10; // Weekly pattern
                    noise = (Math.random() - 0.5) * 5;
                    break;
                case 'memory':
                    baseValue = 60 + Math.sin(i * 0.05) * 15;
                    trend = i * 0.2;
                    seasonality = Math.cos(i * 2 * Math.PI / 7) * 8;
                    noise = (Math.random() - 0.5) * 3;
                    break;
                case 'storage':
                    baseValue = 40 + i * 0.5; // Growing storage
                    trend = i * 0.1;
                    seasonality = 0;
                    noise = (Math.random() - 0.5) * 2;
                    break;
                default:
                    baseValue = 50 + Math.sin(i * 0.1) * 15;
                    trend = i * 0.2;
                    seasonality = Math.sin(i * 2 * Math.PI / 7) * 5;
                    noise = (Math.random() - 0.5) * 4;
            }
            
            const value = Math.max(0, Math.min(100, baseValue + trend + seasonality + noise));

            data.push({
                projectId,
                resourceType,
                value,
                timestamp: date.toISOString()
            });
        }

        return data;
    }

    calculateOverallConfidence(confidence) {
        const values = Object.values(confidence).filter(c => typeof c === 'number');
        if (values.length === 0) return 0;
        
        return values.reduce((sum, conf) => sum + conf, 0) / values.length;
    }

    detectSeasonalPeriod(values) {
        if (values.length < 14) return 0;
        
        const autocorrelations = this.calculateAutocorrelations(values);
        const peaks = this.findPeaks(autocorrelations);
        return peaks.length > 0 ? peaks[0].lag : 0;
    }

    calculateAutocorrelations(values) {
        const n = values.length;
        const mean = ss.mean(values);
        const centered = values.map(v => v - mean);
        const autocorrelations = [];

        for (let lag = 1; lag < Math.min(n / 2, 20); lag++) {
            let numerator = 0;
            let denominator = 0;

            for (let i = lag; i < n; i++) {
                numerator += centered[i] * centered[i - lag];
                denominator += centered[i] * centered[i];
            }

            const autocorr = denominator > 0 ? numerator / denominator : 0;
            autocorrelations.push({ lag, value: autocorr });
        }

        return autocorrelations;
    }

    findPeaks(autocorrelations) {
        const peaks = [];
        
        for (let i = 1; i < autocorrelations.length - 1; i++) {
            const prev = autocorrelations[i - 1].value;
            const curr = autocorrelations[i].value;
            const next = autocorrelations[i + 1].value;

            if (curr > prev && curr > next && curr > 0.2) {
                peaks.push(autocorrelations[i]);
            }
        }

        return peaks.sort((a, b) => b.value - a.value);
    }

    decomposeTimeSeries(values, timestamps, seasonalPeriod = 7) {
        const n = values.length;
        const xValues = values.map((_, i) => i);
        
        const trendRegression = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );
        const trend = xValues.map(x => trendRegression.equation[0] * x + trendRegression.equation[1]);
        
        const detrended = values.map((v, i) => v - trend[i]);
        const seasonal = this.calculateSeasonalComponent(detrended, seasonalPeriod);
        
        return {
            trend,
            seasonal,
            residual: detrended.map((v, i) => v - seasonal[i % seasonal.length])
        };
    }

    calculateSeasonalComponent(values, period) {
        const seasonal = new Array(period).fill(0);
        const counts = new Array(period).fill(0);

        values.forEach((value, index) => {
            const periodIndex = index % period;
            seasonal[periodIndex] += value;
            counts[periodIndex]++;
        });

        return seasonal.map((sum, index) => sum / counts[index]);
    }

    extendTrend(trend, steps) {
        if (trend.length < 2) return trend[trend.length - 1] || 0;
        
        const xValues = trend.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, trend[i]])
        );
        
        const slope = regressionResult.equation[0];
        const intercept = regressionResult.equation[1];
        
        return slope * (trend.length + steps - 1) + intercept;
    }

    calculateSeasonalStrength(seasonal) {
        const mean = ss.mean(seasonal);
        const variance = ss.variance(seasonal);
        return variance / (mean * mean + variance);
    }

    calculateTrendDirection(trend) {
        if (trend.length < 2) return 'stable';
        
        const xValues = trend.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, trend[i]])
        );
        
        const slope = regressionResult.equation[0];
        if (slope > 0.01) return 'increasing';
        if (slope < -0.01) return 'decreasing';
        return 'stable';
    }

    calculateTrendStrength(trend) {
        if (trend.length < 2) return 0;
        
        const xValues = trend.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, trend[i]])
        );
        
        return Math.abs(regressionResult.equation[0]);
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

    calculateGrowthRate(historical, forecast) {
        const historicalMean = ss.mean(historical);
        const forecastMean = ss.mean(forecast);
        return (forecastMean - historicalMean) / historicalMean;
    }

    calculateEfficiency(values, resourceType) {
        // Calculate efficiency based on resource type
        const mean = ss.mean(values);
        const std = ss.standardDeviation(values);
        const coefficient = std / mean;
        
        // Lower coefficient means more efficient (less variation)
        return Math.max(0, 1 - coefficient);
    }

    generateResourceInsights(forecast, data, resourceType, horizon) {
        const insights = [];

        if (forecast.metrics) {
            const efficiency = forecast.metrics.efficiency;
            if (efficiency < 0.5) {
                insights.push({
                    type: 'efficiency',
                    message: `${resourceType} shows low efficiency. Consider optimization.`,
                    efficiency,
                    priority: 'medium'
                });
            }
        }

        if (forecast.trend && forecast.trend.direction === 'increasing') {
            insights.push({
                type: 'trend',
                message: `${resourceType} shows increasing trend. Monitor for capacity limits.`,
                trend: forecast.trend,
                priority: 'high'
            });
        }

        return insights;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    getSystemStatus() {
        return {
            isRunning: true,
            totalForecasts: this.resourceForecasts.size,
            modelsLoaded: this.resourceModels.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = ResourceForecaster;
