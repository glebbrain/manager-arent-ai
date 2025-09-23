/**
 * Recommendation Engine
 * Generates AI-powered recommendations based on benchmark analysis
 */

class RecommendationEngine {
    constructor(options = {}) {
        this.modelType = options.modelType || 'ensemble';
        this.learningRate = options.learningRate || 0.01;
        this.predictionAccuracy = options.predictionAccuracy || 0.85;
        this.contextWindow = options.contextWindow || 30;
        
        this.recommendations = new Map();
        this.patterns = new Map();
        this.isRunning = true;
    }

    /**
     * Generate recommendations
     */
    async generateRecommendations(benchmark, industryComparison, performanceAnalysis) {
        try {
            const recommendations = {
                timestamp: new Date(),
                projectId: benchmark.projectId,
                benchmarkType: benchmark.benchmarkType,
                overallScore: benchmark.score,
                grade: benchmark.grade,
                recommendations: [],
                priorityMatrix: {},
                implementationPlan: {},
                expectedOutcomes: {}
            };
            
            // Generate recommendations for each category
            for (const [category, categoryData] of Object.entries(industryComparison.categories || {})) {
                const categoryRecommendations = await this.generateCategoryRecommendations(
                    category,
                    categoryData,
                    benchmark,
                    performanceAnalysis
                );
                recommendations.recommendations.push(...categoryRecommendations);
            }
            
            // Generate cross-category recommendations
            const crossCategoryRecommendations = await this.generateCrossCategoryRecommendations(
                benchmark,
                industryComparison,
                performanceAnalysis
            );
            recommendations.recommendations.push(...crossCategoryRecommendations);
            
            // Sort by priority and impact
            recommendations.recommendations.sort((a, b) => {
                const priorityOrder = { 'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'info': 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff !== 0) return priorityDiff;
                
                const impactOrder = { 'critical': 5, 'high': 4, 'medium': 3, 'low': 2 };
                return impactOrder[b.impact] - impactOrder[a.impact];
            });
            
            // Generate priority matrix
            recommendations.priorityMatrix = this.generatePriorityMatrix(recommendations.recommendations);
            
            // Generate implementation plan
            recommendations.implementationPlan = this.generateImplementationPlan(recommendations.recommendations);
            
            // Generate expected outcomes
            recommendations.expectedOutcomes = this.generateExpectedOutcomes(recommendations.recommendations);
            
            // Store recommendations
            this.recommendations.set(`${benchmark.projectId}_${Date.now()}`, recommendations);
            
            return recommendations;
        } catch (error) {
            console.error('Error generating recommendations:', error);
            throw error;
        }
    }

    /**
     * Generate category recommendations
     */
    async generateCategoryRecommendations(category, categoryData, benchmark, performanceAnalysis) {
        const recommendations = [];
        
        // Based on category score
        if (categoryData.score < 0.5) {
            recommendations.push({
                id: this.generateRecommendationId(),
                category,
                type: 'critical_improvement',
                priority: 'critical',
                impact: 'high',
                title: `Critical: Improve ${category} performance`,
                description: `Current ${category} score is ${(categoryData.score * 100).toFixed(1)}%, which is below acceptable standards`,
                currentValue: categoryData.score,
                targetValue: 0.7,
                effort: this.estimateEffort(categoryData.score, 0.7),
                timeline: this.estimateTimeline(categoryData.score, 0.7),
                actions: this.getCategoryActions(category, 'critical'),
                metrics: this.getCategoryMetrics(category),
                dependencies: this.getCategoryDependencies(category),
                resources: this.getCategoryResources(category, 'critical'),
                risks: this.getCategoryRisks(category, 'critical'),
                benefits: this.getCategoryBenefits(category, 'critical')
            });
        } else if (categoryData.score < 0.7) {
            recommendations.push({
                id: this.generateRecommendationId(),
                category,
                type: 'improvement',
                priority: 'high',
                impact: 'medium',
                title: `Improve ${category} performance`,
                description: `Current ${category} score is ${(categoryData.score * 100).toFixed(1)}%, which needs improvement`,
                currentValue: categoryData.score,
                targetValue: 0.8,
                effort: this.estimateEffort(categoryData.score, 0.8),
                timeline: this.estimateTimeline(categoryData.score, 0.8),
                actions: this.getCategoryActions(category, 'high'),
                metrics: this.getCategoryMetrics(category),
                dependencies: this.getCategoryDependencies(category),
                resources: this.getCategoryResources(category, 'high'),
                risks: this.getCategoryRisks(category, 'high'),
                benefits: this.getCategoryBenefits(category, 'high')
            });
        } else if (categoryData.score < 0.9) {
            recommendations.push({
                id: this.generateRecommendationId(),
                category,
                type: 'optimization',
                priority: 'medium',
                impact: 'medium',
                title: `Optimize ${category} performance`,
                description: `Current ${category} score is ${(categoryData.score * 100).toFixed(1)}%, which is good but can be optimized`,
                currentValue: categoryData.score,
                targetValue: 0.95,
                effort: this.estimateEffort(categoryData.score, 0.95),
                timeline: this.estimateTimeline(categoryData.score, 0.95),
                actions: this.getCategoryActions(category, 'medium'),
                metrics: this.getCategoryMetrics(category),
                dependencies: this.getCategoryDependencies(category),
                resources: this.getCategoryResources(category, 'medium'),
                risks: this.getCategoryRisks(category, 'medium'),
                benefits: this.getCategoryBenefits(category, 'medium')
            });
        }
        
        // Based on specific metrics
        for (const [metric, metricData] of Object.entries(categoryData.metrics || {})) {
            if (metricData.score < 0.6) {
                recommendations.push({
                    id: this.generateRecommendationId(),
                    category,
                    metric,
                    type: 'metric_improvement',
                    priority: 'medium',
                    impact: 'medium',
                    title: `Improve ${metric} in ${category}`,
                    description: `Current ${metric} score is ${(metricData.score * 100).toFixed(1)}%, which needs improvement`,
                    currentValue: metricData.score,
                    targetValue: 0.8,
                    effort: this.estimateEffort(metricData.score, 0.8),
                    timeline: this.estimateTimeline(metricData.score, 0.8),
                    actions: this.getMetricActions(category, metric),
                    metrics: [metric],
                    dependencies: this.getMetricDependencies(category, metric),
                    resources: this.getMetricResources(category, metric),
                    risks: this.getMetricRisks(category, metric),
                    benefits: this.getMetricBenefits(category, metric)
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Generate cross-category recommendations
     */
    async generateCrossCategoryRecommendations(benchmark, industryComparison, performanceAnalysis) {
        const recommendations = [];
        
        // Identify patterns across categories
        const patterns = this.identifyCrossCategoryPatterns(industryComparison);
        
        for (const pattern of patterns) {
            recommendations.push({
                id: this.generateRecommendationId(),
                category: 'cross_category',
                type: 'pattern_based',
                priority: pattern.priority,
                impact: pattern.impact,
                title: pattern.title,
                description: pattern.description,
                categories: pattern.categories,
                actions: pattern.actions,
                metrics: pattern.metrics,
                dependencies: pattern.dependencies,
                resources: pattern.resources,
                risks: pattern.risks,
                benefits: pattern.benefits
            });
        }
        
        return recommendations;
    }

    /**
     * Generate comparison recommendations
     */
    async generateComparisonRecommendations(projectBenchmark, comparisonBenchmarks) {
        const recommendations = [];
        
        for (const comparison of comparisonBenchmarks) {
            const gap = projectBenchmark.score - comparison.benchmark.score;
            
            if (gap < -0.1) {
                recommendations.push({
                    id: this.generateRecommendationId(),
                    category: 'comparison',
                    type: 'competitive_improvement',
                    priority: 'high',
                    impact: 'high',
                    title: `Improve performance vs ${comparison.name}`,
                    description: `Current score is ${(gap * 100).toFixed(1)}% below ${comparison.name}`,
                    currentValue: projectBenchmark.score,
                    targetValue: comparison.benchmark.score + 0.1,
                    effort: this.estimateEffort(projectBenchmark.score, comparison.benchmark.score + 0.1),
                    timeline: this.estimateTimeline(projectBenchmark.score, comparison.benchmark.score + 0.1),
                    actions: this.getComparisonActions(comparison),
                    metrics: ['overall_score'],
                    dependencies: [],
                    resources: this.getComparisonResources(comparison),
                    risks: this.getComparisonRisks(comparison),
                    benefits: this.getComparisonBenefits(comparison)
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Generate trend recommendations
     */
    async generateTrendRecommendations(benchmarks) {
        const recommendations = [];
        
        if (benchmarks.length < 2) return recommendations;
        
        const trends = this.analyzeTrends(benchmarks);
        
        if (trends.direction === 'declining') {
            recommendations.push({
                id: this.generateRecommendationId(),
                category: 'trend',
                type: 'trend_reversal',
                priority: 'high',
                impact: 'high',
                title: 'Reverse declining performance trend',
                description: `Performance has been declining at a rate of ${(trends.rate * 100).toFixed(1)}% per period`,
                currentTrend: trends.direction,
                targetTrend: 'improving',
                effort: 'high',
                timeline: '3-6 months',
                actions: this.getTrendReversalActions(trends),
                metrics: ['overall_score'],
                dependencies: [],
                resources: this.getTrendResources(trends),
                risks: this.getTrendRisks(trends),
                benefits: this.getTrendBenefits(trends)
            });
        }
        
        return recommendations;
    }

    /**
     * Generate priority matrix
     */
    generatePriorityMatrix(recommendations) {
        const matrix = {
            critical_high: [],
            critical_medium: [],
            high_high: [],
            high_medium: [],
            medium_medium: [],
            low_low: []
        };
        
        for (const rec of recommendations) {
            const key = `${rec.priority}_${rec.impact}`;
            if (matrix[key]) {
                matrix[key].push(rec);
            }
        }
        
        return matrix;
    }

    /**
     * Generate implementation plan
     */
    generateImplementationPlan(recommendations) {
        const plan = {
            phases: [],
            timeline: {},
            resources: {},
            milestones: []
        };
        
        // Group recommendations by effort and timeline
        const phases = this.groupRecommendationsByPhase(recommendations);
        
        for (let i = 0; i < phases.length; i++) {
            const phase = phases[i];
            plan.phases.push({
                phase: i + 1,
                name: `Phase ${i + 1}`,
                duration: this.calculatePhaseDuration(phase),
                recommendations: phase,
                objectives: phase.map(r => r.title),
                successCriteria: phase.map(r => `${r.metric}: ${r.targetValue}`)
            });
        }
        
        // Calculate timeline
        plan.timeline = this.calculateTimeline(phases);
        
        // Calculate resources
        plan.resources = this.calculateResources(recommendations);
        
        // Generate milestones
        plan.milestones = this.generateMilestones(phases);
        
        return plan;
    }

    /**
     * Generate expected outcomes
     */
    generateExpectedOutcomes(recommendations) {
        const outcomes = {
            shortTerm: { score: 0, improvements: [] },
            mediumTerm: { score: 0, improvements: [] },
            longTerm: { score: 0, improvements: [] }
        };
        
        for (const rec of recommendations) {
            const improvement = rec.targetValue - rec.currentValue;
            const timeline = this.parseTimeline(rec.timeline);
            
            if (timeline <= 1) {
                outcomes.shortTerm.score += improvement * 0.3;
                outcomes.shortTerm.improvements.push(rec.title);
            } else if (timeline <= 3) {
                outcomes.mediumTerm.score += improvement * 0.5;
                outcomes.mediumTerm.improvements.push(rec.title);
            } else {
                outcomes.longTerm.score += improvement * 0.2;
                outcomes.longTerm.improvements.push(rec.title);
            }
        }
        
        return outcomes;
    }

    /**
     * Identify cross-category patterns
     */
    identifyCrossCategoryPatterns(industryComparison) {
        const patterns = [];
        
        // Check for consistent low performance
        const lowCategories = Object.entries(industryComparison.categories || {})
            .filter(([_, data]) => data.score < 0.6)
            .map(([category, _]) => category);
        
        if (lowCategories.length >= 2) {
            patterns.push({
                priority: 'high',
                impact: 'high',
                title: 'Address systemic performance issues',
                description: `Multiple categories (${lowCategories.join(', ')}) are underperforming`,
                categories: lowCategories,
                actions: ['Conduct root cause analysis', 'Implement process improvements', 'Provide team training'],
                metrics: lowCategories,
                dependencies: [],
                resources: ['Project Manager', 'Technical Lead', 'Training Budget'],
                risks: ['Project delays', 'Team burnout', 'Quality issues'],
                benefits: ['Improved overall performance', 'Better team morale', 'Reduced technical debt']
            });
        }
        
        // Check for security and compliance issues
        const securityCategories = ['security', 'compliance'];
        const securityIssues = securityCategories.filter(cat => 
            industryComparison.categories[cat]?.score < 0.7
        );
        
        if (securityIssues.length > 0) {
            patterns.push({
                priority: 'critical',
                impact: 'critical',
                title: 'Address security and compliance gaps',
                description: `Critical security/compliance issues in ${securityIssues.join(', ')}`,
                categories: securityIssues,
                actions: ['Conduct security audit', 'Update policies', 'Implement security controls'],
                metrics: securityIssues,
                dependencies: ['Security team', 'Legal team'],
                resources: ['Security Expert', 'Compliance Officer', 'Legal Counsel'],
                risks: ['Security breaches', 'Regulatory fines', 'Reputation damage'],
                benefits: ['Reduced security risks', 'Regulatory compliance', 'Customer trust']
            });
        }
        
        return patterns;
    }

    /**
     * Analyze trends
     */
    analyzeTrends(benchmarks) {
        if (benchmarks.length < 2) {
            return { direction: 'stable', rate: 0, confidence: 0 };
        }
        
        const scores = benchmarks.map(b => b.score || 0);
        const trend = this.calculateTrend(scores);
        
        return {
            direction: trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable',
            rate: Math.abs(trend),
            confidence: this.calculateTrendConfidence(scores)
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
        
        const consistency = 1 - (variance / (mean * mean + 0.001));
        const dataPoints = Math.min(values.length / 10, 1);
        
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
     * Estimate timeline
     */
    estimateTimeline(currentScore, targetScore) {
        const gap = targetScore - currentScore;
        
        if (gap <= 0.1) return '1-2 weeks';
        if (gap <= 0.2) return '1-2 months';
        if (gap <= 0.3) return '3-6 months';
        return '6+ months';
    }

    /**
     * Get category actions
     */
    getCategoryActions(category, priority) {
        const actions = {
            'performance': {
                'critical': ['Optimize database queries', 'Implement caching', 'Use CDN', 'Optimize images', 'Implement lazy loading'],
                'high': ['Review performance bottlenecks', 'Implement monitoring', 'Optimize critical paths'],
                'medium': ['Fine-tune performance', 'Implement advanced caching', 'Optimize algorithms']
            },
            'quality': {
                'critical': ['Increase test coverage', 'Refactor complex code', 'Improve documentation', 'Reduce technical debt'],
                'high': ['Implement code reviews', 'Add automated testing', 'Improve code standards'],
                'medium': ['Optimize code quality', 'Enhance documentation', 'Implement best practices']
            },
            'security': {
                'critical': ['Update dependencies', 'Implement security headers', 'Add input validation', 'Use HTTPS'],
                'high': ['Conduct security audit', 'Implement rate limiting', 'Add authentication'],
                'medium': ['Enhance security measures', 'Implement monitoring', 'Update security policies']
            },
            'compliance': {
                'critical': ['Update privacy policies', 'Implement data retention', 'Add audit logging'],
                'high': ['Conduct compliance audit', 'Implement data protection', 'Add consent management'],
                'medium': ['Enhance compliance measures', 'Update documentation', 'Implement monitoring']
            }
        };
        
        return actions[category]?.[priority] || ['Review and improve this area'];
    }

    /**
     * Get category metrics
     */
    getCategoryMetrics(category) {
        const metrics = {
            'performance': ['response_time', 'throughput', 'cpu_utilization', 'memory_utilization'],
            'quality': ['test_coverage', 'code_quality', 'maintainability', 'technical_debt'],
            'security': ['vulnerability_count', 'security_score', 'authentication_strength'],
            'compliance': ['gdpr_compliance', 'iso27001_compliance', 'soc2_compliance']
        };
        
        return metrics[category] || [];
    }

    /**
     * Get category dependencies
     */
    getCategoryDependencies(category) {
        const dependencies = {
            'performance': ['Performance monitoring tools', 'CDN service', 'Caching solution'],
            'quality': ['Testing framework', 'Code analysis tools', 'Documentation tools'],
            'security': ['Security scanning tools', 'Authentication system', 'Encryption libraries'],
            'compliance': ['Audit logging system', 'Data protection tools', 'Policy management system']
        };
        
        return dependencies[category] || [];
    }

    /**
     * Get category resources
     */
    getCategoryResources(category, priority) {
        const resources = {
            'performance': {
                'critical': ['Performance Engineer', 'DevOps Engineer', 'Infrastructure Team'],
                'high': ['Senior Developer', 'DevOps Engineer'],
                'medium': ['Developer', 'Technical Lead']
            },
            'quality': {
                'critical': ['QA Engineer', 'Technical Lead', 'Code Review Team'],
                'high': ['QA Engineer', 'Senior Developer'],
                'medium': ['Developer', 'Technical Lead']
            },
            'security': {
                'critical': ['Security Expert', 'DevOps Engineer', 'Legal Team'],
                'high': ['Security Expert', 'Senior Developer'],
                'medium': ['Developer', 'Security Team']
            },
            'compliance': {
                'critical': ['Compliance Officer', 'Legal Team', 'Data Protection Officer'],
                'high': ['Compliance Officer', 'Legal Team'],
                'medium': ['Legal Team', 'Project Manager']
            }
        };
        
        return resources[category]?.[priority] || ['Project Team'];
    }

    /**
     * Get category risks
     */
    getCategoryRisks(category, priority) {
        const risks = {
            'performance': ['Performance degradation', 'User experience issues', 'Scalability problems'],
            'quality': ['Bugs and defects', 'Maintenance difficulties', 'Technical debt accumulation'],
            'security': ['Security breaches', 'Data leaks', 'Regulatory violations'],
            'compliance': ['Regulatory fines', 'Legal issues', 'Reputation damage']
        };
        
        return risks[category] || ['Project delays', 'Quality issues'];
    }

    /**
     * Get category benefits
     */
    getCategoryBenefits(category, priority) {
        const benefits = {
            'performance': ['Better user experience', 'Improved scalability', 'Reduced costs'],
            'quality': ['Fewer bugs', 'Easier maintenance', 'Better code quality'],
            'security': ['Reduced security risks', 'Compliance', 'Customer trust'],
            'compliance': ['Regulatory compliance', 'Risk mitigation', 'Legal protection']
        };
        
        return benefits[category] || ['Improved performance', 'Better quality'];
    }

    /**
     * Get metric actions
     */
    getMetricActions(category, metric) {
        // This would typically return specific actions for each metric
        return this.getCategoryActions(category, 'medium');
    }

    /**
     * Get metric dependencies
     */
    getMetricDependencies(category, metric) {
        return this.getCategoryDependencies(category);
    }

    /**
     * Get metric resources
     */
    getMetricResources(category, metric) {
        return this.getCategoryResources(category, 'medium');
    }

    /**
     * Get metric risks
     */
    getMetricRisks(category, metric) {
        return this.getCategoryRisks(category, 'medium');
    }

    /**
     * Get metric benefits
     */
    getMetricBenefits(category, metric) {
        return this.getCategoryBenefits(category, 'medium');
    }

    /**
     * Get comparison actions
     */
    getComparisonActions(comparison) {
        return [
            'Analyze competitor practices',
            'Implement best practices',
            'Optimize performance',
            'Improve quality',
            'Enhance security'
        ];
    }

    /**
     * Get comparison resources
     */
    getComparisonResources(comparison) {
        return ['Competitive Analysis Team', 'Performance Engineer', 'Quality Engineer'];
    }

    /**
     * Get comparison risks
     */
    getComparisonRisks(comparison) {
        return ['Competitive disadvantage', 'Market share loss', 'Customer churn'];
    }

    /**
     * Get comparison benefits
     */
    getComparisonBenefits(comparison) {
        return ['Competitive advantage', 'Market leadership', 'Customer satisfaction'];
    }

    /**
     * Get trend reversal actions
     */
    getTrendReversalActions(trends) {
        return [
            'Conduct root cause analysis',
            'Implement corrective measures',
            'Monitor progress closely',
            'Adjust strategies as needed'
        ];
    }

    /**
     * Get trend resources
     */
    getTrendResources(trends) {
        return ['Project Manager', 'Technical Lead', 'Analytics Team'];
    }

    /**
     * Get trend risks
     */
    getTrendRisks(trends) {
        return ['Continued decline', 'Project failure', 'Team demotivation'];
    }

    /**
     * Get trend benefits
     */
    getTrendBenefits(trends) {
        return ['Performance improvement', 'Team confidence', 'Project success'];
    }

    /**
     * Group recommendations by phase
     */
    groupRecommendationsByPhase(recommendations) {
        const phases = [[], [], []]; // 3 phases
        
        for (const rec of recommendations) {
            if (rec.priority === 'critical') {
                phases[0].push(rec);
            } else if (rec.priority === 'high') {
                phases[1].push(rec);
            } else {
                phases[2].push(rec);
            }
        }
        
        return phases.filter(phase => phase.length > 0);
    }

    /**
     * Calculate phase duration
     */
    calculatePhaseDuration(phase) {
        const durations = phase.map(rec => this.parseTimeline(rec.timeline));
        return Math.max(...durations);
    }

    /**
     * Parse timeline
     */
    parseTimeline(timeline) {
        if (timeline.includes('week')) return 1;
        if (timeline.includes('month')) return 3;
        if (timeline.includes('6+')) return 6;
        return 1;
    }

    /**
     * Calculate timeline
     */
    calculateTimeline(phases) {
        let totalMonths = 0;
        const phaseTimelines = [];
        
        for (let i = 0; i < phases.length; i++) {
            const duration = this.calculatePhaseDuration(phases[i]);
            phaseTimelines.push({
                phase: i + 1,
                duration: duration,
                startMonth: totalMonths,
                endMonth: totalMonths + duration
            });
            totalMonths += duration;
        }
        
        return {
            totalDuration: totalMonths,
            phases: phaseTimelines
        };
    }

    /**
     * Calculate resources
     */
    calculateResources(recommendations) {
        const resources = {};
        
        for (const rec of recommendations) {
            for (const resource of rec.resources || []) {
                resources[resource] = (resources[resource] || 0) + 1;
            }
        }
        
        return resources;
    }

    /**
     * Generate milestones
     */
    generateMilestones(phases) {
        const milestones = [];
        let month = 0;
        
        for (let i = 0; i < phases.length; i++) {
            const phase = phases[i];
            const duration = this.calculatePhaseDuration(phase);
            
            milestones.push({
                milestone: i + 1,
                name: `Phase ${i + 1} Complete`,
                targetDate: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000),
                objectives: phase.map(r => r.title),
                successCriteria: phase.map(r => `${r.metric}: ${r.targetValue}`)
            });
            
            month += duration;
        }
        
        return milestones;
    }

    /**
     * Generate recommendation ID
     */
    generateRecommendationId() {
        return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get recommendations
     */
    getRecommendations(filters = {}) {
        let recommendations = Array.from(this.recommendations.values());
        
        if (filters.projectId) {
            recommendations = recommendations.filter(rec => rec.projectId === filters.projectId);
        }
        
        if (filters.category) {
            recommendations = recommendations.filter(rec => 
                rec.recommendations.some(r => r.category === filters.category)
            );
        }
        
        if (filters.priority) {
            recommendations = recommendations.filter(rec => 
                rec.recommendations.some(r => r.priority === filters.priority)
            );
        }
        
        return recommendations;
    }

    /**
     * Clear old recommendations
     */
    clearOldRecommendations(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        const cutoffTime = Date.now() - maxAge;
        
        for (const [key, recommendation] of this.recommendations) {
            if (recommendation.timestamp.getTime() < cutoffTime) {
                this.recommendations.delete(key);
            }
        }
    }

    /**
     * Stop the recommendation engine
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = RecommendationEngine;
