/**
 * Conflict Resolver
 * Handles status update conflicts and provides resolution strategies
 */

class ConflictResolver {
    constructor(options = {}) {
        this.autoResolution = options.autoResolution || true;
        this.conflictThreshold = options.conflictThreshold || 0.1;
        this.resolutionStrategies = new Map();
        this.conflicts = new Map();
        this.resolutions = new Map();
        this.isRunning = true;
        
        this.initializeResolutionStrategies();
    }

    /**
     * Resolve conflict
     */
    async resolveConflict(conflict, resolutionStrategy = 'auto') {
        try {
            const strategy = this.selectResolutionStrategy(conflict, resolutionStrategy);
            
            if (!strategy) {
                return null;
            }
            
            const resolution = await strategy.resolve(conflict);
            
            if (resolution) {
                this.resolutions.set(conflict.id || `conflict_${Date.now()}`, resolution);
                return resolution;
            }
            
            return null;
        } catch (error) {
            console.error('Error resolving conflict:', error);
            return null;
        }
    }

    /**
     * Select resolution strategy
     */
    selectResolutionStrategy(conflict, resolutionStrategy) {
        if (resolutionStrategy === 'auto') {
            // Auto-select best strategy based on conflict type
            const strategies = this.resolutionStrategies.get(conflict.type) || [];
            return strategies.find(strategy => strategy.canResolve(conflict));
        } else {
            // Use specific strategy
            const strategies = this.resolutionStrategies.get(conflict.type) || [];
            return strategies.find(strategy => strategy.name === resolutionStrategy);
        }
    }

    /**
     * Initialize resolution strategies
     */
    initializeResolutionStrategies() {
        // Dependency conflict strategies
        this.resolutionStrategies.set('dependency', [
            new DependencyConflictStrategy('auto_complete_dependencies'),
            new DependencyConflictStrategy('delay_task'),
            new DependencyConflictStrategy('parallel_execution')
        ]);
        
        // Resource conflict strategies
        this.resolutionStrategies.set('resource', [
            new ResourceConflictStrategy('reassign_resources'),
            new ResourceConflictStrategy('add_resources'),
            new ResourceConflictStrategy('reschedule_task')
        ]);
        
        // Timeline conflict strategies
        this.resolutionStrategies.set('timeline', [
            new TimelineConflictStrategy('extend_deadline'),
            new TimelineConflictStrategy('reduce_scope'),
            new TimelineConflictStrategy('add_resources')
        ]);
    }

    /**
     * Get all conflicts
     */
    getAllConflicts() {
        return Array.from(this.conflicts.values());
    }

    /**
     * Get conflicts by type
     */
    getConflictsByType(type) {
        return Array.from(this.conflicts.values())
            .filter(conflict => conflict.type === type);
    }

    /**
     * Get conflicts by severity
     */
    getConflictsBySeverity(severity) {
        return Array.from(this.conflicts.values())
            .filter(conflict => conflict.severity === severity);
    }

    /**
     * Get all resolutions
     */
    getAllResolutions() {
        return Array.from(this.resolutions.values());
    }

    /**
     * Get resolution for conflict
     */
    getResolution(conflictId) {
        return this.resolutions.get(conflictId);
    }

    /**
     * Get conflict statistics
     */
    getConflictStatistics() {
        const conflicts = Array.from(this.conflicts.values());
        const resolutions = Array.from(this.resolutions.values());
        
        const totalConflicts = conflicts.length;
        const resolvedConflicts = resolutions.length;
        const unresolvedConflicts = totalConflicts - resolvedConflicts;
        
        const conflictsByType = {};
        const conflictsBySeverity = {};
        
        for (const conflict of conflicts) {
            // Count by type
            const type = conflict.type;
            conflictsByType[type] = (conflictsByType[type] || 0) + 1;
            
            // Count by severity
            const severity = conflict.severity;
            conflictsBySeverity[severity] = (conflictsBySeverity[severity] || 0) + 1;
        }
        
        return {
            totalConflicts,
            resolvedConflicts,
            unresolvedConflicts,
            resolutionRate: totalConflicts > 0 ? resolvedConflicts / totalConflicts : 0,
            conflictsByType,
            conflictsBySeverity
        };
    }

    /**
     * Stop the conflict resolver
     */
    stop() {
        this.isRunning = false;
    }
}

/**
 * Base resolution strategy
 */
class ResolutionStrategy {
    constructor(name) {
        this.name = name;
    }
    
    canResolve(conflict) {
        return true; // Override in subclasses
    }
    
    async resolve(conflict) {
        throw new Error('resolve method must be implemented');
    }
}

/**
 * Dependency conflict resolution strategy
 */
class DependencyConflictStrategy extends ResolutionStrategy {
    constructor(name) {
        super(name);
    }
    
    canResolve(conflict) {
        return conflict.type === 'dependency';
    }
    
    async resolve(conflict) {
        switch (this.name) {
            case 'auto_complete_dependencies':
                return this.autoCompleteDependencies(conflict);
            case 'delay_task':
                return this.delayTask(conflict);
            case 'parallel_execution':
                return this.enableParallelExecution(conflict);
            default:
                return null;
        }
    }
    
