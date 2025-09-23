const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class ThreatDetector {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/threat-detector.log' })
      ]
    });
    
    this.threatRules = new Map();
    this.threats = new Map();
    this.threatPatterns = new Map();
    this.detectorData = {
      totalRules: 0,
      activeRules: 0,
      totalThreats: 0,
      criticalThreats: 0,
      highThreats: 0,
      mediumThreats: 0,
      lowThreats: 0,
      lastDetectionTime: null
    };
  }

  // Initialize threat detector
  async initialize() {
    try {
      this.initializeThreatRules();
      this.initializeThreatPatterns();
      
      this.logger.info('Threat detector initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing threat detector:', error);
      throw error;
    }
  }

  // Initialize threat rules
  initializeThreatRules() {
    this.threatRules = new Map([
      ['brute-force-attack', {
        id: 'brute-force-attack',
        name: 'Brute Force Attack Detection',
        description: 'Detects multiple failed login attempts',
        type: 'authentication',
        enabled: true,
        conditions: {
          maxFailedAttempts: 5,
          timeWindow: 15, // minutes
          lockoutDuration: 30, // minutes
          ipWhitelist: []
        },
        severity: 'high',
        action: 'block_ip',
        confidence: 0.9
      }],
      ['sql-injection', {
        id: 'sql-injection',
        name: 'SQL Injection Detection',
        description: 'Detects SQL injection attempts in web requests',
        type: 'injection',
        enabled: true,
        conditions: {
          patterns: ['union', 'select', 'drop', 'insert', 'update', 'delete', '--', '/*', '*/'],
          caseSensitive: false,
          minPatterns: 2
        },
        severity: 'critical',
        action: 'block_request',
        confidence: 0.95
      }],
      ['xss-attack', {
        id: 'xss-attack',
        name: 'Cross-Site Scripting Detection',
        description: 'Detects XSS attempts in web requests',
        type: 'injection',
        enabled: true,
        conditions: {
          patterns: ['<script', 'javascript:', 'onload=', 'onerror=', 'onclick='],
          caseSensitive: false,
          minPatterns: 1
        },
        severity: 'high',
        action: 'block_request',
        confidence: 0.9
      }],
      ['ddos-attack', {
        id: 'ddos-attack',
        name: 'DDoS Attack Detection',
        description: 'Detects distributed denial of service attacks',
        type: 'availability',
        enabled: true,
        conditions: {
          maxRequestsPerMinute: 1000,
          maxConcurrentConnections: 500,
          timeWindow: 5, // minutes
          ipDiversity: 50 // unique IPs
        },
        severity: 'critical',
        action: 'rate_limit',
        confidence: 0.85
      }],
      ['malware-detection', {
        id: 'malware-detection',
        name: 'Malware Detection',
        description: 'Detects malware signatures in uploaded files',
        type: 'malware',
        enabled: true,
        conditions: {
          fileTypes: ['exe', 'dll', 'bat', 'cmd', 'scr', 'pif'],
          maxFileSize: 10 * 1024 * 1024, // 10MB
          scanContent: true,
          quarantineSuspicious: true
        },
        severity: 'critical',
        action: 'quarantine_file',
        confidence: 0.98
      }],
      ['privilege-escalation', {
        id: 'privilege-escalation',
        name: 'Privilege Escalation Detection',
        description: 'Detects attempts to escalate privileges',
        type: 'authorization',
        enabled: true,
        conditions: {
          suspiciousCommands: ['sudo', 'su', 'runas', 'elevate'],
          unusualPermissions: true,
          adminAccessAttempts: 3
        },
        severity: 'high',
        action: 'alert_admin',
        confidence: 0.8
      }],
      ['data-exfiltration', {
        id: 'data-exfiltration',
        name: 'Data Exfiltration Detection',
        description: 'Detects unauthorized data access and transfer',
        type: 'data-loss',
        enabled: true,
        conditions: {
          largeDataTransfer: 100 * 1024 * 1024, // 100MB
          unusualAccessPattern: true,
          externalDestination: true,
          encryptionBypass: true
        },
        severity: 'critical',
        action: 'block_transfer',
        confidence: 0.9
      }],
      ['insider-threat', {
        id: 'insider-threat',
        name: 'Insider Threat Detection',
        description: 'Detects suspicious activities by internal users',
        type: 'insider',
        enabled: true,
        conditions: {
          unusualAccessTime: true,
          bulkDataAccess: true,
          unauthorizedResourceAccess: true,
          dataModification: true
        },
        severity: 'high',
        action: 'investigate_user',
        confidence: 0.75
      }]
    ]);

    this.detectorData.totalRules = this.threatRules.size;
    this.detectorData.activeRules = Array.from(this.threatRules.values()).filter(r => r.enabled).length;
  }

  // Initialize threat patterns
  initializeThreatPatterns() {
    this.threatPatterns = new Map([
      ['network-scanning', {
        id: 'network-scanning',
        name: 'Network Scanning Pattern',
        description: 'Detects network scanning activities',
        patterns: [
          'nmap', 'masscan', 'zmap', 'unicornscan',
          'port.*scan', 'host.*discovery', 'service.*detection'
        ],
        severity: 'medium',
        confidence: 0.8
      }],
      ['credential-stuffing', {
        id: 'credential-stuffing',
        name: 'Credential Stuffing Pattern',
        description: 'Detects credential stuffing attacks',
        patterns: [
          'multiple.*login.*attempts', 'credential.*reuse',
          'password.*spray', 'brute.*force'
        ],
        severity: 'high',
        confidence: 0.85
      }],
      ['phishing-attempt', {
        id: 'phishing-attempt',
        name: 'Phishing Attempt Pattern',
        description: 'Detects phishing attempts',
        patterns: [
          'urgent.*action.*required', 'verify.*account',
          'suspended.*account', 'click.*here.*immediately'
        ],
        severity: 'medium',
        confidence: 0.7
      }],
      ['crypto-mining', {
        id: 'crypto-mining',
        name: 'Cryptocurrency Mining Pattern',
        description: 'Detects cryptocurrency mining activities',
        patterns: [
          'mining.*pool', 'cryptocurrency.*mining',
          'bitcoin.*mining', 'ethereum.*mining'
        ],
        severity: 'medium',
        confidence: 0.9
      }]
    ]);
  }

  // Detect threats
  async detectThreats(eventData) {
    try {
      const threats = [];
      const activeRules = Array.from(this.threatRules.values()).filter(rule => rule.enabled);
      
      for (const rule of activeRules) {
        try {
          const threat = await this.evaluateThreatRule(rule, eventData);
          if (threat) {
            threats.push(threat);
            await this.logThreat(threat);
          }
        } catch (error) {
          this.logger.error(`Error evaluating threat rule ${rule.id}:`, error);
        }
      }
      
      // Check threat patterns
      const patternThreats = await this.checkThreatPatterns(eventData);
      threats.push(...patternThreats);
      
      this.detectorData.lastDetectionTime = new Date();
      
      this.logger.info('Threat detection completed', {
        totalThreats: threats.length,
        criticalThreats: threats.filter(t => t.severity === 'critical').length,
        highThreats: threats.filter(t => t.severity === 'high').length
      });
      
      return threats;
    } catch (error) {
      this.logger.error('Error detecting threats:', error);
      throw error;
    }
  }

  // Evaluate threat rule
  async evaluateThreatRule(rule, eventData) {
    const threat = {
      id: this.generateId(),
      ruleId: rule.id,
      ruleName: rule.name,
      type: rule.type,
      severity: rule.severity,
      confidence: rule.confidence,
      source: eventData.source || 'unknown',
      target: eventData.target || 'unknown',
      description: rule.description,
      details: {
        eventData: eventData,
        rule: rule,
        detectedAt: new Date()
      },
      status: 'detected',
      action: rule.action,
      timestamp: new Date()
    };

    // Evaluate rule conditions
    let threatDetected = false;

    switch (rule.id) {
      case 'brute-force-attack':
        threatDetected = await this.detectBruteForce(rule, eventData);
        break;
      case 'sql-injection':
        threatDetected = await this.detectSQLInjection(rule, eventData);
        break;
      case 'xss-attack':
        threatDetected = await this.detectXSS(rule, eventData);
        break;
      case 'ddos-attack':
        threatDetected = await this.detectDDoS(rule, eventData);
        break;
      case 'malware-detection':
        threatDetected = await this.detectMalware(rule, eventData);
        break;
      case 'privilege-escalation':
        threatDetected = await this.detectPrivilegeEscalation(rule, eventData);
        break;
      case 'data-exfiltration':
        threatDetected = await this.detectDataExfiltration(rule, eventData);
        break;
      case 'insider-threat':
        threatDetected = await this.detectInsiderThreat(rule, eventData);
        break;
      default:
        threatDetected = await this.detectGenericThreat(rule, eventData);
    }

    return threatDetected ? threat : null;
  }

  // Detect brute force attacks
  async detectBruteForce(rule, eventData) {
    const { maxFailedAttempts, timeWindow } = rule.conditions;
    const { source, target, action } = eventData;
    
    // Simulate brute force detection
    const failedAttempts = Math.floor(Math.random() * 10);
    const timeDiff = Math.random() * 20; // minutes
    
    return failedAttempts >= maxFailedAttempts && timeDiff <= timeWindow;
  }

  // Detect SQL injection
  async detectSQLInjection(rule, eventData) {
    const { patterns, caseSensitive, minPatterns } = rule.conditions;
    const { request, query, body } = eventData;
    
    const searchText = `${request || ''} ${query || ''} ${body || ''}`;
    const searchPatterns = caseSensitive ? patterns : patterns.map(p => p.toLowerCase());
    const textToSearch = caseSensitive ? searchText : searchText.toLowerCase();
    
    const matches = searchPatterns.filter(pattern => textToSearch.includes(pattern));
    return matches.length >= minPatterns;
  }

  // Detect XSS attacks
  async detectXSS(rule, eventData) {
    const { patterns, caseSensitive, minPatterns } = rule.conditions;
    const { request, query, body } = eventData;
    
    const searchText = `${request || ''} ${query || ''} ${body || ''}`;
    const searchPatterns = caseSensitive ? patterns : patterns.map(p => p.toLowerCase());
    const textToSearch = caseSensitive ? searchText : searchText.toLowerCase();
    
    const matches = searchPatterns.filter(pattern => textToSearch.includes(pattern));
    return matches.length >= minPatterns;
  }

  // Detect DDoS attacks
  async detectDDoS(rule, eventData) {
    const { maxRequestsPerMinute, maxConcurrentConnections, timeWindow, ipDiversity } = rule.conditions;
    const { requests, connections, uniqueIPs } = eventData;
    
    // Simulate DDoS detection
    const requestRate = requests || Math.floor(Math.random() * 2000);
    const connectionCount = connections || Math.floor(Math.random() * 1000);
    const ipCount = uniqueIPs || Math.floor(Math.random() * 100);
    
    return requestRate > maxRequestsPerMinute || 
           connectionCount > maxConcurrentConnections ||
           ipCount > ipDiversity;
  }

  // Detect malware
  async detectMalware(rule, eventData) {
    const { fileTypes, maxFileSize, scanContent } = rule.conditions;
    const { fileName, fileSize, fileContent } = eventData;
    
    if (!fileName) return false;
    
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const isSuspiciousType = fileTypes.includes(fileExtension);
    const isOversized = fileSize > maxFileSize;
    
    // Simulate content scanning
    const hasMaliciousContent = scanContent && Math.random() > 0.8;
    
    return isSuspiciousType || isOversized || hasMaliciousContent;
  }

  // Detect privilege escalation
  async detectPrivilegeEscalation(rule, eventData) {
    const { suspiciousCommands, unusualPermissions, adminAccessAttempts } = rule.conditions;
    const { command, permissions, accessAttempts } = eventData;
    
    const hasSuspiciousCommand = suspiciousCommands.some(cmd => 
      command && command.toLowerCase().includes(cmd.toLowerCase())
    );
    const hasUnusualPermissions = unusualPermissions && permissions && permissions.length > 10;
    const hasAdminAttempts = accessAttempts >= adminAccessAttempts;
    
    return hasSuspiciousCommand || hasUnusualPermissions || hasAdminAttempts;
  }

  // Detect data exfiltration
  async detectDataExfiltration(rule, eventData) {
    const { largeDataTransfer, unusualAccessPattern, externalDestination, encryptionBypass } = rule.conditions;
    const { dataSize, accessPattern, destination, encrypted } = eventData;
    
    const isLargeTransfer = dataSize > largeDataTransfer;
    const hasUnusualPattern = unusualAccessPattern && Math.random() > 0.7;
    const isExternal = externalDestination && Math.random() > 0.6;
    const bypassesEncryption = encryptionBypass && !encrypted;
    
    return isLargeTransfer || hasUnusualPattern || isExternal || bypassesEncryption;
  }

  // Detect insider threats
  async detectInsiderThreat(rule, eventData) {
    const { unusualAccessTime, bulkDataAccess, unauthorizedResourceAccess, dataModification } = rule.conditions;
    const { accessTime, dataAccess, resourceAccess, modifications } = eventData;
    
    const isUnusualTime = unusualAccessTime && this.isUnusualAccessTime(accessTime);
    const isBulkAccess = bulkDataAccess && dataAccess && dataAccess.length > 100;
    const isUnauthorized = unauthorizedResourceAccess && Math.random() > 0.8;
    const hasModifications = dataModification && modifications && modifications.length > 0;
    
    return isUnusualTime || isBulkAccess || isUnauthorized || hasModifications;
  }

  // Detect generic threats
  async detectGenericThreat(rule, eventData) {
    // Generic threat detection logic
    return Math.random() > 0.8; // 20% chance of detecting a threat
  }

  // Check threat patterns
  async checkThreatPatterns(eventData) {
    const threats = [];
    const { logData, networkData, userData } = eventData;
    
    for (const pattern of this.threatPatterns.values()) {
      const textToSearch = `${logData || ''} ${networkData || ''} ${userData || ''}`.toLowerCase();
      const matches = pattern.patterns.filter(p => textToSearch.includes(p.toLowerCase()));
      
      if (matches.length > 0) {
        const threat = {
          id: this.generateId(),
          patternId: pattern.id,
          patternName: pattern.name,
          type: 'pattern-based',
          severity: pattern.severity,
          confidence: pattern.confidence,
          source: eventData.source || 'unknown',
          target: eventData.target || 'unknown',
          description: pattern.description,
          details: {
            matchedPatterns: matches,
            eventData: eventData,
            detectedAt: new Date()
          },
          status: 'detected',
          action: 'investigate',
          timestamp: new Date()
        };
        
        threats.push(threat);
        await this.logThreat(threat);
      }
    }
    
    return threats;
  }

  // Check if access time is unusual
  isUnusualAccessTime(accessTime) {
    if (!accessTime) return false;
    
    const hour = new Date(accessTime).getHours();
    // Unusual if access is between 11 PM and 5 AM
    return hour >= 23 || hour <= 5;
  }

  // Log threat
  async logThreat(threat) {
    this.threats.set(threat.id, threat);
    this.detectorData.totalThreats++;
    
    switch (threat.severity) {
      case 'critical':
        this.detectorData.criticalThreats++;
        break;
      case 'high':
        this.detectorData.highThreats++;
        break;
      case 'medium':
        this.detectorData.mediumThreats++;
        break;
      case 'low':
        this.detectorData.lowThreats++;
        break;
    }
    
    this.logger.warn('Threat detected', {
      threatId: threat.id,
      type: threat.type,
      severity: threat.severity,
      confidence: threat.confidence
    });
  }

  // Get threats
  async getThreats(filters = {}) {
    let threats = Array.from(this.threats.values());
    
    if (filters.type) {
      threats = threats.filter(t => t.type === filters.type);
    }
    
    if (filters.severity) {
      threats = threats.filter(t => t.severity === filters.severity);
    }
    
    if (filters.status) {
      threats = threats.filter(t => t.status === filters.status);
    }
    
    if (filters.startTime) {
      threats = threats.filter(t => t.timestamp >= new Date(filters.startTime));
    }
    
    if (filters.endTime) {
      threats = threats.filter(t => t.timestamp <= new Date(filters.endTime));
    }
    
    return threats.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get threat rules
  async getThreatRules() {
    return Array.from(this.threatRules.values());
  }

  // Get threat patterns
  async getThreatPatterns() {
    return Array.from(this.threatPatterns.values());
  }

  // Get detector data
  async getDetectorData() {
    return this.detectorData;
  }

  // Generate unique ID
  generateId() {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new ThreatDetector();
