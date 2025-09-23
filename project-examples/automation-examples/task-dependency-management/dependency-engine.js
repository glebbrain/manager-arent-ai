/**
 * Dependency Engine
 * Core logic for managing task dependencies
 */

class DependencyEngine {
    constructor(options = {}) {
        this.autoDetection = options.autoDetection || true;
        this.conflictResolution = options.conflictResolution || true;
        this.circularDependencyDetection = options.circularDependencyDetection || true;
        this.criticalPathAnalysis = options.criticalPathAnalysis || true;
        this.impactAnalysis = options.impactAnalysis || true;
        this.optimizationEnabled = options.optimizationEnabled || true;
        
        this.dependencies = new Map(); // taskId -> dependencies[]
        this.dependencyGraph = new Map(); // taskId -> Set of dependent taskIds
        this.reverseDependencyGraph = new Map(); // taskId -> Set of tasks that depend on it
        this.circularDependencies = new Set();
        this.isRunning = true;
    }

    /**
     * Add dependencies for a task
     */
    async addDependencies(taskId, dependencies, options = {}) {
        try {
            // Initialize task in maps if not exists
            if (!this.dependencies.has(taskId)) {
                this.dependencies.set(taskId, []);
                this.dependencyGraph.set(taskId, new Set());
                this.reverseDependencyGraph.set(taskId, new Set());
            }
            
            const currentDependencies = this.dependencies.get(taskId);
            const newDependencies = [];
            
            for (const dependency of dependencies) {
                // Check if dependency already exists
                const existingDep = currentDependencies.find(d => d.taskId === dependency.taskId);
                if (existingDep) {
                    // Update existing dependency
                    Object.assign(existingDep, dependency);
                    existingDep.updatedAt = new Date();
                } else {
                    // Add new dependency
                    const newDep = {
                        id: dependency.id || this.generateDependencyId(taskId, dependency.taskId),
                        taskId: dependency.taskId,
                        type: dependency.type || 'depends_on',
                        strength: dependency.strength || 1,
                        createdAt: new Date(),
                        ...dependency
                    };
                    
                    currentDependencies.push(newDep);
                    newDependencies.push(newDep);
                    
                    // Update dependency graphs
                    this.updateDependencyGraphs(taskId, dependency.taskId, 'add');
                }
            }
            
            // Check for circular dependencies
            if (this.circularDependencyDetection) {
                const circularDeps = await this.detectCircularDependencies([taskId], options);
                if (circularDeps.length > 0) {
                    console.warn(`Circular dependencies detected for task ${taskId}:`, circularDeps);
                }
            }
            
            return {
                taskId,
                dependencies: currentDependencies,
                newDependencies,
                totalDependencies: currentDependencies.length
            };
        } catch (error) {
            console.error('Error adding dependencies:', error);
            throw error;
        }
    }

    /**
     * Get dependencies for a task
     */
    getDependencies(taskId) {
        return this.dependencies.get(taskId) || [];
    }

    /**
     * Update dependencies for a task
     */
    async updateDependencies(taskId, dependencies, options = {}) {
        try {
            // Remove all existing dependencies
            await this.removeAllDependencies(taskId);
            
            // Add new dependencies
            return await this.addDependencies(taskId, dependencies, options);
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
            const currentDependencies = this.dependencies.get(taskId) || [];
            const remainingDependencies = [];
            const removedDependencies = [];
            
            for (const dep of currentDependencies) {
                if (dependencyIds.includes(dep.id)) {
                    removedDependencies.push(dep);
                    // Update dependency graphs
                    this.updateDependencyGraphs(taskId, dep.taskId, 'remove');
                } else {
                    remainingDependencies.push(dep);
                }
            }
            
            this.dependencies.set(taskId, remainingDependencies);
            
            return {
                taskId,
                removedDependencies,
                remainingDependencies,
                totalDependencies: remainingDependencies.length
            };
        } catch (error) {
            console.error('Error removing dependencies:', error);
            throw error;
        }
    }

