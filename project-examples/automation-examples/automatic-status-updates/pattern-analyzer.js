/**
 * Pattern Analyzer
 * Analyzes patterns in status updates for AI-powered insights
 */

class PatternAnalyzer {
    constructor(options = {}) {
        this.modelType = options.modelType || 'ensemble';
        this.learningRate = options.learningRate || 0.01;
        this.predictionAccuracy = options.predictionAccuracy || 0.85;
        this.contextWindow = options.contextWindow || 30;
        
        this.patterns = new Map();
        this.insights = new Map();
        this.isRunning = true;
    }

    /**
     * Analyze status update patterns
     */
    analyzePatterns(updates, options = {}) {
        try {
            const { projectId, taskType, timeRange = '30d' } = options;
            
            const analysis = {
                projectId,
                taskType,
                timeRange,
                timestamp: new Date(),
                patterns: {},
                insights: [],
                recommendations: []
            };
            
            // Analyze different pattern types
            analysis.patterns.transitionPatterns = this.analyzeTransitionPatterns(updates);
            analysis.patterns.temporalPatterns = this.analyzeTemporalPatterns(updates);
            analysis.patterns.frequencyPatterns = this.analyzeFrequencyPatterns(updates);
            analysis.patterns.conflictPatterns = this.analyzeConflictPatterns(updates);
            analysis.patterns.userPatterns = this.analyzeUserPatterns(updates);
            analysis.patterns.seasonalPatterns = this.analyzeSeasonalPatterns(updates);
            
            // Generate insights
            analysis.insights = this.generateInsights(analysis.patterns);
            
            // Generate recommendations
            analysis.recommendations = this.generateRecommendations(analysis.patterns, analysis.insights);
            
            // Store analysis
            this.patterns.set(`${projectId}_${taskType}_${timeRange}`, analysis);
            
            return analysis;
        } catch (error) {
            console.error('Error analyzing patterns:', error);
            throw error;
        }
    }

    /**
     * Analyze transition patterns
     */
    analyzeTransitionPatterns(updates) {
        const transitions = {};
        const transitionTimes = {};
        const transitionReasons = {};
        
        for (const update of updates) {
            const transition = `${update.previousStatus} -> ${update.newStatus}`;
            
            // Count transitions
            transitions[transition] = (transitions[transition] || 0) + 1;
            
            // Track transition times
            if (!transitionTimes[transition]) {
                transitionTimes[transition] = [];
            }
            transitionTimes[transition].push(new Date(update.timestamp).getTime());
            
            // Track transition reasons
            if (update.reason) {
                if (!transitionReasons[transition]) {
                    transitionReasons[transition] = {};
                }
                transitionReasons[transition][update.reason] = 
                    (transitionReasons[transition][update.reason] || 0) + 1;
            }
        }
        
        // Calculate average transition times
        const avgTransitionTimes = {};
        for (const [transition, times] of Object.entries(transitionTimes)) {
            if (times.length > 1) {
                const intervals = [];
                for (let i = 1; i < times.length; i++) {
                    intervals.push(times[i] - times[i - 1]);
                }
                avgTransitionTimes[transition] = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            }
        }
        
        return {
            transitions,
            avgTransitionTimes,
            transitionReasons,
            mostCommonTransitions: this.getMostCommon(transitions, 5),
            leastCommonTransitions: this.getLeastCommon(transitions, 5)
        };
    }

    /**
     * Analyze temporal patterns
     */
    analyzeTemporalPatterns(updates) {
        const hourlyDistribution = {};
        const dailyDistribution = {};
        const weeklyDistribution = {};
        
        for (const update of updates) {
            const date = new Date(update.timestamp);
            
            // Hourly distribution
            const hour = date.getHours();
            hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
            
            // Daily distribution
            const day = date.getDay();
            dailyDistribution[day] = (dailyDistribution[day] || 0) + 1;
            
            // Weekly distribution
            const week = this.getWeekNumber(date);
            const weekKey = `${date.getFullYear()}-W${week}`;
            weeklyDistribution[weekKey] = (weeklyDistribution[weekKey] || 0) + 1;
        }
        
        return {
            hourlyDistribution,
            dailyDistribution,
            weeklyDistribution,
            peakHours: this.getPeakHours(hourlyDistribution),
            peakDays: this.getPeakDays(dailyDistribution),
            peakWeeks: this.getPeakWeeks(weeklyDistribution)
        };
    }

    /**
     * Analyze frequency patterns
     */
    analyzeFrequencyPatterns(updates) {
        const taskFrequencies = {};
        const statusFrequencies = {};
        const userFrequencies = {};
        
        for (const update of updates) {
            // Task frequencies
            const taskId = update.taskId;
            taskFrequencies[taskId] = (taskFrequencies[taskId] || 0) + 1;
            
            // Status frequencies
            const status = update.newStatus;
            statusFrequencies[status] = (statusFrequencies[status] || 0) + 1;
            
            // User frequencies
            const user = update.metadata?.user || 'system';
            userFrequencies[user] = (userFrequencies[user] || 0) + 1;
        }
        
        return {
            taskFrequencies,
            statusFrequencies,
            userFrequencies,
            mostActiveTasks: this.getMostCommon(taskFrequencies, 10),
            mostCommonStatuses: this.getMostCommon(statusFrequencies, 5),
            mostActiveUsers: this.getMostCommon(userFrequencies, 10)
        };
    }

