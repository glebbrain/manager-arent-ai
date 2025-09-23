const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class AuditManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/audit-manager.log' })
      ]
    });
    
    this.audits = new Map();
    this.auditTrails = new Map();
    this.auditLogs = new Map();
    this.auditSchedules = new Map();
    this.metrics = {
      totalAudits: 0,
      completedAudits: 0,
      failedAudits: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0
    };
  }

  // Initialize audit manager
  async initialize() {
    try {
      this.initializeAuditTypes();
      this.initializeAuditSchedules();
      
      this.logger.info('Audit manager initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing audit manager:', error);
      throw error;
    }
  }

  // Initialize audit types
  initializeAuditTypes() {
    this.auditTypes = {
      'security_audit': {
        name: 'Security Audit',
        description: 'Comprehensive security assessment',
        frequency: 'quarterly',
        duration: 14, // days
        scope: ['access_control', 'encryption', 'network_security', 'incident_response'],
        requirements: ['security_policies', 'access_logs', 'encryption_certificates', 'incident_reports']
      },
      'compliance_audit': {
        name: 'Compliance Audit',
        description: 'Regulatory compliance assessment',
        frequency: 'annually',
        duration: 21, // days
        scope: ['gdpr', 'hipaa', 'soc2', 'pci_dss'],
        requirements: ['compliance_documentation', 'policy_reviews', 'training_records', 'incident_logs']
      },
      'data_audit': {
        name: 'Data Audit',
        description: 'Data protection and privacy assessment',
        frequency: 'semi-annually',
        duration: 10, // days
        scope: ['data_classification', 'data_retention', 'data_breach', 'privacy_controls'],
        requirements: ['data_inventory', 'retention_policies', 'breach_logs', 'privacy_assessments']
      },
      'access_audit': {
        name: 'Access Audit',
        description: 'User access and permissions review',
        frequency: 'monthly',
        duration: 5, // days
        scope: ['user_accounts', 'privileged_access', 'access_reviews', 'termination_process'],
        requirements: ['user_lists', 'access_matrices', 'review_reports', 'termination_logs']
      },
      'infrastructure_audit': {
        name: 'Infrastructure Audit',
        description: 'IT infrastructure and operations assessment',
        frequency: 'quarterly',
        duration: 7, // days
        scope: ['server_configuration', 'network_setup', 'backup_procedures', 'disaster_recovery'],
        requirements: ['server_configs', 'network_diagrams', 'backup_logs', 'dr_plans']
      }
    };
  }

  // Initialize audit schedules
  initializeAuditSchedules() {
    // This would typically load from a database or configuration
    this.auditSchedules.set('quarterly_security', {
      id: 'quarterly_security',
      type: 'security_audit',
      frequency: 'quarterly',
      nextRun: moment().add(3, 'months').toDate(),
      enabled: true
    });

    this.auditSchedules.set('annual_compliance', {
      id: 'annual_compliance',
      type: 'compliance_audit',
      frequency: 'annually',
      nextRun: moment().add(1, 'year').toDate(),
      enabled: true
    });
  }

  // Create audit
  async createAudit(config) {
    try {
      const audit = {
        id: this.generateId(),
        type: config.type,
        name: config.name || this.auditTypes[config.type]?.name,
        description: config.description || this.auditTypes[config.type]?.description,
        scope: config.scope || this.auditTypes[config.type]?.scope || [],
        requirements: config.requirements || this.auditTypes[config.type]?.requirements || [],
        status: 'planned',
        priority: config.priority || 'medium',
        assignedTo: config.assignedTo || null,
        startDate: config.startDate || new Date(),
        endDate: config.endDate || moment().add(this.auditTypes[config.type]?.duration || 7, 'days').toDate(),
        findings: [],
        recommendations: [],
        evidence: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.audits.set(audit.id, audit);
      
      this.logger.info('Audit created successfully', { id: audit.id, type: audit.type });
      return audit;
    } catch (error) {
      this.logger.error('Error creating audit:', error);
      throw error;
    }
  }

  // Start audit
  async startAudit(auditId) {
    try {
      const audit = this.audits.get(auditId);
      if (!audit) {
        throw new Error('Audit not found');
      }

      audit.status = 'in_progress';
      audit.actualStartDate = new Date();
      audit.updatedAt = new Date();

      this.audits.set(auditId, audit);

      // Create audit trail entry
      await this.createAuditTrail(auditId, 'audit_started', 'Audit started', {
        startedBy: 'system',
        startDate: audit.actualStartDate
      });

      this.logger.info('Audit started', { id: auditId });
      return audit;
    } catch (error) {
      this.logger.error('Error starting audit:', error);
      throw error;
    }
  }

  // Complete audit
  async completeAudit(auditId, results) {
    try {
      const audit = this.audits.get(auditId);
      if (!audit) {
        throw new Error('Audit not found');
      }

      audit.status = 'completed';
      audit.actualEndDate = new Date();
      audit.findings = results.findings || [];
      audit.recommendations = results.recommendations || [];
      audit.evidence = results.evidence || [];
      audit.score = results.score || 0;
      audit.updatedAt = new Date();

      this.audits.set(auditId, audit);

      // Update metrics
      this.updateMetrics(audit);

      // Create audit trail entry
      await this.createAuditTrail(auditId, 'audit_completed', 'Audit completed', {
        completedBy: 'system',
        endDate: audit.actualEndDate,
        score: audit.score,
        findingsCount: audit.findings.length
      });

      this.logger.info('Audit completed', { 
        id: auditId, 
        score: audit.score, 
        findings: audit.findings.length 
      });

      return audit;
    } catch (error) {
      this.logger.error('Error completing audit:', error);
      throw error;
    }
  }

  // Add finding
  async addFinding(auditId, finding) {
    try {
      const audit = this.audits.get(auditId);
      if (!audit) {
        throw new Error('Audit not found');
      }

      const auditFinding = {
        id: this.generateId(),
        auditId,
        title: finding.title,
        description: finding.description,
        severity: finding.severity || 'medium',
        category: finding.category || 'general',
        evidence: finding.evidence || [],
        remediation: finding.remediation || '',
        status: 'open',
        assignedTo: finding.assignedTo || null,
        dueDate: finding.dueDate || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      audit.findings.push(auditFinding);
      audit.updatedAt = new Date();

      this.audits.set(auditId, audit);

      // Create audit trail entry
      await this.createAuditTrail(auditId, 'finding_added', 'Finding added', {
        findingId: auditFinding.id,
        title: auditFinding.title,
        severity: auditFinding.severity
      });

      this.logger.info('Finding added to audit', { 
        auditId, 
        findingId: auditFinding.id, 
        severity: auditFinding.severity 
      });

      return auditFinding;
    } catch (error) {
      this.logger.error('Error adding finding:', error);
      throw error;
    }
  }

  // Update finding
  async updateFinding(auditId, findingId, updates) {
    try {
      const audit = this.audits.get(auditId);
      if (!audit) {
        throw new Error('Audit not found');
      }

      const finding = audit.findings.find(f => f.id === findingId);
      if (!finding) {
        throw new Error('Finding not found');
      }

      Object.assign(finding, updates);
      finding.updatedAt = new Date();
      audit.updatedAt = new Date();

      this.audits.set(auditId, audit);

      // Create audit trail entry
      await this.createAuditTrail(auditId, 'finding_updated', 'Finding updated', {
        findingId,
        updates: Object.keys(updates)
      });

      this.logger.info('Finding updated', { auditId, findingId });
      return finding;
    } catch (error) {
      this.logger.error('Error updating finding:', error);
      throw error;
    }
  }

  // Add evidence
  async addEvidence(auditId, evidence) {
    try {
      const audit = this.audits.get(auditId);
      if (!audit) {
        throw new Error('Audit not found');
      }

      const auditEvidence = {
        id: this.generateId(),
        auditId,
        type: evidence.type,
        title: evidence.title,
        description: evidence.description,
        filePath: evidence.filePath,
        fileSize: evidence.fileSize,
        mimeType: evidence.mimeType,
        hash: evidence.hash,
        uploadedBy: evidence.uploadedBy,
        uploadedAt: new Date()
      };

      audit.evidence.push(auditEvidence);
      audit.updatedAt = new Date();

      this.audits.set(auditId, audit);

      this.logger.info('Evidence added to audit', { auditId, evidenceId: auditEvidence.id });
      return auditEvidence;
    } catch (error) {
      this.logger.error('Error adding evidence:', error);
      throw error;
    }
  }

  // Create audit trail
  async createAuditTrail(auditId, action, description, metadata = {}) {
    try {
      const trailEntry = {
        id: this.generateId(),
        auditId,
        action,
        description,
        metadata,
        timestamp: new Date(),
        userId: metadata.userId || 'system'
      };

      if (!this.auditTrails.has(auditId)) {
        this.auditTrails.set(auditId, []);
      }

      this.auditTrails.get(auditId).push(trailEntry);

      // Also add to audit logs
      this.auditLogs.set(trailEntry.id, trailEntry);

      this.logger.debug('Audit trail entry created', { auditId, action, description });
      return trailEntry;
    } catch (error) {
      this.logger.error('Error creating audit trail:', error);
      throw error;
    }
  }

  // Get audit
  async getAudit(id) {
    const audit = this.audits.get(id);
    if (!audit) {
      throw new Error('Audit not found');
    }
    return audit;
  }

  // List audits
  async listAudits(filters = {}) {
    let audits = Array.from(this.audits.values());
    
    if (filters.type) {
      audits = audits.filter(a => a.type === filters.type);
    }
    
    if (filters.status) {
      audits = audits.filter(a => a.status === filters.status);
    }
    
    if (filters.priority) {
      audits = audits.filter(a => a.priority === filters.priority);
    }
    
    if (filters.assignedTo) {
      audits = audits.filter(a => a.assignedTo === filters.assignedTo);
    }
    
    return audits.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get audit trail
  async getAuditTrail(auditId) {
    const trail = this.auditTrails.get(auditId) || [];
    return trail.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get audit logs
  async getAuditLogs(filters = {}) {
    let logs = Array.from(this.auditLogs.values());
    
    if (filters.auditId) {
      logs = logs.filter(l => l.auditId === filters.auditId);
    }
    
    if (filters.action) {
      logs = logs.filter(l => l.action === filters.action);
    }
    
    if (filters.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }
    
    if (filters.startDate) {
      logs = logs.filter(l => l.timestamp >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      logs = logs.filter(l => l.timestamp <= new Date(filters.endDate));
    }
    
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get audit schedules
  async getAuditSchedules() {
    return Array.from(this.auditSchedules.values());
  }

  // Schedule audit
  async scheduleAudit(config) {
    try {
      const schedule = {
        id: this.generateId(),
        type: config.type,
        frequency: config.frequency,
        nextRun: new Date(config.nextRun),
        enabled: config.enabled !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.auditSchedules.set(schedule.id, schedule);
      
      this.logger.info('Audit scheduled', { id: schedule.id, type: schedule.type, nextRun: schedule.nextRun });
      return schedule;
    } catch (error) {
      this.logger.error('Error scheduling audit:', error);
      throw error;
    }
  }

  // Run scheduled audits
  async runScheduledAudits() {
    try {
      const now = new Date();
      const dueSchedules = Array.from(this.auditSchedules.values())
        .filter(s => s.enabled && new Date(s.nextRun) <= now);

      for (const schedule of dueSchedules) {
        try {
          await this.createAudit({
            type: schedule.type,
            startDate: now,
            endDate: moment(now).add(this.auditTypes[schedule.type]?.duration || 7, 'days').toDate()
          });

          // Update next run time
          schedule.nextRun = this.calculateNextRun(schedule.frequency);
          schedule.updatedAt = new Date();
          this.auditSchedules.set(schedule.id, schedule);

          this.logger.info('Scheduled audit created', { scheduleId: schedule.id, type: schedule.type });
        } catch (error) {
          this.logger.error('Error running scheduled audit:', { scheduleId: schedule.id, error: error.message });
        }
      }
    } catch (error) {
      this.logger.error('Error running scheduled audits:', error);
    }
  }

  // Calculate next run time
  calculateNextRun(frequency) {
    const now = moment();
    
    switch (frequency) {
      case 'daily':
        return now.add(1, 'day').toDate();
      case 'weekly':
        return now.add(1, 'week').toDate();
      case 'monthly':
        return now.add(1, 'month').toDate();
      case 'quarterly':
        return now.add(3, 'months').toDate();
      case 'semi-annually':
        return now.add(6, 'months').toDate();
      case 'annually':
        return now.add(1, 'year').toDate();
      default:
        return now.add(1, 'month').toDate();
    }
  }

  // Update metrics
  updateMetrics(audit) {
    this.metrics.totalAudits++;
    
    if (audit.status === 'completed') {
      this.metrics.completedAudits++;
    } else if (audit.status === 'failed') {
      this.metrics.failedAudits++;
    }

    // Update finding metrics
    audit.findings.forEach(finding => {
      switch (finding.severity) {
        case 'critical':
          this.metrics.criticalFindings++;
          break;
        case 'high':
          this.metrics.highFindings++;
          break;
        case 'medium':
          this.metrics.mediumFindings++;
          break;
        case 'low':
          this.metrics.lowFindings++;
          break;
      }
    });
  }

  // Get metrics
  async getMetrics() {
    return {
      ...this.metrics,
      completionRate: this.metrics.totalAudits > 0 ? 
        (this.metrics.completedAudits / this.metrics.totalAudits) * 100 : 0
    };
  }

  // Generate unique ID
  generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new AuditManager();