    /**
     * Remove all dependencies for a task
     */
    async removeAllDependencies(taskId) {
        const currentDependencies = this.dependencies.get(taskId) || [];
        const dependencyIds = currentDependencies.map(dep => dep.id);
        
        if (dependencyIds.length > 0) {
            return await this.removeDependencies(taskId, dependencyIds);
        }
        
        return {
            taskId,
            removedDependencies: [],
            remainingDependencies: [],
            totalDependencies: 0
        };
    }

    /**
     * Detect circular dependencies
     */
    async detectCircularDependencies(taskIds, options = {}) {
        const circularDependencies = [];
        const visited = new Set();
        const recursionStack = new Set();
        
        for (const taskId of taskIds) {
            if (!visited.has(taskId)) {
                const circular = this.detectCircularDependenciesDFS(taskId, visited, recursionStack, []);
                circularDependencies.push(...circular);
            }
        }
        
        return circularDependencies;
    }

    /**
     * DFS to detect circular dependencies
     */
    detectCircularDependenciesDFS(taskId, visited, recursionStack, path) {
        const circularDependencies = [];
        
        visited.add(taskId);
        recursionStack.add(taskId);
        path.push(taskId);
        
        const dependencies = this.dependencies.get(taskId) || [];
        
        for (const dep of dependencies) {
            if (recursionStack.has(dep.taskId)) {
                // Circular dependency found
                const cycleStart = path.indexOf(dep.taskId);
                const cycle = path.slice(cycleStart);
                cycle.push(dep.taskId); // Complete the cycle
                
                circularDependencies.push({
                    cycle,
                    taskId,
                    dependencyTaskId: dep.taskId,
                    severity: 'high',
                    type: 'circular_dependency'
                });
                
                this.circularDependencies.add(cycle.join(' -> '));
            } else if (!visited.has(dep.taskId)) {
                const subCircular = this.detectCircularDependenciesDFS(
                    dep.taskId, visited, recursionStack, [...path]
                );
                circularDependencies.push(...subCircular);
            }
        }
        
        recursionStack.delete(taskId);
        return circularDependencies;
    }

    /**
     * Get all circular dependencies
     */
    getAllCircularDependencies() {
        return Array.from(this.circularDependencies);
    }

    /**
     * Check if task has circular dependencies
     */
    hasCircularDependencies(taskId) {
        const visited = new Set();
        const recursionStack = new Set();
        
        return this.detectCircularDependenciesDFS(taskId, visited, recursionStack, []).length > 0;
    }

    /**
     * Get dependency chain for a task
     */
    getDependencyChain(taskId, maxDepth = 10) {
        const chain = [];
        const visited = new Set();
        
        this.buildDependencyChain(taskId, chain, visited, 0, maxDepth);
        
        return chain;
    }

    /**
     * Build dependency chain recursively
     */
    buildDependencyChain(taskId, chain, visited, depth, maxDepth) {
        if (depth >= maxDepth || visited.has(taskId)) {
            return;
        }
        
        visited.add(taskId);
        const dependencies = this.dependencies.get(taskId) || [];
        
        for (const dep of dependencies) {
            chain.push({
                taskId: dep.taskId,
                dependency: dep,
                depth: depth + 1
            });
            
            this.buildDependencyChain(dep.taskId, chain, visited, depth + 1, maxDepth);
        }
    }

    /**
     * Get tasks that depend on a specific task
     */
    getDependentTasks(taskId) {
        return Array.from(this.reverseDependencyGraph.get(taskId) || []);
    }

    /**
     * Get tasks that a specific task depends on
     */
    getDependencyTasks(taskId) {
        const dependencies = this.dependencies.get(taskId) || [];
        return dependencies.map(dep => dep.taskId);
    }

    /**
     * Check if task A depends on task B
     */
    dependsOn(taskA, taskB) {
        const dependencies = this.dependencies.get(taskA) || [];
        return dependencies.some(dep => dep.taskId === taskB);
    }

    /**
     * Check if task A is a dependency of task B
     */
    isDependencyOf(taskA, taskB) {
        return this.dependsOn(taskB, taskA);
    }

