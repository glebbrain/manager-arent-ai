const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('./logger');
const EventEmitter = require('events');

class AdvancedSecurity extends EventEmitter {
  constructor() {
    super();
    this.encryptionAlgorithms = {
      'aes-256-gcm': 'AES-256-GCM',
      'aes-256-cbc': 'AES-256-CBC',
      'chacha20-poly1305': 'ChaCha20-Poly1305'
    };
    this.hashAlgorithms = ['sha256', 'sha384', 'sha512', 'blake2b512'];
    this.keyDerivationFunctions = ['pbkdf2', 'scrypt', 'argon2'];
    this.securityPolicies = new Map();
    this.auditLog = [];
    this.failedAttempts = new Map();
    this.rateLimits = new Map();
    this.encryptionKeys = new Map();
    this.securityMetrics = {
      totalRequests: 0,
      blockedRequests: 0,
      securityViolations: 0,
      encryptionOperations: 0,
      decryptionOperations: 0,
      lastSecurityScan: null
    };
  }

  // Initialize advanced security system
  initialize(options = {}) {
    try {
      const config = {
        encryptionAlgorithm: options.encryptionAlgorithm || 'aes-256-gcm',
        hashAlgorithm: options.hashAlgorithm || 'sha256',
        keyDerivationFunction: options.keyDerivationFunction || 'pbkdf2',
        jwtSecret: options.jwtSecret || this.generateSecureKey(64),
        jwtExpiry: options.jwtExpiry || '24h',
        maxFailedAttempts: options.maxFailedAttempts || 5,
        lockoutDuration: options.lockoutDuration || 15 * 60 * 1000, // 15 minutes
        rateLimitWindow: options.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
        maxRequestsPerWindow: options.maxRequestsPerWindow || 1000,
        enableAuditLogging: options.enableAuditLogging !== false,
        enableEncryption: options.enableEncryption !== false,
        enableRateLimiting: options.enableRateLimiting !== false,
        enableBruteForceProtection: options.enableBruteForceProtection !== false
      };

      this.config = config;
      this.generateMasterKeys();

      logger.info('Advanced security system initialized', {
        encryptionAlgorithm: config.encryptionAlgorithm,
        hashAlgorithm: config.hashAlgorithm,
        keyDerivationFunction: config.keyDerivationFunction,
        enableAuditLogging: config.enableAuditLogging,
        enableEncryption: config.enableEncryption,
        enableRateLimiting: config.enableRateLimiting,
        enableBruteForceProtection: config.enableBruteForceProtection
      });

      return {
        success: true,
        configuration: config,
        securityLevel: 'high'
      };
    } catch (error) {
      logger.error('Advanced security initialization failed:', { error: error.message });
      throw error;
    }
  }

  // Generate master encryption keys
  generateMasterKeys() {
    try {
      const masterKey = this.generateSecureKey(32);
      const hmacKey = this.generateSecureKey(32);
      const jwtKey = this.generateSecureKey(32);

      this.encryptionKeys.set('master', masterKey);
      this.encryptionKeys.set('hmac', hmacKey);
      this.encryptionKeys.set('jwt', jwtKey);

      logger.info('Master encryption keys generated');
    } catch (error) {
      logger.error('Failed to generate master keys:', { error: error.message });
      throw error;
    }
  }

  // Generate secure random key
  generateSecureKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Advanced encryption with multiple algorithms
  encrypt(data, options = {}) {
    try {
      const algorithm = options.algorithm || this.config.encryptionAlgorithm;
      const key = options.key || this.encryptionKeys.get('master');
      const iv = options.iv || crypto.randomBytes(16);
      
      let cipher;
      let encrypted;

      switch (algorithm) {
        case 'aes-256-gcm':
          cipher = crypto.createCipher('aes-256-gcm', key);
          cipher.setAAD(Buffer.from('quantum-ml-security', 'utf8'));
          encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
          const authTag = cipher.getAuthTag();
          return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            algorithm: algorithm
          };

        case 'aes-256-cbc':
          cipher = crypto.createCipher('aes-256-cbc', key);
          encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
          return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            algorithm: algorithm
          };

        case 'chacha20-poly1305':
          cipher = crypto.createCipher('chacha20-poly1305', key);
          encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
          const poly1305Tag = cipher.getAuthTag();
          return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            authTag: poly1305Tag.toString('base64'),
            algorithm: algorithm
          };

