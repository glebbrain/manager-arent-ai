const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class SpatialAudioManager {
  constructor() {
    this.sources = new Map();
    this.listeners = new Map();
    this.environments = new Map();
    this.effects = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing Spatial Audio Manager...');
      
      // Load existing data
      await this.loadAudioData();
      
      logger.info('Spatial Audio Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Spatial Audio Manager:', error);
      throw error;
    }
  }

  async createAudioSource(sourceData) {
    try {
      const sourceId = uuidv4();
      const source = {
        sourceId,
        userId: sourceData.userId,
        name: sourceData.name || 'Audio Source',
        type: sourceData.type || 'positional', // 'positional', 'ambient', 'directional'
        position: sourceData.position || { x: 0, y: 0, z: 0 },
        direction: sourceData.direction || { x: 0, y: 0, z: 1 },
        audioUrl: sourceData.audioUrl || null,
        audioData: sourceData.audioData || null,
        settings: {
          volume: sourceData.settings?.volume || 1.0,
          pitch: sourceData.settings?.pitch || 1.0,
          loop: sourceData.settings?.loop || false,
          autoplay: sourceData.settings?.autoplay || false,
          maxDistance: sourceData.settings?.maxDistance || 100,
          rolloffFactor: sourceData.settings?.rolloffFactor || 1.0,
          refDistance: sourceData.settings?.refDistance || 1.0
        },
        effects: sourceData.effects || [],
        status: 'created',
        createdAt: new Date().toISOString()
      };

      this.sources.set(sourceId, source);
      await this.saveSources();

      logger.info(`Audio source created: ${sourceId}`);
      
      return {
        success: true,
        sourceId,
        ...source
      };
    } catch (error) {
      logger.error(`Failed to create audio source:`, error);
      throw error;
    }
  }

  async updateSpatialAudio(userId, audioData) {
    try {
      const { sourceId, position, direction, settings } = audioData;
      
      if (!sourceId) {
        throw new Error('Source ID is required');
      }

      const source = this.sources.get(sourceId);
      if (!source) {
        throw new Error(`Audio source not found: ${sourceId}`);
      }

      if (source.userId !== userId) {
        throw new Error('User not authorized to update this audio source');
      }

      // Update position and direction
      if (position) {
        source.position = position;
      }
      if (direction) {
        source.direction = direction;
      }
      if (settings) {
        source.settings = { ...source.settings, ...settings };
      }

      source.updatedAt = new Date().toISOString();
      this.sources.set(sourceId, source);
      await this.saveSources();

      return {
        success: true,
        sourceId,
        position: source.position,
        direction: source.direction,
        settings: source.settings
      };
    } catch (error) {
      logger.error(`Failed to update spatial audio for user ${userId}:`, error);
      throw error;
    }
  }

  async playAudio(sourceId, playData = {}) {
    try {
      const source = this.sources.get(sourceId);
      if (!source) {
        throw new Error(`Audio source not found: ${sourceId}`);
      }

      source.status = 'playing';
      source.playedAt = new Date().toISOString();
      source.playSettings = {
        startTime: playData.startTime || 0,
        volume: playData.volume || source.settings.volume,
        pitch: playData.pitch || source.settings.pitch,
        loop: playData.loop !== undefined ? playData.loop : source.settings.loop
      };

      this.sources.set(sourceId, source);
      await this.saveSources();

      logger.info(`Audio source playing: ${sourceId}`);
      
      return {
        success: true,
        sourceId,
        status: source.status,
        playSettings: source.playSettings
      };
    } catch (error) {
      logger.error(`Failed to play audio source ${sourceId}:`, error);
      throw error;
    }
  }

  async pauseAudio(sourceId) {
    try {
      const source = this.sources.get(sourceId);
      if (!source) {
        throw new Error(`Audio source not found: ${sourceId}`);
      }

      source.status = 'paused';
      source.pausedAt = new Date().toISOString();
      
      this.sources.set(sourceId, source);
      await this.saveSources();

      logger.info(`Audio source paused: ${sourceId}`);
      
      return {
        success: true,
        sourceId,
        status: source.status
      };
    } catch (error) {
      logger.error(`Failed to pause audio source ${sourceId}:`, error);
      throw error;
    }
  }

  async stopAudio(sourceId) {
    try {
      const source = this.sources.get(sourceId);
      if (!source) {
        throw new Error(`Audio source not found: ${sourceId}`);
      }

      source.status = 'stopped';
      source.stoppedAt = new Date().toISOString();
      
      this.sources.set(sourceId, source);
      await this.saveSources();

      logger.info(`Audio source stopped: ${sourceId}`);
      
      return {
        success: true,
        sourceId,
        status: source.status
      };
    } catch (error) {
      logger.error(`Failed to stop audio source ${sourceId}:`, error);
      throw error;
    }
  }

  async createAudioListener(listenerData) {
    try {
      const listenerId = uuidv4();
      const listener = {
        listenerId,
        userId: listenerData.userId,
        position: listenerData.position || { x: 0, y: 0, z: 0 },
        orientation: listenerData.orientation || { x: 0, y: 0, z: 0, w: 1 },
        settings: {
          volume: listenerData.settings?.volume || 1.0,
          dopplerFactor: listenerData.settings?.dopplerFactor || 1.0,
          speedOfSound: listenerData.settings?.speedOfSound || 343.3
        },
        status: 'active',
        createdAt: new Date().toISOString()
      };

      this.listeners.set(listenerId, listener);
      await this.saveListeners();

      logger.info(`Audio listener created: ${listenerId}`);
      
      return {
        success: true,
        listenerId,
        ...listener
      };
    } catch (error) {
      logger.error(`Failed to create audio listener:`, error);
      throw error;
    }
  }

  async updateListener(listenerId, updateData) {
    try {
      const listener = this.listeners.get(listenerId);
      if (!listener) {
        throw new Error(`Audio listener not found: ${listenerId}`);
      }

      listener.position = updateData.position || listener.position;
      listener.orientation = updateData.orientation || listener.orientation;
      listener.settings = { ...listener.settings, ...(updateData.settings || {}) };
      listener.updatedAt = new Date().toISOString();
      
      this.listeners.set(listenerId, listener);
      await this.saveListeners();

      return {
        success: true,
        listenerId,
        ...listener
      };
    } catch (error) {
      logger.error(`Failed to update audio listener ${listenerId}:`, error);
      throw error;
    }
  }

  async createAudioEnvironment(environmentData) {
    try {
      const environmentId = uuidv4();
      const environment = {
        environmentId,
        name: environmentData.name || 'Audio Environment',
        type: environmentData.type || 'room', // 'room', 'outdoor', 'cave', 'hall'
        settings: {
          reverb: environmentData.settings?.reverb || {
            enabled: true,
            roomSize: 0.5,
            damping: 0.5,
            wet: 0.3,
            dry: 0.7
          },
          occlusion: environmentData.settings?.occlusion || {
            enabled: false,
            factor: 0.5
          },
          echo: environmentData.settings?.echo || {
            enabled: false,
            delay: 0.1,
            feedback: 0.3
          }
        },
        bounds: environmentData.bounds || {
          min: { x: -50, y: -50, z: -50 },
          max: { x: 50, y: 50, z: 50 }
        },
        status: 'active',
        createdAt: new Date().toISOString()
      };

      this.environments.set(environmentId, environment);
      await this.saveEnvironments();

      logger.info(`Audio environment created: ${environmentId}`);
      
      return {
        success: true,
        environmentId,
        ...environment
      };
    } catch (error) {
      logger.error(`Failed to create audio environment:`, error);
      throw error;
    }
  }

  async addAudioEffect(effectData) {
    try {
      const effectId = uuidv4();
      const effect = {
        effectId,
        sourceId: effectData.sourceId,
        type: effectData.type || 'filter', // 'filter', 'reverb', 'echo', 'distortion', 'chorus'
        settings: effectData.settings || {},
        enabled: effectData.enabled !== false,
        createdAt: new Date().toISOString()
      };

      this.effects.set(effectId, effect);
      await this.saveEffects();

      // Add effect to source
      const source = this.sources.get(effectData.sourceId);
      if (source) {
        source.effects.push(effectId);
        this.sources.set(effectData.sourceId, source);
        await this.saveSources();
      }

      logger.info(`Audio effect added: ${effectId}`);
      
      return {
        success: true,
        effectId,
        ...effect
      };
    } catch (error) {
      logger.error(`Failed to add audio effect:`, error);
      throw error;
    }
  }

  async getUserAudioSources(userId) {
    try {
      const sources = [];
      
      for (const [sourceId, source] of this.sources.entries()) {
        if (source.userId === userId) {
          sources.push({
            sourceId: source.sourceId,
            name: source.name,
            type: source.type,
            position: source.position,
            direction: source.direction,
            settings: source.settings,
            status: source.status,
            createdAt: source.createdAt
          });
        }
      }

      return {
        success: true,
        userId,
        sources: sources,
        count: sources.length
      };
    } catch (error) {
      logger.error(`Failed to get audio sources for user ${userId}:`, error);
      throw error;
    }
  }

  async getAudioSource(sourceId) {
    try {
      const source = this.sources.get(sourceId);
      if (!source) {
        throw new Error(`Audio source not found: ${sourceId}`);
      }

      return {
        success: true,
        sourceId: source.sourceId,
        name: source.name,
        type: source.type,
        position: source.position,
        direction: source.direction,
        audioUrl: source.audioUrl,
        settings: source.settings,
        effects: source.effects,
        status: source.status,
        createdAt: source.createdAt
      };
    } catch (error) {
      logger.error(`Failed to get audio source ${sourceId}:`, error);
      throw error;
    }
  }

  async calculateSpatialAudio(listenerId, sourceId) {
    try {
      const listener = this.listeners.get(listenerId);
      const source = this.sources.get(sourceId);
      
      if (!listener) {
        throw new Error(`Audio listener not found: ${listenerId}`);
      }
      if (!source) {
        throw new Error(`Audio source not found: ${sourceId}`);
      }

      // Calculate distance
      const distance = this.calculateDistance(listener.position, source.position);
      
      // Calculate volume based on distance and rolloff
      const maxDistance = source.settings.maxDistance;
      const refDistance = source.settings.refDistance;
      const rolloffFactor = source.settings.rolloffFactor;
      
      let volume = source.settings.volume;
      if (distance > refDistance) {
        const attenuation = Math.pow(distance / refDistance, rolloffFactor);
        volume = source.settings.volume / attenuation;
      }
      
      if (distance > maxDistance) {
        volume = 0;
      }

      // Calculate 3D panning
      const panning = this.calculatePanning(listener.position, listener.orientation, source.position);

      return {
        success: true,
        listenerId,
        sourceId,
        distance,
        volume: Math.max(0, Math.min(1, volume)),
        panning: panning,
        audible: volume > 0.01
      };
    } catch (error) {
      logger.error(`Failed to calculate spatial audio:`, error);
      throw error;
    }
  }

  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  calculatePanning(listenerPos, listenerOri, sourcePos) {
    // Simplified 3D panning calculation
    const dx = sourcePos.x - listenerPos.x;
    const dz = sourcePos.z - listenerPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance === 0) return { left: 0.5, right: 0.5 };
    
    const angle = Math.atan2(dx, dz) - Math.atan2(listenerOri.x, listenerOri.z);
    const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
    
    return {
      left: Math.max(0, Math.min(1, 1 - normalizedAngle)),
      right: Math.max(0, Math.min(1, normalizedAngle))
    };
  }

  async cleanupUser(userId) {
    try {
      // Remove user's audio sources
      for (const [sourceId, source] of this.sources.entries()) {
        if (source.userId === userId) {
          this.sources.delete(sourceId);
        }
      }

      // Remove user's listeners
      for (const [listenerId, listener] of this.listeners.entries()) {
        if (listener.userId === userId) {
          this.listeners.delete(listenerId);
        }
      }

      await this.saveSources();
      await this.saveListeners();

      logger.info(`Cleaned up audio data for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to cleanup audio data for user ${userId}:`, error);
    }
  }

  async loadAudioData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      
      // Load sources
      const sourcesPath = path.join(dataDir, 'audio-sources.json');
      if (fs.existsSync(sourcesPath)) {
        const data = fs.readFileSync(sourcesPath, 'utf8');
        const sources = JSON.parse(data);
        for (const [key, sourceData] of Object.entries(sources)) {
          this.sources.set(key, sourceData);
        }
      }
      
      // Load listeners
      const listenersPath = path.join(dataDir, 'audio-listeners.json');
      if (fs.existsSync(listenersPath)) {
        const data = fs.readFileSync(listenersPath, 'utf8');
        const listeners = JSON.parse(data);
        for (const [key, listenerData] of Object.entries(listeners)) {
          this.listeners.set(key, listenerData);
        }
      }
      
      // Load environments
      const environmentsPath = path.join(dataDir, 'audio-environments.json');
      if (fs.existsSync(environmentsPath)) {
        const data = fs.readFileSync(environmentsPath, 'utf8');
        const environments = JSON.parse(data);
        for (const [key, environmentData] of Object.entries(environments)) {
          this.environments.set(key, environmentData);
        }
      }
      
      // Load effects
      const effectsPath = path.join(dataDir, 'audio-effects.json');
      if (fs.existsSync(effectsPath)) {
        const data = fs.readFileSync(effectsPath, 'utf8');
        const effects = JSON.parse(data);
        for (const [key, effectData] of Object.entries(effects)) {
          this.effects.set(key, effectData);
        }
      }
      
      logger.info(`Loaded audio data: ${this.sources.size} sources, ${this.listeners.size} listeners, ${this.environments.size} environments, ${this.effects.size} effects`);
    } catch (error) {
      logger.error('Failed to load audio data:', error);
    }
  }

  async saveSources() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const sourcesPath = path.join(dataDir, 'audio-sources.json');
      const sourcesObj = Object.fromEntries(this.sources);
      fs.writeFileSync(sourcesPath, JSON.stringify(sourcesObj, null, 2));
    } catch (error) {
      logger.error('Failed to save audio sources:', error);
    }
  }

  async saveListeners() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const listenersPath = path.join(dataDir, 'audio-listeners.json');
      const listenersObj = Object.fromEntries(this.listeners);
      fs.writeFileSync(listenersPath, JSON.stringify(listenersObj, null, 2));
    } catch (error) {
      logger.error('Failed to save audio listeners:', error);
    }
  }

  async saveEnvironments() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const environmentsPath = path.join(dataDir, 'audio-environments.json');
      const environmentsObj = Object.fromEntries(this.environments);
      fs.writeFileSync(environmentsPath, JSON.stringify(environmentsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save audio environments:', error);
    }
  }

  async saveEffects() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const effectsPath = path.join(dataDir, 'audio-effects.json');
      const effectsObj = Object.fromEntries(this.effects);
      fs.writeFileSync(effectsPath, JSON.stringify(effectsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save audio effects:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveSources();
      await this.saveListeners();
      await this.saveEnvironments();
      await this.saveEffects();
      this.sources.clear();
      this.listeners.clear();
      this.environments.clear();
      this.effects.clear();
      logger.info('Spatial Audio Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new SpatialAudioManager();
