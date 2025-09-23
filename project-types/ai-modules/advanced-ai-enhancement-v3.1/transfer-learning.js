const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Redis = require('redis');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3022;

// Redis client
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect();

// Transfer Learning configuration
const transferConfig = {
  strategies: {
    'feature_extraction': {
      name: 'Feature Extraction',
      description: 'Use pre-trained model as feature extractor',
      efficiency: 'high',
      accuracy: 'medium',
      data_requirement: 'low'
    },
    'fine_tuning': {
      name: 'Fine-tuning',
      description: 'Fine-tune pre-trained model on target task',
      efficiency: 'medium',
      accuracy: 'high',
      data_requirement: 'medium'
    },
    'progressive_unfreezing': {
      name: 'Progressive Unfreezing',
      description: 'Gradually unfreeze layers during training',
      efficiency: 'low',
      accuracy: 'very_high',
      data_requirement: 'medium'
    },
    'adversarial_training': {
      name: 'Adversarial Training',
      description: 'Use adversarial examples for robust transfer',
      efficiency: 'low',
      accuracy: 'high',
      data_requirement: 'high'
    },
    'domain_adaptation': {
      name: 'Domain Adaptation',
      description: 'Adapt model to target domain',
      efficiency: 'medium',
      accuracy: 'high',
      data_requirement: 'medium'
    },
    'multi_task_learning': {
      name: 'Multi-task Learning',
      description: 'Train on multiple related tasks',
      efficiency: 'medium',
      accuracy: 'high',
      data_requirement: 'high'
    }
  },
  preTrainedModels: {
    'resnet50': {
      name: 'ResNet-50',
      description: 'Residual network with 50 layers',
      inputSize: [224, 224, 3],
      parameters: 25.6e6,
      tasks: ['classification', 'detection', 'segmentation']
    },
    'vgg16': {
      name: 'VGG-16',
      description: 'Visual Geometry Group network',
      inputSize: [224, 224, 3],
      parameters: 138.4e6,
      tasks: ['classification', 'feature_extraction']
    },
    'inception_v3': {
      name: 'Inception-v3',
      description: 'Inception network with inception modules',
      inputSize: [299, 299, 3],
      parameters: 23.9e6,
      tasks: ['classification', 'detection']
    },
    'bert_base': {
      name: 'BERT-Base',
      description: 'Bidirectional Encoder Representations from Transformers',
      inputSize: [512],
      parameters: 110e6,
      tasks: ['nlp', 'classification', 'qa', 'ner']
    },
    'gpt2': {
      name: 'GPT-2',
      description: 'Generative Pre-trained Transformer 2',
      inputSize: [1024],
      parameters: 117e6,
      tasks: ['generation', 'completion', 'summarization']
    },
    't5_base': {
      name: 'T5-Base',
      description: 'Text-to-Text Transfer Transformer',
      inputSize: [512],
      parameters: 220e6,
      tasks: ['translation', 'summarization', 'qa', 'classification']
    }
  },
  domains: {
    'computer_vision': {
      name: 'Computer Vision',
      tasks: ['classification', 'detection', 'segmentation', 'generation'],
      datasets: ['imagenet', 'coco', 'pascal_voc', 'cifar10', 'cifar100']
    },
    'natural_language_processing': {
      name: 'Natural Language Processing',
      tasks: ['classification', 'generation', 'translation', 'qa', 'ner'],
      datasets: ['glue', 'squad', 'wmt', 'common_crawl', 'wikipedia']
    },
    'audio_processing': {
      name: 'Audio Processing',
      tasks: ['speech_recognition', 'music_generation', 'audio_classification'],
      datasets: ['librispeech', 'audioset', 'common_voice', 'musdb']
    },
    'time_series': {
      name: 'Time Series',
      tasks: ['forecasting', 'anomaly_detection', 'classification'],
      datasets: ['m4', 'electricity', 'traffic', 'weather']
    }
  }
};

// AI models for transfer learning
const aiModels = {
  modelLoader: null,
  featureExtractor: null,
  fineTuner: null,
  domainAdapter: null,
  multiTaskLearner: null
};

// Initialize AI models
async function initializeModels() {
  try {
    // Load TensorFlow models for transfer learning
    aiModels.modelLoader = await tf.loadLayersModel('file://./models/transfer/model-loader/model.json');
    aiModels.featureExtractor = await tf.loadLayersModel('file://./models/transfer/feature-extractor/model.json');
    aiModels.fineTuner = await tf.loadLayersModel('file://./models/transfer/fine-tuner/model.json');
    aiModels.domainAdapter = await tf.loadLayersModel('file://./models/transfer/domain-adapter/model.json');
    aiModels.multiTaskLearner = await tf.loadLayersModel('file://./models/transfer/multi-task-learner/model.json');
    
    console.log('Transfer Learning models loaded successfully');
  } catch (error) {
    console.error('Error loading Transfer Learning models:', error);
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many transfer learning requests, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.1.0',
    uptime: process.uptime(),
    models: Object.keys(aiModels).filter(key => aiModels[key] !== null).length
  });
});

