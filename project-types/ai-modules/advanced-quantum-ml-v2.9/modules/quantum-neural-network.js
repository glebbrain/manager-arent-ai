const { create, all } = require('mathjs');
const logger = require('./logger');

// Create mathjs instance with complex number support
const math = create(all, {
  number: 'Complex'
});

class QuantumNeuralNetwork {
  constructor() {
    this.qubits = 0;
    this.layers = [];
    this.weights = [];
    this.biases = [];
    this.learningRate = 0.01;
    this.epochs = 100;
  }

  // Initialize quantum neural network
  initialize(numQubits, numLayers, numOutputs = 1) {
    try {
      this.qubits = numQubits;
      this.layers = Array(numLayers).fill().map(() => Array(numQubits).fill(0));
      this.weights = this.generateQuantumWeights(numLayers, numQubits);
      this.biases = this.generateQuantumBiases(numLayers, numQubits);
      
      logger.info('Quantum Neural Network initialized', {
        qubits: numQubits,
        layers: numLayers,
        outputs: numOutputs
      });

      return {
        success: true,
        qubits: this.qubits,
        layers: this.layers.length,
        weights: this.weights.length,
        biases: this.biases.length
      };
    } catch (error) {
      logger.error('QNN initialization failed:', { error: error.message });
      throw error;
    }
  }

  // Generate quantum weights using random complex numbers
  generateQuantumWeights(numLayers, numQubits) {
    const weights = [];
    for (let layer = 0; layer < numLayers; layer++) {
      const layerWeights = [];
      for (let i = 0; i < numQubits; i++) {
        const weight = [];
        for (let j = 0; j < numQubits; j++) {
          // Generate random complex weight
          const real = (Math.random() - 0.5) * 2;
          const imag = (Math.random() - 0.5) * 2;
          weight.push(math.complex(real, imag));
        }
        layerWeights.push(weight);
      }
      weights.push(layerWeights);
    }
    return weights;
  }

  // Generate quantum biases
  generateQuantumBiases(numLayers, numQubits) {
    const biases = [];
    for (let layer = 0; layer < numLayers; layer++) {
      const layerBiases = [];
      for (let i = 0; i < numQubits; i++) {
        const real = (Math.random() - 0.5) * 0.1;
        const imag = (Math.random() - 0.5) * 0.1;
        layerBiases.push(math.complex(real, imag));
      }
      biases.push(layerBiases);
    }
    return biases;
  }

  // Quantum state preparation
  prepareQuantumState(inputData) {
    try {
      const state = [];
      for (let i = 0; i < this.qubits; i++) {
        if (i < inputData.length) {
          // Normalize input data to quantum state
          const amplitude = Math.sqrt(inputData[i]);
          const phase = Math.random() * 2 * Math.PI;
          state.push(math.complex(amplitude * Math.cos(phase), amplitude * Math.sin(phase)));
        } else {
          state.push(math.complex(0, 0));
        }
      }
      return state;
    } catch (error) {
      logger.error('Quantum state preparation failed:', { error: error.message });
      throw error;
    }
  }

  // Quantum gate operations
  applyQuantumGate(state, gateType, qubitIndex, params = {}) {
    try {
      const { angle = Math.PI / 4, controlQubit = null } = params;
      
      switch (gateType) {
        case 'X':
          return this.applyXGate(state, qubitIndex);
        case 'Y':
          return this.applyYGate(state, qubitIndex);
        case 'Z':
          return this.applyZGate(state, qubitIndex);
        case 'H':
          return this.applyHGate(state, qubitIndex);
        case 'RX':
          return this.applyRXGate(state, qubitIndex, angle);
        case 'RY':
          return this.applyRYGate(state, qubitIndex, angle);
        case 'RZ':
          return this.applyRZGate(state, qubitIndex, angle);
        case 'CNOT':
          return this.applyCNOTGate(state, controlQubit, qubitIndex);
        case 'CZ':
          return this.applyCZGate(state, controlQubit, qubitIndex);
        default:
          throw new Error(`Unknown gate type: ${gateType}`);
      }
    } catch (error) {
      logger.error('Quantum gate application failed:', { error: error.message });
      throw error;
    }
  }

  // Pauli-X gate
  applyXGate(state, qubitIndex) {
    const newState = [...state];
    newState[qubitIndex] = math.multiply(math.complex(0, 1), newState[qubitIndex]);
    return newState;
  }

  // Pauli-Y gate
  applyYGate(state, qubitIndex) {
    const newState = [...state];
    newState[qubitIndex] = math.multiply(math.complex(0, -1), newState[qubitIndex]);
    return newState;
  }

  // Pauli-Z gate
  applyZGate(state, qubitIndex) {
    const newState = [...state];
    newState[qubitIndex] = math.multiply(math.complex(-1, 0), newState[qubitIndex]);
    return newState;
  }

  // Hadamard gate
  applyHGate(state, qubitIndex) {
    const newState = [...state];
    const amplitude = newState[qubitIndex];
    const sqrt2 = Math.sqrt(2);
    newState[qubitIndex] = math.divide(
      math.add(amplitude, math.multiply(math.complex(1, 0), amplitude)),
      math.complex(sqrt2, 0)
    );
    return newState;
  }

