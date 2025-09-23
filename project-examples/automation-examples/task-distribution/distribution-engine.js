/**
 * Automatic Task Distribution Engine
 * Intelligently distributes tasks among developers based on skills, workload, and preferences
 */

class TaskDistributionEngine {
    constructor(options = {}) {
        this.developers = new Map();
        this.tasks = new Map();
        this.distributionHistory = [];
        this.skillsMatrix = new Map();
        this.workloadThreshold = options.workloadThreshold || 0.8;
        this.balanceThreshold = options.balanceThreshold || 0.2;
        this.learningWeight = options.learningWeight || 0.3;
        this.efficiencyWeight = options.efficiencyWeight || 0.7;
        
        this.distributionStrategies = {
            'skill-based': this.distributeBySkill.bind(this),
            'workload-balanced': this.distributeByWorkload.bind(this),
            'learning-optimized': this.distributeByLearning.bind(this),
            'hybrid': this.distributeHybrid.bind(this)
        };
    }

    /**
     * Register a developer
     */
    registerDeveloper(developer) {
        const devId = developer.id || `dev_${Date.now()}`;
        this.developers.set(devId, {
            id: devId,
            name: developer.name,
            email: developer.email,
            skills: developer.skills || [],
            experience: developer.experience || {},
            availability: developer.availability || 1.0,
            preferences: developer.preferences || {},
            currentWorkload: 0,
            completedTasks: [],
            performance: {
                averageCompletionTime: 0,
                qualityScore: 0,
                efficiency: 0
            },
            learningGoals: developer.learningGoals || [],
            timezone: developer.timezone || 'UTC',
            workingHours: developer.workingHours || { start: 9, end: 17 },
            ...developer
        });
        
        this.updateSkillsMatrix(devId);
        return devId;
    }

    /**
     * Register a task
     */
    registerTask(task) {
        const taskId = task.id || `task_${Date.now()}`;
        this.tasks.set(taskId, {
            id: taskId,
            title: task.title,
            description: task.description,
            priority: task.priority || 'medium',
            complexity: task.complexity || 'medium',
            estimatedHours: task.estimatedHours || 8,
            requiredSkills: task.requiredSkills || [],
            preferredSkills: task.preferredSkills || [],
            dependencies: task.dependencies || [],
            deadline: task.deadline || null,
            project: task.project || null,
            type: task.type || 'development',
            tags: task.tags || [],
            difficulty: task.difficulty || 5,
            learningOpportunity: task.learningOpportunity || false,
            ...task
        });
        
        return taskId;
    }

    /**
     * Update skills matrix
     */
    updateSkillsMatrix(devId) {
        const developer = this.developers.get(devId);
        if (!developer) return;

        for (const skill of developer.skills) {
            if (!this.skillsMatrix.has(skill)) {
                this.skillsMatrix.set(skill, new Set());
            }
            this.skillsMatrix.get(skill).add(devId);
        }
    }

    /**
     * Distribute tasks among developers
     */
    distributeTasks(strategy = 'hybrid', options = {}) {
        const availableTasks = Array.from(this.tasks.values()).filter(task => !task.assignedTo);
        const availableDevelopers = Array.from(this.developers.values()).filter(dev => dev.availability > 0);
        
        if (availableTasks.length === 0) {
            return { success: false, message: 'No available tasks to distribute' };
        }
        
        if (availableDevelopers.length === 0) {
            return { success: false, message: 'No available developers' };
        }

        const distributionFunction = this.distributionStrategies[strategy];
        if (!distributionFunction) {
            throw new Error(`Unknown distribution strategy: ${strategy}`);
        }

        const distribution = distributionFunction(availableTasks, availableDevelopers, options);
        this.applyDistribution(distribution);
        
        return {
            success: true,
            distribution,
            summary: this.generateDistributionSummary(distribution)
        };
    }

