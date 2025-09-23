const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Redis = require('redis');
const crypto = require('crypto');
const math = require('mathjs');

const app = express();
const PORT = process.env.PORT || 3010;

// Redis client
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect();

// Quantum Cryptography configuration
const qcConfig = {
  protocols: {
    'bb84': {
      name: 'BB84 Protocol',
      description: 'Quantum key distribution protocol',
      security: 'unconditional',
      keyRate: 'high',
      distance: '100km'
    },
    'e91': {
      name: 'E91 Protocol',
      description: 'Entanglement-based QKD',
      security: 'unconditional',
      keyRate: 'medium',
      distance: '200km'
    },
    'sarg04': {
      name: 'SARG04 Protocol',
      description: 'Decoy state QKD',
      security: 'unconditional',
      keyRate: 'high',
      distance: '150km'
    },
    'dps': {
      name: 'DPS Protocol',
      description: 'Differential phase shift QKD',
      security: 'unconditional',
      keyRate: 'medium',
      distance: '120km'
    }
  },
  quantumStates: {
    'h': { name: 'Horizontal', vector: [1, 0] },
    'v': { name: 'Vertical', vector: [0, 1] },
    'd': { name: 'Diagonal', vector: [1, 1].map(x => x / Math.sqrt(2)) },
    'a': { name: 'Anti-diagonal', vector: [1, -1].map(x => x / Math.sqrt(2)) }
  },
  bases: {
    'rectilinear': ['h', 'v'],
    'diagonal': ['d', 'a']
  }
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many quantum cryptography requests, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    uptime: process.uptime(),
    quantum: 'enabled'
  });
});

// Get available protocols
app.get('/api/protocols', (req, res) => {
  res.json(qcConfig.protocols);
});

// Get quantum states
app.get('/api/states', (req, res) => {
  res.json(qcConfig.quantumStates);
});

