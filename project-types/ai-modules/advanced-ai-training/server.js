const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const compression = require('compression');
const winston = require('winston');
const axios = require('axios');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// TensorFlow and ML Libraries
const tf = require('@tensorflow/tfjs-node');

// AI Model Providers
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3018;

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: 'logs/ai-training-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/ai-training-combined.log' })
    ]
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 25, // allow 25 requests per 15 minutes, then...
    delayMs: 2000 // begin adding 2000ms of delay per request above 25
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads', 'training-data');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /csv|json|txt|zip|tar\.gz/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        
        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only CSV, JSON, TXT, ZIP, and TAR.GZ files are allowed'));
        }
    }
});

// Advanced AI Training Configuration v2.7.0
const trainingConfig = {
    version: '2.7.0',
    features: {
        customModelTraining: true,
        fineTuning: true,
        transferLearning: true,
        hyperparameterTuning: true,
        modelEvaluation: true,
        modelDeployment: true,
        distributedTraining: true,
        federatedLearning: true,
        autoML: true,
        modelVersioning: true,
        experimentTracking: true,
        modelMonitoring: true,
        modelServing: true,
        modelOptimization: true,
        modelCompression: true
    },
    supportedAlgorithms: {
        classification: [
            'logistic_regression',
            'random_forest',
            'gradient_boosting',
            'svm',
            'neural_network',
            'deep_neural_network',
            'cnn',
            'rnn',
            'lstm',
            'transformer'
        ],
        regression: [
            'linear_regression',
            'polynomial_regression',
            'ridge_regression',
            'lasso_regression',
            'elastic_net',
            'random_forest',
            'gradient_boosting',
            'neural_network',
            'deep_neural_network'
        ],
        clustering: [
            'kmeans',
            'hierarchical',
            'dbscan',
            'gaussian_mixture',
            'spectral_clustering'
        ],
        deepLearning: [
            'cnn',
            'rnn',
            'lstm',
            'gru',
            'transformer',
            'bert',
            'gpt',
            'resnet',
            'vgg',
            'inception'
        ]
    },
    supportedFrameworks: [
        'tensorflow',
        'pytorch',
        'scikit-learn',
        'keras',
        'xgboost',
        'lightgbm',
        'catboost'
    ],
    limits: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxTrainingTime: 24 * 60 * 60 * 1000, // 24 hours
        maxConcurrentTraining: 5,
        maxModelsPerUser: 100,
        maxDataPoints: 1000000,
        maxFeatures: 10000
    }
};

// Initialize AI Model Clients
const aiClients = {};

function initializeAIClients() {
    try {
        // OpenAI
        if (process.env.OPENAI_API_KEY) {
            aiClients.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
            logger.info('OpenAI client initialized for AI Training');
        }

        // Anthropic
        if (process.env.ANTHROPIC_API_KEY) {
            aiClients.anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY
            });
            logger.info('Anthropic client initialized for AI Training');
        }

        // Google
        if (process.env.GOOGLE_API_KEY) {
            aiClients.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            logger.info('Google client initialized for AI Training');
        }

        logger.info('AI clients initialization completed for AI Training');
    } catch (error) {
        logger.error('Error initializing AI clients for AI Training:', error);
    }
}

// AI Training Data Storage
let trainingData = {
    models: new Map(),
    trainingJobs: new Map(),
    experiments: new Map(),
    analytics: {
        totalModels: 0,
        totalTrainingJobs: 0,
        totalExperiments: 0,
        averageTrainingTime: 0,
        successRate: 0,
        errorRate: 0
    },
    performance: {
        trainingTimes: [],
        modelAccuracies: [],
        errorRates: [],
        resourceUsage: []
    }
};

// Utility Functions
function generateModelId() {
    return uuidv4();
}

function generateJobId() {
    return uuidv4();
}

