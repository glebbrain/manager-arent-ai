/**
 * Critical Path Analyzer
 * Analyzes and manages critical paths in task dependencies
 */

class CriticalPathAnalyzer {
    constructor(options = {}) {
        this.enabled = options.criticalPathAnalysis || true;
        this.algorithm = options.algorithm || 'longest_path';
        this.criticalPaths = new Map();
        this.criticalTasks = new Set();
        this.isRunning = true;
    }

    /**
     * Analyze critical paths for given tasks
     */
    analyzeCriticalPaths(taskIds, options = {}) {
        const { projectId } = options;
        
        const criticalPaths = [];
        const visited = new Set();
        
        for (const taskId of taskIds) {
            if (!visited.has(taskId)) {
                const paths = this.findCriticalPathsFromTask(taskId, taskIds);
                criticalPaths.push(...paths);
                
                // Mark tasks as visited
                paths.forEach(path => {
                    path.forEach(task => visited.add(task));
                });
            }
        }
        
        // Store critical paths
        const analysisId = this.generateAnalysisId(taskIds, projectId);
        this.criticalPaths.set(analysisId, {
            taskIds,
            projectId,
            criticalPaths,
            analyzedAt: new Date(),
            totalPaths: criticalPaths.length,
            longestPath: this.findLongestPath(criticalPaths),
            criticalTasks: this.extractCriticalTasks(criticalPaths)
        });
        
        return criticalPaths;
    }

    /**
     * Get critical path for given tasks
     */
    getCriticalPath(options = {}) {
        const { projectId, taskIds } = options;
        
        if (taskIds && taskIds.length > 0) {
            const analysisId = this.generateAnalysisId(taskIds, projectId);
            const analysis = this.criticalPaths.get(analysisId);
            
            if (analysis) {
                return analysis.longestPath;
            }
        }
        
        // Find the longest critical path across all analyses
        let longestPath = [];
        let maxLength = 0;
        
        for (const [analysisId, analysis] of this.criticalPaths) {
            if (analysis.longestPath.length > maxLength) {
                longestPath = analysis.longestPath;
                maxLength = longestPath.length;
            }
        }
        
        return longestPath;
    }

    /**
     * Get all critical paths
     */
    getAllCriticalPaths() {
        const allPaths = [];
        
        for (const [analysisId, analysis] of this.criticalPaths) {
            allPaths.push(...analysis.criticalPaths);
        }
        
        return allPaths;
    }

    /**
     * Find critical paths from a specific task
     */
    findCriticalPathsFromTask(startTaskId, allTaskIds) {
        const paths = [];
        const visited = new Set();
        
        this.findPathsDFS(startTaskId, allTaskIds, [startTaskId], paths, visited);
        
        // Filter to only include paths that are critical (longest paths)
        const maxLength = Math.max(...paths.map(path => path.length));
        return paths.filter(path => path.length === maxLength);
    }

    /**
     * DFS to find all paths from a task
     */
    findPathsDFS(currentTaskId, allTaskIds, currentPath, allPaths, visited) {
        // Check if current path is complete (no more dependencies)
        const hasDependencies = this.hasDependencies(currentTaskId, allTaskIds);
        
        if (!hasDependencies || currentPath.length > 20) { // Prevent infinite recursion
            allPaths.push([...currentPath]);
            return;
        }
        
        if (visited.has(currentTaskId)) {
            return; // Avoid cycles
        }
        
        visited.add(currentTaskId);
        
        const dependencies = this.getDependencies(currentTaskId, allTaskIds);
        
        for (const depTaskId of dependencies) {
            if (!currentPath.includes(depTaskId)) {
                currentPath.push(depTaskId);
                this.findPathsDFS(depTaskId, allTaskIds, currentPath, allPaths, visited);
                currentPath.pop();
            }
        }
        
        visited.delete(currentTaskId);
    }

    /**
     * Find the longest path from a list of paths
     */
    findLongestPath(paths) {
        if (paths.length === 0) return [];
        
        return paths.reduce((longest, current) => 
            current.length > longest.length ? current : longest, paths[0]
        );
    }

