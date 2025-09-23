/**
 * Impact Analyzer
 * Analyzes the impact of changes on task dependencies
 */

class ImpactAnalyzer {
    constructor(options = {}) {
        this.enabled = options.impactAnalysis || true;
        this.impactThresholds = {
            low: 0.1,
            medium: 0.3,
            high: 0.5,
            critical: 0.8
        };
        this.impactHistory = new Map();
        this.isRunning = true;
    }

    /**
     * Analyze impact of a change
     */
    async analyzeImpact(taskId, changeType, options = {}) {
        try {
            const { projectId, dependenciesToRemove = [], changes = {} } = options;
            
            const impact = {
                taskId,
                changeType,
                projectId,
                timestamp: new Date(),
                affectedTasks: [],
                impactLevel: 'low',
                estimatedDelay: 0,
                riskFactors: [],
                recommendations: [],
                mitigationStrategies: []
            };
            
            // Analyze based on change type
            switch (changeType) {
                case 'dependency_update':
                    await this.analyzeDependencyUpdateImpact(impact, changes);
                    break;
                case 'dependency_removal':
                    await this.analyzeDependencyRemovalImpact(impact, dependenciesToRemove);
                    break;
                case 'task_completion':
                    await this.analyzeTaskCompletionImpact(impact);
                    break;
                case 'task_delay':
                    await this.analyzeTaskDelayImpact(impact, changes);
                    break;
                case 'task_cancellation':
                    await this.analyzeTaskCancellationImpact(impact);
                    break;
                case 'analysis':
                    await this.analyzeGeneralImpact(impact, options);
                    break;
                default:
                    await this.analyzeGeneralImpact(impact, options);
            }
            
            // Calculate overall impact level
            impact.impactLevel = this.calculateImpactLevel(impact);
            
            // Generate recommendations
            impact.recommendations = this.generateImpactRecommendations(impact);
            
            // Generate mitigation strategies
            impact.mitigationStrategies = this.generateMitigationStrategies(impact);
            
            // Store impact analysis
            this.impactHistory.set(`${taskId}_${changeType}_${Date.now()}`, impact);
            
            return impact;
        } catch (error) {
            console.error('Error analyzing impact:', error);
            throw error;
        }
    }

    /**
     * Analyze dependency update impact
     */
    async analyzeDependencyUpdateImpact(impact, changes) {
        const { added = [], removed = [], modified = [] } = changes;
        
        // Analyze added dependencies
        for (const dep of added) {
            const depImpact = await this.analyzeDependencyImpact(impact.taskId, dep.taskId, 'add');
            impact.affectedTasks.push(...depImpact.affectedTasks);
            impact.estimatedDelay += depImpact.estimatedDelay;
            impact.riskFactors.push(...depImpact.riskFactors);
        }
        
        // Analyze removed dependencies
        for (const dep of removed) {
            const depImpact = await this.analyzeDependencyImpact(impact.taskId, dep.taskId, 'remove');
            impact.affectedTasks.push(...depImpact.affectedTasks);
            impact.estimatedDelay += depImpact.estimatedDelay;
            impact.riskFactors.push(...depImpact.riskFactors);
        }
        
        // Analyze modified dependencies
        for (const dep of modified) {
            const depImpact = await this.analyzeDependencyImpact(impact.taskId, dep.taskId, 'modify');
            impact.affectedTasks.push(...depImpact.affectedTasks);
            impact.estimatedDelay += depImpact.estimatedDelay;
            impact.riskFactors.push(...depImpact.riskFactors);
        }
        
        // Remove duplicates from affected tasks
        impact.affectedTasks = [...new Set(impact.affectedTasks)];
    }

    /**
     * Analyze dependency removal impact
     */
    async analyzeDependencyRemovalImpact(impact, dependenciesToRemove) {
        for (const dep of dependenciesToRemove) {
            const depImpact = await this.analyzeDependencyImpact(impact.taskId, dep.taskId, 'remove');
            impact.affectedTasks.push(...depImpact.affectedTasks);
            impact.estimatedDelay += depImpact.estimatedDelay;
            impact.riskFactors.push(...depImpact.riskFactors);
        }
        
        // Remove duplicates
        impact.affectedTasks = [...new Set(impact.affectedTasks)];
    }

