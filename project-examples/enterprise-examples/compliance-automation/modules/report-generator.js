const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/report-generator.log' })
      ]
    });
    
    this.reports = new Map();
    this.templates = new Map();
    this.schedules = new Map();
    this.metrics = {
      reportsGenerated: 0,
      reportsScheduled: 0,
      reportsFailed: 0,
      totalReportSize: 0
    };
  }

  // Initialize report generator
  async initialize() {
    try {
      this.initializeTemplates();
      this.initializeSchedules();
      
      this.logger.info('Report generator initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing report generator:', error);
      throw error;
    }
  }

  // Initialize report templates
  initializeTemplates() {
    // Compliance Report Template
    this.templates.set('compliance_report', {
      id: 'compliance_report',
      name: 'Compliance Report',
      description: 'Comprehensive compliance assessment report',
      type: 'compliance',
      format: 'pdf',
      sections: [
        'executive_summary',
        'compliance_overview',
        'framework_assessments',
        'violations_summary',
        'recommendations',
        'evidence_attachments',
        'appendix'
      ],
      template: this.getComplianceReportTemplate()
    });

    // Audit Report Template
    this.templates.set('audit_report', {
      id: 'audit_report',
      name: 'Audit Report',
      description: 'Detailed audit findings and recommendations report',
      type: 'audit',
      format: 'pdf',
      sections: [
        'audit_summary',
        'scope_and_objectives',
        'methodology',
        'findings',
        'recommendations',
        'evidence',
        'conclusion'
      ],
      template: this.getAuditReportTemplate()
    });

    // Risk Assessment Report Template
    this.templates.set('risk_assessment_report', {
      id: 'risk_assessment_report',
      name: 'Risk Assessment Report',
      description: 'Risk assessment and mitigation strategies report',
      type: 'risk',
      format: 'pdf',
      sections: [
        'risk_summary',
        'risk_analysis',
        'threat_landscape',
        'vulnerability_assessment',
        'impact_analysis',
        'mitigation_strategies',
        'residual_risks'
      ],
      template: this.getRiskAssessmentReportTemplate()
    });

    // Executive Dashboard Template
    this.templates.set('executive_dashboard', {
      id: 'executive_dashboard',
      name: 'Executive Dashboard',
      description: 'High-level compliance and security dashboard',
      type: 'dashboard',
      format: 'html',
      sections: [
        'kpi_overview',
        'compliance_status',
        'risk_metrics',
        'audit_summary',
        'trend_analysis',
        'action_items'
      ],
      template: this.getExecutiveDashboardTemplate()
    });
  }

  // Initialize report schedules
  initializeSchedules() {
    this.schedules.set('monthly_compliance', {
      id: 'monthly_compliance',
      templateId: 'compliance_report',
      frequency: 'monthly',
      nextRun: moment().add(1, 'month').toDate(),
      enabled: true,
      recipients: ['compliance@company.com', 'security@company.com']
    });

    this.schedules.set('quarterly_audit', {
      id: 'quarterly_audit',
      templateId: 'audit_report',
      frequency: 'quarterly',
      nextRun: moment().add(3, 'months').toDate(),
      enabled: true,
      recipients: ['audit@company.com', 'management@company.com']
    });
  }

  // Generate report
  async generateReport(config) {
    try {
      const report = {
        id: this.generateId(),
        templateId: config.templateId,
        name: config.name || this.templates.get(config.templateId)?.name,
        description: config.description || this.templates.get(config.templateId)?.description,
        type: config.type || this.templates.get(config.templateId)?.type,
        format: config.format || this.templates.get(config.templateId)?.format,
        data: config.data || {},
        status: 'generating',
        progress: 0,
        filePath: null,
        fileSize: 0,
        generatedAt: new Date(),
        generatedBy: config.generatedBy || 'system',
        recipients: config.recipients || [],
        error: null
      };

      this.reports.set(report.id, report);

      try {
        // Generate report content
        const content = await this.generateReportContent(report);
        
        // Save report to file
        const filePath = await this.saveReportToFile(report, content);
        
        report.filePath = filePath;
        report.fileSize = fs.statSync(filePath).size;
        report.status = 'completed';
        report.progress = 100;

        this.metrics.reportsGenerated++;
        this.metrics.totalReportSize += report.fileSize;

        this.logger.info('Report generated successfully', { 
          id: report.id, 
          template: report.templateId,
          fileSize: report.fileSize 
        });

        return report;
      } catch (error) {
        report.status = 'failed';
        report.error = error.message;
        this.metrics.reportsFailed++;
        
        this.logger.error('Error generating report:', { id: report.id, error: error.message });
        throw error;
      }
    } catch (error) {
      this.logger.error('Error generating report:', error);
      throw error;
    }
  }

  // Generate report content
  async generateReportContent(report) {
    const template = this.templates.get(report.templateId);
    if (!template) {
      throw new Error(`Template not found: ${report.templateId}`);
    }

    let content = template.template;

    // Replace placeholders with actual data
    content = this.replacePlaceholders(content, report.data);

    // Process sections
    for (const section of template.sections) {
      content = await this.processSection(content, section, report.data);
    }

    return content;
  }

  // Replace placeholders
  replacePlaceholders(content, data) {
    const placeholders = {
      '{{report_date}}': moment().format('YYYY-MM-DD'),
      '{{report_time}}': moment().format('HH:mm:ss'),
      '{{company_name}}': data.companyName || 'Universal Automation Platform',
      '{{report_title}}': data.title || 'Compliance Report',
      '{{report_period}}': data.period || moment().format('MMMM YYYY'),
      '{{generated_by}}': data.generatedBy || 'System',
      '{{total_assessments}}': data.totalAssessments || 0,
      '{{passed_assessments}}': data.passedAssessments || 0,
      '{{failed_assessments}}': data.failedAssessments || 0,
      '{{compliance_score}}': data.complianceScore || 0,
      '{{total_violations}}': data.totalViolations || 0,
      '{{critical_violations}}': data.criticalViolations || 0,
      '{{high_violations}}': data.highViolations || 0,
      '{{medium_violations}}': data.mediumViolations || 0,
      '{{low_violations}}': data.lowViolations || 0
    };

    for (const [placeholder, value] of Object.entries(placeholders)) {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    }

    return content;
  }

  // Process section
  async processSection(content, section, data) {
    const sectionRegex = new RegExp(`<${section}>(.*?)</${section}>`, 'gs');
    
    return content.replace(sectionRegex, (match, sectionContent) => {
      switch (section) {
        case 'executive_summary':
          return this.generateExecutiveSummary(data);
        case 'compliance_overview':
          return this.generateComplianceOverview(data);
        case 'framework_assessments':
          return this.generateFrameworkAssessments(data);
        case 'violations_summary':
          return this.generateViolationsSummary(data);
        case 'recommendations':
          return this.generateRecommendations(data);
        case 'evidence_attachments':
          return this.generateEvidenceAttachments(data);
        case 'audit_summary':
          return this.generateAuditSummary(data);
        case 'findings':
          return this.generateFindings(data);
        case 'risk_summary':
          return this.generateRiskSummary(data);
        case 'kpi_overview':
          return this.generateKPIOverview(data);
        default:
          return sectionContent;
      }
    });
  }

  // Generate executive summary
  generateExecutiveSummary(data) {
    const complianceScore = data.complianceScore || 0;
    const totalViolations = data.totalViolations || 0;
    const criticalViolations = data.criticalViolations || 0;

    return `
      <div class="executive-summary">
        <h2>Executive Summary</h2>
        <p>This report provides a comprehensive overview of the organization's compliance status as of {{report_date}}.</p>
        
        <div class="summary-metrics">
          <div class="metric">
            <h3>Overall Compliance Score</h3>
            <div class="score ${complianceScore >= 80 ? 'good' : complianceScore >= 60 ? 'fair' : 'poor'}">
              ${complianceScore}%
            </div>
          </div>
          
          <div class="metric">
            <h3>Total Violations</h3>
            <div class="count">${totalViolations}</div>
          </div>
          
          <div class="metric">
            <h3>Critical Issues</h3>
            <div class="count critical">${criticalViolations}</div>
          </div>
        </div>
        
        <div class="key-findings">
          <h3>Key Findings</h3>
          <ul>
            <li>Compliance score: ${complianceScore}% (${complianceScore >= 80 ? 'Good' : complianceScore >= 60 ? 'Fair' : 'Needs Improvement'})</li>
            <li>Total violations identified: ${totalViolations}</li>
            <li>Critical violations requiring immediate attention: ${criticalViolations}</li>
            <li>Assessment period: {{report_period}}</li>
          </ul>
        </div>
      </div>
    `;
  }

  // Generate compliance overview
  generateComplianceOverview(data) {
    const frameworks = data.frameworks || [];
    const assessments = data.assessments || [];

    return `
      <div class="compliance-overview">
        <h2>Compliance Overview</h2>
        
        <div class="frameworks">
          <h3>Compliance Frameworks</h3>
          <table>
            <thead>
              <tr>
                <th>Framework</th>
                <th>Status</th>
                <th>Score</th>
                <th>Last Assessment</th>
              </tr>
            </thead>
            <tbody>
              ${frameworks.map(framework => `
                <tr>
                  <td>${framework.name}</td>
                  <td class="status ${framework.status}">${framework.status}</td>
                  <td>${framework.score}%</td>
                  <td>${framework.lastAssessment || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="assessments">
          <h3>Recent Assessments</h3>
          <ul>
            ${assessments.map(assessment => `
              <li>
                <strong>${assessment.frameworkName}</strong> - 
                ${assessment.score}% (${assessment.passed ? 'Passed' : 'Failed'}) - 
                ${moment(assessment.startTime).format('YYYY-MM-DD')}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  // Generate framework assessments
  generateFrameworkAssessments(data) {
    const assessments = data.assessments || [];

    return `
      <div class="framework-assessments">
        <h2>Framework Assessments</h2>
        
        ${assessments.map(assessment => `
          <div class="assessment">
            <h3>${assessment.frameworkName}</h3>
            <div class="assessment-details">
              <p><strong>Score:</strong> ${assessment.score}%</p>
              <p><strong>Status:</strong> ${assessment.passed ? 'Passed' : 'Failed'}</p>
              <p><strong>Assessment Date:</strong> ${moment(assessment.startTime).format('YYYY-MM-DD')}</p>
              <p><strong>Duration:</strong> ${moment(assessment.endTime).diff(moment(assessment.startTime), 'days')} days</p>
            </div>
            
            <div class="violations">
              <h4>Violations (${assessment.violations.length})</h4>
              ${assessment.violations.length > 0 ? `
                <ul>
                  ${assessment.violations.map(violation => `
                    <li class="violation ${violation.level}">
                      <strong>${violation.controlName}</strong> - ${violation.description}
                    </li>
                  `).join('')}
                </ul>
              ` : '<p>No violations found.</p>'}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Generate violations summary
  generateViolationsSummary(data) {
    const violations = data.violations || [];
    const byLevel = _.groupBy(violations, 'level');

    return `
      <div class="violations-summary">
        <h2>Violations Summary</h2>
        
        <div class="violation-stats">
          <div class="stat critical">
            <h3>Critical</h3>
            <div class="count">${byLevel.critical?.length || 0}</div>
          </div>
          <div class="stat high">
            <h3>High</h3>
            <div class="count">${byLevel.high?.length || 0}</div>
          </div>
          <div class="stat medium">
            <h3>Medium</h3>
            <div class="count">${byLevel.medium?.length || 0}</div>
          </div>
          <div class="stat low">
            <h3>Low</h3>
            <div class="count">${byLevel.low?.length || 0}</div>
          </div>
        </div>
        
        <div class="violations-list">
          <h3>All Violations</h3>
          <table>
            <thead>
              <tr>
                <th>Control</th>
                <th>Framework</th>
                <th>Level</th>
                <th>Description</th>
                <th>Detected</th>
              </tr>
            </thead>
            <tbody>
              ${violations.map(violation => `
                <tr class="${violation.level}">
                  <td>${violation.controlName}</td>
                  <td>${violation.frameworkId}</td>
                  <td class="level ${violation.level}">${violation.level}</td>
                  <td>${violation.description}</td>
                  <td>${moment(violation.detectedAt).format('YYYY-MM-DD')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Generate recommendations
  generateRecommendations(data) {
    const recommendations = data.recommendations || [];

    return `
      <div class="recommendations">
        <h2>Recommendations</h2>
        
        <div class="recommendations-list">
          ${recommendations.map((rec, index) => `
            <div class="recommendation">
              <h3>${index + 1}. ${rec.title}</h3>
              <p><strong>Priority:</strong> ${rec.priority}</p>
              <p><strong>Category:</strong> ${rec.category}</p>
              <p><strong>Description:</strong> ${rec.description}</p>
              <p><strong>Action Required:</strong> ${rec.action}</p>
              <p><strong>Estimated Effort:</strong> ${rec.estimatedEffort}</p>
              <p><strong>Due Date:</strong> ${rec.dueDate || 'TBD'}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Generate other sections (simplified)
  generateEvidenceAttachments(data) {
    return '<div class="evidence-attachments"><h2>Evidence Attachments</h2><p>Evidence files and documentation are available in the supporting materials.</p></div>';
  }

  generateAuditSummary(data) {
    return '<div class="audit-summary"><h2>Audit Summary</h2><p>Audit details and findings are included in the main report sections.</p></div>';
  }

  generateFindings(data) {
    return '<div class="findings"><h2>Findings</h2><p>Detailed findings are documented in the violations summary section.</p></div>';
  }

  generateRiskSummary(data) {
    return '<div class="risk-summary"><h2>Risk Summary</h2><p>Risk assessment details are available in the risk management section.</p></div>';
  }

  generateKPIOverview(data) {
    return '<div class="kpi-overview"><h2>KPI Overview</h2><p>Key performance indicators are displayed in the executive summary.</p></div>';
  }

  // Save report to file
  async saveReportToFile(report, content) {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const fileName = `${report.name.replace(/\s+/g, '_')}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.${report.format}`;
      const filePath = path.join(reportsDir, fileName);

      fs.writeFileSync(filePath, content);

      return filePath;
    } catch (error) {
      this.logger.error('Error saving report to file:', error);
      throw error;
    }
  }

  // Get report templates
  getComplianceReportTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>{{report_title}} - {{company_name}}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .metric { display: inline-block; margin: 10px; text-align: center; }
          .score { font-size: 2em; font-weight: bold; }
          .good { color: green; }
          .fair { color: orange; }
          .poor { color: red; }
          .critical { color: red; }
          .high { color: orange; }
          .medium { color: yellow; }
          .low { color: blue; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>{{report_title}}</h1>
          <p>{{company_name}} - {{report_date}}</p>
        </div>
        
        <executive_summary></executive_summary>
        <compliance_overview></compliance_overview>
        <framework_assessments></framework_assessments>
        <violations_summary></violations_summary>
        <recommendations></recommendations>
        <evidence_attachments></evidence_attachments>
      </body>
      </html>
    `;
  }

  getAuditReportTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Audit Report - {{company_name}}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Audit Report</h1>
          <p>{{company_name}} - {{report_date}}</p>
        </div>
        
        <audit_summary></audit_summary>
        <findings></findings>
        <recommendations></recommendations>
      </body>
      </html>
    `;
  }

  getRiskAssessmentReportTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Risk Assessment Report - {{company_name}}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Risk Assessment Report</h1>
          <p>{{company_name}} - {{report_date}}</p>
        </div>
        
        <risk_summary></risk_summary>
        <recommendations></recommendations>
      </body>
      </html>
    `;
  }

  getExecutiveDashboardTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Executive Dashboard - {{company_name}}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
          .widget { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Executive Dashboard</h1>
          <p>{{company_name}} - {{report_date}}</p>
        </div>
        
        <div class="dashboard">
          <kpi_overview></kpi_overview>
          <compliance_overview></compliance_overview>
          <risk_summary></risk_summary>
        </div>
      </body>
      </html>
    `;
  }

  // Get report
  async getReport(id) {
    const report = this.reports.get(id);
    if (!report) {
      throw new Error('Report not found');
    }
    return report;
  }

  // List reports
  async listReports(filters = {}) {
    let reports = Array.from(this.reports.values());
    
    if (filters.type) {
      reports = reports.filter(r => r.type === filters.type);
    }
    
    if (filters.status) {
      reports = reports.filter(r => r.status === filters.status);
    }
    
    if (filters.templateId) {
      reports = reports.filter(r => r.templateId === filters.templateId);
    }
    
    return reports.sort((a, b) => b.generatedAt - a.generatedAt);
  }

  // Schedule report
  async scheduleReport(config) {
    try {
      const schedule = {
        id: this.generateId(),
        templateId: config.templateId,
        frequency: config.frequency,
        nextRun: new Date(config.nextRun),
        enabled: config.enabled !== false,
        recipients: config.recipients || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.schedules.set(schedule.id, schedule);
      this.metrics.reportsScheduled++;
      
      this.logger.info('Report scheduled', { id: schedule.id, template: schedule.templateId });
      return schedule;
    } catch (error) {
      this.logger.error('Error scheduling report:', error);
      throw error;
    }
  }

  // Run scheduled reports
  async runScheduledReports() {
    try {
      const now = new Date();
      const dueSchedules = Array.from(this.schedules.values())
        .filter(s => s.enabled && new Date(s.nextRun) <= now);

      for (const schedule of dueSchedules) {
        try {
          await this.generateReport({
            templateId: schedule.templateId,
            recipients: schedule.recipients
          });

          // Update next run time
          schedule.nextRun = this.calculateNextRun(schedule.frequency);
          schedule.updatedAt = new Date();
          this.schedules.set(schedule.id, schedule);

          this.logger.info('Scheduled report generated', { scheduleId: schedule.id });
        } catch (error) {
          this.logger.error('Error running scheduled report:', { scheduleId: schedule.id, error: error.message });
        }
      }
    } catch (error) {
      this.logger.error('Error running scheduled reports:', error);
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
      case 'annually':
        return now.add(1, 'year').toDate();
      default:
        return now.add(1, 'month').toDate();
    }
  }

  // Get metrics
  async getMetrics() {
    return {
      ...this.metrics,
      averageReportSize: this.metrics.reportsGenerated > 0 ? 
        this.metrics.totalReportSize / this.metrics.reportsGenerated : 0
    };
  }

  // Generate unique ID
  generateId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new ReportGenerator();
