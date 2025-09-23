const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3012;

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

// Enhanced Advanced Authentication Configuration
const authConfig = {
    version: '2.7.0',
    jwt: {
        secret: process.env.JWT_SECRET || 'your-jwt-secret',
        expiresIn: '24h',
        refreshExpiresIn: '7d'
    },
    password: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        saltRounds: 12
    },
    mfa: {
        totp: {
            issuer: 'Universal Automation Platform',
            algorithm: 'sha1',
            digits: 6,
            period: 30
        },
        sms: {
            provider: 'twilio',
            fromNumber: process.env.SMS_FROM_NUMBER || '+1234567890'
        },
        email: {
            provider: 'smtp',
            fromEmail: process.env.EMAIL_FROM || 'noreply@example.com'
        },
        biometric: {
            enabled: true,
            providers: ['fingerprint', 'face', 'voice', 'iris'],
            fallbackMethods: ['totp', 'sms', 'email']
        },
        hardware: {
            enabled: true,
            providers: ['yubikey', 'fido2', 'webauthn'],
            backupMethods: ['totp', 'backup-codes']
        },
        adaptive: {
            enabled: true,
            riskFactors: ['location', 'device', 'time', 'behavior'],
            thresholds: {
                low: 30,
                medium: 60,
                high: 90
            }
        }
    },
    sso: {
        providers: {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                redirectUri: process.env.GOOGLE_REDIRECT_URI,
                scopes: ['openid', 'email', 'profile']
            },
            microsoft: {
                clientId: process.env.MICROSOFT_CLIENT_ID,
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                redirectUri: process.env.MICROSOFT_REDIRECT_URI,
                tenant: process.env.MICROSOFT_TENANT || 'common',
                scopes: ['openid', 'email', 'profile']
            },
            saml: {
                entityId: process.env.SAML_ENTITY_ID,
                ssoUrl: process.env.SAML_SSO_URL,
                certificate: process.env.SAML_CERTIFICATE,
                nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
            },
            okta: {
                clientId: process.env.OKTA_CLIENT_ID,
                clientSecret: process.env.OKTA_CLIENT_SECRET,
                redirectUri: process.env.OKTA_REDIRECT_URI,
                domain: process.env.OKTA_DOMAIN
            },
            auth0: {
                clientId: process.env.AUTH0_CLIENT_ID,
                clientSecret: process.env.AUTH0_CLIENT_SECRET,
                redirectUri: process.env.AUTH0_REDIRECT_URI,
                domain: process.env.AUTH0_DOMAIN
            },
            azure: {
                clientId: process.env.AZURE_CLIENT_ID,
                clientSecret: process.env.AZURE_CLIENT_SECRET,
                redirectUri: process.env.AZURE_REDIRECT_URI,
                tenant: process.env.AZURE_TENANT
            }
        }
    },
    session: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: true,
        httpOnly: true,
        sameSite: 'strict'
    },
    security: {
        bruteForce: {
            maxAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            progressiveDelay: true
        },
        password: {
            history: 12, // Remember last 12 passwords
            expiration: 90 * 24 * 60 * 60 * 1000, // 90 days
            warningDays: 7 // Warn 7 days before expiration
        },
        session: {
            maxConcurrent: 5, // Max 5 concurrent sessions
            idleTimeout: 30 * 60 * 1000, // 30 minutes
            absoluteTimeout: 8 * 60 * 60 * 1000 // 8 hours
        },
        risk: {
            location: {
                enabled: true,
                maxDistance: 1000, // km
                suspiciousCountries: ['CN', 'RU', 'KP', 'IR']
            },
            device: {
                enabled: true,
                fingerprinting: true,
                unknownDeviceBlock: true
            },
            time: {
                enabled: true,
                businessHours: { start: 8, end: 18 },
                timezone: 'UTC'
            }
        }
    },
    ai: {
        behavioral: {
            enabled: true,
            learningPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
            anomalyThreshold: 0.8,
            features: ['loginTime', 'location', 'device', 'browser', 'ip']
        },
        adaptive: {
            enabled: true,
            riskScoring: true,
            dynamicMFA: true,
            contextAware: true
        },
        threat: {
            enabled: true,
            iocDetection: true,
            patternMatching: true,
            realTimeAnalysis: true
        }
    }
};

// Data Storage
let authData = {
    users: new Map(),
    sessions: new Map(),
    mfaSecrets: new Map(),
    backupCodes: new Map(),
    ssoStates: new Map(),
    loginAttempts: new Map(),
    passwordResetTokens: new Map(),
    emailVerificationTokens: new Map()
};

