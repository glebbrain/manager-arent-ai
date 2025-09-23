const express = require('express');
const quantumNeuralNetwork = require('../modules/quantum-neural-network');
const quantumOptimization = require('../modules/quantum-optimization');
const quantumAlgorithms = require('../modules/quantum-algorithms');
const quantumSimulator = require('../modules/quantum-simulator');
const logger = require('../modules/logger');

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Advanced Quantum Machine Learning v2.9',
    version: '2.9.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      service: 'Advanced Quantum Machine Learning v2.9',
      version: '2.9.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      components: {
        quantumNeuralNetwork: {
          status: 'operational',
          networkInfo: quantumNeuralNetwork.getNetworkInfo()
        },
        quantumOptimization: {
          status: 'operational',
          parameters: quantumOptimization.getParameters().length,
          history: quantumOptimization.getOptimizationHistory().length
        },
        quantumAlgorithms: {
          status: 'operational',
          qubitCount: quantumAlgorithms.getQubitCount(),
          state: quantumAlgorithms.getState().length
        },
        quantumSimulator: {
          status: 'operational',
          simulatorInfo: quantumSimulator.getInfo()
        }
      },
      capabilities: {
        quantumNeuralNetworks: [
          'Quantum State Preparation',
          'Quantum Gate Operations',
          'Quantum Activation Functions',
          'Quantum Backpropagation',
          'Quantum Prediction',
          'Quantum Training'
        ],
        quantumOptimization: [
          'Variational Quantum Eigensolver (VQE)',
          'Quantum Approximate Optimization Algorithm (QAOA)',
          'Quantum Annealing',
          'Quantum Gradient Descent',
          'Quantum Parameter Optimization'
        ],
        quantumAlgorithms: [
          "Grover's Search Algorithm",
          'Quantum Fourier Transform (QFT)',
          'Quantum Phase Estimation',
          'Quantum Support Vector Machine (QSVM)',
          'Quantum Clustering',
          'Quantum Machine Learning'
        ],
        quantumSimulation: [
          'Quantum Gate Simulation',
          'Quantum State Evolution',
          'Quantum Measurement',
          'Quantum Noise Modeling',
          'Quantum Error Correction',
          'Quantum Fidelity Calculation'
        ]
      }
    };

    res.json(health);

  } catch (error) {
    logger.error('Detailed health check failed:', { error: error.message });
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Component-specific health checks
router.get('/quantum-nn', (req, res) => {
  res.json({
    status: 'healthy',
    component: 'Quantum Neural Network',
    version: '2.9.0',
    capabilities: [
      'Quantum State Preparation',
      'Quantum Gate Operations',
      'Quantum Activation Functions',
      'Quantum Backpropagation',
      'Quantum Prediction',
      'Quantum Training'
    ],
    networkInfo: quantumNeuralNetwork.getNetworkInfo(),
    timestamp: new Date().toISOString()
  });
});

router.get('/quantum-optimization', (req, res) => {
  res.json({
    status: 'healthy',
    component: 'Quantum Optimization',
    version: '2.9.0',
    capabilities: [
      'Variational Quantum Eigensolver (VQE)',
      'Quantum Approximate Optimization Algorithm (QAOA)',
      'Quantum Annealing',
      'Quantum Gradient Descent',
      'Quantum Parameter Optimization'
    ],
    parameters: quantumOptimization.getParameters().length,
    history: quantumOptimization.getOptimizationHistory().length,
    timestamp: new Date().toISOString()
  });
});

router.get('/quantum-algorithms', (req, res) => {
  res.json({
    status: 'healthy',
    component: 'Quantum Algorithms',
    version: '2.9.0',
    capabilities: [
      "Grover's Search Algorithm",
      'Quantum Fourier Transform (QFT)',
      'Quantum Phase Estimation',
      'Quantum Support Vector Machine (QSVM)',
      'Quantum Clustering',
      'Quantum Machine Learning'
    ],
    qubitCount: quantumAlgorithms.getQubitCount(),
    stateSize: quantumAlgorithms.getState().length,
    timestamp: new Date().toISOString()
  });
});

router.get('/quantum-simulator', (req, res) => {
  res.json({
    status: 'healthy',
    component: 'Quantum Simulator',
    version: '2.9.0',
    capabilities: [
      'Quantum Gate Simulation',
      'Quantum State Evolution',
      'Quantum Measurement',
      'Quantum Noise Modeling',
      'Quantum Error Correction',
      'Quantum Fidelity Calculation'
    ],
    simulatorInfo: quantumSimulator.getInfo(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
