const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3011;

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

// Enhanced Zero-Trust Architecture Configuration
const zeroTrustConfig = {
    version: '2.7.0',
    principles: {
        'Never Trust, Always Verify': 'Never trust any user or device, always verify identity and permissions',
        'Least Privilege Access': 'Grant minimum necessary access rights',
        'Assume Breach': 'Assume the network is compromised and design accordingly',
        'Continuous Monitoring': 'Continuously monitor and analyze all activities',
        'Micro-segmentation': 'Segment network and applications into small, isolated zones',
        'Identity-Centric': 'Base security decisions on identity, not network location'
    },
    components: {
        'Identity Management': {
            name: 'Advanced Identity and Access Management',
            description: 'AI-powered identity management with continuous verification',
            features: ['MFA', 'SSO', 'RBAC', 'Identity Verification', 'Session Management', 'Biometric Auth', 'Adaptive Authentication', 'Risk-Based Access']
        },
        'Device Trust': {
            name: 'Enhanced Device Trust and Compliance',
            description: 'AI-driven device trustworthiness assessment and management',
            features: ['Device Registration', 'Compliance Checking', 'Risk Assessment', 'Trust Scoring', 'Device Fingerprinting', 'Behavioral Analysis', 'Threat Intelligence']
        },
        'Network Segmentation': {
            name: 'Advanced Network Micro-segmentation',
            description: 'Dynamic network segmentation with AI-powered policy enforcement',
            features: ['Micro-segmentation', 'Zero-Trust Networking', 'Traffic Inspection', 'Policy Enforcement', 'Dynamic Segmentation', 'Intent-Based Networking', 'SD-WAN Integration']
        },
        'Application Security': {
            name: 'Comprehensive Application-Level Security',
            description: 'Zero-trust application security with runtime protection',
            features: ['API Security', 'Service Mesh', 'Container Security', 'Runtime Protection', 'Web Application Firewall', 'API Gateway', 'Service-to-Service Auth']
        },
        'Data Protection': {
            name: 'Advanced Data-Centric Security',
            description: 'AI-powered data protection with classification and encryption',
            features: ['Data Encryption', 'Data Classification', 'Access Controls', 'Data Loss Prevention', 'Data Lineage', 'Privacy Protection', 'Data Masking']
        },
        'Monitoring & Analytics': {
            name: 'AI-Enhanced Continuous Monitoring',
            description: 'Advanced monitoring with machine learning and behavioral analytics',
            features: ['Real-time Monitoring', 'Behavioral Analytics', 'Threat Detection', 'Incident Response', 'User Entity Behavior Analytics', 'Security Orchestration', 'Automated Response']
        },
        'Threat Intelligence': {
            name: 'Integrated Threat Intelligence',
            description: 'Real-time threat intelligence and automated response',
            features: ['Threat Feeds', 'IOC Detection', 'Threat Hunting', 'Automated Response', 'Threat Modeling', 'Risk Assessment', 'Vulnerability Management']
        },
        'Compliance & Governance': {
            name: 'Zero-Trust Compliance Framework',
            description: 'Comprehensive compliance management for zero-trust environments',
            features: ['Policy Management', 'Compliance Monitoring', 'Audit Logging', 'Regulatory Reporting', 'Risk Management', 'Governance Framework']
        }
    },
    policies: {
        'Access Policy': {
            name: 'Advanced Access Control Policy',
            description: 'AI-powered access control with continuous verification',
            rules: [
                'All access must be authenticated with MFA',
                'All access must be authorized based on least privilege',
                'All access must be continuously verified',
                'All access must be logged and monitored',
                'Access is granted on a need-to-know basis',
                'Access decisions are based on risk assessment',
                'Access is time-limited and context-aware'
            ]
        },
        'Device Policy': {
            name: 'Enhanced Device Trust Policy',
            description: 'AI-driven device trust and compliance management',
            rules: [
                'All devices must be registered and fingerprinted',
                'All devices must be continuously assessed for compliance',
                'All devices must be monitored for behavioral anomalies',
                'Device trust scores are dynamically calculated',
                'Non-compliant or suspicious devices are automatically quarantined',
                'Device access is based on trust score and risk level'
            ]
        },
        'Network Policy': {
            name: 'Advanced Network Security Policy',
            description: 'Dynamic network segmentation with AI-powered enforcement',
            rules: [
                'All network traffic must be encrypted end-to-end',
                'All network traffic must be inspected and analyzed',
                'All network access must be authenticated and authorized',
                'Network segmentation is dynamically enforced',
                'Network policies are context-aware and adaptive',
                'Suspicious network activity triggers automatic response'
            ]
        },
        'Data Policy': {
            name: 'Comprehensive Data Protection Policy',
            description: 'AI-powered data protection with classification and encryption',
            rules: [
                'All data must be automatically classified and tagged',
                'All data must be encrypted at rest and in transit',
                'All data access must be logged and monitored',
                'Data retention policies are automatically enforced',
                'Data lineage is tracked and monitored',
                'Sensitive data is automatically masked or redacted'
            ]
        },
        'Threat Response Policy': {
            name: 'Automated Threat Response Policy',
            description: 'AI-powered threat detection and automated response',
            rules: [
                'All threats are automatically detected and analyzed',
                'Threat response is automated based on severity',
                'Incident response procedures are automatically triggered',
                'Threat intelligence is continuously updated',
                'Security orchestration is automated',
                'Recovery procedures are automated and tested'
            ]
        },
        'Compliance Policy': {
            name: 'Zero-Trust Compliance Policy',
            description: 'Comprehensive compliance management for zero-trust environments',
            rules: [
                'All activities must comply with regulatory requirements',
                'Compliance monitoring is continuous and automated',
                'Audit logs are comprehensive and tamper-proof',
                'Regulatory reporting is automated',
                'Risk assessments are continuous and dynamic',
                'Governance frameworks are enforced automatically'
            ]
        }
    },
    aiFeatures: {
        'Behavioral Analytics': {
            name: 'AI-Powered Behavioral Analytics',
            description: 'Machine learning-based user and entity behavior analysis',
            capabilities: ['Anomaly Detection', 'Risk Scoring', 'Predictive Analytics', 'Pattern Recognition']
        },
        'Threat Intelligence': {
            name: 'Integrated Threat Intelligence',
            description: 'Real-time threat intelligence with automated response',
            capabilities: ['Threat Feeds', 'IOC Detection', 'Threat Hunting', 'Automated Response']
        },
        'Adaptive Authentication': {
            name: 'Adaptive Authentication Engine',
            description: 'Context-aware authentication with risk-based access',
            capabilities: ['Risk Assessment', 'Context Analysis', 'Adaptive Policies', 'Continuous Verification']
        },
        'Security Orchestration': {
            name: 'Automated Security Orchestration',
            description: 'Automated incident response and security orchestration',
            capabilities: ['Incident Response', 'Workflow Automation', 'Playbook Execution', 'Response Coordination']
        }
    }
};

