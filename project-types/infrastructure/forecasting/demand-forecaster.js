const ss = require('simple-statistics');
const regression = require('regression');

/**
 * Demand Forecaster v2.4
 * Specialized forecasting for demand patterns and user needs
 */
class DemandForecaster {
    constructor(options = {}) {
        this.options = {
            defaultHorizon: '30d',
            minDataPoints: 20,
            confidenceThreshold: 0.8,
            ...options
        };
        
        this.demandForecasts = new Map();
        this.demandModels = new Map();
    }

    /**
     * Forecast demand
     */
    async forecastDemand(projectId, demandTypes, horizon, options = {}) {
        try {
            const forecastId = this.generateId();
            const startTime = Date.now();

            const forecasts = {};
            const recommendations = [];
            const confidence = {};

            for (const demandType of demandTypes) {
                try {
                    const demandForecast = await this.forecastDemandType(
                        projectId,
                        demandType,
                        horizon,
                        options
                    );
                    
                    forecasts[demandType] = demandForecast;
                    confidence[demandType] = demandForecast.confidence;
                    
                    // Generate demand-specific recommendations
                    const demandRecommendations = this.generateDemandRecommendations(
                        demandType,
                        demandForecast,
                        horizon
                    );
                    recommendations.push(...demandRecommendations);
                } catch (error) {
                    console.error(`Error forecasting ${demandType}:`, error);
                    forecasts[demandType] = {
                        error: error.message,
                        confidence: 0
                    };
                }
            }

            // Calculate overall confidence
            const overallConfidence = this.calculateOverallConfidence(confidence);

            // Generate demand insights
            const demandInsights = this.generateDemandInsights(forecasts, demandTypes);

            const result = {
                forecastId,
                projectId,
                demandTypes,
                horizon,
                forecasts,
                overallConfidence,
                recommendations,
                demandInsights,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.demandForecasts.set(forecastId, result);
            return result;
        } catch (error) {
            throw new Error(`Demand forecasting failed: ${error.message}`);
        }
    }

    /**
     * Forecast specific demand type
     */
    async forecastDemandType(projectId, demandType, horizon, options = {}) {
        // Get historical demand data
        const data = await this.getDemandData(projectId, demandType, options.timeRange);
        
        if (data.length < this.options.minDataPoints) {
            throw new Error(`Insufficient data for ${demandType}. Minimum required: ${this.options.minDataPoints}`);
        }

        // Select appropriate forecasting method for demand type
        const method = this.selectDemandMethod(demandType, data, options);
        
        // Generate forecast
        const forecast = await this.generateDemandForecast(data, horizon, method, options);
        
        // Calculate demand-specific metrics
        const demandMetrics = this.calculateDemandMetrics(forecast, data, demandType);
        
        // Generate demand insights
        const insights = this.generateDemandInsights(forecast, data, demandType, horizon);

        return {
            demandType,
            method,
            forecast: forecast.values,
            confidence: forecast.confidence,
            metrics: demandMetrics,
            insights,
            parameters: forecast.parameters
        };
    }

    /**
     * Generate demand forecast
     */
    async generateDemandForecast(data, horizon, method, options = {}) {
        const values = data.map(d => d.value);
        const timestamps = data.map(d => new Date(d.timestamp));

        let forecast;
        switch (method) {
            case 'linear':
                forecast = this.linearDemandForecast(values, horizon, options);
                break;
            case 'exponential':
                forecast = this.exponentialDemandForecast(values, horizon, options);
                break;
            case 'seasonal':
                forecast = this.seasonalDemandForecast(values, timestamps, horizon, options);
                break;
            case 'growth_curve':
                forecast = this.growthCurveForecast(values, horizon, options);
                break;
            case 'market_driven':
                forecast = this.marketDrivenForecast(values, horizon, options);
                break;
            case 'user_behavior':
                forecast = this.userBehaviorForecast(values, horizon, options);
                break;
            default:
                forecast = this.linearDemandForecast(values, horizon, options);
        }

        return forecast;
    }

    /**
     * Linear demand forecast
     */
    linearDemandForecast(values, horizon, options = {}) {
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
            forecast.push(Math.max(0, predicted));

            const confidenceScore = rSquared * 0.9;
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
     * Exponential demand forecast
     */
    exponentialDemandForecast(values, horizon, options = {}) {
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

            const confidenceScore = rSquared * 0.8;
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
     * Seasonal demand forecast
     */
    seasonalDemandForecast(values, timestamps, horizon, options = {}) {
        const seasonalPeriod = this.detectSeasonalPeriod(values);
        
        if (seasonalPeriod < 2) {
            return this.linearDemandForecast(values, horizon, options);
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
     * Growth curve forecast
     */
    growthCurveForecast(values, horizon, options = {}) {
        // S-curve growth model
        const maxValue = Math.max(...values) * 1.5; // Assume 50% growth potential
        const growthRate = this.calculateGrowthRate(values);
        const inflectionPoint = this.findInflectionPoint(values);
        
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            const x = values.length + i;
            const predicted = maxValue / (1 + Math.exp(-growthRate * (x - inflectionPoint)));
            forecast.push(Math.max(0, predicted));

            // Confidence decreases as we move further from inflection point
            const distanceFromInflection = Math.abs(x - inflectionPoint);
            const confidenceScore = Math.max(0.5, 1 - distanceFromInflection / 50);
            confidence.push(confidenceScore);
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'growth_curve',
            parameters: { maxValue, growthRate, inflectionPoint },
            trend: {
                direction: 'increasing',
                strength: growthRate
            }
        };
    }

    /**
     * Market-driven forecast
     */
    marketDrivenForecast(values, horizon, options = {}) {
        const marketData = options.marketData || values;
        const correlation = this.calculateCorrelation(values, marketData);
        
        if (Math.abs(correlation) < 0.3) {
            return this.linearDemandForecast(values, horizon, options);
        }

        const marketForecast = this.linearDemandForecast(marketData, horizon, options);
        const demandForecast = marketForecast.values.map(v => v * correlation);

        return {
            values: demandForecast,
            confidence: marketForecast.confidence * Math.abs(correlation),
            method: 'market_driven',
            parameters: { correlation, marketForecast: marketForecast.parameters },
            trend: marketForecast.trend
        };
    }

    /**
     * User behavior forecast
     */
    userBehaviorForecast(values, horizon, options = {}) {
        const behaviorData = options.behaviorData || values;
        const userSegments = options.userSegments || ['new', 'returning', 'premium'];
        
        // Forecast for each user segment
        const segmentForecasts = {};
        userSegments.forEach(segment => {
            const segmentData = behaviorData.filter(d => d.segment === segment);
            if (segmentData.length > 0) {
                const segmentValues = segmentData.map(d => d.value);
                const segmentForecast = this.linearDemandForecast(segmentValues, horizon, options);
                segmentForecasts[segment] = segmentForecast;
            }
        });

        // Combine segment forecasts
        const combinedForecast = [];
        const combinedConfidence = [];

        for (let i = 0; i < horizon; i++) {
            let totalDemand = 0;
            let totalConfidence = 0;
            let segmentCount = 0;

            Object.values(segmentForecasts).forEach(forecast => {
                if (forecast.values[i] !== undefined) {
                    totalDemand += forecast.values[i];
                    totalConfidence += forecast.confidence;
                    segmentCount++;
                }
            });

            combinedForecast.push(totalDemand);
            combinedConfidence.push(segmentCount > 0 ? totalConfidence / segmentCount : 0.5);
        }

        return {
            values: combinedForecast,
            confidence: ss.mean(combinedConfidence),
            method: 'user_behavior',
            parameters: { userSegments, segmentForecasts },
            trend: {
                direction: 'adaptive',
                strength: 0.6
            }
        };
    }

    /**
     * Select appropriate method for demand type
     */
    selectDemandMethod(demandType, data, options = {}) {
        if (options.method) {
            return options.method;
        }

        const values = data.map(d => d.value);
        
        // Demand-specific method selection
        switch (demandType.toLowerCase()) {
            case 'users':
            case 'registrations':
                return 'exponential';
            case 'api_calls':
            case 'requests':
                return 'seasonal';
            case 'revenue':
            case 'sales':
                return 'growth_curve';
            case 'market_share':
            case 'adoption':
                return 'market_driven';
            case 'engagement':
            case 'activity':
                return 'user_behavior';
            default:
                return 'linear';
        }
    }

    /**
     * Calculate demand-specific metrics
     */
    calculateDemandMetrics(forecast, data, demandType) {
        const values = data.map(d => d.value);
        const forecastValues = forecast.values;
        
        const metrics = {
            currentDemand: ss.mean(values),
            peakDemand: Math.max(...values),
            forecastedDemand: ss.mean(forecastValues),
            forecastedPeak: Math.max(...forecastValues),
            growthRate: this.calculateGrowthRate(values, forecastValues),
            demandVolatility: this.calculateDemandVolatility(values),
            marketPenetration: this.calculateMarketPenetration(forecastValues, demandType)
        };

        return metrics;
    }

    /**
     * Generate demand recommendations
     */
    generateDemandRecommendations(demandType, forecast, horizon) {
        const recommendations = [];

        // Growth recommendations
        if (forecast.metrics) {
            const growthRate = forecast.metrics.growthRate;
            
            if (growthRate > 0.2) {
                recommendations.push({
                    type: 'growth',
                    demandType,
                    message: `High growth rate (${(growthRate * 100).toFixed(1)}%) for ${demandType}. Plan for scaling.`,
                    priority: 'high',
                    action: 'scale_up',
                    growthRate
                });
            } else if (growthRate < -0.1) {
                recommendations.push({
                    type: 'decline',
                    demandType,
                    message: `Declining demand (${(growthRate * 100).toFixed(1)}%) for ${demandType}. Investigate causes.`,
                    priority: 'high',
                    action: 'investigate',
                    growthRate
                });
            }
        }

        // Volatility recommendations
        if (forecast.metrics && forecast.metrics.demandVolatility > 0.3) {
            recommendations.push({
                type: 'volatility',
                demandType,
                message: `High volatility in ${demandType} demand. Consider demand smoothing strategies.`,
                priority: 'medium',
                action: 'smooth_demand',
                volatility: forecast.metrics.demandVolatility
            });
        }

        // Market penetration recommendations
        if (forecast.metrics && forecast.metrics.marketPenetration < 0.1) {
            recommendations.push({
                type: 'penetration',
                demandType,
                message: `Low market penetration for ${demandType}. Consider marketing strategies.`,
                priority: 'medium',
                action: 'marketing',
                penetration: forecast.metrics.marketPenetration
            });
        }

        return recommendations;
    }

    /**
     * Generate demand insights
     */
    generateDemandInsights(forecasts, demandTypes) {
        const insights = [];

        // Demand correlation insights
        const demandValues = Object.entries(forecasts)
            .filter(([_, forecast]) => forecast.forecast && forecast.forecast.length > 0)
            .map(([type, forecast]) => ({
                type,
                values: forecast.forecast,
                growthRate: forecast.metrics?.growthRate || 0
            }));

        if (demandValues.length > 1) {
            for (let i = 0; i < demandValues.length; i++) {
                for (let j = i + 1; j < demandValues.length; j++) {
                    const corr = this.calculateCorrelation(
                        demandValues[i].values,
                        demandValues[j].values
                    );
                    
                    if (Math.abs(corr) > 0.7) {
                        insights.push({
                            type: 'correlation',
                            demands: [demandValues[i].type, demandValues[j].type],
                            correlation: corr,
                            message: `Strong correlation between ${demandValues[i].type} and ${demandValues[j].type} demand`
                        });
                    }
                }
            }
        }

        // Growth pattern insights
        const growthRates = demandValues.map(d => d.growthRate);
        const avgGrowthRate = ss.mean(growthRates);
        
        if (avgGrowthRate > 0.1) {
            insights.push({
                type: 'growth_pattern',
                message: 'Overall positive growth pattern across all demand types',
                averageGrowthRate: avgGrowthRate,
                priority: 'positive'
            });
        } else if (avgGrowthRate < -0.05) {
            insights.push({
                type: 'growth_pattern',
                message: 'Overall declining pattern across demand types. Review strategy.',
                averageGrowthRate: avgGrowthRate,
                priority: 'negative'
            });
        }

        return insights;
    }

    /**
     * Helper methods
     */
    async getDemandData(projectId, demandType, timeRange = '90d') {
        // This would typically fetch from database
        return this.generateMockDemandData(projectId, demandType, timeRange);
    }

    generateMockDemandData(projectId, demandType, timeRange) {
        const data = [];
        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            // Generate demand-specific mock data
            let baseValue, trend, seasonality, noise;
            
            switch (demandType.toLowerCase()) {
                case 'users':
                    baseValue = 1000 + i * 10; // Growing user base
                    trend = i * 5;
                    seasonality = Math.sin(i * 2 * Math.PI / 7) * 50; // Weekly pattern
                    noise = (Math.random() - 0.5) * 20;
                    break;
                case 'api_calls':
                    baseValue = 5000 + Math.sin(i * 0.1) * 1000;
                    trend = i * 20;
                    seasonality = Math.sin(i * 2 * Math.PI / 7) * 500; // Weekly pattern
                    noise = (Math.random() - 0.5) * 100;
                    break;
                case 'revenue':
                    baseValue = 10000 + i * 100; // Growing revenue
                    trend = i * 50;
                    seasonality = Math.cos(i * 2 * Math.PI / 30) * 1000; // Monthly pattern
                    noise = (Math.random() - 0.5) * 200;
                    break;
                default:
                    baseValue = 100 + Math.sin(i * 0.1) * 20;
                    trend = i * 2;
                    seasonality = Math.sin(i * 2 * Math.PI / 7) * 10;
                    noise = (Math.random() - 0.5) * 5;
            }
            
            const value = Math.max(0, baseValue + trend + seasonality + noise);

            data.push({
                projectId,
                demandType,
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

    calculateGrowthRate(historical, forecast) {
        const historicalMean = ss.mean(historical);
        const forecastMean = ss.mean(forecast);
        return (forecastMean - historicalMean) / historicalMean;
    }

    calculateDemandVolatility(values) {
        const returns = this.calculateReturns(values);
        return ss.standardDeviation(returns);
    }

    calculateReturns(values) {
        const returns = [];
        for (let i = 1; i < values.length; i++) {
            const ret = (values[i] - values[i - 1]) / values[i - 1];
            returns.push(isFinite(ret) ? ret : 0);
        }
        return returns;
    }

    calculateMarketPenetration(forecastValues, demandType) {
        // Simplified market penetration calculation
        const maxPotential = 10000; // Assume max potential demand
        const currentDemand = ss.mean(forecastValues);
        return Math.min(1, currentDemand / maxPotential);
    }

    findInflectionPoint(values) {
        // Find the point where growth rate changes most
        const growthRates = [];
        for (let i = 1; i < values.length; i++) {
            const growthRate = (values[i] - values[i - 1]) / values[i - 1];
            growthRates.push(growthRate);
        }
        
        let maxChange = 0;
        let inflectionPoint = 0;
        
        for (let i = 1; i < growthRates.length; i++) {
            const change = Math.abs(growthRates[i] - growthRates[i - 1]);
            if (change > maxChange) {
                maxChange = change;
                inflectionPoint = i;
            }
        }
        
        return inflectionPoint;
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

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    getSystemStatus() {
        return {
            isRunning: true,
            totalForecasts: this.demandForecasts.size,
            modelsLoaded: this.demandModels.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = DemandForecaster;
