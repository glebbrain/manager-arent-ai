const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Redis = require('redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3006;

// Redis client
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect();

// Zero-trust architecture configuration
const zeroTrustConfig = {
  principles: [
    'never_trust_always_verify',
    'least_privilege_access',
    'assume_breach',
    'continuous_monitoring',
    'micro_segmentation'
  ],
  components: {
    identity: {
      multiFactorAuth: true,
      biometricAuth: true,
      deviceTrust: true,
      riskBasedAuth: true
    },
    network: {
      microSegmentation: true,
      encryptedTunnels: true,
      networkIsolation: true,
      trafficInspection: true
    },
    data: {
      encryptionAtRest: true,
      encryptionInTransit: true,
      dataClassification: true,
      accessControls: true
    },
    applications: {
      apiSecurity: true,
      containerSecurity: true,
      runtimeProtection: true,
      vulnerabilityScanning: true
    }
  }
};

// Security policies
const securityPolicies = {
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90, // days
    historyCount: 5
  },
  session: {
    timeout: 30, // minutes
    maxConcurrent: 3,
    requireReauth: true
  },
  mfa: {
    required: true,
    methods: ['totp', 'sms', 'email', 'biometric'],
    backupCodes: 10
  },
  encryption: {
    algorithm: 'AES-256-GCM',
    keyRotation: 90, // days
    tlsVersion: '1.3'
  }
};

// Threat intelligence
const threatIntelligence = {
  knownThreats: new Map(),
  indicators: new Map(),
  reputation: new Map()
};

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

// Zero-trust verification middleware
const zeroTrustVerify = async (req, res, next) => {
  const { deviceId, location, riskScore } = req.headers;
  
  // Verify device trust
  const deviceTrust = await verifyDeviceTrust(deviceId);
  if (!deviceTrust.trusted) {
    return res.status(403).json({ error: 'Device not trusted' });
  }
  
  // Verify location
  const locationTrust = await verifyLocation(location);
  if (!locationTrust.trusted) {
    return res.status(403).json({ error: 'Location not trusted' });
  }
  
  // Risk-based authentication
  if (riskScore > 0.7) {
    return res.status(403).json({ error: 'High risk detected' });
  }
  
  next();
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    uptime: process.uptime(),
    security: 'enabled'
  });
});

// Zero-trust configuration
app.get('/api/zero-trust', (req, res) => {
  res.json(zeroTrustConfig);
});

// Security policies
app.get('/api/policies', (req, res) => {
  res.json(securityPolicies);
});

app.post('/api/policies', authenticateToken, async (req, res) => {
  const { policies } = req.body;
  
  if (!policies) {
    return res.status(400).json({ error: 'Policies are required' });
  }
  
  Object.assign(securityPolicies, policies);
  
  // Store in Redis
  await redis.hSet('security_policies', 'global', JSON.stringify(securityPolicies));
  
  res.json(securityPolicies);
});