        default:
          throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
      }
    } catch (error) {
      logger.error('Encryption failed:', { error: error.message });
      throw error;
    } finally {
      this.securityMetrics.encryptionOperations++;
    }
  }

  // Advanced decryption
  decrypt(encryptedData, options = {}) {
    try {
      const { encrypted, iv, authTag, algorithm } = encryptedData;
      const key = options.key || this.encryptionKeys.get('master');
      
      let decipher;
      let decrypted;

      switch (algorithm) {
        case 'aes-256-gcm':
          decipher = crypto.createDecipher('aes-256-gcm', key);
          decipher.setAAD(Buffer.from('quantum-ml-security', 'utf8'));
          decipher.setAuthTag(Buffer.from(authTag, 'base64'));
          decrypted = Buffer.concat([
            decipher.update(Buffer.from(encrypted, 'base64')),
            decipher.final()
          ]);
          break;

        case 'aes-256-cbc':
          decipher = crypto.createDecipher('aes-256-cbc', key);
          decipher.setIV(Buffer.from(iv, 'base64'));
          decrypted = Buffer.concat([
            decipher.update(Buffer.from(encrypted, 'base64')),
            decipher.final()
          ]);
          break;

        case 'chacha20-poly1305':
          decipher = crypto.createDecipher('chacha20-poly1305', key);
          decipher.setAuthTag(Buffer.from(authTag, 'base64'));
          decrypted = Buffer.concat([
            decipher.update(Buffer.from(encrypted, 'base64')),
            decipher.final()
          ]);
          break;

        default:
          throw new Error(`Unsupported decryption algorithm: ${algorithm}`);
      }

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Decryption failed:', { error: error.message });
      throw error;
    } finally {
      this.securityMetrics.decryptionOperations++;
    }
  }

  // Advanced hashing with salt
  hash(data, options = {}) {
    try {
      const algorithm = options.algorithm || this.config.hashAlgorithm;
      const salt = options.salt || crypto.randomBytes(16);
      const iterations = options.iterations || 100000;

      const hash = crypto.pbkdf2Sync(data, salt, iterations, 64, algorithm);
      
      return {
        hash: hash.toString('base64'),
        salt: salt.toString('base64'),
        algorithm: algorithm,
        iterations: iterations
      };
    } catch (error) {
      logger.error('Hashing failed:', { error: error.message });
      throw error;
    }
  }

  // Verify hash
  verifyHash(data, hashData, options = {}) {
    try {
      const { hash, salt, algorithm, iterations } = hashData;
      const newHash = crypto.pbkdf2Sync(data, Buffer.from(salt, 'base64'), iterations, 64, algorithm);
      
      return crypto.timingSafeEqual(Buffer.from(hash, 'base64'), newHash);
    } catch (error) {
      logger.error('Hash verification failed:', { error: error.message });
      return false;
    }
  }

  // Generate JWT token with enhanced security
  generateToken(payload, options = {}) {
    try {
      const secret = options.secret || this.encryptionKeys.get('jwt');
      const expiresIn = options.expiresIn || this.config.jwtExpiry;
      const algorithm = options.algorithm || 'HS256';

      const token = jwt.sign(payload, secret, {
        expiresIn: expiresIn,
        algorithm: algorithm,
        issuer: 'quantum-ml-v2.9',
        audience: 'quantum-ml-users'
      });

      return {
        token: token,
        expiresIn: expiresIn,
        algorithm: algorithm
      };
    } catch (error) {
      logger.error('Token generation failed:', { error: error.message });
      throw error;
    }
  }

  // Verify JWT token
  verifyToken(token, options = {}) {
    try {
      const secret = options.secret || this.encryptionKeys.get('jwt');
      const algorithm = options.algorithm || 'HS256';

      const decoded = jwt.verify(token, secret, {
        algorithms: [algorithm],
        issuer: 'quantum-ml-v2.9',
        audience: 'quantum-ml-users'
      });

      return {
        valid: true,
        payload: decoded
      };
    } catch (error) {
      logger.error('Token verification failed:', { error: error.message });
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Rate limiting
  checkRateLimit(identifier, options = {}) {
    try {
      if (!this.config.enableRateLimiting) {
        return { allowed: true };
      }

      const window = options.window || this.config.rateLimitWindow;
      const maxRequests = options.maxRequests || this.config.maxRequestsPerWindow;
      const now = Date.now();

      if (!this.rateLimits.has(identifier)) {
        this.rateLimits.set(identifier, {
          requests: 1,
          windowStart: now
        });
        return { allowed: true, remaining: maxRequests - 1 };
      }

      const limit = this.rateLimits.get(identifier);
      
      if (now - limit.windowStart > window) {
        // Reset window
        this.rateLimits.set(identifier, {
          requests: 1,
          windowStart: now
        });
        return { allowed: true, remaining: maxRequests - 1 };
      }

      if (limit.requests >= maxRequests) {
        this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          identifier,
          requests: limit.requests,
          window: window
        });
        return { 
          allowed: false, 
          remaining: 0,
          resetTime: limit.windowStart + window
        };
      }

      limit.requests++;
      this.rateLimits.set(identifier, limit);

      return { 
        allowed: true, 
        remaining: maxRequests - limit.requests 
      };
    } catch (error) {
      logger.error('Rate limit check failed:', { error: error.message });
      return { allowed: true }; // Fail open for availability
    }
  }

  // Brute force protection
  checkBruteForceProtection(identifier, options = {}) {
    try {
      if (!this.config.enableBruteForceProtection) {
        return { allowed: true };
      }

      const maxAttempts = options.maxAttempts || this.config.maxFailedAttempts;
      const lockoutDuration = options.lockoutDuration || this.config.lockoutDuration;
      const now = Date.now();

      if (!this.failedAttempts.has(identifier)) {
        this.failedAttempts.set(identifier, {
          attempts: 0,
          lastAttempt: now,
          lockedUntil: null
        });
        return { allowed: true, attempts: 0 };
      }

      const attempt = this.failedAttempts.get(identifier);

      // Check if still locked
      if (attempt.lockedUntil && now < attempt.lockedUntil) {
        return {
          allowed: false,
          locked: true,
          lockedUntil: attempt.lockedUntil,
          attempts: attempt.attempts
        };
      }

      // Reset if lockout period has passed
      if (attempt.lockedUntil && now >= attempt.lockedUntil) {
        attempt.attempts = 0;
        attempt.lockedUntil = null;
      }

      if (attempt.attempts >= maxAttempts) {
        attempt.lockedUntil = now + lockoutDuration;
        this.failedAttempts.set(identifier, attempt);
        
        this.logSecurityEvent('BRUTE_FORCE_LOCKOUT', {
          identifier,
          attempts: attempt.attempts,
          lockedUntil: attempt.lockedUntil
        });

        return {
          allowed: false,
          locked: true,
          lockedUntil: attempt.lockedUntil,
          attempts: attempt.attempts
        };
      }

      return { 
        allowed: true, 
        attempts: attempt.attempts,
        remaining: maxAttempts - attempt.attempts
      };
    } catch (error) {
      logger.error('Brute force protection check failed:', { error: error.message });
      return { allowed: true }; // Fail open for availability
    }
  }

  // Record failed attempt
  recordFailedAttempt(identifier) {
    try {
      if (!this.failedAttempts.has(identifier)) {
        this.failedAttempts.set(identifier, {
          attempts: 1,
          lastAttempt: Date.now(),
          lockedUntil: null
        });
      } else {
        const attempt = this.failedAttempts.get(identifier);
        attempt.attempts++;
        attempt.lastAttempt = Date.now();
        this.failedAttempts.set(identifier, attempt);
      }

      this.logSecurityEvent('FAILED_ATTEMPT', {
        identifier,
        attempts: this.failedAttempts.get(identifier).attempts
      });
    } catch (error) {
      logger.error('Failed to record failed attempt:', { error: error.message });
    }
  }

  // Reset failed attempts
  resetFailedAttempts(identifier) {
    try {
      this.failedAttempts.delete(identifier);
      this.logSecurityEvent('FAILED_ATTEMPTS_RESET', { identifier });
    } catch (error) {
      logger.error('Failed to reset failed attempts:', { error: error.message });
    }
  }

  // Security policy management
  setSecurityPolicy(name, policy) {
    try {
      this.securityPolicies.set(name, {
        ...policy,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      this.logSecurityEvent('SECURITY_POLICY_SET', { name, policy });
      
      return {
        success: true,
        policyName: name,
        policy: this.securityPolicies.get(name)
      };
    } catch (error) {
      logger.error('Failed to set security policy:', { error: error.message });
      throw error;
    }
  }

  // Get security policy
  getSecurityPolicy(name) {
    return this.securityPolicies.get(name);
  }

  // Log security event
  logSecurityEvent(eventType, details = {}) {
    try {
      if (!this.config.enableAuditLogging) {
        return;
      }

      const event = {
        timestamp: Date.now(),
        eventType: eventType,
        details: details,
        severity: this.getEventSeverity(eventType)
      };

      this.auditLog.push(event);
      
      // Keep only last 10000 events
      if (this.auditLog.length > 10000) {
        this.auditLog = this.auditLog.slice(-10000);
      }

      this.emit('securityEvent', event);
      
      logger.info('Security event logged', event);
    } catch (error) {
      logger.error('Failed to log security event:', { error: error.message });
    }
  }

  // Get event severity
  getEventSeverity(eventType) {
    const severityMap = {
      'RATE_LIMIT_EXCEEDED': 'medium',
      'BRUTE_FORCE_LOCKOUT': 'high',
      'FAILED_ATTEMPT': 'low',
      'FAILED_ATTEMPTS_RESET': 'info',
      'SECURITY_POLICY_SET': 'info',
      'ENCRYPTION_OPERATION': 'info',
      'DECRYPTION_OPERATION': 'info',
      'TOKEN_GENERATED': 'info',
      'TOKEN_VERIFIED': 'info',
      'TOKEN_INVALID': 'medium'
    };

    return severityMap[eventType] || 'info';
  }

  // Security scan
  async performSecurityScan() {
    try {
      const scanResults = {
        timestamp: Date.now(),
        vulnerabilities: [],
        recommendations: [],
        score: 100
      };

      // Check for weak encryption
      if (this.config.encryptionAlgorithm === 'aes-256-cbc') {
        scanResults.vulnerabilities.push({
          type: 'WEAK_ENCRYPTION',
          severity: 'medium',
          description: 'AES-256-CBC is vulnerable to padding oracle attacks',
          recommendation: 'Use AES-256-GCM or ChaCha20-Poly1305'
        });
        scanResults.score -= 10;
      }

      // Check for weak hashing
      if (this.config.hashAlgorithm === 'sha256') {
        scanResults.vulnerabilities.push({
          type: 'WEAK_HASH',
          severity: 'low',
          description: 'SHA-256 is acceptable but SHA-384 or SHA-512 is recommended',
          recommendation: 'Consider upgrading to SHA-384 or SHA-512'
        });
        scanResults.score -= 5;
      }

      // Check JWT configuration
      if (!this.config.jwtSecret || this.config.jwtSecret.length < 32) {
        scanResults.vulnerabilities.push({
          type: 'WEAK_JWT_SECRET',
          severity: 'high',
          description: 'JWT secret is too weak or missing',
          recommendation: 'Use a strong, randomly generated secret of at least 32 characters'
        });
        scanResults.score -= 20;
      }

      // Check rate limiting
      if (!this.config.enableRateLimiting) {
        scanResults.vulnerabilities.push({
          type: 'NO_RATE_LIMITING',
          severity: 'high',
          description: 'Rate limiting is disabled',
          recommendation: 'Enable rate limiting to prevent DoS attacks'
        });
        scanResults.score -= 15;
      }

      // Check brute force protection
      if (!this.config.enableBruteForceProtection) {
        scanResults.vulnerabilities.push({
          type: 'NO_BRUTE_FORCE_PROTECTION',
          severity: 'high',
          description: 'Brute force protection is disabled',
          recommendation: 'Enable brute force protection to prevent credential attacks'
        });
        scanResults.score -= 15;
      }

      this.securityMetrics.lastSecurityScan = Date.now();
      this.logSecurityEvent('SECURITY_SCAN_COMPLETED', scanResults);

      return scanResults;
    } catch (error) {
      logger.error('Security scan failed:', { error: error.message });
      throw error;
    }
  }

  // Get security metrics
  getSecurityMetrics() {
    return {
      ...this.securityMetrics,
      activeRateLimits: this.rateLimits.size,
      activeFailedAttempts: this.failedAttempts.size,
      securityPolicies: this.securityPolicies.size,
      auditLogSize: this.auditLog.length,
      configuration: this.config
    };
  }

  // Get audit log
  getAuditLog(options = {}) {
    const { limit = 100, severity, eventType, startTime, endTime } = options;
    
    let filteredLog = this.auditLog;

    if (severity) {
      filteredLog = filteredLog.filter(event => event.severity === severity);
    }

    if (eventType) {
      filteredLog = filteredLog.filter(event => event.eventType === eventType);
    }

    if (startTime) {
      filteredLog = filteredLog.filter(event => event.timestamp >= startTime);
    }

    if (endTime) {
      filteredLog = filteredLog.filter(event => event.timestamp <= endTime);
    }

    return filteredLog.slice(-limit);
  }

  // Cleanup expired data
  cleanup() {
    try {
      const now = Date.now();
      
      // Clean up expired rate limits
      for (const [identifier, limit] of this.rateLimits.entries()) {
        if (now - limit.windowStart > this.config.rateLimitWindow) {
          this.rateLimits.delete(identifier);
        }
      }

      // Clean up expired failed attempts
      for (const [identifier, attempt] of this.failedAttempts.entries()) {
        if (attempt.lockedUntil && now > attempt.lockedUntil) {
          this.failedAttempts.delete(identifier);
        }
      }

      logger.info('Security cleanup completed', {
        rateLimitsRemaining: this.rateLimits.size,
        failedAttemptsRemaining: this.failedAttempts.size
      });
    } catch (error) {
      logger.error('Security cleanup failed:', { error: error.message });
    }
  }
}

module.exports = new AdvancedSecurity();
