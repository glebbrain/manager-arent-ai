const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class HandTrackingManager {
  constructor() {
    this.trackingData = new Map();
    this.gestures = new Map();
    this.calibrations = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing Hand Tracking Manager...');
      
      // Load existing data
      await this.loadTrackingData();
      
      logger.info('Hand Tracking Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Hand Tracking Manager:', error);
      throw error;
    }
  }

  async processHandData(userId, handData) {
    try {
      const trackingId = uuidv4();
      const tracking = {
        trackingId,
        userId,
        hand: handData.hand || 'right', // 'left', 'right', 'both'
        landmarks: handData.landmarks || [],
        confidence: handData.confidence || 0.0,
        gestures: handData.gestures || [],
        position: handData.position || { x: 0, y: 0, z: 0 },
        rotation: handData.rotation || { x: 0, y: 0, z: 0 },
        velocity: handData.velocity || { x: 0, y: 0, z: 0 },
        acceleration: handData.acceleration || { x: 0, y: 0, z: 0 },
        timestamp: new Date().toISOString()
      };

      this.trackingData.set(trackingId, tracking);
      await this.saveTrackingData();

      // Process gestures
      const gestureResults = await this.processGestures(tracking);

      logger.info(`Hand tracking data processed for user ${userId}: ${trackingId}`);
      
      return {
        success: true,
        trackingId,
        ...tracking,
        gestureResults
      };
    } catch (error) {
      logger.error(`Failed to process hand data for user ${userId}:`, error);
      throw error;
    }
  }

  async processGestures(tracking) {
    try {
      const gestures = [];
      const landmarks = tracking.landmarks;

      if (landmarks.length < 21) {
        return { gestures: [], confidence: 0 };
      }

      // Detect common gestures
      const detectedGestures = [];

      // Thumbs up
      if (this.isThumbsUp(landmarks)) {
        detectedGestures.push({
          name: 'thumbs_up',
          confidence: this.calculateGestureConfidence(landmarks, 'thumbs_up'),
          hand: tracking.hand
        });
      }

      // Peace sign
      if (this.isPeaceSign(landmarks)) {
        detectedGestures.push({
          name: 'peace_sign',
          confidence: this.calculateGestureConfidence(landmarks, 'peace_sign'),
          hand: tracking.hand
        });
      }

      // Fist
      if (this.isFist(landmarks)) {
        detectedGestures.push({
          name: 'fist',
          confidence: this.calculateGestureConfidence(landmarks, 'fist'),
          hand: tracking.hand
        });
      }

      // Open hand
      if (this.isOpenHand(landmarks)) {
        detectedGestures.push({
          name: 'open_hand',
          confidence: this.calculateGestureConfidence(landmarks, 'open_hand'),
          hand: tracking.hand
        });
      }

      // Point
      if (this.isPoint(landmarks)) {
        detectedGestures.push({
          name: 'point',
          confidence: this.calculateGestureConfidence(landmarks, 'point'),
          hand: tracking.hand
        });
      }

      // OK sign
      if (this.isOKSign(landmarks)) {
        detectedGestures.push({
          name: 'ok_sign',
          confidence: this.calculateGestureConfidence(landmarks, 'ok_sign'),
          hand: tracking.hand
        });
      }

      return {
        gestures: detectedGestures,
        confidence: detectedGestures.length > 0 ? Math.max(...detectedGestures.map(g => g.confidence)) : 0
      };
    } catch (error) {
      logger.error('Failed to process gestures:', error);
      return { gestures: [], confidence: 0 };
    }
  }

  isThumbsUp(landmarks) {
    if (landmarks.length < 21) return false;
    
    const thumb_tip = landmarks[4];
    const thumb_ip = landmarks[3];
    const thumb_mcp = landmarks[2];
    const index_mcp = landmarks[5];
    
    // Thumb extended upward
    const thumbExtended = thumb_tip.y < thumb_ip.y && thumb_ip.y < thumb_mcp.y;
    
    // Other fingers closed
    const otherFingersClosed = this.areFingersClosed(landmarks, [1, 2, 3]); // Index, middle, ring, pinky
    
    return thumbExtended && otherFingersClosed;
  }

  isPeaceSign(landmarks) {
    if (landmarks.length < 21) return false;
    
    const index_tip = landmarks[8];
    const index_pip = landmarks[6];
    const middle_tip = landmarks[12];
    const middle_pip = landmarks[10];
    const ring_tip = landmarks[16];
    const ring_pip = landmarks[14];
    const pinky_tip = landmarks[20];
    const pinky_pip = landmarks[18];
    
    // Index and middle fingers extended
    const indexExtended = index_tip.y < index_pip.y;
    const middleExtended = middle_tip.y < middle_pip.y;
    
    // Ring and pinky fingers closed
    const ringClosed = ring_tip.y > ring_pip.y;
    const pinkyClosed = pinky_tip.y > pinky_pip.y;
    
    return indexExtended && middleExtended && ringClosed && pinkyClosed;
  }

  isFist(landmarks) {
    if (landmarks.length < 21) return false;
    
    // All fingers closed
    return this.areFingersClosed(landmarks, [0, 1, 2, 3, 4]);
  }

  isOpenHand(landmarks) {
    if (landmarks.length < 21) return false;
    
    // All fingers extended
    const indexExtended = landmarks[8].y < landmarks[6].y;
    const middleExtended = landmarks[12].y < landmarks[10].y;
    const ringExtended = landmarks[16].y < landmarks[14].y;
    const pinkyExtended = landmarks[20].y < landmarks[18].y;
    const thumbExtended = landmarks[4].x > landmarks[3].x; // Thumb extended sideways
    
    return indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended;
  }

  isPoint(landmarks) {
    if (landmarks.length < 21) return false;
    
    const index_tip = landmarks[8];
    const index_pip = landmarks[6];
    const middle_tip = landmarks[12];
    const middle_pip = landmarks[10];
    const ring_tip = landmarks[16];
    const ring_pip = landmarks[14];
    const pinky_tip = landmarks[20];
    const pinky_pip = landmarks[18];
    
    // Only index finger extended
    const indexExtended = index_tip.y < index_pip.y;
    const otherFingersClosed = middle_tip.y > middle_pip.y && 
                             ring_tip.y > ring_pip.y && 
                             pinky_tip.y > pinky_pip.y;
    
    return indexExtended && otherFingersClosed;
  }

  isOKSign(landmarks) {
    if (landmarks.length < 21) return false;
    
    const thumb_tip = landmarks[4];
    const index_tip = landmarks[8];
    const middle_tip = landmarks[12];
    const ring_tip = landmarks[16];
    const pinky_tip = landmarks[20];
    
    // Thumb and index finger tips close together
    const thumbIndexClose = this.calculateDistance(thumb_tip, index_tip) < 0.05;
    
    // Other fingers extended
    const otherFingersExtended = middle_tip.y < landmarks[10].y && 
                                ring_tip.y < landmarks[14].y && 
                                pinky_tip.y < landmarks[18].y;
    
    return thumbIndexClose && otherFingersExtended;
  }

  areFingersClosed(landmarks, fingerIndices) {
    // Simplified check - in real implementation, you'd check each finger's joints
    return fingerIndices.every(fingerIndex => {
      const tip = landmarks[fingerIndex * 4 + 3];
      const pip = landmarks[fingerIndex * 4 + 1];
      return tip.y > pip.y; // Finger is closed if tip is below PIP joint
    });
  }

  calculateGestureConfidence(landmarks, gestureType) {
    // Simplified confidence calculation
    // In real implementation, this would be more sophisticated
    const baseConfidence = 0.8;
    const landmarkQuality = this.assessLandmarkQuality(landmarks);
    return Math.min(1.0, baseConfidence * landmarkQuality);
  }

  assessLandmarkQuality(landmarks) {
    if (landmarks.length < 21) return 0;
    
    // Check for reasonable landmark positions
    let quality = 1.0;
    
    // Check if landmarks are within reasonable bounds
    for (const landmark of landmarks) {
      if (landmark.x < 0 || landmark.x > 1 || landmark.y < 0 || landmark.y > 1) {
        quality *= 0.8;
      }
    }
    
    return quality;
  }

  calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = (point1.z || 0) - (point2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  async recordGesture(gestureData) {
    try {
      const gestureId = uuidv4();
      const gesture = {
        gestureId,
        userId: gestureData.userId,
        name: gestureData.name || 'Custom Gesture',
        type: gestureData.type || 'custom',
        landmarks: gestureData.landmarks || [],
        template: gestureData.template || null,
        confidence: gestureData.confidence || 0.0,
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

  async calibrateHand(userId, calibrationData) {
    try {
      const calibrationId = uuidv4();
      const calibration = {
        calibrationId,
        userId,
        hand: calibrationData.hand || 'right',
        landmarks: calibrationData.landmarks || [],
        settings: {
          sensitivity: calibrationData.settings?.sensitivity || 0.5,
          threshold: calibrationData.settings?.threshold || 0.7,
          smoothing: calibrationData.settings?.smoothing || 0.3
        },
        calibratedAt: new Date().toISOString()
      };

      this.calibrations.set(calibrationId, calibration);
      await this.saveCalibrations();

      logger.info(`Hand calibrated for user ${userId}: ${calibrationId}`);
      
      return {
        success: true,
        calibrationId,
        ...calibration
      };
    } catch (error) {
      logger.error(`Failed to calibrate hand for user ${userId}:`, error);
      throw error;
    }
  }

  async getUserTrackingData(userId, limit = 100) {
    try {
      const trackingData = [];
      
      for (const [trackingId, tracking] of this.trackingData.entries()) {
        if (tracking.userId === userId) {
          trackingData.push({
            trackingId: tracking.trackingId,
            hand: tracking.hand,
            confidence: tracking.confidence,
            position: tracking.position,
            rotation: tracking.rotation,
            timestamp: tracking.timestamp
          });
        }
      }

      // Sort by timestamp (newest first) and limit
      trackingData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedData = trackingData.slice(0, limit);

      return {
        success: true,
        userId,
        trackingData: limitedData,
        count: limitedData.length
      };
    } catch (error) {
      logger.error(`Failed to get tracking data for user ${userId}:`, error);
      throw error;
    }
  }

  async getUserGestures(userId) {
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
      logger.error(`Failed to get gestures for user ${userId}:`, error);
      throw error;
    }
  }

  async getUserCalibrations(userId) {
    try {
      const calibrations = [];
      
      for (const [calibrationId, calibration] of this.calibrations.entries()) {
        if (calibration.userId === userId) {
          calibrations.push({
            calibrationId: calibration.calibrationId,
            hand: calibration.hand,
            settings: calibration.settings,
            calibratedAt: calibration.calibratedAt
          });
        }
      }

      return {
        success: true,
        userId,
        calibrations: calibrations,
        count: calibrations.length
      };
    } catch (error) {
      logger.error(`Failed to get calibrations for user ${userId}:`, error);
      throw error;
    }
  }

  async cleanupUser(userId) {
    try {
      // Remove user's tracking data
      for (const [trackingId, tracking] of this.trackingData.entries()) {
        if (tracking.userId === userId) {
          this.trackingData.delete(trackingId);
        }
      }

      // Remove user's gestures
      for (const [gestureId, gesture] of this.gestures.entries()) {
        if (gesture.userId === userId) {
          this.gestures.delete(gestureId);
        }
      }

      // Remove user's calibrations
      for (const [calibrationId, calibration] of this.calibrations.entries()) {
        if (calibration.userId === userId) {
          this.calibrations.delete(calibrationId);
        }
      }

      await this.saveTrackingData();
      await this.saveGestures();
      await this.saveCalibrations();

      logger.info(`Cleaned up hand tracking data for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to cleanup hand tracking data for user ${userId}:`, error);
    }
  }

  async loadTrackingData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      
      // Load tracking data
      const trackingPath = path.join(dataDir, 'hand-tracking.json');
      if (fs.existsSync(trackingPath)) {
        const data = fs.readFileSync(trackingPath, 'utf8');
        const tracking = JSON.parse(data);
        for (const [key, trackingData] of Object.entries(tracking)) {
          this.trackingData.set(key, trackingData);
        }
      }
      
      // Load gestures
      const gesturesPath = path.join(dataDir, 'hand-gestures.json');
      if (fs.existsSync(gesturesPath)) {
        const data = fs.readFileSync(gesturesPath, 'utf8');
        const gestures = JSON.parse(data);
        for (const [key, gestureData] of Object.entries(gestures)) {
          this.gestures.set(key, gestureData);
        }
      }
      
      // Load calibrations
      const calibrationsPath = path.join(dataDir, 'hand-calibrations.json');
      if (fs.existsSync(calibrationsPath)) {
        const data = fs.readFileSync(calibrationsPath, 'utf8');
        const calibrations = JSON.parse(data);
        for (const [key, calibrationData] of Object.entries(calibrations)) {
          this.calibrations.set(key, calibrationData);
        }
      }
      
      logger.info(`Loaded hand tracking data: ${this.trackingData.size} tracking records, ${this.gestures.size} gestures, ${this.calibrations.size} calibrations`);
    } catch (error) {
      logger.error('Failed to load hand tracking data:', error);
    }
  }

  async saveTrackingData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const trackingPath = path.join(dataDir, 'hand-tracking.json');
      const trackingObj = Object.fromEntries(this.trackingData);
      fs.writeFileSync(trackingPath, JSON.stringify(trackingObj, null, 2));
    } catch (error) {
      logger.error('Failed to save tracking data:', error);
    }
  }

  async saveGestures() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const gesturesPath = path.join(dataDir, 'hand-gestures.json');
      const gesturesObj = Object.fromEntries(this.gestures);
      fs.writeFileSync(gesturesPath, JSON.stringify(gesturesObj, null, 2));
    } catch (error) {
      logger.error('Failed to save gestures:', error);
    }
  }

  async saveCalibrations() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const calibrationsPath = path.join(dataDir, 'hand-calibrations.json');
      const calibrationsObj = Object.fromEntries(this.calibrations);
      fs.writeFileSync(calibrationsPath, JSON.stringify(calibrationsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save calibrations:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveTrackingData();
      await this.saveGestures();
      await this.saveCalibrations();
      this.trackingData.clear();
      this.gestures.clear();
      this.calibrations.clear();
      logger.info('Hand Tracking Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new HandTrackingManager();
