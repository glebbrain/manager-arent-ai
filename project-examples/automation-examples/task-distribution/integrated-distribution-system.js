/**
 * Integrated Task Distribution System v2.4
 * Combines all distribution components into a unified system
 */

const AdvancedTaskDistributionEngine = require('./advanced-distribution-engine');
const SmartNotificationSystem = require('./smart-notification-system');
const DistributionMonitor = require('./distribution-monitor');

class IntegratedDistributionSystem {
    constructor(options = {}) {
        // Initialize core components
        this.distributionEngine = new AdvancedTaskDistributionEngine(options.distribution || {});
        this.notificationSystem = new SmartNotificationSystem(options.notifications || {});
        this.monitor = new DistributionMonitor(options.monitoring || {});
        
        // System configuration
        this.config = {
            autoDistribution: options.autoDistribution || true,
            notificationEnabled: options.notificationEnabled || true,
            monitoringEnabled: options.monitoringEnabled || true,
            optimizationInterval: options.optimizationInterval || 300000, // 5 minutes
            rebalanceThreshold: options.rebalanceThreshold || 0.3
        };
        
        // State management
        this.isRunning = false;
        this.lastOptimization = null;
        this.distributionQueue = [];
        
        // Start system if auto-distribution is enabled
        if (this.config.autoDistribution) {
            this.start();
        }
    }

    /**
     * Start the integrated distribution system
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('Integrated Distribution System started');
        
        // Start optimization loop
        this.startOptimizationLoop();
        
        // Start queue processing
        this.startQueueProcessing();
    }

    /**
     * Stop the integrated distribution system
     */
    stop() {
        this.isRunning = false;
        console.log('Integrated Distribution System stopped');
    }

    /**
     * Start optimization loop
     */
    startOptimizationLoop() {
        setInterval(() => {
            if (this.isRunning) {
                this.optimizeDistribution();
            }
        }, this.config.optimizationInterval);
    }

    /**
     * Start queue processing
     */
    startQueueProcessing() {
        setInterval(() => {
            if (this.isRunning && this.distributionQueue.length > 0) {
                this.processDistributionQueue();
            }
        }, 10000); // Process every 10 seconds
    }

    /**
     * Register developer with all systems
     */
    registerDeveloper(developer) {
        const devId = this.distributionEngine.registerDeveloper(developer);
        
        // Subscribe to notifications
        if (this.config.notificationEnabled) {
            this.notificationSystem.subscribe(devId, developer.notificationPreferences || {});
        }
        
        return devId;
    }

    /**
     * Register task with all systems
     */
    registerTask(task) {
        const taskId = this.distributionEngine.registerTask(task);
        
        // Add to distribution queue if auto-distribution is enabled
        if (this.config.autoDistribution) {
            this.distributionQueue.push({
                taskId,
                priority: task.priority || 'medium',
                createdAt: new Date()
            });
        }
        
        return taskId;
    }

    /**
     * Register project with all systems
     */
    registerProject(project) {
        return this.distributionEngine.registerProject(project);
    }

    /**
     * Distribute tasks using intelligent strategy selection
     */
    async distributeTasks(options = {}) {
        const tasks = Array.from(this.distributionEngine.tasks.values())
            .filter(task => !task.assignedTo);
        const developers = Array.from(this.distributionEngine.developers.values())
            .filter(dev => dev.availability > 0);
        
        if (tasks.length === 0) {
            return { success: true, message: 'No tasks to distribute' };
        }
        
        if (developers.length === 0) {
            return { success: false, message: 'No available developers' };
        }
        
        // Select optimal strategy
        const strategy = this.selectOptimalStrategy(tasks, developers, options);
        
        // Execute distribution
        const distribution = this.distributionEngine.distributeTasks(strategy, options);
        
        if (distribution.success) {
            // Apply distribution
            this.distributionEngine.applyDistribution(distribution.distribution);
            
            // Send notifications
            if (this.config.notificationEnabled) {
                await this.sendDistributionNotifications(distribution.distribution);
            }
            
            // Update monitoring
            if (this.config.monitoringEnabled) {
                this.updateMonitoringData(distribution);
            }
        }
        
        return distribution;
    }

    /**
     * Select optimal distribution strategy
     */
    selectOptimalStrategy(tasks, developers, options) {
        // Use AI-optimized strategy by default
        if (options.strategy) {
            return options.strategy;
        }
        
        // Analyze context to select strategy
        const context = this.analyzeDistributionContext(tasks, developers);
        
        if (context.highPriorityTasks > 0.5) return 'priority-based';
        if (context.urgentDeadlines > 0.3) return 'deadline-driven';
        if (context.learningOpportunities > 0.4) return 'learning-optimized';
        if (context.skillGaps > 0.3) return 'skill-based';
        
        return 'ai-optimized';
    }

