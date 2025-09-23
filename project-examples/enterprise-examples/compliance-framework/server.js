const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3010;

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

// Compliance Framework Configuration
const complianceConfig = {
    frameworks: {
        'GDPR': {
            name: 'General Data Protection Regulation',
            description: 'EU data protection regulation',
            version: '2018',
            requirements: {
                'Data-Encryption': {
                    name: 'Data Encryption',
                    description: 'Personal data must be encrypted in transit and at rest',
                    level: 'MANDATORY',
                    controls: [
                        'Encrypt data in transit using TLS 1.2+',
                        'Encrypt data at rest using AES-256',
                        'Implement key management system',
                        'Regular key rotation'
                    ],
                    evidence: ['Encryption certificates', 'Key management logs', 'Encryption test results']
                },
                'Access-Control': {
                    name: 'Access Control',
                    description: 'Implement appropriate access controls for personal data',
                    level: 'MANDATORY',
                    controls: [
                        'Role-based access control (RBAC)',
                        'Principle of least privilege',
                        'Multi-factor authentication',
                        'Regular access reviews'
                    ],
                    evidence: ['Access control policies', 'User access logs', 'Access review reports']
                },
                'Audit-Logging': {
                    name: 'Audit Logging',
                    description: 'Comprehensive audit logging of data processing activities',
                    level: 'MANDATORY',
                    controls: [
                        'Log all data access events',
                        'Log data modification events',
                        'Log data deletion events',
                        'Secure log storage and retention'
                    ],
                    evidence: ['Audit log samples', 'Log retention policies', 'Log analysis reports']
                },
                'Data-Retention': {
                    name: 'Data Retention',
                    description: 'Implement data retention and deletion policies',
                    level: 'MANDATORY',
                    controls: [
                        'Define data retention periods',
                        'Implement automated data deletion',
                        'Document data retention policies',
                        'Regular data purging'
                    ],
                    evidence: ['Data retention policies', 'Deletion logs', 'Retention schedules']
                },
                'Privacy-By-Design': {
                    name: 'Privacy by Design',
                    description: 'Integrate privacy considerations into system design',
                    level: 'MANDATORY',
                    controls: [
                        'Privacy impact assessments',
                        'Data minimization',
                        'Purpose limitation',
                        'Transparency and consent'
                    ],
                    evidence: ['Privacy impact assessments', 'Data flow diagrams', 'Consent mechanisms']
                }
            }
        },
        'HIPAA': {
            name: 'Health Insurance Portability and Accountability Act',
            description: 'US healthcare data protection',
            version: '1996',
            requirements: {
                'Data-Encryption': {
                    name: 'Data Encryption',
                    description: 'Encrypt protected health information (PHI)',
                    level: 'MANDATORY',
                    controls: [
                        'Encrypt PHI in transit',
                        'Encrypt PHI at rest',
                        'Use approved encryption algorithms',
                        'Secure key management'
                    ],
                    evidence: ['Encryption certificates', 'Key management logs', 'Encryption test results']
                },
                'Access-Control': {
                    name: 'Access Control',
                    description: 'Implement access controls for PHI',
                    level: 'MANDATORY',
                    controls: [
                        'Unique user identification',
                        'Emergency access procedures',
                        'Automatic logoff',
                        'Encryption and decryption'
                    ],
                    evidence: ['Access control policies', 'User access logs', 'Emergency access logs']
                },
                'Audit-Logging': {
                    name: 'Audit Logging',
                    description: 'Comprehensive audit logging of PHI access',
                    level: 'MANDATORY',
                    controls: [
                        'Log PHI access events',
                        'Log PHI modification events',
                        'Log PHI disclosure events',
                        'Regular audit log review'
                    ],
                    evidence: ['Audit log samples', 'Log review reports', 'Incident logs']
                },
                'Data-Integrity': {
                    name: 'Data Integrity',
                    description: 'Ensure PHI integrity and prevent unauthorized alterations',
                    level: 'MANDATORY',
                    controls: [
                        'Data integrity checks',
                        'Checksum validation',
                        'Digital signatures',
                        'Regular integrity audits'
                    ],
                    evidence: ['Integrity check logs', 'Checksum reports', 'Digital signature certificates']
                },
                'Administrative-Safeguards': {
                    name: 'Administrative Safeguards',
                    description: 'Administrative policies and procedures for PHI protection',
                    level: 'MANDATORY',
                    controls: [
                        'Security officer designation',
                        'Workforce training',
                        'Information access management',
                        'Security incident procedures'
                    ],
                    evidence: ['Security policies', 'Training records', 'Incident response procedures']
                }
            }
        },
        'SOC2': {
            name: 'Service Organization Control 2',
            description: 'Security, availability, and confidentiality controls',
            version: '2017',
            requirements: {
                'Security': {
                    name: 'Security',
                    description: 'Protect against unauthorized access',
                    level: 'MANDATORY',
                    controls: [
                        'Access control systems',
                        'Network security controls',
                        'Data encryption',
                        'Security monitoring'
                    ],
                    evidence: ['Security policies', 'Access control logs', 'Security monitoring reports']
                },
                'Availability': {
                    name: 'Availability',
                    description: 'Ensure system availability and performance',
                    level: 'MANDATORY',
                    controls: [
                        'System monitoring',
                        'Backup and recovery',
                        'Incident response',
                        'Capacity planning'
                    ],
                    evidence: ['Monitoring reports', 'Backup logs', 'Incident reports', 'Capacity plans']
                },
                'Processing-Integrity': {
                    name: 'Processing Integrity',
                    description: 'Ensure complete, valid, accurate, timely, and authorized processing',
                    level: 'MANDATORY',
                    controls: [
                        'Data validation',
                        'Error handling',
                        'Quality assurance',
                        'Change management'
                    ],
                    evidence: ['Validation logs', 'Error reports', 'QA test results', 'Change logs']
                },
                'Confidentiality': {
                    name: 'Confidentiality',
                    description: 'Protect confidential information',
                    level: 'MANDATORY',
                    controls: [
                        'Data classification',
                        'Access restrictions',
                        'Encryption',
                        'Secure disposal'
                    ],
                    evidence: ['Classification policies', 'Access logs', 'Encryption certificates', 'Disposal logs']
                },
                'Privacy': {
                    name: 'Privacy',
                    description: 'Protect personal information',
                    level: 'MANDATORY',
                    controls: [
                        'Privacy policies',
                        'Consent management',
                        'Data minimization',
                        'Right to deletion'
                    ],
                    evidence: ['Privacy policies', 'Consent records', 'Data minimization logs', 'Deletion logs']
                }
            }
        },
        'PCI-DSS': {
            name: 'Payment Card Industry Data Security Standard',
            description: 'Payment card data protection',
            version: '4.0',
            requirements: {
                'Network-Security': {
                    name: 'Network Security',
                    description: 'Install and maintain network security controls',
                    level: 'MANDATORY',
                    controls: [
                        'Firewall configuration',
                        'Network segmentation',
                        'Intrusion detection',
                        'Regular security testing'
                    ],
                    evidence: ['Firewall rules', 'Network diagrams', 'IDS logs', 'Penetration test reports']
                },
                'Data-Protection': {
                    name: 'Data Protection',
                    description: 'Protect stored cardholder data',
                    level: 'MANDATORY',
                    controls: [
                        'Data encryption',
                        'Key management',
                        'Data masking',
                        'Secure deletion'
                    ],
                    evidence: ['Encryption certificates', 'Key management logs', 'Data masking reports', 'Deletion logs']
                },
                'Vulnerability-Management': {
                    name: 'Vulnerability Management',
                    description: 'Regular vulnerability scanning and patching',
                    level: 'MANDATORY',
                    controls: [
                        'Vulnerability scanning',
                        'Patch management',
                        'Security updates',
                        'Risk assessment'
                    ],
                    evidence: ['Vulnerability scan reports', 'Patch logs', 'Update records', 'Risk assessments']
                },
                'Access-Control': {
                    name: 'Access Control',
                    description: 'Restrict access to cardholder data',
                    level: 'MANDATORY',
                    controls: [
                        'Unique user IDs',
                        'Strong authentication',
                        'Access restrictions',
                        'Regular access reviews'
                    ],
                    evidence: ['User access logs', 'Authentication logs', 'Access review reports', 'Policy documents']
                },
                'Monitoring': {
                    name: 'Monitoring',
                    description: 'Monitor and test networks regularly',
                    level: 'MANDATORY',
                    controls: [
                        'Network monitoring',
                        'Log monitoring',
                        'Security testing',
                        'Incident response'
                    ],
                    evidence: ['Monitoring reports', 'Log analysis', 'Test results', 'Incident reports']
                }
            }
        }
    }
};

