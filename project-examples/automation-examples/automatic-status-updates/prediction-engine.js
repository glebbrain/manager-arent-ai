/**
 * Prediction Engine
 * AI-powered prediction of next status updates
 */

class PredictionEngine {
    constructor(options = {}) {
        this.modelType = options.modelType || 'ensemble';
        this.learningRate = options.learningRate || 0.01;
        this.predictionAccuracy = options.predictionAccuracy || 0.85;
        this.contextWindow = options.contextWindow || 30;
        
        this.models = new Map();
        this.predictions = new Map();
        this.historicalData = [];
        this.isRunning = true;
        
        this.initializeModels();
    }

    /**
     * Predict next status
     */
    async predictNextStatus(taskId, currentStatus, context = {}) {
        try {
            const features = this.extractFeatures(taskId, currentStatus, context);
            const predictions = await this.getModelPredictions(features);
            const prediction = this.combinePredictions(predictions);
            
            // Store prediction
            this.predictions.set(`${taskId}_${Date.now()}`, {
                taskId,
                currentStatus,
                predictedStatus: prediction.status,
                confidence: prediction.confidence,
                features,
                timestamp: new Date()
            });
            
            return prediction;
        } catch (error) {
            console.error('Error predicting next status:', error);
            return null;
        }
    }

    /**
     * Extract features for prediction
     */
    extractFeatures(taskId, currentStatus, context) {
        const features = {
            // Basic features
            taskId,
            currentStatus,
            projectId: context.projectId,
            taskType: context.taskType || 'unknown',
            priority: context.priority || 'medium',
            complexity: context.complexity || 'medium',
            
            // Temporal features
            currentTime: new Date().getTime(),
            dayOfWeek: new Date().getDay(),
            hourOfDay: new Date().getHours(),
            
            // Historical features
            statusHistory: this.getStatusHistory(taskId),
            updateFrequency: this.getUpdateFrequency(taskId),
            averageStatusDuration: this.getAverageStatusDuration(taskId, currentStatus),
            
            // Context features
            dependencies: context.dependencies || [],
            resources: context.resources || [],
            deadline: context.deadline ? new Date(context.deadline).getTime() : null,
            
            // Team features
            teamSize: context.teamSize || 1,
            teamExperience: context.teamExperience || 5,
            
            // Project features
            projectPhase: context.projectPhase || 'development',
            projectUrgency: context.projectUrgency || 'medium'
        };
        
        return features;
    }

    /**
     * Get model predictions
     */
    async getModelPredictions(features) {
        const predictions = [];
        
        // Get predictions from all models
        for (const [modelName, model] of this.models) {
            try {
                const prediction = await model.predict(features);
                predictions.push({
                    model: modelName,
                    prediction,
                    confidence: model.confidence || 0.8
                });
            } catch (error) {
                console.error(`Error getting prediction from ${modelName}:`, error);
            }
        }
        
        return predictions;
    }

    /**
     * Combine predictions
     */
    combinePredictions(predictions) {
        if (predictions.length === 0) {
            return {
                status: 'in_progress',
                confidence: 0.5,
                reasoning: 'No predictions available'
            };
        }
        
        // Weighted average based on model confidence
        const statusVotes = {};
        let totalWeight = 0;
        
        for (const pred of predictions) {
            const status = pred.prediction.status;
            const weight = pred.confidence;
            
            if (!statusVotes[status]) {
                statusVotes[status] = { votes: 0, totalConfidence: 0 };
            }
            
            statusVotes[status].votes += 1;
            statusVotes[status].totalConfidence += weight;
            totalWeight += weight;
        }
        
        // Find most voted status
        let bestStatus = 'in_progress';
        let bestScore = 0;
        
        for (const [status, data] of Object.entries(statusVotes)) {
            const score = data.votes * (data.totalConfidence / data.votes);
            if (score > bestScore) {
                bestScore = score;
                bestStatus = status;
            }
        }
        
        // Calculate overall confidence
        const avgConfidence = totalWeight / predictions.length;
        
        return {
            status: bestStatus,
            confidence: Math.min(0.95, avgConfidence),
            reasoning: `Predicted by ${predictions.length} models with ${(avgConfidence * 100).toFixed(1)}% confidence`,
            modelPredictions: predictions
        };
    }

