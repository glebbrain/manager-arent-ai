const express = require('express');
const router = express.Router();
const aiModelMarketplace = require('../modules/ai-model-marketplace');
const logger = require('../modules/logger');

// Initialize AI model marketplace
router.post('/initialize', async (req, res) => {
  try {
    const options = req.body || {};
    const result = aiModelMarketplace.initialize(options);
    
    logger.info('AI Model Marketplace initialized via API', {
      options,
      success: result.success
    });

    res.json({
      success: true,
      message: 'AI Model Marketplace initialized successfully',
      data: result
    });
  } catch (error) {
    logger.error('AI Model Marketplace initialization failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Initialization failed',
      message: error.message
    });
  }
});

// Register marketplace user
router.post('/users/register', async (req, res) => {
  try {
    const userInfo = req.body;

    if (!userInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'userInfo is required'
      });
    }

    const result = aiModelMarketplace.registerUser(userInfo);
    
    logger.info('Marketplace user registered via API', {
      userId: result.userId,
      username: result.user.username
    });

    res.json({
      success: true,
      message: 'Marketplace user registered successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to register marketplace user:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'User registration failed',
      message: error.message
    });
  }
});

// Get marketplace user
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = aiModelMarketplace.users.get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `Marketplace user '${userId}' not found`
      });
    }

    res.json({
      success: true,
      message: 'Marketplace user retrieved successfully',
      data: { user }
    });
  } catch (error) {
    logger.error('Failed to get marketplace user:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: error.message
    });
  }
});

// Upload AI model
router.post('/models/upload', async (req, res) => {
  try {
    const { userId, modelInfo } = req.body;

    if (!userId || !modelInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'userId and modelInfo are required'
      });
    }

    const result = aiModelMarketplace.uploadModel(userId, modelInfo);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Model upload failed',
        message: result.error,
        details: result.details
      });
    }

    logger.info('AI model uploaded via API', {
      modelId: result.modelId,
      name: result.model.name,
      author: result.model.author.username
    });

    res.json({
      success: true,
      message: 'AI model uploaded successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to upload AI model:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Model upload failed',
      message: error.message
    });
  }
});

// Search models
router.get('/models/search', async (req, res) => {
  try {
    const searchCriteria = {
      query: req.query.q || '',
      category: req.query.category || null,
      framework: req.query.framework || null,
      pricingType: req.query.pricing || null,
      minRating: parseFloat(req.query.minRating) || 0,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'desc',
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const result = aiModelMarketplace.searchModels(searchCriteria);
    
    res.json({
      success: true,
      message: 'Model search completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Model search failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Model search failed',
      message: error.message
    });
  }
});

// Get model details
router.get('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = aiModelMarketplace.models.get(modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
        message: `AI model '${modelId}' not found`
      });
    }

    res.json({
      success: true,
      message: 'Model details retrieved successfully',
      data: { model }
    });
  } catch (error) {
    logger.error('Failed to get model details:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get model',
      message: error.message
    });
  }
});

// Download model
router.post('/models/:modelId/download', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'userId is required'
      });
    }

    const result = await aiModelMarketplace.downloadModel(userId, modelId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Model download failed',
        message: result.error
      });
    }

    logger.info('Model downloaded via API', {
      modelId,
      userId,
      pricingType: result.model.pricing.type
    });

    res.json({
      success: true,
      message: 'Model downloaded successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to download model:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Model download failed',
      message: error.message
    });
  }
});

// Rate and review model
router.post('/models/:modelId/rate', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { userId, rating, review = '' } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'userId and rating are required'
      });
    }

    const result = aiModelMarketplace.rateModel(userId, modelId, rating, review);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Model rating failed',
        message: result.error
      });
    }

    logger.info('Model rated via API', {
      modelId,
      userId,
      rating,
      reviewId: result.reviewId
    });

    res.json({
      success: true,
      message: 'Model rated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to rate model:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Model rating failed',
      message: error.message
    });
  }
});

