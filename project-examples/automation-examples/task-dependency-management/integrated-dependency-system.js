/**
 * Integrated Task Dependency Management System
 * Orchestrates AI-powered dependency management with optimization and analytics
 */

const DependencyEngine = require('./dependency-engine');
const ConflictResolver = require('./conflict-resolver');
const CriticalPathAnalyzer = require('./critical-path-analyzer');
const ImpactAnalyzer = require('./impact-analyzer');

class IntegratedDependencySystem {
    constructor(options = {}) {
        this.dependencyEngine = new DependencyEngine(options.dependency);
        this.conflictResolver = new ConflictResolver(options.dependency);
        this.criticalPathAnalyzer = new CriticalPathAnalyzer(options.dependency);
        this.impactAnalyzer = new ImpactAnalyzer(options.dependency);
        
        this.isRunning = true;
        this.lastUpdate = new Date();
        this.dependencies = new Map();
        this.tasks = new Map();
        this.projects = new Map();
        this.analytics = new Map();
        
        this.config = {
            autoManagement: options.autoManagement || false,
            aiEnabled: options.aiEnabled || false,
            monitoringEnabled: options.monitoringEnabled || false,
            ...options
        };
        
        this.startBackgroundProcesses();
    }

    /**
     * Add dependencies for a task
     */
    async addDependencies(taskId, dependencies, options = {}) {
        try {
            const { projectId } = options;
            
            // Validate dependencies
            const validatedDependencies = await this.validateDependencies(taskId, dependencies, options);
            
            // Check for conflicts
            const conflicts = await this.detectConflicts([taskId, ...dependencies.map(d => d.taskId)], { projectId });
            
            // Check for circular dependencies
            const circularDeps = await this.detectCircularDependencies([taskId, ...dependencies.map(d => d.taskId)], { projectId });
            
            // Add dependencies
            const result = await this.dependencyEngine.addDependencies(taskId, validatedDependencies, options);
            
            // Update analytics
            this.updateAnalytics('dependencies_added', {
                taskId,
                dependencies: validatedDependencies,
                conflicts,
                circularDeps
            });
            
            // Auto-resolve conflicts if enabled
            if (this.config.autoManagement && conflicts.length > 0) {
                await this.autoResolveConflicts(conflicts, options);
            }
            
            return {
                success: true,
                dependencies: result,
                conflicts,
                circularDependencies: circularDeps,
                warnings: this.generateWarnings(conflicts, circularDeps)
            };
        } catch (error) {
            console.error('Error adding dependencies:', error);
            throw error;
        }
    }

    /**
     * Get dependencies for a task
     */
    getDependencies(taskId, options = {}) {
        const { includeTransitive = false, includeConflicts = false } = options;
        
        const directDependencies = this.dependencyEngine.getDependencies(taskId);
        let dependencies = [...directDependencies];
        
        if (includeTransitive) {
            const transitiveDependencies = this.getTransitiveDependencies(taskId);
            dependencies = [...dependencies, ...transitiveDependencies];
        }
        
        if (includeConflicts) {
            const conflicts = this.conflictResolver.getConflictsForTask(taskId);
            dependencies = dependencies.map(dep => ({
                ...dep,
                conflicts: conflicts.filter(c => c.taskId === dep.taskId)
            }));
        }
        
        return dependencies;
    }

    /**
     * Update dependencies for a task
     */
    async updateDependencies(taskId, dependencies, options = {}) {
        try {
            // Validate new dependencies
            const validatedDependencies = await this.validateDependencies(taskId, dependencies, options);
            
            // Get current dependencies for comparison
            const currentDependencies = this.dependencyEngine.getDependencies(taskId);
            
            // Calculate changes
            const changes = this.calculateDependencyChanges(currentDependencies, validatedDependencies);
            
            // Update dependencies
            const result = await this.dependencyEngine.updateDependencies(taskId, validatedDependencies, options);
            
            // Analyze impact of changes
            const impact = await this.analyzeImpact(taskId, 'dependency_update', {
                changes,
                ...options
            });
            
            // Update analytics
            this.updateAnalytics('dependencies_updated', {
                taskId,
                changes,
                impact
            });
            
            return {
                success: true,
                dependencies: result,
                changes,
                impact
            };
        } catch (error) {
            console.error('Error updating dependencies:', error);
            throw error;
        }
    }

