const ss = require('simple-statistics');
const regression = require('regression');

/**
 * Risk Forecaster v2.4
 * Specialized forecasting for risk assessment and mitigation planning
 */
class RiskForecaster {
    constructor(options = {}) {
        this.options = {
            defaultHorizon: '30d',
            minDataPoints: 20,
            confidenceThreshold: 0.8,
            ...options
        };
        
        this.riskForecasts = new Map();
        this.riskModels = new Map();
    }

    /**
     * Forecast risks
     */
    async forecastRisks(projectId, riskTypes, horizon, options = {}) {
        try {
            const forecastId = this.generateId();
            const startTime = Date.now();

            const forecasts = {};
            const recommendations = [];
            const confidence = {};

            for (const riskType of riskTypes) {
                try {
                    const riskForecast = await this.forecastRiskType(
                        projectId,
                        riskType,
                        horizon,
                        options
                    );
                    
                    forecasts[riskType] = riskForecast;
                    confidence[riskType] = riskForecast.confidence;
                    
                    // Generate risk-specific recommendations
                    const riskRecommendations = this.generateRiskRecommendations(
                        riskType,
                        riskForecast,
                        horizon
                    );
                    recommendations.push(...riskRecommendations);
                } catch (error) {
                    console.error(`Error forecasting ${riskType}:`, error);
                    forecasts[riskType] = {
                        error: error.message,
                        confidence: 0
                    };
                }
            }

            // Calculate overall confidence
            const overallConfidence = this.calculateOverallConfidence(confidence);

            // Generate risk insights
            const riskInsights = this.generateRiskInsights(forecasts, riskTypes);

            // Calculate overall risk score
            const overallRiskScore = this.calculateOverallRiskScore(forecasts);

            const result = {
                forecastId,
                projectId,
                riskTypes,
                horizon,
                forecasts,
                overallConfidence,
                overallRiskScore,
                recommendations,
                riskInsights,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.riskForecasts.set(forecastId, result);
            return result;
        } catch (error) {
            throw new Error(`Risk forecasting failed: ${error.message}`);
        }
    }

    /**
     * Forecast specific risk type
     */
    async forecastRiskType(projectId, riskType, horizon, options = {}) {
        // Get historical risk data
        const data = await this.getRiskData(projectId, riskType, options.timeRange);
        
        if (data.length < this.options.minDataPoints) {
            throw new Error(`Insufficient data for ${riskType}. Minimum required: ${this.options.minDataPoints}`);
        }

        // Select appropriate forecasting method for risk type
        const method = this.selectRiskMethod(riskType, data, options);
        
        // Generate forecast
        const forecast = await this.generateRiskForecast(data, horizon, method, options);
        
        // Calculate risk-specific metrics
        const riskMetrics = this.calculateRiskMetrics(forecast, data, riskType);
        
        // Generate risk insights
        const insights = this.generateRiskInsights(forecast, data, riskType, horizon);

        return {
            riskType,
            method,
            forecast: forecast.values,
            confidence: forecast.confidence,
            metrics: riskMetrics,
            insights,
            parameters: forecast.parameters
        };
    }

    /**
     * Generate risk forecast
     */
    async generateRiskForecast(data, horizon, method, options = {}) {
        const values = data.map(d => d.riskLevel);
        const timestamps = data.map(d => new Date(d.timestamp));

        let forecast;
        switch (method) {
            case 'linear':
                forecast = this.linearRiskForecast(values, horizon, options);
                break;
            case 'exponential':
                forecast = this.exponentialRiskForecast(values, horizon, options);
                break;
            case 'seasonal':
                forecast = this.seasonalRiskForecast(values, timestamps, horizon, options);
                break;
            case 'volatility_based':
                forecast = this.volatilityBasedForecast(values, horizon, options);
                break;
            case 'event_driven':
                forecast = this.eventDrivenForecast(values, horizon, options);
                break;
            case 'monte_carlo':
                forecast = this.monteCarloForecast(values, horizon, options);
                break;
            default:
                forecast = this.linearRiskForecast(values, horizon, options);
        }

        return forecast;
    }

    /**
     * Linear risk forecast
     */
    linearRiskForecast(values, horizon, options = {}) {
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
            forecast.push(Math.max(0, Math.min(1, predicted))); // Clamp to 0-1 range

            const confidenceScore = rSquared * 0.8; // Lower confidence for risk
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
     * Exponential risk forecast
     */
    exponentialRiskForecast(values, horizon, options = {}) {
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
            forecast.push(Math.max(0, Math.min(1, predicted)));

            const confidenceScore = rSquared * 0.7;
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
     * Seasonal risk forecast
     */
    seasonalRiskForecast(values, timestamps, horizon, options = {}) {
        const seasonalPeriod = this.detectSeasonalPeriod(values);
        
        if (seasonalPeriod < 2) {
            return this.linearRiskForecast(values, horizon, options);
        }

        const decomposition = this.decomposeTimeSeries(values, timestamps, seasonalPeriod);
        
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            const trendValue = this.extendTrend(decomposition.trend, i + 1);
            const seasonalIndex = (decomposition.trend.length + i) % decomposition.seasonal.length;
            const seasonalValue = decomposition.seasonal[seasonalIndex];
            
            const predicted = Math.max(0, Math.min(1, trendValue + seasonalValue));
            forecast.push(predicted);

            const seasonalStrength = this.calculateSeasonalStrength(decomposition.seasonal);
            confidence.push(Math.max(0.5, seasonalStrength));
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
     * Volatility-based forecast
     */
    volatilityBasedForecast(values, horizon, options = {}) {
        const returns = this.calculateReturns(values);
        const volatility = ss.standardDeviation(returns);
        const meanRisk = ss.mean(values);
        
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            // Risk increases with volatility
            const volatilityFactor = 1 + (volatility * (i + 1) * 0.1);
            const predicted = Math.max(0, Math.min(1, meanRisk * volatilityFactor));
            forecast.push(predicted);

            // Confidence decreases with volatility
            const confidenceScore = Math.max(0.3, 1 - volatility);
            confidence.push(confidenceScore);
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'volatility_based',
            parameters: { volatility, meanRisk },
            trend: {
                direction: 'increasing',
                strength: volatility
            }
        };
    }

    /**
     * Event-driven forecast
     */
    eventDrivenForecast(values, horizon, options = {}) {
        const events = options.events || [];
        const baseRisk = ss.mean(values);
        
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            let predicted = baseRisk;
            
            // Apply event impacts
            events.forEach(event => {
                if (event.startDay <= i && i < event.startDay + event.duration) {
                    predicted += event.impact;
                }
            });
            
            forecast.push(Math.max(0, Math.min(1, predicted)));
            confidence.push(0.6); // Moderate confidence for event-driven
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'event_driven',
            parameters: { baseRisk, events },
            trend: {
                direction: 'variable',
                strength: 0.5
            }
        };
    }

    /**
     * Monte Carlo risk forecast
     */
    monteCarloForecast(values, horizon, options = {}) {
        const mean = ss.mean(values);
        const std = ss.standardDeviation(values);
        const simulations = options.simulations || 1000;
        
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            const simulations = [];
            
            for (let j = 0; j < simulations; j++) {
                // Generate random risk value based on historical distribution
                const randomValue = this.generateRandomRisk(mean, std);
                simulations.push(randomValue);
            }
            
            const predicted = ss.mean(simulations);
            const confidenceScore = 1 - (ss.standardDeviation(simulations) / mean);
            
            forecast.push(Math.max(0, Math.min(1, predicted)));
            confidence.push(Math.max(0.3, confidenceScore));
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'monte_carlo',
            parameters: { mean, std, simulations },
            trend: {
                direction: 'stochastic',
                strength: 0.6
            }
        };
    }

    /**
     * Select appropriate method for risk type
     */
    selectRiskMethod(riskType, data, options = {}) {
        if (options.method) {
            return options.method;
        }

        const values = data.map(d => d.riskLevel);
        
        // Risk-specific method selection
        switch (riskType.toLowerCase()) {
            case 'technical':
            case 'security':
                return 'volatility_based';
            case 'market':
            case 'financial':
                return 'monte_carlo';
            case 'operational':
            case 'compliance':
                return 'event_driven';
            case 'project':
            case 'schedule':
                return 'seasonal';
            default:
                return 'linear';
        }
    }

    /**
     * Calculate risk-specific metrics
     */
    calculateRiskMetrics(forecast, data, riskType) {
        const values = data.map(d => d.riskLevel);
        const forecastValues = forecast.values;
        
        const metrics = {
            currentRisk: ss.mean(values),
            maxRisk: Math.max(...values),
            forecastedRisk: ss.mean(forecastValues),
            forecastedMaxRisk: Math.max(...forecastValues),
            riskTrend: this.calculateRiskTrend(values, forecastValues),
            riskVolatility: this.calculateRiskVolatility(values),
            riskExposure: this.calculateRiskExposure(forecastValues),
            riskSeverity: this.calculateRiskSeverity(forecastValues)
        };

        return metrics;
    }

    /**
     * Generate risk recommendations
     */
    generateRiskRecommendations(riskType, forecast, horizon) {
        const recommendations = [];

        // High risk recommendations
        if (forecast.metrics) {
            const forecastedRisk = forecast.metrics.forecastedRisk;
            
            if (forecastedRisk > 0.7) {
                recommendations.push({
                    type: 'high_risk',
                    riskType,
                    message: `High risk level (${(forecastedRisk * 100).toFixed(1)}%) forecasted for ${riskType}. Immediate action required.`,
                    priority: 'critical',
                    action: 'immediate_mitigation',
                    riskLevel: forecastedRisk
                });
            } else if (forecastedRisk > 0.5) {
                recommendations.push({
                    type: 'medium_risk',
                    riskType,
                    message: `Medium risk level (${(forecastedRisk * 100).toFixed(1)}%) forecasted for ${riskType}. Monitor closely.`,
                    priority: 'high',
                    action: 'monitor',
                    riskLevel: forecastedRisk
                });
            }
        }

        // Risk trend recommendations
        if (forecast.trend) {
            if (forecast.trend.direction === 'increasing' && forecast.trend.strength > 0.3) {
                recommendations.push({
                    type: 'increasing_risk',
                    riskType,
                    message: `Increasing risk trend for ${riskType}. Implement preventive measures.`,
                    priority: 'high',
                    action: 'preventive_measures',
                    trend: forecast.trend
                });
            }
        }

        // Volatility recommendations
        if (forecast.metrics && forecast.metrics.riskVolatility > 0.3) {
            recommendations.push({
                type: 'volatile_risk',
                riskType,
                message: `High volatility in ${riskType} risk. Implement risk management controls.`,
                priority: 'medium',
                action: 'risk_controls',
                volatility: forecast.metrics.riskVolatility
            });
        }

        return recommendations;
    }

    /**
     * Generate risk insights
     */
    generateRiskInsights(forecasts, riskTypes) {
        const insights = [];

        // Risk correlation insights
        const riskValues = Object.entries(forecasts)
            .filter(([_, forecast]) => forecast.forecast && forecast.forecast.length > 0)
            .map(([type, forecast]) => ({
                type,
                values: forecast.forecast,
                riskLevel: forecast.metrics?.forecastedRisk || 0
            }));

        if (riskValues.length > 1) {
            for (let i = 0; i < riskValues.length; i++) {
                for (let j = i + 1; j < riskValues.length; j++) {
                    const corr = this.calculateCorrelation(
                        riskValues[i].values,
                        riskValues[j].values
                    );
                    
                    if (Math.abs(corr) > 0.7) {
                        insights.push({
                            type: 'risk_correlation',
                            risks: [riskValues[i].type, riskValues[j].type],
                            correlation: corr,
                            message: `Strong correlation between ${riskValues[i].type} and ${riskValues[j].type} risks`
                        });
                    }
                }
            }
        }

        // Overall risk level insights
        const riskLevels = riskValues.map(r => r.riskLevel);
        const avgRiskLevel = ss.mean(riskLevels);
        
        if (avgRiskLevel > 0.6) {
            insights.push({
                type: 'overall_risk',
                message: 'High overall risk level across all risk types. Comprehensive risk management required.',
                averageRiskLevel: avgRiskLevel,
                priority: 'critical'
            });
        } else if (avgRiskLevel < 0.3) {
            insights.push({
                type: 'overall_risk',
                message: 'Low overall risk level. Maintain current risk management practices.',
                averageRiskLevel: avgRiskLevel,
                priority: 'low'
            });
        }

        return insights;
    }

    /**
     * Calculate overall risk score
     */
    calculateOverallRiskScore(forecasts) {
        const riskLevels = Object.values(forecasts)
            .filter(forecast => forecast.metrics?.forecastedRisk)
            .map(forecast => forecast.metrics.forecastedRisk);
        
        if (riskLevels.length === 0) return 0;
        
        const averageRisk = ss.mean(riskLevels);
        const maxRisk = Math.max(...riskLevels);
        const riskVolatility = ss.standardDeviation(riskLevels);
        
        // Weighted risk score
        return (averageRisk * 0.5) + (maxRisk * 0.3) + (riskVolatility * 0.2);
    }

    /**
     * Helper methods
     */
    async getRiskData(projectId, riskType, timeRange = '90d') {
        // This would typically fetch from database
        return this.generateMockRiskData(projectId, riskType, timeRange);
    }

    generateMockRiskData(projectId, riskType, timeRange) {
        const data = [];
        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            // Generate risk-specific mock data
            let baseRisk, trend, seasonality, noise;
            
            switch (riskType.toLowerCase()) {
                case 'technical':
                    baseRisk = 0.3 + Math.sin(i * 0.1) * 0.2;
                    trend = i * 0.001;
                    seasonality = Math.sin(i * 2 * Math.PI / 7) * 0.1;
                    noise = (Math.random() - 0.5) * 0.05;
                    break;
                case 'security':
                    baseRisk = 0.2 + Math.sin(i * 0.05) * 0.15;
                    trend = i * 0.002;
                    seasonality = Math.cos(i * 2 * Math.PI / 7) * 0.08;
                    noise = (Math.random() - 0.5) * 0.03;
                    break;
                case 'market':
                    baseRisk = 0.4 + Math.sin(i * 0.2) * 0.3;
                    trend = i * 0.003;
                    seasonality = Math.sin(i * 2 * Math.PI / 30) * 0.2;
                    noise = (Math.random() - 0.5) * 0.1;
                    break;
                default:
                    baseRisk = 0.3 + Math.sin(i * 0.1) * 0.2;
                    trend = i * 0.001;
                    seasonality = Math.sin(i * 2 * Math.PI / 7) * 0.1;
                    noise = (Math.random() - 0.5) * 0.05;
            }
            
            const riskLevel = Math.max(0, Math.min(1, baseRisk + trend + seasonality + noise));

            data.push({
                projectId,
                riskType,
                riskLevel,
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

    calculateReturns(values) {
        const returns = [];
        for (let i = 1; i < values.length; i++) {
            const ret = (values[i] - values[i - 1]) / values[i - 1];
            returns.push(isFinite(ret) ? ret : 0);
        }
        return returns;
    }

    generateRandomRisk(mean, std) {
        // Generate random value from normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return Math.max(0, Math.min(1, mean + std * z0));
    }

    calculateRiskTrend(historical, forecast) {
        const historicalMean = ss.mean(historical);
        const forecastMean = ss.mean(forecast);
        return (forecastMean - historicalMean) / historicalMean;
    }

    calculateRiskVolatility(values) {
        const returns = this.calculateReturns(values);
        return ss.standardDeviation(returns);
    }

    calculateRiskExposure(forecastValues) {
        return ss.mean(forecastValues);
    }

    calculateRiskSeverity(forecastValues) {
        const highRiskThreshold = 0.7;
        const highRiskCount = forecastValues.filter(v => v > highRiskThreshold).length;
        return highRiskCount / forecastValues.length;
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
            totalForecasts: this.riskForecasts.size,
            modelsLoaded: this.riskModels.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = RiskForecaster;