function updateAnalytics(jobType, duration, success, accuracy = null) {
    trainingData.analytics.totalTrainingJobs++;
    
    if (jobType === 'model_training') {
        trainingData.analytics.totalModels++;
    } else if (jobType === 'experiment') {
        trainingData.analytics.totalExperiments++;
    }
    
    // Update performance metrics
    trainingData.performance.trainingTimes.push(duration);
    
    if (accuracy !== null) {
        trainingData.performance.modelAccuracies.push(accuracy);
    }
    
    if (success) {
        trainingData.analytics.successRate = (trainingData.analytics.successRate * (trainingData.analytics.totalTrainingJobs - 1) + 1) / trainingData.analytics.totalTrainingJobs;
    } else {
        trainingData.analytics.errorRate = (trainingData.analytics.errorRate * (trainingData.analytics.totalTrainingJobs - 1) + 1) / trainingData.analytics.totalTrainingJobs;
    }
    
    // Calculate average training time
    const totalTrainingTime = trainingData.performance.trainingTimes.reduce((a, b) => a + b, 0);
    trainingData.analytics.averageTrainingTime = totalTrainingTime / trainingData.performance.trainingTimes.length;
}

// AI Training Functions
async function trainModel(modelConfig, trainingData, options = {}) {
    const startTime = Date.now();
    const jobId = generateJobId();
    
    try {
        // Create training job
        const trainingJob = {
            id: jobId,
            modelConfig,
            trainingData,
            options,
            status: 'running',
            startTime: new Date().toISOString(),
            progress: 0,
            logs: []
        };
        
        trainingData.trainingJobs.set(jobId, trainingJob);
        
        // Simulate training process
        const trainingResult = await simulateTraining(modelConfig, trainingData, options, jobId);
        
        // Update job status
        trainingJob.status = 'completed';
        trainingJob.endTime = new Date().toISOString();
        trainingJob.progress = 100;
        trainingJob.result = trainingResult;
        
        trainingData.trainingJobs.set(jobId, trainingJob);
        
        // Create model record
        const modelId = generateModelId();
        const model = {
            id: modelId,
            jobId,
            name: modelConfig.name,
            type: modelConfig.type,
            algorithm: modelConfig.algorithm,
            framework: modelConfig.framework,
            accuracy: trainingResult.accuracy,
            metrics: trainingResult.metrics,
            createdAt: new Date().toISOString(),
            status: 'trained',
            version: '1.0.0'
        };
        
        trainingData.models.set(modelId, model);
        
        const duration = Date.now() - startTime;
        updateAnalytics('model_training', duration, true, trainingResult.accuracy);
        
        return {
            success: true,
            modelId,
            jobId,
            result: trainingResult,
            duration
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        updateAnalytics('model_training', duration, false);
        
        logger.error('Model training error:', error);
        throw error;
    }
}

async function simulateTraining(modelConfig, trainingData, options, jobId) {
    // This is a simulation - in a real implementation, you would use actual ML frameworks
    const steps = 100;
    const stepDuration = 100; // 100ms per step
    
    for (let i = 0; i < steps; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
        
        // Update progress
        const job = trainingData.trainingJobs.get(jobId);
        if (job) {
            job.progress = Math.round((i / steps) * 100);
            job.logs.push(`Training step ${i + 1}/${steps}`);
            trainingData.trainingJobs.set(jobId, job);
        }
    }
    
    // Simulate training result
    const accuracy = 0.85 + Math.random() * 0.1; // 85-95% accuracy
    const metrics = {
        accuracy,
        precision: accuracy - 0.02,
        recall: accuracy - 0.01,
        f1Score: accuracy - 0.015,
        loss: 1 - accuracy
    };
    
    return {
        accuracy,
        metrics,
        trainingTime: steps * stepDuration,
        epochs: options.epochs || 100,
        batchSize: options.batchSize || 32
    };
}

async function fineTuneModel(baseModelId, fineTuneData, options = {}) {
    const startTime = Date.now();
    const jobId = generateJobId();
    
    try {
        const baseModel = trainingData.models.get(baseModelId);
        if (!baseModel) {
            throw new Error('Base model not found');
        }
        
        // Create fine-tuning job
        const fineTuneJob = {
            id: jobId,
            baseModelId,
            fineTuneData,
            options,
            status: 'running',
            startTime: new Date().toISOString(),
            progress: 0,
            logs: []
        };
        
        trainingData.trainingJobs.set(jobId, fineTuneJob);
        
        // Simulate fine-tuning process
        const fineTuneResult = await simulateFineTuning(baseModel, fineTuneData, options, jobId);
        
        // Update job status
        fineTuneJob.status = 'completed';
        fineTuneJob.endTime = new Date().toISOString();
        fineTuneJob.progress = 100;
        fineTuneJob.result = fineTuneResult;
        
        trainingData.trainingJobs.set(jobId, fineTuneJob);
        
        // Create fine-tuned model
        const modelId = generateModelId();
        const model = {
            id: modelId,
            jobId,
            baseModelId,
            name: `${baseModel.name} (Fine-tuned)`,
            type: baseModel.type,
            algorithm: baseModel.algorithm,
            framework: baseModel.framework,
            accuracy: fineTuneResult.accuracy,
            metrics: fineTuneResult.metrics,
            createdAt: new Date().toISOString(),
            status: 'trained',
            version: '1.1.0'
        };
        
        trainingData.models.set(modelId, model);
        
        const duration = Date.now() - startTime;
        updateAnalytics('model_training', duration, true, fineTuneResult.accuracy);
        
        return {
            success: true,
            modelId,
            jobId,
            result: fineTuneResult,
            duration
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        updateAnalytics('model_training', duration, false);
        
        logger.error('Model fine-tuning error:', error);
        throw error;
    }
}

async function simulateFineTuning(baseModel, fineTuneData, options, jobId) {
    const steps = 50; // Fine-tuning typically takes fewer steps
    const stepDuration = 80; // 80ms per step
    
    for (let i = 0; i < steps; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
        
        // Update progress
        const job = trainingData.trainingJobs.get(jobId);
        if (job) {
            job.progress = Math.round((i / steps) * 100);
            job.logs.push(`Fine-tuning step ${i + 1}/${steps}`);
            trainingData.trainingJobs.set(jobId, job);
        }
    }
    
    // Simulate fine-tuning result (usually improves accuracy)
    const baseAccuracy = baseModel.accuracy;
    const improvement = Math.random() * 0.05; // 0-5% improvement
    const accuracy = Math.min(baseAccuracy + improvement, 0.99);
    
    const metrics = {
        accuracy,
        precision: accuracy - 0.02,
        recall: accuracy - 0.01,
        f1Score: accuracy - 0.015,
        loss: 1 - accuracy,
        improvement: improvement
    };
    
    return {
        accuracy,
        metrics,
        trainingTime: steps * stepDuration,
        epochs: options.epochs || 50,
        batchSize: options.batchSize || 32
    };
}

async function hyperparameterTuning(modelConfig, trainingData, searchSpace, options = {}) {
    const startTime = Date.now();
    const jobId = generateJobId();
    
    try {
        // Create hyperparameter tuning job
        const tuningJob = {
            id: jobId,
            modelConfig,
            trainingData,
            searchSpace,
            options,
            status: 'running',
            startTime: new Date().toISOString(),
            progress: 0,
            logs: [],
            trials: []
        };
        
        trainingData.trainingJobs.set(jobId, tuningJob);
        
        // Simulate hyperparameter tuning
        const tuningResult = await simulateHyperparameterTuning(modelConfig, trainingData, searchSpace, options, jobId);
        
        // Update job status
        tuningJob.status = 'completed';
        tuningJob.endTime = new Date().toISOString();
        tuningJob.progress = 100;
        tuningJob.result = tuningResult;
        
        trainingData.trainingJobs.set(jobId, tuningJob);
        
        const duration = Date.now() - startTime;
        updateAnalytics('experiment', duration, true, tuningResult.bestAccuracy);
        
        return {
            success: true,
            jobId,
            result: tuningResult,
            duration
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        updateAnalytics('experiment', duration, false);
        
        logger.error('Hyperparameter tuning error:', error);
        throw error;
    }
}

async function simulateHyperparameterTuning(modelConfig, trainingData, searchSpace, options, jobId) {
    const numTrials = options.numTrials || 10;
    const trials = [];
    
    for (let i = 0; i < numTrials; i++) {
        // Generate random hyperparameters
        const hyperparams = {};
        for (const [param, range] of Object.entries(searchSpace)) {
            if (range.type === 'uniform') {
                hyperparams[param] = range.min + Math.random() * (range.max - range.min);
            } else if (range.type === 'choice') {
                hyperparams[param] = range.values[Math.floor(Math.random() * range.values.length)];
            }
        }
        
        // Simulate training with these hyperparameters
        const accuracy = 0.8 + Math.random() * 0.15; // 80-95% accuracy
        const trial = {
            trialId: i + 1,
            hyperparams,
            accuracy,
            loss: 1 - accuracy,
            trainingTime: 1000 + Math.random() * 2000 // 1-3 seconds
        };
        
        trials.push(trial);
        
        // Update progress
        const job = trainingData.trainingJobs.get(jobId);
        if (job) {
            job.progress = Math.round(((i + 1) / numTrials) * 100);
            job.trials = trials;
            job.logs.push(`Trial ${i + 1}/${numTrials} completed - Accuracy: ${accuracy.toFixed(3)}`);
            trainingData.trainingJobs.set(jobId, job);
        }
        
        // Small delay between trials
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Find best trial
    const bestTrial = trials.reduce((best, current) => 
        current.accuracy > best.accuracy ? current : best
    );
    
    return {
        bestTrial,
        allTrials: trials,
        bestAccuracy: bestTrial.accuracy,
        bestHyperparams: bestTrial.hyperparams,
        totalTrials: numTrials
    };
}

async function evaluateModel(modelId, testData, metrics = ['accuracy', 'precision', 'recall', 'f1Score']) {
    const startTime = Date.now();
    
    try {
        const model = trainingData.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        // Simulate model evaluation
        const evaluationResult = {
            modelId,
            metrics: {},
            confusionMatrix: null,
            rocCurve: null,
            precisionRecallCurve: null
        };
        
        // Simulate metrics calculation
        for (const metric of metrics) {
            if (metric === 'accuracy') {
                evaluationResult.metrics.accuracy = model.accuracy;
            } else if (metric === 'precision') {
                evaluationResult.metrics.precision = model.accuracy - 0.02;
            } else if (metric === 'recall') {
                evaluationResult.metrics.recall = model.accuracy - 0.01;
            } else if (metric === 'f1Score') {
                evaluationResult.metrics.f1Score = model.accuracy - 0.015;
            }
        }
        
        // Simulate confusion matrix
        if (metrics.includes('confusionMatrix')) {
            evaluationResult.confusionMatrix = {
                truePositives: Math.round(model.accuracy * 100),
                falsePositives: Math.round((1 - model.accuracy) * 20),
                trueNegatives: Math.round(model.accuracy * 80),
                falseNegatives: Math.round((1 - model.accuracy) * 100)
            };
        }
        
        const duration = Date.now() - startTime;
        updateAnalytics('model_evaluation', duration, true);
        
        return {
            success: true,
            evaluation: evaluationResult,
            duration
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        updateAnalytics('model_evaluation', duration, false);
        
        logger.error('Model evaluation error:', error);
        throw error;
    }
}

// Initialize AI clients
initializeAIClients();

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Advanced AI Training',
        version: trainingConfig.version,
        timestamp: new Date().toISOString(),
        features: trainingConfig.features,
        modelsLoaded: trainingData.models.size
    });
});

// Get configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...trainingConfig,
            clients: Object.keys(aiClients),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
    }
});