    /**
     * Extract critical tasks from paths
     */
    extractCriticalTasks(paths) {
        const taskFrequency = new Map();
        
        // Count how many times each task appears in critical paths
        for (const path of paths) {
            for (const taskId of path) {
                taskFrequency.set(taskId, (taskFrequency.get(taskId) || 0) + 1);
            }
        }
        
        // Tasks that appear in all critical paths are most critical
        const criticalTasks = [];
        const totalPaths = paths.length;
        
        for (const [taskId, frequency] of taskFrequency) {
            if (frequency === totalPaths) {
                criticalTasks.push({
                    taskId,
                    frequency,
                    criticality: 'high'
                });
            } else if (frequency > totalPaths * 0.5) {
                criticalTasks.push({
                    taskId,
                    frequency,
                    criticality: 'medium'
                });
            }
        }
        
        return criticalTasks.sort((a, b) => b.frequency - a.frequency);
    }

    /**
     * Check if task has dependencies
     */
    hasDependencies(taskId, allTaskIds) {
        // This would typically check against a dependency engine
        // For now, simulate some dependencies
        const mockDependencies = {
            'task_1': ['task_2', 'task_3'],
            'task_2': ['task_4'],
            'task_3': ['task_4'],
            'task_4': ['task_5'],
            'task_5': []
        };
        
        const deps = mockDependencies[taskId] || [];
        return deps.some(dep => allTaskIds.includes(dep));
    }

    /**
     * Get dependencies for a task
     */
    getDependencies(taskId, allTaskIds) {
        // This would typically query a dependency engine
        // For now, simulate some dependencies
        const mockDependencies = {
            'task_1': ['task_2', 'task_3'],
            'task_2': ['task_4'],
            'task_3': ['task_4'],
            'task_4': ['task_5'],
            'task_5': []
        };
        
        const deps = mockDependencies[taskId] || [];
        return deps.filter(dep => allTaskIds.includes(dep));
    }

    /**
     * Calculate critical path metrics
     */
    calculateCriticalPathMetrics(taskIds, projectId) {
        const analysisId = this.generateAnalysisId(taskIds, projectId);
        const analysis = this.criticalPaths.get(analysisId);
        
        if (!analysis) {
            return null;
        }
        
        const { criticalPaths, longestPath } = analysis;
        
        return {
            totalCriticalPaths: criticalPaths.length,
            longestPathLength: longestPath.length,
            averagePathLength: criticalPaths.reduce((sum, path) => sum + path.length, 0) / criticalPaths.length,
            criticalTasks: analysis.criticalTasks,
            pathComplexity: this.calculatePathComplexity(criticalPaths),
            bottleneckTasks: this.identifyBottleneckTasks(criticalPaths),
            recommendations: this.generateCriticalPathRecommendations(analysis)
        };
    }

    /**
     * Calculate path complexity
     */
    calculatePathComplexity(paths) {
        if (paths.length === 0) return 0;
        
        const totalTasks = new Set();
        paths.forEach(path => {
            path.forEach(task => totalTasks.add(task));
        });
        
        const uniqueTasks = totalTasks.size;
        const totalPathLength = paths.reduce((sum, path) => sum + path.length, 0);
        
        // Complexity is ratio of unique tasks to total path length
        return uniqueTasks / totalPathLength;
    }

    /**
     * Identify bottleneck tasks
     */
    identifyBottleneckTasks(paths) {
        const taskFrequency = new Map();
        
        // Count task frequency across all paths
        for (const path of paths) {
            for (const taskId of path) {
                taskFrequency.set(taskId, (taskFrequency.get(taskId) || 0) + 1);
            }
        }
        
        // Tasks that appear in most paths are bottlenecks
        const totalPaths = paths.length;
        const bottlenecks = [];
        
        for (const [taskId, frequency] of taskFrequency) {
            if (frequency >= totalPaths * 0.8) { // Appears in 80%+ of paths
                bottlenecks.push({
                    taskId,
                    frequency,
                    bottleneckScore: frequency / totalPaths
                });
            }
        }
        
        return bottlenecks.sort((a, b) => b.bottleneckScore - a.bottleneckScore);
    }

