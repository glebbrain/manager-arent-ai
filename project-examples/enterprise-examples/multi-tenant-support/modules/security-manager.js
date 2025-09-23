const winston = require('winston');
const crypto = require('crypto');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/security-manager.log' })
  ]
});

class SecurityManager {
  constructor() {
    this.securityPolicies = new Map(); // Tenant-specific security policies
    this.accessLogs = new Map(); // Access logging
    this.threatDetection = new Map(); // Threat detection data
  }

  /**
   * Initialize security for tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} config - Security configuration
   */
  async initializeTenantSecurity(tenantId, config = {}) {
    try {
      const securityPolicy = {
        tenantId,
        passwordPolicy: {
          minLength: config.minPasswordLength || 8,
          requireUppercase: config.requireUppercase !== false,
          requireLowercase: config.requireLowercase !== false,
          requireNumbers: config.requireNumbers !== false,
          requireSpecialChars: config.requireSpecialChars !== false,
          maxAge: config.maxPasswordAge || 90, // days
          preventReuse: config.preventPasswordReuse || 5 // last 5 passwords
        },
        sessionPolicy: {
          timeout: config.sessionTimeout || 24, // hours
          maxConcurrentSessions: config.maxConcurrentSessions || 5,
          requireMFA: config.requireMFA || false,
          idleTimeout: config.idleTimeout || 2 // hours
        },
        accessPolicy: {
          ipWhitelist: config.ipWhitelist || [],
          ipBlacklist: config.ipBlacklist || [],
          allowedCountries: config.allowedCountries || [],
          blockedCountries: config.blockedCountries || [],
          requireVPN: config.requireVPN || false
        },
        auditPolicy: {
          logAllActions: config.logAllActions !== false,
          logFailedAttempts: config.logFailedAttempts !== false,
          logDataAccess: config.logDataAccess !== false,
          retentionPeriod: config.auditRetentionPeriod || 365 // days
        },
        encryptionPolicy: {
          encryptAtRest: config.encryptAtRest !== false,
          encryptInTransit: config.encryptInTransit !== false,
          keyRotationPeriod: config.keyRotationPeriod || 90, // days
          algorithm: config.encryptionAlgorithm || 'AES-256-GCM'
        },
        compliancePolicy: {
          gdprCompliant: config.gdprCompliant || false,
          hipaaCompliant: config.hipaaCompliant || false,
          soxCompliant: config.soxCompliant || false,
          dataResidency: config.dataResidency || 'global'
        }
      };

      this.securityPolicies.set(tenantId, securityPolicy);
      logger.info('Security initialized for tenant', { tenantId, config });
    } catch (error) {
      logger.error('Error initializing tenant security:', error);
      throw error;
    }
  }

  /**
   * Validate password against policy
   * @param {string} tenantId - Tenant ID
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  async validatePassword(tenantId, password) {
    try {
      const policy = this.securityPolicies.get(tenantId);
      if (!policy) {
        throw new Error('Security policy not found for tenant');
      }

      const passwordPolicy = policy.passwordPolicy;
      const errors = [];

      // Check minimum length
      if (password.length < passwordPolicy.minLength) {
        errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
      }

      // Check uppercase requirement
      if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      // Check lowercase requirement
      if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      // Check numbers requirement
      if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      // Check special characters requirement
      if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      logger.error('Error validating password:', error);
      return {
        isValid: false,
        errors: ['Password validation failed']
      };
    }
  }

  /**
   * Check IP access permissions
   * @param {string} tenantId - Tenant ID
   * @param {string} ipAddress - IP address to check
   * @returns {Object} Access result
   */
  async checkIPAccess(tenantId, ipAddress) {
    try {
      const policy = this.securityPolicies.get(tenantId);
      if (!policy) {
        return { allowed: true, reason: 'No policy found' };
      }

      const accessPolicy = policy.accessPolicy;

      // Check blacklist first
      if (accessPolicy.ipBlacklist.includes(ipAddress)) {
        return { allowed: false, reason: 'IP address is blacklisted' };
      }

      // Check whitelist if configured
      if (accessPolicy.ipWhitelist.length > 0 && !accessPolicy.ipWhitelist.includes(ipAddress)) {
        return { allowed: false, reason: 'IP address not in whitelist' };
      }

      return { allowed: true, reason: 'IP access granted' };
    } catch (error) {
      logger.error('Error checking IP access:', error);
      return { allowed: false, reason: 'Access check failed' };
    }
  }

