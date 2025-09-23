const ExportEngine = require('./export-engine');
const FormatConverter = require('./format-converter');
const DataProcessor = require('./data-processor');
const ExportScheduler = require('./export-scheduler');
const ExportValidator = require('./export-validator');
const ExportMonitor = require('./export-monitor');
const ExportSecurity = require('./export-security');
const ExportOptimizer = require('./export-optimizer');
const ExportAnalytics = require('./export-analytics');

class IntegratedExportSystem {
  constructor(pool, redis, logger) {
    this.pool = pool;
    this.redis = redis;
    this.logger = logger;
    
    // Initialize components
    this.exportEngine = new ExportEngine(pool, redis, logger);
    this.formatConverter = new FormatConverter(logger);
    this.dataProcessor = new DataProcessor(pool, logger);
    this.exportScheduler = new ExportScheduler(pool, redis, logger);
    this.exportValidator = new ExportValidator(logger);
    this.exportMonitor = new ExportMonitor(pool, redis, logger);
    this.exportSecurity = new ExportSecurity(logger);
    this.exportOptimizer = new ExportOptimizer(pool, logger);
    this.exportAnalytics = new ExportAnalytics(pool, logger);
    
    // Export history cache
    this.exportHistory = new Map();
    this.activeExports = new Map();
  }