    /**
     * Analyze task completion impact
     */
    async analyzeTaskCompletionImpact(impact) {
        // Find tasks that depend on this task
        const dependentTasks = this.getDependentTasks(impact.taskId);
        
        for (const depTaskId of dependentTasks) {
            const depImpact = await this.analyzeDependencyImpact(impact.taskId, depTaskId, 'complete');
            impact.affectedTasks.push(...depImpact.affectedTasks);
            impact.estimatedDelay += depImpact.estimatedDelay;
            impact.riskFactors.push(...depImpact.riskFactors);
        }
        
        // Remove duplicates
        impact.affectedTasks = [...new Set(impact.affectedTasks)];
    }

    /**
     * Analyze task delay impact
     */
    async analyzeTaskDelayImpact(impact, changes) {
        const { delayHours = 0, delayDays = 0 } = changes;
        const totalDelay = delayHours + (delayDays * 8); // Convert days to hours
        
        // Find all dependent tasks
        const dependentTasks = this.getDependentTasks(impact.taskId);
        
        for (const depTaskId of dependentTasks) {
            const depImpact = await this.analyzeDependencyImpact(impact.taskId, depTaskId, 'delay', { delay: totalDelay });
            impact.affectedTasks.push(...depImpact.affectedTasks);
            impact.estimatedDelay += depImpact.estimatedDelay;
            impact.riskFactors.push(...depImpact.riskFactors);
        }
        
        // Remove duplicates
        impact.affectedTasks = [...new Set(impact.affectedTasks)];
    }

    /**
     * Analyze task cancellation impact
     */
    async analyzeTaskCancellationImpact(impact) {
        // Find all dependent tasks
        const dependentTasks = this.getDependentTasks(impact.taskId);
        
        for (const depTaskId of dependentTasks) {
            const depImpact = await this.analyzeDependencyImpact(impact.taskId, depTaskId, 'cancel');
            impact.affectedTasks.push(...depImpact.affectedTasks);
            impact.estimatedDelay += depImpact.estimatedDelay;
            impact.riskFactors.push(...depImpact.riskFactors);
        }
        
        // Add high-risk factor for cancellation
        impact.riskFactors.push({
            type: 'task_cancellation',
            severity: 'high',
            description: 'Task cancellation may cause significant delays',
            affectedTasks: dependentTasks.length
        });
        
        // Remove duplicates
        impact.affectedTasks = [...new Set(impact.affectedTasks)];
    }

    /**
     * Analyze general impact
     */
    async analyzeGeneralImpact(impact, options = {}) {
        const { projectId } = options;
        
        // Get all tasks in project
        const projectTasks = this.getProjectTasks(projectId);
        
        // Analyze impact on each task
        for (const taskId of projectTasks) {
            if (taskId !== impact.taskId) {
                const depImpact = await this.analyzeDependencyImpact(impact.taskId, taskId, 'general');
                impact.affectedTasks.push(...depImpact.affectedTasks);
                impact.estimatedDelay += depImpact.estimatedDelay;
                impact.riskFactors.push(...depImpact.riskFactors);
            }
        }
        
        // Remove duplicates
        impact.affectedTasks = [...new Set(impact.affectedTasks)];
    }

