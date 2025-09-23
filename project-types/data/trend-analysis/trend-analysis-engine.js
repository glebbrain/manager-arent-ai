const moment = require('moment');
const _ = require('lodash');
const math = require('mathjs');
const { Matrix } = require('ml-matrix');
const ss = require('simple-statistics');
const regression = require('regression');
const { v4: uuidv4 } = require('uuid');

/**
 * Trend Analysis Engine v2.4
 * Advanced trend analysis and forecasting engine for development metrics
 */
class TrendAnalysisEngine {
    constructor(options = {}) {
        this.options = {
            timeWindow: '30d',
            minDataPoints: 10,
            confidenceThreshold: 0.8,
            seasonalityDetection: true,
            anomalyDetection: true,
            ...options
        };
        
        this.trends = new Map();
        this.patterns = new Map();
        this.forecasts = new Map();
        this.anomalies = new Map();
        this.correlations = new Map();
    }

    /**
     * Analyze trends for given metrics
     */
    async analyzeTrends(projectId, metrics, timeRange, options = {}) {
        try {
            const analysisId = uuidv4();
            const startTime = Date.now();
            
            // Get historical data
            const data = await this.getHistoricalData(projectId, metrics, timeRange);
            
            if (data.length < this.options.minDataPoints) {
                throw new Error(`Insufficient data points. Minimum required: ${this.options.minDataPoints}`);
            }

            const results = {
                analysisId,
                projectId,
                metrics,
                timeRange,
                timestamp: new Date().toISOString(),
                dataPoints: data.length,
                trends: {},
                patterns: {},
                seasonality: {},
                correlations: {},
                anomalies: [],
                confidence: {},
                recommendations: []
            };

            // Analyze each metric
            for (const metric of metrics) {
                const metricData = data.filter(d => d.metric === metric);
                
                if (metricData.length === 0) continue;

                // Basic trend analysis
                const trend = this.calculateTrend(metricData);
                results.trends[metric] = trend;

                // Pattern detection
                if (this.options.seasonalityDetection) {
                    const patterns = this.detectPatterns(metricData, metric);
                    results.patterns[metric] = patterns;
                }

                // Seasonality analysis
                const seasonality = this.analyzeSeasonality(metricData, metric);
                results.seasonality[metric] = seasonality;

                // Anomaly detection
                if (this.options.anomalyDetection) {
                    const anomalies = this.detectAnomalies(metricData, metric);
                    results.anomalies.push(...anomalies);
                }

                // Confidence calculation
                results.confidence[metric] = this.calculateConfidence(metricData, trend);
            }

            // Cross-metric correlations
            if (metrics.length > 1) {
                results.correlations = this.analyzeCorrelations(data, metrics);
            }

            // Generate recommendations
            results.recommendations = this.generateRecommendations(results);

            // Store results
            this.trends.set(analysisId, results);

            const processingTime = Date.now() - startTime;
            results.processingTime = processingTime;

            return results;
        } catch (error) {
            throw new Error(`Trend analysis failed: ${error.message}`);
        }
    }