    /**
     * Get status history
     */
    getStatusHistory(taskId) {
        // This would typically query historical data
        // For now, return mock data
        const mockHistory = {
            'task_1': ['pending', 'in_progress', 'completed'],
            'task_2': ['pending', 'in_progress'],
            'task_3': ['pending', 'in_progress', 'on_hold', 'in_progress'],
            'task_4': ['pending'],
            'task_5': ['pending', 'in_progress', 'completed']
        };
        
        return mockHistory[taskId] || ['pending'];
    }

    /**
     * Get update frequency
     */
    getUpdateFrequency(taskId) {
        // This would typically calculate from historical data
        // For now, return mock data
        const mockFrequencies = {
            'task_1': 0.5, // updates per day
            'task_2': 0.3,
            'task_3': 0.8,
            'task_4': 0.1,
            'task_5': 0.4
        };
        
        return mockFrequencies[taskId] || 0.2;
    }

    /**
     * Get average status duration
     */
    getAverageStatusDuration(taskId, status) {
        // This would typically calculate from historical data
        // For now, return mock data (in hours)
        const mockDurations = {
            'task_1': { 'pending': 24, 'in_progress': 48, 'completed': 2 },
            'task_2': { 'pending': 12, 'in_progress': 72 },
            'task_3': { 'pending': 36, 'in_progress': 96, 'on_hold': 24 },
            'task_4': { 'pending': 6 },
            'task_5': { 'pending': 18, 'in_progress': 60, 'completed': 1 }
        };
        
        return mockDurations[taskId]?.[status] || 24;
    }

    /**
     * Initialize models
     */
    initializeModels() {
        // Initialize different prediction models
        this.models.set('rule_based', new RuleBasedModel());
        this.models.set('pattern_based', new PatternBasedModel());
        this.models.set('ml_based', new MLBasedModel());
        this.models.set('ensemble', new EnsembleModel());
    }

    /**
     * Train models
     */
    async trainModels(trainingData) {
        for (const [modelName, model] of this.models) {
            try {
                await model.train(trainingData);
                console.log(`Model ${modelName} trained successfully`);
            } catch (error) {
                console.error(`Error training model ${modelName}:`, error);
            }
        }
    }

    /**
     * Evaluate models
     */
    async evaluateModels(testData) {
        const evaluations = {};
        
        for (const [modelName, model] of this.models) {
            try {
                const evaluation = await model.evaluate(testData);
                evaluations[modelName] = evaluation;
            } catch (error) {
                console.error(`Error evaluating model ${modelName}:`, error);
                evaluations[modelName] = { error: error.message };
            }
        }
        
        return evaluations;
    }

    /**
     * Get prediction accuracy
     */
    getPredictionAccuracy() {
        const predictions = Array.from(this.predictions.values());
        if (predictions.length === 0) return 0;
        
        // This would typically calculate based on actual vs predicted
        // For now, return mock accuracy
        return this.predictionAccuracy;
    }

    /**
     * Get prediction statistics
     */
    getPredictionStatistics() {
        const predictions = Array.from(this.predictions.values());
        const totalPredictions = predictions.length;
        
        if (totalPredictions === 0) {
            return {
                totalPredictions: 0,
                averageConfidence: 0,
                statusDistribution: {},
                modelUsage: {}
            };
        }
        
        const statusDistribution = {};
        const modelUsage = {};
        let totalConfidence = 0;
        
        for (const prediction of predictions) {
            // Status distribution
            const status = prediction.predictedStatus;
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;
            
            // Model usage (from modelPredictions if available)
            if (prediction.modelPredictions) {
                for (const modelPred of prediction.modelPredictions) {
                    const model = modelPred.model;
                    modelUsage[model] = (modelUsage[model] || 0) + 1;
                }
            }
            
            totalConfidence += prediction.confidence;
        }
        
        return {
            totalPredictions,
            averageConfidence: totalConfidence / totalPredictions,
            statusDistribution,
            modelUsage
        };
    }

