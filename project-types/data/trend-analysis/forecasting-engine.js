const ss = require('simple-statistics');
const regression = require('regression');
const { Matrix } = require('ml-matrix');

/**
 * Forecasting Engine v2.4
 * Advanced forecasting engine for time series data
 */
class ForecastingEngine {
    constructor(options = {}) {
        this.options = {
            modelType: 'ensemble',
            learningRate: 0.001,
            maxEpochs: 100,
            batchSize: 32,
            validationSplit: 0.2,
            ...options
        };
        
        this.models = new Map();
        this.forecasts = new Map();
        this.accuracy = new Map();
    }

    /**
     * Forecast trends for given metrics
     */
    async forecastTrends(projectId, metrics, horizon, options = {}) {
        try {
            const forecastId = this.generateId();
            const startTime = Date.now();

            const forecasts = {};

            for (const metric of metrics) {
                // Get historical data for the metric
                const data = await this.getHistoricalData(projectId, metric, options.timeRange);
                
                if (data.length < this.options.minDataPoints) {
                    forecasts[metric] = {
                        error: 'Insufficient data for forecasting',
                        confidence: 0
                    };
                    continue;
                }

                // Select best forecasting method
                const method = this.selectForecastingMethod(data, options);
                
                // Generate forecast
                const forecast = await this.generateForecast(data, horizon, method, options);
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
     * Generate forecast for a single metric
     */
    async generateForecast(data, horizon, method, options = {}) {
        try {
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
                case 'ensemble':
                    forecast = this.ensembleForecast(values, timestamps, horizon, options);
                    break;
                default:
                    forecast = this.linearForecast(values, horizon, options);
            }

            // Calculate accuracy if we have validation data
            if (options.validate) {
                forecast.accuracy = await this.calculateAccuracy(data, method, options.validationSplit);
            }

            return forecast;
        } catch (error) {
            throw new Error(`Forecast generation failed: ${error.message}`);
        }
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
        const intervals = [];

        for (let i = 0; i < horizon; i++) {
            const x = values.length + i;
            const predicted = slope * x + intercept;
            forecast.push(predicted);

            // Calculate confidence interval
            const error = Math.sqrt(1 - rSquared) * ss.standardDeviation(values);
            const margin = error * Math.sqrt(1 + 1 / values.length + Math.pow(x - ss.mean(xValues), 2) / ss.variance(xValues));
            
            confidence.push(Math.max(0, 1 - error / Math.abs(predicted)));
            intervals.push({
                lower: predicted - margin,
                upper: predicted + margin
            });
        }

        return {
            method: 'linear',
            values: forecast,
            confidence: ss.mean(confidence),
            intervals,
            accuracy: rSquared,
            parameters: { slope, intercept }
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
            method: 'exponential',
            values: forecast,
            confidence: ss.mean(confidence),
            intervals,
            accuracy: rSquared,
            parameters: { slope, intercept }
        };
    }

    /**
     * Seasonal forecast
     */
    seasonalForecast(values, timestamps, horizon, options = {}) {
        // Decompose time series
        const decomposition = this.decomposeTimeSeries(values, timestamps);
        
        const forecast = [];
        const confidence = [];
        const intervals = [];

        for (let i = 0; i < horizon; i++) {
            // Extend trend
            const trendValue = this.extendTrend(decomposition.trend, i + 1);
            
            // Apply seasonal component
            const seasonalIndex = (decomposition.trend.length + i) % decomposition.seasonal.length;
            const seasonalValue = decomposition.seasonal[seasonalIndex];
            
            const predicted = trendValue + seasonalValue;
            forecast.push(predicted);

            // Simple confidence calculation
            const seasonalStd = ss.standardDeviation(decomposition.seasonal);
            confidence.push(Math.max(0, 1 - seasonalStd / Math.abs(predicted)));
            intervals.push({
                lower: predicted * 0.8,
                upper: predicted * 1.2
            });
        }

        return {
            method: 'seasonal',
            values: forecast,
            confidence: ss.mean(confidence),
            intervals,
            accuracy: 0.7, // Simplified
            parameters: {
                seasonalPeriod: decomposition.seasonal.length,
                trendSlope: this.calculateTrendSlope(decomposition.trend)
            }
        };
    }

    /**
     * ARIMA forecast (simplified)
     */
    arimaForecast(values, horizon, options = {}) {
        // Simplified ARIMA implementation
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
        const intervals = [];

        for (let i = 0; i < horizon; i++) {
            let predicted = 0;
            
            // AR component
            for (let j = 0; j < Math.min(p, diffValues.length); j++) {
                predicted += arCoefficients[j] * diffValues[diffValues.length - 1 - j];
            }

            forecast.push(predicted);
            confidence.push(0.6); // Simplified
            intervals.push({
                lower: predicted * 0.9,
                upper: predicted * 1.1
            });
        }

        return {
            method: 'arima',
            values: forecast,
            confidence: ss.mean(confidence),
            intervals,
            accuracy: 0.6, // Simplified
            parameters: { p, d, q, arCoefficients }
        };
    }

    /**
     * Neural network forecast (simplified)
     */
    neuralForecast(values, horizon, options = {}) {
        // Simplified neural network implementation
        const inputSize = Math.min(10, Math.floor(values.length / 2));
        const hiddenSize = Math.floor(inputSize * 1.5);
        
        // Prepare training data
        const trainingData = this.prepareNeuralTrainingData(values, inputSize);
        
        // Simple neural network weights (random initialization)
        const weights = this.initializeNeuralWeights(inputSize, hiddenSize, 1);
        
        // Train network (simplified)
        const trainedWeights = this.trainNeuralNetwork(trainingData, weights, options);
        
        // Generate forecast
        const forecast = [];
        const confidence = [];
        const intervals = [];

        for (let i = 0; i < horizon; i++) {
            const input = values.slice(-inputSize);
            const predicted = this.neuralNetworkPredict(input, trainedWeights);
            
            forecast.push(predicted);
            confidence.push(0.7); // Simplified
            intervals.push({
                lower: predicted * 0.85,
                upper: predicted * 1.15
            });
        }

        return {
            method: 'neural',
            values: forecast,
            confidence: ss.mean(confidence),
            intervals,
            accuracy: 0.7, // Simplified
            parameters: { inputSize, hiddenSize, weights: trainedWeights }
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

        // Combine forecasts using weighted average
        const weights = this.calculateEnsembleWeights([
            linearForecast,
            exponentialForecast,
            seasonalForecast,
            arimaForecast
        ]);

        const ensembleForecast = [];
        const ensembleConfidence = [];
        const ensembleIntervals = [];

        for (let i = 0; i < horizon; i++) {
            let weightedValue = 0;
            let weightedConfidence = 0;
            let lowerSum = 0;
            let upperSum = 0;

            [linearForecast, exponentialForecast, seasonalForecast, arimaForecast].forEach((forecast, index) => {
                const weight = weights[index];
                weightedValue += forecast.values[i] * weight;
                weightedConfidence += forecast.confidence * weight;
                lowerSum += forecast.intervals[i].lower * weight;
                upperSum += forecast.intervals[i].upper * weight;
            });

            ensembleForecast.push(weightedValue);
            ensembleConfidence.push(weightedConfidence);
            ensembleIntervals.push({
                lower: lowerSum,
                upper: upperSum
            });
        }

        return {
            method: 'ensemble',
            values: ensembleForecast,
            confidence: ss.mean(ensembleConfidence),
            intervals: ensembleIntervals,
            accuracy: this.calculateEnsembleAccuracy([
                linearForecast,
                exponentialForecast,
                seasonalForecast,
                arimaForecast
            ]),
            parameters: { weights, methods: ['linear', 'exponential', 'seasonal', 'arima'] }
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

        // Select method based on characteristics
        if (seasonality.detected && seasonality.strength > 0.3) {
            return 'seasonal';
        } else if (trend.rSquared > 0.8 && trend.slope > 0.1) {
            return 'exponential';
        } else if (trend.rSquared > 0.6) {
            return 'linear';
        } else if (volatility > 0.2) {
            return 'arima';
        } else {
            return 'ensemble';
        }
    }

    /**
     * Calculate forecast accuracy
     */
    async calculateAccuracy(data, method, validationSplit = 0.2) {
        const splitIndex = Math.floor(data.length * (1 - validationSplit));
        const trainingData = data.slice(0, splitIndex);
        const validationData = data.slice(splitIndex);

        if (validationData.length < 2) {
            return 0.5; // Default accuracy
        }

        // Generate forecast for validation period
        const forecast = await this.generateForecast(
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
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            // Generate realistic mock data
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

        // Simple seasonality detection using autocorrelation
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

    decomposeTimeSeries(values, timestamps) {
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
        const seasonalPeriod = 7; // Weekly
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

    calculateTrendSlope(trend) {
        if (trend.length < 2) return 0;
        
        const xValues = trend.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, trend[i]])
        );
        
        return regressionResult.equation[0];
    }

    difference(values) {
        const diff = [];
        for (let i = 1; i < values.length; i++) {
            diff.push(values[i] - values[i - 1]);
        }
        return diff;
    }

    fitARModel(values, order) {
        // Simplified AR model fitting
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

    calculateEnsembleWeights(forecasts) {
        // Calculate weights based on individual forecast accuracy
        const accuracies = forecasts.map(f => f.accuracy || 0.5);
        const totalAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0);
        
        return accuracies.map(acc => acc / totalAccuracy);
    }

    calculateEnsembleAccuracy(forecasts) {
        const accuracies = forecasts.map(f => f.accuracy || 0.5);
        return ss.mean(accuracies);
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
