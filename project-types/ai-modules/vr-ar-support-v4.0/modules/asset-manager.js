const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class AssetManager {
  constructor() {
    this.assets = new Map();
    this.categories = new Map();
    this.tags = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing Asset Manager...');
      
      // Load existing data
      await this.loadAssetData();
      
      logger.info('Asset Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Asset Manager:', error);
      throw error;
    }
  }

  async loadAsset(userId, assetData) {
    try {
      const assetId = uuidv4();
      const asset = {
        assetId,
        userId,
        name: assetData.name || 'Asset',
        type: assetData.type || 'model', // 'model', 'texture', 'audio', 'video', 'animation'
        category: assetData.category || 'general',
        tags: assetData.tags || [],
        filePath: assetData.filePath || null,
        url: assetData.url || null,
        size: assetData.size || 0,
        format: assetData.format || 'unknown',
        metadata: {
          width: assetData.metadata?.width || 0,
          height: assetData.metadata?.height || 0,
          duration: assetData.metadata?.duration || 0,
          vertices: assetData.metadata?.vertices || 0,
          triangles: assetData.metadata?.triangles || 0,
          materials: assetData.metadata?.materials || 0,
          textures: assetData.metadata?.textures || 0,
          animations: assetData.metadata?.animations || 0
        },
        settings: {
          compression: assetData.settings?.compression || 'none',
          quality: assetData.settings?.quality || 'high',
          lod: assetData.settings?.lod || false,
          streaming: assetData.settings?.streaming || false
        },
        status: 'loaded',
        loadedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };

      this.assets.set(assetId, asset);
      await this.saveAssets();

      logger.info(`Asset loaded: ${assetId}`);
      
      return {
        success: true,
        assetId,
        ...asset
      };
    } catch (error) {
      logger.error(`Failed to load asset:`, error);
      throw error;
    }
  }

  async getAsset(assetId) {
    try {
      const asset = this.assets.get(assetId);
      if (!asset) {
        throw new Error(`Asset not found: ${assetId}`);
      }

      // Update last accessed time
      asset.lastAccessed = new Date().toISOString();
      this.assets.set(assetId, asset);
      await this.saveAssets();

      return {
        success: true,
        assetId: asset.assetId,
        name: asset.name,
        type: asset.type,
        category: asset.category,
        tags: asset.tags,
        filePath: asset.filePath,
        url: asset.url,
        size: asset.size,
        format: asset.format,
        metadata: asset.metadata,
        settings: asset.settings,
        status: asset.status,
        loadedAt: asset.loadedAt,
        lastAccessed: asset.lastAccessed
      };
    } catch (error) {
      logger.error(`Failed to get asset ${assetId}:`, error);
      throw error;
    }
  }

  async updateAsset(assetId, updateData) {
    try {
      const asset = this.assets.get(assetId);
      if (!asset) {
        throw new Error(`Asset not found: ${assetId}`);
      }

      asset.name = updateData.name || asset.name;
      asset.category = updateData.category || asset.category;
      asset.tags = updateData.tags || asset.tags;
      asset.metadata = { ...asset.metadata, ...(updateData.metadata || {}) };
      asset.settings = { ...asset.settings, ...(updateData.settings || {}) };
      asset.updatedAt = new Date().toISOString();
      
      this.assets.set(assetId, asset);
      await this.saveAssets();

      return {
        success: true,
        assetId,
        ...asset
      };
    } catch (error) {
      logger.error(`Failed to update asset ${assetId}:`, error);
      throw error;
    }
  }

  async deleteAsset(assetId) {
    try {
      const asset = this.assets.get(assetId);
      if (!asset) {
        throw new Error(`Asset not found: ${assetId}`);
      }

      // Delete file if it exists
      if (asset.filePath && fs.existsSync(asset.filePath)) {
        fs.unlinkSync(asset.filePath);
      }

      this.assets.delete(assetId);
      await this.saveAssets();

      logger.info(`Asset deleted: ${assetId}`);
      
      return {
        success: true,
        assetId
      };
    } catch (error) {
      logger.error(`Failed to delete asset ${assetId}:`, error);
      throw error;
    }
  }

  async searchAssets(query, filters = {}) {
    try {
      const results = [];
      const searchTerm = query.toLowerCase();
      
      for (const [assetId, asset] of this.assets.entries()) {
        let matches = false;
        
        // Text search
        if (asset.name.toLowerCase().includes(searchTerm) ||
            asset.category.toLowerCase().includes(searchTerm) ||
            asset.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
          matches = true;
        }

        // Filter by type
        if (filters.type && asset.type !== filters.type) {
          matches = false;
        }

        // Filter by category
        if (filters.category && asset.category !== filters.category) {
          matches = false;
        }

        // Filter by user
        if (filters.userId && asset.userId !== filters.userId) {
          matches = false;
        }

        if (matches) {
          results.push({
            assetId: asset.assetId,
            name: asset.name,
            type: asset.type,
            category: asset.category,
            tags: asset.tags,
            size: asset.size,
            format: asset.format,
            status: asset.status,
            loadedAt: asset.loadedAt
          });
        }
      }

      return {
        success: true,
        query,
        filters,
        results: results,
        count: results.length
      };
    } catch (error) {
      logger.error(`Failed to search assets with query "${query}":`, error);
      throw error;
    }
  }

  async getAssetsByCategory(category) {
    try {
      const assets = [];
      
      for (const [assetId, asset] of this.assets.entries()) {
        if (asset.category === category) {
          assets.push({
            assetId: asset.assetId,
            name: asset.name,
            type: asset.type,
            tags: asset.tags,
            size: asset.size,
            format: asset.format,
            status: asset.status,
            loadedAt: asset.loadedAt
          });
        }
      }

      return {
        success: true,
        category,
        assets: assets,
        count: assets.length
      };
    } catch (error) {
      logger.error(`Failed to get assets for category ${category}:`, error);
      throw error;
    }
  }

  async getAssetsByType(type) {
    try {
      const assets = [];
      
      for (const [assetId, asset] of this.assets.entries()) {
        if (asset.type === type) {
          assets.push({
            assetId: asset.assetId,
            name: asset.name,
            category: asset.category,
            tags: asset.tags,
            size: asset.size,
            format: asset.format,
            status: asset.status,
            loadedAt: asset.loadedAt
          });
        }
      }

      return {
        success: true,
        type,
        assets: assets,
        count: assets.length
      };
    } catch (error) {
      logger.error(`Failed to get assets for type ${type}:`, error);
      throw error;
    }
  }

  async getUserAssets(userId) {
    try {
      const assets = [];
      
      for (const [assetId, asset] of this.assets.entries()) {
        if (asset.userId === userId) {
          assets.push({
            assetId: asset.assetId,
            name: asset.name,
            type: asset.type,
            category: asset.category,
            tags: asset.tags,
            size: asset.size,
            format: asset.format,
            status: asset.status,
            loadedAt: asset.loadedAt,
            lastAccessed: asset.lastAccessed
          });
        }
      }

      return {
        success: true,
        userId,
        assets: assets,
        count: assets.length
      };
    } catch (error) {
      logger.error(`Failed to get assets for user ${userId}:`, error);
      throw error;
    }
  }

  async createCategory(categoryData) {
    try {
      const categoryId = uuidv4();
      const category = {
        categoryId,
        name: categoryData.name,
        description: categoryData.description || '',
        parentId: categoryData.parentId || null,
        icon: categoryData.icon || null,
        color: categoryData.color || '#ffffff',
        createdAt: new Date().toISOString()
      };

      this.categories.set(categoryId, category);
      await this.saveCategories();

      logger.info(`Category created: ${categoryId}`);
      
      return {
        success: true,
        categoryId,
        ...category
      };
    } catch (error) {
      logger.error(`Failed to create category:`, error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const categoriesList = [];
      
      for (const [categoryId, category] of this.categories.entries()) {
        categoriesList.push({
          categoryId: category.categoryId,
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          icon: category.icon,
          color: category.color,
          createdAt: category.createdAt
        });
      }

      return {
        success: true,
        categories: categoriesList,
        count: categoriesList.length
      };
    } catch (error) {
      logger.error('Failed to get categories:', error);
      throw error;
    }
  }

  async getAssetStats() {
    try {
      let totalAssets = 0;
      let totalSize = 0;
      const typeStats = {};
      const categoryStats = {};

      for (const [assetId, asset] of this.assets.entries()) {
        totalAssets++;
        totalSize += asset.size;
        
        const type = asset.type;
        typeStats[type] = (typeStats[type] || 0) + 1;
        
        const category = asset.category;
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      }

      return {
        success: true,
        totalAssets,
        totalSize,
        typeStats,
        categoryStats
      };
    } catch (error) {
      logger.error('Failed to get asset stats:', error);
      throw error;
    }
  }

  async cleanupUser(userId) {
    try {
      // Remove user's assets
      for (const [assetId, asset] of this.assets.entries()) {
        if (asset.userId === userId) {
          if (asset.filePath && fs.existsSync(asset.filePath)) {
            fs.unlinkSync(asset.filePath);
          }
          this.assets.delete(assetId);
        }
      }
      
      await this.saveAssets();
      logger.info(`Cleaned up assets for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to cleanup assets for user ${userId}:`, error);
    }
  }

  async loadAssetData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      
      // Load assets
      const assetsPath = path.join(dataDir, 'assets.json');
      if (fs.existsSync(assetsPath)) {
        const data = fs.readFileSync(assetsPath, 'utf8');
        const assets = JSON.parse(data);
        for (const [key, assetData] of Object.entries(assets)) {
          this.assets.set(key, assetData);
        }
      }
      
      // Load categories
      const categoriesPath = path.join(dataDir, 'asset-categories.json');
      if (fs.existsSync(categoriesPath)) {
        const data = fs.readFileSync(categoriesPath, 'utf8');
        const categories = JSON.parse(data);
        for (const [key, categoryData] of Object.entries(categories)) {
          this.categories.set(key, categoryData);
        }
      }
      
      logger.info(`Loaded asset data: ${this.assets.size} assets, ${this.categories.size} categories`);
    } catch (error) {
      logger.error('Failed to load asset data:', error);
    }
  }

  async saveAssets() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const assetsPath = path.join(dataDir, 'assets.json');
      const assetsObj = Object.fromEntries(this.assets);
      fs.writeFileSync(assetsPath, JSON.stringify(assetsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save assets:', error);
    }
  }

  async saveCategories() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const categoriesPath = path.join(dataDir, 'asset-categories.json');
      const categoriesObj = Object.fromEntries(this.categories);
      fs.writeFileSync(categoriesPath, JSON.stringify(categoriesObj, null, 2));
    } catch (error) {
      logger.error('Failed to save categories:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveAssets();
      await this.saveCategories();
      this.assets.clear();
      this.categories.clear();
      this.tags.clear();
      logger.info('Asset Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new AssetManager();