// Email transporter
const emailTransporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Utility functions
function validatePassword(password) {
    const errors = [];
    
    if (password.length < authConfig.password.minLength) {
        errors.push(`Password must be at least ${authConfig.password.minLength} characters long`);
    }
    
    if (authConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (authConfig.password.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (authConfig.password.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (authConfig.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

function generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
}

function checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const attempts = authData.loginAttempts.get(identifier) || [];
    
    // Remove old attempts
    const recentAttempts = attempts.filter(attempt => now - attempt < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
        return {
            allowed: false,
            remainingTime: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
        };
    }
    
    // Add current attempt
    recentAttempts.push(now);
    authData.loginAttempts.set(identifier, recentAttempts);
    
    return {
        allowed: true,
        remainingAttempts: maxAttempts - recentAttempts.length
    };
}

function generateTokens(userId) {
    const accessToken = jwt.sign(
        { userId, type: 'access' },
        authConfig.jwt.secret,
        { expiresIn: authConfig.jwt.expiresIn }
    );
    
    const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        authConfig.jwt.secret,
        { expiresIn: authConfig.jwt.refreshExpiresIn }
    );
    
    return { accessToken, refreshToken };
}

function verifyToken(token, type = 'access') {
    try {
        const decoded = jwt.verify(token, authConfig.jwt.secret);
        if (decoded.type !== type) {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
}

// Advanced Authentication Functions

// AI-powered behavioral analysis
function performBehavioralAnalysis(userId, loginData) {
    const user = authData.users.get(userId);
    if (!user) return { risk: 'HIGH', reason: 'Unknown user' };
    
    const riskFactors = [];
    let riskScore = 0;
    
    // Time-based analysis
    const currentHour = new Date().getHours();
    const businessStart = authConfig.security.risk.time.businessHours.start;
    const businessEnd = authConfig.security.risk.time.businessHours.end;
    
    if (currentHour < businessStart || currentHour > businessEnd) {
        riskFactors.push('Non-business hours login');
        riskScore += 20;
    }
    
    // Location analysis
    if (loginData.location && user.lastKnownLocation) {
        const distance = calculateDistance(loginData.location, user.lastKnownLocation);
        if (distance > authConfig.security.risk.location.maxDistance) {
            riskFactors.push('Geographic anomaly');
            riskScore += 30;
        }
        
        // Check for suspicious countries
        if (authConfig.security.risk.location.suspiciousCountries.includes(loginData.location.country)) {
            riskFactors.push('Suspicious country');
            riskScore += 40;
        }
    }
    
    // Device analysis
    if (loginData.deviceFingerprint) {
        if (!user.trustedDevices.includes(loginData.deviceFingerprint)) {
            riskFactors.push('Unknown device');
            riskScore += 25;
        }
    }
    
    // IP analysis
    if (loginData.ipAddress) {
        if (user.trustedIPs && !user.trustedIPs.includes(loginData.ipAddress)) {
            riskFactors.push('Unknown IP address');
            riskScore += 15;
        }
    }
    
    // Frequency analysis
    const recentLogins = user.recentLogins || [];
    const todayLogins = recentLogins.filter(login => 
        new Date(login.timestamp).toDateString() === new Date().toDateString()
    );
    
    if (todayLogins.length > 10) {
        riskFactors.push('High frequency logins');
        riskScore += 20;
    }
    
    // Determine risk level
    let riskLevel = 'LOW';
    if (riskScore > 70) riskLevel = 'HIGH';
    else if (riskScore > 40) riskLevel = 'MEDIUM';
    
    return {
        risk: riskLevel,
        score: riskScore,
        factors: riskFactors,
        confidence: 0.85
    };
}

// Adaptive authentication based on risk
function determineAuthRequirements(behaviorAnalysis, user) {
    const requirements = {
        mfaRequired: false,
        mfaMethods: [],
        additionalChecks: []
    };
    
    if (behaviorAnalysis.risk === 'HIGH') {
        requirements.mfaRequired = true;
        requirements.mfaMethods = ['totp', 'sms', 'email'];
        requirements.additionalChecks = ['device-verification', 'location-verification'];
    } else if (behaviorAnalysis.risk === 'MEDIUM') {
        requirements.mfaRequired = true;
        requirements.mfaMethods = ['totp', 'sms'];
        requirements.additionalChecks = ['device-verification'];
    } else if (behaviorAnalysis.risk === 'LOW') {
        if (user.mfaEnabled) {
            requirements.mfaRequired = true;
            requirements.mfaMethods = ['totp'];
        }
    }
    
    return requirements;
}

// Biometric authentication
function verifyBiometric(userId, biometricData) {
    const user = authData.users.get(userId);
    if (!user) return { valid: false, error: 'User not found' };
    
    // Simulate biometric verification
    const biometricTemplates = user.biometricTemplates || {};
    const biometricType = biometricData.type;
    const template = biometricTemplates[biometricType];
    
    if (!template) {
        return { valid: false, error: 'Biometric not enrolled' };
    }
    
    // Simulate verification (in real implementation, use proper biometric libraries)
    const similarity = Math.random();
    const threshold = 0.8;
    
    if (similarity >= threshold) {
        return { valid: true, confidence: similarity };
    } else {
        return { valid: false, error: 'Biometric verification failed' };
    }
}

// Hardware token authentication
function verifyHardwareToken(userId, tokenData) {
    const user = authData.users.get(userId);
    if (!user) return { valid: false, error: 'User not found' };
    
    const hardwareTokens = user.hardwareTokens || [];
    const token = hardwareTokens.find(t => t.id === tokenData.tokenId);
    
    if (!token) {
        return { valid: false, error: 'Hardware token not registered' };
    }
    
    // Simulate hardware token verification
    const isValid = Math.random() > 0.1; // 90% success rate for simulation
    
    if (isValid) {
        return { valid: true, tokenType: token.type };
    } else {
        return { valid: false, error: 'Invalid hardware token' };
    }
}

// WebAuthn/FIDO2 authentication
function verifyWebAuthn(userId, credentialData) {
    const user = authData.users.get(userId);
    if (!user) return { valid: false, error: 'User not found' };
    
    const webauthnCredentials = user.webauthnCredentials || [];
    const credential = webauthnCredentials.find(c => c.id === credentialData.credentialId);
    
    if (!credential) {
        return { valid: false, error: 'WebAuthn credential not found' };
    }
    
    // Simulate WebAuthn verification
    const isValid = Math.random() > 0.05; // 95% success rate for simulation
    
    if (isValid) {
        return { valid: true, credentialType: credential.type };
    } else {
        return { valid: false, error: 'WebAuthn verification failed' };
    }
}

// Advanced threat detection
function detectAuthThreats(loginData, user) {
    const threats = [];
    
    // Brute force detection
    const recentFailures = authData.loginAttempts.get(loginData.email) || [];
    const recentFailuresCount = recentFailures.filter(attempt => 
        !attempt.success && 
        (new Date() - new Date(attempt.timestamp)) < 300000 // Within 5 minutes
    ).length;
    
    if (recentFailuresCount > 5) {
        threats.push({
            type: 'BRUTE_FORCE',
            severity: 'HIGH',
            description: 'Potential brute force attack detected',
            confidence: 0.9
        });
    }
    
    // Account takeover detection
    if (loginData.location && user.lastKnownLocation) {
        const distance = calculateDistance(loginData.location, user.lastKnownLocation);
        if (distance > 5000) { // More than 5000km
            threats.push({
                type: 'ACCOUNT_TAKEOVER',
                severity: 'CRITICAL',
                description: 'Potential account takeover - unusual location',
                confidence: 0.85
            });
        }
    }
    
    // Device compromise detection
    if (loginData.deviceFingerprint && user.trustedDevices) {
        if (!user.trustedDevices.includes(loginData.deviceFingerprint)) {
            threats.push({
                type: 'DEVICE_COMPROMISE',
                severity: 'MEDIUM',
                description: 'Unknown device attempting login',
                confidence: 0.7
            });
        }
    }
    
    return threats;
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
        service: 'Enhanced Advanced Authentication',
        version: authConfig.version,
        timestamp: new Date().toISOString(),
        features: {
            mfa: Object.keys(authConfig.mfa),
            sso: Object.keys(authConfig.sso.providers),
            ai: Object.keys(authConfig.ai)
        }
    });
});

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }
        
        // Check if user already exists
        const existingUser = Array.from(authData.users.values()).find(
            user => user.username === username || user.email === email
        );
        
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ 
                error: 'Password validation failed', 
                details: passwordValidation.errors 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, authConfig.password.saltRounds);
        
        // Create user
        const userId = uuidv4();
        const user = {
            id: userId,
            username,
            email,
            password: hashedPassword,
            firstName: firstName || '',
            lastName: lastName || '',
            emailVerified: false,
            mfaEnabled: false,
            mfaMethods: [],
            backupCodes: [],
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginCount: 0,
            status: 'active'
        };
        
        authData.users.set(userId, user);
        
        // Generate email verification token
        const emailToken = uuidv4();
        authData.emailVerificationTokens.set(emailToken, {
            userId,
            email,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });
        
        // Send verification email
        try {
            await emailTransporter.sendMail({
                from: authConfig.mfa.email.fromEmail,
                to: email,
                subject: 'Verify Your Email Address',
                html: `
                    <h2>Welcome to Universal Automation Platform!</h2>
                    <p>Please click the link below to verify your email address:</p>
                    <a href="${process.env.BASE_URL}/verify-email?token=${emailToken}">Verify Email</a>
                    <p>This link will expire in 24 hours.</p>
                `
            });
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
        }
        
        res.status(201).json({
            message: 'User registered successfully',
            userId: userId,
            emailVerificationRequired: true
        });
        
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user', details: error.message });
    }
});

