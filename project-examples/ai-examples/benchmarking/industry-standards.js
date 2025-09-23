/**
 * Industry Standards
 * Manages industry benchmarks and standards for comparison
 */

class IndustryStandards {
    constructor(options = {}) {
        this.standards = new Map();
        this.categories = new Map();
        this.metrics = new Map();
        this.isRunning = true;
        
        this.initializeDefaultStandards();
    }

    /**
     * Initialize default industry standards
     */
    initializeDefaultStandards() {
        // Performance standards
        this.addStandard('performance', 'response_time', {
            excellent: 100, // ms
            good: 300,
            average: 500,
            poor: 1000
        });

        this.addStandard('performance', 'throughput', {
            excellent: 1000, // RPS
            good: 500,
            average: 200,
            poor: 50
        });

        this.addStandard('performance', 'cpu_utilization', {
            excellent: 0.7,
            good: 0.8,
            average: 0.9,
            poor: 1.0
        });

        this.addStandard('performance', 'memory_utilization', {
            excellent: 0.7,
            good: 0.8,
            average: 0.9,
            poor: 1.0
        });

        // Quality standards
        this.addStandard('quality', 'test_coverage', {
            excellent: 0.9,
            good: 0.8,
            average: 0.7,
            poor: 0.5
        });

        this.addStandard('quality', 'code_quality', {
            excellent: 0.9,
            good: 0.8,
            average: 0.7,
            poor: 0.5
        });

        this.addStandard('quality', 'maintainability', {
            excellent: 0.9,
            good: 0.8,
            average: 0.7,
            poor: 0.5
        });

        this.addStandard('quality', 'technical_debt', {
            excellent: 0.1, // Low debt
            good: 0.2,
            average: 0.3,
            poor: 0.5
        });

        // Security standards
        this.addStandard('security', 'vulnerability_count', {
            excellent: 0, // No vulnerabilities
            good: 5,
            average: 10,
            poor: 25
        });

        this.addStandard('security', 'security_score', {
            excellent: 0.9,
            good: 0.8,
            average: 0.7,
            poor: 0.5
        });

        this.addStandard('security', 'authentication_strength', {
            excellent: 0.9,
            good: 0.8,
            average: 0.7,
            poor: 0.5
        });

        this.addStandard('security', 'data_encryption', {
            excellent: 0.9,
            good: 0.8,
            average: 0.7,
            poor: 0.5
        });

        // Compliance standards
        this.addStandard('compliance', 'gdpr_compliance', {
            excellent: 0.95,
            good: 0.9,
            average: 0.8,
            poor: 0.6
        });

        this.addStandard('compliance', 'iso27001_compliance', {
            excellent: 0.95,
            good: 0.9,
            average: 0.8,
            poor: 0.6
        });

        this.addStandard('compliance', 'soc2_compliance', {
            excellent: 0.95,
            good: 0.9,
            average: 0.8,
            poor: 0.6
        });

        this.addStandard('compliance', 'pci_compliance', {
            excellent: 0.95,
            good: 0.9,
            average: 0.8,
            poor: 0.6
        });

        // Industry-specific standards
        this.addIndustryStandard('fintech', {
            performance: {
                response_time: { excellent: 50, good: 100, average: 200, poor: 500 },
                throughput: { excellent: 2000, good: 1000, average: 500, poor: 100 }
            },
            security: {
                security_score: { excellent: 0.95, good: 0.9, average: 0.8, poor: 0.6 },
                vulnerability_count: { excellent: 0, good: 2, average: 5, poor: 10 }
            },
            compliance: {
                pci_compliance: { excellent: 0.98, good: 0.95, average: 0.9, poor: 0.8 }
            }
        });

        this.addIndustryStandard('healthcare', {
            performance: {
                response_time: { excellent: 200, good: 500, average: 1000, poor: 2000 },
                throughput: { excellent: 500, good: 200, average: 100, poor: 50 }
            },
            security: {
                security_score: { excellent: 0.95, good: 0.9, average: 0.8, poor: 0.6 },
                vulnerability_count: { excellent: 0, good: 1, average: 3, poor: 8 }
            },
            compliance: {
                hipaa_compliance: { excellent: 0.98, good: 0.95, average: 0.9, poor: 0.8 }
            }
        });

        this.addIndustryStandard('ecommerce', {
            performance: {
                response_time: { excellent: 100, good: 300, average: 500, poor: 1000 },
                throughput: { excellent: 1000, good: 500, average: 200, poor: 50 }
            },
            security: {
                security_score: { excellent: 0.9, good: 0.8, average: 0.7, poor: 0.5 },
                vulnerability_count: { excellent: 0, good: 5, average: 10, poor: 20 }
            },
            compliance: {
                pci_compliance: { excellent: 0.95, good: 0.9, average: 0.8, poor: 0.6 }
            }
        });

        this.addIndustryStandard('saas', {
            performance: {
                response_time: { excellent: 150, good: 300, average: 500, poor: 1000 },
                throughput: { excellent: 800, good: 400, average: 200, poor: 100 }
            },
            quality: {
                test_coverage: { excellent: 0.9, good: 0.8, average: 0.7, poor: 0.5 },
                code_quality: { excellent: 0.9, good: 0.8, average: 0.7, poor: 0.5 }
            },
            security: {
                security_score: { excellent: 0.9, good: 0.8, average: 0.7, poor: 0.5 },
                vulnerability_count: { excellent: 0, good: 3, average: 8, poor: 15 }
            }
        });
    }