    /**
     * Distribute by skill matching
     */
    distributeBySkill(tasks, developers, options = {}) {
        const distribution = [];
        const assignedTasks = new Set();
        const developerWorkload = new Map();
        
        // Initialize workload tracking
        developers.forEach(dev => {
            developerWorkload.set(dev.id, dev.currentWorkload);
        });

        // Sort tasks by priority and complexity
        const sortedTasks = tasks.sort((a, b) => {
            const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            const complexityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return complexityOrder[b.complexity] - complexityOrder[a.complexity];
        });

        for (const task of sortedTasks) {
            if (assignedTasks.has(task.id)) continue;

            const bestMatch = this.findBestSkillMatch(task, developers, developerWorkload);
            if (bestMatch) {
                distribution.push({
                    taskId: task.id,
                    developerId: bestMatch.developer.id,
                    confidence: bestMatch.confidence,
                    reason: bestMatch.reason,
                    estimatedCompletion: this.calculateEstimatedCompletion(task, bestMatch.developer)
                });
                
                assignedTasks.add(task.id);
                developerWorkload.set(bestMatch.developer.id, 
                    developerWorkload.get(bestMatch.developer.id) + task.estimatedHours);
            }
        }

        return distribution;
    }

    /**
     * Distribute by workload balancing
     */
    distributeByWorkload(tasks, developers, options = {}) {
        const distribution = [];
        const assignedTasks = new Set();
        const developerWorkload = new Map();
        
        developers.forEach(dev => {
            developerWorkload.set(dev.id, dev.currentWorkload);
        });

        // Sort developers by current workload
        const sortedDevelopers = developers.sort((a, b) => 
            developerWorkload.get(a.id) - developerWorkload.get(b.id)
        );

        for (const task of tasks) {
            if (assignedTasks.has(task.id)) continue;

            // Find developer with lowest workload who can handle the task
            const suitableDeveloper = sortedDevelopers.find(dev => 
                this.canHandleTask(dev, task) && 
                developerWorkload.get(dev.id) + task.estimatedHours <= this.workloadThreshold * 40
            );

            if (suitableDeveloper) {
                distribution.push({
                    taskId: task.id,
                    developerId: suitableDeveloper.id,
                    confidence: 0.8,
                    reason: 'Workload balancing',
                    estimatedCompletion: this.calculateEstimatedCompletion(task, suitableDeveloper)
                });
                
                assignedTasks.add(task.id);
                developerWorkload.set(suitableDeveloper.id, 
                    developerWorkload.get(suitableDeveloper.id) + task.estimatedHours);
            }
        }

        return distribution;
    }

    /**
     * Distribute by learning optimization
     */
    distributeByLearning(tasks, developers, options = {}) {
        const distribution = [];
        const assignedTasks = new Set();
        const developerWorkload = new Map();
        
        developers.forEach(dev => {
            developerWorkload.set(dev.id, dev.currentWorkload);
        });

        // Sort tasks by learning opportunity
        const sortedTasks = tasks.sort((a, b) => {
            if (a.learningOpportunity !== b.learningOpportunity) {
                return b.learningOpportunity - a.learningOpportunity;
            }
            return b.difficulty - a.difficulty;
        });

        for (const task of sortedTasks) {
            if (assignedTasks.has(task.id)) continue;

            const bestLearningMatch = this.findBestLearningMatch(task, developers, developerWorkload);
            if (bestLearningMatch) {
                distribution.push({
                    taskId: task.id,
                    developerId: bestLearningMatch.developer.id,
                    confidence: bestLearningMatch.confidence,
                    reason: bestLearningMatch.reason,
                    estimatedCompletion: this.calculateEstimatedCompletion(task, bestLearningMatch.developer)
                });
                
                assignedTasks.add(task.id);
                developerWorkload.set(bestLearningMatch.developer.id, 
                    developerWorkload.get(bestLearningMatch.developer.id) + task.estimatedHours);
            }
        }

        return distribution;
    }

