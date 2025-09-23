const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class PolicyManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/policy-manager.log' })
      ]
    });
    
    this.policies = new Map();
    this.policyVersions = new Map();
    this.policyApprovals = new Map();
    this.policyReviews = new Map();
    this.metrics = {
      totalPolicies: 0,
      activePolicies: 0,
      expiredPolicies: 0,
      pendingApprovals: 0,
      overdueReviews: 0
    };
  }

  // Initialize policy manager
  async initialize() {
    try {
      this.initializePolicyTemplates();
      this.initializeDefaultPolicies();
      
      this.logger.info('Policy manager initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing policy manager:', error);
      throw error;
    }
  }

  // Initialize policy templates
  initializePolicyTemplates() {
    this.policyTemplates = {
      'data_protection': {
        name: 'Data Protection Policy',
        category: 'privacy',
        description: 'Policy for protecting personal and sensitive data',
        sections: [
          'data_classification',
          'data_handling',
          'data_retention',
          'data_disposal',
          'data_breach_response',
          'data_subject_rights'
        ],
        requirements: ['gdpr', 'ccpa', 'pipeda']
      },
      'information_security': {
        name: 'Information Security Policy',
        category: 'security',
        description: 'Policy for protecting information assets',
        sections: [
          'access_control',
          'encryption',
          'network_security',
          'incident_response',
          'security_monitoring',
          'security_training'
        ],
        requirements: ['iso27001', 'nist', 'soc2']
      },
      'acceptable_use': {
        name: 'Acceptable Use Policy',
        category: 'governance',
        description: 'Policy for acceptable use of IT resources',
        sections: [
          'authorized_use',
          'prohibited_activities',
          'monitoring',
          'enforcement',
          'violations',
          'reporting'
        ],
        requirements: ['sox', 'pci_dss']
      },
      'incident_response': {
        name: 'Incident Response Policy',
        category: 'security',
        description: 'Policy for responding to security incidents',
        sections: [
          'incident_classification',
          'response_procedures',
          'communication',
          'documentation',
          'recovery',
          'lessons_learned'
        ],
        requirements: ['iso27001', 'nist', 'soc2']
      },
      'business_continuity': {
        name: 'Business Continuity Policy',
        category: 'operational',
        description: 'Policy for maintaining business operations during disruptions',
        sections: [
          'continuity_planning',
          'disaster_recovery',
          'backup_procedures',
          'communication_plan',
          'testing',
          'maintenance'
        ],
        requirements: ['iso27001', 'soc2']
      }
    };
  }

  // Initialize default policies
  initializeDefaultPolicies() {
    // This would typically load from a database
    const defaultPolicies = [
      {
        id: 'data_protection_v1',
        name: 'Data Protection Policy',
        category: 'privacy',
        version: '1.0',
        status: 'active',
        effectiveDate: moment().subtract(6, 'months').toDate(),
        reviewDate: moment().add(6, 'months').toDate(),
        approvedBy: 'compliance@company.com',
        approvedAt: moment().subtract(6, 'months').toDate()
      },
      {
        id: 'information_security_v1',
        name: 'Information Security Policy',
        category: 'security',
        version: '1.0',
        status: 'active',
        effectiveDate: moment().subtract(3, 'months').toDate(),
        reviewDate: moment().add(9, 'months').toDate(),
        approvedBy: 'security@company.com',
        approvedAt: moment().subtract(3, 'months').toDate()
      }
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  // Create policy
  async createPolicy(config) {
    try {
      const policy = {
        id: this.generateId(),
        name: config.name,
        category: config.category,
        description: config.description || '',
        version: config.version || '1.0',
        status: 'draft',
        content: config.content || '',
        templateId: config.templateId || null,
        effectiveDate: config.effectiveDate || null,
        reviewDate: config.reviewDate || moment().add(1, 'year').toDate(),
        approvedBy: null,
        approvedAt: null,
        createdBy: config.createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: config.tags || [],
        requirements: config.requirements || [],
        stakeholders: config.stakeholders || []
      };

      this.policies.set(policy.id, policy);
      this.metrics.totalPolicies++;

      this.logger.info('Policy created successfully', { id: policy.id, name: policy.name });
      return policy;
    } catch (error) {
      this.logger.error('Error creating policy:', error);
      throw error;
    }
  }

  // Update policy
  async updatePolicy(id, updates) {
    try {
      const policy = this.policies.get(id);
      if (!policy) {
        throw new Error('Policy not found');
      }

      // Create new version if content is being updated
      if (updates.content && updates.content !== policy.content) {
        const newVersion = await this.createPolicyVersion(id, updates);
        updates.version = newVersion.version;
      }

      Object.assign(policy, updates);
      policy.updatedAt = new Date();

      this.policies.set(id, policy);

      this.logger.info('Policy updated successfully', { id, name: policy.name });
      return policy;
    } catch (error) {
      this.logger.error('Error updating policy:', error);
      throw error;
    }
  }

  // Create policy version
  async createPolicyVersion(policyId, updates) {
    try {
      const policy = this.policies.get(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      const versionNumber = this.getNextVersionNumber(policyId);
      const version = {
        id: this.generateId(),
        policyId,
        version: versionNumber,
        content: updates.content || policy.content,
        changes: updates.changes || [],
        createdBy: updates.createdBy || 'system',
        createdAt: new Date(),
        status: 'draft'
      };

      this.policyVersions.set(version.id, version);

      this.logger.info('Policy version created', { policyId, version: versionNumber });
      return version;
    } catch (error) {
      this.logger.error('Error creating policy version:', error);
      throw error;
    }
  }

  // Get next version number
  getNextVersionNumber(policyId) {
    const versions = Array.from(this.policyVersions.values())
      .filter(v => v.policyId === policyId)
      .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

    if (versions.length === 0) return '1.0';

    const lastVersion = versions[0].version;
    const parts = lastVersion.split('.');
    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1]) + 1;

    return `${major}.${minor}`;
  }

  // Submit policy for approval
  async submitForApproval(policyId, approvers) {
    try {
      const policy = this.policies.get(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      const approval = {
        id: this.generateId(),
        policyId,
        approvers: approvers || [],
        status: 'pending',
        submittedBy: 'system',
        submittedAt: new Date(),
        dueDate: moment().add(7, 'days').toDate(),
        approvals: [],
        rejections: []
      };

      this.policyApprovals.set(approval.id, approval);
      policy.status = 'pending_approval';
      policy.updatedAt = new Date();

      this.policies.set(policyId, policy);
      this.metrics.pendingApprovals++;

      this.logger.info('Policy submitted for approval', { policyId, approvalId: approval.id });
      return approval;
    } catch (error) {
      this.logger.error('Error submitting policy for approval:', error);
      throw error;
    }
  }

  // Approve policy
  async approvePolicy(approvalId, approver, comments = '') {
    try {
      const approval = this.policyApprovals.get(approvalId);
      if (!approval) {
        throw new Error('Approval not found');
      }

      const approvalEntry = {
        approver,
        comments,
        approvedAt: new Date()
      };

      approval.approvals.push(approvalEntry);
      approval.updatedAt = new Date();

      // Check if all approvers have approved
      if (approval.approvals.length >= approval.approvers.length) {
        approval.status = 'approved';
        
        // Update policy status
        const policy = this.policies.get(approval.policyId);
        if (policy) {
          policy.status = 'active';
          policy.approvedBy = approver;
          policy.approvedAt = new Date();
          policy.updatedAt = new Date();
          this.policies.set(approval.policyId, policy);
        }

        this.metrics.pendingApprovals--;
        this.metrics.activePolicies++;
      }

      this.policyApprovals.set(approvalId, approval);

      this.logger.info('Policy approval recorded', { approvalId, approver });
      return approval;
    } catch (error) {
      this.logger.error('Error approving policy:', error);
      throw error;
    }
  }

  // Reject policy
  async rejectPolicy(approvalId, approver, reason) {
    try {
      const approval = this.policyApprovals.get(approvalId);
      if (!approval) {
        throw new Error('Approval not found');
      }

      const rejection = {
        approver,
        reason,
        rejectedAt: new Date()
      };

      approval.rejections.push(rejection);
      approval.status = 'rejected';
      approval.updatedAt = new Date();

      // Update policy status
      const policy = this.policies.get(approval.policyId);
      if (policy) {
        policy.status = 'rejected';
        policy.updatedAt = new Date();
        this.policies.set(approval.policyId, policy);
      }

      this.policyApprovals.set(approvalId, approval);
      this.metrics.pendingApprovals--;

      this.logger.info('Policy rejected', { approvalId, approver, reason });
      return approval;
    } catch (error) {
      this.logger.error('Error rejecting policy:', error);
      throw error;
    }
  }

  // Schedule policy review
  async schedulePolicyReview(policyId, reviewDate, reviewers) {
    try {
      const policy = this.policies.get(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      const review = {
        id: this.generateId(),
        policyId,
        reviewDate: new Date(reviewDate),
        reviewers: reviewers || [],
        status: 'scheduled',
        scheduledBy: 'system',
        scheduledAt: new Date(),
        completedAt: null,
        findings: [],
        recommendations: []
      };

      this.policyReviews.set(review.id, review);
      policy.reviewDate = new Date(reviewDate);
      policy.updatedAt = new Date();

      this.policies.set(policyId, policy);

      this.logger.info('Policy review scheduled', { policyId, reviewId: review.id, reviewDate });
      return review;
    } catch (error) {
      this.logger.error('Error scheduling policy review:', error);
      throw error;
    }
  }

  // Complete policy review
  async completePolicyReview(reviewId, findings, recommendations) {
    try {
      const review = this.policyReviews.get(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      review.status = 'completed';
      review.completedAt = new Date();
      review.findings = findings || [];
      review.recommendations = recommendations || [];

      this.policyReviews.set(reviewId, review);

      this.logger.info('Policy review completed', { reviewId, findings: findings.length });
      return review;
    } catch (error) {
      this.logger.error('Error completing policy review:', error);
      throw error;
    }
  }

  // Get policy
  async getPolicy(id) {
    const policy = this.policies.get(id);
    if (!policy) {
      throw new Error('Policy not found');
    }
    return policy;
  }

  // List policies
  async listPolicies(filters = {}) {
    let policies = Array.from(this.policies.values());
    
    if (filters.category) {
      policies = policies.filter(p => p.category === filters.category);
    }
    
    if (filters.status) {
      policies = policies.filter(p => p.status === filters.status);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      policies = policies.filter(p => 
        filters.tags.some(tag => p.tags.includes(tag))
      );
    }
    
    if (filters.requirements && filters.requirements.length > 0) {
      policies = policies.filter(p => 
        filters.requirements.some(req => p.requirements.includes(req))
      );
    }
    
    return policies.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Get policy versions
  async getPolicyVersions(policyId) {
    const versions = Array.from(this.policyVersions.values())
      .filter(v => v.policyId === policyId)
      .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    
    return versions;
  }

  // Get policy approvals
  async getPolicyApprovals(filters = {}) {
    let approvals = Array.from(this.policyApprovals.values());
    
    if (filters.status) {
      approvals = approvals.filter(a => a.status === filters.status);
    }
    
    if (filters.policyId) {
      approvals = approvals.filter(a => a.policyId === filters.policyId);
    }
    
    return approvals.sort((a, b) => b.submittedAt - a.submittedAt);
  }

  // Get policy reviews
  async getPolicyReviews(filters = {}) {
    let reviews = Array.from(this.policyReviews.values());
    
    if (filters.status) {
      reviews = reviews.filter(r => r.status === filters.status);
    }
    
    if (filters.policyId) {
      reviews = reviews.filter(r => r.policyId === filters.policyId);
    }
    
    return reviews.sort((a, b) => b.scheduledAt - a.scheduledAt);
  }

  // Get overdue reviews
  async getOverdueReviews() {
    const now = new Date();
    const overdueReviews = Array.from(this.policyReviews.values())
      .filter(r => r.status === 'scheduled' && new Date(r.reviewDate) < now);
    
    return overdueReviews;
  }

  // Get expiring policies
  async getExpiringPolicies(days = 30) {
    const cutoffDate = moment().add(days, 'days').toDate();
    const expiringPolicies = Array.from(this.policies.values())
      .filter(p => p.status === 'active' && new Date(p.reviewDate) <= cutoffDate);
    
    return expiringPolicies;
  }

  // Update metrics
  updateMetrics() {
    const policies = Array.from(this.policies.values());
    
    this.metrics.totalPolicies = policies.length;
    this.metrics.activePolicies = policies.filter(p => p.status === 'active').length;
    this.metrics.expiredPolicies = policies.filter(p => p.status === 'expired').length;
    this.metrics.pendingApprovals = Array.from(this.policyApprovals.values())
      .filter(a => a.status === 'pending').length;
    this.metrics.overdueReviews = Array.from(this.policyReviews.values())
      .filter(r => r.status === 'scheduled' && new Date(r.reviewDate) < new Date()).length;
  }

  // Get metrics
  async getMetrics() {
    this.updateMetrics();
    return this.metrics;
  }

  // Generate unique ID
  generateId() {
    return `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new PolicyManager();
