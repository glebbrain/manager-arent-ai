const EventEmitter = require('events');

/**
 * Theme Manager v2.4
 * Manages themes, colors, and styling for dashboards
 */
class ThemeManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            enableCustomThemes: true,
            enableThemeSharing: true,
            ...options
        };
        
        this.themes = new Map();
        this.colorPalettes = new Map();
        this.fonts = new Map();
        this.spacing = new Map();
        
        this.initializeDefaultThemes();
        this.initializeColorPalettes();
        this.initializeFonts();
        this.initializeSpacing();
    }

    /**
     * Initialize default themes
     */
    initializeDefaultThemes() {
        const themes = [
            {
                id: 'default',
                name: 'Default',
                description: 'Clean and professional default theme',
                colors: {
                    primary: '#007bff',
                    secondary: '#6c757d',
                    success: '#28a745',
                    danger: '#dc3545',
                    warning: '#ffc107',
                    info: '#17a2b8',
                    light: '#f8f9fa',
                    dark: '#343a40',
                    background: '#ffffff',
                    surface: '#ffffff',
                    text: '#212529',
                    textSecondary: '#6c757d',
                    border: '#dee2e6'
                },
                fonts: {
                    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    secondary: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    mono: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
                },
                spacing: {
                    xs: '4px',
                    sm: '8px',
                    md: '16px',
                    lg: '24px',
                    xl: '32px',
                    xxl: '48px'
                },
                borderRadius: {
                    sm: '4px',
                    md: '8px',
                    lg: '12px',
                    xl: '16px'
                },
                shadows: {
                    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
                    md: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
                    lg: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
                    xl: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)'
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
                    dark: '#212529',
                    background: '#121212',
                    surface: '#1e1e1e',
                    text: '#ffffff',
                    textSecondary: '#b3b3b3',
                    border: '#333333'
                },
                fonts: {
                    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    secondary: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    mono: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
                },
                spacing: {
                    xs: '4px',
                    sm: '8px',
                    md: '16px',
                    lg: '24px',
                    xl: '32px',
                    xxl: '48px'
                },
                borderRadius: {
                    sm: '4px',
                    md: '8px',
                    lg: '12px',
                    xl: '16px'
                },
                shadows: {
                    sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
                    md: '0 3px 6px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.5)',
                    lg: '0 10px 20px rgba(0, 0, 0, 0.5), 0 6px 6px rgba(0, 0, 0, 0.6)',
                    xl: '0 14px 28px rgba(0, 0, 0, 0.6), 0 10px 10px rgba(0, 0, 0, 0.7)'
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
                    dark: '#495057',
                    background: '#ffffff',
                    surface: '#f8f9fa',
                    text: '#495057',
                    textSecondary: '#6c757d',
                    border: '#e9ecef'
                },
                fonts: {
                    primary: 'Helvetica, Arial, sans-serif',
                    secondary: 'Arial, sans-serif',
                    mono: 'Monaco, Consolas, "Courier New", monospace'
                },
                spacing: {
                    xs: '2px',
                    sm: '4px',
                    md: '8px',
                    lg: '16px',
                    xl: '24px',
                    xxl: '32px'
                },
                borderRadius: {
                    sm: '2px',
                    md: '4px',
                    lg: '6px',
                    xl: '8px'
                },
                shadows: {
                    sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    xl: '0 8px 16px rgba(0, 0, 0, 0.1)'
                }
            },
            {
                id: 'colorful',
                name: 'Colorful',
                description: 'Vibrant and colorful theme',
                colors: {
                    primary: '#ff6b6b',
                    secondary: '#4ecdc4',
                    success: '#45b7d1',
                    danger: '#f9ca24',
                    warning: '#f0932b',
                    info: '#eb4d4b',
                    light: '#ffffff',
                    dark: '#2c3e50',
                    background: '#ffffff',
                    surface: '#f8f9fa',
                    text: '#2c3e50',
                    textSecondary: '#7f8c8d',
                    border: '#ddd'
                },
                fonts: {
                    primary: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    secondary: 'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    mono: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
                },
                spacing: {
                    xs: '4px',
                    sm: '8px',
                    md: '16px',
                    lg: '24px',
                    xl: '32px',
                    xxl: '48px'
                },
                borderRadius: {
                    sm: '6px',
                    md: '12px',
                    lg: '18px',
                    xl: '24px'
                },
                shadows: {
                    sm: '0 2px 4px rgba(255, 107, 107, 0.2)',
                    md: '0 4px 8px rgba(255, 107, 107, 0.3)',
                    lg: '0 8px 16px rgba(255, 107, 107, 0.4)',
                    xl: '0 16px 32px rgba(255, 107, 107, 0.5)'
                }
            }
        ];

        themes.forEach(theme => {
            this.themes.set(theme.id, theme);
        });
    }

    /**
     * Initialize color palettes
     */
    initializeColorPalettes() {
        const palettes = [
            {
                id: 'default',
                name: 'Default',
                colors: [
                    '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8',
                    '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'
                ]
            },
            {
                id: 'pastel',
                name: 'Pastel',
                colors: [
                    '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff',
                    '#e6b3ff', '#ffb3e6', '#ffd9b3', '#b3ffd9', '#d9b3ff'
                ]
            },
            {
                id: 'vibrant',
                name: 'Vibrant',
                colors: [
                    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
                    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
                ]
            },
            {
                id: 'monochrome',
                name: 'Monochrome',
                colors: [
                    '#000000', '#333333', '#666666', '#999999', '#cccccc',
                    '#e6e6e6', '#f2f2f2', '#ffffff', '#808080', '#b3b3b3'
                ]
            }
        ];

        palettes.forEach(palette => {
            this.colorPalettes.set(palette.id, palette);
        });
    }

    /**
     * Initialize fonts
     */
    initializeFonts() {
        const fonts = [
            {
                id: 'inter',
                name: 'Inter',
                family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                category: 'sans-serif',
                weights: [300, 400, 500, 600, 700]
            },
            {
                id: 'roboto',
                name: 'Roboto',
                family: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                category: 'sans-serif',
                weights: [300, 400, 500, 700]
            },
            {
                id: 'poppins',
                name: 'Poppins',
                family: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                category: 'sans-serif',
                weights: [300, 400, 500, 600, 700]
            },
            {
                id: 'open-sans',
                name: 'Open Sans',
                family: 'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                category: 'sans-serif',
                weights: [300, 400, 600, 700]
            },
            {
                id: 'lora',
                name: 'Lora',
                family: 'Lora, Georgia, "Times New Roman", serif',
                category: 'serif',
                weights: [400, 500, 600, 700]
            },
            {
                id: 'monaco',
                name: 'Monaco',
                family: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                category: 'monospace',
                weights: [400]
            }
        ];

        fonts.forEach(font => {
            this.fonts.set(font.id, font);
        });
    }

    /**
     * Initialize spacing
     */
    initializeSpacing() {
        const spacing = [
            {
                id: 'compact',
                name: 'Compact',
                values: {
                    xs: '2px',
                    sm: '4px',
                    md: '8px',
                    lg: '12px',
                    xl: '16px',
                    xxl: '24px'
                }
            },
            {
                id: 'comfortable',
                name: 'Comfortable',
                values: {
                    xs: '4px',
                    sm: '8px',
                    md: '16px',
                    lg: '24px',
                    xl: '32px',
                    xxl: '48px'
                }
            },
            {
                id: 'spacious',
                name: 'Spacious',
                values: {
                    xs: '8px',
                    sm: '16px',
                    md: '24px',
                    lg: '32px',
                    xl: '48px',
                    xxl: '64px'
                }
            }
        ];

        spacing.forEach(spacingSet => {
            this.spacing.set(spacingSet.id, spacingSet);
        });
    }

    /**
     * Create theme
     */
    async createTheme(themeData) {
        try {
            // Validate theme data
            const validation = this.validateThemeData(themeData);
            if (!validation.isValid) {
                throw new Error(`Theme validation failed: ${validation.errors.join(', ')}`);
            }

            // Generate unique ID
            const themeId = this.generateId();
            
            // Create theme object
            const theme = {
                id: themeId,
                name: themeData.name || 'Untitled Theme',
                description: themeData.description || '',
                colors: themeData.colors || {},
                fonts: themeData.fonts || {},
                spacing: themeData.spacing || {},
                borderRadius: themeData.borderRadius || {},
                shadows: themeData.shadows || {},
                metadata: {
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    version: '1.0.0',
                    createdBy: themeData.createdBy || 'system',
                    tags: themeData.tags || []
                },
                state: {
                    isActive: true,
                    isCustom: true,
                    usageCount: 0
                }
            };

            // Store theme
            this.themes.set(themeId, theme);
            
            this.emit('themeCreated', theme);
            return theme;
        } catch (error) {
            throw new Error(`Failed to create theme: ${error.message}`);
        }
    }

    /**
     * Get theme by ID
     */
    async getTheme(themeId) {
        try {
            const theme = this.themes.get(themeId);
            if (!theme) {
                throw new Error('Theme not found');
            }

            // Update usage count
            theme.state.usageCount++;

            return theme;
        } catch (error) {
            throw new Error(`Failed to get theme: ${error.message}`);
        }
    }

    /**
     * Update theme
     */
    async updateTheme(themeId, updateData) {
        try {
            const theme = this.themes.get(themeId);
            if (!theme) {
                throw new Error('Theme not found');
            }

            // Validate update data
            const validation = this.validateThemeData(updateData, true);
            if (!validation.isValid) {
                throw new Error(`Theme update validation failed: ${validation.errors.join(', ')}`);
            }

            // Update theme
            const updatedTheme = {
                ...theme,
                ...updateData,
                metadata: {
                    ...theme.metadata,
                    updated: new Date().toISOString(),
                    version: this.incrementVersion(theme.metadata.version)
                }
            };

            // Store updated theme
            this.themes.set(themeId, updatedTheme);
            
            this.emit('themeUpdated', updatedTheme);
            return updatedTheme;
        } catch (error) {
            throw new Error(`Failed to update theme: ${error.message}`);
        }
    }

    /**
     * Delete theme
     */
    async deleteTheme(themeId) {
        try {
            const theme = this.themes.get(themeId);
            if (!theme) {
                throw new Error('Theme not found');
            }

            // Don't allow deletion of default themes
            if (!theme.state.isCustom) {
                throw new Error('Cannot delete default themes');
            }

            // Remove theme
            this.themes.delete(themeId);
            
            this.emit('themeDeleted', themeId);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete theme: ${error.message}`);
        }
    }

    /**
     * Get all themes
     */
    async getThemes(filters = {}) {
        try {
            let themes = Array.from(this.themes.values());

            // Apply filters
            if (filters.isCustom !== undefined) {
                themes = themes.filter(t => t.state.isCustom === filters.isCustom);
            }

            if (filters.tags && filters.tags.length > 0) {
                themes = themes.filter(t => 
                    filters.tags.some(tag => t.metadata.tags.includes(tag))
                );
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                themes = themes.filter(t => 
                    t.name.toLowerCase().includes(searchTerm) ||
                    t.description.toLowerCase().includes(searchTerm)
                );
            }

            // Sort themes
            const sortBy = filters.sortBy || 'name';
            const sortOrder = filters.sortOrder || 'asc';
            
            themes.sort((a, b) => {
                const aValue = a[sortBy] || a.metadata[sortBy] || a.state[sortBy];
                const bValue = b[sortBy] || b.metadata[sortBy] || b.state[sortBy];
                
                if (sortOrder === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            return themes;
        } catch (error) {
            throw new Error(`Failed to get themes: ${error.message}`);
        }
    }

    /**
     * Apply theme to dashboard
     */
    async applyTheme(dashboardId, themeId) {
        try {
            const theme = this.themes.get(themeId);
            if (!theme) {
                throw new Error('Theme not found');
            }

            // This would typically update the dashboard's theme
            // For now, just emit an event
            this.emit('themeApplied', { dashboardId, themeId, theme });
            
            return theme;
        } catch (error) {
            throw new Error(`Failed to apply theme: ${error.message}`);
        }
    }

    /**
     * Generate CSS for theme
     */
    generateThemeCSS(themeId) {
        try {
            const theme = this.themes.get(themeId);
            if (!theme) {
                throw new Error('Theme not found');
            }

            const css = `
                :root {
                    /* Colors */
                    --color-primary: ${theme.colors.primary};
                    --color-secondary: ${theme.colors.secondary};
                    --color-success: ${theme.colors.success};
                    --color-danger: ${theme.colors.danger};
                    --color-warning: ${theme.colors.warning};
                    --color-info: ${theme.colors.info};
                    --color-light: ${theme.colors.light};
                    --color-dark: ${theme.colors.dark};
                    --color-background: ${theme.colors.background};
                    --color-surface: ${theme.colors.surface};
                    --color-text: ${theme.colors.text};
                    --color-text-secondary: ${theme.colors.textSecondary};
                    --color-border: ${theme.colors.border};

                    /* Fonts */
                    --font-primary: ${theme.fonts.primary};
                    --font-secondary: ${theme.fonts.secondary};
                    --font-mono: ${theme.fonts.mono};

                    /* Spacing */
                    --spacing-xs: ${theme.spacing.xs};
                    --spacing-sm: ${theme.spacing.sm};
                    --spacing-md: ${theme.spacing.md};
                    --spacing-lg: ${theme.spacing.lg};
                    --spacing-xl: ${theme.spacing.xl};
                    --spacing-xxl: ${theme.spacing.xxl};

                    /* Border Radius */
                    --border-radius-sm: ${theme.borderRadius.sm};
                    --border-radius-md: ${theme.borderRadius.md};
                    --border-radius-lg: ${theme.borderRadius.lg};
                    --border-radius-xl: ${theme.borderRadius.xl};

                    /* Shadows */
                    --shadow-sm: ${theme.shadows.sm};
                    --shadow-md: ${theme.shadows.md};
                    --shadow-lg: ${theme.shadows.lg};
                    --shadow-xl: ${theme.shadows.xl};
                }
            `;

            return css;
        } catch (error) {
            throw new Error(`Failed to generate theme CSS: ${error.message}`);
        }
    }

    /**
     * Get color palettes
     */
    getColorPalettes() {
        return Array.from(this.colorPalettes.values());
    }

    /**
     * Get fonts
     */
    getFonts() {
        return Array.from(this.fonts.values());
    }

    /**
     * Get spacing options
     */
    getSpacingOptions() {
        return Array.from(this.spacing.values());
    }

    /**
     * Validate theme data
     */
    validateThemeData(data, isUpdate = false) {
        const errors = [];

        if (!isUpdate) {
            if (!data.name || typeof data.name !== 'string') {
                errors.push('Theme name is required');
            }
        }

        if (data.name && typeof data.name !== 'string') {
            errors.push('Theme name must be a string');
        }

        if (data.description && typeof data.description !== 'string') {
            errors.push('Theme description must be a string');
        }

        if (data.colors && typeof data.colors !== 'object') {
            errors.push('Colors must be an object');
        }

        if (data.fonts && typeof data.fonts !== 'object') {
            errors.push('Fonts must be an object');
        }

        if (data.spacing && typeof data.spacing !== 'object') {
            errors.push('Spacing must be an object');
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
            totalThemes: this.themes.size,
            totalColorPalettes: this.colorPalettes.size,
            totalFonts: this.fonts.size,
            totalSpacingOptions: this.spacing.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = ThemeManager;
