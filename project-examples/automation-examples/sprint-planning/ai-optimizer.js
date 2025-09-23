/**
 * AI Optimizer
 * AI-powered optimization for sprint planning
 */

class AIOptimizer {
    constructor(options = {}) {
        this.modelType = options.modelType || 'ensemble';
        this.learningRate = options.learningRate || 0.01;
        this.adaptationRate = options.adaptationRate || 0.1;
        this.predictionAccuracy = options.predictionAccuracy || 0.8;
        this.contextWindow = options.contextWindow || 30; // days
        
        this.models = new Map();
        this.historicalData = [];
        this.performanceMetrics = new Map();
        this.isRunning = true;
        
        this.initializeModels();
    }

    /**
     * Plan sprint using AI
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
                constraints,
                capacity,
                velocity,
                availableTasks,
                options
            } = params;
            
            // Analyze historical data
            const historicalContext = this.analyzeHistoricalData(projectId, teamId);
            
            // Predict team performance
            const performancePrediction = await this.predictTeamPerformance(teamId, startDate, endDate);
            
            // Optimize task selection using AI
            const optimizedTasks = await this.optimizeTaskSelection(
                availableTasks,
                capacity,
                velocity,
                goals,
                constraints,
                historicalContext,
                performancePrediction
            );
            
            // Optimize task assignment using AI
            const optimizedAssignment = await this.optimizeTaskAssignment(
                optimizedTasks,
                capacity.teamMembers,
                historicalContext
            );
            
            // Generate AI insights
            const insights = this.generateInsights(
                optimizedTasks,
                capacity,
                velocity,
                historicalContext,
                performancePrediction
            );
            
            // Create AI-optimized sprint plan
            const sprintPlan = {
                id: this.generateSprintId(projectId, teamId, sprintNumber),
                projectId,
                teamId,
                sprintNumber,
                startDate,
                endDate,
                duration: this.calculateDuration(startDate, endDate),
                goals,
                capacity,
                velocity: {
                    ...velocity,
                    aiPredicted: performancePrediction.velocity
                },
                tasks: optimizedAssignment,
                ceremonies: this.planCeremonies(startDate, endDate, options.ceremonies),
                risks: this.identifyRisks(optimizedAssignment, constraints, performancePrediction),
                dependencies: this.identifyDependencies(optimizedAssignment),
                milestones: this.createMilestones(optimizedAssignment, startDate, endDate),
                status: 'planned',
                createdAt: new Date(),
                confidence: this.calculateConfidence(optimizedAssignment, performancePrediction),
                aiInsights: insights,
                metadata: {
                    planningMethod: 'ai_optimized',
                    aiOptimized: true,
                    optimizationScore: this.calculateOptimizationScore(optimizedAssignment, capacity, velocity),
                    modelVersion: this.getModelVersion(),
                    predictionAccuracy: this.predictionAccuracy
                }
            };
            
            // Store for learning
            this.storeSprintPlan(sprintPlan);
            
            return sprintPlan;
        } catch (error) {
            console.error('Error in AI sprint planning:', error);
            throw error;
        }
    }

    /**
     * Optimize existing sprint plan
     */
    async optimizeSprint(sprintPlan, optimizationType = 'comprehensive') {
        try {
            let optimizedPlan = { ...sprintPlan };
            
            // Analyze current plan
            const analysis = this.analyzeSprintPlan(sprintPlan);
            
            switch (optimizationType) {
                case 'capacity':
                    optimizedPlan = await this.optimizeCapacityAI(optimizedPlan, analysis);
                    break;
                case 'velocity':
                    optimizedPlan = await this.optimizeVelocityAI(optimizedPlan, analysis);
                    break;
                case 'dependencies':
                    optimizedPlan = await this.optimizeDependenciesAI(optimizedPlan, analysis);
                    break;
                case 'assignment':
                    optimizedPlan = await this.optimizeAssignmentAI(optimizedPlan, analysis);
                    break;
                case 'comprehensive':
                    optimizedPlan = await this.optimizeCapacityAI(optimizedPlan, analysis);
                    optimizedPlan = await this.optimizeVelocityAI(optimizedPlan, analysis);
                    optimizedPlan = await this.optimizeDependenciesAI(optimizedPlan, analysis);
                    optimizedPlan = await this.optimizeAssignmentAI(optimizedPlan, analysis);
                    optimizedPlan = await this.optimizeTaskOrderAI(optimizedPlan, analysis);
                    break;
            }
            
            // Calculate improvement
            const improvement = this.calculateImprovement(sprintPlan, optimizedPlan);
            optimizedPlan.metadata.improvement = improvement;
            optimizedPlan.metadata.optimizationType = optimizationType;
            optimizedPlan.metadata.aiOptimized = true;
            optimizedPlan.updatedAt = new Date();
            
            return optimizedPlan;
        } catch (error) {
            console.error('Error optimizing sprint with AI:', error);
            throw error;
        }
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
            
            const simulations = [];
            
            for (let i = 0; i < sprintCount; i++) {
                const sprintStartDate = new Date();
                sprintStartDate.setDate(sprintStartDate.getDate() + (i * 14));
                const sprintEndDate = new Date(sprintStartDate);
                sprintEndDate.setDate(sprintEndDate.getDate() + 13);
                
                // Generate simulation data
                const simulationData = await this.generateSimulationData(
                    projectId,
                    teamId,
                    sprintStartDate,
                    sprintEndDate,
                    simulationType,
                    options
                );
                
                simulations.push({
                    sprintNumber: i + 1,
                    startDate: sprintStartDate,
                    endDate: sprintEndDate,
                    ...simulationData
                });
            }
            
            // Analyze simulation results
            const analysis = this.analyzeSimulationResults(simulations);
            
            return {
                simulations,
                analysis,
                summary: {
                    totalSprints: sprintCount,
                    averageVelocity: analysis.averageVelocity,
                    averageCapacity: analysis.averageCapacity,
                    successProbability: analysis.successProbability,
                    riskFactors: analysis.riskFactors
                }
            };
        } catch (error) {
            console.error('Error simulating sprints:', error);
            throw error;
        }
    }

    /**
     * Analyze historical data
     */
    analyzeHistoricalData(projectId, teamId) {
        const relevantData = this.historicalData.filter(data => 
            data.projectId === projectId && data.teamId === teamId
        );
        
        if (relevantData.length === 0) {
            return this.getDefaultContext();
        }
        
        // Calculate historical metrics
        const velocities = relevantData.map(d => d.velocity).filter(v => v);
        const capacities = relevantData.map(d => d.capacity).filter(c => c);
        const successRates = relevantData.map(d => d.successRate).filter(s => s);
        
        return {
            averageVelocity: this.calculateAverage(velocities),
            averageCapacity: this.calculateAverage(capacities),
            averageSuccessRate: this.calculateAverage(successRates),
            velocityTrend: this.calculateTrend(velocities),
            capacityTrend: this.calculateTrend(capacities),
            commonRisks: this.identifyCommonRisks(relevantData),
            teamPerformance: this.analyzeTeamPerformance(relevantData),
            projectComplexity: this.analyzeProjectComplexity(relevantData)
        };
    }

    /**
     * Predict team performance
     */
    async predictTeamPerformance(teamId, startDate, endDate) {
        const historicalContext = this.analyzeHistoricalData(null, teamId);
        
        // Use AI models to predict performance
        const predictions = await Promise.all([
            this.predictVelocity(teamId, startDate, endDate, historicalContext),
            this.predictCapacity(teamId, startDate, endDate, historicalContext),
            this.predictQuality(teamId, startDate, endDate, historicalContext),
            this.predictRisks(teamId, startDate, endDate, historicalContext)
        ]);
        
        return {
            velocity: predictions[0],
            capacity: predictions[1],
            quality: predictions[2],
            risks: predictions[3],
            confidence: this.calculatePredictionConfidence(predictions),
            factors: this.identifyPerformanceFactors(historicalContext)
        };
    }

    /**
     * Optimize task selection using AI
     */
    async optimizeTaskSelection(tasks, capacity, velocity, goals, constraints, historicalContext, performancePrediction) {
        // Score tasks using AI models
        const scoredTasks = await Promise.all(
            tasks.map(async task => ({
                ...task,
                aiScore: await this.calculateAITaskScore(task, capacity, velocity, goals, constraints, historicalContext, performancePrediction)
            }))
        );
        
        // Sort by AI score
        scoredTasks.sort((a, b) => b.aiScore - a.aiScore);
        
        // Select tasks using AI optimization
        const selectedTasks = this.selectTasksWithAI(scoredTasks, capacity, velocity, constraints);
        
        return selectedTasks;
    }

    /**
     * Optimize task assignment using AI
     */
    async optimizeTaskAssignment(tasks, teamMembers, historicalContext) {
        const assignmentMatrix = [];
        
        // Calculate assignment scores for each task-member pair
        for (const task of tasks) {
            const memberScores = [];
            
            for (const member of teamMembers) {
                const score = await this.calculateAssignmentScore(task, member, historicalContext);
                memberScores.push({
                    memberId: member.id,
                    memberName: member.name,
                    score,
                    capacity: member.sprintCapacity,
                    currentWorkload: 0
                });
            }
            
            assignmentMatrix.push({
                taskId: task.id,
                taskTitle: task.title,
                memberScores: memberScores.sort((a, b) => b.score - a.score)
            });
        }
        
        // Use Hungarian algorithm or similar for optimal assignment
        const assignments = this.solveAssignmentProblem(assignmentMatrix, teamMembers);
        
        // Apply assignments
        return tasks.map(task => {
            const assignment = assignments.find(a => a.taskId === task.id);
            return {
                ...task,
                assignee: assignment ? assignment.memberId : null,
                assigneeName: assignment ? assignment.memberName : null,
                assignmentScore: assignment ? assignment.score : 0,
                assignedAt: new Date()
            };
        });
    }

    /**
     * Calculate AI task score
     */
    async calculateAITaskScore(task, capacity, velocity, goals, constraints, historicalContext, performancePrediction) {
        let score = 0;
        
        // Base priority score
        const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
        score += priorityWeights[task.priority] || 2;
        
        // AI-predicted completion probability
        const completionProbability = await this.predictTaskCompletion(task, historicalContext, performancePrediction);
        score += completionProbability * 2;
        
        // Goal alignment using NLP
        const goalAlignment = await this.calculateGoalAlignmentAI(task, goals);
        score += goalAlignment * 1.5;
        
        // Team skill match
        const skillMatch = this.calculateSkillMatchAI(task, capacity.teamMembers);
        score += skillMatch * 1.2;
        
        // Risk assessment
        const riskScore = await this.assessTaskRisk(task, constraints, performancePrediction);
        score -= riskScore * 0.5;
        
        // Historical success rate for similar tasks
        const historicalSuccess = this.getHistoricalSuccessRate(task, historicalContext);
        score += historicalSuccess * 1.0;
        
        return Math.max(0, score);
    }

    /**
     * Predict task completion probability
     */
    async predictTaskCompletion(task, historicalContext, performancePrediction) {
        // Use machine learning models to predict completion
        const features = this.extractTaskFeatures(task);
        const contextFeatures = this.extractContextFeatures(historicalContext);
        const performanceFeatures = this.extractPerformanceFeatures(performancePrediction);
        
        // Combine features
        const allFeatures = [...features, ...contextFeatures, ...performanceFeatures];
        
        // Use ensemble model for prediction
        const predictions = await Promise.all([
            this.models.get('completion_model_1').predict(allFeatures),
            this.models.get('completion_model_2').predict(allFeatures),
            this.models.get('completion_model_3').predict(allFeatures)
        ]);
        
        // Ensemble prediction
        const avgPrediction = predictions.reduce((sum, p) => sum + p, 0) / predictions.length;
        return Math.max(0, Math.min(1, avgPrediction));
    }

    /**
     * Calculate goal alignment using AI
     */
    async calculateGoalAlignmentAI(task, goals) {
        if (!goals || goals.length === 0) return 0.5;
        
        // Use NLP to analyze goal alignment
        const taskText = `${task.title} ${task.description}`.toLowerCase();
        let alignment = 0;
        
        for (const goal of goals) {
            const goalKeywords = this.extractKeywords(goal);
            const taskKeywords = this.extractKeywords(taskText);
            
            const similarity = this.calculateTextSimilarity(goalKeywords, taskKeywords);
            alignment += similarity;
        }
        
        return Math.min(1, alignment / goals.length);
    }

    /**
     * Calculate skill match using AI
     */
    calculateSkillMatchAI(task, teamMembers) {
        if (!task.skills || task.skills.length === 0) return 0.5;
        
        let bestMatch = 0;
        
        for (const member of teamMembers) {
            if (!member.skills) continue;
            
            const memberSkills = member.skills.map(s => s.name.toLowerCase());
            const taskSkills = task.skills.map(s => s.toLowerCase());
            
            const matches = taskSkills.filter(ts => 
                memberSkills.some(ms => ms.includes(ts) || ts.includes(ms))
            ).length;
            
            const matchRate = matches / taskSkills.length;
            bestMatch = Math.max(bestMatch, matchRate);
        }
        
        return bestMatch;
    }

    /**
     * Assess task risk using AI
     */
    async assessTaskRisk(task, constraints, performancePrediction) {
        let riskScore = 0;
        
        // Complexity risk
        if (task.complexity === 'high' || task.storyPoints > 8) {
            riskScore += 0.3;
        }
        
        // Dependency risk
        if (task.dependencies && task.dependencies.length > 0) {
            riskScore += task.dependencies.length * 0.1;
        }
        
        // Skill gap risk
        const skillGap = await this.calculateSkillGap(task, performancePrediction);
        riskScore += skillGap * 0.2;
        
        // Historical risk
        const historicalRisk = this.getHistoricalRisk(task);
        riskScore += historicalRisk * 0.2;
        
        // Time constraint risk
        if (constraints.deadline) {
            const timeRisk = this.calculateTimeRisk(task, constraints.deadline);
            riskScore += timeRisk * 0.2;
        }
        
        return Math.min(1, riskScore);
    }

    /**
     * Generate AI insights
     */
    generateInsights(tasks, capacity, velocity, historicalContext, performancePrediction) {
        const insights = [];
        
        // Capacity insights
        const totalCapacity = capacity.bufferedCapacity;
        const usedCapacity = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
        const utilization = usedCapacity / totalCapacity;
        
        if (utilization > 0.9) {
            insights.push({
                type: 'capacity',
                severity: 'high',
                message: 'Sprint capacity utilization is very high (90%+)',
                recommendation: 'Consider reducing scope or adding buffer time'
            });
        } else if (utilization < 0.6) {
            insights.push({
                type: 'capacity',
                severity: 'medium',
                message: 'Sprint capacity utilization is low (60%-)',
                recommendation: 'Consider adding more tasks or reducing team size'
            });
        }
        
        // Velocity insights
        const predictedVelocity = performancePrediction.velocity;
        const historicalVelocity = historicalContext.averageVelocity;
        
        if (predictedVelocity > historicalVelocity * 1.2) {
            insights.push({
                type: 'velocity',
                severity: 'medium',
                message: 'Predicted velocity is significantly higher than historical average',
                recommendation: 'Verify team capacity and task estimates'
            });
        } else if (predictedVelocity < historicalVelocity * 0.8) {
            insights.push({
                type: 'velocity',
                severity: 'high',
                message: 'Predicted velocity is significantly lower than historical average',
                recommendation: 'Investigate potential blockers or capacity issues'
            });
        }
        
        // Risk insights
        const highRiskTasks = tasks.filter(task => task.riskScore > 0.7);
        if (highRiskTasks.length > 0) {
            insights.push({
                type: 'risk',
                severity: 'high',
                message: `${highRiskTasks.length} tasks have high risk scores`,
                recommendation: 'Consider breaking down high-risk tasks or adding mitigation strategies'
            });
        }
        
        // Skill insights
        const unassignedTasks = tasks.filter(task => !task.assignee);
        if (unassignedTasks.length > 0) {
            insights.push({
                type: 'assignment',
                severity: 'medium',
                message: `${unassignedTasks.length} tasks are not assigned to team members`,
                recommendation: 'Assign tasks or adjust team composition'
            });
        }
        
        return insights;
    }

    /**
     * Initialize AI models
     */
    initializeModels() {
        // Initialize different AI models for ensemble prediction
        this.models.set('completion_model_1', new MockMLModel('completion', 0.85));
        this.models.set('completion_model_2', new MockMLModel('completion', 0.82));
        this.models.set('completion_model_3', new MockMLModel('completion', 0.88));
        
        this.models.set('velocity_model', new MockMLModel('velocity', 0.80));
        this.models.set('capacity_model', new MockMLModel('capacity', 0.75));
        this.models.set('quality_model', new MockMLModel('quality', 0.78));
    }

    /**
     * Store sprint plan for learning
     */
    storeSprintPlan(sprintPlan) {
        this.historicalData.push({
            projectId: sprintPlan.projectId,
            teamId: sprintPlan.teamId,
            sprintNumber: sprintPlan.sprintNumber,
            startDate: sprintPlan.startDate,
            endDate: sprintPlan.endDate,
            velocity: sprintPlan.velocity.estimated || sprintPlan.velocity.average,
            capacity: sprintPlan.capacity.bufferedCapacity,
            tasks: sprintPlan.tasks.length,
            successRate: sprintPlan.confidence,
            createdAt: new Date()
        });
        
        // Keep only recent data
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 365); // 1 year
        this.historicalData = this.historicalData.filter(data => 
            new Date(data.createdAt) > cutoffDate
        );
    }

    /**
     * Calculate improvement score
     */
    calculateImprovement(originalPlan, optimizedPlan) {
        let improvement = 0;
        
        // Capacity utilization improvement
        const originalUtilization = this.calculateCapacityUtilization(originalPlan);
        const optimizedUtilization = this.calculateCapacityUtilization(optimizedPlan);
        improvement += (optimizedUtilization - originalUtilization) * 0.3;
        
        // Task assignment improvement
        const originalAssignment = this.calculateAssignmentRate(originalPlan);
        const optimizedAssignment = this.calculateAssignmentRate(optimizedPlan);
        improvement += (optimizedAssignment - originalAssignment) * 0.3;
        
        // Risk reduction
        const originalRisks = originalPlan.risks ? originalPlan.risks.length : 0;
        const optimizedRisks = optimizedPlan.risks ? optimizedPlan.risks.length : 0;
        improvement += (originalRisks - optimizedRisks) * 0.2;
        
        // Confidence improvement
        improvement += (optimizedPlan.confidence - originalPlan.confidence) * 0.2;
        
        return Math.max(0, Math.min(1, improvement));
    }

    /**
     * Get model version
     */
    getModelVersion() {
        return '2.4.0';
    }

    /**
     * Stop the AI optimizer
     */
    stop() {
        this.isRunning = false;
    }
}

/**
 * Mock ML Model for demonstration
 */
class MockMLModel {
    constructor(type, accuracy) {
        this.type = type;
        this.accuracy = accuracy;
    }
    
    async predict(features) {
        // Mock prediction - in real implementation, this would use actual ML models
        const basePrediction = Math.random();
        const accuracyAdjustment = (this.accuracy - 0.5) * 0.4;
        return Math.max(0, Math.min(1, basePrediction + accuracyAdjustment));
    }
}

module.exports = AIOptimizer;