    /**
     * Calculate trend for a metric
     */
    calculateTrend(data) {
        if (data.length < 2) {
            return {
                direction: 'insufficient_data',
                slope: 0,
                strength: 0,
                rSquared: 0,
                pValue: 1
            };
        }

        // Sort data by timestamp
        const sortedData = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Prepare data for regression
        const xValues = sortedData.map((_, index) => index);
        const yValues = sortedData.map(d => d.value);

        // Linear regression
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, yValues[i]])
        );

        const slope = regressionResult.equation[0];
        const intercept = regressionResult.equation[1];
        const rSquared = regressionResult.r2;

        // Calculate trend direction and strength
        let direction = 'stable';
        let strength = Math.abs(slope);

        if (slope > 0.1) {
            direction = 'increasing';
        } else if (slope < -0.1) {
            direction = 'decreasing';
        }

        // Calculate p-value (simplified)
        const pValue = this.calculatePValue(xValues, yValues, slope, intercept);

        return {
            direction,
            slope,
            intercept,
            strength,
            rSquared,
            pValue,
            confidence: rSquared > this.options.confidenceThreshold ? 'high' : 'low'
        };
    }

    /**
     * Detect patterns in data
     */
    detectPatterns(data, metric) {
        const patterns = {
            cyclical: this.detectCyclicalPatterns(data),
            seasonal: this.detectSeasonalPatterns(data),
            trend: this.detectTrendPatterns(data),
            volatility: this.detectVolatilityPatterns(data)
        };

        return patterns;
    }

    /**
     * Detect cyclical patterns
     */
    detectCyclicalPatterns(data) {
        if (data.length < 10) return null;

        const values = data.map(d => d.value);
        const mean = ss.mean(values);
        const centered = values.map(v => v - mean);

        // Simple autocorrelation analysis
        const autocorrelations = this.calculateAutocorrelations(centered);
        
        // Find peaks in autocorrelation
        const peaks = this.findPeaks(autocorrelations);
        
        if (peaks.length > 0) {
            const period = peaks[0].lag;
            const strength = peaks[0].value;
            
            return {
                detected: strength > 0.3,
                period,
                strength,
                confidence: Math.min(strength * 2, 1)
            };
        }

        return { detected: false };
    }

    /**
     * Detect seasonal patterns
     */
    detectSeasonalPatterns(data) {
        if (data.length < 30) return null;

        // Group by time periods (daily, weekly, monthly)
        const daily = this.groupByPeriod(data, 'day');
        const weekly = this.groupByPeriod(data, 'week');
        const monthly = this.groupByPeriod(data, 'month');

        const patterns = {};

        if (daily.length > 7) {
            patterns.daily = this.analyzePeriodPattern(daily, 'daily');
        }
        if (weekly.length > 4) {
            patterns.weekly = this.analyzePeriodPattern(weekly, 'weekly');
        }
        if (monthly.length > 3) {
            patterns.monthly = this.analyzePeriodPattern(monthly, 'monthly');
        }

        return patterns;
    }

    /**
     * Detect trend patterns
     */
    detectTrendPatterns(data) {
        const trend = this.calculateTrend(data);
        
        return {
            linear: trend.rSquared > 0.7,
            exponential: this.detectExponentialTrend(data),
            logarithmic: this.detectLogarithmicTrend(data),
            polynomial: this.detectPolynomialTrend(data)
        };
    }

    /**
     * Detect volatility patterns
     */
    detectVolatilityPatterns(data) {
        if (data.length < 10) return null;

        const values = data.map(d => d.value);
        const returns = this.calculateReturns(values);
        const volatility = ss.standardDeviation(returns);

        // Check for volatility clustering
        const volatilityClusters = this.detectVolatilityClusters(returns);

        return {
            level: volatility,
            clustering: volatilityClusters.detected,
            clusters: volatilityClusters.count,
            regime: this.detectVolatilityRegime(volatility)
        };
    }

    /**
     * Analyze seasonality
     */
    analyzeSeasonality(data, metric) {
        if (data.length < 30) return null;

        const values = data.map(d => d.value);
        const timestamps = data.map(d => new Date(d.timestamp));

        // Decompose time series
        const decomposition = this.decomposeTimeSeries(values, timestamps);

        return {
            seasonal: decomposition.seasonal,
            trend: decomposition.trend,
            residual: decomposition.residual,
            seasonalStrength: this.calculateSeasonalStrength(decomposition.seasonal),
            period: this.detectSeasonalPeriod(decomposition.seasonal)
        };
    }

    /**
     * Detect anomalies
     */
    detectAnomalies(data, metric, sensitivity = 0.5) {
        if (data.length < 10) return [];

        const values = data.map(d => d.value);
        const anomalies = [];

        // Statistical anomaly detection
        const mean = ss.mean(values);
        const std = ss.standardDeviation(values);
        const threshold = mean + (sensitivity * 2 * std);

        data.forEach((point, index) => {
            const zScore = Math.abs((point.value - mean) / std);
            
            if (zScore > (2 + sensitivity)) {
                anomalies.push({
                    index,
                    timestamp: point.timestamp,
                    value: point.value,
                    zScore,
                    severity: this.calculateAnomalySeverity(zScore),
                    type: point.value > mean ? 'high' : 'low'
                });
            }
        });

        return anomalies;
    }

    /**
     * Analyze correlations between metrics
     */
    analyzeCorrelations(data, metrics) {
        const correlations = {};

        for (let i = 0; i < metrics.length; i++) {
            for (let j = i + 1; j < metrics.length; j++) {
                const metric1 = metrics[i];
                const metric2 = metrics[j];

                const data1 = data.filter(d => d.metric === metric1).map(d => d.value);
                const data2 = data.filter(d => d.metric === metric2).map(d => d.value);

                if (data1.length === data2.length && data1.length > 1) {
                    const correlation = ss.sampleCorrelation(data1, data2);
                    const key = `${metric1}_${metric2}`;
                    
                    correlations[key] = {
                        metric1,
                        metric2,
                        correlation,
                        strength: Math.abs(correlation),
                        direction: correlation > 0 ? 'positive' : 'negative',
                        significance: this.calculateCorrelationSignificance(correlation, data1.length)
                    };
                }
            }
        }

        return correlations;
    }

    /**
     * Forecast future trends
     */
    async forecastTrends(projectId, metrics, horizon, options = {}) {
        try {
            const forecastId = uuidv4();
            const startTime = Date.now();

            // Get historical data
            const data = await this.getHistoricalData(projectId, metrics, '90d');
            
            if (data.length < this.options.minDataPoints) {
                throw new Error('Insufficient data for forecasting');
            }

            const forecasts = {};

            for (const metric of metrics) {
                const metricData = data.filter(d => d.metric === metric);
                
                if (metricData.length === 0) continue;

                const forecast = this.generateForecast(metricData, horizon, options);
                forecasts[metric] = forecast;
            }

            const result = {
                forecastId,
                projectId,
                metrics,
                horizon,
                forecasts,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.forecasts.set(forecastId, result);
            return result;
        } catch (error) {
            throw new Error(`Forecasting failed: ${error.message}`);
        }
    }

    /**
     * Generate forecast for a metric
     */
    generateForecast(data, horizon, options = {}) {
        const values = data.map(d => d.value);
        const timestamps = data.map(d => new Date(d.timestamp));

        // Choose forecasting method based on data characteristics
        const method = this.selectForecastingMethod(values, options);

        let forecast;
        switch (method) {
            case 'linear':
                forecast = this.linearForecast(values, horizon);
                break;
            case 'exponential':
                forecast = this.exponentialForecast(values, horizon);
                break;
            case 'seasonal':
                forecast = this.seasonalForecast(values, timestamps, horizon);
                break;
            case 'arima':
                forecast = this.arimaForecast(values, horizon);
                break;
            default:
                forecast = this.linearForecast(values, horizon);
        }

        return {
            method,
            values: forecast.values,
            confidence: forecast.confidence,
            intervals: forecast.intervals,
            accuracy: forecast.accuracy
        };
    }

    /**
     * Helper methods
     */
    async getHistoricalData(projectId, metrics, timeRange) {
        // This would typically fetch from database
        // For now, return mock data
        return this.generateMockData(projectId, metrics, timeRange);
    }

    generateMockData(projectId, metrics, timeRange) {
        const data = [];
        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
        const startDate = moment().subtract(days, 'days');

        for (let i = 0; i < days; i++) {
            const date = startDate.clone().add(i, 'days');
            
            for (const metric of metrics) {
                // Generate realistic mock data with trends and seasonality
                const baseValue = 100 + Math.sin(i * 0.1) * 20;
                const trend = i * 0.5;
                const noise = (Math.random() - 0.5) * 10;
                const value = Math.max(0, baseValue + trend + noise);

                data.push({
                    projectId,
                    metric,
                    value,
                    timestamp: date.toISOString()
                });
            }
        }

        return data;
    }

    calculatePValue(xValues, yValues, slope, intercept) {
        // Simplified p-value calculation
        const n = xValues.length;
        const rSquared = this.calculateRSquared(xValues, yValues, slope, intercept);
        const tStat = slope / Math.sqrt((1 - rSquared) / (n - 2));
        return 2 * (1 - this.normalCDF(Math.abs(tStat)));
    }

    calculateRSquared(xValues, yValues, slope, intercept) {
        const yMean = ss.mean(yValues);
        const ssRes = yValues.reduce((sum, y, i) => {
            const predicted = slope * xValues[i] + intercept;
            return sum + Math.pow(y - predicted, 2);
        }, 0);
        const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
        return 1 - (ssRes / ssTot);
    }

    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    erf(x) {
        // Approximation of error function
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    calculateAutocorrelations(data) {
        const n = data.length;
        const autocorrelations = [];

        for (let lag = 1; lag < Math.min(n / 2, 20); lag++) {
            let numerator = 0;
            let denominator = 0;

            for (let i = lag; i < n; i++) {
                numerator += data[i] * data[i - lag];
                denominator += data[i] * data[i];
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

    groupByPeriod(data, period) {
        const groups = {};
        
        data.forEach(point => {
            const date = moment(point.timestamp);
            let key;
            
            switch (period) {
                case 'day':
                    key = date.format('YYYY-MM-DD');
                    break;
                case 'week':
                    key = date.format('YYYY-[W]WW');
                    break;
                case 'month':
                    key = date.format('YYYY-MM');
                    break;
                default:
                    key = date.format('YYYY-MM-DD');
            }
            
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(point);
        });

        return Object.values(groups).map(group => ({
            period: group[0].timestamp,
            values: group.map(p => p.value),
            average: ss.mean(group.map(p => p.value))
        }));
    }

    analyzePeriodPattern(groups, type) {
        if (groups.length < 2) return null;

        const averages = groups.map(g => g.average);
        const mean = ss.mean(averages);
        const std = ss.standardDeviation(averages);
        const coefficient = std / mean;

        return {
            detected: coefficient > 0.1,
            strength: Math.min(coefficient, 1),
            pattern: this.identifyPattern(averages),
            variance: std
        };
    }

    identifyPattern(values) {
        if (values.length < 3) return 'insufficient_data';

        // Check for increasing trend
        let increasing = 0;
        let decreasing = 0;

        for (let i = 1; i < values.length; i++) {
            if (values[i] > values[i - 1]) increasing++;
            else if (values[i] < values[i - 1]) decreasing++;
        }

        const total = increasing + decreasing;
        if (total === 0) return 'stable';

        const increaseRatio = increasing / total;
        if (increaseRatio > 0.7) return 'increasing';
        if (increaseRatio < 0.3) return 'decreasing';
        return 'mixed';
    }

    detectExponentialTrend(data) {
        const values = data.map(d => d.value);
        const logValues = values.map(v => Math.log(Math.max(v, 0.001)));
        
        const xValues = data.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, logValues[i]])
        );

        return regressionResult.r2 > 0.7;
    }

    detectLogarithmicTrend(data) {
        const values = data.map(d => d.value);
        const xValues = data.map((_, i) => Math.log(i + 1));
        
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );

        return regressionResult.r2 > 0.7;
    }

    detectPolynomialTrend(data) {
        const values = data.map(d => d.value);
        const xValues = data.map((_, i) => i);
        
        // Try polynomial regression (degree 2)
        const polynomialResult = regression.polynomial(
            xValues.map((x, i) => [x, values[i]]),
            { order: 2 }
        );

        return polynomialResult.r2 > 0.7;
    }

    detectVolatilityClusters(returns) {
        const threshold = ss.standardDeviation(returns) * 1.5;
        let inCluster = false;
        let clusterCount = 0;
        let currentClusterLength = 0;

        returns.forEach((ret, i) => {
            if (Math.abs(ret) > threshold) {
                if (!inCluster) {
                    clusterCount++;
                    inCluster = true;
                }
                currentClusterLength++;
            } else {
                inCluster = false;
                currentClusterLength = 0;
            }
        });

        return {
            detected: clusterCount > 1,
            count: clusterCount,
            averageLength: currentClusterLength / Math.max(clusterCount, 1)
        };
    }

    detectVolatilityRegime(volatility) {
        if (volatility < 0.1) return 'low';
        if (volatility < 0.3) return 'medium';
        return 'high';
    }

    calculateReturns(values) {
        const returns = [];
        for (let i = 1; i < values.length; i++) {
            const ret = (values[i] - values[i - 1]) / values[i - 1];
            returns.push(isFinite(ret) ? ret : 0);
        }
        return returns;
    }

    decomposeTimeSeries(values, timestamps) {
        // Simple decomposition
        const trend = this.calculateTrend(values.map((v, i) => ({ value: v, timestamp: timestamps[i] })));
        const trendValues = values.map((_, i) => trend.slope * i + trend.intercept);
        const detrended = values.map((v, i) => v - trendValues[i]);
        
        // Simple seasonal component (assuming weekly pattern)
        const seasonal = this.calculateSeasonalComponent(detrended, 7);
        const residual = detrended.map((v, i) => v - seasonal[i % seasonal.length]);

        return {
            trend: trendValues,
            seasonal,
            residual
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

    calculateSeasonalStrength(seasonal) {
        const mean = ss.mean(seasonal);
        const variance = ss.variance(seasonal);
        return variance / (mean * mean + variance);
    }

    detectSeasonalPeriod(seasonal) {
        // Find the period with highest variance
        let maxVariance = 0;
        let bestPeriod = 1;

        for (let period = 2; period <= Math.min(seasonal.length / 2, 30); period++) {
            const groups = [];
            for (let i = 0; i < seasonal.length; i += period) {
                groups.push(seasonal.slice(i, i + period));
            }
            
            if (groups.length > 1) {
                const groupMeans = groups.map(g => ss.mean(g));
                const variance = ss.variance(groupMeans);
                
                if (variance > maxVariance) {
                    maxVariance = variance;
                    bestPeriod = period;
                }
            }
        }

        return bestPeriod;
    }

    calculateAnomalySeverity(zScore) {
        if (zScore > 3) return 'critical';
        if (zScore > 2.5) return 'high';
        if (zScore > 2) return 'medium';
        return 'low';
    }

    calculateCorrelationSignificance(correlation, n) {
        const tStat = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
        const pValue = 2 * (1 - this.normalCDF(Math.abs(tStat)));
        return pValue < 0.05 ? 'significant' : 'not_significant';
    }

    selectForecastingMethod(values, options) {
        const trend = this.calculateTrend(values.map((v, i) => ({ value: v, timestamp: new Date(i) })));
        
        if (trend.rSquared > 0.8) {
            return trend.slope > 0.1 ? 'exponential' : 'linear';
        }
        
        if (this.detectSeasonalPatterns(values.map((v, i) => ({ value: v, timestamp: new Date(i) })))) {
            return 'seasonal';
        }
        
        return 'arima';
    }

    linearForecast(values, horizon) {
        const xValues = values.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );

        const slope = regressionResult.equation[0];
        const intercept = regressionResult.equation[1];
        const rSquared = regressionResult.r2;

        const forecast = [];
        const confidence = [];
        const intervals = [];

        for (let i = 0; i < horizon; i++) {
            const x = values.length + i;
            const predicted = slope * x + intercept;
            forecast.push(predicted);

            // Simple confidence interval
            const error = Math.sqrt(1 - rSquared) * ss.standardDeviation(values);
            const margin = error * Math.sqrt(1 + 1 / values.length + Math.pow(x - ss.mean(xValues), 2) / ss.variance(xValues));
            
            confidence.push(Math.max(0, 1 - error / Math.abs(predicted)));
            intervals.push({
                lower: predicted - margin,
                upper: predicted + margin
            });
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            intervals,
            accuracy: rSquared
        };
    }

    exponentialForecast(values, horizon) {
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
        const intervals = [];

        for (let i = 0; i < horizon; i++) {
            const x = values.length + i;
            const logPredicted = slope * x + intercept;
            const predicted = Math.exp(logPredicted);
            forecast.push(predicted);

            const error = Math.sqrt(1 - rSquared) * ss.standardDeviation(logValues);
            const margin = error * Math.sqrt(1 + 1 / values.length + Math.pow(x - ss.mean(xValues), 2) / ss.variance(xValues));
            
            confidence.push(Math.max(0, 1 - error / Math.abs(logPredicted)));
            intervals.push({
                lower: Math.exp(logPredicted - margin),
                upper: Math.exp(logPredicted + margin)
            });
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            intervals,
            accuracy: rSquared
        };
    }

    seasonalForecast(values, timestamps, horizon) {
        // Simple seasonal forecast
        const decomposition = this.decomposeTimeSeries(values, timestamps);
        const seasonalPeriod = this.detectSeasonalPeriod(decomposition.seasonal);
        
        const forecast = [];
        const confidence = [];
        const intervals = [];

        for (let i = 0; i < horizon; i++) {
            const trendValue = decomposition.trend[decomposition.trend.length - 1] + (i + 1) * 0.1; // Simple trend continuation
            const seasonalValue = decomposition.seasonal[(decomposition.trend.length + i) % seasonalPeriod];
            const predicted = trendValue + seasonalValue;
            
            forecast.push(predicted);
            confidence.push(0.7); // Simplified confidence
            intervals.push({
                lower: predicted * 0.8,
                upper: predicted * 1.2
            });
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            intervals,
            accuracy: 0.7
        };
    }

    arimaForecast(values, horizon) {
        // Simplified ARIMA forecast
        return this.linearForecast(values, horizon);
    }

    calculateConfidence(data, trend) {
        const rSquared = trend.rSquared;
        const dataPoints = data.length;
        
        // Adjust confidence based on data quality
        let confidence = rSquared;
        
        if (dataPoints < 20) confidence *= 0.8;
        if (dataPoints < 10) confidence *= 0.6;
        
        return Math.max(0, Math.min(1, confidence));
    }

    generateRecommendations(results) {
        const recommendations = [];

        // Trend-based recommendations
        Object.entries(results.trends).forEach(([metric, trend]) => {
            if (trend.direction === 'increasing' && trend.confidence === 'high') {
                recommendations.push({
                    type: 'trend',
                    metric,
                    message: `${metric} is showing a strong upward trend. Consider monitoring for potential issues.`,
                    priority: 'medium'
                });
            } else if (trend.direction === 'decreasing' && trend.confidence === 'high') {
                recommendations.push({
                    type: 'trend',
                    metric,
                    message: `${metric} is declining. Investigate potential causes.`,
                    priority: 'high'
                });
            }
        });

        // Anomaly-based recommendations
        if (results.anomalies.length > 0) {
            const criticalAnomalies = results.anomalies.filter(a => a.severity === 'critical');
            if (criticalAnomalies.length > 0) {
                recommendations.push({
                    type: 'anomaly',
                    message: `Found ${criticalAnomalies.length} critical anomalies. Immediate investigation recommended.`,
                    priority: 'critical'
                });
            }
        }

        // Correlation-based recommendations
        Object.entries(results.correlations).forEach(([key, correlation]) => {
            if (correlation.significance === 'significant' && correlation.strength > 0.7) {
                recommendations.push({
                    type: 'correlation',
                    message: `Strong correlation detected between ${correlation.metric1} and ${correlation.metric2}. Consider analyzing their relationship.`,
                    priority: 'low'
                });
            }
        });

        return recommendations;
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            isRunning: true,
            totalAnalyses: this.trends.size,
            totalForecasts: this.forecasts.size,
            totalAnomalies: Array.from(this.anomalies.values()).reduce((sum, arr) => sum + arr.length, 0),
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            memoryUsage: process.memoryUsage(),
            version: '2.4.0'
        };
    }
}

module.exports = TrendAnalysisEngine;
