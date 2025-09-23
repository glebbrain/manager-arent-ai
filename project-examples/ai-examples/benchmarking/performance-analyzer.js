/**
 * Performance Analyzer
 * Analyzes performance metrics and trends
 */

class PerformanceAnalyzer {
    constructor(options = {}) {
        this.modelType = options.modelType || 'ensemble';
        this.learningRate = options.learningRate || 0.01;
        this.predictionAccuracy = options.predictionAccuracy || 0.85;
        this.contextWindow = options.contextWindow || 30;
        
        this.analyses = new Map();
        this.trends = new Map();
        this.isRunning = true;
    }

    /**
     * Analyze performance
     */
    async analyzePerformance(benchmark, industryComparison) {
        try {
            const analysis = {
                timestamp: new Date(),
                overallScore: this.calculateOverallScore(benchmark, industryComparison),
                performanceGap: this.calculatePerformanceGap(benchmark, industryComparison),
                strengths: this.identifyStrengths(benchmark, industryComparison),
                weaknesses: this.identifyWeaknesses(benchmark, industryComparison),
                opportunities: this.identifyOpportunities(benchmark, industryComparison),
                threats: this.identifyThreats(benchmark, industryComparison),
                recommendations: this.generatePerformanceRecommendations(benchmark, industryComparison),
                trends: this.analyzeTrends([benchmark]),
                predictions: await this.predictFuturePerformance(benchmark)
            };
            
            // Store analysis
            this.analyses.set(`${benchmark.projectId}_${Date.now()}`, analysis);
            
            return analysis;
        } catch (error) {
            console.error('Error analyzing performance:', error);
            throw error;
        }
    }

    /**
     * Analyze trends
     */
    analyzeTrends(benchmarks) {
        if (benchmarks.length < 2) {
            return {
                trend: 'insufficient_data',
                direction: 'stable',
                rate: 0,
                confidence: 0
            };
        }
        
        const sortedBenchmarks = benchmarks.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const scores = sortedBenchmarks.map(b => b.score || 0);
        
        const trend = this.calculateTrend(scores);
        const direction = trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable';
        const rate = Math.abs(trend);
        const confidence = this.calculateTrendConfidence(scores);
        
        return {
            trend: direction,
            direction,
            rate,
            confidence,
            dataPoints: scores.length,
            firstScore: scores[0],
            lastScore: scores[scores.length - 1],
            improvement: scores[scores.length - 1] - scores[0]
        };
    }

    /**
     * Calculate overall score
     */
    calculateOverallScore(benchmark, industryComparison) {
        const benchmarkScore = benchmark.score || 0;
        const industryScore = industryComparison.overallScore || 0.7;
        
        // Weighted average with industry comparison
        return (benchmarkScore * 0.7) + (industryScore * 0.3);
    }

    /**
     * Calculate performance gap
     */
    calculatePerformanceGap(benchmark, industryComparison) {
        const benchmarkScore = benchmark.score || 0;
        const industryScore = industryComparison.overallScore || 0.7;
        
        return benchmarkScore - industryScore;
    }

    /**
     * Identify strengths
     */
    identifyStrengths(benchmark, industryComparison) {
        const strengths = [];
        
        for (const [category, categoryData] of Object.entries(industryComparison.categories || {})) {
            if (categoryData.score >= 0.8) {
                strengths.push({
                    category,
                    score: categoryData.score,
                    level: 'excellent',
                    description: `Excellent performance in ${category}`,
                    metrics: categoryData.strengths || []
                });
            }
        }
        
        return strengths;
    }

    /**
     * Identify weaknesses
     */
    identifyWeaknesses(benchmark, industryComparison) {
        const weaknesses = [];
        
        for (const [category, categoryData] of Object.entries(industryComparison.categories || {})) {
            if (categoryData.score < 0.6) {
                weaknesses.push({
                    category,
                    score: categoryData.score,
                    level: 'poor',
                    description: `Poor performance in ${category}`,
                    metrics: categoryData.weaknesses || [],
                    improvement: this.calculateImprovementNeeded(categoryData.score)
                });
            }
        }
        
        return weaknesses;
    }

    /**
     * Identify opportunities
     */
    identifyOpportunities(benchmark, industryComparison) {
        const opportunities = [];
        
        for (const [category, categoryData] of Object.entries(industryComparison.categories || {})) {
            if (categoryData.score >= 0.6 && categoryData.score < 0.8) {
                opportunities.push({
                    category,
                    score: categoryData.score,
                    level: 'good',
                    description: `Good performance in ${category} with room for improvement`,
                    potential: this.calculateImprovementPotential(categoryData.score),
                    metrics: categoryData.opportunities || []
                });
            }
        }
        
        return opportunities;
    }

    /**
     * Identify threats
     */
    identifyThreats(benchmark, industryComparison) {
        const threats = [];
        
        for (const [category, categoryData] of Object.entries(industryComparison.categories || {})) {
            if (categoryData.score < 0.5) {
                threats.push({
                    category,
                    score: categoryData.score,
                    level: 'critical',
                    description: `Critical performance issues in ${category}`,
                    risk: this.calculateRiskLevel(categoryData.score),
                    metrics: categoryData.weaknesses || []
                });
            }
        }
        
        return threats;
    }

