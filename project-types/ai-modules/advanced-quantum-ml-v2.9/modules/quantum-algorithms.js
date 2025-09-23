const { create, all } = require('mathjs');
const logger = require('./logger');

// Create mathjs instance with complex number support
const math = create(all, {
  number: 'Complex'
});

class QuantumAlgorithms {
  constructor() {
    this.qubits = 0;
    this.state = [];
    this.gates = [];
    this.measurements = [];
  }

  // Initialize quantum system
  initialize(numQubits) {
    try {
      this.qubits = numQubits;
      this.state = Array(Math.pow(2, numQubits)).fill(0);
      this.state[0] = math.complex(1, 0); // Initialize to |0...0⟩
      this.gates = [];
      this.measurements = [];

      logger.info('Quantum system initialized', { qubits: numQubits });

      return {
        success: true,
        qubits: this.qubits,
        stateSize: this.state.length,
        initialState: this.state[0]
      };
    } catch (error) {
      logger.error('Quantum system initialization failed:', { error: error.message });
      throw error;
    }
  }

  // Grover's Search Algorithm
  async groverSearch(targetItem, searchSpace, options = {}) {
    try {
      const { maxIterations = 100, tolerance = 1e-6 } = options;
      
      logger.info('Starting Grover search', {
        targetItem,
        searchSpaceSize: searchSpace.length,
        maxIterations
      });

      const n = searchSpace.length;
      const numQubits = Math.ceil(Math.log2(n));
      
      // Initialize quantum state
      this.initialize(numQubits);
      
      // Create uniform superposition
      this.createUniformSuperposition();
      
      const iterations = Math.floor(Math.PI / 4 * Math.sqrt(n));
      const results = [];

      for (let i = 0; i < Math.min(iterations, maxIterations); i++) {
        // Oracle: mark target item
        this.groverOracle(targetItem, searchSpace);
        
        // Diffusion operator
        this.groverDiffusion();
        
        // Measure success probability
        const successProb = this.calculateSuccessProbability(targetItem, searchSpace);
        results.push({
          iteration: i + 1,
          successProbability: successProb
        });

        if (successProb > 1 - tolerance) {
          logger.info('Grover search converged', { 
            iteration: i + 1, 
            successProbability: successProb 
          });
          break;
        }
      }

      // Final measurement
      const measurement = this.measure();
      const foundItem = searchSpace[measurement];

      return {
        success: true,
        targetItem: targetItem,
        foundItem: foundItem,
        correct: foundItem === targetItem,
        iterations: results.length,
        finalSuccessProbability: results[results.length - 1]?.successProbability || 0,
        results: results
      };
    } catch (error) {
      logger.error('Grover search failed:', { error: error.message });
      throw error;
    }
  }

  // Quantum Fourier Transform (QFT)
  async quantumFourierTransform(inputState) {
    try {
      logger.info('Starting Quantum Fourier Transform', {
        inputSize: inputState.length
      });

      const n = inputState.length;
      const numQubits = Math.ceil(Math.log2(n));
      
      // Initialize with input state
      this.initialize(numQubits);
      this.state = [...inputState];

      // Apply QFT gates
      for (let i = 0; i < numQubits; i++) {
        // Hadamard gate on qubit i
        this.applyHadamard(i);
        
        // Controlled phase gates
        for (let j = i + 1; j < numQubits; j++) {
          const phase = 2 * Math.PI / Math.pow(2, j - i + 1);
          this.applyControlledPhase(i, j, phase);
        }
      }

      // Reverse qubit order
      this.reverseQubitOrder();

      const outputState = [...this.state];

      return {
        success: true,
        inputState: inputState,
        outputState: outputState,
        qubits: numQubits
      };
    } catch (error) {
      logger.error('Quantum Fourier Transform failed:', { error: error.message });
      throw error;
    }
  }

  // Quantum Phase Estimation
  async quantumPhaseEstimation(unitaryOperator, eigenstate, precision = 8) {
    try {
      logger.info('Starting Quantum Phase Estimation', {
        precision,
        eigenstateSize: eigenstate.length
      });

      const numQubits = Math.ceil(Math.log2(eigenstate.length));
      const ancillaQubits = precision;
      const totalQubits = numQubits + ancillaQubits;
      
      // Initialize system
      this.initialize(totalQubits);
      
      // Prepare eigenstate
      this.prepareEigenstate(eigenstate, ancillaQubits);
      
      // Apply controlled unitary operations
      for (let i = 0; i < ancillaQubits; i++) {
        const power = Math.pow(2, i);
        this.applyControlledUnitary(unitaryOperator, power, i, ancillaQubits);
      }
      
      // Apply inverse QFT to ancilla qubits
      this.applyInverseQFT(0, ancillaQubits);
      
      // Measure ancilla qubits
      const phaseMeasurement = this.measureAncillaQubits(ancillaQubits);
      const estimatedPhase = phaseMeasurement / Math.pow(2, ancillaQubits);

      return {
        success: true,
        estimatedPhase: estimatedPhase,
        phaseMeasurement: phaseMeasurement,
        precision: ancillaQubits,
        eigenstate: eigenstate
      };
    } catch (error) {
      logger.error('Quantum Phase Estimation failed:', { error: error.message });
      throw error;
    }
  }