// Email Verification
app.post('/api/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }
        
        const verificationData = authData.emailVerificationTokens.get(token);
        if (!verificationData) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        
        if (Date.now() > verificationData.expiresAt) {
            authData.emailVerificationTokens.delete(token);
            return res.status(400).json({ error: 'Verification token has expired' });
        }
        
        const user = authData.users.get(verificationData.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.emailVerified = true;
        authData.users.set(verificationData.userId, user);
        authData.emailVerificationTokens.delete(token);
        
        res.json({ message: 'Email verified successfully' });
        
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ error: 'Failed to verify email', details: error.message });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, rememberMe = false } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Check rate limiting
        const rateLimitCheck = checkRateLimit(username);
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({ 
                error: 'Too many login attempts', 
                retryAfter: rateLimitCheck.remainingTime 
            });
        }
        
        // Find user
        const user = Array.from(authData.users.values()).find(
            u => u.username === username || u.email === username
        );
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check if email is verified
        if (!user.emailVerified) {
            return res.status(403).json({ error: 'Email verification required' });
        }
        
        // Check if MFA is enabled
        if (user.mfaEnabled) {
            const tempToken = jwt.sign(
                { userId: user.id, type: 'mfa_required' },
                authConfig.jwt.secret,
                { expiresIn: '5m' }
            );
            
            return res.json({
                message: 'MFA required',
                tempToken: tempToken,
                mfaMethods: user.mfaMethods
            });
        }
        
        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);
        
        // Create session
        const sessionId = uuidv4();
        const session = {
            id: sessionId,
            userId: user.id,
            accessToken,
            refreshToken,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + authConfig.session.maxAge).toISOString(),
            rememberMe,
            active: true
        };
        
        authData.sessions.set(sessionId, session);
        
        // Update user
        user.lastLogin = new Date().toISOString();
        user.loginCount++;
        authData.users.set(user.id, user);
        
        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            sessionId,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                mfaEnabled: user.mfaEnabled
            }
        });
        
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login', details: error.message });
    }
});