    /**
     * Remove dependencies for a task
     */
    async removeDependencies(taskId, dependencyIds, options = {}) {
        try {
            // Get current dependencies
            const currentDependencies = this.dependencyEngine.getDependencies(taskId);
            const dependenciesToRemove = currentDependencies.filter(dep => 
                dependencyIds.includes(dep.id)
            );
            
            // Analyze impact before removal
            const impact = await this.analyzeImpact(taskId, 'dependency_removal', {
                dependenciesToRemove,
                ...options
            });
            
            // Remove dependencies
            const result = await this.dependencyEngine.removeDependencies(taskId, dependencyIds, options);
            
            // Update analytics
            this.updateAnalytics('dependencies_removed', {
                taskId,
                removedDependencies: dependenciesToRemove,
                impact
            });
            
            return {
                success: true,
                removedDependencies: dependenciesToRemove,
                impact
            };
        } catch (error) {
            console.error('Error removing dependencies:', error);
            throw error;
        }
    }

    /**
     * Analyze dependencies
     */
    async analyzeDependencies(taskIds, options = {}) {
        try {
            const { projectId, analysisType = 'comprehensive' } = options;
            
            const analysis = {
                taskIds,
                projectId,
                analysisType,
                timestamp: new Date(),
                dependencies: new Map(),
                conflicts: [],
                circularDependencies: [],
                criticalPaths: [],
                impactAnalysis: new Map(),
                recommendations: []
            };
            
            // Analyze each task
            for (const taskId of taskIds) {
                const taskDependencies = this.getDependencies(taskId, { 
                    includeTransitive: true, 
                    includeConflicts: true 
                });
                analysis.dependencies.set(taskId, taskDependencies);
            }
            
            // Detect conflicts
            analysis.conflicts = await this.detectConflicts(taskIds, { projectId });
            
            // Detect circular dependencies
            analysis.circularDependencies = await this.detectCircularDependencies(taskIds, { projectId });
            
            // Analyze critical paths
            analysis.criticalPaths = this.criticalPathAnalyzer.analyzeCriticalPaths(taskIds, { projectId });
            
            // Impact analysis for each task
            for (const taskId of taskIds) {
                const impact = await this.analyzeImpact(taskId, 'analysis', { projectId });
                analysis.impactAnalysis.set(taskId, impact);
            }
            
            // Generate recommendations
            analysis.recommendations = this.generateRecommendations(analysis);
            
            // Update analytics
            this.updateAnalytics('dependency_analysis', analysis);
            
            return analysis;
        } catch (error) {
            console.error('Error analyzing dependencies:', error);
            throw error;
        }
    }

    /**
     * Optimize dependencies
     */
    async optimizeDependencies(taskIds, options = {}) {
        try {
            const { projectId, optimizationType = 'comprehensive' } = options;
            
            const optimization = {
                taskIds,
                projectId,
                optimizationType,
                timestamp: new Date(),
                originalDependencies: new Map(),
                optimizedDependencies: new Map(),
                improvements: [],
                conflicts: [],
                circularDependencies: []
            };
            
            // Get current dependencies
            for (const taskId of taskIds) {
                const dependencies = this.getDependencies(taskId, { includeTransitive: true });
                optimization.originalDependencies.set(taskId, dependencies);
            }
            
            // Apply optimization based on type
            switch (optimizationType) {
                case 'conflict_resolution':
                    optimization.optimizedDependencies = await this.optimizeConflictResolution(taskIds, options);
                    break;
                case 'circular_dependency_removal':
                    optimization.optimizedDependencies = await this.optimizeCircularDependencyRemoval(taskIds, options);
                    break;
                case 'critical_path_optimization':
                    optimization.optimizedDependencies = await this.optimizeCriticalPath(taskIds, options);
                    break;
                case 'comprehensive':
                    optimization.optimizedDependencies = await this.optimizeComprehensive(taskIds, options);
                    break;
            }
            
            // Calculate improvements
            optimization.improvements = this.calculateImprovements(
                optimization.originalDependencies,
                optimization.optimizedDependencies
            );
            
            // Detect remaining conflicts and circular dependencies
            optimization.conflicts = await this.detectConflicts(taskIds, { projectId });
            optimization.circularDependencies = await this.detectCircularDependencies(taskIds, { projectId });
            
            // Update analytics
            this.updateAnalytics('dependency_optimization', optimization);
            
            return optimization;
        } catch (error) {
            console.error('Error optimizing dependencies:', error);
            throw error;
        }
    }

