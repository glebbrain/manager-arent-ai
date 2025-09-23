/**
 * Risk Monitoring System for Deadline Prediction
 * Monitors and alerts on deadline risks in real-time
 */

class RiskMonitoringSystem {
    constructor(options = {}) {
        this.risks = new Map();
        this.alerts = new Map();
        this.monitoringRules = new Map();
        this.riskThresholds = options.riskThresholds || {
            deadline: 0.7,
            complexity: 0.6,
            resource: 0.8,
            dependency: 0.5
        };
        
        this.alertCooldown = options.alertCooldown || 300000; // 5 minutes
        this.monitoringInterval = options.monitoringInterval || 60000; // 1 minute
        this.riskHistory = [];
        
        // Initialize monitoring rules
        this.initializeMonitoringRules();
        
        // Start monitoring
        this.startMonitoring();
    }

    /**
     * Initialize monitoring rules
     */
    initializeMonitoringRules() {
        // Deadline risk rules
        this.monitoringRules.set('deadline-risk', {
            name: 'Deadline Risk Monitoring',
            enabled: true,
            threshold: this.riskThresholds.deadline,
            checkInterval: 300000, // 5 minutes
            lastChecked: null,
            conditions: [
                'timeRemaining < estimatedTime * 1.2',
                'progressRate < expectedProgressRate * 0.8',
                'deadlineApproaching && taskNotStarted'
            ]
        });
        
        // Complexity risk rules
        this.monitoringRules.set('complexity-risk', {
            name: 'Complexity Risk Monitoring',
            enabled: true,
            threshold: this.riskThresholds.complexity,
            checkInterval: 600000, // 10 minutes
            lastChecked: null,
            conditions: [
                'taskComplexity > developerSkillLevel * 1.5',
                'dependenciesCount > 5',
                'newTechnologyRequired && noExperience'
            ]
        });
        
        // Resource risk rules
        this.monitoringRules.set('resource-risk', {
            name: 'Resource Risk Monitoring',
            enabled: true,
            threshold: this.riskThresholds.resource,
            checkInterval: 300000, // 5 minutes
            lastChecked: null,
            conditions: [
                'developerWorkload > capacity * 0.9',
                'teamAvailability < requiredAvailability',
                'externalDependenciesBlocked'
            ]
        });
        
        // Dependency risk rules
        this.monitoringRules.set('dependency-risk', {
            name: 'Dependency Risk Monitoring',
            enabled: true,
            threshold: this.riskThresholds.dependency,
            checkInterval: 900000, // 15 minutes
            lastChecked: null,
            conditions: [
                'blockingDependenciesNotCompleted',
                'dependencyDeadlineAtRisk',
                'circularDependenciesDetected'
            ]
        });
    }

    /**
     * Start monitoring system
     */
    startMonitoring() {
        setInterval(() => {
            this.performRiskAssessment();
        }, this.monitoringInterval);
    }

    /**
     * Perform comprehensive risk assessment
     */
    async performRiskAssessment() {
        const timestamp = new Date();
        
        try {
            // Get all active tasks
            const activeTasks = await this.getActiveTasks();
            
            for (const task of activeTasks) {
                // Assess risks for each task
                const taskRisks = await this.assessTaskRisks(task);
                
                // Store risk data
                this.risks.set(task.id, {
                    taskId: task.id,
                    timestamp: timestamp,
                    risks: taskRisks,
                    overallRisk: this.calculateOverallRisk(taskRisks)
                });
                
                // Check for alerts
                await this.checkRiskAlerts(task.id, taskRisks);
            }
            
            // Update risk history
            this.updateRiskHistory();
            
        } catch (error) {
            console.error('Error in risk assessment:', error);
        }
    }

    /**
     * Assess risks for a specific task
     */
    async assessTaskRisks(task) {
        const risks = {};
        
        // Get task and developer data
        const developer = await this.getDeveloper(task.assignedTo);
        const project = await this.getProject(task.project);
        
        // Deadline risk
        risks.deadline = await this.assessDeadlineRisk(task, developer);
        
        // Complexity risk
        risks.complexity = await this.assessComplexityRisk(task, developer);
        
        // Resource risk
        risks.resource = await this.assessResourceRisk(task, developer);
        
        // Dependency risk
        risks.dependency = await this.assessDependencyRisk(task, project);
        
        // External risk
        risks.external = await this.assessExternalRisk(task, project);
        
        return risks;
    }

