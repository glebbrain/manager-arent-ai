const { create, all } = require('mathjs');
const logger = require('./logger');
const EventEmitter = require('events');
const crypto = require('crypto');

// Create mathjs instance with complex number support
const math = create(all, {
  number: 'Complex'
});

class AIModelMarketplace extends EventEmitter {
  constructor() {
    super();
    this.models = new Map();
    this.users = new Map();
    this.transactions = new Map();
    this.categories = new Map();
    this.reviews = new Map();
    this.marketplaceMetrics = {
      totalModels: 0,
      totalUsers: 0,
      totalTransactions: 0,
      totalRevenue: 0,
      averageRating: 0,
      totalDownloads: 0,
      activeModels: 0,
      lastActivity: null
    };
    this.marketplaceConfig = {
      maxModelsPerUser: 100,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      supportedFormats: ['json', 'h5', 'pkl', 'pth', 'onnx', 'tflite'],
      supportedFrameworks: ['tensorflow', 'pytorch', 'keras', 'scikit-learn', 'quantum'],
      minRating: 1,
      maxRating: 5,
      transactionFee: 0.05, // 5% transaction fee
      currency: 'tokens',
      moderationEnabled: true,
      versioningEnabled: true
    };
  }

  // Initialize AI model marketplace
  initialize(options = {}) {
    try {
      this.marketplaceConfig = {
        ...this.marketplaceConfig,
        ...options
      };

      // Initialize default categories
      this.initializeDefaultCategories();

      logger.info('AI Model Marketplace initialized', {
        maxModelsPerUser: this.marketplaceConfig.maxModelsPerUser,
        maxFileSize: this.marketplaceConfig.maxFileSize,
        supportedFormats: this.marketplaceConfig.supportedFormats.length,
        supportedFrameworks: this.marketplaceConfig.supportedFrameworks.length,
        transactionFee: this.marketplaceConfig.transactionFee
      });

      return {
        success: true,
        configuration: this.marketplaceConfig,
        capabilities: [
          'Model Upload & Management',
          'Model Discovery & Search',
          'Model Trading & Monetization',
          'Version Control',
          'Rating & Review System',
          'Category Management',
          'Transaction Processing',
          'Model Validation',
          'License Management',
          'Usage Analytics'
        ]
      };
    } catch (error) {
      logger.error('AI Model Marketplace initialization failed:', { error: error.message });
      throw error;
    }
  }

