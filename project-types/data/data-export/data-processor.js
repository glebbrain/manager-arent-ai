class DataProcessor {
  constructor(pool, logger) {
    this.pool = pool;
    this.logger = logger;
    this.dataSources = new Map();
  }

  async initialize() {
    try {
      await this.registerDataSources();
      this.logger.info('Data Processor initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Data Processor:', error);
      throw error;
    }
  }

  async registerDataSources() {
    // Register built-in data sources
    this.dataSources.set('database', {
      name: 'Database',
      description: 'Query data from PostgreSQL database',
      type: 'database',
      handler: this.handleDatabaseQuery.bind(this)
    });

    this.dataSources.set('api', {
      name: 'API',
      description: 'Fetch data from external API',
      type: 'api',
      handler: this.handleApiQuery.bind(this)
    });

    this.dataSources.set('file', {
      name: 'File',
      description: 'Read data from file',
      type: 'file',
      handler: this.handleFileQuery.bind(this)
    });

    this.dataSources.set('manual', {
      name: 'Manual',
      description: 'Manually provided data',
      type: 'manual',
      handler: this.handleManualData.bind(this)
    });
  }

  async processData(data, options = {}) {
    try {
      this.logger.info('Processing data with options:', options);
      
      // Determine data source
      const dataSource = options.dataSource || 'manual';
      
      if (!this.dataSources.has(dataSource)) {
        throw new Error(`Unknown data source: ${dataSource}`);
      }
      
      const source = this.dataSources.get(dataSource);
      const processedData = await source.handler(data, options);
      
      // Apply post-processing
      const finalData = await this.applyPostProcessing(processedData, options);
      
      this.logger.info(`Data processed successfully: ${finalData.length || 1} records`);
      return finalData;
    } catch (error) {
      this.logger.error('Data processing failed:', error);
      throw error;
    }
  }

  async handleDatabaseQuery(query, options = {}) {
    try {
      if (typeof query === 'string') {
        const result = await this.pool.query(query);
        return result.rows;
      }
      
      if (query.table) {
        let sql = `SELECT * FROM ${query.table}`;
        const params = [];
        let paramCount = 0;
        
        if (query.where) {
          sql += ' WHERE ';
          const conditions = [];
          Object.entries(query.where).forEach(([field, value]) => {
            conditions.push(`${field} = $${++paramCount}`);
            params.push(value);
          });
          sql += conditions.join(' AND ');
        }
        
        if (query.orderBy) {
          sql += ` ORDER BY ${query.orderBy}`;
        }
        
        if (query.limit) {
          sql += ` LIMIT $${++paramCount}`;
          params.push(query.limit);
        }
        
        const result = await this.pool.query(sql, params);
        return result.rows;
      }
      
      throw new Error('Invalid database query format');
    } catch (error) {
      this.logger.error('Database query failed:', error);
      throw error;
    }
  }

  async handleApiQuery(url, options = {}) {
    try {
      const fetch = require('node-fetch');
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      this.logger.error('API query failed:', error);
      throw error;
    }
  }

  async handleFileQuery(filePath, options = {}) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const fileExtension = path.extname(filePath).toLowerCase();
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      switch (fileExtension) {
        case '.json':
          return JSON.parse(fileContent);
        case '.csv':
          return await this.parseCSV(fileContent);
        case '.xml':
          return await this.parseXML(fileContent);
        case '.yaml':
        case '.yml':
          const yaml = require('yaml');
          return yaml.parse(fileContent);
        default:
          return fileContent;
      }
    } catch (error) {
      this.logger.error('File query failed:', error);
      throw error;
    }
  }

  async handleManualData(data, options = {}) {
    return data;
  }

  async parseCSV(csvContent) {
    const csv = require('csv-parser');
    const { Readable } = require('stream');
    
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from([csvContent]);
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  async parseXML(xmlContent) {
    const xml2js = require('xml2js');
    const parser = new xml2js.Parser();
    
    return new Promise((resolve, reject) => {
      parser.parseString(xmlContent, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async applyPostProcessing(data, options = {}) {
    try {
      let processedData = data;
      
      // Apply filters
      if (options.filters) {
        processedData = this.applyFilters(processedData, options.filters);
      }
      
      // Apply sorting
      if (options.sort) {
        processedData = this.applySorting(processedData, options.sort);
      }
      
      // Apply grouping
      if (options.groupBy) {
        processedData = this.applyGrouping(processedData, options.groupBy);
      }
      
      // Apply aggregation
      if (options.aggregate) {
        processedData = this.applyAggregation(processedData, options.aggregate);
      }
      
      // Apply pagination
      if (options.pagination) {
        processedData = this.applyPagination(processedData, options.pagination);
      }
      
      return processedData;
    } catch (error) {
      this.logger.error('Post-processing failed:', error);
      throw error;
    }
  }

  applyFilters(data, filters) {
    if (!Array.isArray(data)) {
      return data;
    }
    
    return data.filter(item => {
      return filters.every(filter => {
        const { field, operator, value } = filter;
        const itemValue = item[field];
        
        switch (operator) {
          case 'equals':
            return itemValue === value;
          case 'not_equals':
            return itemValue !== value;
          case 'greater_than':
            return itemValue > value;
          case 'less_than':
            return itemValue < value;
          case 'greater_than_or_equal':
            return itemValue >= value;
          case 'less_than_or_equal':
            return itemValue <= value;
          case 'contains':
            return String(itemValue).includes(String(value));
          case 'not_contains':
            return !String(itemValue).includes(String(value));
          case 'starts_with':
            return String(itemValue).startsWith(String(value));
          case 'ends_with':
            return String(itemValue).endsWith(String(value));
          case 'in':
            return Array.isArray(value) && value.includes(itemValue);
          case 'not_in':
            return Array.isArray(value) && !value.includes(itemValue);
          case 'is_null':
            return itemValue === null || itemValue === undefined;
          case 'is_not_null':
            return itemValue !== null && itemValue !== undefined;
          default:
            return true;
        }
      });
    });
  }

  applySorting(data, sort) {
    if (!Array.isArray(data)) {
      return data;
    }
    
    return data.sort((a, b) => {
      for (const { field, direction = 'asc' } of sort) {
        const aValue = a[field];
        const bValue = b[field];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;
        
        if (direction === 'desc') {
          comparison = -comparison;
        }
        
        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    });
  }

  applyGrouping(data, groupBy) {
    if (!Array.isArray(data)) {
      return data;
    }
    
    const groups = {};
    
    data.forEach(item => {
      const groupKey = groupBy.map(field => item[field]).join('|');
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    return Object.values(groups);
  }

  applyAggregation(data, aggregate) {
    if (!Array.isArray(data)) {
      return data;
    }
    
    const result = {};
    
    aggregate.forEach(({ field, operation, alias }) => {
      const values = data.map(item => item[field]).filter(val => val !== null && val !== undefined);
      
      switch (operation) {
        case 'count':
          result[alias || `${field}_count`] = values.length;
          break;
        case 'sum':
          result[alias || `${field}_sum`] = values.reduce((sum, val) => sum + Number(val), 0);
          break;
        case 'avg':
          result[alias || `${field}_avg`] = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
          break;
        case 'min':
          result[alias || `${field}_min`] = Math.min(...values);
          break;
        case 'max':
          result[alias || `${field}_max`] = Math.max(...values);
          break;
        case 'first':
          result[alias || `${field}_first`] = values[0];
          break;
        case 'last':
          result[alias || `${field}_last`] = values[values.length - 1];
          break;
      }
    });
    
    return result;
  }

  applyPagination(data, pagination) {
    if (!Array.isArray(data)) {
      return data;
    }
    
    const { page = 1, limit = 20 } = pagination;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return data.slice(startIndex, endIndex);
  }

  async getDataSources() {
    return Array.from(this.dataSources.values());
  }

  async addDataSource(name, source) {
    this.dataSources.set(name, source);
    this.logger.info(`Added data source: ${name}`);
  }

  async removeDataSource(name) {
    if (this.dataSources.has(name)) {
      this.dataSources.delete(name);
      this.logger.info(`Removed data source: ${name}`);
    }
  }
}

module.exports = DataProcessor;
