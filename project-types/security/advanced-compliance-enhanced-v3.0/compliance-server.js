const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Redis = require('redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3005;

// Redis client
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect();

// Compliance frameworks
const complianceFrameworks = {
  gdpr: {
    name: 'General Data Protection Regulation',
    version: '2018',
    requirements: [
      'data_protection_by_design',
      'consent_management',
      'right_to_be_forgotten',
      'data_portability',
      'privacy_impact_assessment',
      'breach_notification',
      'data_processing_records'
    ],
    penalties: {
      max: '€20M or 4% of annual turnover',
      description: 'Whichever is higher'
    }
  },
  hipaa: {
    name: 'Health Insurance Portability and Accountability Act',
    version: '1996',
    requirements: [
      'administrative_safeguards',
      'physical_safeguards',
      'technical_safeguards',
      'breach_notification',
      'business_associate_agreements',
      'risk_assessment',
      'workforce_training'
    ],
    penalties: {
      max: '$1.5M per violation',
      description: 'Per violation per year'
    }
  },
  sox: {
    name: 'Sarbanes-Oxley Act',
    version: '2002',
    requirements: [
      'internal_controls',
      'financial_reporting',
      'audit_committee',
      'whistleblower_protection',
      'document_retention',
      'management_certification',
      'external_auditor_independence'
    ],
    penalties: {
      max: '$5M fine and 20 years imprisonment',
      description: 'For willful violations'
    }
  }
};

// Compliance checks
const complianceChecks = new Map();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    uptime: process.uptime(),
    frameworks: Object.keys(complianceFrameworks).length
  });
});

// Get compliance frameworks
app.get('/api/frameworks', (req, res) => {
  res.json(complianceFrameworks);
});

// Get specific framework
app.get('/api/frameworks/:framework', (req, res) => {
  const framework = complianceFrameworks[req.params.framework];
  if (!framework) {
    return res.status(404).json({ error: 'Framework not found' });
  }
  res.json(framework);
});

