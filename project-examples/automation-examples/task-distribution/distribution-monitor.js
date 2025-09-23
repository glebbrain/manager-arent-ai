/**
 * Distribution Monitor and Analytics System
 * Monitors task distribution performance and provides insights
 */

class DistributionMonitor {
    constructor(options = {}) {
        this.metrics = new Map();
        this.alerts = new Map();
        this.thresholds = options.thresholds || {
            workloadImbalance: 0.3,
            skillMismatch: 0.4,
            deadlineRisk: 0.7,
            efficiencyDrop: 0.2
        };
        
        this.monitoringInterval = options.monitoringInterval || 60000; // 1 minute
        this.alertCooldown = options.alertCooldown || 300000; // 5 minutes
        
        // Start monitoring
        this.startMonitoring();
    }

    /**
     * Start monitoring system
     */
    startMonitoring() {
        setInterval(() => {
            this.collectMetrics();
            this.analyzeMetrics();
            this.checkAlerts();
        }, this.monitoringInterval);
    }

    /**
     * Collect distribution metrics
     */
    collectMetrics() {
        const timestamp = new Date();
        
        // Workload distribution metrics
        const workloadMetrics = this.calculateWorkloadMetrics();
        
        // Skill utilization metrics
        const skillMetrics = this.calculateSkillMetrics();
        
        // Performance metrics
        const performanceMetrics = this.calculatePerformanceMetrics();
        
        // Deadline risk metrics
        const deadlineMetrics = this.calculateDeadlineMetrics();
        
        // Store metrics
        this.metrics.set(timestamp.toISOString(), {
            timestamp,
            workload: workloadMetrics,
            skills: skillMetrics,
            performance: performanceMetrics,
            deadlines: deadlineMetrics
        });
        
        // Keep only last 24 hours of metrics
        this.cleanupOldMetrics();
    }

    /**
     * Calculate workload distribution metrics
     */
    calculateWorkloadMetrics() {
        // This would integrate with the actual distribution engine
        // For now, return simulated data
        return {
            averageWorkload: 0.65,
            maxWorkload: 0.95,
            minWorkload: 0.25,
            standardDeviation: 0.15,
            imbalance: 0.2,
            overloadedDevelopers: 2,
            underloadedDevelopers: 1
        };
    }

    /**
     * Calculate skill utilization metrics
     */
    calculateSkillMetrics() {
        return {
            skillCoverage: 0.85,
            skillMismatch: 0.15,
            underutilizedSkills: ['React', 'TypeScript'],
            overutilizedSkills: ['JavaScript', 'Node.js'],
            skillGaps: ['Machine Learning', 'DevOps']
        };
    }

    /**
     * Calculate performance metrics
     */
    calculatePerformanceMetrics() {
        return {
            averageCompletionTime: 4.2,
            onTimeDelivery: 0.88,
            qualityScore: 0.92,
            efficiency: 0.78,
            productivity: 0.85,
            satisfaction: 0.91
        };
    }

    /**
     * Calculate deadline risk metrics
     */
    calculateDeadlineMetrics() {
        return {
            atRiskTasks: 3,
            overdueTasks: 1,
            averageDelay: 0.5,
            deadlineCompliance: 0.87,
            criticalPathTasks: 2
        };
    }

    /**
     * Analyze collected metrics
     */
    analyzeMetrics() {
        const latestMetrics = this.getLatestMetrics();
        if (!latestMetrics) return;
        
        // Analyze trends
        const trends = this.analyzeTrends();
        
        // Identify patterns
        const patterns = this.identifyPatterns();
        
        // Generate insights
        const insights = this.generateInsights(latestMetrics, trends, patterns);
        
        // Store analysis
        this.storeAnalysis({
            timestamp: new Date(),
            metrics: latestMetrics,
            trends,
            patterns,
            insights
        });
    }

    /**
     * Get latest metrics
     */
    getLatestMetrics() {
        const metrics = Array.from(this.metrics.values());
        return metrics.length > 0 ? metrics[metrics.length - 1] : null;
    }

    /**
     * Analyze trends over time
     */
    analyzeTrends() {
        const metrics = Array.from(this.metrics.values());
        if (metrics.length < 2) return {};
        
        const recent = metrics.slice(-10); // Last 10 data points
        const trends = {};
        
        // Calculate trends for each metric
        for (const metric of recent) {
            // Workload trend
            if (!trends.workload) trends.workload = [];
            trends.workload.push(metric.workload.averageWorkload);
            
            // Performance trend
            if (!trends.performance) trends.performance = [];
            trends.performance.push(metric.performance.efficiency);
            
            // Skill utilization trend
            if (!trends.skills) trends.skills = [];
            trends.skills.push(metric.skills.skillCoverage);
        }
        
        // Calculate trend direction
        return {
            workload: this.calculateTrendDirection(trends.workload),
            performance: this.calculateTrendDirection(trends.performance),
            skills: this.calculateTrendDirection(trends.skills)
        };
    }

