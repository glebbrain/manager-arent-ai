/**
 * Integrated Sprint Planning System
 * Orchestrates AI-powered sprint planning with optimization and analytics
 */

const SprintPlanningEngine = require('./sprint-planning-engine');
const AIOptimizer = require('./ai-optimizer');
const VelocityCalculator = require('./velocity-calculator');
const CapacityPlanner = require('./capacity-planner');

class IntegratedSprintPlanningSystem {
    constructor(options = {}) {
        this.planningEngine = new SprintPlanningEngine(options.planning);
        this.aiOptimizer = new AIOptimizer(options.ai);
        this.velocityCalculator = new VelocityCalculator(options.planning);
        this.capacityPlanner = new CapacityPlanner(options.planning);
        
        this.isRunning = true;
        this.lastUpdate = new Date();
        this.sprints = new Map();
        this.templates = new Map();
        this.analytics = new Map();
        
        this.config = {
            autoPlanning: options.autoPlanning || false,
            aiEnabled: options.aiEnabled || false,
            optimizationEnabled: options.optimizationEnabled || false,
            ...options
        };
        
        this.initializeTemplates();
        this.startBackgroundProcesses();
    }

    /**
     * Plan a new sprint
     */
    async planSprint(params) {
        try {
            const {
                projectId,
                teamId,
                sprintNumber,
                startDate,
                endDate,
                goals,
                constraints = {},
                options = {}
            } = params;
            
            // Calculate team capacity
            const capacity = await this.capacityPlanner.calculateCapacity(teamId, startDate, endDate);
            
            // Get team velocity
            const velocity = await this.velocityCalculator.calculateVelocity(teamId, projectId);
            
            // Get available tasks
            const availableTasks = await this.getAvailableTasks(projectId, teamId);
            
            // Plan sprint using AI if enabled
            let sprintPlan;
            if (this.config.aiEnabled) {
                sprintPlan = await this.aiOptimizer.planSprint({
                    projectId,
                    teamId,
                    sprintNumber,
                    startDate,
                    endDate,
                    goals,
                    constraints,
                    capacity,
                    velocity,
                    availableTasks,
                    options
                });
            } else {
                sprintPlan = await this.planningEngine.planSprint({
                    projectId,
                    teamId,
                    sprintNumber,
                    startDate,
                    endDate,
                    goals,
                    constraints,
                    capacity,
                    velocity,
                    availableTasks,
                    options
                });
            }
            
            // Store sprint plan
            this.sprints.set(sprintPlan.id, sprintPlan);
            
            // Update analytics
            this.updateAnalytics('sprint_planned', sprintPlan);
            
            return sprintPlan;
        } catch (error) {
            console.error('Error planning sprint:', error);
            throw error;
        }
    }

    /**
     * Optimize an existing sprint plan
     */
    async optimizeSprint(sprintPlanId, optimizationType = 'comprehensive') {
        try {
            const sprintPlan = this.sprints.get(sprintPlanId);
            if (!sprintPlan) {
                throw new Error('Sprint plan not found');
            }
            
            let optimizedPlan;
            
            if (this.config.optimizationEnabled) {
                optimizedPlan = await this.aiOptimizer.optimizeSprint(sprintPlan, optimizationType);
            } else {
                optimizedPlan = await this.planningEngine.optimizeSprint(sprintPlan, optimizationType);
            }
            
            // Update stored sprint plan
            this.sprints.set(sprintPlanId, optimizedPlan);
            
            // Update analytics
            this.updateAnalytics('sprint_optimized', optimizedPlan);
            
            return optimizedPlan;
        } catch (error) {
            console.error('Error optimizing sprint:', error);
            throw error;
        }
    }

    /**
     * Get sprints with filtering
     */
    getSprints(filters = {}) {
        let sprints = Array.from(this.sprints.values());
        
        if (filters.projectId) {
            sprints = sprints.filter(s => s.projectId === filters.projectId);
        }
        
        if (filters.teamId) {
            sprints = sprints.filter(s => s.teamId === filters.teamId);
        }
        
        if (filters.status) {
            sprints = sprints.filter(s => s.status === filters.status);
        }
        
        // Apply pagination
        const offset = filters.offset || 0;
        const limit = filters.limit || 50;
        
        return sprints
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(offset, offset + limit);
    }