  // Initialize default categories
  initializeDefaultCategories() {
    const defaultCategories = [
      { id: 'quantum', name: 'Quantum Machine Learning', description: 'Quantum neural networks and quantum algorithms' },
      { id: 'nlp', name: 'Natural Language Processing', description: 'Text processing and language models' },
      { id: 'computer_vision', name: 'Computer Vision', description: 'Image and video processing models' },
      { id: 'recommendation', name: 'Recommendation Systems', description: 'Collaborative filtering and recommendation algorithms' },
      { id: 'time_series', name: 'Time Series Analysis', description: 'Forecasting and time series prediction models' },
      { id: 'reinforcement', name: 'Reinforcement Learning', description: 'RL agents and policy networks' },
      { id: 'generative', name: 'Generative Models', description: 'GANs, VAEs, and other generative models' },
      { id: 'optimization', name: 'Optimization', description: 'Mathematical optimization and search algorithms' }
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, {
        ...category,
        modelCount: 0,
        createdAt: Date.now()
      });
    });
  }

  // Register marketplace user
  registerUser(userInfo) {
    try {
      const userId = userInfo.id || this.generateUserId();
      const user = {
        id: userId,
        username: userInfo.username || `user_${userId}`,
        email: userInfo.email || '',
        profile: {
          displayName: userInfo.displayName || userInfo.username || `User ${userId}`,
          bio: userInfo.bio || '',
          avatar: userInfo.avatar || '',
          location: userInfo.location || '',
          website: userInfo.website || ''
        },
        wallet: {
          balance: 0,
          currency: this.marketplaceConfig.currency,
          transactions: []
        },
        reputation: {
          score: 0,
          level: 'newcomer',
          badges: []
        },
        stats: {
          modelsUploaded: 0,
          modelsDownloaded: 0,
          totalEarnings: 0,
          totalSpent: 0,
          joinDate: Date.now()
        },
        status: 'active',
        preferences: {
          notifications: true,
          privacy: 'public',
          autoApprove: false
        }
      };

      this.users.set(userId, user);
      this.marketplaceMetrics.totalUsers++;

      logger.info('Marketplace user registered', {
        userId,
        username: user.username,
        displayName: user.profile.displayName
      });

      this.emit('userRegistered', user);

      return {
        success: true,
        userId: userId,
        user: user
      };
    } catch (error) {
      logger.error('Failed to register marketplace user:', { error: error.message });
      throw error;
    }
  }

  // Upload AI model
  uploadModel(userId, modelInfo) {
    try {
      if (!this.users.has(userId)) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const user = this.users.get(userId);
      if (user.stats.modelsUploaded >= this.marketplaceConfig.maxModelsPerUser) {
        return {
          success: false,
          error: 'Maximum models per user exceeded'
        };
      }

      const modelId = modelInfo.id || this.generateModelId();
      const model = {
        id: modelId,
        name: modelInfo.name || `Model ${modelId}`,
        description: modelInfo.description || '',
        version: modelInfo.version || '1.0.0',
        framework: modelInfo.framework || 'quantum',
        category: modelInfo.category || 'quantum',
        tags: modelInfo.tags || [],
        author: {
          userId: userId,
          username: user.username,
          displayName: user.profile.displayName
        },
        files: {
          modelFile: modelInfo.modelFile || null,
          configFile: modelInfo.configFile || null,
          readmeFile: modelInfo.readmeFile || null,
          requirementsFile: modelInfo.requirementsFile || null
        },
        metadata: {
          size: modelInfo.size || 0,
          parameters: modelInfo.parameters || 0,
          accuracy: modelInfo.accuracy || 0,
          latency: modelInfo.latency || 0,
          memoryUsage: modelInfo.memoryUsage || 0,
          trainingData: modelInfo.trainingData || '',
          license: modelInfo.license || 'MIT',
          language: modelInfo.language || 'en'
        },
        pricing: {
          type: modelInfo.pricingType || 'free', // free, paid, subscription
          price: modelInfo.price || 0,
          currency: this.marketplaceConfig.currency,
          subscriptionPeriod: modelInfo.subscriptionPeriod || null
        },
        stats: {
          downloads: 0,
          views: 0,
          likes: 0,
          rating: 0,
          ratingCount: 0
        },
        status: 'pending', // pending, approved, rejected, suspended
        createdAt: Date.now(),
        updatedAt: Date.now(),
        publishedAt: null
      };

      // Validate model
      const validation = this.validateModel(model);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Model validation failed',
          details: validation.errors
        };
      }

      this.models.set(modelId, model);
      this.marketplaceMetrics.totalModels++;

      // Update user stats
      user.stats.modelsUploaded++;
      this.users.set(userId, user);

      // Update category count
      if (this.categories.has(model.category)) {
        const category = this.categories.get(model.category);
        category.modelCount++;
        this.categories.set(model.category, category);
      }

      logger.info('AI model uploaded', {
        modelId,
        name: model.name,
        author: user.username,
        category: model.category,
        framework: model.framework
      });

      this.emit('modelUploaded', { model, user });

      return {
        success: true,
        modelId: modelId,
        model: model
      };
    } catch (error) {
      logger.error('Failed to upload AI model:', { error: error.message });
      throw error;
    }
  }

  // Validate model
  validateModel(model) {
    try {
      const errors = [];

      // Check required fields
      if (!model.name || model.name.trim().length === 0) {
        errors.push('Model name is required');
      }

      if (!model.description || model.description.trim().length === 0) {
        errors.push('Model description is required');
      }

      if (!model.framework || !this.marketplaceConfig.supportedFrameworks.includes(model.framework)) {
        errors.push(`Framework must be one of: ${this.marketplaceConfig.supportedFrameworks.join(', ')}`);
      }

      if (!model.category || !this.categories.has(model.category)) {
        errors.push(`Category must be one of: ${Array.from(this.categories.keys()).join(', ')}`);
      }

      // Check file size
      if (model.metadata.size > this.marketplaceConfig.maxFileSize) {
        errors.push(`Model size exceeds maximum allowed size of ${this.marketplaceConfig.maxFileSize} bytes`);
      }

      // Check pricing
      if (model.pricing.type === 'paid' && model.pricing.price <= 0) {
        errors.push('Paid models must have a positive price');
      }

      // Check metadata
      if (model.metadata.accuracy < 0 || model.metadata.accuracy > 1) {
        errors.push('Accuracy must be between 0 and 1');
      }

      return {
        valid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      logger.error('Model validation failed:', { error: error.message });
      return {
        valid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  // Search models
  searchModels(searchCriteria) {
    try {
      const {
        query = '',
        category = null,
        framework = null,
        pricingType = null,
        minRating = 0,
        maxPrice = null,
        sortBy = 'relevance', // relevance, rating, downloads, price, date
        sortOrder = 'desc', // asc, desc
        limit = 20,
        offset = 0
      } = searchCriteria;

      let filteredModels = Array.from(this.models.values())
        .filter(model => model.status === 'approved');

      // Apply filters
      if (query) {
        const searchTerms = query.toLowerCase().split(' ');
        filteredModels = filteredModels.filter(model => {
          const searchText = `${model.name} ${model.description} ${model.tags.join(' ')}`.toLowerCase();
          return searchTerms.every(term => searchText.includes(term));
        });
      }

      if (category) {
        filteredModels = filteredModels.filter(model => model.category === category);
      }

      if (framework) {
        filteredModels = filteredModels.filter(model => model.framework === framework);
      }

      if (pricingType) {
        filteredModels = filteredModels.filter(model => model.pricing.type === pricingType);
      }

      if (minRating > 0) {
        filteredModels = filteredModels.filter(model => model.stats.rating >= minRating);
      }

      if (maxPrice !== null) {
        filteredModels = filteredModels.filter(model => 
          model.pricing.type === 'free' || model.pricing.price <= maxPrice
        );
      }

      // Sort results
      filteredModels.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'rating':
            comparison = a.stats.rating - b.stats.rating;
            break;
          case 'downloads':
            comparison = a.stats.downloads - b.stats.downloads;
            break;
          case 'price':
            comparison = a.pricing.price - b.pricing.price;
            break;
          case 'date':
            comparison = a.createdAt - b.createdAt;
            break;
          case 'relevance':
          default:
            // Simple relevance scoring based on query match
            comparison = this.calculateRelevanceScore(b, query) - this.calculateRelevanceScore(a, query);
            break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      const paginatedModels = filteredModels.slice(offset, offset + limit);

      return {
        success: true,
        models: paginatedModels,
        total: filteredModels.length,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < filteredModels.length
        }
      };
    } catch (error) {
      logger.error('Model search failed:', { error: error.message });
      throw error;
    }
  }

  // Calculate relevance score
  calculateRelevanceScore(model, query) {
    try {
      if (!query) return 0;

      const searchText = `${model.name} ${model.description} ${model.tags.join(' ')}`.toLowerCase();
      const queryTerms = query.toLowerCase().split(' ');
      
      let score = 0;
      queryTerms.forEach(term => {
        if (model.name.toLowerCase().includes(term)) score += 3;
        if (model.description.toLowerCase().includes(term)) score += 2;
        if (model.tags.some(tag => tag.toLowerCase().includes(term))) score += 1;
      });

      return score;
    } catch (error) {
      logger.error('Relevance score calculation failed:', { error: error.message });
      return 0;
    }
  }

  // Download model
  async downloadModel(userId, modelId) {
    try {
      if (!this.models.has(modelId)) {
        return {
          success: false,
          error: 'Model not found'
        };
      }

      const model = this.models.get(modelId);
      const user = this.users.get(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if user can download (free or has sufficient balance)
      if (model.pricing.type === 'paid') {
        const totalCost = model.pricing.price;
        if (user.wallet.balance < totalCost) {
          return {
            success: false,
            error: 'Insufficient balance'
          };
        }

        // Process payment
        const paymentResult = this.processPayment(userId, model.author.userId, totalCost, modelId);
        if (!paymentResult.success) {
          return {
            success: false,
            error: 'Payment processing failed'
          };
        }
      }

      // Update model stats
      model.stats.downloads++;
      model.stats.views++;
      this.models.set(modelId, model);

      // Update user stats
      user.stats.modelsDownloaded++;
      if (model.pricing.type === 'paid') {
        user.stats.totalSpent += model.pricing.price;
      }
      this.users.set(userId, user);

      // Update marketplace metrics
      this.marketplaceMetrics.totalDownloads++;
      this.marketplaceMetrics.lastActivity = Date.now();

      logger.info('Model downloaded', {
        modelId,
        modelName: model.name,
        userId,
        username: user.username,
        pricingType: model.pricing.type,
        price: model.pricing.price
      });

      this.emit('modelDownloaded', { model, user });

      return {
        success: true,
        modelId: modelId,
        downloadUrl: this.generateDownloadUrl(modelId),
        model: model
      };
    } catch (error) {
      logger.error('Model download failed:', { error: error.message });
      throw error;
    }
  }

  // Process payment
  processPayment(buyerId, sellerId, amount, modelId) {
    try {
      const buyer = this.users.get(buyerId);
      const seller = this.users.get(sellerId);

      if (!buyer || !seller) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (buyer.wallet.balance < amount) {
        return {
          success: false,
          error: 'Insufficient balance'
        };
      }

      // Calculate transaction fee
      const fee = amount * this.marketplaceConfig.transactionFee;
      const sellerAmount = amount - fee;

      // Update balances
      buyer.wallet.balance -= amount;
      seller.wallet.balance += sellerAmount;

      // Create transaction record
      const transactionId = this.generateTransactionId();
      const transaction = {
        id: transactionId,
        buyerId: buyerId,
        sellerId: sellerId,
        modelId: modelId,
        amount: amount,
        fee: fee,
        sellerAmount: sellerAmount,
        currency: this.marketplaceConfig.currency,
        status: 'completed',
        timestamp: Date.now()
      };

      this.transactions.set(transactionId, transaction);

      // Update user transaction lists
      buyer.wallet.transactions.push(transactionId);
      seller.wallet.transactions.push(transactionId);

      // Update user stats
      buyer.stats.totalSpent += amount;
      seller.stats.totalEarnings += sellerAmount;

      // Update marketplace metrics
      this.marketplaceMetrics.totalTransactions++;
      this.marketplaceMetrics.totalRevenue += amount;

      this.users.set(buyerId, buyer);
      this.users.set(sellerId, seller);

      logger.info('Payment processed', {
        transactionId,
        buyerId,
        sellerId,
        modelId,
        amount,
        fee,
        sellerAmount
      });

      this.emit('paymentProcessed', transaction);

      return {
        success: true,
        transactionId: transactionId,
        transaction: transaction
      };
    } catch (error) {
      logger.error('Payment processing failed:', { error: error.message });
      throw error;
    }
  }

  // Rate and review model
  rateModel(userId, modelId, rating, review = '') {
    try {
      if (!this.models.has(modelId)) {
        return {
          success: false,
          error: 'Model not found'
        };
      }

      if (rating < this.marketplaceConfig.minRating || rating > this.marketplaceConfig.maxRating) {
        return {
          success: false,
          error: `Rating must be between ${this.marketplaceConfig.minRating} and ${this.marketplaceConfig.maxRating}`
        };
      }

      const model = this.models.get(modelId);
      const reviewId = this.generateReviewId();

      const reviewData = {
        id: reviewId,
        userId: userId,
        modelId: modelId,
        rating: rating,
        review: review,
        timestamp: Date.now(),
        helpful: 0,
        reported: false
      };

      this.reviews.set(reviewId, reviewData);

      // Update model rating
      const totalRating = model.stats.rating * model.stats.ratingCount + rating;
      model.stats.ratingCount++;
      model.stats.rating = totalRating / model.stats.ratingCount;
      this.models.set(modelId, model);

      // Update marketplace metrics
      this.updateAverageRating();

      logger.info('Model rated and reviewed', {
        reviewId,
        modelId,
        userId,
        rating,
        reviewLength: review.length
      });

      this.emit('modelRated', { model, review: reviewData });

      return {
        success: true,
        reviewId: reviewId,
        review: reviewData
      };
    } catch (error) {
      logger.error('Model rating failed:', { error: error.message });
      throw error;
    }
  }

  // Update average rating
  updateAverageRating() {
    try {
      const approvedModels = Array.from(this.models.values())
        .filter(model => model.status === 'approved' && model.stats.ratingCount > 0);

      if (approvedModels.length === 0) {
        this.marketplaceMetrics.averageRating = 0;
        return;
      }

      const totalRating = approvedModels.reduce((sum, model) => 
        sum + model.stats.rating, 0);
      
      this.marketplaceMetrics.averageRating = totalRating / approvedModels.length;
    } catch (error) {
      logger.error('Average rating update failed:', { error: error.message });
    }
  }

  // Get marketplace metrics
  getMarketplaceMetrics() {
    return {
      ...this.marketplaceMetrics,
      activeModels: Array.from(this.models.values()).filter(m => m.status === 'approved').length,
      categories: Array.from(this.categories.values()),
      topCategories: this.getTopCategories(),
      recentActivity: this.getRecentActivity()
    };
  }

  // Get top categories
  getTopCategories() {
    return Array.from(this.categories.values())
      .sort((a, b) => b.modelCount - a.modelCount)
      .slice(0, 5);
  }

  // Get recent activity
  getRecentActivity() {
    const recentModels = Array.from(this.models.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    const recentTransactions = Array.from(this.transactions.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      recentModels: recentModels,
      recentTransactions: recentTransactions
    };
  }

  // Generate user ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate model ID
  generateModelId() {
    return 'model_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate transaction ID
  generateTransactionId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate review ID
  generateReviewId() {
    return 'review_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate download URL
  generateDownloadUrl(modelId) {
    return `/api/ai-model-marketplace/models/${modelId}/download`;
  }
}

module.exports = new AIModelMarketplace();