    /**
     * Add a standard
     */
    addStandard(category, metric, thresholds) {
        if (!this.standards.has(category)) {
            this.standards.set(category, new Map());
        }
        
        this.standards.get(category).set(metric, thresholds);
        
        // Update categories
        if (!this.categories.has(category)) {
            this.categories.set(category, {
                name: this.getCategoryName(category),
                description: this.getCategoryDescription(category),
                metrics: []
            });
        }
        
        this.categories.get(category).metrics.push(metric);
        
        // Update metrics
        this.metrics.set(metric, {
            name: this.getMetricName(metric),
            description: this.getMetricDescription(metric),
            category,
            unit: this.getMetricUnit(metric)
        });
    }

    /**
     * Add industry-specific standard
     */
    addIndustryStandard(industry, standards) {
        for (const [category, categoryStandards] of Object.entries(standards)) {
            for (const [metric, thresholds] of Object.entries(categoryStandards)) {
                const key = `${industry}_${category}_${metric}`;
                this.standards.set(key, thresholds);
            }
        }
    }

    /**
     * Get standards
     */
    getStandards(filters = {}) {
        const { category, metric } = filters;
        
        let standards = {};
        
        if (category && metric) {
            const key = `${category}_${metric}`;
            const standard = this.standards.get(category)?.get(metric);
            if (standard) {
                standards[key] = standard;
            }
        } else if (category) {
            const categoryStandards = this.standards.get(category);
            if (categoryStandards) {
                for (const [metricName, thresholds] of categoryStandards) {
                    standards[metricName] = thresholds;
                }
            }
        } else {
            for (const [cat, categoryStandards] of this.standards) {
                standards[cat] = {};
                for (const [metricName, thresholds] of categoryStandards) {
                    standards[cat][metricName] = thresholds;
                }
            }
        }
        
        return standards;
    }

    /**
     * Compare with standards
     */
    async compareWithStandards(benchmark, benchmarkType) {
        const comparison = {
            benchmarkType,
            timestamp: new Date(),
            categories: {},
            overallScore: 0,
            grade: 'F',
            recommendations: []
        };
        
        let totalScore = 0;
        let categoryCount = 0;
        
        for (const [category, categoryMetrics] of Object.entries(benchmark.metrics)) {
            if (typeof categoryMetrics === 'object' && categoryMetrics !== null) {
                const categoryComparison = this.compareCategoryWithStandards(category, categoryMetrics);
                comparison.categories[category] = categoryComparison;
                totalScore += categoryComparison.score;
                categoryCount++;
            }
        }
        
        if (categoryCount > 0) {
            comparison.overallScore = totalScore / categoryCount;
            comparison.grade = this.calculateGrade(comparison.overallScore);
        }
        
        // Generate recommendations
        comparison.recommendations = this.generateComparisonRecommendations(comparison);
        
        return comparison;
    }

