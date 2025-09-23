class ExportMonitor {
  constructor(pool, redis, logger) {
    this.pool = pool;
    this.redis = redis;
    this.logger = logger;
    this.monitoringInterval = 30000; // 30 seconds
    this.isRunning = false;
    this.monitoringTimer = null;
  }

  async initialize() {
    try {
      await this.setupMonitoring();
      this.logger.info('Export Monitor initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Export Monitor:', error);
      throw error;
    }
  }

  async setupMonitoring() {
    // Setup monitoring metrics
    this.metrics = {
      totalExports: 0,
      successfulExports: 0,
      failedExports: 0,
      averageProcessingTime: 0,
      totalDataProcessed: 0,
      formatDistribution: {},
      errorDistribution: {},
      performanceMetrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkUsage: 0
      }
    };
  }

  async start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.monitoringTimer = setInterval(async () => {
      await this.collectMetrics();
    }, this.monitoringInterval);
    
    this.logger.info('Export Monitor started');
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    this.logger.info('Export Monitor stopped');
  }

  async collectMetrics() {
    try {
      await Promise.all([
        this.updateExportMetrics(),
        this.updatePerformanceMetrics(),
        this.updateErrorMetrics(),
        this.updateFormatMetrics()
      ]);
      
      // Store metrics in Redis
      await this.redis.setEx(
        'export:metrics',
        300, // 5 minutes
        JSON.stringify(this.metrics)
      );
      
    } catch (error) {
      this.logger.error('Failed to collect metrics:', error);
    }
  }

  async updateExportMetrics() {
    try {
      const [
        totalExports,
        successfulExports,
        failedExports,
        averageProcessingTime
      ] = await Promise.all([
        this.getTotalExports(),
        this.getSuccessfulExports(),
        this.getFailedExports(),
        this.getAverageProcessingTime()
      ]);
      
      this.metrics.totalExports = totalExports;
      this.metrics.successfulExports = successfulExports;
      this.metrics.failedExports = failedExports;
      this.metrics.averageProcessingTime = averageProcessingTime;
      
    } catch (error) {
      this.logger.error('Failed to update export metrics:', error);
    }
  }

  async updatePerformanceMetrics() {
    try {
      const process = require('process');
      const fs = require('fs').promises;
      
      // CPU usage
      const cpuUsage = process.cpuUsage();
      this.metrics.performanceMetrics.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000;
      
      // Memory usage
      const memoryUsage = process.memoryUsage();
      this.metrics.performanceMetrics.memoryUsage = memoryUsage.heapUsed / 1024 / 1024; // MB
      
      // Disk usage
      try {
        const stats = await fs.stat('exports');
        this.metrics.performanceMetrics.diskUsage = stats.size / 1024 / 1024; // MB
      } catch {
        this.metrics.performanceMetrics.diskUsage = 0;
      }
      
    } catch (error) {
      this.logger.error('Failed to update performance metrics:', error);
    }
  }

  async updateErrorMetrics() {
    try {
      const result = await this.pool.query(`
        SELECT error_message, COUNT(*) as count
        FROM export_jobs
        WHERE status = 'failed' 
        AND created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY error_message
        ORDER BY count DESC
        LIMIT 10
      `);
      
      this.metrics.errorDistribution = {};
      result.rows.forEach(row => {
        this.metrics.errorDistribution[row.error_message] = parseInt(row.count);
      });
      
    } catch (error) {
      this.logger.error('Failed to update error metrics:', error);
    }
  }

  async updateFormatMetrics() {
    try {
      const result = await this.pool.query(`
        SELECT format, COUNT(*) as count
        FROM export_jobs
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY format
        ORDER BY count DESC
      `);
      
      this.metrics.formatDistribution = {};
      result.rows.forEach(row => {
        this.metrics.formatDistribution[row.format] = parseInt(row.count);
      });
      
    } catch (error) {
      this.logger.error('Failed to update format metrics:', error);
    }
  }

  async getTotalExports() {
    const result = await this.pool.query('SELECT COUNT(*) FROM export_jobs');
    return parseInt(result.rows[0].count);
  }

  async getSuccessfulExports() {
    const result = await this.pool.query(
      "SELECT COUNT(*) FROM export_jobs WHERE status = 'completed'"
    );
    return parseInt(result.rows[0].count);
  }

  async getFailedExports() {
    const result = await this.pool.query(
      "SELECT COUNT(*) FROM export_jobs WHERE status = 'failed'"
    );
    return parseInt(result.rows[0].count);
  }

  async getAverageProcessingTime() {
    const result = await this.pool.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_time
      FROM export_jobs
      WHERE status = 'completed'
      AND completed_at IS NOT NULL
    `);
    
    return parseFloat(result.rows[0].avg_time) || 0;
  }

  async getMetrics() {
    return this.metrics;
  }

  async getExportHealth() {
    try {
      const [
        totalExports,
        recentExports,
        errorRate,
        averageProcessingTime
      ] = await Promise.all([
        this.getTotalExports(),
        this.getRecentExports(),
        this.getErrorRate(),
        this.getAverageProcessingTime()
      ]);
      
      const health = {
        status: 'healthy',
        totalExports,
        recentExports,
        errorRate,
        averageProcessingTime,
        timestamp: new Date().toISOString()
      };
      
      // Determine health status
      if (errorRate > 0.1) { // 10% error rate
        health.status = 'warning';
      }
      
      if (errorRate > 0.2) { // 20% error rate
        health.status = 'critical';
      }
      
      if (averageProcessingTime > 300) { // 5 minutes
        health.status = 'warning';
      }
      
      return health;
    } catch (error) {
      this.logger.error('Failed to get export health:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getRecentExports(limit = 10) {
    const result = await this.pool.query(`
      SELECT id, format, status, created_at, completed_at, file_size
      FROM export_jobs
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }

  async getErrorRate() {
    const result = await this.pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM export_jobs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    
    const total = parseInt(result.rows[0].total);
    const failed = parseInt(result.rows[0].failed);
    
    return total > 0 ? failed / total : 0;
  }

  async getPerformanceTrends() {
    try {
      const result = await this.pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_exports,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_exports,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_exports,
          AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_processing_time
        FROM export_jobs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get performance trends:', error);
      return [];
    }
  }

  async getFormatTrends() {
    try {
      const result = await this.pool.query(`
        SELECT 
          format,
          DATE(created_at) as date,
          COUNT(*) as count
        FROM export_jobs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY format, DATE(created_at)
        ORDER BY date DESC, count DESC
      `);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get format trends:', error);
      return [];
    }
  }

  async getErrorTrends() {
    try {
      const result = await this.pool.query(`
        SELECT 
          error_message,
          DATE(created_at) as date,
          COUNT(*) as count
        FROM export_jobs
        WHERE status = 'failed'
        AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY error_message, DATE(created_at)
        ORDER BY date DESC, count DESC
      `);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get error trends:', error);
      return [];
    }
  }

  async getTopErrors(limit = 10) {
    try {
      const result = await this.pool.query(`
        SELECT 
          error_message,
          COUNT(*) as count
        FROM export_jobs
        WHERE status = 'failed'
        AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY error_message
        ORDER BY count DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get top errors:', error);
      return [];
    }
  }

  async getTopFormats(limit = 10) {
    try {
      const result = await this.pool.query(`
        SELECT 
          format,
          COUNT(*) as count
        FROM export_jobs
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY format
        ORDER BY count DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get top formats:', error);
      return [];
    }
  }

  async getSystemAlerts() {
    try {
      const alerts = [];
      
      // Check error rate
      const errorRate = await this.getErrorRate();
      if (errorRate > 0.1) {
        alerts.push({
          type: 'error_rate',
          severity: errorRate > 0.2 ? 'critical' : 'warning',
          message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check processing time
      const avgProcessingTime = await this.getAverageProcessingTime();
      if (avgProcessingTime > 300) {
        alerts.push({
          type: 'processing_time',
          severity: avgProcessingTime > 600 ? 'critical' : 'warning',
          message: `High average processing time: ${avgProcessingTime.toFixed(1)}s`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check disk usage
      if (this.metrics.performanceMetrics.diskUsage > 1000) { // 1GB
        alerts.push({
          type: 'disk_usage',
          severity: 'warning',
          message: `High disk usage: ${this.metrics.performanceMetrics.diskUsage.toFixed(1)}MB`,
          timestamp: new Date().toISOString()
        });
      }
      
      return alerts;
    } catch (error) {
      this.logger.error('Failed to get system alerts:', error);
      return [];
    }
  }

  async generateReport() {
    try {
      const [
        health,
        trends,
        formatTrends,
        errorTrends,
        topErrors,
        topFormats,
        alerts
      ] = await Promise.all([
        this.getExportHealth(),
        this.getPerformanceTrends(),
        this.getFormatTrends(),
        this.getErrorTrends(),
        this.getTopErrors(),
        this.getTopFormats(),
        this.getSystemAlerts()
      ]);
      
      return {
        health,
        trends,
        formatTrends,
        errorTrends,
        topErrors,
        topFormats,
        alerts,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to generate report:', error);
      throw error;
    }
  }
}

module.exports = ExportMonitor;