// Compliance assessment data structure
let complianceAssessments = new Map();

// Utility functions
function calculateComplianceScore(assessment) {
    const framework = complianceConfig.frameworks[assessment.framework];
    if (!framework) return 0;
    
    const requirements = Object.keys(framework.requirements);
    const totalRequirements = requirements.length;
    let compliantRequirements = 0;
    
    requirements.forEach(req => {
        if (assessment.requirements[req] && assessment.requirements[req].status === 'COMPLIANT') {
            compliantRequirements++;
        }
    });
    
    return Math.round((compliantRequirements / totalRequirements) * 100);
}

function generateComplianceReport(assessment) {
    const framework = complianceConfig.frameworks[assessment.framework];
    const score = calculateComplianceScore(assessment);
    
    const report = {
        assessmentId: assessment.id,
        framework: assessment.framework,
        frameworkName: framework.name,
        score: score,
        status: score >= 80 ? 'COMPLIANT' : score >= 60 ? 'PARTIALLY_COMPLIANT' : 'NON_COMPLIANT',
        requirements: {},
        recommendations: [],
        evidence: {},
        lastUpdated: new Date().toISOString()
    };
    
    // Analyze each requirement
    Object.keys(framework.requirements).forEach(reqKey => {
        const req = framework.requirements[reqKey];
        const reqAssessment = assessment.requirements[reqKey] || { status: 'NOT_ASSESSED' };
        
        report.requirements[reqKey] = {
            name: req.name,
            description: req.description,
            level: req.level,
            status: reqAssessment.status,
            controls: req.controls,
            evidence: reqAssessment.evidence || []
        };
        
        // Generate recommendations for non-compliant requirements
        if (reqAssessment.status !== 'COMPLIANT') {
            report.recommendations.push({
                requirement: reqKey,
                priority: req.level === 'MANDATORY' ? 'HIGH' : 'MEDIUM',
                title: `Address ${req.name}`,
                description: `Implement controls for ${req.name}: ${req.description}`,
                actions: req.controls,
                evidence: req.evidence
            });
        }
    });
    
    return report;
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Compliance Framework',
        version: '2.5.0',
        timestamp: new Date().toISOString()
    });
});