    /**
     * Compare category with standards
     */
    compareCategoryWithStandards(category, categoryMetrics) {
        const comparison = {
            category,
            score: 0,
            metrics: {},
            strengths: [],
            weaknesses: [],
            opportunities: []
        };
        
        let totalScore = 0;
        let metricCount = 0;
        
        for (const [metric, value] of Object.entries(categoryMetrics)) {
            if (typeof value === 'number' && !isNaN(value)) {
                const metricComparison = this.compareMetricWithStandard(category, metric, value);
                comparison.metrics[metric] = metricComparison;
                totalScore += metricComparison.score;
                metricCount++;
                
                // Categorize as strength, weakness, or opportunity
                if (metricComparison.score >= 0.8) {
                    comparison.strengths.push({
                        metric,
                        value,
                        score: metricComparison.score,
                        level: metricComparison.level
                    });
                } else if (metricComparison.score < 0.5) {
                    comparison.weaknesses.push({
                        metric,
                        value,
                        score: metricComparison.score,
                        level: metricComparison.level,
                        improvement: metricComparison.improvement
                    });
                } else {
                    comparison.opportunities.push({
                        metric,
                        value,
                        score: metricComparison.score,
                        level: metricComparison.level,
                        potential: metricComparison.potential
                    });
                }
            }
        }
        
        if (metricCount > 0) {
            comparison.score = totalScore / metricCount;
        }
        
        return comparison;
    }

    /**
     * Compare metric with standard
     */
    compareMetricWithStandard(category, metric, value) {
        const standard = this.standards.get(category)?.get(metric);
        
        if (!standard) {
            return {
                metric,
                value,
                score: 0.5, // Default score if no standard
                level: 'unknown',
                standard: null
            };
        }
        
        // Determine level based on thresholds
        let level = 'poor';
        if (value <= standard.excellent) {
            level = 'excellent';
        } else if (value <= standard.good) {
            level = 'good';
        } else if (value <= standard.average) {
            level = 'average';
        }
        
        // Calculate score (inverse for metrics where lower is better)
        const isLowerBetter = this.isLowerBetter(metric);
        let score;
        
        if (isLowerBetter) {
            if (value <= standard.excellent) {
                score = 1.0;
            } else if (value <= standard.good) {
                score = 0.8;
            } else if (value <= standard.average) {
                score = 0.6;
            } else {
                score = 0.4;
            }
        } else {
            if (value >= standard.excellent) {
                score = 1.0;
            } else if (value >= standard.good) {
                score = 0.8;
            } else if (value >= standard.average) {
                score = 0.6;
            } else {
                score = 0.4;
            }
        }
        
        return {
            metric,
            value,
            score,
            level,
            standard,
            improvement: this.calculateImprovement(value, standard, isLowerBetter),
            potential: this.calculatePotential(value, standard, isLowerBetter)
        };
    }

    /**
     * Check if lower value is better for a metric
     */
    isLowerBetter(metric) {
        const lowerBetterMetrics = [
            'response_time',
            'p95_response_time',
            'p99_response_time',
            'cpu_utilization',
            'memory_utilization',
            'disk_utilization',
            'vulnerability_count',
            'critical_vulnerabilities',
            'technical_debt',
            'code_duplication',
            'cyclomatic_complexity'
        ];
        
        return lowerBetterMetrics.includes(metric);
    }

    /**
     * Calculate improvement needed
     */
    calculateImprovement(value, standard, isLowerBetter) {
        if (isLowerBetter) {
            const target = standard.good;
            return value > target ? value - target : 0;
        } else {
            const target = standard.good;
            return value < target ? target - value : 0;
        }
    }

    /**
     * Calculate potential improvement
     */
    calculatePotential(value, standard, isLowerBetter) {
        if (isLowerBetter) {
            const maxImprovement = value - standard.excellent;
            return maxImprovement > 0 ? maxImprovement : 0;
        } else {
            const maxImprovement = standard.excellent - value;
            return maxImprovement > 0 ? maxImprovement : 0;
        }
    }

    /**
     * Calculate grade
     */
    calculateGrade(score) {
        if (score >= 0.9) return 'A+';
        if (score >= 0.8) return 'A';
        if (score >= 0.7) return 'B+';
        if (score >= 0.6) return 'B';
        if (score >= 0.5) return 'C+';
        if (score >= 0.4) return 'C';
        if (score >= 0.3) return 'D';
        return 'F';
    }