    autoCompleteDependencies(conflict) {
        return {
            strategy: 'auto_complete_dependencies',
            description: 'Automatically complete blocking dependencies',
            actions: [
                {
                    type: 'complete_dependencies',
                    taskIds: conflict.affectedTasks,
                    reason: 'Auto-completion to resolve dependency conflict'
                }
            ],
            estimatedTime: '1-2 hours',
            risk: 'low',
            success: true
        };
    }
    
    delayTask(conflict) {
        return {
            strategy: 'delay_task',
            description: 'Delay task until dependencies are completed',
            actions: [
                {
                    type: 'delay_task',
                    taskId: conflict.taskId,
                    delayHours: 24,
                    reason: 'Waiting for dependencies to complete'
                }
            ],
            estimatedTime: '24 hours',
            risk: 'medium',
            success: true
        };
    }
    
    enableParallelExecution(conflict) {
        return {
            strategy: 'parallel_execution',
            description: 'Enable parallel execution of dependent tasks',
            actions: [
                {
                    type: 'enable_parallel',
                    taskIds: conflict.affectedTasks,
                    reason: 'Enable parallel execution to resolve dependency conflict'
                }
            ],
            estimatedTime: '2-4 hours',
            risk: 'low',
            success: true
        };
    }
}

/**
 * Resource conflict resolution strategy
 */
class ResourceConflictStrategy extends ResolutionStrategy {
    constructor(name) {
        super(name);
    }
    
    canResolve(conflict) {
        return conflict.type === 'resource';
    }
    
    async resolve(conflict) {
        switch (this.name) {
            case 'reassign_resources':
                return this.reassignResources(conflict);
            case 'add_resources':
                return this.addResources(conflict);
            case 'reschedule_task':
                return this.rescheduleTask(conflict);
            default:
                return null;
        }
    }
    
    reassignResources(conflict) {
        return {
            strategy: 'reassign_resources',
            description: 'Reassign resources to resolve conflict',
            actions: [
                {
                    type: 'reassign_resource',
                    taskId: conflict.taskId,
                    fromResource: conflict.affectedResources[0],
                    toResource: 'available_resource_1',
                    reason: 'Resolve resource conflict'
                }
            ],
            estimatedTime: '1 hour',
            risk: 'low',
            success: true
        };
    }
    
    addResources(conflict) {
        return {
            strategy: 'add_resources',
            description: 'Add additional resources to handle conflict',
            actions: [
                {
                    type: 'add_resource',
                    taskId: conflict.taskId,
                    resourceType: 'developer',
                    count: 1,
                    reason: 'Resolve resource conflict'
                }
            ],
            estimatedTime: '2-4 hours',
            risk: 'medium',
            success: true
        };
    }
    
    rescheduleTask(conflict) {
        return {
            strategy: 'reschedule_task',
            description: 'Reschedule task to avoid resource conflict',
            actions: [
                {
                    type: 'reschedule_task',
                    taskId: conflict.taskId,
                    newStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours later
                    reason: 'Resolve resource conflict'
                }
            ],
            estimatedTime: '24 hours',
            risk: 'medium',
            success: true
        };
    }
}

/**
 * Timeline conflict resolution strategy
 */
class TimelineConflictStrategy extends ResolutionStrategy {
    constructor(name) {
        super(name);
    }
    
    canResolve(conflict) {
        return conflict.type === 'timeline';
    }
    
    async resolve(conflict) {
        switch (this.name) {
            case 'extend_deadline':
                return this.extendDeadline(conflict);
            case 'reduce_scope':
                return this.reduceScope(conflict);
            case 'add_resources':
                return this.addResources(conflict);
            default:
                return null;
        }
    }
    
    extendDeadline(conflict) {
        const additionalDays = 3; // Default 3 days extension
        const newDeadline = new Date(conflict.deadline.getTime() + additionalDays * 24 * 60 * 60 * 1000);
        
        return {
            strategy: 'extend_deadline',
            description: 'Extend task deadline to resolve timeline conflict',
            actions: [
                {
                    type: 'extend_deadline',
                    taskId: conflict.taskId,
                    oldDeadline: conflict.deadline,
                    newDeadline: newDeadline,
                    additionalDays: additionalDays,
                    reason: 'Resolve timeline conflict'
                }
            ],
            estimatedTime: '0 hours',
            risk: 'high',
            success: true
        };
    }
    
    reduceScope(conflict) {
        return {
            strategy: 'reduce_scope',
            description: 'Reduce task scope to meet deadline',
            actions: [
                {
                    type: 'reduce_scope',
                    taskId: conflict.taskId,
                    removedFeatures: ['feature_1', 'feature_2'],
                    reason: 'Resolve timeline conflict'
                }
            ],
            estimatedTime: '2-4 hours',
            risk: 'high',
            success: true
        };
    }
    
    addResources(conflict) {
        return {
            strategy: 'add_resources',
            description: 'Add resources to meet deadline',
            actions: [
                {
                    type: 'add_resource',
                    taskId: conflict.taskId,
                    resourceType: 'developer',
                    count: 2,
                    reason: 'Resolve timeline conflict'
                }
            ],
            estimatedTime: '4-8 hours',
            risk: 'medium',
            success: true
        };
    }
}

module.exports = ConflictResolver;