    /**
     * Analyze impact of a specific dependency
     */
    async analyzeDependencyImpact(sourceTaskId, targetTaskId, changeType, options = {}) {
        const impact = {
            affectedTasks: [],
            estimatedDelay: 0,
            riskFactors: []
        };
        
        // Check if there's a dependency relationship
        const hasDependency = this.hasDependency(sourceTaskId, targetTaskId);
        const isDependent = this.isDependent(sourceTaskId, targetTaskId);
        
        if (hasDependency || isDependent) {
            // Calculate impact based on change type
            switch (changeType) {
                case 'add':
                    impact.estimatedDelay += this.calculateDependencyDelay(targetTaskId);
                    impact.riskFactors.push({
                        type: 'new_dependency',
                        severity: 'medium',
                        description: `New dependency on ${targetTaskId} may cause delays`
                    });
                    break;
                case 'remove':
                    impact.estimatedDelay -= this.calculateDependencyDelay(targetTaskId);
                    impact.riskFactors.push({
                        type: 'removed_dependency',
                        severity: 'low',
                        description: `Removed dependency on ${targetTaskId} may improve timeline`
                    });
                    break;
                case 'modify':
                    impact.estimatedDelay += this.calculateDependencyDelay(targetTaskId) * 0.5;
                    impact.riskFactors.push({
                        type: 'modified_dependency',
                        severity: 'low',
                        description: `Modified dependency on ${targetTaskId} may cause minor delays`
                    });
                    break;
                case 'complete':
                    impact.estimatedDelay -= this.calculateDependencyDelay(targetTaskId);
                    impact.riskFactors.push({
                        type: 'dependency_completed',
                        severity: 'low',
                        description: `Completed dependency ${sourceTaskId} may improve timeline`
                    });
                    break;
                case 'delay':
                    const delay = options.delay || 0;
                    impact.estimatedDelay += delay;
                    impact.riskFactors.push({
                        type: 'dependency_delayed',
                        severity: 'high',
                        description: `Delayed dependency ${sourceTaskId} will cause ${delay} hours delay`
                    });
                    break;
                case 'cancel':
                    impact.estimatedDelay += this.calculateDependencyDelay(targetTaskId) * 2;
                    impact.riskFactors.push({
                        type: 'dependency_cancelled',
                        severity: 'critical',
                        description: `Cancelled dependency ${sourceTaskId} will cause significant delays`
                    });
                    break;
            }
            
            impact.affectedTasks.push(targetTaskId);
        }
        
        return impact;
    }

