const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
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
    new winston.transports.File({ filename: 'logs/mfa-service.log' })
  ]
});

class MFAService {
  constructor() {
    this.totpSecrets = new Map(); // User TOTP secrets
    this.backupCodes = new Map(); // User backup codes
    this.smsTokens = new Map(); // SMS verification tokens
    this.emailTokens = new Map(); // Email verification tokens
    this.mfaAttempts = new Map(); // MFA attempt tracking
  }

  /**
   * Generate TOTP secret for user
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @param {string} serviceName - Service name
   * @returns {Object} TOTP setup info
   */
  async generateTOTPSecret(userId, userEmail, serviceName = 'Universal Automation Platform') {
    try {
      const secret = speakeasy.generateSecret({
        name: userEmail,
        issuer: serviceName,
        length: 32
      });

      // Store secret for user
      this.totpSecrets.set(userId, {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
        createdAt: new Date().toISOString()
      });

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

      logger.info('TOTP secret generated', { userId });

      return {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
        qrCodeDataURL,
        manualEntryKey: secret.base32
      };
    } catch (error) {
      logger.error('Error generating TOTP secret:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP token
   * @param {string} userId - User ID
   * @param {string} token - TOTP token
   * @returns {Object} Verification result
   */
  async verifyTOTPToken(userId, token) {
    try {
      const userSecret = this.totpSecrets.get(userId);
      if (!userSecret) {
        return { valid: false, error: 'TOTP not configured for user' };
      }

      const verified = speakeasy.totp.verify({
        secret: userSecret.secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps before/after current time
      });

      if (verified) {
        logger.info('TOTP token verified successfully', { userId });
        return { valid: true };
      } else {
        await this.recordMFAAttempt(userId, 'totp', false);
        logger.warn('Invalid TOTP token', { userId });
        return { valid: false, error: 'Invalid token' };
      }
    } catch (error) {
      logger.error('Error verifying TOTP token:', error);
      return { valid: false, error: 'Verification failed' };
    }
  }

  /**
   * Generate backup codes for user
   * @param {string} userId - User ID
   * @param {number} count - Number of codes to generate
   * @returns {Array} Backup codes
   */
  async generateBackupCodes(userId, count = 10) {
    try {
      const codes = [];
      for (let i = 0; i < count; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
      }

      // Store hashed codes
      const hashedCodes = codes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
      this.backupCodes.set(userId, {
        codes: hashedCodes,
        createdAt: new Date().toISOString(),
        used: []
      });

      logger.info('Backup codes generated', { userId, count });
      return codes;
    } catch (error) {
      logger.error('Error generating backup codes:', error);
      throw error;
    }
  }

  /**
   * Verify backup code
   * @param {string} userId - User ID
   * @param {string} code - Backup code
   * @returns {Object} Verification result
   */
  async verifyBackupCode(userId, code) {
    try {
      const userBackupCodes = this.backupCodes.get(userId);
      if (!userBackupCodes) {
        return { valid: false, error: 'No backup codes configured' };
      }

      const hashedCode = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
      const codeIndex = userBackupCodes.codes.indexOf(hashedCode);

      if (codeIndex === -1) {
        await this.recordMFAAttempt(userId, 'backup', false);
        return { valid: false, error: 'Invalid backup code' };
      }

      // Check if code was already used
      if (userBackupCodes.used.includes(codeIndex)) {
        await this.recordMFAAttempt(userId, 'backup', false);
        return { valid: false, error: 'Backup code already used' };
      }

      // Mark code as used
      userBackupCodes.used.push(codeIndex);
      this.backupCodes.set(userId, userBackupCodes);

      logger.info('Backup code verified successfully', { userId });
      return { valid: true };
    } catch (error) {
      logger.error('Error verifying backup code:', error);
      return { valid: false, error: 'Verification failed' };
    }
  }

  /**
   * Generate SMS verification code
   * @param {string} userId - User ID
   * @param {string} phoneNumber - Phone number
   * @returns {Object} SMS verification info
   */
  async generateSMSCode(userId, phoneNumber) {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      this.smsTokens.set(userId, {
        code: crypto.createHash('sha256').update(code).digest('hex'),
        phoneNumber,
        expiresAt: expiresAt.toISOString(),
        attempts: 0,
        createdAt: new Date().toISOString()
      });

      // In a real implementation, you would send SMS here
      // For now, we'll just log it
      logger.info('SMS code generated', { userId, phoneNumber, code });

      return {
        code, // Only for development/testing
        expiresAt: expiresAt.toISOString(),
        message: 'SMS code sent to your phone'
      };
    } catch (error) {
      logger.error('Error generating SMS code:', error);
      throw error;
    }
  }

  /**
   * Verify SMS code
   * @param {string} userId - User ID
   * @param {string} code - SMS code
   * @returns {Object} Verification result
   */
  async verifySMSCode(userId, code) {
    try {
      const smsData = this.smsTokens.get(userId);
      if (!smsData) {
        return { valid: false, error: 'No SMS code found' };
      }

      // Check if code is expired
      if (new Date() > new Date(smsData.expiresAt)) {
        this.smsTokens.delete(userId);
        return { valid: false, error: 'SMS code expired' };
      }

      // Check attempt limit
      if (smsData.attempts >= 3) {
        this.smsTokens.delete(userId);
        return { valid: false, error: 'Too many attempts' };
      }

      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      if (hashedCode !== smsData.code) {
        smsData.attempts += 1;
        this.smsTokens.set(userId, smsData);
        await this.recordMFAAttempt(userId, 'sms', false);
        return { valid: false, error: 'Invalid SMS code' };
      }

      // Code is valid, remove it
      this.smsTokens.delete(userId);
      logger.info('SMS code verified successfully', { userId });
      return { valid: true };
    } catch (error) {
      logger.error('Error verifying SMS code:', error);
      return { valid: false, error: 'Verification failed' };
    }
  }

  /**
   * Generate email verification code
   * @param {string} userId - User ID
   * @param {string} email - Email address
   * @returns {Object} Email verification info
   */
  async generateEmailCode(userId, email) {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      this.emailTokens.set(userId, {
        code: crypto.createHash('sha256').update(code).digest('hex'),
        email,
        expiresAt: expiresAt.toISOString(),
        attempts: 0,
        createdAt: new Date().toISOString()
      });

      // In a real implementation, you would send email here
      // For now, we'll just log it
      logger.info('Email code generated', { userId, email, code });

      return {
        code, // Only for development/testing
        expiresAt: expiresAt.toISOString(),
        message: 'Verification code sent to your email'
      };
    } catch (error) {
      logger.error('Error generating email code:', error);
      throw error;
    }
  }

  /**
   * Verify email code
   * @param {string} userId - User ID
   * @param {string} code - Email code
   * @returns {Object} Verification result
   */
  async verifyEmailCode(userId, code) {
    try {
      const emailData = this.emailTokens.get(userId);
      if (!emailData) {
        return { valid: false, error: 'No email code found' };
      }

      // Check if code is expired
      if (new Date() > new Date(emailData.expiresAt)) {
        this.emailTokens.delete(userId);
        return { valid: false, error: 'Email code expired' };
      }

      // Check attempt limit
      if (emailData.attempts >= 3) {
        this.emailTokens.delete(userId);
        return { valid: false, error: 'Too many attempts' };
      }

      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      if (hashedCode !== emailData.code) {
        emailData.attempts += 1;
        this.emailTokens.set(userId, emailData);
        await this.recordMFAAttempt(userId, 'email', false);
        return { valid: false, error: 'Invalid email code' };
      }

      // Code is valid, remove it
      this.emailTokens.delete(userId);
      logger.info('Email code verified successfully', { userId });
      return { valid: true };
    } catch (error) {
      logger.error('Error verifying email code:', error);
      return { valid: false, error: 'Verification failed' };
    }
  }

  /**
   * Record MFA attempt
   * @param {string} userId - User ID
   * @param {string} method - MFA method
   * @param {boolean} success - Success status
   */
  async recordMFAAttempt(userId, method, success) {
    try {
      const key = `${userId}:${method}`;
      const attempts = this.mfaAttempts.get(key) || { count: 0, lastAttempt: null, failures: 0 };
      
      attempts.count += 1;
      attempts.lastAttempt = new Date().toISOString();
      
      if (!success) {
        attempts.failures += 1;
      }

      this.mfaAttempts.set(key, attempts);

      logger.info('MFA attempt recorded', { userId, method, success, count: attempts.count });
    } catch (error) {
      logger.error('Error recording MFA attempt:', error);
    }
  }

  /**
   * Get MFA status for user
   * @param {string} userId - User ID
   * @returns {Object} MFA status
   */
  async getMFAStatus(userId) {
    try {
      const totpSecret = this.totpSecrets.get(userId);
      const backupCodes = this.backupCodes.get(userId);
      const smsData = this.smsTokens.get(userId);
      const emailData = this.emailTokens.get(userId);

      return {
        totp: {
          configured: !!totpSecret,
          createdAt: totpSecret?.createdAt
        },
        backupCodes: {
          configured: !!backupCodes,
          remaining: backupCodes ? backupCodes.codes.length - backupCodes.used.length : 0,
          createdAt: backupCodes?.createdAt
        },
        sms: {
          pending: !!smsData,
          phoneNumber: smsData?.phoneNumber,
          expiresAt: smsData?.expiresAt
        },
        email: {
          pending: !!emailData,
          email: emailData?.email,
          expiresAt: emailData?.expiresAt
        }
      };
    } catch (error) {
      logger.error('Error getting MFA status:', error);
      return {};
    }
  }

  /**
   * Disable MFA for user
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async disableMFA(userId) {
    try {
      this.totpSecrets.delete(userId);
      this.backupCodes.delete(userId);
      this.smsTokens.delete(userId);
      this.emailTokens.delete(userId);

      logger.info('MFA disabled for user', { userId });
      return true;
    } catch (error) {
      logger.error('Error disabling MFA:', error);
      return false;
    }
  }

  /**
   * Get MFA statistics
   * @returns {Object} MFA statistics
   */
  getMFAStats() {
    const totpUsers = this.totpSecrets.size;
    const backupCodeUsers = this.backupCodes.size;
    const pendingSMS = this.smsTokens.size;
    const pendingEmail = this.emailTokens.size;

    const totalAttempts = Array.from(this.mfaAttempts.values())
      .reduce((sum, attempts) => sum + attempts.count, 0);

    const failedAttempts = Array.from(this.mfaAttempts.values())
      .reduce((sum, attempts) => sum + attempts.failures, 0);

    return {
      totpUsers,
      backupCodeUsers,
      pendingSMS,
      pendingEmail,
      totalAttempts,
      failedAttempts,
      successRate: totalAttempts > 0 ? ((totalAttempts - failedAttempts) / totalAttempts * 100).toFixed(2) : 0
    };
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    try {
      const now = new Date();
      let cleaned = 0;

      // Clean up SMS tokens
      for (const [userId, smsData] of this.smsTokens) {
        if (now > new Date(smsData.expiresAt)) {
          this.smsTokens.delete(userId);
          cleaned++;
        }
      }

      // Clean up email tokens
      for (const [userId, emailData] of this.emailTokens) {
        if (now > new Date(emailData.expiresAt)) {
          this.emailTokens.delete(userId);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.info('Expired tokens cleaned up', { count: cleaned });
      }
    } catch (error) {
      logger.error('Error cleaning up expired tokens:', error);
    }
  }
}

module.exports = new MFAService();
