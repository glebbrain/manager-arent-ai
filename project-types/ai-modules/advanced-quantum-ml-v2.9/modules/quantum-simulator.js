const { create, all } = require('mathjs');
const logger = require('./logger');

// Create mathjs instance with complex number support
const math = create(all, {
  number: 'Complex'
});

class QuantumSimulator {
  constructor() {
    this.qubits = 0;
    this.state = [];
    this.gates = [];
    this.measurements = [];
    this.noiseModel = null;
    this.errorRates = {
      singleQubit: 0.001,
      twoQubit: 0.01,
      measurement: 0.005
    };
  }

  // Initialize quantum simulator
  initialize(numQubits, options = {}) {
    try {
      this.qubits = numQubits;
      this.state = Array(Math.pow(2, numQubits)).fill().map(() => math.complex(0, 0));
      this.state[0] = math.complex(1, 0); // Initialize to |0...0⟩
      this.gates = [];
      this.measurements = [];
      
      // Set noise model
      this.noiseModel = options.noiseModel || 'ideal';
      this.errorRates = {
        singleQubit: options.singleQubitError || 0.001,
        twoQubit: options.twoQubitError || 0.01,
        measurement: options.measurementError || 0.005
      };

      logger.info('Quantum simulator initialized', {
        qubits: numQubits,
        noiseModel: this.noiseModel,
        errorRates: this.errorRates
      });

      return {
        success: true,
        qubits: this.qubits,
        stateSize: this.state.length,
        noiseModel: this.noiseModel,
        errorRates: this.errorRates
      };
    } catch (error) {
      logger.error('Quantum simulator initialization failed:', { error: error.message });
      throw error;
    }
  }

  // Apply quantum gate
  applyGate(gateType, qubitIndices, parameters = {}) {
    try {
      const { angle = Math.PI / 4, controlQubit = null } = parameters;
      
      switch (gateType) {
        case 'X':
          return this.applyXGate(qubitIndices[0]);
        case 'Y':
          return this.applyYGate(qubitIndices[0]);
        case 'Z':
          return this.applyZGate(qubitIndices[0]);
        case 'H':
          return this.applyHadamardGate(qubitIndices[0]);
        case 'S':
          return this.applySGate(qubitIndices[0]);
        case 'T':
          return this.applyTGate(qubitIndices[0]);
        case 'RX':
          return this.applyRXGate(qubitIndices[0], angle);
        case 'RY':
          return this.applyRYGate(qubitIndices[0], angle);
        case 'RZ':
          return this.applyRZGate(qubitIndices[0], angle);
        case 'CNOT':
          return this.applyCNOTGate(qubitIndices[0], qubitIndices[1]);
        case 'CZ':
          return this.applyCZGate(qubitIndices[0], qubitIndices[1]);
        case 'SWAP':
          return this.applySWAPGate(qubitIndices[0], qubitIndices[1]);
        case 'Toffoli':
          return this.applyToffoliGate(qubitIndices[0], qubitIndices[1], qubitIndices[2]);
        case 'Fredkin':
          return this.applyFredkinGate(qubitIndices[0], qubitIndices[1], qubitIndices[2]);
        default:
          throw new Error(`Unknown gate type: ${gateType}`);
      }
    } catch (error) {
      logger.error('Gate application failed:', { error: error.message });
      throw error;
    }
  }

  // Pauli-X gate
  applyXGate(qubitIndex) {
    const n = this.state.length;
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < n; i++) {
      const bit = (i >> qubitIndex) & 1;
      const targetIndex = bit === 0 ? i | (1 << qubitIndex) : i & ~(1 << qubitIndex);
      newState[targetIndex] = math.add(newState[targetIndex], this.state[i]);
    }
    
