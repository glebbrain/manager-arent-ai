const ss = require('simple-statistics');
const { Matrix } = require('ml-matrix');

/**
 * Correlation Analyzer v2.4
 * Advanced correlation analysis for time series data
 */
class CorrelationAnalyzer {
    constructor(options = {}) {
        this.options = {
            modelType: 'ensemble',
            learningRate: 0.001,
            maxEpochs: 100,
            batchSize: 32,
            validationSplit: 0.2,
            ...options
        };
        
        this.correlations = new Map();
        this.models = new Map();
    }

    /**
     * Analyze correlations between metrics
     */
    async analyzeCorrelations(projectId, metrics, options = {}) {
        try {
            const correlationId = this.generateId();
            const startTime = Date.now();

            // Get data for all metrics
            const data = await this.getMetricData(projectId, metrics, options.timeRange);
            
            if (data.length === 0) {
                throw new Error('No data available for correlation analysis');
            }

            // Calculate different types of correlations
            const correlations = {
                pearson: this.calculatePearsonCorrelations(data, metrics),
                spearman: this.calculateSpearmanCorrelations(data, metrics),
                kendall: this.calculateKendallCorrelations(data, metrics),
                partial: this.calculatePartialCorrelations(data, metrics),
                lagged: this.calculateLaggedCorrelations(data, metrics),
                rolling: this.calculateRollingCorrelations(data, metrics),
                crossCorrelation: this.calculateCrossCorrelations(data, metrics)
            };

            // Analyze correlation patterns
            const patterns = this.analyzeCorrelationPatterns(correlations, metrics);
            
            // Generate insights
            const insights = this.generateCorrelationInsights(correlations, patterns, metrics);

            const result = {
                correlationId,
                projectId,
                metrics,
                correlations,
                patterns,
                insights,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.correlations.set(correlationId, result);
            return result;
        } catch (error) {
            throw new Error(`Correlation analysis failed: ${error.message}`);
        }
    }

    /**
     * Calculate Pearson correlations
     */
    calculatePearsonCorrelations(data, metrics) {
        const correlations = {};
        
        for (let i = 0; i < metrics.length; i++) {
            for (let j = i + 1; j < metrics.length; j++) {
                const metric1 = metrics[i];
                const metric2 = metrics[j];
                
                const values1 = data.filter(d => d.metric === metric1).map(d => d.value);
                const values2 = data.filter(d => d.metric === metric2).map(d => d.value);
                
                if (values1.length === values2.length && values1.length > 1) {
                    const correlation = ss.sampleCorrelation(values1, values2);
                    const key = `${metric1}_${metric2}`;
                    
                    correlations[key] = {
                        metric1,
                        metric2,
                        correlation,
                        strength: Math.abs(correlation),
                        direction: correlation > 0 ? 'positive' : 'negative',
                        significance: this.calculateSignificance(correlation, values1.length),
                        type: 'pearson'
                    };
                }
            }
        }
        
        return correlations;
    }

    /**
     * Calculate Spearman correlations
     */
    calculateSpearmanCorrelations(data, metrics) {
        const correlations = {};
        
        for (let i = 0; i < metrics.length; i++) {
            for (let j = i + 1; j < metrics.length; j++) {
                const metric1 = metrics[i];
                const metric2 = metrics[j];
                
                const values1 = data.filter(d => d.metric === metric1).map(d => d.value);
                const values2 = data.filter(d => d.metric === metric2).map(d => d.value);
                
                if (values1.length === values2.length && values1.length > 1) {
                    const correlation = this.calculateSpearmanCorrelation(values1, values2);
                    const key = `${metric1}_${metric2}`;
                    
                    correlations[key] = {
                        metric1,
                        metric2,
                        correlation,
                        strength: Math.abs(correlation),
                        direction: correlation > 0 ? 'positive' : 'negative',
                        significance: this.calculateSignificance(correlation, values1.length),
                        type: 'spearman'
                    };
                }
            }
        }
        
        return correlations;
    }

    /**
     * Calculate Kendall correlations
     */
    calculateKendallCorrelations(data, metrics) {
        const correlations = {};
        
        for (let i = 0; i < metrics.length; i++) {
            for (let j = i + 1; j < metrics.length; j++) {
                const metric1 = metrics[i];
                const metric2 = metrics[j];
                
                const values1 = data.filter(d => d.metric === metric1).map(d => d.value);
                const values2 = data.filter(d => d.metric === metric2).map(d => d.value);
                
                if (values1.length === values2.length && values1.length > 1) {
                    const correlation = this.calculateKendallCorrelation(values1, values2);
                    const key = `${metric1}_${metric2}`;
                    
                    correlations[key] = {
                        metric1,
                        metric2,
                        correlation,
                        strength: Math.abs(correlation),
                        direction: correlation > 0 ? 'positive' : 'negative',
                        significance: this.calculateSignificance(correlation, values1.length),
                        type: 'kendall'
                    };
                }
            }
        }
        
        return correlations;
    }

    /**
     * Calculate partial correlations
     */
    calculatePartialCorrelations(data, metrics) {
        const correlations = {};
        
        if (metrics.length < 3) {
            return correlations; // Need at least 3 metrics for partial correlation
        }
        
        for (let i = 0; i < metrics.length; i++) {
            for (let j = i + 1; j < metrics.length; j++) {
                const metric1 = metrics[i];
                const metric2 = metrics[j];
                
                // Calculate partial correlation controlling for other metrics
                const otherMetrics = metrics.filter((_, idx) => idx !== i && idx !== j);
                const partialCorrelation = this.calculatePartialCorrelation(
                    data, metric1, metric2, otherMetrics
                );
                
                if (partialCorrelation !== null) {
                    const key = `${metric1}_${metric2}`;
                    correlations[key] = {
                        metric1,
                        metric2,
                        correlation: partialCorrelation,
                        strength: Math.abs(partialCorrelation),
                        direction: partialCorrelation > 0 ? 'positive' : 'negative',
                        significance: this.calculateSignificance(partialCorrelation, data.length),
                        type: 'partial',
                        controlledFor: otherMetrics
                    };
                }
            }
        }
        
        return correlations;
    }

    /**
     * Calculate lagged correlations
     */
    calculateLaggedCorrelations(data, metrics) {
        const correlations = {};
        const maxLag = Math.min(10, Math.floor(data.length / 3));
        
        for (let i = 0; i < metrics.length; i++) {
            for (let j = 0; j < metrics.length; j++) {
                if (i === j) continue;
                
                const metric1 = metrics[i];
                const metric2 = metrics[j];
                
                const values1 = data.filter(d => d.metric === metric1).map(d => d.value);
                const values2 = data.filter(d => d.metric === metric2).map(d => d.value);
                
                if (values1.length === values2.length && values1.length > maxLag) {
                    const laggedCorrelations = this.calculateLaggedCorrelation(values1, values2, maxLag);
                    const key = `${metric1}_${metric2}`;
                    
                    correlations[key] = {
                        metric1,
                        metric2,
                        laggedCorrelations,
                        bestLag: laggedCorrelations.reduce((best, curr) => 
                            Math.abs(curr.correlation) > Math.abs(best.correlation) ? curr : best
                        ),
                        type: 'lagged'
                    };
                }
            }
        }
        
        return correlations;
    }

    /**
     * Calculate rolling correlations
     */
    calculateRollingCorrelations(data, metrics) {
        const correlations = {};
        const windowSize = Math.min(20, Math.floor(data.length / 2));
        
        for (let i = 0; i < metrics.length; i++) {
            for (let j = i + 1; j < metrics.length; j++) {
                const metric1 = metrics[i];
                const metric2 = metrics[j];
                
                const values1 = data.filter(d => d.metric === metric1).map(d => d.value);
                const values2 = data.filter(d => d.metric === metric2).map(d => d.value);
                
                if (values1.length === values2.length && values1.length > windowSize) {
                    const rollingCorrelations = this.calculateRollingCorrelation(values1, values2, windowSize);
                    const key = `${metric1}_${metric2}`;
                    
                    correlations[key] = {
                        metric1,
                        metric2,
                        rollingCorrelations,
                        averageCorrelation: ss.mean(rollingCorrelations.map(r => r.correlation)),
                        correlationVolatility: ss.standardDeviation(rollingCorrelations.map(r => r.correlation)),
                        type: 'rolling'
                    };
                }
            }
        }
        
        return correlations;
    }

    /**
     * Calculate cross-correlations
     */
    calculateCrossCorrelations(data, metrics) {
        const correlations = {};
        
        for (let i = 0; i < metrics.length; i++) {
            for (let j = 0; j < metrics.length; j++) {
                if (i === j) continue;
                
                const metric1 = metrics[i];
                const metric2 = metrics[j];
                
                const values1 = data.filter(d => d.metric === metric1).map(d => d.value);
                const values2 = data.filter(d => d.metric === metric2).map(d => d.value);
                
                if (values1.length === values2.length && values1.length > 1) {
                    const crossCorrelation = this.calculateCrossCorrelation(values1, values2);
                    const key = `${metric1}_${metric2}`;
                    
                    correlations[key] = {
                        metric1,
                        metric2,
                        crossCorrelation,
                        type: 'cross'
                    };
                }
            }
        }
        
        return correlations;
    }

    /**
     * Analyze correlation patterns
     */
    analyzeCorrelationPatterns(correlations, metrics) {
        const patterns = {
            strongCorrelations: [],
            weakCorrelations: [],
            negativeCorrelations: [],
            significantCorrelations: [],
            correlationClusters: [],
            correlationChanges: []
        };

        // Analyze each correlation type
        Object.values(correlations).forEach(correlationType => {
            if (typeof correlationType === 'object' && !correlationType.type) {
                // Handle nested correlation objects
                Object.values(correlationType).forEach(corr => {
                    this.categorizeCorrelation(corr, patterns);
                });
            } else {
                this.categorizeCorrelation(correlationType, patterns);
            }
        });

        // Find correlation clusters
        patterns.correlationClusters = this.findCorrelationClusters(correlations, metrics);
        
        // Analyze correlation changes over time
        patterns.correlationChanges = this.analyzeCorrelationChanges(correlations);

        return patterns;
    }

    /**
     * Generate correlation insights
     */
    generateCorrelationInsights(correlations, patterns, metrics) {
        const insights = [];

        // Strong correlation insights
        if (patterns.strongCorrelations.length > 0) {
            insights.push({
                type: 'strong_correlations',
                message: `Found ${patterns.strongCorrelations.length} strong correlations between metrics`,
                priority: 'high',
                details: patterns.strongCorrelations.map(corr => ({
                    metrics: `${corr.metric1} - ${corr.metric2}`,
                    strength: corr.strength,
                    direction: corr.direction
                }))
            });
        }

        // Negative correlation insights
        if (patterns.negativeCorrelations.length > 0) {
            insights.push({
                type: 'negative_correlations',
                message: `Found ${patterns.negativeCorrelations.length} negative correlations that may indicate trade-offs`,
                priority: 'medium',
                details: patterns.negativeCorrelations.map(corr => ({
                    metrics: `${corr.metric1} - ${corr.metric2}`,
                    strength: corr.strength
                }))
            });
        }

        // Correlation cluster insights
        if (patterns.correlationClusters.length > 0) {
            insights.push({
                type: 'correlation_clusters',
                message: `Found ${patterns.correlationClusters.length} groups of highly correlated metrics`,
                priority: 'medium',
                details: patterns.correlationClusters.map(cluster => ({
                    metrics: cluster.metrics,
                    averageCorrelation: cluster.averageCorrelation
                }))
            });
        }

        // Correlation change insights
        if (patterns.correlationChanges.length > 0) {
            insights.push({
                type: 'correlation_changes',
                message: `Detected ${patterns.correlationChanges.length} significant changes in correlations over time`,
                priority: 'high',
                details: patterns.correlationChanges.map(change => ({
                    metrics: `${change.metric1} - ${change.metric2}`,
                    change: change.change,
                    period: change.period
                }))
            });
        }

        return insights;
    }

    /**
     * Helper methods
     */
    async getMetricData(projectId, metrics, timeRange = '90d') {
        // This would typically fetch from database
        // For now, return mock data
        return this.generateMockData(projectId, metrics, timeRange);
    }

    generateMockData(projectId, metrics, timeRange) {
        const data = [];
        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            metrics.forEach(metric => {
                // Generate correlated mock data
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
            });
        }

        return data;
    }

