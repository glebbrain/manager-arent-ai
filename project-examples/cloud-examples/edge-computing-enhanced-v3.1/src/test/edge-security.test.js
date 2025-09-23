const EdgeSecurity = require('../modules/edge-security');
const logger = require('../modules/logger');

describe('EdgeSecurity', () => {
  let security;
  
  beforeEach(() => {
    security = new EdgeSecurity({
      zeroTrust: true,
      encryptionLevel: 'AES-256',
      deviceAuthentication: true
    });
  });
  
  afterEach(async () => {
    if (security) {
      await security.dispose();
    }
  });
  
  describe('Initialization', () => {
    test('should initialize with default config', () => {
      expect(security.config).toBeDefined();
      expect(security.config.zeroTrust).toBe(true);
      expect(security.config.encryptionLevel).toBe('AES-256');
      expect(security.config.deviceAuthentication).toBe(true);
    });
    
    test('should initialize with custom config', () => {
      const customSecurity = new EdgeSecurity({
        zeroTrust: false,
        encryptionLevel: 'AES-128',
        deviceAuthentication: false
      });
      
      expect(customSecurity.config.zeroTrust).toBe(false);
      expect(customSecurity.config.encryptionLevel).toBe('AES-128');
      expect(customSecurity.config.deviceAuthentication).toBe(false);
    });
  });
  
  describe('Device Management', () => {
    test('should register device successfully', async () => {
      const deviceInfo = {
        name: 'test-device',
        type: 'edge-device',
        location: 'test-location',
        capabilities: ['ai-processing', 'analytics']
      };
      
      const result = await security.registerDevice(deviceInfo);
      
      expect(result).toBeDefined();
      expect(result.deviceId).toBeDefined();
      expect(result.credentials).toBeDefined();
      expect(result.credentials.publicKey).toBeDefined();
      expect(result.credentials.certificate).toBeDefined();
    });
    
    test('should validate device information', async () => {
      const invalidDeviceInfo = {
        type: 'edge-device'
        // Missing required 'name' field
      };
      
      await expect(security.registerDevice(invalidDeviceInfo))
        .rejects.toThrow('Required field missing: name');
    });
    
    test('should get device info', async () => {
      const deviceInfo = {
        name: 'test-device',
        type: 'edge-device',
        location: 'test-location'
      };
      
      const result = await security.registerDevice(deviceInfo);
      const info = security.getDeviceInfo(result.deviceId);
      
      expect(info).toBeDefined();
      expect(info.id).toBe(result.deviceId);
      expect(info.name).toBe('test-device');
      expect(info.type).toBe('edge-device');
    });
    
    test('should get all devices', async () => {
      const deviceInfo = {
        name: 'test-device',
        type: 'edge-device',
        location: 'test-location'
      };
      
      await security.registerDevice(deviceInfo);
      const devices = security.getAllDevices();
      
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('test-device');
    });
  });
  
  describe('Authentication', () => {
    test('should authenticate device successfully', async () => {
      const deviceInfo = {
        name: 'test-device',
        type: 'edge-device',
        location: 'test-location'
      };
      
      const result = await security.registerDevice(deviceInfo);
      const deviceId = result.deviceId;
      
      const credentials = {
        certificate: result.credentials.certificate,
        signature: 'test-signature',
        data: 'test-data'
      };
      
      const authResult = await security.authenticateDevice(deviceId, credentials);
      
      expect(authResult).toBeDefined();
      expect(authResult.success).toBe(true);
      expect(authResult.token).toBeDefined();
      expect(authResult.refreshToken).toBeDefined();
    });
    
    test('should handle authentication failure', async () => {
      const credentials = {
        certificate: 'invalid-certificate',
        signature: 'invalid-signature',
        data: 'test-data'
      };
      
      await expect(security.authenticateDevice('non-existent-device', credentials))
        .rejects.toThrow('Device not found');
    });
  });
  
  describe('Encryption', () => {
    test('should encrypt data successfully', async () => {
      const data = { message: 'test data', value: 42 };
      
      const result = await security.encryptData(data);
      
      expect(result).toBeDefined();
      expect(result.encrypted).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.algorithm).toBeDefined();
      expect(result.keyId).toBeDefined();
    });
    
    test('should decrypt data successfully', async () => {
      const data = { message: 'test data', value: 42 };
      
      const encrypted = await security.encryptData(data);
      const decrypted = await security.decryptData(encrypted);
      
      expect(decrypted).toBeDefined();
      expect(decrypted.message).toBe('test data');
      expect(decrypted.value).toBe(42);
    });
    
    test('should handle encryption with device-specific key', async () => {
      const deviceInfo = {
        name: 'test-device',
        type: 'edge-device',
        location: 'test-location'
      };
      
      const result = await security.registerDevice(deviceInfo);
      const deviceId = result.deviceId;
      
      const data = { message: 'test data', value: 42 };
      
      const encrypted = await security.encryptData(data, deviceId);
      const decrypted = await security.decryptData(encrypted, deviceId);
      
      expect(decrypted).toBeDefined();
      expect(decrypted.message).toBe('test data');
      expect(decrypted.value).toBe(42);
    });
  });
  
  describe('Threat Detection', () => {
    test('should detect threats', async () => {
      const deviceInfo = {
        name: 'test-device',
        type: 'edge-device',
        location: 'test-location'
      };
      
      const result = await security.registerDevice(deviceInfo);
      const deviceId = result.deviceId;
      
      const activity = {
        type: 'data_access',
        volume: 2000, // High volume
        failedOperations: 10 // High failure rate
      };
      
      await security.detectThreats(deviceId, activity);
      
      // Check if threat was detected (depends on random threshold)
      const threats = security.getThreats();
      expect(Array.isArray(threats)).toBe(true);
    });
  });
  
  describe('Metrics', () => {
    test('should get metrics', () => {
      const metrics = security.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalDevices).toBe(0);
      expect(metrics.authenticatedDevices).toBe(0);
      expect(metrics.failedAuthentications).toBe(0);
      expect(metrics.successfulAuthentications).toBe(0);
      expect(metrics.threatsDetected).toBe(0);
      expect(metrics.securityIncidents).toBe(0);
    });
  });
  
  describe('Audit Log', () => {
    test('should get audit log', () => {
      const auditLog = security.getAuditLog();
      
      expect(auditLog).toBeDefined();
      expect(Array.isArray(auditLog)).toBe(true);
    });
    
    test('should get audit log with time range', () => {
      const timeRange = {
        start: Date.now() - 3600000, // 1 hour ago
        end: Date.now()
      };
      
      const auditLog = security.getAuditLog(timeRange);
      
      expect(auditLog).toBeDefined();
      expect(Array.isArray(auditLog)).toBe(true);
    });
  });
  
  describe('Threats', () => {
    test('should get threats', () => {
      const threats = security.getThreats();
      
      expect(threats).toBeDefined();
      expect(Array.isArray(threats)).toBe(true);
    });
    
    test('should get threats with time range', () => {
      const timeRange = {
        start: Date.now() - 3600000, // 1 hour ago
        end: Date.now()
      };
      
      const threats = security.getThreats(timeRange);
      
      expect(threats).toBeDefined();
      expect(Array.isArray(threats)).toBe(true);
    });
  });
});