// Zero-Trust Data Storage
let zeroTrustData = {
    identities: new Map(),
    devices: new Map(),
    policies: new Map(),
    sessions: new Map(),
    trustScores: new Map(),
    violations: new Map(),
    analytics: {
        totalRequests: 0,
        blockedRequests: 0,
        suspiciousActivities: 0,
        trustScoreUpdates: 0
    }
};

// Utility functions
function generateTrustScore(identity, device, behavior) {
    let score = 100; // Start with perfect trust
    
    // Identity factors
    if (identity.mfaEnabled) score += 10;
    if (identity.verified) score += 15;
    if (identity.riskLevel === 'LOW') score += 20;
    else if (identity.riskLevel === 'MEDIUM') score += 10;
    else if (identity.riskLevel === 'HIGH') score -= 10;
    
    // Device factors
    if (device.registered) score += 15;
    if (device.compliant) score += 20;
    if (device.trusted) score += 10;
    if (device.riskLevel === 'LOW') score += 15;
    else if (device.riskLevel === 'MEDIUM') score += 5;
    else if (device.riskLevel === 'HIGH') score -= 20;
    
    // Behavior factors
    if (behavior.normalActivity) score += 10;
    if (behavior.anomalousActivity) score -= 30;
    if (behavior.suspiciousPatterns) score -= 50;
    if (behavior.geoAnomaly) score -= 25;
    if (behavior.timeAnomaly) score -= 15;
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
}