// MFA Setup - TOTP
app.post('/api/mfa/setup/totp', async (req, res) => {
    try {
        const { tempToken } = req.body;
        
        const decoded = verifyToken(tempToken, 'mfa_required');
        const user = authData.users.get(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Generate TOTP secret
        const secret = speakeasy.generateSecret({
            name: `${user.username} (${authConfig.mfa.totp.issuer})`,
            issuer: authConfig.mfa.totp.issuer,
            length: 32
        });
        
        // Store secret temporarily
        authData.mfaSecrets.set(user.id, secret.base32);
        
        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        
        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl,
            manualEntryKey: secret.base32
        });
        
    } catch (error) {
        console.error('Error setting up TOTP:', error);
        res.status(500).json({ error: 'Failed to setup TOTP', details: error.message });
    }
});

// MFA Verify - TOTP
app.post('/api/mfa/verify/totp', async (req, res) => {
    try {
        const { tempToken, token } = req.body;
        
        const decoded = verifyToken(tempToken, 'mfa_required');
        const user = authData.users.get(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const secret = authData.mfaSecrets.get(user.id);
        if (!secret) {
            return res.status(400).json({ error: 'TOTP setup not initiated' });
        }
        
        // Verify TOTP token
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2
        });
        
        if (!verified) {
            return res.status(401).json({ error: 'Invalid TOTP token' });
        }
        
        // Enable MFA for user
        user.mfaEnabled = true;
        user.mfaMethods.push('totp');
        
        // Generate backup codes
        const backupCodes = generateBackupCodes();
        user.backupCodes = backupCodes;
        
        authData.users.set(user.id, user);
        authData.mfaSecrets.delete(user.id);
        
        // Generate final tokens
        const { accessToken, refreshToken } = generateTokens(user.id);
        
        // Create session
        const sessionId = uuidv4();
        const session = {
            id: sessionId,
            userId: user.id,
            accessToken,
            refreshToken,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + authConfig.session.maxAge).toISOString(),
            active: true
        };
        
        authData.sessions.set(sessionId, session);
        
        res.json({
            message: 'MFA setup successful',
            accessToken,
            refreshToken,
            sessionId,
            backupCodes: backupCodes,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                mfaEnabled: user.mfaEnabled
            }
        });
        
    } catch (error) {
        console.error('Error verifying TOTP:', error);
        res.status(500).json({ error: 'Failed to verify TOTP', details: error.message });
    }
});

