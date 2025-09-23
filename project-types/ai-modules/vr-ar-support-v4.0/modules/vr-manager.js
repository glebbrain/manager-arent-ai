const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class VRManager {
  constructor() {
    this.sessions = new Map();
    this.users = new Map();
    this.scenes = new Map();
    this.devices = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing VR Manager...');
      
      // Load existing sessions if any
      await this.loadSessions();
      
      logger.info('VR Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize VR Manager:', error);
      throw error;
    }
  }

  async createSession(sessionData) {
    try {
      const sessionId = uuidv4();
      const session = {
        sessionId,
        name: sessionData.name || 'VR Session',
        description: sessionData.description || '',
        maxUsers: sessionData.maxUsers || 10,
        currentUsers: 0,
        sceneId: sessionData.sceneId || null,
        settings: {
          physics: sessionData.settings?.physics || true,
          audio: sessionData.settings?.audio || true,
          handTracking: sessionData.settings?.handTracking || false,
          eyeTracking: sessionData.settings?.eyeTracking || false,
          haptics: sessionData.settings?.haptics || false
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: sessionData.createdBy || 'system'
      };

      this.sessions.set(sessionId, session);
      await this.saveSessions();

      logger.info(`VR session created: ${sessionId}`);
      
      return {
        success: true,
        sessionId,
        ...session
      };
    } catch (error) {
      logger.error(`Failed to create VR session:`, error);
      throw error;
    }
  }

  async joinSession(userId, sessionData) {
    try {
      const { sessionId, userInfo } = sessionData;
      
      if (!this.sessions.has(sessionId)) {
        throw new Error(`VR session not found: ${sessionId}`);
      }

      const session = this.sessions.get(sessionId);
      
      if (session.currentUsers >= session.maxUsers) {
        throw new Error('VR session is full');
      }

      if (session.status !== 'active') {
        throw new Error('VR session is not active');
      }

      const user = {
        userId,
        sessionId,
        userInfo: userInfo || {},
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        avatar: userInfo?.avatar || 'default',
        status: 'connected',
        joinedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      this.users.set(userId, user);
      session.currentUsers += 1;
      this.sessions.set(sessionId, session);
      
      await this.saveSessions();
      await this.saveUsers();

      logger.info(`User ${userId} joined VR session ${sessionId}`);
      
      return {
        success: true,
        sessionId,
        userId,
        session: session,
        user: user
      };
    } catch (error) {
      logger.error(`Failed to join VR session:`, error);
      throw error;
    }
  }

  async leaveSession(userId, sessionData = {}) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const sessionId = user.sessionId;
      const session = this.sessions.get(sessionId);
      
      if (session) {
        session.currentUsers = Math.max(0, session.currentUsers - 1);
        this.sessions.set(sessionId, session);
      }

      this.users.delete(userId);
      
      await this.saveSessions();
      await this.saveUsers();

      logger.info(`User ${userId} left VR session ${sessionId}`);
      
      return {
        success: true,
        sessionId,
        userId
      };
    } catch (error) {
      logger.error(`Failed to leave VR session:`, error);
      throw error;
    }
  }

  async updateUserPosition(userId, positionData) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      user.position = positionData.position || user.position;
      user.rotation = positionData.rotation || user.rotation;
      user.lastActivity = new Date().toISOString();
      
      this.users.set(userId, user);
      await this.saveUsers();

      return {
        success: true,
        userId,
        position: user.position,
        rotation: user.rotation
      };
    } catch (error) {
      logger.error(`Failed to update user position:`, error);
      throw error;
    }
  }

  async getSessionUsers(sessionId) {
    try {
      const users = [];
      
      for (const [userId, user] of this.users.entries()) {
        if (user.sessionId === sessionId) {
          users.push({
            userId: user.userId,
            userInfo: user.userInfo,
            position: user.position,
            rotation: user.rotation,
            avatar: user.avatar,
            status: user.status,
            joinedAt: user.joinedAt,
            lastActivity: user.lastActivity
          });
        }
      }

      return {
        success: true,
        sessionId,
        users: users,
        count: users.length
      };
    } catch (error) {
      logger.error(`Failed to get session users for ${sessionId}:`, error);
      throw error;
    }
  }

  async getSessionInfo(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`VR session not found: ${sessionId}`);
      }

      const users = await this.getSessionUsers(sessionId);

      return {
        success: true,
        sessionId: session.sessionId,
        name: session.name,
        description: session.description,
        maxUsers: session.maxUsers,
        currentUsers: session.currentUsers,
        sceneId: session.sceneId,
        settings: session.settings,
        status: session.status,
        createdAt: session.createdAt,
        createdBy: session.createdBy,
        users: users.users
      };
    } catch (error) {
      logger.error(`Failed to get session info for ${sessionId}:`, error);
      throw error;
    }
  }

  async listSessions() {
    try {
      const sessionsList = [];
      
      for (const [sessionId, session] of this.sessions.entries()) {
        sessionsList.push({
          sessionId: session.sessionId,
          name: session.name,
          description: session.description,
          maxUsers: session.maxUsers,
          currentUsers: session.currentUsers,
          sceneId: session.sceneId,
          status: session.status,
          createdAt: session.createdAt,
          createdBy: session.createdBy
        });
      }

      return {
        success: true,
        sessions: sessionsList,
        count: sessionsList.length
      };
    } catch (error) {
      logger.error('Failed to list VR sessions:', error);
      throw error;
    }
  }

  async updateSessionSettings(sessionId, settings) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`VR session not found: ${sessionId}`);
      }

      session.settings = { ...session.settings, ...settings };
      this.sessions.set(sessionId, session);
      
      await this.saveSessions();

      logger.info(`VR session settings updated: ${sessionId}`);
      
      return {
        success: true,
        sessionId,
        settings: session.settings
      };
    } catch (error) {
      logger.error(`Failed to update session settings for ${sessionId}:`, error);
      throw error;
    }
  }

  async registerDevice(deviceData) {
    try {
      const deviceId = uuidv4();
      const device = {
        deviceId,
        type: deviceData.type || 'unknown', // 'headset', 'controller', 'tracker'
        model: deviceData.model || 'unknown',
        capabilities: deviceData.capabilities || [],
        status: 'connected',
        registeredAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      };

      this.devices.set(deviceId, device);
      await this.saveDevices();

      logger.info(`VR device registered: ${deviceId} (${device.type})`);
      
      return {
        success: true,
        deviceId,
        ...device
      };
    } catch (error) {
      logger.error(`Failed to register VR device:`, error);
      throw error;
    }
  }

  async getDeviceInfo(deviceId) {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`VR device not found: ${deviceId}`);
      }

      return {
        success: true,
        deviceId: device.deviceId,
        type: device.type,
        model: device.model,
        capabilities: device.capabilities,
        status: device.status,
        registeredAt: device.registeredAt,
        lastSeen: device.lastSeen
      };
    } catch (error) {
      logger.error(`Failed to get device info for ${deviceId}:`, error);
      throw error;
    }
  }

  async listDevices() {
    try {
      const devicesList = [];
      
      for (const [deviceId, device] of this.devices.entries()) {
        devicesList.push({
          deviceId: device.deviceId,
          type: device.type,
          model: device.model,
          capabilities: device.capabilities,
          status: device.status,
          registeredAt: device.registeredAt,
          lastSeen: device.lastSeen
        });
      }

      return {
        success: true,
        devices: devicesList,
        count: devicesList.length
      };
    } catch (error) {
      logger.error('Failed to list VR devices:', error);
      throw error;
    }
  }

  async loadSessions() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      const sessionsPath = path.join(dataDir, 'vr-sessions.json');
      
      if (fs.existsSync(sessionsPath)) {
        const data = fs.readFileSync(sessionsPath, 'utf8');
        const sessions = JSON.parse(data);
        for (const [key, sessionData] of Object.entries(sessions)) {
          this.sessions.set(key, sessionData);
        }
        logger.info(`Loaded ${this.sessions.size} VR sessions`);
      }
    } catch (error) {
      logger.error('Failed to load VR sessions:', error);
    }
  }

  async saveSessions() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const sessionsPath = path.join(dataDir, 'vr-sessions.json');
      const sessionsObj = Object.fromEntries(this.sessions);
      fs.writeFileSync(sessionsPath, JSON.stringify(sessionsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save VR sessions:', error);
    }
  }

  async loadUsers() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      const usersPath = path.join(dataDir, 'vr-users.json');
      
      if (fs.existsSync(usersPath)) {
        const data = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(data);
        for (const [key, userData] of Object.entries(users)) {
          this.users.set(key, userData);
        }
        logger.info(`Loaded ${this.users.size} VR users`);
      }
    } catch (error) {
      logger.error('Failed to load VR users:', error);
    }
  }

  async saveUsers() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const usersPath = path.join(dataDir, 'vr-users.json');
      const usersObj = Object.fromEntries(this.users);
      fs.writeFileSync(usersPath, JSON.stringify(usersObj, null, 2));
    } catch (error) {
      logger.error('Failed to save VR users:', error);
    }
  }

  async loadDevices() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      const devicesPath = path.join(dataDir, 'vr-devices.json');
      
      if (fs.existsSync(devicesPath)) {
        const data = fs.readFileSync(devicesPath, 'utf8');
        const devices = JSON.parse(data);
        for (const [key, deviceData] of Object.entries(devices)) {
          this.devices.set(key, deviceData);
        }
        logger.info(`Loaded ${this.devices.size} VR devices`);
      }
    } catch (error) {
      logger.error('Failed to load VR devices:', error);
    }
  }

  async saveDevices() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const devicesPath = path.join(dataDir, 'vr-devices.json');
      const devicesObj = Object.fromEntries(this.devices);
      fs.writeFileSync(devicesPath, JSON.stringify(devicesObj, null, 2));
    } catch (error) {
      logger.error('Failed to save VR devices:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveSessions();
      await this.saveUsers();
      await this.saveDevices();
      this.sessions.clear();
      this.users.clear();
      this.devices.clear();
      logger.info('VR Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new VRManager();
