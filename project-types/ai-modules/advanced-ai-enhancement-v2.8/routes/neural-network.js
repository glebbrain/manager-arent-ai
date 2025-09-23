const express = require('express');
const router = express.Router();
const neuralNetwork = require('../modules/neural-network');
const logger = require('../modules/logger');

// POST /api/v2.8/neural/create
router.post('/create', async (req, res) => {
  try {
    const { name, architecture, layers, inputShape, outputShape, optimizer, loss, metrics } = req.body;
    
    if (!name || !architecture || !inputShape || !outputShape) {
      return res.status(400).json({ 
        error: 'Name, architecture, inputShape, and outputShape are required' 
      });
    }

    const result = await neuralNetwork.createModel({
      name,
      architecture,
      layers,
      inputShape,
      outputShape,
      optimizer: optimizer || 'adam',
      loss: loss || 'categorical_crossentropy',
      metrics: metrics || ['accuracy']
    });

    res.json(result);
  } catch (error) {
    logger.error(`[NEURAL-ROUTE] Create model error: ${error.message}`);
    res.status(500).json({ 
      error: 'Model creation failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/neural/train
router.post('/train', async (req, res) => {
  try {
    const { modelId, x_train, y_train, x_val, y_val, epochs, batchSize, learningRate, validationSplit } = req.body;
    
    if (!modelId || !x_train || !y_train) {
      return res.status(400).json({ 
        error: 'ModelId, x_train, and y_train are required' 
      });
    }

    const result = await neuralNetwork.trainModel(modelId, {
      x_train,
      y_train,
      x_val,
      y_val,
      epochs: epochs || 10,
      batchSize: batchSize || 32,
      learningRate: learningRate || 0.001,
      validationSplit: validationSplit || 0.2
    });

    res.json(result);
  } catch (error) {
    logger.error(`[NEURAL-ROUTE] Training error: ${error.message}`);
    res.status(500).json({ 
      error: 'Model training failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/neural/predict
router.post('/predict', async (req, res) => {
  try {
    const { modelId, inputData } = req.body;
    
    if (!modelId || !inputData) {
      return res.status(400).json({ 
        error: 'ModelId and inputData are required' 
      });
    }

    const result = await neuralNetwork.predict(modelId, inputData);

    res.json(result);
  } catch (error) {
    logger.error(`[NEURAL-ROUTE] Prediction error: ${error.message}`);
    res.status(500).json({ 
      error: 'Prediction failed',
      message: error.message 
    });
  }
});

// GET /api/v2.8/neural/models
router.get('/models', async (req, res) => {
  try {
    const models = await neuralNetwork.getAllModels();
    res.json({
      success: true,
      models,
      count: models.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[NEURAL-ROUTE] Get models error: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to get models',
      message: error.message 
    });
  }
});

// GET /api/v2.8/neural/models/:id
router.get('/models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const model = await neuralNetwork.getModelStatus(id);
    
    if (model.error) {
      return res.status(404).json(model);
    }

    res.json({
      success: true,
      model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[NEURAL-ROUTE] Get model error: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to get model',
      message: error.message 
    });
  }
});

// POST /api/v2.8/neural/classify
router.post('/classify', async (req, res) => {
  try {
    const { modelId, inputData, classes } = req.body;
    
    if (!modelId || !inputData) {
      return res.status(400).json({ 
        error: 'ModelId and inputData are required' 
      });
    }

    const prediction = await neuralNetwork.predict(modelId, inputData);
    
    // Add classification results
    const classificationResults = prediction.predictions.map((probabilities, index) => {
      const maxIndex = probabilities.indexOf(Math.max(...probabilities));
      return {
        input: inputData[index],
        predictedClass: classes ? classes[maxIndex] : maxIndex,
        confidence: probabilities[maxIndex],
        probabilities: classes ? 
          probabilities.map((prob, i) => ({ class: classes[i], probability: prob })) :
          probabilities.map((prob, i) => ({ class: i, probability: prob }))
      };
    });

    res.json({
      success: true,
      modelId,
      classificationResults,
      processingTime: prediction.processingTime,
      timestamp: prediction.timestamp
    });
  } catch (error) {
    logger.error(`[NEURAL-ROUTE] Classification error: ${error.message}`);
    res.status(500).json({ 
      error: 'Classification failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/neural/regress
router.post('/regress', async (req, res) => {
  try {
    const { modelId, inputData } = req.body;
    
    if (!modelId || !inputData) {
      return res.status(400).json({ 
        error: 'ModelId and inputData are required' 
      });
    }

    const prediction = await neuralNetwork.predict(modelId, inputData);
    
    // Convert probabilities to regression values
    const regressionResults = prediction.predictions.map((probabilities, index) => {
      // For regression, we might have a single output or multiple outputs
      const values = probabilities.length === 1 ? probabilities[0] : probabilities;
      return {
        input: inputData[index],
        predictedValue: values,
        confidence: Math.max(...probabilities)
      };
    });

    res.json({
      success: true,
      modelId,
      regressionResults,
      processingTime: prediction.processingTime,
      timestamp: prediction.timestamp
    });
  } catch (error) {
    logger.error(`[NEURAL-ROUTE] Regression error: ${error.message}`);
    res.status(500).json({ 
      error: 'Regression failed',
      message: error.message 
    });
  }
});

// GET /api/v2.8/neural/health
router.get('/health', async (req, res) => {
  try {
    const health = await neuralNetwork.healthCheck();
    res.json(health);
  } catch (error) {
    logger.error(`[NEURAL-ROUTE] Health check error: ${error.message}`);
    res.status(500).json({ 
      error: 'Health check failed',
      message: error.message 
    });
  }
});

module.exports = router;