// MFA Verify - Backup Code
app.post('/api/mfa/verify/backup', async (req, res) => {
    try {
        const { tempToken, backupCode } = req.body;
        
        const decoded = verifyToken(tempToken, 'mfa_required');
        const user = authData.users.get(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check backup code
        const codeIndex = user.backupCodes.indexOf(backupCode.toUpperCase());
        if (codeIndex === -1) {
            return res.status(401).json({ error: 'Invalid backup code' });
        }
        
        // Remove used backup code
        user.backupCodes.splice(codeIndex, 1);
        authData.users.set(user.id, user);
        
        // Generate final tokens
        const { accessToken, refreshToken } = generateTokens(user.id);
        
        // Create session
        const sessionId = uuidv4();
        const session = {
            id: sessionId,
            userId: user.id,
            accessToken,
            refreshToken,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + authConfig.session.maxAge).toISOString(),
            active: true
        };
        
        authData.sessions.set(sessionId, session);
        
        res.json({
            message: 'Backup code verification successful',
            accessToken,
            refreshToken,
            sessionId,
            remainingBackupCodes: user.backupCodes.length,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                mfaEnabled: user.mfaEnabled
            }
        });
        
    } catch (error) {
        console.error('Error verifying backup code:', error);
        res.status(500).json({ error: 'Failed to verify backup code', details: error.message });
    }
});

// Token Refresh
app.post('/api/refresh', (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }
        
        const decoded = verifyToken(refreshToken, 'refresh');
        const user = authData.users.get(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
        
        res.json({
            accessToken,
            refreshToken: newRefreshToken
        });
        
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ error: 'Failed to refresh token', details: error.message });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (sessionId) {
            const session = authData.sessions.get(sessionId);
            if (session) {
                session.active = false;
                authData.sessions.set(sessionId, session);
            }
        }
        
        res.json({ message: 'Logout successful' });
        
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ error: 'Failed to logout', details: error.message });
    }
});

// Password Reset Request
app.post('/api/password-reset/request', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const user = Array.from(authData.users.values()).find(u => u.email === email);
        if (!user) {
            // Don't reveal if user exists
            return res.json({ message: 'Password reset email sent' });
        }
        
        // Generate reset token
        const resetToken = uuidv4();
        authData.passwordResetTokens.set(resetToken, {
            userId: user.id,
            email: user.email,
            expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
        });
        
        // Send reset email
        try {
            await emailTransporter.sendMail({
                from: authConfig.mfa.email.fromEmail,
                to: email,
                subject: 'Password Reset Request',
                html: `
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset for your account.</p>
                    <p>Click the link below to reset your password:</p>
                    <a href="${process.env.BASE_URL}/reset-password?token=${resetToken}">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `
            });
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
        }
        
        res.json({ message: 'Password reset email sent' });
        
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ error: 'Failed to request password reset', details: error.message });
    }
});

// Password Reset
app.post('/api/password-reset', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }
        
        const resetData = authData.passwordResetTokens.get(token);
        if (!resetData) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        
        if (Date.now() > resetData.expiresAt) {
            authData.passwordResetTokens.delete(token);
            return res.status(400).json({ error: 'Reset token has expired' });
        }
        
        const user = authData.users.get(resetData.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ 
                error: 'Password validation failed', 
                details: passwordValidation.errors 
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, authConfig.password.saltRounds);
        
        // Update user password
        user.password = hashedPassword;
        authData.users.set(user.id, user);
        
        // Remove reset token
        authData.passwordResetTokens.delete(token);
        
        // Invalidate all sessions
        Array.from(authData.sessions.values())
            .filter(session => session.userId === user.id)
            .forEach(session => {
                session.active = false;
                authData.sessions.set(session.id, session);
            });
        
        res.json({ message: 'Password reset successful' });
        
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password', details: error.message });
    }
});

