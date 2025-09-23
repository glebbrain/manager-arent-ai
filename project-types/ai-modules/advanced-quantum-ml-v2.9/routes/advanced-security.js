const express = require('express');
const router = express.Router();
const advancedSecurity = require('../modules/advanced-security');
const logger = require('../modules/logger');

// Initialize advanced security
router.post('/initialize', async (req, res) => {
  try {
    const options = req.body || {};
    const result = advancedSecurity.initialize(options);
    
    logger.info('Advanced security initialized via API', {
      options,
      success: result.success
    });

    res.json({
      success: true,
      message: 'Advanced security system initialized successfully',
      data: result
    });
  } catch (error) {
    logger.error('Advanced security initialization failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Initialization failed',
      message: error.message
    });
  }
});

// Encrypt data
router.post('/encrypt', async (req, res) => {
  try {
    const { data, options = {} } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'data is required'
      });
    }

    const result = advancedSecurity.encrypt(data, options);
    
    logger.info('Data encrypted via API', {
      algorithm: result.algorithm,
      dataLength: data.length
    });

    res.json({
      success: true,
      message: 'Data encrypted successfully',
      data: result
    });
  } catch (error) {
    logger.error('Encryption failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Encryption failed',
      message: error.message
    });
  }
});

// Decrypt data
router.post('/decrypt', async (req, res) => {
  try {
    const { encryptedData, options = {} } = req.body;

    if (!encryptedData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'encryptedData is required'
      });
    }

    const result = advancedSecurity.decrypt(encryptedData, options);
    
    logger.info('Data decrypted via API', {
      algorithm: encryptedData.algorithm
    });

    res.json({
      success: true,
      message: 'Data decrypted successfully',
      data: { decrypted: result }
    });
  } catch (error) {
    logger.error('Decryption failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Decryption failed',
      message: error.message
    });
  }
});

// Hash data
router.post('/hash', async (req, res) => {
  try {
    const { data, options = {} } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'data is required'
      });
    }

    const result = advancedSecurity.hash(data, options);
    
    logger.info('Data hashed via API', {
      algorithm: result.algorithm,
      iterations: result.iterations
    });

    res.json({
      success: true,
      message: 'Data hashed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Hashing failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Hashing failed',
      message: error.message
    });
  }
});

// Verify hash
router.post('/verify-hash', async (req, res) => {
  try {
    const { data, hashData } = req.body;

    if (!data || !hashData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'data and hashData are required'
      });
    }

    const isValid = advancedSecurity.verifyHash(data, hashData);
    
    logger.info('Hash verification via API', {
      isValid,
      algorithm: hashData.algorithm
    });

    res.json({
      success: true,
      message: 'Hash verification completed',
      data: { valid: isValid }
    });
  } catch (error) {
    logger.error('Hash verification failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Hash verification failed',
      message: error.message
    });
  }
});

// Generate JWT token
router.post('/generate-token', async (req, res) => {
  try {
    const { payload, options = {} } = req.body;

    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'payload is required'
      });
    }

    const result = advancedSecurity.generateToken(payload, options);
    
    logger.info('JWT token generated via API', {
      algorithm: result.algorithm,
      expiresIn: result.expiresIn
    });

    res.json({
      success: true,
      message: 'JWT token generated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Token generation failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Token generation failed',
      message: error.message
    });
  }
});

// Verify JWT token
router.post('/verify-token', async (req, res) => {
  try {
    const { token, options = {} } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'token is required'
      });
    }

    const result = advancedSecurity.verifyToken(token, options);
    
    logger.info('JWT token verification via API', {
      valid: result.valid
    });

    res.json({
      success: true,
      message: 'Token verification completed',
      data: result
    });
  } catch (error) {
    logger.error('Token verification failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Token verification failed',
      message: error.message
    });
  }
});

// Check rate limit
router.post('/rate-limit', async (req, res) => {
  try {
    const { identifier, options = {} } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'identifier is required'
      });
    }

    const result = advancedSecurity.checkRateLimit(identifier, options);
    
    logger.info('Rate limit check via API', {
      identifier,
      allowed: result.allowed,
      remaining: result.remaining
    });

    res.json({
      success: true,
      message: 'Rate limit check completed',
      data: result
    });
  } catch (error) {
    logger.error('Rate limit check failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Rate limit check failed',
      message: error.message
    });
  }
});

