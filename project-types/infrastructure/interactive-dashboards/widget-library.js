const EventEmitter = require('events');

/**
 * Widget Library v2.4
 * Manages widget types, templates, and configurations
 */
class WidgetLibrary extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxWidgets: 1000,
            enableCustomWidgets: true,
            enableWidgetSharing: true,
            ...options
        };
        
        this.widgets = new Map();
        this.widgetTypes = new Map();
        this.templates = new Map();
        this.categories = new Map();
        
        this.initializeWidgetTypes();
        this.initializeCategories();
    }

    /**
     * Initialize widget types
     */
    initializeWidgetTypes() {
        const widgetTypes = [
            {
                id: 'chart',
                name: 'Chart',
                description: 'Interactive charts and graphs',
                category: 'visualization',
                icon: 'chart-line',
                config: {
                    supportedChartTypes: ['line', 'bar', 'pie', 'doughnut', 'area', 'scatter'],
                    defaultSize: { width: 400, height: 300 },
                    minSize: { width: 200, height: 150 },
                    maxSize: { width: 800, height: 600 }
                }
            },
            {
                id: 'metric',
                name: 'Metric',
                description: 'Single value metrics and KPIs',
                category: 'metrics',
                icon: 'tachometer-alt',
                config: {
                    defaultSize: { width: 200, height: 150 },
                    minSize: { width: 150, height: 100 },
                    maxSize: { width: 400, height: 300 }
                }
            },
            {
                id: 'table',
                name: 'Table',
                description: 'Data tables with sorting and filtering',
                category: 'data',
                icon: 'table',
                config: {
                    defaultSize: { width: 600, height: 400 },
                    minSize: { width: 300, height: 200 },
                    maxSize: { width: 1000, height: 800 }
                }
            },
            {
                id: 'gauge',
                name: 'Gauge',
                description: 'Circular gauge for single values',
                category: 'metrics',
                icon: 'circle',
                config: {
                    defaultSize: { width: 200, height: 200 },
                    minSize: { width: 150, height: 150 },
                    maxSize: { width: 400, height: 400 }
                }
            },
            {
                id: 'text',
                name: 'Text',
                description: 'Rich text and markdown content',
                category: 'content',
                icon: 'font',
                config: {
                    defaultSize: { width: 300, height: 200 },
                    minSize: { width: 200, height: 100 },
                    maxSize: { width: 600, height: 400 }
                }
            },
            {
                id: 'image',
                name: 'Image',
                description: 'Images and media content',
                category: 'content',
                icon: 'image',
                config: {
                    defaultSize: { width: 300, height: 200 },
                    minSize: { width: 150, height: 100 },
                    maxSize: { width: 600, height: 400 }
                }
            },
            {
                id: 'iframe',
                name: 'Iframe',
                description: 'Embedded web content',
                category: 'content',
                icon: 'window-maximize',
                config: {
                    defaultSize: { width: 400, height: 300 },
                    minSize: { width: 200, height: 150 },
                    maxSize: { width: 800, height: 600 }
                }
            },
            {
                id: 'map',
                name: 'Map',
                description: 'Geographic data visualization',
                category: 'visualization',
                icon: 'map',
                config: {
                    defaultSize: { width: 400, height: 300 },
                    minSize: { width: 200, height: 150 },
                    maxSize: { width: 800, height: 600 }
                }
            }
        ];

        widgetTypes.forEach(widgetType => {
            this.widgetTypes.set(widgetType.id, widgetType);
        });
    }

    /**
     * Initialize categories
     */
    initializeCategories() {
        const categories = [
            {
                id: 'visualization',
                name: 'Visualization',
                description: 'Charts, graphs, and visual representations',
                color: '#007bff',
                icon: 'chart-line'
            },
            {
                id: 'metrics',
                name: 'Metrics',
                description: 'KPIs, gauges, and single-value displays',
                color: '#28a745',
                icon: 'tachometer-alt'
            },
            {
                id: 'data',
                name: 'Data',
                description: 'Tables, lists, and data grids',
                color: '#ffc107',
                icon: 'table'
            },
            {
                id: 'content',
                name: 'Content',
                description: 'Text, images, and media content',
                color: '#6f42c1',
                icon: 'file-alt'
            },
            {
                id: 'interactive',
                name: 'Interactive',
                description: 'Interactive controls and inputs',
                color: '#dc3545',
                icon: 'mouse-pointer'
            }
        ];

        categories.forEach(category => {
            this.categories.set(category.id, category);
        });
    }

    /**
     * Create widget
     */
    async createWidget(widgetData) {
        try {
            // Validate widget data
            const validation = this.validateWidgetData(widgetData);
            if (!validation.isValid) {
                throw new Error(`Widget validation failed: ${validation.errors.join(', ')}`);
            }

            // Generate unique ID
            const widgetId = this.generateId();
            
            // Get widget type configuration
            const widgetType = this.widgetTypes.get(widgetData.type);
            if (!widgetType) {
                throw new Error(`Unsupported widget type: ${widgetData.type}`);
            }

            // Create widget object
            const widget = {
                id: widgetId,
                name: widgetData.name || 'Untitled Widget',
                type: widgetData.type,
                category: widgetData.category || widgetType.category,
                description: widgetData.description || '',
                config: {
                    ...widgetType.config,
                    ...widgetData.config
                },
                dataSource: widgetData.dataSource || null,
                position: widgetData.position || { x: 0, y: 0 },
                size: widgetData.size || widgetType.config.defaultSize,
                settings: {
                    enableRefresh: widgetData.settings?.enableRefresh ?? true,
                    refreshInterval: widgetData.settings?.refreshInterval ?? 30000,
                    enableExport: widgetData.settings?.enableExport ?? true,
                    enableFullscreen: widgetData.settings?.enableFullscreen ?? true,
                    ...widgetData.settings
                },
                style: {
                    backgroundColor: widgetData.style?.backgroundColor || 'transparent',
                    borderColor: widgetData.style?.borderColor || '#dee2e6',
                    borderWidth: widgetData.style?.borderWidth || 1,
                    borderRadius: widgetData.style?.borderRadius || 4,
                    padding: widgetData.style?.padding || 16,
                    ...widgetData.style
                },
                metadata: {
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    version: '1.0.0',
                    createdBy: widgetData.createdBy || 'system',
                    tags: widgetData.tags || []
                },
                state: {
                    isActive: true,
                    isTemplate: false,
                    usageCount: 0
                }
            };

            // Store widget
            this.widgets.set(widgetId, widget);
            
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
            const widget = this.widgets.get(widgetId);
            if (!widget) {
                throw new Error('Widget not found');
            }

            // Update usage count
            widget.state.usageCount++;

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
            const widget = this.widgets.get(widgetId);
            if (!widget) {
                throw new Error('Widget not found');
            }

            // Validate update data
            const validation = this.validateWidgetData(updateData, true);
            if (!validation.isValid) {
                throw new Error(`Widget update validation failed: ${validation.errors.join(', ')}`);
            }

            // Update widget
            const updatedWidget = {
                ...widget,
                ...updateData,
                metadata: {
                    ...widget.metadata,
                    updated: new Date().toISOString(),
                    version: this.incrementVersion(widget.metadata.version)
                }
            };

            // Store updated widget
            this.widgets.set(widgetId, updatedWidget);
            
            this.emit('widgetUpdated', updatedWidget);
            return updatedWidget;
        } catch (error) {
            throw new Error(`Failed to update widget: ${error.message}`);
        }
    }

    /**
     * Delete widget
     */
    async deleteWidget(widgetId) {
        try {
            const widget = this.widgets.get(widgetId);
            if (!widget) {
                throw new Error('Widget not found');
            }

            // Remove widget
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
            let widgets = Array.from(this.widgets.values());

            // Apply filters
            if (filters.type) {
                widgets = widgets.filter(w => w.type === filters.type);
            }

            if (filters.category) {
                widgets = widgets.filter(w => w.category === filters.category);
            }

            if (filters.tags && filters.tags.length > 0) {
                widgets = widgets.filter(w => 
                    filters.tags.some(tag => w.metadata.tags.includes(tag))
                );
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                widgets = widgets.filter(w => 
                    w.name.toLowerCase().includes(searchTerm) ||
                    w.description.toLowerCase().includes(searchTerm)
                );
            }

            if (filters.isTemplate !== undefined) {
                widgets = widgets.filter(w => w.state.isTemplate === filters.isTemplate);
            }

            // Sort widgets
            const sortBy = filters.sortBy || 'updated';
            const sortOrder = filters.sortOrder || 'desc';
            
            widgets.sort((a, b) => {
                const aValue = a.metadata[sortBy] || a.state[sortBy];
                const bValue = b.metadata[sortBy] || b.state[sortBy];
                
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
                widgets: widgets.slice(startIndex, endIndex),
                total: widgets.length,
                page,
                limit,
                totalPages: Math.ceil(widgets.length / limit)
            };
        } catch (error) {
            throw new Error(`Failed to get widgets: ${error.message}`);
        }
    }

    /**
     * Create widget template
     */
    async createWidgetTemplate(widgetId, templateData) {
        try {
            const widget = this.widgets.get(widgetId);
            if (!widget) {
                throw new Error('Widget not found');
            }

            // Generate template ID
            const templateId = this.generateId();
            
            // Create template object
            const template = {
                id: templateId,
                name: templateData.name || `${widget.name} Template`,
                description: templateData.description || `Template based on ${widget.name}`,
                type: widget.type,
                category: widget.category,
                config: { ...widget.config },
                settings: { ...widget.settings },
                style: { ...widget.style },
                metadata: {
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    version: '1.0.0',
                    createdBy: templateData.createdBy || widget.metadata.createdBy,
                    basedOn: widgetId,
                    tags: [...widget.metadata.tags]
                },
                state: {
                    isActive: true,
                    isTemplate: true,
                    usageCount: 0
                }
            };

            // Store template
            this.templates.set(templateId, template);
            
            // Mark original widget as template
            widget.state.isTemplate = true;
            this.widgets.set(widgetId, widget);

            this.emit('templateCreated', template);
            return template;
        } catch (error) {
            throw new Error(`Failed to create widget template: ${error.message}`);
        }
    }

    /**
     * Get widget template
     */
    async getWidgetTemplate(templateId) {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error('Widget template not found');
            }

            // Update usage count
            template.state.usageCount++;

            return template;
        } catch (error) {
            throw new Error(`Failed to get widget template: ${error.message}`);
        }
    }

    /**
     * Get all widget templates
     */
    async getWidgetTemplates(filters = {}) {
        try {
            let templates = Array.from(this.templates.values());

            // Apply filters
            if (filters.type) {
                templates = templates.filter(t => t.type === filters.type);
            }

            if (filters.category) {
                templates = templates.filter(t => t.category === filters.category);
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                templates = templates.filter(t => 
                    t.name.toLowerCase().includes(searchTerm) ||
                    t.description.toLowerCase().includes(searchTerm)
                );
            }

            // Sort templates
            const sortBy = filters.sortBy || 'usageCount';
            const sortOrder = filters.sortOrder || 'desc';
            
            templates.sort((a, b) => {
                const aValue = a.state[sortBy] || a.metadata[sortBy];
                const bValue = b.state[sortBy] || b.metadata[sortBy];
                
                if (sortOrder === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            return templates;
        } catch (error) {
            throw new Error(`Failed to get widget templates: ${error.message}`);
        }
    }

    /**
     * Export widget
     */
    async exportWidget(widgetId, exportOptions = {}) {
        try {
            const widget = this.widgets.get(widgetId);
            if (!widget) {
                throw new Error('Widget not found');
            }

            const exportData = {
                widget: {
                    name: widget.name,
                    type: widget.type,
                    category: widget.category,
                    description: widget.description,
                    config: widget.config,
                    settings: widget.settings,
                    style: widget.style
                },
                metadata: {
                    exported: new Date().toISOString(),
                    version: '2.4.0',
                    format: exportOptions.format || 'json'
                }
            };

            return exportData;
        } catch (error) {
            throw new Error(`Failed to export widget: ${error.message}`);
        }
    }

    /**
     * Import widget
     */
    async importWidget(importData) {
        try {
            // Validate import data
            if (!importData.widget) {
                throw new Error('Invalid import data: missing widget information');
            }

            const widgetData = {
                name: importData.widget.name,
                type: importData.widget.type,
                category: importData.widget.category,
                description: importData.widget.description,
                config: importData.widget.config || {},
                settings: importData.widget.settings || {},
                style: importData.widget.style || {},
                tags: importData.widget.tags || []
            };

            const widget = await this.createWidget(widgetData);
            
            this.emit('widgetImported', widget);
            return widget;
        } catch (error) {
            throw new Error(`Failed to import widget: ${error.message}`);
        }
    }

    /**
     * Get widget types
     */
    getWidgetTypes() {
        return Array.from(this.widgetTypes.values());
    }

    /**
     * Get widget type by ID
     */
    getWidgetType(typeId) {
        return this.widgetTypes.get(typeId);
    }

    /**
     * Get categories
     */
    getCategories() {
        return Array.from(this.categories.values());
    }

    /**
     * Get category by ID
     */
    getCategory(categoryId) {
        return this.categories.get(categoryId);
    }

    /**
     * Get total widgets count
     */
    async getTotalWidgets() {
        return this.widgets.size;
    }

    /**
     * Validate widget data
     */
    validateWidgetData(data, isUpdate = false) {
        const errors = [];

        if (!isUpdate) {
            if (!data.type || typeof data.type !== 'string') {
                errors.push('Widget type is required');
            }

            if (!data.name || typeof data.name !== 'string') {
                errors.push('Widget name is required');
            }
        }

        if (data.type && !this.widgetTypes.has(data.type)) {
            errors.push(`Unsupported widget type: ${data.type}`);
        }

        if (data.name && typeof data.name !== 'string') {
            errors.push('Widget name must be a string');
        }

        if (data.description && typeof data.description !== 'string') {
            errors.push('Widget description must be a string');
        }

        if (data.category && !this.categories.has(data.category)) {
            errors.push('Invalid category');
        }

        if (data.position && (!data.position.x || !data.position.y)) {
            errors.push('Position must have x and y coordinates');
        }

        if (data.size && (!data.size.width || !data.size.height)) {
            errors.push('Size must have width and height');
        }

        if (data.tags && !Array.isArray(data.tags)) {
            errors.push('Tags must be an array');
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
            totalWidgets: this.widgets.size,
            totalTemplates: this.templates.size,
            totalTypes: this.widgetTypes.size,
            totalCategories: this.categories.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = WidgetLibrary;