    /**
     * Calculate impact level
     */
    calculateImpactLevel(impact) {
        const { estimatedDelay, affectedTasks, riskFactors } = impact;
        
        let impactScore = 0;
        
        // Delay impact (0-0.4)
        if (estimatedDelay > 0) {
            impactScore += Math.min(0.4, estimatedDelay / 40); // 40 hours = max delay impact
        }
        
        // Affected tasks impact (0-0.3)
        impactScore += Math.min(0.3, affectedTasks.length / 10); // 10 tasks = max affected impact
        
        // Risk factors impact (0-0.3)
        const highRiskCount = riskFactors.filter(rf => rf.severity === 'high' || rf.severity === 'critical').length;
        impactScore += Math.min(0.3, highRiskCount / 5); // 5 high risks = max risk impact
        
        // Determine impact level
        if (impactScore >= this.impactThresholds.critical) {
            return 'critical';
        } else if (impactScore >= this.impactThresholds.high) {
            return 'high';
        } else if (impactScore >= this.impactThresholds.medium) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Generate impact recommendations
     */
    generateImpactRecommendations(impact) {
        const recommendations = [];
        const { impactLevel, affectedTasks, estimatedDelay, riskFactors } = impact;
        
        // High impact recommendations
        if (impactLevel === 'critical' || impactLevel === 'high') {
            recommendations.push({
                type: 'immediate_action',
                priority: 'high',
                message: 'High impact change detected',
                action: 'Review and approve change before implementation',
                impact: 'Prevents project delays and resource conflicts'
            });
        }
        
        // Delay recommendations
        if (estimatedDelay > 8) { // More than 1 day delay
            recommendations.push({
                type: 'timeline_adjustment',
                priority: 'medium',
                message: `Estimated delay of ${estimatedDelay} hours`,
                action: 'Adjust project timeline and communicate to stakeholders',
                impact: 'Maintains project transparency and expectations'
            });
        }
        
        // Affected tasks recommendations
        if (affectedTasks.length > 5) {
            recommendations.push({
                type: 'stakeholder_notification',
                priority: 'medium',
                message: `${affectedTasks.length} tasks will be affected`,
                action: 'Notify all affected team members and stakeholders',
                impact: 'Ensures proper coordination and resource allocation'
            });
        }
        
        // Risk factor recommendations
        const criticalRisks = riskFactors.filter(rf => rf.severity === 'critical');
        if (criticalRisks.length > 0) {
            recommendations.push({
                type: 'risk_mitigation',
                priority: 'high',
                message: `${criticalRisks.length} critical risks identified`,
                action: 'Develop and implement risk mitigation strategies',
                impact: 'Reduces project risk and improves success probability'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate mitigation strategies
     */
    generateMitigationStrategies(impact) {
        const strategies = [];
        const { impactLevel, estimatedDelay, affectedTasks, riskFactors } = impact;
        
        // Timeline mitigation
        if (estimatedDelay > 0) {
            strategies.push({
                type: 'timeline_mitigation',
                description: 'Add buffer time to project timeline',
                implementation: 'Extend project deadline by estimated delay',
                effectiveness: 'high',
                cost: 'low'
            });
            
            strategies.push({
                type: 'resource_mitigation',
                description: 'Allocate additional resources to affected tasks',
                implementation: 'Assign more team members to critical path tasks',
                effectiveness: 'medium',
                cost: 'high'
            });
        }
        
        // Risk mitigation
        const highRisks = riskFactors.filter(rf => rf.severity === 'high' || rf.severity === 'critical');
        if (highRisks.length > 0) {
            strategies.push({
                type: 'risk_mitigation',
                description: 'Implement risk monitoring and early warning systems',
                implementation: 'Set up automated alerts for high-risk tasks',
                effectiveness: 'high',
                cost: 'medium'
            });
        }
        
        // Communication mitigation
        if (affectedTasks.length > 3) {
            strategies.push({
                type: 'communication_mitigation',
                description: 'Establish clear communication channels for affected tasks',
                implementation: 'Create dedicated communication channels and regular check-ins',
                effectiveness: 'medium',
                cost: 'low'
            });
        }
        
        return strategies;
    }

    /**
     * Get dependent tasks
     */
    getDependentTasks(taskId) {
        // This would typically query a dependency engine
        // For now, simulate some dependent tasks
        const mockDependents = {
            'task_1': ['task_2', 'task_3'],
            'task_2': ['task_4'],
            'task_3': ['task_4'],
            'task_4': ['task_5'],
            'task_5': []
        };
        
        return mockDependents[taskId] || [];
    }

    /**
     * Check if task has dependency
     */
    hasDependency(taskId, dependencyTaskId) {
        // This would typically query a dependency engine
        // For now, simulate some dependencies
        const mockDependencies = {
            'task_1': ['task_2', 'task_3'],
            'task_2': ['task_4'],
            'task_3': ['task_4'],
            'task_4': ['task_5'],
            'task_5': []
        };
        
        return (mockDependencies[taskId] || []).includes(dependencyTaskId);
    }

    /**
     * Check if task is dependent on another
     */
    isDependent(taskId, dependencyTaskId) {
        return this.hasDependency(dependencyTaskId, taskId);
    }

    /**
     * Calculate dependency delay
     */
    calculateDependencyDelay(taskId) {
        // This would typically calculate based on task complexity and dependencies
        // For now, simulate some delays
        const mockDelays = {
            'task_1': 8,
            'task_2': 4,
            'task_3': 6,
            'task_4': 12,
            'task_5': 2
        };
        
        return mockDelays[taskId] || 4; // Default 4 hours
    }

    /**
     * Get project tasks
     */
    getProjectTasks(projectId) {
        // This would typically query a task management system
        // For now, return mock tasks
        return ['task_1', 'task_2', 'task_3', 'task_4', 'task_5'];
    }

    /**
     * Get impact history
     */
    getImpactHistory(taskId = null, changeType = null) {
        let history = Array.from(this.impactHistory.values());
        
        if (taskId) {
            history = history.filter(impact => impact.taskId === taskId);
        }
        
        if (changeType) {
            history = history.filter(impact => impact.changeType === changeType);
        }
        
        return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Get impact statistics
     */
    getImpactStatistics() {
        const history = Array.from(this.impactHistory.values());
        
        const totalImpacts = history.length;
        const impactLevels = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        };
        
        let totalDelay = 0;
        let totalAffectedTasks = 0;
        
        for (const impact of history) {
            impactLevels[impact.impactLevel]++;
            totalDelay += impact.estimatedDelay;
            totalAffectedTasks += impact.affectedTasks.length;
        }
        
        return {
            totalImpacts,
            impactLevels,
            averageDelay: totalImpacts > 0 ? totalDelay / totalImpacts : 0,
            averageAffectedTasks: totalImpacts > 0 ? totalAffectedTasks / totalImpacts : 0,
            criticalImpacts: impactLevels.critical,
            highImpacts: impactLevels.high
        };
    }

    /**
     * Clear old impact history
     */
    clearOldImpactHistory(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        const cutoffTime = Date.now() - maxAge;
        
        for (const [key, impact] of this.impactHistory) {
            if (impact.timestamp.getTime() < cutoffTime) {
                this.impactHistory.delete(key);
            }
        }
    }

    /**
     * Stop the impact analyzer
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = ImpactAnalyzer;
