/**
 * Sprint Planning Engine
 * Core logic for sprint planning and task allocation
 */

class SprintPlanningEngine {
    constructor(options = {}) {
        this.sprintDuration = options.sprintDuration || 14; // days
        this.workingDaysPerWeek = options.workingDaysPerWeek || 5;
        this.workingHoursPerDay = options.workingHoursPerDay || 8;
        this.capacityBuffer = options.capacityBuffer || 0.2; // 20% buffer
        this.velocityWindow = options.velocityWindow || 3; // sprints
        this.confidenceThreshold = options.confidenceThreshold || 0.7;
        
        this.isRunning = true;
    }

    /**
     * Plan a sprint
     */
    async planSprint(params) {
        const {
            projectId,
            teamId,
            sprintNumber,
            startDate,
            endDate,
            goals,
            constraints = {},
            capacity,
            velocity,
            availableTasks,
            options = {}
        } = params;
        
        try {
            // Calculate sprint capacity
            const sprintCapacity = this.calculateSprintCapacity(capacity, startDate, endDate);
            
            // Filter and prioritize tasks
            const prioritizedTasks = this.prioritizeTasks(availableTasks, goals, constraints);
            
            // Select tasks for sprint
            const selectedTasks = this.selectTasksForSprint(
                prioritizedTasks,
                sprintCapacity,
                velocity,
                constraints
            );
            
            // Assign tasks to team members
            const assignedTasks = this.assignTasks(selectedTasks, capacity.teamMembers);
            
            // Create sprint plan
            const sprintPlan = {
                id: this.generateSprintId(projectId, teamId, sprintNumber),
                projectId,
                teamId,
                sprintNumber,
                startDate,
                endDate,
                duration: this.calculateDuration(startDate, endDate),
                goals,
                capacity: sprintCapacity,
                velocity: velocity.estimated,
                tasks: assignedTasks,
                ceremonies: this.planCeremonies(startDate, endDate, options.ceremonies),
                risks: this.identifyRisks(assignedTasks, constraints),
                dependencies: this.identifyDependencies(assignedTasks),
                milestones: this.createMilestones(assignedTasks, startDate, endDate),
                status: 'planned',
                createdAt: new Date(),
                confidence: this.calculateConfidence(assignedTasks, velocity, constraints),
                metadata: {
                    planningMethod: 'standard',
                    aiOptimized: false,
                    optimizationScore: 0
                }
            };
            
            return sprintPlan;
        } catch (error) {
            console.error('Error in sprint planning:', error);
            throw error;
        }
    }

    /**
     * Optimize sprint plan
     */
    async optimizeSprint(sprintPlan, optimizationType = 'comprehensive') {
        try {
            let optimizedPlan = { ...sprintPlan };
            
            switch (optimizationType) {
                case 'capacity':
                    optimizedPlan = this.optimizeCapacity(optimizedPlan);
                    break;
                case 'velocity':
                    optimizedPlan = this.optimizeVelocity(optimizedPlan);
                    break;
                case 'dependencies':
                    optimizedPlan = this.optimizeDependencies(optimizedPlan);
                    break;
                case 'comprehensive':
                    optimizedPlan = this.optimizeCapacity(optimizedPlan);
                    optimizedPlan = this.optimizeVelocity(optimizedPlan);
                    optimizedPlan = this.optimizeDependencies(optimizedPlan);
                    optimizedPlan = this.optimizeTaskOrder(optimizedPlan);
                    break;
            }
            
            // Calculate optimization score
            optimizedPlan.metadata.optimizationScore = this.calculateOptimizationScore(sprintPlan, optimizedPlan);
            optimizedPlan.metadata.optimizationType = optimizationType;
            optimizedPlan.updatedAt = new Date();
            
            return optimizedPlan;
        } catch (error) {
            console.error('Error optimizing sprint:', error);
            throw error;
        }
    }

    /**
     * Calculate sprint capacity
     */
    calculateSprintCapacity(capacity, startDate, endDate) {
        const workingDays = this.calculateWorkingDays(startDate, endDate);
        const totalHours = workingDays * this.workingHoursPerDay;
        
        const teamCapacity = capacity.teamMembers.reduce((total, member) => {
            const memberCapacity = totalHours * member.availability * member.efficiency;
            return total + memberCapacity;
        }, 0);
        
        // Apply capacity buffer
        const bufferedCapacity = teamCapacity * (1 - this.capacityBuffer);
        
        return {
            totalHours,
            workingDays,
            teamCapacity,
            bufferedCapacity,
            teamMembers: capacity.teamMembers.map(member => ({
                ...member,
                sprintCapacity: totalHours * member.availability * member.efficiency * (1 - this.capacityBuffer)
            }))
        };
    }

