const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class DataVisualizer {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/data-visualizer.log' })
      ]
    });
    
    this.charts = new Map();
    this.visualizations = new Map();
    this.themes = new Map();
  }

  // Create visualization
  async createVisualization(config) {
    try {
      const visualization = {
        id: this.generateId(),
        name: config.name,
        type: config.type,
        data: config.data,
        config: config.config || {},
        theme: config.theme || 'default',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      this.visualizations.set(visualization.id, visualization);
      this.logger.info('Visualization created successfully', { id: visualization.id });
      return visualization;
    } catch (error) {
      this.logger.error('Error creating visualization:', error);
      throw error;
    }
  }

  // Generate chart
  async generateChart(type, data, options = {}) {
    try {
      const chart = {
        id: this.generateId(),
        type,
        data,
        options,
        generatedAt: new Date(),
        status: 'generating'
      };

      // Process data based on chart type
      const processedData = await this.processChartData(type, data, options);
      chart.data = processedData;
      chart.status = 'completed';

      this.charts.set(chart.id, chart);
      this.logger.info('Chart generated successfully', { id: chart.id });
      return chart;
    } catch (error) {
      this.logger.error('Error generating chart:', error);
      throw error;
    }
  }

  // Process chart data
  async processChartData(type, data, options) {
    switch (type) {
      case 'line':
        return this.processLineChartData(data, options);
      case 'bar':
        return this.processBarChartData(data, options);
      case 'pie':
        return this.processPieChartData(data, options);
      case 'scatter':
        return this.processScatterChartData(data, options);
      case 'area':
        return this.processAreaChartData(data, options);
      case 'histogram':
        return this.processHistogramData(data, options);
      default:
        return data;
    }
  }

  // Process line chart data
  processLineChartData(data, options) {
    const processed = {
      type: 'line',
      datasets: [],
      labels: [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: options.timeUnit || 'day'
            }
          },
          y: {
            beginAtZero: true
          }
        }
      }
    };

    if (Array.isArray(data)) {
      processed.labels = data.map(item => item.x || item.label || item.date);
      processed.datasets.push({
        label: options.label || 'Data',
        data: data.map(item => item.y || item.value || item.count),
        borderColor: options.color || '#3B82F6',
        backgroundColor: options.backgroundColor || 'rgba(59, 130, 246, 0.1)',
        tension: options.tension || 0.1
      });
    }

    return processed;
  }

  // Process bar chart data
  processBarChartData(data, options) {
    const processed = {
      type: 'bar',
      datasets: [],
      labels: [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    if (Array.isArray(data)) {
      processed.labels = data.map(item => item.x || item.label || item.category);
      processed.datasets.push({
        label: options.label || 'Data',
        data: data.map(item => item.y || item.value || item.count),
        backgroundColor: options.backgroundColor || '#3B82F6',
        borderColor: options.borderColor || '#1E40AF',
        borderWidth: 1
      });
    }

    return processed;
  }

  // Process pie chart data
  processPieChartData(data, options) {
    const processed = {
      type: 'pie',
      datasets: [{
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1
      }],
      labels: [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    };

    if (Array.isArray(data)) {
      processed.labels = data.map(item => item.label || item.name || item.category);
      processed.datasets[0].data = data.map(item => item.value || item.count || item.amount);
      
      // Generate colors
      const colors = this.generateColors(data.length);
      processed.datasets[0].backgroundColor = colors.background;
      processed.datasets[0].borderColor = colors.border;
    }

    return processed;
  }

  // Process scatter chart data
  processScatterChartData(data, options) {
    const processed = {
      type: 'scatter',
      datasets: [{
        label: options.label || 'Data',
        data: [],
        backgroundColor: options.backgroundColor || '#3B82F6',
        borderColor: options.borderColor || '#1E40AF'
      }],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom'
          },
          y: {
            beginAtZero: true
          }
        }
      }
    };

    if (Array.isArray(data)) {
      processed.datasets[0].data = data.map(item => ({
        x: item.x || item.value1 || 0,
        y: item.y || item.value2 || 0
      }));
    }

    return processed;
  }

  // Process area chart data
  processAreaChartData(data, options) {
    const processed = {
      type: 'line',
      datasets: [],
      labels: [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: options.timeUnit || 'day'
            }
          },
          y: {
            beginAtZero: true
          }
        }
      }
    };

    if (Array.isArray(data)) {
      processed.labels = data.map(item => item.x || item.label || item.date);
      processed.datasets.push({
        label: options.label || 'Data',
        data: data.map(item => item.y || item.value || item.count),
        backgroundColor: options.backgroundColor || 'rgba(59, 130, 246, 0.3)',
        borderColor: options.borderColor || '#3B82F6',
        fill: true,
        tension: options.tension || 0.1
      });
    }

    return processed;
  }

  // Process histogram data
  processHistogramData(data, options) {
    const processed = {
      type: 'bar',
      datasets: [],
      labels: [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    if (Array.isArray(data)) {
      // Group data into bins
      const bins = this.createBins(data, options.bins || 10);
      processed.labels = bins.map(bin => `${bin.min}-${bin.max}`);
      processed.datasets.push({
        label: options.label || 'Frequency',
        data: bins.map(bin => bin.count),
        backgroundColor: options.backgroundColor || '#3B82F6',
        borderColor: options.borderColor || '#1E40AF',
        borderWidth: 1
      });
    }

    return processed;
  }

  // Create bins for histogram
  createBins(data, binCount) {
    const values = data.map(item => this.extractNumericValue(item)).filter(v => !isNaN(v));
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / binCount;

    const bins = [];
    for (let i = 0; i < binCount; i++) {
      const binMin = min + i * binSize;
      const binMax = min + (i + 1) * binSize;
      const count = values.filter(v => v >= binMin && v < binMax).length;
      
      bins.push({
        min: binMin,
        max: binMax,
        count
      });
    }

    return bins;
  }

  // Extract numeric value
  extractNumericValue(item) {
    if (typeof item === 'number') return item;
    if (typeof item === 'string') return parseFloat(item);
    if (typeof item === 'object' && item.value !== undefined) return parseFloat(item.value);
    if (typeof item === 'object' && item.amount !== undefined) return parseFloat(item.amount);
    if (typeof item === 'object' && item.count !== undefined) return parseFloat(item.count);
    return 0;
  }

  // Generate colors
  generateColors(count) {
    const colors = {
      background: [],
      border: []
    };

    for (let i = 0; i < count; i++) {
      const hue = (i * 360) / count;
      const background = `hsla(${hue}, 70%, 50%, 0.8)`;
      const border = `hsl(${hue}, 70%, 40%)`;
      
      colors.background.push(background);
      colors.border.push(border);
    }

    return colors;
  }

  // Get visualization
  async getVisualization(id) {
    const visualization = this.visualizations.get(id);
    if (!visualization) {
      throw new Error('Visualization not found');
    }
    return visualization;
  }

  // List visualizations
  async listVisualizations(filters = {}) {
    let visualizations = Array.from(this.visualizations.values());
    
    if (filters.type) {
      visualizations = visualizations.filter(v => v.type === filters.type);
    }
    
    if (filters.status) {
      visualizations = visualizations.filter(v => v.status === filters.status);
    }
    
    return visualizations;
  }

  // Update visualization
  async updateVisualization(id, updates) {
    try {
      const visualization = await this.getVisualization(id);
      
      const updatedVisualization = {
        ...visualization,
        ...updates,
        updatedAt: new Date()
      };

      this.visualizations.set(id, updatedVisualization);
      this.logger.info('Visualization updated successfully', { id });
      return updatedVisualization;
    } catch (error) {
      this.logger.error('Error updating visualization:', error);
      throw error;
    }
  }

  // Delete visualization
  async deleteVisualization(id) {
    try {
      const visualization = await this.getVisualization(id);
      this.visualizations.delete(id);
      this.logger.info('Visualization deleted successfully', { id });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting visualization:', error);
      throw error;
    }
  }

  // Generate unique ID
  generateId() {
    return `viz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new DataVisualizer();
