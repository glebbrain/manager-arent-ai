const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class EyeTrackingManager {
  constructor() {
    this.trackingData = new Map();
    this.gazePoints = new Map();
    this.fixations = new Map();
    this.saccades = new Map();
    this.calibrations = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing Eye Tracking Manager...');
      
      // Load existing data
      await this.loadTrackingData();
      
      logger.info('Eye Tracking Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Eye Tracking Manager:', error);
      throw error;
    }
  }

  async processEyeData(userId, eyeData) {
    try {
      const trackingId = uuidv4();
      const tracking = {
        trackingId,
        userId,
        leftEye: eyeData.leftEye || {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          pupilSize: 0,
          confidence: 0
        },
        rightEye: eyeData.rightEye || {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          pupilSize: 0,
          confidence: 0
        },
        gazePoint: eyeData.gazePoint || { x: 0, y: 0, z: 0 },
        gazeDirection: eyeData.gazeDirection || { x: 0, y: 0, z: 1 },
        confidence: eyeData.confidence || 0.0,
        timestamp: new Date().toISOString()
      };

      this.trackingData.set(trackingId, tracking);
      await this.saveTrackingData();

      // Process gaze data
      const gazeResults = await this.processGazeData(tracking);

      logger.info(`Eye tracking data processed for user ${userId}: ${trackingId}`);
      
      return {
        success: true,
        trackingId,
        ...tracking,
        gazeResults
      };
    } catch (error) {
      logger.error(`Failed to process eye data for user ${userId}:`, error);
      throw error;
    }
  }

  async processGazeData(tracking) {
    try {
      const gazePoint = tracking.gazePoint;
      const confidence = tracking.confidence;

      // Record gaze point
      const gazePointId = uuidv4();
      const gazePointData = {
        gazePointId,
        userId: tracking.userId,
        position: gazePoint,
        confidence: confidence,
        timestamp: tracking.timestamp
      };

      this.gazePoints.set(gazePointId, gazePointData);

      // Detect fixations and saccades
      const fixationResults = await this.detectFixations(tracking.userId, gazePoint, confidence);
      const saccadeResults = await this.detectSaccades(tracking.userId, gazePoint, confidence);

      return {
        gazePoint: gazePointData,
        fixations: fixationResults,
        saccades: saccadeResults
      };
    } catch (error) {
      logger.error('Failed to process gaze data:', error);
      return { gazePoint: null, fixations: [], saccades: [] };
    }
  }

  async detectFixations(userId, gazePoint, confidence) {
    try {
      const fixations = [];
      const recentGazePoints = this.getRecentGazePoints(userId, 1000); // Last 1 second
      
      if (recentGazePoints.length < 5) {
        return fixations;
      }

      // Calculate gaze point cluster
      const cluster = this.calculateGazeCluster(recentGazePoints);
      
      // Check if points form a fixation (stable gaze)
      if (cluster.radius < 0.05 && cluster.duration > 100) { // 5cm radius, 100ms duration
        const fixationId = uuidv4();
        const fixation = {
          fixationId,
          userId,
          center: cluster.center,
          radius: cluster.radius,
          duration: cluster.duration,
          confidence: cluster.confidence,
          startTime: cluster.startTime,
          endTime: cluster.endTime,
          timestamp: new Date().toISOString()
        };

        this.fixations.set(fixationId, fixation);
        fixations.push(fixation);
      }

      return fixations;
    } catch (error) {
      logger.error('Failed to detect fixations:', error);
      return [];
    }
  }

  async detectSaccades(userId, gazePoint, confidence) {
    try {
      const saccades = [];
      const recentGazePoints = this.getRecentGazePoints(userId, 200); // Last 200ms
      
      if (recentGazePoints.length < 3) {
        return saccades;
      }

      // Calculate gaze velocity
      const velocity = this.calculateGazeVelocity(recentGazePoints);
      
      // Check if movement is a saccade (rapid eye movement)
      if (velocity.magnitude > 0.1 && velocity.magnitude < 1.0) { // 10cm/s to 1m/s
        const saccadeId = uuidv4();
        const saccade = {
          saccadeId,
          userId,
          startPoint: recentGazePoints[0].position,
          endPoint: recentGazePoints[recentGazePoints.length - 1].position,
          velocity: velocity,
          duration: velocity.duration,
          amplitude: velocity.amplitude,
          confidence: confidence,
          timestamp: new Date().toISOString()
        };

        this.saccades.set(saccadeId, saccade);
        saccades.push(saccade);
      }

      return saccades;
    } catch (error) {
      logger.error('Failed to detect saccades:', error);
      return [];
    }
  }

  getRecentGazePoints(userId, timeWindow) {
    const now = new Date();
    const recentPoints = [];

    for (const [gazePointId, gazePoint] of this.gazePoints.entries()) {
      if (gazePoint.userId === userId) {
        const pointTime = new Date(gazePoint.timestamp);
        if (now - pointTime <= timeWindow) {
          recentPoints.push(gazePoint);
        }
      }
    }

    return recentPoints.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  calculateGazeCluster(gazePoints) {
    if (gazePoints.length === 0) {
      return { center: { x: 0, y: 0, z: 0 }, radius: 0, duration: 0, confidence: 0 };
    }

    // Calculate center point
    const center = {
      x: gazePoints.reduce((sum, p) => sum + p.position.x, 0) / gazePoints.length,
      y: gazePoints.reduce((sum, p) => sum + p.position.y, 0) / gazePoints.length,
      z: gazePoints.reduce((sum, p) => sum + p.position.z, 0) / gazePoints.length
    };

    // Calculate radius (max distance from center)
    let maxDistance = 0;
    for (const point of gazePoints) {
      const distance = this.calculateDistance(center, point.position);
      maxDistance = Math.max(maxDistance, distance);
    }

    // Calculate duration
    const startTime = new Date(gazePoints[0].timestamp);
    const endTime = new Date(gazePoints[gazePoints.length - 1].timestamp);
    const duration = endTime - startTime;

    // Calculate average confidence
    const avgConfidence = gazePoints.reduce((sum, p) => sum + p.confidence, 0) / gazePoints.length;

    return {
      center,
      radius: maxDistance,
      duration,
      confidence: avgConfidence,
      startTime,
      endTime
    };
  }

  calculateGazeVelocity(gazePoints) {
    if (gazePoints.length < 2) {
      return { magnitude: 0, direction: { x: 0, y: 0, z: 0 }, amplitude: 0, duration: 0 };
    }

    const start = gazePoints[0].position;
    const end = gazePoints[gazePoints.length - 1].position;
    const startTime = new Date(gazePoints[0].timestamp);
    const endTime = new Date(gazePoints[gazePoints.length - 1].timestamp);

    const displacement = {
      x: end.x - start.x,
      y: end.y - start.y,
      z: end.z - start.z
    };

    const duration = endTime - startTime;
    const amplitude = this.calculateDistance(start, end);

    const velocity = {
      x: displacement.x / (duration / 1000),
      y: displacement.y / (duration / 1000),
      z: displacement.z / (duration / 1000)
    };

    const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);

    return {
      magnitude,
      direction: velocity,
      amplitude,
      duration
    };
  }

  calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  async calibrateEyes(userId, calibrationData) {
    try {
      const calibrationId = uuidv4();
      const calibration = {
        calibrationId,
        userId,
        leftEye: calibrationData.leftEye || {
          offset: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          rotation: { x: 0, y: 0, z: 0 }
        },
        rightEye: calibrationData.rightEye || {
          offset: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          rotation: { x: 0, y: 0, z: 0 }
        },
        settings: {
          sensitivity: calibrationData.settings?.sensitivity || 0.5,
          smoothing: calibrationData.settings?.smoothing || 0.3,
          fixationThreshold: calibrationData.settings?.fixationThreshold || 0.05,
          saccadeThreshold: calibrationData.settings?.saccadeThreshold || 0.1
        },
        calibratedAt: new Date().toISOString()
      };

      this.calibrations.set(calibrationId, calibration);
      await this.saveCalibrations();

      logger.info(`Eyes calibrated for user ${userId}: ${calibrationId}`);
      
      return {
        success: true,
        calibrationId,
        ...calibration
      };
    } catch (error) {
      logger.error(`Failed to calibrate eyes for user ${userId}:`, error);
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
            leftEye: tracking.leftEye,
            rightEye: tracking.rightEye,
            gazePoint: tracking.gazePoint,
            gazeDirection: tracking.gazeDirection,
            confidence: tracking.confidence,
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

  async getUserFixations(userId, limit = 50) {
    try {
      const fixations = [];
      
      for (const [fixationId, fixation] of this.fixations.entries()) {
        if (fixation.userId === userId) {
          fixations.push({
            fixationId: fixation.fixationId,
            center: fixation.center,
            radius: fixation.radius,
            duration: fixation.duration,
            confidence: fixation.confidence,
            startTime: fixation.startTime,
            endTime: fixation.endTime,
            timestamp: fixation.timestamp
          });
        }
      }

      // Sort by timestamp (newest first) and limit
      fixations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedFixations = fixations.slice(0, limit);

      return {
        success: true,
        userId,
        fixations: limitedFixations,
        count: limitedFixations.length
      };
    } catch (error) {
      logger.error(`Failed to get fixations for user ${userId}:`, error);
      throw error;
    }
  }

  async getUserSaccades(userId, limit = 50) {
    try {
      const saccades = [];
      
      for (const [saccadeId, saccade] of this.saccades.entries()) {
        if (saccade.userId === userId) {
          saccades.push({
            saccadeId: saccade.saccadeId,
            startPoint: saccade.startPoint,
            endPoint: saccade.endPoint,
            velocity: saccade.velocity,
            duration: saccade.duration,
            amplitude: saccade.amplitude,
            confidence: saccade.confidence,
            timestamp: saccade.timestamp
          });
        }
      }

      // Sort by timestamp (newest first) and limit
      saccades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedSaccades = saccades.slice(0, limit);

      return {
        success: true,
        userId,
        saccades: limitedSaccades,
        count: limitedSaccades.length
      };
    } catch (error) {
      logger.error(`Failed to get saccades for user ${userId}:`, error);
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
            leftEye: calibration.leftEye,
            rightEye: calibration.rightEye,
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

  async getGazeHeatmap(userId, timeWindow = 60000) {
    try {
      const now = new Date();
      const heatmapData = [];

      for (const [gazePointId, gazePoint] of this.gazePoints.entries()) {
        if (gazePoint.userId === userId) {
          const pointTime = new Date(gazePoint.timestamp);
          if (now - pointTime <= timeWindow) {
            heatmapData.push({
              x: gazePoint.position.x,
              y: gazePoint.position.y,
              z: gazePoint.position.z,
              intensity: gazePoint.confidence,
              timestamp: gazePoint.timestamp
            });
          }
        }
      }

      return {
        success: true,
        userId,
        timeWindow,
        heatmapData: heatmapData,
        count: heatmapData.length
      };
    } catch (error) {
      logger.error(`Failed to get gaze heatmap for user ${userId}:`, error);
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

      // Remove user's gaze points
      for (const [gazePointId, gazePoint] of this.gazePoints.entries()) {
        if (gazePoint.userId === userId) {
          this.gazePoints.delete(gazePointId);
        }
      }

      // Remove user's fixations
      for (const [fixationId, fixation] of this.fixations.entries()) {
        if (fixation.userId === userId) {
          this.fixations.delete(fixationId);
        }
      }

      // Remove user's saccades
      for (const [saccadeId, saccade] of this.saccades.entries()) {
        if (saccade.userId === userId) {
          this.saccades.delete(saccadeId);
        }
      }

      // Remove user's calibrations
      for (const [calibrationId, calibration] of this.calibrations.entries()) {
        if (calibration.userId === userId) {
          this.calibrations.delete(calibrationId);
        }
      }

      await this.saveTrackingData();
      await this.saveGazePoints();
      await this.saveFixations();
      await this.saveSaccades();
      await this.saveCalibrations();

      logger.info(`Cleaned up eye tracking data for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to cleanup eye tracking data for user ${userId}:`, error);
    }
  }

  async loadTrackingData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      
      // Load tracking data
      const trackingPath = path.join(dataDir, 'eye-tracking.json');
      if (fs.existsSync(trackingPath)) {
        const data = fs.readFileSync(trackingPath, 'utf8');
        const tracking = JSON.parse(data);
        for (const [key, trackingData] of Object.entries(tracking)) {
          this.trackingData.set(key, trackingData);
        }
      }
      
      // Load gaze points
      const gazePointsPath = path.join(dataDir, 'eye-gaze-points.json');
      if (fs.existsSync(gazePointsPath)) {
        const data = fs.readFileSync(gazePointsPath, 'utf8');
        const gazePoints = JSON.parse(data);
        for (const [key, gazePointData] of Object.entries(gazePoints)) {
          this.gazePoints.set(key, gazePointData);
        }
      }
      
      // Load fixations
      const fixationsPath = path.join(dataDir, 'eye-fixations.json');
      if (fs.existsSync(fixationsPath)) {
        const data = fs.readFileSync(fixationsPath, 'utf8');
        const fixations = JSON.parse(data);
        for (const [key, fixationData] of Object.entries(fixations)) {
          this.fixations.set(key, fixationData);
        }
      }
      
      // Load saccades
      const saccadesPath = path.join(dataDir, 'eye-saccades.json');
      if (fs.existsSync(saccadesPath)) {
        const data = fs.readFileSync(saccadesPath, 'utf8');
        const saccades = JSON.parse(data);
        for (const [key, saccadeData] of Object.entries(saccades)) {
          this.saccades.set(key, saccadeData);
        }
      }
      
      // Load calibrations
      const calibrationsPath = path.join(dataDir, 'eye-calibrations.json');
      if (fs.existsSync(calibrationsPath)) {
        const data = fs.readFileSync(calibrationsPath, 'utf8');
        const calibrations = JSON.parse(data);
        for (const [key, calibrationData] of Object.entries(calibrations)) {
          this.calibrations.set(key, calibrationData);
        }
      }
      
      logger.info(`Loaded eye tracking data: ${this.trackingData.size} tracking records, ${this.gazePoints.size} gaze points, ${this.fixations.size} fixations, ${this.saccades.size} saccades, ${this.calibrations.size} calibrations`);
    } catch (error) {
      logger.error('Failed to load eye tracking data:', error);
    }
  }

  async saveTrackingData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const trackingPath = path.join(dataDir, 'eye-tracking.json');
      const trackingObj = Object.fromEntries(this.trackingData);
      fs.writeFileSync(trackingPath, JSON.stringify(trackingObj, null, 2));
    } catch (error) {
      logger.error('Failed to save tracking data:', error);
    }
  }

  async saveGazePoints() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const gazePointsPath = path.join(dataDir, 'eye-gaze-points.json');
      const gazePointsObj = Object.fromEntries(this.gazePoints);
      fs.writeFileSync(gazePointsPath, JSON.stringify(gazePointsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save gaze points:', error);
    }
  }

  async saveFixations() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const fixationsPath = path.join(dataDir, 'eye-fixations.json');
      const fixationsObj = Object.fromEntries(this.fixations);
      fs.writeFileSync(fixationsPath, JSON.stringify(fixationsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save fixations:', error);
    }
  }

  async saveSaccades() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const saccadesPath = path.join(dataDir, 'eye-saccades.json');
      const saccadesObj = Object.fromEntries(this.saccades);
      fs.writeFileSync(saccadesPath, JSON.stringify(saccadesObj, null, 2));
    } catch (error) {
      logger.error('Failed to save saccades:', error);
    }
  }

  async saveCalibrations() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const calibrationsPath = path.join(dataDir, 'eye-calibrations.json');
      const calibrationsObj = Object.fromEntries(this.calibrations);
      fs.writeFileSync(calibrationsPath, JSON.stringify(calibrationsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save calibrations:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveTrackingData();
      await this.saveGazePoints();
      await this.saveFixations();
      await this.saveSaccades();
      await this.saveCalibrations();
      this.trackingData.clear();
      this.gazePoints.clear();
      this.fixations.clear();
      this.saccades.clear();
      this.calibrations.clear();
      logger.info('Eye Tracking Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new EyeTrackingManager();
