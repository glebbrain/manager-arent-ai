const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3013;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Audit Logging Configuration
const auditConfig = {
    version: '2.7.0',
    logLevels: {
        'CRITICAL': { priority: 1, color: 'red', description: 'Critical system events' },
        'HIGH': { priority: 2, color: 'orange', description: 'High priority events' },
        'MEDIUM': { priority: 3, color: 'yellow', description: 'Medium priority events' },
        'LOW': { priority: 4, color: 'blue', description: 'Low priority events' },
        'INFO': { priority: 5, color: 'green', description: 'Informational events' },
        'DEBUG': { priority: 6, color: 'gray', description: 'Debug information' }
    },
    eventTypes: {
        'AUTHENTICATION': {
            name: 'Authentication Events',
            description: 'User authentication and authorization events',
            categories: ['LOGIN', 'LOGOUT', 'MFA', 'SSO', 'PASSWORD_RESET', 'ACCOUNT_LOCKOUT']
        },
        'AUTHORIZATION': {
            name: 'Authorization Events',
            description: 'Access control and permission events',
            categories: ['ACCESS_GRANTED', 'ACCESS_DENIED', 'PERMISSION_CHANGE', 'ROLE_CHANGE']
        },
        'DATA_ACCESS': {
            name: 'Data Access Events',
            description: 'Data access and modification events',
            categories: ['READ', 'WRITE', 'DELETE', 'EXPORT', 'IMPORT', 'BACKUP', 'RESTORE']
        },
        'SYSTEM': {
            name: 'System Events',
            description: 'System configuration and operation events',
            categories: ['CONFIG_CHANGE', 'SERVICE_START', 'SERVICE_STOP', 'ERROR', 'WARNING']
        },
        'SECURITY': {
            name: 'Security Events',
            description: 'Security-related events and incidents',
            categories: ['THREAT_DETECTED', 'VULNERABILITY', 'INCIDENT', 'COMPLIANCE', 'AUDIT']
        },
        'BUSINESS': {
            name: 'Business Events',
            description: 'Business process and workflow events',
            categories: ['PROCESS_START', 'PROCESS_COMPLETE', 'WORKFLOW_CHANGE', 'APPROVAL', 'REJECTION']
        }
    },
    retention: {
        'CRITICAL': 2555, // 7 years in days
        'HIGH': 1095, // 3 years in days
        'MEDIUM': 365, // 1 year in days
        'LOW': 90, // 3 months in days
        'INFO': 30, // 1 month in days
        'DEBUG': 7 // 1 week in days
    },
    storage: {
        'DATABASE': 'Primary database storage',
        'FILE': 'File-based storage',
        'ELASTICSEARCH': 'Elasticsearch for search and analytics',
        'S3': 'AWS S3 for long-term storage',
        'ARCHIVE': 'Compressed archive storage'
    }
};

// Audit Data Storage
let auditData = {
    logs: new Map(),
    analytics: {
        totalLogs: 0,
        logsByLevel: {},
        logsByType: {},
        logsByCategory: {},
        logsByUser: {},
        logsByIP: {},
        logsByDate: {},
        criticalEvents: 0,
        securityEvents: 0,
        complianceEvents: 0
    },
    retention: {
        archivedLogs: 0,
        deletedLogs: 0,
        lastCleanup: null
    }
};

// Utility functions
function generateLogId() {
    return uuidv4();
}