    /**
     * Assess deadline risk
     */
    async assessDeadlineRisk(task, developer) {
        if (!task.deadline) {
            return { level: 'low', score: 0, factors: [] };
        }
        
        const now = new Date();
        const deadline = new Date(task.deadline);
        const timeRemaining = (deadline - now) / (1000 * 60 * 60 * 24); // days
        
        // Get predicted completion time
        const predictedHours = task.predictedHours || task.estimatedHours || 8;
        const dailyCapacity = developer.capacity || 8;
        const estimatedDays = predictedHours / dailyCapacity;
        
        const riskRatio = estimatedDays / timeRemaining;
        let level = 'low';
        let score = 0;
        const factors = [];
        
        if (riskRatio > 1.5) {
            level = 'critical';
            score = 0.9;
            factors.push('insufficient_time');
        } else if (riskRatio > 1.2) {
            level = 'high';
            score = 0.7;
            factors.push('tight_schedule');
        } else if (riskRatio > 0.8) {
            level = 'medium';
            score = 0.5;
            factors.push('moderate_risk');
        }
        
        // Check if deadline is very close
        if (timeRemaining < 1) {
            level = 'critical';
            score = 1.0;
            factors.push('urgent_deadline');
        }
        
        // Check progress rate
        const progressRate = this.calculateProgressRate(task);
        if (progressRate < 0.5 && timeRemaining < 3) {
            level = 'high';
            score = Math.max(score, 0.8);
            factors.push('slow_progress');
        }
        
        return {
            level,
            score,
            factors,
            timeRemaining,
            estimatedDays,
            riskRatio,
            progressRate
        };
    }

    /**
     * Assess complexity risk
     */
    async assessComplexityRisk(task, developer) {
        const complexity = this.normalizeComplexity(task.complexity);
        const skillMatch = this.calculateSkillMatch(task.requiredSkills || [], developer.skills || []);
        
        let level = 'low';
        let score = 0;
        const factors = [];
        
        // High complexity with low skill match
        if (complexity > 0.8 && skillMatch < 0.5) {
            level = 'critical';
            score = 0.9;
            factors.push('high_complexity_low_skills');
        } else if (complexity > 0.6 && skillMatch < 0.7) {
            level = 'high';
            score = 0.7;
            factors.push('moderate_complexity_low_skills');
        } else if (complexity > 0.8) {
            level = 'medium';
            score = 0.5;
            factors.push('high_complexity');
        }
        
        // Many dependencies
        if (task.dependencies && task.dependencies.length > 5) {
            level = 'high';
            score = Math.max(score, 0.6);
            factors.push('many_dependencies');
        }
        
        // New technology required
        const newTechRequired = this.checkNewTechnologyRequired(task, developer);
        if (newTechRequired) {
            level = 'medium';
            score = Math.max(score, 0.4);
            factors.push('new_technology');
        }
        
        return {
            level,
            score,
            factors,
            complexity,
            skillMatch,
            dependenciesCount: task.dependencies?.length || 0,
            newTechnologyRequired: newTechRequired
        };
    }

    /**
     * Assess resource risk
     */
    async assessResourceRisk(task, developer) {
        const currentWorkload = developer.currentWorkload || 0;
        const capacity = developer.capacity || 40;
        const utilization = currentWorkload / capacity;
        const availability = developer.availability || 1.0;
        
        let level = 'low';
        let score = 0;
        const factors = [];
        
        // High workload
        if (utilization > 0.9) {
            level = 'critical';
            score = 0.9;
            factors.push('overloaded');
        } else if (utilization > 0.7) {
            level = 'high';
            score = 0.6;
            factors.push('high_workload');
        }
        
        // Low availability
        if (availability < 0.3) {
            level = 'critical';
            score = 1.0;
            factors.push('very_low_availability');
        } else if (availability < 0.5) {
            level = 'high';
            score = Math.max(score, 0.7);
            factors.push('low_availability');
        }
        
        // Team capacity
        const teamCapacity = await this.getTeamCapacity(task.project);
        if (teamCapacity < 0.5) {
            level = 'medium';
            score = Math.max(score, 0.5);
            factors.push('limited_team_capacity');
        }
        
        return {
            level,
            score,
            factors,
            utilization,
            availability,
            teamCapacity
        };
    }

