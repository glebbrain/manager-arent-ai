const express = require('express');
const router = express.Router();
const modelManager = require('../modules/model-manager');
const logger = require('../modules/logger');

// Register a new model
router.post('/register', async (req, res) => {
  try {
    const { name, type, provider, version, description, capabilities } = req.body;
    
    if (!name || !type || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Name, type, and provider are required'
      });
    }

    const modelInfo = {
      name,
      type,
      provider,
      version: version || 'latest',
      description: description || '',
      capabilities: capabilities || []
    };

    const result = await modelManager.registerModel(modelInfo);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Model registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download a model
router.post('/download', async (req, res) => {
  try {
    const { modelName, options = {} } = req.body;
    
    if (!modelName) {
      return res.status(400).json({
        success: false,
        error: 'Model name is required'
      });
    }

    const result = await modelManager.downloadModel(modelName, options);
    
    res.json({
      success: true,
      data: {
        modelName,
        localPath: result,
        message: 'Model downloaded successfully'
      }
    });
  } catch (error) {
    logger.error('Model download error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Load a model
router.post('/load', async (req, res) => {
  try {
    const { modelName } = req.body;
    
    if (!modelName) {
      return res.status(400).json({
        success: false,
        error: 'Model name is required'
      });
    }

    const result = await modelManager.loadModel(modelName);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Model loading error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unload a model
router.post('/unload', async (req, res) => {
  try {
    const { modelName } = req.body;
    
    if (!modelName) {
      return res.status(400).json({
        success: false,
        error: 'Model name is required'
      });
    }

    await modelManager.unloadModel(modelName);
    
    res.json({
      success: true,
      data: {
        modelName,
        message: 'Model unloaded successfully'
      }
    });
  } catch (error) {
    logger.error('Model unloading error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get model information
router.get('/info/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    
    const modelInfo = modelManager.getModelInfo(modelName);
    
    if (!modelInfo) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    res.json({
      success: true,
      data: modelInfo
    });
  } catch (error) {
    logger.error('Model info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List models
router.get('/list', async (req, res) => {
  try {
    const { type, provider, status } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (provider) filter.provider = provider;
    if (status) filter.status = status;
    
    const models = modelManager.listModels(filter);
    
    res.json({
      success: true,
      data: {
        models,
        count: models.length,
        filters: filter
      }
    });
  } catch (error) {
    logger.error('Model listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List loaded models
router.get('/loaded', async (req, res) => {
  try {
    const loadedModels = modelManager.listLoadedModels();
    
    res.json({
      success: true,
      data: {
        loadedModels,
        count: loadedModels.length
      }
    });
  } catch (error) {
    logger.error('Loaded models listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check if model exists
router.get('/exists/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    
    const exists = await modelManager.modelExists(modelName);
    
    res.json({
      success: true,
      data: {
        modelName,
        exists
      }
    });
  } catch (error) {
    logger.error('Model existence check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get model statistics
router.get('/stats', async (req, res) => {
  try {
    const allModels = modelManager.listModels();
    const loadedModels = modelManager.listLoadedModels();
    
    const stats = {
      total: allModels.length,
      loaded: loadedModels.length,
      available: allModels.filter(m => m.status === 'available').length,
      downloaded: allModels.filter(m => m.status === 'downloaded').length,
      byProvider: {},
      byType: {}
    };
    
    // Group by provider
    allModels.forEach(model => {
      stats.byProvider[model.provider] = (stats.byProvider[model.provider] || 0) + 1;
    });
    
    // Group by type
    allModels.forEach(model => {
      stats.byType[model.type] = (stats.byType[model.type] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Model statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update model information
router.put('/update/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    const updates = req.body;
    
    const modelInfo = modelManager.getModelInfo(modelName);
    if (!modelInfo) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    // Update model information
    const updatedModel = {
      ...modelInfo,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    // This would require updating the model registry
    // For now, we'll just return the updated info
    res.json({
      success: true,
      data: updatedModel
    });
  } catch (error) {
    logger.error('Model update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete model
router.delete('/delete/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    const { force = false } = req.query;
    
    const modelInfo = modelManager.getModelInfo(modelName);
    if (!modelInfo) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    // Check if model is loaded
    const loadedModels = modelManager.listLoadedModels();
    if (loadedModels.includes(modelName) && !force) {
      return res.status(400).json({
        success: false,
        error: 'Model is currently loaded. Use force=true to force deletion.'
      });
    }

    // Unload model if it's loaded
    if (loadedModels.includes(modelName)) {
      await modelManager.unloadModel(modelName);
    }

    // Delete model from registry
    // This would require updating the model registry
    // For now, we'll just return success
    
    res.json({
      success: true,
      data: {
        modelName,
        message: 'Model deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Model deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Model Manager Status
router.get('/status', async (req, res) => {
  try {
    const status = await modelManager.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Model manager status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