  // Quantum Support Vector Machine (QSVM)
  async quantumSVM(trainingData, labels, options = {}) {
    try {
      const { 
        kernelType = 'rbf', 
        gamma = 1.0, 
        C = 1.0,
        maxIterations = 1000 
      } = options;

      logger.info('Starting Quantum SVM', {
        trainingSize: trainingData.length,
        kernelType,
        gamma,
        C
      });

      const numFeatures = trainingData[0].length;
      const numSamples = trainingData.length;
      
      // Initialize quantum system
      this.initialize(Math.ceil(Math.log2(numFeatures)));
      
      // Prepare quantum feature map
      const quantumFeatures = this.prepareQuantumFeatureMap(trainingData, kernelType, gamma);
      
      // Calculate quantum kernel matrix
      const kernelMatrix = this.calculateQuantumKernelMatrix(quantumFeatures);
      
      // Solve quadratic programming problem
      const alphas = this.solveQuadraticProgramming(kernelMatrix, labels, C);
      
      // Find support vectors
      const supportVectors = this.findSupportVectors(trainingData, labels, alphas);
      
      // Calculate bias
      const bias = this.calculateBias(supportVectors, labels, alphas, kernelMatrix);
      
      // Test on training data
      const predictions = this.predictQuantumSVM(trainingData, supportVectors, labels, alphas, bias, kernelType, gamma);
      const accuracy = this.calculateAccuracy(predictions, labels);

      return {
        success: true,
        supportVectors: supportVectors,
        alphas: alphas,
        bias: bias,
        accuracy: accuracy,
        kernelType: kernelType,
        gamma: gamma,
        C: C
      };
    } catch (error) {
      logger.error('Quantum SVM failed:', { error: error.message });
      throw error;
    }
  }

  // Quantum Clustering (K-means)
  async quantumClustering(data, k, options = {}) {
    try {
      const { 
        maxIterations = 100, 
        tolerance = 1e-6,
        initialization = 'random' 
      } = options;

      logger.info('Starting Quantum Clustering', {
        dataSize: data.length,
        clusters: k,
        maxIterations
      });

      const numFeatures = data[0].length;
      const numSamples = data.length;
      
      // Initialize quantum system
      this.initialize(Math.ceil(Math.log2(numFeatures)));
      
      // Initialize centroids
      let centroids = this.initializeCentroids(data, k, initialization);
      const clusterHistory = [];
      
      for (let iteration = 0; iteration < maxIterations; iteration++) {
        // Assign points to clusters using quantum distance
        const assignments = this.assignToClusters(data, centroids);
        
        // Update centroids
        const newCentroids = this.updateCentroids(data, assignments, k);
        
        // Check convergence
        const centroidChange = this.calculateCentroidChange(centroids, newCentroids);
        clusterHistory.push({
          iteration: iteration + 1,
          centroids: [...newCentroids],
          assignments: [...assignments],
          centroidChange: centroidChange
        });
        
        if (centroidChange < tolerance) {
          logger.info('Quantum clustering converged', { 
            iteration: iteration + 1, 
            centroidChange 
          });
          break;
        }
        
        centroids = newCentroids;
      }

      return {
        success: true,
        centroids: centroids,
        assignments: clusterHistory[clusterHistory.length - 1].assignments,
        iterations: clusterHistory.length,
        clusterHistory: clusterHistory,
        converged: clusterHistory.length < maxIterations
      };
    } catch (error) {
      logger.error('Quantum clustering failed:', { error: error.message });
      throw error;
    }
  }

  // Helper methods for quantum algorithms

  // Create uniform superposition
  createUniformSuperposition() {
    const n = this.state.length;
    const amplitude = math.complex(1 / Math.sqrt(n), 0);
    
    for (let i = 0; i < n; i++) {
      this.state[i] = amplitude;
    }
  }

  // Grover oracle
  groverOracle(targetItem, searchSpace) {
    const targetIndex = searchSpace.indexOf(targetItem);
    if (targetIndex !== -1) {
      this.state[targetIndex] = math.multiply(math.complex(-1, 0), this.state[targetIndex]);
    }
  }

