const express = require('express');
const multer = require('multer');
const quantumNeuralNetwork = require('../modules/quantum-neural-network');
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

// Initialize quantum neural network
router.post('/initialize', async (req, res) => {
  try {
    const { numQubits, numLayers, numOutputs = 1 } = req.body;

    if (!numQubits || !numLayers) {
      return res.status(400).json({
        error: 'numQubits and numLayers are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = quantumNeuralNetwork.initialize(numQubits, numLayers, numOutputs);

    res.json({
      success: true,
      result: result,
      networkInfo: quantumNeuralNetwork.getNetworkInfo()
    });

  } catch (error) {
    logger.error('QNN initialization failed:', { error: error.message });
    res.status(500).json({
      error: 'QNN initialization failed',
      message: error.message,
      code: 'INITIALIZATION_ERROR'
    });
  }
});

// Train quantum neural network
router.post('/train', upload.single('dataFile'), async (req, res) => {
  try {
    const { 
      trainingData, 
      targetData, 
      epochs = 100, 
      learningRate = 0.01, 
      batchSize = 32 
    } = req.body;

    let parsedTrainingData = trainingData;
    let parsedTargetData = targetData;

    // Parse data from file if provided
    if (req.file) {
      const fileContent = req.file.buffer.toString('utf8');
      const data = JSON.parse(fileContent);
      parsedTrainingData = data.trainingData || data.inputs;
      parsedTargetData = data.targetData || data.labels;
    }

    if (!parsedTrainingData || !parsedTargetData) {
      return res.status(400).json({
        error: 'Training data and target data are required',
        code: 'MISSING_DATA'
      });
    }

    const result = await quantumNeuralNetwork.train(
      parsedTrainingData, 
      parsedTargetData, 
      { epochs, learningRate, batchSize }
    );

    res.json({
      success: true,
      result: result,
      networkInfo: quantumNeuralNetwork.getNetworkInfo()
    });

  } catch (error) {
    logger.error('QNN training failed:', { error: error.message });
    res.status(500).json({
      error: 'QNN training failed',
      message: error.message,
      code: 'TRAINING_ERROR'
    });
  }
});

// Predict using quantum neural network
router.post('/predict', async (req, res) => {
  try {
    const { inputData } = req.body;

    if (!inputData) {
      return res.status(400).json({
        error: 'Input data is required',
        code: 'MISSING_INPUT'
      });
    }

    const result = quantumNeuralNetwork.predict(inputData);

    res.json({
      success: true,
      prediction: result,
      networkInfo: quantumNeuralNetwork.getNetworkInfo()
    });

  } catch (error) {
    logger.error('QNN prediction failed:', { error: error.message });
    res.status(500).json({
      error: 'QNN prediction failed',
      message: error.message,
      code: 'PREDICTION_ERROR'
    });
  }
});

// Process quantum state
router.post('/process-state', async (req, res) => {
  try {
    const { inputData, operations = ['forward'] } = req.body;

    if (!inputData) {
      return res.status(400).json({
        error: 'Input data is required',
        code: 'MISSING_INPUT'
      });
    }

    const results = {};

    for (const operation of operations) {
      try {
        switch (operation) {
          case 'forward':
            results.forward = quantumNeuralNetwork.forwardPass(inputData);
            break;
          case 'preprocess':
            results.preprocess = quantumNeuralNetwork.preprocessText(inputData);
            break;
          case 'extract':
            results.extract = quantumNeuralNetwork.extractPrediction(
              quantumNeuralNetwork.forwardPass(inputData).finalState
            );
            break;
          default:
            logger.warn(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        logger.error(`Operation ${operation} failed:`, { error: error.message });
        results[operation] = { error: error.message };
      }
    }

    res.json({
      success: true,
      inputData: inputData,
      results: results,
      operations: operations
    });

  } catch (error) {
    logger.error('QNN state processing failed:', { error: error.message });
    res.status(500).json({
      error: 'QNN state processing failed',
      message: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
});

// Apply quantum gates
router.post('/apply-gates', async (req, res) => {
  try {
    const { inputData, gates } = req.body;

    if (!inputData || !gates) {
      return res.status(400).json({
        error: 'Input data and gates are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    let state = quantumNeuralNetwork.prepareQuantumState(inputData);
    const gateResults = [];

    for (const gate of gates) {
      const { type, qubitIndex, parameters = {} } = gate;
      
      try {
        state = quantumNeuralNetwork.applyQuantumGate(state, type, qubitIndex, parameters);
        gateResults.push({
          gate: type,
          qubitIndex: qubitIndex,
          success: true,
          state: state.slice(0, 5) // Show first 5 amplitudes
        });
      } catch (error) {
        gateResults.push({
          gate: type,
          qubitIndex: qubitIndex,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      inputData: inputData,
      finalState: state,
      gateResults: gateResults
    });

  } catch (error) {
    logger.error('Gate application failed:', { error: error.message });
    res.status(500).json({
      error: 'Gate application failed',
      message: error.message,
      code: 'GATE_ERROR'
    });
  }
});

// Get network information
router.get('/info', (req, res) => {
  res.json({
    success: true,
    networkInfo: quantumNeuralNetwork.getNetworkInfo(),
    capabilities: [
      'Quantum Neural Network Training',
      'Quantum State Processing',
      'Quantum Gate Operations',
      'Quantum Prediction',
      'Quantum Backpropagation'
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Quantum Neural Network',
    version: '2.9.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