// Get model reviews
router.get('/models/:modelId/reviews', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const model = aiModelMarketplace.models.get(modelId);
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
        message: `AI model '${modelId}' not found`
      });
    }

    // Get reviews for this model
    const allReviews = Array.from(aiModelMarketplace.reviews.values())
      .filter(review => review.modelId === modelId)
      .sort((a, b) => b.timestamp - a.timestamp);

    const paginatedReviews = allReviews.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      message: 'Model reviews retrieved successfully',
      data: {
        reviews: paginatedReviews,
        total: allReviews.length,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < allReviews.length
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get model reviews:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get reviews',
      message: error.message
    });
  }
});

// Get marketplace categories
router.get('/categories', async (req, res) => {
  try {
    const categories = Array.from(aiModelMarketplace.categories.values());
    
    res.json({
      success: true,
      message: 'Marketplace categories retrieved successfully',
      data: { categories }
    });
  } catch (error) {
    logger.error('Failed to get marketplace categories:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get categories',
      message: error.message
    });
  }
});

// Get marketplace metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = aiModelMarketplace.getMarketplaceMetrics();
    
    res.json({
      success: true,
      message: 'Marketplace metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get marketplace metrics:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

// Get user's models
router.get('/users/:userId/models', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = 'all', limit = 20, offset = 0 } = req.query;

    const user = aiModelMarketplace.users.get(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `Marketplace user '${userId}' not found`
      });
    }

    // Get user's models
    let userModels = Array.from(aiModelMarketplace.models.values())
      .filter(model => model.author.userId === userId);

    if (status !== 'all') {
      userModels = userModels.filter(model => model.status === status);
    }

    userModels.sort((a, b) => b.createdAt - a.createdAt);

    const paginatedModels = userModels.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      message: 'User models retrieved successfully',
      data: {
        models: paginatedModels,
        total: userModels.length,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < userModels.length
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get user models:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get user models',
      message: error.message
    });
  }
});

// Get user's transactions
router.get('/users/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const user = aiModelMarketplace.users.get(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `Marketplace user '${userId}' not found`
      });
    }

    // Get user's transactions
    const userTransactions = user.wallet.transactions
      .map(transactionId => aiModelMarketplace.transactions.get(transactionId))
      .filter(transaction => transaction)
      .sort((a, b) => b.timestamp - a.timestamp);

    const paginatedTransactions = userTransactions.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      message: 'User transactions retrieved successfully',
      data: {
        transactions: paginatedTransactions,
        total: userTransactions.length,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < userTransactions.length
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get user transactions:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
      message: error.message
    });
  }
});

// Get trending models
router.get('/models/trending', async (req, res) => {
  try {
    const { limit = 10, timeframe = 'week' } = req.query;

    // Get trending models based on downloads in the specified timeframe
    const now = Date.now();
    const timeframeMs = {
      'day': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      'month': 30 * 24 * 60 * 60 * 1000
    }[timeframe] || 7 * 24 * 60 * 60 * 1000;

    const trendingModels = Array.from(aiModelMarketplace.models.values())
      .filter(model => model.status === 'approved')
      .sort((a, b) => b.stats.downloads - a.stats.downloads)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      message: 'Trending models retrieved successfully',
      data: {
        models: trendingModels,
        timeframe: timeframe,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Failed to get trending models:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get trending models',
      message: error.message
    });
  }
});

// Health check for AI model marketplace
router.get('/health', async (req, res) => {
  try {
    const metrics = aiModelMarketplace.getMarketplaceMetrics();
    
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      totalModels: metrics.totalModels,
      totalUsers: metrics.totalUsers,
      totalTransactions: metrics.totalTransactions,
      averageRating: metrics.averageRating,
      activeModels: metrics.activeModels,
      uptime: process.uptime()
    };

    res.json({
      success: true,
      message: 'AI Model Marketplace health check passed',
      data: health
    });
  } catch (error) {
    logger.error('AI Model Marketplace health check failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

module.exports = router;