  // Grover diffusion operator
  groverDiffusion() {
    const n = this.state.length;
    const amplitude = math.complex(2 / n, 0);
    
    // Calculate average amplitude
    let avgAmplitude = math.complex(0, 0);
    for (let i = 0; i < n; i++) {
      avgAmplitude = math.add(avgAmplitude, this.state[i]);
    }
    avgAmplitude = math.divide(avgAmplitude, math.complex(n, 0));
    
    // Apply diffusion
    for (let i = 0; i < n; i++) {
      this.state[i] = math.subtract(
        math.multiply(amplitude, avgAmplitude),
        this.state[i]
      );
    }
  }

  // Calculate success probability
  calculateSuccessProbability(targetItem, searchSpace) {
    const targetIndex = searchSpace.indexOf(targetItem);
    if (targetIndex === -1) return 0;
    
    const amplitude = this.state[targetIndex];
    return Math.pow(math.abs(amplitude), 2);
  }

  // Apply Hadamard gate
  applyHadamard(qubitIndex) {
    const n = this.state.length;
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < n; i++) {
      const bit = (i >> qubitIndex) & 1;
      const amplitude = this.state[i];
      const sqrt2 = Math.sqrt(2);
      
      if (bit === 0) {
        newState[i] = math.divide(amplitude, math.complex(sqrt2, 0));
        newState[i | (1 << qubitIndex)] = math.divide(amplitude, math.complex(sqrt2, 0));
      } else {
        newState[i] = math.divide(amplitude, math.complex(sqrt2, 0));
        newState[i & ~(1 << qubitIndex)] = math.divide(amplitude, math.complex(sqrt2, 0));
      }
    }
    
