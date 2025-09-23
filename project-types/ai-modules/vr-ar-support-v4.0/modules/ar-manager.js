const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class ARManager {
  constructor() {
    this.sessions = new Map();
    this.users = new Map();
    this.anchors = new Map();
    this.planes = new Map();
    this.objects = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing AR Manager...');
      
      // Load existing data
      await this.loadARData();
      
      logger.info('AR Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize AR Manager:', error);
      throw error;
    }
  }

  async startSession(sessionData) {
    try {
      const sessionId = uuidv4();
      const session = {
        sessionId,
        userId: sessionData.userId,
        name: sessionData.name || 'AR Session',
        type: sessionData.type || 'world-tracking', // 'world-tracking', 'face-tracking', 'body-tracking'
        settings: {
          planeDetection: sessionData.settings?.planeDetection || true,
          lightEstimation: sessionData.settings?.lightEstimation || true,
          occlusion: sessionData.settings?.occlusion || false,
          peopleOcclusion: sessionData.settings?.peopleOcclusion || false,
          handTracking: sessionData.settings?.handTracking || false,
          faceTracking: sessionData.settings?.faceTracking || false
        },
        status: 'active',
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      this.sessions.set(sessionId, session);
      await this.saveSessions();

      logger.info(`AR session started: ${sessionId}`);
      
      return {
        success: true,
        sessionId,
        ...session
      };
    } catch (error) {
      logger.error(`Failed to start AR session:`, error);
      throw error;
    }
  }

  async stopSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`AR session not found: ${sessionId}`);
      }

      session.status = 'stopped';
      session.stoppedAt = new Date().toISOString();
      this.sessions.set(sessionId, session);
      
      // Clean up session data
      await this.cleanupSessionData(sessionId);
      await this.saveSessions();

      logger.info(`AR session stopped: ${sessionId}`);
      
      return {
        success: true,
        sessionId,
        status: session.status
      };
    } catch (error) {
      logger.error(`Failed to stop AR session:`, error);
      throw error;
    }
  }

  async createAnchor(anchorData) {
    try {
      const anchorId = uuidv4();
      const anchor = {
        anchorId,
        sessionId: anchorData.sessionId,
        type: anchorData.type || 'plane', // 'plane', 'image', 'face', 'object'
        position: anchorData.position || { x: 0, y: 0, z: 0 },
        rotation: anchorData.rotation || { x: 0, y: 0, z: 0 },
        scale: anchorData.scale || { x: 1, y: 1, z: 1 },
        confidence: anchorData.confidence || 1.0,
        status: 'active',
        createdAt: new Date().toISOString(),
        metadata: anchorData.metadata || {}
      };

      this.anchors.set(anchorId, anchor);
      await this.saveAnchors();

      logger.info(`AR anchor created: ${anchorId}`);
      
      return {
        success: true,
        anchorId,
        ...anchor
      };
    } catch (error) {
      logger.error(`Failed to create AR anchor:`, error);
      throw error;
    }
  }

  async updateAnchor(anchorId, updateData) {
    try {
      const anchor = this.anchors.get(anchorId);
      if (!anchor) {
        throw new Error(`AR anchor not found: ${anchorId}`);
      }

      anchor.position = updateData.position || anchor.position;
      anchor.rotation = updateData.rotation || anchor.rotation;
      anchor.scale = updateData.scale || anchor.scale;
      anchor.confidence = updateData.confidence || anchor.confidence;
      anchor.metadata = { ...anchor.metadata, ...(updateData.metadata || {}) };
      anchor.updatedAt = new Date().toISOString();
      
      this.anchors.set(anchorId, anchor);
      await this.saveAnchors();

      return {
        success: true,
        anchorId,
        ...anchor
      };
    } catch (error) {
      logger.error(`Failed to update AR anchor ${anchorId}:`, error);
      throw error;
    }
  }

  async deleteAnchor(anchorId) {
    try {
      const anchor = this.anchors.get(anchorId);
      if (!anchor) {
        throw new Error(`AR anchor not found: ${anchorId}`);
      }

      this.anchors.delete(anchorId);
      await this.saveAnchors();

      logger.info(`AR anchor deleted: ${anchorId}`);
      
      return {
        success: true,
        anchorId
      };
    } catch (error) {
      logger.error(`Failed to delete AR anchor ${anchorId}:`, error);
      throw error;
    }
  }

  async detectPlanes(sessionId, planeData) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`AR session not found: ${sessionId}`);
      }

      const planes = planeData.planes || [];
      const detectedPlanes = [];

      for (const plane of planes) {
        const planeId = uuidv4();
        const planeInfo = {
          planeId,
          sessionId,
          type: plane.type || 'horizontal', // 'horizontal', 'vertical'
          center: plane.center || { x: 0, y: 0, z: 0 },
          extent: plane.extent || { width: 0, height: 0 },
          normal: plane.normal || { x: 0, y: 1, z: 0 },
          confidence: plane.confidence || 1.0,
          detectedAt: new Date().toISOString()
        };

        this.planes.set(planeId, planeInfo);
        detectedPlanes.push(planeInfo);
      }

      await this.savePlanes();

      logger.info(`Detected ${detectedPlanes.length} AR planes in session ${sessionId}`);
      
      return {
        success: true,
        sessionId,
        planes: detectedPlanes,
        count: detectedPlanes.length
      };
    } catch (error) {
      logger.error(`Failed to detect planes in session ${sessionId}:`, error);
      throw error;
    }
  }

  async placeObject(objectData) {
    try {
      const objectId = uuidv4();
      const object = {
        objectId,
        sessionId: objectData.sessionId,
        anchorId: objectData.anchorId,
        assetId: objectData.assetId,
        position: objectData.position || { x: 0, y: 0, z: 0 },
        rotation: objectData.rotation || { x: 0, y: 0, z: 0 },
        scale: objectData.scale || { x: 1, y: 1, z: 1 },
        visible: objectData.visible !== false,
        interactive: objectData.interactive || false,
        placedAt: new Date().toISOString(),
        metadata: objectData.metadata || {}
      };

      this.objects.set(objectId, object);
      await this.saveObjects();

      logger.info(`AR object placed: ${objectId}`);
      
      return {
        success: true,
        objectId,
        ...object
      };
    } catch (error) {
      logger.error(`Failed to place AR object:`, error);
      throw error;
    }
  }

  async updateObject(objectId, updateData) {
    try {
      const object = this.objects.get(objectId);
      if (!object) {
        throw new Error(`AR object not found: ${objectId}`);
      }

      object.position = updateData.position || object.position;
      object.rotation = updateData.rotation || object.rotation;
      object.scale = updateData.scale || object.scale;
      object.visible = updateData.visible !== undefined ? updateData.visible : object.visible;
      object.interactive = updateData.interactive !== undefined ? updateData.interactive : object.interactive;
      object.metadata = { ...object.metadata, ...(updateData.metadata || {}) };
      object.updatedAt = new Date().toISOString();
      
      this.objects.set(objectId, object);
      await this.saveObjects();

      return {
        success: true,
        objectId,
        ...object
      };
    } catch (error) {
      logger.error(`Failed to update AR object ${objectId}:`, error);
      throw error;
    }
  }

  async removeObject(objectId) {
    try {
      const object = this.objects.get(objectId);
      if (!object) {
        throw new Error(`AR object not found: ${objectId}`);
      }

      this.objects.delete(objectId);
      await this.saveObjects();

      logger.info(`AR object removed: ${objectId}`);
      
      return {
        success: true,
        objectId
      };
    } catch (error) {
      logger.error(`Failed to remove AR object ${objectId}:`, error);
      throw error;
    }
  }

  async getSessionObjects(sessionId) {
    try {
      const objects = [];
      
      for (const [objectId, object] of this.objects.entries()) {
        if (object.sessionId === sessionId) {
          objects.push({
            objectId: object.objectId,
            anchorId: object.anchorId,
            assetId: object.assetId,
            position: object.position,
            rotation: object.rotation,
            scale: object.scale,
            visible: object.visible,
            interactive: object.interactive,
            placedAt: object.placedAt,
            metadata: object.metadata
          });
        }
      }

      return {
        success: true,
        sessionId,
        objects: objects,
        count: objects.length
      };
    } catch (error) {
      logger.error(`Failed to get objects for session ${sessionId}:`, error);
      throw error;
    }
  }

  async getSessionAnchors(sessionId) {
    try {
      const anchors = [];
      
      for (const [anchorId, anchor] of this.anchors.entries()) {
        if (anchor.sessionId === sessionId) {
          anchors.push({
            anchorId: anchor.anchorId,
            type: anchor.type,
            position: anchor.position,
            rotation: anchor.rotation,
            scale: anchor.scale,
            confidence: anchor.confidence,
            status: anchor.status,
            createdAt: anchor.createdAt,
            metadata: anchor.metadata
          });
        }
      }

      return {
        success: true,
        sessionId,
        anchors: anchors,
        count: anchors.length
      };
    } catch (error) {
      logger.error(`Failed to get anchors for session ${sessionId}:`, error);
      throw error;
    }
  }

  async getSessionInfo(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`AR session not found: ${sessionId}`);
      }

      const objects = await this.getSessionObjects(sessionId);
      const anchors = await this.getSessionAnchors(sessionId);

      return {
        success: true,
        sessionId: session.sessionId,
        userId: session.userId,
        name: session.name,
        type: session.type,
        settings: session.settings,
        status: session.status,
        startedAt: session.startedAt,
        stoppedAt: session.stoppedAt,
        objects: objects.objects,
        anchors: anchors.anchors
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
          userId: session.userId,
          name: session.name,
          type: session.type,
          status: session.status,
          startedAt: session.startedAt,
          stoppedAt: session.stoppedAt
        });
      }

      return {
        success: true,
        sessions: sessionsList,
        count: sessionsList.length
      };
    } catch (error) {
      logger.error('Failed to list AR sessions:', error);
      throw error;
    }
  }

  async cleanupSessionData(sessionId) {
    try {
      // Remove objects
      for (const [objectId, object] of this.objects.entries()) {
        if (object.sessionId === sessionId) {
          this.objects.delete(objectId);
        }
      }

      // Remove anchors
      for (const [anchorId, anchor] of this.anchors.entries()) {
        if (anchor.sessionId === sessionId) {
          this.anchors.delete(anchorId);
        }
      }

      // Remove planes
      for (const [planeId, plane] of this.planes.entries()) {
        if (plane.sessionId === sessionId) {
          this.planes.delete(planeId);
        }
      }

      await this.saveObjects();
      await this.saveAnchors();
      await this.savePlanes();

      logger.info(`Cleaned up data for AR session ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to cleanup session data for ${sessionId}:`, error);
    }
  }

  async loadARData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      
      // Load sessions
      const sessionsPath = path.join(dataDir, 'ar-sessions.json');
      if (fs.existsSync(sessionsPath)) {
        const data = fs.readFileSync(sessionsPath, 'utf8');
        const sessions = JSON.parse(data);
        for (const [key, sessionData] of Object.entries(sessions)) {
          this.sessions.set(key, sessionData);
        }
      }
      
      // Load anchors
      const anchorsPath = path.join(dataDir, 'ar-anchors.json');
      if (fs.existsSync(anchorsPath)) {
        const data = fs.readFileSync(anchorsPath, 'utf8');
        const anchors = JSON.parse(data);
        for (const [key, anchorData] of Object.entries(anchors)) {
          this.anchors.set(key, anchorData);
        }
      }
      
      // Load planes
      const planesPath = path.join(dataDir, 'ar-planes.json');
      if (fs.existsSync(planesPath)) {
        const data = fs.readFileSync(planesPath, 'utf8');
        const planes = JSON.parse(data);
        for (const [key, planeData] of Object.entries(planes)) {
          this.planes.set(key, planeData);
        }
      }
      
      // Load objects
      const objectsPath = path.join(dataDir, 'ar-objects.json');
      if (fs.existsSync(objectsPath)) {
        const data = fs.readFileSync(objectsPath, 'utf8');
        const objects = JSON.parse(data);
        for (const [key, objectData] of Object.entries(objects)) {
          this.objects.set(key, objectData);
        }
      }
      
      logger.info(`Loaded AR data: ${this.sessions.size} sessions, ${this.anchors.size} anchors, ${this.planes.size} planes, ${this.objects.size} objects`);
    } catch (error) {
      logger.error('Failed to load AR data:', error);
    }
  }

  async saveSessions() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const sessionsPath = path.join(dataDir, 'ar-sessions.json');
      const sessionsObj = Object.fromEntries(this.sessions);
      fs.writeFileSync(sessionsPath, JSON.stringify(sessionsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save AR sessions:', error);
    }
  }

  async saveAnchors() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const anchorsPath = path.join(dataDir, 'ar-anchors.json');
      const anchorsObj = Object.fromEntries(this.anchors);
      fs.writeFileSync(anchorsPath, JSON.stringify(anchorsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save AR anchors:', error);
    }
  }

  async savePlanes() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const planesPath = path.join(dataDir, 'ar-planes.json');
      const planesObj = Object.fromEntries(this.planes);
      fs.writeFileSync(planesPath, JSON.stringify(planesObj, null, 2));
    } catch (error) {
      logger.error('Failed to save AR planes:', error);
    }
  }

  async saveObjects() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const objectsPath = path.join(dataDir, 'ar-objects.json');
      const objectsObj = Object.fromEntries(this.objects);
      fs.writeFileSync(objectsPath, JSON.stringify(objectsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save AR objects:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveSessions();
      await this.saveAnchors();
      await this.savePlanes();
      await this.saveObjects();
      this.sessions.clear();
      this.anchors.clear();
      this.planes.clear();
      this.objects.clear();
      logger.info('AR Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new ARManager();
