const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EvidenceCollector {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/evidence-collector.log' })
      ]
    });
    
    this.evidence = new Map();
    this.evidenceTypes = new Map();
    this.evidenceSources = new Map();
    this.evidenceValidations = new Map();
    this.metrics = {
      totalEvidence: 0,
      validatedEvidence: 0,
      invalidEvidence: 0,
      totalSize: 0,
      averageSize: 0
    };
  }

  // Initialize evidence collector
  async initialize() {
    try {
      this.initializeEvidenceTypes();
      this.initializeEvidenceSources();
      
      this.logger.info('Evidence collector initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing evidence collector:', error);
      throw error;
    }
  }

  // Initialize evidence types
  initializeEvidenceTypes() {
    this.evidenceTypes.set('document', {
      id: 'document',
      name: 'Document',
      description: 'Text documents, PDFs, and other file-based evidence',
      extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
      maxSize: 50 * 1024 * 1024, // 50MB
      validationRules: ['file_exists', 'file_readable', 'file_size_valid']
    });

    this.evidenceTypes.set('screenshot', {
      id: 'screenshot',
      name: 'Screenshot',
      description: 'Screenshots and images as evidence',
      extensions: ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
      maxSize: 10 * 1024 * 1024, // 10MB
      validationRules: ['file_exists', 'file_readable', 'file_size_valid', 'image_valid']
    });

    this.evidenceTypes.set('log_file', {
      id: 'log_file',
      name: 'Log File',
      description: 'System and application log files',
      extensions: ['.log', '.txt', '.csv'],
      maxSize: 100 * 1024 * 1024, // 100MB
      validationRules: ['file_exists', 'file_readable', 'file_size_valid', 'log_format_valid']
    });

    this.evidenceTypes.set('configuration', {
      id: 'configuration',
      name: 'Configuration File',
      description: 'System and application configuration files',
      extensions: ['.conf', '.cfg', '.ini', '.yaml', '.yml', '.json', '.xml'],
      maxSize: 5 * 1024 * 1024, // 5MB
      validationRules: ['file_exists', 'file_readable', 'file_size_valid', 'config_format_valid']
    });

    this.evidenceTypes.set('database_export', {
      id: 'database_export',
      name: 'Database Export',
      description: 'Database dumps and exports',
      extensions: ['.sql', '.dump', '.backup'],
      maxSize: 500 * 1024 * 1024, // 500MB
      validationRules: ['file_exists', 'file_readable', 'file_size_valid', 'sql_format_valid']
    });

    this.evidenceTypes.set('network_capture', {
      id: 'network_capture',
      name: 'Network Capture',
      description: 'Network traffic captures and packet dumps',
      extensions: ['.pcap', '.cap', '.wireshark'],
      maxSize: 200 * 1024 * 1024, // 200MB
      validationRules: ['file_exists', 'file_readable', 'file_size_valid', 'pcap_format_valid']
    });
  }

  // Initialize evidence sources
  initializeEvidenceSources() {
    this.evidenceSources.set('manual_upload', {
      id: 'manual_upload',
      name: 'Manual Upload',
      description: 'Evidence uploaded manually by users',
      type: 'manual',
      reliability: 'medium'
    });

    this.evidenceSources.set('automated_collection', {
      id: 'automated_collection',
      name: 'Automated Collection',
      description: 'Evidence collected automatically by systems',
      type: 'automated',
      reliability: 'high'
    });

    this.evidenceSources.set('external_system', {
      id: 'external_system',
      name: 'External System',
      description: 'Evidence collected from external systems',
      type: 'external',
      reliability: 'medium'
    });

    this.evidenceSources.set('audit_trail', {
      id: 'audit_trail',
      name: 'Audit Trail',
      description: 'Evidence from system audit trails',
      type: 'audit',
      reliability: 'high'
    });
  }

  // Collect evidence
  async collectEvidence(config) {
    try {
      const evidence = {
        id: this.generateId(),
        name: config.name,
        description: config.description || '',
        type: config.type,
        source: config.source || 'manual_upload',
        category: config.category || 'general',
        tags: config.tags || [],
        filePath: config.filePath || null,
        fileName: config.fileName || null,
        fileSize: 0,
        mimeType: config.mimeType || null,
        hash: null,
        metadata: config.metadata || {},
        status: 'collected',
        validated: false,
        validationResults: [],
        collectedAt: new Date(),
        collectedBy: config.collectedBy || 'system',
        expiresAt: config.expiresAt || moment().add(7, 'years').toDate(),
        retentionPeriod: config.retentionPeriod || '7years',
        accessLevel: config.accessLevel || 'restricted',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Process file if provided
      if (config.filePath && fs.existsSync(config.filePath)) {
        const fileStats = fs.statSync(config.filePath);
        evidence.fileSize = fileStats.size;
        evidence.fileName = path.basename(config.filePath);
        evidence.mimeType = this.getMimeType(config.filePath);
        evidence.hash = await this.calculateFileHash(config.filePath);
      }

      // Validate evidence
      const validationResults = await this.validateEvidence(evidence);
      evidence.validationResults = validationResults;
      evidence.validated = validationResults.every(r => r.valid);

      this.evidence.set(evidence.id, evidence);
      this.metrics.totalEvidence++;
      this.metrics.totalSize += evidence.fileSize;
      this.metrics.averageSize = this.metrics.totalSize / this.metrics.totalEvidence;

      if (evidence.validated) {
        this.metrics.validatedEvidence++;
      } else {
        this.metrics.invalidEvidence++;
      }

      this.logger.info('Evidence collected successfully', { 
        id: evidence.id, 
        name: evidence.name, 
        type: evidence.type,
        validated: evidence.validated
      });

      return evidence;
    } catch (error) {
      this.logger.error('Error collecting evidence:', error);
      throw error;
    }
  }

  // Validate evidence
  async validateEvidence(evidence) {
    try {
      const evidenceType = this.evidenceTypes.get(evidence.type);
      if (!evidenceType) {
        return [{ rule: 'type_valid', valid: false, message: 'Invalid evidence type' }];
      }

      const results = [];

      for (const rule of evidenceType.validationRules) {
        try {
          const result = await this.validateRule(evidence, rule);
          results.push(result);
        } catch (error) {
          results.push({
            rule,
            valid: false,
            message: error.message
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Error validating evidence:', error);
      throw error;
    }
  }

  // Validate specific rule
  async validateRule(evidence, rule) {
    switch (rule) {
      case 'file_exists':
        return {
          rule,
          valid: evidence.filePath ? fs.existsSync(evidence.filePath) : false,
          message: evidence.filePath ? 'File exists' : 'File path not provided'
        };

      case 'file_readable':
        return {
          rule,
          valid: evidence.filePath ? this.isFileReadable(evidence.filePath) : false,
          message: evidence.filePath ? 'File is readable' : 'File path not provided'
        };

      case 'file_size_valid':
        const maxSize = this.evidenceTypes.get(evidence.type)?.maxSize || 0;
        return {
          rule,
          valid: evidence.fileSize <= maxSize,
          message: `File size ${evidence.fileSize} bytes is ${evidence.fileSize <= maxSize ? 'valid' : 'too large'}`
        };

      case 'image_valid':
        return {
          rule,
          valid: this.isValidImage(evidence.filePath),
          message: this.isValidImage(evidence.filePath) ? 'Valid image file' : 'Invalid image file'
        };

      case 'log_format_valid':
        return {
          rule,
          valid: this.isValidLogFile(evidence.filePath),
          message: this.isValidLogFile(evidence.filePath) ? 'Valid log file format' : 'Invalid log file format'
        };

      case 'config_format_valid':
        return {
          rule,
          valid: this.isValidConfigFile(evidence.filePath),
          message: this.isValidConfigFile(evidence.filePath) ? 'Valid config file format' : 'Invalid config file format'
        };

      case 'sql_format_valid':
        return {
          rule,
          valid: this.isValidSqlFile(evidence.filePath),
          message: this.isValidSqlFile(evidence.filePath) ? 'Valid SQL file format' : 'Invalid SQL file format'
        };

      case 'pcap_format_valid':
        return {
          rule,
          valid: this.isValidPcapFile(evidence.filePath),
          message: this.isValidPcapFile(evidence.filePath) ? 'Valid PCAP file format' : 'Invalid PCAP file format'
        };

      default:
        return {
          rule,
          valid: true,
          message: 'Rule not implemented'
        };
    }
  }

  // Helper validation methods
  isFileReadable(filePath) {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  isValidImage(filePath) {
    if (!filePath) return false;
    const ext = path.extname(filePath).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.bmp'].includes(ext);
  }

  isValidLogFile(filePath) {
    if (!filePath) return false;
    const ext = path.extname(filePath).toLowerCase();
    return ['.log', '.txt', '.csv'].includes(ext);
  }

  isValidConfigFile(filePath) {
    if (!filePath) return false;
    const ext = path.extname(filePath).toLowerCase();
    return ['.conf', '.cfg', '.ini', '.yaml', '.yml', '.json', '.xml'].includes(ext);
  }

  isValidSqlFile(filePath) {
    if (!filePath) return false;
    const ext = path.extname(filePath).toLowerCase();
    return ['.sql', '.dump', '.backup'].includes(ext);
  }

  isValidPcapFile(filePath) {
    if (!filePath) return false;
    const ext = path.extname(filePath).toLowerCase();
    return ['.pcap', '.cap', '.wireshark'].includes(ext);
  }

  // Get MIME type
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.log': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.yaml': 'application/x-yaml',
      '.yml': 'application/x-yaml',
      '.sql': 'application/sql',
      '.pcap': 'application/vnd.tcpdump.pcap'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Calculate file hash
  async calculateFileHash(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      this.logger.error('Error calculating file hash:', error);
      return null;
    }
  }

  // Store evidence
  async storeEvidence(evidenceId, filePath) {
    try {
      const evidence = this.evidence.get(evidenceId);
      if (!evidence) {
        throw new Error('Evidence not found');
      }

      const evidenceDir = path.join(process.cwd(), 'evidence');
      if (!fs.existsSync(evidenceDir)) {
        fs.mkdirSync(evidenceDir, { recursive: true });
      }

      const fileName = `${evidenceId}_${evidence.fileName || 'evidence'}`;
      const storedPath = path.join(evidenceDir, fileName);

      if (filePath && fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, storedPath);
        evidence.filePath = storedPath;
        evidence.updatedAt = new Date();
        this.evidence.set(evidenceId, evidence);
      }

      this.logger.info('Evidence stored successfully', { evidenceId, storedPath });
      return storedPath;
    } catch (error) {
      this.logger.error('Error storing evidence:', error);
      throw error;
    }
  }

  // Get evidence
  async getEvidence(id) {
    const evidence = this.evidence.get(id);
    if (!evidence) {
      throw new Error('Evidence not found');
    }
    return evidence;
  }

  // List evidence
  async listEvidence(filters = {}) {
    let evidence = Array.from(this.evidence.values());
    
    if (filters.type) {
      evidence = evidence.filter(e => e.type === filters.type);
    }
    
    if (filters.category) {
      evidence = evidence.filter(e => e.category === filters.category);
    }
    
    if (filters.source) {
      evidence = evidence.filter(e => e.source === filters.source);
    }
    
    if (filters.validated !== undefined) {
      evidence = evidence.filter(e => e.validated === filters.validated);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      evidence = evidence.filter(e => 
        filters.tags.some(tag => e.tags.includes(tag))
      );
    }
    
    return evidence.sort((a, b) => b.collectedAt - a.collectedAt);
  }

  // Search evidence
  async searchEvidence(query) {
    const evidence = Array.from(this.evidence.values());
    
    return evidence.filter(e => 
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.description.toLowerCase().includes(query.toLowerCase()) ||
      e.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }

  // Get evidence by hash
  async getEvidenceByHash(hash) {
    const evidence = Array.from(this.evidence.values())
      .find(e => e.hash === hash);
    
    return evidence || null;
  }

  // Update evidence
  async updateEvidence(id, updates) {
    try {
      const evidence = this.evidence.get(id);
      if (!evidence) {
        throw new Error('Evidence not found');
      }

      Object.assign(evidence, updates);
      evidence.updatedAt = new Date();

      this.evidence.set(id, evidence);

      this.logger.info('Evidence updated successfully', { id });
      return evidence;
    } catch (error) {
      this.logger.error('Error updating evidence:', error);
      throw error;
    }
  }

  // Delete evidence
  async deleteEvidence(id) {
    try {
      const evidence = this.evidence.get(id);
      if (!evidence) {
        throw new Error('Evidence not found');
      }

      // Delete file if exists
      if (evidence.filePath && fs.existsSync(evidence.filePath)) {
        fs.unlinkSync(evidence.filePath);
      }

      this.evidence.delete(id);
      this.metrics.totalEvidence--;
      this.metrics.totalSize -= evidence.fileSize;
      this.metrics.averageSize = this.metrics.totalEvidence > 0 ? 
        this.metrics.totalSize / this.metrics.totalEvidence : 0;

      this.logger.info('Evidence deleted successfully', { id });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting evidence:', error);
      throw error;
    }
  }

  // Get evidence types
  async getEvidenceTypes() {
    return Array.from(this.evidenceTypes.values());
  }

  // Get evidence sources
  async getEvidenceSources() {
    return Array.from(this.evidenceSources.values());
  }

  // Get metrics
  async getMetrics() {
    return {
      ...this.metrics,
      validationRate: this.metrics.totalEvidence > 0 ? 
        (this.metrics.validatedEvidence / this.metrics.totalEvidence) * 100 : 0
    };
  }

  // Generate unique ID
  generateId() {
    return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new EvidenceCollector();
