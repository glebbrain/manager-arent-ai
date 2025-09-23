const ss = require('simple-statistics');
const { Matrix } = require('ml-matrix');
const regression = require('regression');

/**
 * Pattern Detector v2.4
 * Advanced pattern detection for time series data
 */
class PatternDetector {
    constructor(options = {}) {
        this.options = {
            modelType: 'ensemble',
            learningRate: 0.001,
            maxEpochs: 100,
            batchSize: 32,
            validationSplit: 0.2,
            ...options
        };
        
        this.patterns = new Map();
        this.models = new Map();
    }

    /**
     * Detect patterns in data
     */
    async detectPatterns(projectId, data, patternTypes = ['cyclical', 'seasonal', 'trend', 'volatility'], options = {}) {
        try {
            const patternId = this.generateId();
            const startTime = Date.now();

            const results = {
                patternId,
                projectId,
                patterns: {},
                timestamp: new Date().toISOString(),
                processingTime: 0
            };

            // Detect each pattern type
            for (const patternType of patternTypes) {
                switch (patternType) {
                    case 'cyclical':
                        results.patterns.cyclical = this.detectCyclicalPatterns(data);
                        break;
                    case 'seasonal':
                        results.patterns.seasonal = this.detectSeasonalPatterns(data);
                        break;
                    case 'trend':
                        results.patterns.trend = this.detectTrendPatterns(data);
                        break;
                    case 'volatility':
                        results.patterns.volatility = this.detectVolatilityPatterns(data);
                        break;
                    case 'regime':
                        results.patterns.regime = this.detectRegimeChanges(data);
                        break;
                    case 'clustering':
                        results.patterns.clustering = this.detectClusteringPatterns(data);
                        break;
                }
            }

            results.processingTime = Date.now() - startTime;
            this.patterns.set(patternId, results);

            return results;
        } catch (error) {
            throw new Error(`Pattern detection failed: ${error.message}`);
        }
    }

    /**
     * Detect cyclical patterns
     */
    detectCyclicalPatterns(data) {
        if (data.length < 10) return { detected: false, reason: 'insufficient_data' };

        const values = data.map(d => d.value);
        const mean = ss.mean(values);
        const centered = values.map(v => v - mean);

        // Calculate autocorrelation
        const autocorrelations = this.calculateAutocorrelations(centered);
        
        // Find significant peaks
        const peaks = this.findSignificantPeaks(autocorrelations);
        
        if (peaks.length === 0) {
            return { detected: false, reason: 'no_cyclical_pattern' };
        }

        const primaryPeak = peaks[0];
        const secondaryPeaks = peaks.slice(1);

        return {
            detected: true,
            primaryPeriod: primaryPeak.lag,
            primaryStrength: primaryPeak.value,
            secondaryPeriods: secondaryPeaks.map(p => p.lag),
            confidence: this.calculateCyclicalConfidence(primaryPeak, autocorrelations),
            harmonics: this.detectHarmonics(autocorrelations, primaryPeak.lag)
        };
    }

    /**
     * Detect seasonal patterns
     */
    detectSeasonalPatterns(data) {
        if (data.length < 30) return { detected: false, reason: 'insufficient_data' };

        const timestamps = data.map(d => new Date(d.timestamp));
        const values = data.map(d => d.value);

        // Group by different time periods
        const dailyPattern = this.analyzeDailyPattern(data);
        const weeklyPattern = this.analyzeWeeklyPattern(data);
        const monthlyPattern = this.analyzeMonthlyPattern(data);

        const patterns = {};
        if (dailyPattern.detected) patterns.daily = dailyPattern;
        if (weeklyPattern.detected) patterns.weekly = weeklyPattern;
        if (monthlyPattern.detected) patterns.monthly = monthlyPattern;

        return {
            detected: Object.keys(patterns).length > 0,
            patterns,
            overallStrength: this.calculateSeasonalStrength(patterns),
            dominantPeriod: this.findDominantSeasonalPeriod(patterns)
        };
    }

