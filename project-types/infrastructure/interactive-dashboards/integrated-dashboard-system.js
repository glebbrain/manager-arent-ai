const EventEmitter = require('events');

/**
 * Integrated Dashboard System v2.4
 * Orchestrates all dashboard components and provides unified interface
 */
class InteractiveDashboardSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            enableRealTime: true,
            enableAnalytics: true,
            enableSharing: true,
            enableThemes: true,
            enableWidgets: true,
            ...options
        };
        
        this.components = new Map();
        this.dashboards = new Map();
        this.widgets = new Map();
        this.themes = new Map();
        this.users = new Map();
        this.analytics = new Map();
        
        this.initializeComponents();
    }

    /**
     * Initialize all dashboard components
     */
    initializeComponents() {
        // Initialize core components
        this.components.set('dashboardEngine', new (require('./dashboard-engine'))());
        this.components.set('visualizationEngine', new (require('./visualization-engine'))());
        this.components.set('realTimeUpdater', new (require('./real-time-updater'))());
        this.components.set('dashboardManager', new (require('./dashboard-manager'))());
        this.components.set('widgetLibrary', new (require('./widget-library'))());
        this.components.set('themeManager', new (require('./theme-manager'))());
        this.components.set('userPreferences', new (require('./user-preferences'))());
        this.components.set('dashboardSharing', new (require('./dashboard-sharing'))());
        this.components.set('analyticsTracker', new (require('./analytics-tracker'))());
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize default data
        this.initializeDefaultData();
    }

    /**
     * Set up event listeners between components
     */
    setupEventListeners() {
        // Dashboard events
        this.components.get('dashboardManager').on('dashboardCreated', (dashboard) => {
            this.emit('dashboardCreated', dashboard);
            this.components.get('analyticsTracker').trackEvent('dashboard_created', dashboard);
        });

        this.components.get('dashboardManager').on('dashboardUpdated', (dashboard) => {
            this.emit('dashboardUpdated', dashboard);
            this.components.get('analyticsTracker').trackEvent('dashboard_updated', dashboard);
        });

        this.components.get('dashboardManager').on('dashboardDeleted', (dashboardId) => {
            this.emit('dashboardDeleted', dashboardId);
            this.components.get('analyticsTracker').trackEvent('dashboard_deleted', { dashboardId });
        });

        // Widget events
        this.components.get('widgetLibrary').on('widgetCreated', (widget) => {
            this.emit('widgetCreated', widget);
            this.components.get('analyticsTracker').trackEvent('widget_created', widget);
        });

        this.components.get('widgetLibrary').on('widgetUpdated', (widget) => {
            this.emit('widgetUpdated', widget);
            this.components.get('analyticsTracker').trackEvent('widget_updated', widget);
        });

        // Real-time events
        this.components.get('realTimeUpdater').on('dataUpdated', (data) => {
            this.emit('dataUpdated', data);
        });

        // User preference events
        this.components.get('userPreferences').on('preferencesUpdated', (preferences) => {
            this.emit('preferencesUpdated', preferences);
        });

        // Sharing events
        this.components.get('dashboardSharing').on('dashboardShared', (shareInfo) => {
            this.emit('dashboardShared', shareInfo);
            this.components.get('analyticsTracker').trackEvent('dashboard_shared', shareInfo);
        });
    }

    /**
     * Initialize default data
     */
    initializeDefaultData() {
        // Create default themes
        this.createDefaultThemes();
        
        // Create default widgets
        this.createDefaultWidgets();
        
        // Create default dashboard templates
        this.createDefaultTemplates();
    }

    /**
     * Create default themes
     */
    createDefaultThemes() {
        const themes = [
            {
                id: 'default',
                name: 'Default',
                description: 'Default theme with clean design',
                colors: {
                    primary: '#007bff',
                    secondary: '#6c757d',
                    success: '#28a745',
                    danger: '#dc3545',
                    warning: '#ffc107',
                    info: '#17a2b8',
                    light: '#f8f9fa',
                    dark: '#343a40'
                },
                fonts: {
                    primary: 'Inter, sans-serif',
                    secondary: 'Roboto, sans-serif'
                },
                spacing: {
                    xs: '4px',
                    sm: '8px',
                    md: '16px',
                    lg: '24px',
                    xl: '32px'
                }
            },
            {
                id: 'dark',
                name: 'Dark',
                description: 'Dark theme for low-light environments',
                colors: {
                    primary: '#0d6efd',
                    secondary: '#6c757d',
                    success: '#198754',
                    danger: '#dc3545',
                    warning: '#fd7e14',
                    info: '#0dcaf0',
                    light: '#f8f9fa',
                    dark: '#212529'
                },
                fonts: {
                    primary: 'Inter, sans-serif',
                    secondary: 'Roboto, sans-serif'
                },
                spacing: {
                    xs: '4px',
                    sm: '8px',
                    md: '16px',
                    lg: '24px',
                    xl: '32px'
                }
            },
            {
                id: 'minimal',
                name: 'Minimal',
                description: 'Minimal theme with subtle colors',
                colors: {
                    primary: '#6c757d',
                    secondary: '#adb5bd',
                    success: '#28a745',
                    danger: '#dc3545',
                    warning: '#ffc107',
                    info: '#17a2b8',
                    light: '#ffffff',
                    dark: '#495057'
                },
                fonts: {
                    primary: 'Helvetica, sans-serif',
                    secondary: 'Arial, sans-serif'
                },
                spacing: {
                    xs: '2px',
                    sm: '4px',
                    md: '8px',
                    lg: '16px',
                    xl: '24px'
                }
            }
        ];

        themes.forEach(theme => {
            this.components.get('themeManager').createTheme(theme);
        });
    }

    /**
     * Create default widgets
     */
    createDefaultWidgets() {
        const widgets = [
            {
                id: 'line-chart',
                name: 'Line Chart',
                type: 'chart',
                category: 'visualization',
                description: 'Interactive line chart for time series data',
                config: {
                    chartType: 'line',
                    dataSource: 'timeSeries',
                    interactive: true,
                    responsive: true
                },
                template: {
                    width: 400,
                    height: 300,
                    position: { x: 0, y: 0 }
                }
            },
            {
                id: 'bar-chart',
                name: 'Bar Chart',
                type: 'chart',
                category: 'visualization',
                description: 'Interactive bar chart for categorical data',
                config: {
                    chartType: 'bar',
                    dataSource: 'categorical',
                    interactive: true,
                    responsive: true
                },
                template: {
                    width: 400,
                    height: 300,
                    position: { x: 0, y: 0 }
                }
            },
            {
                id: 'pie-chart',
                name: 'Pie Chart',
                type: 'chart',
                category: 'visualization',
                description: 'Interactive pie chart for proportional data',
                config: {
                    chartType: 'pie',
                    dataSource: 'proportional',
                    interactive: true,
                    responsive: true
                },
                template: {
                    width: 300,
                    height: 300,
                    position: { x: 0, y: 0 }
                }
            },
            {
                id: 'kpi-card',
                name: 'KPI Card',
                type: 'metric',
                category: 'metrics',
                description: 'Key Performance Indicator card',
                config: {
                    dataSource: 'singleValue',
                    format: 'number',
                    showTrend: true,
                    showComparison: true
                },
                template: {
                    width: 200,
                    height: 150,
                    position: { x: 0, y: 0 }
                }
            },
            {
                id: 'data-table',
                name: 'Data Table',
                type: 'table',
                category: 'data',
                description: 'Interactive data table with sorting and filtering',
                config: {
                    dataSource: 'tabular',
                    sortable: true,
                    filterable: true,
                    paginated: true
                },
                template: {
                    width: 600,
                    height: 400,
                    position: { x: 0, y: 0 }
                }
            },
            {
                id: 'gauge',
                name: 'Gauge',
                type: 'gauge',
                category: 'metrics',
                description: 'Circular gauge for single value display',
                config: {
                    dataSource: 'singleValue',
                    min: 0,
                    max: 100,
                    showValue: true,
                    showPercentage: true
                },
                template: {
                    width: 200,
                    height: 200,
                    position: { x: 0, y: 0 }
                }
            }
        ];

        widgets.forEach(widget => {
            this.components.get('widgetLibrary').createWidget(widget);
        });
    }

    /**
     * Create default dashboard templates
     */
    createDefaultTemplates() {
        const templates = [
            {
                id: 'executive-summary',
                name: 'Executive Summary',
                description: 'High-level overview dashboard for executives',
                widgets: [
                    {
                        widgetId: 'kpi-card',
                        position: { x: 0, y: 0 },
                        size: { width: 200, height: 150 },
                        config: { title: 'Total Revenue', dataSource: 'revenue' }
                    },
                    {
                        widgetId: 'kpi-card',
                        position: { x: 220, y: 0 },
                        size: { width: 200, height: 150 },
                        config: { title: 'Active Users', dataSource: 'users' }
                    },
                    {
                        widgetId: 'line-chart',
                        position: { x: 0, y: 170 },
                        size: { width: 400, height: 300 },
                        config: { title: 'Revenue Trend', dataSource: 'revenueTrend' }
                    }
                ],
                layout: 'grid',
                theme: 'default'
            },
            {
                id: 'operational-dashboard',
                name: 'Operational Dashboard',
                description: 'Detailed operational metrics dashboard',
                widgets: [
                    {
                        widgetId: 'data-table',
                        position: { x: 0, y: 0 },
                        size: { width: 600, height: 400 },
                        config: { title: 'Recent Activities', dataSource: 'activities' }
                    },
                    {
                        widgetId: 'bar-chart',
                        position: { x: 620, y: 0 },
                        size: { width: 400, height: 300 },
                        config: { title: 'Performance by Category', dataSource: 'performance' }
                    }
                ],
                layout: 'grid',
                theme: 'default'
            },
            {
                id: 'analytics-dashboard',
                name: 'Analytics Dashboard',
                description: 'Comprehensive analytics dashboard',
                widgets: [
                    {
                        widgetId: 'line-chart',
                        position: { x: 0, y: 0 },
                        size: { width: 400, height: 300 },
                        config: { title: 'User Engagement', dataSource: 'engagement' }
                    },
                    {
                        widgetId: 'pie-chart',
                        position: { x: 420, y: 0 },
                        size: { width: 300, height: 300 },
                        config: { title: 'Traffic Sources', dataSource: 'traffic' }
                    },
                    {
                        widgetId: 'gauge',
                        position: { x: 740, y: 0 },
                        size: { width: 200, height: 200 },
                        config: { title: 'Conversion Rate', dataSource: 'conversion' }
                    }
                ],
                layout: 'grid',
                theme: 'default'
            }
        ];

        templates.forEach(template => {
            this.components.get('dashboardManager').createTemplate(template);
        });
    }

    /**
     * Create a new dashboard
     */
    async createDashboard(dashboardData) {
        try {
            const dashboard = await this.components.get('dashboardManager').createDashboard(dashboardData);
            this.dashboards.set(dashboard.id, dashboard);
            
            // Initialize real-time updates if enabled
            if (this.options.enableRealTime) {
                await this.components.get('realTimeUpdater').initializeDashboard(dashboard.id);
            }
            
            this.emit('dashboardCreated', dashboard);
            return dashboard;
        } catch (error) {
            throw new Error(`Failed to create dashboard: ${error.message}`);
        }
    }

    /**
     * Get dashboard by ID
     */
    async getDashboard(dashboardId) {
        try {
            const dashboard = await this.components.get('dashboardManager').getDashboard(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }
            return dashboard;
        } catch (error) {
            throw new Error(`Failed to get dashboard: ${error.message}`);
        }
    }

    /**
     * Update dashboard
     */
    async updateDashboard(dashboardId, updateData) {
        try {
            const dashboard = await this.components.get('dashboardManager').updateDashboard(dashboardId, updateData);
            this.dashboards.set(dashboardId, dashboard);
            
            this.emit('dashboardUpdated', dashboard);
            return dashboard;
        } catch (error) {
            throw new Error(`Failed to update dashboard: ${error.message}`);
        }
    }

    /**
     * Delete dashboard
     */
    async deleteDashboard(dashboardId) {
        try {
            await this.components.get('dashboardManager').deleteDashboard(dashboardId);
            this.dashboards.delete(dashboardId);
            
            // Clean up real-time updates
            if (this.options.enableRealTime) {
                await this.components.get('realTimeUpdater').cleanupDashboard(dashboardId);
            }
            
            this.emit('dashboardDeleted', dashboardId);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete dashboard: ${error.message}`);
        }
    }

    /**
     * Get all dashboards
     */
    async getDashboards(filters = {}) {
        try {
            return await this.components.get('dashboardManager').getDashboards(filters);
        } catch (error) {
            throw new Error(`Failed to get dashboards: ${error.message}`);
        }
    }

    /**
     * Create a new widget
     */
    async createWidget(widgetData) {
        try {
            const widget = await this.components.get('widgetLibrary').createWidget(widgetData);
            this.widgets.set(widget.id, widget);
            
            this.emit('widgetCreated', widget);
            return widget;
        } catch (error) {
            throw new Error(`Failed to create widget: ${error.message}`);
        }
    }

    /**
     * Get widget by ID
     */
    async getWidget(widgetId) {
        try {
            const widget = await this.components.get('widgetLibrary').getWidget(widgetId);
            if (!widget) {
                throw new Error('Widget not found');
            }
            return widget;
        } catch (error) {
            throw new Error(`Failed to get widget: ${error.message}`);
        }
    }

    /**
     * Update widget
     */
    async updateWidget(widgetId, updateData) {
        try {
            const widget = await this.components.get('widgetLibrary').updateWidget(widgetId, updateData);
            this.widgets.set(widgetId, widget);
            
            this.emit('widgetUpdated', widget);
            return widget;
        } catch (error) {
            throw new Error(`Failed to update widget: ${error.message}`);
        }
    }

    /**
     * Delete widget
     */
    async deleteWidget(widgetId) {
        try {
            await this.components.get('widgetLibrary').deleteWidget(widgetId);
            this.widgets.delete(widgetId);
            
            this.emit('widgetDeleted', widgetId);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete widget: ${error.message}`);
        }
    }

    /**
     * Get all widgets
     */
    async getWidgets(filters = {}) {
        try {
            return await this.components.get('widgetLibrary').getWidgets(filters);
        } catch (error) {
            throw new Error(`Failed to get widgets: ${error.message}`);
        }
    }

    /**
     * Create visualization
     */
    async createVisualization(visualizationData) {
        try {
            return await this.components.get('visualizationEngine').createVisualization(visualizationData);
        } catch (error) {
            throw new Error(`Failed to create visualization: ${error.message}`);
        }
    }

    /**
     * Get real-time data for dashboard
     */
    async getRealTimeData(dashboardId) {
        try {
            if (!this.options.enableRealTime) {
                throw new Error('Real-time updates are disabled');
            }
            return await this.components.get('realTimeUpdater').getRealTimeData(dashboardId);
        } catch (error) {
            throw new Error(`Failed to get real-time data: ${error.message}`);
        }
    }

    /**
     * Subscribe to real-time updates
     */
    async subscribeToUpdates(dashboardId, subscriptionData) {
        try {
            if (!this.options.enableRealTime) {
                throw new Error('Real-time updates are disabled');
            }
            return await this.components.get('realTimeUpdater').subscribeToUpdates(dashboardId, subscriptionData);
        } catch (error) {
            throw new Error(`Failed to subscribe to updates: ${error.message}`);
        }
    }

    /**
     * Unsubscribe from real-time updates
     */
    async unsubscribeFromUpdates(dashboardId, connectionId) {
        try {
            if (!this.options.enableRealTime) {
                throw new Error('Real-time updates are disabled');
            }
            return await this.components.get('realTimeUpdater').unsubscribeFromUpdates(dashboardId, connectionId);
        } catch (error) {
            throw new Error(`Failed to unsubscribe from updates: ${error.message}`);
        }
    }

    /**
     * Get user preferences
     */
    async getUserPreferences(userId) {
        try {
            return await this.components.get('userPreferences').getPreferences(userId);
        } catch (error) {
            throw new Error(`Failed to get user preferences: ${error.message}`);
        }
    }

    /**
     * Update user preferences
     */
    async updateUserPreferences(userId, preferences) {
        try {
            return await this.components.get('userPreferences').updatePreferences(userId, preferences);
        } catch (error) {
            throw new Error(`Failed to update user preferences: ${error.message}`);
        }
    }

    /**
     * Share dashboard
     */
    async shareDashboard(dashboardId, shareOptions) {
        try {
            if (!this.options.enableSharing) {
                throw new Error('Dashboard sharing is disabled');
            }
            return await this.components.get('dashboardSharing').shareDashboard(dashboardId, shareOptions);
        } catch (error) {
            throw new Error(`Failed to share dashboard: ${error.message}`);
        }
    }

    /**
     * Get shared dashboard
     */
    async getSharedDashboard(shareToken) {
        try {
            if (!this.options.enableSharing) {
                throw new Error('Dashboard sharing is disabled');
            }
            return await this.components.get('dashboardSharing').getSharedDashboard(shareToken);
        } catch (error) {
            throw new Error(`Failed to get shared dashboard: ${error.message}`);
        }
    }

    /**
     * Get analytics for dashboard
     */
    async getDashboardAnalytics(dashboardId, filters = {}) {
        try {
            if (!this.options.enableAnalytics) {
                throw new Error('Analytics are disabled');
            }
            return await this.components.get('analyticsTracker').getDashboardAnalytics(dashboardId, filters);
        } catch (error) {
            throw new Error(`Failed to get dashboard analytics: ${error.message}`);
        }
    }

    /**
     * Get analytics for user
     */
    async getUserAnalytics(userId, filters = {}) {
        try {
            if (!this.options.enableAnalytics) {
                throw new Error('Analytics are disabled');
            }
            return await this.components.get('analyticsTracker').getUserAnalytics(userId, filters);
        } catch (error) {
            throw new Error(`Failed to get user analytics: ${error.message}`);
        }
    }

    /**
     * Export dashboard
     */
    async exportDashboard(dashboardId, exportOptions) {
        try {
            return await this.components.get('dashboardManager').exportDashboard(dashboardId, exportOptions);
        } catch (error) {
            throw new Error(`Failed to export dashboard: ${error.message}`);
        }
    }

    /**
     * Import dashboard
     */
    async importDashboard(importData) {
        try {
            const dashboard = await this.components.get('dashboardManager').importDashboard(importData);
            this.dashboards.set(dashboard.id, dashboard);
            
            this.emit('dashboardImported', dashboard);
            return dashboard;
        } catch (error) {
            throw new Error(`Failed to import dashboard: ${error.message}`);
        }
    }

    /**
     * Get system status
     */
    async getSystemStatus() {
        try {
            const status = {
                isRunning: true,
                totalDashboards: this.dashboards.size,
                totalWidgets: this.widgets.size,
                totalThemes: this.themes.size,
                activeConnections: this.components.get('realTimeUpdater').getActiveConnections(),
                uptime: process.uptime(),
                lastUpdate: new Date().toISOString(),
                version: '2.4.0',
                components: {}
            };

            // Get status from each component
            for (const [name, component] of this.components) {
                if (typeof component.getStatus === 'function') {
                    status.components[name] = component.getStatus();
                }
            }

            return status;
        } catch (error) {
            throw new Error(`Failed to get system status: ${error.message}`);
        }
    }

    /**
     * Get component by name
     */
    getComponent(name) {
        return this.components.get(name);
    }

    /**
     * Shutdown the system
     */
    async shutdown() {
        try {
            // Clean up all components
            for (const [name, component] of this.components) {
                if (typeof component.shutdown === 'function') {
                    await component.shutdown();
                }
            }

            // Clear all data
            this.dashboards.clear();
            this.widgets.clear();
            this.themes.clear();
            this.users.clear();
            this.analytics.clear();

            this.emit('shutdown');
        } catch (error) {
            throw new Error(`Failed to shutdown system: ${error.message}`);
        }
    }
}

module.exports = InteractiveDashboardSystem;