// Train model
app.post('/api/train', upload.single('data'), async (req, res) => {
    try {
        const { modelConfig, options = {} } = req.body;
        
        if (!modelConfig) {
            return res.status(400).json({ error: 'Model configuration is required' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'Training data file is required' });
        }
        
        // Parse model configuration
        const parsedModelConfig = typeof modelConfig === 'string' ? JSON.parse(modelConfig) : modelConfig;
        
        // Parse options
        const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
        
        const result = await trainModel(parsedModelConfig, req.file.path, parsedOptions);
        res.json(result);
        
    } catch (error) {
        logger.error('Error training model:', error);
        res.status(500).json({ error: 'Failed to train model', details: error.message });
    }
});

// Fine-tune model
app.post('/api/fine-tune', upload.single('data'), async (req, res) => {
    try {
        const { baseModelId, options = {} } = req.body;
        
        if (!baseModelId) {
            return res.status(400).json({ error: 'Base model ID is required' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'Fine-tuning data file is required' });
        }
        
        // Parse options
        const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
        
        const result = await fineTuneModel(baseModelId, req.file.path, parsedOptions);
        res.json(result);
        
    } catch (error) {
        logger.error('Error fine-tuning model:', error);
        res.status(500).json({ error: 'Failed to fine-tune model', details: error.message });
    }
});