    this.state = newState;
    this.addNoise('singleQubit', qubitIndex);
  }

  // Pauli-Y gate
  applyYGate(qubitIndex) {
    const n = this.state.length;
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < n; i++) {
      const bit = (i >> qubitIndex) & 1;
      const targetIndex = bit === 0 ? i | (1 << qubitIndex) : i & ~(1 << qubitIndex);
      const phase = bit === 0 ? math.complex(0, 1) : math.complex(0, -1);
      newState[targetIndex] = math.add(newState[targetIndex], 
        math.multiply(phase, this.state[i]));
    }
    
    this.state = newState;
    this.addNoise('singleQubit', qubitIndex);
  }

  // Pauli-Z gate
  applyZGate(qubitIndex) {
    for (let i = 0; i < this.state.length; i++) {
      const bit = (i >> qubitIndex) & 1;
      if (bit === 1) {
        this.state[i] = math.multiply(math.complex(-1, 0), this.state[i]);
      }
    }
    this.addNoise('singleQubit', qubitIndex);
  }

  // Hadamard gate
  applyHadamardGate(qubitIndex) {
    const n = this.state.length;
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    const sqrt2 = Math.sqrt(2);
    
    for (let i = 0; i < n; i++) {
      const bit = (i >> qubitIndex) & 1;
      const amplitude = this.state[i];
      const factor = math.complex(1 / sqrt2, 0);
      
      if (bit === 0) {
        newState[i] = math.add(newState[i], math.multiply(factor, amplitude));
        newState[i | (1 << qubitIndex)] = math.add(newState[i | (1 << qubitIndex)], 
          math.multiply(factor, amplitude));
      } else {
        newState[i] = math.add(newState[i], math.multiply(factor, amplitude));
        newState[i & ~(1 << qubitIndex)] = math.add(newState[i & ~(1 << qubitIndex)], 
          math.multiply(math.complex(-1, 0), math.multiply(factor, amplitude)));
      }
    }
    
    this.state = newState;
    this.addNoise('singleQubit', qubitIndex);
  }

  // S gate (π/2 phase)
  applySGate(qubitIndex) {
    for (let i = 0; i < this.state.length; i++) {
      const bit = (i >> qubitIndex) & 1;
      if (bit === 1) {
        this.state[i] = math.multiply(math.complex(0, 1), this.state[i]);
      }
    }
    this.addNoise('singleQubit', qubitIndex);
  }

  // T gate (π/4 phase)
  applyTGate(qubitIndex) {
    for (let i = 0; i < this.state.length; i++) {
      const bit = (i >> qubitIndex) & 1;
      if (bit === 1) {
        const phase = math.complex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4));
        this.state[i] = math.multiply(phase, this.state[i]);
      }
    }
    this.addNoise('singleQubit', qubitIndex);
  }

  // Rotation-X gate
  applyRXGate(qubitIndex, angle) {
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    const n = this.state.length;
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < n; i++) {
      const bit = (i >> qubitIndex) & 1;
      const amplitude = this.state[i];
      
      if (bit === 0) {
        newState[i] = math.add(newState[i], 
          math.multiply(math.complex(cos, 0), amplitude));
        newState[i | (1 << qubitIndex)] = math.add(newState[i | (1 << qubitIndex)], 
          math.multiply(math.complex(0, -sin), amplitude));
      } else {
        newState[i] = math.add(newState[i], 
          math.multiply(math.complex(cos, 0), amplitude));
        newState[i & ~(1 << qubitIndex)] = math.add(newState[i & ~(1 << qubitIndex)], 
          math.multiply(math.complex(0, -sin), amplitude));
      }
    }
    
    this.state = newState;
    this.addNoise('singleQubit', qubitIndex);
  }

  // Rotation-Y gate
  applyRYGate(qubitIndex, angle) {
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    const n = this.state.length;
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < n; i++) {
      const bit = (i >> qubitIndex) & 1;
      const amplitude = this.state[i];
      
      if (bit === 0) {
        newState[i] = math.add(newState[i], 
          math.multiply(math.complex(cos, 0), amplitude));
        newState[i | (1 << qubitIndex)] = math.add(newState[i | (1 << qubitIndex)], 
          math.multiply(math.complex(sin, 0), amplitude));
      } else {
        newState[i] = math.add(newState[i], 
          math.multiply(math.complex(cos, 0), amplitude));
        newState[i & ~(1 << qubitIndex)] = math.add(newState[i & ~(1 << qubitIndex)], 
          math.multiply(math.complex(-sin, 0), amplitude));
      }
    }
    
    this.state = newState;
    this.addNoise('singleQubit', qubitIndex);
  }

  // Rotation-Z gate
  applyRZGate(qubitIndex, angle) {
    for (let i = 0; i < this.state.length; i++) {
      const bit = (i >> qubitIndex) & 1;
      if (bit === 1) {
        const phase = math.complex(Math.cos(angle / 2), Math.sin(angle / 2));
        this.state[i] = math.multiply(phase, this.state[i]);
      }
    }
    this.addNoise('singleQubit', qubitIndex);
  }

  // CNOT gate
  applyCNOTGate(controlQubit, targetQubit) {
    const n = this.state.length;
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < n; i++) {
      const controlBit = (i >> controlQubit) & 1;
      const targetBit = (i >> targetQubit) & 1;
      
      if (controlBit === 1) {
        // Flip target qubit
        const targetIndex = targetBit === 0 ? 
          i | (1 << targetQubit) : 
          i & ~(1 << targetQubit);
        newState[targetIndex] = math.add(newState[targetIndex], this.state[i]);
      } else {
        newState[i] = math.add(newState[i], this.state[i]);
      }
    }
    
    this.state = newState;
    this.addNoise('twoQubit', [controlQubit, targetQubit]);
  }

  // CZ gate
  applyCZGate(controlQubit, targetQubit) {
    for (let i = 0; i < this.state.length; i++) {
      const controlBit = (i >> controlQubit) & 1;
      const targetBit = (i >> targetQubit) & 1;
      
      if (controlBit === 1 && targetBit === 1) {
        this.state[i] = math.multiply(math.complex(-1, 0), this.state[i]);
      }
    }
    this.addNoise('twoQubit', [controlQubit, targetQubit]);
  }

  // SWAP gate
  applySWAPGate(qubit1, qubit2) {
    const n = this.state.length;
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < n; i++) {
      const bit1 = (i >> qubit1) & 1;
      const bit2 = (i >> qubit2) & 1;
      
      let swappedIndex = i;
      if (bit1 !== bit2) {
        swappedIndex = i ^ (1 << qubit1) ^ (1 << qubit2);
      }
      
      newState[swappedIndex] = math.add(newState[swappedIndex], this.state[i]);
    }
    
    this.state = newState;
    this.addNoise('twoQubit', [qubit1, qubit2]);
  }

  // Toffoli gate (CCNOT)
  applyToffoliGate(control1, control2, target) {
    const n = this.state.length;
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < n; i++) {
      const bit1 = (i >> control1) & 1;
      const bit2 = (i >> control2) & 1;
      const targetBit = (i >> target) & 1;
      
      if (bit1 === 1 && bit2 === 1) {
        // Flip target qubit
        const targetIndex = targetBit === 0 ? 
          i | (1 << target) : 
          i & ~(1 << target);
        newState[targetIndex] = math.add(newState[targetIndex], this.state[i]);
      } else {
        newState[i] = math.add(newState[i], this.state[i]);
      }
    }
    
    this.state = newState;
    this.addNoise('twoQubit', [control1, control2, target]);
  }

  // Fredkin gate (CSWAP)
  applyFredkinGate(control, qubit1, qubit2) {
    const n = this.state.length;
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < n; i++) {
      const controlBit = (i >> control) & 1;
      const bit1 = (i >> qubit1) & 1;
      const bit2 = (i >> qubit2) & 1;
      
      if (controlBit === 1 && bit1 !== bit2) {
        // Swap qubits
        const swappedIndex = i ^ (1 << qubit1) ^ (1 << qubit2);
        newState[swappedIndex] = math.add(newState[swappedIndex], this.state[i]);
      } else {
        newState[i] = math.add(newState[i], this.state[i]);
      }
    }
    
    this.state = newState;
    this.addNoise('twoQubit', [control, qubit1, qubit2]);
  }

  // Add noise to quantum state
  addNoise(noiseType, qubitIndices) {
    if (this.noiseModel === 'ideal') return;
    
    const errorRate = this.errorRates[noiseType];
    if (Math.random() < errorRate) {
      // Apply random error
      const errorType = Math.random();
      if (errorType < 0.33) {
        this.applyXGate(qubitIndices[0]);
      } else if (errorType < 0.66) {
        this.applyYGate(qubitIndices[0]);
      } else {
        this.applyZGate(qubitIndices[0]);
      }
    }
  }

  // Measure quantum state
  measure(qubitIndex = null) {
    try {
      if (qubitIndex !== null) {
        return this.measureSingleQubit(qubitIndex);
      } else {
        return this.measureAllQubits();
      }
    } catch (error) {
      logger.error('Measurement failed:', { error: error.message });
      throw error;
    }
  }

  // Measure single qubit
  measureSingleQubit(qubitIndex) {
    const probabilities = this.calculateProbabilities(qubitIndex);
    const random = Math.random();
    
    let cumulativeProb = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProb += probabilities[i];
      if (random <= cumulativeProb) {
        // Collapse state
        this.collapseState(qubitIndex, i);
        return i;
      }
    }
    
    return probabilities.length - 1;
  }

  // Measure all qubits
  measureAllQubits() {
    const probabilities = this.calculateAllProbabilities();
    const random = Math.random();
    
    let cumulativeProb = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProb += probabilities[i];
      if (random <= cumulativeProb) {
        // Collapse state
        this.collapseToState(i);
        return i;
      }
    }
    
    return probabilities.length - 1;
  }

  // Calculate probabilities for single qubit
  calculateProbabilities(qubitIndex) {
    const probabilities = [0, 0];
    
    for (let i = 0; i < this.state.length; i++) {
      const bit = (i >> qubitIndex) & 1;
      const amplitude = this.state[i];
      probabilities[bit] += Math.pow(math.abs(amplitude), 2);
    }
    
    return probabilities;
  }

  // Calculate probabilities for all qubits
  calculateAllProbabilities() {
    return this.state.map(amplitude => Math.pow(math.abs(amplitude), 2));
  }

  // Collapse state after measurement
  collapseState(qubitIndex, measuredValue) {
    const newState = Array(this.state.length).fill().map(() => math.complex(0, 0));
    let totalProb = 0;
    
    for (let i = 0; i < this.state.length; i++) {
      const bit = (i >> qubitIndex) & 1;
      if (bit === measuredValue) {
        newState[i] = this.state[i];
        totalProb += Math.pow(math.abs(this.state[i]), 2);
      }
    }
    
    // Normalize
    const normalizationFactor = Math.sqrt(totalProb);
    for (let i = 0; i < newState.length; i++) {
      newState[i] = math.divide(newState[i], math.complex(normalizationFactor, 0));
    }
    
    this.state = newState;
  }

  // Collapse to specific state
  collapseToState(stateIndex) {
    const newState = Array(this.state.length).fill().map(() => math.complex(0, 0));
    newState[stateIndex] = math.complex(1, 0);
    this.state = newState;
  }

  // Get quantum state
  getState() {
    return this.state;
  }

  // Get state probabilities
  getProbabilities() {
    return this.calculateAllProbabilities();
  }

  // Get state fidelity
  getFidelity(targetState) {
    let fidelity = 0;
    
    for (let i = 0; i < this.state.length; i++) {
      const overlap = math.multiply(math.conj(this.state[i]), targetState[i]);
      fidelity += math.abs(overlap);
    }
    
    return Math.pow(fidelity, 2);
  }

  // Get entanglement entropy
  getEntanglementEntropy(qubitIndex) {
    const probabilities = this.calculateProbabilities(qubitIndex);
    let entropy = 0;
    
    for (const prob of probabilities) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    
    return entropy;
  }

  // Reset quantum state
  reset() {
    this.state = Array(Math.pow(2, this.qubits)).fill().map(() => math.complex(0, 0));
    this.state[0] = math.complex(1, 0);
    this.gates = [];
    this.measurements = [];
  }

  // Get simulator information
  getInfo() {
    return {
      qubits: this.qubits,
      stateSize: this.state.length,
      noiseModel: this.noiseModel,
      errorRates: this.errorRates,
      gatesApplied: this.gates.length,
      measurements: this.measurements.length
    };
  }
}

module.exports = new QuantumSimulator();