    /**
     * Stop the prediction engine
     */
    stop() {
        this.isRunning = false;
    }
}

/**
 * Rule-based prediction model
 */
class RuleBasedModel {
    constructor() {
        this.confidence = 0.7;
        this.rules = this.initializeRules();
    }
    
    initializeRules() {
        return [
            {
                condition: (features) => features.currentStatus === 'pending' && features.priority === 'high',
                prediction: { status: 'in_progress', confidence: 0.9 }
            },
            {
                condition: (features) => features.currentStatus === 'in_progress' && features.averageStatusDuration < 24,
                prediction: { status: 'completed', confidence: 0.8 }
            },
            {
                condition: (features) => features.currentStatus === 'in_progress' && features.complexity === 'high',
                prediction: { status: 'on_hold', confidence: 0.6 }
            },
            {
                condition: (features) => features.currentStatus === 'on_hold' && features.dependencies.length === 0,
                prediction: { status: 'in_progress', confidence: 0.7 }
            }
        ];
    }
    
    async predict(features) {
        for (const rule of this.rules) {
            if (rule.condition(features)) {
                return rule.prediction;
            }
        }
        
        // Default prediction
        return { status: 'in_progress', confidence: 0.5 };
    }
    
    async train(data) {
        // Rule-based models don't need training
        return true;
    }
    
    async evaluate(data) {
        // Mock evaluation
        return { accuracy: 0.75, precision: 0.72, recall: 0.78 };
    }
}

/**
 * Pattern-based prediction model
 */
class PatternBasedModel {
    constructor() {
        this.confidence = 0.8;
        this.patterns = new Map();
    }
    
    async predict(features) {
        const patternKey = this.generatePatternKey(features);
        const pattern = this.patterns.get(patternKey);
        
        if (pattern) {
            return {
                status: pattern.mostCommonStatus,
                confidence: pattern.confidence
            };
        }
        
        // Fallback prediction
        return { status: 'in_progress', confidence: 0.5 };
    }
    
    generatePatternKey(features) {
        return `${features.currentStatus}_${features.priority}_${features.complexity}_${features.dayOfWeek}`;
    }
    
    async train(data) {
        // Analyze patterns in training data
        for (const record of data) {
            const patternKey = this.generatePatternKey(record.features);
            
            if (!this.patterns.has(patternKey)) {
                this.patterns.set(patternKey, {
                    statusCounts: {},
                    totalCount: 0,
                    confidence: 0.5
                });
            }
            
            const pattern = this.patterns.get(patternKey);
            const status = record.actualStatus;
            
            pattern.statusCounts[status] = (pattern.statusCounts[status] || 0) + 1;
            pattern.totalCount++;
            
            // Find most common status
            let maxCount = 0;
            let mostCommonStatus = 'in_progress';
            
            for (const [status, count] of Object.entries(pattern.statusCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    mostCommonStatus = status;
                }
            }
            
            pattern.mostCommonStatus = mostCommonStatus;
            pattern.confidence = maxCount / pattern.totalCount;
        }
        
        return true;
    }
    
    async evaluate(data) {
        // Mock evaluation
        return { accuracy: 0.82, precision: 0.80, recall: 0.85 };
    }
}

/**
 * Machine learning-based prediction model
 */
class MLBasedModel {
    constructor() {
        this.confidence = 0.85;
        this.model = null;
    }
    
    async predict(features) {
        // Mock ML prediction
        const featureVector = this.featuresToVector(features);
        const prediction = this.mockMLPrediction(featureVector);
        
        return {
            status: prediction.status,
            confidence: prediction.confidence
        };
    }
    
