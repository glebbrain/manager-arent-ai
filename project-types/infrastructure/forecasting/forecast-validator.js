const ss = require('simple-statistics');

/**
 * Forecast Validator v2.4
 * Validates forecast accuracy and reliability
 */
class ForecastValidator {
    constructor(options = {}) {
        this.options = {
            minAccuracy: 0.7,
            maxBias: 0.1,
            maxVolatility: 0.3,
            confidenceThreshold: 0.8,
            ...options
        };
        
        this.validationHistory = new Map();
        this.accuracyMetrics = new Map();
    }

    /**
     * Validate forecast
     */
    async validateForecast(forecastId, actualData, forecastData, options = {}) {
        try {
            const startTime = Date.now();
            
            // Basic validation
            const basicValidation = this.performBasicValidation(forecastData, actualData);
            if (!basicValidation.isValid) {
                return {
                    forecastId,
                    isValid: false,
                    errors: basicValidation.errors,
                    timestamp: new Date().toISOString()
                };
            }

            // Calculate accuracy metrics
            const accuracyMetrics = this.calculateAccuracyMetrics(actualData, forecastData);
            
            // Calculate bias metrics
            const biasMetrics = this.calculateBiasMetrics(actualData, forecastData);
            
            // Calculate volatility metrics
            const volatilityMetrics = this.calculateVolatilityMetrics(actualData, forecastData);
            
            // Calculate confidence metrics
            const confidenceMetrics = this.calculateConfidenceMetrics(forecastData);
            
            // Calculate trend accuracy
            const trendAccuracy = this.calculateTrendAccuracy(actualData, forecastData);
            
            // Calculate seasonal accuracy
            const seasonalAccuracy = this.calculateSeasonalAccuracy(actualData, forecastData);
            
            // Calculate overall validation score
            const validationScore = this.calculateValidationScore({
                accuracy: accuracyMetrics,
                bias: biasMetrics,
                volatility: volatilityMetrics,
                confidence: confidenceMetrics,
                trend: trendAccuracy,
                seasonal: seasonalAccuracy
            });

            // Determine if forecast is valid
            const isValid = this.determineValidity(validationScore, options);
            
            // Generate validation insights
            const insights = this.generateValidationInsights({
                accuracy: accuracyMetrics,
                bias: biasMetrics,
                volatility: volatilityMetrics,
                confidence: confidenceMetrics,
                trend: trendAccuracy,
                seasonal: seasonalAccuracy,
                validationScore
            });

            // Generate recommendations
            const recommendations = this.generateValidationRecommendations(validationScore, insights);

            const result = {
                forecastId,
                isValid,
                validationScore,
                metrics: {
                    accuracy: accuracyMetrics,
                    bias: biasMetrics,
                    volatility: volatilityMetrics,
                    confidence: confidenceMetrics,
                    trend: trendAccuracy,
                    seasonal: seasonalAccuracy
                },
                insights,
                recommendations,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            // Store validation history
            this.validationHistory.set(forecastId, result);
            this.updateAccuracyMetrics(forecastId, accuracyMetrics);

            return result;
        } catch (error) {
            throw new Error(`Forecast validation failed: ${error.message}`);
        }
    }

    /**
     * Perform basic validation
     */
    performBasicValidation(forecastData, actualData) {
        const errors = [];

        // Check data types
        if (!Array.isArray(forecastData)) {
            errors.push('Forecast data must be an array');
        }

        if (!Array.isArray(actualData)) {
            errors.push('Actual data must be an array');
        }

        // Check data length
        if (forecastData.length === 0) {
            errors.push('Forecast data cannot be empty');
        }

        if (actualData.length === 0) {
            errors.push('Actual data cannot be empty');
        }

        // Check for valid numeric values
        const forecastValues = forecastData.map(d => typeof d === 'number' ? d : d.value);
        const actualValues = actualData.map(d => typeof d === 'number' ? d : d.value);

        const invalidForecast = forecastValues.some(v => !isFinite(v) || v < 0);
        const invalidActual = actualValues.some(v => !isFinite(v) || v < 0);

        if (invalidForecast) {
            errors.push('Forecast data contains invalid values');
        }

        if (invalidActual) {
            errors.push('Actual data contains invalid values');
        }

        // Check data alignment
        if (forecastData.length !== actualData.length) {
            errors.push('Forecast and actual data must have the same length');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calculate accuracy metrics
     */
    calculateAccuracyMetrics(actualData, forecastData) {
        const actualValues = actualData.map(d => typeof d === 'number' ? d : d.value);
        const forecastValues = forecastData.map(d => typeof d === 'number' ? d : d.value);

        // Mean Absolute Error (MAE)
        const mae = this.calculateMAE(actualValues, forecastValues);
        
        // Mean Absolute Percentage Error (MAPE)
        const mape = this.calculateMAPE(actualValues, forecastValues);
        
        // Root Mean Square Error (RMSE)
        const rmse = this.calculateRMSE(actualValues, forecastValues);
        
        // Mean Absolute Scaled Error (MASE)
        const mase = this.calculateMASE(actualValues, forecastValues);
        
        // Symmetric Mean Absolute Percentage Error (sMAPE)
        const smape = this.calculateSMAPE(actualValues, forecastValues);
        
        // Overall accuracy score
        const accuracyScore = this.calculateAccuracyScore(mae, mape, rmse, mase, smape);

        return {
            mae,
            mape,
            rmse,
            mase,
            smape,
            accuracyScore
        };
    }

    /**
     * Calculate bias metrics
     */
    calculateBiasMetrics(actualData, forecastData) {
        const actualValues = actualData.map(d => typeof d === 'number' ? d : d.value);
        const forecastValues = forecastData.map(d => typeof d === 'number' ? d : d.value);

        // Mean Error (ME)
        const me = this.calculateME(actualValues, forecastValues);
        
        // Mean Percentage Error (MPE)
        const mpe = this.calculateMPE(actualValues, forecastValues);
        
        // Bias ratio
        const biasRatio = this.calculateBiasRatio(actualValues, forecastValues);
        
        // Directional accuracy
        const directionalAccuracy = this.calculateDirectionalAccuracy(actualValues, forecastValues);
        
        // Overall bias score
        const biasScore = this.calculateBiasScore(me, mpe, biasRatio, directionalAccuracy);

        return {
            me,
            mpe,
            biasRatio,
            directionalAccuracy,
            biasScore
        };
    }

    /**
     * Calculate volatility metrics
     */
    calculateVolatilityMetrics(actualData, forecastData) {
        const actualValues = actualData.map(d => typeof d === 'number' ? d : d.value);
        const forecastValues = forecastData.map(d => typeof d === 'number' ? d : d.value);

        // Actual volatility
        const actualVolatility = this.calculateVolatility(actualValues);
        
        // Forecast volatility
        const forecastVolatility = this.calculateVolatility(forecastValues);
        
        // Volatility ratio
        const volatilityRatio = forecastVolatility / actualVolatility;
        
        // Volatility accuracy
        const volatilityAccuracy = this.calculateVolatilityAccuracy(actualValues, forecastValues);
        
        // Overall volatility score
        const volatilityScore = this.calculateVolatilityScore(volatilityRatio, volatilityAccuracy);

        return {
            actualVolatility,
            forecastVolatility,
            volatilityRatio,
            volatilityAccuracy,
            volatilityScore
        };
    }

    /**
     * Calculate confidence metrics
     */
    calculateConfidenceMetrics(forecastData) {
        const confidenceValues = forecastData.map(d => d.confidence || 0.5);
        
        // Average confidence
        const averageConfidence = ss.mean(confidenceValues);
        
        // Confidence consistency
        const confidenceConsistency = 1 - ss.standardDeviation(confidenceValues);
        
        // Confidence trend
        const confidenceTrend = this.calculateConfidenceTrend(confidenceValues);
        
        // Overall confidence score
        const confidenceScore = this.calculateConfidenceScore(averageConfidence, confidenceConsistency, confidenceTrend);

        return {
            averageConfidence,
            confidenceConsistency,
            confidenceTrend,
            confidenceScore
        };
    }

    /**
     * Calculate trend accuracy
     */
    calculateTrendAccuracy(actualData, forecastData) {
        const actualValues = actualData.map(d => typeof d === 'number' ? d : d.value);
        const forecastValues = forecastData.map(d => typeof d === 'number' ? d : d.value);

        // Calculate trends
        const actualTrend = this.calculateTrend(actualValues);
        const forecastTrend = this.calculateTrend(forecastValues);
        
        // Trend direction accuracy
        const trendDirectionAccuracy = this.calculateTrendDirectionAccuracy(actualTrend, forecastTrend);
        
        // Trend magnitude accuracy
        const trendMagnitudeAccuracy = this.calculateTrendMagnitudeAccuracy(actualTrend, forecastTrend);
        
        // Overall trend accuracy
        const trendAccuracy = (trendDirectionAccuracy + trendMagnitudeAccuracy) / 2;

        return {
            actualTrend,
            forecastTrend,
            trendDirectionAccuracy,
            trendMagnitudeAccuracy,
            trendAccuracy
        };
    }

    /**
     * Calculate seasonal accuracy
     */
    calculateSeasonalAccuracy(actualData, forecastData) {
        const actualValues = actualData.map(d => typeof d === 'number' ? d : d.value);
        const forecastValues = forecastData.map(d => typeof d === 'number' ? d : d.value);

        // Detect seasonal patterns
        const actualSeasonal = this.detectSeasonalPattern(actualValues);
        const forecastSeasonal = this.detectSeasonalPattern(forecastValues);
        
        // Seasonal pattern accuracy
        const seasonalPatternAccuracy = this.calculateSeasonalPatternAccuracy(actualSeasonal, forecastSeasonal);
        
        // Seasonal amplitude accuracy
        const seasonalAmplitudeAccuracy = this.calculateSeasonalAmplitudeAccuracy(actualValues, forecastValues);
        
        // Overall seasonal accuracy
        const seasonalAccuracy = (seasonalPatternAccuracy + seasonalAmplitudeAccuracy) / 2;

        return {
            actualSeasonal,
            forecastSeasonal,
            seasonalPatternAccuracy,
            seasonalAmplitudeAccuracy,
            seasonalAccuracy
        };
    }

    /**
     * Calculate validation score
     */
    calculateValidationScore(metrics) {
        const weights = {
            accuracy: 0.3,
            bias: 0.2,
            volatility: 0.15,
            confidence: 0.15,
            trend: 0.1,
            seasonal: 0.1
        };

        const score = 
            metrics.accuracy.accuracyScore * weights.accuracy +
            metrics.bias.biasScore * weights.bias +
            metrics.volatility.volatilityScore * weights.volatility +
            metrics.confidence.confidenceScore * weights.confidence +
            metrics.trend.trendAccuracy * weights.trend +
            metrics.seasonal.seasonalAccuracy * weights.seasonal;

        return Math.max(0, Math.min(1, score));
    }

    /**
     * Determine if forecast is valid
     */
    determineValidity(validationScore, options = {}) {
        const minScore = options.minScore || this.options.minAccuracy;
        const maxBias = options.maxBias || this.options.maxBias;
        const maxVolatility = options.maxVolatility || this.options.maxVolatility;
        const minConfidence = options.minConfidence || this.options.confidenceThreshold;

        return validationScore >= minScore;
    }

    /**
     * Generate validation insights
     */
    generateValidationInsights(metrics) {
        const insights = [];

        // Accuracy insights
        if (metrics.accuracy.accuracyScore > 0.8) {
            insights.push({
                type: 'high_accuracy',
                message: 'Forecast shows high accuracy',
                score: metrics.accuracy.accuracyScore,
                priority: 'info'
            });
        } else if (metrics.accuracy.accuracyScore < 0.5) {
            insights.push({
                type: 'low_accuracy',
                message: 'Forecast shows low accuracy',
                score: metrics.accuracy.accuracyScore,
                priority: 'warning'
            });
        }

        // Bias insights
        if (Math.abs(metrics.bias.me) > 0.1) {
            insights.push({
                type: 'bias_detected',
                message: `Forecast shows ${metrics.bias.me > 0 ? 'positive' : 'negative'} bias`,
                bias: metrics.bias.me,
                priority: 'warning'
            });
        }

        // Volatility insights
        if (metrics.volatility.volatilityRatio > 1.5) {
            insights.push({
                type: 'high_volatility',
                message: 'Forecast shows higher volatility than actual data',
                ratio: metrics.volatility.volatilityRatio,
                priority: 'warning'
            });
        }

        // Confidence insights
        if (metrics.confidence.averageConfidence < 0.6) {
            insights.push({
                type: 'low_confidence',
                message: 'Forecast shows low confidence',
                confidence: metrics.confidence.averageConfidence,
                priority: 'warning'
            });
        }

        return insights;
    }

    /**
     * Generate validation recommendations
     */
    generateValidationRecommendations(validationScore, insights) {
        const recommendations = [];

        // Accuracy recommendations
        if (validationScore < 0.6) {
            recommendations.push({
                type: 'improve_accuracy',
                message: 'Consider using more sophisticated forecasting methods or additional data sources',
                priority: 'high',
                action: 'method_improvement'
            });
        }

        // Bias recommendations
        const biasInsight = insights.find(i => i.type === 'bias_detected');
        if (biasInsight) {
            recommendations.push({
                type: 'correct_bias',
                message: 'Implement bias correction techniques',
                priority: 'medium',
                action: 'bias_correction'
            });
        }

        // Volatility recommendations
        const volatilityInsight = insights.find(i => i.type === 'high_volatility');
        if (volatilityInsight) {
            recommendations.push({
                type: 'reduce_volatility',
                message: 'Consider smoothing techniques or volatility modeling',
                priority: 'medium',
                action: 'volatility_management'
            });
        }

        // Confidence recommendations
        const confidenceInsight = insights.find(i => i.type === 'low_confidence');
        if (confidenceInsight) {
            recommendations.push({
                type: 'improve_confidence',
                message: 'Increase data quality or use ensemble methods',
                priority: 'high',
                action: 'confidence_improvement'
            });
        }

        return recommendations;
    }

    /**
     * Helper methods for accuracy calculations
     */
    calculateMAE(actual, forecast) {
        const errors = actual.map((a, i) => Math.abs(a - forecast[i]));
        return ss.mean(errors);
    }

    calculateMAPE(actual, forecast) {
        const errors = actual.map((a, i) => {
            if (a === 0) return 0;
            return Math.abs((a - forecast[i]) / a);
        });
        return ss.mean(errors) * 100;
    }

    calculateRMSE(actual, forecast) {
        const errors = actual.map((a, i) => Math.pow(a - forecast[i], 2));
        return Math.sqrt(ss.mean(errors));
    }

    calculateMASE(actual, forecast) {
        const errors = actual.map((a, i) => Math.abs(a - forecast[i]));
        const naiveErrors = actual.slice(1).map((a, i) => Math.abs(a - actual[i]));
        const mae = ss.mean(errors);
        const naiveMae = ss.mean(naiveErrors);
        return mae / naiveMae;
    }

    calculateSMAPE(actual, forecast) {
        const errors = actual.map((a, i) => {
            const numerator = Math.abs(a - forecast[i]);
            const denominator = (Math.abs(a) + Math.abs(forecast[i])) / 2;
            return denominator === 0 ? 0 : numerator / denominator;
        });
        return ss.mean(errors) * 100;
    }

    calculateAccuracyScore(mae, mape, rmse, mase, smape) {
        // Normalize metrics to 0-1 scale
        const maeScore = Math.max(0, 1 - mae / 100);
        const mapeScore = Math.max(0, 1 - mape / 100);
        const rmseScore = Math.max(0, 1 - rmse / 100);
        const maseScore = Math.max(0, 1 - mase);
        const smapeScore = Math.max(0, 1 - smape / 100);

        return (maeScore + mapeScore + rmseScore + maseScore + smapeScore) / 5;
    }

    /**
     * Helper methods for bias calculations
     */
    calculateME(actual, forecast) {
        const errors = actual.map((a, i) => a - forecast[i]);
        return ss.mean(errors);
    }

    calculateMPE(actual, forecast) {
        const errors = actual.map((a, i) => {
            if (a === 0) return 0;
            return (a - forecast[i]) / a;
        });
        return ss.mean(errors) * 100;
    }

    calculateBiasRatio(actual, forecast) {
        const actualMean = ss.mean(actual);
        const forecastMean = ss.mean(forecast);
        return Math.abs(forecastMean - actualMean) / actualMean;
    }

    calculateDirectionalAccuracy(actual, forecast) {
        let correct = 0;
        for (let i = 1; i < actual.length; i++) {
            const actualDirection = actual[i] > actual[i - 1] ? 1 : -1;
            const forecastDirection = forecast[i] > forecast[i - 1] ? 1 : -1;
            if (actualDirection === forecastDirection) correct++;
        }
        return correct / (actual.length - 1);
    }

    calculateBiasScore(me, mpe, biasRatio, directionalAccuracy) {
        const meScore = Math.max(0, 1 - Math.abs(me) / 10);
        const mpeScore = Math.max(0, 1 - Math.abs(mpe) / 100);
        const biasRatioScore = Math.max(0, 1 - biasRatio);
        const directionalScore = directionalAccuracy;

        return (meScore + mpeScore + biasRatioScore + directionalScore) / 4;
    }

    /**
     * Helper methods for volatility calculations
     */
    calculateVolatility(values) {
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

    calculateVolatilityAccuracy(actual, forecast) {
        const actualVol = this.calculateVolatility(actual);
        const forecastVol = this.calculateVolatility(forecast);
        const volDiff = Math.abs(actualVol - forecastVol);
        return Math.max(0, 1 - volDiff / actualVol);
    }

    calculateVolatilityScore(volatilityRatio, volatilityAccuracy) {
        const ratioScore = Math.max(0, 1 - Math.abs(volatilityRatio - 1));
        return (ratioScore + volatilityAccuracy) / 2;
    }

    /**
     * Helper methods for confidence calculations
     */
    calculateConfidenceTrend(confidenceValues) {
        if (confidenceValues.length < 2) return 0;
        
        const xValues = confidenceValues.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, confidenceValues[i]])
        );
        
        return regressionResult.equation[0]; // slope
    }

    calculateConfidenceScore(averageConfidence, confidenceConsistency, confidenceTrend) {
        const consistencyScore = Math.max(0, confidenceConsistency);
        const trendScore = confidenceTrend > 0 ? 1 : Math.max(0, 1 + confidenceTrend);
        
        return (averageConfidence + consistencyScore + trendScore) / 3;
    }

    /**
     * Helper methods for trend calculations
     */
    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const xValues = values.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );
        