    /**
     * Get critical path
     */
    getCriticalPath(options = {}) {
        const { projectId, taskIds } = options;
        
        return this.criticalPathAnalyzer.getCriticalPath({
            projectId,
            taskIds
        });
    }

    /**
     * Detect conflicts
     */
    async detectConflicts(taskIds, options = {}) {
        return await this.conflictResolver.detectConflicts(taskIds, options);
    }

    /**
     * Detect circular dependencies
     */
    async detectCircularDependencies(taskIds, options = {}) {
        return await this.dependencyEngine.detectCircularDependencies(taskIds, options);
    }

    /**
     * Analyze impact
     */
    async analyzeImpact(taskId, changeType, options = {}) {
        return await this.impactAnalyzer.analyzeImpact(taskId, changeType, options);
    }

    /**
     * Generate visualization
     */
    generateVisualization(options = {}) {
        const { projectId, taskIds, format = 'json' } = options;
        
        const tasks = taskIds ? taskIds : Array.from(this.tasks.keys());
        const dependencies = [];
        const nodes = [];
        
        // Build dependency graph
        for (const taskId of tasks) {
            const taskDependencies = this.getDependencies(taskId, { includeTransitive: true });
            const task = this.tasks.get(taskId) || { id: taskId, title: `Task ${taskId}` };
            
            nodes.push({
                id: taskId,
                title: task.title,
                status: task.status || 'pending',
                priority: task.priority || 'medium'
            });
            
            for (const dep of taskDependencies) {
                dependencies.push({
                    from: dep.taskId,
                    to: taskId,
                    type: dep.type || 'depends_on',
                    strength: dep.strength || 1
                });
            }
        }
        
        return {
            format,
            nodes,
            dependencies,
            metadata: {
                generatedAt: new Date(),
                totalTasks: nodes.length,
                totalDependencies: dependencies.length
            }
        };
    }

    /**
     * Get analytics
     */
    getAnalytics() {
        const totalDependencies = this.getTotalDependencies();
        const activeTasks = this.getActiveTasks();
        const criticalPaths = this.getCriticalPaths();
        const conflicts = this.getConflicts();
        
        return {
            totalDependencies,
            activeTasks: activeTasks.length,
            criticalPaths: criticalPaths.length,
            conflicts: conflicts.length,
            dependencyComplexity: this.calculateDependencyComplexity(),
            conflictRate: this.calculateConflictRate(),
            circularDependencyRate: this.calculateCircularDependencyRate(),
            criticalPathLength: this.calculateAverageCriticalPathLength(),
            recommendations: this.generateAnalyticsRecommendations()
        };
    }

    /**
     * Get total dependencies
     */
    getTotalDependencies() {
        let total = 0;
        for (const [taskId, dependencies] of this.dependencies) {
            total += dependencies.length;
        }
        return total;
    }

    /**
     * Get active tasks
     */
    getActiveTasks() {
        return Array.from(this.tasks.values()).filter(task => 
            task.status === 'active' || task.status === 'in_progress'
        );
    }

