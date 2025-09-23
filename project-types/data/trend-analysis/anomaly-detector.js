const ss = require('simple-statistics');
const { Matrix } = require('ml-matrix');

/**
 * Anomaly Detector v2.4
 * Advanced anomaly detection for time series data
 */
class AnomalyDetector {
    constructor(options = {}) {
        this.options = {
            modelType: 'ensemble',
            learningRate: 0.001,
            maxEpochs: 100,
            batchSize: 32,
            validationSplit: 0.2,
            ...options
        };
        
        this.anomalies = new Map();
        this.models = new Map();
        this.thresholds = new Map();
    }

    /**
     * Detect anomalies in data
     */
    async detectAnomalies(projectId, data, sensitivity = 0.5, options = {}) {
        try {
            const anomalyId = this.generateId();
            const startTime = Date.now();

            const values = data.map(d => d.value);
            const timestamps = data.map(d => d.timestamp);

            // Apply multiple detection methods
            const statisticalAnomalies = this.detectStatisticalAnomalies(values, timestamps, sensitivity);
            const isolationForestAnomalies = this.detectIsolationForestAnomalies(values, timestamps, sensitivity);
            const lstmAnomalies = this.detectLSTMAnomalies(values, timestamps, sensitivity);
            const seasonalAnomalies = this.detectSeasonalAnomalies(values, timestamps, sensitivity);

            // Combine results using ensemble approach
            const combinedAnomalies = this.combineAnomalyResults([
                statisticalAnomalies,
                isolationForestAnomalies,
                lstmAnomalies,
                seasonalAnomalies
            ], sensitivity);

            // Calculate anomaly scores and severity
            const scoredAnomalies = this.scoreAnomalies(combinedAnomalies, values, timestamps);

            const result = {
                anomalyId,
                projectId,
                anomalies: scoredAnomalies,
                sensitivity,
                detectionMethods: {
                    statistical: statisticalAnomalies.length,
                    isolationForest: isolationForestAnomalies.length,
                    lstm: lstmAnomalies.length,
                    seasonal: seasonalAnomalies.length
                },
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.anomalies.set(anomalyId, result);
            return result;
        } catch (error) {
            throw new Error(`Anomaly detection failed: ${error.message}`);
        }
    }

    /**
     * Statistical anomaly detection
     */
    detectStatisticalAnomalies(values, timestamps, sensitivity) {
        const anomalies = [];
        const mean = ss.mean(values);
        const std = ss.standardDeviation(values);
        const threshold = mean + (sensitivity * 3 * std);

        values.forEach((value, index) => {
            const zScore = Math.abs((value - mean) / std);
            
            if (zScore > (2 + sensitivity)) {
                anomalies.push({
                    index,
                    timestamp: timestamps[index],
                    value,
                    zScore,
                    method: 'statistical',
                    severity: this.calculateSeverity(zScore),
                    type: value > mean ? 'high' : 'low'
                });
            }
        });

        return anomalies;
    }

    /**
     * Isolation Forest anomaly detection
     */
    detectIsolationForestAnomalies(values, timestamps, sensitivity) {
        const anomalies = [];
        const features = this.extractFeatures(values);
        const scores = this.calculateIsolationScores(features);
        
        const threshold = this.calculateIsolationThreshold(scores, sensitivity);

        scores.forEach((score, index) => {
            if (score > threshold) {
                anomalies.push({
                    index,
                    timestamp: timestamps[index],
                    value: values[index],
                    score,
                    method: 'isolation_forest',
                    severity: this.calculateSeverity(score * 10), // Scale for severity calculation
                    type: 'outlier'
                });
            }
        });

        return anomalies;
    }

    /**
     * LSTM-based anomaly detection
     */
    detectLSTMAnomalies(values, timestamps, sensitivity) {
        const anomalies = [];
        const windowSize = Math.min(10, Math.floor(values.length / 3));
        
        if (values.length < windowSize + 1) {
            return anomalies;
        }

        // Generate predictions using simple LSTM-like approach
        const predictions = this.generateLSTMPredictions(values, windowSize);
        const errors = this.calculatePredictionErrors(values, predictions, windowSize);
        
        const errorThreshold = this.calculateErrorThreshold(errors, sensitivity);

        errors.forEach((error, index) => {
            if (error > errorThreshold) {
                const actualIndex = index + windowSize;
                anomalies.push({
                    index: actualIndex,
                    timestamp: timestamps[actualIndex],
                    value: values[actualIndex],
                    prediction: predictions[index],
                    error,
                    method: 'lstm',
                    severity: this.calculateSeverity(error * 10),
                    type: 'prediction_error'
                });
            }
        });

        return anomalies;
    }

    /**
     * Seasonal anomaly detection
     */
    detectSeasonalAnomalies(values, timestamps, sensitivity) {
        const anomalies = [];
        const seasonalPeriod = this.detectSeasonalPeriod(values);
        
        if (seasonalPeriod < 2) {
            return anomalies;
        }

        // Calculate seasonal patterns
        const seasonalPattern = this.calculateSeasonalPattern(values, seasonalPeriod);
        const seasonalDeviations = this.calculateSeasonalDeviations(values, seasonalPattern);

        const deviationThreshold = this.calculateDeviationThreshold(seasonalDeviations, sensitivity);

        seasonalDeviations.forEach((deviation, index) => {
            if (Math.abs(deviation) > deviationThreshold) {
                anomalies.push({
                    index,
                    timestamp: timestamps[index],
                    value: values[index],
                    expected: values[index] - deviation,
                    deviation,
                    method: 'seasonal',
                    severity: this.calculateSeverity(Math.abs(deviation) * 10),
                    type: deviation > 0 ? 'high' : 'low'
                });
            }
        });

        return anomalies;
    }

    /**
     * Combine anomaly results from multiple methods
     */
    combineAnomalyResults(anomalyResults, sensitivity) {
        const combinedAnomalies = new Map();
        
        // Collect all anomalies by index
        anomalyResults.forEach(anomalies => {
            anomalies.forEach(anomaly => {
                const key = anomaly.index;
                if (!combinedAnomalies.has(key)) {
                    combinedAnomalies.set(key, []);
                }
                combinedAnomalies.get(key).push(anomaly);
            });
        });

        // Combine anomalies at the same index
        const finalAnomalies = [];
        combinedAnomalies.forEach((anomalies, index) => {
            if (anomalies.length >= 2) { // Require at least 2 methods to agree
                const combinedAnomaly = this.combineAnomaly(anomalies, sensitivity);
                finalAnomalies.push(combinedAnomaly);
            }
        });

        return finalAnomalies.sort((a, b) => b.score - a.score);
    }

    /**
     * Combine individual anomalies into a single anomaly
     */
    combineAnomaly(anomalies, sensitivity) {
        const methods = anomalies.map(a => a.method);
        const severities = anomalies.map(a => a.severity);
        const scores = anomalies.map(a => a.zScore || a.score || a.error || Math.abs(a.deviation) || 0);
        
        // Calculate combined score
        const combinedScore = ss.mean(scores);
        const methodAgreement = anomalies.length / 4; // 4 total methods
        const finalScore = combinedScore * methodAgreement;

        return {
            index: anomalies[0].index,
            timestamp: anomalies[0].timestamp,
            value: anomalies[0].value,
            score: finalScore,
            methods,
            severity: this.calculateSeverity(finalScore),
            type: this.determineAnomalyType(anomalies),
            confidence: methodAgreement,
            details: anomalies
        };
    }

    /**
     * Score anomalies based on multiple factors
     */
    scoreAnomalies(anomalies, values, timestamps) {
        return anomalies.map(anomaly => {
            const contextScore = this.calculateContextScore(anomaly, values, timestamps);
            const temporalScore = this.calculateTemporalScore(anomaly, timestamps);
            const magnitudeScore = this.calculateMagnitudeScore(anomaly, values);
            
            const finalScore = (anomaly.score + contextScore + temporalScore + magnitudeScore) / 4;
            
            return {
                ...anomaly,
                score: finalScore,
                severity: this.calculateSeverity(finalScore),
                contextScore,
                temporalScore,
                magnitudeScore
            };
        });
    }

    /**
     * Helper methods
     */
    extractFeatures(values) {
        const features = [];
        const windowSize = Math.min(5, Math.floor(values.length / 3));
        
        for (let i = windowSize; i < values.length; i++) {
            const window = values.slice(i - windowSize, i);
            features.push({
                mean: ss.mean(window),
                std: ss.standardDeviation(window),
                min: Math.min(...window),
                max: Math.max(...window),
                range: Math.max(...window) - Math.min(...window),
                current: values[i],
                trend: this.calculateTrend(window)
            });
        }
        
        return features;
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const xValues = values.map((_, i) => i);
        const regression = require('regression');
        const result = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );
        
        return result.equation[0];
    }