    /**
     * Calculate trend direction
     */
    calculateTrendDirection(values) {
        if (values.length < 2) return 'stable';
        
        const first = values[0];
        const last = values[values.length - 1];
        const change = (last - first) / first;
        
        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }

    /**
     * Identify patterns in distribution
     */
    identifyPatterns() {
        const metrics = Array.from(this.metrics.values());
        if (metrics.length < 5) return {};
        
        const patterns = {};
        
        // Identify workload patterns
        patterns.workload = this.identifyWorkloadPatterns(metrics);
        
        // Identify performance patterns
        patterns.performance = this.identifyPerformancePatterns(metrics);
        
        // Identify skill utilization patterns
        patterns.skills = this.identifySkillPatterns(metrics);
        
        return patterns;
    }

    /**
     * Identify workload patterns
     */
    identifyWorkloadPatterns(metrics) {
        const workloadValues = metrics.map(m => m.workload.averageWorkload);
        const patterns = [];
        
        // Check for cyclic patterns
        if (this.hasCyclicPattern(workloadValues)) {
            patterns.push('cyclic-workload');
        }
        
        // Check for increasing workload
        if (this.hasIncreasingTrend(workloadValues)) {
            patterns.push('increasing-workload');
        }
        
        return patterns;
    }

    /**
     * Identify performance patterns
     */
    identifyPerformancePatterns(metrics) {
        const performanceValues = metrics.map(m => m.performance.efficiency);
        const patterns = [];
        
        // Check for performance degradation
        if (this.hasDecreasingTrend(performanceValues)) {
            patterns.push('performance-degradation');
        }
        
        // Check for performance spikes
        if (this.hasSpikePattern(performanceValues)) {
            patterns.push('performance-spikes');
        }
        
        return patterns;
    }

    /**
     * Identify skill patterns
     */
    identifySkillPatterns(metrics) {
        const skillValues = metrics.map(m => m.skills.skillCoverage);
        const patterns = [];
        
        // Check for skill utilization changes
        if (this.hasSignificantChange(skillValues)) {
            patterns.push('skill-utilization-change');
        }
        
        return patterns;
    }

    /**
     * Generate insights from metrics and patterns
     */
    generateInsights(metrics, trends, patterns) {
        const insights = [];
        
        // Workload insights
        if (metrics.workload.imbalance > this.thresholds.workloadImbalance) {
            insights.push({
                type: 'workload-imbalance',
                severity: 'warning',
                message: `Workload imbalance detected: ${(metrics.workload.imbalance * 100).toFixed(1)}%`,
                recommendation: 'Consider redistributing tasks to balance workload'
            });
        }
        
        // Skill insights
        if (metrics.skills.skillMismatch > this.thresholds.skillMismatch) {
            insights.push({
                type: 'skill-mismatch',
                severity: 'info',
                message: `Skill mismatch detected: ${(metrics.skills.skillMismatch * 100).toFixed(1)}%`,
                recommendation: 'Review task assignments for better skill matching'
            });
        }
        
        // Performance insights
        if (trends.performance === 'decreasing') {
            insights.push({
                type: 'performance-decline',
                severity: 'warning',
                message: 'Performance efficiency is declining',
                recommendation: 'Investigate causes and optimize distribution strategy'
            });
        }
        
        // Deadline insights
        if (metrics.deadlines.deadlineCompliance < 0.8) {
            insights.push({
                type: 'deadline-risk',
                severity: 'critical',
                message: `Deadline compliance is low: ${(metrics.deadlines.deadlineCompliance * 100).toFixed(1)}%`,
                recommendation: 'Review task priorities and resource allocation'
            });
        }
        
        return insights;
    }

    /**
     * Check for alerts
     */
    checkAlerts() {
        const latestMetrics = this.getLatestMetrics();
        if (!latestMetrics) return;
        
        // Check workload alerts
        this.checkWorkloadAlerts(latestMetrics);
        
        // Check performance alerts
        this.checkPerformanceAlerts(latestMetrics);
        
        // Check deadline alerts
        this.checkDeadlineAlerts(latestMetrics);
    }

    /**
     * Check workload alerts
     */
    checkWorkloadAlerts(metrics) {
        if (metrics.workload.imbalance > this.thresholds.workloadImbalance) {
            this.triggerAlert('workload-imbalance', {
                severity: 'warning',
                message: 'High workload imbalance detected',
                value: metrics.workload.imbalance,
                threshold: this.thresholds.workloadImbalance
            });
        }
    }

    /**
     * Check performance alerts
     */
    checkPerformanceAlerts(metrics) {
        if (metrics.performance.efficiency < (1 - this.thresholds.efficiencyDrop)) {
            this.triggerAlert('efficiency-drop', {
                severity: 'warning',
                message: 'Performance efficiency has dropped significantly',
                value: metrics.performance.efficiency,
                threshold: 1 - this.thresholds.efficiencyDrop
            });
        }
    }