function calculateLogHash(logData) {
    const dataString = JSON.stringify(logData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
}

function determineLogLevel(eventType, category, severity) {
    // Critical events
    if (eventType === 'SECURITY' && category === 'INCIDENT') return 'CRITICAL';
    if (eventType === 'AUTHENTICATION' && category === 'ACCOUNT_LOCKOUT') return 'CRITICAL';
    if (eventType === 'SYSTEM' && category === 'ERROR') return 'CRITICAL';
    
    // High priority events
    if (eventType === 'SECURITY' && category === 'THREAT_DETECTED') return 'HIGH';
    if (eventType === 'AUTHORIZATION' && category === 'ACCESS_DENIED') return 'HIGH';
    if (eventType === 'DATA_ACCESS' && category === 'DELETE') return 'HIGH';
    
    // Medium priority events
    if (eventType === 'AUTHENTICATION' && category === 'LOGIN') return 'MEDIUM';
    if (eventType === 'AUTHORIZATION' && category === 'ACCESS_GRANTED') return 'MEDIUM';
    if (eventType === 'DATA_ACCESS' && category === 'WRITE') return 'MEDIUM';
    
    // Low priority events
    if (eventType === 'DATA_ACCESS' && category === 'READ') return 'LOW';
    if (eventType === 'SYSTEM' && category === 'SERVICE_START') return 'LOW';
    
    // Default to INFO
    return 'INFO';
}

function createAuditLog(eventData) {
    const logId = generateLogId();
    const timestamp = new Date().toISOString();
    const logLevel = determineLogLevel(eventData.eventType, eventData.category, eventData.severity);
    
    const auditLog = {
        id: logId,
        timestamp: timestamp,
        level: logLevel,
        eventType: eventData.eventType,
        category: eventData.category,
        severity: eventData.severity || 'MEDIUM',
        source: eventData.source || 'unknown',
        userId: eventData.userId || null,
        sessionId: eventData.sessionId || null,
        ipAddress: eventData.ipAddress || null,
        userAgent: eventData.userAgent || null,
        resource: eventData.resource || null,
        action: eventData.action || 'unknown',
        result: eventData.result || 'unknown',
        details: eventData.details || {},
        metadata: eventData.metadata || {},
        hash: null, // Will be calculated after creation
        retention: auditConfig.retention[logLevel],
        archived: false,
        deleted: false
    };
    
    // Calculate hash
    auditLog.hash = calculateLogHash(auditLog);
    
    return auditLog;
}

function storeAuditLog(auditLog) {
    // Store in memory
    auditData.logs.set(auditLog.id, auditLog);
    
    // Update analytics
    auditData.analytics.totalLogs++;
    
    // Update level analytics
    if (!auditData.analytics.logsByLevel[auditLog.level]) {
        auditData.analytics.logsByLevel[auditLog.level] = 0;
    }
    auditData.analytics.logsByLevel[auditLog.level]++;
    
    // Update type analytics
    if (!auditData.analytics.logsByType[auditLog.eventType]) {
        auditData.analytics.logsByType[auditLog.eventType] = 0;
    }
    auditData.analytics.logsByType[auditLog.eventType]++;
    
    // Update category analytics
    const categoryKey = `${auditLog.eventType}:${auditLog.category}`;
    if (!auditData.analytics.logsByCategory[categoryKey]) {
        auditData.analytics.logsByCategory[categoryKey] = 0;
    }
    auditData.analytics.logsByCategory[categoryKey]++;
    
    // Update user analytics
    if (auditLog.userId) {
        if (!auditData.analytics.logsByUser[auditLog.userId]) {
            auditData.analytics.logsByUser[auditLog.userId] = 0;
        }
        auditData.analytics.logsByUser[auditLog.userId]++;
    }
    
    // Update IP analytics
    if (auditLog.ipAddress) {
        if (!auditData.analytics.logsByIP[auditLog.ipAddress]) {
            auditData.analytics.logsByIP[auditLog.ipAddress] = 0;
        }
        auditData.analytics.logsByIP[auditLog.ipAddress]++;
    }
    
    // Update date analytics
    const dateKey = auditLog.timestamp.split('T')[0];
    if (!auditData.analytics.logsByDate[dateKey]) {
        auditData.analytics.logsByDate[dateKey] = 0;
    }
    auditData.analytics.logsByDate[dateKey]++;
    
    // Update special counters
    if (auditLog.level === 'CRITICAL') {
        auditData.analytics.criticalEvents++;
    }
    if (auditLog.eventType === 'SECURITY') {
        auditData.analytics.securityEvents++;
    }
    if (auditLog.eventType === 'COMPLIANCE') {
        auditData.analytics.complianceEvents++;
    }
    
    return auditLog;
}

function searchAuditLogs(filters) {
    let logs = Array.from(auditData.logs.values());
    
    // Apply filters
    if (filters.level) {
        logs = logs.filter(log => log.level === filters.level);
    }
    
    if (filters.eventType) {
        logs = logs.filter(log => log.eventType === filters.eventType);
    }
    
    if (filters.category) {
        logs = logs.filter(log => log.category === filters.category);
    }
    
    if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
    }
    
    if (filters.ipAddress) {
        logs = logs.filter(log => log.ipAddress === filters.ipAddress);
    }
    
    if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate);
    }
    
    if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate);
    }
    
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        logs = logs.filter(log => 
            log.action.toLowerCase().includes(searchTerm) ||
            log.result.toLowerCase().includes(searchTerm) ||
            JSON.stringify(log.details).toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
        logs: logs.slice(startIndex, endIndex),
        total: logs.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(logs.length / limit)
    };
}

