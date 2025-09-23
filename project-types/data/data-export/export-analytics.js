class ExportAnalytics {
  constructor(pool, logger) {
    this.pool = pool;
    this.logger = logger;
    this.analyticsCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  async initialize() {
    try {
      await this.setupAnalyticsTables();
      this.logger.info('Export Analytics initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Export Analytics:', error);
      throw error;
    }
  }

  async setupAnalyticsTables() {
    const queries = [
      // Export analytics table
      `CREATE TABLE IF NOT EXISTS export_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        export_id UUID REFERENCES export_jobs(id),
        user_id VARCHAR(255) NOT NULL,
        format VARCHAR(50) NOT NULL,
        file_size BIGINT,
        processing_time INTEGER,
        download_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // User analytics table
      `CREATE TABLE IF NOT EXISTS user_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        total_exports INTEGER DEFAULT 0,
        successful_exports INTEGER DEFAULT 0,
        failed_exports INTEGER DEFAULT 0,
        total_data_processed BIGINT DEFAULT 0,
        favorite_format VARCHAR(50),
        last_export_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Format analytics table
      `CREATE TABLE IF NOT EXISTS format_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        format VARCHAR(50) NOT NULL,
        total_exports INTEGER DEFAULT 0,
        successful_exports INTEGER DEFAULT 0,
        failed_exports INTEGER DEFAULT 0,
        avg_processing_time INTEGER,
        avg_file_size BIGINT,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Performance analytics table
      `CREATE TABLE IF NOT EXISTS performance_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(10,2) NOT NULL,
        metric_unit VARCHAR(20),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      await this.pool.query(query);
    }
  }

  async recordExport(exportData) {
    try {
      const { exportId, userId, format, fileSize, processingTime } = exportData;
      
      // Record export analytics
      await this.pool.query(`
        INSERT INTO export_analytics (export_id, user_id, format, file_size, processing_time)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (export_id) DO UPDATE SET
          file_size = EXCLUDED.file_size,
          processing_time = EXCLUDED.processing_time
      `, [exportId, userId, format, fileSize, processingTime]);
      
      // Update user analytics
      await this.updateUserAnalytics(userId, format, fileSize, processingTime);
      
      // Update format analytics
      await this.updateFormatAnalytics(format, fileSize, processingTime);
      
      // Record performance metrics
      await this.recordPerformanceMetrics(exportData);
      
      this.logger.info(`Recorded analytics for export: ${exportId}`);
    } catch (error) {
      this.logger.error('Failed to record export analytics:', error);
      throw error;
    }
  }

  async updateUserAnalytics(userId, format, fileSize, processingTime) {
    try {
      // Get current user analytics
      const result = await this.pool.query(
        'SELECT * FROM user_analytics WHERE user_id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        // Create new user analytics record
        await this.pool.query(`
          INSERT INTO user_analytics (user_id, total_exports, successful_exports, total_data_processed, favorite_format, last_export_at)
          VALUES ($1, 1, 1, $2, $3, NOW())
        `, [userId, fileSize, format]);
      } else {
        // Update existing user analytics
        const userAnalytics = result.rows[0];
        const newTotalExports = userAnalytics.total_exports + 1;
        const newSuccessfulExports = userAnalytics.successful_exports + 1;
        const newTotalDataProcessed = userAnalytics.total_data_processed + fileSize;
        
        // Determine favorite format
        const formatCounts = await this.getUserFormatCounts(userId);
        const favoriteFormat = this.getFavoriteFormat(formatCounts);
        
        await this.pool.query(`
          UPDATE user_analytics 
          SET total_exports = $1,
              successful_exports = $2,
              total_data_processed = $3,
              favorite_format = $4,
              last_export_at = NOW(),
              updated_at = NOW()
          WHERE user_id = $5
        `, [newTotalExports, newSuccessfulExports, newTotalDataProcessed, favoriteFormat, userId]);
      }
    } catch (error) {
      this.logger.error('Failed to update user analytics:', error);
      throw error;
    }
  }

  async updateFormatAnalytics(format, fileSize, processingTime) {
    try {
      // Get current format analytics
      const result = await this.pool.query(
        'SELECT * FROM format_analytics WHERE format = $1',
        [format]
      );
      
      if (result.rows.length === 0) {
        // Create new format analytics record
        await this.pool.query(`
          INSERT INTO format_analytics (format, total_exports, successful_exports, avg_processing_time, avg_file_size, last_used_at)
          VALUES ($1, 1, 1, $2, $3, NOW())
        `, [format, processingTime, fileSize]);
      } else {
        // Update existing format analytics
        const formatAnalytics = result.rows[0];
        const newTotalExports = formatAnalytics.total_exports + 1;
        const newSuccessfulExports = formatAnalytics.successful_exports + 1;
        
        // Calculate new averages
        const newAvgProcessingTime = Math.round(
          (formatAnalytics.avg_processing_time * formatAnalytics.total_exports + processingTime) / newTotalExports
        );
        const newAvgFileSize = Math.round(
          (formatAnalytics.avg_file_size * formatAnalytics.total_exports + fileSize) / newTotalExports
        );
        
        await this.pool.query(`
          UPDATE format_analytics 
          SET total_exports = $1,
              successful_exports = $2,
              avg_processing_time = $3,
              avg_file_size = $4,
              last_used_at = NOW(),
              updated_at = NOW()
          WHERE format = $5
        `, [newTotalExports, newSuccessfulExports, newAvgProcessingTime, newAvgFileSize, format]);
      }
    } catch (error) {
      this.logger.error('Failed to update format analytics:', error);
      throw error;
    }
  }

  async recordPerformanceMetrics(exportData) {
    try {
      const metrics = [
        { name: 'export_processing_time', value: exportData.processingTime, unit: 'ms' },
        { name: 'export_file_size', value: exportData.fileSize, unit: 'bytes' },
        { name: 'export_memory_usage', value: exportData.memoryUsage || 0, unit: 'bytes' },
        { name: 'export_cpu_usage', value: exportData.cpuUsage || 0, unit: 'percent' }
      ];
      
      for (const metric of metrics) {
        await this.pool.query(`
          INSERT INTO performance_analytics (metric_name, metric_value, metric_unit)
          VALUES ($1, $2, $3)
        `, [metric.name, metric.value, metric.unit]);
      }
    } catch (error) {
      this.logger.error('Failed to record performance metrics:', error);
    }
  }

  async getUserFormatCounts(userId) {
    const result = await this.pool.query(`
      SELECT format, COUNT(*) as count
      FROM export_analytics
      WHERE user_id = $1
      GROUP BY format
      ORDER BY count DESC
    `, [userId]);
    
    return result.rows;
  }

  getFavoriteFormat(formatCounts) {
    if (formatCounts.length === 0) return null;
    return formatCounts[0].format;
  }

  async getAnalytics(filters = {}) {
    try {
      const cacheKey = this.generateCacheKey(filters);
      
      // Check cache first
      if (this.analyticsCache.has(cacheKey)) {
        const cached = this.analyticsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }
      
      const analytics = await this.calculateAnalytics(filters);
      
      // Cache the result
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });
      
      return analytics;
    } catch (error) {
      this.logger.error('Failed to get analytics:', error);
      throw error;
    }
  }

  async calculateAnalytics(filters) {
    const [
      overview,
      userStats,
      formatStats,
      performanceStats,
      trends
    ] = await Promise.all([
      this.getOverviewStats(filters),
      this.getUserStats(filters),
      this.getFormatStats(filters),
      this.getPerformanceStats(filters),
      this.getTrends(filters)
    ]);
    
    return {
      overview,
      userStats,
      formatStats,
      performanceStats,
      trends,
      generatedAt: new Date().toISOString()
    };
  }

  async getOverviewStats(filters) {
    const result = await this.pool.query(`
      SELECT 
        COUNT(*) as total_exports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_exports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_exports,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_processing_time,
        AVG(file_size) as avg_file_size,
        SUM(file_size) as total_data_processed
      FROM export_jobs
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);
    
    return result.rows[0];
  }

  async getUserStats(filters) {
    const result = await this.pool.query(`
      SELECT 
        user_id,
        total_exports,
        successful_exports,
        failed_exports,
        total_data_processed,
        favorite_format,
        last_export_at
      FROM user_analytics
      ORDER BY total_exports DESC
      LIMIT 10
    `);
    
    return result.rows;
  }

  async getFormatStats(filters) {
    const result = await this.pool.query(`
      SELECT 
        format,
        total_exports,
        successful_exports,
        failed_exports,
        avg_processing_time,
        avg_file_size,
        last_used_at
      FROM format_analytics
      ORDER BY total_exports DESC
    `);
    
    return result.rows;
  }

  async getPerformanceStats(filters) {
    const result = await this.pool.query(`
      SELECT 
        metric_name,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        COUNT(*) as sample_count
      FROM performance_analytics
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY metric_name
      ORDER BY metric_name
    `);
    
    return result.rows;
  }

  async getTrends(filters) {
    const result = await this.pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_exports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_exports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_exports,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_processing_time,
        AVG(file_size) as avg_file_size
      FROM export_jobs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    return result.rows;
  }

  async getExportHistory(userId, filters = {}) {
    try {
      const { page = 1, limit = 20, format, status } = filters;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          ej.*,
          ea.download_count,
          ea.processing_time
        FROM export_jobs ej
        LEFT JOIN export_analytics ea ON ej.id = ea.export_id
        WHERE ej.user_id = $1
      `;
      
      const params = [userId];
      let paramCount = 1;
      
      if (format) {
        query += ` AND ej.format = $${++paramCount}`;
        params.push(format);
      }
      
      if (status) {
        query += ` AND ej.status = $${++paramCount}`;
        params.push(status);
      }
      
      query += ` ORDER BY ej.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);
      
      const result = await this.pool.query(query, params);
      
      return {
        exports: result.rows,
        pagination: {
          page,
          limit,
          total: result.rows.length
        }
      };
    } catch (error) {
      this.logger.error('Failed to get export history:', error);
      throw error;
    }
  }

  async getFormatTrends(format, days = 30) {
    try {
      const result = await this.pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_processing_time,
          AVG(file_size) as avg_file_size
        FROM export_jobs
        WHERE format = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [format]);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get format trends:', error);
      return [];
    }
  }

  async getUserTrends(userId, days = 30) {
    try {
      const result = await this.pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_processing_time,
          AVG(file_size) as avg_file_size
        FROM export_jobs
        WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get user trends:', error);
      return [];
    }
  }

  async getTopUsers(limit = 10) {
    try {
      const result = await this.pool.query(`
        SELECT 
          user_id,
          total_exports,
          successful_exports,
          total_data_processed,
          favorite_format
        FROM user_analytics
        ORDER BY total_exports DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get top users:', error);
      return [];
    }
  }

  async getTopFormats(limit = 10) {
    try {
      const result = await this.pool.query(`
        SELECT 
          format,
          total_exports,
          successful_exports,
          avg_processing_time,
          avg_file_size
        FROM format_analytics
        ORDER BY total_exports DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get top formats:', error);
      return [];
    }
  }

  async getPerformanceMetrics(metricName, hours = 24) {
    try {
      const result = await this.pool.query(`
        SELECT 
          metric_value,
          timestamp
        FROM performance_analytics
        WHERE metric_name = $1
        AND timestamp >= NOW() - INTERVAL '${hours} hours'
        ORDER BY timestamp DESC
      `, [metricName]);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get performance metrics:', error);
      return [];
    }
  }

  generateCacheKey(filters) {
    return JSON.stringify(filters);
  }

  // Clear analytics cache
  clearCache() {
    this.analyticsCache.clear();
    this.logger.info('Analytics cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.analyticsCache.size,
      keys: Array.from(this.analyticsCache.keys())
    };
  }
}

module.exports = ExportAnalytics;