    /**
     * Generate comparison recommendations
     */
    generateComparisonRecommendations(comparison) {
        const recommendations = [];
        
        for (const [category, categoryComparison] of Object.entries(comparison.categories)) {
            if (categoryComparison.score < 0.7) {
                recommendations.push({
                    category,
                    priority: categoryComparison.score < 0.5 ? 'high' : 'medium',
                    score: categoryComparison.score,
                    improvements: categoryComparison.weaknesses.map(w => ({
                        metric: w.metric,
                        currentValue: w.value,
                        targetValue: this.getTargetValue(category, w.metric),
                        improvement: w.improvement
                    }))
                });
            }
        }
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Get target value for improvement
     */
    getTargetValue(category, metric) {
        const standard = this.standards.get(category)?.get(metric);
        if (!standard) return null;
        
        const isLowerBetter = this.isLowerBetter(metric);
        return isLowerBetter ? standard.good : standard.good;
    }

    /**
     * Get industry benchmark
     */
    async getIndustryBenchmark(benchmarkType, category) {
        const benchmark = {
            type: 'industry',
            category,
            benchmarkType,
            timestamp: new Date(),
            metrics: {},
            score: 0.7, // Default industry average
            grade: 'B'
        };
        
        // Get industry-specific standards if available
        const industryStandards = this.getIndustrySpecificStandards(category);
        if (industryStandards) {
            for (const [metric, thresholds] of Object.entries(industryStandards)) {
                benchmark.metrics[metric] = thresholds.average; // Use average as benchmark
            }
        }
        
        return benchmark;
    }

    /**
     * Get industry-specific standards
     */
    getIndustrySpecificStandards(industry) {
        const industryStandards = {};
        
        for (const [key, thresholds] of this.standards) {
            if (key.startsWith(`${industry}_`)) {
                const parts = key.split('_');
                const category = parts[1];
                const metric = parts[2];
                
                if (!industryStandards[category]) {
                    industryStandards[category] = {};
                }
                
                industryStandards[category][metric] = thresholds;
            }
        }
        
        return Object.keys(industryStandards).length > 0 ? industryStandards : null;
    }

    /**
     * Get category name
     */
    getCategoryName(category) {
        const names = {
            'performance': 'Performance',
            'quality': 'Code Quality',
            'security': 'Security',
            'compliance': 'Compliance'
        };
        
        return names[category] || category;
    }

    /**
     * Get category description
     */
    getCategoryDescription(category) {
        const descriptions = {
            'performance': 'Application performance and scalability metrics',
            'quality': 'Code quality and maintainability metrics',
            'security': 'Security and vulnerability metrics',
            'compliance': 'Regulatory and compliance metrics'
        };
        
        return descriptions[category] || '';
    }

    /**
     * Get metric name
     */
    getMetricName(metric) {
        const names = {
            'response_time': 'Response Time',
            'throughput': 'Throughput',
            'cpu_utilization': 'CPU Utilization',
            'memory_utilization': 'Memory Utilization',
            'test_coverage': 'Test Coverage',
            'code_quality': 'Code Quality',
            'maintainability': 'Maintainability',
            'technical_debt': 'Technical Debt',
            'vulnerability_count': 'Vulnerability Count',
            'security_score': 'Security Score',
            'gdpr_compliance': 'GDPR Compliance',
            'iso27001_compliance': 'ISO 27001 Compliance'
        };
        
        return names[metric] || metric;
    }

    /**
     * Get metric description
     */
    getMetricDescription(metric) {
        const descriptions = {
            'response_time': 'Average response time in milliseconds',
            'throughput': 'Requests per second',
            'cpu_utilization': 'CPU utilization percentage',
            'memory_utilization': 'Memory utilization percentage',
            'test_coverage': 'Percentage of code covered by tests',
            'code_quality': 'Overall code quality score',
            'maintainability': 'Code maintainability index',
            'technical_debt': 'Technical debt in hours',
            'vulnerability_count': 'Number of security vulnerabilities',
            'security_score': 'Overall security score',
            'gdpr_compliance': 'GDPR compliance percentage',
            'iso27001_compliance': 'ISO 27001 compliance percentage'
        };
        
        return descriptions[metric] || '';
    }

    /**
     * Get metric unit
     */
    getMetricUnit(metric) {
        const units = {
            'response_time': 'ms',
            'throughput': 'RPS',
            'cpu_utilization': '%',
            'memory_utilization': '%',
            'test_coverage': '%',
            'code_quality': 'score',
            'maintainability': 'index',
            'technical_debt': 'hours',
            'vulnerability_count': 'count',
            'security_score': 'score',
            'gdpr_compliance': '%',
            'iso27001_compliance': '%'
        };
        
        return units[metric] || '';
    }

    /**
     * Stop the industry standards
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = IndustryStandards;
