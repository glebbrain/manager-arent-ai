class ExportValidator {
  constructor(logger) {
    this.logger = logger;
    this.validationRules = new Map();
    this.initializeValidationRules();
  }

  initializeValidationRules() {
    // Data validation rules
    this.validationRules.set('data', {
      required: true,
      type: ['object', 'array', 'string'],
      validate: (data) => {
        if (typeof data === 'string') {
          try {
            JSON.parse(data);
            return { valid: true };
          } catch {
            return { valid: false, error: 'Invalid JSON string' };
          }
        }
        return { valid: true };
      }
    });

    // Format validation rules
    this.validationRules.set('format', {
      required: true,
      type: 'string',
      enum: ['csv', 'excel', 'xlsx', 'json', 'xml', 'pdf', 'txt', 'yaml', 'yml', 'html', 'markdown', 'md', 'zip'],
      validate: (format) => {
        const supportedFormats = ['csv', 'excel', 'xlsx', 'json', 'xml', 'pdf', 'txt', 'yaml', 'yml', 'html', 'markdown', 'md', 'zip'];
        if (!supportedFormats.includes(format.toLowerCase())) {
          return { valid: false, error: `Unsupported format: ${format}` };
        }
        return { valid: true };
      }
    });

    // Options validation rules
    this.validationRules.set('options', {
      required: false,
      type: 'object',
      properties: {
        userId: { type: 'string', minLength: 1 },
        dataSource: { type: 'string', minLength: 1 },
        title: { type: 'string', maxLength: 255 },
        description: { type: 'string', maxLength: 1000 },
        expirationHours: { type: 'number', minimum: 1, maximum: 168 }, // 1 hour to 1 week
        pretty: { type: 'boolean' },
        includeHeaders: { type: 'boolean' },
        delimiter: { type: 'string', minLength: 1, maxLength: 1 },
        sheetName: { type: 'string', maxLength: 31 }, // Excel sheet name limit
        rootName: { type: 'string', minLength: 1, maxLength: 50 },
        itemName: { type: 'string', minLength: 1, maxLength: 50 },
        pageSize: { type: 'string', enum: ['A4', 'A3', 'Letter', 'Legal'] },
        orientation: { type: 'string', enum: ['portrait', 'landscape'] },
        margin: { type: 'number', minimum: 0, maximum: 100 },
        fontSize: { type: 'number', minimum: 8, maximum: 72 },
        fontFamily: { type: 'string', maxLength: 50 },
        color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        backgroundColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        border: { type: 'boolean' },
        borderColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        borderWidth: { type: 'number', minimum: 0.1, maximum: 10 },
        headerStyle: { type: 'object' },
        rowStyle: { type: 'object' },
        cellStyle: { type: 'object' },
        filters: { type: 'array' },
        sort: { type: 'array' },
        groupBy: { type: 'array' },
        aggregate: { type: 'array' },
        pagination: { type: 'object' },
        fieldMappings: { type: 'object' },
        transformations: { type: 'object' },
        includeFields: { type: 'array' },
        excludeFields: { type: 'array' },
        files: { type: 'array' }
      }
    });

    // Schedule validation rules
    this.validationRules.set('schedule', {
      required: true,
      type: 'object',
      properties: {
        expression: { type: 'string', minLength: 1 },
        timezone: { type: 'string', maxLength: 50 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        enabled: { type: 'boolean' }
      }
    });
  }

  async validateExportRequest(request) {
    try {
      this.logger.info('Validating export request');
      
      // Validate required fields
      const requiredFields = ['data', 'format'];
      for (const field of requiredFields) {
        if (!request[field]) {
          return { valid: false, error: `Missing required field: ${field}` };
        }
      }
      
      // Validate data
      const dataValidation = await this.validateField('data', request.data);
      if (!dataValidation.valid) {
        return dataValidation;
      }
      
      // Validate format
      const formatValidation = await this.validateField('format', request.format);
      if (!formatValidation.valid) {
        return formatValidation;
      }
      
      // Validate options
      if (request.options) {
        const optionsValidation = await this.validateField('options', request.options);
        if (!optionsValidation.valid) {
          return optionsValidation;
        }
      }
      
      // Validate data size
      const sizeValidation = this.validateDataSize(request.data, request.format);
      if (!sizeValidation.valid) {
        return sizeValidation;
      }
      
      // Validate format-specific requirements
      const formatSpecificValidation = this.validateFormatSpecific(request.format, request.options);
      if (!formatSpecificValidation.valid) {
        return formatSpecificValidation;
      }
      
      this.logger.info('Export request validation passed');
      return { valid: true };
    } catch (error) {
      this.logger.error('Export request validation failed:', error);
      return { valid: false, error: error.message };
    }
  }

  async validateField(fieldName, value) {
    try {
      const rule = this.validationRules.get(fieldName);
      if (!rule) {
        return { valid: true }; // No validation rule defined
      }
      
      // Check required
      if (rule.required && (value === undefined || value === null)) {
        return { valid: false, error: `Field ${fieldName} is required` };
      }
      
      // Check type
      if (rule.type && !this.checkType(value, rule.type)) {
        return { valid: false, error: `Field ${fieldName} must be of type ${rule.type}` };
      }
      
      // Check enum
      if (rule.enum && !rule.enum.includes(value)) {
        return { valid: false, error: `Field ${fieldName} must be one of: ${rule.enum.join(', ')}` };
      }
      
      // Check custom validation
      if (rule.validate) {
        const customValidation = rule.validate(value);
        if (!customValidation.valid) {
          return customValidation;
        }
      }
      
      // Check object properties
      if (rule.properties && typeof value === 'object' && value !== null) {
        for (const [propName, propRule] of Object.entries(rule.properties)) {
          const propValue = value[propName];
          
          if (propRule.required && (propValue === undefined || propValue === null)) {
            return { valid: false, error: `Property ${propName} is required` };
          }
          
          if (propValue !== undefined && propValue !== null) {
            if (propRule.type && !this.checkType(propValue, propRule.type)) {
              return { valid: false, error: `Property ${propName} must be of type ${propRule.type}` };
            }
            
            if (propRule.enum && !propRule.enum.includes(propValue)) {
              return { valid: false, error: `Property ${propName} must be one of: ${propRule.enum.join(', ')}` };
            }
            
            if (propRule.minLength && String(propValue).length < propRule.minLength) {
              return { valid: false, error: `Property ${propName} must be at least ${propRule.minLength} characters long` };
            }
            
            if (propRule.maxLength && String(propValue).length > propRule.maxLength) {
              return { valid: false, error: `Property ${propName} must be at most ${propRule.maxLength} characters long` };
            }
            
            if (propRule.minimum && Number(propValue) < propRule.minimum) {
              return { valid: false, error: `Property ${propName} must be at least ${propRule.minimum}` };
            }
            
            if (propRule.maximum && Number(propValue) > propRule.maximum) {
              return { valid: false, error: `Property ${propName} must be at most ${propRule.maximum}` };
            }
            
            if (propRule.pattern && !new RegExp(propRule.pattern).test(propValue)) {
              return { valid: false, error: `Property ${propName} does not match required pattern` };
            }
          }
        }
      }
      
      return { valid: true };
    } catch (error) {
      this.logger.error(`Field validation failed for ${fieldName}:`, error);
      return { valid: false, error: error.message };
    }
  }

  checkType(value, expectedType) {
    if (Array.isArray(expectedType)) {
      return expectedType.some(type => this.checkType(value, type));
    }
    
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      default:
        return true;
    }
  }

  validateDataSize(data, format) {
    try {
      const dataSize = this.calculateDataSize(data);
      const maxSizes = {
        csv: 100 * 1024 * 1024, // 100MB
        excel: 50 * 1024 * 1024, // 50MB
        xlsx: 50 * 1024 * 1024, // 50MB
        json: 100 * 1024 * 1024, // 100MB
        xml: 100 * 1024 * 1024, // 100MB
        pdf: 10 * 1024 * 1024, // 10MB
        txt: 100 * 1024 * 1024, // 100MB
        yaml: 100 * 1024 * 1024, // 100MB
        yml: 100 * 1024 * 1024, // 100MB
        html: 50 * 1024 * 1024, // 50MB
        markdown: 50 * 1024 * 1024, // 50MB
        md: 50 * 1024 * 1024, // 50MB
        zip: 200 * 1024 * 1024 // 200MB
      };
      
      const maxSize = maxSizes[format.toLowerCase()] || 100 * 1024 * 1024;
      
      if (dataSize > maxSize) {
        return { 
          valid: false, 
          error: `Data size (${this.formatBytes(dataSize)}) exceeds maximum allowed size (${this.formatBytes(maxSize)}) for ${format} format` 
        };
      }
      
      return { valid: true };
    } catch (error) {
      this.logger.error('Data size validation failed:', error);
      return { valid: false, error: error.message };
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

  validateFormatSpecific(format, options = {}) {
    try {
      switch (format.toLowerCase()) {
        case 'excel':
        case 'xlsx':
          if (options.sheetName && options.sheetName.length > 31) {
            return { valid: false, error: 'Excel sheet name must be 31 characters or less' };
          }
          break;
        
        case 'csv':
          if (options.delimiter && options.delimiter.length !== 1) {
            return { valid: false, error: 'CSV delimiter must be a single character' };
          }
          break;
        
        case 'pdf':
          if (options.pageSize && !['A4', 'A3', 'Letter', 'Legal'].includes(options.pageSize)) {
            return { valid: false, error: 'PDF page size must be A4, A3, Letter, or Legal' };
          }
          if (options.orientation && !['portrait', 'landscape'].includes(options.orientation)) {
            return { valid: false, error: 'PDF orientation must be portrait or landscape' };
          }
          break;
        
        case 'xml':
          if (options.rootName && !/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(options.rootName)) {
            return { valid: false, error: 'XML root name must be a valid XML element name' };
          }
          if (options.itemName && !/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(options.itemName)) {
            return { valid: false, error: 'XML item name must be a valid XML element name' };
          }
          break;
      }
      
      return { valid: true };
    } catch (error) {
      this.logger.error('Format-specific validation failed:', error);
      return { valid: false, error: error.message };
    }
  }

  async validateScheduleRequest(request) {
    try {
      this.logger.info('Validating schedule request');
      
      // Validate required fields
      const requiredFields = ['schedule', 'data', 'format'];
      for (const field of requiredFields) {
        if (!request[field]) {
          return { valid: false, error: `Missing required field: ${field}` };
        }
      }
      
      // Validate schedule
      const scheduleValidation = await this.validateField('schedule', request.schedule);
      if (!scheduleValidation.valid) {
        return scheduleValidation;
      }
      
      // Validate cron expression
      if (request.schedule.expression) {
        const cronValidation = this.validateCronExpression(request.schedule.expression);
        if (!cronValidation.valid) {
          return cronValidation;
        }
      }
      
      // Validate export request
      const exportValidation = await this.validateExportRequest({
        data: request.data,
        format: request.format,
        options: request.options
      });
      
      if (!exportValidation.valid) {
        return exportValidation;
      }
      
      this.logger.info('Schedule request validation passed');
      return { valid: true };
    } catch (error) {
      this.logger.error('Schedule request validation failed:', error);
      return { valid: false, error: error.message };
    }
  }

  validateCronExpression(expression) {
    try {
      const cronParser = require('cron-parser');
      cronParser.parseExpression(expression);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Invalid cron expression: ${error.message}` };
    }
  }

  // Add custom validation rule
  addValidationRule(fieldName, rule) {
    this.validationRules.set(fieldName, rule);
    this.logger.info(`Added validation rule for field: ${fieldName}`);
  }

  // Remove validation rule
  removeValidationRule(fieldName) {
    this.validationRules.delete(fieldName);
    this.logger.info(`Removed validation rule for field: ${fieldName}`);
  }

  // Get validation rules
  getValidationRules() {
    return Object.fromEntries(this.validationRules);
  }
}

module.exports = ExportValidator;