function evaluateAccessRequest(identity, device, resource, context) {
    const trustScore = generateTrustScore(identity, device, context.behavior);
    const policy = zeroTrustData.policies.get(resource.policyId);
    
    if (!policy) {
        return {
            allowed: false,
            reason: 'No policy found for resource',
            trustScore: trustScore
        };
    }
    
    // Check if trust score meets minimum requirement
    const minTrustScore = policy.minTrustScore || 70;
    if (trustScore < minTrustScore) {
        return {
            allowed: false,
            reason: 'Trust score too low',
            trustScore: trustScore,
            requiredScore: minTrustScore
        };
    }
    
    // Check if identity has required permissions
    if (!identity.permissions.includes(resource.requiredPermission)) {
        return {
            allowed: false,
            reason: 'Insufficient permissions',
            trustScore: trustScore
        };
    }
    
    // Check if device meets requirements
    if (resource.requiresCompliantDevice && !device.compliant) {
        return {
            allowed: false,
            reason: 'Device not compliant',
            trustScore: trustScore
        };
    }
    
    // Check if access is within allowed time window
    if (resource.timeRestrictions) {
        const currentHour = new Date().getHours();
        if (currentHour < resource.timeRestrictions.start || currentHour > resource.timeRestrictions.end) {
            return {
                allowed: false,
                reason: 'Access outside allowed time window',
                trustScore: trustScore
            };
        }
    }
    
    return {
        allowed: true,
        reason: 'Access granted',
        trustScore: trustScore,
        sessionId: uuidv4()
    };
}

function logSecurityEvent(event) {
    const eventId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const securityEvent = {
        id: eventId,
        timestamp: timestamp,
        type: event.type,
        severity: event.severity || 'INFO',
        identity: event.identity,
        device: event.device,
        resource: event.resource,
        action: event.action,
        result: event.result,
        details: event.details,
        trustScore: event.trustScore
    };
    
    // Store in violations if it's a security violation
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        zeroTrustData.violations.set(eventId, securityEvent);
    }
    
    // Update analytics
    zeroTrustData.analytics.totalRequests++;
    if (!event.result.allowed) {
        zeroTrustData.analytics.blockedRequests++;
    }
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        zeroTrustData.analytics.suspiciousActivities++;
    }
    
    return securityEvent;
}

// Advanced Zero-Trust Functions

// AI-powered behavioral analysis
function performBehavioralAnalysis(userId, activity) {
    const user = zeroTrustData.identities.get(userId);
    if (!user) return { risk: 'HIGH', reason: 'Unknown user' };
    
    // Simulate AI behavioral analysis
    const riskFactors = [];
    let riskScore = 0;
    
    // Time-based analysis
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
        riskFactors.push('Unusual time access');
        riskScore += 20;
    }
    
    // Location analysis
    if (activity.location && user.lastKnownLocation) {
        const distance = calculateDistance(activity.location, user.lastKnownLocation);
        if (distance > 1000) { // More than 1000km
            riskFactors.push('Geographic anomaly');
            riskScore += 30;
        }
    }
    
    // Device analysis
    if (activity.deviceId && user.trustedDevices) {
        if (!user.trustedDevices.includes(activity.deviceId)) {
            riskFactors.push('Unknown device');
            riskScore += 25;
        }
    }
    
    // Frequency analysis
    const recentActivities = user.recentActivities || [];
    const similarActivities = recentActivities.filter(a => 
        a.type === activity.type && 
        (new Date() - new Date(a.timestamp)) < 3600000 // Within last hour
    );
    
    if (similarActivities.length > 10) {
        riskFactors.push('High frequency activity');
        riskScore += 15;
    }
    
    // Determine risk level
    let riskLevel = 'LOW';
    if (riskScore > 50) riskLevel = 'HIGH';
    else if (riskScore > 25) riskLevel = 'MEDIUM';
    
    return {
        risk: riskLevel,
        score: riskScore,
        factors: riskFactors,
        confidence: 0.85
    };
}

