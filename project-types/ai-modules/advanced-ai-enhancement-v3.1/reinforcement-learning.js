const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Redis = require('redis');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3021;

// Redis client
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect();

// Reinforcement Learning configuration
const rlConfig = {
  algorithms: {
    'dqn': {
      name: 'Deep Q-Network',
      description: 'Deep Q-learning with neural networks',
      type: 'value_based',
      complexity: 'medium',
      stability: 'medium'
    },
    'ddqn': {
      name: 'Double DQN',
      description: 'Double DQN to reduce overestimation',
      type: 'value_based',
      complexity: 'medium',
      stability: 'high'
    },
    'dueling_dqn': {
      name: 'Dueling DQN',
      description: 'Separate value and advantage streams',
      type: 'value_based',
      complexity: 'high',
      stability: 'high'
    },
    'a3c': {
      name: 'Asynchronous Advantage Actor-Critic',
      description: 'Asynchronous actor-critic method',
      type: 'actor_critic',
      complexity: 'high',
      stability: 'high'
    },
    'ppo': {
      name: 'Proximal Policy Optimization',
      description: 'Policy gradient with clipping',
      type: 'policy_gradient',
      complexity: 'medium',
      stability: 'very_high'
    },
    'sac': {
      name: 'Soft Actor-Critic',
      description: 'Maximum entropy reinforcement learning',
      type: 'actor_critic',
      complexity: 'high',
      stability: 'very_high'
    },
    'td3': {
      name: 'Twin Delayed Deep Deterministic',
      description: 'Continuous control with twin critics',
      type: 'actor_critic',
      complexity: 'high',
      stability: 'very_high'
    },
    'rainbow': {
      name: 'Rainbow DQN',
      description: 'Combination of DQN improvements',
      type: 'value_based',
      complexity: 'very_high',
      stability: 'high'
    }
  },
  environments: {
    'cartpole': {
      name: 'CartPole',
      description: 'Classic control problem',
      stateSpace: 'continuous',
      actionSpace: 'discrete',
      difficulty: 'easy'
    },
    'mountain_car': {
      name: 'Mountain Car',
      description: 'Sparse reward environment',
      stateSpace: 'continuous',
      actionSpace: 'discrete',
      difficulty: 'medium'
    },
    'lunar_lander': {
      name: 'Lunar Lander',
      description: 'Continuous control landing',
      stateSpace: 'continuous',
      actionSpace: 'continuous',
      difficulty: 'medium'
    },
    'atari': {
      name: 'Atari Games',
      description: 'High-dimensional visual input',
      stateSpace: 'image',
      actionSpace: 'discrete',
      difficulty: 'hard'
    },
    'mujoco': {
      name: 'MuJoCo Physics',
      description: 'Continuous control with physics',
      stateSpace: 'continuous',
      actionSpace: 'continuous',
      difficulty: 'hard'
    },
    'custom': {
      name: 'Custom Environment',
      description: 'User-defined environment',
      stateSpace: 'variable',
      actionSpace: 'variable',
      difficulty: 'variable'
    }
  },
  rewardShaping: {
    'sparse': {
      name: 'Sparse Rewards',
      description: 'Reward only at goal completion',
      difficulty: 'hard',
      sample_efficiency: 'low'
    },
    'dense': {
      name: 'Dense Rewards',
      description: 'Reward for every step',
      difficulty: 'easy',
      sample_efficiency: 'high'
    },
    'shaped': {
      name: 'Shaped Rewards',
      description: 'Engineered reward function',
      difficulty: 'medium',
      sample_efficiency: 'medium'
    },
    'curriculum': {
      name: 'Curriculum Learning',
      description: 'Progressive difficulty',
      difficulty: 'medium',
      sample_efficiency: 'high'
    }
  }
};

// AI models for reinforcement learning
const aiModels = {
  qNetwork: null,
  policyNetwork: null,
  valueNetwork: null,
  targetNetwork: null,
  experienceReplay: null,
  environment: null
};

