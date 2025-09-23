const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class DashboardManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/dashboard-manager.log' })
      ]
    });
    
    this.dashboards = new Map();
    this.widgets = new Map();
    this.layouts = new Map();
  }

  // Create dashboard
  async createDashboard(config) {
    try {
      const dashboard = {
        id: this.generateId(),
        name: config.name,
        description: config.description || '',
        widgets: config.widgets || [],
        layout: config.layout || 'grid',
        theme: config.theme || 'default',
        permissions: config.permissions || { read: [], write: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      this.dashboards.set(dashboard.id, dashboard);
      this.logger.info('Dashboard created successfully', { id: dashboard.id });
      return dashboard;
    } catch (error) {
      this.logger.error('Error creating dashboard:', error);
      throw error;
    }
  }

  // Get dashboard
  async getDashboard(id) {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    return dashboard;
  }

  // Update dashboard
  async updateDashboard(id, updates) {
    try {
      const dashboard = await this.getDashboard(id);
      
      const updatedDashboard = {
        ...dashboard,
        ...updates,
        updatedAt: new Date()
      };

      this.dashboards.set(id, updatedDashboard);
      this.logger.info('Dashboard updated successfully', { id });
      return updatedDashboard;
    } catch (error) {
      this.logger.error('Error updating dashboard:', error);
      throw error;
    }
  }

  // Delete dashboard
  async deleteDashboard(id) {
    try {
      const dashboard = await this.getDashboard(id);
      this.dashboards.delete(id);
      this.logger.info('Dashboard deleted successfully', { id });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting dashboard:', error);
      throw error;
    }
  }

  // List dashboards
  async listDashboards(filters = {}) {
    let dashboards = Array.from(this.dashboards.values());
    
    if (filters.userId) {
      dashboards = dashboards.filter(d => 
        d.permissions.read.includes(filters.userId) || 
        d.permissions.write.includes(filters.userId)
      );
    }
    
    if (filters.status) {
      dashboards = dashboards.filter(d => d.status === filters.status);
    }
    
    return dashboards;
  }

  // Add widget to dashboard
  async addWidget(dashboardId, widgetConfig) {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      
      const widget = {
        id: this.generateId(),
        type: widgetConfig.type,
        title: widgetConfig.title,
        config: widgetConfig.config || {},
        position: widgetConfig.position || { x: 0, y: 0, w: 4, h: 3 },
        dataSource: widgetConfig.dataSource || null,
        refreshInterval: widgetConfig.refreshInterval || 30000,
        createdAt: new Date()
      };

      dashboard.widgets.push(widget);
      dashboard.updatedAt = new Date();
      
      this.dashboards.set(dashboardId, dashboard);
      this.logger.info('Widget added to dashboard', { dashboardId, widgetId: widget.id });
      return widget;
    } catch (error) {
      this.logger.error('Error adding widget:', error);
      throw error;
    }
  }

  // Update widget
  async updateWidget(dashboardId, widgetId, updates) {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
      
      if (widgetIndex === -1) {
        throw new Error('Widget not found');
      }

      dashboard.widgets[widgetIndex] = {
        ...dashboard.widgets[widgetIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      dashboard.updatedAt = new Date();
      this.dashboards.set(dashboardId, dashboard);
      
      this.logger.info('Widget updated successfully', { dashboardId, widgetId });
      return dashboard.widgets[widgetIndex];
    } catch (error) {
      this.logger.error('Error updating widget:', error);
      throw error;
    }
  }

  // Remove widget
  async removeWidget(dashboardId, widgetId) {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
      dashboard.updatedAt = new Date();
      
      this.dashboards.set(dashboardId, dashboard);
      this.logger.info('Widget removed from dashboard', { dashboardId, widgetId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error removing widget:', error);
      throw error;
    }
  }

  // Get widget data
  async getWidgetData(widgetId, dataSource) {
    try {
      // This would typically fetch data from the data source
      // For now, return mock data
      const mockData = this.generateMockData(widgetId, dataSource);
      return mockData;
    } catch (error) {
      this.logger.error('Error getting widget data:', error);
      throw error;
    }
  }

  // Generate mock data for widgets
  generateMockData(widgetId, dataSource) {
    const baseData = {
      timestamp: new Date().toISOString(),
      widgetId,
      dataSource
    };

    // Generate different types of mock data based on widget type
    const widgetType = this.getWidgetType(widgetId);
    
    switch (widgetType) {
      case 'chart':
        return {
          ...baseData,
          type: 'chart',
          data: this.generateChartData()
        };
      case 'table':
        return {
          ...baseData,
          type: 'table',
          data: this.generateTableData()
        };
      case 'metric':
        return {
          ...baseData,
          type: 'metric',
          data: this.generateMetricData()
        };
      default:
        return baseData;
    }
  }

  // Generate chart data
  generateChartData() {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      data.push({
        x: date.toISOString().split('T')[0],
        y: Math.floor(Math.random() * 100) + 10
      });
    }
    
    return data;
  }

  // Generate table data
  generateTableData() {
    const headers = ['Name', 'Value', 'Status', 'Date'];
    const rows = [];
    
    for (let i = 0; i < 10; i++) {
      rows.push([
        `Item ${i + 1}`,
        Math.floor(Math.random() * 1000),
        Math.random() > 0.5 ? 'Active' : 'Inactive',
        new Date().toISOString().split('T')[0]
      ]);
    }
    
    return { headers, rows };
  }

  // Generate metric data
  generateMetricData() {
    return {
      value: Math.floor(Math.random() * 1000),
      change: Math.floor(Math.random() * 20) - 10,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };
  }

  // Get widget type
  getWidgetType(widgetId) {
    // This would typically be stored in the widget configuration
    // For now, return a random type
    const types = ['chart', 'table', 'metric'];
    return types[Math.floor(Math.random() * types.length)];
  }

  // Create widget template
  async createWidgetTemplate(config) {
    try {
      const template = {
        id: this.generateId(),
        name: config.name,
        type: config.type,
        config: config.config || {},
        defaultPosition: config.defaultPosition || { x: 0, y: 0, w: 4, h: 3 },
        dataSource: config.dataSource || null,
        createdAt: new Date()
      };

      this.widgets.set(template.id, template);
      this.logger.info('Widget template created successfully', { id: template.id });
      return template;
    } catch (error) {
      this.logger.error('Error creating widget template:', error);
      throw error;
    }
  }

  // Get widget template
  async getWidgetTemplate(id) {
    const template = this.widgets.get(id);
    if (!template) {
      throw new Error('Widget template not found');
    }
    return template;
  }

  // List widget templates
  async listWidgetTemplates(filters = {}) {
    let templates = Array.from(this.widgets.values());
    
    if (filters.type) {
      templates = templates.filter(t => t.type === filters.type);
    }
    
    return templates;
  }

  // Generate unique ID
  generateId() {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new DashboardManager();