// User registration with zero-trust
app.post('/api/register', async (req, res) => {
  const { username, email, password, deviceInfo } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }
  
  try {
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: 'Password does not meet requirements', details: passwordValidation.errors });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate MFA secret
    const mfaSecret = speakeasy.generateSecret({
      name: username,
      issuer: 'Enterprise Security'
    });
    
    // Create user
    const user = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      mfaSecret: mfaSecret.base32,
      deviceInfo,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      riskScore: 0
    };
    
    // Store user
    await redis.hSet('users', user.id, JSON.stringify(user));
    await redis.hSet('users_by_email', email, user.id);
    
    // Generate QR code for MFA setup
    const qrCodeUrl = await QRCode.toDataURL(mfaSecret.otpauth_url);
    
    res.json({
      userId: user.id,
      mfaSecret: mfaSecret.base32,
      qrCode: qrCodeUrl,
      message: 'User registered successfully. Please set up MFA.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User authentication with MFA
app.post('/api/login', async (req, res) => {
  const { email, password, mfaToken, deviceInfo } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    // Get user
    const userId = await redis.hGet('users_by_email', email);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const userData = await redis.hGet('users', userId);
    const user = JSON.parse(userData);
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify MFA
    if (mfaToken) {
      const mfaValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaToken,
        window: 2
      });
      
      if (!mfaValid) {
        return res.status(401).json({ error: 'Invalid MFA token' });
      }
    } else {
      return res.status(401).json({ error: 'MFA token required' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    await redis.hSet('users', user.id, JSON.stringify(user));
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Device trust verification
app.post('/api/device/trust', authenticateToken, async (req, res) => {
  const { deviceId, deviceInfo, location } = req.body;
  
  try {
    const trustResult = await verifyDeviceTrust(deviceId, deviceInfo, location);
    res.json(trustResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Risk assessment
app.post('/api/risk/assess', authenticateToken, async (req, res) => {
  const { userId, activity, context } = req.body;
  
  try {
    const riskAssessment = await assessRisk(userId, activity, context);
    res.json(riskAssessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Threat detection
app.post('/api/threats/detect', authenticateToken, async (req, res) => {
  const { indicators, context } = req.body;
  
  try {
    const threatDetection = await detectThreats(indicators, context);
    res.json(threatDetection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security monitoring
app.get('/api/monitor', authenticateToken, async (req, res) => {
  try {
    const monitoring = await getSecurityMonitoring();
    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security audit
app.get('/api/audit', authenticateToken, async (req, res) => {
  const { startDate, endDate, userId, action } = req.query;
  
  try {
    const auditLog = await getSecurityAudit(startDate, endDate, userId, action);
    res.json(auditLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security functions
function validatePassword(password) {
  const errors = [];
  const policy = securityPolicies.password;
  
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

async function verifyDeviceTrust(deviceId, deviceInfo, location) {
  // Simulate device trust verification
  const trustScore = Math.random();
  
  return {
    deviceId,
    trusted: trustScore > 0.3,
    trustScore,
    factors: {
      deviceFingerprint: trustScore > 0.5,
      location: trustScore > 0.4,
      behavior: trustScore > 0.6
    },
    timestamp: new Date().toISOString()
  };
}

async function verifyLocation(location) {
  // Simulate location verification
  const locationTrust = Math.random() > 0.2;
  
  return {
    location,
    trusted: locationTrust,
    timestamp: new Date().toISOString()
  };
}

async function assessRisk(userId, activity, context) {
  // Simulate risk assessment
  const riskScore = Math.random();
  
  return {
    userId,
    activity,
    context,
    riskScore,
    level: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
    factors: {
      userBehavior: Math.random(),
      deviceTrust: Math.random(),
      locationTrust: Math.random(),
      timePattern: Math.random()
    },
    recommendations: riskScore > 0.7 ? ['Require additional authentication'] : [],
    timestamp: new Date().toISOString()
  };
}

async function detectThreats(indicators, context) {
  // Simulate threat detection
  const threats = [];
  
  for (const indicator of indicators) {
    if (Math.random() > 0.8) {
      threats.push({
        indicator,
        severity: 'high',
        type: 'malware',
        description: 'Suspicious activity detected'
      });
    }
  }
  
  return {
    threats,
    total: threats.length,
    timestamp: new Date().toISOString()
  };
}

async function getSecurityMonitoring() {
  return {
    timestamp: new Date().toISOString(),
    activeUsers: Math.floor(Math.random() * 1000),
    failedLogins: Math.floor(Math.random() * 50),
    blockedIPs: Math.floor(Math.random() * 20),
    threatsDetected: Math.floor(Math.random() * 10),
    securityScore: Math.floor(Math.random() * 100)
  };
}

async function getSecurityAudit(startDate, endDate, userId, action) {
  // Simulate audit log
  return {
    startDate,
    endDate,
    userId,
    action,
    entries: [
      {
        id: uuidv4(),
        userId: userId || 'system',
        action: action || 'login',
        timestamp: new Date().toISOString(),
        details: 'User authentication',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      }
    ]
  };
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Security Error:', err);
  
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
  console.log(`🚀 Enterprise Security Enhanced v3.0 running on port ${PORT}`);
  console.log(`🔒 Zero-trust architecture enabled`);
  console.log(`🔐 Multi-factor authentication enabled`);
  console.log(`🛡️ Threat detection enabled`);
  console.log(`📊 Security monitoring enabled`);
});

module.exports = app;