    /**
     * Get specific sprint
     */
    getSprint(sprintId) {
        return this.sprints.get(sprintId);
    }

    /**
     * Update sprint
     */
    async updateSprint(sprintId, updates) {
        const sprint = this.sprints.get(sprintId);
        if (!sprint) {
            return null;
        }
        
        const updatedSprint = {
            ...sprint,
            ...updates,
            updatedAt: new Date()
        };
        
        this.sprints.set(sprintId, updatedSprint);
        this.updateAnalytics('sprint_updated', updatedSprint);
        
        return updatedSprint;
    }

    /**
     * Execute sprint
     */
    async executeSprint(sprintId) {
        try {
            const sprint = this.sprints.get(sprintId);
            if (!sprint) {
                throw new Error('Sprint not found');
            }
            
            // Update sprint status
            sprint.status = 'active';
            sprint.startedAt = new Date();
            
            // Start monitoring
            await this.startSprintMonitoring(sprint);
            
            this.sprints.set(sprintId, sprint);
            this.updateAnalytics('sprint_started', sprint);
            
            return {
                success: true,
                message: 'Sprint execution started',
                sprint: sprint
            };
        } catch (error) {
            console.error('Error executing sprint:', error);
            throw error;
        }
    }

    /**
     * Get analytics
     */
    getAnalytics() {
        const sprints = Array.from(this.sprints.values());
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const recentSprints = sprints.filter(s => 
            new Date(s.createdAt) >= last30Days
        );
        
        return {
            totalSprints: sprints.length,
            recentSprints: recentSprints.length,
            activeSprints: sprints.filter(s => s.status === 'active').length,
            completedSprints: sprints.filter(s => s.status === 'completed').length,
            plannedSprints: sprints.filter(s => s.status === 'planned').length,
            averageVelocity: this.calculateAverageVelocity(sprints),
            averageCapacity: this.calculateAverageCapacity(sprints),
            successRate: this.calculateSuccessRate(sprints),
            aiOptimization: {
                enabled: this.config.aiEnabled,
                optimizedSprints: sprints.filter(s => s.aiOptimized).length,
                averageImprovement: this.calculateAverageImprovement(sprints)
            },
            planningAccuracy: this.calculatePlanningAccuracy(sprints),
            teamPerformance: this.calculateTeamPerformance(sprints)
        };
    }

    /**
     * Get team velocity
     */
    async getVelocity(teamId, projectId, sprintCount = 5) {
        return await this.velocityCalculator.calculateVelocity(teamId, projectId, sprintCount);
    }

    /**
     * Get team capacity
     */
    async getTeamCapacity(teamId, startDate, endDate) {
        return await this.capacityPlanner.calculateCapacity(teamId, startDate, endDate);
    }

    /**
     * Simulate sprints
     */
    async simulateSprints(params) {
        try {
            const {
                projectId,
                teamId,
                sprintCount,
                simulationType,
                options
            } = params;
            
            const simulation = await this.aiOptimizer.simulateSprints({
                projectId,
                teamId,
                sprintCount,
                simulationType,
                options
            });
            
            this.updateAnalytics('simulation_run', simulation);
            
            return simulation;
        } catch (error) {
            console.error('Error simulating sprints:', error);
            throw error;
        }
    }

    /**
     * Get templates
     */
    getTemplates() {
        return Array.from(this.templates.values());
    }

    /**
     * Create template
     */
    createTemplate(template) {
        this.templates.set(template.id, template);
        return template;
    }

    /**
     * Get active sprints
     */
    getActiveSprints() {
        return Array.from(this.sprints.values()).filter(s => s.status === 'active');
    }

    /**
     * Get planned sprints
     */
    getPlannedSprints() {
        return Array.from(this.sprints.values()).filter(s => s.status === 'planned');
    }