function generateAuditReport(reportType, filters) {
    const reportId = uuidv4();
    const timestamp = new Date().toISOString();
    
    let report = {
        id: reportId,
        type: reportType,
        timestamp: timestamp,
        filters: filters,
        data: {}
    };
    
    switch (reportType) {
        case 'SUMMARY':
            report.data = {
                totalLogs: auditData.analytics.totalLogs,
                logsByLevel: auditData.analytics.logsByLevel,
                logsByType: auditData.analytics.logsByType,
                criticalEvents: auditData.analytics.criticalEvents,
                securityEvents: auditData.analytics.securityEvents,
                complianceEvents: auditData.analytics.complianceEvents
            };
            break;
            
        case 'SECURITY':
            const securityLogs = Array.from(auditData.logs.values())
                .filter(log => log.eventType === 'SECURITY')
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            report.data = {
                totalSecurityEvents: securityLogs.length,
                threatsDetected: securityLogs.filter(log => log.category === 'THREAT_DETECTED').length,
                incidents: securityLogs.filter(log => log.category === 'INCIDENT').length,
                vulnerabilities: securityLogs.filter(log => log.category === 'VULNERABILITY').length,
                recentEvents: securityLogs.slice(0, 50)
            };
            break;
            
        case 'COMPLIANCE':
            const complianceLogs = Array.from(auditData.logs.values())
                .filter(log => log.eventType === 'COMPLIANCE' || log.category === 'AUDIT')
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            report.data = {
                totalComplianceEvents: complianceLogs.length,
                auditEvents: complianceLogs.filter(log => log.category === 'AUDIT').length,
                policyViolations: complianceLogs.filter(log => log.category === 'POLICY_VIOLATION').length,
                recentEvents: complianceLogs.slice(0, 50)
            };
            break;
            
        case 'USER_ACTIVITY':
            const userLogs = Array.from(auditData.logs.values())
                .filter(log => log.userId === filters.userId)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            report.data = {
                userId: filters.userId,
                totalEvents: userLogs.length,
                loginEvents: userLogs.filter(log => log.category === 'LOGIN').length,
                accessEvents: userLogs.filter(log => log.eventType === 'AUTHORIZATION').length,
                dataAccessEvents: userLogs.filter(log => log.eventType === 'DATA_ACCESS').length,
                recentActivity: userLogs.slice(0, 100)
            };
            break;
    }
    
    return report;
}

// Advanced Audit Logging Functions

// Real-time audit monitoring
function startRealTimeMonitoring() {
    setInterval(() => {
        const criticalLogs = Array.from(auditData.logs.values())
            .filter(log => log.level === 'CRITICAL' && !log.archived)
            .slice(-10);
        
        if (criticalLogs.length > 0) {
            console.log(`🚨 ${criticalLogs.length} critical events detected in the last monitoring cycle`);
        }
    }, 30000); // Check every 30 seconds
}