    /**
     * Analyze distribution context
     */
    analyzeDistributionContext(tasks, developers) {
        const totalTasks = tasks.length;
        const highPriorityTasks = tasks.filter(t => 
            t.priority === 'critical' || t.priority === 'high'
        ).length / totalTasks;
        
        const urgentDeadlines = tasks.filter(t => {
            if (!t.deadline) return false;
            const daysUntilDeadline = (new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24);
            return daysUntilDeadline < 7;
        }).length / totalTasks;
        
        const learningOpportunities = tasks.filter(t => 
            t.learningOpportunity
        ).length / totalTasks;
        
        const skillGaps = this.calculateAverageSkillGap(tasks, developers);
        
        return {
            highPriorityTasks,
            urgentDeadlines,
            learningOpportunities,
            skillGaps
        };
    }

    /**
     * Calculate average skill gap
     */
    calculateAverageSkillGap(tasks, developers) {
        let totalGap = 0;
        let taskCount = 0;
        
        for (const task of tasks) {
            const requiredSkills = task.requiredSkills || [];
            if (requiredSkills.length === 0) continue;
            
            const availableDevelopers = developers.filter(dev => 
                this.distributionEngine.canHandleTask(dev, task)
            ).length;
            
            const gap = 1 - (availableDevelopers / developers.length);
            totalGap += gap;
            taskCount++;
        }
        
        return taskCount > 0 ? totalGap / taskCount : 0;
    }

    /**
     * Send distribution notifications
     */
    async sendDistributionNotifications(distribution) {
        for (const assignment of distribution) {
            const task = this.distributionEngine.tasks.get(assignment.taskId);
            const developer = this.distributionEngine.developers.get(assignment.developerId);
            
            if (task && developer) {
                await this.notificationSystem.sendNotification({
                    userId: developer.id,
                    type: 'task-assigned',
                    priority: task.priority,
                    data: {
                        taskTitle: task.title,
                        projectName: task.project || 'Unknown Project',
                        priority: task.priority,
                        estimatedHours: task.estimatedHours,
                        deadline: task.deadline,
                        developerName: developer.name
                    }
                });
            }
        }
    }

    /**
     * Update monitoring data
     */
    updateMonitoringData(distribution) {
        // Update distribution history
        this.distributionEngine.distributionHistory.push({
            timestamp: new Date(),
            distribution,
            strategy: 'integrated',
            success: true
        });
    }

    /**
     * Process distribution queue
     */
    async processDistributionQueue() {
        if (this.distributionQueue.length === 0) return;
        
        // Sort by priority and creation time
        this.distributionQueue.sort((a, b) => {
            const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return a.createdAt - b.createdAt;
        });
        
        // Process high priority tasks immediately
        const highPriorityTasks = this.distributionQueue.filter(item => 
            item.priority === 'critical' || item.priority === 'high'
        );
        
        if (highPriorityTasks.length > 0) {
            await this.processHighPriorityTasks(highPriorityTasks);
        }
        
        // Process remaining tasks in batches
        const remainingTasks = this.distributionQueue.filter(item => 
            item.priority !== 'critical' && item.priority !== 'high'
        );
        
        if (remainingTasks.length > 0) {
            await this.processBatchTasks(remainingTasks);
        }
    }

    /**
     * Process high priority tasks
     */
    async processHighPriorityTasks(tasks) {
        for (const taskItem of tasks) {
            const task = this.distributionEngine.tasks.get(taskItem.taskId);
            if (task && !task.assignedTo) {
                await this.distributeTasks({
                    strategy: 'priority-based',
                    tasks: [task]
                });
            }
        }
        
        // Remove processed tasks from queue
        this.distributionQueue = this.distributionQueue.filter(item => 
            !tasks.includes(item)
        );
    }

    /**
     * Process batch tasks
     */
    async processBatchTasks(tasks) {
        const batchSize = 10;
        const batches = [];
        
        for (let i = 0; i < tasks.length; i += batchSize) {
            batches.push(tasks.slice(i, i + batchSize));
        }
        
        for (const batch of batches) {
            const batchTasks = batch
                .map(item => this.distributionEngine.tasks.get(item.taskId))
                .filter(task => task && !task.assignedTo);
            
            if (batchTasks.length > 0) {
                await this.distributeTasks({
                    strategy: 'ai-optimized',
                    tasks: batchTasks
                });
            }
        }
        
        // Remove processed tasks from queue
        this.distributionQueue = this.distributionQueue.filter(item => 
            !tasks.includes(item)
        );
    }