    /**
     * Generate performance recommendations
     */
    generatePerformanceRecommendations(benchmark, industryComparison) {
        const recommendations = [];
        
        // Based on weaknesses
        for (const weakness of this.identifyWeaknesses(benchmark, industryComparison)) {
            recommendations.push({
                category: weakness.category,
                priority: 'high',
                type: 'improvement',
                title: `Improve ${weakness.category} performance`,
                description: weakness.description,
                currentScore: weakness.score,
                targetScore: 0.8,
                effort: this.estimateEffort(weakness.score, 0.8),
                impact: 'high',
                actions: this.getCategoryActions(weakness.category)
            });
        }
        
        // Based on opportunities
        for (const opportunity of this.identifyOpportunities(benchmark, industryComparison)) {
            recommendations.push({
                category: opportunity.category,
                priority: 'medium',
                type: 'optimization',
                title: `Optimize ${opportunity.category} performance`,
                description: opportunity.description,
                currentScore: opportunity.score,
                targetScore: 0.9,
                effort: this.estimateEffort(opportunity.score, 0.9),
                impact: 'medium',
                actions: this.getCategoryActions(opportunity.category)
            });
        }
        
        // Based on threats
        for (const threat of this.identifyThreats(benchmark, industryComparison)) {
            recommendations.push({
                category: threat.category,
                priority: 'critical',
                type: 'urgent',
                title: `Address critical ${threat.category} issues`,
                description: threat.description,
                currentScore: threat.score,
                targetScore: 0.6,
                effort: this.estimateEffort(threat.score, 0.6),
                impact: 'critical',
                actions: this.getCategoryActions(threat.category)
            });
        }
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Predict future performance
     */
    async predictFuturePerformance(benchmark) {
        // This would typically use ML models
        // For now, return mock predictions
        return {
            nextMonth: {
                score: Math.min(benchmark.score + 0.05, 1.0),
                confidence: 0.7,
                factors: ['Continued development', 'Team experience']
            },
            nextQuarter: {
                score: Math.min(benchmark.score + 0.15, 1.0),
                confidence: 0.6,
                factors: ['Process improvements', 'Tool upgrades']
            },
            nextYear: {
                score: Math.min(benchmark.score + 0.25, 1.0),
                confidence: 0.5,
                factors: ['Strategic initiatives', 'Technology adoption']
            }
        };
    }

    /**
     * Calculate trend
     */
    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    /**
     * Calculate trend confidence
     */
    calculateTrendConfidence(values) {
        if (values.length < 3) return 0;
        
        const trend = this.calculateTrend(values);
        const variance = this.calculateVariance(values);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        
        // Higher confidence for more consistent data
        const consistency = 1 - (variance / (mean * mean + 0.001));
        const dataPoints = Math.min(values.length / 10, 1); // More data points = higher confidence
        
        return Math.max(0, Math.min(1, consistency * dataPoints));
    }

    /**
     * Calculate variance
     */
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * Calculate improvement needed
     */
    calculateImprovementNeeded(score) {
        return Math.max(0, 0.8 - score);
    }

    /**
     * Calculate improvement potential
     */
    calculateImprovementPotential(score) {
        return Math.max(0, 1.0 - score);
    }

    /**
     * Calculate risk level
     */
    calculateRiskLevel(score) {
        if (score < 0.3) return 'critical';
        if (score < 0.5) return 'high';
        if (score < 0.7) return 'medium';
        return 'low';
    }

    /**
     * Estimate effort
     */
    estimateEffort(currentScore, targetScore) {
        const gap = targetScore - currentScore;
        
        if (gap <= 0.1) return 'low';
        if (gap <= 0.2) return 'medium';
        if (gap <= 0.3) return 'high';
        return 'very_high';
    }

    /**
     * Get category actions
     */
    getCategoryActions(category) {
        const actions = {
            'performance': [
                'Optimize database queries',
                'Implement caching',
                'Use CDN',
                'Optimize images',
                'Implement lazy loading'
            ],
            'quality': [
                'Increase test coverage',
                'Refactor complex code',
                'Improve documentation',
                'Reduce technical debt',
                'Implement code reviews'
            ],
            'security': [
                'Update dependencies',
                'Implement security headers',
                'Add input validation',
                'Use HTTPS',
                'Implement rate limiting'
            ],
            'compliance': [
                'Update privacy policies',
                'Implement data retention',
                'Add audit logging',
                'Conduct security assessments',
                'Train team on compliance'
            ]
        };
        
        return actions[category] || ['Review and improve this area'];
    }

    /**
     * Get performance analysis
     */
    getPerformanceAnalysis(key) {
        return this.analyses.get(key);
    }

    /**
     * Get all performance analyses
     */
    getAllPerformanceAnalyses() {
        return Array.from(this.analyses.values());
    }

    /**
     * Clear old analyses
     */
    clearOldAnalyses(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        const cutoffTime = Date.now() - maxAge;
        
        for (const [key, analysis] of this.analyses) {
            if (analysis.timestamp.getTime() < cutoffTime) {
                this.analyses.delete(key);
            }
        }
    }

    /**
     * Stop the performance analyzer
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = PerformanceAnalyzer;