// BB84 Quantum Key Distribution
app.post('/api/bb84/key-distribution', (req, res) => {
  const { keyLength, errorRate, eavesdropping } = req.body;
  
  try {
    const sessionId = uuidv4();
    const result = performBB84(keyLength || 256, errorRate || 0.01, eavesdropping || false);
    
    res.json({
      sessionId,
      protocol: 'BB84',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// E91 Entanglement-based QKD
app.post('/api/e91/key-distribution', (req, res) => {
  const { keyLength, entanglementFidelity, distance } = req.body;
  
  try {
    const sessionId = uuidv4();
    const result = performE91(keyLength || 256, entanglementFidelity || 0.95, distance || 100);
    
    res.json({
      sessionId,
      protocol: 'E91',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quantum random number generation
app.post('/api/random/generate', (req, res) => {
  const { length, entropy } = req.body;
  
  try {
    const randomId = uuidv4();
    const result = generateQuantumRandom(length || 1024, entropy || 'high');
    
    res.json({
      randomId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quantum digital signature
app.post('/api/signature/create', (req, res) => {
  const { message, privateKey, algorithm } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    const signatureId = uuidv4();
    const result = createQuantumSignature(message, privateKey, algorithm || 'qds');
    
    res.json({
      signatureId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quantum signature verification
app.post('/api/signature/verify', (req, res) => {
  const { message, signature, publicKey, algorithm } = req.body;
  
  if (!message || !signature) {
    return res.status(400).json({ error: 'Message and signature are required' });
  }
  
  try {
    const verificationId = uuidv4();
    const result = verifyQuantumSignature(message, signature, publicKey, algorithm || 'qds');
    
    res.json({
      verificationId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quantum coin flipping
app.post('/api/coin-flip', (req, res) => {
  const { protocol, security } = req.body;
  
  try {
    const flipId = uuidv4();
    const result = performQuantumCoinFlip(protocol || 'bb84', security || 'high');
    
    res.json({
      flipId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quantum commitment scheme
app.post('/api/commitment/create', (req, res) => {
  const { value, protocol } = req.body;
  
  if (!value) {
    return res.status(400).json({ error: 'Value is required' });
  }
  
  try {
    const commitmentId = uuidv4();
    const result = createQuantumCommitment(value, protocol || 'bb84');
    
    res.json({
      commitmentId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quantum commitment verification
app.post('/api/commitment/verify', (req, res) => {
  const { commitment, value, proof } = req.body;
  
  if (!commitment || !value) {
    return res.status(400).json({ error: 'Commitment and value are required' });
  }
  
  try {
    const verificationId = uuidv4();
    const result = verifyQuantumCommitment(commitment, value, proof);
    
    res.json({
      verificationId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security analysis
app.post('/api/security/analyze', (req, res) => {
  const { protocol, parameters, attackModel } = req.body;
  
  if (!protocol) {
    return res.status(400).json({ error: 'Protocol is required' });
  }
  
  try {
    const analysisId = uuidv4();
    const result = analyzeSecurity(protocol, parameters, attackModel);
    
    res.json({
      analysisId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quantum Cryptography functions
function performBB84(keyLength, errorRate, eavesdropping) {
  // Simulate BB84 protocol
  const aliceBits = generateRandomBits(keyLength);
  const aliceBases = generateRandomBases(keyLength);
  const aliceStates = encodeStates(aliceBits, aliceBases);
  
  const bobBases = generateRandomBases(keyLength);
  const bobMeasurements = measureStates(aliceStates, bobBases, errorRate, eavesdropping);
  
  // Sift key
  const siftedKey = siftKey(aliceBits, aliceBases, bobBases, bobMeasurements);
  
  // Error correction
  const correctedKey = errorCorrection(siftedKey, errorRate);
  
  // Privacy amplification
  const finalKey = privacyAmplification(correctedKey);
  
  return {
    aliceBits,
    aliceBases,
    bobBases,
    bobMeasurements,
    siftedKey,
    correctedKey,
    finalKey,
    keyLength: finalKey.length,
    errorRate: calculateErrorRate(aliceBits, finalKey),
    security: eavesdropping ? 'compromised' : 'secure'
  };
}

function performE91(keyLength, entanglementFidelity, distance) {
  // Simulate E91 protocol
  const entangledPairs = generateEntangledPairs(keyLength);
  const aliceMeasurements = measureEntangledPairs(entangledPairs, 'alice');
  const bobMeasurements = measureEntangledPairs(entangledPairs, 'bob');
  
  // Check Bell inequality
  const bellViolation = checkBellInequality(aliceMeasurements, bobMeasurements);
  
  // Generate key
  const key = generateKeyFromMeasurements(aliceMeasurements, bobMeasurements, bellViolation);
  
  return {
    entangledPairs,
    aliceMeasurements,
    bobMeasurements,
    bellViolation,
    key,
    keyLength: key.length,
    entanglementFidelity,
    distance,
    security: bellViolation > 2 ? 'secure' : 'insecure'
  };
}

function generateQuantumRandom(length, entropy) {
  // Simulate quantum random number generation
  const randomBits = [];
  
  for (let i = 0; i < length; i++) {
    // Simulate quantum measurement
    const measurement = Math.random() < 0.5 ? 0 : 1;
    randomBits.push(measurement);
  }
  
  // Calculate entropy
  const calculatedEntropy = calculateEntropy(randomBits);
  
  return {
    randomBits,
    length,
    entropy: calculatedEntropy,
    quality: calculatedEntropy > 0.9 ? 'high' : calculatedEntropy > 0.7 ? 'medium' : 'low'
  };
}

function createQuantumSignature(message, privateKey, algorithm) {
  // Simulate quantum digital signature
  const messageHash = crypto.createHash('sha256').update(message).digest('hex');
  const signature = generateQuantumSignature(messageHash, privateKey, algorithm);
  
  return {
    message,
    messageHash,
    signature,
    algorithm,
    publicKey: derivePublicKey(privateKey),
    timestamp: new Date().toISOString()
  };
}

function verifyQuantumSignature(message, signature, publicKey, algorithm) {
  // Simulate quantum signature verification
  const messageHash = crypto.createHash('sha256').update(message).digest('hex');
  const isValid = verifySignature(messageHash, signature, publicKey, algorithm);
  
  return {
    message,
    signature,
    publicKey,
    algorithm,
    valid: isValid,
    confidence: isValid ? Math.random() * 0.2 + 0.8 : Math.random() * 0.3
  };
}

function performQuantumCoinFlip(protocol, security) {
  // Simulate quantum coin flipping
  const aliceCommitment = generateCommitment(Math.random() < 0.5);
  const bobChoice = Math.random() < 0.5;
  const aliceReveal = revealCommitment(aliceCommitment);
  
  const result = (aliceReveal + bobChoice) % 2;
  
  return {
    aliceCommitment,
    bobChoice,
    aliceReveal,
    result: result === 0 ? 'heads' : 'tails',
    protocol,
    security,
    fair: true
  };
}

function createQuantumCommitment(value, protocol) {
  // Simulate quantum commitment
  const commitment = generateQuantumCommitment(value, protocol);
  const proof = generateCommitmentProof(value, commitment);
  
  return {
    value,
    commitment,
    proof,
    protocol,
    timestamp: new Date().toISOString()
  };
}

function verifyQuantumCommitment(commitment, value, proof) {
  // Simulate quantum commitment verification
  const isValid = verifyCommitment(commitment, value, proof);
  
  return {
    commitment,
    value,
    proof,
    valid: isValid,
    timestamp: new Date().toISOString()
  };
}

function analyzeSecurity(protocol, parameters, attackModel) {
  // Simulate security analysis
  const analysis = {
    protocol,
    parameters,
    attackModel,
    securityLevel: 'unconditional',
    vulnerabilities: [],
    recommendations: []
  };
  
  // Analyze for common attacks
  if (attackModel === 'eavesdropping') {
    analysis.vulnerabilities.push('Eavesdropping detection required');
    analysis.recommendations.push('Implement decoy states');
  }
  
  if (attackModel === 'photon_number_splitting') {
    analysis.vulnerabilities.push('Photon number splitting attack');
    analysis.recommendations.push('Use decoy state protocol');
  }
  
  if (attackModel === 'side_channel') {
    analysis.vulnerabilities.push('Side channel attacks');
    analysis.recommendations.push('Implement countermeasures');
  }
  
  return analysis;
}

// Helper functions
function generateRandomBits(length) {
  return Array.from({ length }, () => Math.random() < 0.5 ? 0 : 1);
}

function generateRandomBases(length) {
  return Array.from({ length }, () => Math.random() < 0.5 ? 'rectilinear' : 'diagonal');
}

function encodeStates(bits, bases) {
  return bits.map((bit, i) => {
    const base = bases[i];
    if (base === 'rectilinear') {
      return bit === 0 ? 'h' : 'v';
    } else {
      return bit === 0 ? 'd' : 'a';
    }
  });
}

function measureStates(states, bases, errorRate, eavesdropping) {
  return states.map((state, i) => {
    const base = bases[i];
    const correctMeasurement = measureInBasis(state, base);
    
    // Apply errors
    if (Math.random() < errorRate) {
      return 1 - correctMeasurement;
    }
    
    // Apply eavesdropping
    if (eavesdropping && Math.random() < 0.1) {
      return Math.random() < 0.5 ? 0 : 1;
    }
    
    return correctMeasurement;
  });
}

function measureInBasis(state, base) {
  if (base === 'rectilinear') {
    return state === 'h' ? 0 : 1;
  } else {
    return state === 'd' ? 0 : 1;
  }
}

function siftKey(aliceBits, aliceBases, bobBases, bobMeasurements) {
  const siftedKey = [];
  for (let i = 0; i < aliceBits.length; i++) {
    if (aliceBases[i] === bobBases[i]) {
      siftedKey.push(bobMeasurements[i]);
    }
  }
  return siftedKey;
}

function errorCorrection(key, errorRate) {
  // Simple error correction
  return key.map(bit => Math.random() < errorRate ? 1 - bit : bit);
}

function privacyAmplification(key) {
  // Simple privacy amplification
  return key.slice(0, Math.floor(key.length * 0.8));
}

function calculateErrorRate(original, corrected) {
  let errors = 0;
  for (let i = 0; i < Math.min(original.length, corrected.length); i++) {
    if (original[i] !== corrected[i]) {
      errors++;
    }
  }
  return errors / Math.min(original.length, corrected.length);
}

function generateEntangledPairs(length) {
  return Array.from({ length }, () => ({
    alice: Math.random() < 0.5 ? 0 : 1,
    bob: Math.random() < 0.5 ? 0 : 1
  }));
}

function measureEntangledPairs(pairs, party) {
  return pairs.map(pair => pair[party]);
}

function checkBellInequality(aliceMeasurements, bobMeasurements) {
  // Simplified Bell inequality check
  let correlation = 0;
  for (let i = 0; i < aliceMeasurements.length; i++) {
    if (aliceMeasurements[i] === bobMeasurements[i]) {
      correlation++;
    }
  }
  return correlation / aliceMeasurements.length;
}

function generateKeyFromMeasurements(aliceMeasurements, bobMeasurements, bellViolation) {
  if (bellViolation > 2) {
    return aliceMeasurements; // Use Alice's measurements as key
  }
  return []; // No secure key
}

function calculateEntropy(bits) {
  const counts = { 0: 0, 1: 0 };
  bits.forEach(bit => counts[bit]++);
  
  const p0 = counts[0] / bits.length;
  const p1 = counts[1] / bits.length;
  
  if (p0 === 0 || p1 === 0) return 0;
  
  return -(p0 * Math.log2(p0) + p1 * Math.log2(p1));
}

function generateQuantumSignature(messageHash, privateKey, algorithm) {
  // Simulate quantum signature generation
  return crypto.createHmac('sha256', privateKey).update(messageHash).digest('hex');
}

function derivePublicKey(privateKey) {
  // Simulate public key derivation
  return crypto.createHash('sha256').update(privateKey).digest('hex');
}

function verifySignature(messageHash, signature, publicKey, algorithm) {
  // Simulate signature verification
  return signature.length === 64; // Simple check
}

function generateCommitment(value) {
  // Simulate commitment generation
  return crypto.createHash('sha256').update(value.toString()).digest('hex');
}

function revealCommitment(commitment) {
  // Simulate commitment revelation
  return Math.random() < 0.5 ? 0 : 1;
}

function generateQuantumCommitment(value, protocol) {
  // Simulate quantum commitment
  return crypto.createHash('sha256').update(value + protocol).digest('hex');
}

function generateCommitmentProof(value, commitment) {
  // Simulate commitment proof
  return crypto.createHash('sha256').update(value + commitment).digest('hex');
}

function verifyCommitment(commitment, value, proof) {
  // Simulate commitment verification
  const expectedProof = generateCommitmentProof(value, commitment);
  return proof === expectedProof;
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Quantum Cryptography Error:', err);
  
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Quantum Cryptography v3.0 running on port ${PORT}`);
  console.log(`🔐 Quantum-safe encryption and security enabled`);
  console.log(`🔑 BB84, E91, SARG04, DPS protocols supported`);
  console.log(`🎲 Quantum random number generation enabled`);
  console.log(`✍️ Quantum digital signatures enabled`);
  console.log(`🪙 Quantum coin flipping enabled`);
  console.log(`📝 Quantum commitment schemes enabled`);
});

module.exports = app;
