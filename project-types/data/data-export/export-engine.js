const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ExportEngine {
  constructor(pool, redis, logger) {
    this.pool = pool;
    this.redis = redis;
    this.logger = logger;
    this.exportDirectory = 'exports';
    this.tempDirectory = 'temp';
  }

  async initialize() {
    try {
      // Create export directories
      await this.createDirectories();
      this.logger.info('Export Engine initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Export Engine:', error);
      throw error;
    }
  }

  async createDirectories() {
    const directories = [this.exportDirectory, this.tempDirectory];
    
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }

  async generateFile(data, format, options = {}) {
    try {
      const fileName = this.generateFileName(format, options);
      const filePath = path.join(this.exportDirectory, fileName);
      
      this.logger.info(`Generating ${format} file: ${fileName}`);
      
      switch (format.toLowerCase()) {
        case 'csv':
          return await this.generateCSV(data, filePath, options);
        case 'excel':
        case 'xlsx':
          return await this.generateExcel(data, filePath, options);
        case 'json':
          return await this.generateJSON(data, filePath, options);
        case 'xml':
          return await this.generateXML(data, filePath, options);
        case 'pdf':
          return await this.generatePDF(data, filePath, options);
        case 'txt':
          return await this.generateTXT(data, filePath, options);
        case 'yaml':
        case 'yml':
          return await this.generateYAML(data, filePath, options);
        case 'html':
          return await this.generateHTML(data, filePath, options);
        case 'markdown':
        case 'md':
          return await this.generateMarkdown(data, filePath, options);
        case 'zip':
          return await this.generateZIP(data, filePath, options);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      this.logger.error('Failed to generate file:', error);
      throw error;
    }
  }

  async generateCSV(data, filePath, options = {}) {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    
    const csvWriter = createCsvWriter({
      path: filePath,
      header: this.getCSVHeaders(data, options)
    });
    
    await csvWriter.writeRecords(data);
    return filePath;
  }

  async generateExcel(data, filePath, options = {}) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1');
    
    // Add headers
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      // Style headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
    
    // Add data
    data.forEach(row => {
      const values = Object.values(row);
      worksheet.addRow(values);
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });
    
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  async generateJSON(data, filePath, options = {}) {
    const jsonString = JSON.stringify(data, null, options.pretty ? 2 : 0);
    await fs.writeFile(filePath, jsonString, 'utf8');
    return filePath;
  }

  async generateXML(data, filePath, options = {}) {
    const { Builder } = require('xml2js');
    const builder = new Builder({
      rootName: options.rootName || 'data',
      itemName: options.itemName || 'item',
      pretty: options.pretty !== false
    });
    
    const xml = builder.buildObject(data);
    await fs.writeFile(filePath, xml, 'utf8');
    return filePath;
  }

  async generatePDF(data, filePath, options = {}) {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    doc.pipe(await fs.open(filePath, 'w'));
    
    // Add title
    if (options.title) {
      doc.fontSize(20).text(options.title, 50, 50);
      doc.moveDown();
    }
    
    // Add data as table
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
    
    doc.end();
    return filePath;
  }

  async generateTXT(data, filePath, options = {}) {
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
    
    await fs.writeFile(filePath, content, 'utf8');
    return filePath;
  }

  async generateYAML(data, filePath, options = {}) {
    const yaml = require('yaml');
    const yamlString = yaml.stringify(data, { indent: 2 });
    await fs.writeFile(filePath, yamlString, 'utf8');
    return filePath;
  }

  async generateHTML(data, filePath, options = {}) {
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
    
    await fs.writeFile(filePath, html, 'utf8');
    return filePath;
  }

  async generateMarkdown(data, filePath, options = {}) {
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
    
    await fs.writeFile(filePath, markdown, 'utf8');
    return filePath;
  }

  async generateZIP(data, filePath, options = {}) {
    const archiver = require('archiver');
    const output = await fs.open(filePath, 'w');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    
    // Add files to archive
    if (options.files) {
      for (const file of options.files) {
        archive.file(file.path, { name: file.name });
      }
    } else {
      // Create a single file with the data
      const tempFile = path.join(this.tempDirectory, `data_${uuidv4()}.json`);
      await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
      archive.file(tempFile, { name: 'data.json' });
    }
    
    await archive.finalize();
    return filePath;
  }

  getCSVHeaders(data, options = {}) {
    if (data.length === 0) return [];
    
    const headers = Object.keys(data[0]);
    return headers.map(header => ({
      id: header,
      title: options.headerMapping?.[header] || header
    }));
  }

  generateFileName(format, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const prefix = options.prefix || 'export';
    const extension = this.getFileExtension(format);
    return `${prefix}_${timestamp}.${extension}`;
  }

  getFileExtension(format) {
    const extensions = {
      'csv': 'csv',
      'excel': 'xlsx',
      'xlsx': 'xlsx',
      'json': 'json',
      'xml': 'xml',
      'pdf': 'pdf',
      'txt': 'txt',
      'yaml': 'yaml',
      'yml': 'yaml',
      'html': 'html',
      'markdown': 'md',
      'md': 'md',
      'zip': 'zip'
    };
    
    return extensions[format.toLowerCase()] || 'txt';
  }

  // Cleanup old files
  async cleanupOldFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const files = await fs.readdir(this.exportDirectory);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.exportDirectory, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          this.logger.info(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old files:', error);
    }
  }

  // Get file info
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      this.logger.error('Failed to get file info:', error);
      return null;
    }
  }

  // Validate file
  async validateFile(filePath, format) {
    try {
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        return { valid: false, error: 'Path is not a file' };
      }
      
      if (stats.size === 0) {
        return { valid: false, error: 'File is empty' };
      }
      
      // Check file extension
      const expectedExtension = this.getFileExtension(format);
      const actualExtension = path.extname(filePath).slice(1);
      
      if (actualExtension !== expectedExtension) {
        return { valid: false, error: `Expected .${expectedExtension} file` };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = ExportEngine;
