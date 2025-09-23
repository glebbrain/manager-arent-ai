class FormatConverter {
  constructor(logger) {
    this.logger = logger;
    this.supportedFormats = [
      'csv', 'excel', 'xlsx', 'json', 'xml', 'pdf', 'txt', 
      'yaml', 'yml', 'html', 'markdown', 'md', 'zip'
    ];
  }

  async convert(data, targetFormat, options = {}) {
    try {
      this.logger.info(`Converting data to ${targetFormat} format`);
      
      // Validate format
      if (!this.isFormatSupported(targetFormat)) {
        throw new Error(`Unsupported format: ${targetFormat}`);
      }
      
      // Preprocess data
      const processedData = await this.preprocessData(data, options);
      
      // Convert based on target format
      switch (targetFormat.toLowerCase()) {
        case 'csv':
          return await this.convertToCSV(processedData, options);
        case 'excel':
        case 'xlsx':
          return await this.convertToExcel(processedData, options);
        case 'json':
          return await this.convertToJSON(processedData, options);
        case 'xml':
          return await this.convertToXML(processedData, options);
        case 'pdf':
          return await this.convertToPDF(processedData, options);
        case 'txt':
          return await this.convertToTXT(processedData, options);
        case 'yaml':
        case 'yml':
          return await this.convertToYAML(processedData, options);
        case 'html':
          return await this.convertToHTML(processedData, options);
        case 'markdown':
        case 'md':
          return await this.convertToMarkdown(processedData, options);
        case 'zip':
          return await this.convertToZIP(processedData, options);
        default:
          throw new Error(`Conversion not implemented for format: ${targetFormat}`);
      }
    } catch (error) {
      this.logger.error('Format conversion failed:', error);
      throw error;
    }
  }

  async preprocessData(data, options = {}) {
    try {
      // Handle different input types
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      }
      
      if (Array.isArray(data)) {
        // Process array data
        return data.map(item => this.processItem(item, options));
      }
      
      if (typeof data === 'object' && data !== null) {
        // Process object data
        return this.processItem(data, options);
      }
      
      return data;
    } catch (error) {
      this.logger.error('Data preprocessing failed:', error);
      throw error;
    }
  }

  processItem(item, options = {}) {
    if (typeof item !== 'object' || item === null) {
      return item;
    }
    
    const processed = { ...item };
    
    // Apply field mappings
    if (options.fieldMappings) {
      const mapped = {};
      Object.entries(options.fieldMappings).forEach(([newField, oldField]) => {
        if (processed[oldField] !== undefined) {
          mapped[newField] = processed[oldField];
        }
      });
      Object.assign(processed, mapped);
    }
    
    // Apply field filters
    if (options.includeFields) {
      const filtered = {};
      options.includeFields.forEach(field => {
        if (processed[field] !== undefined) {
          filtered[field] = processed[field];
        }
      });
      return filtered;
    }
    
    if (options.excludeFields) {
      options.excludeFields.forEach(field => {
        delete processed[field];
      });
    }
    
    // Apply transformations
    if (options.transformations) {
      Object.entries(options.transformations).forEach(([field, transform]) => {
        if (processed[field] !== undefined) {
          processed[field] = this.applyTransformation(processed[field], transform);
        }
      });
    }
    
    return processed;
  }

  applyTransformation(value, transform) {
    switch (transform.type) {
      case 'date':
        return this.transformDate(value, transform);
      case 'number':
        return this.transformNumber(value, transform);
      case 'string':
        return this.transformString(value, transform);
      case 'boolean':
        return this.transformBoolean(value, transform);
      case 'custom':
        return transform.function(value);
      default:
        return value;
    }
  }

  transformDate(value, transform) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }
    
    if (transform.format) {
      return this.formatDate(date, transform.format);
    }
    
    return date.toISOString();
  }

  transformNumber(value, transform) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return value;
    }
    
    if (transform.precision !== undefined) {
      return parseFloat(num.toFixed(transform.precision));
    }
    
    if (transform.multiplier) {
      return num * transform.multiplier;
    }
    
    return num;
  }

  transformString(value, transform) {
    let str = String(value);
    
    if (transform.uppercase) {
      str = str.toUpperCase();
    }
    
    if (transform.lowercase) {
      str = str.toLowerCase();
    }
    
    if (transform.trim) {
      str = str.trim();
    }
    
    if (transform.prefix) {
      str = transform.prefix + str;
    }
    
    if (transform.suffix) {
      str = str + transform.suffix;
    }
    
    if (transform.replace) {
      str = str.replace(transform.replace.pattern, transform.replace.replacement);
    }
    
    return str;
  }

  transformBoolean(value, transform) {
    if (typeof value === 'boolean') {
      return value;
    }
    
    const str = String(value).toLowerCase();
    return str === 'true' || str === '1' || str === 'yes' || str === 'on';
  }

  formatDate(date, format) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  async convertToCSV(data, options = {}) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('CSV conversion requires array data');
    }
    
    const headers = Object.keys(data[0]);
    const csvLines = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvLines.push(values.join(','));
    });
    
    return csvLines.join('\n');
  }

  async convertToExcel(data, options = {}) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1');
    
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      data.forEach(row => {
        const values = headers.map(header => row[header] || '');
        worksheet.addRow(values);
      });
    }
    
    return workbook;
  }

  async convertToJSON(data, options = {}) {
    return JSON.stringify(data, null, options.pretty ? 2 : 0);
  }

  async convertToXML(data, options = {}) {
    const { Builder } = require('xml2js');
    const builder = new Builder({
      rootName: options.rootName || 'data',
      itemName: options.itemName || 'item',
      pretty: options.pretty !== false
    });
    
    return builder.buildObject(data);
  }

  async convertToPDF(data, options = {}) {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    if (options.title) {
      doc.fontSize(20).text(options.title, 50, 50);
      doc.moveDown();
    }
    
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      const tableTop = 100;
      const itemHeight = 20;
      const colWidth = 150;
      
      // Draw headers
      let x = 50;
      headers.forEach(header => {
        doc.rect(x, tableTop, colWidth, itemHeight).stroke();
        doc.text(header, x + 5, tableTop + 5);
        x += colWidth;
      });
      
      // Draw data rows
      data.forEach((row, index) => {
        const y = tableTop + (index + 1) * itemHeight;
        x = 50;
        
        headers.forEach(header => {
          doc.rect(x, y, colWidth, itemHeight).stroke();
          doc.text(String(row[header] || ''), x + 5, y + 5);
          x += colWidth;
        });
      });
    } else {
      doc.text(JSON.stringify(data, null, 2), 50, 100);
    }
    
    return doc;
  }

  async convertToTXT(data, options = {}) {
    let content = '';
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        content += `Item ${index + 1}:\n`;
        Object.entries(item).forEach(([key, value]) => {
          content += `  ${key}: ${value}\n`;
        });
        content += '\n';
      });
    } else {
      content = JSON.stringify(data, null, 2);
    }
    
    return content;
  }

  async convertToYAML(data, options = {}) {
    const yaml = require('yaml');
    return yaml.stringify(data, { indent: 2 });
  }

  async convertToHTML(data, options = {}) {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>${options.title || 'Data Export'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${options.title || 'Data Export'}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
`;
    
    if (Array.isArray(data) && data.length > 0) {
      html += '<table>\n<thead>\n<tr>\n';
      const headers = Object.keys(data[0]);
      headers.forEach(header => {
        html += `<th>${header}</th>\n`;
      });
      html += '</tr>\n</thead>\n<tbody>\n';
      
      data.forEach(row => {
        html += '<tr>\n';
        headers.forEach(header => {
          html += `<td>${row[header] || ''}</td>\n`;
        });
        html += '</tr>\n';
      });
      
      html += '</tbody>\n</table>\n';
    } else {
      html += `<pre>${JSON.stringify(data, null, 2)}</pre>\n`;
    }
    
    html += '</body>\n</html>';
    
    return html;
  }

  async convertToMarkdown(data, options = {}) {
    let markdown = `# ${options.title || 'Data Export'}\n\n`;
    markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      
      // Create table header
      markdown += '| ' + headers.join(' | ') + ' |\n';
      markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      
      // Add data rows
      data.forEach(row => {
        const values = headers.map(header => String(row[header] || ''));
        markdown += '| ' + values.join(' | ') + ' |\n';
      });
    } else {
      markdown += '```json\n' + JSON.stringify(data, null, 2) + '\n```\n';
    }
    
    return markdown;
  }

  async convertToZIP(data, options = {}) {
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Add files to archive
    if (options.files) {
      for (const file of options.files) {
        archive.file(file.path, { name: file.name });
      }
    } else {
      // Create a single file with the data
      const tempFile = `data_${Date.now()}.json`;
      archive.append(JSON.stringify(data, null, 2), { name: tempFile });
    }
    
    return archive;
  }

  isFormatSupported(format) {
    return this.supportedFormats.includes(format.toLowerCase());
  }

  getSupportedFormats() {
    return this.supportedFormats;
  }

  getFormatInfo(format) {
    const formatInfo = {
      csv: {
        name: 'CSV',
        description: 'Comma-separated values',
        mimeType: 'text/csv',
        extension: 'csv'
      },
      excel: {
        name: 'Excel',
        description: 'Microsoft Excel spreadsheet',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx'
      },
      xlsx: {
        name: 'Excel',
        description: 'Microsoft Excel spreadsheet',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx'
      },
      json: {
        name: 'JSON',
        description: 'JavaScript Object Notation',
        mimeType: 'application/json',
        extension: 'json'
      },
      xml: {
        name: 'XML',
        description: 'Extensible Markup Language',
        mimeType: 'application/xml',
        extension: 'xml'
      },
      pdf: {
        name: 'PDF',
        description: 'Portable Document Format',
        mimeType: 'application/pdf',
        extension: 'pdf'
      },
      txt: {
        name: 'Text',
        description: 'Plain text file',
        mimeType: 'text/plain',
        extension: 'txt'
      },
      yaml: {
        name: 'YAML',
        description: 'YAML Ain\'t Markup Language',
        mimeType: 'application/x-yaml',
        extension: 'yaml'
      },
      yml: {
        name: 'YAML',
        description: 'YAML Ain\'t Markup Language',
        mimeType: 'application/x-yaml',
        extension: 'yaml'
      },
      html: {
        name: 'HTML',
        description: 'HyperText Markup Language',
        mimeType: 'text/html',
        extension: 'html'
      },
      markdown: {
        name: 'Markdown',
        description: 'Markdown formatted text',
        mimeType: 'text/markdown',
        extension: 'md'
      },
      md: {
        name: 'Markdown',
        description: 'Markdown formatted text',
        mimeType: 'text/markdown',
        extension: 'md'
      },
      zip: {
        name: 'ZIP',
        description: 'Compressed archive',
        mimeType: 'application/zip',
        extension: 'zip'
      }
    };
    
    return formatInfo[format.toLowerCase()] || null;
  }
}

module.exports = FormatConverter;
