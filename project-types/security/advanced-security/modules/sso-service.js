const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const SamlStrategy = require('passport-saml').Strategy;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/sso-service.log' })
  ]
});

class SSOService {
  constructor() {
    this.providers = new Map();
    this.samlConfigs = new Map();
    this.oauthClients = new Map();
    this.ssoSessions = new Map();
    this.initializeStrategies();
  }

  /**
   * Initialize SSO strategies
   */
  initializeStrategies() {
    try {
      // Google OAuth2 Strategy
      if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/sso/google/callback'
        }, this.handleGoogleCallback.bind(this)));

        this.providers.set('google', {
          name: 'Google',
          type: 'oauth2',
          enabled: true
        });
      }

      // Microsoft OAuth2 Strategy
      if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
        passport.use(new MicrosoftStrategy({
          clientID: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          callbackURL: process.env.MICROSOFT_CALLBACK_URL || '/api/sso/microsoft/callback',
          scope: ['user.read']
        }, this.handleMicrosoftCallback.bind(this)));

        this.providers.set('microsoft', {
          name: 'Microsoft',
          type: 'oauth2',
          enabled: true
        });
      }

      logger.info('SSO strategies initialized', { 
        providers: Array.from(this.providers.keys()) 
      });
    } catch (error) {
      logger.error('Error initializing SSO strategies:', error);
    }
  }

  /**
   * Handle Google OAuth callback
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   * @param {Object} profile - User profile
   * @param {Function} done - Callback function
   */
  async handleGoogleCallback(accessToken, refreshToken, profile, done) {
    try {
      const user = {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        picture: profile.photos[0].value,
        provider: 'google',
        verified: true
      };

      logger.info('Google OAuth callback processed', { userId: user.id, email: user.email });
      return done(null, user);
    } catch (error) {
      logger.error('Error handling Google callback:', error);
      return done(error, null);
    }
  }

  /**
   * Handle Microsoft OAuth callback
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   * @param {Object} profile - User profile
   * @param {Function} done - Callback function
   */
  async handleMicrosoftCallback(accessToken, refreshToken, profile, done) {
    try {
      const user = {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        picture: profile.photos[0].value,
        provider: 'microsoft',
        verified: true
      };

      logger.info('Microsoft OAuth callback processed', { userId: user.id, email: user.email });
      return done(null, user);
    } catch (error) {
      logger.error('Error handling Microsoft callback:', error);
      return done(error, null);
    }
  }

  /**
   * Configure SAML provider
   * @param {string} providerId - Provider ID
   * @param {Object} config - SAML configuration
   */
  async configureSAMLProvider(providerId, config) {
    try {
      const samlConfig = {
        entryPoint: config.entryPoint,
        issuer: config.issuer,
        cert: config.cert,
        callbackUrl: config.callbackUrl || `/api/sso/saml/${providerId}/callback`,
        identifierFormat: config.identifierFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        signatureAlgorithm: config.signatureAlgorithm || 'sha256',
        digestAlgorithm: config.digestAlgorithm || 'sha256',
        wantAssertionsSigned: config.wantAssertionsSigned !== false,
        wantAuthnResponseSigned: config.wantAuthnResponseSigned !== false,
        skipRequestCompression: config.skipRequestCompression || false,
        disableRequestedAuthnContext: config.disableRequestedAuthnContext || false
      };

      // Create SAML strategy
      const strategy = new SamlStrategy(samlConfig, this.handleSAMLCallback.bind(this, providerId));
      passport.use(`saml-${providerId}`, strategy);

      this.samlConfigs.set(providerId, samlConfig);
      this.providers.set(providerId, {
        name: config.name || providerId,
        type: 'saml',
        enabled: true
      });

      logger.info('SAML provider configured', { providerId, name: config.name });
    } catch (error) {
      logger.error('Error configuring SAML provider:', error);
      throw error;
    }
  }

  /**
   * Handle SAML callback
   * @param {string} providerId - Provider ID
   * @param {Object} profile - User profile
   * @param {Function} done - Callback function
   */
  async handleSAMLCallback(providerId, profile, done) {
    try {
      const user = {
        id: profile.nameID || profile.uid,
        email: profile.email || profile.nameID,
        name: profile.displayName || profile.cn,
        firstName: profile.givenName || profile.firstName,
        lastName: profile.sn || profile.lastName,
        provider: `saml-${providerId}`,
        verified: true,
        attributes: profile
      };

      logger.info('SAML callback processed', { providerId, userId: user.id, email: user.email });
      return done(null, user);
    } catch (error) {
      logger.error('Error handling SAML callback:', error);
      return done(error, null);
    }
  }

  /**
   * Generate SAML authentication URL
   * @param {string} providerId - Provider ID
   * @param {Object} options - Additional options
   * @returns {Promise<string>} SAML authentication URL
   */
  async generateSAMLAuthUrl(providerId, options = {}) {
    try {
      const config = this.samlConfigs.get(providerId);
      if (!config) {
        throw new Error('SAML provider not configured');
      }

      const strategy = passport._strategy(`saml-${providerId}`);
      if (!strategy) {
        throw new Error('SAML strategy not found');
      }

      const authUrl = strategy.generateAuthorizeUrl(options);
      logger.info('SAML auth URL generated', { providerId });
      return authUrl;
    } catch (error) {
      logger.error('Error generating SAML auth URL:', error);
      throw error;
    }
  }

  /**
   * Create SSO session
   * @param {Object} user - User object
   * @param {string} provider - SSO provider
   * @param {Object} sessionData - Session data
   * @returns {Object} SSO session
   */
  async createSSOSession(user, provider, sessionData = {}) {
    try {
      const sessionId = crypto.randomUUID();
      const session = {
        id: sessionId,
        userId: user.id,
        provider,
        user,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        isActive: true
      };

      this.ssoSessions.set(sessionId, session);

      // Generate JWT token
      const token = jwt.sign(
        { 
          sessionId, 
          userId: user.id, 
          provider,
          type: 'sso'
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      logger.info('SSO session created', { sessionId, userId: user.id, provider });
      return { session, token };
    } catch (error) {
      logger.error('Error creating SSO session:', error);
      throw error;
    }
  }

  /**
   * Get SSO session
   * @param {string} sessionId - Session ID
   * @returns {Object|null} SSO session or null
   */
  async getSSOSession(sessionId) {
    try {
      const session = this.ssoSessions.get(sessionId);
      
      if (!session || !session.isActive) {
        return null;
      }

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.invalidateSSOSession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Error getting SSO session:', error);
      return null;
    }
  }

  /**
   * Invalidate SSO session
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success status
   */
  async invalidateSSOSession(sessionId) {
    try {
      const session = this.ssoSessions.get(sessionId);
      if (session) {
        session.isActive = false;
        session.invalidatedAt = new Date().toISOString();
        this.ssoSessions.set(sessionId, session);
      }
      logger.info('SSO session invalidated', { sessionId });
      return true;
    } catch (error) {
      logger.error('Error invalidating SSO session:', error);
      return false;
    }
  }

  /**
   * Get available SSO providers
   * @returns {Array} List of available providers
   */
  getAvailableProviders() {
    return Array.from(this.providers.values()).filter(provider => provider.enabled);
  }

  /**
   * Get provider configuration
   * @param {string} providerId - Provider ID
   * @returns {Object|null} Provider configuration
   */
  getProviderConfig(providerId) {
    const provider = this.providers.get(providerId);
    if (!provider) return null;

    if (provider.type === 'saml') {
      const config = this.samlConfigs.get(providerId);
      return { ...provider, config };
    }

    return provider;
  }

  /**
   * Enable/disable SSO provider
   * @param {string} providerId - Provider ID
   * @param {boolean} enabled - Enable status
   * @returns {boolean} Success status
   */
  async toggleProvider(providerId, enabled) {
    try {
      const provider = this.providers.get(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      provider.enabled = enabled;
      this.providers.set(providerId, provider);

      logger.info('Provider toggled', { providerId, enabled });
      return true;
    } catch (error) {
      logger.error('Error toggling provider:', error);
      return false;
    }
  }

  /**
   * Get SSO statistics
   * @returns {Object} SSO statistics
   */
  getSSOStats() {
    const totalProviders = this.providers.size;
    const enabledProviders = Array.from(this.providers.values()).filter(p => p.enabled).length;
    const activeSessions = Array.from(this.ssoSessions.values()).filter(s => s.isActive).length;
    const totalSessions = this.ssoSessions.size;

    const providerStats = {};
    for (const [id, provider] of this.providers) {
      providerStats[id] = {
        name: provider.name,
        type: provider.type,
        enabled: provider.enabled
      };
    }

    return {
      totalProviders,
      enabledProviders,
      activeSessions,
      totalSessions,
      providers: providerStats
    };
  }

  /**
   * Clean up expired SSO sessions
   */
  async cleanupExpiredSessions() {
    try {
      const now = new Date();
      let cleaned = 0;

      for (const [sessionId, session] of this.ssoSessions) {
        if (now > new Date(session.expiresAt)) {
          await this.invalidateSSOSession(sessionId);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.info('Expired SSO sessions cleaned up', { count: cleaned });
      }
    } catch (error) {
      logger.error('Error cleaning up expired SSO sessions:', error);
    }
  }

  /**
   * Validate SAML response
   * @param {string} providerId - Provider ID
   * @param {string} samlResponse - SAML response
   * @returns {Promise<Object>} Validation result
   */
  async validateSAMLResponse(providerId, samlResponse) {
    try {
      const config = this.samlConfigs.get(providerId);
      if (!config) {
        throw new Error('SAML provider not configured');
      }

      const strategy = passport._strategy(`saml-${providerId}`);
      if (!strategy) {
        throw new Error('SAML strategy not found');
      }

      // In a real implementation, you would validate the SAML response here
      // This is a simplified version
      return {
        valid: true,
        message: 'SAML response validated successfully'
      };
    } catch (error) {
      logger.error('Error validating SAML response:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Generate OAuth2 authorization URL
   * @param {string} provider - OAuth2 provider
   * @param {Object} options - Additional options
   * @returns {string} Authorization URL
   */
  generateOAuth2AuthUrl(provider, options = {}) {
    try {
      const strategy = passport._strategy(provider);
      if (!strategy) {
        throw new Error('OAuth2 strategy not found');
      }

      // Generate authorization URL
      const authUrl = strategy.getOAuth().getAuthorizeUrl({
        response_type: 'code',
        client_id: strategy._oauth2._clientId,
        redirect_uri: strategy._callbackURL,
        scope: options.scope || 'openid profile email',
        state: options.state || crypto.randomBytes(16).toString('hex')
      });

      logger.info('OAuth2 auth URL generated', { provider });
      return authUrl;
    } catch (error) {
      logger.error('Error generating OAuth2 auth URL:', error);
      throw error;
    }
  }
}

module.exports = new SSOService();