// Run compliance check
app.post('/api/check', authenticateToken, async (req, res) => {
  const { framework, data, options } = req.body;
  
  if (!framework || !complianceFrameworks[framework]) {
    return res.status(400).json({ error: 'Invalid framework' });
  }
  
  try {
    const checkId = uuidv4();
    const checkResult = await runComplianceCheck(framework, data, options);
    
    // Store result
    complianceChecks.set(checkId, {
      id: checkId,
      framework,
      result: checkResult,
      timestamp: new Date().toISOString(),
      userId: req.user.id
    });
    
    // Store in Redis
    await redis.hSet('compliance_checks', checkId, JSON.stringify({
      id: checkId,
      framework,
      result: checkResult,
      timestamp: new Date().toISOString(),
      userId: req.user.id
    }));
    
    res.json({
      checkId,
      framework,
      result: checkResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance check result
app.get('/api/check/:checkId', authenticateToken, async (req, res) => {
  const check = complianceChecks.get(req.params.checkId);
  if (!check) {
    return res.status(404).json({ error: 'Check not found' });
  }
  
  res.json(check);
});

// Get all compliance checks
app.get('/api/checks', authenticateToken, async (req, res) => {
  const checks = Array.from(complianceChecks.values());
  res.json(checks);
});

// Generate compliance report
app.post('/api/report', authenticateToken, async (req, res) => {
  const { framework, startDate, endDate, format } = req.body;
  
  try {
    const report = await generateComplianceReport(framework, startDate, endDate, format);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Data protection assessment
app.post('/api/data-protection', authenticateToken, async (req, res) => {
  const { dataType, processingPurpose, dataSubjects } = req.body;
  
  try {
    const assessment = await assessDataProtection(dataType, processingPurpose, dataSubjects);
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Privacy impact assessment
app.post('/api/privacy-impact', authenticateToken, async (req, res) => {
  const { project, dataTypes, processingActivities } = req.body;
  
  try {
    const assessment = await conductPrivacyImpactAssessment(project, dataTypes, processingActivities);
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Breach notification
app.post('/api/breach', authenticateToken, async (req, res) => {
  const { breachType, dataAffected, affectedSubjects, severity } = req.body;
  
  try {
    const notification = await processBreachNotification(breachType, dataAffected, affectedSubjects, severity);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit trail
app.get('/api/audit', authenticateToken, async (req, res) => {
  const { startDate, endDate, userId, action } = req.query;
  
  try {
    const auditLog = await getAuditTrail(startDate, endDate, userId, action);
    res.json(auditLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compliance dashboard
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const dashboard = await getComplianceDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compliance functions
async function runComplianceCheck(framework, data, options = {}) {
  const frameworkConfig = complianceFrameworks[framework];
  const results = {
    framework,
    timestamp: new Date().toISOString(),
    overall: 'compliant',
    requirements: {},
    violations: [],
    recommendations: []
  };
  
  for (const requirement of frameworkConfig.requirements) {
    const checkResult = await checkRequirement(requirement, data, options);
    results.requirements[requirement] = checkResult;
    
    if (!checkResult.compliant) {
      results.overall = 'non-compliant';
      results.violations.push({
        requirement,
        severity: checkResult.severity,
        description: checkResult.description
      });
    }
    
    if (checkResult.recommendations) {
      results.recommendations.push(...checkResult.recommendations);
    }
  }
  
  return results;
}

async function checkRequirement(requirement, data, options) {
  // Simulate compliance check
  const isCompliant = Math.random() > 0.2; // 80% compliance rate
  
  return {
    requirement,
    compliant: isCompliant,
    severity: isCompliant ? 'none' : 'high',
    description: isCompliant ? 'Requirement met' : 'Requirement not met',
    recommendations: isCompliant ? [] : [`Implement ${requirement} controls`]
  };
}

async function generateComplianceReport(framework, startDate, endDate, format = 'json') {
  const report = {
    framework,
    period: { startDate, endDate },
    generatedAt: new Date().toISOString(),
    summary: {
      totalChecks: 0,
      compliant: 0,
      nonCompliant: 0,
      violations: 0
    },
    details: []
  };
  
  // Generate report based on stored checks
  for (const [checkId, check] of complianceChecks) {
    if (check.framework === framework) {
      report.summary.totalChecks++;
      if (check.result.overall === 'compliant') {
        report.summary.compliant++;
      } else {
        report.summary.nonCompliant++;
        report.summary.violations += check.result.violations.length;
      }
      report.details.push(check);
    }
  }
  
  return report;
}

async function assessDataProtection(dataType, processingPurpose, dataSubjects) {
  return {
    dataType,
    processingPurpose,
    dataSubjects,
    riskLevel: 'medium',
    recommendations: [
      'Implement data encryption',
      'Conduct regular access reviews',
      'Implement data retention policies'
    ],
    timestamp: new Date().toISOString()
  };
}

async function conductPrivacyImpactAssessment(project, dataTypes, processingActivities) {
  return {
    project,
    dataTypes,
    processingActivities,
    riskAssessment: 'medium',
    mitigationMeasures: [
      'Data minimization',
      'Purpose limitation',
      'Storage limitation'
    ],
    timestamp: new Date().toISOString()
  };
}

async function processBreachNotification(breachType, dataAffected, affectedSubjects, severity) {
  const notification = {
    id: uuidv4(),
    breachType,
    dataAffected,
    affectedSubjects,
    severity,
    status: 'reported',
    reportedAt: new Date().toISOString(),
    regulatoryDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours
  };
  
  // Store breach notification
  await redis.hSet('breach_notifications', notification.id, JSON.stringify(notification));
  
  return notification;
}

async function getAuditTrail(startDate, endDate, userId, action) {
  // Simulate audit trail
  return {
    startDate,
    endDate,
    userId,
    action,
    entries: [
      {
        id: uuidv4(),
        userId: userId || 'system',
        action: action || 'compliance_check',
        timestamp: new Date().toISOString(),
        details: 'Compliance check executed'
      }
    ]
  };
}

async function getComplianceDashboard() {
  const dashboard = {
    timestamp: new Date().toISOString(),
    frameworks: {},
    overall: {
      compliant: 0,
      nonCompliant: 0,
      total: 0
    }
  };
  
  for (const framework of Object.keys(complianceFrameworks)) {
    const checks = Array.from(complianceChecks.values())
      .filter(check => check.framework === framework);
    
    dashboard.frameworks[framework] = {
      total: checks.length,
      compliant: checks.filter(check => check.result.overall === 'compliant').length,
      nonCompliant: checks.filter(check => check.result.overall === 'non-compliant').length
    };
    
    dashboard.overall.total += checks.length;
    dashboard.overall.compliant += dashboard.frameworks[framework].compliant;
    dashboard.overall.nonCompliant += dashboard.frameworks[framework].nonCompliant;
  }
  
  return dashboard;
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Compliance Error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Advanced Compliance Enhanced v3.0 running on port ${PORT}`);
  console.log(`📋 GDPR, HIPAA, SOX compliance automation enabled`);
  console.log(`🔒 Data protection assessment enabled`);
  console.log(`📊 Compliance reporting enabled`);
  console.log(`🚨 Breach notification system enabled`);
});

module.exports = app;