// Get available compliance frameworks
app.get('/api/frameworks', (req, res) => {
    const frameworks = Object.keys(complianceConfig.frameworks).map(key => ({
        id: key,
        name: complianceConfig.frameworks[key].name,
        description: complianceConfig.frameworks[key].description,
        version: complianceConfig.frameworks[key].version,
        requirements: Object.keys(complianceConfig.frameworks[key].requirements).length
    }));
    
    res.json({ frameworks });
});

// Get specific framework details
app.get('/api/frameworks/:frameworkId', (req, res) => {
    const { frameworkId } = req.params;
    const framework = complianceConfig.frameworks[frameworkId];
    
    if (!framework) {
        return res.status(404).json({ error: 'Framework not found' });
    }
    
    res.json({
        id: frameworkId,
        ...framework
    });
});

// Create compliance assessment
app.post('/api/assessments', (req, res) => {
    try {
        const { framework, projectId, projectName, requirements } = req.body;
        
        if (!framework || !complianceConfig.frameworks[framework]) {
            return res.status(400).json({ error: 'Invalid framework specified' });
        }
        
        const assessmentId = uuidv4();
        const assessment = {
            id: assessmentId,
            framework,
            projectId: projectId || uuidv4(),
            projectName: projectName || 'Unnamed Project',
            requirements: requirements || {},
            status: 'IN_PROGRESS',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        complianceAssessments.set(assessmentId, assessment);
        
        res.status(201).json(assessment);
        
    } catch (error) {
        console.error('Error creating assessment:', error);
        res.status(500).json({ error: 'Failed to create assessment', details: error.message });
    }
});

// Get compliance assessment
app.get('/api/assessments/:assessmentId', (req, res) => {
    const { assessmentId } = req.params;
    const assessment = complianceAssessments.get(assessmentId);
    
    if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json(assessment);
});

// Update compliance assessment
app.put('/api/assessments/:assessmentId', (req, res) => {
    try {
        const { assessmentId } = req.params;
        const { requirements, status } = req.body;
        
        const assessment = complianceAssessments.get(assessmentId);
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        
        if (requirements) {
            assessment.requirements = { ...assessment.requirements, ...requirements };
        }
        
        if (status) {
            assessment.status = status;
        }
        
        assessment.updatedAt = new Date().toISOString();
        complianceAssessments.set(assessmentId, assessment);
        
        res.json(assessment);
        
    } catch (error) {
        console.error('Error updating assessment:', error);
        res.status(500).json({ error: 'Failed to update assessment', details: error.message });
    }
});

// Generate compliance report
app.get('/api/assessments/:assessmentId/report', (req, res) => {
    const { assessmentId } = req.params;
    const assessment = complianceAssessments.get(assessmentId);
    
    if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
    }
    
    const report = generateComplianceReport(assessment);
    res.json(report);
});