// Advanced log analysis
function performAdvancedLogAnalysis(logs) {
    const analysis = {
        patterns: {},
        anomalies: [],
        trends: {},
        riskScore: 0,
        recommendations: []
    };
    
    // Pattern detection
    const loginPatterns = logs.filter(log => log.category === 'LOGIN');
    const failedLogins = loginPatterns.filter(log => log.result === 'FAILED');
    
    if (failedLogins.length > 10) {
        analysis.patterns.bruteForce = {
            detected: true,
            count: failedLogins.length,
            severity: 'HIGH'
        };
        analysis.riskScore += 30;
    }
    
    // Anomaly detection
    const ipAddresses = [...new Set(logs.map(log => log.ipAddress).filter(Boolean))];
    if (ipAddresses.length > 50) {
        analysis.anomalies.push({
            type: 'MULTIPLE_IP_ADDRESSES',
            description: 'Unusual number of IP addresses detected',
            severity: 'MEDIUM',
            count: ipAddresses.length
        });
        analysis.riskScore += 15;
    }
    
    // Time-based anomalies
    const hourlyDistribution = {};
    logs.forEach(log => {
        const hour = new Date(log.timestamp).getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });
    
    const maxHour = Math.max(...Object.values(hourlyDistribution));
    const avgHour = Object.values(hourlyDistribution).reduce((a, b) => a + b, 0) / Object.keys(hourlyDistribution).length;
    
    if (maxHour > avgHour * 3) {
        analysis.anomalies.push({
            type: 'UNUSUAL_ACTIVITY_PEAK',
            description: 'Unusual activity spike detected',
            severity: 'MEDIUM',
            peakHour: Object.keys(hourlyDistribution).find(h => hourlyDistribution[h] === maxHour)
        });
        analysis.riskScore += 10;
    }
    
    // Generate recommendations
    if (analysis.riskScore > 50) {
        analysis.recommendations.push('High risk score detected - consider immediate security review');
    }
    if (analysis.patterns.bruteForce) {
        analysis.recommendations.push('Brute force pattern detected - implement additional authentication measures');
    }
    if (analysis.anomalies.length > 0) {
        analysis.recommendations.push('Anomalies detected - review user activities and access patterns');
    }
    
    return analysis;
}

// Compliance reporting
function generateComplianceReport(framework) {
    const report = {
        framework: framework,
        timestamp: new Date().toISOString(),
        compliance: {},
        violations: [],
        recommendations: []
    };
    
    const logs = Array.from(auditData.logs.values());
    
    switch (framework) {
        case 'GDPR':
            report.compliance = {
                dataAccessLogs: logs.filter(log => log.eventType === 'DATA_ACCESS').length,
                consentLogs: logs.filter(log => log.category === 'CONSENT').length,
                dataDeletionLogs: logs.filter(log => log.action === 'DELETE' && log.eventType === 'DATA_ACCESS').length,
                breachLogs: logs.filter(log => log.category === 'INCIDENT' && log.eventType === 'SECURITY').length
            };
            
            if (report.compliance.breachLogs > 0) {
                report.violations.push({
                    type: 'DATA_BREACH',
                    description: 'Data breach incidents detected',
                    count: report.compliance.breachLogs,
                    severity: 'CRITICAL'
                });
            }
            break;
            
        case 'HIPAA':
            report.compliance = {
                accessLogs: logs.filter(log => log.eventType === 'AUTHORIZATION').length,
                dataAccessLogs: logs.filter(log => log.eventType === 'DATA_ACCESS').length,
                auditLogs: logs.filter(log => log.category === 'AUDIT').length,
                securityLogs: logs.filter(log => log.eventType === 'SECURITY').length
            };
            break;
            
        case 'SOC2':
            report.compliance = {
                accessControlLogs: logs.filter(log => log.eventType === 'AUTHORIZATION').length,
                systemLogs: logs.filter(log => log.eventType === 'SYSTEM').length,
                securityLogs: logs.filter(log => log.eventType === 'SECURITY').length,
                availabilityLogs: logs.filter(log => log.category === 'SERVICE_START' || log.category === 'SERVICE_STOP').length
            };
            break;
    }
    
    return report;
}

