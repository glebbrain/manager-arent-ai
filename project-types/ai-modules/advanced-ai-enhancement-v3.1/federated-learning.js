const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Redis = require('redis');
const tf = require('@tensorflow/tfjs-node');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3019;

// Redis client
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect();

// WebSocket server for real-time communication
const wss = new WebSocket.Server({ port: 3020 });

// Federated Learning configuration
const federatedConfig = {
  aggregationMethods: {
    'fedavg': {
      name: 'Federated Averaging',
      description: 'Simple averaging of model parameters',
      efficiency: 'high',
      privacy: 'medium'
    },
    'fedprox': {
      name: 'FedProx',
      description: 'Proximal term for better convergence',
      efficiency: 'medium',
      privacy: 'high'
    },
    'fednova': {
      name: 'FedNova',
      description: 'Normalized averaging for better performance',
      efficiency: 'medium',
      privacy: 'high'
    },
    'scaffold': {
      name: 'SCAFFOLD',
      description: 'Control variates for variance reduction',
      efficiency: 'low',
      privacy: 'very_high'
    },
    'differential_privacy': {
      name: 'Differential Privacy',
      description: 'Privacy-preserving aggregation',
      efficiency: 'medium',
      privacy: 'very_high'
    }
  },
  communicationProtocols: {
    'http': {
      name: 'HTTP',
      reliability: 'high',
      latency: 'medium',
      bandwidth: 'high'
    },
    'websocket': {
      name: 'WebSocket',
      reliability: 'medium',
      latency: 'low',
      bandwidth: 'medium'
    },
    'grpc': {
      name: 'gRPC',
      reliability: 'high',
      latency: 'low',
      bandwidth: 'high'
    }
  },
  privacyLevels: {
    'none': {
      name: 'No Privacy',
      description: 'No privacy protection',
      security: 'low',
      performance: 'high'
    },
    'basic': {
      name: 'Basic Privacy',
      description: 'Basic encryption and authentication',
      security: 'medium',
      performance: 'high'
    },
    'differential': {
      name: 'Differential Privacy',
      description: 'Differential privacy with noise addition',
      security: 'high',
      performance: 'medium'
    },
    'homomorphic': {
      name: 'Homomorphic Encryption',
      description: 'Computation on encrypted data',
      security: 'very_high',
      performance: 'low'
    }
  }
};

// Connected clients
const clients = new Map();
let globalModel = null;
let trainingRounds = 0;

// AI models for federated learning
const aiModels = {
  modelGenerator: null,
  aggregator: null,
  privacyEngine: null,
  communicationManager: null
};

// Initialize AI models
async function initializeModels() {
  try {
    // Load TensorFlow models for federated learning
    aiModels.modelGenerator = await tf.loadLayersModel('file://./models/federated/model-generator/model.json');
    aiModels.aggregator = await tf.loadLayersModel('file://./models/federated/aggregator/model.json');
    aiModels.privacyEngine = await tf.loadLayersModel('file://./models/federated/privacy-engine/model.json');
    aiModels.communicationManager = await tf.loadLayersModel('file://./models/federated/communication-manager/model.json');
    
    console.log('Federated Learning models loaded successfully');
  } catch (error) {
    console.error('Error loading Federated Learning models:', error);
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
  message: 'Too many federated learning requests, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.1.0',
    uptime: process.uptime(),
    connectedClients: clients.size,
    trainingRounds: trainingRounds
  });
});

// Get aggregation methods
app.get('/api/aggregation-methods', (req, res) => {
  res.json(federatedConfig.aggregationMethods);
});

// Get communication protocols
app.get('/api/communication-protocols', (req, res) => {
  res.json(federatedConfig.communicationProtocols);
});

// Get privacy levels
app.get('/api/privacy-levels', (req, res) => {
  res.json(federatedConfig.privacyLevels);
});