// Get all assessments
app.get('/api/assessments', (req, res) => {
    const { framework, status, projectId } = req.query;
    
    let assessments = Array.from(complianceAssessments.values());
    
    if (framework) {
        assessments = assessments.filter(a => a.framework === framework);
    }
    
    if (status) {
        assessments = assessments.filter(a => a.status === status);
    }
    
    if (projectId) {
        assessments = assessments.filter(a => a.projectId === projectId);
    }
    
    res.json({ assessments });
});

// Get compliance dashboard data
app.get('/api/dashboard', (req, res) => {
    const assessments = Array.from(complianceAssessments.values());
    
    const dashboard = {
        totalAssessments: assessments.length,
        frameworks: {},
        overallCompliance: 0,
        recentAssessments: assessments
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 10)
    };
    
    // Calculate framework-specific metrics
    Object.keys(complianceConfig.frameworks).forEach(frameworkId => {
        const frameworkAssessments = assessments.filter(a => a.framework === frameworkId);
        const reports = frameworkAssessments.map(a => generateComplianceReport(a));
        
        dashboard.frameworks[frameworkId] = {
            name: complianceConfig.frameworks[frameworkId].name,
            totalAssessments: frameworkAssessments.length,
            averageScore: reports.length > 0 ? 
                Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length) : 0,
            compliantAssessments: reports.filter(r => r.status === 'COMPLIANT').length,
            partiallyCompliantAssessments: reports.filter(r => r.status === 'PARTIALLY_COMPLIANT').length,
            nonCompliantAssessments: reports.filter(r => r.status === 'NON_COMPLIANT').length
        };
    });
    
    // Calculate overall compliance
    const allReports = assessments.map(a => generateComplianceReport(a));
    dashboard.overallCompliance = allReports.length > 0 ? 
        Math.round(allReports.reduce((sum, r) => sum + r.score, 0) / allReports.length) : 0;
    
    res.json(dashboard);
});

// Export compliance data
app.get('/api/export/:format', (req, res) => {
    const { format } = req.params;
    const { framework, assessmentId } = req.query;
    
    let data;
    
    if (assessmentId) {
        const assessment = complianceAssessments.get(assessmentId);
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        data = generateComplianceReport(assessment);
    } else {
        const assessments = Array.from(complianceAssessments.values());
        data = { assessments };
    }
    
    switch (format.toLowerCase()) {
        case 'json':
            res.json(data);
            break;
        case 'csv':
            // Convert to CSV format (simplified)
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="compliance-export.csv"');
            res.send('Assessment ID,Framework,Project Name,Status,Score\n' +
                Object.values(data.assessments || [data]).map(a => 
                    `${a.id || data.assessmentId},${a.framework || data.framework},${a.projectName || 'N/A'},${a.status || 'N/A'},${calculateComplianceScore(a) || data.score}`
                ).join('\n'));
            break;
        default:
            res.status(400).json({ error: 'Unsupported export format' });
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
    console.log(`🏢 Compliance Framework running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/frameworks`);
});

module.exports = app;