    calculateIsolationScores(features) {
        // Simplified Isolation Forest implementation
        const scores = [];
        const nTrees = 100;
        const maxSamples = Math.min(256, features.length);
        
        for (let i = 0; i < features.length; i++) {
            let totalScore = 0;
            
            for (let tree = 0; tree < nTrees; tree++) {
                const sample = this.randomSample(features, maxSamples);
                const score = this.isolatePoint(features[i], sample, 0);
                totalScore += score;
            }
            
            scores.push(totalScore / nTrees);
        }
        
        return scores;
    }

    randomSample(features, size) {
        const shuffled = [...features].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, size);
    }

    isolatePoint(point, sample, depth) {
        if (sample.length <= 1 || depth > 10) {
            return depth;
        }
        
        const feature = this.selectRandomFeature(point);
        const splitValue = this.selectSplitValue(sample, feature);
        
        const leftSample = sample.filter(p => p[feature] < splitValue);
        const rightSample = sample.filter(p => p[feature] >= splitValue);
        
        if (leftSample.length === 0 || rightSample.length === 0) {
            return depth;
        }
        
        const nextSample = point[feature] < splitValue ? leftSample : rightSample;
        return this.isolatePoint(point, nextSample, depth + 1);
    }

    selectRandomFeature(point) {
        const features = Object.keys(point);
        return features[Math.floor(Math.random() * features.length)];
    }

    selectSplitValue(sample, feature) {
        const values = sample.map(p => p[feature]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return min + Math.random() * (max - min);
    }

    calculateIsolationThreshold(scores, sensitivity) {
        const sortedScores = [...scores].sort((a, b) => b - a);
        const thresholdIndex = Math.floor(sortedScores.length * (1 - sensitivity));
        return sortedScores[thresholdIndex] || 0;
    }

    generateLSTMPredictions(values, windowSize) {
        const predictions = [];
        
        for (let i = windowSize; i < values.length; i++) {
            const window = values.slice(i - windowSize, i);
            const prediction = this.simpleLSTMPredict(window);
            predictions.push(prediction);
        }
        
        return predictions;
    }

    simpleLSTMPredict(window) {
        // Simplified LSTM prediction using weighted average
        const weights = this.generateLSTMWeights(window.length);
        let prediction = 0;
        
        for (let i = 0; i < window.length; i++) {
            prediction += window[i] * weights[i];
        }
        
        return prediction;
    }

    generateLSTMWeights(length) {
        const weights = [];
        let sum = 0;
        
        for (let i = 0; i < length; i++) {
            const weight = Math.exp(-i * 0.1); // Exponential decay
            weights.push(weight);
            sum += weight;
        }
        
        return weights.map(w => w / sum);
    }

    calculatePredictionErrors(actual, predicted, windowSize) {
        const errors = [];
        
        for (let i = 0; i < predicted.length; i++) {
            const actualIndex = i + windowSize;
            const error = Math.abs(actual[actualIndex] - predicted[i]);
            errors.push(error);
        }
        
        return errors;
    }

    calculateErrorThreshold(errors, sensitivity) {
        const sortedErrors = [...errors].sort((a, b) => b - a);
        const thresholdIndex = Math.floor(sortedErrors.length * (1 - sensitivity));
        return sortedErrors[thresholdIndex] || 0;
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

    calculateSeasonalPattern(values, period) {
        const pattern = new Array(period).fill(0);
        const counts = new Array(period).fill(0);

        values.forEach((value, index) => {
            const periodIndex = index % period;
            pattern[periodIndex] += value;
            counts[periodIndex]++;
        });

        return pattern.map((sum, index) => sum / counts[index]);
    }

    calculateSeasonalDeviations(values, pattern) {
        const deviations = [];
        
        values.forEach((value, index) => {
            const patternIndex = index % pattern.length;
            const expected = pattern[patternIndex];
            const deviation = value - expected;
            deviations.push(deviation);
        });
        
        return deviations;
    }

    calculateDeviationThreshold(deviations, sensitivity) {
        const absDeviations = deviations.map(d => Math.abs(d));
        const sortedDeviations = [...absDeviations].sort((a, b) => b - a);
        const thresholdIndex = Math.floor(sortedDeviations.length * (1 - sensitivity));
        return sortedDeviations[thresholdIndex] || 0;
    }

    calculateSeverity(score) {
        if (score > 5) return 'critical';
        if (score > 3) return 'high';
        if (score > 2) return 'medium';
        return 'low';
    }

    determineAnomalyType(anomalies) {
        const types = anomalies.map(a => a.type);
        const typeCounts = {};
        
        types.forEach(type => {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        const mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
            typeCounts[a] > typeCounts[b] ? a : b
        );
        
        return mostCommonType;
    }

    calculateContextScore(anomaly, values, timestamps) {
        const index = anomaly.index;
        const contextWindow = 5;
        const start = Math.max(0, index - contextWindow);
        const end = Math.min(values.length, index + contextWindow + 1);
        
        const contextValues = values.slice(start, end);
        const contextMean = ss.mean(contextValues);
        const contextStd = ss.standardDeviation(contextValues);
        
        if (contextStd === 0) return 0;
        
        const zScore = Math.abs((anomaly.value - contextMean) / contextStd);
        return Math.min(zScore / 3, 1); // Normalize to 0-1
    }

    calculateTemporalScore(anomaly, timestamps) {
        const index = anomaly.index;
        const timestamp = new Date(anomaly.timestamp);
        
        // Check if anomaly occurs at unusual times
        const hour = timestamp.getHours();
        const dayOfWeek = timestamp.getDay();
        
        let score = 0;
        
        // Night time anomalies (2-6 AM) are more suspicious
        if (hour >= 2 && hour <= 6) {
            score += 0.3;
        }
        
        // Weekend anomalies might be more significant
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            score += 0.2;
        }
        
        return Math.min(score, 1);
    }

    calculateMagnitudeScore(anomaly, values) {
        const value = anomaly.value;
        const mean = ss.mean(values);
        const std = ss.standardDeviation(values);
        
        if (std === 0) return 0;
        
        const zScore = Math.abs((value - mean) / std);
        return Math.min(zScore / 5, 1); // Normalize to 0-1
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    getSystemStatus() {
        return {
            isRunning: true,
            totalAnomalies: this.anomalies.size,
            modelsLoaded: this.models.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = AnomalyDetector;