// Check brute force protection
router.post('/brute-force-protection', async (req, res) => {
  try {
    const { identifier, options = {} } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'identifier is required'
      });
    }

    const result = advancedSecurity.checkBruteForceProtection(identifier, options);
    
    logger.info('Brute force protection check via API', {
      identifier,
      allowed: result.allowed,
      locked: result.locked
    });

    res.json({
      success: true,
      message: 'Brute force protection check completed',
      data: result
    });
  } catch (error) {
    logger.error('Brute force protection check failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Brute force protection check failed',
      message: error.message
    });
  }
});

// Record failed attempt
router.post('/record-failed-attempt', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'identifier is required'
      });
    }

    advancedSecurity.recordFailedAttempt(identifier);
    
    logger.info('Failed attempt recorded via API', { identifier });

    res.json({
      success: true,
      message: 'Failed attempt recorded successfully'
    });
  } catch (error) {
    logger.error('Failed to record failed attempt:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to record failed attempt',
      message: error.message
    });
  }
});

// Reset failed attempts
router.post('/reset-failed-attempts', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'identifier is required'
      });
    }

    advancedSecurity.resetFailedAttempts(identifier);
    
    logger.info('Failed attempts reset via API', { identifier });

    res.json({
      success: true,
      message: 'Failed attempts reset successfully'
    });
  } catch (error) {
    logger.error('Failed to reset failed attempts:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reset failed attempts',
      message: error.message
    });
  }
});

// Set security policy
router.post('/security-policy', async (req, res) => {
  try {
    const { name, policy } = req.body;

    if (!name || !policy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'name and policy are required'
      });
    }

    const result = advancedSecurity.setSecurityPolicy(name, policy);
    
    logger.info('Security policy set via API', { name });

    res.json({
      success: true,
      message: 'Security policy set successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to set security policy:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to set security policy',
      message: error.message
    });
  }
});

// Get security policy
router.get('/security-policy/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const policy = advancedSecurity.getSecurityPolicy(name);

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found',
        message: `Security policy '${name}' not found`
      });
    }

    res.json({
      success: true,
      message: 'Security policy retrieved successfully',
      data: { name, policy }
    });
  } catch (error) {
    logger.error('Failed to get security policy:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get security policy',
      message: error.message
    });
  }
});

// Perform security scan
router.post('/security-scan', async (req, res) => {
  try {
    const result = await advancedSecurity.performSecurityScan();
    
    logger.info('Security scan performed via API', {
      vulnerabilities: result.vulnerabilities.length,
      score: result.score
    });

    res.json({
      success: true,
      message: 'Security scan completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Security scan failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Security scan failed',
      message: error.message
    });
  }
});

// Get security metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = advancedSecurity.getSecurityMetrics();
    
    res.json({
      success: true,
      message: 'Security metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get security metrics:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get security metrics',
      message: error.message
    });
  }
});

// Get audit log
router.get('/audit-log', async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 100,
      severity: req.query.severity,
      eventType: req.query.eventType,
      startTime: req.query.startTime ? parseInt(req.query.startTime) : undefined,
      endTime: req.query.endTime ? parseInt(req.query.endTime) : undefined
    };

    const auditLog = advancedSecurity.getAuditLog(options);
    
    res.json({
      success: true,
      message: 'Audit log retrieved successfully',
      data: {
        events: auditLog,
        totalEvents: auditLog.length,
        options: options
      }
    });
  } catch (error) {
    logger.error('Failed to get audit log:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get audit log',
      message: error.message
    });
  }
});

// Cleanup security data
router.post('/cleanup', async (req, res) => {
  try {
    advancedSecurity.cleanup();
    
    logger.info('Security cleanup performed via API');

    res.json({
      success: true,
      message: 'Security cleanup completed successfully'
    });
  } catch (error) {
    logger.error('Security cleanup failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Security cleanup failed',
      message: error.message
    });
  }
});

// Health check for security system
router.get('/health', async (req, res) => {
  try {
    const metrics = advancedSecurity.getSecurityMetrics();
    
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      securityLevel: 'high',
      activeRateLimits: metrics.activeRateLimits,
      activeFailedAttempts: metrics.activeFailedAttempts,
      securityPolicies: metrics.securityPolicies,
      auditLogSize: metrics.auditLogSize,
      uptime: process.uptime()
    };

    res.json({
      success: true,
      message: 'Security system health check passed',
      data: health
    });
  } catch (error) {
    logger.error('Security health check failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Security health check failed',
      message: error.message
    });
  }
});

module.exports = router;