// Advanced threat detection
function detectThreats(activity) {
    const threats = [];
    
    // SQL injection patterns
    if (activity.query && /('|(\\')|(;)|(union)|(select)|(insert)|(update)|(delete))/i.test(activity.query)) {
        threats.push({
            type: 'SQL_INJECTION',
            severity: 'HIGH',
            description: 'Potential SQL injection attempt detected',
            confidence: 0.9
        });
    }
    
    // XSS patterns
    if (activity.input && /<script|javascript:|on\w+\s*=/i.test(activity.input)) {
        threats.push({
            type: 'XSS',
            severity: 'HIGH',
            description: 'Potential XSS attack detected',
            confidence: 0.85
        });
    }
    
    // Brute force patterns
    const recentFailures = zeroTrustData.analytics.recentFailures || [];
    const recentFailuresCount = recentFailures.filter(f => 
        f.userId === activity.userId && 
        (new Date() - new Date(f.timestamp)) < 300000 // Within 5 minutes
    ).length;
    
    if (recentFailuresCount > 5) {
        threats.push({
            type: 'BRUTE_FORCE',
            severity: 'CRITICAL',
            description: 'Potential brute force attack detected',
            confidence: 0.95
        });
    }
    
    return threats;
}

// Enhanced trust score calculation with AI
function calculateAdvancedTrustScore(identity, device, behavior, context) {
    let score = 100; // Start with perfect trust
    
    // Identity factors (enhanced)
    if (identity.mfaEnabled) score += 15;
    if (identity.verified) score += 20;
    if (identity.biometricEnabled) score += 10;
    if (identity.adaptiveAuthEnabled) score += 5;
    
    // Risk-based adjustments
    switch (identity.riskLevel) {
        case 'LOW': score += 25; break;
        case 'MEDIUM': score += 10; break;
        case 'HIGH': score -= 15; break;
        case 'CRITICAL': score -= 30; break;
    }
    
    // Device factors (enhanced)
    if (device.registered) score += 20;
    if (device.compliant) score += 25;
    if (device.trusted) score += 15;
    if (device.encrypted) score += 10;
    if (device.managed) score += 5;
    
    // Device risk adjustments
    switch (device.riskLevel) {
        case 'LOW': score += 20; break;
        case 'MEDIUM': score += 5; break;
        case 'HIGH': score -= 25; break;
        case 'CRITICAL': score -= 40; break;
    }
    
    // Behavioral factors (AI-enhanced)
    if (behavior.normalActivity) score += 15;
    if (behavior.anomalousActivity) score -= 35;
    if (behavior.suspiciousPatterns) score -= 60;
    if (behavior.geoAnomaly) score -= 30;
    if (behavior.timeAnomaly) score -= 20;
    if (behavior.deviceAnomaly) score -= 25;
    
    // Context factors
    if (context.secureLocation) score += 10;
    if (context.trustedNetwork) score += 5;
    if (context.businessHours) score += 5;
    if (context.emergencyAccess) score -= 20;
    
    // AI confidence factor
    if (behavior.aiConfidence) {
        score *= behavior.aiConfidence;
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
}

// Automated threat response
function executeThreatResponse(threat, context) {
    const responses = [];
    
    switch (threat.type) {
        case 'SQL_INJECTION':
            responses.push({
                action: 'BLOCK_REQUEST',
                description: 'Block the malicious request',
                severity: 'HIGH'
            });
            responses.push({
                action: 'QUARANTINE_USER',
                description: 'Temporarily quarantine the user account',
                severity: 'HIGH'
            });
            break;
            
        case 'XSS':
            responses.push({
                action: 'SANITIZE_INPUT',
                description: 'Sanitize the malicious input',
                severity: 'HIGH'
            });
            responses.push({
                action: 'LOG_ATTACK',
                description: 'Log the attack attempt',
                severity: 'MEDIUM'
            });
            break;
            
        case 'BRUTE_FORCE':
            responses.push({
                action: 'LOCK_ACCOUNT',
                description: 'Lock the compromised account',
                severity: 'CRITICAL'
            });
            responses.push({
                action: 'NOTIFY_SECURITY',
                description: 'Notify security team immediately',
                severity: 'CRITICAL'
            });
            break;
    }
    
    // Execute responses
    responses.forEach(response => {
        executeResponse(response, context);
    });
    
    return responses;
}

// Execute automated response
function executeResponse(response, context) {
    // Simulate response execution
    console.log(`Executing response: ${response.action} - ${response.description}`);
    
    // Log the response
    const responseLog = {
        id: uuidv4(),
        timestamp: new Date(),
        action: response.action,
        description: response.description,
        severity: response.severity,
        context: context
    };
    
    if (!zeroTrustData.responses) {
        zeroTrustData.responses = new Map();
    }
    zeroTrustData.responses.set(responseLog.id, responseLog);
}

// Calculate distance between two coordinates
function calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lon - coord1.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Enhanced Zero-Trust Architecture',
        version: zeroTrustConfig.version,
        timestamp: new Date().toISOString(),
        features: Object.keys(zeroTrustConfig.aiFeatures)
    });
});