  async initialize() {
    try {
      // Create database tables
      await this.createTables();
      
      // Initialize components
      await this.exportEngine.initialize();
      await this.dataProcessor.initialize();
      await this.exportScheduler.initialize();
      await this.exportMonitor.initialize();
      await this.exportAnalytics.initialize();
      
      this.logger.info('Integrated Export System initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Integrated Export System:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      // Export jobs table
      `CREATE TABLE IF NOT EXISTS export_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        data_source VARCHAR(255) NOT NULL,
        format VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        file_path TEXT,
        file_size BIGINT,
        download_url TEXT,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT,
        metadata JSONB,
        options JSONB
      )`,
      
      // Export schedules table
      `CREATE TABLE IF NOT EXISTS export_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        schedule_expression VARCHAR(255) NOT NULL,
        data_source VARCHAR(255) NOT NULL,
        format VARCHAR(50) NOT NULL,
        options JSONB,
        is_active BOOLEAN DEFAULT true,
        last_run TIMESTAMP,
        next_run TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
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
      
      // Export templates table
      `CREATE TABLE IF NOT EXISTS export_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        data_source VARCHAR(255) NOT NULL,
        format VARCHAR(50) NOT NULL,
        options JSONB,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Export permissions table
      `CREATE TABLE IF NOT EXISTS export_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        permission VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      await this.pool.query(query);
    }
  }

  async exportData(data, format, options = {}) {
    try {
      const exportId = this.generateExportId();
      const startTime = Date.now();
      
      // Validate export request
      const validation = await this.exportValidator.validateExportRequest({
        data,
        format,
        options
      });
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Process data
      const processedData = await this.dataProcessor.processData(data, options);
      
      // Convert format
      const convertedData = await this.formatConverter.convert(processedData, format, options);
      
      // Save export job
      const exportJob = await this.saveExportJob({
        id: exportId,
        userId: options.userId || 'system',
        dataSource: options.dataSource || 'manual',
        format,
        status: 'processing',
        options
      });
      
      // Generate file
      const filePath = await this.exportEngine.generateFile(convertedData, format, options);
      
      // Update export job
      const fileStats = await this.getFileStats(filePath);
      await this.updateExportJob(exportId, {
        status: 'completed',
        filePath,
        fileSize: fileStats.size,
        downloadUrl: this.generateDownloadUrl(exportId),
        expiresAt: this.calculateExpiration(options.expirationHours),
        completedAt: new Date()
      });
      
      // Record analytics
      const processingTime = Date.now() - startTime;
      await this.exportAnalytics.recordExport({
        exportId,
        userId: options.userId || 'system',
        format,
        fileSize: fileStats.size,
        processingTime
      });
      
      // Cache export info
      this.exportHistory.set(exportId, {
        ...exportJob,
        filePath,
        fileSize: fileStats.size,
        downloadUrl: this.generateDownloadUrl(exportId),
        expiresAt: this.calculateExpiration(options.expirationHours)
      });
      
      this.logger.info(`Export completed: ${exportId}`, {
        format,
        fileSize: fileStats.size,
        processingTime
      });
      
      return {
        exportId,
        downloadUrl: this.generateDownloadUrl(exportId),
        expiresAt: this.calculateExpiration(options.expirationHours)
      };
    } catch (error) {
      this.logger.error('Export failed:', error);
      
      // Update export job with error
      if (exportId) {
        await this.updateExportJob(exportId, {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        });
      }
      
      throw error;
    }
  }

  async batchExport(exports) {
    try {
      const results = [];
      
      for (const exportRequest of exports) {
        try {
          const result = await this.exportData(
            exportRequest.data,
            exportRequest.format,
            exportRequest.options
          );
          results.push({ success: true, ...result });
        } catch (error) {
          results.push({
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      this.logger.error('Batch export failed:', error);
      throw error;
    }
  }

  async getExportHistory(filters = {}) {
    try {
      const { page = 1, limit = 20, format, status } = filters;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT * FROM export_jobs
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (format) {
        query += ` AND format = $${++paramCount}`;
        params.push(format);
      }
      
      if (status) {
        query += ` AND status = $${++paramCount}`;
        params.push(status);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
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

  async getExportFile(exportId) {
    try {
      // Check cache first
      if (this.exportHistory.has(exportId)) {
        const exportInfo = this.exportHistory.get(exportId);
        return exportInfo.filePath;
      }
      
      // Query database
      const result = await this.pool.query(
        'SELECT file_path FROM export_jobs WHERE id = $1 AND status = $2',
        [exportId, 'completed']
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0].file_path;
    } catch (error) {
      this.logger.error('Failed to get export file:', error);
      throw error;
    }
  }

  async getSystemStatus() {
    try {
      const [
        totalExports,
        activeExports,
        scheduledExports,
        recentExports
      ] = await Promise.all([
        this.getTotalExports(),
        this.getActiveExports(),
        this.getScheduledExports(),
        this.getRecentExports()
      ]);
      
      return {
        status: 'healthy',
        totalExports,
        activeExports,
        scheduledExports,
        recentExports,
        uptime: process.uptime(),
        version: '2.4.0'
      };
    } catch (error) {
      this.logger.error('Failed to get system status:', error);
      throw error;
    }
  }

  async getTotalExports() {
    const result = await this.pool.query('SELECT COUNT(*) FROM export_jobs');
    return parseInt(result.rows[0].count);
  }

  async getActiveExports() {
    const result = await this.pool.query(
      'SELECT COUNT(*) FROM export_jobs WHERE status IN ($1, $2)',
      ['pending', 'processing']
    );
    return parseInt(result.rows[0].count);
  }

  async getScheduledExports() {
    const result = await this.pool.query(
      'SELECT COUNT(*) FROM export_schedules WHERE is_active = true'
    );
    return parseInt(result.rows[0].count);
  }

  async getRecentExports() {
    const result = await this.pool.query(`
      SELECT id, format, status, created_at 
      FROM export_jobs 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    return result.rows;
  }

  async saveExportJob(exportJob) {
    const query = `
      INSERT INTO export_jobs (
        id, user_id, data_source, format, status, options, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      exportJob.id,
      exportJob.userId,
      exportJob.dataSource,
      exportJob.format,
      exportJob.status,
      JSON.stringify(exportJob.options || {}),
      JSON.stringify(exportJob.metadata || {})
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateExportJob(exportId, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE export_jobs 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [exportId, ...values]);
    return result.rows[0];
  }

  async getFileStats(filePath) {
    const fs = require('fs').promises;
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }

  generateExportId() {
    return require('uuid').v4();
  }

  generateDownloadUrl(exportId) {
    return `/export/download/${exportId}`;
  }

  calculateExpiration(hours = 24) {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + hours);
    return expiration;
  }

  // Cleanup expired exports
  async cleanupExpiredExports() {
    try {
      const result = await this.pool.query(`
        DELETE FROM export_jobs 
        WHERE expires_at < CURRENT_TIMESTAMP 
        AND status = 'completed'
      `);
      
      this.logger.info(`Cleaned up ${result.rowCount} expired exports`);
      return result.rowCount;
    } catch (error) {
      this.logger.error('Failed to cleanup expired exports:', error);
      throw error;
    }
  }

  // Get export statistics
  async getExportStatistics() {
    try {
      const [
        totalExports,
        formatStats,
        statusStats,
        timeStats
      ] = await Promise.all([
        this.getTotalExports(),
        this.getFormatStatistics(),
        this.getStatusStatistics(),
        this.getTimeStatistics()
      ]);
      
      return {
        totalExports,
        formatStats,
        statusStats,
        timeStats
      };
    } catch (error) {
      this.logger.error('Failed to get export statistics:', error);
      throw error;
    }
  }

  async getFormatStatistics() {
    const result = await this.pool.query(`
      SELECT format, COUNT(*) as count 
      FROM export_jobs 
      GROUP BY format 
      ORDER BY count DESC
    `);
    return result.rows;
  }

  async getStatusStatistics() {
    const result = await this.pool.query(`
      SELECT status, COUNT(*) as count 
      FROM export_jobs 
      GROUP BY status 
      ORDER BY count DESC
    `);
    return result.rows;
  }

  async getTimeStatistics() {
    const result = await this.pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM export_jobs 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    return result.rows;
  }
}

module.exports = IntegratedExportSystem;
