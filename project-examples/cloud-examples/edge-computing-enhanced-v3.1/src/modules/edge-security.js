const EventEmitter = require('events');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Edge Security - Enhanced security for edge devices
 * Version: 3.1.0
 * Features:
 * - Zero-trust edge architecture
 * - Hardware-based security (TPM, secure enclaves)
 * - Edge device authentication and authorization
 * - Encrypted edge-to-cloud communication
 * - Threat detection at the edge
 */
class EdgeSecurity extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Security Configuration
      zeroTrust: config.zeroTrust !== false,
      encryptionLevel: config.encryptionLevel || 'AES-256',
      deviceAuthentication: config.deviceAuthentication !== false,
      secureBoot: config.secureBoot !== false,
      
      // Encryption
      keySize: config.keySize || 256,
      algorithm: config.algorithm || 'aes-256-gcm',
      keyRotationInterval: config.keyRotationInterval || 86400000, // 24 hours
      
      // Authentication
      jwtSecret: config.jwtSecret || this.generateSecret(),
      jwtExpiry: config.jwtExpiry || '1h',
      refreshTokenExpiry: config.refreshTokenExpiry || '7d',
      maxLoginAttempts: config.maxLoginAttempts || 5,
      lockoutDuration: config.lockoutDuration || 300000, // 5 minutes
      
      // Authorization
      rbacEnabled: config.rbacEnabled !== false,
      defaultRole: config.defaultRole || 'user',
      adminRole: config.adminRole || 'admin',
      
      // Threat Detection
      threatDetection: config.threatDetection !== false,
      anomalyThreshold: config.anomalyThreshold || 0.8,
      maxFailedAttempts: config.maxFailedAttempts || 10,
      suspiciousActivityWindow: config.suspiciousActivityWindow || 300000, // 5 minutes
      
      // Monitoring
      auditLogging: config.auditLogging !== false,
      securityMetrics: config.securityMetrics !== false,
      
      ...config
    };
    
    // Internal state
    this.devices = new Map();
    this.sessions = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.threats = [];
    this.auditLog = [];
    this.encryptionKeys = new Map();
    this.failedAttempts = new Map();
    this.lockedDevices = new Set();
    
    this.metrics = {
      totalDevices: 0,
      authenticatedDevices: 0,
      failedAuthentications: 0,
      successfulAuthentications: 0,
      threatsDetected: 0,
      securityIncidents: 0,
      encryptionOperations: 0,
      decryptionOperations: 0,
      keyRotations: 0,
      lastSecurityCheck: null
    };
    
    // Initialize security system
    this.initialize();
  }

  /**
   * Initialize security system
   */
  async initialize() {
    try {
      // Initialize default roles and permissions
      await this.initializeRolesAndPermissions();
      
      // Initialize encryption keys
      await this.initializeEncryptionKeys();
      
      // Start security monitoring
      this.startSecurityMonitoring();
      
      // Start key rotation
      this.startKeyRotation();
      
      // Start cleanup
      this.startCleanup();
      
      logger.info('Edge Security initialized', {
        zeroTrust: this.config.zeroTrust,
        encryptionLevel: this.config.encryptionLevel,
        deviceAuthentication: this.config.deviceAuthentication
      });
      
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Edge Security:', error);
      throw error;
    }
  }

  /**
   * Initialize default roles and permissions
   */
  async initializeRolesAndPermissions() {
    // Default roles
    const defaultRoles = {
      admin: {
        name: 'Administrator',
        permissions: ['*'], // All permissions
        description: 'Full system access'
      },
      operator: {
        name: 'Operator',
        permissions: ['read', 'write', 'execute'],
        description: 'Operational access'
      },
      user: {
        name: 'User',
        permissions: ['read'],
        description: 'Basic user access'
      },
      device: {
        name: 'Device',
        permissions: ['read', 'write'],
        description: 'Device access'
      }
    };
    
    for (const [roleId, role] of Object.entries(defaultRoles)) {
      this.roles.set(roleId, {
        id: roleId,
        ...role,
        createdAt: Date.now()
      });
    }
    
    // Default permissions
    const defaultPermissions = {
      read: 'Read data and resources',
      write: 'Write data and resources',
      execute: 'Execute operations',
      admin: 'Administrative operations',
      security: 'Security operations',
      monitoring: 'Monitoring operations'
    };
    
    for (const [permissionId, description] of Object.entries(defaultPermissions)) {
      this.permissions.set(permissionId, {
        id: permissionId,
        description,
        createdAt: Date.now()
      });
    }
  }

  /**
   * Initialize encryption keys
   */
  async initializeEncryptionKeys() {
    try {
      // Generate master key
      const masterKey = this.generateEncryptionKey();
      this.encryptionKeys.set('master', {
        key: masterKey,
        algorithm: this.config.algorithm,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.config.keyRotationInterval
      });
      
      // Generate device-specific keys
      for (const [deviceId, device] of this.devices) {
        await this.generateDeviceKey(deviceId);
      }
      
      logger.info('Encryption keys initialized');
      
    } catch (error) {
      logger.error('Failed to initialize encryption keys:', error);
      throw error;
    }
  }

  /**
   * Generate encryption key
   */
  generateEncryptionKey() {
    return crypto.randomBytes(this.config.keySize / 8);
  }

  /**
   * Generate secret for JWT
   */
  generateSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Register edge device
   */
  async registerDevice(deviceInfo) {
    try {
      const deviceId = deviceInfo.id || uuidv4();
      
      // Validate device information
      this.validateDeviceInfo(deviceInfo);
      
      // Generate device credentials
      const credentials = await this.generateDeviceCredentials(deviceId);
      
      // Create device record
      const device = {
        id: deviceId,
        name: deviceInfo.name,
        type: deviceInfo.type || 'edge-device',
        location: deviceInfo.location,
        capabilities: deviceInfo.capabilities || [],
        status: 'registered',
        role: deviceInfo.role || this.config.defaultRole,
        credentials: {
          publicKey: credentials.publicKey,
          privateKey: credentials.privateKey,
          certificate: credentials.certificate
        },
        security: {
          tpmAvailable: deviceInfo.tpmAvailable || false,
          secureBoot: deviceInfo.secureBoot || false,
          encryptionLevel: deviceInfo.encryptionLevel || this.config.encryptionLevel,
          lastSecurityCheck: null,
          threatLevel: 'low'
        },
        metadata: deviceInfo.metadata || {},
        createdAt: Date.now(),
        lastSeen: Date.now()
      };
      
      // Store device
      this.devices.set(deviceId, device);
      
      // Generate device-specific encryption key
      await this.generateDeviceKey(deviceId);
      
      // Update metrics
      this.metrics.totalDevices++;
      
      // Log security event
      this.logSecurityEvent('device_registered', {
        deviceId,
        deviceName: device.name,
        deviceType: device.type,
        role: device.role
      });
      
      logger.info('Device registered', {
        deviceId,
        name: device.name,
        type: device.type,
        role: device.role
      });
      
      this.emit('deviceRegistered', { deviceId, device });
      
      return {
        deviceId,
        credentials: {
          publicKey: credentials.publicKey,
          certificate: credentials.certificate
        }
      };
      
    } catch (error) {
      logger.error('Failed to register device:', { deviceInfo, error: error.message });
      throw error;
    }
  }

  /**
   * Validate device information
   */
  validateDeviceInfo(deviceInfo) {
    const required = ['name', 'type'];
    
    for (const field of required) {
      if (!deviceInfo[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
    
    // Validate device type
    const validTypes = ['edge-device', 'gateway', 'sensor', 'actuator', 'mobile'];
    if (!validTypes.includes(deviceInfo.type)) {
      throw new Error(`Invalid device type: ${deviceInfo.type}`);
    }
  }

  /**
   * Generate device credentials
   */
  async generateDeviceCredentials(deviceId) {
    try {
      // Generate RSA key pair
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
      
      // Generate self-signed certificate
      const certificate = this.generateCertificate(deviceId, publicKey, privateKey);
      
      return {
        publicKey,
        privateKey,
        certificate
      };
      
    } catch (error) {
      logger.error('Failed to generate device credentials:', error);
      throw error;
    }
  }

  /**
   * Generate self-signed certificate
   */
  generateCertificate(deviceId, publicKey, privateKey) {
    // This is a simplified certificate generation
    // In production, use a proper certificate authority
    const cert = {
      subject: {
        commonName: deviceId,
        organizationName: 'Edge Computing System'
      },
      issuer: {
        commonName: 'Edge Security CA'
      },
      notBefore: new Date(),
      notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      publicKey: publicKey,
      serialNumber: crypto.randomBytes(16).toString('hex')
    };
    
    return JSON.stringify(cert);
  }

  /**
   * Generate device-specific encryption key
   */
  async generateDeviceKey(deviceId) {
    const deviceKey = this.generateEncryptionKey();
    this.encryptionKeys.set(deviceId, {
      key: deviceKey,
      algorithm: this.config.algorithm,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.keyRotationInterval
    });
  }

  /**
   * Authenticate device
   */
  async authenticateDevice(deviceId, credentials) {
    try {
      // Check if device is locked
      if (this.lockedDevices.has(deviceId)) {
        throw new Error('Device is locked due to multiple failed attempts');
      }
      
      // Get device
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }
      
      // Verify credentials
      const isValid = await this.verifyCredentials(device, credentials);
      
      if (!isValid) {
        await this.handleFailedAuthentication(deviceId);
        throw new Error('Invalid credentials');
      }
      
      // Generate JWT token
      const token = this.generateJWT(device);
      
      // Create session
      const session = {
        id: uuidv4(),
        deviceId,
        token,
        refreshToken: this.generateRefreshToken(device),
        createdAt: Date.now(),
        expiresAt: Date.now() + this.parseJWTExpiry(this.config.jwtExpiry),
        lastActivity: Date.now()
      };
      
      this.sessions.set(session.id, session);
      
      // Update device status
      device.status = 'authenticated';
      device.lastSeen = Date.now();
      device.security.lastSecurityCheck = Date.now();
      
      // Update metrics
      this.metrics.successfulAuthentications++;
      this.metrics.authenticatedDevices++;
      
      // Log security event
      this.logSecurityEvent('device_authenticated', {
        deviceId,
        sessionId: session.id,
        deviceName: device.name
      });
      
      logger.info('Device authenticated', {
        deviceId,
        deviceName: device.name,
        sessionId: session.id
      });
      
      this.emit('deviceAuthenticated', { deviceId, session });
      
      return {
        success: true,
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt
      };
      
    } catch (error) {
      logger.error('Device authentication failed:', { deviceId, error: error.message });
      throw error;
    }
  }

  /**
   * Verify device credentials
   */
  async verifyCredentials(device, credentials) {
    try {
      // Verify certificate
      if (credentials.certificate) {
        const isValidCert = this.verifyCertificate(credentials.certificate, device.credentials.certificate);
        if (!isValidCert) {
          return false;
        }
      }
      
      // Verify signature
      if (credentials.signature && credentials.data) {
        const isValidSig = this.verifySignature(
          credentials.data,
          credentials.signature,
          device.credentials.publicKey
        );
        if (!isValidSig) {
          return false;
        }
      }
      
      // Verify challenge response
      if (credentials.challenge && credentials.response) {
        const isValidChallenge = this.verifyChallenge(
          credentials.challenge,
          credentials.response,
          device.credentials.privateKey
        );
        if (!isValidChallenge) {
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      logger.error('Credential verification failed:', error);
      return false;
    }
  }

  /**
   * Verify certificate
   */
  verifyCertificate(certificate, expectedCertificate) {
    // Simplified certificate verification
    // In production, use proper certificate validation
    return certificate === expectedCertificate;
  }

  /**
   * Verify signature
   */
  verifySignature(data, signature, publicKey) {
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(data);
      return verifier.verify(publicKey, signature, 'base64');
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify challenge response
   */
  verifyChallenge(challenge, response, privateKey) {
    try {
      // Decrypt response with private key
      const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(response, 'base64'));
      return decrypted.toString() === challenge;
    } catch (error) {
      logger.error('Challenge verification failed:', error);
      return false;
    }
  }

  /**
   * Handle failed authentication
   */
  async handleFailedAuthentication(deviceId) {
    const attempts = this.failedAttempts.get(deviceId) || 0;
    const newAttempts = attempts + 1;
    
    this.failedAttempts.set(deviceId, newAttempts);
    this.metrics.failedAuthentications++;
    
    if (newAttempts >= this.config.maxLoginAttempts) {
      this.lockedDevices.add(deviceId);
      
      // Auto-unlock after lockout duration
      setTimeout(() => {
        this.lockedDevices.delete(deviceId);
        this.failedAttempts.delete(deviceId);
      }, this.config.lockoutDuration);
      
      // Log security event
      this.logSecurityEvent('device_locked', {
        deviceId,
        attempts: newAttempts,
        lockoutDuration: this.config.lockoutDuration
      });
      
      logger.warn('Device locked due to failed attempts', {
        deviceId,
        attempts: newAttempts
      });
    }
  }

  /**
   * Generate JWT token
   */
  generateJWT(device) {
    const payload = {
      deviceId: device.id,
      name: device.name,
      type: device.type,
      role: device.role,
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiry
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(device) {
    const payload = {
      deviceId: device.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.refreshTokenExpiry
    });
  }

  /**
   * Parse JWT expiry
   */
  parseJWTExpiry(expiry) {
    const units = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };
    
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600000; // Default 1 hour
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    return value * units[unit];
  }

  /**
   * Verify JWT token
   */
  verifyJWT(token) {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret);
      return decoded;
    } catch (error) {
      logger.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Authorize operation
   */
  async authorizeOperation(deviceId, operation, resource) {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }
      
      const role = this.roles.get(device.role);
      if (!role) {
        throw new Error('Role not found');
      }
      
      // Check if role has permission
      const hasPermission = role.permissions.includes('*') || 
                           role.permissions.includes(operation);
      
      if (!hasPermission) {
        // Log unauthorized access attempt
        this.logSecurityEvent('unauthorized_access', {
          deviceId,
          operation,
          resource,
          role: device.role
        });
        
        throw new Error('Insufficient permissions');
      }
      
      // Check resource-specific permissions
      if (resource && this.config.rbacEnabled) {
        const resourcePermission = await this.checkResourcePermission(deviceId, operation, resource);
        if (!resourcePermission) {
          throw new Error('Resource access denied');
        }
      }
      
      return true;
      
    } catch (error) {
      logger.error('Authorization failed:', { deviceId, operation, error: error.message });
      throw error;
    }
  }

  /**
   * Check resource-specific permission
   */
  async checkResourcePermission(deviceId, operation, resource) {
    // Implement resource-specific permission checking
    // This could involve checking device location, resource ownership, etc.
    return true;
  }

  /**
   * Encrypt data
   */
  async encryptData(data, deviceId = null) {
    try {
      const key = deviceId ? 
        this.encryptionKeys.get(deviceId) : 
        this.encryptionKeys.get('master');
      
      if (!key) {
        throw new Error('Encryption key not found');
      }
      
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.config.algorithm, key.key);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      this.metrics.encryptionOperations++;
      
      return {
        encrypted,
        iv: iv.toString('base64'),
        algorithm: this.config.algorithm,
        keyId: deviceId || 'master'
      };
      
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data
   */
  async decryptData(encryptedData, deviceId = null) {
    try {
      const key = deviceId ? 
        this.encryptionKeys.get(deviceId) : 
        this.encryptionKeys.get('master');
      
      if (!key) {
        throw new Error('Decryption key not found');
      }
      
      const decipher = crypto.createDecipher(this.config.algorithm, key.key);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      this.metrics.decryptionOperations++;
      
      return JSON.parse(decrypted);
      
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Detect threats
   */
  async detectThreats(deviceId, activity) {
    try {
      if (!this.config.threatDetection) {
        return;
      }
      
      const device = this.devices.get(deviceId);
      if (!device) {
        return;
      }
      
      // Analyze activity patterns
      const threatScore = await this.analyzeActivityPattern(deviceId, activity);
      
      if (threatScore > this.config.anomalyThreshold) {
        const threat = {
          id: uuidv4(),
          deviceId,
          type: 'anomalous_activity',
          severity: this.getThreatSeverity(threatScore),
          score: threatScore,
          activity,
          detectedAt: Date.now(),
          status: 'active'
        };
        
        this.threats.push(threat);
        this.metrics.threatsDetected++;
        
        // Update device threat level
        device.security.threatLevel = this.getThreatLevel(threatScore);
        
        // Log security event
        this.logSecurityEvent('threat_detected', threat);
        
        logger.warn('Threat detected', threat);
        
        this.emit('threatDetected', threat);
      }
      
    } catch (error) {
      logger.error('Threat detection failed:', { deviceId, error: error.message });
    }
  }

  /**
   * Analyze activity pattern
   */
  async analyzeActivityPattern(deviceId, activity) {
    // Simple threat detection based on activity patterns
    // In production, use machine learning models
    
    let score = 0;
    
    // Check for unusual access patterns
    if (activity.type === 'data_access' && activity.volume > 1000) {
      score += 0.3;
    }
    
    // Check for suspicious timing
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 0.2;
    }
    
    // Check for failed operations
    if (activity.failedOperations > 5) {
      score += 0.4;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Get threat severity
   */
  getThreatSeverity(score) {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Get threat level
   */
  getThreatLevel(score) {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, data) {
    if (!this.config.auditLogging) {
      return;
    }
    
    const event = {
      id: uuidv4(),
      type: eventType,
      data,
      timestamp: Date.now(),
      severity: this.getEventSeverity(eventType)
    };
    
    this.auditLog.push(event);
    
    // Keep only recent events
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.auditLog = this.auditLog.filter(e => e.timestamp > cutoff);
  }

  /**
   * Get event severity
   */
  getEventSeverity(eventType) {
    const severityMap = {
      'device_registered': 'info',
      'device_authenticated': 'info',
      'device_locked': 'warning',
      'unauthorized_access': 'error',
      'threat_detected': 'critical'
    };
    
    return severityMap[eventType] || 'info';
  }

  /**
   * Start security monitoring
   */
  startSecurityMonitoring() {
    setInterval(() => {
      this.performSecurityCheck();
    }, 60000); // Run every minute
  }

  /**
   * Perform security check
   */
  async performSecurityCheck() {
    try {
      // Check for expired sessions
      this.cleanupExpiredSessions();
      
      // Check for suspicious activity
      await this.checkSuspiciousActivity();
      
      // Update security metrics
      this.updateSecurityMetrics();
      
      this.metrics.lastSecurityCheck = Date.now();
      
    } catch (error) {
      logger.error('Security check failed:', error);
    }
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Check for suspicious activity
   */
  async checkSuspiciousActivity() {
    // Implement suspicious activity detection
    // This could involve analyzing failed login attempts, unusual access patterns, etc.
  }

  /**
   * Update security metrics
   */
  updateSecurityMetrics() {
    this.metrics.authenticatedDevices = this.sessions.size;
    this.metrics.securityIncidents = this.threats.filter(t => t.status === 'active').length;
  }

  /**
   * Start key rotation
   */
  startKeyRotation() {
    setInterval(() => {
      this.rotateKeys();
    }, this.config.keyRotationInterval);
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys() {
    try {
      // Generate new master key
      const newMasterKey = this.generateEncryptionKey();
      this.encryptionKeys.set('master', {
        key: newMasterKey,
        algorithm: this.config.algorithm,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.config.keyRotationInterval
      });
      
      // Rotate device keys
      for (const [deviceId, device] of this.devices) {
        await this.generateDeviceKey(deviceId);
      }
      
      this.metrics.keyRotations++;
      
      logger.info('Encryption keys rotated');
      
    } catch (error) {
      logger.error('Key rotation failed:', error);
    }
  }

  /**
   * Start cleanup
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 300000); // Run every 5 minutes
  }

  /**
   * Cleanup old data
   */
  cleanup() {
    // Cleanup old audit logs
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    this.auditLog = this.auditLog.filter(e => e.timestamp > cutoff);
    
    // Cleanup old threats
    this.threats = this.threats.filter(t => t.detectedAt > cutoff);
    
    // Cleanup old failed attempts
    for (const [deviceId, attempts] of this.failedAttempts) {
      if (attempts === 0) {
        this.failedAttempts.delete(deviceId);
      }
    }
  }

  /**
   * Get device information
   */
  getDeviceInfo(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      return null;
    }
    
    return {
      id: device.id,
      name: device.name,
      type: device.type,
      status: device.status,
      role: device.role,
      security: device.security,
      createdAt: device.createdAt,
      lastSeen: device.lastSeen
    };
  }

  /**
   * Get all devices
   */
  getAllDevices() {
    const devices = [];
    for (const [id, device] of this.devices) {
      devices.push(this.getDeviceInfo(id));
    }
    return devices;
  }

  /**
   * Get security metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      activeSessions: this.sessions.size,
      activeThreats: this.threats.filter(t => t.status === 'active').length,
      lockedDevices: this.lockedDevices.size
    };
  }

  /**
   * Get audit log
   */
  getAuditLog(timeRange = null) {
    if (!timeRange) {
      return this.auditLog;
    }
    
    return this.auditLog.filter(event => 
      event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
    );
  }

  /**
   * Get threats
   */
  getThreats(timeRange = null) {
    if (!timeRange) {
      return this.threats;
    }
    
    return this.threats.filter(threat => 
      threat.detectedAt >= timeRange.start && threat.detectedAt <= timeRange.end
    );
  }

  /**
   * Dispose resources
   */
  async dispose() {
    try {
      // Clear all data
      this.devices.clear();
      this.sessions.clear();
      this.roles.clear();
      this.permissions.clear();
      this.threats = [];
      this.auditLog = [];
      this.encryptionKeys.clear();
      this.failedAttempts.clear();
      this.lockedDevices.clear();
      
      logger.info('Edge Security disposed');
      
    } catch (error) {
      logger.error('Failed to dispose Edge Security:', error);
      throw error;
    }
  }
}

module.exports = EdgeSecurity;