    /**
     * Detect trend patterns
     */
    detectTrendPatterns(data) {
        if (data.length < 5) return { detected: false, reason: 'insufficient_data' };

        const values = data.map(d => d.value);
        const xValues = data.map((_, i) => i);

        // Test different trend types
        const linearTrend = this.testLinearTrend(xValues, values);
        const exponentialTrend = this.testExponentialTrend(xValues, values);
        const logarithmicTrend = this.testLogarithmicTrend(xValues, values);
        const polynomialTrend = this.testPolynomialTrend(xValues, values);

        const trends = {
            linear: linearTrend,
            exponential: exponentialTrend,
            logarithmic: logarithmicTrend,
            polynomial: polynomialTrend
        };

        // Find the best fitting trend
        const bestTrend = this.findBestTrend(trends);

        return {
            detected: bestTrend.rSquared > 0.7,
            bestFit: bestTrend.type,
            trends,
            confidence: bestTrend.rSquared,
            direction: bestTrend.slope > 0 ? 'increasing' : 'decreasing',
            strength: Math.abs(bestTrend.slope)
        };
    }

    /**
     * Detect volatility patterns
     */
    detectVolatilityPatterns(data) {
        if (data.length < 10) return { detected: false, reason: 'insufficient_data' };

        const values = data.map(d => d.value);
        const returns = this.calculateReturns(values);
        
        // Calculate rolling volatility
        const windowSize = Math.min(10, Math.floor(data.length / 3));
        const rollingVolatility = this.calculateRollingVolatility(returns, windowSize);

        // Detect volatility clustering
        const clustering = this.detectVolatilityClustering(rollingVolatility);
        
        // Detect volatility regimes
        const regimes = this.detectVolatilityRegimes(rollingVolatility);

        return {
            detected: clustering.detected || regimes.length > 1,
            currentVolatility: ss.standardDeviation(returns),
            rollingVolatility,
            clustering,
            regimes,
            volatilityTrend: this.calculateVolatilityTrend(rollingVolatility)
        };
    }

    /**
     * Detect regime changes
     */
    detectRegimeChanges(data) {
        if (data.length < 20) return { detected: false, reason: 'insufficient_data' };

        const values = data.map(d => d.value);
        const returns = this.calculateReturns(values);

        // Use change point detection
        const changePoints = this.detectChangePoints(returns);
        
        if (changePoints.length === 0) {
            return { detected: false, reason: 'no_regime_changes' };
        }

        // Analyze regimes
        const regimes = this.analyzeRegimes(values, changePoints);

        return {
            detected: true,
            changePoints,
            regimes,
            regimeCount: regimes.length,
            averageRegimeLength: this.calculateAverageRegimeLength(regimes)
        };
    }

    /**
     * Detect clustering patterns
     */
    detectClusteringPatterns(data) {
        if (data.length < 15) return { detected: false, reason: 'insufficient_data' };

        const values = data.map(d => d.value);
        
        // Use K-means clustering on time series features
        const features = this.extractTimeSeriesFeatures(values);
        const clusters = this.performKMeansClustering(features, 3);

        return {
            detected: clusters.length > 1,
            clusters,
            clusterCount: clusters.length,
            silhouetteScore: this.calculateSilhouetteScore(features, clusters),
            clusterCharacteristics: this.analyzeClusterCharacteristics(clusters)
        };
    }

