const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class RiskAssessor {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/risk-assessor.log' })
      ]
    });
    
    this.risks = new Map();
    this.riskAssessments = new Map();
    this.riskCategories = new Map();
    this.riskMitigations = new Map();
    this.metrics = {
      totalRisks: 0,
      criticalRisks: 0,
      highRisks: 0,
      mediumRisks: 0,
      lowRisks: 0,
      mitigatedRisks: 0,
      activeRisks: 0
    };
  }

  // Initialize risk assessor
  async initialize() {
    try {
      this.initializeRiskCategories();
      this.initializeRiskTemplates();
      
      this.logger.info('Risk assessor initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing risk assessor:', error);
      throw error;
    }
  }

  // Initialize risk categories
  initializeRiskCategories() {
    this.riskCategories.set('security', {
      id: 'security',
      name: 'Security Risks',
      description: 'Risks related to information security and data protection',
      subcategories: ['data_breach', 'unauthorized_access', 'malware', 'phishing', 'insider_threat']
    });

    this.riskCategories.set('operational', {
      id: 'operational',
      name: 'Operational Risks',
      description: 'Risks related to business operations and processes',
      subcategories: ['system_failure', 'process_failure', 'key_personnel', 'vendor_failure', 'supply_chain']
    });

    this.riskCategories.set('compliance', {
      id: 'compliance',
      name: 'Compliance Risks',
      description: 'Risks related to regulatory compliance and legal requirements',
      subcategories: ['regulatory_violation', 'audit_failure', 'policy_violation', 'contract_breach', 'legal_action']
    });

    this.riskCategories.set('financial', {
      id: 'financial',
      name: 'Financial Risks',
      description: 'Risks related to financial impact and business continuity',
      subcategories: ['revenue_loss', 'cost_increase', 'budget_overrun', 'market_volatility', 'currency_risk']
    });

    this.riskCategories.set('reputational', {
      id: 'reputational',
      name: 'Reputational Risks',
      description: 'Risks related to brand reputation and stakeholder trust',
      subcategories: ['public_relations', 'customer_loss', 'partner_loss', 'media_coverage', 'social_media']
    });
  }

  // Initialize risk templates
  initializeRiskTemplates() {
    this.riskTemplates = {
      'data_breach': {
        name: 'Data Breach Risk',
        category: 'security',
        subcategory: 'data_breach',
        description: 'Risk of unauthorized access to sensitive data',
        impactFactors: ['data_sensitivity', 'data_volume', 'exposure_duration', 'affected_individuals'],
        likelihoodFactors: ['security_controls', 'threat_landscape', 'vulnerability_exposure', 'attack_surface'],
        mitigationStrategies: ['encryption', 'access_controls', 'monitoring', 'incident_response']
      },
      'system_failure': {
        name: 'System Failure Risk',
        category: 'operational',
        subcategory: 'system_failure',
        description: 'Risk of critical system failure affecting business operations',
        impactFactors: ['system_criticality', 'downtime_duration', 'affected_users', 'business_impact'],
        likelihoodFactors: ['system_age', 'maintenance_frequency', 'redundancy', 'monitoring'],
        mitigationStrategies: ['redundancy', 'backup_systems', 'monitoring', 'maintenance']
      },
      'regulatory_violation': {
        name: 'Regulatory Violation Risk',
        category: 'compliance',
        subcategory: 'regulatory_violation',
        description: 'Risk of violating regulatory requirements and facing penalties',
        impactFactors: ['penalty_amount', 'reputational_damage', 'business_restrictions', 'legal_costs'],
        likelihoodFactors: ['compliance_maturity', 'regulatory_changes', 'audit_frequency', 'training_level'],
        mitigationStrategies: ['compliance_program', 'training', 'monitoring', 'legal_review']
      }
    };
  }

  // Create risk
  async createRisk(config) {
    try {
      const risk = {
        id: this.generateId(),
        name: config.name,
        description: config.description || '',
        category: config.category,
        subcategory: config.subcategory || '',
        status: 'identified',
        priority: 'medium',
        impact: config.impact || 0,
        likelihood: config.likelihood || 0,
        riskScore: 0,
        owner: config.owner || null,
        stakeholders: config.stakeholders || [],
        tags: config.tags || [],
        identifiedAt: new Date(),
        lastAssessedAt: new Date(),
        nextAssessmentDate: moment().add(3, 'months').toDate(),
        mitigations: [],
        controls: [],
        incidents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Calculate initial risk score
      risk.riskScore = this.calculateRiskScore(risk.impact, risk.likelihood);
      risk.priority = this.determinePriority(risk.riskScore);

      this.risks.set(risk.id, risk);
      this.metrics.totalRisks++;
      this.updateRiskMetrics(risk);

      this.logger.info('Risk created successfully', { id: risk.id, name: risk.name, score: risk.riskScore });
      return risk;
    } catch (error) {
      this.logger.error('Error creating risk:', error);
      throw error;
    }
  }

  // Assess risk
  async assessRisk(riskId, assessment) {
    try {
      const risk = this.risks.get(riskId);
      if (!risk) {
        throw new Error('Risk not found');
      }

      const riskAssessment = {
        id: this.generateId(),
        riskId,
        assessor: assessment.assessor || 'system',
        assessedAt: new Date(),
        impact: assessment.impact,
        likelihood: assessment.likelihood,
        riskScore: this.calculateRiskScore(assessment.impact, assessment.likelihood),
        factors: assessment.factors || {},
        evidence: assessment.evidence || [],
        recommendations: assessment.recommendations || [],
        status: 'completed'
      };

      // Update risk with new assessment
      risk.impact = assessment.impact;
      risk.likelihood = assessment.likelihood;
      risk.riskScore = riskAssessment.riskScore;
      risk.priority = this.determinePriority(risk.riskScore);
      risk.lastAssessedAt = new Date();
      risk.nextAssessmentDate = moment().add(3, 'months').toDate();
      risk.updatedAt = new Date();

      this.risks.set(riskId, risk);
      this.riskAssessments.set(riskAssessment.id, riskAssessment);
      this.updateRiskMetrics(risk);

      this.logger.info('Risk assessment completed', { 
        riskId, 
        assessmentId: riskAssessment.id, 
        score: risk.riskScore 
      });

      return riskAssessment;
    } catch (error) {
      this.logger.error('Error assessing risk:', error);
      throw error;
    }
  }

  // Calculate risk score
  calculateRiskScore(impact, likelihood) {
    // Simple risk matrix calculation
    const impactWeight = 0.6;
    const likelihoodWeight = 0.4;
    
    return Math.round((impact * impactWeight + likelihood * likelihoodWeight) * 10) / 10;
  }

  // Determine priority
  determinePriority(riskScore) {
    if (riskScore >= 8) return 'critical';
    if (riskScore >= 6) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }

  // Add risk mitigation
  async addRiskMitigation(riskId, mitigation) {
    try {
      const risk = this.risks.get(riskId);
      if (!risk) {
        throw new Error('Risk not found');
      }

      const riskMitigation = {
        id: this.generateId(),
        riskId,
        name: mitigation.name,
        description: mitigation.description || '',
        type: mitigation.type || 'control',
        status: 'planned',
        owner: mitigation.owner || null,
        dueDate: mitigation.dueDate || null,
        cost: mitigation.cost || 0,
        effectiveness: mitigation.effectiveness || 0,
        implementationDate: null,
        completionDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      risk.mitigations.push(riskMitigation);
      risk.updatedAt = new Date();

      this.risks.set(riskId, risk);
      this.riskMitigations.set(riskMitigation.id, riskMitigation);

      this.logger.info('Risk mitigation added', { riskId, mitigationId: riskMitigation.id });
      return riskMitigation;
    } catch (error) {
      this.logger.error('Error adding risk mitigation:', error);
      throw error;
    }
  }

  // Update mitigation status
  async updateMitigationStatus(mitigationId, status, completionDate = null) {
    try {
      const mitigation = this.riskMitigations.get(mitigationId);
      if (!mitigation) {
        throw new Error('Mitigation not found');
      }

      mitigation.status = status;
      mitigation.updatedAt = new Date();

      if (status === 'implemented') {
        mitigation.implementationDate = new Date();
      }

      if (status === 'completed') {
        mitigation.completionDate = completionDate || new Date();
      }

      this.riskMitigations.set(mitigationId, mitigation);

      // Update risk status if all mitigations are completed
      const risk = this.risks.get(mitigation.riskId);
      if (risk) {
        const allMitigationsCompleted = risk.mitigations.every(m => 
          this.riskMitigations.get(m.id)?.status === 'completed'
        );

        if (allMitigationsCompleted) {
          risk.status = 'mitigated';
          risk.updatedAt = new Date();
          this.risks.set(mitigation.riskId, risk);
          this.metrics.mitigatedRisks++;
        }
      }

      this.logger.info('Mitigation status updated', { mitigationId, status });
      return mitigation;
    } catch (error) {
      this.logger.error('Error updating mitigation status:', error);
      throw error;
    }
  }

  // Add risk incident
  async addRiskIncident(riskId, incident) {
    try {
      const risk = this.risks.get(riskId);
      if (!risk) {
        throw new Error('Risk not found');
      }

      const riskIncident = {
        id: this.generateId(),
        riskId,
        title: incident.title,
        description: incident.description || '',
        severity: incident.severity || 'medium',
        occurredAt: incident.occurredAt || new Date(),
        detectedAt: incident.detectedAt || new Date(),
        resolvedAt: incident.resolvedAt || null,
        impact: incident.impact || 0,
        rootCause: incident.rootCause || '',
        lessonsLearned: incident.lessonsLearned || '',
        status: incident.status || 'open',
        assignedTo: incident.assignedTo || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      risk.incidents.push(riskIncident);
      risk.updatedAt = new Date();

      this.risks.set(riskId, risk);

      this.logger.info('Risk incident added', { riskId, incidentId: riskIncident.id });
      return riskIncident;
    } catch (error) {
      this.logger.error('Error adding risk incident:', error);
      throw error;
    }
  }

  // Get risk
  async getRisk(id) {
    const risk = this.risks.get(id);
    if (!risk) {
      throw new Error('Risk not found');
    }
    return risk;
  }

  // List risks
  async listRisks(filters = {}) {
    let risks = Array.from(this.risks.values());
    
    if (filters.category) {
      risks = risks.filter(r => r.category === filters.category);
    }
    
    if (filters.status) {
      risks = risks.filter(r => r.status === filters.status);
    }
    
    if (filters.priority) {
      risks = risks.filter(r => r.priority === filters.priority);
    }
    
    if (filters.owner) {
      risks = risks.filter(r => r.owner === filters.owner);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      risks = risks.filter(r => 
        filters.tags.some(tag => r.tags.includes(tag))
      );
    }
    
    return risks.sort((a, b) => b.riskScore - a.riskScore);
  }

  // Get risk assessments
  async getRiskAssessments(riskId = null) {
    let assessments = Array.from(this.riskAssessments.values());
    
    if (riskId) {
      assessments = assessments.filter(a => a.riskId === riskId);
    }
    
    return assessments.sort((a, b) => b.assessedAt - a.assessedAt);
  }

  // Get risk mitigations
  async getRiskMitigations(riskId = null) {
    let mitigations = Array.from(this.riskMitigations.values());
    
    if (riskId) {
      mitigations = mitigations.filter(m => m.riskId === riskId);
    }
    
    return mitigations.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get risk categories
  async getRiskCategories() {
    return Array.from(this.riskCategories.values());
  }

  // Get risk matrix
  async getRiskMatrix() {
    const risks = Array.from(this.risks.values());
    const matrix = {
      critical: risks.filter(r => r.priority === 'critical'),
      high: risks.filter(r => r.priority === 'high'),
      medium: risks.filter(r => r.priority === 'medium'),
      low: risks.filter(r => r.priority === 'low')
    };

    return matrix;
  }

  // Get risk trends
  async getRiskTrends(timeRange = '6months') {
    const endDate = new Date();
    const startDate = moment(endDate).subtract(this.parseTimeRange(timeRange)).toDate();
    
    const assessments = Array.from(this.riskAssessments.values())
      .filter(a => a.assessedAt >= startDate && a.assessedAt <= endDate)
      .sort((a, b) => a.assessedAt - b.assessedAt);

    const trends = {
      totalAssessments: assessments.length,
      averageRiskScore: assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length || 0,
      riskScoreTrend: this.calculateTrend(assessments.map(a => a.riskScore)),
      categoryBreakdown: this.getCategoryBreakdown(assessments),
      priorityDistribution: this.getPriorityDistribution(assessments)
    };

    return trends;
  }

  // Calculate trend
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  // Get category breakdown
  getCategoryBreakdown(assessments) {
    const breakdown = {};
    
    assessments.forEach(assessment => {
      const risk = this.risks.get(assessment.riskId);
      if (risk) {
        breakdown[risk.category] = (breakdown[risk.category] || 0) + 1;
      }
    });
    
    return breakdown;
  }

  // Get priority distribution
  getPriorityDistribution(assessments) {
    const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
    
    assessments.forEach(assessment => {
      const priority = this.determinePriority(assessment.riskScore);
      distribution[priority]++;
    });
    
    return distribution;
  }

  // Parse time range
  parseTimeRange(timeRange) {
    const match = timeRange.match(/^(\d+)([md])$/);
    if (!match) return { amount: 6, unit: 'months' };
    
    const amount = parseInt(match[1]);
    const unit = match[2] === 'm' ? 'months' : 'days';
    
    return { amount, unit };
  }

  // Update risk metrics
  updateRiskMetrics(risk) {
    // Reset metrics
    this.metrics = {
      totalRisks: 0,
      criticalRisks: 0,
      highRisks: 0,
      mediumRisks: 0,
      lowRisks: 0,
      mitigatedRisks: 0,
      activeRisks: 0
    };

    // Recalculate metrics
    const risks = Array.from(this.risks.values());
    this.metrics.totalRisks = risks.length;
    this.metrics.criticalRisks = risks.filter(r => r.priority === 'critical').length;
    this.metrics.highRisks = risks.filter(r => r.priority === 'high').length;
    this.metrics.mediumRisks = risks.filter(r => r.priority === 'medium').length;
    this.metrics.lowRisks = risks.filter(r => r.priority === 'low').length;
    this.metrics.mitigatedRisks = risks.filter(r => r.status === 'mitigated').length;
    this.metrics.activeRisks = risks.filter(r => r.status === 'active').length;
  }

  // Get metrics
  async getMetrics() {
    this.updateRiskMetrics();
    return this.metrics;
  }

  // Generate unique ID
  generateId() {
    return `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new RiskAssessor();
