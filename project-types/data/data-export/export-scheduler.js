const cron = require('node-cron');

class ExportScheduler {
  constructor(pool, redis, logger) {
    this.pool = pool;
    this.redis = redis;
    this.logger = logger;
    this.scheduledJobs = new Map();
    this.isRunning = false;
  }

  async initialize() {
    try {
      await this.loadScheduledExports();
      this.logger.info('Export Scheduler initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Export Scheduler:', error);
      throw error;
    }
  }

  async loadScheduledExports() {
    try {
      const result = await this.pool.query(`
        SELECT * FROM export_schedules 
        WHERE is_active = true 
        AND next_run <= NOW()
      `);
      
      for (const schedule of result.rows) {
        await this.scheduleExport(schedule);
      }
      
      this.logger.info(`Loaded ${result.rows.length} scheduled exports`);
    } catch (error) {
      this.logger.error('Failed to load scheduled exports:', error);
      throw error;
    }
  }

  async scheduleExport(scheduleData, data, format, options = {}) {
    try {
      let scheduleId;
      
      if (typeof scheduleData === 'string') {
        // Schedule by expression
        scheduleId = this.generateScheduleId();
        await this.saveSchedule({
          id: scheduleId,
          userId: options.userId || 'system',
          name: options.name || 'Scheduled Export',
          description: options.description || '',
          scheduleExpression: scheduleData,
          dataSource: options.dataSource || 'manual',
          format,
          options
        });
      } else {
        // Schedule object
        scheduleId = scheduleData.id || this.generateScheduleId();
        await this.saveSchedule(scheduleData);
      }
      
      // Create cron job
      const cronJob = cron.schedule(scheduleData.scheduleExpression || scheduleData, async () => {
        await this.executeScheduledExport(scheduleId);
      }, {
        scheduled: false
      });
      
      this.scheduledJobs.set(scheduleId, cronJob);
      
      // Start the job
      cronJob.start();
      
      this.logger.info(`Scheduled export: ${scheduleId}`);
      
      return {
        scheduleId,
        nextRun: this.calculateNextRun(scheduleData.scheduleExpression || scheduleData)
      };
    } catch (error) {
      this.logger.error('Failed to schedule export:', error);
      throw error;
    }
  }

  async executeScheduledExport(scheduleId) {
    try {
      this.logger.info(`Executing scheduled export: ${scheduleId}`);
      
      // Get schedule details
      const schedule = await this.getSchedule(scheduleId);
      if (!schedule) {
        this.logger.error(`Schedule not found: ${scheduleId}`);
        return;
      }
      
      // Update last run time
      await this.updateSchedule(scheduleId, {
        lastRun: new Date(),
        nextRun: this.calculateNextRun(schedule.schedule_expression)
      });
      
      // Execute export
      const integratedExportSystem = require('./integrated-export-system');
      const exportSystem = new integratedExportSystem(this.pool, this.redis, this.logger);
      
      const result = await exportSystem.exportData(
        schedule.data || {},
        schedule.format,
        {
          ...schedule.options,
          userId: schedule.user_id,
          dataSource: schedule.data_source
        }
      );
      
      this.logger.info(`Scheduled export completed: ${scheduleId}`, result);
      
      // Store result in Redis for real-time updates
      await this.redis.setEx(
        `export:result:${scheduleId}`,
        3600, // 1 hour
        JSON.stringify(result)
      );
      
    } catch (error) {
      this.logger.error(`Scheduled export failed: ${scheduleId}`, error);
      
      // Update schedule with error
      await this.updateSchedule(scheduleId, {
        lastRun: new Date(),
        errorMessage: error.message
      });
    }
  }