  // Rotation-X gate
  applyRXGate(state, qubitIndex, angle) {
    const newState = [...state];
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    const amplitude = newState[qubitIndex];
    
    newState[qubitIndex] = math.add(
      math.multiply(math.complex(cos, 0), amplitude),
      math.multiply(math.complex(0, -sin), amplitude)
    );
    return newState;
  }

  // Rotation-Y gate
  applyRYGate(state, qubitIndex, angle) {
    const newState = [...state];
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    const amplitude = newState[qubitIndex];
    
    newState[qubitIndex] = math.add(
      math.multiply(math.complex(cos, 0), amplitude),
      math.multiply(math.complex(sin, 0), amplitude)
    );
    return newState;
  }

  // Rotation-Z gate
  applyRZGate(state, qubitIndex, angle) {
    const newState = [...state];
    const amplitude = newState[qubitIndex];
    const phase = math.complex(Math.cos(angle / 2), Math.sin(angle / 2));
    
    newState[qubitIndex] = math.multiply(phase, amplitude);
    return newState;
  }

  // CNOT gate
  applyCNOTGate(state, controlQubit, targetQubit) {
    const newState = [...state];
    const controlAmplitude = newState[controlQubit];
    const targetAmplitude = newState[targetQubit];
    
    // Simple CNOT implementation
    if (Math.abs(controlAmplitude.re) > 0.5) {
      newState[targetQubit] = math.multiply(math.complex(0, 1), targetAmplitude);
    }
    
    return newState;
  }

  // CZ gate
  applyCZGate(state, controlQubit, targetQubit) {
    const newState = [...state];
    const controlAmplitude = newState[controlQubit];
    const targetAmplitude = newState[targetQubit];
    
    // Simple CZ implementation
    if (Math.abs(controlAmplitude.re) > 0.5) {
      newState[targetQubit] = math.multiply(math.complex(-1, 0), targetAmplitude);
    }
    
    return newState;
  }

  // Quantum layer forward pass
  forwardPass(inputData) {
    try {
      let state = this.prepareQuantumState(inputData);
      const outputs = [];

      for (let layer = 0; layer < this.layers.length; layer++) {
        const layerOutput = [];
        
        for (let qubit = 0; qubit < this.qubits; qubit++) {
          let qubitState = math.complex(0, 0);
          
          // Apply weights and biases
          for (let j = 0; j < this.qubits; j++) {
            const weightedInput = math.multiply(this.weights[layer][qubit][j], state[j]);
            qubitState = math.add(qubitState, weightedInput);
          }
          
          qubitState = math.add(qubitState, this.biases[layer][qubit]);
          
          // Apply quantum activation function
          qubitState = this.quantumActivation(qubitState);
          layerOutput.push(qubitState);
        }
        
        state = layerOutput;
        outputs.push(state);
      }

      return {
        finalState: state,
        layerOutputs: outputs,
        prediction: this.extractPrediction(state)
      };
    } catch (error) {
      logger.error('QNN forward pass failed:', { error: error.message });
      throw error;
    }
  }

  // Quantum activation function
  quantumActivation(complexNumber) {
    // Quantum activation using complex number properties
    const magnitude = math.abs(complexNumber);
    const phase = math.arg(complexNumber);
    
    // Apply quantum nonlinearity
    const newMagnitude = Math.tanh(magnitude);
    const newPhase = phase + Math.sin(phase);
    
    return math.complex(
      newMagnitude * Math.cos(newPhase),
      newMagnitude * Math.sin(newPhase)
    );
  }

