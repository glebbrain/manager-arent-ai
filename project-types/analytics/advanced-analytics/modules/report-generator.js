const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class ReportGenerator {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/report-generator.log' })
      ]
    });
    
    this.reportTemplates = new Map();
    this.scheduledReports = new Map();
  }

  // Generate report
  async generateReport(templateId, data, options = {}) {
    try {
      const template = this.reportTemplates.get(templateId) || this.getDefaultTemplate();
      const report = {
        id: this.generateId(),
        templateId,
        generatedAt: new Date(),
        data: data,
        options: options,
        status: 'generating'
      };

      // Process template
      const processedReport = await this.processTemplate(template, data, options);
      report.content = processedReport;
      report.status = 'completed';

      this.logger.info('Report generated successfully', { id: report.id });
      return report;
    } catch (error) {
      this.logger.error('Error generating report:', error);
      throw error;
    }
  }

  // Process template
  async processTemplate(template, data, options) {
    let content = template.content;
    
    // Replace variables
    content = this.replaceVariables(content, data, options);
    
    // Process sections
    content = await this.processSections(content, data, options);
    
    // Apply formatting
    content = this.applyFormatting(content, options);
    
    return content;
  }

  // Replace variables in template
  replaceVariables(content, data, options) {
    const variables = {
      ...data,
      ...options,
      timestamp: new Date().toISOString(),
      date: moment().format('YYYY-MM-DD'),
      time: moment().format('HH:mm:ss')
    };

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value);
    }

    return content;
  }

  // Process template sections
  async processSections(content, data, options) {
    // Process charts section
    content = await this.processChartsSection(content, data, options);
    
    // Process tables section
    content = await this.processTablesSection(content, data, options);
    
    // Process summary section
    content = await this.processSummarySection(content, data, options);
    
    return content;
  }

  // Process charts section
  async processChartsSection(content, data, options) {
    const chartsRegex = /<charts>(.*?)<\/charts>/gs;
    return content.replace(chartsRegex, (match, chartsContent) => {
      const charts = this.generateCharts(data, options);
      return charts.map(chart => this.formatChart(chart)).join('\n');
    });
  }

  // Process tables section
  async processTablesSection(content, data, options) {
    const tablesRegex = /<tables>(.*?)<\/tables>/gs;
    return content.replace(tablesRegex, (match, tablesContent) => {
      const tables = this.generateTables(data, options);
      return tables.map(table => this.formatTable(table)).join('\n');
    });
  }

  // Process summary section
  async processSummarySection(content, data, options) {
    const summaryRegex = /<summary>(.*?)<\/summary>/gs;
    return content.replace(summaryRegex, (match, summaryContent) => {
      const summary = this.generateSummary(data, options);
      return this.formatSummary(summary);
    });
  }

  // Generate charts
  generateCharts(data, options) {
    const charts = [];
    
    // Basic metrics chart
    if (data.metrics) {
      charts.push({
        type: 'line',
        title: 'Metrics Over Time',
        data: data.metrics,
        xAxis: 'timestamp',
        yAxis: 'value'
      });
    }
    
    // Distribution chart
    if (data.distribution) {
      charts.push({
        type: 'bar',
        title: 'Data Distribution',
        data: data.distribution,
        xAxis: 'category',
        yAxis: 'count'
      });
    }
    
    return charts;
  }

  // Generate tables
  generateTables(data, options) {
    const tables = [];
    
    // Summary table
    if (data.summary) {
      tables.push({
        title: 'Summary',
        headers: ['Metric', 'Value'],
        rows: Object.entries(data.summary).map(([key, value]) => [key, value])
      });
    }
    
    // Detailed data table
    if (data.details && Array.isArray(data.details)) {
      const headers = Object.keys(data.details[0] || {});
      const rows = data.details.map(item => headers.map(header => item[header]));
      
      tables.push({
        title: 'Detailed Data',
        headers,
        rows
      });
    }
    
    return tables;
  }

  // Generate summary
  generateSummary(data, options) {
    const summary = {
      totalRecords: data.totalRecords || 0,
      generatedAt: new Date().toISOString(),
      timeRange: options.timeRange || 'N/A',
      dataSources: options.dataSources || []
    };
    
    if (data.metrics) {
      summary.avgValue = this.calculateAverage(data.metrics);
      summary.maxValue = this.calculateMax(data.metrics);
      summary.minValue = this.calculateMin(data.metrics);
    }
    
    return summary;
  }

  // Format chart
  formatChart(chart) {
    return `
      <div class="chart">
        <h3>${chart.title}</h3>
        <div class="chart-content" data-type="${chart.type}" data-data="${JSON.stringify(chart.data)}">
          <!-- Chart will be rendered here -->
        </div>
      </div>
    `;
  }

  // Format table
  formatTable(table) {
    let html = `<div class="table"><h3>${table.title}</h3><table>`;
    
    // Headers
    html += '<thead><tr>';
    table.headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr></thead>';
    
    // Rows
    html += '<tbody>';
    table.rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    
    return html;
  }

  // Format summary
  formatSummary(summary) {
    return `
      <div class="summary">
        <h3>Report Summary</h3>
        <ul>
          <li>Total Records: ${summary.totalRecords}</li>
          <li>Generated At: ${summary.generatedAt}</li>
          <li>Time Range: ${summary.timeRange}</li>
          <li>Data Sources: ${summary.dataSources.join(', ')}</li>
          ${summary.avgValue ? `<li>Average Value: ${summary.avgValue}</li>` : ''}
          ${summary.maxValue ? `<li>Max Value: ${summary.maxValue}</li>` : ''}
          ${summary.minValue ? `<li>Min Value: ${summary.minValue}</li>` : ''}
        </ul>
      </div>
    `;
  }

  // Apply formatting
  applyFormatting(content, options) {
    if (options.format === 'html') {
      return this.formatAsHTML(content);
    } else if (options.format === 'markdown') {
      return this.formatAsMarkdown(content);
    } else if (options.format === 'json') {
      return this.formatAsJSON(content);
    }
    
    return content;
  }

  // Format as HTML
  formatAsHTML(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .chart, .table, .summary { margin: 20px 0; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
  }

  // Format as Markdown
  formatAsMarkdown(content) {
    // Convert HTML to Markdown (simplified)
    return content
      .replace(/<h3>(.*?)<\/h3>/g, '### $1')
      .replace(/<ul>(.*?)<\/ul>/gs, '$1')
      .replace(/<li>(.*?)<\/li>/g, '- $1')
      .replace(/<table>(.*?)<\/table>/gs, '$1')
      .replace(/<tr>(.*?)<\/tr>/g, '$1')
      .replace(/<th>(.*?)<\/th>/g, '| $1 ')
      .replace(/<td>(.*?)<\/td>/g, '| $1 ')
      .replace(/<[^>]*>/g, '');
  }

  // Format as JSON
  formatAsJSON(content) {
    return JSON.stringify({
      content,
      generatedAt: new Date().toISOString(),
      format: 'json'
    }, null, 2);
  }

  // Get default template
  getDefaultTemplate() {
    return {
      id: 'default',
      name: 'Default Report Template',
      content: `
        <h1>Analytics Report</h1>
        <p>Generated on {{date}} at {{time}}</p>
        
        <summary>
          <h2>Summary</h2>
          <p>This report contains analytics data for the specified time range.</p>
        </summary>
        
        <charts>
          <h2>Charts</h2>
          <p>Visual representation of the data.</p>
        </charts>
        
        <tables>
          <h2>Tables</h2>
          <p>Detailed data in tabular format.</p>
        </tables>
      `
    };
  }

  // Calculate average
  calculateAverage(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + (b.value || 0), 0);
    return sum / values.length;
  }

  // Calculate max
  calculateMax(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    return Math.max(...values.map(v => v.value || 0));
  }

  // Calculate min
  calculateMin(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    return Math.min(...values.map(v => v.value || 0));
  }

  // Generate unique ID
  generateId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new ReportGenerator();
