const EventEmitter = require('events');

/**
 * Dashboard Engine v2.4
 * Core dashboard functionality and management
 */
class DashboardEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxDashboards: 1000,
            maxWidgetsPerDashboard: 50,
            defaultLayout: 'grid',
            enableDragDrop: true,
            enableResize: true,
            enableSnapToGrid: true,
            gridSize: 20,
            ...options
        };
        
        this.dashboards = new Map();
        this.templates = new Map();
        this.layouts = new Map();
        this.validators = new Map();
        
        this.initializeDefaultLayouts();
        this.initializeValidators();
    }

    /**
     * Initialize default layouts
     */
    initializeDefaultLayouts() {
        const layouts = [
            {
                id: 'grid',
                name: 'Grid Layout',
                description: 'Standard grid-based layout',
                config: {
                    columns: 12,
                    rowHeight: 60,
                    margin: [10, 10],
                    containerPadding: [10, 10],
                    isDraggable: true,
                    isResizable: true,
                    isBounded: false,
                    useCSSTransforms: true
                }
            },
            {
                id: 'freeform',
                name: 'Freeform Layout',
                description: 'Free positioning layout',
                config: {
                    columns: 1,
                    rowHeight: 1,
                    margin: [0, 0],
                    containerPadding: [0, 0],
                    isDraggable: true,
                    isResizable: true,
                    isBounded: false,
                    useCSSTransforms: true
                }
            },
            {
                id: 'fixed',
                name: 'Fixed Layout',
                description: 'Fixed position layout',
                config: {
                    columns: 12,
                    rowHeight: 60,
                    margin: [10, 10],
                    containerPadding: [10, 10],
                    isDraggable: false,
                    isResizable: false,
                    isBounded: true,
                    useCSSTransforms: true
                }
            }
        ];

        layouts.forEach(layout => {
            this.layouts.set(layout.id, layout);
        });
    }

    /**
     * Initialize validators
     */
    initializeValidators() {
        this.validators.set('dashboard', this.validateDashboard.bind(this));
        this.validators.set('widget', this.validateWidget.bind(this));
        this.validators.set('layout', this.validateLayout.bind(this));
    }

    /**
     * Create a new dashboard
     */
    async createDashboard(dashboardData) {
        try {
            // Validate dashboard data
            const validation = await this.validators.get('dashboard')(dashboardData);
            if (!validation.isValid) {
                throw new Error(`Dashboard validation failed: ${validation.errors.join(', ')}`);
            }

            // Generate unique ID
            const dashboardId = this.generateId();
            
            // Create dashboard object
            const dashboard = {
                id: dashboardId,
                name: dashboardData.name || 'Untitled Dashboard',
                description: dashboardData.description || '',
                layout: dashboardData.layout || this.options.defaultLayout,
                theme: dashboardData.theme || 'default',
                widgets: dashboardData.widgets || [],
                settings: {
                    enableDragDrop: dashboardData.settings?.enableDragDrop ?? this.options.enableDragDrop,
                    enableResize: dashboardData.settings?.enableResize ?? this.options.enableResize,
                    enableSnapToGrid: dashboardData.settings?.enableSnapToGrid ?? this.options.enableSnapToGrid,
                    gridSize: dashboardData.settings?.gridSize ?? this.options.gridSize,
                    ...dashboardData.settings
                },
                permissions: {
                    owner: dashboardData.owner || 'system',
                    viewers: dashboardData.viewers || [],
                    editors: dashboardData.editors || [],
                    public: dashboardData.public || false
                },
                metadata: {
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    version: '1.0.0',
                    tags: dashboardData.tags || []
                },
                state: {
                    isActive: true,
                    isPublished: false,
                    lastAccessed: new Date().toISOString()
                }
            };

            // Store dashboard
            this.dashboards.set(dashboardId, dashboard);
            
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
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            // Update last accessed time
            dashboard.state.lastAccessed = new Date().toISOString();
            
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
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            // Validate update data
            const validation = await this.validators.get('dashboard')(updateData, true);
            if (!validation.isValid) {
                throw new Error(`Dashboard update validation failed: ${validation.errors.join(', ')}`);
            }

            // Update dashboard
            const updatedDashboard = {
                ...dashboard,
                ...updateData,
                metadata: {
                    ...dashboard.metadata,
                    updated: new Date().toISOString(),
                    version: this.incrementVersion(dashboard.metadata.version)
                }
            };

            // Store updated dashboard
            this.dashboards.set(dashboardId, updatedDashboard);
            
            this.emit('dashboardUpdated', updatedDashboard);
            return updatedDashboard;
        } catch (error) {
            throw new Error(`Failed to update dashboard: ${error.message}`);
        }
    }

    /**
     * Delete dashboard
     */
    async deleteDashboard(dashboardId) {
        try {
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            // Remove dashboard
            this.dashboards.delete(dashboardId);
            
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
            let dashboards = Array.from(this.dashboards.values());

            // Apply filters
            if (filters.owner) {
                dashboards = dashboards.filter(d => d.permissions.owner === filters.owner);
            }

            if (filters.public !== undefined) {
                dashboards = dashboards.filter(d => d.permissions.public === filters.public);
            }

            if (filters.tags && filters.tags.length > 0) {
                dashboards = dashboards.filter(d => 
                    filters.tags.some(tag => d.metadata.tags.includes(tag))
                );
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                dashboards = dashboards.filter(d => 
                    d.name.toLowerCase().includes(searchTerm) ||
                    d.description.toLowerCase().includes(searchTerm)
                );
            }

            // Sort dashboards
            const sortBy = filters.sortBy || 'updated';
            const sortOrder = filters.sortOrder || 'desc';
            
            dashboards.sort((a, b) => {
                const aValue = a.metadata[sortBy];
                const bValue = b.metadata[sortBy];
                
                if (sortOrder === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            // Pagination
            const page = filters.page || 1;
            const limit = filters.limit || 20;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;

            return {
                dashboards: dashboards.slice(startIndex, endIndex),
                total: dashboards.length,
                page,
                limit,
                totalPages: Math.ceil(dashboards.length / limit)
            };
        } catch (error) {
            throw new Error(`Failed to get dashboards: ${error.message}`);
        }
    }

    /**
     * Add widget to dashboard
     */
    async addWidget(dashboardId, widgetData) {
        try {
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            // Check widget limit
            if (dashboard.widgets.length >= this.options.maxWidgetsPerDashboard) {
                throw new Error(`Maximum widgets per dashboard exceeded (${this.options.maxWidgetsPerDashboard})`);
            }

            // Validate widget data
            const validation = await this.validators.get('widget')(widgetData);
            if (!validation.isValid) {
                throw new Error(`Widget validation failed: ${validation.errors.join(', ')}`);
            }

            // Generate widget ID
            const widgetId = this.generateId();
            
            // Create widget object
            const widget = {
                id: widgetId,
                type: widgetData.type,
                title: widgetData.title || 'Untitled Widget',
                config: widgetData.config || {},
                position: widgetData.position || { x: 0, y: 0 },
                size: widgetData.size || { width: 200, height: 150 },
                dataSource: widgetData.dataSource || null,
                ...widgetData
            };

            // Add widget to dashboard
            dashboard.widgets.push(widget);
            dashboard.metadata.updated = new Date().toISOString();
            dashboard.metadata.version = this.incrementVersion(dashboard.metadata.version);

            // Store updated dashboard
            this.dashboards.set(dashboardId, dashboard);
            
            this.emit('widgetAdded', { dashboardId, widget });
            return widget;
        } catch (error) {
            throw new Error(`Failed to add widget: ${error.message}`);
        }
    }

    /**
     * Update widget in dashboard
     */
    async updateWidget(dashboardId, widgetId, updateData) {
        try {
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
            if (widgetIndex === -1) {
                throw new Error('Widget not found');
            }

            // Validate widget update data
            const validation = await this.validators.get('widget')(updateData, true);
            if (!validation.isValid) {
                throw new Error(`Widget update validation failed: ${validation.errors.join(', ')}`);
            }

            // Update widget
            dashboard.widgets[widgetIndex] = {
                ...dashboard.widgets[widgetIndex],
                ...updateData
            };

            dashboard.metadata.updated = new Date().toISOString();
            dashboard.metadata.version = this.incrementVersion(dashboard.metadata.version);

            // Store updated dashboard
            this.dashboards.set(dashboardId, dashboard);
            
            this.emit('widgetUpdated', { dashboardId, widgetId, widget: dashboard.widgets[widgetIndex] });
            return dashboard.widgets[widgetIndex];
        } catch (error) {
            throw new Error(`Failed to update widget: ${error.message}`);
        }
    }

    /**
     * Remove widget from dashboard
     */
    async removeWidget(dashboardId, widgetId) {
        try {
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
            if (widgetIndex === -1) {
                throw new Error('Widget not found');
            }

            // Remove widget
            const widget = dashboard.widgets.splice(widgetIndex, 1)[0];
            
            dashboard.metadata.updated = new Date().toISOString();
            dashboard.metadata.version = this.incrementVersion(dashboard.metadata.version);

            // Store updated dashboard
            this.dashboards.set(dashboardId, dashboard);
            
            this.emit('widgetRemoved', { dashboardId, widgetId, widget });
            return true;
        } catch (error) {
            throw new Error(`Failed to remove widget: ${error.message}`);
        }
    }

    /**
     * Update dashboard layout
     */
    async updateLayout(dashboardId, layoutData) {
        try {
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            // Validate layout data
            const validation = await this.validators.get('layout')(layoutData);
            if (!validation.isValid) {
                throw new Error(`Layout validation failed: ${validation.errors.join(', ')}`);
            }

            // Update layout
            dashboard.layout = layoutData.layout || dashboard.layout;
            dashboard.settings = {
                ...dashboard.settings,
                ...layoutData.settings
            };

            dashboard.metadata.updated = new Date().toISOString();
            dashboard.metadata.version = this.incrementVersion(dashboard.metadata.version);

            // Store updated dashboard
            this.dashboards.set(dashboardId, dashboard);
            
            this.emit('layoutUpdated', { dashboardId, layout: dashboard.layout });
            return dashboard;
        } catch (error) {
            throw new Error(`Failed to update layout: ${error.message}`);
        }
    }

    /**
     * Duplicate dashboard
     */
    async duplicateDashboard(dashboardId, newName = null) {
        try {
            const originalDashboard = this.dashboards.get(dashboardId);
            if (!originalDashboard) {
                throw new Error('Dashboard not found');
            }

            // Create duplicate
            const duplicateData = {
                name: newName || `${originalDashboard.name} (Copy)`,
                description: originalDashboard.description,
                layout: originalDashboard.layout,
                theme: originalDashboard.theme,
                widgets: originalDashboard.widgets.map(widget => ({
                    ...widget,
                    id: this.generateId(),
                    position: { ...widget.position }
                })),
                settings: { ...originalDashboard.settings },
                permissions: {
                    owner: originalDashboard.permissions.owner,
                    viewers: [],
                    editors: [],
                    public: false
                },
                tags: [...originalDashboard.metadata.tags]
            };

            const duplicate = await this.createDashboard(duplicateData);
            
            this.emit('dashboardDuplicated', { originalId: dashboardId, duplicateId: duplicate.id });
            return duplicate;
        } catch (error) {
            throw new Error(`Failed to duplicate dashboard: ${error.message}`);
        }
    }

    /**
     * Export dashboard
     */
    async exportDashboard(dashboardId, exportOptions = {}) {
        try {
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            const exportData = {
                dashboard: {
                    name: dashboard.name,
                    description: dashboard.description,
                    layout: dashboard.layout,
                    theme: dashboard.theme,
                    widgets: dashboard.widgets,
                    settings: dashboard.settings
                },
                metadata: {
                    exported: new Date().toISOString(),
                    version: '2.4.0',
                    format: exportOptions.format || 'json'
                }
            };

            // Add additional data based on export options
            if (exportOptions.includeData) {
                exportData.data = await this.getDashboardData(dashboardId);
            }

            if (exportOptions.includePermissions) {
                exportData.permissions = dashboard.permissions;
            }

            return exportData;
        } catch (error) {
            throw new Error(`Failed to export dashboard: ${error.message}`);
        }
    }

    /**
     * Import dashboard
     */
    async importDashboard(importData) {
        try {
            // Validate import data
            if (!importData.dashboard) {
                throw new Error('Invalid import data: missing dashboard information');
            }

            const dashboardData = {
                name: importData.dashboard.name,
                description: importData.dashboard.description,
                layout: importData.dashboard.layout,
                theme: importData.dashboard.theme,
                widgets: importData.dashboard.widgets || [],
                settings: importData.dashboard.settings || {},
                permissions: importData.permissions || {
                    owner: 'system',
                    viewers: [],
                    editors: [],
                    public: false
                },
                tags: importData.dashboard.tags || []
            };

            const dashboard = await this.createDashboard(dashboardData);
            
            this.emit('dashboardImported', dashboard);
            return dashboard;
        } catch (error) {
            throw new Error(`Failed to import dashboard: ${error.message}`);
        }
    }

    /**
     * Get dashboard data
     */
    async getDashboardData(dashboardId) {
        try {
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            // This would typically fetch data from data sources
            // For now, return mock data
            return {
                widgets: dashboard.widgets.map(widget => ({
                    id: widget.id,
                    type: widget.type,
                    data: this.generateMockData(widget.type)
                }))
            };
        } catch (error) {
            throw new Error(`Failed to get dashboard data: ${error.message}`);
        }
    }

    /**
     * Generate mock data for widget
     */
    generateMockData(widgetType) {
        const mockData = {
            chart: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Sample Data',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            table: {
                columns: ['Name', 'Value', 'Status'],
                rows: [
                    ['Item 1', '100', 'Active'],
                    ['Item 2', '200', 'Inactive'],
                    ['Item 3', '150', 'Active']
                ]
            },
            metric: {
                value: 1234,
                change: 12.5,
                trend: 'up'
            },
            gauge: {
                value: 75,
                min: 0,
                max: 100,
                unit: '%'
            }
        };

        return mockData[widgetType] || mockData.metric;
    }

    /**
     * Validation methods
     */
    async validateDashboard(data, isUpdate = false) {
        const errors = [];

        if (!isUpdate) {
            if (!data.name || typeof data.name !== 'string') {
                errors.push('Dashboard name is required');
            }
        }

        if (data.name && typeof data.name !== 'string') {
            errors.push('Dashboard name must be a string');
        }

        if (data.description && typeof data.description !== 'string') {
            errors.push('Dashboard description must be a string');
        }

        if (data.layout && !this.layouts.has(data.layout)) {
            errors.push('Invalid layout type');
        }

        if (data.widgets && !Array.isArray(data.widgets)) {
            errors.push('Widgets must be an array');
        }

        if (data.widgets && data.widgets.length > this.options.maxWidgetsPerDashboard) {
            errors.push(`Maximum widgets exceeded (${this.options.maxWidgetsPerDashboard})`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async validateWidget(data, isUpdate = false) {
        const errors = [];

        if (!isUpdate) {
            if (!data.type || typeof data.type !== 'string') {
                errors.push('Widget type is required');
            }
        }

        if (data.type && typeof data.type !== 'string') {
            errors.push('Widget type must be a string');
        }

        if (data.title && typeof data.title !== 'string') {
            errors.push('Widget title must be a string');
        }

        if (data.position && (!data.position.x || !data.position.y)) {
            errors.push('Widget position must have x and y coordinates');
        }

        if (data.size && (!data.size.width || !data.size.height)) {
            errors.push('Widget size must have width and height');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async validateLayout(data) {
        const errors = [];

        if (data.layout && !this.layouts.has(data.layout)) {
            errors.push('Invalid layout type');
        }

        if (data.settings && typeof data.settings !== 'object') {
            errors.push('Layout settings must be an object');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Helper methods
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    incrementVersion(version) {
        const parts = version.split('.');
        const patch = parseInt(parts[2]) + 1;
        return `${parts[0]}.${parts[1]}.${patch}`;
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            isRunning: true,
            totalDashboards: this.dashboards.size,
            totalTemplates: this.templates.size,
            totalLayouts: this.layouts.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = DashboardEngine;
