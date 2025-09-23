const express = require('express');
const router = express.Router();
const quantumProcessor = require('../modules/quantum-processor');
const logger = require('../modules/logger');

// POST /api/v2.8/quantum/process
router.post('/process', async (req, res) => {
  try {
    const { algorithm, input, qubits, iterations, options } = req.body;
    
    if (!algorithm) {
      return res.status(400).json({ error: 'Algorithm is required' });
    }

    const result = await quantumProcessor.process({
      algorithm,
      input: input || [],
      qubits: qubits || 4,
      iterations: iterations || 100,
      options: options || {}
    });

    res.json(result);
  } catch (error) {
    logger.error(`[QUANTUM-ROUTE] Process error: ${error.message}`);
    res.status(500).json({ 
      error: 'Quantum processing failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/quantum/search
router.post('/search', async (req, res) => {
  try {
    const { searchSpace, target, qubits, iterations } = req.body;
    
    if (!searchSpace || !Array.isArray(searchSpace)) {
      return res.status(400).json({ error: 'Search space array is required' });
    }

    const result = await quantumProcessor.process({
      algorithm: 'grover',
      input: searchSpace,
      qubits: qubits || Math.ceil(Math.log2(searchSpace.length)),
      iterations: iterations || 100,
      options: { target }
    });

    res.json({
      success: true,
      algorithm: 'grover',
      searchSpace: searchSpace.length,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[QUANTUM-ROUTE] Search error: ${error.message}`);
    res.status(500).json({ 
      error: 'Quantum search failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/quantum/factorize
router.post('/factorize', async (req, res) => {
  try {
    const { number, qubits } = req.body;
    
    if (!number || typeof number !== 'number') {
      return res.status(400).json({ error: 'Valid number is required' });
    }

    const result = await quantumProcessor.process({
      algorithm: 'shor',
      input: number,
      qubits: qubits || Math.ceil(Math.log2(number)),
      options: {}
    });

    res.json({
      success: true,
      algorithm: 'shor',
      input: number,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[QUANTUM-ROUTE] Factorization error: ${error.message}`);
    res.status(500).json({ 
      error: 'Quantum factorization failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/quantum/fft
router.post('/fft', async (req, res) => {
  try {
    const { signal, qubits } = req.body;
    
    if (!signal || !Array.isArray(signal)) {
      return res.status(400).json({ error: 'Signal array is required' });
    }

    const result = await quantumProcessor.process({
      algorithm: 'qft',
      input: signal,
      qubits: qubits || Math.ceil(Math.log2(signal.length)),
      options: {}
    });

    res.json({
      success: true,
      algorithm: 'qft',
      inputLength: signal.length,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[QUANTUM-ROUTE] FFT error: ${error.message}`);
    res.status(500).json({ 
      error: 'Quantum FFT failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/quantum/vqe
router.post('/vqe', async (req, res) => {
  try {
    const { hamiltonian, qubits, maxIterations, learningRate } = req.body;
    
    if (!hamiltonian) {
      return res.status(400).json({ error: 'Hamiltonian is required' });
    }

    const result = await quantumProcessor.process({
      algorithm: 'vqe',
      input: hamiltonian,
      qubits: qubits || 4,
      options: {
        maxIterations: maxIterations || 100,
        learningRate: learningRate || 0.1
      }
    });

    res.json({
      success: true,
      algorithm: 'vqe',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[QUANTUM-ROUTE] VQE error: ${error.message}`);
    res.status(500).json({ 
      error: 'VQE processing failed',
      message: error.message 
    });
  }
});

// GET /api/v2.8/quantum/status
router.get('/status', async (req, res) => {
  try {
    const status = await quantumProcessor.getQuantumStatus();
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[QUANTUM-ROUTE] Status error: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to get quantum status',
      message: error.message 
    });
  }
});

// GET /api/v2.8/quantum/health
router.get('/health', async (req, res) => {
  try {
    const health = await quantumProcessor.healthCheck();
    res.json(health);
  } catch (error) {
    logger.error(`[QUANTUM-ROUTE] Health check error: ${error.message}`);
    res.status(500).json({ 
      error: 'Health check failed',
      message: error.message 
    });
  }
});

module.exports = router;