// Hyperparameter tuning
app.post('/api/hyperparameter-tuning', upload.single('data'), async (req, res) => {
    try {
        const { modelConfig, searchSpace, options = {} } = req.body;
        
        if (!modelConfig || !searchSpace) {
            return res.status(400).json({ error: 'Model configuration and search space are required' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'Training data file is required' });
        }
        
        // Parse configurations
        const parsedModelConfig = typeof modelConfig === 'string' ? JSON.parse(modelConfig) : modelConfig;
        const parsedSearchSpace = typeof searchSpace === 'string' ? JSON.parse(searchSpace) : searchSpace;
        const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
        
        const result = await hyperparameterTuning(parsedModelConfig, req.file.path, parsedSearchSpace, parsedOptions);
        res.json(result);
        
    } catch (error) {
        logger.error('Error performing hyperparameter tuning:', error);
        res.status(500).json({ error: 'Failed to perform hyperparameter tuning', details: error.message });
    }
});

// Evaluate model
app.post('/api/evaluate', upload.single('data'), async (req, res) => {
    try {
        const { modelId, metrics = ['accuracy', 'precision', 'recall', 'f1Score'] } = req.body;
        
        if (!modelId) {
            return res.status(400).json({ error: 'Model ID is required' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'Test data file is required' });
        }
        
        const result = await evaluateModel(modelId, req.file.path, metrics);
        res.json(result);
        
    } catch (error) {
        logger.error('Error evaluating model:', error);
        res.status(500).json({ error: 'Failed to evaluate model', details: error.message });
    }
});

