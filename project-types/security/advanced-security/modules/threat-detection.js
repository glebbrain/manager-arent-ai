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
    new winston.transports.File({ filename: 'logs/threat-detection.log' })
  ]
});

class ThreatDetectionService {
  constructor() {
    this.threatPatterns = new Map();
    this.suspiciousIPs = new Map();
    this.userBehavior = new Map();
    this.attackAttempts = new Map();
    this.initializeThreatPatterns();
  }

  /**
   * Initialize threat detection patterns
   */
  initializeThreatPatterns() {
    // SQL Injection patterns
    this.threatPatterns.set('sql_injection', [
      /('|(\\')|(;)|(--)|(\|)|(\*)|(%)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter)|(exec)|(execute))/i,
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /(\b(or|and)\s+\d+\s*=\s*\d+)/i,
      /(\b(or|and)\s+['"]\s*=\s*['"])/i
    ]);

    // XSS patterns
    this.threatPatterns.set('xss', [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*javascript:/gi
    ]);

    // Path traversal patterns
    this.threatPatterns.set('path_traversal', [
      /\.\.\//g,
      /\.\.\\/g,
      /\.\.%2f/gi,
      /\.\.%5c/gi,
      /\.\.%252f/gi,
      /\.\.%255c/gi
    ]);

    // Command injection patterns
    this.threatPatterns.set('command_injection', [
      /[;&|`$()]/,
      /\b(cat|ls|dir|type|more|less|head|tail|grep|find|locate|which|whereis|ps|top|kill|killall|pkill|pgrep|jobs|fg|bg|nohup|screen|tmux|ssh|scp|rsync|wget|curl|nc|netcat|telnet|ftp|sftp|rsh|rlogin|rexec|rsh|rcp|rdist|rstat|rwho|ruptime|rwall|rshd|rexecd|rlogind|rwhod|ruptimed|rwalld|rstatd|rdistd|rshd|rexecd|rlogind|rwhod|ruptimed|rwalld|rstatd|rdistd)\b/i
    ]);

    // Brute force patterns
    this.threatPatterns.set('brute_force', [
      /(admin|administrator|root|guest|test|demo|user|login|password|pass|pwd|123456|password123|admin123|qwerty|letmein|welcome|login123|admin123456|password1|123456789|12345678|1234567|123456|12345|1234|123|12|1|password|pass|pwd|admin|administrator|root|guest|test|demo|user|login|password|pass|pwd|123456|password123|admin123|qwerty|letmein|welcome|login123|admin123456|password1|123456789|12345678|1234567|123456|12345|1234|123|12|1)/i
    ]);

    logger.info('Threat patterns initialized', { 
      patternCount: this.threatPatterns.size 
    });
  }

  /**
   * Analyze request for threats
   * @param {Object} req - Express request object
   * @returns {Object} Analysis result
   */
  async analyzeRequest(req) {
    try {
      const threats = [];
      const riskScore = 0;

      // Analyze request body
      if (req.body) {
        const bodyThreats = this.analyzeData(req.body, 'request_body');
        threats.push(...bodyThreats);
      }

      // Analyze query parameters
      if (req.query) {
        const queryThreats = this.analyzeData(req.query, 'query_params');
        threats.push(...queryThreats);
      }

      // Analyze headers
      if (req.headers) {
        const headerThreats = this.analyzeData(req.headers, 'headers');
        threats.push(...headerThreats);
      }

      // Analyze URL path
      const pathThreats = this.analyzeData({ path: req.path }, 'url_path');
      threats.push(...pathThreats);

      // Check for suspicious IP patterns
      const ipThreats = await this.analyzeIP(req.ip);
      threats.push(...ipThreats);

      // Check for brute force attempts
      const bruteForceThreats = await this.checkBruteForce(req);
      threats.push(...bruteForceThreats);

      // Calculate overall risk score
      const calculatedRiskScore = this.calculateRiskScore(threats);

      // Log high-risk threats
      if (calculatedRiskScore > 70) {
        logger.warn('High-risk threat detected', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          threats,
          riskScore: calculatedRiskScore
        });
      }

      return {
        threats,
        riskScore: calculatedRiskScore,
        isThreat: calculatedRiskScore > 50,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error analyzing request:', error);
      return {
        threats: [],
        riskScore: 0,
        isThreat: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze data for threat patterns
   * @param {Object} data - Data to analyze
   * @param {string} source - Data source
   * @returns {Array} Detected threats
   */
  analyzeData(data, source) {
    const threats = [];
    const dataString = JSON.stringify(data).toLowerCase();

    for (const [threatType, patterns] of this.threatPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(dataString)) {
          threats.push({
            type: threatType,
            source,
            pattern: pattern.toString(),
            severity: this.getThreatSeverity(threatType),
            detected: new Date().toISOString()
          });
        }
      }
    }

    return threats;
  }

  /**
   * Analyze IP address for threats
   * @param {string} ip - IP address
   * @returns {Array} IP threats
   */
  async analyzeIP(ip) {
    const threats = [];

    try {
      // Check if IP is in suspicious list
      if (this.suspiciousIPs.has(ip)) {
        const ipData = this.suspiciousIPs.get(ip);
        threats.push({
          type: 'suspicious_ip',
          source: 'ip_address',
          ip,
          reason: ipData.reason,
          severity: 'high',
          detected: new Date().toISOString()
        });
      }

      // Check for known malicious IP ranges
      if (this.isMaliciousIP(ip)) {
        threats.push({
          type: 'malicious_ip',
          source: 'ip_address',
          ip,
          reason: 'Known malicious IP range',
          severity: 'critical',
          detected: new Date().toISOString()
        });
      }

      // Check for unusual geographic location
      const geoThreat = await this.checkGeographicAnomaly(ip);
      if (geoThreat) {
        threats.push(geoThreat);
      }

    } catch (error) {
      logger.error('Error analyzing IP:', error);
    }

    return threats;
  }

  /**
   * Check for brute force attempts
   * @param {Object} req - Express request object
   * @returns {Array} Brute force threats
   */
  async checkBruteForce(req) {
    const threats = [];
    const ip = req.ip;
    const key = `brute_force:${ip}`;

    try {
      const attempts = this.attackAttempts.get(key) || {
        count: 0,
        lastAttempt: null,
        windowStart: Date.now()
      };

      // Reset window if more than 15 minutes have passed
      if (Date.now() - attempts.windowStart > 15 * 60 * 1000) {
        attempts.count = 0;
        attempts.windowStart = Date.now();
      }

      // Increment attempt count
      attempts.count += 1;
      attempts.lastAttempt = new Date().toISOString();
      this.attackAttempts.set(key, attempts);

      // Check for brute force patterns
      if (attempts.count > 10) {
        threats.push({
          type: 'brute_force',
          source: 'ip_address',
          ip,
          count: attempts.count,
          severity: 'high',
          detected: new Date().toISOString()
        });

        // Add IP to suspicious list
        this.suspiciousIPs.set(ip, {
          reason: 'Brute force attack',
          firstSeen: attempts.windowStart,
          lastSeen: Date.now(),
          attemptCount: attempts.count
        });
      }

    } catch (error) {
      logger.error('Error checking brute force:', error);
    }

    return threats;
  }

  /**
   * Check if IP is malicious
   * @param {string} ip - IP address
   * @returns {boolean} Is malicious
   */
  isMaliciousIP(ip) {
    // In a real implementation, you would check against threat intelligence feeds
    // This is a simplified version
    const maliciousRanges = [
      '192.168.1.100', // Example malicious IP
      '10.0.0.100'     // Example malicious IP
    ];

    return maliciousRanges.includes(ip);
  }

  /**
   * Check for geographic anomalies
   * @param {string} ip - IP address
   * @returns {Object|null} Geographic threat
   */
  async checkGeographicAnomaly(ip) {
    try {
      // In a real implementation, you would use a geolocation service
      // This is a simplified version
      const userBehavior = this.userBehavior.get(ip) || {
        countries: [],
        lastSeen: null
      };

      // Simulate geolocation check
      const currentCountry = 'US'; // This would come from geolocation service
      
      if (userBehavior.countries.length > 0) {
        const lastCountry = userBehavior.countries[userBehavior.countries.length - 1];
        
        // Check if user is accessing from a different country within a short time
        if (lastCountry !== currentCountry && userBehavior.lastSeen) {
          const timeDiff = Date.now() - new Date(userBehavior.lastSeen).getTime();
          if (timeDiff < 60 * 60 * 1000) { // Less than 1 hour
            return {
              type: 'geographic_anomaly',
              source: 'ip_address',
              ip,
              reason: `Rapid location change from ${lastCountry} to ${currentCountry}`,
              severity: 'medium',
              detected: new Date().toISOString()
            };
          }
        }
      }

      // Update user behavior
      userBehavior.countries.push(currentCountry);
      userBehavior.lastSeen = new Date().toISOString();
      this.userBehavior.set(ip, userBehavior);

      return null;
    } catch (error) {
      logger.error('Error checking geographic anomaly:', error);
      return null;
    }
  }

  /**
   * Get threat severity
   * @param {string} threatType - Threat type
   * @returns {string} Severity level
   */
  getThreatSeverity(threatType) {
    const severityMap = {
      'sql_injection': 'critical',
      'xss': 'high',
      'path_traversal': 'high',
      'command_injection': 'critical',
      'brute_force': 'high',
      'suspicious_ip': 'high',
      'malicious_ip': 'critical',
      'geographic_anomaly': 'medium'
    };

    return severityMap[threatType] || 'low';
  }

  /**
   * Calculate risk score
   * @param {Array} threats - Detected threats
   * @returns {number} Risk score (0-100)
   */
  calculateRiskScore(threats) {
    let score = 0;

    for (const threat of threats) {
      switch (threat.severity) {
        case 'critical':
          score += 25;
          break;
        case 'high':
          score += 15;
          break;
        case 'medium':
          score += 10;
          break;
        case 'low':
          score += 5;
          break;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Add suspicious IP
   * @param {string} ip - IP address
   * @param {string} reason - Reason for suspicion
   * @param {string} severity - Severity level
   */
  addSuspiciousIP(ip, reason, severity = 'medium') {
    this.suspiciousIPs.set(ip, {
      reason,
      severity,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });

    logger.warn('Suspicious IP added', { ip, reason, severity });
  }

  /**
   * Remove suspicious IP
   * @param {string} ip - IP address
   * @returns {boolean} Success status
   */
  removeSuspiciousIP(ip) {
    const removed = this.suspiciousIPs.delete(ip);
    if (removed) {
      logger.info('Suspicious IP removed', { ip });
    }
    return removed;
  }

  /**
   * Get threat statistics
   * @returns {Object} Threat statistics
   */
  getThreatStats() {
    const totalThreats = Array.from(this.attackAttempts.values())
      .reduce((sum, attempts) => sum + attempts.count, 0);

    const suspiciousIPCount = this.suspiciousIPs.size;
    const attackAttempts = this.attackAttempts.size;

    return {
      totalThreats,
      suspiciousIPCount,
      attackAttempts,
      threatPatterns: this.threatPatterns.size
    };
  }

  /**
   * Clean up old data
   */
  cleanupOldData() {
    try {
      const now = Date.now();
      let cleaned = 0;

      // Clean up old attack attempts (older than 24 hours)
      for (const [key, attempts] of this.attackAttempts) {
        if (now - attempts.windowStart > 24 * 60 * 60 * 1000) {
          this.attackAttempts.delete(key);
          cleaned++;
        }
      }

      // Clean up old user behavior (older than 30 days)
      for (const [ip, behavior] of this.userBehavior) {
        if (behavior.lastSeen && now - new Date(behavior.lastSeen).getTime() > 30 * 24 * 60 * 60 * 1000) {
          this.userBehavior.delete(ip);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.info('Old threat detection data cleaned up', { count: cleaned });
      }
    } catch (error) {
      logger.error('Error cleaning up old data:', error);
    }
  }
}

module.exports = new ThreatDetectionService();