    /**
     * Get dependency strength between two tasks
     */
    getDependencyStrength(taskA, taskB) {
        const dependencies = this.dependencies.get(taskA) || [];
        const dependency = dependencies.find(dep => dep.taskId === taskB);
        return dependency ? dependency.strength : 0;
    }

    /**
     * Get dependency type between two tasks
     */
    getDependencyType(taskA, taskB) {
        const dependencies = this.dependencies.get(taskA) || [];
        const dependency = dependencies.find(dep => dep.taskId === taskB);
        return dependency ? dependency.type : null;
    }

    /**
     * Find shortest path between two tasks
     */
    findShortestPath(taskA, taskB) {
        const queue = [{ taskId: taskA, path: [taskA] }];
        const visited = new Set();
        
        while (queue.length > 0) {
            const { taskId, path } = queue.shift();
            
            if (taskId === taskB) {
                return path;
            }
            
            if (visited.has(taskId)) {
                continue;
            }
            
            visited.add(taskId);
            
            const dependencies = this.dependencies.get(taskId) || [];
            for (const dep of dependencies) {
                if (!visited.has(dep.taskId)) {
                    queue.push({
                        taskId: dep.taskId,
                        path: [...path, dep.taskId]
                    });
                }
            }
        }
        
        return null; // No path found
    }

    /**
     * Get all paths between two tasks
     */
    getAllPaths(taskA, taskB, maxPaths = 10) {
        const paths = [];
        const visited = new Set();
        
        this.findAllPathsDFS(taskA, taskB, [taskA], paths, visited, maxPaths);
        
        return paths;
    }

    /**
     * DFS to find all paths between two tasks
     */
    findAllPathsDFS(current, target, path, paths, visited, maxPaths) {
        if (paths.length >= maxPaths) {
            return;
        }
        
        if (current === target) {
            paths.push([...path]);
            return;
        }
        
        if (visited.has(current)) {
            return;
        }
        
        visited.add(current);
        
        const dependencies = this.dependencies.get(current) || [];
        for (const dep of dependencies) {
            if (!visited.has(dep.taskId)) {
                path.push(dep.taskId);
                this.findAllPathsDFS(dep.taskId, target, path, paths, visited, maxPaths);
                path.pop();
            }
        }
        
        visited.delete(current);
    }

    /**
     * Get dependency statistics
     */
    getDependencyStatistics() {
        const totalTasks = this.dependencies.size;
        const totalDependencies = Array.from(this.dependencies.values())
            .reduce((sum, deps) => sum + deps.length, 0);
        
        const dependencyTypes = new Map();
        const strengthDistribution = { low: 0, medium: 0, high: 0 };
        
        for (const [taskId, dependencies] of this.dependencies) {
            for (const dep of dependencies) {
                // Count dependency types
                const type = dep.type || 'depends_on';
                dependencyTypes.set(type, (dependencyTypes.get(type) || 0) + 1);
                
                // Count strength distribution
                if (dep.strength <= 0.3) {
                    strengthDistribution.low++;
                } else if (dep.strength <= 0.7) {
                    strengthDistribution.medium++;
                } else {
                    strengthDistribution.high++;
                }
            }
        }
        
        return {
            totalTasks,
            totalDependencies,
            averageDependenciesPerTask: totalTasks > 0 ? totalDependencies / totalTasks : 0,
            dependencyTypes: Object.fromEntries(dependencyTypes),
            strengthDistribution,
            circularDependencies: this.circularDependencies.size
        };
    }