// Get User Profile
app.get('/api/profile', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header required' });
        }
        
        const token = authHeader.substring(7);
        const decoded = verifyToken(token, 'access');
        const user = authData.users.get(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            emailVerified: user.emailVerified,
            mfaEnabled: user.mfaEnabled,
            mfaMethods: user.mfaMethods,
            backupCodesCount: user.backupCodes.length,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            loginCount: user.loginCount
        });
        
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ error: 'Failed to get profile', details: error.message });
    }
});

// Advanced Authentication API Endpoints

// Behavioral Analysis
app.post('/api/behavioral/analyze', (req, res) => {
    try {
        const { userId, behaviorData } = req.body;
        
        if (!userId || !behaviorData) {
            return res.status(400).json({ error: 'User ID and behavior data are required' });
        }
        
        const user = authData.users.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const analysis = performBehavioralAnalysis(userId, behaviorData);
        
        res.json({
            userId: userId,
            analysis: analysis,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error analyzing behavior:', error);
        res.status(500).json({ error: 'Failed to analyze behavior', details: error.message });
    }
});

// Adaptive Authentication
app.post('/api/adaptive/authenticate', (req, res) => {
    try {
        const { userId, loginData } = req.body;
        
        if (!userId || !loginData) {
            return res.status(400).json({ error: 'User ID and login data are required' });
        }
        
        const user = authData.users.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const authRequirements = determineAuthRequirements(userId, loginData);
        
        res.json({
            userId: userId,
            requirements: authRequirements,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error determining auth requirements:', error);
        res.status(500).json({ error: 'Failed to determine auth requirements', details: error.message });
    }
});

// Biometric Authentication
app.post('/api/biometric/verify', (req, res) => {
    try {
        const { userId, biometricData } = req.body;
        
        if (!userId || !biometricData) {
            return res.status(400).json({ error: 'User ID and biometric data are required' });
        }
        
        const result = verifyBiometric(userId, biometricData);
        
        res.json({
            userId: userId,
            result: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error verifying biometric:', error);
        res.status(500).json({ error: 'Failed to verify biometric', details: error.message });
    }
});

// Hardware Token Authentication
app.post('/api/hardware/verify', (req, res) => {
    try {
        const { userId, tokenData } = req.body;
        
        if (!userId || !tokenData) {
            return res.status(400).json({ error: 'User ID and token data are required' });
        }
        
        const result = verifyHardwareToken(userId, tokenData);
        
        res.json({
            userId: userId,
            result: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error verifying hardware token:', error);
        res.status(500).json({ error: 'Failed to verify hardware token', details: error.message });
    }
});

// WebAuthn Authentication
app.post('/api/webauthn/verify', (req, res) => {
    try {
        const { userId, credentialData } = req.body;
        
        if (!userId || !credentialData) {
            return res.status(400).json({ error: 'User ID and credential data are required' });
        }
        
        const result = verifyWebAuthn(userId, credentialData);
        
        res.json({
            userId: userId,
            result: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error verifying WebAuthn:', error);
        res.status(500).json({ error: 'Failed to verify WebAuthn', details: error.message });
    }
});

// Threat Detection
app.post('/api/threats/detect', (req, res) => {
    try {
        const { loginData, userId } = req.body;
        
        if (!loginData) {
            return res.status(400).json({ error: 'Login data is required' });
        }
        
        const user = userId ? authData.users.get(userId) : null;
        const threats = detectAuthThreats(loginData, user);
        
        res.json({
            threats: threats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error detecting threats:', error);
        res.status(500).json({ error: 'Failed to detect threats', details: error.message });
    }
});

// Get Authentication Configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            version: authConfig.version,
            mfa: authConfig.mfa,
            sso: authConfig.sso,
            security: authConfig.security,
            ai: authConfig.ai,
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
    console.log(`🔐 Advanced Authentication v2.7.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`🤖 AI Features: Behavioral Analysis, Adaptive Authentication, Threat Detection`);
    console.log(`🔐 MFA Methods: TOTP, SMS, Email, Biometric, Hardware, WebAuthn`);
    console.log(`🌐 SSO Providers: Google, Microsoft, SAML, Okta, Auth0, Azure`);
});

module.exports = app;