    /**
     * Hybrid distribution strategy
     */
    distributeHybrid(tasks, developers, options = {}) {
        const distribution = [];
        const assignedTasks = new Set();
        const developerWorkload = new Map();
        
        developers.forEach(dev => {
            developerWorkload.set(dev.id, dev.currentWorkload);
        });

        // Sort tasks by priority and learning opportunity
        const sortedTasks = tasks.sort((a, b) => {
            const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            const priorityScore = priorityOrder[b.priority] - priorityOrder[a.priority];
            const learningScore = (b.learningOpportunity ? 1 : 0) - (a.learningOpportunity ? 1 : 0);
            return priorityScore * 2 + learningScore;
        });

        for (const task of sortedTasks) {
            if (assignedTasks.has(task.id)) continue;

            // Try skill-based matching first
            let bestMatch = this.findBestSkillMatch(task, developers, developerWorkload);
            
            // If no good skill match, try learning-based
            if (!bestMatch || bestMatch.confidence < 0.6) {
                const learningMatch = this.findBestLearningMatch(task, developers, developerWorkload);
                if (learningMatch && learningMatch.confidence > bestMatch?.confidence) {
                    bestMatch = learningMatch;
                }
            }

            // If still no good match, try workload balancing
            if (!bestMatch || bestMatch.confidence < 0.4) {
                const workloadMatch = this.findBestWorkloadMatch(task, developers, developerWorkload);
                if (workloadMatch) {
                    bestMatch = workloadMatch;
                }
            }

            if (bestMatch) {
                distribution.push({
                    taskId: task.id,
                    developerId: bestMatch.developer.id,
                    confidence: bestMatch.confidence,
                    reason: bestMatch.reason,
                    estimatedCompletion: this.calculateEstimatedCompletion(task, bestMatch.developer)
                });
                
                assignedTasks.add(task.id);
                developerWorkload.set(bestMatch.developer.id, 
                    developerWorkload.get(bestMatch.developer.id) + task.estimatedHours);
            }
        }

        return distribution;
    }

    /**
     * Find best skill match for a task
     */
    findBestSkillMatch(task, developers, developerWorkload) {
        let bestMatch = null;
        let bestScore = 0;

        for (const developer of developers) {
            if (developerWorkload.get(developer.id) + task.estimatedHours > this.workloadThreshold * 40) {
                continue;
            }

            const skillScore = this.calculateSkillMatch(task, developer);
            const workloadScore = 1 - (developerWorkload.get(developer.id) / (this.workloadThreshold * 40));
            const experienceScore = this.calculateExperienceMatch(task, developer);
            
            const totalScore = (skillScore * 0.5) + (workloadScore * 0.3) + (experienceScore * 0.2);
            
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMatch = {
                    developer,
                    confidence: totalScore,
                    reason: `Skill match: ${skillScore.toFixed(2)}, Workload: ${workloadScore.toFixed(2)}`
                };
            }
        }

