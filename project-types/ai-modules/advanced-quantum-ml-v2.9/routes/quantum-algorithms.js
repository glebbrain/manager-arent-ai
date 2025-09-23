const express = require('express');
const multer = require('multer');
const quantumAlgorithms = require('../modules/quantum-algorithms');
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

// Initialize quantum algorithms
router.post('/initialize', async (req, res) => {
  try {
    const { numQubits } = req.body;

    if (!numQubits) {
      return res.status(400).json({
        error: 'numQubits is required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = quantumAlgorithms.initialize(numQubits);

    res.json({
      success: true,
      result: result,
      qubitCount: quantumAlgorithms.getQubitCount()
    });

  } catch (error) {
    logger.error('Quantum algorithms initialization failed:', { error: error.message });
    res.status(500).json({
      error: 'Quantum algorithms initialization failed',
      message: error.message,
      code: 'INITIALIZATION_ERROR'
    });
  }
});

// Grover's Search Algorithm
router.post('/grover-search', async (req, res) => {
  try {
    const { targetItem, searchSpace, options = {} } = req.body;

    if (!targetItem || !searchSpace) {
      return res.status(400).json({
        error: 'targetItem and searchSpace are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = await quantumAlgorithms.groverSearch(targetItem, searchSpace, options);

    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    logger.error('Grover search failed:', { error: error.message });
    res.status(500).json({
      error: 'Grover search failed',
      message: error.message,
      code: 'GROVER_ERROR'
    });
  }
});

// Quantum Fourier Transform
router.post('/qft', async (req, res) => {
  try {
    const { inputState } = req.body;

    if (!inputState) {
      return res.status(400).json({
        error: 'inputState is required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = await quantumAlgorithms.quantumFourierTransform(inputState);

    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    logger.error('Quantum Fourier Transform failed:', { error: error.message });
    res.status(500).json({
      error: 'Quantum Fourier Transform failed',
      message: error.message,
      code: 'QFT_ERROR'
    });
  }
});

// Quantum Phase Estimation
router.post('/phase-estimation', async (req, res) => {
  try {
    const { unitaryOperator, eigenstate, precision = 8 } = req.body;

    if (!unitaryOperator || !eigenstate) {
      return res.status(400).json({
        error: 'unitaryOperator and eigenstate are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = await quantumAlgorithms.quantumPhaseEstimation(unitaryOperator, eigenstate, precision);

    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    logger.error('Quantum Phase Estimation failed:', { error: error.message });
    res.status(500).json({
      error: 'Quantum Phase Estimation failed',
      message: error.message,
      code: 'PHASE_ESTIMATION_ERROR'
    });
  }
});

// Quantum Support Vector Machine
router.post('/qsvm', async (req, res) => {
  try {
    const { trainingData, labels, options = {} } = req.body;

    if (!trainingData || !labels) {
      return res.status(400).json({
        error: 'trainingData and labels are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = await quantumAlgorithms.quantumSVM(trainingData, labels, options);

    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    logger.error('Quantum SVM failed:', { error: error.message });
    res.status(500).json({
      error: 'Quantum SVM failed',
      message: error.message,
      code: 'QSVM_ERROR'
    });
  }
});

// Quantum Clustering
router.post('/clustering', async (req, res) => {
  try {
    const { data, k, options = {} } = req.body;

    if (!data || !k) {
      return res.status(400).json({
        error: 'data and k (number of clusters) are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = await quantumAlgorithms.quantumClustering(data, k, options);

    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    logger.error('Quantum clustering failed:', { error: error.message });
    res.status(500).json({
      error: 'Quantum clustering failed',
      message: error.message,
      code: 'CLUSTERING_ERROR'
    });
  }
});

// Upload and process from file
router.post('/process-file', upload.single('dataFile'), async (req, res) => {
  try {
    const { 
      algorithm = 'grover-search', 
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
    switch (algorithm) {
      case 'grover-search':
        result = await quantumAlgorithms.groverSearch(data.targetItem, data.searchSpace, options);
        break;
      case 'qft':
        result = await quantumAlgorithms.quantumFourierTransform(data.inputState);
        break;
      case 'phase-estimation':
        result = await quantumAlgorithms.quantumPhaseEstimation(data.unitaryOperator, data.eigenstate, data.precision);
        break;
      case 'qsvm':
        result = await quantumAlgorithms.quantumSVM(data.trainingData, data.labels, options);
        break;
      case 'clustering':
        result = await quantumAlgorithms.quantumClustering(data.data, data.k, options);
        break;
      default:
        return res.status(400).json({
          error: 'Invalid algorithm type',
          code: 'INVALID_ALGORITHM'
        });
    }

    res.json({
      success: true,
      algorithm: algorithm,
      result: result
    });

  } catch (error) {
    logger.error('File processing failed:', { error: error.message });
    res.status(500).json({
      error: 'File processing failed',
      message: error.message,
      code: 'FILE_PROCESSING_ERROR'
    });
  }
});

// Get current quantum state
router.get('/state', (req, res) => {
  res.json({
    success: true,
    state: quantumAlgorithms.getState(),
    qubitCount: quantumAlgorithms.getQubitCount()
  });
});

// Get available algorithms
router.get('/algorithms', (req, res) => {
  res.json({
    success: true,
    algorithms: [
      {
        name: 'grover-search',
        description: "Grover's Search Algorithm",
        parameters: ['targetItem', 'searchSpace'],
        options: ['maxIterations', 'tolerance']
      },
      {
        name: 'qft',
        description: 'Quantum Fourier Transform',
        parameters: ['inputState'],
        options: []
      },
      {
        name: 'phase-estimation',
        description: 'Quantum Phase Estimation',
        parameters: ['unitaryOperator', 'eigenstate'],
        options: ['precision']
      },
      {
        name: 'qsvm',
        description: 'Quantum Support Vector Machine',
        parameters: ['trainingData', 'labels'],
        options: ['kernelType', 'gamma', 'C', 'maxIterations']
      },
      {
        name: 'clustering',
        description: 'Quantum Clustering (K-means)',
        parameters: ['data', 'k'],
        options: ['maxIterations', 'tolerance', 'initialization']
      }
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Quantum Algorithms',
    version: '2.9.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