    /**
     * Validate dependency graph
     */
    validateDependencyGraph() {
        const issues = [];
        
        // Check for circular dependencies
        const circularDeps = this.detectCircularDependencies(
            Array.from(this.dependencies.keys())
        );
        
        if (circularDeps.length > 0) {
            issues.push({
                type: 'circular_dependencies',
                severity: 'high',
                count: circularDeps.length,
                message: 'Circular dependencies detected'
            });
        }
        
        // Check for orphaned dependencies
        const allTaskIds = new Set(this.dependencies.keys());
        const orphanedDependencies = [];
        
        for (const [taskId, dependencies] of this.dependencies) {
            for (const dep of dependencies) {
                if (!allTaskIds.has(dep.taskId)) {
                    orphanedDependencies.push({
                        taskId,
                        dependencyTaskId: dep.taskId,
                        dependencyId: dep.id
                    });
                }
            }
        }
        
        if (orphanedDependencies.length > 0) {
            issues.push({
                type: 'orphaned_dependencies',
                severity: 'medium',
                count: orphanedDependencies.length,
                message: 'Dependencies reference non-existent tasks',
                details: orphanedDependencies
            });
        }
        
        // Check for self-dependencies
        const selfDependencies = [];
        for (const [taskId, dependencies] of this.dependencies) {
            for (const dep of dependencies) {
                if (dep.taskId === taskId) {
                    selfDependencies.push({
                        taskId,
                        dependencyId: dep.id
                    });
                }
            }
        }
        
        if (selfDependencies.length > 0) {
            issues.push({
                type: 'self_dependencies',
                severity: 'medium',
                count: selfDependencies.length,
                message: 'Tasks depend on themselves',
                details: selfDependencies
            });
        }
        
        return {
            isValid: issues.length === 0,
            issues,
            statistics: this.getDependencyStatistics()
        };
    }

    /**
     * Update dependency graphs
     */
    updateDependencyGraphs(taskId, dependencyTaskId, action) {
        if (action === 'add') {
            // Add to dependency graph
            if (!this.dependencyGraph.has(taskId)) {
                this.dependencyGraph.set(taskId, new Set());
            }
            this.dependencyGraph.get(taskId).add(dependencyTaskId);
            
            // Add to reverse dependency graph
            if (!this.reverseDependencyGraph.has(dependencyTaskId)) {
                this.reverseDependencyGraph.set(dependencyTaskId, new Set());
            }
            this.reverseDependencyGraph.get(dependencyTaskId).add(taskId);
        } else if (action === 'remove') {
            // Remove from dependency graph
            if (this.dependencyGraph.has(taskId)) {
                this.dependencyGraph.get(taskId).delete(dependencyTaskId);
            }
            
            // Remove from reverse dependency graph
            if (this.reverseDependencyGraph.has(dependencyTaskId)) {
                this.reverseDependencyGraph.get(dependencyTaskId).delete(taskId);
            }
        }
    }

    /**
     * Generate dependency ID
     */
    generateDependencyId(taskId, dependencyTaskId) {
        return `dep_${taskId}_${dependencyTaskId}_${Date.now()}`;
    }

    /**
     * Clear all dependencies
     */
    clearAllDependencies() {
        this.dependencies.clear();
        this.dependencyGraph.clear();
        this.reverseDependencyGraph.clear();
        this.circularDependencies.clear();
    }

    /**
     * Export dependencies
     */
    exportDependencies(format = 'json') {
        const data = {
            dependencies: Object.fromEntries(this.dependencies),
            dependencyGraph: Object.fromEntries(
                Array.from(this.dependencyGraph.entries()).map(([k, v]) => [k, Array.from(v)])
            ),
            reverseDependencyGraph: Object.fromEntries(
                Array.from(this.reverseDependencyGraph.entries()).map(([k, v]) => [k, Array.from(v)])
            ),
            circularDependencies: Array.from(this.circularDependencies),
            statistics: this.getDependencyStatistics(),
            exportedAt: new Date()
        };
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.exportToCSV(data);
        }
        
        return data;
    }

    /**
     * Export to CSV format
     */
    exportToCSV(data) {
        let csv = 'TaskId,DependencyTaskId,Type,Strength,CreatedAt\n';
        
        for (const [taskId, dependencies] of Object.entries(data.dependencies)) {
            for (const dep of dependencies) {
                csv += `${taskId},${dep.taskId},${dep.type},${dep.strength},${dep.createdAt}\n`;
            }
        }
        
        return csv;
    }

    /**
     * Stop the dependency engine
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = DependencyEngine;