  async saveSchedule(schedule) {
    const query = `
      INSERT INTO export_schedules (
        id, user_id, name, description, schedule_expression, 
        data_source, format, options, is_active, next_run
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        schedule_expression = EXCLUDED.schedule_expression,
        data_source = EXCLUDED.data_source,
        format = EXCLUDED.format,
        options = EXCLUDED.options,
        is_active = EXCLUDED.is_active,
        next_run = EXCLUDED.next_run,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [
      schedule.id,
      schedule.userId || schedule.user_id,
      schedule.name,
      schedule.description || '',
      schedule.scheduleExpression || schedule.schedule_expression,
      schedule.dataSource || schedule.data_source,
      schedule.format,
      JSON.stringify(schedule.options || {}),
      schedule.isActive !== false,
      this.calculateNextRun(schedule.scheduleExpression || schedule.schedule_expression)
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getSchedule(scheduleId) {
    const result = await this.pool.query(
      'SELECT * FROM export_schedules WHERE id = $1',
      [scheduleId]
    );
    
    return result.rows[0] || null;
  }

  async updateSchedule(scheduleId, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE export_schedules 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [scheduleId, ...values]);
    return result.rows[0];
  }

  async getSchedules(filters = {}) {
    let query = 'SELECT * FROM export_schedules WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (filters.userId) {
      query += ` AND user_id = $${++paramCount}`;
      params.push(filters.userId);
    }
    
    if (filters.isActive !== undefined) {
      query += ` AND is_active = $${++paramCount}`;
      params.push(filters.isActive);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async cancelSchedule(scheduleId) {
    try {
      // Stop cron job
      const cronJob = this.scheduledJobs.get(scheduleId);
      if (cronJob) {
        cronJob.stop();
        this.scheduledJobs.delete(scheduleId);
      }
      
      // Update database
      await this.updateSchedule(scheduleId, { isActive: false });
      
      this.logger.info(`Cancelled schedule: ${scheduleId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel schedule: ${scheduleId}`, error);
      throw error;
    }
  }

  async start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.logger.info('Export Scheduler started');
    
    // Start all scheduled jobs
    for (const [scheduleId, cronJob] of this.scheduledJobs) {
      cronJob.start();
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    // Stop all scheduled jobs
    for (const [scheduleId, cronJob] of this.scheduledJobs) {
      cronJob.stop();
    }
    
    this.logger.info('Export Scheduler stopped');
  }

  calculateNextRun(scheduleExpression) {
    try {
      // Parse cron expression to calculate next run
      const cronParser = require('cron-parser');
      const interval = cronParser.parseExpression(scheduleExpression);
      return interval.next().toDate();
    } catch (error) {
      this.logger.error('Failed to calculate next run:', error);
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to 24 hours
    }
  }

  generateScheduleId() {
    return require('uuid').v4();
  }

  // Validate cron expression
  validateCronExpression(expression) {
    try {
      const cronParser = require('cron-parser');
      cronParser.parseExpression(expression);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Get schedule statistics
  async getScheduleStatistics() {
    try {
      const [
        totalSchedules,
        activeSchedules,
        recentRuns
      ] = await Promise.all([
        this.getTotalSchedules(),
        this.getActiveSchedules(),
        this.getRecentRuns()
      ]);
      
      return {
        totalSchedules,
        activeSchedules,
        recentRuns
      };
    } catch (error) {
      this.logger.error('Failed to get schedule statistics:', error);
      throw error;
    }
  }

  async getTotalSchedules() {
    const result = await this.pool.query('SELECT COUNT(*) FROM export_schedules');
    return parseInt(result.rows[0].count);
  }

  async getActiveSchedules() {
    const result = await this.pool.query(
      'SELECT COUNT(*) FROM export_schedules WHERE is_active = true'
    );
    return parseInt(result.rows[0].count);
  }

  async getRecentRuns() {
    const result = await this.pool.query(`
      SELECT id, name, last_run, next_run, format
      FROM export_schedules 
      WHERE is_active = true 
      ORDER BY last_run DESC 
      LIMIT 10
    `);
    return result.rows;
  }
}

module.exports = ExportScheduler;
