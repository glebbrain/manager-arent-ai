const bcrypt = require('bcryptjs');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/auth-manager.log' })
  ]
});

class AuthManager {
  constructor() {
    this.sessions = new Map();
    this.refreshTokens = new Map();
    this.passwordHistory = new Map();
    this.failedAttempts = new Map();
    this.lockedAccounts = new Map();
  }

  /**
   * Hash password using Argon2id
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1,
        hashLength: 32
      });
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw error;
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Verification result
   */
  async verifyPassword(password, hash) {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      logger.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret
   * @param {string} expiresIn - Token expiration
   * @returns {string} JWT token
   */
  generateToken(payload, secret, expiresIn = '15m') {
    try {
      return jwt.sign(payload, secret, { 
        expiresIn,
        issuer: 'universal-automation-platform',
        audience: 'universal-automation-platform'
      });
    } catch (error) {
      logger.error('Error generating token:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @param {string} secret - JWT secret
   * @returns {Object} Decoded payload
   */
  verifyToken(token, secret) {
    try {
      return jwt.verify(token, secret, {
        issuer: 'universal-automation-platform',
        audience: 'universal-automation-platform'
      });
    } catch (error) {
      logger.error('Error verifying token:', error);
      throw error;
    }
  }

  /**
   * Generate refresh token
   * @returns {string} Refresh token
   */
  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Create user session
   * @param {string} userId - User ID
   * @param {Object} sessionData - Session data
   * @returns {Object} Session object
   */
  async createSession(userId, sessionData = {}) {
    try {
      const sessionId = crypto.randomUUID();
      const session = {
        id: sessionId,
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        isActive: true,
        lastActivity: new Date().toISOString()
      };

      this.sessions.set(sessionId, session);
      logger.info('Session created', { sessionId, userId });
      return session;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get user session
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session object or null
   */
  async getSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session || !session.isActive) {
        return null;
      }

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.invalidateSession(sessionId);
        return null;
      }

      // Update last activity
      session.lastActivity = new Date().toISOString();
      this.sessions.set(sessionId, session);

      return session;
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Invalidate user session
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success status
   */
  async invalidateSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.isActive = false;
        session.invalidatedAt = new Date().toISOString();
        this.sessions.set(sessionId, session);
      }
      logger.info('Session invalidated', { sessionId });
      return true;
    } catch (error) {
      logger.error('Error invalidating session:', error);
      return false;
    }
  }

  /**
   * Invalidate all user sessions
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async invalidateAllUserSessions(userId) {
    try {
      for (const [sessionId, session] of this.sessions) {
        if (session.userId === userId && session.isActive) {
          await this.invalidateSession(sessionId);
        }
      }
      logger.info('All user sessions invalidated', { userId });
      return true;
    } catch (error) {
      logger.error('Error invalidating all user sessions:', error);
      return false;
    }
  }

  /**
   * Check if account is locked
   * @param {string} userId - User ID
   * @returns {boolean} Lock status
   */
  isAccountLocked(userId) {
    const lockInfo = this.lockedAccounts.get(userId);
    if (!lockInfo) return false;

    // Check if lock has expired
    if (new Date() > new Date(lockInfo.lockedUntil)) {
      this.lockedAccounts.delete(userId);
      return false;
    }

    return true;
  }

  /**
   * Lock user account
   * @param {string} userId - User ID
   * @param {number} minutes - Lock duration in minutes
   * @param {string} reason - Lock reason
   */
  async lockAccount(userId, minutes = 30, reason = 'Too many failed attempts') {
    try {
      const lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
      this.lockedAccounts.set(userId, {
        lockedAt: new Date().toISOString(),
        lockedUntil: lockedUntil.toISOString(),
        reason,
        minutes
      });

      // Invalidate all user sessions
      await this.invalidateAllUserSessions(userId);

      logger.warn('Account locked', { userId, minutes, reason });
    } catch (error) {
      logger.error('Error locking account:', error);
    }
  }

  /**
   * Unlock user account
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async unlockAccount(userId) {
    try {
      this.lockedAccounts.delete(userId);
      logger.info('Account unlocked', { userId });
      return true;
    } catch (error) {
      logger.error('Error unlocking account:', error);
      return false;
    }
  }

  /**
   * Record failed login attempt
   * @param {string} userId - User ID
   * @param {string} ipAddress - IP address
   * @returns {Object} Attempt info
   */
  async recordFailedAttempt(userId, ipAddress) {
    try {
      const key = `${userId}:${ipAddress}`;
      const attempts = this.failedAttempts.get(key) || { count: 0, lastAttempt: null };
      
      attempts.count += 1;
      attempts.lastAttempt = new Date().toISOString();
      
      this.failedAttempts.set(key, attempts);

      // Lock account after 5 failed attempts
      if (attempts.count >= 5) {
        await this.lockAccount(userId, 30, 'Too many failed login attempts');
      }

      logger.warn('Failed login attempt recorded', { userId, ipAddress, count: attempts.count });
      return attempts;
    } catch (error) {
      logger.error('Error recording failed attempt:', error);
      return { count: 0, lastAttempt: null };
    }
  }

  /**
   * Clear failed attempts
   * @param {string} userId - User ID
   * @param {string} ipAddress - IP address
   */
  async clearFailedAttempts(userId, ipAddress) {
    try {
      const key = `${userId}:${ipAddress}`;
      this.failedAttempts.delete(key);
      logger.info('Failed attempts cleared', { userId, ipAddress });
    } catch (error) {
      logger.error('Error clearing failed attempts:', error);
    }
  }

  /**
   * Check password against history
   * @param {string} userId - User ID
   * @param {string} password - New password
   * @param {number} historyLimit - Number of previous passwords to check
   * @returns {boolean} Password is unique
   */
  async isPasswordUnique(userId, password, historyLimit = 5) {
    try {
      const history = this.passwordHistory.get(userId) || [];
      
      for (const oldHash of history) {
        if (await this.verifyPassword(password, oldHash)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking password uniqueness:', error);
      return true; // Allow password if check fails
    }
  }

  /**
   * Add password to history
   * @param {string} userId - User ID
   * @param {string} passwordHash - Password hash
   * @param {number} historyLimit - Maximum history size
   */
  async addPasswordToHistory(userId, passwordHash, historyLimit = 5) {
    try {
      const history = this.passwordHistory.get(userId) || [];
      history.unshift(passwordHash);
      
      // Keep only the last N passwords
      if (history.length > historyLimit) {
        history.splice(historyLimit);
      }
      
      this.passwordHistory.set(userId, history);
      logger.info('Password added to history', { userId, historyLength: history.length });
    } catch (error) {
      logger.error('Error adding password to history:', error);
    }
  }

  /**
   * Generate secure random password
   * @param {number} length - Password length
   * @param {Object} options - Password options
   * @returns {string} Generated password
   */
  generateSecurePassword(length = 16, options = {}) {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true
    } = options;

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (excludeSimilar) {
      charset = charset.replace(/[0O1lI]/g, '');
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @param {Object} policy - Password policy
   * @returns {Object} Validation result
   */
  validatePasswordStrength(password, policy = {}) {
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSymbols = true,
      maxLength = 128
    } = policy;

    const errors = [];
    const warnings = [];

    // Length checks
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (password.length > maxLength) {
      errors.push(`Password must be no more than ${maxLength} characters long`);
    }

    // Character type checks
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common password checks
    const commonPasswords = ['password', '123456', 'admin', 'qwerty', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    // Sequential character checks
    if (/(.)\1{2,}/.test(password)) {
      warnings.push('Password contains repeated characters');
    }

    // Calculate strength score
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    if (password.length >= 16) score += 1;

    const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : score <= 6 ? 'strong' : 'very-strong';

    return {
      isValid: errors.length === 0,
      strength,
      score,
      errors,
      warnings
    };
  }

  /**
   * Generate password reset token
   * @returns {Object} Reset token info
   */
  generatePasswordResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    return {
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @param {Date} expiresAt - Expiration date
   * @returns {boolean} Token is valid
   */
  verifyPasswordResetToken(token, expiresAt) {
    try {
      return new Date() < new Date(expiresAt);
    } catch (error) {
      logger.error('Error verifying reset token:', error);
      return false;
    }
  }

  /**
   * Get authentication statistics
   * @returns {Object} Auth statistics
   */
  getAuthStats() {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive).length;
    const lockedAccounts = this.lockedAccounts.size;
    const totalFailedAttempts = Array.from(this.failedAttempts.values())
      .reduce((sum, attempts) => sum + attempts.count, 0);

    return {
      activeSessions,
      lockedAccounts,
      totalFailedAttempts,
      totalSessions: this.sessions.size,
      totalRefreshTokens: this.refreshTokens.size
    };
  }
}

module.exports = new AuthManager();
