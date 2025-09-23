const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/data-synchronizer.log' })
  ]
});

class DataSynchronizer {
  constructor() {
    this.syncJobs = new Map();
    this.syncHistory = new Map();
    this.syncSchedules = new Map();
    this.syncRules = new Map();
    this.initializeDefaultSyncRules();
  }

  /**
   * Initialize default sync rules
   */
  initializeDefaultSyncRules() {
    const defaultRules = [
      {
        id: 'bidirectional-sync',
        name: 'Bidirectional Sync',
        description: 'Synchronize data in both directions',
        type: 'bidirectional',
        conflictResolution: 'last_modified_wins',
        enabled: true
      },
      {
        id: 'source-to-target-sync',
        name: 'Source to Target Sync',
        description: 'Synchronize data from source to target only',
        type: 'source_to_target',
        conflictResolution: 'source_wins',
        enabled: true
      },
      {
        id: 'target-to-source-sync',
        name: 'Target to Source Sync',
        description: 'Synchronize data from target to source only',
        type: 'target_to_source',
        conflictResolution: 'target_wins',
        enabled: true
      },
      {
        id: 'real-time-sync',
        name: 'Real-time Sync',
        description: 'Synchronize data in real-time using webhooks',
        type: 'realtime',
        conflictResolution: 'event_timestamp',
        enabled: true
      }
    ];

    defaultRules.forEach(rule => {
      this.syncRules.set(rule.id, rule);
    });

    logger.info('Default sync rules initialized', { 
      count: defaultRules.length 
    });
  }

  /**
   * Create sync job
   * @param {Object} syncData - Sync job data
   * @returns {Object} Created sync job
   */
  async createSyncJob(syncData) {
    try {
      const syncJobId = uuidv4();
      const syncJob = {
        id: syncJobId,
        name: syncData.name,
        description: syncData.description,
        sourceIntegration: syncData.sourceIntegration,
        targetIntegration: syncData.targetIntegration,
        syncRule: syncData.syncRule || 'bidirectional-sync',
        mapping: syncData.mapping || {},
        filters: syncData.filters || {},
        schedule: syncData.schedule || null,
        status: 'inactive',
        lastSyncAt: null,
        nextSyncAt: null,
        syncCount: 0,
        successCount: 0,
        errorCount: 0,
        lastError: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: syncData.createdBy,
        tenantId: syncData.tenantId
      };

      this.syncJobs.set(syncJobId, syncJob);

      // Schedule sync job if schedule is provided
      if (syncJob.schedule) {
        await this.scheduleSyncJob(syncJobId, syncJob.schedule);
      }

      logger.info('Sync job created', { syncJobId, name: syncJob.name });
      return syncJob;
    } catch (error) {
      logger.error('Error creating sync job:', error);
      throw error;
    }
  }

  /**
   * Get sync job by ID
   * @param {string} syncJobId - Sync job ID
   * @returns {Object|null} Sync job object or null
   */
  async getSyncJob(syncJobId) {
    try {
      return this.syncJobs.get(syncJobId) || null;
    } catch (error) {
      logger.error('Error getting sync job:', error);
      throw error;
    }
  }

