const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/audit.log' })
  ]
});

class AuditLogger {
  constructor() {
    this.auditLogs = new Map(); // In-memory storage
    this.retentionPeriod = 365; // days
  }

  /**
   * Log audit event
   * @param {Object} event - Audit event data
   */
  async logEvent(event) {
    try {
      const auditId = uuidv4();
      const auditEvent = {
        id: auditId,
        timestamp: new Date().toISOString(),
        tenantId: event.tenantId,
        userId: event.userId,
        action: event.action,
        resource: event.resource || null,
        resourceId: event.resourceId || null,
        details: event.details || {},
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        sessionId: event.sessionId || null,
        severity: event.severity || 'info',
        category: event.category || 'general',
        outcome: event.outcome || 'success',
        riskLevel: this.calculateRiskLevel(event)
      };

      // Store in memory
      if (!this.auditLogs.has(event.tenantId)) {
        this.auditLogs.set(event.tenantId, []);
      }
      this.auditLogs.get(event.tenantId).push(auditEvent);

      // Log to file
      logger.info('Audit event logged', auditEvent);

      // Clean up old logs
      await this.cleanupOldLogs(event.tenantId);

      return auditEvent;
    } catch (error) {
      logger.error('Error logging audit event:', error);
      throw error;
    }
  }

  /**
   * Calculate risk level for event
   * @param {Object} event - Event data
   * @returns {string} Risk level
   */
  calculateRiskLevel(event) {
    const highRiskActions = [
      'user_deleted',
      'organization_deleted',
      'tenant_deleted',
      'password_changed',
      'permissions_changed',
      'billing_updated',
      'security_policy_changed'
    ];

    const mediumRiskActions = [
      'user_created',
      'user_updated',
      'organization_created',
      'organization_updated',
      'tenant_created',
      'tenant_updated',
      'subscription_created',
      'subscription_updated'
    ];

    if (highRiskActions.includes(event.action)) {
      return 'high';
    } else if (mediumRiskActions.includes(event.action)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get audit logs for tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   * @returns {Array} Audit logs
   */
  async getAuditLogs(tenantId, filters = {}) {
    try {
      let logs = this.auditLogs.get(tenantId) || [];

      // Apply filters
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.category) {
        logs = logs.filter(log => log.category === filters.category);
      }
      if (filters.severity) {
        logs = logs.filter(log => log.severity === filters.severity);
      }
      if (filters.riskLevel) {
        logs = logs.filter(log => log.riskLevel === filters.riskLevel);
      }
      if (filters.fromDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.fromDate));
      }
      if (filters.toDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.toDate));
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        logs: logs.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: logs.length,
          pages: Math.ceil(logs.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      return { logs: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
    }
  }

  /**
   * Get audit statistics for tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Options
   * @returns {Object} Audit statistics
   */
  async getAuditStats(tenantId, options = {}) {
    try {
      const fromDate = options.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = options.toDate || new Date();

      const logs = this.auditLogs.get(tenantId) || [];
      const filteredLogs = logs.filter(log => 
        new Date(log.timestamp) >= fromDate && new Date(log.timestamp) <= toDate
      );

      const stats = {
        totalEvents: filteredLogs.length,
        eventsByAction: {},
        eventsByUser: {},
        eventsByCategory: {},
        eventsBySeverity: {},
        eventsByRiskLevel: {},
        highRiskEvents: filteredLogs.filter(log => log.riskLevel === 'high').length,
        failedActions: filteredLogs.filter(log => log.outcome === 'failure').length,
        uniqueUsers: new Set(filteredLogs.map(log => log.userId)).size,
        dateRange: { fromDate, toDate }
      };

      // Calculate breakdowns
      filteredLogs.forEach(log => {
        // By action
        stats.eventsByAction[log.action] = (stats.eventsByAction[log.action] || 0) + 1;
        
        // By user
        if (log.userId) {
          stats.eventsByUser[log.userId] = (stats.eventsByUser[log.userId] || 0) + 1;
        }
        
        // By category
        stats.eventsByCategory[log.category] = (stats.eventsByCategory[log.category] || 0) + 1;
        
        // By severity
        stats.eventsBySeverity[log.severity] = (stats.eventsBySeverity[log.severity] || 0) + 1;
        
        // By risk level
        stats.eventsByRiskLevel[log.riskLevel] = (stats.eventsByRiskLevel[log.riskLevel] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting audit stats:', error);
      return {};
    }
  }

  /**
   * Search audit logs
   * @param {string} tenantId - Tenant ID
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Array} Matching audit logs
   */
  async searchAuditLogs(tenantId, query, filters = {}) {
    try {
      let logs = this.auditLogs.get(tenantId) || [];

      // Apply basic filters first
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.fromDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.fromDate));
      }
      if (filters.toDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.toDate));
      }