    /**
     * Analyze seasonality
     */
    async analyzeSeasonality(projectId, data, options = {}) {
        try {
            const seasonalityId = this.generateId();
            const startTime = Date.now();

            const timestamps = data.map(d => new Date(d.timestamp));
            const values = data.map(d => d.value);

            // Decompose time series
            const decomposition = this.decomposeTimeSeries(values, timestamps);

            // Analyze seasonal components
            const seasonalAnalysis = this.analyzeSeasonalComponents(decomposition.seasonal);

            const result = {
                seasonalityId,
                projectId,
                decomposition,
                seasonalAnalysis,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            return result;
        } catch (error) {
            throw new Error(`Seasonality analysis failed: ${error.message}`);
        }
    }

    /**
     * Helper methods
     */
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

    findSignificantPeaks(autocorrelations) {
        const peaks = [];
        const threshold = 0.2;

        for (let i = 1; i < autocorrelations.length - 1; i++) {
            const prev = autocorrelations[i - 1].value;
            const curr = autocorrelations[i].value;
            const next = autocorrelations[i + 1].value;

            if (curr > prev && curr > next && curr > threshold) {
                peaks.push(autocorrelations[i]);
            }
        }

        return peaks.sort((a, b) => b.value - a.value);
    }

    calculateCyclicalConfidence(peak, autocorrelations) {
        const peakValue = peak.value;
        const backgroundNoise = ss.mean(autocorrelations.map(a => Math.abs(a.value)));
        
        return Math.min(peakValue / (peakValue + backgroundNoise), 1);
    }

    detectHarmonics(autocorrelations, primaryPeriod) {
        const harmonics = [];
        
        for (let harmonic = 2; harmonic <= 5; harmonic++) {
            const harmonicPeriod = primaryPeriod * harmonic;
            const harmonicIndex = autocorrelations.findIndex(a => a.lag === harmonicPeriod);
            
            if (harmonicIndex !== -1) {
                const harmonicValue = autocorrelations[harmonicIndex].value;
                if (harmonicValue > 0.1) {
                    harmonics.push({
                        period: harmonicPeriod,
                        strength: harmonicValue,
                        ratio: harmonicValue / primaryPeriod
                    });
                }
            }
        }

        return harmonics;
    }

    analyzeDailyPattern(data) {
        const dailyGroups = this.groupByHour(data);
        return this.analyzePeriodPattern(dailyGroups, 'daily');
    }

    analyzeWeeklyPattern(data) {
        const weeklyGroups = this.groupByDayOfWeek(data);
        return this.analyzePeriodPattern(weeklyGroups, 'weekly');
    }

    analyzeMonthlyPattern(data) {
        const monthlyGroups = this.groupByDayOfMonth(data);
        return this.analyzePeriodPattern(monthlyGroups, 'monthly');
    }

    groupByHour(data) {
        const groups = {};
        
        data.forEach(point => {
            const hour = new Date(point.timestamp).getHours();
            if (!groups[hour]) groups[hour] = [];
            groups[hour].push(point.value);
        });

        return Object.entries(groups).map(([hour, values]) => ({
            period: parseInt(hour),
            values,
            average: ss.mean(values)
        }));
    }

    groupByDayOfWeek(data) {
        const groups = {};
        
        data.forEach(point => {
            const dayOfWeek = new Date(point.timestamp).getDay();
            if (!groups[dayOfWeek]) groups[dayOfWeek] = [];
            groups[dayOfWeek].push(point.value);
        });

        return Object.entries(groups).map(([day, values]) => ({
            period: parseInt(day),
            values,
            average: ss.mean(values)
        }));
    }

    groupByDayOfMonth(data) {
        const groups = {};
        
        data.forEach(point => {
            const dayOfMonth = new Date(point.timestamp).getDate();
            if (!groups[dayOfMonth]) groups[dayOfMonth] = [];
            groups[dayOfMonth].push(point.value);
        });

        return Object.entries(groups).map(([day, values]) => ({
            period: parseInt(day),
            values,
            average: ss.mean(values)
        }));
    }

    analyzePeriodPattern(groups, type) {
        if (groups.length < 2) return { detected: false, reason: 'insufficient_data' };

        const averages = groups.map(g => g.average);
        const mean = ss.mean(averages);
        const std = ss.standardDeviation(averages);
        const coefficient = std / mean;

        return {
            detected: coefficient > 0.1,
            strength: Math.min(coefficient, 1),
            pattern: this.identifyPattern(averages),
            variance: std,
            type
        };
    }

    identifyPattern(values) {
        if (values.length < 3) return 'insufficient_data';

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

    calculateSeasonalStrength(patterns) {
        const strengths = Object.values(patterns).map(p => p.strength);
        return strengths.length > 0 ? ss.mean(strengths) : 0;
    }

    findDominantSeasonalPeriod(patterns) {
        let maxStrength = 0;
        let dominantPeriod = null;

        Object.entries(patterns).forEach(([type, pattern]) => {
            if (pattern.strength > maxStrength) {
                maxStrength = pattern.strength;
                dominantPeriod = type;
            }
        });

        return dominantPeriod;
    }

    testLinearTrend(xValues, yValues) {
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, yValues[i]])
        );

