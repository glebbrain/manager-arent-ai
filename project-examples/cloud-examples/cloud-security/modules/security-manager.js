const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');
const crypto = require('crypto');

class SecurityManager {
  constructor() {
    this.logger = winston.createLogger({
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
    
    this.securityPolicies = new Map();
    this.securityGroups = new Map();
    this.accessControls = new Map();
    this.securityEvents = new Map();
    this.securityData = {
      totalPolicies: 0,
      activePolicies: 0,
      totalSecurityGroups: 0,
      totalAccessControls: 0,
      totalEvents: 0,
      criticalEvents: 0,
      lastUpdateTime: null
    };
  }

  // Initialize security manager
  async initialize() {
    try {
      this.initializeSecurityPolicies();
      this.initializeSecurityGroups();
      this.initializeAccessControls();
      
      this.logger.info('Security manager initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing security manager:', error);
      throw error;
    }
  }

  // Initialize security policies
  initializeSecurityPolicies() {
    this.securityPolicies = new Map([
      ['password-policy', {
        id: 'password-policy',
        name: 'Password Policy',
        description: 'Password complexity and expiration requirements',
        type: 'authentication',
        enabled: true,
        rules: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90, // days
          preventReuse: 5
        },
        severity: 'high',
        compliance: ['SOC2', 'ISO27001', 'GDPR']
      }],
      ['access-policy', {
        id: 'access-policy',
        name: 'Access Control Policy',
        description: 'User access control and permissions management',
        type: 'authorization',
        enabled: true,
        rules: {
          principleOfLeastPrivilege: true,
          regularAccessReview: 90, // days
          multiFactorAuth: true,
          sessionTimeout: 30, // minutes
          maxConcurrentSessions: 3
        },
        severity: 'high',
        compliance: ['SOC2', 'ISO27001', 'HIPAA']
      }],
      ['data-encryption', {
        id: 'data-encryption',
        name: 'Data Encryption Policy',
        description: 'Data encryption requirements for data at rest and in transit',
        type: 'data-protection',
        enabled: true,
        rules: {
          encryptAtRest: true,
          encryptInTransit: true,
          encryptionAlgorithm: 'AES-256',
          keyRotation: 90, // days
          secureKeyManagement: true
        },
        severity: 'critical',
        compliance: ['SOC2', 'ISO27001', 'PCI-DSS', 'GDPR']
      }],
      ['network-security', {
        id: 'network-security',
        name: 'Network Security Policy',
        description: 'Network security controls and monitoring',
        type: 'network',
        enabled: true,
        rules: {
          firewallEnabled: true,
          intrusionDetection: true,
          networkSegmentation: true,
          vpnRequired: true,
          sslTlsRequired: true
        },
        severity: 'high',
        compliance: ['SOC2', 'ISO27001', 'PCI-DSS']
      }],
      ['incident-response', {
        id: 'incident-response',
        name: 'Incident Response Policy',
        description: 'Security incident response procedures',
        type: 'incident-management',
        enabled: true,
        rules: {
          responseTime: 15, // minutes
          escalationLevels: 3,
          notificationRequired: true,
          documentationRequired: true,
          forensicsRequired: true
        },
        severity: 'critical',
        compliance: ['SOC2', 'ISO27001', 'NIST']
      }],
      ['vulnerability-management', {
        id: 'vulnerability-management',
        name: 'Vulnerability Management Policy',
        description: 'Vulnerability scanning and remediation procedures',
        type: 'vulnerability',
        enabled: true,
        rules: {
          scanFrequency: 7, // days
          criticalPatchTime: 24, // hours
          highPatchTime: 72, // hours
          mediumPatchTime: 30, // days
          lowPatchTime: 90, // days
          automatedScanning: true
        },
        severity: 'high',
        compliance: ['SOC2', 'ISO27001', 'PCI-DSS']
      }]
    ]);

    this.securityData.totalPolicies = this.securityPolicies.size;
    this.securityData.activePolicies = Array.from(this.securityPolicies.values()).filter(p => p.enabled).length;
  }

  // Initialize security groups
  initializeSecurityGroups() {
    this.securityGroups = new Map([
      ['web-tier', {
        id: 'web-tier',
        name: 'Web Tier Security Group',
        description: 'Security group for web application tier',
        type: 'application',
        rules: [
          {
            protocol: 'tcp',
            port: 80,
            source: '0.0.0.0/0',
            action: 'allow',
            description: 'HTTP access'
          },
          {
            protocol: 'tcp',
            port: 443,
            source: '0.0.0.0/0',
            action: 'allow',
            description: 'HTTPS access'
          },
          {
            protocol: 'tcp',
            port: 22,
            source: '10.0.0.0/8',
            action: 'allow',
            description: 'SSH from internal network'
          }
        ],
        tags: ['web', 'public'],
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      ['database-tier', {
        id: 'database-tier',
        name: 'Database Tier Security Group',
        description: 'Security group for database tier',
        type: 'database',
        rules: [
          {
            protocol: 'tcp',
            port: 5432,
            source: '10.0.1.0/24',
            action: 'allow',
            description: 'PostgreSQL from app tier'
          },
          {
            protocol: 'tcp',
            port: 3306,
            source: '10.0.1.0/24',
            action: 'allow',
            description: 'MySQL from app tier'
          }
        ],
        tags: ['database', 'private'],
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      ['admin-tier', {
        id: 'admin-tier',
        name: 'Admin Tier Security Group',
        description: 'Security group for administrative access',
        type: 'administrative',
        rules: [
          {
            protocol: 'tcp',
            port: 22,
            source: '10.0.0.0/8',
            action: 'allow',
            description: 'SSH from internal network'
          },
          {
            protocol: 'tcp',
            port: 3389,
            source: '10.0.0.0/8',
            action: 'allow',
            description: 'RDP from internal network'
          }
        ],
        tags: ['admin', 'private'],
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    ]);

    this.securityData.totalSecurityGroups = this.securityGroups.size;
  }

  // Initialize access controls
  initializeAccessControls() {
    this.accessControls = new Map([
      ['admin-access', {
        id: 'admin-access',
        name: 'Administrative Access Control',
        description: 'Full administrative access to all resources',
        type: 'role-based',
        permissions: ['read', 'write', 'delete', 'admin'],
        resources: ['*'],
        users: ['admin', 'security-admin'],
        groups: ['administrators'],
        conditions: {
          mfaRequired: true,
          ipRestriction: '10.0.0.0/8',
          timeRestriction: '09:00-17:00',
          sessionTimeout: 30
        },
        enabled: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      ['developer-access', {
        id: 'developer-access',
        name: 'Developer Access Control',
        description: 'Developer access to application resources',
        type: 'role-based',
        permissions: ['read', 'write'],
        resources: ['applications', 'databases', 'logs'],
        users: ['dev1', 'dev2', 'dev3'],
        groups: ['developers'],
        conditions: {
          mfaRequired: false,
          ipRestriction: '10.0.0.0/16',
          timeRestriction: '08:00-20:00',
          sessionTimeout: 60
        },
        enabled: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      ['readonly-access', {
        id: 'readonly-access',
        name: 'Read-Only Access Control',
        description: 'Read-only access to monitoring and logs',
        type: 'role-based',
        permissions: ['read'],
        resources: ['logs', 'metrics', 'reports'],
        users: ['monitor1', 'auditor1'],
        groups: ['monitors', 'auditors'],
        conditions: {
          mfaRequired: false,
          ipRestriction: '10.0.0.0/24',
          timeRestriction: '24/7',
          sessionTimeout: 120
        },
        enabled: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    ]);

    this.securityData.totalAccessControls = this.accessControls.size;
  }

  // Create security policy
  async createSecurityPolicy(config) {
    try {
      const policy = {
        id: config.id || this.generateId(),
        name: config.name,
        description: config.description || '',
        type: config.type || 'general',
        enabled: config.enabled !== false,
        rules: config.rules || {},
        severity: config.severity || 'medium',
        compliance: config.compliance || [],
        createdBy: config.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: config.metadata || {}
      };

      this.securityPolicies.set(policy.id, policy);
      this.securityData.totalPolicies++;

      if (policy.enabled) {
        this.securityData.activePolicies++;
      }

      this.logger.info('Security policy created successfully', {
        policyId: policy.id,
        name: policy.name,
        type: policy.type
      });

      return policy;
    } catch (error) {
      this.logger.error('Error creating security policy:', error);
      throw error;
    }
  }

  // Create security group
  async createSecurityGroup(config) {
    try {
      const securityGroup = {
        id: config.id || this.generateId(),
        name: config.name,
        description: config.description || '',
        type: config.type || 'custom',
        rules: config.rules || [],
        tags: config.tags || [],
        createdBy: config.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: config.metadata || {}
      };

      this.securityGroups.set(securityGroup.id, securityGroup);
      this.securityData.totalSecurityGroups++;

      this.logger.info('Security group created successfully', {
        securityGroupId: securityGroup.id,
        name: securityGroup.name,
        type: securityGroup.type
      });

      return securityGroup;
    } catch (error) {
      this.logger.error('Error creating security group:', error);
      throw error;
    }
  }

  // Create access control
  async createAccessControl(config) {
    try {
      const accessControl = {
        id: config.id || this.generateId(),
        name: config.name,
        description: config.description || '',
        type: config.type || 'role-based',
        permissions: config.permissions || [],
        resources: config.resources || [],
        users: config.users || [],
        groups: config.groups || [],
        conditions: config.conditions || {},
        enabled: config.enabled !== false,
        createdBy: config.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: config.metadata || {}
      };

      this.accessControls.set(accessControl.id, accessControl);
      this.securityData.totalAccessControls++;

      this.logger.info('Access control created successfully', {
        accessControlId: accessControl.id,
        name: accessControl.name,
        type: accessControl.type
      });

      return accessControl;
    } catch (error) {
      this.logger.error('Error creating access control:', error);
      throw error;
    }
  }

  // Check security compliance
  async checkCompliance(complianceFramework) {
    try {
      const policies = Array.from(this.securityPolicies.values());
      const complianceResults = [];

      for (const policy of policies) {
        if (!policy.enabled) continue;

        const compliance = policy.compliance.includes(complianceFramework);
        const complianceResult = {
          policyId: policy.id,
          policyName: policy.name,
          policyType: policy.type,
          compliance: compliance,
          severity: policy.severity,
          rules: policy.rules,
          lastChecked: new Date()
        };

        complianceResults.push(complianceResult);
      }

      const complianceScore = (complianceResults.filter(r => r.compliance).length / complianceResults.length) * 100;

      this.logger.info('Compliance check completed', {
        framework: complianceFramework,
        score: complianceScore,
        totalPolicies: complianceResults.length,
        compliantPolicies: complianceResults.filter(r => r.compliance).length
      });

      return {
        framework: complianceFramework,
        score: Math.round(complianceScore * 100) / 100,
        totalPolicies: complianceResults.length,
        compliantPolicies: complianceResults.filter(r => r.compliance).length,
        results: complianceResults,
        checkedAt: new Date()
      };
    } catch (error) {
      this.logger.error('Error checking compliance:', error);
      throw error;
    }
  }

  // Log security event
  async logSecurityEvent(event) {
    try {
      const securityEvent = {
        id: this.generateId(),
        type: event.type || 'general',
        severity: event.severity || 'info',
        source: event.source || 'unknown',
        user: event.user || 'system',
        resource: event.resource || 'unknown',
        action: event.action || 'unknown',
        description: event.description || '',
        details: event.details || {},
        timestamp: new Date(),
        ipAddress: event.ipAddress || 'unknown',
        userAgent: event.userAgent || 'unknown',
        metadata: event.metadata || {}
      };

      this.securityEvents.set(securityEvent.id, securityEvent);
      this.securityData.totalEvents++;

      if (securityEvent.severity === 'critical') {
        this.securityData.criticalEvents++;
      }

      this.logger.info('Security event logged', {
        eventId: securityEvent.id,
        type: securityEvent.type,
        severity: securityEvent.severity,
        source: securityEvent.source
      });

      return securityEvent;
    } catch (error) {
      this.logger.error('Error logging security event:', error);
      throw error;
    }
  }

  // Get security events
  async getSecurityEvents(filters = {}) {
    let events = Array.from(this.securityEvents.values());
    
    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }
    
    if (filters.severity) {
      events = events.filter(e => e.severity === filters.severity);
    }
    
    if (filters.source) {
      events = events.filter(e => e.source === filters.source);
    }
    
    if (filters.user) {
      events = events.filter(e => e.user === filters.user);
    }
    
    if (filters.startTime) {
      events = events.filter(e => e.timestamp >= new Date(filters.startTime));
    }
    
    if (filters.endTime) {
      events = events.filter(e => e.timestamp <= new Date(filters.endTime));
    }
    
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get security policies
  async getSecurityPolicies() {
    return Array.from(this.securityPolicies.values());
  }

  // Get security groups
  async getSecurityGroups() {
    return Array.from(this.securityGroups.values());
  }

  // Get access controls
  async getAccessControls() {
    return Array.from(this.accessControls.values());
  }

  // Get security data
  async getSecurityData() {
    return this.securityData;
  }

  // Generate unique ID
  generateId() {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new SecurityManager();
