const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const Redis = require('redis');
const { Client } = require('@elastic/elasticsearch');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class ComplianceEngine {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.logger = this.setupLogger();
        this.db = this.setupDatabase();
        this.redis = this.setupRedis();
        this.elasticsearch = this.setupElasticsearch();
        this.complianceRules = new Map();
        this.auditLogs = [];
        this.riskAssessments = new Map();
        this.policies = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupComplianceRules();
        this.setupMonitoring();
        this.setupReporting();
    }

    setupLogger() {
        return winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'compliance.log' })
            ]
        });
    }

    setupDatabase() {
        return new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'compliance_db',
            user: process.env.DB_USER || 'compliance_user',
            password: process.env.DB_PASSWORD || 'compliance_password',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        });
    }

    setupRedis() {
        const redis = Redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        redis.on('error', (err) => {
            this.logger.error('Redis connection error:', err);
        });
        
        redis.connect();
        return redis;
    }

    setupElasticsearch() {
        return new Client({
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
            auth: {
                username: process.env.ELASTICSEARCH_USER || 'elastic',
                password: process.env.ELASTICSEARCH_PASSWORD || 'elastic'
            }
        });
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));
        
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: 'Too many requests from this IP, please try again later.'
        });
        this.app.use('/api/', limiter);
        
        // Request logging
        this.app.use((req, res, next) => {
            req.id = uuidv4();
            this.logger.info('Request received', {
                id: req.id,
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '2.9.0'
            });
        });

        // GDPR routes
        this.app.post('/api/v1/compliance/gdpr/classify', this.classifyGDPRData.bind(this));
        this.app.post('/api/v1/compliance/gdpr/consent', this.manageGDPRConsent.bind(this));
        this.app.delete('/api/v1/compliance/gdpr/data/:userId', this.deleteGDPRData.bind(this));
        this.app.get('/api/v1/compliance/gdpr/export/:userId', this.exportGDPRData.bind(this));
        this.app.post('/api/v1/compliance/gdpr/breach', this.reportGDPRBreach.bind(this));
        this.app.get('/api/v1/compliance/gdpr/audit', this.getGDPRAudit.bind(this));

        // HIPAA routes
        this.app.post('/api/v1/compliance/hipaa/classify', this.classifyHIPAAData.bind(this));
        this.app.post('/api/v1/compliance/hipaa/access', this.manageHIPAAAccess.bind(this));
        this.app.get('/api/v1/compliance/hipaa/audit', this.getHIPAAAudit.bind(this));
        this.app.post('/api/v1/compliance/hipaa/risk', this.assessHIPAARisk.bind(this));
        this.app.post('/api/v1/compliance/hipaa/incident', this.reportHIPAAIncident.bind(this));
        this.app.get('/api/v1/compliance/hipaa/training', this.getHIPAATraining.bind(this));

        // SOX routes
        this.app.post('/api/v1/compliance/sox/test', this.testSOXControl.bind(this));
        this.app.post('/api/v1/compliance/sox/risk', this.assessSOXRisk.bind(this));
        this.app.get('/api/v1/compliance/sox/report', this.generateSOXReport.bind(this));
        this.app.post('/api/v1/compliance/sox/document', this.documentSOXControl.bind(this));
        this.app.get('/api/v1/compliance/sox/audit', this.getSOXAudit.bind(this));

        // General compliance routes
        this.app.get('/api/v1/compliance/status', this.getComplianceStatus.bind(this));
        this.app.post('/api/v1/compliance/policy', this.createPolicy.bind(this));
        this.app.get('/api/v1/compliance/policies', this.getPolicies.bind(this));
        this.app.post('/api/v1/compliance/violation', this.reportViolation.bind(this));
        this.app.get('/api/v1/compliance/violations', this.getViolations.bind(this));

        // Error handling
        this.app.use((err, req, res, next) => {
            this.logger.error('Unhandled error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: err.message,
                requestId: req.id
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not found',
                message: `Route ${req.method} ${req.url} not found`,
                requestId: req.id
            });
        });
    }

    setupComplianceRules() {
        // GDPR rules
        this.complianceRules.set('gdpr_data_retention', {
            name: 'GDPR Data Retention',
            description: 'Ensure personal data is not retained longer than necessary',
            type: 'gdpr',
            severity: 'high',
            check: async (data) => {
                const retentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years
                const dataAge = Date.now() - new Date(data.createdAt).getTime();
                return dataAge <= retentionPeriod;
            }
        });

        this.complianceRules.set('gdpr_consent_required', {
            name: 'GDPR Consent Required',
            description: 'Ensure consent is obtained before processing personal data',
            type: 'gdpr',
            severity: 'high',
            check: async (data) => {
                return data.consent === true;
            }
        });

        // HIPAA rules
        this.complianceRules.set('hipaa_phi_encryption', {
            name: 'HIPAA PHI Encryption',
            description: 'Ensure PHI is encrypted at rest and in transit',
            type: 'hipaa',
            severity: 'critical',
            check: async (data) => {
                return data.encrypted === true;
            }
        });

        this.complianceRules.set('hipaa_access_control', {
            name: 'HIPAA Access Control',
            description: 'Ensure access to PHI is properly controlled',
            type: 'hipaa',
            severity: 'high',
            check: async (data) => {
                return data.accessLevel && data.accessLevel !== 'public';
            }
        });

        // SOX rules
        this.complianceRules.set('sox_financial_controls', {
            name: 'SOX Financial Controls',
            description: 'Ensure financial controls are properly implemented',
            type: 'sox',
            severity: 'high',
            check: async (data) => {
                return data.controlsImplemented === true;
            }
        });

        this.complianceRules.set('sox_audit_trail', {
            name: 'SOX Audit Trail',
            description: 'Ensure comprehensive audit trail is maintained',
            type: 'sox',
            severity: 'high',
            check: async (data) => {
                return data.auditTrail && data.auditTrail.length > 0;
            }
        });
    }

    setupMonitoring() {
        // Monitor compliance rules every minute
        setInterval(async () => {
            try {
                await this.monitorCompliance();
            } catch (error) {
                this.logger.error('Compliance monitoring error:', error);
            }
        }, 60000);

        // Generate compliance reports daily
        setInterval(async () => {
            try {
                await this.generateDailyReport();
            } catch (error) {
                this.logger.error('Daily report generation error:', error);
            }
        }, 24 * 60 * 60 * 1000);
    }

    setupReporting() {
        // Setup reporting endpoints
        this.app.get('/api/v1/compliance/reports/daily', this.getDailyReport.bind(this));
        this.app.get('/api/v1/compliance/reports/weekly', this.getWeeklyReport.bind(this));
        this.app.get('/api/v1/compliance/reports/monthly', this.getMonthlyReport.bind(this));
        this.app.get('/api/v1/compliance/reports/yearly', this.getYearlyReport.bind(this));
    }

    // GDPR Methods
    async classifyGDPRData(req, res) {
        try {
            const { data, type, sensitivity } = req.body;
            
            if (!data || !type) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'Data and type are required'
                });
            }

            const classification = {
                id: uuidv4(),
                data: data,
                type: type,
                sensitivity: sensitivity || 'medium',
                gdprCategory: this.categorizeGDPRData(data, type),
                createdAt: new Date().toISOString(),
                complianceStatus: 'pending'
            };

            // Check compliance rules
            const complianceResults = await this.checkComplianceRules('gdpr', classification);
            classification.complianceStatus = complianceResults.every(r => r.passed) ? 'compliant' : 'non-compliant';
            classification.complianceResults = complianceResults;

            // Store in database
            await this.db.query(
                'INSERT INTO gdpr_classifications (id, data, type, sensitivity, gdpr_category, compliance_status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [classification.id, classification.data, classification.type, classification.sensitivity, classification.gdprCategory, classification.complianceStatus, classification.createdAt]
            );

            // Log audit event
            await this.logAuditEvent('gdpr_classification', classification);

            res.json({
                success: true,
                classification: classification
            });

        } catch (error) {
            this.logger.error('GDPR classification error:', error);
            res.status(500).json({
                error: 'Classification failed',
                message: error.message
            });
        }
    }

    async manageGDPRConsent(req, res) {
        try {
            const { userId, purpose, consent, timestamp } = req.body;
            
            if (!userId || !purpose || consent === undefined) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'UserId, purpose, and consent are required'
                });
            }

            const consentRecord = {
                id: uuidv4(),
                userId: userId,
                purpose: purpose,
                consent: consent,
                timestamp: timestamp || new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

            // Store in database
            await this.db.query(
                'INSERT INTO gdpr_consent (id, user_id, purpose, consent, timestamp, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
                [consentRecord.id, consentRecord.userId, consentRecord.purpose, consentRecord.consent, consentRecord.timestamp, consentRecord.createdAt]
            );

            // Log audit event
            await this.logAuditEvent('gdpr_consent', consentRecord);

            res.json({
                success: true,
                consent: consentRecord
            });

        } catch (error) {
            this.logger.error('GDPR consent management error:', error);
            res.status(500).json({
                error: 'Consent management failed',
                message: error.message
            });
        }
    }

    async deleteGDPRData(req, res) {
        try {
            const { userId } = req.params;
            const { reason, anonymize } = req.body;
            
            if (!userId) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'UserId is required'
                });
            }

            const deletionRecord = {
                id: uuidv4(),
                userId: userId,
                reason: reason || 'user_request',
                anonymize: anonymize || false,
                timestamp: new Date().toISOString()
            };

            // Delete or anonymize user data
            if (anonymize) {
                await this.anonymizeUserData(userId);
            } else {
                await this.deleteUserData(userId);
            }

            // Store deletion record
            await this.db.query(
                'INSERT INTO gdpr_deletions (id, user_id, reason, anonymize, timestamp) VALUES ($1, $2, $3, $4, $5)',
                [deletionRecord.id, deletionRecord.userId, deletionRecord.reason, deletionRecord.anonymize, deletionRecord.timestamp]
            );

            // Log audit event
            await this.logAuditEvent('gdpr_deletion', deletionRecord);

            res.json({
                success: true,
                deletion: deletionRecord
            });

        } catch (error) {
            this.logger.error('GDPR data deletion error:', error);
            res.status(500).json({
                error: 'Data deletion failed',
                message: error.message
            });
        }
    }

    async exportGDPRData(req, res) {
        try {
            const { userId } = req.params;
            const { format } = req.query;
            
            if (!userId) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'UserId is required'
                });
            }

            // Get user data
            const userData = await this.getUserData(userId);
            
            // Format data based on requested format
            let exportData;
            switch (format) {
                case 'json':
                    exportData = JSON.stringify(userData, null, 2);
                    break;
                case 'csv':
                    exportData = this.convertToCSV(userData);
                    break;
                default:
                    exportData = JSON.stringify(userData, null, 2);
            }

            // Log audit event
            await this.logAuditEvent('gdpr_export', { userId, format });

            res.json({
                success: true,
                data: exportData,
                format: format || 'json'
            });

        } catch (error) {
            this.logger.error('GDPR data export error:', error);
            res.status(500).json({
                error: 'Data export failed',
                message: error.message
            });
        }
    }

    async reportGDPRBreach(req, res) {
        try {
            const { data, description, severity, affectedUsers } = req.body;
            
            if (!data || !description) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'Data and description are required'
                });
            }

            const breachRecord = {
                id: uuidv4(),
                data: data,
                description: description,
                severity: severity || 'medium',
                affectedUsers: affectedUsers || [],
                timestamp: new Date().toISOString(),
                status: 'reported'
            };

            // Store breach record
            await this.db.query(
                'INSERT INTO gdpr_breaches (id, data, description, severity, affected_users, timestamp, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [breachRecord.id, breachRecord.data, breachRecord.description, breachRecord.severity, JSON.stringify(breachRecord.affectedUsers), breachRecord.timestamp, breachRecord.status]
            );

            // Notify authorities if required (within 72 hours)
            if (breachRecord.severity === 'high' || breachRecord.severity === 'critical') {
                await this.notifyAuthorities(breachRecord);
            }

            // Log audit event
            await this.logAuditEvent('gdpr_breach', breachRecord);

            res.json({
                success: true,
                breach: breachRecord
            });

        } catch (error) {
            this.logger.error('GDPR breach reporting error:', error);
            res.status(500).json({
                error: 'Breach reporting failed',
                message: error.message
            });
        }
    }

    // HIPAA Methods
    async classifyHIPAAData(req, res) {
        try {
            const { data, type, sensitivity } = req.body;
            
            if (!data || !type) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'Data and type are required'
                });
            }

            const classification = {
                id: uuidv4(),
                data: data,
                type: type,
                sensitivity: sensitivity || 'high',
                hipaaCategory: this.categorizeHIPAAData(data, type),
                encrypted: false,
                createdAt: new Date().toISOString(),
                complianceStatus: 'pending'
            };

            // Check compliance rules
            const complianceResults = await this.checkComplianceRules('hipaa', classification);
            classification.complianceStatus = complianceResults.every(r => r.passed) ? 'compliant' : 'non-compliant';
            classification.complianceResults = complianceResults;

            // Store in database
            await this.db.query(
                'INSERT INTO hipaa_classifications (id, data, type, sensitivity, hipaa_category, encrypted, compliance_status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [classification.id, classification.data, classification.type, classification.sensitivity, classification.hipaaCategory, classification.encrypted, classification.complianceStatus, classification.createdAt]
            );

            // Log audit event
            await this.logAuditEvent('hipaa_classification', classification);

            res.json({
                success: true,
                classification: classification
            });

        } catch (error) {
            this.logger.error('HIPAA classification error:', error);
            res.status(500).json({
                error: 'Classification failed',
                message: error.message
            });
        }
    }

    async manageHIPAAAccess(req, res) {
        try {
            const { userId, resourceId, level, purpose } = req.body;
            
            if (!userId || !resourceId || !level) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'UserId, resourceId, and level are required'
                });
            }

            const accessRecord = {
                id: uuidv4(),
                userId: userId,
                resourceId: resourceId,
                level: level,
                purpose: purpose || 'treatment',
                timestamp: new Date().toISOString(),
                status: 'granted'
            };

            // Store access record
            await this.db.query(
                'INSERT INTO hipaa_access (id, user_id, resource_id, level, purpose, timestamp, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [accessRecord.id, accessRecord.userId, accessRecord.resourceId, accessRecord.level, accessRecord.purpose, accessRecord.timestamp, accessRecord.status]
            );

            // Log audit event
            await this.logAuditEvent('hipaa_access', accessRecord);

            res.json({
                success: true,
                access: accessRecord
            });

        } catch (error) {
            this.logger.error('HIPAA access management error:', error);
            res.status(500).json({
                error: 'Access management failed',
                message: error.message
            });
        }
    }

    // SOX Methods
    async testSOXControl(req, res) {
        try {
            const { controlId, period, tester } = req.body;
            
            if (!controlId || !period || !tester) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'ControlId, period, and tester are required'
                });
            }

            const testRecord = {
                id: uuidv4(),
                controlId: controlId,
                period: period,
                tester: tester,
                timestamp: new Date().toISOString(),
                status: 'in_progress',
                results: []
            };

            // Perform control testing
            const testResults = await this.performControlTest(controlId, period);
            testRecord.results = testResults;
            testRecord.status = testResults.every(r => r.passed) ? 'passed' : 'failed';

            // Store test record
            await this.db.query(
                'INSERT INTO sox_tests (id, control_id, period, tester, timestamp, status, results) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [testRecord.id, testRecord.controlId, testRecord.period, testRecord.tester, testRecord.timestamp, testRecord.status, JSON.stringify(testRecord.results)]
            );

            // Log audit event
            await this.logAuditEvent('sox_test', testRecord);

            res.json({
                success: true,
                test: testRecord
            });

        } catch (error) {
            this.logger.error('SOX control testing error:', error);
            res.status(500).json({
                error: 'Control testing failed',
                message: error.message
            });
        }
    }

    async assessSOXRisk(req, res) {
        try {
            const { processId, riskLevel, assessor } = req.body;
            
            if (!processId || !riskLevel || !assessor) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'ProcessId, riskLevel, and assessor are required'
                });
            }

            const riskAssessment = {
                id: uuidv4(),
                processId: processId,
                riskLevel: riskLevel,
                assessor: assessor,
                timestamp: new Date().toISOString(),
                status: 'assessed',
                mitigations: []
            };

            // Perform risk assessment
            const riskResults = await this.performRiskAssessment(processId, riskLevel);
            riskAssessment.mitigations = riskResults;

            // Store risk assessment
            await this.db.query(
                'INSERT INTO sox_risks (id, process_id, risk_level, assessor, timestamp, status, mitigations) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [riskAssessment.id, riskAssessment.processId, riskAssessment.riskLevel, riskAssessment.assessor, riskAssessment.timestamp, riskAssessment.status, JSON.stringify(riskAssessment.mitigations)]
            );

            // Log audit event
            await this.logAuditEvent('sox_risk', riskAssessment);

            res.json({
                success: true,
                risk: riskAssessment
            });

        } catch (error) {
            this.logger.error('SOX risk assessment error:', error);
            res.status(500).json({
                error: 'Risk assessment failed',
                message: error.message
            });
        }
    }

    // Helper Methods
    categorizeGDPRData(data, type) {
        // Implement GDPR data categorization logic
        if (type === 'personal') {
            if (data.includes('@')) return 'email';
            if (data.match(/\d{4}-\d{2}-\d{2}/)) return 'date_of_birth';
            if (data.match(/\d{3}-\d{2}-\d{4}/)) return 'ssn';
            return 'general_personal';
        }
        return 'non_personal';
    }

    categorizeHIPAAData(data, type) {
        // Implement HIPAA data categorization logic
        if (type === 'phi') {
            if (data.match(/\d{3}-\d{2}-\d{4}/)) return 'ssn';
            if (data.match(/\d{3}-\d{3}-\d{4}/)) return 'phone';
            if (data.includes('@')) return 'email';
            return 'general_phi';
        }
        return 'non_phi';
    }

    async checkComplianceRules(framework, data) {
        const results = [];
        
        for (const [ruleId, rule] of this.complianceRules) {
            if (rule.type === framework) {
                try {
                    const passed = await rule.check(data);
                    results.push({
                        ruleId: ruleId,
                        ruleName: rule.name,
                        passed: passed,
                        severity: rule.severity
                    });
                } catch (error) {
                    this.logger.error(`Compliance rule check failed for ${ruleId}:`, error);
                    results.push({
                        ruleId: ruleId,
                        ruleName: rule.name,
                        passed: false,
                        severity: rule.severity,
                        error: error.message
                    });
                }
            }
        }
        
        return results;
    }

    async logAuditEvent(eventType, data) {
        const auditEvent = {
            id: uuidv4(),
            eventType: eventType,
            data: data,
            timestamp: new Date().toISOString(),
            userId: data.userId || 'system'
        };

        this.auditLogs.push(auditEvent);
        
        // Store in database
        await this.db.query(
            'INSERT INTO audit_logs (id, event_type, data, timestamp, user_id) VALUES ($1, $2, $3, $4, $5)',
            [auditEvent.id, auditEvent.eventType, JSON.stringify(auditEvent.data), auditEvent.timestamp, auditEvent.userId]
        );

        // Index in Elasticsearch
        await this.elasticsearch.index({
            index: 'compliance-audit',
            body: auditEvent
        });
    }

    async monitorCompliance() {
        // Implement compliance monitoring logic
        this.logger.info('Running compliance monitoring');
    }

    async generateDailyReport() {
        // Implement daily report generation
        this.logger.info('Generating daily compliance report');
    }

    async start() {
        try {
            this.app.listen(this.port, () => {
                this.logger.info(`Compliance Engine started on port ${this.port}`);
                this.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
                this.logger.info(`Version: 2.9.0`);
            });
        } catch (error) {
            this.logger.error('Failed to start compliance engine:', error);
            process.exit(1);
        }
    }
}

// Start the compliance engine
const complianceEngine = new ComplianceEngine();
complianceEngine.start();

module.exports = ComplianceEngine;