        return {
            type: 'linear',
            slope: regressionResult.equation[0],
            intercept: regressionResult.equation[1],
            rSquared: regressionResult.r2
        };
    }

    testExponentialTrend(xValues, yValues) {
        const logValues = yValues.map(v => Math.log(Math.max(v, 0.001)));
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, logValues[i]])
        );

        return {
            type: 'exponential',
            slope: regressionResult.equation[0],
            intercept: regressionResult.equation[1],
            rSquared: regressionResult.r2
        };
    }

    testLogarithmicTrend(xValues, yValues) {
        const logXValues = xValues.map(x => Math.log(x + 1));
        const regressionResult = regression.linear(
            logXValues.map((x, i) => [x, yValues[i]])
        );

        return {
            type: 'logarithmic',
            slope: regressionResult.equation[0],
            intercept: regressionResult.equation[1],
            rSquared: regressionResult.r2
        };
    }

    testPolynomialTrend(xValues, yValues) {
        const polynomialResult = regression.polynomial(
            xValues.map((x, i) => [x, yValues[i]]),
            { order: 2 }
        );

        return {
            type: 'polynomial',
            coefficients: polynomialResult.equation,
            rSquared: polynomialResult.r2
        };
    }

    findBestTrend(trends) {
        let bestTrend = null;
        let maxRSquared = 0;

        Object.values(trends).forEach(trend => {
            if (trend.rSquared > maxRSquared) {
                maxRSquared = trend.rSquared;
                bestTrend = trend;
            }
        });

        return bestTrend || { type: 'none', rSquared: 0, slope: 0 };
    }

    calculateReturns(values) {
        const returns = [];
        for (let i = 1; i < values.length; i++) {
            const ret = (values[i] - values[i - 1]) / values[i - 1];
            returns.push(isFinite(ret) ? ret : 0);
        }
        return returns;
    }

    calculateRollingVolatility(returns, windowSize) {
        const volatility = [];
        
        for (let i = windowSize; i < returns.length; i++) {
            const window = returns.slice(i - windowSize, i);
            volatility.push(ss.standardDeviation(window));
        }

        return volatility;
    }

    detectVolatilityClustering(volatility) {
        const threshold = ss.mean(volatility) + ss.standardDeviation(volatility);
        let inCluster = false;
        let clusterCount = 0;
        let currentClusterLength = 0;
        let maxClusterLength = 0;

        volatility.forEach(vol => {
            if (vol > threshold) {
                if (!inCluster) {
                    clusterCount++;
                    inCluster = true;
                }
                currentClusterLength++;
                maxClusterLength = Math.max(maxClusterLength, currentClusterLength);
            } else {
                inCluster = false;
                currentClusterLength = 0;
            }
        });

        return {
            detected: clusterCount > 1,
            count: clusterCount,
            maxLength: maxClusterLength,
            averageLength: maxClusterLength / Math.max(clusterCount, 1)
        };
    }

    detectVolatilityRegimes(volatility) {
        const regimes = [];
        let currentRegime = null;
        let regimeStart = 0;

        const meanVol = ss.mean(volatility);
        const stdVol = ss.standardDeviation(volatility);

        volatility.forEach((vol, index) => {
            let regime;
            if (vol < meanVol - stdVol) {
                regime = 'low';
            } else if (vol > meanVol + stdVol) {
                regime = 'high';
            } else {
                regime = 'medium';
            }

            if (currentRegime !== regime) {
                if (currentRegime !== null) {
                    regimes.push({
                        type: currentRegime,
                        start: regimeStart,
                        end: index - 1,
                        length: index - regimeStart
                    });
                }
                currentRegime = regime;
                regimeStart = index;
            }
        });

        // Add the last regime
        if (currentRegime !== null) {
            regimes.push({
                type: currentRegime,
                start: regimeStart,
                end: volatility.length - 1,
                length: volatility.length - regimeStart
            });
        }

        return regimes;
    }

    calculateVolatilityTrend(volatility) {
        if (volatility.length < 2) return 'insufficient_data';

        const xValues = volatility.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, volatility[i]])
        );

        const slope = regressionResult.equation[0];
        if (slope > 0.01) return 'increasing';
        if (slope < -0.01) return 'decreasing';
        return 'stable';
    }

    detectChangePoints(returns) {
        const changePoints = [];
        const windowSize = Math.min(10, Math.floor(returns.length / 3));
        
        for (let i = windowSize; i < returns.length - windowSize; i++) {
            const before = returns.slice(i - windowSize, i);
            const after = returns.slice(i, i + windowSize);
            
            const beforeMean = ss.mean(before);
            const afterMean = ss.mean(after);
            const beforeStd = ss.standardDeviation(before);
            const afterStd = ss.standardDeviation(after);
            
            // Simple change point detection based on mean and variance
            const meanChange = Math.abs(afterMean - beforeMean);
            const stdChange = Math.abs(afterStd - beforeStd);
            
            if (meanChange > 2 * beforeStd || stdChange > 0.5 * beforeStd) {
                changePoints.push(i);
            }
        }

        return changePoints;
    }

    analyzeRegimes(values, changePoints) {
        const regimes = [];
        let start = 0;

        changePoints.forEach(changePoint => {
            const regimeValues = values.slice(start, changePoint);
            regimes.push({
                start,
                end: changePoint - 1,
                length: changePoint - start,
                mean: ss.mean(regimeValues),
                std: ss.standardDeviation(regimeValues),
                trend: this.calculateRegimeTrend(regimeValues)
            });
            start = changePoint;
        });

        // Add the last regime
        if (start < values.length) {
            const regimeValues = values.slice(start);
            regimes.push({
                start,
                end: values.length - 1,
                length: values.length - start,
                mean: ss.mean(regimeValues),
                std: ss.standardDeviation(regimeValues),
                trend: this.calculateRegimeTrend(regimeValues)
            });
        }

        return regimes;
    }

    calculateRegimeTrend(values) {
        if (values.length < 2) return 'insufficient_data';

        const xValues = values.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );

        const slope = regressionResult.equation[0];
        if (slope > 0.01) return 'increasing';
        if (slope < -0.01) return 'decreasing';
        return 'stable';
    }

    calculateAverageRegimeLength(regimes) {
        if (regimes.length === 0) return 0;
        return regimes.reduce((sum, regime) => sum + regime.length, 0) / regimes.length;
    }

    extractTimeSeriesFeatures(values) {
        const features = [];
        const windowSize = Math.min(10, Math.floor(values.length / 3));

        for (let i = windowSize; i < values.length; i++) {
            const window = values.slice(i - windowSize, i);
            features.push({
                mean: ss.mean(window),
                std: ss.standardDeviation(window),
                min: Math.min(...window),
                max: Math.max(...window),
                range: Math.max(...window) - Math.min(...window),
                skewness: this.calculateSkewness(window),
                kurtosis: this.calculateKurtosis(window)
            });
        }

        return features;
    }

    calculateSkewness(values) {
        const mean = ss.mean(values);
        const std = ss.standardDeviation(values);
        const n = values.length;
        
        const skewness = values.reduce((sum, val) => {
            return sum + Math.pow((val - mean) / std, 3);
        }, 0) / n;

        return skewness;
    }

    calculateKurtosis(values) {
        const mean = ss.mean(values);
        const std = ss.standardDeviation(values);
        const n = values.length;
        
        const kurtosis = values.reduce((sum, val) => {
            return sum + Math.pow((val - mean) / std, 4);
        }, 0) / n - 3;

        return kurtosis;
    }

    performKMeansClustering(features, k) {
        // Simple K-means implementation
        const n = features.length;
        const dimensions = Object.keys(features[0]).length;
        
        // Initialize centroids randomly
        let centroids = [];
        for (let i = 0; i < k; i++) {
            const centroid = {};
            Object.keys(features[0]).forEach(key => {
                centroid[key] = Math.random() * 100;
            });
            centroids.push(centroid);
        }

        let clusters = new Array(n).fill(0);
        let changed = true;
        let iterations = 0;

        while (changed && iterations < 100) {
            changed = false;
            iterations++;

            // Assign points to closest centroid
            for (let i = 0; i < n; i++) {
                let minDistance = Infinity;
                let closestCentroid = 0;

                for (let j = 0; j < k; j++) {
                    const distance = this.calculateDistance(features[i], centroids[j]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCentroid = j;
                    }
                }

                if (clusters[i] !== closestCentroid) {
                    clusters[i] = closestCentroid;
                    changed = true;
                }
            }

            // Update centroids
            for (let j = 0; j < k; j++) {
                const clusterPoints = features.filter((_, i) => clusters[i] === j);
                if (clusterPoints.length > 0) {
                    const newCentroid = {};
                    Object.keys(features[0]).forEach(key => {
                        newCentroid[key] = ss.mean(clusterPoints.map(p => p[key]));
                    });
                    centroids[j] = newCentroid;
                }
            }
        }

        return clusters;
    }

    calculateDistance(point1, point2) {
        let sum = 0;
        Object.keys(point1).forEach(key => {
            sum += Math.pow(point1[key] - point2[key], 2);
        });
        return Math.sqrt(sum);
    }

    calculateSilhouetteScore(features, clusters) {
        // Simplified silhouette score calculation
        const n = features.length;
        const k = Math.max(...clusters) + 1;
        
        let totalScore = 0;
        
        for (let i = 0; i < n; i++) {
            const cluster = clusters[i];
            const sameCluster = features.filter((_, j) => clusters[j] === cluster && j !== i);
            const otherClusters = {};
            
            for (let j = 0; j < k; j++) {
                if (j !== cluster) {
                    otherClusters[j] = features.filter((_, idx) => clusters[idx] === j);
                }
            }

            // Calculate a(i) - average distance within cluster
            const a = sameCluster.length > 0 ? 
                ss.mean(sameCluster.map(p => this.calculateDistance(features[i], p))) : 0;

            // Calculate b(i) - minimum average distance to other clusters
            let b = Infinity;
            Object.values(otherClusters).forEach(otherCluster => {
                if (otherCluster.length > 0) {
                    const avgDistance = ss.mean(otherCluster.map(p => this.calculateDistance(features[i], p)));
                    b = Math.min(b, avgDistance);
                }
            });

            const silhouette = b > a ? (b - a) / Math.max(a, b) : 0;
            totalScore += silhouette;
        }

        return totalScore / n;
    }

    analyzeClusterCharacteristics(clusters) {
        const characteristics = {};
        const uniqueClusters = [...new Set(clusters)];

        uniqueClusters.forEach(clusterId => {
            const clusterSize = clusters.filter(c => c === clusterId).length;
            characteristics[clusterId] = {
                size: clusterSize,
                percentage: (clusterSize / clusters.length) * 100
            };
        });

        return characteristics;
    }

    decomposeTimeSeries(values, timestamps) {
        // Simple decomposition
        const n = values.length;
        const xValues = values.map((_, i) => i);
        
        // Calculate trend using linear regression
        const trendRegression = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );
        const trend = xValues.map(x => trendRegression.equation[0] * x + trendRegression.equation[1]);
        
        // Calculate detrended series
        const detrended = values.map((v, i) => v - trend[i]);
        
        // Calculate seasonal component (assuming weekly pattern)
        const seasonalPeriod = 7;
        const seasonal = this.calculateSeasonalComponent(detrended, seasonalPeriod);
        
        // Calculate residual
        const residual = detrended.map((v, i) => v - seasonal[i % seasonal.length]);

        return {
            trend,
            seasonal,
            residual,
            original: values
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

    analyzeSeasonalComponents(seasonal) {
        const mean = ss.mean(seasonal);
        const std = ss.standardDeviation(seasonal);
        const strength = std / (mean + std);

        return {
            strength,
            amplitude: std,
            phase: this.calculatePhase(seasonal),
            period: seasonal.length
        };
    }

    calculatePhase(seasonal) {
        const maxIndex = seasonal.indexOf(Math.max(...seasonal));
        return (maxIndex / seasonal.length) * 2 * Math.PI;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    getSystemStatus() {
        return {
            isRunning: true,
            totalPatterns: this.patterns.size,
            modelsLoaded: this.models.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = PatternDetector;