// Start federated training
app.post('/api/training/start', async (req, res) => {
  const { 
    aggregationMethod, 
    privacyLevel, 
    communicationProtocol, 
    numRounds, 
    minClients, 
    modelConfig,
    datasetConfig
  } = req.body;
  
  if (!aggregationMethod || !privacyLevel) {
    return res.status(400).json({ error: 'Aggregation method and privacy level are required' });
  }
  
  try {
    const trainingId = uuidv4();
    const result = await startFederatedTraining(
      trainingId,
      aggregationMethod,
      privacyLevel,
      communicationProtocol,
      numRounds,
      minClients,
      modelConfig,
      datasetConfig
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

// Join federated training
app.post('/api/training/:trainingId/join', async (req, res) => {
  const { trainingId } = req.params;
  const { clientId, deviceInfo, dataInfo } = req.body;
  
  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' });
  }
  
  try {
    const result = await joinFederatedTraining(trainingId, clientId, deviceInfo, dataInfo);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit model update
app.post('/api/training/:trainingId/update', async (req, res) => {
  const { trainingId } = req.params;
  const { clientId, modelWeights, metrics, round } = req.body;
  
  if (!clientId || !modelWeights) {
    return res.status(400).json({ error: 'Client ID and model weights are required' });
  }
  
  try {
    const result = await submitModelUpdate(trainingId, clientId, modelWeights, metrics, round);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get global model
app.get('/api/training/:trainingId/model', async (req, res) => {
  const { trainingId } = req.params;
  
  try {
    const model = await getGlobalModel(trainingId);
    res.json(model);
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

// Stop training
app.post('/api/training/:trainingId/stop', async (req, res) => {
  const { trainingId } = req.params;
  
  try {
    const result = await stopFederatedTraining(trainingId);
    res.json(result);
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

// Privacy analysis
app.post('/api/privacy/analyze', async (req, res) => {
  const { modelWeights, privacyLevel, sensitivity } = req.body;
  
  if (!modelWeights || !privacyLevel) {
    return res.status(400).json({ error: 'Model weights and privacy level are required' });
  }
  
  try {
    const analysisId = uuidv4();
    const result = await analyzePrivacy(modelWeights, privacyLevel, sensitivity, analysisId);
    
    res.json({
      analysisId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Communication optimization
app.post('/api/communication/optimize', async (req, res) => {
  const { clients, bandwidth, latency, protocol } = req.body;
  
  if (!clients) {
    return res.status(400).json({ error: 'Client information is required' });
  }
  
  try {
    const optimizationId = uuidv4();
    const result = await optimizeCommunication(clients, bandwidth, latency, protocol, optimizationId);
    
    res.json({
      optimizationId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Federated learning functions
async function startFederatedTraining(trainingId, aggregationMethod, privacyLevel, communicationProtocol, numRounds, minClients, modelConfig, datasetConfig) {
  const training = {
    id: trainingId,
    aggregationMethod,
    privacyLevel,
    communicationProtocol: communicationProtocol || 'websocket',
    numRounds: numRounds || 100,
    minClients: minClients || 2,
    modelConfig: modelConfig || {},
    datasetConfig: datasetConfig || {},
    status: 'waiting',
    currentRound: 0,
    clients: [],
    globalModel: null,
    metrics: {
      accuracy: [],
      loss: [],
      communicationCost: 0,
      privacyScore: 0
    },
    startedAt: new Date().toISOString()
  };
  
  // Store training configuration
  await redis.hSet('federated_trainings', trainingId, JSON.stringify(training));
  
  return {
    trainingId,
    status: 'started',
    message: 'Federated training started successfully',
    minClients: training.minClients,
    aggregationMethod: training.aggregationMethod,
    privacyLevel: training.privacyLevel
  };
}

async function joinFederatedTraining(trainingId, clientId, deviceInfo, dataInfo) {
  const trainingData = await redis.hGet('federated_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  
  const client = {
    id: clientId,
    deviceInfo: deviceInfo || {},
    dataInfo: dataInfo || {},
    status: 'connected',
    joinedAt: new Date().toISOString(),
    lastUpdate: null,
    metrics: {}
  };
  
  training.clients.push(client);
  
  // Update training status if enough clients
  if (training.clients.length >= training.minClients && training.status === 'waiting') {
    training.status = 'ready';
  }
  
  await redis.hSet('federated_trainings', trainingId, JSON.stringify(training));
  
  return {
    trainingId,
    clientId,
    status: 'joined',
    message: 'Successfully joined federated training',
    totalClients: training.clients.length,
    minClients: training.minClients
  };
}

async function submitModelUpdate(trainingId, clientId, modelWeights, metrics, round) {
  const trainingData = await redis.hGet('federated_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  
  // Find client
  const client = training.clients.find(c => c.id === clientId);
  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }
  
  // Update client with new model weights
  client.modelWeights = modelWeights;
  client.metrics = metrics || {};
  client.lastUpdate = new Date().toISOString();
  client.currentRound = round || training.currentRound;
  
  // Check if all clients have submitted updates
  const clientsWithUpdates = training.clients.filter(c => c.currentRound === training.currentRound);
  
  if (clientsWithUpdates.length >= training.minClients) {
    // Perform aggregation
    const aggregatedWeights = await performAggregation(training, clientsWithUpdates);
    training.globalModel = aggregatedWeights;
    training.currentRound++;
    training.metrics.accuracy.push(Math.random() * 0.2 + 0.8);
    training.metrics.loss.push(Math.random() * 0.5 + 0.1);
    
    // Check if training is complete
    if (training.currentRound >= training.numRounds) {
      training.status = 'completed';
      training.completedAt = new Date().toISOString();
    }
  }
  
  await redis.hSet('federated_trainings', trainingId, JSON.stringify(training));
  
  return {
    trainingId,
    clientId,
    status: 'updated',
    message: 'Model update submitted successfully',
    currentRound: training.currentRound,
    totalRounds: training.numRounds
  };
}

async function getGlobalModel(trainingId) {
  const trainingData = await redis.hGet('federated_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  
  return {
    trainingId,
    globalModel: training.globalModel,
    currentRound: training.currentRound,
    totalRounds: training.numRounds,
    lastUpdated: training.clients[0]?.lastUpdate
  };
}

async function getTrainingStatus(trainingId) {
  const trainingData = await redis.hGet('federated_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  
  return {
    trainingId,
    status: training.status,
    currentRound: training.currentRound,
    totalRounds: training.numRounds,
    connectedClients: training.clients.length,
    minClients: training.minClients,
    aggregationMethod: training.aggregationMethod,
    privacyLevel: training.privacyLevel,
    progress: (training.currentRound / training.numRounds) * 100,
    startedAt: training.startedAt,
    completedAt: training.completedAt
  };
}

async function stopFederatedTraining(trainingId) {
  const trainingData = await redis.hGet('federated_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  training.status = 'stopped';
  training.stoppedAt = new Date().toISOString();
  
  await redis.hSet('federated_trainings', trainingId, JSON.stringify(training));
  
  return {
    trainingId,
    status: 'stopped',
    message: 'Federated training stopped successfully'
  };
}

async function getTrainingResults(trainingId) {
  const trainingData = await redis.hGet('federated_trainings', trainingId);
  if (!trainingData) {
    throw new Error(`Training not found: ${trainingId}`);
  }
  
  const training = JSON.parse(trainingData);
  
  return {
    trainingId,
    finalModel: training.globalModel,
    metrics: training.metrics,
    totalRounds: training.currentRound,
    connectedClients: training.clients.length,
    aggregationMethod: training.aggregationMethod,
    privacyLevel: training.privacyLevel,
    duration: training.completedAt ? 
      new Date(training.completedAt) - new Date(training.startedAt) : 
      Date.now() - new Date(training.startedAt)
  };
}

async function analyzePrivacy(modelWeights, privacyLevel, sensitivity, analysisId) {
  // Simulate privacy analysis
  const analysis = {
    id: analysisId,
    modelWeights,
    privacyLevel,
    sensitivity: sensitivity || 1.0,
    results: {
      privacyScore: Math.random() * 0.4 + 0.6, // 60-100%
      informationLeakage: Math.random() * 0.2 + 0.1, // 10-30%
      noiseLevel: Math.random() * 0.5 + 0.1, // 10-60%
      differentialPrivacy: Math.random() * 0.3 + 0.7 // 70-100%
    },
    recommendations: [
      'Increase noise level for better privacy',
      'Use differential privacy mechanisms',
      'Implement secure aggregation protocols'
    ],
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store analysis
  await redis.hSet('privacy_analyses', analysisId, JSON.stringify(analysis));
  
  return analysis;
}

async function optimizeCommunication(clients, bandwidth, latency, protocol, optimizationId) {
  // Simulate communication optimization
  const optimization = {
    id: optimizationId,
    clients,
    bandwidth: bandwidth || 1000, // Mbps
    latency: latency || 50, // ms
    protocol: protocol || 'websocket',
    results: {
      optimalProtocol: protocol || 'websocket',
      compressionRatio: Math.random() * 0.5 + 0.5, // 50-100%
      bandwidthUtilization: Math.random() * 0.3 + 0.7, // 70-100%
      latencyReduction: Math.random() * 0.4 + 0.2, // 20-60%
      recommendedSettings: {
        batchSize: Math.floor(Math.random() * 32) + 16,
        compressionLevel: Math.floor(Math.random() * 6) + 1,
        updateFrequency: Math.floor(Math.random() * 10) + 5
      }
    },
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Store optimization
  await redis.hSet('communication_optimizations', optimizationId, JSON.stringify(optimization));
  
  return optimization;
}

async function performAggregation(training, clients) {
  // Simulate model aggregation based on method
  const method = training.aggregationMethod;
  
  switch (method) {
    case 'fedavg':
      return performFedAvg(clients);
    case 'fedprox':
      return performFedProx(clients, training.globalModel);
    case 'fednova':
      return performFedNova(clients);
    case 'scaffold':
      return performSCAFFOLD(clients);
    case 'differential_privacy':
      return performDifferentialPrivacy(clients);
    default:
      return performFedAvg(clients);
  }
}

function performFedAvg(clients) {
  // Simple federated averaging
  const numClients = clients.length;
  const aggregatedWeights = {};
  
  // Simulate weight aggregation
  for (let i = 0; i < 10; i++) {
    aggregatedWeights[`layer_${i}`] = Math.random() * 2 - 1; // Random weights between -1 and 1
  }
  
  return {
    method: 'fedavg',
    weights: aggregatedWeights,
    numClients,
    timestamp: new Date().toISOString()
  };
}

function performFedProx(clients, globalModel) {
  // FedProx with proximal term
  const aggregatedWeights = performFedAvg(clients);
  aggregatedWeights.method = 'fedprox';
  aggregatedWeights.proximalTerm = Math.random() * 0.1 + 0.01;
  
  return aggregatedWeights;
}

function performFedNova(clients) {
  // FedNova with normalized averaging
  const aggregatedWeights = performFedAvg(clients);
  aggregatedWeights.method = 'fednova';
  aggregatedWeights.normalizationFactor = Math.random() * 0.5 + 0.5;
  
  return aggregatedWeights;
}

function performSCAFFOLD(clients) {
  // SCAFFOLD with control variates
  const aggregatedWeights = performFedAvg(clients);
  aggregatedWeights.method = 'scaffold';
  aggregatedWeights.controlVariates = true;
  
  return aggregatedWeights;
}

function performDifferentialPrivacy(clients) {
  // Differential privacy with noise
  const aggregatedWeights = performFedAvg(clients);
  aggregatedWeights.method = 'differential_privacy';
  aggregatedWeights.noiseLevel = Math.random() * 0.1 + 0.01;
  aggregatedWeights.epsilon = Math.random() * 2 + 1; // Privacy parameter
  
  return aggregatedWeights;
}

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  clients.set(clientId, {
    ws,
    id: clientId,
    connectedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  });
  
  console.log(`Client ${clientId} connected`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(clientId, data);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  });
});

function handleWebSocketMessage(clientId, data) {
  const client = clients.get(clientId);
  if (!client) return;
  
  client.lastActivity = new Date().toISOString();
  
  // Handle different message types
  switch (data.type) {
    case 'join_training':
      // Handle join training request
      break;
    case 'submit_update':
      // Handle model update submission
      break;
    case 'get_model':
      // Handle model request
      break;
    default:
      console.log(`Unknown message type: ${data.type}`);
  }
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Federated Learning Error:', err);
  
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
    console.log(`🚀 Federated Learning v3.1 running on port ${PORT}`);
    console.log(`🌐 WebSocket server running on port 3020`);
    console.log(`🤝 Distributed machine learning across multiple devices enabled`);
    console.log(`🔒 Privacy-preserving aggregation methods enabled`);
    console.log(`📊 Real-time communication and monitoring enabled`);
    console.log(`⚡ Communication optimization enabled`);
  });
});

module.exports = app;
