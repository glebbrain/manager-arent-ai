const winston = require('winston');
const NodeCache = require('node-cache');
const Redis = require('ioredis');
const _ = require('lodash');

class CacheManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/cache-manager.log' })
      ]
    });
    
    this.caches = new Map();
    this.redis = null;
    this.strategies = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  // Initialize cache manager
  async initialize(config = {}) {
    try {
      // Initialize Redis if configured
      if (config.redis) {
        this.redis = new Redis({
          host: config.redis.host || 'localhost',
          port: config.redis.port || 6379,
          password: config.redis.password,
          db: config.redis.db || 0,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3
        });

        this.redis.on('error', (error) => {
          this.logger.error('Redis connection error:', error);
        });

        this.redis.on('connect', () => {
          this.logger.info('Redis connected successfully');
        });
      }

      // Initialize default cache strategies
      this.initializeDefaultStrategies();
      
      this.logger.info('Cache manager initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing cache manager:', error);
      throw error;
    }
  }

  // Initialize default cache strategies
  initializeDefaultStrategies() {
    // LRU Strategy
    this.strategies.set('lru', {
      name: 'Least Recently Used',
      description: 'Evicts least recently used items first',
      evictionPolicy: 'lru'
    });

    // LFU Strategy
    this.strategies.set('lfu', {
      name: 'Least Frequently Used',
      description: 'Evicts least frequently used items first',
      evictionPolicy: 'lfu'
    });

    // TTL Strategy
    this.strategies.set('ttl', {
      name: 'Time To Live',
      description: 'Evicts items based on expiration time',
      evictionPolicy: 'ttl'
    });

    // Random Strategy
    this.strategies.set('random', {
      name: 'Random',
      description: 'Evicts random items when cache is full',
      evictionPolicy: 'random'
    });
  }

  // Create cache
  async createCache(config) {
    try {
      const cache = {
        id: this.generateId(),
        name: config.name,
        strategy: config.strategy || 'lru',
        maxSize: config.maxSize || 1000,
        ttl: config.ttl || 3600, // 1 hour default
        compression: config.compression || false,
        persistence: config.persistence || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create NodeCache instance
      const nodeCache = new NodeCache({
        stdTTL: cache.ttl,
        checkperiod: cache.ttl * 0.2,
        useClones: false,
        deleteOnExpire: true,
        maxKeys: cache.maxSize
      });

      // Set up event listeners
      nodeCache.on('set', (key, value) => {
        this.metrics.sets++;
        this.logger.debug('Cache set', { cacheId: cache.id, key });
      });

      nodeCache.on('del', (key, value) => {
        this.metrics.deletes++;
        this.logger.debug('Cache delete', { cacheId: cache.id, key });
      });

      nodeCache.on('expired', (key, value) => {
        this.metrics.evictions++;
        this.logger.debug('Cache expired', { cacheId: cache.id, key });
      });

      cache.instance = nodeCache;
      this.caches.set(cache.id, cache);

      this.logger.info('Cache created successfully', { id: cache.id, name: cache.name });
      return cache;
    } catch (error) {
      this.logger.error('Error creating cache:', error);
      throw error;
    }
  }

  // Get cache
  async getCache(cacheId) {
    const cache = this.caches.get(cacheId);
    if (!cache) {
      throw new Error('Cache not found');
    }
    return cache;
  }

  // Set value in cache
  async set(cacheId, key, value, ttl = null) {
    try {
      const cache = await this.getCache(cacheId);
      
      // Compress value if enabled
      let processedValue = value;
      if (cache.compression) {
        processedValue = await this.compressValue(value);
      }

      // Set in local cache
      const success = cache.instance.set(key, processedValue, ttl || cache.ttl);
      
      if (success) {
        // Set in Redis if available
        if (this.redis && cache.persistence) {
          await this.setRedisValue(cacheId, key, processedValue, ttl || cache.ttl);
        }
        
        this.logger.debug('Value set in cache', { cacheId, key, ttl });
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error('Error setting cache value:', error);
      throw error;
    }
  }

  // Get value from cache
  async get(cacheId, key) {
    try {
      const cache = await this.getCache(cacheId);
      
      // Try local cache first
      let value = cache.instance.get(key);
      
      if (value !== undefined) {
        this.metrics.hits++;
        
        // Decompress if needed
        if (cache.compression) {
          value = await this.decompressValue(value);
        }
        
        this.logger.debug('Cache hit', { cacheId, key });
        return value;
      }

      // Try Redis if available
      if (this.redis && cache.persistence) {
        value = await this.getRedisValue(cacheId, key);
        
        if (value !== null) {
          this.metrics.hits++;
          
          // Decompress if needed
          if (cache.compression) {
            value = await this.decompressValue(value);
          }
          
          // Set in local cache for future access
          cache.instance.set(key, value, cache.ttl);
          
          this.logger.debug('Cache hit from Redis', { cacheId, key });
          return value;
        }
      }

      this.metrics.misses++;
      this.logger.debug('Cache miss', { cacheId, key });
      return null;
    } catch (error) {
      this.logger.error('Error getting cache value:', error);
      throw error;
    }
  }

  // Delete value from cache
  async delete(cacheId, key) {
    try {
      const cache = await this.getCache(cacheId);
      
      // Delete from local cache
      const deleted = cache.instance.del(key);
      
      // Delete from Redis if available
      if (this.redis && cache.persistence) {
        await this.deleteRedisValue(cacheId, key);
      }
      
      if (deleted > 0) {
        this.logger.debug('Value deleted from cache', { cacheId, key });
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error('Error deleting cache value:', error);
      throw error;
    }
  }

  // Clear entire cache
  async clear(cacheId) {
    try {
      const cache = await this.getCache(cacheId);
      
      // Clear local cache
      cache.instance.flushAll();
      
      // Clear Redis if available
      if (this.redis && cache.persistence) {
        await this.clearRedisCache(cacheId);
      }
      
      this.logger.info('Cache cleared', { cacheId });
      return true;
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
      throw error;
    }
  }

  // Get cache statistics
  async getCacheStats(cacheId) {
    try {
      const cache = await this.getCache(cacheId);
      const stats = cache.instance.getStats();
      
      return {
        id: cache.id,
        name: cache.name,
        strategy: cache.strategy,
        maxSize: cache.maxSize,
        ttl: cache.ttl,
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hits / (stats.hits + stats.misses) || 0,
        compression: cache.compression,
        persistence: cache.persistence,
        createdAt: cache.createdAt,
        updatedAt: cache.updatedAt
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      throw error;
    }
  }

  // Get all cache statistics
  async getAllCacheStats() {
    const stats = [];
    for (const [cacheId] of this.caches) {
      try {
        const cacheStats = await this.getCacheStats(cacheId);
        stats.push(cacheStats);
      } catch (error) {
        this.logger.error('Error getting cache stats:', { cacheId, error: error.message });
      }
    }
    return stats;
  }

  // Get global cache metrics
  async getGlobalMetrics() {
    return {
      ...this.metrics,
      totalCaches: this.caches.size,
      hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0
    };
  }

  // Redis operations
  async setRedisValue(cacheId, key, value, ttl) {
    if (!this.redis) return;
    
    const redisKey = `cache:${cacheId}:${key}`;
    const serializedValue = JSON.stringify(value);
    
    if (ttl) {
      await this.redis.setex(redisKey, ttl, serializedValue);
    } else {
      await this.redis.set(redisKey, serializedValue);
    }
  }

  async getRedisValue(cacheId, key) {
    if (!this.redis) return null;
    
    const redisKey = `cache:${cacheId}:${key}`;
    const value = await this.redis.get(redisKey);
    
    return value ? JSON.parse(value) : null;
  }

  async deleteRedisValue(cacheId, key) {
    if (!this.redis) return;
    
    const redisKey = `cache:${cacheId}:${key}`;
    await this.redis.del(redisKey);
  }

  async clearRedisCache(cacheId) {
    if (!this.redis) return;
    
    const pattern = `cache:${cacheId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Compression methods
  async compressValue(value) {
    const zlib = require('zlib');
    const serialized = JSON.stringify(value);
    return zlib.gzipSync(serialized);
  }

  async decompressValue(compressedValue) {
    const zlib = require('zlib');
    const decompressed = zlib.gunzipSync(compressedValue);
    return JSON.parse(decompressed.toString());
  }

  // Cache warming
  async warmCache(cacheId, data, keyGenerator) {
    try {
      const cache = await this.getCache(cacheId);
      let warmed = 0;
      
      for (const item of data) {
        const key = keyGenerator(item);
        await this.set(cacheId, key, item);
        warmed++;
      }
      
      this.logger.info('Cache warmed', { cacheId, warmed });
      return warmed;
    } catch (error) {
      this.logger.error('Error warming cache:', error);
      throw error;
    }
  }

  // Cache invalidation patterns
  async invalidateByPattern(cacheId, pattern) {
    try {
      const cache = await this.getCache(cacheId);
      const keys = cache.instance.keys();
      const regex = new RegExp(pattern);
      let invalidated = 0;
      
      for (const key of keys) {
        if (regex.test(key)) {
          await this.delete(cacheId, key);
          invalidated++;
        }
      }
      
      this.logger.info('Cache invalidated by pattern', { cacheId, pattern, invalidated });
      return invalidated;
    } catch (error) {
      this.logger.error('Error invalidating cache by pattern:', error);
      throw error;
    }
  }

  // Update cache configuration
  async updateCacheConfig(cacheId, updates) {
    try {
      const cache = await this.getCache(cacheId);
      
      Object.assign(cache, updates);
      cache.updatedAt = new Date();
      
      this.caches.set(cacheId, cache);
      
      this.logger.info('Cache configuration updated', { cacheId, updates });
      return cache;
    } catch (error) {
      this.logger.error('Error updating cache configuration:', error);
      throw error;
    }
  }

  // Delete cache
  async deleteCache(cacheId) {
    try {
      const cache = await this.getCache(cacheId);
      
      // Clear cache data
      await this.clear(cacheId);
      
      // Remove from registry
      this.caches.delete(cacheId);
      
      this.logger.info('Cache deleted', { cacheId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting cache:', error);
      throw error;
    }
  }

  // Generate unique ID
  generateId() {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new CacheManager();
