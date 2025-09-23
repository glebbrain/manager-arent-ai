class ExportSecurity {
  constructor(logger) {
    this.logger = logger;
    this.securityRules = new Map();
    this.initializeSecurityRules();
  }

  initializeSecurityRules() {
    // Rate limiting rules
    this.securityRules.set('rateLimit', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per window
      message: 'Too many requests, please try again later'
    });

    // File size limits
    this.securityRules.set('fileSize', {
      maxSize: 100 * 1024 * 1024, // 100MB
      message: 'File size exceeds maximum allowed limit'
    });

    // Allowed formats
    this.securityRules.set('allowedFormats', [
      'csv', 'excel', 'xlsx', 'json', 'xml', 'pdf', 'txt', 
      'yaml', 'yml', 'html', 'markdown', 'md', 'zip'
    ]);

    // Blocked file extensions
    this.securityRules.set('blockedExtensions', [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar',
      '.app', '.deb', '.pkg', '.dmg', '.iso', '.bin', '.sh', '.ps1'
    ]);

    // Allowed data sources
    this.securityRules.set('allowedDataSources', [
      'database', 'api', 'file', 'manual'
    ]);

    // Content validation rules
    this.securityRules.set('contentValidation', {
      maxDepth: 10,
      maxArrayLength: 10000,
      maxStringLength: 1000000,
      allowedTypes: ['string', 'number', 'boolean', 'object', 'array', 'null']
    });
  }

  async validateRequest(request) {
    try {
      this.logger.info('Validating export request security');
      
      // Check rate limiting
      const rateLimitCheck = await this.checkRateLimit(request);
      if (!rateLimitCheck.allowed) {
        return { allowed: false, reason: rateLimitCheck.reason };
      }
      
      // Check file size
      const fileSizeCheck = this.checkFileSize(request);
      if (!fileSizeCheck.allowed) {
        return { allowed: false, reason: fileSizeCheck.reason };
      }
      
      // Check format
      const formatCheck = this.checkFormat(request.format);
      if (!formatCheck.allowed) {
        return { allowed: false, reason: formatCheck.reason };
      }
      
      // Check data source
      const dataSourceCheck = this.checkDataSource(request.options?.dataSource);
      if (!dataSourceCheck.allowed) {
        return { allowed: false, reason: dataSourceCheck.reason };
      }
      
      // Check content
      const contentCheck = this.checkContent(request.data);
      if (!contentCheck.allowed) {
        return { allowed: false, reason: contentCheck.reason };
      }
      
      // Check for malicious content
      const maliciousCheck = this.checkMaliciousContent(request.data);
      if (!maliciousCheck.allowed) {
        return { allowed: false, reason: maliciousCheck.reason };
      }
      
      this.logger.info('Export request security validation passed');
      return { allowed: true };
    } catch (error) {
      this.logger.error('Security validation failed:', error);
      return { allowed: false, reason: 'Security validation error' };
    }
  }

  async checkRateLimit(request) {
    try {
      const clientId = this.getClientId(request);
      const key = `rate_limit:${clientId}`;
      
      // Get current request count
      const currentCount = await this.redis.get(key) || 0;
      const count = parseInt(currentCount);
      
      const rule = this.securityRules.get('rateLimit');
      
      if (count >= rule.maxRequests) {
        return { 
          allowed: false, 
          reason: `Rate limit exceeded. Maximum ${rule.maxRequests} requests per ${rule.windowMs / 1000 / 60} minutes` 
        };
      }
      
      // Increment counter
      if (count === 0) {
        await this.redis.setEx(key, rule.windowMs / 1000, '1');
      } else {
        await this.redis.incr(key);
      }
      
      return { allowed: true };
    } catch (error) {
      this.logger.error('Rate limit check failed:', error);
      return { allowed: true }; // Allow on error
    }
  }

  checkFileSize(request) {
    try {
      const dataSize = this.calculateDataSize(request.data);
      const rule = this.securityRules.get('fileSize');
      
      if (dataSize > rule.maxSize) {
        return { 
          allowed: false, 
          reason: `Data size (${this.formatBytes(dataSize)}) exceeds maximum allowed size (${this.formatBytes(rule.maxSize)})` 
        };
      }
      
      return { allowed: true };
    } catch (error) {
      this.logger.error('File size check failed:', error);
      return { allowed: true }; // Allow on error
    }
  }

  checkFormat(format) {
    try {
      const allowedFormats = this.securityRules.get('allowedFormats');
      
      if (!allowedFormats.includes(format.toLowerCase())) {
        return { 
          allowed: false, 
          reason: `Format '${format}' is not allowed. Allowed formats: ${allowedFormats.join(', ')}` 
        };
      }
      
      return { allowed: true };
    } catch (error) {
      this.logger.error('Format check failed:', error);
      return { allowed: true }; // Allow on error
    }
  }

  checkDataSource(dataSource) {
    try {
      if (!dataSource) {
        return { allowed: true }; // Allow if no data source specified
      }
      
      const allowedSources = this.securityRules.get('allowedDataSources');
      
      if (!allowedSources.includes(dataSource.toLowerCase())) {
        return { 
          allowed: false, 
          reason: `Data source '${dataSource}' is not allowed. Allowed sources: ${allowedSources.join(', ')}` 
        };
      }
      
      return { allowed: true };
    } catch (error) {
      this.logger.error('Data source check failed:', error);
      return { allowed: true }; // Allow on error
    }
  }

  checkContent(data) {
    try {
      const rule = this.securityRules.get('contentValidation');
      
      // Check data depth
      const depth = this.calculateDepth(data);
      if (depth > rule.maxDepth) {
        return { 
          allowed: false, 
          reason: `Data depth (${depth}) exceeds maximum allowed depth (${rule.maxDepth})` 
        };
      }
      
      // Check array length
      if (Array.isArray(data) && data.length > rule.maxArrayLength) {
        return { 
          allowed: false, 
          reason: `Array length (${data.length}) exceeds maximum allowed length (${rule.maxArrayLength})` 
        };
      }
      
      // Check string length
      if (typeof data === 'string' && data.length > rule.maxStringLength) {
        return { 
          allowed: false, 
          reason: `String length (${data.length}) exceeds maximum allowed length (${rule.maxStringLength})` 
        };
      }
      
      // Check data types
      const typeCheck = this.checkDataTypes(data, rule.allowedTypes);
      if (!typeCheck.allowed) {
        return typeCheck;
      }
      
      return { allowed: true };
    } catch (error) {
      this.logger.error('Content check failed:', error);
      return { allowed: true }; // Allow on error
    }
  }

  checkMaliciousContent(data) {
    try {
      const dataString = JSON.stringify(data).toLowerCase();
      
      // Check for SQL injection patterns
      const sqlPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /insert\s+into/i,
        /update\s+set/i,
        /alter\s+table/i,
        /create\s+table/i,
        /exec\s*\(/i,
        /execute\s*\(/i
      ];
      
      for (const pattern of sqlPatterns) {
        if (pattern.test(dataString)) {
          return { 
            allowed: false, 
            reason: 'Potential SQL injection detected in data' 
          };
        }
      }
      
      // Check for script injection patterns
      const scriptPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        /onclick\s*=/gi,
        /onmouseover\s*=/gi
      ];
      
      for (const pattern of scriptPatterns) {
        if (pattern.test(dataString)) {
          return { 
            allowed: false, 
            reason: 'Potential script injection detected in data' 
          };
        }
      }
      
      // Check for file path traversal
      const pathPatterns = [
        /\.\.\//g,
        /\.\.\\/g,
        /\.\.%2f/gi,
        /\.\.%5c/gi,
        /\.\.%252f/gi,
        /\.\.%255c/gi
      ];
      
      for (const pattern of pathPatterns) {
        if (pattern.test(dataString)) {
          return { 
            allowed: false, 
            reason: 'Potential path traversal detected in data' 
          };
        }
      }
      
      // Check for blocked file extensions
      const blockedExtensions = this.securityRules.get('blockedExtensions');
      for (const extension of blockedExtensions) {
        if (dataString.includes(extension)) {
          return { 
            allowed: false, 
            reason: `Blocked file extension detected: ${extension}` 
          };
        }
      }
      
      return { allowed: true };
    } catch (error) {
      this.logger.error('Malicious content check failed:', error);
      return { allowed: true }; // Allow on error
    }
  }

  calculateDataSize(data) {
    if (typeof data === 'string') {
      return Buffer.byteLength(data, 'utf8');
    }
    
    if (Array.isArray(data)) {
      return Buffer.byteLength(JSON.stringify(data), 'utf8');
    }
    
    if (typeof data === 'object' && data !== null) {
      return Buffer.byteLength(JSON.stringify(data), 'utf8');
    }
    
    return 0;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  calculateDepth(data, currentDepth = 0) {
    if (currentDepth > 20) return currentDepth; // Prevent infinite recursion
    
    if (Array.isArray(data)) {
      return Math.max(...data.map(item => this.calculateDepth(item, currentDepth + 1)));
    }
    
    if (typeof data === 'object' && data !== null) {
      return Math.max(...Object.values(data).map(value => this.calculateDepth(value, currentDepth + 1)));
    }
    
    return currentDepth;
  }

  checkDataTypes(data, allowedTypes) {
    const dataType = this.getDataType(data);
    
    if (!allowedTypes.includes(dataType)) {
      return { 
        allowed: false, 
        reason: `Data type '${dataType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }
    
    if (Array.isArray(data)) {
      for (const item of data) {
        const itemCheck = this.checkDataTypes(item, allowedTypes);
        if (!itemCheck.allowed) {
          return itemCheck;
        }
      }
    }
    
    if (typeof data === 'object' && data !== null) {
      for (const value of Object.values(data)) {
        const valueCheck = this.checkDataTypes(value, allowedTypes);
        if (!valueCheck.allowed) {
          return valueCheck;
        }
      }
    }
    
    return { allowed: true };
  }

  getDataType(data) {
    if (data === null) return 'null';
    if (Array.isArray(data)) return 'array';
    return typeof data;
  }

  getClientId(request) {
    // Get client identifier from request
    return request.ip || 
           request.headers['x-forwarded-for'] || 
           request.headers['x-real-ip'] || 
           'unknown';
  }

  // Add security rule
  addSecurityRule(name, rule) {
    this.securityRules.set(name, rule);
    this.logger.info(`Added security rule: ${name}`);
  }

  // Remove security rule
  removeSecurityRule(name) {
    this.securityRules.delete(name);
    this.logger.info(`Removed security rule: ${name}`);
  }

  // Get security rules
  getSecurityRules() {
    return Object.fromEntries(this.securityRules);
  }

  // Validate file upload
  async validateFileUpload(file) {
    try {
      // Check file size
      const fileSizeCheck = this.checkFileSize({ data: file.buffer });
      if (!fileSizeCheck.allowed) {
        return fileSizeCheck;
      }
      
      // Check file extension
      const extension = this.getFileExtension(file.originalname);
      const blockedExtensions = this.securityRules.get('blockedExtensions');
      
      if (blockedExtensions.includes(extension)) {
        return { 
          allowed: false, 
          reason: `File extension '${extension}' is not allowed` 
        };
      }
      
      // Check file content
      const contentCheck = this.checkFileContent(file.buffer);
      if (!contentCheck.allowed) {
        return contentCheck;
      }
      
      return { allowed: true };
    } catch (error) {
      this.logger.error('File upload validation failed:', error);
      return { allowed: false, reason: 'File validation error' };
    }
  }

  getFileExtension(filename) {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
  }

  checkFileContent(buffer) {
    try {
      // Check for executable file signatures
      const executableSignatures = [
        [0x4D, 0x5A], // PE executable
        [0x7F, 0x45, 0x4C, 0x46], // ELF executable
        [0xCA, 0xFE, 0xBA, 0xBE], // Java class file
        [0xFE, 0xED, 0xFA, 0xCE], // Mach-O binary
        [0xFE, 0xED, 0xFA, 0xCF], // Mach-O binary (64-bit)
        [0xCE, 0xFA, 0xED, 0xFE], // Mach-O binary (reverse)
        [0xCF, 0xFA, 0xED, 0xFE]  // Mach-O binary (64-bit reverse)
      ];
      
      for (const signature of executableSignatures) {
        if (this.bufferStartsWith(buffer, signature)) {
          return { 
            allowed: false, 
            reason: 'Executable file detected' 
          };
        }
      }
      
      return { allowed: true };
    } catch (error) {
      this.logger.error('File content check failed:', error);
      return { allowed: true }; // Allow on error
    }
  }

  bufferStartsWith(buffer, signature) {
    if (buffer.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false;
    }
    
    return true;
  }
}

module.exports = ExportSecurity;