    /**
     * Get available tasks for planning
     */
    async getAvailableTasks(projectId, teamId) {
        // This would typically query a task management system
        // For now, return mock data
        return [
            {
                id: 'task_1',
                title: 'Implement user authentication',
                description: 'Add JWT-based authentication system',
                storyPoints: 8,
                priority: 'high',
                complexity: 'medium',
                estimatedHours: 16,
                skills: ['JavaScript', 'Node.js', 'JWT'],
                dependencies: [],
                assignee: null
            },
            {
                id: 'task_2',
                title: 'Create API endpoints',
                description: 'Build REST API for user management',
                storyPoints: 5,
                priority: 'medium',
                complexity: 'low',
                estimatedHours: 10,
                skills: ['JavaScript', 'Express.js'],
                dependencies: ['task_1'],
                assignee: null
            },
            {
                id: 'task_3',
                title: 'Write unit tests',
                description: 'Add comprehensive test coverage',
                storyPoints: 3,
                priority: 'medium',
                complexity: 'low',
                estimatedHours: 6,
                skills: ['JavaScript', 'Jest'],
                dependencies: ['task_2'],
                assignee: null
            }
        ];
    }

    /**
     * Start sprint monitoring
     */
    async startSprintMonitoring(sprint) {
        // This would start monitoring the sprint progress
        console.log(`Starting monitoring for sprint ${sprint.id}`);
    }

    /**
     * Update analytics
     */
    updateAnalytics(event, data) {
        const timestamp = new Date();
        const analytics = {
            event,
            data,
            timestamp
        };
        
        this.analytics.set(`${event}_${timestamp.getTime()}`, analytics);
        
        // Keep only last 1000 analytics entries
        if (this.analytics.size > 1000) {
            const entries = Array.from(this.analytics.entries());
            entries.sort((a, b) => new Date(a[1].timestamp) - new Date(b[1].timestamp));
            
            for (let i = 0; i < entries.length - 1000; i++) {
                this.analytics.delete(entries[i][0]);
            }
        }
    }

    /**
     * Calculate average velocity
     */
    calculateAverageVelocity(sprints) {
        const completedSprints = sprints.filter(s => s.status === 'completed' && s.velocity);
        if (completedSprints.length === 0) return 0;
        
        const totalVelocity = completedSprints.reduce((sum, s) => sum + s.velocity, 0);
        return totalVelocity / completedSprints.length;
    }

    /**
     * Calculate average capacity
     */
    calculateAverageCapacity(sprints) {
        if (sprints.length === 0) return 0;
        
        const totalCapacity = sprints.reduce((sum, s) => sum + (s.capacity || 0), 0);
        return totalCapacity / sprints.length;
    }

    /**
     * Calculate success rate
     */
    calculateSuccessRate(sprints) {
        const completedSprints = sprints.filter(s => s.status === 'completed');
        if (completedSprints.length === 0) return 0;
        
        const successfulSprints = completedSprints.filter(s => 
            s.goalsAchieved >= s.goalsPlanned * 0.8
        );
        
        return successfulSprints.length / completedSprints.length;
    }

    /**
     * Calculate average improvement from AI optimization
     */
    calculateAverageImprovement(sprints) {
        const optimizedSprints = sprints.filter(s => s.aiOptimized && s.improvement);
        if (optimizedSprints.length === 0) return 0;
        
        const totalImprovement = optimizedSprints.reduce((sum, s) => sum + s.improvement, 0);
        return totalImprovement / optimizedSprints.length;
    }

    /**
     * Calculate planning accuracy
     */
    calculatePlanningAccuracy(sprints) {
        const completedSprints = sprints.filter(s => 
            s.status === 'completed' && s.estimatedVelocity && s.actualVelocity
        );
        
        if (completedSprints.length === 0) return 0;
        
        const totalAccuracy = completedSprints.reduce((sum, s) => {
            const accuracy = 1 - Math.abs(s.estimatedVelocity - s.actualVelocity) / s.estimatedVelocity;
            return sum + Math.max(0, accuracy);
        }, 0);
        
        return totalAccuracy / completedSprints.length;
    }