  /**
   * Log security event
   * @param {string} tenantId - Tenant ID
   * @param {Object} event - Security event
   */
  async logSecurityEvent(tenantId, event) {
    try {
      const eventId = crypto.randomUUID();
      const securityEvent = {
        id: eventId,
        tenantId,
        timestamp: new Date().toISOString(),
        type: event.type,
        severity: event.severity || 'info',
        userId: event.userId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        action: event.action,
        resource: event.resource,
        details: event.details,
        riskScore: this.calculateRiskScore(event)
      };

      // Store in access logs
      if (!this.accessLogs.has(tenantId)) {
        this.accessLogs.set(tenantId, []);
      }
      this.accessLogs.get(tenantId).push(securityEvent);

      // Check for threats
      await this.checkForThreats(tenantId, securityEvent);

      logger.info('Security event logged', { eventId, tenantId, type: event.type });
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  /**
   * Calculate risk score for event
   * @param {Object} event - Security event
   * @returns {number} Risk score (0-100)
   */
  calculateRiskScore(event) {
    let score = 0;

    // Base score by event type
    const typeScores = {
      'login_success': 0,
      'login_failed': 20,
      'password_change': 5,
      'data_access': 10,
      'admin_action': 15,
      'suspicious_activity': 50,
      'security_violation': 80
    };

    score += typeScores[event.type] || 10;

    // Increase score for failed attempts
    if (event.details?.failedAttempts) {
      score += Math.min(event.details.failedAttempts * 5, 30);
    }

    // Increase score for unusual hours
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 10;
    }

    // Increase score for unusual location
    if (event.details?.unusualLocation) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Check for threats based on security events
   * @param {string} tenantId - Tenant ID
   * @param {Object} event - Security event
   */
  async checkForThreats(tenantId, event) {
    try {
      const events = this.accessLogs.get(tenantId) || [];
      const recentEvents = events.filter(e => 
        new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
      );

      // Check for brute force attacks
      const failedLogins = recentEvents.filter(e => 
        e.type === 'login_failed' && e.userId === event.userId
      );

      if (failedLogins.length >= 5) {
        await this.handleThreat(tenantId, {
          type: 'brute_force_attack',
          severity: 'high',
          userId: event.userId,
          ipAddress: event.ipAddress,
          details: { failedAttempts: failedLogins.length }
        });
      }

      // Check for suspicious activity patterns
      if (event.riskScore > 70) {
        await this.handleThreat(tenantId, {
          type: 'suspicious_activity',
          severity: 'medium',
          userId: event.userId,
          ipAddress: event.ipAddress,
          details: { riskScore: event.riskScore }
        });
      }

      // Check for unusual access patterns
      const uniqueIPs = new Set(recentEvents.map(e => e.ipAddress));
      if (uniqueIPs.size > 3) {
        await this.handleThreat(tenantId, {
          type: 'unusual_access_pattern',
          severity: 'medium',
          userId: event.userId,
          details: { uniqueIPs: uniqueIPs.size }
        });
      }
    } catch (error) {
      logger.error('Error checking for threats:', error);
    }
  }

  /**
   * Handle security threat
   * @param {string} tenantId - Tenant ID
   * @param {Object} threat - Threat information
   */
  async handleThreat(tenantId, threat) {
    try {
      const threatId = crypto.randomUUID();
      const threatRecord = {
        id: threatId,
        tenantId,
        timestamp: new Date().toISOString(),
        ...threat
      };

      if (!this.threatDetection.has(tenantId)) {
        this.threatDetection.set(tenantId, []);
      }
      this.threatDetection.get(tenantId).push(threatRecord);

      // Take automatic actions based on threat severity
      if (threat.severity === 'high') {
        await this.takeAutomaticAction(tenantId, threat);
      }

      logger.warn('Security threat detected', { threatId, tenantId, type: threat.type, severity: threat.severity });
    } catch (error) {
      logger.error('Error handling threat:', error);
    }
  }

  /**
   * Take automatic action for high-severity threats
   * @param {string} tenantId - Tenant ID
   * @param {Object} threat - Threat information
   */
  async takeAutomaticAction(tenantId, threat) {
    try {
      switch (threat.type) {
        case 'brute_force_attack':
          // Lock user account temporarily
          await this.lockUserAccount(tenantId, threat.userId, 30); // 30 minutes
          break;
        
        case 'suspicious_activity':
          // Require additional authentication
          await this.requireAdditionalAuth(tenantId, threat.userId);
          break;
        
        default:
          // Log for manual review
          logger.warn('Threat requires manual review', { tenantId, threat });
      }
    } catch (error) {
      logger.error('Error taking automatic action:', error);
    }
  }

  /**
   * Lock user account temporarily
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @param {number} minutes - Lock duration in minutes
   */
  async lockUserAccount(tenantId, userId, minutes) {
    try {
      // This would typically update the user's lock status in the database
      logger.info('User account locked', { tenantId, userId, minutes });
    } catch (error) {
      logger.error('Error locking user account:', error);
    }
  }

  /**
   * Require additional authentication
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   */
  async requireAdditionalAuth(tenantId, userId) {
    try {
      // This would typically set a flag requiring MFA or additional verification
      logger.info('Additional authentication required', { tenantId, userId });
    } catch (error) {
      logger.error('Error requiring additional auth:', error);
    }
  }

  /**
   * Get security events for tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   * @returns {Array} Security events
   */
  async getSecurityEvents(tenantId, filters = {}) {
    try {
      let events = this.accessLogs.get(tenantId) || [];

      // Apply filters
      if (filters.type) {
        events = events.filter(event => event.type === filters.type);
      }
      if (filters.severity) {
        events = events.filter(event => event.severity === filters.severity);
      }
      if (filters.userId) {
        events = events.filter(event => event.userId === filters.userId);
      }
      if (filters.fromDate) {
        events = events.filter(event => new Date(event.timestamp) >= new Date(filters.fromDate));
      }
      if (filters.toDate) {
        events = events.filter(event => new Date(event.timestamp) <= new Date(filters.toDate));
      }

      // Sort by timestamp (newest first)
      events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return events;
    } catch (error) {
      logger.error('Error getting security events:', error);
      return [];
    }
  }

  /**
   * Get security threats for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Security threats
   */
  async getSecurityThreats(tenantId) {
    try {
      return this.threatDetection.get(tenantId) || [];
    } catch (error) {
      logger.error('Error getting security threats:', error);
      return [];
    }
  }

  /**
   * Get security dashboard data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Security dashboard data
   */
  async getSecurityDashboard(tenantId) {
    try {
      const events = this.accessLogs.get(tenantId) || [];
      const threats = this.threatDetection.get(tenantId) || [];
      const policy = this.securityPolicies.get(tenantId);

      // Calculate statistics
      const last24Hours = events.filter(e => 
        new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      const stats = {
        totalEvents: events.length,
        eventsLast24h: last24Hours.length,
        highRiskEvents: last24Hours.filter(e => e.riskScore > 70).length,
        activeThreats: threats.filter(t => 
          new Date(t.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        securityScore: this.calculateSecurityScore(events, threats),
        policy: policy
      };

      return stats;
    } catch (error) {
      logger.error('Error getting security dashboard:', error);
      return {};
    }
  }

  /**
   * Calculate overall security score
   * @param {Array} events - Security events
   * @param {Array} threats - Security threats
   * @returns {number} Security score (0-100)
   */
  calculateSecurityScore(events, threats) {
    let score = 100;

    // Deduct points for high-risk events
    const highRiskEvents = events.filter(e => e.riskScore > 70);
    score -= highRiskEvents.length * 5;

    // Deduct points for active threats
    const recentThreats = threats.filter(t => 
      new Date(t.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    score -= recentThreats.length * 10;

    // Deduct points for failed login attempts
    const failedLogins = events.filter(e => e.type === 'login_failed');
    score -= Math.min(failedLogins.length * 2, 20);

    return Math.max(score, 0);
  }

  /**
   * Generate security report
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Report options
   * @returns {Object} Security report
   */
  async generateSecurityReport(tenantId, options = {}) {
    try {
      const fromDate = options.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = options.toDate || new Date();

      const events = await this.getSecurityEvents(tenantId, { fromDate, toDate });
      const threats = await this.getSecurityThreats(tenantId);
      const dashboard = await this.getSecurityDashboard(tenantId);

      const report = {
        tenantId,
        period: { fromDate, toDate },
        generatedAt: new Date().toISOString(),
        summary: dashboard,
        events: events.slice(0, 100), // Limit to 100 most recent events
        threats: threats.filter(t => 
          new Date(t.timestamp) >= fromDate && new Date(t.timestamp) <= toDate
        ),
        recommendations: this.generateSecurityRecommendations(events, threats)
      };

      return report;
    } catch (error) {
      logger.error('Error generating security report:', error);
      throw error;
    }
  }

  /**
   * Generate security recommendations
   * @param {Array} events - Security events
   * @param {Array} threats - Security threats
   * @returns {Array} Security recommendations
   */
  generateSecurityRecommendations(events, threats) {
    const recommendations = [];

    // Check for weak passwords
    const passwordEvents = events.filter(e => e.type === 'password_change');
    if (passwordEvents.length > 0) {
      recommendations.push({
        type: 'password_policy',
        priority: 'medium',
        message: 'Consider strengthening password requirements',
        action: 'Update password policy to require more complex passwords'
      });
    }

    // Check for failed login attempts
    const failedLogins = events.filter(e => e.type === 'login_failed');
    if (failedLogins.length > 10) {
      recommendations.push({
        type: 'account_security',
        priority: 'high',
        message: 'High number of failed login attempts detected',
        action: 'Implement account lockout policy and consider MFA'
      });
    }

    // Check for unusual access patterns
    const uniqueIPs = new Set(events.map(e => e.ipAddress));
    if (uniqueIPs.size > 5) {
      recommendations.push({
        type: 'access_control',
        priority: 'medium',
        message: 'Multiple IP addresses accessing the system',
        action: 'Review IP whitelist and consider VPN requirements'
      });
    }

    return recommendations;
  }
}

module.exports = new SecurityManager();