    /**
     * Assess dependency risk
     */
    async assessDependencyRisk(task, project) {
        const dependencies = task.dependencies || [];
        if (dependencies.length === 0) {
            return { level: 'low', score: 0, factors: [] };
        }
        
        let level = 'low';
        let score = 0;
        const factors = [];
        
        // Check dependency status
        const dependencyStatus = await this.checkDependencyStatus(dependencies);
        const blockedDependencies = dependencyStatus.filter(dep => dep.status === 'blocked').length;
        const atRiskDependencies = dependencyStatus.filter(dep => dep.riskLevel === 'high').length;
        
        if (blockedDependencies > 0) {
            level = 'critical';
            score = 0.9;
            factors.push('blocked_dependencies');
        } else if (atRiskDependencies > 0) {
            level = 'high';
            score = 0.7;
            factors.push('at_risk_dependencies');
        }
        
        // Check circular dependencies
        const circularDeps = this.detectCircularDependencies(dependencies);
        if (circularDeps.length > 0) {
            level = 'critical';
            score = 1.0;
            factors.push('circular_dependencies');
        }
        
        return {
            level,
            score,
            factors,
            totalDependencies: dependencies.length,
            blockedDependencies,
            atRiskDependencies,
            circularDependencies: circularDeps.length
        };
    }

    /**
     * Assess external risk
     */
    async assessExternalRisk(task, project) {
        let level = 'low';
        let score = 0;
        const factors = [];
        
        // External dependencies
        const externalDeps = task.externalDependencies || [];
        if (externalDeps.length > 0) {
            const externalStatus = await this.checkExternalDependencies(externalDeps);
            const blockedExternal = externalStatus.filter(dep => dep.status === 'blocked').length;
            
            if (blockedExternal > 0) {
                level = 'high';
                score = 0.8;
                factors.push('blocked_external_dependencies');
            }
        }
        
        // Project context
        if (project && project.riskLevel === 'high') {
            level = 'medium';
            score = Math.max(score, 0.5);
            factors.push('high_risk_project');
        }
        
        // Market conditions
        const marketRisk = await this.assessMarketRisk();
        if (marketRisk > 0.7) {
            level = 'medium';
            score = Math.max(score, 0.4);
            factors.push('market_volatility');
        }
        
        return {
            level,
            score,
            factors,
            externalDependencies: externalDeps.length,
            projectRiskLevel: project?.riskLevel || 'low',
            marketRisk
        };
    }

    /**
     * Check for risk alerts
     */
    async checkRiskAlerts(taskId, risks) {
        const overallRisk = this.calculateOverallRisk(risks);
        
        // Check if risk level requires alert
        if (overallRisk.level === 'critical' || overallRisk.level === 'high') {
            await this.triggerRiskAlert(taskId, overallRisk, risks);
        }
        
        // Check individual risk types
        for (const [riskType, riskData] of Object.entries(risks)) {
            if (riskData.level === 'critical' || riskData.level === 'high') {
                await this.triggerSpecificRiskAlert(taskId, riskType, riskData);
            }
        }
    }

    /**
     * Trigger risk alert
     */
    async triggerRiskAlert(taskId, overallRisk, risks) {
        const alertId = `risk_alert_${taskId}_${Date.now()}`;
        const now = new Date();
        
        // Check cooldown
        const lastAlert = this.getLastAlert(taskId, 'overall');
        if (lastAlert && (now - lastAlert.timestamp) < this.alertCooldown) {
            return; // Still in cooldown
        }
        
        const alert = {
            id: alertId,
            taskId: taskId,
            type: 'overall_risk',
            level: overallRisk.level,
            score: overallRisk.score,
            timestamp: now,
            risks: risks,
            message: this.generateRiskMessage(overallRisk, risks),
            recommendations: this.generateRiskRecommendations(risks)
        };
        
        this.alerts.set(alertId, alert);
        
        // Send alert notification
        await this.sendRiskAlert(alert);
        
        console.log(`Risk alert triggered for task ${taskId}: ${overallRisk.level} risk`);
    }

