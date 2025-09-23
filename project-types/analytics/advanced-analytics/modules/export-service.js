const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

class ExportService {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/export-service.log' })
      ]
    });
    
    this.exports = new Map();
    this.formats = new Map();
    this.templates = new Map();
  }

  // Create export
  async createExport(config) {
    try {
      const exportJob = {
        id: this.generateId(),
        name: config.name,
        description: config.description || '',
        data: config.data,
        format: config.format || 'json',
        template: config.template || null,
        filters: config.filters || {},
        options: config.options || {},
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
        filePath: null,
        fileSize: null,
        error: null
      };

      this.exports.set(exportJob.id, exportJob);
      this.logger.info('Export job created successfully', { id: exportJob.id });
      return exportJob;
    } catch (error) {
      this.logger.error('Error creating export:', error);
      throw error;
    }
  }

  // Process export
  async processExport(exportId) {
    try {
      const exportJob = this.exports.get(exportId);
      if (!exportJob) {
        throw new Error('Export job not found');
      }

      exportJob.status = 'processing';
      exportJob.startedAt = new Date();
      exportJob.progress = 0;

      this.exports.set(exportId, exportJob);

      // Process data based on format
      let result;
      switch (exportJob.format) {
        case 'json':
          result = await this.exportToJSON(exportJob);
          break;
        case 'csv':
          result = await this.exportToCSV(exportJob);
          break;
        case 'excel':
          result = await this.exportToExcel(exportJob);
          break;
        case 'pdf':
          result = await this.exportToPDF(exportJob);
          break;
        case 'xml':
          result = await this.exportToXML(exportJob);
          break;
        default:
          throw new Error(`Unsupported format: ${exportJob.format}`);
      }

      exportJob.status = 'completed';
      exportJob.progress = 100;
      exportJob.completedAt = new Date();
      exportJob.filePath = result.filePath;
      exportJob.fileSize = result.fileSize;

      this.exports.set(exportId, exportJob);
      this.logger.info('Export completed successfully', { id: exportId });
      return exportJob;
    } catch (error) {
      const exportJob = this.exports.get(exportId);
      if (exportJob) {
        exportJob.status = 'failed';
        exportJob.error = error.message;
        exportJob.completedAt = new Date();
        this.exports.set(exportId, exportJob);
      }
      
      this.logger.error('Error processing export:', error);
      throw error;
    }
  }

  // Export to JSON
  async exportToJSON(exportJob) {
    const { data, options } = exportJob;
    
    // Apply filters
    const filteredData = this.applyFilters(data, exportJob.filters);
    
    // Apply options
    const processedData = this.applyOptions(filteredData, options);
    
    // Generate file path
    const fileName = `${exportJob.name}_${Date.now()}.json`;
    const filePath = path.join('exports', fileName);
    
    // Ensure exports directory exists
    if (!fs.existsSync('exports')) {
      fs.mkdirSync('exports', { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, JSON.stringify(processedData, null, 2));
    
    const stats = fs.statSync(filePath);
    
    return {
      filePath,
      fileSize: stats.size,
      format: 'json'
    };
  }

  // Export to CSV
  async exportToCSV(exportJob) {
    const { data, options } = exportJob;
    
    // Apply filters
    const filteredData = this.applyFilters(data, exportJob.filters);
    
    // Convert to CSV
    const csvData = this.convertToCSV(filteredData, options);
    
    // Generate file path
    const fileName = `${exportJob.name}_${Date.now()}.csv`;
    const filePath = path.join('exports', fileName);
    
    // Ensure exports directory exists
    if (!fs.existsSync('exports')) {
      fs.mkdirSync('exports', { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, csvData);
    
    const stats = fs.statSync(filePath);
    
    return {
      filePath,
      fileSize: stats.size,
      format: 'csv'
    };
  }

  // Export to Excel
  async exportToExcel(exportJob) {
    const { data, options } = exportJob;
    
    // Apply filters
    const filteredData = this.applyFilters(data, exportJob.filters);
    
    // Convert to Excel format (simplified - in production, use a proper Excel library)
    const excelData = this.convertToExcel(filteredData, options);
    
    // Generate file path
    const fileName = `${exportJob.name}_${Date.now()}.xlsx`;
    const filePath = path.join('exports', fileName);
    
    // Ensure exports directory exists
    if (!fs.existsSync('exports')) {
      fs.mkdirSync('exports', { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, excelData);
    
    const stats = fs.statSync(filePath);
    
    return {
      filePath,
      fileSize: stats.size,
      format: 'excel'
    };
  }

  // Export to PDF
  async exportToPDF(exportJob) {
    const { data, options } = exportJob;
    
    // Apply filters
    const filteredData = this.applyFilters(data, exportJob.filters);
    
    // Convert to PDF format (simplified - in production, use a proper PDF library)
    const pdfData = this.convertToPDF(filteredData, options);
    
    // Generate file path
    const fileName = `${exportJob.name}_${Date.now()}.pdf`;
    const filePath = path.join('exports', fileName);
    
    // Ensure exports directory exists
    if (!fs.existsSync('exports')) {
      fs.mkdirSync('exports', { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, pdfData);
    
    const stats = fs.statSync(filePath);
    
    return {
      filePath,
      fileSize: stats.size,
      format: 'pdf'
    };
  }

  // Export to XML
  async exportToXML(exportJob) {
    const { data, options } = exportJob;
    
    // Apply filters
    const filteredData = this.applyFilters(data, exportJob.filters);
    
    // Convert to XML
    const xmlData = this.convertToXML(filteredData, options);
    
    // Generate file path
    const fileName = `${exportJob.name}_${Date.now()}.xml`;
    const filePath = path.join('exports', fileName);
    
    // Ensure exports directory exists
    if (!fs.existsSync('exports')) {
      fs.mkdirSync('exports', { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, xmlData);
    
    const stats = fs.statSync(filePath);
    
    return {
      filePath,
      fileSize: stats.size,
      format: 'xml'
    };
  }

  // Apply filters
  applyFilters(data, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.filter(item => {
        for (const [key, value] of Object.entries(filters)) {
          if (item[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    return data;
  }

  // Apply options
  applyOptions(data, options) {
    if (!options || Object.keys(options).length === 0) {
      return data;
    }

    let processedData = data;

    // Limit results
    if (options.limit && Array.isArray(processedData)) {
      processedData = processedData.slice(0, options.limit);
    }

    // Sort data
    if (options.sort && Array.isArray(processedData)) {
      const { field, direction = 'asc' } = options.sort;
      processedData.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (direction === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }

    // Select fields
    if (options.fields && Array.isArray(processedData)) {
      processedData = processedData.map(item => {
        const selected = {};
        options.fields.forEach(field => {
          if (item[field] !== undefined) {
            selected[field] = item[field];
          }
        });
        return selected;
      });
    }

    return processedData;
  }

  // Convert to CSV
  convertToCSV(data, options) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  // Convert to Excel
  convertToExcel(data, options) {
    // Simplified Excel conversion - in production, use a proper Excel library like xlsx
    const csvData = this.convertToCSV(data, options);
    return csvData; // For now, return CSV data
  }

  // Convert to PDF
  convertToPDF(data, options) {
    // Simplified PDF conversion - in production, use a proper PDF library like puppeteer or jsPDF
    const html = this.convertToHTML(data, options);
    return html; // For now, return HTML data
  }

  // Convert to XML
  convertToXML(data, options) {
    const rootName = options.rootName || 'data';
    const itemName = options.itemName || 'item';
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        xml += `  <${itemName}>\n`;
        for (const [key, value] of Object.entries(item)) {
          xml += `    <${key}>${value}</${key}>\n`;
        }
        xml += `  </${itemName}>\n`;
      });
    } else {
      xml += `  <${itemName}>\n`;
      for (const [key, value] of Object.entries(data)) {
        xml += `    <${key}>${value}</${key}>\n`;
      }
      xml += `  </${itemName}>\n`;
    }
    
    xml += `</${rootName}>`;
    return xml;
  }

  // Convert to HTML
  convertToHTML(data, options) {
    const title = options.title || 'Export Data';
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <table>
    <thead>
      <tr>`;

    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      headers.forEach(header => {
        html += `<th>${header}</th>`;
      });
      html += `</tr>
    </thead>
    <tbody>`;
      
      data.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
          html += `<td>${row[header] || ''}</td>`;
        });
        html += '</tr>';
      });
    }
    
    html += `    </tbody>
  </table>
</body>
</html>`;
    
    return html;
  }

  // Get export
  async getExport(id) {
    const exportJob = this.exports.get(id);
    if (!exportJob) {
      throw new Error('Export job not found');
    }
    return exportJob;
  }

  // List exports
  async listExports(filters = {}) {
    let exports = Array.from(this.exports.values());
    
    if (filters.status) {
      exports = exports.filter(e => e.status === filters.status);
    }
    
    if (filters.format) {
      exports = exports.filter(e => e.format === filters.format);
    }
    
    // Sort by createdAt desc
    exports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return exports;
  }

  // Delete export
  async deleteExport(id) {
    try {
      const exportJob = await this.getExport(id);
      
      // Delete file if it exists
      if (exportJob.filePath && fs.existsSync(exportJob.filePath)) {
        fs.unlinkSync(exportJob.filePath);
      }
      
      this.exports.delete(id);
      this.logger.info('Export deleted successfully', { id });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting export:', error);
      throw error;
    }
  }

  // Get export file
  async getExportFile(id) {
    const exportJob = await this.getExport(id);
    
    if (exportJob.status !== 'completed') {
      throw new Error('Export not completed');
    }
    
    if (!exportJob.filePath || !fs.existsSync(exportJob.filePath)) {
      throw new Error('Export file not found');
    }
    
    return {
      filePath: exportJob.filePath,
      fileName: path.basename(exportJob.filePath),
      fileSize: exportJob.fileSize,
      format: exportJob.format
    };
  }

  // Generate unique ID
  generateId() {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new ExportService();