// Get transfer strategies
app.get('/api/strategies', (req, res) => {
  res.json(transferConfig.strategies);
});

// Get pre-trained models
app.get('/api/pre-trained-models', (req, res) => {
  res.json(transferConfig.preTrainedModels);
});

// Get domains
app.get('/api/domains', (req, res) => {
  res.json(transferConfig.domains);
});

// Start transfer learning
app.post('/api/transfer/start', async (req, res) => {
  const { 
    sourceModel, 
    targetTask, 
    strategy, 
    targetDomain, 
    trainingConfig,
    dataConfig
  } = req.body;
  
  if (!sourceModel || !targetTask || !strategy) {
    return res.status(400).json({ error: 'Source model, target task, and strategy are required' });
  }
  
  try {
    const transferId = uuidv4();
    const result = await startTransferLearning(
      transferId,
      sourceModel,
      targetTask,
      strategy,
      targetDomain,
      trainingConfig,
      dataConfig
    );
    
    res.json({
      transferId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transfer status
app.get('/api/transfer/:transferId/status', async (req, res) => {
  const { transferId } = req.params;
  
  try {
    const status = await getTransferStatus(transferId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transfer results
app.get('/api/transfer/:transferId/results', async (req, res) => {
  const { transferId } = req.params;
  
  try {
    const results = await getTransferResults(transferId);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop transfer learning
app.post('/api/transfer/:transferId/stop', async (req, res) => {
  const { transferId } = req.params;
  
  try {
    const result = await stopTransferLearning(transferId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Evaluate transferred model
app.post('/api/evaluate', async (req, res) => {
  const { transferId, testData, metrics } = req.body;
  
  if (!transferId) {
    return res.status(400).json({ error: 'Transfer ID is required' });
  }
  
  try {
    const evaluationId = uuidv4();
    const result = await evaluateTransferredModel(transferId, testData, metrics, evaluationId);
    
    res.json({
      evaluationId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare transfer strategies
app.post('/api/compare-strategies', async (req, res) => {
  const { sourceModel, targetTask, strategies, testData } = req.body;
  
  if (!sourceModel || !targetTask || !strategies) {
    return res.status(400).json({ error: 'Source model, target task, and strategies are required' });
  }
  
  try {
    const comparisonId = uuidv4();
    const result = await compareTransferStrategies(sourceModel, targetTask, strategies, testData, comparisonId);
    
    res.json({
      comparisonId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Domain adaptation
app.post('/api/domain-adaptation', async (req, res) => {
  const { sourceDomain, targetDomain, model, adaptationMethod } = req.body;
  
  if (!sourceDomain || !targetDomain || !model) {
    return res.status(400).json({ error: 'Source domain, target domain, and model are required' });
  }
  
  try {
    const adaptationId = uuidv4();
    const result = await performDomainAdaptation(sourceDomain, targetDomain, model, adaptationMethod, adaptationId);
    
    res.json({
      adaptationId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Multi-task learning
app.post('/api/multi-task', async (req, res) => {
  const { tasks, sourceModel, trainingConfig } = req.body;
  
  if (!tasks || !sourceModel) {
    return res.status(400).json({ error: 'Tasks and source model are required' });
  }
  
  try {
    const multiTaskId = uuidv4();
    const result = await startMultiTaskLearning(tasks, sourceModel, trainingConfig, multiTaskId);
    
    res.json({
      multiTaskId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Knowledge distillation
app.post('/api/knowledge-distillation', async (req, res) => {
  const { teacherModel, studentModel, distillationConfig } = req.body;
  
  if (!teacherModel || !studentModel) {
    return res.status(400).json({ error: 'Teacher and student models are required' });
  }
  
  try {
    const distillationId = uuidv4();
    const result = await performKnowledgeDistillation(teacherModel, studentModel, distillationConfig, distillationId);
    
    res.json({
      distillationId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer learning functions
async function startTransferLearning(transferId, sourceModel, targetTask, strategy, targetDomain, trainingConfig, dataConfig) {
  const transfer = {
    id: transferId,
    sourceModel,
    targetTask,
    strategy,
    targetDomain: targetDomain || 'general',
    trainingConfig: trainingConfig || {},
    dataConfig: dataConfig || {},
    status: 'running',
    currentEpoch: 0,
    totalEpochs: trainingConfig?.epochs || 100,
    bestAccuracy: 0,
    currentAccuracy: 0,
    metrics: {
      accuracy: [],
      loss: [],
      validationAccuracy: [],
      validationLoss: []
    },
    startedAt: new Date().toISOString()
  };
  
  // Store transfer configuration
  await redis.hSet('transfer_learnings', transferId, JSON.stringify(transfer));
  
  // Simulate transfer learning process
  setTimeout(async () => {
    transfer.status = 'completed';
    transfer.completedAt = new Date().toISOString();
    transfer.bestAccuracy = Math.random() * 0.3 + 0.7; // 70-100% accuracy
    transfer.currentAccuracy = transfer.bestAccuracy;
    
    // Generate training metrics
    for (let i = 0; i < transfer.totalEpochs; i++) {
      transfer.metrics.accuracy.push(Math.random() * 0.2 + 0.8);
      transfer.metrics.loss.push(Math.random() * 2 + 0.1);
      transfer.metrics.validationAccuracy.push(Math.random() * 0.2 + 0.8);
      transfer.metrics.validationLoss.push(Math.random() * 2 + 0.1);
    }
    
    await redis.hSet('transfer_learnings', transferId, JSON.stringify(transfer));
  }, 120000); // Complete after 2 minutes
  
  return {
    transferId,
    status: 'started',
    message: 'Transfer learning started successfully',
    sourceModel: transfer.sourceModel,
    targetTask: transfer.targetTask,
    strategy: transfer.strategy,
    totalEpochs: transfer.totalEpochs
  };
}

async function getTransferStatus(transferId) {
  const transferData = await redis.hGet('transfer_learnings', transferId);
  if (!transferData) {
    throw new Error(`Transfer learning not found: ${transferId}`);
  }
  
  const transfer = JSON.parse(transferData);
  
  return {
    transferId,
    status: transfer.status,
    currentEpoch: transfer.currentEpoch,
    totalEpochs: transfer.totalEpochs,
    bestAccuracy: transfer.bestAccuracy,
    currentAccuracy: transfer.currentAccuracy,
    progress: (transfer.currentEpoch / transfer.totalEpochs) * 100,
    sourceModel: transfer.sourceModel,
    targetTask: transfer.targetTask,
    strategy: transfer.strategy,
    startedAt: transfer.startedAt,
    completedAt: transfer.completedAt
  };
}

async function getTransferResults(transferId) {
  const transferData = await redis.hGet('transfer_learnings', transferId);
  if (!transferData) {
    throw new Error(`Transfer learning not found: ${transferId}`);
  }
  
  const transfer = JSON.parse(transferData);
  
  return {
    transferId,
    finalAccuracy: transfer.bestAccuracy,
    metrics: transfer.metrics,
    sourceModel: transfer.sourceModel,
    targetTask: transfer.targetTask,
    strategy: transfer.strategy,
    targetDomain: transfer.targetDomain,
    duration: transfer.completedAt ? 
      new Date(transfer.completedAt) - new Date(transfer.startedAt) : 
      Date.now() - new Date(transfer.startedAt)
  };
}

async function stopTransferLearning(transferId) {
  const transferData = await redis.hGet('transfer_learnings', transferId);
  if (!transferData) {
    throw new Error(`Transfer learning not found: ${transferId}`);
  }
  
  const transfer = JSON.parse(transferData);
  transfer.status = 'stopped';
  transfer.stoppedAt = new Date().toISOString();
  
  await redis.hSet('transfer_learnings', transferId, JSON.stringify(transfer));
  
  return {
    transferId,
    status: 'stopped',
    message: 'Transfer learning stopped successfully'
  };
}

async function evaluateTransferredModel(transferId, testData, metrics, evaluationId) {
  const transferData = await redis.hGet('transfer_learnings', transferId);
  if (!transferData) {
    throw new Error(`Transfer learning not found: ${transferId}`);
  }
  
  const transfer = JSON.parse(transferData);
  
  // Simulate model evaluation
  const evaluation = {
    id: evaluationId,
    transferId,
    testData: testData || {},
    metrics: metrics || ['accuracy', 'precision', 'recall', 'f1'],
    results: {
      accuracy: Math.random() * 0.2 + 0.8,
      precision: Math.random() * 0.2 + 0.8,
      recall: Math.random() * 0.2 + 0.8,
      f1: Math.random() * 0.2 + 0.8,
      confusionMatrix: generateConfusionMatrix(5),
      classificationReport: generateClassificationReport(5)
    },
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store evaluation
  await redis.hSet('transfer_evaluations', evaluationId, JSON.stringify(evaluation));
  
  return evaluation;
}

async function compareTransferStrategies(sourceModel, targetTask, strategies, testData, comparisonId) {
  // Simulate strategy comparison
  const comparison = {
    id: comparisonId,
    sourceModel,
    targetTask,
    strategies,
    testData: testData || {},
    results: strategies.map(strategy => ({
      strategy,
      accuracy: Math.random() * 0.3 + 0.7,
      trainingTime: Math.random() * 3600 + 1800, // 30 minutes - 1.5 hours
      memoryUsage: Math.random() * 2000 + 1000, // 1-3 GB
      parameters: Math.floor(Math.random() * 10000000) + 1000000,
      efficiency: Math.random() * 0.4 + 0.6
    })),
    bestStrategy: strategies[Math.floor(Math.random() * strategies.length)],
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store comparison
  await redis.hSet('transfer_comparisons', comparisonId, JSON.stringify(comparison));
  
  return comparison;
}

async function performDomainAdaptation(sourceDomain, targetDomain, model, adaptationMethod, adaptationId) {
  // Simulate domain adaptation
  const adaptation = {
    id: adaptationId,
    sourceDomain,
    targetDomain,
    model,
    adaptationMethod: adaptationMethod || 'adversarial',
    results: {
      sourceAccuracy: Math.random() * 0.2 + 0.8,
      targetAccuracy: Math.random() * 0.2 + 0.8,
      adaptationGain: Math.random() * 0.1 + 0.05, // 5-15% improvement
      domainGap: Math.random() * 0.3 + 0.1, // 10-40% gap
      adaptationTime: Math.random() * 1800 + 600 // 10-40 minutes
    },
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store adaptation
  await redis.hSet('domain_adaptations', adaptationId, JSON.stringify(adaptation));
  
  return adaptation;
}

async function startMultiTaskLearning(tasks, sourceModel, trainingConfig, multiTaskId) {
  // Simulate multi-task learning
  const multiTask = {
    id: multiTaskId,
    tasks,
    sourceModel,
    trainingConfig: trainingConfig || {},
    status: 'running',
    currentEpoch: 0,
    totalEpochs: trainingConfig?.epochs || 100,
    taskMetrics: tasks.map(task => ({
      task,
      accuracy: Math.random() * 0.2 + 0.8,
      loss: Math.random() * 2 + 0.1
    })),
    startedAt: new Date().toISOString()
  };
  
  // Store multi-task configuration
  await redis.hSet('multi_task_learnings', multiTaskId, JSON.stringify(multiTask));
  
  return {
    multiTaskId,
    status: 'started',
    message: 'Multi-task learning started successfully',
    tasks: multiTask.tasks,
    sourceModel: multiTask.sourceModel
  };
}

async function performKnowledgeDistillation(teacherModel, studentModel, distillationConfig, distillationId) {
  // Simulate knowledge distillation
  const distillation = {
    id: distillationId,
    teacherModel,
    studentModel,
    distillationConfig: distillationConfig || {},
    results: {
      teacherAccuracy: Math.random() * 0.1 + 0.9,
      studentAccuracy: Math.random() * 0.2 + 0.8,
      distillationLoss: Math.random() * 0.5 + 0.1,
      compressionRatio: Math.random() * 0.8 + 0.2, // 20-100% compression
      speedup: Math.random() * 5 + 2 // 2-7x speedup
    },
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store distillation
  await redis.hSet('knowledge_distillations', distillationId, JSON.stringify(distillation));
  
  return distillation;
}

// Helper functions
function generateConfusionMatrix(numClasses) {
  const matrix = [];
  for (let i = 0; i < numClasses; i++) {
    const row = [];
    for (let j = 0; j < numClasses; j++) {
      row.push(Math.floor(Math.random() * 100) + 10);
    }
    matrix.push(row);
  }
  return matrix;
}

function generateClassificationReport(numClasses) {
  const report = {};
  for (let i = 0; i < numClasses; i++) {
    report[`class_${i}`] = {
      precision: Math.random() * 0.2 + 0.8,
      recall: Math.random() * 0.2 + 0.8,
      f1Score: Math.random() * 0.2 + 0.8,
      support: Math.floor(Math.random() * 1000) + 100
    };
  }
  return report;
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Transfer Learning Error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Initialize models and start server
initializeModels().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Transfer Learning v3.1 running on port ${PORT}`);
    console.log(`🔄 Enhanced transfer learning capabilities enabled`);
    console.log(`📊 Multiple transfer strategies supported`);
    console.log(`🌐 Domain adaptation enabled`);
    console.log(`🎯 Multi-task learning enabled`);
    console.log(`🧠 Knowledge distillation enabled`);
  });
});

module.exports = app;