    calculateSpearmanCorrelation(values1, values2) {
        const ranks1 = this.calculateRanks(values1);
        const ranks2 = this.calculateRanks(values2);
        return ss.sampleCorrelation(ranks1, ranks2);
    }

    calculateRanks(values) {
        const sorted = [...values].sort((a, b) => a - b);
        return values.map(value => sorted.indexOf(value) + 1);
    }

    calculateKendallCorrelation(values1, values2) {
        let concordant = 0;
        let discordant = 0;
        const n = values1.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const sign1 = Math.sign(values1[i] - values1[j]);
                const sign2 = Math.sign(values2[i] - values2[j]);
                
                if (sign1 * sign2 > 0) {
                    concordant++;
                } else if (sign1 * sign2 < 0) {
                    discordant++;
                }
            }
        }

        const total = concordant + discordant;
        return total > 0 ? (concordant - discordant) / total : 0;
    }

    calculatePartialCorrelation(data, metric1, metric2, controlMetrics) {
        // Simplified partial correlation calculation
        const values1 = data.filter(d => d.metric === metric1).map(d => d.value);
        const values2 = data.filter(d => d.metric === metric2).map(d => d.value);
        
        if (values1.length !== values2.length || values1.length < 3) {
            return null;
        }

        // For simplicity, return a basic partial correlation
        const correlation = ss.sampleCorrelation(values1, values2);
        const controlEffect = controlMetrics.length * 0.1; // Simplified control effect
        
        return correlation * (1 - controlEffect);
    }

    calculateLaggedCorrelation(values1, values2, maxLag) {
        const correlations = [];
        
        for (let lag = 0; lag <= maxLag; lag++) {
            if (values1.length > lag) {
                const laggedValues1 = values1.slice(0, values1.length - lag);
                const laggedValues2 = values2.slice(lag);
                
                if (laggedValues1.length > 1) {
                    const correlation = ss.sampleCorrelation(laggedValues1, laggedValues2);
                    correlations.push({
                        lag,
                        correlation,
                        strength: Math.abs(correlation)
                    });
                }
            }
        }
        
        return correlations;
    }

    calculateRollingCorrelation(values1, values2, windowSize) {
        const correlations = [];
        
        for (let i = windowSize; i < values1.length; i++) {
            const window1 = values1.slice(i - windowSize, i);
            const window2 = values2.slice(i - windowSize, i);
            
            if (window1.length > 1) {
                const correlation = ss.sampleCorrelation(window1, window2);
                correlations.push({
                    index: i,
                    correlation,
                    strength: Math.abs(correlation)
                });
            }
        }
        
        return correlations;
    }

    calculateCrossCorrelation(values1, values2) {
        // Simplified cross-correlation calculation
        const n = values1.length;
        const crossCorrelations = [];
        
        for (let lag = -Math.floor(n / 2); lag <= Math.floor(n / 2); lag++) {
            let sum = 0;
            let count = 0;
            
            for (let i = 0; i < n; i++) {
                const j = i + lag;
                if (j >= 0 && j < n) {
                    sum += values1[i] * values2[j];
                    count++;
                }
            }
            
            if (count > 0) {
                crossCorrelations.push({
                    lag,
                    correlation: sum / count
                });
            }
        }
        
        return crossCorrelations;
    }

    calculateSignificance(correlation, n) {
        if (n < 3) return 'insufficient_data';
        
        const tStat = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
        const pValue = 2 * (1 - this.normalCDF(Math.abs(tStat)));
        
        if (pValue < 0.001) return 'highly_significant';
        if (pValue < 0.01) return 'very_significant';
        if (pValue < 0.05) return 'significant';
        if (pValue < 0.1) return 'marginally_significant';
        return 'not_significant';
    }

    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    erf(x) {
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

    categorizeCorrelation(corr, patterns) {
        if (!corr || typeof corr !== 'object') return;
        
        if (corr.strength > 0.7) {
            patterns.strongCorrelations.push(corr);
        } else if (corr.strength < 0.3) {
            patterns.weakCorrelations.push(corr);
        }
        
        if (corr.direction === 'negative') {
            patterns.negativeCorrelations.push(corr);
        }
        
        if (corr.significance && corr.significance !== 'not_significant') {
            patterns.significantCorrelations.push(corr);
        }
    }

    findCorrelationClusters(correlations, metrics) {
        const clusters = [];
        const visited = new Set();
        
        metrics.forEach(metric => {
            if (visited.has(metric)) return;
            
            const cluster = [metric];
            visited.add(metric);
            
            // Find all metrics highly correlated with this one
            metrics.forEach(otherMetric => {
                if (visited.has(otherMetric) || otherMetric === metric) return;
                
                const key1 = `${metric}_${otherMetric}`;
                const key2 = `${otherMetric}_${metric}`;
                
                let correlation = null;
                if (correlations.pearson && correlations.pearson[key1]) {
                    correlation = correlations.pearson[key1];
                } else if (correlations.pearson && correlations.pearson[key2]) {
                    correlation = correlations.pearson[key2];
                }
                
                if (correlation && correlation.strength > 0.6) {
                    cluster.push(otherMetric);
                    visited.add(otherMetric);
                }
            });
            
            if (cluster.length > 1) {
                clusters.push({
                    metrics: cluster,
                    averageCorrelation: this.calculateClusterAverageCorrelation(cluster, correlations)
                });
            }
        });
        
        return clusters;
    }

    calculateClusterAverageCorrelation(cluster, correlations) {
        let totalCorrelation = 0;
        let count = 0;
        
        for (let i = 0; i < cluster.length; i++) {
            for (let j = i + 1; j < cluster.length; j++) {
                const key1 = `${cluster[i]}_${cluster[j]}`;
                const key2 = `${cluster[j]}_${cluster[i]}`;
                
                let correlation = null;
                if (correlations.pearson && correlations.pearson[key1]) {
                    correlation = correlations.pearson[key1];
                } else if (correlations.pearson && correlations.pearson[key2]) {
                    correlation = correlations.pearson[key2];
                }
                
                if (correlation) {
                    totalCorrelation += correlation.strength;
                    count++;
                }
            }
        }
        
        return count > 0 ? totalCorrelation / count : 0;
    }

    analyzeCorrelationChanges(correlations) {
        // Simplified correlation change analysis
        const changes = [];
        
        // This would typically analyze how correlations change over time
        // For now, return empty array as this requires time-series correlation data
        
        return changes;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    getSystemStatus() {
        return {
            isRunning: true,
            totalCorrelations: this.correlations.size,
            modelsLoaded: this.models.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = CorrelationAnalyzer;