    /**
     * Calculate team performance
     */
    calculateTeamPerformance(sprints) {
        const teamStats = new Map();
        
        sprints.forEach(sprint => {
            if (!teamStats.has(sprint.teamId)) {
                teamStats.set(sprint.teamId, {
                    totalSprints: 0,
                    completedSprints: 0,
                    totalVelocity: 0,
                    totalCapacity: 0
                });
            }
            
            const stats = teamStats.get(sprint.teamId);
            stats.totalSprints++;
            
            if (sprint.status === 'completed') {
                stats.completedSprints++;
                stats.totalVelocity += sprint.velocity || 0;
            }
            
            stats.totalCapacity += sprint.capacity || 0;
        });
        
        const performance = {};
        for (const [teamId, stats] of teamStats) {
            performance[teamId] = {
                completionRate: stats.completedSprints / stats.totalSprints,
                averageVelocity: stats.totalVelocity / Math.max(1, stats.completedSprints),
                averageCapacity: stats.totalCapacity / stats.totalSprints,
                efficiency: stats.totalVelocity / Math.max(1, stats.totalCapacity)
            };
        }
        
        return performance;
    }

    /**
     * Initialize default templates
     */
    initializeTemplates() {
        // Sprint planning template
        this.templates.set('standard_sprint', {
            id: 'standard_sprint',
            name: 'Standard Sprint',
            duration: 14,
            workingDaysPerWeek: 5,
            workingHoursPerDay: 8,
            capacityBuffer: 0.2,
            goals: ['Complete planned features', 'Maintain code quality', 'Deliver on time'],
            ceremonies: [
                { name: 'Sprint Planning', duration: 2, frequency: 'per_sprint' },
                { name: 'Daily Standup', duration: 0.25, frequency: 'daily' },
                { name: 'Sprint Review', duration: 1, frequency: 'per_sprint' },
                { name: 'Retrospective', duration: 1, frequency: 'per_sprint' }
            ]
        });
        
        // Agile sprint template
        this.templates.set('agile_sprint', {
            id: 'agile_sprint',
            name: 'Agile Sprint',
            duration: 14,
            workingDaysPerWeek: 5,
            workingHoursPerDay: 8,
            capacityBuffer: 0.15,
            goals: ['Deliver working software', 'Respond to change', 'Collaborate with stakeholders'],
            ceremonies: [
                { name: 'Sprint Planning', duration: 2, frequency: 'per_sprint' },
                { name: 'Daily Standup', duration: 0.25, frequency: 'daily' },
                { name: 'Sprint Review', duration: 1.5, frequency: 'per_sprint' },
                { name: 'Retrospective', duration: 1.5, frequency: 'per_sprint' },
                { name: 'Backlog Refinement', duration: 1, frequency: 'per_sprint' }
            ]
        });
    }

    /**
     * Start background processes
     */
    startBackgroundProcesses() {
        // Update sprint statuses
        setInterval(() => {
            this.updateSprintStatuses();
        }, 60000); // Every minute
        
        // Clean up old analytics
        setInterval(() => {
            this.cleanupAnalytics();
        }, 300000); // Every 5 minutes
    }

    /**
     * Update sprint statuses
     */
    updateSprintStatuses() {
        const now = new Date();
        
        for (const [id, sprint] of this.sprints) {
            if (sprint.status === 'active' && sprint.endDate <= now) {
                sprint.status = 'completed';
                sprint.completedAt = now;
                this.sprints.set(id, sprint);
                this.updateAnalytics('sprint_completed', sprint);
            }
        }
    }

    /**
     * Clean up old analytics
     */
    cleanupAnalytics() {
        const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
        
        for (const [key, analytics] of this.analytics) {
            if (new Date(analytics.timestamp).getTime() < cutoffTime) {
                this.analytics.delete(key);
            }
        }
    }

    /**
     * Stop the sprint planning system
     */
    stop() {
        this.isRunning = false;
        this.planningEngine.stop();
        this.aiOptimizer.stop();
        this.velocityCalculator.stop();
        this.capacityPlanner.stop();
    }
}

module.exports = IntegratedSprintPlanningSystem;