    /**
     * Trigger specific risk alert
     */
    async triggerSpecificRiskAlert(taskId, riskType, riskData) {
        const alertId = `risk_alert_${taskId}_${riskType}_${Date.now()}`;
        const now = new Date();
        
        // Check cooldown
        const lastAlert = this.getLastAlert(taskId, riskType);
        if (lastAlert && (now - lastAlert.timestamp) < this.alertCooldown) {
            return;
        }
        
        const alert = {
            id: alertId,
            taskId: taskId,
            type: riskType,
            level: riskData.level,
            score: riskData.score,
            timestamp: now,
            factors: riskData.factors,
            message: this.generateSpecificRiskMessage(riskType, riskData),
            recommendations: this.generateSpecificRiskRecommendations(riskType, riskData)
        };
        
        this.alerts.set(alertId, alert);
        
        // Send alert notification
        await this.sendRiskAlert(alert);
        
        console.log(`${riskType} alert triggered for task ${taskId}: ${riskData.level} risk`);
    }

    /**
     * Generate risk message
     */
    generateRiskMessage(overallRisk, risks) {
        const criticalRisks = Object.entries(risks).filter(([_, risk]) => risk.level === 'critical');
        const highRisks = Object.entries(risks).filter(([_, risk]) => risk.level === 'high');
        
        let message = `Task has ${overallRisk.level} risk level (score: ${overallRisk.score.toFixed(2)})`;
        
        if (criticalRisks.length > 0) {
            message += `. Critical risks: ${criticalRisks.map(([type, _]) => type).join(', ')}`;
        }
        
        if (highRisks.length > 0) {
            message += `. High risks: ${highRisks.map(([type, _]) => type).join(', ')}`;
        }
        
        return message;
    }

    /**
     * Generate risk recommendations
     */
    generateRiskRecommendations(risks) {
        const recommendations = [];
        
        for (const [riskType, riskData] of Object.entries(risks)) {
            if (riskData.level === 'critical' || riskData.level === 'high') {
                recommendations.push(...this.generateSpecificRiskRecommendations(riskType, riskData));
            }
        }
        
        return recommendations;
    }

    /**
     * Generate specific risk recommendations
     */
    generateSpecificRiskRecommendations(riskType, riskData) {
        const recommendations = [];
        
        switch (riskType) {
            case 'deadline':
                recommendations.push({
                    action: 'Request deadline extension or additional resources',
                    priority: 'high',
                    impact: 'Ensure successful completion'
                });
                break;
                
            case 'complexity':
                recommendations.push({
                    action: 'Break down task into smaller, manageable parts',
                    priority: 'high',
                    impact: 'Reduce complexity and risk'
                });
                recommendations.push({
                    action: 'Provide additional training or pair programming',
                    priority: 'medium',
                    impact: 'Improve skill match'
                });
                break;
                
            case 'resource':
                recommendations.push({
                    action: 'Redistribute workload or add team members',
                    priority: 'high',
                    impact: 'Ensure adequate resources'
                });
                break;
                
            case 'dependency':
                recommendations.push({
                    action: 'Resolve blocking dependencies immediately',
                    priority: 'critical',
                    impact: 'Unblock task progress'
                });
                break;
        }
        
        return recommendations;
    }

    /**
     * Get risk dashboard data
     */
    getRiskDashboard() {
        const now = new Date();
        const recentRisks = Array.from(this.risks.values())
            .filter(risk => (now - risk.timestamp) < 24 * 60 * 60 * 1000); // Last 24 hours
        
        const riskDistribution = this.calculateRiskDistribution(recentRisks);
        const criticalTasks = recentRisks.filter(risk => risk.overallRisk.level === 'critical');
        const highRiskTasks = recentRisks.filter(risk => risk.overallRisk.level === 'high');
        
        return {
            totalTasks: recentRisks.length,
            criticalTasks: criticalTasks.length,
            highRiskTasks: highRiskTasks.length,
            riskDistribution,
            recentAlerts: this.getRecentAlerts(10),
            trends: this.analyzeRiskTrends(),
            recommendations: this.generateOverallRecommendations(recentRisks)
        };
    }