        return regressionResult.equation[0]; // slope
    }

    calculateTrendDirectionAccuracy(actualTrend, forecastTrend) {
        const actualDirection = actualTrend > 0 ? 1 : actualTrend < 0 ? -1 : 0;
        const forecastDirection = forecastTrend > 0 ? 1 : forecastTrend < 0 ? -1 : 0;
        return actualDirection === forecastDirection ? 1 : 0;
    }

    calculateTrendMagnitudeAccuracy(actualTrend, forecastTrend) {
        if (actualTrend === 0) return forecastTrend === 0 ? 1 : 0;
        const ratio = forecastTrend / actualTrend;
        return Math.max(0, 1 - Math.abs(ratio - 1));
    }

    /**
     * Helper methods for seasonal calculations
     */
    detectSeasonalPattern(values) {
        if (values.length < 14) return null;
        
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

    calculateSeasonalPatternAccuracy(actualSeasonal, forecastSeasonal) {
        if (!actualSeasonal || !forecastSeasonal) return 0;
        return actualSeasonal === forecastSeasonal ? 1 : 0;
    }

    calculateSeasonalAmplitudeAccuracy(actual, forecast) {
        const actualAmplitude = this.calculateAmplitude(actual);
        const forecastAmplitude = this.calculateAmplitude(forecast);
        
        if (actualAmplitude === 0) return forecastAmplitude === 0 ? 1 : 0;
        
        const ratio = forecastAmplitude / actualAmplitude;
        return Math.max(0, 1 - Math.abs(ratio - 1));
    }

    calculateAmplitude(values) {
        const mean = ss.mean(values);
        const max = Math.max(...values);
        const min = Math.min(...values);
        return (max - min) / mean;
    }

    /**
     * Update accuracy metrics
     */
    updateAccuracyMetrics(forecastId, accuracyMetrics) {
        if (!this.accuracyMetrics.has(forecastId)) {
            this.accuracyMetrics.set(forecastId, []);
        }
        
        const history = this.accuracyMetrics.get(forecastId);
        history.push({
            timestamp: new Date().toISOString(),
            metrics: accuracyMetrics
        });
        
        // Keep only last 100 entries
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
    }

    /**
     * Get validation history
     */
    getValidationHistory(forecastId) {
        return this.validationHistory.get(forecastId) || null;
    }

    /**
     * Get accuracy trends
     */
    getAccuracyTrends(forecastId) {
        const history = this.accuracyMetrics.get(forecastId) || [];
        if (history.length < 2) return null;
        
        const accuracyScores = history.map(h => h.metrics.accuracyScore);
        const trend = this.calculateTrend(accuracyScores);
        
        return {
            trend,
            current: accuracyScores[accuracyScores.length - 1],
            average: ss.mean(accuracyScores),
            volatility: ss.standardDeviation(accuracyScores)
        };
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            isRunning: true,
            totalValidations: this.validationHistory.size,
            accuracyMetrics: this.accuracyMetrics.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = ForecastValidator;
