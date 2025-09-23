const WebSocket = require('ws');
const EventEmitter = require('events');
const logger = require('./logger');

class RealTimeProcessor extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.connections = new Map();
    this.streams = new Map();
    this.config = {
      port: process.env.WS_PORT || 8080,
      maxConnections: 1000,
      heartbeatInterval: 30000,
      maxMessageSize: 1024 * 1024, // 1MB
      supportedProtocols: ['text', 'binary', 'json'],
      rateLimiting: {
        enabled: true,
        maxRequestsPerMinute: 100,
        maxRequestsPerHour: 1000
      }
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Real-time Processor...');
      
      // Initialize WebSocket server
      await this.initializeWebSocketServer();
      
      // Initialize rate limiting
      await this.initializeRateLimiting();
      
      // Initialize heartbeat system
      await this.initializeHeartbeat();
      
      this.isInitialized = true;
      logger.info('Real-time Processor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Real-time Processor:', error);
      throw error;
    }
  }

  async initializeWebSocketServer() {
    this.wss = new WebSocket.Server({
      port: this.config.port,
      maxPayload: this.config.maxMessageSize,
      perMessageDeflate: false
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });

    logger.info(`WebSocket server started on port ${this.config.port}`);
  }

  async initializeRateLimiting() {
    this.rateLimits = new Map();
    
    // Clean up rate limits every minute
    setInterval(() => {
      this.cleanupRateLimits();
    }, 60000);
  }

  async initializeHeartbeat() {
    setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  handleConnection(ws, req) {
    const connectionId = this.generateConnectionId();
    const clientIP = req.socket.remoteAddress;
    
    // Check rate limiting
    if (this.isRateLimited(clientIP)) {
      ws.close(1008, 'Rate limit exceeded');
      return;
    }

    const connection = {
      id: connectionId,
      ws,
      ip: clientIP,
      connectedAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      isAlive: true
    };

    this.connections.set(connectionId, connection);
    logger.info(`New connection established: ${connectionId} from ${clientIP}`);

    // Set up connection event handlers
    ws.on('message', (data) => {
      this.handleMessage(connectionId, data);
    });

    ws.on('close', (code, reason) => {
      this.handleDisconnection(connectionId, code, reason);
    });

    ws.on('error', (error) => {
      this.handleError(connectionId, error);
    });

    ws.on('pong', () => {
      const connection = this.connections.get(connectionId);
      if (connection) {
        connection.isAlive = true;
        connection.lastActivity = new Date();
      }
    });

    // Send welcome message
    this.sendMessage(connectionId, {
      type: 'welcome',
      connectionId,
      timestamp: new Date().toISOString(),
      capabilities: this.getCapabilities()
    });
  }

  handleMessage(connectionId, data) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return;
      }

      connection.lastActivity = new Date();
      connection.messageCount++;

      // Update rate limiting
      this.updateRateLimit(connection.ip);

      let message;
      try {
        message = JSON.parse(data);
      } catch (error) {
        // Handle binary or non-JSON messages
        message = {
          type: 'binary',
          data: data,
          size: data.length
        };
      }

      // Process message based on type
      this.processMessage(connectionId, message);
    } catch (error) {
      logger.error(`Error handling message from ${connectionId}:`, error);
      this.sendError(connectionId, 'Message processing failed');
    }
  }

  async processMessage(connectionId, message) {
    const { type, data, requestId } = message;

    try {
      let result;
      switch (type) {
        case 'ping':
          result = await this.handlePing(connectionId, data);
          break;
        case 'ai_request':
          result = await this.handleAIRequest(connectionId, data);
          break;
        case 'stream_request':
          result = await this.handleStreamRequest(connectionId, data);
          break;
        case 'subscribe':
          result = await this.handleSubscribe(connectionId, data);
          break;
        case 'unsubscribe':
          result = await this.handleUnsubscribe(connectionId, data);
          break;
        case 'get_status':
          result = await this.handleGetStatus(connectionId, data);
          break;
        case 'get_connections':
          result = await this.handleGetConnections(connectionId, data);
          break;
        default:
          result = {
            type: 'error',
            error: 'Unknown message type',
            requestId
          };
      }

      this.sendMessage(connectionId, {
        ...result,
        requestId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error processing message from ${connectionId}:`, error);
      this.sendError(connectionId, error.message, requestId);
    }
  }

  async handlePing(connectionId, data) {
    return {
      type: 'pong',
      data: data || 'pong',
      timestamp: new Date().toISOString()
    };
  }

  async handleAIRequest(connectionId, data) {
    const { operation, input, options = {} } = data;
    
    // This would integrate with the AI engine
    const result = {
      operation,
      input,
      result: `AI processing result for ${operation}`,
      timestamp: new Date().toISOString()
    };

    return {
      type: 'ai_response',
      data: result
    };
  }

  async handleStreamRequest(connectionId, data) {
    const { streamId, operation, input, options = {} } = data;
    
    // Create or get stream
    const stream = this.getOrCreateStream(streamId, {
      connectionId,
      operation,
      input,
      options
    });

    // Start streaming
    this.startStreaming(stream);

    return {
      type: 'stream_started',
      data: {
        streamId,
        status: 'started'
      }
    };
  }

  async handleSubscribe(connectionId, data) {
    const { topics } = data;
    
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.subscriptions = connection.subscriptions || new Set();
      topics.forEach(topic => connection.subscriptions.add(topic));
    }

    return {
      type: 'subscribed',
      data: {
        topics,
        count: topics.length
      }
    };
  }

  async handleUnsubscribe(connectionId, data) {
    const { topics } = data;
    
    const connection = this.connections.get(connectionId);
    if (connection && connection.subscriptions) {
      topics.forEach(topic => connection.subscriptions.delete(topic));
    }

    return {
      type: 'unsubscribed',
      data: {
        topics,
        count: topics.length
      }
    };
  }

  async handleGetStatus(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    return {
      type: 'status',
      data: {
        connectionId,
        connectedAt: connection.connectedAt,
        lastActivity: connection.lastActivity,
        messageCount: connection.messageCount,
        isAlive: connection.isAlive,
        subscriptions: Array.from(connection.subscriptions || [])
      }
    };
  }

  async handleGetConnections(connectionId, data) {
    const connections = Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      ip: conn.ip,
      connectedAt: conn.connectedAt,
      lastActivity: conn.lastActivity,
      messageCount: conn.messageCount,
      isAlive: conn.isAlive
    }));

    return {
      type: 'connections',
      data: {
        connections,
        count: connections.length
      }
    };
  }

  getOrCreateStream(streamId, config) {
    if (this.streams.has(streamId)) {
      return this.streams.get(streamId);
    }

    const stream = {
      id: streamId,
      connectionId: config.connectionId,
      operation: config.operation,
      input: config.input,
      options: config.options,
      status: 'created',
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0
    };

    this.streams.set(streamId, stream);
    return stream;
  }

  async startStreaming(stream) {
    stream.status = 'streaming';
    
    // Simulate streaming data
    const interval = setInterval(() => {
      if (stream.status !== 'streaming') {
        clearInterval(interval);
        return;
      }

      const data = {
        streamId: stream.id,
        chunk: `Streaming data chunk ${stream.messageCount + 1}`,
        timestamp: new Date().toISOString()
      };

      this.sendMessage(stream.connectionId, {
        type: 'stream_data',
        data
      });

      stream.messageCount++;
      stream.lastActivity = new Date();

      // Stop after 10 chunks for demo
      if (stream.messageCount >= 10) {
        this.stopStream(stream.id);
      }
    }, 1000);
  }

  stopStream(streamId) {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.status = 'stopped';
      stream.stoppedAt = new Date();
      
      this.sendMessage(stream.connectionId, {
        type: 'stream_stopped',
        data: {
          streamId,
          status: 'stopped',
          messageCount: stream.messageCount
        }
      });
    }
  }

  sendMessage(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error(`Error sending message to ${connectionId}:`, error);
      return false;
    }
  }

  sendError(connectionId, error, requestId = null) {
    this.sendMessage(connectionId, {
      type: 'error',
      error: error,
      requestId,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnection(connectionId, code, reason) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      logger.info(`Connection ${connectionId} disconnected: ${code} - ${reason}`);
      
      // Clean up streams
      for (const [streamId, stream] of this.streams) {
        if (stream.connectionId === connectionId) {
          this.stopStream(streamId);
        }
      }
      
      this.connections.delete(connectionId);
    }
  }

  handleError(connectionId, error) {
    logger.error(`Connection ${connectionId} error:`, error);
    this.handleDisconnection(connectionId, 1006, 'Connection error');
  }

  sendHeartbeat() {
    for (const [connectionId, connection] of this.connections) {
      if (!connection.isAlive) {
        connection.ws.terminate();
        this.connections.delete(connectionId);
        continue;
      }

      connection.isAlive = false;
      connection.ws.ping();
    }
  }

  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isRateLimited(ip) {
    if (!this.config.rateLimiting.enabled) {
      return false;
    }

    const limit = this.rateLimits.get(ip);
    if (!limit) {
      return false;
    }

    const now = Date.now();
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;

    // Clean old entries
    limit.minute = limit.minute.filter(time => time > minuteAgo);
    limit.hour = limit.hour.filter(time => time > hourAgo);

    return limit.minute.length >= this.config.rateLimiting.maxRequestsPerMinute ||
           limit.hour.length >= this.config.rateLimiting.maxRequestsPerHour;
  }

  updateRateLimit(ip) {
    if (!this.config.rateLimiting.enabled) {
      return;
    }

    const now = Date.now();
    let limit = this.rateLimits.get(ip);
    
    if (!limit) {
      limit = { minute: [], hour: [] };
      this.rateLimits.set(ip, limit);
    }

    limit.minute.push(now);
    limit.hour.push(now);
  }

  cleanupRateLimits() {
    const now = Date.now();
    const hourAgo = now - 3600000;

    for (const [ip, limit] of this.rateLimits) {
      limit.hour = limit.hour.filter(time => time > hourAgo);
      if (limit.hour.length === 0) {
        this.rateLimits.delete(ip);
      }
    }
  }

  getCapabilities() {
    return {
      supportedTypes: this.config.supportedProtocols,
      maxMessageSize: this.config.maxMessageSize,
      rateLimiting: this.config.rateLimiting,
      heartbeatInterval: this.config.heartbeatInterval
    };
  }

  // Broadcast to all connections
  broadcast(message, filter = null) {
    let sent = 0;
    for (const [connectionId, connection] of this.connections) {
      if (filter && !filter(connection)) {
        continue;
      }
      
      if (this.sendMessage(connectionId, message)) {
        sent++;
      }
    }
    return sent;
  }

  // Broadcast to subscribers of a topic
  broadcastToTopic(topic, message) {
    let sent = 0;
    for (const [connectionId, connection] of this.connections) {
      if (connection.subscriptions && connection.subscriptions.has(topic)) {
        if (this.sendMessage(connectionId, {
          type: 'topic_message',
          topic,
          data: message,
          timestamp: new Date().toISOString()
        })) {
          sent++;
        }
      }
    }
    return sent;
  }

  // Health Check
  async healthCheck() {
    try {
      const status = {
        initialized: this.isInitialized,
        port: this.config.port,
        connections: this.connections.size,
        streams: this.streams.size,
        rateLimits: this.rateLimits.size,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      };

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: status
      };
    } catch (error) {
      logger.error('Real-time Processor health check failed:', error);
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
      logger.info('Cleaning up Real-time Processor...');
      
      // Close all connections
      for (const [connectionId, connection] of this.connections) {
        connection.ws.close(1001, 'Server shutdown');
      }
      
      // Stop all streams
      for (const [streamId, stream] of this.streams) {
        this.stopStream(streamId);
      }
      
      // Close WebSocket server
      if (this.wss) {
        this.wss.close();
      }
      
      this.connections.clear();
      this.streams.clear();
      this.rateLimits.clear();
      this.isInitialized = false;
      
      logger.info('Real-time Processor cleanup completed');
    } catch (error) {
      logger.error('Real-time Processor cleanup failed:', error);
    }
  }
}

module.exports = new RealTimeProcessor();
