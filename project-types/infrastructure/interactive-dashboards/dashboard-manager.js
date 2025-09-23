const EventEmitter = require('events');

/**
 * Dashboard Manager v2.4
 * Manages dashboard lifecycle, templates, and operations
 */
class DashboardManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxDashboards: 1000,
            maxTemplates: 100,
            enableVersioning: true,
            enableBackup: true,
            backupInterval: 3600000, // 1 hour
            ...options
        };
        
        this.dashboards = new Map();
        this.templates = new Map();
        this.versions = new Map();
        this.backups = new Map();
        this.categories = new Map();
        this.tags = new Set();
        
        this.initializeDefaultCategories();
        this.startBackupScheduler();
    }

    /**
     * Initialize default categories
     */
    initializeDefaultCategories() {
        const categories = [
            {
                id: 'executive',
                name: 'Executive',
                description: 'High-level executive dashboards',
                color: '#007bff',
                icon: 'chart-line'
            },
            {
                id: 'operational',
                name: 'Operational',
                description: 'Day-to-day operational dashboards',
                color: '#28a745',
                icon: 'cogs'
            },
            {
                id: 'analytics',
                name: 'Analytics',
                description: 'Data analytics and insights dashboards',
                color: '#ffc107',
                icon: 'chart-bar'
            },
            {
                id: 'monitoring',
                name: 'Monitoring',
                description: 'System and performance monitoring dashboards',
                color: '#dc3545',
                icon: 'heartbeat'
            },
            {
                id: 'financial',
                name: 'Financial',
                description: 'Financial and revenue dashboards',
                color: '#6f42c1',
                icon: 'dollar-sign'
            },
            {
                id: 'custom',
                name: 'Custom',
                description: 'Custom user-created dashboards',
                color: '#6c757d',
                icon: 'user'
            }
        ];

        categories.forEach(category => {
            this.categories.set(category.id, category);
        });
    }

    /**
     * Create dashboard
     */
    async createDashboard(dashboardData) {
        try {
            // Validate dashboard data
            const validation = this.validateDashboardData(dashboardData);
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
                category: dashboardData.category || 'custom',
                tags: dashboardData.tags || [],
                layout: dashboardData.layout || 'grid',
                theme: dashboardData.theme || 'default',
                widgets: dashboardData.widgets || [],
                settings: {
                    enableDragDrop: true,
                    enableResize: true,
                    enableSnapToGrid: true,
                    gridSize: 20,
                    autoRefresh: false,
                    refreshInterval: 30000,
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
                    createdBy: dashboardData.createdBy || 'system',
                    lastAccessed: new Date().toISOString()
                },
                state: {
                    isActive: true,
                    isPublished: false,
                    isTemplate: false,
                    viewCount: 0
                }
            };

            // Store dashboard
            this.dashboards.set(dashboardId, dashboard);
            
            // Create initial version if versioning is enabled
            if (this.options.enableVersioning) {
                await this.createVersion(dashboardId, dashboard, 'Initial version');
            }

            // Update tags
            dashboard.tags.forEach(tag => this.tags.add(tag));

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

            // Update last accessed time and view count
            dashboard.metadata.lastAccessed = new Date().toISOString();
            dashboard.state.viewCount++;

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
            const validation = this.validateDashboardData(updateData, true);
            if (!validation.isValid) {
                throw new Error(`Dashboard update validation failed: ${validation.errors.join(', ')}`);
            }

            // Create backup if enabled
            if (this.options.enableBackup) {
                await this.createBackup(dashboardId, dashboard);
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
            
            // Create new version if versioning is enabled
            if (this.options.enableVersioning) {
                await this.createVersion(dashboardId, updatedDashboard, updateData.versionNote || 'Dashboard updated');
            }

            // Update tags
            if (updateData.tags) {
                updateData.tags.forEach(tag => this.tags.add(tag));
            }

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

            // Create final backup if enabled
            if (this.options.enableBackup) {
                await this.createBackup(dashboardId, dashboard, 'Final backup before deletion');
            }

            // Remove dashboard
            this.dashboards.delete(dashboardId);

            // Remove versions
            if (this.options.enableVersioning) {
                this.versions.delete(dashboardId);
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
            let dashboards = Array.from(this.dashboards.values());

            // Apply filters
            if (filters.owner) {
                dashboards = dashboards.filter(d => d.permissions.owner === filters.owner);
            }

            if (filters.category) {
                dashboards = dashboards.filter(d => d.category === filters.category);
            }

            if (filters.public !== undefined) {
                dashboards = dashboards.filter(d => d.permissions.public === filters.public);
            }

            if (filters.tags && filters.tags.length > 0) {
                dashboards = dashboards.filter(d => 
                    filters.tags.some(tag => d.tags.includes(tag))
                );
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                dashboards = dashboards.filter(d => 
                    d.name.toLowerCase().includes(searchTerm) ||
                    d.description.toLowerCase().includes(searchTerm)
                );
            }

            if (filters.isTemplate !== undefined) {
                dashboards = dashboards.filter(d => d.state.isTemplate === filters.isTemplate);
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
     * Create template from dashboard
     */
    async createTemplate(dashboardId, templateData) {
        try {
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            // Generate template ID
            const templateId = this.generateId();
            
            // Create template object
            const template = {
                id: templateId,
                name: templateData.name || `${dashboard.name} Template`,
                description: templateData.description || `Template based on ${dashboard.name}`,
                category: templateData.category || dashboard.category,
                tags: templateData.tags || [...dashboard.tags],
                layout: dashboard.layout,
                theme: dashboard.theme,
                widgets: dashboard.widgets.map(widget => ({
                    ...widget,
                    id: this.generateId() // Generate new IDs for template widgets
                })),
                settings: { ...dashboard.settings },
                metadata: {
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    version: '1.0.0',
                    createdBy: templateData.createdBy || dashboard.metadata.createdBy,
                    basedOn: dashboardId
                },
                state: {
                    isActive: true,
                    isTemplate: true,
                    usageCount: 0
                }
            };

            // Store template
            this.templates.set(templateId, template);
            
            // Mark original dashboard as template
            dashboard.state.isTemplate = true;
            this.dashboards.set(dashboardId, dashboard);

            this.emit('templateCreated', template);
            return template;
        } catch (error) {
            throw new Error(`Failed to create template: ${error.message}`);
        }
    }

    /**
     * Get template by ID
     */
    async getTemplate(templateId) {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Update usage count
            template.state.usageCount++;

            return template;
        } catch (error) {
            throw new Error(`Failed to get template: ${error.message}`);
        }
    }

    /**
     * Get all templates
     */
    async getTemplates(filters = {}) {
        try {
            let templates = Array.from(this.templates.values());

            // Apply filters
            if (filters.category) {
                templates = templates.filter(t => t.category === filters.category);
            }

            if (filters.tags && filters.tags.length > 0) {
                templates = templates.filter(t => 
                    filters.tags.some(tag => t.tags.includes(tag))
                );
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
            throw new Error(`Failed to get templates: ${error.message}`);
        }
    }

    /**
     * Apply template to dashboard
     */
    async applyTemplate(dashboardId, templateId) {
        try {
            const dashboard = this.dashboards.get(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Apply template to dashboard
            const updatedDashboard = {
                ...dashboard,
                layout: template.layout,
                theme: template.theme,
                widgets: template.widgets.map(widget => ({
                    ...widget,
                    id: this.generateId() // Generate new IDs for applied widgets
                })),
                settings: { ...template.settings },
                metadata: {
                    ...dashboard.metadata,
                    updated: new Date().toISOString(),
                    version: this.incrementVersion(dashboard.metadata.version),
                    appliedTemplate: templateId
                }
            };

            // Store updated dashboard
            this.dashboards.set(dashboardId, updatedDashboard);

            // Update template usage count
            template.state.usageCount++;

            this.emit('templateApplied', { dashboardId, templateId });
            return updatedDashboard;
        } catch (error) {
            throw new Error(`Failed to apply template: ${error.message}`);
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
                    category: dashboard.category,
                    tags: dashboard.tags,
                    layout: dashboard.layout,
                    theme: dashboard.theme,
                    widgets: dashboard.widgets,
                    settings: dashboard.settings
                },
                metadata: {
                    exported: new Date().toISOString(),
                    version: '2.4.0',
                    format: exportOptions.format || 'json',
                    includeData: exportOptions.includeData || false,
                    includePermissions: exportOptions.includePermissions || false
                }
            };

            // Add additional data based on export options
            if (exportOptions.includeData) {
                exportData.data = await this.getDashboardData(dashboardId);
            }

            if (exportOptions.includePermissions) {
                exportData.permissions = dashboard.permissions;
            }

            if (exportOptions.includeVersions && this.options.enableVersioning) {
                exportData.versions = this.versions.get(dashboardId) || [];
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
                category: importData.dashboard.category || 'custom',
                tags: importData.dashboard.tags || [],
                layout: importData.dashboard.layout || 'grid',
                theme: importData.dashboard.theme || 'default',
                widgets: importData.dashboard.widgets || [],
                settings: importData.dashboard.settings || {},
                permissions: importData.permissions || {
                    owner: 'system',
                    viewers: [],
                    editors: [],
                    public: false
                }
            };

            const dashboard = await this.createDashboard(dashboardData);
            
            // Import versions if available
            if (importData.versions && this.options.enableVersioning) {
                this.versions.set(dashboard.id, importData.versions);
            }

            this.emit('dashboardImported', dashboard);
            return dashboard;
        } catch (error) {
            throw new Error(`Failed to import dashboard: ${error.message}`);
        }
    }

    /**
     * Create version
     */
    async createVersion(dashboardId, dashboard, note = '') {
        try {
            if (!this.options.enableVersioning) {
                return;
            }

            const versionId = this.generateId();
            const version = {
                id: versionId,
                dashboardId,
                data: JSON.parse(JSON.stringify(dashboard)), // Deep clone
                note,
                createdAt: new Date().toISOString(),
                createdBy: dashboard.metadata.createdBy || 'system'
            };

            // Store version
            if (!this.versions.has(dashboardId)) {
                this.versions.set(dashboardId, []);
            }
            
            const versions = this.versions.get(dashboardId);
            versions.push(version);

            // Keep only last 10 versions
            if (versions.length > 10) {
                versions.splice(0, versions.length - 10);
            }

            this.emit('versionCreated', version);
            return version;
        } catch (error) {
            throw new Error(`Failed to create version: ${error.message}`);
        }
    }

    /**
     * Get dashboard versions
     */
    async getDashboardVersions(dashboardId) {
        try {
            const versions = this.versions.get(dashboardId) || [];
            return versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            throw new Error(`Failed to get dashboard versions: ${error.message}`);
        }
    }

    /**
     * Restore dashboard to version
     */
    async restoreToVersion(dashboardId, versionId) {
        try {
            const versions = this.versions.get(dashboardId);
            if (!versions) {
                throw new Error('No versions found for dashboard');
            }

            const version = versions.find(v => v.id === versionId);
            if (!version) {
                throw new Error('Version not found');
            }

            // Create backup before restore
            if (this.options.enableBackup) {
                const currentDashboard = this.dashboards.get(dashboardId);
                if (currentDashboard) {
                    await this.createBackup(dashboardId, currentDashboard, 'Backup before version restore');
                }
            }

            // Restore dashboard
            const restoredDashboard = {
                ...version.data,
                metadata: {
                    ...version.data.metadata,
                    updated: new Date().toISOString(),
                    version: this.incrementVersion(version.data.metadata.version),
                    restoredFrom: versionId
                }
            };

            this.dashboards.set(dashboardId, restoredDashboard);

            this.emit('dashboardRestored', { dashboardId, versionId });
            return restoredDashboard;
        } catch (error) {
            throw new Error(`Failed to restore to version: ${error.message}`);
        }
    }

    /**
     * Create backup
     */
    async createBackup(dashboardId, dashboard, note = '') {
        try {
            if (!this.options.enableBackup) {
                return;
            }

            const backupId = this.generateId();
            const backup = {
                id: backupId,
                dashboardId,
                data: JSON.parse(JSON.stringify(dashboard)), // Deep clone
                note,
                createdAt: new Date().toISOString()
            };

            // Store backup
            if (!this.backups.has(dashboardId)) {
                this.backups.set(dashboardId, []);
            }
            
            const backups = this.backups.get(dashboardId);
            backups.push(backup);

            // Keep only last 5 backups
            if (backups.length > 5) {
                backups.splice(0, backups.length - 5);
            }

            this.emit('backupCreated', backup);
            return backup;
        } catch (error) {
            throw new Error(`Failed to create backup: ${error.message}`);
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
     * Generate mock data
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
            }
        };

        return mockData[widgetType] || mockData.metric;
    }

    /**
     * Start backup scheduler
     */
    startBackupScheduler() {
        if (!this.options.enableBackup) {
            return;
        }

        setInterval(() => {
            this.performScheduledBackup();
        }, this.options.backupInterval);
    }

    /**
     * Perform scheduled backup
     */
    async performScheduledBackup() {
        try {
            for (const [dashboardId, dashboard] of this.dashboards) {
                await this.createBackup(dashboardId, dashboard, 'Scheduled backup');
            }
        } catch (error) {
            console.error('Error performing scheduled backup:', error);
        }
    }

    /**
     * Get total dashboards count
     */
    async getTotalDashboards() {
        return this.dashboards.size;
    }

    /**
     * Get categories
     */
    getCategories() {
        return Array.from(this.categories.values());
    }

    /**
     * Get tags
     */
    getTags() {
        return Array.from(this.tags);
    }

    /**
     * Validation methods
     */
    validateDashboardData(data, isUpdate = false) {
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

        if (data.category && !this.categories.has(data.category)) {
            errors.push('Invalid category');
        }

        if (data.tags && !Array.isArray(data.tags)) {
            errors.push('Tags must be an array');
        }

        if (data.widgets && !Array.isArray(data.widgets)) {
            errors.push('Widgets must be an array');
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
            totalCategories: this.categories.size,
            totalTags: this.tags.size,
            versioningEnabled: this.options.enableVersioning,
            backupEnabled: this.options.enableBackup,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = DashboardManager;