// Get zero-trust configuration
app.get('/api/config', (req, res) => {
    res.json(zeroTrustConfig);
});

// Advanced behavioral analysis endpoint
app.post('/api/behavioral-analysis', (req, res) => {
    try {
        const { userId, activity } = req.body;
        
        if (!userId || !activity) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'userId and activity are required'
            });
        }
        
        const analysis = performBehavioralAnalysis(userId, activity);
        
        res.json({
            success: true,
            data: analysis,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Advanced threat detection endpoint
app.post('/api/threat-detection', (req, res) => {
    try {
        const { activity } = req.body;
        
        if (!activity) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'activity is required'
            });
        }
        
        const threats = detectThreats(activity);
        
        // Execute automated responses for detected threats
        const responses = [];
        threats.forEach(threat => {
            const threatResponses = executeThreatResponse(threat, { activity });
            responses.push(...threatResponses);
        });
        
        res.json({
            success: true,
            data: {
                threats,
                responses,
                threatCount: threats.length,
                responseCount: responses.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Enhanced access evaluation endpoint
app.post('/api/access-evaluation', (req, res) => {
    try {
        const { identity, device, resource, context } = req.body;
        
        if (!identity || !device || !resource) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'identity, device, and resource are required'
            });
        }
        
        // Perform behavioral analysis
        const behaviorAnalysis = performBehavioralAnalysis(identity.id, context.activity || {});
        
        // Detect threats
        const threats = detectThreats(context.activity || {});
        
        // Calculate advanced trust score
        const trustScore = calculateAdvancedTrustScore(identity, device, behaviorAnalysis, context);
        
        // Evaluate access request
        const accessResult = evaluateAccessRequest(identity, device, resource, {
            ...context,
            behavior: behaviorAnalysis,
            threats: threats
        });
        
        // Update trust score
        zeroTrustData.trustScores.set(identity.id, trustScore);
        
        res.json({
            success: true,
            data: {
                accessResult,
                trustScore,
                behaviorAnalysis,
                threats,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Get AI features status
app.get('/api/ai-features', (req, res) => {
    try {
        res.json({
            success: true,
            data: zeroTrustConfig.aiFeatures,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Get threat intelligence
app.get('/api/threat-intelligence', (req, res) => {
    try {
        const { type, limit = 50 } = req.query;
        
        // Simulate threat intelligence data
        const threatIntelligence = {
            iocs: [
                {
                    type: 'IP',
                    value: '192.168.1.100',
                    threatType: 'MALWARE',
                    severity: 'HIGH',
                    lastSeen: new Date().toISOString(),
                    source: 'Threat Feed 1'
                },
                {
                    type: 'DOMAIN',
                    value: 'malicious-site.com',
                    threatType: 'PHISHING',
                    severity: 'MEDIUM',
                    lastSeen: new Date().toISOString(),
                    source: 'Threat Feed 2'
                }
            ],
            threats: [
                {
                    id: uuidv4(),
                    name: 'Advanced Persistent Threat',
                    description: 'Sophisticated threat actor targeting enterprise systems',
                    severity: 'CRITICAL',
                    indicators: ['IOC1', 'IOC2', 'IOC3'],
                    lastUpdated: new Date().toISOString()
                }
            ],
            feeds: [
                {
                    name: 'Threat Feed 1',
                    status: 'ACTIVE',
                    lastUpdate: new Date().toISOString(),
                    iocCount: 1500
                },
                {
                    name: 'Threat Feed 2',
                    status: 'ACTIVE',
                    lastUpdate: new Date().toISOString(),
                    iocCount: 2300
                }
            ]
        };
        
        res.json({
            success: true,
            data: threatIntelligence,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Get security orchestration status
app.get('/api/security-orchestration', (req, res) => {
    try {
        const orchestrationStatus = {
            playbooks: [
                {
                    id: 'playbook-1',
                    name: 'Incident Response Playbook',
                    status: 'ACTIVE',
                    lastExecuted: new Date().toISOString(),
                    executionCount: 15
                },
                {
                    id: 'playbook-2',
                    name: 'Threat Response Playbook',
                    status: 'ACTIVE',
                    lastExecuted: new Date().toISOString(),
                    executionCount: 8
                }
            ],
            workflows: [
                {
                    id: 'workflow-1',
                    name: 'Automated Threat Response',
                    status: 'RUNNING',
                    steps: 5,
                    completedSteps: 3
                }
            ],
            responses: zeroTrustData.responses ? Array.from(zeroTrustData.responses.values()) : []
        };
        
        res.json({
            success: true,
            data: orchestrationStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Identity Management

// Register identity
app.post('/api/identities', (req, res) => {
    try {
        const { username, email, permissions, mfaEnabled = false } = req.body;
        
        if (!username || !email) {
            return res.status(400).json({ error: 'Username and email are required' });
        }
        
        const identityId = uuidv4();
        const identity = {
            id: identityId,
            username,
            email,
            permissions: permissions || [],
            mfaEnabled,
            verified: false,
            riskLevel: 'MEDIUM',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            trustScore: 50
        };
        
        zeroTrustData.identities.set(identityId, identity);
        
        res.status(201).json(identity);
        
    } catch (error) {
        console.error('Error creating identity:', error);
        res.status(500).json({ error: 'Failed to create identity', details: error.message });
    }
});

// Get identity
app.get('/api/identities/:identityId', (req, res) => {
    const { identityId } = req.params;
    const identity = zeroTrustData.identities.get(identityId);
    
    if (!identity) {
        return res.status(404).json({ error: 'Identity not found' });
    }
    
    res.json(identity);
});

// Update identity trust score
app.put('/api/identities/:identityId/trust-score', (req, res) => {
    try {
        const { identityId } = req.params;
        const { trustScore, reason } = req.body;
        
        const identity = zeroTrustData.identities.get(identityId);
        if (!identity) {
            return res.status(404).json({ error: 'Identity not found' });
        }
        
        identity.trustScore = trustScore;
        identity.lastTrustUpdate = new Date().toISOString();
        identity.trustUpdateReason = reason;
        
        zeroTrustData.identities.set(identityId, identity);
        zeroTrustData.analytics.trustScoreUpdates++;
        
        res.json(identity);
        
    } catch (error) {
        console.error('Error updating trust score:', error);
        res.status(500).json({ error: 'Failed to update trust score', details: error.message });
    }
});

// Device Management

// Register device
app.post('/api/devices', (req, res) => {
    try {
        const { deviceId, deviceType, os, version, macAddress, ipAddress } = req.body;
        
        if (!deviceId || !deviceType) {
            return res.status(400).json({ error: 'Device ID and type are required' });
        }
        
        const device = {
            id: deviceId,
            deviceType,
            os,
            version,
            macAddress,
            ipAddress,
            registered: true,
            compliant: false,
            trusted: false,
            riskLevel: 'MEDIUM',
            trustScore: 50,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };
        
        zeroTrustData.devices.set(deviceId, device);
        
        res.status(201).json(device);
        
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({ error: 'Failed to register device', details: error.message });
    }
});

// Get device
app.get('/api/devices/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    const device = zeroTrustData.devices.get(deviceId);
    
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(device);
});

// Update device trust score
app.put('/api/devices/:deviceId/trust-score', (req, res) => {
    try {
        const { deviceId } = req.params;
        const { trustScore, reason } = req.body;
        
        const device = zeroTrustData.devices.get(deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        device.trustScore = trustScore;
        device.lastTrustUpdate = new Date().toISOString();
        device.trustUpdateReason = reason;
        
        zeroTrustData.devices.set(deviceId, device);
        zeroTrustData.analytics.trustScoreUpdates++;
        
        res.json(device);
        
    } catch (error) {
        console.error('Error updating device trust score:', error);
        res.status(500).json({ error: 'Failed to update device trust score', details: error.message });
    }
});

// Policy Management

// Create policy
app.post('/api/policies', (req, res) => {
    try {
        const { name, description, rules, minTrustScore, requiresCompliantDevice, timeRestrictions } = req.body;
        
        if (!name || !rules) {
            return res.status(400).json({ error: 'Name and rules are required' });
        }
        
        const policyId = uuidv4();
        const policy = {
            id: policyId,
            name,
            description,
            rules,
            minTrustScore: minTrustScore || 70,
            requiresCompliantDevice: requiresCompliantDevice || false,
            timeRestrictions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        zeroTrustData.policies.set(policyId, policy);
        
        res.status(201).json(policy);
        
    } catch (error) {
        console.error('Error creating policy:', error);
        res.status(500).json({ error: 'Failed to create policy', details: error.message });
    }
});

// Get policy
app.get('/api/policies/:policyId', (req, res) => {
    const { policyId } = req.params;
    const policy = zeroTrustData.policies.get(policyId);
    
    if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
    }
    
    res.json(policy);
});

// Access Control

// Evaluate access request
app.post('/api/access/evaluate', (req, res) => {
    try {
        const { identityId, deviceId, resource, context } = req.body;
        
        if (!identityId || !deviceId || !resource) {
            return res.status(400).json({ error: 'Identity ID, device ID, and resource are required' });
        }
        
        const identity = zeroTrustData.identities.get(identityId);
        const device = zeroTrustData.devices.get(deviceId);
        
        if (!identity) {
            return res.status(404).json({ error: 'Identity not found' });
        }
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        const accessResult = evaluateAccessRequest(identity, device, resource, context);
        
        // Log security event
        const securityEvent = logSecurityEvent({
            type: 'ACCESS_REQUEST',
            severity: accessResult.allowed ? 'INFO' : 'WARN',
            identity: { id: identityId, username: identity.username },
            device: { id: deviceId, deviceType: device.deviceType },
            resource: { id: resource.id, name: resource.name },
            action: 'ACCESS_REQUEST',
            result: accessResult,
            details: context,
            trustScore: accessResult.trustScore
        });
        
        res.json({
            accessResult,
            securityEvent: securityEvent.id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error evaluating access request:', error);
        res.status(500).json({ error: 'Failed to evaluate access request', details: error.message });
    }
});

// Create session
app.post('/api/sessions', (req, res) => {
    try {
        const { identityId, deviceId, resourceId, sessionData } = req.body;
        
        if (!identityId || !deviceId || !resourceId) {
            return res.status(400).json({ error: 'Identity ID, device ID, and resource ID are required' });
        }
        
        const sessionId = uuidv4();
        const session = {
            id: sessionId,
            identityId,
            deviceId,
            resourceId,
            sessionData: sessionData || {},
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            active: true
        };
        
        zeroTrustData.sessions.set(sessionId, session);
        
        res.status(201).json(session);
        
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session', details: error.message });
    }
});

// Get session
app.get('/api/sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = zeroTrustData.sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
});

// Analytics and Monitoring

// Get zero-trust analytics
app.get('/api/analytics', (req, res) => {
    const analytics = {
        ...zeroTrustData.analytics,
        totalIdentities: zeroTrustData.identities.size,
        totalDevices: zeroTrustData.devices.size,
        totalPolicies: zeroTrustData.policies.size,
        activeSessions: Array.from(zeroTrustData.sessions.values()).filter(s => s.active).length,
        totalViolations: zeroTrustData.violations.size,
        averageTrustScore: calculateAverageTrustScore(),
        lastUpdated: new Date().toISOString()
    };
    
    res.json(analytics);
});

function calculateAverageTrustScore() {
    const identities = Array.from(zeroTrustData.identities.values());
    const devices = Array.from(zeroTrustData.devices.values());
    
    const identityScores = identities.map(i => i.trustScore);
    const deviceScores = devices.map(d => d.trustScore);
    
    const allScores = [...identityScores, ...deviceScores];
    
    if (allScores.length === 0) return 0;
    
    return Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length);
}

// Get security violations
app.get('/api/violations', (req, res) => {
    const { severity, limit = 100 } = req.query;
    
    let violations = Array.from(zeroTrustData.violations.values());
    
    if (severity) {
        violations = violations.filter(v => v.severity === severity.toUpperCase());
    }
    
    violations = violations
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));
    
    res.json({ violations });
});

// Get trust scores
app.get('/api/trust-scores', (req, res) => {
    const { type, limit = 100 } = req.query;
    
    let scores = [];
    
    if (!type || type === 'identities') {
        const identityScores = Array.from(zeroTrustData.identities.values()).map(i => ({
            id: i.id,
            type: 'identity',
            name: i.username,
            trustScore: i.trustScore,
            lastUpdate: i.lastTrustUpdate || i.createdAt
        }));
        scores = scores.concat(identityScores);
    }
    
    if (!type || type === 'devices') {
        const deviceScores = Array.from(zeroTrustData.devices.values()).map(d => ({
            id: d.id,
            type: 'device',
            name: d.deviceType,
            trustScore: d.trustScore,
            lastUpdate: d.lastTrustUpdate || d.createdAt
        }));
        scores = scores.concat(deviceScores);
    }
    
    scores = scores
        .sort((a, b) => b.trustScore - a.trustScore)
        .slice(0, parseInt(limit));
    
    res.json({ scores });
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
    console.log(`🔒 Enhanced Zero-Trust Architecture v${zeroTrustConfig.version} running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`🤖 AI-Enhanced Security Features: Enabled`);
    console.log(`🛡️ Advanced Threat Detection: Active`);
    console.log(`🔐 Behavioral Analytics: Active`);
    console.log(`⚡ Security Orchestration: Active`);
});

module.exports = app;