// Log integrity verification
function verifyLogIntegrity(logId) {
    const log = auditData.logs.get(logId);
    if (!log) {
        return { valid: false, error: 'Log not found' };
    }
    
    const calculatedHash = calculateLogHash(log);
    const isValid = calculatedHash === log.hash;
    
    return {
        valid: isValid,
        logId: logId,
        calculatedHash: calculatedHash,
        storedHash: log.hash,
        timestamp: log.timestamp
    };
}

// Advanced search and filtering
function advancedSearchLogs(query) {
    const logs = Array.from(auditData.logs.values());
    let results = logs;
    
    // Full-text search
    if (query.search) {
        const searchTerm = query.search.toLowerCase();
        results = results.filter(log => 
            JSON.stringify(log).toLowerCase().includes(searchTerm)
        );
    }
    
    // Date range filtering
    if (query.startDate) {
        results = results.filter(log => log.timestamp >= query.startDate);
    }
    if (query.endDate) {
        results = results.filter(log => log.timestamp <= query.endDate);
    }
    
    // Risk-based filtering
    if (query.riskLevel) {
        results = results.filter(log => {
            const analysis = performAdvancedLogAnalysis([log]);
            return analysis.riskScore >= (query.riskLevel * 10);
        });
    }
    
    // Pattern-based filtering
    if (query.patterns) {
        results = results.filter(log => {
            return query.patterns.some(pattern => {
                switch (pattern) {
                    case 'BRUTE_FORCE':
                        return log.category === 'LOGIN' && log.result === 'FAILED';
                    case 'PRIVILEGE_ESCALATION':
                        return log.category === 'ROLE_CHANGE' || log.category === 'PERMISSION_CHANGE';
                    case 'DATA_EXFILTRATION':
                        return log.eventType === 'DATA_ACCESS' && log.action === 'EXPORT';
                    default:
                        return false;
                }
            });
        });
    }
    
    // Sort results
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';
    
    results.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (sortBy === 'timestamp') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        
        if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
        logs: results.slice(startIndex, endIndex),
        total: results.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(results.length / limit)
    };
}

// Automated alerting
function checkAlertConditions() {
    const alerts = [];
    const logs = Array.from(auditData.logs.values());
    const recentLogs = logs.filter(log => 
        (new Date() - new Date(log.timestamp)) < 300000 // Last 5 minutes
    );
    
    // Critical event alert
    const criticalEvents = recentLogs.filter(log => log.level === 'CRITICAL');
    if (criticalEvents.length > 0) {
        alerts.push({
            type: 'CRITICAL_EVENTS',
            severity: 'HIGH',
            message: `${criticalEvents.length} critical events in the last 5 minutes`,
            events: criticalEvents.slice(0, 5)
        });
    }
    
    // Failed login alert
    const failedLogins = recentLogs.filter(log => 
        log.category === 'LOGIN' && log.result === 'FAILED'
    );
    if (failedLogins.length > 10) {
        alerts.push({
            type: 'BRUTE_FORCE_ATTEMPT',
            severity: 'HIGH',
            message: `${failedLogins.length} failed login attempts in the last 5 minutes`,
            events: failedLogins.slice(0, 10)
        });
    }
    
    // Unusual activity alert
    const uniqueIPs = [...new Set(recentLogs.map(log => log.ipAddress).filter(Boolean))];
    if (uniqueIPs.length > 20) {
        alerts.push({
            type: 'UNUSUAL_ACTIVITY',
            severity: 'MEDIUM',
            message: `Activity from ${uniqueIPs.length} different IP addresses in the last 5 minutes`,
            events: recentLogs.slice(0, 10)
        });
    }
    
    return alerts;
}

