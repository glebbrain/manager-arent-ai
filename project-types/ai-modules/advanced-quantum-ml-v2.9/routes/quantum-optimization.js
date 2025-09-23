const express = require('express');
const multer = require('multer');
const quantumOptimization = require('../modules/quantum-optimization');
const logger = require('../modules/logger');

const router = express.Router();

// Configure multer for data uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/json', 'text/csv', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, CSV, and TXT files are allowed.'));
    }
  }
});

// Initialize quantum optimization
router.post('/initialize', async (req, res) => {
  try {
    const { numParameters, costFunction, options = {} } = req.body;

    if (!numParameters) {
      return res.status(400).json({
        error: 'numParameters is required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = quantumOptimization.initialize(numParameters, costFunction, options);

    res.json({
      success: true,
      result: result,
      parameters: quantumOptimization.getParameters()
    });

  } catch (error) {
    logger.error('Quantum optimization initialization failed:', { error: error.message });
    res.status(500).json({
      error: 'Quantum optimization initialization failed',
      message: error.message,
      code: 'INITIALIZATION_ERROR'
    });
  }
});

// Variational Quantum Eigensolver (VQE)
router.post('/vqe', async (req, res) => {
  try {
    const { hamiltonian, ansatz, options = {} } = req.body;

    if (!hamiltonian || !ansatz) {
      return res.status(400).json({
        error: 'Hamiltonian and ansatz are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = await quantumOptimization.vqe(hamiltonian, ansatz, options);

    res.json({
      success: true,
      result: result,
      parameters: quantumOptimization.getParameters()
    });

  } catch (error) {
    logger.error('VQE optimization failed:', { error: error.message });
    res.status(500).json({
      error: 'VQE optimization failed',
      message: error.message,
      code: 'VQE_ERROR'
    });
  }
});

// Quantum Approximate Optimization Algorithm (QAOA)
router.post('/qaoa', async (req, res) => {
  try {
    const { costFunction, mixer, p, options = {} } = req.body;

    if (!costFunction || !mixer || !p) {
      return res.status(400).json({
        error: 'costFunction, mixer, and p are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = await quantumOptimization.qaoa(costFunction, mixer, p, options);

    res.json({
      success: true,
      result: result,
      parameters: quantumOptimization.getParameters()
    });

  } catch (error) {
    logger.error('QAOA optimization failed:', { error: error.message });
    res.status(500).json({
      error: 'QAOA optimization failed',
      message: error.message,
      code: 'QAOA_ERROR'
    });
  }
});

// Quantum annealing
router.post('/annealing', async (req, res) => {
  try {
    const { costFunction, options = {} } = req.body;

    if (!costFunction) {
      return res.status(400).json({
        error: 'costFunction is required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = await quantumOptimization.quantumAnnealing(costFunction, options);

    res.json({
      success: true,
      result: result,
      parameters: quantumOptimization.getParameters()
    });

  } catch (error) {
    logger.error('Quantum annealing failed:', { error: error.message });
    res.status(500).json({
      error: 'Quantum annealing failed',
      message: error.message,
      code: 'ANNEALING_ERROR'
    });
  }
});

// Quantum gradient descent
router.post('/gradient-descent', async (req, res) => {
  try {
    const { costFunction, options = {} } = req.body;

    if (!costFunction) {
      return res.status(400).json({
        error: 'costFunction is required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = await quantumOptimization.quantumGradientDescent(costFunction, options);

    res.json({
      success: true,
      result: result,
      parameters: quantumOptimization.getParameters()
    });

  } catch (error) {
    logger.error('Quantum gradient descent failed:', { error: error.message });
    res.status(500).json({
      error: 'Quantum gradient descent failed',
      message: error.message,
      code: 'GRADIENT_DESCENT_ERROR'
    });
  }
});

// Upload and optimize from file
router.post('/optimize-file', upload.single('dataFile'), async (req, res) => {
  try {
    const { 
      optimizationType = 'vqe', 
      options = {} 
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: 'Data file is required',
        code: 'MISSING_FILE'
      });
    }

    const fileContent = req.file.buffer.toString('utf8');
    const data = JSON.parse(fileContent);

    let result;
    switch (optimizationType) {
      case 'vqe':
        result = await quantumOptimization.vqe(data.hamiltonian, data.ansatz, options);
        break;
      case 'qaoa':
        result = await quantumOptimization.qaoa(data.costFunction, data.mixer, data.p, options);
        break;
      case 'annealing':
        result = await quantumOptimization.quantumAnnealing(data.costFunction, options);
        break;
      case 'gradient-descent':
        result = await quantumOptimization.quantumGradientDescent(data.costFunction, options);
        break;
      default:
        return res.status(400).json({
          error: 'Invalid optimization type',
          code: 'INVALID_TYPE'
        });
    }

    res.json({
      success: true,
      optimizationType: optimizationType,
      result: result,
      parameters: quantumOptimization.getParameters()
    });

  } catch (error) {
    logger.error('File optimization failed:', { error: error.message });
    res.status(500).json({
      error: 'File optimization failed',
      message: error.message,
      code: 'FILE_OPTIMIZATION_ERROR'
    });
  }
});

// Get optimization history
router.get('/history', (req, res) => {
  res.json({
    success: true,
    history: quantumOptimization.getOptimizationHistory(),
    parameters: quantumOptimization.getParameters()
  });
});

// Set parameters
router.post('/set-parameters', (req, res) => {
  try {
    const { parameters } = req.body;

    if (!parameters || !Array.isArray(parameters)) {
      return res.status(400).json({
        error: 'Parameters array is required',
        code: 'MISSING_PARAMETERS'
      });
    }

    quantumOptimization.setParameters(parameters);

    res.json({
      success: true,
      parameters: quantumOptimization.getParameters()
    });

  } catch (error) {
    logger.error('Parameter setting failed:', { error: error.message });
    res.status(500).json({
      error: 'Parameter setting failed',
      message: error.message,
      code: 'PARAMETER_ERROR'
    });
  }
});

// Reset optimization
router.post('/reset', (req, res) => {
  try {
    quantumOptimization.reset();

    res.json({
      success: true,
      message: 'Optimization reset successfully'
    });

  } catch (error) {
    logger.error('Optimization reset failed:', { error: error.message });
    res.status(500).json({
      error: 'Optimization reset failed',
      message: error.message,
      code: 'RESET_ERROR'
    });
  }
});

// Get available optimization methods
router.get('/methods', (req, res) => {
  res.json({
    success: true,
    methods: [
      {
        name: 'VQE',
        description: 'Variational Quantum Eigensolver',
        parameters: ['hamiltonian', 'ansatz'],
        options: ['maxIterations', 'learningRate', 'convergenceThreshold']
      },
      {
        name: 'QAOA',
        description: 'Quantum Approximate Optimization Algorithm',
        parameters: ['costFunction', 'mixer', 'p'],
        options: ['maxIterations', 'learningRate', 'beta', 'gamma']
      },
      {
        name: 'Annealing',
        description: 'Quantum Annealing',
        parameters: ['costFunction'],
        options: ['initialTemp', 'finalTemp', 'coolingRate', 'maxIterations']
      },
      {
        name: 'Gradient Descent',
        description: 'Quantum Gradient Descent',
        parameters: ['costFunction'],
        options: ['learningRate', 'maxIterations', 'convergenceThreshold']
      }
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Quantum Optimization',
    version: '2.9.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
