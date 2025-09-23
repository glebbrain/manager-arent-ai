const winston = require('winston');
const Bull = require('bull');
const Agenda = require('agenda');
const _ = require('lodash');

class QueueManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/queue-manager.log' })
      ]
    });
    
    this.queues = new Map();
    this.workers = new Map();
    this.jobs = new Map();
    this.agenda = null;
    this.metrics = {
      jobsProcessed: 0,
      jobsFailed: 0,
      jobsCompleted: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0
    };
  }

  // Initialize queue manager
  async initialize(config = {}) {
    try {
      // Initialize Agenda for scheduled jobs
      if (config.mongo) {
        this.agenda = new Agenda({
          db: { address: config.mongo.uri || 'mongodb://localhost:27017/queue-manager' }
        });
        
        await this.agenda.start();
        this.logger.info('Agenda initialized successfully');
      }

      this.logger.info('Queue manager initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing queue manager:', error);
      throw error;
    }
  }

  // Create queue
  async createQueue(name, options = {}) {
    try {
      const queue = new Bull(name, {
        redis: options.redis || {
          host: 'localhost',
          port: 6379,
          password: options.password
        },
        defaultJobOptions: {
          removeOnComplete: options.removeOnComplete || 100,
          removeOnFail: options.removeOnFail || 50,
          attempts: options.attempts || 3,
          backoff: {
            type: 'exponential',
            delay: options.delay || 2000
          }
        }
      });

      // Set up event listeners
      queue.on('completed', (job) => {
        this.metrics.jobsCompleted++;
        this.metrics.jobsProcessed++;
        this.updateProcessingTime(job.processedOn - job.timestamp);
        this.logger.info('Job completed', { queueName: name, jobId: job.id });
      });

      queue.on('failed', (job, err) => {
        this.metrics.jobsFailed++;
        this.metrics.jobsProcessed++;
        this.logger.error('Job failed', { 
          queueName: name, 
          jobId: job.id, 
          error: err.message 
        });
      });

      queue.on('stalled', (job) => {
        this.logger.warn('Job stalled', { queueName: name, jobId: job.id });
      });

      const queueConfig = {
        id: this.generateId(),
        name,
        queue,
        options,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.queues.set(name, queueConfig);
      
      this.logger.info('Queue created successfully', { name });
      return queueConfig;
    } catch (error) {
      this.logger.error('Error creating queue:', error);
      throw error;
    }
  }

  // Get queue
  async getQueue(name) {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue not found: ${name}`);
    }
    return queue;
  }

  // Add job to queue
  async addJob(queueName, jobData, options = {}) {
    try {
      const queue = await this.getQueue(queueName);
      
      const job = await queue.queue.add(jobData.name || 'default', jobData.data, {
        ...options,
        jobId: options.jobId || this.generateId()
      });

      this.jobs.set(job.id, {
        id: job.id,
        queueName,
        data: jobData.data,
        options,
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      this.logger.info('Job added to queue', { 
        queueName, 
        jobId: job.id, 
        jobName: jobData.name 
      });

      return job;
    } catch (error) {
      this.logger.error('Error adding job to queue:', error);
      throw error;
    }
  }

  // Process jobs in queue
  async processQueue(queueName, processor, concurrency = 1) {
    try {
      const queue = await this.getQueue(queueName);
      
      queue.queue.process(concurrency, async (job) => {
        const startTime = Date.now();
        
        try {
          this.logger.info('Processing job', { 
            queueName, 
            jobId: job.id, 
            jobName: job.name 
          });

          const result = await processor(job);
          
          const processingTime = Date.now() - startTime;
          this.updateProcessingTime(processingTime);
          
          this.logger.info('Job processed successfully', { 
            queueName, 
            jobId: job.id, 
            processingTime 
          });

          return result;
        } catch (error) {
          this.logger.error('Error processing job:', { 
            queueName, 
            jobId: job.id, 
            error: error.message 
          });
          throw error;
        }
      });

      this.logger.info('Queue processor started', { queueName, concurrency });
    } catch (error) {
      this.logger.error('Error processing queue:', error);
      throw error;
    }
  }

  // Schedule job
  async scheduleJob(queueName, jobData, schedule, options = {}) {
    try {
      if (!this.agenda) {
        throw new Error('Agenda not initialized');
      }

      const jobName = jobData.name || 'scheduled-job';
      const job = this.agenda.create(jobName, jobData.data);
      
      // Set schedule
      if (typeof schedule === 'string') {
        job.schedule(schedule);
      } else if (schedule instanceof Date) {
        job.schedule(schedule);
      } else if (typeof schedule === 'number') {
        job.schedule(new Date(Date.now() + schedule));
      }

      // Set options
      if (options.priority) job.priority(options.priority);
      if (options.attempts) job.attempts(options.attempts);
      if (options.backoff) job.backoff(options.backoff);

      await job.save();

      this.logger.info('Job scheduled successfully', { 
        queueName, 
        jobName, 
        schedule 
      });

      return job;
    } catch (error) {
      this.logger.error('Error scheduling job:', error);
      throw error;
    }
  }

  // Get job status
  async getJobStatus(queueName, jobId) {
    try {
      const queue = await this.getQueue(queueName);
      const job = await queue.queue.getJob(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      const state = await job.getState();
      
      return {
        id: job.id,
        name: job.name,
        data: job.data,
        state,
        progress: job.progress(),
        attemptsMade: job.attemptsMade,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        createdAt: new Date(job.timestamp)
      };
    } catch (error) {
      this.logger.error('Error getting job status:', error);
      throw error;
    }
  }

  // Get queue statistics
  async getQueueStats(queueName) {
    try {
      const queue = await this.getQueue(queueName);
      const waiting = await queue.queue.getWaiting();
      const active = await queue.queue.getActive();
      const completed = await queue.queue.getCompleted();
      const failed = await queue.queue.getFailed();
      const delayed = await queue.queue.getDelayed();

      return {
        name: queueName,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length
      };
    } catch (error) {
      this.logger.error('Error getting queue stats:', error);
      throw error;
    }
  }

  // Get all queue statistics
  async getAllQueueStats() {
    const stats = [];
    for (const [queueName] of this.queues) {
      try {
        const queueStats = await this.getQueueStats(queueName);
        stats.push(queueStats);
      } catch (error) {
        this.logger.error('Error getting queue stats:', { queueName, error: error.message });
      }
    }
    return stats;
  }

  // Pause queue
  async pauseQueue(queueName) {
    try {
      const queue = await this.getQueue(queueName);
      await queue.queue.pause();
      
      this.logger.info('Queue paused', { queueName });
      return { success: true };
    } catch (error) {
      this.logger.error('Error pausing queue:', error);
      throw error;
    }
  }

  // Resume queue
  async resumeQueue(queueName) {
    try {
      const queue = await this.getQueue(queueName);
      await queue.queue.resume();
      
      this.logger.info('Queue resumed', { queueName });
      return { success: true };
    } catch (error) {
      this.logger.error('Error resuming queue:', error);
      throw error;
    }
  }

  // Clean queue
  async cleanQueue(queueName, grace = 0, status = 'completed') {
    try {
      const queue = await this.getQueue(queueName);
      await queue.queue.clean(grace, status);
      
      this.logger.info('Queue cleaned', { queueName, grace, status });
      return { success: true };
    } catch (error) {
      this.logger.error('Error cleaning queue:', error);
      throw error;
    }
  }

  // Remove job
  async removeJob(queueName, jobId) {
    try {
      const queue = await this.getQueue(queueName);
      const job = await queue.queue.getJob(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      await job.remove();
      this.jobs.delete(jobId);
      
      this.logger.info('Job removed', { queueName, jobId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error removing job:', error);
      throw error;
    }
  }

  // Retry job
  async retryJob(queueName, jobId) {
    try {
      const queue = await this.getQueue(queueName);
      const job = await queue.queue.getJob(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      await job.retry();
      
      this.logger.info('Job retried', { queueName, jobId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error retrying job:', error);
      throw error;
    }
  }

  // Get job logs
  async getJobLogs(queueName, jobId, limit = 100) {
    try {
      const queue = await this.getQueue(queueName);
      const job = await queue.queue.getJob(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      // In a real implementation, you would store logs in a database
      // For now, return mock logs
      const logs = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Job started processing',
          jobId,
          queueName
        },
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Job completed successfully',
          jobId,
          queueName
        }
      ];

      return logs.slice(-limit);
    } catch (error) {
      this.logger.error('Error getting job logs:', error);
      throw error;
    }
  }

  // Update processing time
  updateProcessingTime(processingTime) {
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / this.metrics.jobsProcessed;
  }

  // Get metrics
  async getMetrics() {
    return {
      ...this.metrics,
      queues: this.queues.size,
      activeJobs: Array.from(this.jobs.values()).filter(j => j.status === 'processing').length
    };
  }

  // Reset metrics
  async resetMetrics() {
    this.metrics = {
      jobsProcessed: 0,
      jobsFailed: 0,
      jobsCompleted: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0
    };
    
    this.logger.info('Queue metrics reset');
  }

  // Delete queue
  async deleteQueue(queueName) {
    try {
      const queue = await this.getQueue(queueName);
      
      // Close queue
      await queue.queue.close();
      
      // Remove from registry
      this.queues.delete(queueName);
      
      this.logger.info('Queue deleted', { queueName });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting queue:', error);
      throw error;
    }
  }

  // Generate unique ID
  generateId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new QueueManager();