// Get models
app.get('/api/models', (req, res) => {
    try {
        const { status, type, limit = 50, offset = 0 } = req.query;
        
        let models = Array.from(trainingData.models.values());
        
        // Apply filters
        if (status) {
            models = models.filter(model => model.status === status);
        }
        
        if (type) {
            models = models.filter(model => model.type === type);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedModels = models.slice(startIndex, endIndex);
        
        res.json({
            models: paginatedModels,
            total: models.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting models:', error);
        res.status(500).json({ error: 'Failed to get models', details: error.message });
    }
});

// Get specific model
app.get('/api/models/:modelId', (req, res) => {
    try {
        const { modelId } = req.params;
        const model = trainingData.models.get(modelId);
        
        if (!model) {
            return res.status(404).json({ error: 'Model not found' });
        }
        
        res.json(model);
        
    } catch (error) {
        logger.error('Error getting model:', error);
        res.status(500).json({ error: 'Failed to get model', details: error.message });
    }
});

// Get training jobs
app.get('/api/jobs', (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        
        let jobs = Array.from(trainingData.trainingJobs.values());
        
        // Apply filters
        if (status) {
            jobs = jobs.filter(job => job.status === status);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedJobs = jobs.slice(startIndex, endIndex);
        
        res.json({
            jobs: paginatedJobs,
            total: jobs.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting training jobs:', error);
        res.status(500).json({ error: 'Failed to get training jobs', details: error.message });
    }
});

// Get specific training job
app.get('/api/jobs/:jobId', (req, res) => {
    try {
        const { jobId } = req.params;
        const job = trainingData.trainingJobs.get(jobId);
        
        if (!job) {
            return res.status(404).json({ error: 'Training job not found' });
        }
        
        res.json(job);
        
    } catch (error) {
        logger.error('Error getting training job:', error);
        res.status(500).json({ error: 'Failed to get training job', details: error.message });
    }
});

// Get analytics
app.get('/api/analytics', (req, res) => {
    try {
        const { period = '24h' } = req.query;
        
        const now = new Date();
        let startDate;
        
        switch (period) {
            case '1h':
                startDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        const analytics = {
            period,
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            overview: {
                totalModels: trainingData.analytics.totalModels,
                totalTrainingJobs: trainingData.analytics.totalTrainingJobs,
                totalExperiments: trainingData.analytics.totalExperiments,
                averageTrainingTime: trainingData.analytics.averageTrainingTime,
                successRate: trainingData.analytics.successRate,
                errorRate: trainingData.analytics.errorRate
            },
            performance: {
                averageTrainingTime: trainingData.analytics.averageTrainingTime,
                modelAccuracies: trainingData.performance.modelAccuracies,
                errorRates: trainingData.performance.errorRates
            }
        };
        
        res.json(analytics);
        
    } catch (error) {
        logger.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics', details: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🤖 Advanced AI Training v2.7.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`🧠 Features: Custom Training, Fine-tuning, Hyperparameter Tuning`);
    console.log(`📈 Capabilities: Model Evaluation, Experiment Tracking, AutoML`);
});

module.exports = app;