        return bestMatch;
    }

    /**
     * Find best learning match for a task
     */
    findBestLearningMatch(task, developers, developerWorkload) {
        let bestMatch = null;
        let bestScore = 0;

        for (const developer of developers) {
            if (developerWorkload.get(developer.id) + task.estimatedHours > this.workloadThreshold * 40) {
                continue;
            }

            const learningScore = this.calculateLearningOpportunity(task, developer);
            const skillGap = this.calculateSkillGap(task, developer);
            const workloadScore = 1 - (developerWorkload.get(developer.id) / (this.workloadThreshold * 40));
            
            const totalScore = (learningScore * 0.4) + (skillGap * 0.4) + (workloadScore * 0.2);
            
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMatch = {
                    developer,
                    confidence: totalScore,
                    reason: `Learning opportunity: ${learningScore.toFixed(2)}, Skill gap: ${skillGap.toFixed(2)}`
                };
            }
        }

        return bestMatch;
    }

    /**
     * Find best workload match for a task
     */
    findBestWorkloadMatch(task, developers, developerWorkload) {
        const sortedDevelopers = developers
            .filter(dev => this.canHandleTask(dev, task))
            .sort((a, b) => developerWorkload.get(a.id) - developerWorkload.get(b.id));

        if (sortedDevelopers.length === 0) return null;

        const developer = sortedDevelopers[0];
        return {
            developer,
            confidence: 0.6,
            reason: 'Workload balancing'
        };
    }

    /**
     * Calculate skill match score
     */
    calculateSkillMatch(task, developer) {
        const requiredSkills = task.requiredSkills || [];
        const preferredSkills = task.preferredSkills || [];
        const developerSkills = developer.skills || [];

        if (requiredSkills.length === 0) return 1.0;

        const requiredMatch = requiredSkills.filter(skill => 
            developerSkills.some(devSkill => 
                devSkill.name === skill || devSkill.name === skill.name
            )
        ).length / requiredSkills.length;

        const preferredMatch = preferredSkills.length > 0 ? 
            preferredSkills.filter(skill => 
                developerSkills.some(devSkill => 
                    devSkill.name === skill || devSkill.name === skill.name
                )
            ).length / preferredSkills.length : 1.0;

        return (requiredMatch * 0.7) + (preferredMatch * 0.3);
    }

    /**
     * Calculate experience match score
     */
    calculateExperienceMatch(task, developer) {
        const taskType = task.type || 'development';
        const experience = developer.experience[taskType] || 0;
        const maxExperience = 10; // Assuming 10 is max experience level
        
        return Math.min(experience / maxExperience, 1.0);
    }

    /**
     * Calculate learning opportunity score
     */
    calculateLearningOpportunity(task, developer) {
        if (!task.learningOpportunity) return 0;

        const requiredSkills = task.requiredSkills || [];
        const developerSkills = developer.skills || [];
        const learningGoals = developer.learningGoals || [];

        // Check if task skills align with learning goals
        const goalAlignment = learningGoals.filter(goal => 
            requiredSkills.some(skill => 
                skill === goal || skill.name === goal
            )
        ).length / Math.max(learningGoals.length, 1);

        // Check skill gap (skills developer doesn't have but task requires)
        const skillGap = requiredSkills.filter(skill => 
            !developerSkills.some(devSkill => 
                devSkill.name === skill || devSkill.name === skill.name
            )
        ).length / Math.max(requiredSkills.length, 1);

        return (goalAlignment * 0.6) + (skillGap * 0.4);
    }

    /**
     * Calculate skill gap score
     */
    calculateSkillGap(task, developer) {
        const requiredSkills = task.requiredSkills || [];
        const developerSkills = developer.skills || [];

        if (requiredSkills.length === 0) return 0;

        const missingSkills = requiredSkills.filter(skill => 
            !developerSkills.some(devSkill => 
                devSkill.name === skill || devSkill.name === skill.name
            )
        );

        return missingSkills.length / requiredSkills.length;
    }

    /**
     * Check if developer can handle task
     */
    canHandleTask(developer, task) {
        const requiredSkills = task.requiredSkills || [];
        const developerSkills = developer.skills || [];

        // Check if developer has all required skills
        const hasRequiredSkills = requiredSkills.every(skill => 
            developerSkills.some(devSkill => 
                devSkill.name === skill || devSkill.name === skill.name
            )
        );

        // Check workload capacity
        const hasCapacity = developer.currentWorkload + task.estimatedHours <= 
            this.workloadThreshold * 40;

        return hasRequiredSkills && hasCapacity;
    }

    /**
     * Calculate estimated completion time
     */
    calculateEstimatedCompletion(task, developer) {
        const baseHours = task.estimatedHours || 8;
        const skillMultiplier = this.calculateSkillMatch(task, developer);
        const experienceMultiplier = this.calculateExperienceMatch(task, developer);
        
        // Adjust based on skill and experience
        const adjustedHours = baseHours * (2 - skillMultiplier) * (1.5 - experienceMultiplier * 0.5);
        
        // Add buffer for learning opportunities
        if (task.learningOpportunity) {
            const learningGap = this.calculateSkillGap(task, developer);
            adjustedHours *= (1 + learningGap * 0.5);
        }

        return Math.max(adjustedHours, baseHours * 0.5);
    }

    /**
     * Apply distribution to tasks and developers
     */
    applyDistribution(distribution) {
        for (const assignment of distribution) {
            const task = this.tasks.get(assignment.taskId);
            const developer = this.developers.get(assignment.developerId);
            
            if (task && developer) {
                task.assignedTo = assignment.developerId;
                task.assignedAt = new Date();
                task.estimatedCompletion = assignment.estimatedCompletion;
                
                developer.currentWorkload += task.estimatedHours;
                developer.assignedTasks = developer.assignedTasks || [];
                developer.assignedTasks.push(assignment.taskId);
            }
        }

        this.distributionHistory.push({
            timestamp: new Date(),
            distribution,
            strategy: 'hybrid'
        });
    }

    /**
     * Generate distribution summary
     */
    generateDistributionSummary(distribution) {
        const summary = {
            totalTasks: distribution.length,
            totalDevelopers: new Set(distribution.map(d => d.developerId)).size,
            averageConfidence: distribution.reduce((sum, d) => sum + d.confidence, 0) / distribution.length,
            workloadDistribution: {},
            skillUtilization: {},
            learningOpportunities: 0
        };

        // Calculate workload distribution
        for (const assignment of distribution) {
            const devId = assignment.developerId;
            if (!summary.workloadDistribution[devId]) {
                summary.workloadDistribution[devId] = 0;
            }
            summary.workloadDistribution[devId] += assignment.estimatedCompletion;
        }

        // Calculate skill utilization
        for (const assignment of distribution) {
            const task = this.tasks.get(assignment.taskId);
            if (task && task.learningOpportunity) {
                summary.learningOpportunities++;
            }
        }

        return summary;
    }

    /**
     * Get distribution analytics
     */
    getAnalytics() {
        const analytics = {
            totalDevelopers: this.developers.size,
            totalTasks: this.tasks.size,
            assignedTasks: Array.from(this.tasks.values()).filter(t => t.assignedTo).length,
            averageWorkload: 0,
            skillCoverage: {},
            distributionHistory: this.distributionHistory.length,
            performance: {}
        };

        // Calculate average workload
        const totalWorkload = Array.from(this.developers.values())
            .reduce((sum, dev) => sum + dev.currentWorkload, 0);
        analytics.averageWorkload = totalWorkload / this.developers.size;

        // Calculate skill coverage
        for (const [skill, developers] of this.skillsMatrix) {
            analytics.skillCoverage[skill] = developers.size;
        }

        return analytics;
    }

    /**
     * Optimize distribution
     */
    optimizeDistribution() {
        // Rebalance workload
        this.rebalanceWorkload();
        
        // Optimize skill utilization
        this.optimizeSkillUtilization();
        
        // Balance learning opportunities
        this.balanceLearningOpportunities();
    }

    /**
     * Rebalance workload
     */
    rebalanceWorkload() {
        const developers = Array.from(this.developers.values());
        const averageWorkload = developers.reduce((sum, dev) => sum + dev.currentWorkload, 0) / developers.size;
        
        for (const developer of developers) {
            if (developer.currentWorkload > averageWorkload * (1 + this.balanceThreshold)) {
                // Move some tasks to less loaded developers
                this.redistributeTasks(developer.id);
            }
        }
    }

    /**
     * Optimize skill utilization
     */
    optimizeSkillUtilization() {
        // Implementation for skill utilization optimization
        // This would involve analyzing current assignments and suggesting improvements
    }

    /**
     * Balance learning opportunities
     */
    balanceLearningOpportunities() {
        // Implementation for balancing learning opportunities
        // This would ensure all developers get appropriate learning tasks
    }

    /**
     * Redistribute tasks for a developer
     */
    redistributeTasks(developerId) {
        const developer = this.developers.get(developerId);
        if (!developer || !developer.assignedTasks) return;

        const tasksToRedistribute = developer.assignedTasks.slice(0, Math.floor(developer.assignedTasks.length / 2));
        
        for (const taskId of tasksToRedistribute) {
            const task = this.tasks.get(taskId);
            if (task) {
                task.assignedTo = null;
                developer.currentWorkload -= task.estimatedHours;
                developer.assignedTasks = developer.assignedTasks.filter(id => id !== taskId);
            }
        }

        // Redistribute these tasks
        this.distributeTasks('hybrid');
    }
}

module.exports = TaskDistributionEngine;