      // Apply text search
      if (query) {
        const searchTerm = query.toLowerCase();
        logs = logs.filter(log => 
          log.action.toLowerCase().includes(searchTerm) ||
          log.resource?.toLowerCase().includes(searchTerm) ||
          JSON.stringify(log.details).toLowerCase().includes(searchTerm) ||
          log.userId?.toLowerCase().includes(searchTerm)
        );
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return logs;
    } catch (error) {
      logger.error('Error searching audit logs:', error);
      return [];
    }
  }

  /**
   * Generate audit report
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Report options
   * @returns {Object} Audit report
   */
  async generateAuditReport(tenantId, options = {}) {
    try {
      const fromDate = options.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = options.toDate || new Date();

      const logs = this.auditLogs.get(tenantId) || [];
      const filteredLogs = logs.filter(log => 
        new Date(log.timestamp) >= fromDate && new Date(log.timestamp) <= toDate
      );

      const stats = await this.getAuditStats(tenantId, { fromDate, toDate });

      const report = {
        tenantId,
        generatedAt: new Date().toISOString(),
        period: { fromDate, toDate },
        summary: stats,
        topActions: Object.entries(stats.eventsByAction)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
        topUsers: Object.entries(stats.eventsByUser)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
        recentEvents: filteredLogs.slice(0, 100),
        compliance: this.generateComplianceReport(filteredLogs),
        recommendations: this.generateAuditRecommendations(filteredLogs)
      };

      return report;
    } catch (error) {
      logger.error('Error generating audit report:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   * @param {Array} logs - Audit logs
   * @returns {Object} Compliance report
   */
  generateComplianceReport(logs) {
    const compliance = {
      gdprCompliant: true,
      soxCompliant: true,
      hipaaCompliant: true,
      issues: []
    };

    // Check for data access without proper authorization
    const unauthorizedAccess = logs.filter(log => 
      log.action.includes('data_access') && log.outcome === 'failure'
    );
    if (unauthorizedAccess.length > 0) {
      compliance.issues.push({
        type: 'unauthorized_access',
        count: unauthorizedAccess.length,
        severity: 'high'
      });
    }

    // Check for missing audit trails
    const criticalActions = ['user_deleted', 'organization_deleted', 'tenant_deleted'];
    const missingAuditTrails = criticalActions.filter(action => 
      !logs.some(log => log.action === action)
    );
    if (missingAuditTrails.length > 0) {
      compliance.issues.push({
        type: 'missing_audit_trails',
        actions: missingAuditTrails,
        severity: 'medium'
      });
    }

    // Check for data retention compliance
    const oldLogs = logs.filter(log => 
      new Date(log.timestamp) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    );
    if (oldLogs.length > 0) {
      compliance.issues.push({
        type: 'data_retention_violation',
        count: oldLogs.length,
        severity: 'low'
      });
    }

    return compliance;
  }

  /**
   * Generate audit recommendations
   * @param {Array} logs - Audit logs
   * @returns {Array} Recommendations
   */
  generateAuditRecommendations(logs) {
    const recommendations = [];

    // Check for high-risk events
    const highRiskEvents = logs.filter(log => log.riskLevel === 'high');
    if (highRiskEvents.length > 10) {
      recommendations.push({
        type: 'high_risk_activity',
        priority: 'high',
        message: 'High number of high-risk events detected',
        action: 'Review security policies and access controls'
      });
    }

    // Check for failed actions
    const failedActions = logs.filter(log => log.outcome === 'failure');
    if (failedActions.length > 20) {
      recommendations.push({
        type: 'failed_actions',
        priority: 'medium',
        message: 'High number of failed actions detected',
        action: 'Review user training and system usability'
      });
    }

    // Check for unusual activity patterns
    const uniqueUsers = new Set(logs.map(log => log.userId));
    if (uniqueUsers.size > 50) {
      recommendations.push({
        type: 'user_activity',
        priority: 'low',
        message: 'High number of active users',
        action: 'Consider implementing user activity monitoring'
      });
    }

    return recommendations;
  }

  /**
   * Clean up old audit logs
   * @param {string} tenantId - Tenant ID
   */
  async cleanupOldLogs(tenantId) {
    try {
      const logs = this.auditLogs.get(tenantId) || [];
      const cutoffDate = new Date(Date.now() - this.retentionPeriod * 24 * 60 * 60 * 1000);
      
      const filteredLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
      this.auditLogs.set(tenantId, filteredLogs);

      logger.info('Old audit logs cleaned up', { 
        tenantId, 
        removedCount: logs.length - filteredLogs.length 
      });
    } catch (error) {
      logger.error('Error cleaning up old logs:', error);
    }
  }

  /**
   * Export audit logs
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Export options
   * @returns {Object} Exported audit logs
   */
  async exportAuditLogs(tenantId, options = {}) {
    try {
      const fromDate = options.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = options.toDate || new Date();

      const logs = this.auditLogs.get(tenantId) || [];
      const filteredLogs = logs.filter(log => 
        new Date(log.timestamp) >= fromDate && new Date(log.timestamp) <= toDate
      );

      const exportData = {
        tenantId,
        exportedAt: new Date().toISOString(),
        period: { fromDate, toDate },
        totalRecords: filteredLogs.length,
        logs: filteredLogs
      };

      logger.info('Audit logs exported', { tenantId, recordCount: filteredLogs.length });
      return exportData;
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditLogger();
