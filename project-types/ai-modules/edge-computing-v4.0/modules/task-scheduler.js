const EventEmitter = require('events');
const cron = require('node-cron');
const logger = require('./logger');

class TaskScheduler extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.tasks = new Map();
    this.schedules = new Map();
    this.executors = new Map();
    this.config = {
      maxTasks: 10000,
      maxConcurrentTasks: 100,
      taskTimeout: 300000, // 5 minutes
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
      priorityLevels: ['low', 'normal', 'high', 'critical'],
      schedulingStrategies: ['fifo', 'priority', 'deadline', 'resource_based']
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Task Scheduler...');
      
      // Initialize task queue
      await this.initializeTaskQueue();
      
      // Initialize executors
      await this.initializeExecutors();
      
      // Initialize scheduling strategies
      await this.initializeSchedulingStrategies();
      
      // Initialize task monitoring
      await this.initializeTaskMonitoring();
      
      this.isInitialized = true;
      logger.info('Task Scheduler initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Task Scheduler:', error);
      throw error;
    }
  }

  async initializeTaskQueue() {
    this.taskQueue = {
      pending: [],
      running: new Map(),
      completed: [],
      failed: [],
      paused: false
    };
    
    logger.info('Task queue initialized');
  }

  async initializeExecutors() {
    this.executors.set('local', {
      name: 'Local Executor',
      type: 'local',
      maxConcurrentTasks: 10,
      capabilities: ['compute', 'storage', 'network']
    });
    
    this.executors.set('edge', {
      name: 'Edge Executor',
      type: 'edge',
      maxConcurrentTasks: 50,
      capabilities: ['compute', 'storage', 'network', 'iot']
    });
    
    this.executors.set('cloud', {
      name: 'Cloud Executor',
      type: 'cloud',
      maxConcurrentTasks: 100,
      capabilities: ['compute', 'storage', 'network', 'ai', 'ml']
    });
    
    logger.info(`Initialized ${this.executors.size} executors`);
  }

  async initializeSchedulingStrategies() {
    this.strategies = {
      fifo: this.fifoStrategy.bind(this),
      priority: this.priorityStrategy.bind(this),
      deadline: this.deadlineStrategy.bind(this),
      resource_based: this.resourceBasedStrategy.bind(this)
    };
    
    logger.info(`Initialized ${Object.keys(this.strategies).length} scheduling strategies`);
  }

  async initializeTaskMonitoring() {
    this.monitoring = {
      active: true,
      interval: setInterval(() => {
        this.monitorTasks();
      }, 10000), // Check every 10 seconds
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        runningTasks: 0,
        averageExecutionTime: 0,
        throughput: 0
      }
    };
    
    logger.info('Task monitoring initialized');
  }

  // Task Management
  async createTask(taskInfo) {
    try {
      const taskId = taskInfo.id || this.generateTaskId();
      
      const task = {
        id: taskId,
        name: taskInfo.name || `Task-${taskId}`,
        type: taskInfo.type || 'compute',
        priority: taskInfo.priority || 'normal',
        executor: taskInfo.executor || 'local',
        function: taskInfo.function || null,
        parameters: taskInfo.parameters || {},
        resources: taskInfo.resources || {},
        deadline: taskInfo.deadline || null,
        retries: taskInfo.retries || this.config.retryAttempts,
        timeout: taskInfo.timeout || this.config.taskTimeout,
        status: 'pending',
        created: new Date(),
        started: null,
        completed: null,
        result: null,
        error: null,
        metadata: taskInfo.metadata || {}
      };
      
      // Validate task
      this.validateTask(task);
      
      this.tasks.set(taskId, task);
      this.taskQueue.pending.push(task);
      
      this.emit('taskCreated', task);
      logger.info(`Task ${taskId} created successfully`);
      
      return task;
    } catch (error) {
      logger.error(`Failed to create task:`, error);
      throw error;
    }
  }

  async scheduleTask(taskId, schedule) {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      const scheduleId = `schedule_${taskId}_${Date.now()}`;
      
      const taskSchedule = {
        id: scheduleId,
        taskId,
        cron: schedule.cron || null,
        interval: schedule.interval || null,
        startTime: schedule.startTime || new Date(),
        endTime: schedule.endTime || null,
        enabled: schedule.enabled !== false,
        created: new Date()
      };
      
      this.schedules.set(scheduleId, taskSchedule);
      
      // Start cron job if cron expression is provided
      if (taskSchedule.cron) {
        const cronJob = cron.schedule(taskSchedule.cron, async () => {
          await this.executeTask(taskId);
        }, {
          scheduled: taskSchedule.enabled
        });
        
        taskSchedule.cronJob = cronJob;
      }
      
      // Start interval if interval is provided
      if (taskSchedule.interval) {
        const intervalId = setInterval(async () => {
          await this.executeTask(taskId);
        }, taskSchedule.interval);
        
        taskSchedule.intervalId = intervalId;
      }
      
      this.emit('taskScheduled', { taskId, scheduleId, schedule: taskSchedule });
      logger.info(`Task ${taskId} scheduled successfully`);
      
      return taskSchedule;
    } catch (error) {
      logger.error(`Failed to schedule task ${taskId}:`, error);
      throw error;
    }
  }

  async executeTask(taskId) {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      if (task.status !== 'pending') {
        throw new Error(`Task ${taskId} is not in pending status`);
      }
      
      // Check if we can execute the task
      if (this.taskQueue.running.size >= this.config.maxConcurrentTasks) {
        throw new Error('Maximum concurrent tasks reached');
      }
      
      // Update task status
      task.status = 'running';
      task.started = new Date();
      
      // Move to running queue
      this.taskQueue.running.set(taskId, task);
      
      // Remove from pending queue
      const pendingIndex = this.taskQueue.pending.findIndex(t => t.id === taskId);
      if (pendingIndex !== -1) {
        this.taskQueue.pending.splice(pendingIndex, 1);
      }
      
      this.emit('taskStarted', task);
      logger.info(`Task ${taskId} started execution`);
      
      // Execute task
      try {
        const result = await this.runTask(task);
        
        // Task completed successfully
        task.status = 'completed';
        task.completed = new Date();
        task.result = result;
        
        // Move to completed queue
        this.taskQueue.completed.push(task);
        this.taskQueue.running.delete(taskId);
        
        this.emit('taskCompleted', task);
        logger.info(`Task ${taskId} completed successfully`);
        
        return result;
      } catch (error) {
        // Task failed
        task.status = 'failed';
        task.completed = new Date();
        task.error = error.message;
        
        // Move to failed queue
        this.taskQueue.failed.push(task);
        this.taskQueue.running.delete(taskId);
        
        this.emit('taskFailed', { task, error });
        logger.error(`Task ${taskId} failed:`, error);
        
        throw error;
      }
    } catch (error) {
      logger.error(`Failed to execute task ${taskId}:`, error);
      throw error;
    }
  }

  async runTask(task) {
    // Set timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out after ${task.timeout}ms`));
      }, task.timeout);
    });
    
    // Execute task function
    const taskPromise = this.executeTaskFunction(task);
    
    // Race between task execution and timeout
    return Promise.race([taskPromise, timeoutPromise]);
  }

  async executeTaskFunction(task) {
    // This is where the actual task execution would happen
    // For now, we'll simulate task execution
    
    switch (task.type) {
      case 'compute':
        return await this.executeComputeTask(task);
      case 'data_processing':
        return await this.executeDataProcessingTask(task);
      case 'ai_inference':
        return await this.executeAIInferenceTask(task);
      case 'iot_command':
        return await this.executeIoTCommandTask(task);
      case 'network_request':
        return await this.executeNetworkRequestTask(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  async executeComputeTask(task) {
    // Simulate compute task
    const duration = Math.random() * 5000 + 1000; // 1-6 seconds
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      type: 'compute',
      duration,
      result: Math.random() * 100,
      timestamp: new Date().toISOString()
    };
  }

  async executeDataProcessingTask(task) {
    // Simulate data processing task
    const duration = Math.random() * 3000 + 500; // 0.5-3.5 seconds
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      type: 'data_processing',
      duration,
      recordsProcessed: Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString()
    };
  }

  async executeAIInferenceTask(task) {
    // Simulate AI inference task
    const duration = Math.random() * 10000 + 2000; // 2-12 seconds
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      type: 'ai_inference',
      duration,
      confidence: Math.random(),
      prediction: Math.random() > 0.5 ? 'positive' : 'negative',
      timestamp: new Date().toISOString()
    };
  }

  async executeIoTCommandTask(task) {
    // Simulate IoT command task
    const duration = Math.random() * 2000 + 500; // 0.5-2.5 seconds
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      type: 'iot_command',
      duration,
      deviceId: task.parameters.deviceId || 'unknown',
      command: task.parameters.command || 'status',
      timestamp: new Date().toISOString()
    };
  }

  async executeNetworkRequestTask(task) {
    // Simulate network request task
    const duration = Math.random() * 5000 + 1000; // 1-6 seconds
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      type: 'network_request',
      duration,
      url: task.parameters.url || 'http://example.com',
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  // Scheduling Strategies
  fifoStrategy() {
    // First In, First Out
    return this.taskQueue.pending[0];
  }

  priorityStrategy() {
    // Priority-based scheduling
    const priorityOrder = ['critical', 'high', 'normal', 'low'];
    
    for (const priority of priorityOrder) {
      const task = this.taskQueue.pending.find(t => t.priority === priority);
      if (task) return task;
    }
    
    return this.taskQueue.pending[0];
  }

  deadlineStrategy() {
    // Deadline-based scheduling
    const tasksWithDeadline = this.taskQueue.pending.filter(t => t.deadline);
    
    if (tasksWithDeadline.length === 0) {
      return this.taskQueue.pending[0];
    }
    
    return tasksWithDeadline.reduce((earliest, task) => {
      return new Date(task.deadline) < new Date(earliest.deadline) ? task : earliest;
    });
  }

  resourceBasedStrategy() {
    // Resource-based scheduling
    // This is a simplified implementation
    return this.taskQueue.pending.find(task => {
      const executor = this.executors.get(task.executor);
      return executor && executor.maxConcurrentTasks > this.getRunningTasksForExecutor(task.executor);
    }) || this.taskQueue.pending[0];
  }

  getRunningTasksForExecutor(executorType) {
    return Array.from(this.taskQueue.running.values()).filter(task => task.executor === executorType).length;
  }

  // Task Monitoring
  async monitorTasks() {
    try {
      // Check for timed out tasks
      for (const [taskId, task] of this.taskQueue.running) {
        if (task.started && (new Date() - task.started) > task.timeout) {
          await this.handleTaskTimeout(taskId);
        }
      }
      
      // Update metrics
      this.updateMetrics();
      
      // Process pending tasks
      await this.processPendingTasks();
    } catch (error) {
      logger.error('Task monitoring failed:', error);
    }
  }

  async handleTaskTimeout(taskId) {
    const task = this.taskQueue.running.get(taskId);
    if (!task) return;
    
    task.status = 'failed';
    task.completed = new Date();
    task.error = 'Task timed out';
    
    this.taskQueue.running.delete(taskId);
    this.taskQueue.failed.push(task);
    
    this.emit('taskTimeout', task);
    logger.warn(`Task ${taskId} timed out`);
  }

  updateMetrics() {
    const metrics = this.monitoring.metrics;
    
    metrics.totalTasks = this.tasks.size;
    metrics.completedTasks = this.taskQueue.completed.length;
    metrics.failedTasks = this.taskQueue.failed.length;
    metrics.runningTasks = this.taskQueue.running.size;
    
    // Calculate average execution time
    const completedTasks = this.taskQueue.completed;
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        if (task.started && task.completed) {
          return sum + (task.completed - task.started);
        }
        return sum;
      }, 0);
      
      metrics.averageExecutionTime = totalTime / completedTasks.length;
    }
    
    // Calculate throughput (tasks per minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now - 60000);
    const recentCompleted = completedTasks.filter(task => 
      task.completed && task.completed > oneMinuteAgo
    );
    
    metrics.throughput = recentCompleted.length;
  }

  async processPendingTasks() {
    if (this.taskQueue.paused) return;
    
    const strategy = this.config.schedulingStrategies[0]; // Use first strategy by default
    const nextTask = this.strategies[strategy]();
    
    if (nextTask && this.taskQueue.running.size < this.config.maxConcurrentTasks) {
      await this.executeTask(nextTask.id);
    }
  }

  // Task Control
  async pauseTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    if (task.status === 'running') {
      // Stop the running task
      this.taskQueue.running.delete(taskId);
      task.status = 'paused';
      this.taskQueue.pending.push(task);
    }
    
    this.emit('taskPaused', task);
    logger.info(`Task ${taskId} paused`);
  }

  async resumeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    if (task.status === 'paused') {
      task.status = 'pending';
      // Task will be picked up by the scheduler
    }
    
    this.emit('taskResumed', task);
    logger.info(`Task ${taskId} resumed`);
  }

  async cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    if (task.status === 'running') {
      this.taskQueue.running.delete(taskId);
    } else if (task.status === 'pending') {
      const pendingIndex = this.taskQueue.pending.findIndex(t => t.id === taskId);
      if (pendingIndex !== -1) {
        this.taskQueue.pending.splice(pendingIndex, 1);
      }
    }
    
    task.status = 'cancelled';
    task.completed = new Date();
    
    this.emit('taskCancelled', task);
    logger.info(`Task ${taskId} cancelled`);
  }

  async pauseScheduler() {
    this.taskQueue.paused = true;
    this.emit('schedulerPaused');
    logger.info('Task scheduler paused');
  }

  async resumeScheduler() {
    this.taskQueue.paused = false;
    this.emit('schedulerResumed');
    logger.info('Task scheduler resumed');
  }

  // Utility Functions
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateTask(task) {
    if (!task.name) {
      throw new Error('Task name is required');
    }
    
    if (!this.config.priorityLevels.includes(task.priority)) {
      throw new Error(`Invalid priority level: ${task.priority}`);
    }
    
    if (!this.executors.has(task.executor)) {
      throw new Error(`Invalid executor: ${task.executor}`);
    }
  }

  // Statistics
  getStatistics() {
    const metrics = this.monitoring.metrics;
    
    return {
      total: metrics.totalTasks,
      pending: this.taskQueue.pending.length,
      running: metrics.runningTasks,
      completed: metrics.completedTasks,
      failed: metrics.failedTasks,
      averageExecutionTime: metrics.averageExecutionTime,
      throughput: metrics.throughput,
      paused: this.taskQueue.paused
    };
  }

  // Health Check
  async healthCheck() {
    try {
      const status = {
        initialized: this.isInitialized,
        tasks: this.tasks.size,
        schedules: this.schedules.size,
        executors: this.executors.size,
        monitoring: this.monitoring?.active || false,
        statistics: this.getStatistics(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      };

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: status
      };
    } catch (error) {
      logger.error('Task Scheduler health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Cleanup
  async cleanup() {
    try {
      logger.info('Cleaning up Task Scheduler...');
      
      // Stop all cron jobs
      for (const [scheduleId, schedule] of this.schedules) {
        if (schedule.cronJob) {
          schedule.cronJob.stop();
        }
        if (schedule.intervalId) {
          clearInterval(schedule.intervalId);
        }
      }
      
      // Stop monitoring
      if (this.monitoring?.interval) {
        clearInterval(this.monitoring.interval);
      }
      
      this.tasks.clear();
      this.schedules.clear();
      this.executors.clear();
      this.taskQueue.pending = [];
      this.taskQueue.running.clear();
      this.taskQueue.completed = [];
      this.taskQueue.failed = [];
      
      this.isInitialized = false;
      
      logger.info('Task Scheduler cleanup completed');
    } catch (error) {
      logger.error('Task Scheduler cleanup failed:', error);
    }
  }
}

module.exports = new TaskScheduler();