// Start real-time monitoring
startRealTimeMonitoring();

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Audit Logging',
        version: auditConfig.version,
        timestamp: new Date().toISOString()
    });
});

// Get audit configuration
app.get('/api/config', (req, res) => {
    res.json(auditConfig);
});

// Create audit log
app.post('/api/logs', (req, res) => {
    try {
        const eventData = req.body;
        
        if (!eventData.eventType || !eventData.category) {
            return res.status(400).json({ error: 'Event type and category are required' });
        }
        
        const auditLog = createAuditLog(eventData);
        const storedLog = storeAuditLog(auditLog);
        
        res.status(201).json({
            message: 'Audit log created successfully',
            logId: storedLog.id,
            timestamp: storedLog.timestamp
        });
        
    } catch (error) {
        console.error('Error creating audit log:', error);
        res.status(500).json({ error: 'Failed to create audit log', details: error.message });
    }
});

// Get audit logs
app.get('/api/logs', (req, res) => {
    try {
        const filters = {
            level: req.query.level,
            eventType: req.query.eventType,
            category: req.query.category,
            userId: req.query.userId,
            ipAddress: req.query.ipAddress,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            search: req.query.search,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 100
        };
        
        const result = searchAuditLogs(filters);
        res.json(result);
        
    } catch (error) {
        console.error('Error getting audit logs:', error);
        res.status(500).json({ error: 'Failed to get audit logs', details: error.message });
    }
});

// Get specific audit log
app.get('/api/logs/:logId', (req, res) => {
    try {
        const { logId } = req.params;
        const auditLog = auditData.logs.get(logId);
        
        if (!auditLog) {
            return res.status(404).json({ error: 'Audit log not found' });
        }
        
        res.json(auditLog);
        
    } catch (error) {
        console.error('Error getting audit log:', error);
        res.status(500).json({ error: 'Failed to get audit log', details: error.message });
    }
});

// Get audit analytics
app.get('/api/analytics', (req, res) => {
    try {
        const analytics = {
            ...auditData.analytics,
            retention: auditData.retention,
            lastUpdated: new Date().toISOString()
        };
        
        res.json(analytics);
        
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics', details: error.message });
    }
});