    /**
     * Get critical paths
     */
    getCriticalPaths() {
        return this.criticalPathAnalyzer.getAllCriticalPaths();
    }

    /**
     * Get conflicts
     */
    getConflicts() {
        return this.conflictResolver.getAllConflicts();
    }

    /**
     * Validate dependencies
     */
    async validateDependencies(taskId, dependencies, options = {}) {
        const validatedDependencies = [];
        
        for (const dep of dependencies) {
            // Validate dependency structure
            if (!dep.taskId) {
                throw new Error('Dependency taskId is required');
            }
            
            // Check if dependency task exists
            if (!this.tasks.has(dep.taskId)) {
                console.warn(`Dependency task ${dep.taskId} not found`);
                continue;
            }
            
            // Validate dependency type
            const validTypes = ['depends_on', 'blocks', 'related_to', 'prerequisite'];
            if (dep.type && !validTypes.includes(dep.type)) {
                dep.type = 'depends_on'; // Default type
            }
            
            // Validate strength (0-1)
            if (dep.strength && (dep.strength < 0 || dep.strength > 1)) {
                dep.strength = 1; // Default strength
            }
            
            validatedDependencies.push({
                id: this.generateDependencyId(taskId, dep.taskId),
                taskId: dep.taskId,
                type: dep.type || 'depends_on',
                strength: dep.strength || 1,
                createdAt: new Date(),
                ...dep
            });
        }
        
        return validatedDependencies;
    }

    /**
     * Get transitive dependencies
     */
    getTransitiveDependencies(taskId, visited = new Set()) {
        if (visited.has(taskId)) {
            return []; // Avoid infinite recursion
        }
        
        visited.add(taskId);
        const directDependencies = this.dependencyEngine.getDependencies(taskId);
        const transitiveDependencies = [];
        
        for (const dep of directDependencies) {
            transitiveDependencies.push(dep);
            const subDependencies = this.getTransitiveDependencies(dep.taskId, visited);
            transitiveDependencies.push(...subDependencies);
        }
        
        return transitiveDependencies;
    }

    /**
     * Calculate dependency changes
     */
    calculateDependencyChanges(current, updated) {
        const currentIds = new Set(current.map(d => d.id));
        const updatedIds = new Set(updated.map(d => d.id));
        
        const added = updated.filter(d => !currentIds.has(d.id));
        const removed = current.filter(d => !updatedIds.has(d.id));
        const modified = updated.filter(d => {
            if (!currentIds.has(d.id)) return false;
            const currentDep = current.find(c => c.id === d.id);
            return JSON.stringify(currentDep) !== JSON.stringify(d);
        });
        
        return { added, removed, modified };
    }

    /**
     * Auto-resolve conflicts
     */
    async autoResolveConflicts(conflicts, options = {}) {
        const resolutions = [];
        
        for (const conflict of conflicts) {
            const resolution = await this.conflictResolver.autoResolve(conflict, options);
            if (resolution) {
                resolutions.push(resolution);
            }
        }
        
        return resolutions;
    }

