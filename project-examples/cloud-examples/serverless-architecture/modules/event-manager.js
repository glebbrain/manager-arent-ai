const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class EventManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/event-manager.log' })
      ]
    });
    
    this.events = new Map();
    this.eventTypes = new Map();
    this.eventSources = new Map();
    this.eventHandlers = new Map();
    this.metrics = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      averageProcessingTime: 0,
      eventsPerSecond: 0
    };
  }

  // Initialize event manager
  async initialize() {
    try {
      this.initializeEventTypes();
      this.initializeEventSources();
      this.initializeEventHandlers();
      
      this.logger.info('Event manager initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing event manager:', error);
      throw error;
    }
  }

  // Initialize event types
  initializeEventTypes() {
    this.eventTypes.set('http', {
      name: 'HTTP Event',
      description: 'HTTP request event',
      source: 'api-gateway',
      payload: {
        method: 'string',
        path: 'string',
        headers: 'object',
        body: 'any',
        queryStringParameters: 'object'
      },
      retryable: false
    });

    this.eventTypes.set('s3', {
      name: 'S3 Event',
      description: 'S3 bucket event',
      source: 's3',
      payload: {
        bucket: 'string',
        key: 'string',
        eventName: 'string',
        eventTime: 'string',
        size: 'number'
      },
      retryable: true
    });

    this.eventTypes.set('schedule', {
      name: 'Schedule Event',
      description: 'Scheduled event',
      source: 'cloudwatch-events',
      payload: {
        source: 'string',
        time: 'string',
        region: 'string'
      },
      retryable: false
    });

    this.eventTypes.set('sns', {
      name: 'SNS Event',
      description: 'SNS notification event',
      source: 'sns',
      payload: {
        Type: 'string',
        MessageId: 'string',
        TopicArn: 'string',
        Subject: 'string',
        Message: 'string'
      },
      retryable: true
    });

    this.eventTypes.set('sqs', {
      name: 'SQS Event',
      description: 'SQS message event',
      source: 'sqs',
      payload: {
        Records: 'array'
      },
      retryable: true
    });

    this.eventTypes.set('dynamodb', {
      name: 'DynamoDB Event',
      description: 'DynamoDB stream event',
      source: 'dynamodb',
      payload: {
        Records: 'array'
      },
      retryable: true
    });
  }

  // Initialize event sources
  initializeEventSources() {
    this.eventSources.set('api-gateway', {
      name: 'API Gateway',
      description: 'Amazon API Gateway',
      type: 'http',
      configuration: {
        restApiId: 'string',
        stage: 'string',
        resourceId: 'string',
        httpMethod: 'string'
      }
    });

    this.eventSources.set('s3', {
      name: 'Amazon S3',
      description: 'Amazon Simple Storage Service',
      type: 's3',
      configuration: {
        bucket: 'string',
        event: 'string',
        filter: 'object'
      }
    });

    this.eventSources.set('cloudwatch-events', {
      name: 'CloudWatch Events',
      description: 'Amazon CloudWatch Events',
      type: 'schedule',
      configuration: {
        schedule: 'string',
        timezone: 'string'
      }
    });

    this.eventSources.set('sns', {
      name: 'Amazon SNS',
      description: 'Amazon Simple Notification Service',
      type: 'sns',
      configuration: {
        topicArn: 'string',
        filterPolicy: 'object'
      }
    });

    this.eventSources.set('sqs', {
      name: 'Amazon SQS',
      description: 'Amazon Simple Queue Service',
      type: 'sqs',
      configuration: {
        queueUrl: 'string',
        batchSize: 'number',
        maximumBatchingWindowInSeconds: 'number'
      }
    });

    this.eventSources.set('dynamodb', {
      name: 'Amazon DynamoDB',
      description: 'Amazon DynamoDB Streams',
      type: 'dynamodb',
      configuration: {
        streamArn: 'string',
        startingPosition: 'string',
        batchSize: 'number'
      }
    });
  }

  // Initialize event handlers
  initializeEventHandlers() {
    this.eventHandlers.set('default', {
      name: 'Default Handler',
      description: 'Default event handler',
      functionId: null,
      timeout: 30,
      retryAttempts: 3,
      retryDelay: 1000,
      deadLetterQueue: null
    });
  }

  // Create event
  async createEvent(config) {
    try {
      const event = {
        id: this.generateId(),
        type: config.type,
        source: config.source,
        payload: config.payload || {},
        status: 'pending',
        priority: config.priority || 'normal',
        retryCount: 0,
        maxRetries: config.maxRetries || 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        processedAt: null,
        error: null,
        result: null
      };

      this.events.set(event.id, event);
      this.metrics.totalEvents++;

      this.logger.info('Event created successfully', {
        id: event.id,
        type: event.type,
        source: event.source
      });

      return event;
    } catch (error) {
      this.logger.error('Error creating event:', error);
      throw error;
    }
  }

  // Process event
  async processEvent(eventId, handlerId = 'default') {
    try {
      const event = this.events.get(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const handler = this.eventHandlers.get(handlerId);
      if (!handler) {
        throw new Error('Handler not found');
      }

      event.status = 'processing';
      event.updatedAt = new Date();

      this.events.set(eventId, event);

      // Simulate event processing
      const processingTime = Math.random() * 2000 + 500; // 500-2500ms
      const isError = Math.random() < 0.1; // 10% error rate

      setTimeout(() => {
        if (isError) {
          event.status = 'failed';
          event.error = 'Simulated processing error';
          event.retryCount++;
          this.metrics.failedEvents++;

          // Retry if within limits
          if (event.retryCount < event.maxRetries) {
            setTimeout(() => {
              this.processEvent(eventId, handlerId);
            }, handler.retryDelay * event.retryCount);
          }
        } else {
          event.status = 'processed';
          event.result = { message: 'Event processed successfully' };
          event.processedAt = new Date();
          this.metrics.processedEvents++;
        }

        event.updatedAt = new Date();
        this.events.set(eventId, event);

        // Update metrics
        this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime + processingTime) / 2;
      }, processingTime);

      this.logger.info('Event processing started', {
        eventId,
        handlerId,
        processingTime
      });

      return event;
    } catch (error) {
      this.logger.error('Error processing event:', error);
      throw error;
    }
  }

  // Create event handler
  async createEventHandler(config) {
    try {
      const handler = {
        id: this.generateId(),
        name: config.name,
        description: config.description || '',
        functionId: config.functionId,
        eventTypes: config.eventTypes || [],
        timeout: config.timeout || 30,
        retryAttempts: config.retryAttempts || 3,
        retryDelay: config.retryDelay || 1000,
        deadLetterQueue: config.deadLetterQueue || null,
        status: 'active',
        createdBy: config.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.eventHandlers.set(handler.id, handler);

      this.logger.info('Event handler created successfully', {
        id: handler.id,
        name: handler.name,
        functionId: handler.functionId
      });

      return handler;
    } catch (error) {
      this.logger.error('Error creating event handler:', error);
      throw error;
    }
  }

  // Update event handler
  async updateEventHandler(handlerId, updates) {
    try {
      const handler = this.eventHandlers.get(handlerId);
      if (!handler) {
        throw new Error('Handler not found');
      }

      Object.assign(handler, updates);
      handler.updatedAt = new Date();

      this.eventHandlers.set(handlerId, handler);

      this.logger.info('Event handler updated successfully', { handlerId });
      return handler;
    } catch (error) {
      this.logger.error('Error updating event handler:', error);
      throw error;
    }
  }

  // Delete event handler
  async deleteEventHandler(handlerId) {
    try {
      const handler = this.eventHandlers.get(handlerId);
      if (!handler) {
        throw new Error('Handler not found');
      }

      this.eventHandlers.delete(handlerId);

      this.logger.info('Event handler deleted successfully', { handlerId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting event handler:', error);
      throw error;
    }
  }

  // Get event
  async getEvent(id) {
    const event = this.events.get(id);
    if (!event) {
      throw new Error('Event not found');
    }
    return event;
  }

  // List events
  async listEvents(filters = {}) {
    let events = Array.from(this.events.values());
    
    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }
    
    if (filters.source) {
      events = events.filter(e => e.source === filters.source);
    }
    
    if (filters.status) {
      events = events.filter(e => e.status === filters.status);
    }
    
    if (filters.priority) {
      events = events.filter(e => e.priority === filters.priority);
    }
    
    return events.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get event types
  async getEventTypes() {
    return Array.from(this.eventTypes.values());
  }

  // Get event sources
  async getEventSources() {
    return Array.from(this.eventSources.values());
  }

  // Get event handlers
  async getEventHandlers() {
    return Array.from(this.eventHandlers.values());
  }

  // Get metrics
  async getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalEvents > 0 ? 
        (this.metrics.processedEvents / this.metrics.totalEvents) * 100 : 0,
      failureRate: this.metrics.totalEvents > 0 ? 
        (this.metrics.failedEvents / this.metrics.totalEvents) * 100 : 0
    };
  }

  // Generate unique ID
  generateId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new EventManager();