    /**
     * Calculate risk distribution
     */
    calculateRiskDistribution(risks) {
        const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
        
        for (const risk of risks) {
            distribution[risk.overallRisk.level]++;
        }
        
        return distribution;
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
     * Analyze risk trends
     */
    analyzeRiskTrends() {
        const now = new Date();
        const last24h = now.getTime() - 24 * 60 * 60 * 1000;
        const last7d = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        
        const recent24h = this.riskHistory.filter(entry => entry.timestamp > last24h);
        const recent7d = this.riskHistory.filter(entry => entry.timestamp > last7d);
        
        return {
            last24h: this.calculateRiskTrend(recent24h),
            last7d: this.calculateRiskTrend(recent7d),
            overall: this.calculateRiskTrend(this.riskHistory)
        };
    }

    /**
     * Calculate risk trend
     */
    calculateRiskTrend(entries) {
        if (entries.length < 2) return 'stable';
        
        const first = entries[0];
        const last = entries[entries.length - 1];
        
        const criticalChange = last.critical - first.critical;
        const highChange = last.high - first.high;
        
        if (criticalChange > 0 || highChange > 2) return 'increasing';
        if (criticalChange < 0 && highChange < -1) return 'decreasing';
        return 'stable';
    }

    // Helper methods
    calculateOverallRisk(risks) {
        const riskScores = Object.values(risks).map(risk => risk.score);
        const averageScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
        
        let level = 'low';
        if (averageScore > 0.8) level = 'critical';
        else if (averageScore > 0.6) level = 'high';
        else if (averageScore > 0.3) level = 'medium';
        
        return { level, score: averageScore };
    }

    calculateProgressRate(task) {
        // This would calculate actual progress rate
        // For now, return a simulated value
        return task.progress || 0.3;
    }

    normalizeComplexity(complexity) {
        const complexityMap = { 'low': 0.2, 'medium': 0.5, 'high': 0.8, 'very-high': 1.0 };
        return complexityMap[complexity] || 0.5;
    }

    calculateSkillMatch(requiredSkills, developerSkills) {
        if (requiredSkills.length === 0) return 1.0;
        
        const matchedSkills = requiredSkills.filter(skill => 
            developerSkills.some(devSkill => 
                devSkill.name === skill || devSkill.name === skill.name
            )
        );
        
        return matchedSkills.length / requiredSkills.length;
    }

    // Placeholder methods for external integrations
    async getActiveTasks() {
        // This would integrate with the task management system
        return [];
    }

    async getDeveloper(developerId) {
        // This would get developer data from the system
        return { id: developerId, capacity: 40, availability: 1.0 };
    }

    async getProject(projectId) {
        // This would get project data from the system
        return { id: projectId, riskLevel: 'low' };
    }

    async sendRiskAlert(alert) {
        // This would send the alert via notification system
        console.log(`Risk alert: ${alert.message}`);
    }

    getLastAlert(taskId, type) {
        const alerts = Array.from(this.alerts.values())
            .filter(alert => alert.taskId === taskId && alert.type === type)
            .sort((a, b) => b.timestamp - a.timestamp);
        
        return alerts.length > 0 ? alerts[0] : null;
    }

    updateRiskHistory() {
        const now = new Date();
        const riskCounts = this.calculateRiskDistribution(Array.from(this.risks.values()));
        
        this.riskHistory.push({
            timestamp: now,
            ...riskCounts
        });
        
        // Keep only last 30 days
        const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        this.riskHistory = this.riskHistory.filter(entry => entry.timestamp.getTime() > cutoff);
    }

    generateOverallRecommendations(risks) {
        const recommendations = [];
        
        const criticalCount = risks.filter(risk => risk.overallRisk.level === 'critical').length;
        if (criticalCount > 0) {
            recommendations.push({
                type: 'urgent_action',
                message: `${criticalCount} tasks have critical risk levels`,
                action: 'Immediate intervention required'
            });
        }
        
        const highCount = risks.filter(risk => risk.overallRisk.level === 'high').length;
        if (highCount > 3) {
            recommendations.push({
                type: 'resource_review',
                message: `${highCount} tasks have high risk levels`,
                action: 'Review resource allocation and priorities'
            });
        }
        
        return recommendations;
    }
}

module.exports = RiskMonitoringSystem;
