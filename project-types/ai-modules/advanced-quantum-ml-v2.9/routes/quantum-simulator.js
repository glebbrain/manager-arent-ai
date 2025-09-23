const express = require('express');
const multer = require('multer');
const quantumSimulator = require('../modules/quantum-simulator');
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

// Initialize quantum simulator
router.post('/initialize', async (req, res) => {
  try {
    const { numQubits, options = {} } = req.body;

    if (!numQubits) {
      return res.status(400).json({
        error: 'numQubits is required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = quantumSimulator.initialize(numQubits, options);

    res.json({
      success: true,
      result: result,
      simulatorInfo: quantumSimulator.getInfo()
    });

  } catch (error) {
    logger.error('Quantum simulator initialization failed:', { error: error.message });
    res.status(500).json({
      error: 'Quantum simulator initialization failed',
      message: error.message,
      code: 'INITIALIZATION_ERROR'
    });
  }
});

// Apply quantum gate
router.post('/apply-gate', async (req, res) => {
  try {
    const { gateType, qubitIndices, parameters = {} } = req.body;

    if (!gateType || !qubitIndices) {
      return res.status(400).json({
        error: 'gateType and qubitIndices are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = quantumSimulator.applyGate(gateType, qubitIndices, parameters);

    res.json({
      success: true,
      gateType: gateType,
      qubitIndices: qubitIndices,
      parameters: parameters,
      state: quantumSimulator.getState().slice(0, 10), // Show first 10 amplitudes
      simulatorInfo: quantumSimulator.getInfo()
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

// Apply multiple gates
router.post('/apply-gates', async (req, res) => {
  try {
    const { gates } = req.body;

    if (!gates || !Array.isArray(gates)) {
      return res.status(400).json({
        error: 'gates array is required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const results = [];
    const initialState = quantumSimulator.getState();

    for (const gate of gates) {
      const { gateType, qubitIndices, parameters = {} } = gate;
      
      try {
        quantumSimulator.applyGate(gateType, qubitIndices, parameters);
        results.push({
          gate: gateType,
          qubitIndices: qubitIndices,
          parameters: parameters,
          success: true
        });
      } catch (error) {
        results.push({
          gate: gateType,
          qubitIndices: qubitIndices,
          parameters: parameters,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      gates: results,
      initialState: initialState.slice(0, 10),
      finalState: quantumSimulator.getState().slice(0, 10),
      simulatorInfo: quantumSimulator.getInfo()
    });

  } catch (error) {
    logger.error('Multiple gate application failed:', { error: error.message });
    res.status(500).json({
      error: 'Multiple gate application failed',
      message: error.message,
      code: 'GATES_ERROR'
    });
  }
});

// Measure quantum state
router.post('/measure', async (req, res) => {
  try {
    const { qubitIndex = null } = req.body;

    const result = quantumSimulator.measure(qubitIndex);
    const probabilities = quantumSimulator.getProbabilities();

    res.json({
      success: true,
      measurement: result,
      probabilities: probabilities,
      state: quantumSimulator.getState().slice(0, 10),
      simulatorInfo: quantumSimulator.getInfo()
    });

  } catch (error) {
    logger.error('Measurement failed:', { error: error.message });
    res.status(500).json({
      error: 'Measurement failed',
      message: error.message,
      code: 'MEASUREMENT_ERROR'
    });
  }
});

// Get quantum state
router.get('/state', (req, res) => {
  res.json({
    success: true,
    state: quantumSimulator.getState(),
    probabilities: quantumSimulator.getProbabilities(),
    simulatorInfo: quantumSimulator.getInfo()
  });
});

// Get state fidelity
router.post('/fidelity', async (req, res) => {
  try {
    const { targetState } = req.body;

    if (!targetState) {
      return res.status(400).json({
        error: 'targetState is required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const fidelity = quantumSimulator.getFidelity(targetState);

    res.json({
      success: true,
      fidelity: fidelity,
      currentState: quantumSimulator.getState().slice(0, 10),
      targetState: targetState.slice(0, 10)
    });

  } catch (error) {
    logger.error('Fidelity calculation failed:', { error: error.message });
    res.status(500).json({
      error: 'Fidelity calculation failed',
      message: error.message,
      code: 'FIDELITY_ERROR'
    });
  }
});

// Get entanglement entropy
router.post('/entanglement-entropy', async (req, res) => {
  try {
    const { qubitIndex } = req.body;

    if (qubitIndex === undefined) {
      return res.status(400).json({
        error: 'qubitIndex is required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const entropy = quantumSimulator.getEntanglementEntropy(qubitIndex);

    res.json({
      success: true,
      qubitIndex: qubitIndex,
      entanglementEntropy: entropy,
      state: quantumSimulator.getState().slice(0, 10)
    });

  } catch (error) {
    logger.error('Entanglement entropy calculation failed:', { error: error.message });
    res.status(500).json({
      error: 'Entanglement entropy calculation failed',
      message: error.message,
      code: 'ENTROPY_ERROR'
    });
  }
});

// Reset quantum state
router.post('/reset', (req, res) => {
  try {
    quantumSimulator.reset();

    res.json({
      success: true,
      message: 'Quantum state reset successfully',
      state: quantumSimulator.getState().slice(0, 10),
      simulatorInfo: quantumSimulator.getInfo()
    });

  } catch (error) {
    logger.error('State reset failed:', { error: error.message });
    res.status(500).json({
      error: 'State reset failed',
      message: error.message,
      code: 'RESET_ERROR'
    });
  }
});

// Upload and simulate from file
router.post('/simulate-file', upload.single('dataFile'), async (req, res) => {
  try {
    const { 
      simulationType = 'gates', 
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
    switch (simulationType) {
      case 'gates':
        if (data.gates) {
          for (const gate of data.gates) {
            quantumSimulator.applyGate(gate.gateType, gate.qubitIndices, gate.parameters);
          }
        }
        result = {
          finalState: quantumSimulator.getState(),
          probabilities: quantumSimulator.getProbabilities()
        };
        break;
      case 'measurement':
        if (data.gates) {
          for (const gate of data.gates) {
            quantumSimulator.applyGate(gate.gateType, gate.qubitIndices, gate.parameters);
          }
        }
        const measurement = quantumSimulator.measure(data.qubitIndex);
        result = {
          measurement: measurement,
          probabilities: quantumSimulator.getProbabilities()
        };
        break;
      default:
        return res.status(400).json({
          error: 'Invalid simulation type',
          code: 'INVALID_TYPE'
        });
    }

    res.json({
      success: true,
      simulationType: simulationType,
      result: result,
      simulatorInfo: quantumSimulator.getInfo()
    });

  } catch (error) {
    logger.error('File simulation failed:', { error: error.message });
    res.status(500).json({
      error: 'File simulation failed',
      message: error.message,
      code: 'FILE_SIMULATION_ERROR'
    });
  }
});

// Get available gates
router.get('/gates', (req, res) => {
  res.json({
    success: true,
    gates: [
      {
        name: 'X',
        description: 'Pauli-X gate',
        parameters: ['qubitIndex'],
        options: []
      },
      {
        name: 'Y',
        description: 'Pauli-Y gate',
        parameters: ['qubitIndex'],
        options: []
      },
      {
        name: 'Z',
        description: 'Pauli-Z gate',
        parameters: ['qubitIndex'],
        options: []
      },
      {
        name: 'H',
        description: 'Hadamard gate',
        parameters: ['qubitIndex'],
        options: []
      },
      {
        name: 'S',
        description: 'S gate (π/2 phase)',
        parameters: ['qubitIndex'],
        options: []
      },
      {
        name: 'T',
        description: 'T gate (π/4 phase)',
        parameters: ['qubitIndex'],
        options: []
      },
      {
        name: 'RX',
        description: 'Rotation-X gate',
        parameters: ['qubitIndex'],
        options: ['angle']
      },
      {
        name: 'RY',
        description: 'Rotation-Y gate',
        parameters: ['qubitIndex'],
        options: ['angle']
      },
      {
        name: 'RZ',
        description: 'Rotation-Z gate',
        parameters: ['qubitIndex'],
        options: ['angle']
      },
      {
        name: 'CNOT',
        description: 'Controlled-NOT gate',
        parameters: ['controlQubit', 'targetQubit'],
        options: []
      },
      {
        name: 'CZ',
        description: 'Controlled-Z gate',
        parameters: ['controlQubit', 'targetQubit'],
        options: []
      },
      {
        name: 'SWAP',
        description: 'SWAP gate',
        parameters: ['qubit1', 'qubit2'],
        options: []
      },
      {
        name: 'Toffoli',
        description: 'Toffoli gate (CCNOT)',
        parameters: ['control1', 'control2', 'target'],
        options: []
      },
      {
        name: 'Fredkin',
        description: 'Fredkin gate (CSWAP)',
        parameters: ['control', 'qubit1', 'qubit2'],
        options: []
      }
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Quantum Simulator',
    version: '2.9.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
