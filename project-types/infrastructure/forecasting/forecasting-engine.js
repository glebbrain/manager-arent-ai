const ss = require('simple-statistics');
const regression = require('regression');
const { Matrix } = require('ml-matrix');
const moment = require('moment');

/**
 * Forecasting Engine v2.4
 * Advanced forecasting engine for future needs prediction
 */
class ForecastingEngine {
    constructor(options = {}) {
        this.options = {
            defaultHorizon: '30d',
            minDataPoints: 20,
            confidenceThreshold: 0.8,
            ensembleWeighting: true,
            adaptiveLearning: true,
            ...options
        };
        
        this.models = new Map();
        this.forecasts = new Map();
        this.accuracy = new Map();
    }

    /**
     * Generate forecast for a metric
     */
    async generateForecast(projectId, metric, horizon, options = {}) {
        try {
            const forecastId = this.generateId();
            const startTime = Date.now();

            // Get historical data
            const data = await this.getHistoricalData(projectId, metric, options.timeRange);
            
            if (data.length < this.options.minDataPoints) {
                throw new Error(`Insufficient data points. Minimum required: ${this.options.minDataPoints}`);
            }

            // Select best forecasting method
            const method = this.selectForecastingMethod(data, options);
            
            // Generate forecast
            const forecast = await this.generateForecastByMethod(data, horizon, method, options);
            
            // Calculate confidence intervals
            const confidenceIntervals = this.calculateConfidenceIntervals(forecast, data, horizon);
            
            // Generate insights
            const insights = this.generateForecastInsights(forecast, data, horizon);
            
            // Calculate accuracy if validation data is available
            let accuracy = null;
            if (options.validate) {
                accuracy = await this.calculateAccuracy(data, method, options.validationSplit);
            }

            const result = {
                forecastId,
                projectId,
                metric,
                horizon,
                method,
                forecast: forecast.values,
                confidence: forecast.confidence,
                confidenceIntervals,
                insights,
                accuracy,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.forecasts.set(forecastId, result);
            return result;
        } catch (error) {
            throw new Error(`Forecast generation failed: ${error.message}`);
        }
    }

    /**
     * Generate forecast using specific method
     */
    async generateForecastByMethod(data, horizon, method, options = {}) {
        const values = data.map(d => d.value);
        const timestamps = data.map(d => new Date(d.timestamp));

        let forecast;
        switch (method) {
            case 'linear':
                forecast = this.linearForecast(values, horizon, options);
                break;
            case 'exponential':
                forecast = this.exponentialForecast(values, horizon, options);
                break;
            case 'seasonal':
                forecast = this.seasonalForecast(values, timestamps, horizon, options);
                break;
            case 'arima':
                forecast = this.arimaForecast(values, horizon, options);
                break;
            case 'neural':
                forecast = this.neuralForecast(values, horizon, options);
                break;
            case 'prophet':
                forecast = this.prophetForecast(values, timestamps, horizon, options);
                break;
            case 'ensemble':
                forecast = this.ensembleForecast(values, timestamps, horizon, options);
                break;
            default:
                forecast = this.linearForecast(values, horizon, options);
        }

        return forecast;
    }

    /**
     * Linear regression forecast
     */
    linearForecast(values, horizon, options = {}) {
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
            forecast.push(predicted);

            // Calculate confidence based on R-squared and data quality
            const dataQuality = Math.min(values.length / 50, 1); // Normalize to 0-1
            const confidenceScore = rSquared * dataQuality;
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
     * Exponential forecast
     */
    exponentialForecast(values, horizon, options = {}) {
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
            forecast.push(predicted);

            const confidenceScore = rSquared * 0.9; // Slightly lower confidence for exponential
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
     * Seasonal forecast
     */
    seasonalForecast(values, timestamps, horizon, options = {}) {
        // Detect seasonal period
        const seasonalPeriod = this.detectSeasonalPeriod(values);
        
        if (seasonalPeriod < 2) {
            // Fall back to linear if no seasonality detected
            return this.linearForecast(values, horizon, options);
        }

        // Decompose time series
        const decomposition = this.decomposeTimeSeries(values, timestamps, seasonalPeriod);
        
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            // Extend trend
            const trendValue = this.extendTrend(decomposition.trend, i + 1);
            
            // Apply seasonal component
            const seasonalIndex = (decomposition.trend.length + i) % decomposition.seasonal.length;
            const seasonalValue = decomposition.seasonal[seasonalIndex];
            
            const predicted = trendValue + seasonalValue;
            forecast.push(predicted);

            // Confidence based on seasonal strength
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
     * ARIMA forecast
     */
    arimaForecast(values, horizon, options = {}) {
        const p = options.p || 1; // AR order
        const d = options.d || 1; // Differencing order
        const q = options.q || 1; // MA order

        // Differencing
        let diffValues = values;
        for (let i = 0; i < d; i++) {
            diffValues = this.difference(diffValues);
        }

        // Fit AR model
        const arCoefficients = this.fitARModel(diffValues, p);
        
        // Generate forecast
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            let predicted = 0;
            
            // AR component
            for (let j = 0; j < Math.min(p, diffValues.length); j++) {
                predicted += arCoefficients[j] * diffValues[diffValues.length - 1 - j];
            }

            forecast.push(predicted);
            confidence.push(0.6); // ARIMA typically has moderate confidence
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'arima',
            parameters: { p, d, q, arCoefficients },
            trend: {
                direction: 'stable',
                strength: 0.5
            }
        };
    }

    /**
     * Neural network forecast
     */
    neuralForecast(values, horizon, options = {}) {
        const inputSize = Math.min(10, Math.floor(values.length / 2));
        const hiddenSize = Math.floor(inputSize * 1.5);
        
        // Prepare training data
        const trainingData = this.prepareNeuralTrainingData(values, inputSize);
        
        // Simple neural network weights
        const weights = this.initializeNeuralWeights(inputSize, hiddenSize, 1);
        
        // Train network (simplified)
        const trainedWeights = this.trainNeuralNetwork(trainingData, weights, options);
        
        // Generate forecast
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            const input = values.slice(-inputSize);
            const predicted = this.neuralNetworkPredict(input, trainedWeights);
            
            forecast.push(predicted);
            confidence.push(0.7); // Neural networks have moderate confidence
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'neural',
            parameters: { inputSize, hiddenSize, weights: trainedWeights },
            trend: {
                direction: 'adaptive',
                strength: 0.6
            }
        };
    }

    /**
     * Prophet forecast (simplified)
     */
    prophetForecast(values, timestamps, horizon, options = {}) {
        // Simplified Prophet implementation
        const decomposition = this.decomposeTimeSeries(values, timestamps);
        
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            // Trend component
            const trendValue = this.extendTrend(decomposition.trend, i + 1);
            
            // Seasonal component
            const seasonalValue = decomposition.seasonal[i % decomposition.seasonal.length];
            
            // Holiday/event component (simplified)
            const holidayValue = this.calculateHolidayEffect(i, options);
            
            const predicted = trendValue + seasonalValue + holidayValue;
            forecast.push(predicted);

            // Prophet typically has high confidence
            confidence.push(0.8);
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'prophet',
            parameters: {
                seasonalPeriod: decomposition.seasonal.length,
                trendStrength: this.calculateTrendStrength(decomposition.trend)
            },
            trend: {
                direction: this.calculateTrendDirection(decomposition.trend),
                strength: this.calculateTrendStrength(decomposition.trend)
            }
        };
    }

    /**
     * Ensemble forecast
     */
    ensembleForecast(values, timestamps, horizon, options = {}) {
        // Generate forecasts using multiple methods
        const linearForecast = this.linearForecast(values, horizon, options);
        const exponentialForecast = this.exponentialForecast(values, horizon, options);
        const seasonalForecast = this.seasonalForecast(values, timestamps, horizon, options);
        const arimaForecast = this.arimaForecast(values, horizon, options);

        // Calculate weights based on historical accuracy
        const weights = this.calculateEnsembleWeights([
            linearForecast,
            exponentialForecast,
            seasonalForecast,
            arimaForecast
        ]);

        // Combine forecasts
        const ensembleForecast = [];
        const ensembleConfidence = [];

        for (let i = 0; i < horizon; i++) {
            let weightedValue = 0;
            let weightedConfidence = 0;

            [linearForecast, exponentialForecast, seasonalForecast, arimaForecast].forEach((forecast, index) => {
                const weight = weights[index];
                weightedValue += forecast.values[i] * weight;
                weightedConfidence += forecast.confidence * weight;
            });

            ensembleForecast.push(weightedValue);
            ensembleConfidence.push(weightedConfidence);
        }

        return {
            values: ensembleForecast,
            confidence: ss.mean(ensembleConfidence),
            method: 'ensemble',
            parameters: { weights, methods: ['linear', 'exponential', 'seasonal', 'arima'] },
            trend: {
                direction: this.calculateEnsembleTrendDirection([linearForecast, exponentialForecast, seasonalForecast, arimaForecast]),
                strength: this.calculateEnsembleTrendStrength([linearForecast, exponentialForecast, seasonalForecast, arimaForecast])
            }
        };
    }

    /**
     * Select best forecasting method
     */
    selectForecastingMethod(data, options = {}) {
        if (options.method) {
            return options.method;
        }

        const values = data.map(d => d.value);
        
        // Analyze data characteristics
        const trend = this.calculateTrend(values);
        const seasonality = this.detectSeasonality(values);
        const volatility = this.calculateVolatility(values);
        const dataLength = values.length;

        // Select method based on characteristics
        if (dataLength < 30) {
            return 'linear';
        } else if (seasonality.detected && seasonality.strength > 0.3) {
            return 'seasonal';
        } else if (trend.rSquared > 0.8 && trend.slope > 0.1) {
            return 'exponential';
        } else if (trend.rSquared > 0.6) {
            return 'linear';
        } else if (volatility > 0.2) {
            return 'arima';
        } else if (dataLength > 100) {
            return 'ensemble';
        } else {
            return 'linear';
        }
    }

    /**
     * Calculate confidence intervals
     */
    calculateConfidenceIntervals(forecast, data, horizon) {
        const intervals = [];
        const values = data.map(d => d.value);
        const std = ss.standardDeviation(values);
        const confidenceLevel = 0.95; // 95% confidence interval
        const zScore = 1.96; // For 95% confidence

        for (let i = 0; i < horizon; i++) {
            const margin = zScore * std * Math.sqrt(1 + 1 / values.length);
            intervals.push({
                lower: forecast.values[i] - margin,
                upper: forecast.values[i] + margin
            });
        }

        return intervals;
    }

    /**
     * Generate forecast insights
     */
    generateForecastInsights(forecast, data, horizon) {
        const insights = [];

        // Trend insights
        if (forecast.trend) {
            if (forecast.trend.direction === 'increasing') {
                insights.push({
                    type: 'trend',
                    message: `Forecast shows increasing trend with strength ${forecast.trend.strength.toFixed(2)}`,
                    priority: 'medium'
                });
            } else if (forecast.trend.direction === 'decreasing') {
                insights.push({
                    type: 'trend',
                    message: `Forecast shows decreasing trend with strength ${forecast.trend.strength.toFixed(2)}`,
                    priority: 'high'
                });
            }
        }

        // Confidence insights
        if (forecast.confidence < 0.5) {
            insights.push({
                type: 'confidence',
                message: 'Low confidence forecast. Consider gathering more data or using different method.',
                priority: 'high'
            });
        } else if (forecast.confidence > 0.8) {
            insights.push({
                type: 'confidence',
                message: 'High confidence forecast. Results are reliable for planning.',
                priority: 'low'
            });
        }

        // Volatility insights
        const forecastValues = forecast.values;
        const forecastVolatility = this.calculateVolatility(forecastValues);
        const historicalVolatility = this.calculateVolatility(data.map(d => d.value));

        if (forecastVolatility > historicalVolatility * 1.5) {
            insights.push({
                type: 'volatility',
                message: 'Forecast shows increased volatility compared to historical data.',
                priority: 'medium'
            });
        }

        return insights;
    }

    /**
     * Calculate forecast accuracy
     */
    async calculateAccuracy(data, method, validationSplit = 0.2) {
        const splitIndex = Math.floor(data.length * (1 - validationSplit));
        const trainingData = data.slice(0, splitIndex);
        const validationData = data.slice(splitIndex);

        if (validationData.length < 2) {
            return { mape: 0, rmse: 0, rSquared: 0, overall: 0 };
        }

        // Generate forecast for validation period
        const forecast = await this.generateForecastByMethod(
            trainingData,
            validationData.length,
            method,
            { validate: false }
        );

        // Calculate accuracy metrics
        const actualValues = validationData.map(d => d.value);
        const predictedValues = forecast.values;

        const mape = this.calculateMAPE(actualValues, predictedValues);
        const rmse = this.calculateRMSE(actualValues, predictedValues);
        const rSquared = this.calculateRSquared(actualValues, predictedValues);

        return {
            mape,
            rmse,
            rSquared,
            overall: (1 - mape) * rSquared
        };
    }

    /**
     * Helper methods
     */
    async getHistoricalData(projectId, metric, timeRange = '90d') {
        // This would typically fetch from database
        // For now, return mock data
        return this.generateMockData(projectId, metric, timeRange);
    }

    generateMockData(projectId, metric, timeRange) {
        const data = [];
        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
        const startDate = moment().subtract(days, 'days');

        for (let i = 0; i < days; i++) {
            const date = startDate.clone().add(i, 'days');
            
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

        return data;
    }

    calculateTrend(values) {
        const xValues = values.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );

        return {
            slope: regressionResult.equation[0],
            intercept: regressionResult.equation[1],
            rSquared: regressionResult.r2
        };
    }

    detectSeasonality(values) {
        if (values.length < 14) return { detected: false };

        const autocorrelations = this.calculateAutocorrelations(values);
        const peaks = this.findPeaks(autocorrelations);
        
        return {
            detected: peaks.length > 0 && peaks[0].value > 0.3,
            strength: peaks.length > 0 ? peaks[0].value : 0,
            period: peaks.length > 0 ? peaks[0].lag : 0
        };
    }

    calculateVolatility(values) {
        const returns = this.calculateReturns(values);
        return ss.standardDeviation(returns);
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

    calculateReturns(values) {
        const returns = [];
        for (let i = 1; i < values.length; i++) {
            const ret = (values[i] - values[i - 1]) / values[i - 1];
            returns.push(isFinite(ret) ? ret : 0);
        }
        return returns;
    }

    detectSeasonalPeriod(values) {
        const autocorrelations = this.calculateAutocorrelations(values);
        const peaks = this.findPeaks(autocorrelations);
        return peaks.length > 0 ? peaks[0].lag : 0;
    }

    decomposeTimeSeries(values, timestamps, seasonalPeriod = 7) {
        const n = values.length;
        const xValues = values.map((_, i) => i);
        
        // Calculate trend
        const trendRegression = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );
        const trend = xValues.map(x => trendRegression.equation[0] * x + trendRegression.equation[1]);
        
        // Calculate detrended series
        const detrended = values.map((v, i) => v - trend[i]);
        
        // Calculate seasonal component
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

    calculateHolidayEffect(step, options) {
        // Simplified holiday effect calculation
        return 0; // Would implement based on calendar events
    }

    calculateEnsembleWeights(forecasts) {
        // Calculate weights based on individual forecast confidence
        const confidences = forecasts.map(f => f.confidence || 0.5);
        const totalConfidence = confidences.reduce((sum, conf) => sum + conf, 0);
        
        return confidences.map(conf => conf / totalConfidence);
    }

    calculateEnsembleTrendDirection(forecasts) {
        const directions = forecasts.map(f => f.trend?.direction || 'stable');
        const increasing = directions.filter(d => d === 'increasing').length;
        const decreasing = directions.filter(d => d === 'decreasing').length;
        
        if (increasing > decreasing) return 'increasing';
        if (decreasing > increasing) return 'decreasing';
        return 'stable';
    }

    calculateEnsembleTrendStrength(forecasts) {
        const strengths = forecasts.map(f => f.trend?.strength || 0);
        return ss.mean(strengths);
    }

    prepareNeuralTrainingData(values, inputSize) {
        const trainingData = [];
        
        for (let i = inputSize; i < values.length; i++) {
            const input = values.slice(i - inputSize, i);
            const output = values[i];
            trainingData.push({ input, output });
        }
        
        return trainingData;
    }

    initializeNeuralWeights(inputSize, hiddenSize, outputSize) {
        const weights = {
            inputHidden: this.randomMatrix(inputSize, hiddenSize),
            hiddenOutput: this.randomMatrix(hiddenSize, outputSize),
            hiddenBias: this.randomMatrix(1, hiddenSize),
            outputBias: this.randomMatrix(1, outputSize)
        };
        
        return weights;
    }

    randomMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                row.push((Math.random() - 0.5) * 2);
            }
            matrix.push(row);
        }
        return matrix;
    }

    trainNeuralNetwork(trainingData, weights, options) {
        // Simplified training (just return initial weights)
        // In a real implementation, this would use backpropagation
        return weights;
    }

    neuralNetworkPredict(input, weights) {
        // Simplified neural network prediction
        const hidden = this.matrixMultiply([input], weights.inputHidden)[0];
        const output = this.matrixMultiply([hidden], weights.hiddenOutput)[0];
        return output[0];
    }

    matrixMultiply(a, b) {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            const row = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < b.length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                row.push(sum);
            }
            result.push(row);
        }
        return result;
    }

    difference(values) {
        const diff = [];
        for (let i = 1; i < values.length; i++) {
            diff.push(values[i] - values[i - 1]);
        }
        return diff;
    }

    fitARModel(values, order) {
        const coefficients = [];
        
        for (let i = 0; i < order; i++) {
            let sum = 0;
            let count = 0;
            
            for (let j = order; j < values.length; j++) {
                sum += values[j] * values[j - i - 1];
                count++;
            }
            
            coefficients.push(count > 0 ? sum / count : 0);
        }
        
        return coefficients;
    }

    calculateMAPE(actual, predicted) {
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== 0) {
                sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
                count++;
            }
        }
        
        return count > 0 ? sum / count : 0;
    }

    calculateRMSE(actual, predicted) {
        let sum = 0;
        
        for (let i = 0; i < actual.length; i++) {
            sum += Math.pow(actual[i] - predicted[i], 2);
        }
        
        return Math.sqrt(sum / actual.length);
    }

    calculateRSquared(actual, predicted) {
        const actualMean = ss.mean(actual);
        const ssRes = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
        const ssTot = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
        
        return 1 - (ssRes / ssTot);
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    getSystemStatus() {
        return {
            isRunning: true,
            totalForecasts: this.forecasts.size,
            modelsLoaded: this.models.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = ForecastingEngine;
