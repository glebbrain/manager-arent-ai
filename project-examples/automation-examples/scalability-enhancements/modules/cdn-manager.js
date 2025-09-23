const winston = require('winston');
const axios = require('axios');
const _ = require('lodash');

class CDNManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/cdn-manager.log' })
      ]
    });
    
    this.providers = new Map();
    this.cacheRules = new Map();
    this.purgeQueue = new Map();
    this.metrics = {
      requestsServed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      bytesTransferred: 0,
      averageResponseTime: 0,
      totalResponseTime: 0
    };
  }

  // Initialize CDN manager
  async initialize(config = {}) {
    try {
      // Initialize default providers
      this.initializeDefaultProviders();
      
      // Set up cache rules
      this.initializeCacheRules();
      
      this.logger.info('CDN manager initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing CDN manager:', error);
      throw error;
    }
  }

  // Initialize default providers
  initializeDefaultProviders() {
    // CloudFlare
    this.providers.set('cloudflare', {
      name: 'CloudFlare',
      apiUrl: 'https://api.cloudflare.com/client/v4',
      features: ['caching', 'purge', 'analytics', 'security'],
      supportedFormats: ['html', 'css', 'js', 'images', 'videos']
    });

    // AWS CloudFront
    this.providers.set('cloudfront', {
      name: 'AWS CloudFront',
      apiUrl: 'https://cloudfront.amazonaws.com',
      features: ['caching', 'purge', 'analytics', 'security', 'geo-restriction'],
      supportedFormats: ['html', 'css', 'js', 'images', 'videos', 'api']
    });

    // KeyCDN
    this.providers.set('keycdn', {
      name: 'KeyCDN',
      apiUrl: 'https://api.keycdn.com',
      features: ['caching', 'purge', 'analytics'],
      supportedFormats: ['html', 'css', 'js', 'images', 'videos']
    });
  }

  // Initialize cache rules
  initializeCacheRules() {
    this.cacheRules.set('static', {
      name: 'Static Assets',
      pattern: /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
      ttl: 31536000, // 1 year
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

    this.cacheRules.set('html', {
      name: 'HTML Pages',
      pattern: /\.html$/,
      ttl: 3600, // 1 hour
      headers: {
        'Cache-Control': 'public, max-age=3600'
      }
    });

    this.cacheRules.set('api', {
      name: 'API Responses',
      pattern: /^\/api\//,
      ttl: 300, // 5 minutes
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    });
  }

  // Add CDN provider
  async addProvider(name, config) {
    try {
      const provider = {
        name: config.name,
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        zoneId: config.zoneId,
        features: config.features || [],
        supportedFormats: config.supportedFormats || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.providers.set(name, provider);
      
      this.logger.info('CDN provider added successfully', { name, provider: config.name });
      return provider;
    } catch (error) {
      this.logger.error('Error adding CDN provider:', error);
      throw error;
    }
  }

  // Get provider
  async getProvider(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`CDN provider not found: ${name}`);
    }
    return provider;
  }

  // Purge cache
  async purgeCache(providerName, urls, options = {}) {
    try {
      const provider = await this.getProvider(providerName);
      const startTime = Date.now();
      
      let result;
      
      switch (providerName) {
        case 'cloudflare':
          result = await this.purgeCloudFlare(provider, urls, options);
          break;
        case 'cloudfront':
          result = await this.purgeCloudFront(provider, urls, options);
          break;
        case 'keycdn':
          result = await this.purgeKeyCDN(provider, urls, options);
          break;
        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }

      const purgeTime = Date.now() - startTime;
      
      this.logger.info('Cache purged successfully', {
        provider: providerName,
        urls: urls.length,
        purgeTime
      });

      return result;
    } catch (error) {
      this.logger.error('Error purging cache:', error);
      throw error;
    }
  }

  // Purge CloudFlare cache
  async purgeCloudFlare(provider, urls, options) {
    try {
      const response = await axios.post(
        `${provider.apiUrl}/zones/${provider.zoneId}/purge_cache`,
        {
          files: urls,
          purge_everything: options.purgeAll || false
        },
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.success,
        errors: response.data.errors,
        messages: response.data.messages
      };
    } catch (error) {
      this.logger.error('Error purging CloudFlare cache:', error);
      throw error;
    }
  }

  // Purge CloudFront cache
  async purgeCloudFront(provider, urls, options) {
    try {
      // This is a simplified implementation
      // In production, use AWS SDK
      const response = await axios.post(
        `${provider.apiUrl}/distributions/${provider.distributionId}/invalidation`,
        {
          Paths: {
            Quantity: urls.length,
            Items: urls
          },
          CallerReference: `purge-${Date.now()}`
        },
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        invalidationId: response.data.Invalidation.Id
      };
    } catch (error) {
      this.logger.error('Error purging CloudFront cache:', error);
      throw error;
    }
  }

  // Purge KeyCDN cache
  async purgeKeyCDN(provider, urls, options) {
    try {
      const response = await axios.post(
        `${provider.apiUrl}/zones/purge`,
        {
          urls: urls
        },
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.status === 'success',
        message: response.data.message
      };
    } catch (error) {
      this.logger.error('Error purging KeyCDN cache:', error);
      throw error;
    }
  }

  // Get cache status
  async getCacheStatus(providerName, url) {
    try {
      const provider = await this.getProvider(providerName);
      
      // Check cache status by making a HEAD request
      const response = await axios.head(url, {
        headers: {
          'User-Agent': 'CDN-Manager/1.0'
        }
      });

      const cacheStatus = response.headers['cf-cache-status'] || 
                         response.headers['x-cache'] || 
                         response.headers['cache-control'];

      return {
        url,
        status: cacheStatus,
        headers: response.headers,
        statusCode: response.status
      };
    } catch (error) {
      this.logger.error('Error getting cache status:', error);
      throw error;
    }
  }

  // Get analytics
  async getAnalytics(providerName, options = {}) {
    try {
      const provider = await this.getProvider(providerName);
      
      switch (providerName) {
        case 'cloudflare':
          return await this.getCloudFlareAnalytics(provider, options);
        case 'cloudfront':
          return await this.getCloudFrontAnalytics(provider, options);
        case 'keycdn':
          return await this.getKeyCDNAnalytics(provider, options);
        default:
          throw new Error(`Analytics not supported for provider: ${providerName}`);
      }
    } catch (error) {
      this.logger.error('Error getting analytics:', error);
      throw error;
    }
  }

  // Get CloudFlare analytics
  async getCloudFlareAnalytics(provider, options) {
    try {
      const response = await axios.get(
        `${provider.apiUrl}/zones/${provider.zoneId}/analytics/dashboard`,
        {
          params: {
            since: options.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            until: options.until || new Date().toISOString()
          },
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`
          }
        }
      );

      return response.data.result;
    } catch (error) {
      this.logger.error('Error getting CloudFlare analytics:', error);
      throw error;
    }
  }

  // Get CloudFront analytics
  async getCloudFrontAnalytics(provider, options) {
    try {
      // This is a simplified implementation
      // In production, use AWS SDK
      const response = await axios.get(
        `${provider.apiUrl}/distributions/${provider.distributionId}/analytics`,
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error getting CloudFront analytics:', error);
      throw error;
    }
  }

  // Get KeyCDN analytics
  async getKeyCDNAnalytics(provider, options) {
    try {
      const response = await axios.get(
        `${provider.apiUrl}/zones/analytics`,
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error getting KeyCDN analytics:', error);
      throw error;
    }
  }

  // Add cache rule
  async addCacheRule(name, rule) {
    try {
      const cacheRule = {
        name,
        pattern: new RegExp(rule.pattern),
        ttl: rule.ttl || 3600,
        headers: rule.headers || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.cacheRules.set(name, cacheRule);
      
      this.logger.info('Cache rule added successfully', { name });
      return cacheRule;
    } catch (error) {
      this.logger.error('Error adding cache rule:', error);
      throw error;
    }
  }

  // Get cache rule for URL
  async getCacheRuleForUrl(url) {
    try {
      for (const [name, rule] of this.cacheRules) {
        if (rule.pattern.test(url)) {
          return rule;
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error getting cache rule for URL:', error);
      throw error;
    }
  }

  // Update metrics
  updateMetrics(responseTime, bytesTransferred, cacheHit = false) {
    this.metrics.requestsServed++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requestsServed;
    this.metrics.bytesTransferred += bytesTransferred;
    
    if (cacheHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  // Get metrics
  async getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      providers: this.providers.size,
      cacheRules: this.cacheRules.size
    };
  }

  // Reset metrics
  async resetMetrics() {
    this.metrics = {
      requestsServed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      bytesTransferred: 0,
      averageResponseTime: 0,
      totalResponseTime: 0
    };
    
    this.logger.info('CDN metrics reset');
  }

  // Get provider list
  async getProviders() {
    return Array.from(this.providers.values());
  }

  // Get cache rules
  async getCacheRules() {
    return Array.from(this.cacheRules.values());
  }

  // Delete provider
  async deleteProvider(name) {
    try {
      const provider = await this.getProvider(name);
      this.providers.delete(name);
      
      this.logger.info('CDN provider deleted successfully', { name });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting CDN provider:', error);
      throw error;
    }
  }

  // Delete cache rule
  async deleteCacheRule(name) {
    try {
      const rule = this.cacheRules.get(name);
      if (!rule) {
        throw new Error(`Cache rule not found: ${name}`);
      }
      
      this.cacheRules.delete(name);
      
      this.logger.info('Cache rule deleted successfully', { name });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting cache rule:', error);
      throw error;
    }
  }

  // Generate unique ID
  generateId() {
    return `cdn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new CDNManager();
