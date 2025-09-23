const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Redis = require('redis');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3023;

// Redis client
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect();

// Meta-Learning configuration
const metaConfig = {
  algorithms: {
    'maml': {
      name: 'Model-Agnostic Meta-Learning',
      description: 'Learn to learn with gradient-based adaptation',
      type: 'gradient_based',
      complexity: 'high',
      efficiency: 'medium'
    },
    'reptile': {
      name: 'Reptile',
      description: 'Simple meta-learning algorithm',
      type: 'gradient_based',
      complexity: 'medium',
      efficiency: 'high'
    },
    'prototypical_networks': {
      name: 'Prototypical Networks',
      description: 'Few-shot learning with prototypes',
      type: 'metric_based',
      complexity: 'low',
      efficiency: 'very_high'
    },
    'matching_networks': {
      name: 'Matching Networks',
      description: 'Memory-augmented few-shot learning',
      type: 'metric_based',
      complexity: 'medium',
      efficiency: 'high'
    },
    'relation_networks': {
      name: 'Relation Networks',
      description: 'Learn to compare with relation modules',
      type: 'metric_based',
      complexity: 'medium',
      efficiency: 'high'
    },
    'meta_sgd': {
      name: 'Meta-SGD',
      description: 'Learn both initialization and update direction',
      type: 'gradient_based',
      complexity: 'high',
      efficiency: 'medium'
    },
    'leo': {
      name: 'LEO',
      description: 'Latent Embedding Optimization',
      type: 'gradient_based',
      complexity: 'very_high',
      efficiency: 'low'
    },
    'meta_learning_lstm': {
      name: 'Meta-Learning LSTM',
      description: 'LSTM-based meta-learning optimizer',
      type: 'optimizer_based',
      complexity: 'high',
      efficiency: 'medium'
    }
  },
  tasks: {
    'few_shot_classification': {
      name: 'Few-shot Classification',
      description: 'Learn to classify with few examples',
      difficulty: 'medium',
      data_requirement: 'low'
    },
    'few_shot_regression': {
      name: 'Few-shot Regression',
      description: 'Learn to regress with few examples',
      difficulty: 'medium',
      data_requirement: 'low'
    },
    'few_shot_detection': {
      name: 'Few-shot Detection',
      description: 'Learn to detect objects with few examples',
      difficulty: 'hard',
      data_requirement: 'medium'
    },
    'few_shot_segmentation': {
      name: 'Few-shot Segmentation',
      description: 'Learn to segment with few examples',
      difficulty: 'hard',
      data_requirement: 'medium'
    },
    'continual_learning': {
      name: 'Continual Learning',
      description: 'Learn new tasks without forgetting old ones',
      difficulty: 'very_hard',
      data_requirement: 'high'
    },
    'neural_architecture_search': {
      name: 'Neural Architecture Search',
      description: 'Learn to design neural architectures',
      difficulty: 'very_hard',
      data_requirement: 'very_high'
    }
  },
  datasets: {
    'omniglot': {
      name: 'Omniglot',
      description: 'Few-shot character recognition',
      tasks: ['few_shot_classification'],
      samples: 32460,
      classes: 1623
    },
    'mini_imagenet': {
      name: 'Mini-ImageNet',
      description: 'Few-shot image classification',
      tasks: ['few_shot_classification'],
      samples: 60000,
      classes: 100
    },
    'tiered_imagenet': {
      name: 'Tiered-ImageNet',
      description: 'Hierarchical few-shot learning',
      tasks: ['few_shot_classification'],
      samples: 779165,
      classes: 608
    },
    'cifar_fs': {
      name: 'CIFAR-FS',
      description: 'Few-shot CIFAR classification',
      tasks: ['few_shot_classification'],
      samples: 60000,
      classes: 100
    },
    'fc100': {
      name: 'FC100',
      description: 'Few-shot CIFAR-100',
      tasks: ['few_shot_classification'],
      samples: 60000,
      classes: 100
    }
  }
};

// AI models for meta-learning
const aiModels = {
  metaLearner: null,
  taskEncoder: null,
  adaptationModule: null,
  memoryModule: null,
  optimizer: null
};

