/**
 * Integrated Deadline Prediction System v2.4
 * Combines prediction engine, risk monitoring, and analytics
 */

const AdvancedDeadlinePredictionEngine = require('./advanced-prediction-engine');
const RiskMonitoringSystem = require('./risk-monitoring-system');

class IntegratedDeadlinePredictionSystem {
    constructor(options = {}) {
        // Initialize core components
        this.predictionEngine = new AdvancedDeadlinePredictionEngine(options.prediction || {});
        this.riskMonitor = new RiskMonitoringSystem(options.riskMonitoring || {});
        
        // System configuration
        this.config = {
            autoPrediction: options.autoPrediction || true,
            riskMonitoring: options.riskMonitoring || true,
            analyticsEnabled: options.analyticsEnabled || true,
            updateInterval: options.updateInterval || 300000, // 5 minutes
            predictionCache: new Map(),
            cacheExpiry: 300000 // 5 minutes
        };
        
        // State management
        this.isRunning = false;
        this.lastUpdate = null;
        this.predictionQueue = [];
        
        // Start system if auto-prediction is enabled
        if (this.config.autoPrediction) {
            this.start();
        }
    }

    /**
     * Start the integrated prediction system
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('Integrated Deadline Prediction System started');
        
        // Start update loop
        this.startUpdateLoop();
        
        // Start queue processing
        this.startQueueProcessing();
    }

    /**
     * Stop the integrated prediction system
     */
    stop() {
        this.isRunning = false;
        console.log('Integrated Deadline Prediction System stopped');
    }

    /**
     * Start update loop
     */
    startUpdateLoop() {
        setInterval(() => {
            if (this.isRunning) {
                this.updatePredictions();
            }
        }, this.config.updateInterval);
    }

    /**
     * Start queue processing
     */
    startQueueProcessing() {
        setInterval(() => {
            if (this.isRunning && this.predictionQueue.length > 0) {
                this.processPredictionQueue();
            }
        }, 30000); // Process every 30 seconds
    }

    /**
     * Predict deadline with comprehensive analysis
     */
    async predictDeadline(task, developerId, options = {}) {
        const cacheKey = `${task.id}_${developerId}`;
        
        // Check cache first
        if (this.config.predictionCache.has(cacheKey)) {
            const cached = this.config.predictionCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheExpiry) {
                return cached.prediction;
            }
        }
        