    /**
     * Analyze conflict patterns
     */
    analyzeConflictPatterns(updates) {
        const conflictTypes = {};
        const conflictSeverities = {};
        const conflictResolutions = {};
        
        for (const update of updates) {
            if (update.conflicts && update.conflicts.length > 0) {
                for (const conflict of update.conflicts) {
                    // Conflict types
                    const type = conflict.type;
                    conflictTypes[type] = (conflictTypes[type] || 0) + 1;
                    
                    // Conflict severities
                    const severity = conflict.severity;
                    conflictSeverities[severity] = (conflictSeverities[severity] || 0) + 1;
                }
            }
        }
        
        return {
            conflictTypes,
            conflictSeverities,
            conflictResolutions,
            mostCommonConflictTypes: this.getMostCommon(conflictTypes, 5),
            conflictRate: this.calculateConflictRate(updates),
            resolutionRate: this.calculateResolutionRate(updates)
        };
    }

    /**
     * Analyze user patterns
     */
    analyzeUserPatterns(updates) {
        const userActivities = {};
        const userPreferences = {};
        const userEfficiency = {};
        
        for (const update of updates) {
            const user = update.metadata?.user || 'system';
            
            if (!userActivities[user]) {
                userActivities[user] = {
                    totalUpdates: 0,
                    statuses: {},
                    times: [],
                    reasons: {}
                };
            }
            
            // Count activities
            userActivities[user].totalUpdates++;
            userActivities[user].statuses[update.newStatus] = 
                (userActivities[user].statuses[update.newStatus] || 0) + 1;
            userActivities[user].times.push(new Date(update.timestamp).getTime());
            
            if (update.reason) {
                userActivities[user].reasons[update.reason] = 
                    (userActivities[user].reasons[update.reason] || 0) + 1;
            }
        }
        
        // Calculate user efficiency
        for (const [user, activity] of Object.entries(userActivities)) {
            if (activity.times.length > 1) {
                const intervals = [];
                for (let i = 1; i < activity.times.length; i++) {
                    intervals.push(activity.times[i] - activity.times[i - 1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                userEfficiency[user] = 1 / (avgInterval / (24 * 60 * 60 * 1000)); // Updates per day
            }
        }
        
        return {
            userActivities,
            userEfficiency,
            mostEfficientUsers: this.getMostCommon(userEfficiency, 10),
            leastEfficientUsers: this.getLeastCommon(userEfficiency, 10)
        };
    }

    /**
     * Analyze seasonal patterns
     */
    analyzeSeasonalPatterns(updates) {
        const monthlyDistribution = {};
        const quarterlyDistribution = {};
        const yearlyDistribution = {};
        
        for (const update of updates) {
            const date = new Date(update.timestamp);
            
            // Monthly distribution
            const month = date.getMonth();
            monthlyDistribution[month] = (monthlyDistribution[month] || 0) + 1;
            
            // Quarterly distribution
            const quarter = Math.floor(month / 3) + 1;
            quarterlyDistribution[quarter] = (quarterlyDistribution[quarter] || 0) + 1;
            
            // Yearly distribution
            const year = date.getFullYear();
            yearlyDistribution[year] = (yearlyDistribution[year] || 0) + 1;
        }
        
        return {
            monthlyDistribution,
            quarterlyDistribution,
            yearlyDistribution,
            peakMonths: this.getPeakMonths(monthlyDistribution),
            peakQuarters: this.getPeakQuarters(quarterlyDistribution),
            seasonalTrends: this.calculateSeasonalTrends(monthlyDistribution)
        };
    }

    /**
     * Generate insights
     */
    generateInsights(patterns) {
        const insights = [];
        
        // Transition insights
        if (patterns.transitionPatterns) {
            const mostCommon = patterns.transitionPatterns.mostCommonTransitions;
            if (mostCommon.length > 0) {
                insights.push({
                    type: 'transition',
                    severity: 'info',
                    message: `Most common status transition: ${mostCommon[0].key} (${mostCommon[0].value} times)`,
                    recommendation: 'Consider automating this transition'
                });
            }
        }
        
        // Temporal insights
        if (patterns.temporalPatterns) {
            const peakHours = patterns.temporalPatterns.peakHours;
            if (peakHours.length > 0) {
                insights.push({
                    type: 'temporal',
                    severity: 'info',
                    message: `Peak activity hours: ${peakHours.join(', ')}`,
                    recommendation: 'Schedule important updates during peak hours'
                });
            }
        }
        
        // Conflict insights
        if (patterns.conflictPatterns) {
            const conflictRate = patterns.conflictPatterns.conflictRate;
            if (conflictRate > 0.1) {
                insights.push({
                    type: 'conflict',
                    severity: 'warning',
                    message: `High conflict rate: ${(conflictRate * 100).toFixed(2)}%`,
                    recommendation: 'Review and improve conflict resolution processes'
                });
            }
        }
        
        // User insights
        if (patterns.userPatterns) {
            const mostEfficient = patterns.userPatterns.mostEfficientUsers;
            if (mostEfficient.length > 0) {
                insights.push({
                    type: 'user',
                    severity: 'info',
                    message: `Most efficient user: ${mostEfficient[0].key}`,
                    recommendation: 'Use as a model for other users'
                });
            }
        }
        
        return insights;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(patterns, insights) {
        const recommendations = [];
        
        // Based on insights
        for (const insight of insights) {
            if (insight.recommendation) {
                recommendations.push({
                    type: insight.type,
                    priority: insight.severity === 'warning' ? 'high' : 'medium',
                    action: insight.recommendation,
                    impact: 'Improve efficiency and reduce conflicts'
                });
            }
        }
        
        // Based on patterns
        if (patterns.transitionPatterns) {
            const leastCommon = patterns.transitionPatterns.leastCommonTransitions;
            if (leastCommon.length > 0) {
                recommendations.push({
                    type: 'transition',
                    priority: 'low',
                    action: `Review why transition ${leastCommon[0].key} is rare`,
                    impact: 'Identify potential process improvements'
                });
            }
        }
        
        if (patterns.conflictPatterns) {
            const conflictTypes = patterns.conflictPatterns.mostCommonConflictTypes;
            if (conflictTypes.length > 0) {
                recommendations.push({
                    type: 'conflict',
                    priority: 'high',
                    action: `Focus on resolving ${conflictTypes[0].key} conflicts`,
                    impact: 'Reduce overall conflict rate'
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Get most common items
     */
    getMostCommon(obj, limit = 5) {
        return Object.entries(obj)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([key, value]) => ({ key, value }));
    }

    /**
     * Get least common items
     */
    getLeastCommon(obj, limit = 5) {
        return Object.entries(obj)
            .sort((a, b) => a[1] - b[1])
            .slice(0, limit)
            .map(([key, value]) => ({ key, value }));
    }

    /**
     * Get peak hours
     */
    getPeakHours(hourlyDistribution) {
        return Object.entries(hourlyDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([hour, count]) => parseInt(hour));
    }

    /**
     * Get peak days
     */
    getPeakDays(dailyDistribution) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return Object.entries(dailyDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([day, count]) => dayNames[parseInt(day)]);
    }

    /**
     * Get peak weeks
     */
    getPeakWeeks(weeklyDistribution) {
        return Object.entries(weeklyDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([week, count]) => week);
    }

    /**
     * Get peak months
     */
    getPeakMonths(monthlyDistribution) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return Object.entries(monthlyDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([month, count]) => monthNames[parseInt(month)]);
    }

    /**
     * Get peak quarters
     */
    getPeakQuarters(quarterlyDistribution) {
        return Object.entries(quarterlyDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([quarter, count]) => `Q${quarter}`);
    }

    /**
     * Calculate seasonal trends
     */
    calculateSeasonalTrends(monthlyDistribution) {
        const months = Object.keys(monthlyDistribution).map(Number).sort((a, b) => a - b);
        if (months.length < 2) return {};
        
        const values = months.map(month => monthlyDistribution[month]);
        const trend = this.calculateTrend(values);
        
        return {
            direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
            strength: Math.abs(trend),
            months: months.length
        };
    }

    /**
     * Calculate trend
     */
    calculateTrend(values) {
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
     * Calculate conflict rate
     */
    calculateConflictRate(updates) {
        const totalUpdates = updates.length;
        const conflictedUpdates = updates.filter(u => u.conflicts && u.conflicts.length > 0).length;
        
        return totalUpdates > 0 ? conflictedUpdates / totalUpdates : 0;
    }

    /**
     * Calculate resolution rate
     */
    calculateResolutionRate(updates) {
        const conflictedUpdates = updates.filter(u => u.conflicts && u.conflicts.length > 0);
        if (conflictedUpdates.length === 0) return 1;
        
        const resolvedUpdates = conflictedUpdates.filter(u => 
            u.metadata && u.metadata.resolution
        );
        
        return resolvedUpdates.length / conflictedUpdates.length;
    }

    /**
     * Get week number
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /**
     * Get pattern analysis
     */
    getPatternAnalysis(key) {
        return this.patterns.get(key);
    }

    /**
     * Get all pattern analyses
     */
    getAllPatternAnalyses() {
        return Array.from(this.patterns.values());
    }

    /**
     * Clear old patterns
     */
    clearOldPatterns(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        const cutoffTime = Date.now() - maxAge;
        
        for (const [key, pattern] of this.patterns) {
            if (pattern.timestamp.getTime() < cutoffTime) {
                this.patterns.delete(key);
            }
        }
    }

    /**
     * Stop the pattern analyzer
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = PatternAnalyzer;
