const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class InteractionManager {
  constructor() {
    this.interactions = new Map();
    this.events = new Map();
    this.gestures = new Map();
    this.haptics = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing Interaction Manager...');
      
      // Load existing data
      await this.loadInteractionData();
      
      logger.info('Interaction Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Interaction Manager:', error);
      throw error;
    }
  }

  async handleInteraction(userId, interactionData) {
    try {
      const interactionId = uuidv4();
      const interaction = {
        interactionId,
        userId,
        type: interactionData.type || 'click', // 'click', 'grab', 'point', 'gesture', 'voice'
        target: interactionData.target || null,
        position: interactionData.position || { x: 0, y: 0, z: 0 },
        direction: interactionData.direction || { x: 0, y: 0, z: 1 },
        intensity: interactionData.intensity || 1.0,
        duration: interactionData.duration || 0,
        metadata: interactionData.metadata || {},
        timestamp: new Date().toISOString()
      };

      this.interactions.set(interactionId, interaction);
      await this.saveInteractions();

      // Process interaction based on type
      const result = await this.processInteraction(interaction);

      logger.info(`Interaction handled: ${interactionId} (${interaction.type})`);
      
      return {
        success: true,
        interactionId,
        ...interaction,
        result
      };
    } catch (error) {
      logger.error(`Failed to handle interaction:`, error);
      throw error;
    }
  }

  async processInteraction(interaction) {
    try {
      switch (interaction.type) {
        case 'click':
          return await this.processClick(interaction);
        case 'grab':
          return await this.processGrab(interaction);
        case 'point':
          return await this.processPoint(interaction);
        case 'gesture':
          return await this.processGesture(interaction);
        case 'voice':
          return await this.processVoice(interaction);
        default:
          return { type: 'unknown', message: 'Unknown interaction type' };
      }
    } catch (error) {
      logger.error(`Failed to process interaction ${interaction.type}:`, error);
      throw error;
    }
  }

  async processClick(interaction) {
    try {
      // Simulate click processing
      const result = {
        type: 'click',
        target: interaction.target,
        position: interaction.position,
        success: true,
        message: 'Click processed successfully'
      };

      // Trigger haptic feedback if available
      if (interaction.metadata.haptic) {
        await this.triggerHaptic(interaction.userId, {
          type: 'click',
          intensity: 0.5,
          duration: 100
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to process click:', error);
      throw error;
    }
  }

  async processGrab(interaction) {
    try {
      // Simulate grab processing
      const result = {
        type: 'grab',
        target: interaction.target,
        position: interaction.position,
        success: true,
        message: 'Grab processed successfully',
        grabbed: true
      };

      // Trigger haptic feedback
      if (interaction.metadata.haptic) {
        await this.triggerHaptic(interaction.userId, {
          type: 'grab',
          intensity: 0.8,
          duration: 200
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to process grab:', error);
      throw error;
    }
  }

  async processPoint(interaction) {
    try {
      // Simulate point processing
      const result = {
        type: 'point',
        target: interaction.target,
        position: interaction.position,
        direction: interaction.direction,
        success: true,
        message: 'Point processed successfully'
      };

      return result;
    } catch (error) {
      logger.error('Failed to process point:', error);
      throw error;
    }
  }

  async processGesture(interaction) {
    try {
      const gestureType = interaction.metadata.gestureType || 'unknown';
      
      // Simulate gesture processing
      const result = {
        type: 'gesture',
        gestureType: gestureType,
        target: interaction.target,
        position: interaction.position,
        success: true,
        message: `Gesture ${gestureType} processed successfully`
      };

      // Trigger haptic feedback based on gesture
      if (interaction.metadata.haptic) {
        const hapticIntensity = this.getHapticIntensityForGesture(gestureType);
        await this.triggerHaptic(interaction.userId, {
          type: 'gesture',
          intensity: hapticIntensity,
          duration: 150
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to process gesture:', error);
      throw error;
    }
  }

  async processVoice(interaction) {
    try {
      const command = interaction.metadata.command || '';
      
      // Simulate voice command processing
      const result = {
        type: 'voice',
        command: command,
        success: true,
        message: `Voice command "${command}" processed successfully`,
        action: this.parseVoiceCommand(command)
      };

      return result;
    } catch (error) {
      logger.error('Failed to process voice:', error);
      throw error;
    }
  }

  async triggerHaptic(userId, hapticData) {
    try {
      const hapticId = uuidv4();
      const haptic = {
        hapticId,
        userId,
        type: hapticData.type || 'pulse',
        intensity: hapticData.intensity || 0.5,
        duration: hapticData.duration || 100,
        pattern: hapticData.pattern || 'single',
        triggeredAt: new Date().toISOString()
      };

      this.haptics.set(hapticId, haptic);
      await this.saveHaptics();

      logger.info(`Haptic triggered for user ${userId}: ${hapticId}`);
      
      return {
        success: true,
        hapticId,
        ...haptic
      };
    } catch (error) {
      logger.error(`Failed to trigger haptic for user ${userId}:`, error);
      throw error;
    }
  }

  async recordGesture(gestureData) {
    try {
      const gestureId = uuidv4();
      const gesture = {
        gestureId,
        userId: gestureData.userId,
        name: gestureData.name || 'Gesture',
        type: gestureData.type || 'custom',
        data: gestureData.data || [],
        confidence: gestureData.confidence || 1.0,
        recordedAt: new Date().toISOString()
      };

      this.gestures.set(gestureId, gesture);
      await this.saveGestures();

      logger.info(`Gesture recorded: ${gestureId}`);
      
      return {
        success: true,
        gestureId,
        ...gesture
      };
    } catch (error) {
      logger.error(`Failed to record gesture:`, error);
      throw error;
    }
  }

  async getInteractionHistory(userId, limit = 100) {
    try {
      const interactions = [];
      
      for (const [interactionId, interaction] of this.interactions.entries()) {
        if (interaction.userId === userId) {
          interactions.push({
            interactionId: interaction.interactionId,
            type: interaction.type,
            target: interaction.target,
            position: interaction.position,
            timestamp: interaction.timestamp
          });
        }
      }

      // Sort by timestamp (newest first) and limit
      interactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedInteractions = interactions.slice(0, limit);

      return {
        success: true,
        userId,
        interactions: limitedInteractions,
        count: limitedInteractions.length
      };
    } catch (error) {
      logger.error(`Failed to get interaction history for user ${userId}:`, error);
      throw error;
    }
  }

  async getGestureLibrary(userId) {
    try {
      const gestures = [];
      
      for (const [gestureId, gesture] of this.gestures.entries()) {
        if (gesture.userId === userId || gesture.type === 'system') {
          gestures.push({
            gestureId: gesture.gestureId,
            name: gesture.name,
            type: gesture.type,
            confidence: gesture.confidence,
            recordedAt: gesture.recordedAt
          });
        }
      }

      return {
        success: true,
        userId,
        gestures: gestures,
        count: gestures.length
      };
    } catch (error) {
      logger.error(`Failed to get gesture library for user ${userId}:`, error);
      throw error;
    }
  }

  async getHapticHistory(userId, limit = 50) {
    try {
      const haptics = [];
      
      for (const [hapticId, haptic] of this.haptics.entries()) {
        if (haptic.userId === userId) {
          haptics.push({
            hapticId: haptic.hapticId,
            type: haptic.type,
            intensity: haptic.intensity,
            duration: haptic.duration,
            pattern: haptic.pattern,
            triggeredAt: haptic.triggeredAt
          });
        }
      }

      // Sort by timestamp (newest first) and limit
      haptics.sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));
      const limitedHaptics = haptics.slice(0, limit);

      return {
        success: true,
        userId,
        haptics: limitedHaptics,
        count: limitedHaptics.length
      };
    } catch (error) {
      logger.error(`Failed to get haptic history for user ${userId}:`, error);
      throw error;
    }
  }

  getHapticIntensityForGesture(gestureType) {
    const intensityMap = {
      'swipe': 0.3,
      'pinch': 0.6,
      'tap': 0.4,
      'double-tap': 0.5,
      'long-press': 0.7,
      'rotate': 0.4,
      'scale': 0.5
    };
    return intensityMap[gestureType] || 0.5;
  }

  parseVoiceCommand(command) {
    const commandLower = command.toLowerCase();
    
    if (commandLower.includes('select') || commandLower.includes('choose')) {
      return 'select';
    } else if (commandLower.includes('grab') || commandLower.includes('pick')) {
      return 'grab';
    } else if (commandLower.includes('move') || commandLower.includes('drag')) {
      return 'move';
    } else if (commandLower.includes('delete') || commandLower.includes('remove')) {
      return 'delete';
    } else if (commandLower.includes('scale') || commandLower.includes('resize')) {
      return 'scale';
    } else if (commandLower.includes('rotate') || commandLower.includes('turn')) {
      return 'rotate';
    } else {
      return 'unknown';
    }
  }

  async cleanupUser(userId) {
    try {
      // Remove user's interactions
      for (const [interactionId, interaction] of this.interactions.entries()) {
        if (interaction.userId === userId) {
          this.interactions.delete(interactionId);
        }
      }

      // Remove user's gestures
      for (const [gestureId, gesture] of this.gestures.entries()) {
        if (gesture.userId === userId) {
          this.gestures.delete(gestureId);
        }
      }

      // Remove user's haptics
      for (const [hapticId, haptic] of this.haptics.entries()) {
        if (haptic.userId === userId) {
          this.haptics.delete(hapticId);
        }
      }

      await this.saveInteractions();
      await this.saveGestures();
      await this.saveHaptics();

      logger.info(`Cleaned up interaction data for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to cleanup interaction data for user ${userId}:`, error);
    }
  }

  async loadInteractionData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      
      // Load interactions
      const interactionsPath = path.join(dataDir, 'interactions.json');
      if (fs.existsSync(interactionsPath)) {
        const data = fs.readFileSync(interactionsPath, 'utf8');
        const interactions = JSON.parse(data);
        for (const [key, interactionData] of Object.entries(interactions)) {
          this.interactions.set(key, interactionData);
        }
      }
      
      // Load gestures
      const gesturesPath = path.join(dataDir, 'gestures.json');
      if (fs.existsSync(gesturesPath)) {
        const data = fs.readFileSync(gesturesPath, 'utf8');
        const gestures = JSON.parse(data);
        for (const [key, gestureData] of Object.entries(gestures)) {
          this.gestures.set(key, gestureData);
        }
      }
      
      // Load haptics
      const hapticsPath = path.join(dataDir, 'haptics.json');
      if (fs.existsSync(hapticsPath)) {
        const data = fs.readFileSync(hapticsPath, 'utf8');
        const haptics = JSON.parse(data);
        for (const [key, hapticData] of Object.entries(haptics)) {
          this.haptics.set(key, hapticData);
        }
      }
      
      logger.info(`Loaded interaction data: ${this.interactions.size} interactions, ${this.gestures.size} gestures, ${this.haptics.size} haptics`);
    } catch (error) {
      logger.error('Failed to load interaction data:', error);
    }
  }

  async saveInteractions() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const interactionsPath = path.join(dataDir, 'interactions.json');
      const interactionsObj = Object.fromEntries(this.interactions);
      fs.writeFileSync(interactionsPath, JSON.stringify(interactionsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save interactions:', error);
    }
  }

  async saveGestures() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const gesturesPath = path.join(dataDir, 'gestures.json');
      const gesturesObj = Object.fromEntries(this.gestures);
      fs.writeFileSync(gesturesPath, JSON.stringify(gesturesObj, null, 2));
    } catch (error) {
      logger.error('Failed to save gestures:', error);
    }
  }

  async saveHaptics() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const hapticsPath = path.join(dataDir, 'haptics.json');
      const hapticsObj = Object.fromEntries(this.haptics);
      fs.writeFileSync(hapticsPath, JSON.stringify(hapticsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save haptics:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveInteractions();
      await this.saveGestures();
      await this.saveHaptics();
      this.interactions.clear();
      this.gestures.clear();
      this.haptics.clear();
      logger.info('Interaction Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new InteractionManager();