        try {
            // Get prediction from engine
            const method = options.method || 'ensemble';
            const prediction = this.predictionEngine.predictDeadline(task, developerId, method);
            
            // Get risk assessment
            const risks = this.riskMonitor.assessTaskRisks ? 
                await this.riskMonitor.assessTaskRisks(task) : {};
            
            // Combine prediction with risk data
            const integratedPrediction = {
                ...prediction,
                risks: risks,
                riskLevel: this.calculateOverallRiskLevel(risks),
                confidence: this.adjustConfidenceForRisks(prediction.confidence, risks),
                recommendations: this.combineRecommendations(
                    prediction.recommendations || [],
                    this.generateRiskRecommendations(risks)
                ),
                metadata: {
                    ...prediction.metadata,
                    riskAssessment: true,
                    integratedAt: new Date()
                }
            };
            
            // Cache the result
            this.config.predictionCache.set(cacheKey, {
                prediction: integratedPrediction,
                timestamp: Date.now()
            });
            
            // Add to queue for batch processing if needed
            if (options.batch) {
                this.predictionQueue.push({
                    taskId: task.id,
                    developerId: developerId,
                    prediction: integratedPrediction,
                    timestamp: new Date()
                });
            }
            
            return integratedPrediction;
            
        } catch (error) {
            console.error('Error in integrated deadline prediction:', error);
            return {
                predictedDeadline: null,
                confidence: 0,
                error: error.message,
                fallback: this.getFallbackPrediction(task, developerId)
            };
        }
    }

    /**
     * Batch predict deadlines for multiple tasks
     */
    async batchPredictDeadlines(tasks, developers, options = {}) {
        const predictions = [];
        const errors = [];
        
        for (const task of tasks) {
            try {
                // Find best developer for task
                const bestDeveloper = this.findBestDeveloperForTask(task, developers);
                if (!bestDeveloper) {
                    errors.push({
                        taskId: task.id,
                        error: 'No suitable developer found'
                    });
                    continue;
                }
                
                // Predict deadline
                const prediction = await this.predictDeadline(task, bestDeveloper.id, options);
                predictions.push({
                    taskId: task.id,
                    developerId: bestDeveloper.id,
                    prediction: prediction
                });
                
            } catch (error) {
                errors.push({
                    taskId: task.id,
                    error: error.message
                });
            }
        }
        
        return {
            predictions: predictions,
            errors: errors,
            summary: {
                total: tasks.length,
                successful: predictions.length,
                failed: errors.length,
                successRate: predictions.length / tasks.length
            }
        };
    }

    /**
     * Update existing predictions
     */
    async updatePredictions() {
        if (!this.isRunning) return;
        
        try {
            // Get all active tasks
            const activeTasks = await this.getActiveTasks();
            
            for (const task of activeTasks) {
                if (task.assignedTo) {
                    // Update prediction for assigned task
                    await this.updateTaskPrediction(task);
                }
            }
            
            // Update risk monitoring
            if (this.config.riskMonitoring) {
                await this.riskMonitor.performRiskAssessment();
            }
            
            this.lastUpdate = new Date();
            
        } catch (error) {
            console.error('Error updating predictions:', error);
        }
    }

    /**
     * Update prediction for a specific task
     */
    async updateTaskPrediction(task) {
        const cacheKey = `${task.id}_${task.assignedTo}`;
        
        // Remove from cache to force refresh
        this.config.predictionCache.delete(cacheKey);
        
        // Get updated prediction
        const prediction = await this.predictDeadline(task, task.assignedTo, {
            method: 'adaptive',
            batch: false
        });
        
        // Update task with new prediction
        task.predictedDeadline = prediction.predictedDeadline;
        task.predictionConfidence = prediction.confidence;
        task.riskLevel = prediction.riskLevel;
        task.lastPredictionUpdate = new Date();
        
        return prediction;
    }

    /**
     * Process prediction queue
     */
    async processPredictionQueue() {
        if (this.predictionQueue.length === 0) return;
        
        const batch = this.predictionQueue.splice(0, 10); // Process up to 10 at a time
        
        for (const item of batch) {
            try {
                // Update any dependent predictions
                await this.updateDependentPredictions(item);
                
                // Store prediction result
                await this.storePredictionResult(item);
                
            } catch (error) {
                console.error('Error processing prediction queue item:', error);
            }
        }
    }

    /**
     * Update dependent predictions
     */
    async updateDependentPredictions(predictionItem) {
        const task = await this.getTask(predictionItem.taskId);
        if (!task || !task.dependencies) return;
        
        // Find tasks that depend on this task
        const dependentTasks = await this.getDependentTasks(task.id);
        
        for (const dependentTask of dependentTasks) {
            if (dependentTask.assignedTo) {
                // Invalidate cache for dependent task
                const cacheKey = `${dependentTask.id}_${dependentTask.assignedTo}`;
                this.config.predictionCache.delete(cacheKey);
                
                // Add to queue for re-prediction
                this.predictionQueue.push({
                    taskId: dependentTask.id,
                    developerId: dependentTask.assignedTo,
                    reason: 'dependency_update',
                    timestamp: new Date()
                });
            }
        }
    }

    /**
     * Get comprehensive analytics
     */
    getAnalytics() {
        const predictionAnalytics = this.predictionEngine.getAdvancedAnalytics();
        const riskAnalytics = this.riskMonitor.getRiskDashboard();
        
        return {
            predictions: predictionAnalytics,
            risks: riskAnalytics,
            system: {
                isRunning: this.isRunning,
                lastUpdate: this.lastUpdate,
                cacheSize: this.config.predictionCache.size,
                queueLength: this.predictionQueue.length,
                uptime: process.uptime()
            },
            integration: {
                totalPredictions: this.getTotalPredictions(),
                averageConfidence: this.getAverageConfidence(),
                riskDistribution: this.getRiskDistribution(),
                accuracy: this.getPredictionAccuracy()
            }
        };
    }

    /**
     * Get prediction accuracy
     */
    getPredictionAccuracy() {
        const completedTasks = this.predictionEngine.historicalData.filter(task => 
            task.status === 'completed' && task.actualHours && task.predictedHours
        );
        
        if (completedTasks.length === 0) {
            return { accuracy: 0, mae: 0, mape: 0 };
        }
        
        let totalError = 0;
        let totalAbsoluteError = 0;
        let totalPercentageError = 0;
        
        for (const task of completedTasks) {
            const error = task.actualHours - task.predictedHours;
            totalError += error;
            totalAbsoluteError += Math.abs(error);
            totalPercentageError += Math.abs(error / task.predictedHours);
        }
        
        const count = completedTasks.length;
        
        return {
            accuracy: Math.max(0, 1 - (totalAbsoluteError / count) / (totalError / count + 1)),
            mae: totalAbsoluteError / count,
            mape: (totalPercentageError / count) * 100,
            sampleSize: count
        };
    }

    /**
     * Get risk distribution
     */
    getRiskDistribution() {
        const risks = Array.from(this.riskMonitor.risks.values());
        const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
        
        for (const risk of risks) {
            distribution[risk.overallRisk.level]++;
        }
        
        return distribution;
    }

    /**
     * Get total predictions made
     */
    getTotalPredictions() {
        return this.predictionEngine.performanceMetrics.size;
    }

    /**
     * Get average confidence
     */
    getAverageConfidence() {
        const predictions = Array.from(this.config.predictionCache.values());
        if (predictions.length === 0) return 0;
        
        const totalConfidence = predictions.reduce((sum, pred) => 
            sum + (pred.prediction.confidence || 0), 0);
        
        return totalConfidence / predictions.length;
    }

    /**
     * Find best developer for task
     */
    findBestDeveloperForTask(task, developers) {
        let bestDeveloper = null;
        let bestScore = 0;
        
        for (const developer of developers) {
            const score = this.calculateDeveloperTaskScore(task, developer);
            if (score > bestScore) {
                bestScore = score;
                bestDeveloper = developer;
            }
        }
        
        return bestDeveloper;
    }

    /**
     * Calculate developer-task compatibility score
     */
    calculateDeveloperTaskScore(task, developer) {
        let score = 0;
        
        // Skill match
        const skillMatch = this.calculateSkillMatch(task.requiredSkills || [], developer.skills || []);
        score += skillMatch * 0.4;
        
        // Experience level
        const experience = developer.experience?.years || 1;
        const complexity = this.normalizeComplexity(task.complexity);
        const experienceMatch = Math.min(1, experience / (complexity * 5 + 1));
        score += experienceMatch * 0.3;
        
        // Workload balance
        const workload = developer.currentWorkload || 0;
        const capacity = developer.capacity || 40;
        const workloadScore = 1 - (workload / capacity);
        score += workloadScore * 0.2;
        
        // Availability
        const availability = developer.availability || 1.0;
        score += availability * 0.1;
        
        return score;
    }

    /**
     * Calculate overall risk level
     */
    calculateOverallRiskLevel(risks) {
        if (!risks || Object.keys(risks).length === 0) return 'low';
        
        const riskScores = Object.values(risks).map(risk => risk.score || 0);
        const averageScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
        
        if (averageScore > 0.8) return 'critical';
        if (averageScore > 0.6) return 'high';
        if (averageScore > 0.3) return 'medium';
        return 'low';
    }

    /**
     * Adjust confidence based on risks
     */
    adjustConfidenceForRisks(confidence, risks) {
        if (!risks || Object.keys(risks).length === 0) return confidence;
        
        const riskLevel = this.calculateOverallRiskLevel(risks);
        const riskAdjustment = {
            'critical': 0.3,
            'high': 0.5,
            'medium': 0.7,
            'low': 1.0
        };
        
        return confidence * (riskAdjustment[riskLevel] || 1.0);
    }

    /**
     * Combine recommendations
     */
    combineRecommendations(predictionRecs, riskRecs) {
        const combined = [...(predictionRecs || []), ...(riskRecs || [])];
        
        // Remove duplicates based on action
        const unique = combined.filter((rec, index, self) => 
            index === self.findIndex(r => r.action === rec.action)
        );
        
        // Sort by priority
        return unique.sort((a, b) => {
            const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Generate risk-based recommendations
     */
    generateRiskRecommendations(risks) {
        const recommendations = [];
        
        for (const [riskType, riskData] of Object.entries(risks)) {
            if (riskData.level === 'critical' || riskData.level === 'high') {
                recommendations.push({
                    type: `${riskType}_risk`,
                    priority: riskData.level === 'critical' ? 'critical' : 'high',
                    action: this.getRiskAction(riskType, riskData),
                    impact: this.getRiskImpact(riskType)
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Get risk-specific action
     */
    getRiskAction(riskType, riskData) {
        const actions = {
            'deadline': 'Request deadline extension or additional resources',
            'complexity': 'Break down task or provide additional support',
            'resource': 'Redistribute workload or add team members',
            'dependency': 'Resolve blocking dependencies',
            'external': 'Address external dependencies or risks'
        };
        
        return actions[riskType] || 'Review and mitigate risk factors';
    }

    /**
     * Get risk impact description
     */
    getRiskImpact(riskType) {
        const impacts = {
            'deadline': 'Ensure on-time delivery',
            'complexity': 'Reduce complexity and improve success rate',
            'resource': 'Ensure adequate resources for completion',
            'dependency': 'Unblock task progress',
            'external': 'Minimize external risk exposure'
        };
        
        return impacts[riskType] || 'Improve overall project success';
    }

    /**
     * Get fallback prediction
     */
    getFallbackPrediction(task, developerId) {
        const baseHours = task.estimatedHours || 8;
        const buffer = 1.5; // 50% buffer for fallback
        const estimatedHours = baseHours * buffer;
        
        return {
            predictedDeadline: new Date(Date.now() + estimatedHours * 60 * 60 * 1000),
            estimatedHours: estimatedHours,
            confidence: 0.3,
            method: 'fallback',
            riskLevel: 'high',
            recommendations: [{
                type: 'fallback_prediction',
                priority: 'high',
                action: 'Use conservative estimate with high buffer',
                impact: 'Ensure completion even with uncertainties'
            }]
        };
    }

    // Helper methods
    calculateSkillMatch(requiredSkills, developerSkills) {
        if (requiredSkills.length === 0) return 1.0;
        
        const matchedSkills = requiredSkills.filter(skill => 
            developerSkills.some(devSkill => 
                devSkill.name === skill || devSkill.name === skill.name
            )
        );
        
        return matchedSkills.length / requiredSkills.length;
    }

    normalizeComplexity(complexity) {
        const complexityMap = { 'low': 0.2, 'medium': 0.5, 'high': 0.8, 'very-high': 1.0 };
        return complexityMap[complexity] || 0.5;
    }

    // Placeholder methods for external integrations
    async getActiveTasks() {
        // This would integrate with the task management system
        return [];
    }

    async getTask(taskId) {
        // This would get task data from the system
        return { id: taskId, assignedTo: null };
    }

    async getDependentTasks(taskId) {
        // This would find tasks that depend on the given task
        return [];
    }

    async storePredictionResult(predictionItem) {
        // This would store the prediction result in the database
        console.log('Storing prediction result:', predictionItem.taskId);
    }
}

module.exports = IntegratedDeadlinePredictionSystem;