    /**
     * Optimize current distribution
     */
    async optimizeDistribution() {
        if (!this.isRunning) return;
        
        try {
            // Get current distribution metrics
            const metrics = this.monitor.getLatestMetrics();
            if (!metrics) return;
            
            // Check if rebalancing is needed
            if (metrics.workload.imbalance > this.config.rebalanceThreshold) {
                console.log('Rebalancing workload...');
                await this.rebalanceWorkload();
            }
            
            // Update last optimization time
            this.lastOptimization = new Date();
            
        } catch (error) {
            console.error('Error during optimization:', error);
        }
    }

    /**
     * Rebalance workload
     */
    async rebalanceWorkload() {
        // Get overloaded developers
        const developers = Array.from(this.distributionEngine.developers.values());
        const overloadedDevelopers = developers.filter(dev => 
            dev.currentWorkload > dev.capacity * this.config.rebalanceThreshold
        );
        
        for (const developer of overloadedDevelopers) {
            // Find tasks to redistribute
            const tasksToRedistribute = this.findTasksToRedistribute(developer);
            
            if (tasksToRedistribute.length > 0) {
                // Remove from current developer
                tasksToRedistribute.forEach(task => {
                    task.assignedTo = null;
                    developer.currentWorkload -= task.estimatedHours;
                });
                
                // Redistribute to other developers
                await this.distributeTasks({
                    strategy: 'workload-balanced',
                    tasks: tasksToRedistribute
                });
            }
        }
    }

    /**
     * Find tasks to redistribute from a developer
     */
    findTasksToRedistribute(developer) {
        return Array.from(this.distributionEngine.tasks.values())
            .filter(task => 
                task.assignedTo === developer.id &&
                task.priority !== 'critical' &&
                !task.deadline || (new Date(task.deadline) - new Date()) > 7 * 24 * 60 * 60 * 1000
            )
            .slice(0, Math.floor(developer.assignedTasks?.length / 2) || 1);
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            isRunning: this.isRunning,
            lastOptimization: this.lastOptimization,
            queueLength: this.distributionQueue.length,
            developers: this.distributionEngine.developers.size,
            tasks: this.distributionEngine.tasks.size,
            assignedTasks: Array.from(this.distributionEngine.tasks.values())
                .filter(t => t.assignedTo).length,
            monitoring: this.monitor.getDashboardData(),
            notifications: this.notificationSystem.getNotificationStats()
        };
    }

    /**
     * Get distribution analytics
     */
    getAnalytics() {
        return {
            distribution: this.distributionEngine.getAdvancedAnalytics(),
            monitoring: this.monitor.getDashboardData(),
            notifications: this.notificationSystem.getNotificationStats()
        };
    }

    /**
     * Update task status
     */
    updateTaskStatus(taskId, status, data = {}) {
        const task = this.distributionEngine.tasks.get(taskId);
        if (!task) return false;
        
        const oldStatus = task.status;
        task.status = status;
        task.updatedAt = new Date();
        
        // Update developer performance if task completed
        if (status === 'completed' && task.assignedTo) {
            const developer = this.distributionEngine.developers.get(task.assignedTo);
            if (developer) {
                developer.completedTasks = developer.completedTasks || [];
                developer.completedTasks.push({
                    taskId,
                    completedAt: new Date(),
                    actualHours: data.actualHours || task.estimatedHours,
                    quality: data.quality || 5
                });
                
                // Update performance metrics
                this.distributionEngine.updatePerformanceMetrics(developer.id);
            }
        }
        
        // Send status update notification
        if (this.config.notificationEnabled && task.assignedTo) {
            this.notificationSystem.sendNotification({
                userId: task.assignedTo,
                type: 'task-updated',
                priority: 'medium',
                data: {
                    taskTitle: task.title,
                    oldStatus,
                    newStatus: status,
                    changes: data.changes || `Status changed from ${oldStatus} to ${status}`,
                    updatedBy: data.updatedBy || 'System'
                }
            });
        }
        
        return true;
    }

    /**
     * Get developer workload
     */
    getDeveloperWorkload(developerId) {
        const developer = this.distributionEngine.developers.get(developerId);
        if (!developer) return null;
        
        const assignedTasks = Array.from(this.distributionEngine.tasks.values())
            .filter(task => task.assignedTo === developerId);
        
        return {
            developer: {
                id: developer.id,
                name: developer.name,
                capacity: developer.capacity || 40
            },
            currentWorkload: developer.currentWorkload,
            utilization: developer.currentWorkload / (developer.capacity || 40),
            assignedTasks: assignedTasks.length,
            tasks: assignedTasks.map(task => ({
                id: task.id,
                title: task.title,
                priority: task.priority,
                estimatedHours: task.estimatedHours,
                deadline: task.deadline,
                status: task.status
            }))
        };
    }

    /**
     * Get task distribution history
     */
    getDistributionHistory(limit = 50) {
        return this.distributionEngine.distributionHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
}

module.exports = IntegratedDistributionSystem;