// Generate audit report
app.post('/api/reports', (req, res) => {
    try {
        const { reportType, filters = {} } = req.body;
        
        if (!reportType) {
            return res.status(400).json({ error: 'Report type is required' });
        }
        
        const report = generateAuditReport(reportType, filters);
        
        res.status(201).json(report);
        
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

// Get audit reports
app.get('/api/reports', (req, res) => {
    try {
        const { reportType, startDate, endDate } = req.query;
        
        // In a real implementation, this would query a database
        res.json({
            reports: [],
            message: 'Report storage not implemented in this demo'
        });
        
    } catch (error) {
        console.error('Error getting reports:', error);
        res.status(500).json({ error: 'Failed to get reports', details: error.message });
    }
});

// Export audit logs
app.get('/api/export', (req, res) => {
    try {
        const { format = 'json', startDate, endDate, eventType, level } = req.query;
        
        let logs = Array.from(auditData.logs.values());
        
        // Apply filters
        if (startDate) {
            logs = logs.filter(log => log.timestamp >= startDate);
        }
        if (endDate) {
            logs = logs.filter(log => log.timestamp <= endDate);
        }
        if (eventType) {
            logs = logs.filter(log => log.eventType === eventType);
        }
        if (level) {
            logs = logs.filter(log => log.level === level);
        }
        
        // Sort by timestamp
        logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        switch (format.toLowerCase()) {
            case 'json':
                res.json({ logs });
                break;
            case 'csv':
                const csv = 'ID,Timestamp,Level,EventType,Category,Source,UserId,IPAddress,Action,Result\n' +
                    logs.map(log => 
                        `${log.id},${log.timestamp},${log.level},${log.eventType},${log.category},${log.source},${log.userId || ''},${log.ipAddress || ''},${log.action},${log.result}`
                    ).join('\n');
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
                res.send(csv);
                break;
            case 'xml':
                const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<auditLogs>\n' +
                    logs.map(log => 
                        `  <log id="${log.id}" timestamp="${log.timestamp}" level="${log.level}">\n` +
                        `    <eventType>${log.eventType}</eventType>\n` +
                        `    <category>${log.category}</category>\n` +
                        `    <source>${log.source}</source>\n` +
                        `    <userId>${log.userId || ''}</userId>\n` +
                        `    <ipAddress>${log.ipAddress || ''}</ipAddress>\n` +
                        `    <action>${log.action}</action>\n` +
                        `    <result>${log.result}</result>\n` +
                        `  </log>`
                    ).join('\n') + '\n</auditLogs>';
                
                res.setHeader('Content-Type', 'application/xml');
                res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.xml"');
                res.send(xml);
                break;
            default:
                res.status(400).json({ error: 'Unsupported export format' });
        }
        
    } catch (error) {
        console.error('Error exporting logs:', error);
        res.status(500).json({ error: 'Failed to export logs', details: error.message });
    }
});

// Get log statistics
app.get('/api/statistics', (req, res) => {
    try {
        const { period = '24h' } = req.query;
        
        const now = new Date();
        let startDate;
        
        switch (period) {
            case '1h':
                startDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        const logs = Array.from(auditData.logs.values())
            .filter(log => new Date(log.timestamp) >= startDate);
        
        const statistics = {
            period: period,
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            totalLogs: logs.length,
            logsByLevel: {},
            logsByType: {},
            logsByCategory: {},
            topUsers: {},
            topIPs: {},
            hourlyDistribution: {}
        };
        
        // Calculate statistics
        logs.forEach(log => {
            // By level
            statistics.logsByLevel[log.level] = (statistics.logsByLevel[log.level] || 0) + 1;
            
            // By type
            statistics.logsByType[log.eventType] = (statistics.logsByType[log.eventType] || 0) + 1;
            
            // By category
            const categoryKey = `${log.eventType}:${log.category}`;
            statistics.logsByCategory[categoryKey] = (statistics.logsByCategory[categoryKey] || 0) + 1;
            
            // Top users
            if (log.userId) {
                statistics.topUsers[log.userId] = (statistics.topUsers[log.userId] || 0) + 1;
            }
            
            // Top IPs
            if (log.ipAddress) {
                statistics.topIPs[log.ipAddress] = (statistics.topIPs[log.ipAddress] || 0) + 1;
            }
            
            // Hourly distribution
            const hour = new Date(log.timestamp).getHours();
            statistics.hourlyDistribution[hour] = (statistics.hourlyDistribution[hour] || 0) + 1;
        });
        
        // Sort top users and IPs
        statistics.topUsers = Object.entries(statistics.topUsers)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
        
        statistics.topIPs = Object.entries(statistics.topIPs)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
        
        res.json(statistics);
        
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ error: 'Failed to get statistics', details: error.message });
    }
});

// Advanced Audit Logging API Endpoints

// Advanced log analysis
app.post('/api/analyze', (req, res) => {
    try {
        const { filters = {} } = req.body;
        
        let logs = Array.from(auditData.logs.values());
        
        // Apply filters
        if (filters.startDate) {
            logs = logs.filter(log => log.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
            logs = logs.filter(log => log.timestamp <= filters.endDate);
        }
        if (filters.eventType) {
            logs = logs.filter(log => log.eventType === filters.eventType);
        }
        if (filters.level) {
            logs = logs.filter(log => log.level === filters.level);
        }
        
        const analysis = performAdvancedLogAnalysis(logs);
        
        res.json({
            analysis: analysis,
            logsAnalyzed: logs.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error analyzing logs:', error);
        res.status(500).json({ error: 'Failed to analyze logs', details: error.message });
    }
});

// Compliance reporting
app.post('/api/compliance/report', (req, res) => {
    try {
        const { framework } = req.body;
        
        if (!framework) {
            return res.status(400).json({ error: 'Compliance framework is required' });
        }
        
        const report = generateComplianceReport(framework);
        
        res.json(report);
        
    } catch (error) {
        console.error('Error generating compliance report:', error);
        res.status(500).json({ error: 'Failed to generate compliance report', details: error.message });
    }
});

// Log integrity verification
app.post('/api/integrity/verify', (req, res) => {
    try {
        const { logIds } = req.body;
        
        if (!logIds || !Array.isArray(logIds)) {
            return res.status(400).json({ error: 'Log IDs array is required' });
        }
        
        const results = logIds.map(logId => verifyLogIntegrity(logId));
        
        res.json({
            results: results,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error verifying log integrity:', error);
        res.status(500).json({ error: 'Failed to verify log integrity', details: error.message });
    }
});

// Advanced search
app.post('/api/search/advanced', (req, res) => {
    try {
        const query = req.body;
        
        const results = advancedSearchLogs(query);
        
        res.json(results);
        
    } catch (error) {
        console.error('Error performing advanced search:', error);
        res.status(500).json({ error: 'Failed to perform advanced search', details: error.message });
    }
});

// Get alerts
app.get('/api/alerts', (req, res) => {
    try {
        const alerts = checkAlertConditions();
        
        res.json({
            alerts: alerts,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting alerts:', error);
        res.status(500).json({ error: 'Failed to get alerts', details: error.message });
    }
});

// Get audit dashboard data
app.get('/api/dashboard', (req, res) => {
    try {
        const logs = Array.from(auditData.logs.values());
        const recentLogs = logs.filter(log => 
            (new Date() - new Date(log.timestamp)) < 24 * 60 * 60 * 1000 // Last 24 hours
        );
        
        const dashboard = {
            overview: {
                totalLogs: logs.length,
                recentLogs: recentLogs.length,
                criticalEvents: logs.filter(log => log.level === 'CRITICAL').length,
                securityEvents: logs.filter(log => log.eventType === 'SECURITY').length
            },
            trends: {
                hourlyDistribution: {},
                dailyDistribution: {},
                topEventTypes: {},
                topUsers: {},
                topIPs: {}
            },
            alerts: checkAlertConditions(),
            lastUpdated: new Date().toISOString()
        };
        
        // Calculate trends
        recentLogs.forEach(log => {
            const hour = new Date(log.timestamp).getHours();
            const day = new Date(log.timestamp).toISOString().split('T')[0];
            
            dashboard.trends.hourlyDistribution[hour] = (dashboard.trends.hourlyDistribution[hour] || 0) + 1;
            dashboard.trends.dailyDistribution[day] = (dashboard.trends.dailyDistribution[day] || 0) + 1;
            dashboard.trends.topEventTypes[log.eventType] = (dashboard.trends.topEventTypes[log.eventType] || 0) + 1;
            
            if (log.userId) {
                dashboard.trends.topUsers[log.userId] = (dashboard.trends.topUsers[log.userId] || 0) + 1;
            }
            if (log.ipAddress) {
                dashboard.trends.topIPs[log.ipAddress] = (dashboard.trends.topIPs[log.ipAddress] || 0) + 1;
            }
        });
        
        res.json(dashboard);
        
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ error: 'Failed to get dashboard data', details: error.message });
    }
});

// Get audit configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...auditConfig,
            features: {
                realTimeMonitoring: true,
                advancedAnalysis: true,
                complianceReporting: true,
                logIntegrity: true,
                automatedAlerting: true,
                advancedSearch: true
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`📊 Advanced Audit Logging v2.7.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`🤖 Features: Real-time Monitoring, Advanced Analysis, Compliance Reporting`);
    console.log(`🔒 Security: Log Integrity, Automated Alerting, Advanced Search`);
    console.log(`📈 Dashboard: http://localhost:${PORT}/api/dashboard`);
});

module.exports = app;