    /**
     * Generate warnings
     */
    generateWarnings(conflicts, circularDependencies) {
        const warnings = [];
        
        if (conflicts.length > 0) {
            warnings.push({
                type: 'conflicts',
                severity: 'medium',
                message: `${conflicts.length} dependency conflicts detected`,
                count: conflicts.length
            });
        }
        
        if (circularDependencies.length > 0) {
            warnings.push({
                type: 'circular_dependencies',
                severity: 'high',
                message: `${circularDependencies.length} circular dependencies detected`,
                count: circularDependencies.length
            });
        }
        
        return warnings;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        // Conflict recommendations
        if (analysis.conflicts.length > 0) {
            recommendations.push({
                type: 'conflict_resolution',
                priority: 'high',
                message: 'Resolve dependency conflicts to improve task flow',
                action: 'Review and resolve conflicting dependencies'
            });
        }
        
        // Circular dependency recommendations
        if (analysis.circularDependencies.length > 0) {
            recommendations.push({
                type: 'circular_dependency_removal',
                priority: 'critical',
                message: 'Remove circular dependencies to prevent deadlocks',
                action: 'Break circular dependency chains'
            });
        }
        
        // Critical path recommendations
        if (analysis.criticalPaths.length > 0) {
            const longestPath = analysis.criticalPaths.reduce((longest, path) => 
                path.length > longest.length ? path : longest, []);
            
            if (longestPath.length > 5) {
                recommendations.push({
                    type: 'critical_path_optimization',
                    priority: 'medium',
                    message: 'Critical path is very long, consider breaking down tasks',
                    action: 'Break down complex tasks into smaller ones'
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Calculate dependency complexity
     */
    calculateDependencyComplexity() {
        const totalTasks = this.tasks.size;
        const totalDependencies = this.getTotalDependencies();
        
        if (totalTasks === 0) return 0;
        
        return totalDependencies / totalTasks;
    }

    /**
     * Calculate conflict rate
     */
    calculateConflictRate() {
        const totalDependencies = this.getTotalDependencies();
        const conflicts = this.getConflicts();
        
        if (totalDependencies === 0) return 0;
        
        return conflicts.length / totalDependencies;
    }

    /**
     * Calculate circular dependency rate
     */
    calculateCircularDependencyRate() {
        const totalDependencies = this.getTotalDependencies();
        const circularDeps = this.dependencyEngine.getAllCircularDependencies();
        
        if (totalDependencies === 0) return 0;
        
        return circularDeps.length / totalDependencies;
    }

    /**
     * Calculate average critical path length
     */
    calculateAverageCriticalPathLength() {
        const criticalPaths = this.getCriticalPaths();
        
        if (criticalPaths.length === 0) return 0;
        
        const totalLength = criticalPaths.reduce((sum, path) => sum + path.length, 0);
        return totalLength / criticalPaths.length;
    }

    /**
     * Generate analytics recommendations
     */
    generateAnalyticsRecommendations() {
        const recommendations = [];
        const complexity = this.calculateDependencyComplexity();
        const conflictRate = this.calculateConflictRate();
        const circularRate = this.calculateCircularDependencyRate();
        
        if (complexity > 3) {
            recommendations.push({
                type: 'complexity',
                message: 'High dependency complexity detected',
                action: 'Consider simplifying task dependencies'
            });
        }
        
        if (conflictRate > 0.1) {
            recommendations.push({
                type: 'conflicts',
                message: 'High conflict rate detected',
                action: 'Review and resolve dependency conflicts'
            });
        }
        
        if (circularRate > 0.05) {
            recommendations.push({
                type: 'circular_dependencies',
                message: 'Circular dependencies detected',
                action: 'Remove circular dependency chains'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate dependency ID
     */
    generateDependencyId(taskId, dependencyTaskId) {
        return `dep_${taskId}_${dependencyTaskId}_${Date.now()}`;
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
     * Start background processes
     */
    startBackgroundProcesses() {
        // Monitor dependencies
        setInterval(() => {
            this.monitorDependencies();
        }, 60000); // Every minute
        
        // Clean up old analytics
        setInterval(() => {
            this.cleanupAnalytics();
        }, 300000); // Every 5 minutes
    }

    /**
     * Monitor dependencies
     */
    monitorDependencies() {
        if (!this.config.monitoringEnabled) return;
        
        // Check for new conflicts
        const allTasks = Array.from(this.tasks.keys());
        if (allTasks.length > 0) {
            this.detectConflicts(allTasks, {}).then(conflicts => {
                if (conflicts.length > 0) {
                    console.log(`Detected ${conflicts.length} new conflicts`);
                }
            });
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
     * Stop the dependency system
     */
    stop() {
        this.isRunning = false;
        this.dependencyEngine.stop();
        this.conflictResolver.stop();
        this.criticalPathAnalyzer.stop();
        this.impactAnalyzer.stop();
    }
}

module.exports = IntegratedDependencySystem;