  // Extract prediction from quantum state
  extractPrediction(quantumState) {
    try {
      const probabilities = quantumState.map(amplitude => {
        const magnitude = math.abs(amplitude);
        return magnitude * magnitude; // |ψ|²
      });
      
      const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0);
      const normalizedProbs = probabilities.map(prob => prob / totalProbability);
      
      return {
        probabilities: normalizedProbs,
        prediction: normalizedProbs.indexOf(Math.max(...normalizedProbs)),
        confidence: Math.max(...normalizedProbs)
      };
    } catch (error) {
      logger.error('Prediction extraction failed:', { error: error.message });
      throw error;
    }
  }

  // Quantum backpropagation
  backpropagate(inputData, targetOutput, learningRate = 0.01) {
    try {
      const forwardResult = this.forwardPass(inputData);
      const gradients = this.calculateQuantumGradients(forwardResult, targetOutput);
      
      // Update weights and biases
      for (let layer = 0; layer < this.layers.length; layer++) {
        for (let i = 0; i < this.qubits; i++) {
          for (let j = 0; j < this.qubits; j++) {
            const weightGradient = gradients.weights[layer][i][j];
            this.weights[layer][i][j] = math.subtract(
              this.weights[layer][i][j],
              math.multiply(math.complex(learningRate, 0), weightGradient)
            );
          }
          
          const biasGradient = gradients.biases[layer][i];
          this.biases[layer][i] = math.subtract(
            this.biases[layer][i],
            math.multiply(math.complex(learningRate, 0), biasGradient)
          );
        }
      }

      return {
        success: true,
        gradients: gradients,
        updatedWeights: this.weights.length,
        updatedBiases: this.biases.length
      };
    } catch (error) {
      logger.error('Quantum backpropagation failed:', { error: error.message });
      throw error;
    }
  }

  // Calculate quantum gradients
  calculateQuantumGradients(forwardResult, targetOutput) {
    try {
      const gradients = {
        weights: this.weights.map(layer => 
          layer.map(qubit => qubit.map(() => math.complex(0, 0)))
        ),
        biases: this.biases.map(layer => 
          layer.map(() => math.complex(0, 0))
        )
      };

      // Simplified gradient calculation for quantum states
      const error = this.calculateQuantumError(forwardResult.prediction, targetOutput);
      
      for (let layer = 0; layer < this.layers.length; layer++) {
        for (let i = 0; i < this.qubits; i++) {
          for (let j = 0; j < this.qubits; j++) {
            // Calculate weight gradient
            const inputAmplitude = forwardResult.layerOutputs[layer - 1] ? 
              forwardResult.layerOutputs[layer - 1][j] : math.complex(0, 0);
            gradients.weights[layer][i][j] = math.multiply(error, inputAmplitude);
          }
          
          // Calculate bias gradient
          gradients.biases[layer][i] = error;
        }
      }

      return gradients;
    } catch (error) {
      logger.error('Gradient calculation failed:', { error: error.message });
      throw error;
    }
  }

  // Calculate quantum error
  calculateQuantumError(prediction, target) {
    try {
      const predictedClass = prediction.prediction;
      const targetClass = Array.isArray(target) ? target.indexOf(1) : target;
      
      const error = predictedClass === targetClass ? 0 : 1;
      return math.complex(error, 0);
    } catch (error) {
      logger.error('Error calculation failed:', { error: error.message });
      throw error;
    }
  }

  // Train quantum neural network
  async train(trainingData, targetData, options = {}) {
    try {
      const { epochs = 100, learningRate = 0.01, batchSize = 32 } = options;
      const trainingHistory = [];

      logger.info('Starting QNN training', { 
        epochs, 
        learningRate, 
        batchSize,
        dataSize: trainingData.length 
      });

      for (let epoch = 0; epoch < epochs; epoch++) {
        let totalLoss = 0;
        let correctPredictions = 0;

        for (let i = 0; i < trainingData.length; i += batchSize) {
          const batch = trainingData.slice(i, i + batchSize);
          const batchTargets = targetData.slice(i, i + batchSize);

          for (let j = 0; j < batch.length; j++) {
            const result = this.forwardPass(batch[j]);
            const prediction = result.prediction;
            
            // Calculate loss
            const loss = this.calculateQuantumLoss(prediction, batchTargets[j]);
            totalLoss += loss;

            // Check if prediction is correct
            if (prediction.prediction === (Array.isArray(batchTargets[j]) ? 
                batchTargets[j].indexOf(1) : batchTargets[j])) {
              correctPredictions++;
            }

            // Backpropagate
            this.backpropagate(batch[j], batchTargets[j], learningRate);
          }
        }

        const accuracy = correctPredictions / trainingData.length;
        const avgLoss = totalLoss / trainingData.length;

        trainingHistory.push({
          epoch: epoch + 1,
          loss: avgLoss,
          accuracy: accuracy
        });

        if (epoch % 10 === 0) {
          logger.info(`Epoch ${epoch + 1}/${epochs}`, { 
            loss: avgLoss, 
            accuracy: accuracy 
          });
        }
      }

      return {
        success: true,
        trainingHistory: trainingHistory,
        finalAccuracy: trainingHistory[trainingHistory.length - 1].accuracy,
        finalLoss: trainingHistory[trainingHistory.length - 1].loss
      };
    } catch (error) {
      logger.error('QNN training failed:', { error: error.message });
      throw error;
    }
  }

  // Calculate quantum loss
  calculateQuantumLoss(prediction, target) {
    try {
      const predictedProb = prediction.probabilities[prediction.prediction];
      const targetClass = Array.isArray(target) ? target.indexOf(1) : target;
      const targetProb = prediction.probabilities[targetClass] || 0;
      
      // Cross-entropy loss for quantum states
      return -Math.log(Math.max(targetProb, 1e-10));
    } catch (error) {
      logger.error('Loss calculation failed:', { error: error.message });
      throw error;
    }
  }

  // Predict using trained QNN
  predict(inputData) {
    try {
      const result = this.forwardPass(inputData);
      return {
        prediction: result.prediction,
        confidence: result.prediction.confidence,
        probabilities: result.prediction.probabilities
      };
    } catch (error) {
      logger.error('QNN prediction failed:', { error: error.message });
      throw error;
    }
  }

  // Get network information
  getNetworkInfo() {
    return {
      qubits: this.qubits,
      layers: this.layers.length,
      weights: this.weights.length,
      biases: this.biases.length,
      learningRate: this.learningRate,
      epochs: this.epochs
    };
  }
}

module.exports = new QuantumNeuralNetwork();