    this.state = newState;
  }

  // Apply controlled phase gate
  applyControlledPhase(controlQubit, targetQubit, phase) {
    const n = this.state.length;
    
    for (let i = 0; i < n; i++) {
      const controlBit = (i >> controlQubit) & 1;
      const targetBit = (i >> targetQubit) & 1;
      
      if (controlBit === 1 && targetBit === 1) {
        const phaseFactor = math.complex(Math.cos(phase), Math.sin(phase));
        this.state[i] = math.multiply(this.state[i], phaseFactor);
      }
    }
  }

  // Reverse qubit order
  reverseQubitOrder() {
    const n = this.state.length;
    const numQubits = Math.log2(n);
    const newState = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < n; i++) {
      let reversedIndex = 0;
      for (let j = 0; j < numQubits; j++) {
        const bit = (i >> j) & 1;
        reversedIndex |= (bit << (numQubits - 1 - j));
      }
      newState[reversedIndex] = this.state[i];
    }
    
    this.state = newState;
  }

  // Measure quantum state
  measure() {
    const probabilities = this.state.map(amplitude => 
      Math.pow(math.abs(amplitude), 2)
    );
    
    const totalProb = probabilities.reduce((sum, prob) => sum + prob, 0);
    const normalizedProbs = probabilities.map(prob => prob / totalProb);
    
    let random = Math.random();
    for (let i = 0; i < normalizedProbs.length; i++) {
      random -= normalizedProbs[i];
      if (random <= 0) {
        return i;
      }
    }
    
    return normalizedProbs.length - 1;
  }

  // Prepare quantum feature map
  prepareQuantumFeatureMap(data, kernelType, gamma) {
    const quantumFeatures = [];
    
    for (const sample of data) {
      const feature = this.encodeDataToQuantumState(sample, kernelType, gamma);
      quantumFeatures.push(feature);
    }
    
    return quantumFeatures;
  }

  // Encode data to quantum state
  encodeDataToQuantumState(data, kernelType, gamma) {
    const n = Math.pow(2, Math.ceil(Math.log2(data.length)));
    const state = Array(n).fill().map(() => math.complex(0, 0));
    
    for (let i = 0; i < data.length; i++) {
      const amplitude = Math.sqrt(data[i]);
      const phase = gamma * data[i];
      state[i] = math.complex(
        amplitude * Math.cos(phase),
        amplitude * Math.sin(phase)
      );
    }
    
    return state;
  }

  // Calculate quantum kernel matrix
  calculateQuantumKernelMatrix(quantumFeatures) {
    const n = quantumFeatures.length;
    const kernelMatrix = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        kernelMatrix[i][j] = this.calculateQuantumKernel(quantumFeatures[i], quantumFeatures[j]);
      }
    }
    
    return kernelMatrix;
  }

  // Calculate quantum kernel
  calculateQuantumKernel(state1, state2) {
    let kernel = math.complex(0, 0);
    
    for (let i = 0; i < state1.length; i++) {
      kernel = math.add(kernel, math.multiply(
        math.conj(state1[i]),
        state2[i]
      ));
    }
    
    return Math.pow(math.abs(kernel), 2);
  }

  // Solve quadratic programming problem
  solveQuadraticProgramming(kernelMatrix, labels, C) {
    // Simplified quadratic programming solver
    const n = labels.length;
    const alphas = Array(n).fill(0.1);
    
    // Gradient ascent
    for (let iteration = 0; iteration < 100; iteration++) {
      for (let i = 0; i < n; i++) {
        let gradient = 0;
        for (let j = 0; j < n; j++) {
          gradient += labels[j] * kernelMatrix[i][j] * alphas[j];
        }
        gradient = 1 - gradient;
        
        alphas[i] = Math.max(0, Math.min(C, alphas[i] + 0.01 * gradient));
      }
    }
    
    return alphas;
  }

  // Find support vectors
  findSupportVectors(data, labels, alphas) {
    const supportVectors = [];
    const supportLabels = [];
    const supportAlphas = [];
    
    for (let i = 0; i < alphas.length; i++) {
      if (alphas[i] > 1e-6) {
        supportVectors.push(data[i]);
        supportLabels.push(labels[i]);
        supportAlphas.push(alphas[i]);
      }
    }
    
    return { vectors: supportVectors, labels: supportLabels, alphas: supportAlphas };
  }

  // Calculate bias
  calculateBias(supportVectors, labels, alphas, kernelMatrix) {
    let bias = 0;
    let count = 0;
    
    for (let i = 0; i < supportVectors.vectors.length; i++) {
      let prediction = 0;
      for (let j = 0; j < supportVectors.vectors.length; j++) {
        prediction += supportVectors.alphas[j] * supportVectors.labels[j] * 
                     this.calculateQuantumKernel(supportVectors.vectors[i], supportVectors.vectors[j]);
      }
      bias += supportVectors.labels[i] - prediction;
      count++;
    }
    
    return bias / count;
  }

  // Predict using quantum SVM
  predictQuantumSVM(data, supportVectors, labels, alphas, bias, kernelType, gamma) {
    const predictions = [];
    
    for (const sample of data) {
      let prediction = bias;
      
      for (let i = 0; i < supportVectors.vectors.length; i++) {
        const kernel = this.calculateQuantumKernel(
          this.encodeDataToQuantumState(sample, kernelType, gamma),
          this.encodeDataToQuantumState(supportVectors.vectors[i], kernelType, gamma)
        );
        prediction += supportVectors.alphas[i] * supportVectors.labels[i] * kernel;
      }
      
      predictions.push(prediction > 0 ? 1 : -1);
    }
    
    return predictions;
  }

  // Calculate accuracy
  calculateAccuracy(predictions, labels) {
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === labels[i]) {
        correct++;
      }
    }
    return correct / predictions.length;
  }

  // Initialize centroids for clustering
  initializeCentroids(data, k, method) {
    const centroids = [];
    
    if (method === 'random') {
      for (let i = 0; i < k; i++) {
        const randomIndex = Math.floor(Math.random() * data.length);
        centroids.push([...data[randomIndex]]);
      }
    }
    
    return centroids;
  }

  // Assign points to clusters
  assignToClusters(data, centroids) {
    const assignments = [];
    
    for (const point of data) {
      let minDistance = Infinity;
      let bestCluster = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const distance = this.calculateQuantumDistance(point, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          bestCluster = i;
        }
      }
      
      assignments.push(bestCluster);
    }
    
    return assignments;
  }

  // Calculate quantum distance
  calculateQuantumDistance(point1, point2) {
    let distance = 0;
    for (let i = 0; i < point1.length; i++) {
      distance += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(distance);
  }

  // Update centroids
  updateCentroids(data, assignments, k) {
    const centroids = Array(k).fill().map(() => Array(data[0].length).fill(0));
    const counts = Array(k).fill(0);
    
    for (let i = 0; i < data.length; i++) {
      const cluster = assignments[i];
      for (let j = 0; j < data[i].length; j++) {
        centroids[cluster][j] += data[i][j];
      }
      counts[cluster]++;
    }
    
    for (let i = 0; i < k; i++) {
      if (counts[i] > 0) {
        for (let j = 0; j < centroids[i].length; j++) {
          centroids[i][j] /= counts[i];
        }
      }
    }
    
    return centroids;
  }

  // Calculate centroid change
  calculateCentroidChange(oldCentroids, newCentroids) {
    let totalChange = 0;
    
    for (let i = 0; i < oldCentroids.length; i++) {
      for (let j = 0; j < oldCentroids[i].length; j++) {
        totalChange += Math.abs(oldCentroids[i][j] - newCentroids[i][j]);
      }
    }
    
    return totalChange;
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Get qubit count
  getQubitCount() {
    return this.qubits;
  }
}

module.exports = new QuantumAlgorithms();
