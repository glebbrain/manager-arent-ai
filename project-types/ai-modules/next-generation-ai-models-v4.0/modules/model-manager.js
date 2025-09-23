const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const logger = require('./logger');

class ModelManager {
  constructor() {
    this.models = new Map();
    this.modelRegistry = new Map();
    this.isInitialized = false;
    this.config = {
      modelPath: './models',
      cachePath: './cache',
      maxCacheSize: 1024 * 1024 * 1024, // 1GB
      supportedFormats: ['tensorflow', 'onnx', 'pytorch', 'huggingface'],
      autoDownload: true,
      versionControl: true
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Model Manager...');
      
      // Create necessary directories
      await this.ensureDirectories();
      
      // Load model registry
      await this.loadModelRegistry();
      
      // Initialize supported models
      await this.initializeSupportedModels();
      
      this.isInitialized = true;
      logger.info('Model Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Model Manager:', error);
      throw error;
    }
  }

  async ensureDirectories() {
    const directories = [
      this.config.modelPath,
      this.config.cachePath,
      path.join(this.config.modelPath, 'tensorflow'),
      path.join(this.config.modelPath, 'onnx'),
      path.join(this.config.modelPath, 'huggingface'),
      path.join(this.config.cachePath, 'downloads'),
      path.join(this.config.cachePath, 'temp')
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }

  async loadModelRegistry() {
    try {
      const registryPath = path.join(this.config.modelPath, 'registry.json');
      
      try {
        const data = await fs.readFile(registryPath, 'utf8');
        const registry = JSON.parse(data);
        
        for (const [name, info] of Object.entries(registry)) {
          this.modelRegistry.set(name, info);
        }
        
        logger.info(`Loaded ${this.modelRegistry.size} models from registry`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          // Create empty registry
          await this.saveModelRegistry();
          logger.info('Created new model registry');
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error('Failed to load model registry:', error);
      throw error;
    }
  }

  async saveModelRegistry() {
    try {
      const registryPath = path.join(this.config.modelPath, 'registry.json');
      const registry = Object.fromEntries(this.modelRegistry);
      
      await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
      logger.info('Model registry saved');
    } catch (error) {
      logger.error('Failed to save model registry:', error);
      throw error;
    }
  }

  async initializeSupportedModels() {
    const supportedModels = [
      {
        name: 'gpt-4-turbo',
        type: 'text-generation',
        provider: 'openai',
        version: 'latest',
        description: 'Most capable GPT-4 model',
        capabilities: ['text-generation', 'conversation', 'code-generation']
      },
      {
        name: 'gpt-3.5-turbo',
        type: 'text-generation',
        provider: 'openai',
        version: 'latest',
        description: 'Fast and efficient GPT-3.5 model',
        capabilities: ['text-generation', 'conversation', 'code-generation']
      },
      {
        name: 'dall-e-3',
        type: 'image-generation',
        provider: 'openai',
        version: 'latest',
        description: 'Advanced image generation model',
        capabilities: ['image-generation', 'image-editing']
      },
      {
        name: 'text-embedding-3-large',
        type: 'embeddings',
        provider: 'openai',
        version: 'latest',
        description: 'High-quality text embeddings',
        capabilities: ['text-embeddings', 'similarity-search']
      },
      {
        name: 'microsoft/DialoGPT-large',
        type: 'text-generation',
        provider: 'huggingface',
        version: 'latest',
        description: 'Conversational AI model',
        capabilities: ['conversation', 'text-generation']
      },
      {
        name: 'sentence-transformers/all-MiniLM-L6-v2',
        type: 'embeddings',
        provider: 'huggingface',
        version: 'latest',
        description: 'Lightweight sentence embeddings',
        capabilities: ['text-embeddings', 'similarity-search']
      }
    ];

    for (const model of supportedModels) {
      this.modelRegistry.set(model.name, {
        ...model,
        status: 'available',
        lastUpdated: new Date().toISOString(),
        downloadUrl: this.generateDownloadUrl(model),
        localPath: this.generateLocalPath(model)
      });
    }

    await this.saveModelRegistry();
  }

  generateDownloadUrl(model) {
    if (model.provider === 'openai') {
      return `https://api.openai.com/v1/models/${model.name}`;
    } else if (model.provider === 'huggingface') {
      return `https://huggingface.co/${model.name}`;
    }
    return null;
  }

  generateLocalPath(model) {
    return path.join(this.config.modelPath, model.provider, model.name.replace('/', '_'));
  }

  // Model Management
  async registerModel(modelInfo) {
    try {
      const modelName = modelInfo.name;
      
      if (this.modelRegistry.has(modelName)) {
        throw new Error(`Model ${modelName} already registered`);
      }

      const model = {
        ...modelInfo,
        status: 'registered',
        registeredAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        downloadUrl: this.generateDownloadUrl(modelInfo),
        localPath: this.generateLocalPath(modelInfo)
      };

      this.modelRegistry.set(modelName, model);
      await this.saveModelRegistry();
      
      logger.info(`Model ${modelName} registered successfully`);
      return model;
    } catch (error) {
      logger.error(`Failed to register model ${modelInfo.name}:`, error);
      throw error;
    }
  }

  async downloadModel(modelName, options = {}) {
    try {
      const model = this.modelRegistry.get(modelName);
      if (!model) {
        throw new Error(`Model ${modelName} not found in registry`);
      }

      const { force = false, progressCallback = null } = options;
      const localPath = model.localPath;

      // Check if model already exists
      if (!force && await this.modelExists(modelName)) {
        logger.info(`Model ${modelName} already exists locally`);
        return localPath;
      }

      logger.info(`Downloading model ${modelName}...`);

      // Create model directory
      await fs.mkdir(localPath, { recursive: true });

      if (model.provider === 'huggingface') {
        await this.downloadHuggingFaceModel(model, progressCallback);
      } else if (model.provider === 'openai') {
        await this.downloadOpenAIModel(model, progressCallback);
      } else {
        throw new Error(`Unsupported provider: ${model.provider}`);
      }

      // Update model status
      model.status = 'downloaded';
      model.downloadedAt = new Date().toISOString();
      await this.saveModelRegistry();

      logger.info(`Model ${modelName} downloaded successfully`);
      return localPath;
    } catch (error) {
      logger.error(`Failed to download model ${modelName}:`, error);
      throw error;
    }
  }

  async downloadHuggingFaceModel(model, progressCallback) {
    // This is a simplified implementation
    // In a real implementation, you would use the Hugging Face Hub API
    const modelPath = model.localPath;
    const configPath = path.join(modelPath, 'config.json');
    
    // Create a basic config file
    const config = {
      model_type: 'text-generation',
      name: model.name,
      provider: 'huggingface',
      downloaded_at: new Date().toISOString()
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    if (progressCallback) {
      progressCallback(100);
    }
  }

  async downloadOpenAIModel(model, progressCallback) {
    // OpenAI models are typically accessed via API, not downloaded
    // This is a placeholder for future implementation
    const modelPath = model.localPath;
    const configPath = path.join(modelPath, 'config.json');
    
    const config = {
      model_type: model.type,
      name: model.name,
      provider: 'openai',
      api_endpoint: `https://api.openai.com/v1/models/${model.name}`,
      downloaded_at: new Date().toISOString()
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    if (progressCallback) {
      progressCallback(100);
    }
  }

  async modelExists(modelName) {
    try {
      const model = this.modelRegistry.get(modelName);
      if (!model) return false;
      
      const configPath = path.join(model.localPath, 'config.json');
      await fs.access(configPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async loadModel(modelName) {
    try {
      if (this.models.has(modelName)) {
        return this.models.get(modelName);
      }

      const model = this.modelRegistry.get(modelName);
      if (!model) {
        throw new Error(`Model ${modelName} not found in registry`);
      }

      if (!await this.modelExists(modelName)) {
        await this.downloadModel(modelName);
      }

      // Load model based on type
      let loadedModel;
      if (model.type === 'text-generation') {
        loadedModel = await this.loadTextGenerationModel(model);
      } else if (model.type === 'image-generation') {
        loadedModel = await this.loadImageGenerationModel(model);
      } else if (model.type === 'embeddings') {
        loadedModel = await this.loadEmbeddingsModel(model);
      } else {
        throw new Error(`Unsupported model type: ${model.type}`);
      }

      this.models.set(modelName, loadedModel);
      logger.info(`Model ${modelName} loaded successfully`);
      return loadedModel;
    } catch (error) {
      logger.error(`Failed to load model ${modelName}:`, error);
      throw error;
    }
  }

  async loadTextGenerationModel(model) {
    // Placeholder for text generation model loading
    return {
      name: model.name,
      type: model.type,
      provider: model.provider,
      status: 'loaded',
      loadedAt: new Date().toISOString()
    };
  }

  async loadImageGenerationModel(model) {
    // Placeholder for image generation model loading
    return {
      name: model.name,
      type: model.type,
      provider: model.provider,
      status: 'loaded',
      loadedAt: new Date().toISOString()
    };
  }

  async loadEmbeddingsModel(model) {
    // Placeholder for embeddings model loading
    return {
      name: model.name,
      type: model.type,
      provider: model.provider,
      status: 'loaded',
      loadedAt: new Date().toISOString()
    };
  }

  async unloadModel(modelName) {
    try {
      if (this.models.has(modelName)) {
        const model = this.models.get(modelName);
        
        // Cleanup model resources
        if (model.cleanup) {
          await model.cleanup();
        }
        
        this.models.delete(modelName);
        logger.info(`Model ${modelName} unloaded successfully`);
      }
    } catch (error) {
      logger.error(`Failed to unload model ${modelName}:`, error);
      throw error;
    }
  }

  // Model Information
  getModelInfo(modelName) {
    return this.modelRegistry.get(modelName);
  }

  listModels(filter = {}) {
    const models = Array.from(this.modelRegistry.values());
    
    return models.filter(model => {
      if (filter.type && model.type !== filter.type) return false;
      if (filter.provider && model.provider !== filter.provider) return false;
      if (filter.status && model.status !== filter.status) return false;
      return true;
    });
  }

  listLoadedModels() {
    return Array.from(this.models.keys());
  }

  // Health Check
  async healthCheck() {
    try {
      const status = {
        initialized: this.isInitialized,
        totalModels: this.modelRegistry.size,
        loadedModels: this.models.size,
        availableModels: this.listModels({ status: 'available' }).length,
        downloadedModels: this.listModels({ status: 'downloaded' }).length,
        memoryUsage: process.memoryUsage(),
        diskUsage: await this.getDiskUsage()
      };

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: status
      };
    } catch (error) {
      logger.error('Model Manager health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async getDiskUsage() {
    try {
      const stats = await fs.stat(this.config.modelPath);
      return {
        path: this.config.modelPath,
        size: stats.size,
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Cleanup
  async cleanup() {
    try {
      logger.info('Cleaning up Model Manager...');
      
      // Unload all models
      for (const modelName of this.models.keys()) {
        await this.unloadModel(modelName);
      }
      
      this.models.clear();
      this.isInitialized = false;
      
      logger.info('Model Manager cleanup completed');
    } catch (error) {
      logger.error('Model Manager cleanup failed:', error);
    }
  }
}

module.exports = new ModelManager();