    /**
     * Generate critical path recommendations
     */
    generateCriticalPathRecommendations(analysis) {
        const recommendations = [];
        const { criticalPaths, longestPath, criticalTasks } = analysis;
        
        // Long path recommendation
        if (longestPath.length > 10) {
            recommendations.push({
                type: 'path_length',
                priority: 'high',
                message: 'Critical path is very long',
                suggestion: 'Consider breaking down tasks into smaller, more manageable pieces',
                impact: 'Reduces risk and improves project flexibility'
            });
        }
        
        // Bottleneck recommendation
        const bottlenecks = this.identifyBottleneckTasks(criticalPaths);
        if (bottlenecks.length > 0) {
            recommendations.push({
                type: 'bottleneck',
                priority: 'high',
                message: `${bottlenecks.length} bottleneck tasks identified`,
                suggestion: 'Focus resources on bottleneck tasks to improve overall project flow',
                impact: 'Reduces project delays and improves efficiency'
            });
        }
        
        // High criticality tasks
        const highCriticalTasks = criticalTasks.filter(task => task.criticality === 'high');
        if (highCriticalTasks.length > 0) {
            recommendations.push({
                type: 'critical_tasks',
                priority: 'medium',
                message: `${highCriticalTasks.length} highly critical tasks identified`,
                suggestion: 'Ensure adequate resources and monitoring for critical tasks',
                impact: 'Reduces risk of project delays'
            });
        }
        
        // Path complexity
        const complexity = this.calculatePathComplexity(criticalPaths);
        if (complexity < 0.3) {
            recommendations.push({
                type: 'complexity',
                priority: 'low',
                message: 'Low path complexity detected',
                suggestion: 'Consider adding more parallel work streams',
                impact: 'Improves project efficiency and reduces dependencies'
            });
        }
        
        return recommendations;
    }

    /**
     * Optimize critical path
     */
    optimizeCriticalPath(taskIds, projectId, options = {}) {
        const { optimizationType = 'comprehensive' } = options;
        
        const analysisId = this.generateAnalysisId(taskIds, projectId);
        const analysis = this.criticalPaths.get(analysisId);
        
        if (!analysis) {
            return null;
        }
        
        const optimizations = [];
        
        switch (optimizationType) {
            case 'parallel_execution':
                optimizations.push(...this.optimizeForParallelExecution(analysis));
                break;
            case 'resource_allocation':
                optimizations.push(...this.optimizeResourceAllocation(analysis));
                break;
            case 'task_breakdown':
                optimizations.push(...this.optimizeTaskBreakdown(analysis));
                break;
            case 'comprehensive':
                optimizations.push(...this.optimizeForParallelExecution(analysis));
                optimizations.push(...this.optimizeResourceAllocation(analysis));
                optimizations.push(...this.optimizeTaskBreakdown(analysis));
                break;
        }
        
        return {
            analysisId,
            optimizations,
            estimatedImprovement: this.calculateOptimizationImprovement(optimizations),
            appliedAt: new Date()
        };
    }

    /**
     * Optimize for parallel execution
     */
    optimizeForParallelExecution(analysis) {
        const optimizations = [];
        const { criticalPaths } = analysis;
        
        // Find tasks that can be parallelized
        for (const path of criticalPaths) {
            for (let i = 0; i < path.length - 1; i++) {
                const currentTask = path[i];
                const nextTask = path[i + 1];
                
                // Check if tasks can run in parallel
                if (this.canRunInParallel(currentTask, nextTask)) {
                    optimizations.push({
                        type: 'parallel_execution',
                        tasks: [currentTask, nextTask],
                        description: `Enable parallel execution of ${currentTask} and ${nextTask}`,
                        estimatedTimeSavings: '2-4 hours',
                        priority: 'medium'
                    });
                }
            }
        }
        
        return optimizations;
    }

