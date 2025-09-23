const EventEmitter = require('events');
const logger = require('./logger');

class DeviceManager extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.devices = new Map();
    this.deviceTypes = new Map();
    this.protocols = new Map();
    this.config = {
      maxDevices: 10000,
      heartbeatInterval: 30000,
      discoveryTimeout: 10000,
      autoDiscovery: true,
      protocolSupport: ['mqtt', 'coap', 'http', 'websocket', 'udp', 'tcp'],
      deviceTypes: ['sensor', 'actuator', 'gateway', 'controller', 'display', 'camera', 'speaker', 'microphone']
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Device Manager...');
      
      // Initialize device types
      await this.initializeDeviceTypes();
      
      // Initialize protocols
      await this.initializeProtocols();
      
      // Initialize device discovery
      await this.initializeDeviceDiscovery();
      
      // Initialize device monitoring
      await this.initializeDeviceMonitoring();
      
      this.isInitialized = true;
      logger.info('Device Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Device Manager:', error);
      throw error;
    }
  }

  async initializeDeviceTypes() {
    const deviceTypes = [
      {
        name: 'sensor',
        description: 'Data collection devices',
        capabilities: ['read', 'stream'],
        protocols: ['mqtt', 'coap', 'http'],
        dataTypes: ['temperature', 'humidity', 'pressure', 'light', 'motion', 'sound']
      },
      {
        name: 'actuator',
        description: 'Control devices',
        capabilities: ['write', 'control'],
        protocols: ['mqtt', 'coap', 'http'],
        dataTypes: ['switch', 'dimmer', 'motor', 'valve', 'relay']
      },
      {
        name: 'gateway',
        description: 'Protocol translation devices',
        capabilities: ['translate', 'bridge', 'aggregate'],
        protocols: ['mqtt', 'coap', 'http', 'websocket'],
        dataTypes: ['protocol', 'data', 'command']
      },
      {
        name: 'controller',
        description: 'Control and automation devices',
        capabilities: ['control', 'automate', 'schedule'],
        protocols: ['mqtt', 'coap', 'http'],
        dataTypes: ['command', 'schedule', 'rule', 'automation']
      },
      {
        name: 'display',
        description: 'Visual output devices',
        capabilities: ['display', 'show'],
        protocols: ['http', 'websocket'],
        dataTypes: ['text', 'image', 'video', 'ui']
      },
      {
        name: 'camera',
        description: 'Video capture devices',
        capabilities: ['capture', 'stream', 'record'],
        protocols: ['http', 'websocket', 'rtsp'],
        dataTypes: ['image', 'video', 'stream']
      },
      {
        name: 'speaker',
        description: 'Audio output devices',
        capabilities: ['play', 'speak'],
        protocols: ['http', 'websocket'],
        dataTypes: ['audio', 'speech', 'music']
      },
      {
        name: 'microphone',
        description: 'Audio input devices',
        capabilities: ['capture', 'listen'],
        protocols: ['http', 'websocket'],
        dataTypes: ['audio', 'speech', 'sound']
      }
    ];

    for (const deviceType of deviceTypes) {
      this.deviceTypes.set(deviceType.name, deviceType);
    }
    
    logger.info(`Initialized ${deviceTypes.length} device types`);
  }

  async initializeProtocols() {
    const protocols = [
      {
        name: 'mqtt',
        description: 'Message Queuing Telemetry Transport',
        type: 'pubsub',
        port: 1883,
        secure: false,
        features: ['qos', 'retain', 'will', 'clean_session']
      },
      {
        name: 'mqtts',
        description: 'MQTT over TLS',
        type: 'pubsub',
        port: 8883,
        secure: true,
        features: ['qos', 'retain', 'will', 'clean_session', 'tls']
      },
      {
        name: 'coap',
        description: 'Constrained Application Protocol',
        type: 'request_response',
        port: 5683,
        secure: false,
        features: ['observe', 'block_transfer', 'multicast']
      },
      {
        name: 'coaps',
        description: 'CoAP over DTLS',
        type: 'request_response',
        port: 5684,
        secure: true,
        features: ['observe', 'block_transfer', 'multicast', 'dtls']
      },
      {
        name: 'http',
        description: 'Hypertext Transfer Protocol',
        type: 'request_response',
        port: 80,
        secure: false,
        features: ['rest', 'json', 'xml', 'caching']
      },
      {
        name: 'https',
        description: 'HTTP over TLS',
        type: 'request_response',
        port: 443,
        secure: true,
        features: ['rest', 'json', 'xml', 'caching', 'tls']
      },
      {
        name: 'websocket',
        description: 'WebSocket Protocol',
        type: 'bidirectional',
        port: 80,
        secure: false,
        features: ['real_time', 'binary', 'text', 'ping_pong']
      },
      {
        name: 'wss',
        description: 'WebSocket over TLS',
        type: 'bidirectional',
        port: 443,
        secure: true,
        features: ['real_time', 'binary', 'text', 'ping_pong', 'tls']
      },
      {
        name: 'udp',
        description: 'User Datagram Protocol',
        type: 'datagram',
        port: 0,
        secure: false,
        features: ['fast', 'lightweight', 'multicast']
      },
      {
        name: 'tcp',
        description: 'Transmission Control Protocol',
        type: 'stream',
        port: 0,
        secure: false,
        features: ['reliable', 'ordered', 'error_corrected']
      }
    ];

    for (const protocol of protocols) {
      this.protocols.set(protocol.name, protocol);
    }
    
    logger.info(`Initialized ${protocols.length} protocols`);
  }

  async initializeDeviceDiscovery() {
    if (this.config.autoDiscovery) {
      this.discovery = {
        active: true,
        interval: setInterval(() => {
          this.discoverDevices();
        }, this.config.discoveryTimeout),
        discovered: new Map()
      };
      
      logger.info('Device discovery initialized');
    }
  }

  async initializeDeviceMonitoring() {
    this.monitoring = {
      active: true,
      interval: setInterval(() => {
        this.monitorDevices();
      }, this.config.heartbeatInterval),
      metrics: new Map()
    };
    
    logger.info('Device monitoring initialized');
  }

  // Device Management
  async registerDevice(deviceInfo) {
    try {
      const deviceId = deviceInfo.id || this.generateDeviceId();
      
      const device = {
        id: deviceId,
        name: deviceInfo.name || `Device-${deviceId}`,
        type: deviceInfo.type || 'sensor',
        protocol: deviceInfo.protocol || 'http',
        address: deviceInfo.address || 'localhost',
        port: deviceInfo.port || this.getDefaultPort(deviceInfo.protocol),
        credentials: deviceInfo.credentials || {},
        capabilities: deviceInfo.capabilities || [],
        properties: deviceInfo.properties || {},
        status: 'offline',
        lastSeen: new Date(),
        registered: new Date(),
        metadata: deviceInfo.metadata || {}
      };
      
      // Validate device type
      if (!this.deviceTypes.has(device.type)) {
        throw new Error(`Invalid device type: ${device.type}`);
      }
      
      // Validate protocol
      if (!this.protocols.has(device.protocol)) {
        throw new Error(`Invalid protocol: ${device.protocol}`);
      }
      
      this.devices.set(deviceId, device);
      
      // Start device monitoring
      this.startDeviceMonitoring(deviceId);
      
      this.emit('deviceRegistered', device);
      logger.info(`Device ${deviceId} registered successfully`);
      
      return device;
    } catch (error) {
      logger.error(`Failed to register device:`, error);
      throw error;
    }
  }

  async unregisterDevice(deviceId) {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }
      
      // Stop device monitoring
      this.stopDeviceMonitoring(deviceId);
      
      this.devices.delete(deviceId);
      
      this.emit('deviceUnregistered', device);
      logger.info(`Device ${deviceId} unregistered successfully`);
      
      return device;
    } catch (error) {
      logger.error(`Failed to unregister device ${deviceId}:`, error);
      throw error;
    }
  }

  async updateDevice(deviceId, updates) {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }
      
      // Update device properties
      Object.assign(device, updates);
      device.lastSeen = new Date();
      
      this.emit('deviceUpdated', device);
      logger.info(`Device ${deviceId} updated successfully`);
      
      return device;
    } catch (error) {
      logger.error(`Failed to update device ${deviceId}:`, error);
      throw error;
    }
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  listDevices(filter = {}) {
    const devices = Array.from(this.devices.values());
    
    return devices.filter(device => {
      if (filter.type && device.type !== filter.type) return false;
      if (filter.protocol && device.protocol !== filter.protocol) return false;
      if (filter.status && device.status !== filter.status) return false;
      if (filter.capabilities && !this.hasCapabilities(device, filter.capabilities)) return false;
      return true;
    });
  }

  // Device Discovery
  async discoverDevices() {
    try {
      // This would typically involve network scanning, protocol discovery, etc.
      // For now, we'll simulate discovery
      const discoveredDevices = await this.scanForDevices();
      
      for (const deviceInfo of discoveredDevices) {
        if (!this.devices.has(deviceInfo.id)) {
          await this.registerDevice(deviceInfo);
        }
      }
      
      logger.info(`Discovered ${discoveredDevices.length} devices`);
    } catch (error) {
      logger.error('Device discovery failed:', error);
    }
  }

  async scanForDevices() {
    // Simulate device scanning
    // In practice, this would involve actual network discovery protocols
    const discoveredDevices = [];
    
    // Simulate discovering some devices
    for (let i = 0; i < Math.floor(Math.random() * 10); i++) {
      const deviceTypes = Array.from(this.deviceTypes.keys());
      const protocols = Array.from(this.protocols.keys());
      
      discoveredDevices.push({
        id: `discovered_${Date.now()}_${i}`,
        name: `Discovered Device ${i}`,
        type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        address: `192.168.1.${100 + i}`,
        port: Math.floor(Math.random() * 1000) + 8000,
        capabilities: ['read', 'write'],
        properties: {
          manufacturer: 'Unknown',
          model: 'Generic',
          version: '1.0.0'
        }
      });
    }
    
    return discoveredDevices;
  }

  // Device Communication
  async sendCommand(deviceId, command, parameters = {}) {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }
      
      if (device.status !== 'online') {
        throw new Error(`Device ${deviceId} is not online`);
      }
      
      const result = await this.executeCommand(device, command, parameters);
      
      this.emit('commandSent', { deviceId, command, parameters, result });
      logger.info(`Command ${command} sent to device ${deviceId}`);
      
      return result;
    } catch (error) {
      logger.error(`Failed to send command to device ${deviceId}:`, error);
      throw error;
    }
  }

  async executeCommand(device, command, parameters) {
    // Execute command based on device protocol
    switch (device.protocol) {
      case 'mqtt':
      case 'mqtts':
        return await this.executeMqttCommand(device, command, parameters);
      case 'coap':
      case 'coaps':
        return await this.executeCoapCommand(device, command, parameters);
      case 'http':
      case 'https':
        return await this.executeHttpCommand(device, command, parameters);
      case 'websocket':
      case 'wss':
        return await this.executeWebSocketCommand(device, command, parameters);
      case 'udp':
        return await this.executeUdpCommand(device, command, parameters);
      case 'tcp':
        return await this.executeTcpCommand(device, command, parameters);
      default:
        throw new Error(`Unsupported protocol: ${device.protocol}`);
    }
  }

  async executeMqttCommand(device, command, parameters) {
    // Simulate MQTT command execution
    return {
      success: true,
      message: `MQTT command ${command} executed`,
      timestamp: new Date().toISOString()
    };
  }

  async executeCoapCommand(device, command, parameters) {
    // Simulate CoAP command execution
    return {
      success: true,
      message: `CoAP command ${command} executed`,
      timestamp: new Date().toISOString()
    };
  }

  async executeHttpCommand(device, command, parameters) {
    // Simulate HTTP command execution
    return {
      success: true,
      message: `HTTP command ${command} executed`,
      timestamp: new Date().toISOString()
    };
  }

  async executeWebSocketCommand(device, command, parameters) {
    // Simulate WebSocket command execution
    return {
      success: true,
      message: `WebSocket command ${command} executed`,
      timestamp: new Date().toISOString()
    };
  }

  async executeUdpCommand(device, command, parameters) {
    // Simulate UDP command execution
    return {
      success: true,
      message: `UDP command ${command} executed`,
      timestamp: new Date().toISOString()
    };
  }

  async executeTcpCommand(device, command, parameters) {
    // Simulate TCP command execution
    return {
      success: true,
      message: `TCP command ${command} executed`,
      timestamp: new Date().toISOString()
    };
  }

  // Device Monitoring
  async monitorDevices() {
    try {
      for (const [deviceId, device] of this.devices) {
        const isOnline = await this.checkDeviceStatus(deviceId);
        if (isOnline && device.status === 'offline') {
          device.status = 'online';
          device.lastSeen = new Date();
          this.emit('deviceOnline', device);
        } else if (!isOnline && device.status === 'online') {
          device.status = 'offline';
          this.emit('deviceOffline', device);
        }
      }
    } catch (error) {
      logger.error('Device monitoring failed:', error);
    }
  }

  async checkDeviceStatus(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) return false;
    
    // Check if device is responsive
    const now = new Date();
    const timeSinceLastSeen = now - device.lastSeen;
    
    if (timeSinceLastSeen > this.config.heartbeatInterval * 2) {
      return false;
    }
    
    // In practice, this would involve actual device health checks
    // like ping, protocol-specific health checks, etc.
    return Math.random() > 0.1; // 90% chance of being online
  }

  startDeviceMonitoring(deviceId) {
    const interval = setInterval(async () => {
      try {
        const isOnline = await this.checkDeviceStatus(deviceId);
        const device = this.devices.get(deviceId);
        if (device) {
          if (isOnline && device.status === 'offline') {
            device.status = 'online';
            device.lastSeen = new Date();
            this.emit('deviceOnline', device);
          } else if (!isOnline && device.status === 'online') {
            device.status = 'offline';
            this.emit('deviceOffline', device);
          }
        }
      } catch (error) {
        logger.error(`Device monitoring failed for ${deviceId}:`, error);
      }
    }, this.config.heartbeatInterval);
    
    this.monitoring.metrics.set(deviceId, {
      interval,
      lastCheck: new Date(),
      checks: 0,
      failures: 0
    });
  }

  stopDeviceMonitoring(deviceId) {
    const metrics = this.monitoring.metrics.get(deviceId);
    if (metrics) {
      clearInterval(metrics.interval);
      this.monitoring.metrics.delete(deviceId);
    }
  }

  // Device Data
  async readData(deviceId, dataType = null) {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }
      
      if (device.status !== 'online') {
        throw new Error(`Device ${deviceId} is not online`);
      }
      
      const data = await this.readDeviceData(device, dataType);
      
      this.emit('dataRead', { deviceId, dataType, data });
      logger.info(`Data read from device ${deviceId}`);
      
      return data;
    } catch (error) {
      logger.error(`Failed to read data from device ${deviceId}:`, error);
      throw error;
    }
  }

  async readDeviceData(device, dataType) {
    // Simulate reading data from device
    const data = {
      deviceId: device.id,
      timestamp: new Date().toISOString(),
      dataType: dataType || 'sensor',
      value: Math.random() * 100,
      unit: 'units',
      quality: 'good'
    };
    
    return data;
  }

  async writeData(deviceId, data) {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }
      
      if (device.status !== 'online') {
        throw new Error(`Device ${deviceId} is not online`);
      }
      
      const result = await this.writeDeviceData(device, data);
      
      this.emit('dataWritten', { deviceId, data, result });
      logger.info(`Data written to device ${deviceId}`);
      
      return result;
    } catch (error) {
      logger.error(`Failed to write data to device ${deviceId}:`, error);
      throw error;
    }
  }

  async writeDeviceData(device, data) {
    // Simulate writing data to device
    return {
      success: true,
      message: 'Data written successfully',
      timestamp: new Date().toISOString()
    };
  }

  // Utility Functions
  generateDeviceId() {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDefaultPort(protocol) {
    const protocolInfo = this.protocols.get(protocol);
    return protocolInfo ? protocolInfo.port : 80;
  }

  hasCapabilities(device, requiredCapabilities) {
    return requiredCapabilities.every(capability => 
      device.capabilities.includes(capability)
    );
  }

  // Statistics
  getStatistics() {
    const devices = Array.from(this.devices.values());
    const onlineDevices = devices.filter(device => device.status === 'online');
    const offlineDevices = devices.filter(device => device.status === 'offline');
    
    const byType = {};
    const byProtocol = {};
    
    devices.forEach(device => {
      byType[device.type] = (byType[device.type] || 0) + 1;
      byProtocol[device.protocol] = (byProtocol[device.protocol] || 0) + 1;
    });
    
    return {
      total: devices.length,
      online: onlineDevices.length,
      offline: offlineDevices.length,
      byType,
      byProtocol,
      deviceTypes: this.deviceTypes.size,
      protocols: this.protocols.size
    };
  }

  // Health Check
  async healthCheck() {
    try {
      const status = {
        initialized: this.isInitialized,
        devices: this.devices.size,
        deviceTypes: this.deviceTypes.size,
        protocols: this.protocols.size,
        discovery: this.discovery?.active || false,
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
      logger.error('Device Manager health check failed:', error);
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
      logger.info('Cleaning up Device Manager...');
      
      // Stop device monitoring
      for (const [deviceId, metrics] of this.monitoring.metrics) {
        clearInterval(metrics.interval);
      }
      
      // Stop discovery
      if (this.discovery?.interval) {
        clearInterval(this.discovery.interval);
      }
      
      // Stop monitoring
      if (this.monitoring?.interval) {
        clearInterval(this.monitoring.interval);
      }
      
      this.devices.clear();
      this.deviceTypes.clear();
      this.protocols.clear();
      this.monitoring.metrics.clear();
      
      this.isInitialized = false;
      
      logger.info('Device Manager cleanup completed');
    } catch (error) {
      logger.error('Device Manager cleanup failed:', error);
    }
  }
}

module.exports = new DeviceManager();