    /**
     * Calculate working days between dates
     */
    calculateWorkingDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let workingDays = 0;
        
        while (start <= end) {
            const dayOfWeek = start.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
                workingDays++;
            }
            start.setDate(start.getDate() + 1);
        }
        
        return workingDays;
    }

    /**
     * Calculate sprint duration in days
     */
    calculateDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }

    /**
     * Prioritize tasks based on goals and constraints
     */
    prioritizeTasks(tasks, goals, constraints) {
        return tasks
            .map(task => ({
                ...task,
                priorityScore: this.calculatePriorityScore(task, goals, constraints)
            }))
            .sort((a, b) => b.priorityScore - a.priorityScore);
    }

    /**
     * Calculate priority score for a task
     */
    calculatePriorityScore(task, goals, constraints) {
        let score = 0;
        
        // Base priority
        const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
        score += priorityWeights[task.priority] || 2;
        
        // Story points (higher points = higher priority for planning)
        score += task.storyPoints * 0.1;
        
        // Goal alignment
        if (goals && goals.length > 0) {
            const goalAlignment = this.calculateGoalAlignment(task, goals);
            score += goalAlignment * 2;
        }
        
        // Constraint compliance
        if (constraints.deadline) {
            const deadlineUrgency = this.calculateDeadlineUrgency(task, constraints.deadline);
            score += deadlineUrgency * 1.5;
        }
        
        // Dependencies (fewer dependencies = higher priority)
        score += (5 - task.dependencies.length) * 0.2;
        
        return score;
    }

    /**
     * Calculate goal alignment
     */
    calculateGoalAlignment(task, goals) {
        // Simple keyword matching - in real implementation, this would be more sophisticated
        const taskText = `${task.title} ${task.description}`.toLowerCase();
        let alignment = 0;
        
        goals.forEach(goal => {
            const goalKeywords = goal.toLowerCase().split(' ');
            const matches = goalKeywords.filter(keyword => 
                taskText.includes(keyword)
            ).length;
            alignment += matches / goalKeywords.length;
        });
        
        return Math.min(1, alignment / goals.length);
    }

    /**
     * Calculate deadline urgency
     */
    calculateDeadlineUrgency(task, deadline) {
        if (!task.dueDate) return 0;
        
        const taskDue = new Date(task.dueDate);
        const deadlineDate = new Date(deadline);
        const daysUntilDeadline = (deadlineDate - taskDue) / (1000 * 60 * 60 * 24);
        
        if (daysUntilDeadline < 0) return 1; // Overdue
        if (daysUntilDeadline < 7) return 0.8; // Very urgent
        if (daysUntilDeadline < 14) return 0.6; // Urgent
        if (daysUntilDeadline < 30) return 0.4; // Moderate
        return 0.2; // Low urgency
    }

    /**
     * Select tasks for sprint
     */
    selectTasksForSprint(prioritizedTasks, capacity, velocity, constraints) {
        const selectedTasks = [];
        let remainingCapacity = capacity.bufferedCapacity;
        const velocityTarget = velocity.estimated || velocity.average;
        
        for (const task of prioritizedTasks) {
            // Check if task fits in remaining capacity
            if (task.estimatedHours <= remainingCapacity) {
                // Check velocity target
                const taskVelocity = this.estimateTaskVelocity(task);
                if (selectedTasks.length === 0 || 
                    (selectedTasks.reduce((sum, t) => sum + t.estimatedVelocity, 0) + taskVelocity) <= velocityTarget) {
                    
                    selectedTasks.push({
                        ...task,
                        estimatedVelocity: taskVelocity,
                        assignedCapacity: task.estimatedHours
                    });
                    remainingCapacity -= task.estimatedHours;
                }
            }
            
            // Stop if we've reached capacity or velocity target
            if (remainingCapacity <= 0 || 
                selectedTasks.reduce((sum, t) => sum + t.estimatedVelocity, 0) >= velocityTarget) {
                break;
            }
        }
        
        return selectedTasks;
    }

    /**
     * Estimate task velocity
     */
    estimateTaskVelocity(task) {
        // Convert story points to velocity estimate
        // This is a simplified calculation - in practice, this would be more sophisticated
        return task.storyPoints * 1.2; // 1.2 velocity per story point
    }

    /**
     * Assign tasks to team members
     */
    assignTasks(tasks, teamMembers) {
        const assignedTasks = [];
        const memberWorkload = new Map();
        
        // Initialize workload tracking
        teamMembers.forEach(member => {
            memberWorkload.set(member.id, 0);
        });
        
        // Sort tasks by priority and complexity
        const sortedTasks = tasks.sort((a, b) => {
            if (a.priorityScore !== b.priorityScore) {
                return b.priorityScore - a.priorityScore;
            }
            return b.complexity - a.complexity;
        });
        
        for (const task of sortedTasks) {
            // Find best team member for this task
            const bestMember = this.findBestMemberForTask(task, teamMembers, memberWorkload);
            
            if (bestMember) {
                assignedTasks.push({
                    ...task,
                    assignee: bestMember.id,
                    assigneeName: bestMember.name,
                    assignedAt: new Date()
                });
                
                // Update workload
                memberWorkload.set(bestMember.id, 
                    memberWorkload.get(bestMember.id) + task.estimatedHours
                );
            } else {
                // No suitable member found, leave unassigned
                assignedTasks.push({
                    ...task,
                    assignee: null,
                    assigneeName: null,
                    assignedAt: null
                });
            }
        }
        
        return assignedTasks;
    }

    /**
     * Find best team member for a task
     */
    findBestMemberForTask(task, teamMembers, memberWorkload) {
        let bestMember = null;
        let bestScore = -1;
        
        for (const member of teamMembers) {
            // Check if member has capacity
            const currentWorkload = memberWorkload.get(member.id);
            if (currentWorkload + task.estimatedHours > member.sprintCapacity) {
                continue;
            }
            
            // Calculate suitability score
            const score = this.calculateMemberSuitability(task, member);
            
            if (score > bestScore) {
                bestScore = score;
                bestMember = member;
            }
        }
        
        return bestMember;
    }

    /**
     * Calculate member suitability for a task
     */
    calculateMemberSuitability(task, member) {
        let score = 0;
        
        // Skill match
        if (task.skills && member.skills) {
            const skillMatches = task.skills.filter(skill => 
                member.skills.some(ms => ms.name === skill || ms.name.includes(skill))
            ).length;
            score += (skillMatches / task.skills.length) * 0.4;
        }
        
        // Experience level
        if (member.experience) {
            const experienceMatch = Math.min(1, member.experience / 5); // 5 years = max
            score += experienceMatch * 0.3;
        }
        
        // Availability
        score += member.availability * 0.2;
        
        // Efficiency
        score += member.efficiency * 0.1;
        
        return score;
    }

    /**
     * Plan sprint ceremonies
     */
    planCeremonies(startDate, endDate, customCeremonies = []) {
        const ceremonies = [
            {
                name: 'Sprint Planning',
                type: 'planning',
                duration: 2, // hours
                scheduledFor: startDate,
                participants: 'team',
                description: 'Plan sprint goals and tasks'
            },
            {
                name: 'Daily Standup',
                type: 'daily',
                duration: 0.25, // 15 minutes
                frequency: 'daily',
                participants: 'team',
                description: 'Daily progress sync'
            },
            {
                name: 'Sprint Review',
                type: 'review',
                duration: 1, // hour
                scheduledFor: endDate,
                participants: 'team_stakeholders',
                description: 'Review sprint outcomes'
            },
            {
                name: 'Retrospective',
                type: 'retrospective',
                duration: 1, // hour
                scheduledFor: endDate,
                participants: 'team',
                description: 'Reflect on sprint process'
            }
        ];
        
        // Add custom ceremonies
        ceremonies.push(...customCeremonies);
        
        return ceremonies;
    }

    /**
     * Identify risks
     */
    identifyRisks(tasks, constraints) {
        const risks = [];
        
        // High complexity tasks
        const highComplexityTasks = tasks.filter(t => t.complexity === 'high' || t.storyPoints > 8);
        if (highComplexityTasks.length > 0) {
            risks.push({
                type: 'high_complexity',
                severity: 'medium',
                description: `${highComplexityTasks.length} high complexity tasks may cause delays`,
                mitigation: 'Consider breaking down into smaller tasks or adding buffer time'
            });
        }
        
        // Unassigned tasks
        const unassignedTasks = tasks.filter(t => !t.assignee);
        if (unassignedTasks.length > 0) {
            risks.push({
                type: 'unassigned_tasks',
                severity: 'high',
                description: `${unassignedTasks.length} tasks are not assigned to team members`,
                mitigation: 'Assign tasks or reduce sprint scope'
            });
        }
        
        // Dependencies
        const tasksWithDependencies = tasks.filter(t => t.dependencies.length > 0);
        if (tasksWithDependencies.length > 0) {
            risks.push({
                type: 'dependencies',
                severity: 'medium',
                description: `${tasksWithDependencies.length} tasks have dependencies`,
                mitigation: 'Ensure dependencies are completed before sprint start'
            });
        }
        
        return risks;
    }

    /**
     * Identify dependencies
     */
    identifyDependencies(tasks) {
        const dependencies = [];
        
        tasks.forEach(task => {
            if (task.dependencies && task.dependencies.length > 0) {
                dependencies.push({
                    taskId: task.id,
                    taskTitle: task.title,
                    dependencies: task.dependencies,
                    criticalPath: this.isCriticalPath(task, tasks)
                });
            }
        });
        
        return dependencies;
    }

    /**
     * Check if task is on critical path
     */
    isCriticalPath(task, allTasks) {
        // Simple critical path detection
        // In practice, this would use more sophisticated algorithms
        return task.dependencies.length > 0 && task.storyPoints >= 5;
    }

    /**
     * Create milestones
     */
    createMilestones(tasks, startDate, endDate) {
        const milestones = [];
        const sprintDuration = this.calculateDuration(startDate, endDate);
        
        // Week 1 milestone
        const week1Date = new Date(startDate);
        week1Date.setDate(week1Date.getDate() + 7);
        milestones.push({
            name: 'Week 1 Complete',
            date: week1Date,
            description: 'Complete first week tasks',
            tasks: tasks.filter(t => t.estimatedHours <= 8).slice(0, 3)
        });
        
        // Mid-sprint milestone
        const midSprintDate = new Date(startDate);
        midSprintDate.setDate(midSprintDate.getDate() + Math.floor(sprintDuration / 2));
        milestones.push({
            name: 'Mid-Sprint Review',
            date: midSprintDate,
            description: 'Review progress and adjust if needed',
            tasks: tasks.slice(0, Math.floor(tasks.length / 2))
        });
        
        // Sprint end milestone
        milestones.push({
            name: 'Sprint Complete',
            date: endDate,
            description: 'All sprint tasks completed',
            tasks: tasks
        });
        
        return milestones;
    }

    /**
     * Calculate confidence score
     */
    calculateConfidence(tasks, velocity, constraints) {
        let confidence = 0.5; // Base confidence
        
        // Task assignment confidence
        const assignedTasks = tasks.filter(t => t.assignee).length;
        const assignmentRate = assignedTasks / tasks.length;
        confidence += assignmentRate * 0.2;
        
        // Velocity confidence
        if (velocity.confidence) {
            confidence += velocity.confidence * 0.2;
        }
        
        // Risk factor
        const riskCount = this.identifyRisks(tasks, constraints).length;
        confidence -= riskCount * 0.1;
        
        // Dependency confidence
        const tasksWithDeps = tasks.filter(t => t.dependencies.length > 0).length;
        const depRate = tasksWithDeps / tasks.length;
        confidence -= depRate * 0.1;
        
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Optimize capacity allocation
     */
    optimizeCapacity(sprintPlan) {
        // Rebalance workload among team members
        const tasks = sprintPlan.tasks;
        const teamMembers = sprintPlan.capacity.teamMembers;
        
        // Calculate current workload per member
        const memberWorkload = new Map();
        teamMembers.forEach(member => {
            memberWorkload.set(member.id, 0);
        });
        
        tasks.forEach(task => {
            if (task.assignee) {
                const currentWorkload = memberWorkload.get(task.assignee);
                memberWorkload.set(task.assignee, currentWorkload + task.estimatedHours);
            }
        });
        
        // Rebalance if needed
        const avgWorkload = Array.from(memberWorkload.values()).reduce((a, b) => a + b, 0) / teamMembers.length;
        const threshold = avgWorkload * 0.2; // 20% variance threshold
        
        // This is a simplified rebalancing - in practice, it would be more sophisticated
        for (const [memberId, workload] of memberWorkload) {
            if (Math.abs(workload - avgWorkload) > threshold) {
                // Mark for rebalancing
                console.log(`Member ${memberId} workload (${workload}) differs significantly from average (${avgWorkload})`);
            }
        }
        
        return sprintPlan;
    }

    /**
     * Optimize velocity
     */
    optimizeVelocity(sprintPlan) {
        // Adjust task selection based on velocity trends
        const currentVelocity = sprintPlan.velocity;
        const targetVelocity = sprintPlan.capacity.bufferedCapacity / 8; // Convert to story points
        
        if (currentVelocity < targetVelocity * 0.8) {
            // Add more tasks if velocity is too low
            console.log('Velocity is low, consider adding more tasks');
        } else if (currentVelocity > targetVelocity * 1.2) {
            // Remove tasks if velocity is too high
            console.log('Velocity is high, consider removing some tasks');
        }
        
        return sprintPlan;
    }

    /**
     * Optimize dependencies
     */
    optimizeDependencies(sprintPlan) {
        // Reorder tasks to minimize dependency conflicts
        const tasks = sprintPlan.tasks;
        const sortedTasks = this.topologicalSort(tasks);
        
        sprintPlan.tasks = sortedTasks;
        return sprintPlan;
    }

    /**
     * Topological sort for dependency optimization
     */
    topologicalSort(tasks) {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();
        
        const visit = (task) => {
            if (visiting.has(task.id)) {
                throw new Error('Circular dependency detected');
            }
            if (visited.has(task.id)) {
                return;
            }
            
            visiting.add(task.id);
            
            // Visit dependencies first
            task.dependencies.forEach(depId => {
                const depTask = tasks.find(t => t.id === depId);
                if (depTask) {
                    visit(depTask);
                }
            });
            
            visiting.delete(task.id);
            visited.add(task.id);
            sorted.push(task);
        };
        
        tasks.forEach(task => {
            if (!visited.has(task.id)) {
                visit(task);
            }
        });
        
        return sorted;
    }

    /**
     * Optimize task order
     */
    optimizeTaskOrder(sprintPlan) {
        // Sort tasks by priority, dependencies, and complexity
        sprintPlan.tasks.sort((a, b) => {
            // First by priority score
            if (a.priorityScore !== b.priorityScore) {
                return b.priorityScore - a.priorityScore;
            }
            
            // Then by dependencies (fewer dependencies first)
            if (a.dependencies.length !== b.dependencies.length) {
                return a.dependencies.length - b.dependencies.length;
            }
            
            // Finally by complexity (simpler tasks first)
            return a.storyPoints - b.storyPoints;
        });
        
        return sprintPlan;
    }

    /**
     * Calculate optimization score
     */
    calculateOptimizationScore(originalPlan, optimizedPlan) {
        let score = 0;
        
        // Capacity utilization improvement
        const originalUtilization = this.calculateCapacityUtilization(originalPlan);
        const optimizedUtilization = this.calculateCapacityUtilization(optimizedPlan);
        score += (optimizedUtilization - originalUtilization) * 0.3;
        
        // Task assignment improvement
        const originalAssignment = this.calculateAssignmentRate(originalPlan);
        const optimizedAssignment = this.calculateAssignmentRate(optimizedPlan);
        score += (optimizedAssignment - originalAssignment) * 0.3;
        
        // Risk reduction
        const originalRisks = originalPlan.risks.length;
        const optimizedRisks = optimizedPlan.risks.length;
        score += (originalRisks - optimizedRisks) * 0.2;
        
        // Confidence improvement
        score += (optimizedPlan.confidence - originalPlan.confidence) * 0.2;
        
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Calculate capacity utilization
     */
    calculateCapacityUtilization(sprintPlan) {
        const totalCapacity = sprintPlan.capacity.bufferedCapacity;
        const usedCapacity = sprintPlan.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
        return usedCapacity / totalCapacity;
    }

    /**
     * Calculate assignment rate
     */
    calculateAssignmentRate(sprintPlan) {
        const totalTasks = sprintPlan.tasks.length;
        const assignedTasks = sprintPlan.tasks.filter(t => t.assignee).length;
        return assignedTasks / totalTasks;
    }

    /**
     * Generate sprint ID
     */
    generateSprintId(projectId, teamId, sprintNumber) {
        return `sprint_${projectId}_${teamId}_${sprintNumber}_${Date.now()}`;
    }

    /**
     * Stop the planning engine
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = SprintPlanningEngine;