// Initialize AI models
async function initializeModels() {
  try {
    // Load TensorFlow models for RL
    aiModels.qNetwork = await tf.loadLayersModel('file://./models/rl/q-network/model.json');
    aiModels.policyNetwork = await tf.loadLayersModel('file://./models/rl/policy-network/model.json');
    aiModels.valueNetwork = await tf.loadLayersModel('file://./models/rl/value-network/model.json');
    aiModels.targetNetwork = await tf.loadLayersModel('file://./models/rl/target-network/model.json');
    
    console.log('Reinforcement Learning models loaded successfully');
  } catch (error) {
    console.error('Error loading RL models:', error);
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
  message: 'Too many RL requests, please try again later.'
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
  res.json(rlConfig.algorithms);
});

// Get environments
app.get('/api/environments', (req, res) => {
  res.json(rlConfig.environments);
});

// Get reward shaping methods
app.get('/api/reward-shaping', (req, res) => {
  res.json(rlConfig.rewardShaping);
});

// Start training
app.post('/api/training/start', async (req, res) => {
  const { 
    algorithm, 
    environment, 
    rewardShaping, 
    hyperparameters, 
    trainingConfig 
  } = req.body;
  
  if (!algorithm || !environment) {
    return res.status(400).json({ error: 'Algorithm and environment are required' });
  }
  
  try {
    const trainingId = uuidv4();
    const result = await startTraining(
      trainingId,
      algorithm,
      environment,
      rewardShaping,
      hyperparameters,
      trainingConfig
    );
    
    res.json({
      trainingId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get training status
app.get('/api/training/:trainingId/status', async (req, res) => {
  const { trainingId } = req.params;
  
  try {
    const status = await getTrainingStatus(trainingId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get training results
app.get('/api/training/:trainingId/results', async (req, res) => {
  const { trainingId } = req.params;
  
  try {
    const results = await getTrainingResults(trainingId);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop training
app.post('/api/training/:trainingId/stop', async (req, res) => {
  const { trainingId } = req.params;
  
  try {
    const result = await stopTraining(trainingId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Evaluate policy
app.post('/api/evaluate', async (req, res) => {
  const { trainingId, numEpisodes, render } = req.body;
  
  if (!trainingId) {
    return res.status(400).json({ error: 'Training ID is required' });
  }
  
  try {
    const evaluationId = uuidv4();
    const result = await evaluatePolicy(trainingId, numEpisodes, render, evaluationId);
    
    res.json({
      evaluationId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deploy policy
app.post('/api/deploy', async (req, res) => {
  const { trainingId, environment, deploymentConfig } = req.body;
  
  if (!trainingId || !environment) {
    return res.status(400).json({ error: 'Training ID and environment are required' });
  }
  
  try {
    const deploymentId = uuidv4();
    const result = await deployPolicy(trainingId, environment, deploymentConfig, deploymentId);
    
    res.json({
      deploymentId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get deployment status
app.get('/api/deployment/:deploymentId/status', async (req, res) => {
  const { deploymentId } = req.params;
  
  try {
    const status = await getDeploymentStatus(deploymentId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hyperparameter optimization
app.post('/api/optimize', async (req, res) => {
  const { algorithm, environment, searchSpace, numTrials } = req.body;
  
  if (!algorithm || !environment || !searchSpace) {
    return res.status(400).json({ error: 'Algorithm, environment, and search space are required' });
  }
  
  try {
    const optimizationId = uuidv4();
    const result = await optimizeHyperparameters(algorithm, environment, searchSpace, numTrials, optimizationId);
    
    res.json({
      optimizationId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Multi-agent training
app.post('/api/multi-agent/start', async (req, res) => {
  const { 
    algorithm, 
    environment, 
    numAgents, 
    coordinationMethod, 
    trainingConfig 
  } = req.body;
  
  if (!algorithm || !environment || !numAgents) {
    return res.status(400).json({ error: 'Algorithm, environment, and number of agents are required' });
  }
  
  try {
    const trainingId = uuidv4();
    const result = await startMultiAgentTraining(
      trainingId,
      algorithm,
      environment,
      numAgents,
      coordinationMethod,
      trainingConfig
    );
    
    res.json({
      trainingId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RL functions
async function startTraining(trainingId, algorithm, environment, rewardShaping, hyperparameters, trainingConfig) {
  const training = {
    id: trainingId,
    algorithm,
    environment,
    rewardShaping: rewardShaping || 'dense',
    hyperparameters: hyperparameters || getDefaultHyperparameters(algorithm),
    trainingConfig: trainingConfig || {},
    status: 'running',
    currentEpisode: 0,
    totalEpisodes: trainingConfig?.totalEpisodes || 1000,
    bestReward: -Infinity,
    averageReward: 0,
    metrics: {
      episodeRewards: [],
      episodeLengths: [],
      losses: [],
      qValues: [],
      policyEntropy: []
    },
    startedAt: new Date().toISOString()
  };
  
  // Store training configuration
  await redis.hSet('rl_trainings', trainingId, JSON.stringify(training));
  
  // Simulate training process
  setTimeout(async () => {
    training.status = 'completed';
    training.completedAt = new Date().toISOString();
    training.bestReward = Math.random() * 200 + 100; // 100-300 reward
    training.averageReward = Math.random() * 100 + 50; // 50-150 reward
    
    // Generate training metrics
    for (let i = 0; i < training.totalEpisodes; i++) {
      training.metrics.episodeRewards.push(Math.random() * 200 + 50);
      training.metrics.episodeLengths.push(Math.floor(Math.random() * 500) + 100);
      training.metrics.losses.push(Math.random() * 2 + 0.1);
      training.metrics.qValues.push(Math.random() * 10 + 5);
      training.metrics.policyEntropy.push(Math.random() * 2 + 0.5);
    }
    
    await redis.hSet('rl_trainings', trainingId, JSON.stringify(training));
  }, 60000); // Complete after 1 minute
  
  return {
    trainingId,
    status: 'started',
    message: 'RL training started successfully',
    algorithm: training.algorithm,
    environment: training.environment,
    totalEpisodes: training.totalEpisodes
  };
}

async function getTrainingStatus(trainingId) {
  const trainingData = await redis.hGet('rl_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  
  return {
    trainingId,
    status: training.status,
    currentEpisode: training.currentEpisode,
    totalEpisodes: training.totalEpisodes,
    bestReward: training.bestReward,
    averageReward: training.averageReward,
    progress: (training.currentEpisode / training.totalEpisodes) * 100,
    algorithm: training.algorithm,
    environment: training.environment,
    startedAt: training.startedAt,
    completedAt: training.completedAt
  };
}

async function getTrainingResults(trainingId) {
  const trainingData = await redis.hGet('rl_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  
  return {
    trainingId,
    finalReward: training.bestReward,
    averageReward: training.averageReward,
    metrics: training.metrics,
    algorithm: training.algorithm,
    environment: training.environment,
    hyperparameters: training.hyperparameters,
    duration: training.completedAt ? 
      new Date(training.completedAt) - new Date(training.startedAt) : 
      Date.now() - new Date(training.startedAt)
  };
}

async function stopTraining(trainingId) {
  const trainingData = await redis.hGet('rl_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  training.status = 'stopped';
  training.stoppedAt = new Date().toISOString();
  
  await redis.hSet('rl_trainings', trainingId, JSON.stringify(training));
  
  return {
    trainingId,
    status: 'stopped',
    message: 'RL training stopped successfully'
  };
}

async function evaluatePolicy(trainingId, numEpisodes, render, evaluationId) {
  const trainingData = await redis.hGet('rl_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  
  // Simulate policy evaluation
  const evaluation = {
    id: evaluationId,
    trainingId,
    numEpisodes: numEpisodes || 100,
    render: render || false,
    results: {
      averageReward: Math.random() * 100 + 50,
      stdReward: Math.random() * 20 + 10,
      averageLength: Math.floor(Math.random() * 500) + 100,
      successRate: Math.random() * 0.5 + 0.5, // 50-100%
      episodeRewards: Array.from({ length: numEpisodes || 100 }, () => Math.random() * 200 + 50)
    },
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store evaluation
  await redis.hSet('rl_evaluations', evaluationId, JSON.stringify(evaluation));
  
  return evaluation;
}

async function deployPolicy(trainingId, environment, deploymentConfig, deploymentId) {
  const trainingData = await redis.hGet('rl_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  
  // Simulate policy deployment
  const deployment = {
    id: deploymentId,
    trainingId,
    environment,
    deploymentConfig: deploymentConfig || {},
    status: 'deployed',
    endpoint: `http://localhost:${PORT}/api/deployment/${deploymentId}/predict`,
    metrics: {
      requestsPerSecond: 0,
      averageLatency: 0,
      errorRate: 0,
      uptime: 100
    },
    deployedAt: new Date().toISOString()
  };
  
  // Store deployment
  await redis.hSet('rl_deployments', deploymentId, JSON.stringify(deployment));
  
  return deployment;
}

async function getDeploymentStatus(deploymentId) {
  const deploymentData = await redis.hGet('rl_deployments', deploymentId);
  if (!deploymentData) {
    throw new Error(`Deployment not found: ${deploymentId}`);
  }
  
  const deployment = JSON.parse(deploymentData);
  
  // Update metrics
  deployment.metrics = {
    requestsPerSecond: Math.random() * 100 + 10,
    averageLatency: Math.random() * 50 + 10,
    errorRate: Math.random() * 0.05,
    uptime: Math.random() * 0.1 + 0.9
  };
  
  await redis.hSet('rl_deployments', deploymentId, JSON.stringify(deployment));
  
  return deployment;
}

async function optimizeHyperparameters(algorithm, environment, searchSpace, numTrials, optimizationId) {
  // Simulate hyperparameter optimization
  const optimization = {
    id: optimizationId,
    algorithm,
    environment,
    searchSpace,
    numTrials: numTrials || 50,
    results: {
      bestHyperparameters: {
        learningRate: Math.random() * 0.01 + 0.001,
        batchSize: Math.floor(Math.random() * 64) + 32,
        epsilon: Math.random() * 0.5 + 0.1,
        gamma: Math.random() * 0.2 + 0.8,
        targetUpdateFrequency: Math.floor(Math.random() * 1000) + 100
      },
      bestScore: Math.random() * 100 + 50,
      trials: Array.from({ length: numTrials || 50 }, (_, i) => ({
        trial: i + 1,
        hyperparameters: generateRandomHyperparameters(searchSpace),
        score: Math.random() * 100 + 50
      }))
    },
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store optimization
  await redis.hSet('rl_optimizations', optimizationId, JSON.stringify(optimization));
  
  return optimization;
}

async function startMultiAgentTraining(trainingId, algorithm, environment, numAgents, coordinationMethod, trainingConfig) {
  // Simulate multi-agent training
  const training = {
    id: trainingId,
    algorithm,
    environment,
    numAgents,
    coordinationMethod: coordinationMethod || 'independent',
    trainingConfig: trainingConfig || {},
    status: 'running',
    currentEpisode: 0,
    totalEpisodes: trainingConfig?.totalEpisodes || 1000,
    agents: Array.from({ length: numAgents }, (_, i) => ({
      id: i,
      reward: 0,
      actions: [],
      observations: []
    })),
    startedAt: new Date().toISOString()
  };
  
  // Store training configuration
  await redis.hSet('rl_multi_agent_trainings', trainingId, JSON.stringify(training));
  
  return {
    trainingId,
    status: 'started',
    message: 'Multi-agent RL training started successfully',
    numAgents: training.numAgents,
    coordinationMethod: training.coordinationMethod
  };
}

// Helper functions
function getDefaultHyperparameters(algorithm) {
  const defaults = {
    'dqn': {
      learningRate: 0.001,
      batchSize: 32,
      epsilon: 0.1,
      gamma: 0.99,
      targetUpdateFrequency: 1000
    },
    'ppo': {
      learningRate: 0.0003,
      batchSize: 64,
      gamma: 0.99,
      lambda: 0.95,
      clipRatio: 0.2
    },
    'sac': {
      learningRate: 0.0003,
      batchSize: 256,
      gamma: 0.99,
      tau: 0.005,
      alpha: 0.2
    }
  };
  
  return defaults[algorithm] || defaults.dqn;
}

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
  console.error('Reinforcement Learning Error:', err);
  
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
    console.log(`🚀 Reinforcement Learning v3.1 running on port ${PORT}`);
    console.log(`🧠 Advanced RL algorithms for automation enabled`);
    console.log(`🎮 Multiple environment support enabled`);
    console.log(`🎯 Policy evaluation and deployment enabled`);
    console.log(`⚡ Hyperparameter optimization enabled`);
    console.log(`🤝 Multi-agent training enabled`);
  });
});

module.exports = app;
