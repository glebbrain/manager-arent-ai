const EventEmitter = require('events');
const NodeCache = require('node-cache');
const Redis = require('ioredis');
const logger = require('./logger');

/**
 * Advanced Cache Manager Module
 * Provides multi-layer caching with intelligent invalidation
 */
class CacheManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled || process.env.CACHE_ENABLED === 'true',
      strategy: config.strategy || process.env.CACHE_STRATEGY || 'lru',
      ttl: config.ttl || parseInt(process.env.CACHE_TTL) || 3600,
      maxSize: config.maxSize || parseInt(process.env.CACHE_MAX_SIZE) || 1000,
      layers: {
        l1: {
          enabled: true,
          type: 'memory',
          ttl: 300, // 5 minutes
          maxSize: 100
        },
        l2: {
          enabled: true,
          type: 'redis',
          ttl: 3600, // 1 hour
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        }
      },
      ...config
    };

    this.l1Cache = null;
    this.l2Cache = null;
    this.isRunning = false;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  /**
   * Initialize cache manager
   */
  async start() {
    if (!this.config.enabled) {
      logger.info('Cache manager is disabled');
      return;
    }

    try {
      await this.initializeL1Cache();
      await this.initializeL2Cache();
      
      this.isRunning = true;
      logger.info('Cache manager started successfully');
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start cache manager:', error);
      throw error;
    }
  }

  /**
   * Stop cache manager
   */
  async stop() {
    try {
      if (this.l1Cache) {
        this.l1Cache.close();
      }

      if (this.l2Cache) {
        await this.l2Cache.quit();
      }

      this.isRunning = false;
      logger.info('Cache manager stopped');
      this.emit('stopped');
    } catch (error) {
      logger.error('Error stopping cache manager:', error);
      throw error;
    }
  }

  /**
   * Initialize L1 cache (memory)
   */
  async initializeL1Cache() {
    if (!this.config.layers.l1.enabled) return;

    this.l1Cache = new NodeCache({
      stdTTL: this.config.layers.l1.ttl,
      maxKeys: this.config.layers.l1.maxSize,
      useClones: false,
      checkperiod: 120
    });

    // Set up event listeners
    this.l1Cache.on('set', (key, value) => {
      this.stats.sets++;
      this.emit('l1Set', { key, value });
    });

    this.l1Cache.on('del', (key, value) => {
      this.stats.deletes++;
      this.emit('l1Delete', { key, value });
    });

    this.l1Cache.on('expired', (key, value) => {
      this.stats.evictions++;
      this.emit('l1Expired', { key, value });
    });

    logger.info('L1 cache (memory) initialized');
  }

  /**
   * Initialize L2 cache (Redis)
   */
  async initializeL2Cache() {
    if (!this.config.layers.l2.enabled) return;

    this.l2Cache = new Redis({
      host: this.config.layers.l2.host,
      port: this.config.layers.l2.port,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    // Set up event listeners
    this.l2Cache.on('connect', () => {
      logger.info('L2 cache (Redis) connected');
    });

    this.l2Cache.on('error', (error) => {
      logger.error('L2 cache (Redis) error:', error);
    });

    await this.l2Cache.connect();
    logger.info('L2 cache (Redis) initialized');
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.isRunning) {
      this.stats.misses++;
      return null;
    }

    try {
      // Try L1 cache first
      if (this.l1Cache) {
        const l1Value = this.l1Cache.get(key);
        if (l1Value !== undefined) {
          this.stats.hits++;
          this.emit('cacheHit', { key, layer: 'l1' });
          return l1Value;
        }
      }

      // Try L2 cache
      if (this.l2Cache) {
        const l2Value = await this.l2Cache.get(key);
        if (l2Value !== null) {
          this.stats.hits++;
          
          // Store in L1 cache for faster access
          if (this.l1Cache) {
            this.l1Cache.set(key, JSON.parse(l2Value));
          }
          
          this.emit('cacheHit', { key, layer: 'l2' });
          return JSON.parse(l2Value);
        }
      }

      this.stats.misses++;
      this.emit('cacheMiss', { key });
      return null;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = null) {
    if (!this.isRunning) return false;

    try {
      const cacheTTL = ttl || this.config.ttl;
      const success = { l1: false, l2: false };

      // Set in L1 cache
      if (this.l1Cache) {
        this.l1Cache.set(key, value, cacheTTL);
        success.l1 = true;
      }

      // Set in L2 cache
      if (this.l2Cache) {
        await this.l2Cache.setex(key, cacheTTL, JSON.stringify(value));
        success.l2 = true;
      }

      this.stats.sets++;
      this.emit('cacheSet', { key, value, ttl: cacheTTL });
      
      return success.l1 || success.l2;
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    if (!this.isRunning) return false;

    try {
      const success = { l1: false, l2: false };

      // Delete from L1 cache
      if (this.l1Cache) {
        this.l1Cache.del(key);
        success.l1 = true;
      }

      // Delete from L2 cache
      if (this.l2Cache) {
        await this.l2Cache.del(key);
        success.l2 = true;
      }

      this.stats.deletes++;
      this.emit('cacheDelete', { key });
      
      return success.l1 || success.l2;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    if (!this.isRunning) return false;

    try {
      // Check L1 cache
      if (this.l1Cache && this.l1Cache.has(key)) {
        return true;
      }

      // Check L2 cache
      if (this.l2Cache) {
        const exists = await this.l2Cache.exists(key);
        return exists === 1;
      }

      return false;
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple keys from cache
   */
  async mget(keys) {
    if (!this.isRunning || !Array.isArray(keys)) return {};

    const results = {};
    
    for (const key of keys) {
      results[key] = await this.get(key);
    }

    return results;
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValuePairs, ttl = null) {
    if (!this.isRunning || typeof keyValuePairs !== 'object') return false;

    try {
      const promises = Object.entries(keyValuePairs).map(([key, value]) => 
        this.set(key, value, ttl)
      );

      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      logger.error('Error setting multiple cache keys:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    if (!this.isRunning) return false;

    try {
      const success = { l1: false, l2: false };

      // Clear L1 cache
      if (this.l1Cache) {
        this.l1Cache.flushAll();
        success.l1 = true;
      }

      // Clear L2 cache
      if (this.l2Cache) {
        await this.l2Cache.flushdb();
        success.l2 = true;
      }

      this.emit('cacheClear');
      logger.info('Cache cleared');
      
      return success.l1 || success.l2;
    } catch (error) {
      logger.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Warm cache with data
   */
  async warm(data) {
    if (!this.isRunning) return false;

    try {
      const keyValuePairs = Array.isArray(data) ? data : [data];
      let successCount = 0;

      for (const item of keyValuePairs) {
        const { key, value, ttl } = item;
        if (key && value !== undefined) {
          const result = await this.set(key, value, ttl);
          if (result) successCount++;
        }
      }

      this.emit('cacheWarmed', { count: successCount });
      logger.info(`Cache warmed with ${successCount} items`);
      
      return successCount > 0;
    } catch (error) {
      logger.error('Error warming cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      l1Enabled: this.config.layers.l1.enabled,
      l2Enabled: this.config.layers.l2.enabled,
      l1Size: this.l1Cache ? this.l1Cache.getStats().keys : 0,
      l2Size: 0 // Would need to implement Redis key count
    };
  }

  /**
   * Get cache keys (L1 only)
   */
  getKeys() {
    if (!this.l1Cache) return [];
    
    return this.l1Cache.keys();
  }

  /**
   * Get cache size
   */
  getSize() {
    const l1Size = this.l1Cache ? this.l1Cache.getStats().keys : 0;
    return l1Size;
  }

  /**
   * Set cache TTL for a key
   */
  async setTTL(key, ttl) {
    if (!this.isRunning) return false;

    try {
      const success = { l1: false, l2: false };

      // Set TTL in L1 cache
      if (this.l1Cache) {
        this.l1Cache.ttl(key, ttl);
        success.l1 = true;
      }

      // Set TTL in L2 cache
      if (this.l2Cache) {
        await this.l2Cache.expire(key, ttl);
        success.l2 = true;
      }

      return success.l1 || success.l2;
    } catch (error) {
      logger.error(`Error setting TTL for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache TTL for a key
   */
  async getTTL(key) {
    if (!this.isRunning) return -1;

    try {
      // Check L1 cache TTL
      if (this.l1Cache) {
        const ttl = this.l1Cache.getTtl(key);
        if (ttl) {
          return Math.floor((ttl - Date.now()) / 1000);
        }
      }

      // Check L2 cache TTL
      if (this.l2Cache) {
        const ttl = await this.l2Cache.ttl(key);
        return ttl;
      }

      return -1;
    } catch (error) {
      logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Get cache manager status
   */
  getStatus() {
    return {
      running: this.isRunning,
      l1Enabled: this.config.layers.l1.enabled,
      l2Enabled: this.config.layers.l2.enabled,
      l1Connected: this.l1Cache !== null,
      l2Connected: this.l2Cache ? this.l2Cache.status === 'ready' : false,
      stats: this.getStats()
    };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
    
    logger.info('Cache configuration updated');
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    logger.info('Cache statistics reset');
  }
}

module.exports = CacheManager;