// Initialize AI models
async function initializeModels() {
  try {
    // Load TensorFlow models for meta-learning
    aiModels.metaLearner = await tf.loadLayersModel('file://./models/meta/meta-learner/model.json');
    aiModels.taskEncoder = await tf.loadLayersModel('file://./models/meta/task-encoder/model.json');
    aiModels.adaptationModule = await tf.loadLayersModel('file://./models/meta/adaptation-module/model.json');
    aiModels.memoryModule = await tf.loadLayersModel('file://./models/meta/memory-module/model.json');
    aiModels.optimizer = await tf.loadLayersModel('file://./models/meta/optimizer/model.json');
    
    console.log('Meta-Learning models loaded successfully');
  } catch (error) {
    console.error('Error loading Meta-Learning models:', error);
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
  message: 'Too many meta-learning requests, please try again later.'
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

// Get algorithms
app.get('/api/algorithms', (req, res) => {
  res.json(metaConfig.algorithms);
});

// Get tasks
app.get('/api/tasks', (req, res) => {
  res.json(metaConfig.tasks);
});

// Get datasets
app.get('/api/datasets', (req, res) => {
  res.json(metaConfig.datasets);
});

// Start meta-learning
app.post('/api/meta-learning/start', async (req, res) => {
  const { 
    algorithm, 
    task, 
    dataset, 
    numShots, 
    numWays, 
    trainingConfig,
    metaConfig: metaLearningConfig
  } = req.body;
  
  if (!algorithm || !task || !dataset) {
    return res.status(400).json({ error: 'Algorithm, task, and dataset are required' });
  }
  
  try {
    const metaId = uuidv4();
    const result = await startMetaLearning(
      metaId,
      algorithm,
      task,
      dataset,
      numShots,
      numWays,
      trainingConfig,
      metaLearningConfig
    );
    
    res.json({
      metaId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get meta-learning status
app.get('/api/meta-learning/:metaId/status', async (req, res) => {
  const { metaId } = req.params;
  
  try {
    const status = await getMetaLearningStatus(metaId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get meta-learning results
app.get('/api/meta-learning/:metaId/results', async (req, res) => {
  const { metaId } = req.params;
  
  try {
    const results = await getMetaLearningResults(metaId);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop meta-learning
app.post('/api/meta-learning/:metaId/stop', async (req, res) => {
  const { metaId } = req.params;
  
  try {
    const result = await stopMetaLearning(metaId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Evaluate meta-learner
app.post('/api/evaluate', async (req, res) => {
  const { metaId, testTasks, numEpisodes } = req.body;
  
  if (!metaId) {
    return res.status(400).json({ error: 'Meta-learning ID is required' });
  }
  
  try {
    const evaluationId = uuidv4();
    const result = await evaluateMetaLearner(metaId, testTasks, numEpisodes, evaluationId);
    
    res.json({
      evaluationId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Few-shot learning
app.post('/api/few-shot', async (req, res) => {
  const { 
    supportSet, 
    querySet, 
    algorithm, 
    numShots, 
    numWays 
  } = req.body;
  
  if (!supportSet || !querySet || !algorithm) {
    return res.status(400).json({ error: 'Support set, query set, and algorithm are required' });
  }
  
  try {
    const fewShotId = uuidv4();
    const result = await performFewShotLearning(supportSet, querySet, algorithm, numShots, numWays, fewShotId);
    
    res.json({
      fewShotId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Continual learning
app.post('/api/continual-learning', async (req, res) => {
  const { 
    tasks, 
    algorithm, 
    memorySize, 
    trainingConfig 
  } = req.body;
  
  if (!tasks || !algorithm) {
    return res.status(400).json({ error: 'Tasks and algorithm are required' });
  }
  
  try {
    const continualId = uuidv4();
    const result = await startContinualLearning(tasks, algorithm, memorySize, trainingConfig, continualId);
    
    res.json({
      continualId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meta-optimization
app.post('/api/meta-optimization', async (req, res) => {
  const { 
    baseAlgorithm, 
    optimizationTarget, 
    searchSpace, 
    numTrials 
  } = req.body;
  
  if (!baseAlgorithm || !optimizationTarget) {
    return res.status(400).json({ error: 'Base algorithm and optimization target are required' });
  }
  
  try {
    const optimizationId = uuidv4();
    const result = await performMetaOptimization(baseAlgorithm, optimizationTarget, searchSpace, numTrials, optimizationId);
    
    res.json({
      optimizationId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meta-learning functions
async function startMetaLearning(metaId, algorithm, task, dataset, numShots, numWays, trainingConfig, metaLearningConfig) {
  const metaLearning = {
    id: metaId,
    algorithm,
    task,
    dataset,
    numShots: numShots || 5,
    numWays: numWays || 5,
    trainingConfig: trainingConfig || {},
    metaConfig: metaLearningConfig || {},
    status: 'running',
    currentEpisode: 0,
    totalEpisodes: trainingConfig?.episodes || 1000,
    bestAccuracy: 0,
    currentAccuracy: 0,
    metrics: {
      episodeAccuracies: [],
      adaptationTimes: [],
      generalizationGaps: [],
      taskSimilarities: []
    },
    startedAt: new Date().toISOString()
  };
  
  // Store meta-learning configuration
  await redis.hSet('meta_learnings', metaId, JSON.stringify(metaLearning));
  
  // Simulate meta-learning process
  setTimeout(async () => {
    metaLearning.status = 'completed';
    metaLearning.completedAt = new Date().toISOString();
    metaLearning.bestAccuracy = Math.random() * 0.3 + 0.7; // 70-100% accuracy
    metaLearning.currentAccuracy = metaLearning.bestAccuracy;
    
    // Generate training metrics
    for (let i = 0; i < metaLearning.totalEpisodes; i++) {
      metaLearning.metrics.episodeAccuracies.push(Math.random() * 0.2 + 0.8);
      metaLearning.metrics.adaptationTimes.push(Math.random() * 100 + 10);
      metaLearning.metrics.generalizationGaps.push(Math.random() * 0.1 + 0.05);
      metaLearning.metrics.taskSimilarities.push(Math.random() * 0.4 + 0.6);
    }
    
    await redis.hSet('meta_learnings', metaId, JSON.stringify(metaLearning));
  }, 180000); // Complete after 3 minutes
  
  return {
    metaId,
    status: 'started',
    message: 'Meta-learning started successfully',
    algorithm: metaLearning.algorithm,
    task: metaLearning.task,
    dataset: metaLearning.dataset,
    totalEpisodes: metaLearning.totalEpisodes
  };
}

async function getMetaLearningStatus(metaId) {
  const metaData = await redis.hGet('meta_learnings', metaId);
  if (!metaData) {
    throw new Error(`Meta-learning not found: ${metaId}`);
  }
  
  const metaLearning = JSON.parse(metaData);
  
  return {
    metaId,
    status: metaLearning.status,
    currentEpisode: metaLearning.currentEpisode,
    totalEpisodes: metaLearning.totalEpisodes,
    bestAccuracy: metaLearning.bestAccuracy,
    currentAccuracy: metaLearning.currentAccuracy,
    progress: (metaLearning.currentEpisode / metaLearning.totalEpisodes) * 100,
    algorithm: metaLearning.algorithm,
    task: metaLearning.task,
    dataset: metaLearning.dataset,
    startedAt: metaLearning.startedAt,
    completedAt: metaLearning.completedAt
  };
}

async function getMetaLearningResults(metaId) {
  const metaData = await redis.hGet('meta_learnings', metaId);
  if (!metaData) {
    throw new Error(`Meta-learning not found: ${metaId}`);
  }
  
  const metaLearning = JSON.parse(metaData);
  
  return {
    metaId,
    finalAccuracy: metaLearning.bestAccuracy,
    metrics: metaLearning.metrics,
    algorithm: metaLearning.algorithm,
    task: metaLearning.task,
    dataset: metaLearning.dataset,
    numShots: metaLearning.numShots,
    numWays: metaLearning.numWays,
    duration: metaLearning.completedAt ? 
      new Date(metaLearning.completedAt) - new Date(metaLearning.startedAt) : 
      Date.now() - new Date(metaLearning.startedAt)
  };
}

async function stopMetaLearning(metaId) {
  const metaData = await redis.hGet('meta_learnings', metaId);
  if (!metaData) {
    throw new Error(`Meta-learning not found: ${metaId}`);
  }
  
  const metaLearning = JSON.parse(metaData);
  metaLearning.status = 'stopped';
  metaLearning.stoppedAt = new Date().toISOString();
  
  await redis.hSet('meta_learnings', metaId, JSON.stringify(metaLearning));
  
  return {
    metaId,
    status: 'stopped',
    message: 'Meta-learning stopped successfully'
  };
}

async function evaluateMetaLearner(metaId, testTasks, numEpisodes, evaluationId) {
  const metaData = await redis.hGet('meta_learnings', metaId);
  if (!metaData) {
    throw new Error(`Meta-learning not found: ${metaId}`);
  }
  
  const metaLearning = JSON.parse(metaData);
  
  // Simulate meta-learner evaluation
  const evaluation = {
    id: evaluationId,
    metaId,
    testTasks: testTasks || 10,
    numEpisodes: numEpisodes || 100,
    results: {
      averageAccuracy: Math.random() * 0.2 + 0.8,
      stdAccuracy: Math.random() * 0.1 + 0.05,
      adaptationSpeed: Math.random() * 50 + 10,
      generalizationGap: Math.random() * 0.1 + 0.05,
      taskAccuracies: Array.from({ length: testTasks || 10 }, () => Math.random() * 0.2 + 0.8)
    },
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store evaluation
  await redis.hSet('meta_evaluations', evaluationId, JSON.stringify(evaluation));
  
  return evaluation;
}

async function performFewShotLearning(supportSet, querySet, algorithm, numShots, numWays, fewShotId) {
  // Simulate few-shot learning
  const fewShot = {
    id: fewShotId,
    supportSet,
    querySet,
    algorithm,
    numShots: numShots || 5,
    numWays: numWays || 5,
    results: {
      accuracy: Math.random() * 0.3 + 0.7,
      confidence: Math.random() * 0.3 + 0.7,
      predictions: Array.from({ length: querySet?.length || 100 }, () => Math.floor(Math.random() * numWays || 5)),
      probabilities: Array.from({ length: querySet?.length || 100 }, () => 
        Array.from({ length: numWays || 5 }, () => Math.random())
      )
    },
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store few-shot learning
  await redis.hSet('few_shot_learnings', fewShotId, JSON.stringify(fewShot));
  
  return fewShot;
}

async function startContinualLearning(tasks, algorithm, memorySize, trainingConfig, continualId) {
  // Simulate continual learning
  const continual = {
    id: continualId,
    tasks,
    algorithm,
    memorySize: memorySize || 1000,
    trainingConfig: trainingConfig || {},
    status: 'running',
    currentTask: 0,
    totalTasks: tasks.length,
    taskAccuracies: tasks.map(() => Math.random() * 0.2 + 0.8),
    forgettingMeasure: Math.random() * 0.2 + 0.1,
    startedAt: new Date().toISOString()
  };
  
  // Store continual learning
  await redis.hSet('continual_learnings', continualId, JSON.stringify(continual));
  
  return {
    continualId,
    status: 'started',
    message: 'Continual learning started successfully',
    tasks: continual.tasks,
    algorithm: continual.algorithm
  };
}

async function performMetaOptimization(baseAlgorithm, optimizationTarget, searchSpace, numTrials, optimizationId) {
  // Simulate meta-optimization
  const optimization = {
    id: optimizationId,
    baseAlgorithm,
    optimizationTarget,
    searchSpace: searchSpace || {},
    numTrials: numTrials || 50,
    results: {
      bestHyperparameters: {
        learningRate: Math.random() * 0.01 + 0.001,
        metaLearningRate: Math.random() * 0.01 + 0.001,
        adaptationSteps: Math.floor(Math.random() * 10) + 1,
        batchSize: Math.floor(Math.random() * 32) + 16
      },
      bestScore: Math.random() * 100 + 50,
      optimizationHistory: Array.from({ length: numTrials || 50 }, (_, i) => ({
        trial: i + 1,
        score: Math.random() * 100 + 50,
        hyperparameters: generateRandomHyperparameters(searchSpace)
      }))
    },
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store optimization
  await redis.hSet('meta_optimizations', optimizationId, JSON.stringify(optimization));
  
  return optimization;
}

// Helper functions
function generateRandomHyperparameters(searchSpace) {
  const hyperparameters = {};
  
  for (const [param, range] of Object.entries(searchSpace)) {
    if (range.type === 'uniform') {
      hyperparameters[param] = Math.random() * (range.max - range.min) + range.min;
    } else if (range.type === 'log_uniform') {
      hyperparameters[param] = Math.exp(Math.random() * (Math.log(range.max) - Math.log(range.min)) + Math.log(range.min));
    } else if (range.type === 'choice') {
      hyperparameters[param] = range.choices[Math.floor(Math.random() * range.choices.length)];
    }
  }
  
  return hyperparameters;
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Meta-Learning Error:', err);
  
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
    console.log(`🚀 Meta-Learning v3.1 running on port ${PORT}`);
    console.log(`🧠 Learning to learn algorithms enabled`);
    console.log(`🎯 Few-shot learning capabilities enabled`);
    console.log(`🔄 Continual learning enabled`);
    console.log(`⚡ Meta-optimization enabled`);
    console.log(`📊 Advanced meta-learning evaluation enabled`);
  });
});

module.exports = app;