    /**
     * Check deadline alerts
     */
    checkDeadlineAlerts(metrics) {
        if (metrics.deadlines.deadlineCompliance < this.thresholds.deadlineRisk) {
            this.triggerAlert('deadline-risk', {
                severity: 'critical',
                message: 'High deadline risk detected',
                value: metrics.deadlines.deadlineCompliance,
                threshold: this.thresholds.deadlineRisk
            });
        }
    }

    /**
     * Trigger alert
     */
    triggerAlert(type, alertData) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        
        // Check cooldown
        const lastAlert = this.getLastAlert(type);
        if (lastAlert && (now - lastAlert.timestamp) < this.alertCooldown) {
            return; // Still in cooldown
        }
        
        const alert = {
            id: alertId,
            type,
            timestamp: now,
            ...alertData
        };
        
        this.alerts.set(alertId, alert);
        
        // Send alert notification
        this.sendAlertNotification(alert);
        
        console.log(`Alert triggered: ${type} - ${alertData.message}`);
    }

    /**
     * Get last alert of specific type
     */
    getLastAlert(type) {
        const alerts = Array.from(this.alerts.values())
            .filter(a => a.type === type)
            .sort((a, b) => b.timestamp - a.timestamp);
        
        return alerts.length > 0 ? alerts[0] : null;
    }

    /**
     * Send alert notification
     */
    sendAlertNotification(alert) {
        // This would integrate with the notification system
        console.log(`Alert notification: ${alert.message}`);
    }

    /**
     * Store analysis results
     */
    storeAnalysis(analysis) {
        // Store analysis in database or cache
        console.log('Analysis stored:', analysis.timestamp);
    }

    /**
     * Clean up old metrics
     */
    cleanupOldMetrics() {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
        
        for (const [timestamp, metrics] of this.metrics) {
            if (metrics.timestamp < cutoff) {
                this.metrics.delete(timestamp);
            }
        }
    }

    /**
     * Get monitoring dashboard data
     */
    getDashboardData() {
        const latestMetrics = this.getLatestMetrics();
        const trends = this.analyzeTrends();
        const recentAlerts = this.getRecentAlerts(10);
        
        return {
            metrics: latestMetrics,
            trends,
            alerts: recentAlerts,
            health: this.calculateHealthScore(latestMetrics),
            recommendations: this.generateRecommendations(latestMetrics, trends)
        };
    }

    /**
     * Get recent alerts
     */
    getRecentAlerts(limit = 10) {
        return Array.from(this.alerts.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Calculate overall health score
     */
    calculateHealthScore(metrics) {
        if (!metrics) return 0;
        
        const workloadScore = 1 - metrics.workload.imbalance;
        const skillScore = 1 - metrics.skills.skillMismatch;
        const performanceScore = metrics.performance.efficiency;
        const deadlineScore = metrics.deadlines.deadlineCompliance;
        
        return (workloadScore + skillScore + performanceScore + deadlineScore) / 4;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(metrics, trends) {
        const recommendations = [];
        
        if (metrics.workload.imbalance > 0.3) {
            recommendations.push({
                type: 'workload-balancing',
                priority: 'high',
                action: 'Redistribute tasks to balance workload across developers',
                impact: 'Improve team efficiency and reduce burnout risk'
            });
        }
        
        if (trends.performance === 'decreasing') {
            recommendations.push({
                type: 'performance-optimization',
                priority: 'medium',
                action: 'Review task assignment strategy and provide additional support',
                impact: 'Improve overall team performance'
            });
        }
        
        if (metrics.skills.skillGaps.length > 0) {
            recommendations.push({
                type: 'skill-development',
                priority: 'low',
                action: 'Provide training opportunities for identified skill gaps',
                impact: 'Increase team capabilities and task assignment flexibility'
            });
        }
        
        return recommendations;
    }

    // Helper methods for pattern detection
    hasCyclicPattern(values) {
        // Simple cyclic pattern detection
        if (values.length < 6) return false;
        
        const recent = values.slice(-6);
        const firstHalf = recent.slice(0, 3);
        const secondHalf = recent.slice(3);
        
        const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        return Math.abs(avg1 - avg2) < 0.1;
    }

    hasIncreasingTrend(values) {
        if (values.length < 3) return false;
        
        const first = values[0];
        const last = values[values.length - 1];
        return (last - first) / first > 0.1;
    }

    hasDecreasingTrend(values) {
        if (values.length < 3) return false;
        
        const first = values[0];
        const last = values[values.length - 1];
        return (first - last) / first > 0.1;
    }

    hasSpikePattern(values) {
        if (values.length < 3) return false;
        
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return values.some(v => Math.abs(v - avg) > avg * 0.5);
    }

    hasSignificantChange(values) {
        if (values.length < 2) return false;
        
        const first = values[0];
        const last = values[values.length - 1];
        return Math.abs(last - first) / first > 0.2;
    }
}

module.exports = DistributionMonitor;