  /**
   * Update sync job
   * @param {string} syncJobId - Sync job ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated sync job
   */
  async updateSyncJob(syncJobId, updateData) {
    try {
      const syncJob = await this.getSyncJob(syncJobId);
      if (!syncJob) {
        throw new Error('Sync job not found');
      }

      const updatedSyncJob = {
        ...syncJob,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.syncJobs.set(syncJobId, updatedSyncJob);

      // Reschedule if schedule changed
      if (updateData.schedule && updateData.schedule !== syncJob.schedule) {
        await this.scheduleSyncJob(syncJobId, updateData.schedule);
      }

      logger.info('Sync job updated', { syncJobId });
      return updatedSyncJob;
    } catch (error) {
      logger.error('Error updating sync job:', error);
      throw error;
    }
  }

  /**
   * Delete sync job
   * @param {string} syncJobId - Sync job ID
   * @returns {boolean} Success status
   */
  async deleteSyncJob(syncJobId) {
    try {
      const syncJob = await this.getSyncJob(syncJobId);
      if (!syncJob) {
        throw new Error('Sync job not found');
      }

      // Stop scheduled sync if active
      if (this.syncSchedules.has(syncJobId)) {
        this.syncSchedules.get(syncJobId).destroy();
        this.syncSchedules.delete(syncJobId);
      }

      this.syncJobs.delete(syncJobId);
      logger.info('Sync job deleted', { syncJobId });
      return true;
    } catch (error) {
      logger.error('Error deleting sync job:', error);
      throw error;
    }
  }

  /**
   * Start sync job
   * @param {string} syncJobId - Sync job ID
   * @returns {Object} Sync job status
   */
  async startSyncJob(syncJobId) {
    try {
      const syncJob = await this.getSyncJob(syncJobId);
      if (!syncJob) {
        throw new Error('Sync job not found');
      }

      // Update status
      await this.updateSyncJob(syncJobId, { status: 'active' });

      // Schedule sync job if schedule is provided
      if (syncJob.schedule) {
        await this.scheduleSyncJob(syncJobId, syncJob.schedule);
      }

      logger.info('Sync job started', { syncJobId });
      return {
        syncJobId,
        status: 'active',
        startedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error starting sync job:', error);
      throw error;
    }
  }

  /**
   * Stop sync job
   * @param {string} syncJobId - Sync job ID
   * @returns {Object} Sync job status
   */
  async stopSyncJob(syncJobId) {
    try {
      const syncJob = await this.getSyncJob(syncJobId);
      if (!syncJob) {
        throw new Error('Sync job not found');
      }

      // Stop scheduled sync
      if (this.syncSchedules.has(syncJobId)) {
        this.syncSchedules.get(syncJobId).destroy();
        this.syncSchedules.delete(syncJobId);
      }

      // Update status
      await this.updateSyncJob(syncJobId, { status: 'inactive' });

      logger.info('Sync job stopped', { syncJobId });
      return {
        syncJobId,
        status: 'inactive',
        stoppedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error stopping sync job:', error);
      throw error;
    }
  }

  /**
   * Schedule sync job
   * @param {string} syncJobId - Sync job ID
   * @param {string} schedule - Cron schedule
   */
  async scheduleSyncJob(syncJobId, schedule) {
    try {
      // Stop existing schedule if any
      if (this.syncSchedules.has(syncJobId)) {
        this.syncSchedules.get(syncJobId).destroy();
      }

      // Create new schedule
      const task = cron.schedule(schedule, async () => {
        try {
          await this.runSyncJob(syncJobId);
        } catch (error) {
          logger.error('Scheduled sync job error:', error);
        }
      });

      this.syncSchedules.set(syncJobId, task);

      // Calculate next sync time
      const nextSyncAt = this.calculateNextSyncTime(schedule);
      await this.updateSyncJob(syncJobId, { nextSyncAt });

      logger.info('Sync job scheduled', { syncJobId, schedule, nextSyncAt });
    } catch (error) {
      logger.error('Error scheduling sync job:', error);
      throw error;
    }
  }

  /**
   * Run sync job
   * @param {string} syncJobId - Sync job ID
   * @returns {Object} Sync result
   */
  async runSyncJob(syncJobId) {
    try {
      const syncJob = await this.getSyncJob(syncJobId);
      if (!syncJob) {
        throw new Error('Sync job not found');
      }

      if (syncJob.status !== 'active') {
        throw new Error('Sync job is not active');
      }

      const startTime = Date.now();
      
      // Update sync count
      await this.updateSyncJob(syncJobId, {
        syncCount: syncJob.syncCount + 1,
        lastSyncAt: new Date().toISOString()
      });

      // Execute sync based on sync rule
      const syncRule = this.syncRules.get(syncJob.syncRule);
      if (!syncRule) {
        throw new Error('Sync rule not found');
      }

      const result = await this.executeSync(syncJob, syncRule);

      const duration = Date.now() - startTime;

      // Update success count
      await this.updateSyncJob(syncJobId, {
        successCount: syncJob.successCount + 1
      });

      // Record sync history
      await this.recordSyncHistory(syncJobId, {
        status: 'success',
        duration,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsDeleted: result.recordsDeleted,
        errors: result.errors || []
      });

      logger.info('Sync job completed', { 
        syncJobId, 
        duration: `${duration}ms`,
        recordsProcessed: result.recordsProcessed
      });

      return {
        syncJobId,
        status: 'success',
        duration,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error running sync job:', error);
      
      // Update error count
      const syncJob = await this.getSyncJob(syncJobId);
      if (syncJob) {
        await this.updateSyncJob(syncJobId, {
          errorCount: syncJob.errorCount + 1,
          lastError: error.message
        });
      }

      // Record sync history
      await this.recordSyncHistory(syncJobId, {
        status: 'error',
        error: error.message,
        duration: 0,
        recordsProcessed: 0
      });

      throw error;
    }
  }

  /**
   * Execute sync based on sync rule
   * @param {Object} syncJob - Sync job object
   * @param {Object} syncRule - Sync rule object
   * @returns {Object} Sync result
   */
  async executeSync(syncJob, syncRule) {
    try {
      switch (syncRule.type) {
        case 'bidirectional':
          return await this.executeBidirectionalSync(syncJob);
        case 'source_to_target':
          return await this.executeSourceToTargetSync(syncJob);
        case 'target_to_source':
          return await this.executeTargetToSourceSync(syncJob);
        case 'realtime':
          return await this.executeRealtimeSync(syncJob);
        default:
          throw new Error(`Unsupported sync type: ${syncRule.type}`);
      }
    } catch (error) {
      logger.error('Error executing sync:', error);
      throw error;
    }
  }

  /**
   * Execute bidirectional sync
   * @param {Object} syncJob - Sync job object
   * @returns {Object} Sync result
   */
  async executeBidirectionalSync(syncJob) {
    // Mock bidirectional sync execution
    const recordsProcessed = Math.floor(Math.random() * 100);
    const recordsCreated = Math.floor(recordsProcessed * 0.3);
    const recordsUpdated = Math.floor(recordsProcessed * 0.5);
    const recordsDeleted = Math.floor(recordsProcessed * 0.2);

    return {
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsDeleted,
      errors: []
    };
  }

  /**
   * Execute source to target sync
   * @param {Object} syncJob - Sync job object
   * @returns {Object} Sync result
   */
  async executeSourceToTargetSync(syncJob) {
    // Mock source to target sync execution
    const recordsProcessed = Math.floor(Math.random() * 50);
    const recordsCreated = Math.floor(recordsProcessed * 0.4);
    const recordsUpdated = Math.floor(recordsProcessed * 0.6);

    return {
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsDeleted: 0,
      errors: []
    };
  }

  /**
   * Execute target to source sync
   * @param {Object} syncJob - Sync job object
   * @returns {Object} Sync result
   */
  async executeTargetToSourceSync(syncJob) {
    // Mock target to source sync execution
    const recordsProcessed = Math.floor(Math.random() * 50);
    const recordsCreated = Math.floor(recordsProcessed * 0.4);
    const recordsUpdated = Math.floor(recordsProcessed * 0.6);

    return {
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsDeleted: 0,
      errors: []
    };
  }

  /**
   * Execute realtime sync
   * @param {Object} syncJob - Sync job object
   * @returns {Object} Sync result
   */
  async executeRealtimeSync(syncJob) {
    // Mock realtime sync execution
    const recordsProcessed = Math.floor(Math.random() * 10);
    const recordsCreated = Math.floor(recordsProcessed * 0.5);
    const recordsUpdated = Math.floor(recordsProcessed * 0.5);

    return {
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsDeleted: 0,
      errors: []
    };
  }

  /**
   * Record sync history
   * @param {string} syncJobId - Sync job ID
   * @param {Object} historyData - History data
   */
  async recordSyncHistory(syncJobId, historyData) {
    try {
      const historyId = uuidv4();
      const history = {
        id: historyId,
        syncJobId,
        ...historyData,
        timestamp: new Date().toISOString()
      };

      if (!this.syncHistory.has(syncJobId)) {
        this.syncHistory.set(syncJobId, []);
      }

      this.syncHistory.get(syncJobId).push(history);

      // Keep only last 100 history records per sync job
      const histories = this.syncHistory.get(syncJobId);
      if (histories.length > 100) {
        histories.splice(0, histories.length - 100);
      }

      logger.info('Sync history recorded', { syncJobId, historyId, status: historyData.status });
    } catch (error) {
      logger.error('Error recording sync history:', error);
    }
  }

  /**
   * Get sync history
   * @param {string} syncJobId - Sync job ID
   * @param {Object} filters - Filter options
   * @returns {Array} Sync history
   */
  async getSyncHistory(syncJobId, filters = {}) {
    try {
      let histories = this.syncHistory.get(syncJobId) || [];

      // Apply filters
      if (filters.status) {
        histories = histories.filter(history => history.status === filters.status);
      }
      if (filters.fromDate) {
        histories = histories.filter(history => 
          new Date(history.timestamp) >= new Date(filters.fromDate)
        );
      }
      if (filters.toDate) {
        histories = histories.filter(history => 
          new Date(history.timestamp) <= new Date(filters.toDate)
        );
      }

      // Sort by timestamp (newest first)
      histories.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return histories;
    } catch (error) {
      logger.error('Error getting sync history:', error);
      return [];
    }
  }

  /**
   * Run scheduled syncs
   */
  async runScheduledSyncs() {
    try {
      const activeSyncJobs = Array.from(this.syncJobs.values())
        .filter(job => job.status === 'active' && job.schedule);

      for (const syncJob of activeSyncJobs) {
        try {
          await this.runSyncJob(syncJob.id);
        } catch (error) {
          logger.error('Scheduled sync error:', error);
        }
      }

      logger.info('Scheduled syncs completed', { count: activeSyncJobs.length });
    } catch (error) {
      logger.error('Error running scheduled syncs:', error);
    }
  }

  /**
   * Calculate next sync time
   * @param {string} schedule - Cron schedule
   * @returns {string} Next sync time
   */
  calculateNextSyncTime(schedule) {
    // This is a simplified version - in real implementation,
    // you would use a proper cron parser
    const now = new Date();
    const nextSync = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    return nextSync.toISOString();
  }

  /**
   * List sync jobs
   * @param {Object} filters - Filter options
   * @returns {Object} List of sync jobs
   */
  async listSyncJobs(filters = {}) {
    try {
      let syncJobs = Array.from(this.syncJobs.values());

      // Apply filters
      if (filters.tenantId) {
        syncJobs = syncJobs.filter(job => job.tenantId === filters.tenantId);
      }
      if (filters.status) {
        syncJobs = syncJobs.filter(job => job.status === filters.status);
      }
      if (filters.syncRule) {
        syncJobs = syncJobs.filter(job => job.syncRule === filters.syncRule);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        syncJobs: syncJobs.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: syncJobs.length,
          pages: Math.ceil(syncJobs.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error listing sync jobs:', error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   * @returns {Object} Sync statistics
   */
  getSyncStats() {
    const totalSyncJobs = this.syncJobs.size;
    const activeSyncJobs = Array.from(this.syncJobs.values())
      .filter(job => job.status === 'active').length;

    const totalSyncs = Array.from(this.syncJobs.values())
      .reduce((sum, job) => sum + job.syncCount, 0);

    const totalSuccesses = Array.from(this.syncJobs.values())
      .reduce((sum, job) => sum + job.successCount, 0);

    const totalErrors = Array.from(this.syncJobs.values())
      .reduce((sum, job) => sum + job.errorCount, 0);

    return {
      totalSyncJobs,
      activeSyncJobs,
      totalSyncs,
      totalSuccesses,
      totalErrors,
      successRate: totalSyncs > 0 ? (totalSuccesses / totalSyncs * 100).toFixed(2) : 0
    };
  }
}

module.exports = new DataSynchronizer();