    /**
     * Optimize resource allocation
     */
    optimizeResourceAllocation(analysis) {
        const optimizations = [];
        const { criticalTasks } = analysis;
        
        // Focus resources on critical tasks
        for (const task of criticalTasks) {
            if (task.criticality === 'high') {
                optimizations.push({
                    type: 'resource_allocation',
                    taskId: task.taskId,
                    description: `Allocate additional resources to critical task ${task.taskId}`,
                    estimatedTimeSavings: '1-2 days',
                    priority: 'high'
                });
            }
        }
        
        return optimizations;
    }

    /**
     * Optimize task breakdown
     */
    optimizeTaskBreakdown(analysis) {
        const optimizations = [];
        const { longestPath } = analysis;
        
        // Identify tasks that can be broken down
        for (const taskId of longestPath) {
            if (this.canBreakDownTask(taskId)) {
                optimizations.push({
                    type: 'task_breakdown',
                    taskId,
                    description: `Break down task ${taskId} into smaller subtasks`,
                    estimatedTimeSavings: '1-3 days',
                    priority: 'medium'
                });
            }
        }
        
        return optimizations;
    }

    /**
     * Check if tasks can run in parallel
     */
    canRunInParallel(task1, task2) {
        // This would typically check task dependencies and resource requirements
        // For now, simulate some logic
        const parallelizablePairs = [
            ['task_2', 'task_3'],
            ['task_4', 'task_5']
        ];
        
        return parallelizablePairs.some(pair => 
            (pair[0] === task1 && pair[1] === task2) ||
            (pair[0] === task2 && pair[1] === task1)
        );
    }

    /**
     * Check if task can be broken down
     */
    canBreakDownTask(taskId) {
        // This would typically check task complexity and size
        // For now, simulate some logic
        const breakableTasks = ['task_1', 'task_4'];
        return breakableTasks.includes(taskId);
    }

    /**
     * Calculate optimization improvement
     */
    calculateOptimizationImprovement(optimizations) {
        let totalImprovement = 0;
        
        for (const opt of optimizations) {
            switch (opt.type) {
                case 'parallel_execution':
                    totalImprovement += 0.1; // 10% improvement
                    break;
                case 'resource_allocation':
                    totalImprovement += 0.2; // 20% improvement
                    break;
                case 'task_breakdown':
                    totalImprovement += 0.15; // 15% improvement
                    break;
            }
        }
        
        return Math.min(1, totalImprovement); // Cap at 100%
    }

    /**
     * Generate analysis ID
     */
    generateAnalysisId(taskIds, projectId) {
        const sortedTaskIds = [...taskIds].sort();
        return `analysis_${projectId || 'default'}_${sortedTaskIds.join('_')}_${Date.now()}`;
    }

    /**
     * Get critical path statistics
     */
    getCriticalPathStatistics() {
        const totalAnalyses = this.criticalPaths.size;
        const totalPaths = Array.from(this.criticalPaths.values())
            .reduce((sum, analysis) => sum + analysis.totalPaths, 0);
        
        const pathLengths = [];
        for (const [analysisId, analysis] of this.criticalPaths) {
            pathLengths.push(...analysis.criticalPaths.map(path => path.length));
        }
        
        const averagePathLength = pathLengths.length > 0 ? 
            pathLengths.reduce((sum, length) => sum + length, 0) / pathLengths.length : 0;
        
        const maxPathLength = pathLengths.length > 0 ? Math.max(...pathLengths) : 0;
        
        return {
            totalAnalyses,
            totalPaths,
            averagePathLength,
            maxPathLength,
            criticalTasksCount: this.criticalTasks.size
        };
    }

    /**
     * Clear old analyses
     */
    clearOldAnalyses(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
        const cutoffTime = Date.now() - maxAge;
        
        for (const [analysisId, analysis] of this.criticalPaths) {
            if (analysis.analyzedAt.getTime() < cutoffTime) {
                this.criticalPaths.delete(analysisId);
            }
        }
    }

    /**
     * Stop the critical path analyzer
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = CriticalPathAnalyzer;
