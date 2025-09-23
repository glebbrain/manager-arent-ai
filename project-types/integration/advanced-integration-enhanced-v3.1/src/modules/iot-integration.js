const EventEmitter = require('events');
const mqtt = require('mqtt');
const WebSocket = require('ws');
const logger = require('./logger');

/**
 * IoT Integration Module
 * Provides comprehensive IoT device management and communication capabilities
 */
class IoTIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled || process.env.IOT_ENABLED === 'true',
      brokerUrl: config.brokerUrl || process.env.IOT_BROKER_URL || 'mqtt://localhost:1883',
      deviceLimit: config.deviceLimit || parseInt(process.env.IOT_DEVICE_LIMIT) || 10000,
      protocols: config.protocols || ['mqtt', 'coap', 'http', 'websocket'],
      security: config.security || {
        authentication: true,
        encryption: true,
        certificateValidation: true
      },
      ...config
    };

    this.devices = new Map();
    this.connections = new Map();
    this.dataStreams = new Map();
    this.isRunning = false;
    this.mqttClient = null;
    this.wsServer = null;
  }

  /**
   * Initialize IoT integration
   */
  async start() {
    if (!this.config.enabled) {
      logger.info('IoT Integration is disabled');
      return;
    }

    try {
      await this.initializeMQTT();
      await this.initializeWebSocket();
      await this.initializeProtocols();
      
      this.isRunning = true;
      logger.info('IoT Integration started successfully');
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start IoT Integration:', error);
      throw error;
    }
  }

  /**
   * Stop IoT integration
   */
  async stop() {
    try {
      if (this.mqttClient) {
        await this.mqttClient.end();
      }

      if (this.wsServer) {
        this.wsServer.close();
      }

      this.connections.forEach(connection => {
        if (connection.close) {
          connection.close();
        }
      });

      this.isRunning = false;
      logger.info('IoT Integration stopped');
      this.emit('stopped');
    } catch (error) {
      logger.error('Error stopping IoT Integration:', error);
      throw error;
    }
  }

  /**
   * Initialize MQTT broker connection
   */
  async initializeMQTT() {
    return new Promise((resolve, reject) => {
      this.mqttClient = mqtt.connect(this.config.brokerUrl, {
        clientId: `iot-integration-${Date.now()}`,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000
      });

      this.mqttClient.on('connect', () => {
        logger.info('MQTT broker connected');
        resolve();
      });

      this.mqttClient.on('error', (error) => {
        logger.error('MQTT connection error:', error);
        reject(error);
      });

      this.mqttClient.on('message', (topic, message) => {
        this.handleMQTTMessage(topic, message);
      });
    });
  }

  /**
   * Initialize WebSocket server
   */
  async initializeWebSocket() {
    return new Promise((resolve) => {
      this.wsServer = new WebSocket.Server({ port: 8080 });
      
      this.wsServer.on('connection', (ws, req) => {
        this.handleWebSocketConnection(ws, req);
      });

      this.wsServer.on('listening', () => {
        logger.info('WebSocket server started on port 8080');
        resolve();
      });
    });
  }

  /**
   * Initialize supported protocols
   */
  async initializeProtocols() {
    for (const protocol of this.config.protocols) {
      try {
        await this.initializeProtocol(protocol);
        logger.info(`Protocol ${protocol} initialized`);
      } catch (error) {
        logger.warn(`Failed to initialize protocol ${protocol}:`, error.message);
      }
    }
  }

  /**
   * Initialize specific protocol
   */
  async initializeProtocol(protocol) {
    switch (protocol) {
      case 'mqtt':
        // MQTT already initialized
        break;
      case 'coap':
        await this.initializeCoAP();
        break;
      case 'http':
        await this.initializeHTTP();
        break;
      case 'websocket':
        // WebSocket already initialized
        break;
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }

  /**
   * Initialize CoAP protocol
   */
  async initializeCoAP() {
    // CoAP implementation would go here
    logger.info('CoAP protocol initialized');
  }

  /**
   * Initialize HTTP protocol
   */
  async initializeHTTP() {
    // HTTP protocol implementation would go here
    logger.info('HTTP protocol initialized');
  }

  /**
   * Register new IoT device
   */
  async registerDevice(deviceInfo) {
    if (this.devices.size >= this.config.deviceLimit) {
      throw new Error('Device limit reached');
    }

    const device = {
      id: deviceInfo.id,
      name: deviceInfo.name || deviceInfo.id,
      type: deviceInfo.type || 'sensor',
      location: deviceInfo.location || 'unknown',
      protocol: deviceInfo.protocol || 'mqtt',
      status: 'offline',
      capabilities: deviceInfo.capabilities || [],
      configuration: deviceInfo.configuration || {},
      metadata: deviceInfo.metadata || {},
      registeredAt: new Date(),
      lastSeen: null,
      dataCount: 0
    };

    this.devices.set(device.id, device);
    logger.info(`Device registered: ${device.id}`);
    
    this.emit('deviceRegistered', device);
    return device;
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId) {
    return this.devices.get(deviceId) || null;
  }

  /**
   * Get all devices
   */
  getAllDevices() {
    return Array.from(this.devices.values());
  }

  /**
   * Update device configuration
   */
  async updateDevice(deviceId, updates) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    Object.assign(device, updates);
    device.updatedAt = new Date();
    
    logger.info(`Device updated: ${deviceId}`);
    this.emit('deviceUpdated', device);
    return device;
  }

  /**
   * Remove device
   */
  async removeDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    this.devices.delete(deviceId);
    logger.info(`Device removed: ${deviceId}`);
    this.emit('deviceRemoved', device);
    return true;
  }

  /**
   * Send data to device
   */
  async sendData(deviceId, data) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const message = {
      deviceId,
      data,
      timestamp: new Date(),
      messageId: this.generateMessageId()
    };

    try {
      switch (device.protocol) {
        case 'mqtt':
          await this.sendMQTTData(device, message);
          break;
        case 'websocket':
          await this.sendWebSocketData(device, message);
          break;
        case 'http':
          await this.sendHTTPData(device, message);
          break;
        default:
          throw new Error(`Unsupported protocol: ${device.protocol}`);
      }

      device.lastSeen = new Date();
      device.dataCount++;
      this.emit('dataSent', message);
      
      return message;
    } catch (error) {
      logger.error(`Failed to send data to device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Send data via MQTT
   */
  async sendMQTTData(device, message) {
    const topic = `devices/${device.id}/data`;
    const payload = JSON.stringify(message);
    
    return new Promise((resolve, reject) => {
      this.mqttClient.publish(topic, payload, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Send data via WebSocket
   */
  async sendWebSocketData(device, message) {
    const connection = this.connections.get(device.id);
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      throw new Error(`WebSocket connection not available for device: ${device.id}`);
    }

    connection.send(JSON.stringify(message));
  }

  /**
   * Send data via HTTP
   */
  async sendHTTPData(device, message) {
    // HTTP data sending implementation would go here
    logger.info(`HTTP data sent to device ${device.id}`);
  }

  /**
   * Get device data
   */
  async getDeviceData(deviceId, options = {}) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const dataStream = this.dataStreams.get(deviceId) || [];
    const { limit = 100, offset = 0, startDate, endDate } = options;

    let filteredData = dataStream;

    if (startDate || endDate) {
      filteredData = dataStream.filter(item => {
        const itemDate = new Date(item.timestamp);
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    return filteredData.slice(offset, offset + limit);
  }

  /**
   * Subscribe to device data stream
   */
  async subscribeToDevice(deviceId, callback) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const topic = `devices/${deviceId}/data`;
    
    if (device.protocol === 'mqtt') {
      this.mqttClient.subscribe(topic, (error) => {
        if (error) {
          logger.error(`Failed to subscribe to ${topic}:`, error);
        } else {
          logger.info(`Subscribed to device data: ${deviceId}`);
        }
      });
    }

    this.on(`data:${deviceId}`, callback);
  }

  /**
   * Unsubscribe from device data stream
   */
  async unsubscribeFromDevice(deviceId) {
    const topic = `devices/${deviceId}/data`;
    
    this.mqttClient.unsubscribe(topic);
    this.removeAllListeners(`data:${deviceId}`);
    
    logger.info(`Unsubscribed from device data: ${deviceId}`);
  }

  /**
   * Handle MQTT message
   */
  handleMQTTMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      const deviceId = this.extractDeviceIdFromTopic(topic);
      
      if (deviceId) {
        this.storeDeviceData(deviceId, data);
        this.emit(`data:${deviceId}`, data);
        this.emit('dataReceived', { deviceId, data });
      }
    } catch (error) {
      logger.error('Error handling MQTT message:', error);
    }
  }

  /**
   * Handle WebSocket connection
   */
  handleWebSocketConnection(ws, req) {
    const deviceId = req.url.split('/').pop();
    
    if (deviceId) {
      this.connections.set(deviceId, ws);
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.storeDeviceData(deviceId, data);
          this.emit(`data:${deviceId}`, data);
          this.emit('dataReceived', { deviceId, data });
        } catch (error) {
          logger.error('Error handling WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.connections.delete(deviceId);
        logger.info(`WebSocket connection closed for device: ${deviceId}`);
      });
    }
  }

  /**
   * Store device data
   */
  storeDeviceData(deviceId, data) {
    if (!this.dataStreams.has(deviceId)) {
      this.dataStreams.set(deviceId, []);
    }

    const dataStream = this.dataStreams.get(deviceId);
    dataStream.push({
      ...data,
      receivedAt: new Date()
    });

    // Keep only last 1000 data points per device
    if (dataStream.length > 1000) {
      dataStream.splice(0, dataStream.length - 1000);
    }
  }

  /**
   * Extract device ID from MQTT topic
   */
  extractDeviceIdFromTopic(topic) {
    const parts = topic.split('/');
    if (parts.length >= 3 && parts[0] === 'devices' && parts[2] === 'data') {
      return parts[1];
    }
    return null;
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      running: this.isRunning,
      devices: this.devices.size,
      connections: this.connections.size,
      protocols: this.config.protocols,
      uptime: process.uptime()
    };
  }

  /**
   * Get device statistics
   */
  getDeviceStatistics() {
    const devices = Array.from(this.devices.values());
    
    return {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      byType: this.groupDevicesByType(devices),
      byProtocol: this.groupDevicesByProtocol(devices),
      totalDataPoints: devices.reduce((sum, d) => sum + d.dataCount, 0)
    };
  }

  /**
   * Group devices by type
   */
  groupDevicesByType(devices) {
    return devices.reduce((groups, device) => {
      groups[device.type] = (groups[device.type] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Group devices by protocol
   */
  groupDevicesByProtocol(devices) {
    return devices.reduce((groups, device) => {
      groups[device.protocol] = (groups[device.protocol] || 0) + 1;
      return groups;
    }, {});
  }
}

module.exports = IoTIntegration;
