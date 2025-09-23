const express = require('express');
const router = express.Router();
const realTimeProcessor = require('../modules/real-time-processor');
const logger = require('../modules/logger');

// Get WebSocket connection info
router.get('/connection/info', (req, res) => {
  try {
    const info = {
      websocketUrl: `ws://localhost:${realTimeProcessor.config.port}`,
      port: realTimeProcessor.config.port,
      maxConnections: realTimeProcessor.config.maxConnections,
      maxMessageSize: realTimeProcessor.config.maxMessageSize,
      supportedProtocols: realTimeProcessor.config.supportedProtocols,
      rateLimiting: realTimeProcessor.config.rateLimiting
    };

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    logger.error('Connection info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active connections
router.get('/connections', (req, res) => {
  try {
    const connections = Array.from(realTimeProcessor.connections.values()).map(conn => ({
      id: conn.id,
      ip: conn.ip,
      connectedAt: conn.connectedAt,
      lastActivity: conn.lastActivity,
      messageCount: conn.messageCount,
      isAlive: conn.isAlive,
      subscriptions: Array.from(conn.subscriptions || [])
    }));

    res.json({
      success: true,
      data: {
        connections,
        count: connections.length
      }
    });
  } catch (error) {
    logger.error('Connections listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active streams
router.get('/streams', (req, res) => {
  try {
    const streams = Array.from(realTimeProcessor.streams.values()).map(stream => ({
      id: stream.id,
      connectionId: stream.connectionId,
      operation: stream.operation,
      status: stream.status,
      createdAt: stream.createdAt,
      lastActivity: stream.lastActivity,
      messageCount: stream.messageCount
    }));

    res.json({
      success: true,
      data: {
        streams,
        count: streams.length
      }
    });
  } catch (error) {
    logger.error('Streams listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Broadcast message to all connections
router.post('/broadcast', async (req, res) => {
  try {
    const { message, filter } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    let sent = 0;
    if (filter) {
      // Apply filter function (simplified for demo)
      sent = realTimeProcessor.broadcast(message, (connection) => {
        // Simple filter example - you could implement more complex logic
        return connection.messageCount > 0;
      });
    } else {
      sent = realTimeProcessor.broadcast(message);
    }

    res.json({
      success: true,
      data: {
        message,
        sent,
        totalConnections: realTimeProcessor.connections.size
      }
    });
  } catch (error) {
    logger.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Broadcast message to topic subscribers
router.post('/broadcast/topic', async (req, res) => {
  try {
    const { topic, message } = req.body;
    
    if (!topic || !message) {
      return res.status(400).json({
        success: false,
        error: 'Topic and message are required'
      });
    }

    const sent = realTimeProcessor.broadcastToTopic(topic, message);

    res.json({
      success: true,
      data: {
        topic,
        message,
        sent,
        totalConnections: realTimeProcessor.connections.size
      }
    });
  } catch (error) {
    logger.error('Topic broadcast error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send message to specific connection
router.post('/send/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const sent = realTimeProcessor.sendMessage(connectionId, message);

    if (!sent) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found or not available'
      });
    }

    res.json({
      success: true,
      data: {
        connectionId,
        message,
        sent: true
      }
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get connection status
router.get('/connection/:connectionId/status', (req, res) => {
  try {
    const { connectionId } = req.params;
    
    const connection = realTimeProcessor.connections.get(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.json({
      success: true,
      data: {
        connectionId,
        connectedAt: connection.connectedAt,
        lastActivity: connection.lastActivity,
        messageCount: connection.messageCount,
        isAlive: connection.isAlive,
        subscriptions: Array.from(connection.subscriptions || [])
      }
    });
  } catch (error) {
    logger.error('Connection status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Disconnect specific connection
router.post('/connection/:connectionId/disconnect', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { reason = 'Admin disconnect' } = req.body;
    
    const connection = realTimeProcessor.connections.get(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    connection.ws.close(1000, reason);
    realTimeProcessor.connections.delete(connectionId);

    res.json({
      success: true,
      data: {
        connectionId,
        reason,
        message: 'Connection disconnected successfully'
      }
    });
  } catch (error) {
    logger.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get rate limiting status
router.get('/rate-limits', (req, res) => {
  try {
    const rateLimits = Array.from(realTimeProcessor.rateLimits.entries()).map(([ip, limit]) => ({
      ip,
      minuteRequests: limit.minute.length,
      hourRequests: limit.hour.length,
      isLimited: realTimeProcessor.isRateLimited(ip)
    }));

    res.json({
      success: true,
      data: {
        rateLimits,
        count: rateLimits.length,
        config: realTimeProcessor.config.rateLimiting
      }
    });
  } catch (error) {
    logger.error('Rate limits listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear rate limits
router.post('/rate-limits/clear', async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (ip) {
      realTimeProcessor.rateLimits.delete(ip);
      res.json({
        success: true,
        data: {
          message: `Rate limits cleared for IP: ${ip}`
        }
      });
    } else {
      realTimeProcessor.rateLimits.clear();
      res.json({
        success: true,
        data: {
          message: 'All rate limits cleared'
        }
      });
    }
  } catch (error) {
    logger.error('Rate limits clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get WebSocket server statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      connections: {
        total: realTimeProcessor.connections.size,
        alive: Array.from(realTimeProcessor.connections.values()).filter(c => c.isAlive).length,
        dead: Array.from(realTimeProcessor.connections.values()).filter(c => !c.isAlive).length
      },
      streams: {
        total: realTimeProcessor.streams.size,
        active: Array.from(realTimeProcessor.streams.values()).filter(s => s.status === 'streaming').length,
        stopped: Array.from(realTimeProcessor.streams.values()).filter(s => s.status === 'stopped').length
      },
      rateLimits: {
        total: realTimeProcessor.rateLimits.size,
        limited: Array.from(realTimeProcessor.rateLimits.keys()).filter(ip => realTimeProcessor.isRateLimited(ip)).length
      },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get WebSocket server configuration
router.get('/config', (req, res) => {
  try {
    const config = {
      port: realTimeProcessor.config.port,
      maxConnections: realTimeProcessor.config.maxConnections,
      heartbeatInterval: realTimeProcessor.config.heartbeatInterval,
      maxMessageSize: realTimeProcessor.config.maxMessageSize,
      supportedProtocols: realTimeProcessor.config.supportedProtocols,
      rateLimiting: realTimeProcessor.config.rateLimiting
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Configuration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Real-time Processor Status
router.get('/status', async (req, res) => {
  try {
    const status = await realTimeProcessor.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Real-time processor status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