    featuresToVector(features) {
        // Convert features to numerical vector
        return [
            features.priority === 'high' ? 1 : 0,
            features.complexity === 'high' ? 1 : 0,
            features.dayOfWeek / 7,
            features.hourOfDay / 24,
            features.updateFrequency,
            features.averageStatusDuration / 168, // Normalize to weeks
            features.teamSize / 10,
            features.teamExperience / 10
        ];
    }
    
    mockMLPrediction(featureVector) {
        // Mock ML prediction based on feature vector
        const score = featureVector.reduce((sum, val) => sum + val, 0);
        
        if (score > 0.7) {
            return { status: 'completed', confidence: 0.9 };
        } else if (score > 0.4) {
            return { status: 'in_progress', confidence: 0.8 };
        } else {
            return { status: 'pending', confidence: 0.6 };
        }
    }
    
    async train(data) {
        // Mock ML training
        console.log(`Training ML model with ${data.length} records`);
        return true;
    }
    
    async evaluate(data) {
        // Mock evaluation
        return { accuracy: 0.88, precision: 0.86, recall: 0.90 };
    }
}

/**
 * Ensemble prediction model
 */
class EnsembleModel {
    constructor() {
        this.confidence = 0.9;
        this.subModels = [
            new RuleBasedModel(),
            new PatternBasedModel(),
            new MLBasedModel()
        ];
    }
    
    async predict(features) {
        const predictions = [];
        
        for (const model of this.subModels) {
            try {
                const prediction = await model.predict(features);
                predictions.push(prediction);
            } catch (error) {
                console.error('Error in sub-model prediction:', error);
            }
        }
        
        if (predictions.length === 0) {
            return { status: 'in_progress', confidence: 0.5 };
        }
        
        // Weighted ensemble
        const statusVotes = {};
        let totalWeight = 0;
        
        for (const pred of predictions) {
            const status = pred.status;
            const weight = pred.confidence;
            
            if (!statusVotes[status]) {
                statusVotes[status] = { votes: 0, totalConfidence: 0 };
            }
            
            statusVotes[status].votes += 1;
            statusVotes[status].totalConfidence += weight;
            totalWeight += weight;
        }
        
        // Find best status
        let bestStatus = 'in_progress';
        let bestScore = 0;
        
        for (const [status, data] of Object.entries(statusVotes)) {
            const score = data.votes * (data.totalConfidence / data.votes);
            if (score > bestScore) {
                bestScore = score;
                bestStatus = status;
            }
        }
        
        return {
            status: bestStatus,
            confidence: Math.min(0.95, totalWeight / predictions.length)
        };
    }
    
    async train(data) {
        const results = [];
        
        for (const model of this.subModels) {
            try {
                const result = await model.train(data);
                results.push(result);
            } catch (error) {
                console.error('Error training sub-model:', error);
                results.push(false);
            }
        }
        
        return results.every(result => result);
    }
    
    async evaluate(data) {
        const evaluations = [];
        
        for (const model of this.subModels) {
            try {
                const evaluation = await model.evaluate(data);
                evaluations.push(evaluation);
            } catch (error) {
                console.error('Error evaluating sub-model:', error);
            }
        }
        
        // Average evaluation metrics
        if (evaluations.length === 0) {
            return { accuracy: 0, precision: 0, recall: 0 };
        }
        
        const avgAccuracy = evaluations.reduce((sum, eval) => sum + eval.accuracy, 0) / evaluations.length;
        const avgPrecision = evaluations.reduce((sum, eval) => sum + eval.precision, 0) / evaluations.length;
        const avgRecall = evaluations.reduce((sum, eval) => sum + eval.recall, 0) / evaluations.length;
        
        return {
            accuracy: avgAccuracy,
            precision: avgPrecision,
            recall: avgRecall
        };
    }
}

module.exports = PredictionEngine;
