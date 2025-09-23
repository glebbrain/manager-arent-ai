const EventEmitter = require('events');

/**
 * Visualization Engine v2.4
 * Advanced visualization and charting capabilities
 */
class VisualizationEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            defaultChartType: 'line',
            enableAnimations: true,
            enableInteractivity: true,
            enableExport: true,
            maxDataPoints: 10000,
            ...options
        };
        
        this.visualizations = new Map();
        this.chartTypes = new Map();
        this.colorPalettes = new Map();
        this.animationPresets = new Map();
        
        this.initializeChartTypes();
        this.initializeColorPalettes();
        this.initializeAnimationPresets();
    }

    /**
     * Initialize supported chart types
     */
    initializeChartTypes() {
        const chartTypes = [
            {
                id: 'line',
                name: 'Line Chart',
                description: 'Time series and continuous data visualization',
                supportedDataTypes: ['timeSeries', 'continuous'],
                config: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'linear' },
                        y: { type: 'linear' }
                    }
                }
            },
            {
                id: 'bar',
                name: 'Bar Chart',
                description: 'Categorical data comparison',
                supportedDataTypes: ['categorical', 'discrete'],
                config: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'category' },
                        y: { type: 'linear' }
                    }
                }
            },
            {
                id: 'pie',
                name: 'Pie Chart',
                description: 'Proportional data representation',
                supportedDataTypes: ['proportional', 'percentage'],
                config: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            },
            {
                id: 'doughnut',
                name: 'Doughnut Chart',
                description: 'Proportional data with center space',
                supportedDataTypes: ['proportional', 'percentage'],
                config: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '50%'
                }
            },
            {
                id: 'area',
                name: 'Area Chart',
                description: 'Filled area under line chart',
                supportedDataTypes: ['timeSeries', 'continuous'],
                config: {
                    responsive: true,
                    maintainAspectRatio: false,
                    fill: true
                }
            },
            {
                id: 'scatter',
                name: 'Scatter Plot',
                description: 'Correlation and distribution analysis',
                supportedDataTypes: ['correlation', 'distribution'],
                config: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'linear' },
                        y: { type: 'linear' }
                    }
                }
            },
            {
                id: 'bubble',
                name: 'Bubble Chart',
                description: 'Three-dimensional data visualization',
                supportedDataTypes: ['threeDimensional'],
                config: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'linear' },
                        y: { type: 'linear' }
                    }
                }
            },
            {
                id: 'radar',
                name: 'Radar Chart',
                description: 'Multi-dimensional data comparison',
                supportedDataTypes: ['multidimensional'],
                config: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            },
            {
                id: 'polar',
                name: 'Polar Area Chart',
                description: 'Circular data representation',
                supportedDataTypes: ['circular', 'directional'],
                config: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            },
            {
                id: 'gauge',
                name: 'Gauge Chart',
                description: 'Single value with range indication',
                supportedDataTypes: ['singleValue'],
                config: {
                    responsive: true,
                    maintainAspectRatio: true,
                    min: 0,
                    max: 100
                }
            }
        ];

        chartTypes.forEach(chartType => {
            this.chartTypes.set(chartType.id, chartType);
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
                id: 'dark',
                name: 'Dark',
                colors: [
                    '#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7',
                    '#e74c3c', '#e67e22', '#f39c12', '#f1c40f', '#2ecc71'
                ]
            },
            {
                id: 'vibrant',
                name: 'Vibrant',
                colors: [
                    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
                    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
                ]
            }
        ];

        palettes.forEach(palette => {
            this.colorPalettes.set(palette.id, palette);
        });
    }

    /**
     * Initialize animation presets
     */
    initializeAnimationPresets() {
        const presets = [
            {
                id: 'fadeIn',
                name: 'Fade In',
                duration: 1000,
                easing: 'easeInOut',
                delay: 0
            },
            {
                id: 'slideIn',
                name: 'Slide In',
                duration: 800,
                easing: 'easeOut',
                delay: 0
            },
            {
                id: 'bounce',
                name: 'Bounce',
                duration: 1200,
                easing: 'easeOutBounce',
                delay: 0
            },
            {
                id: 'zoomIn',
                name: 'Zoom In',
                duration: 600,
                easing: 'easeOut',
                delay: 0
            }
        ];

        presets.forEach(preset => {
            this.animationPresets.set(preset.id, preset);
        });
    }

    /**
     * Create visualization
     */
    async createVisualization(visualizationData) {
        try {
            // Validate visualization data
            const validation = this.validateVisualizationData(visualizationData);
            if (!validation.isValid) {
                throw new Error(`Visualization validation failed: ${validation.errors.join(', ')}`);
            }

            // Generate unique ID
            const visualizationId = this.generateId();
            
            // Process data
            const processedData = await this.processData(visualizationData.data, visualizationData.chartType);
            
            // Create visualization object
            const visualization = {
                id: visualizationId,
                chartType: visualizationData.chartType || this.options.defaultChartType,
                data: processedData,
                config: this.buildChartConfig(visualizationData),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: visualizationData.showLegend !== false,
                            position: visualizationData.legendPosition || 'top'
                        },
                        title: {
                            display: !!visualizationData.title,
                            text: visualizationData.title || ''
                        },
                        tooltip: {
                            enabled: visualizationData.enableTooltips !== false
                        }
                    },
                    animation: this.buildAnimationConfig(visualizationData.animation),
                    ...visualizationData.options
                },
                metadata: {
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    version: '1.0.0',
                    dataPoints: processedData.datasets?.[0]?.data?.length || 0
                },
                state: {
                    isActive: true,
                    isInteractive: visualizationData.enableInteractivity !== false
                }
            };

            // Store visualization
            this.visualizations.set(visualizationId, visualization);
            
            this.emit('visualizationCreated', visualization);
            return visualization;
        } catch (error) {
            throw new Error(`Failed to create visualization: ${error.message}`);
        }
    }

    /**
     * Get visualization by ID
     */
    async getVisualization(visualizationId) {
        try {
            const visualization = this.visualizations.get(visualizationId);
            if (!visualization) {
                throw new Error('Visualization not found');
            }

            return visualization;
        } catch (error) {
            throw new Error(`Failed to get visualization: ${error.message}`);
        }
    }

    /**
     * Update visualization
     */
    async updateVisualization(visualizationId, updateData) {
        try {
            const visualization = this.visualizations.get(visualizationId);
            if (!visualization) {
                throw new Error('Visualization not found');
            }

            // Validate update data
            const validation = this.validateVisualizationData(updateData, true);
            if (!validation.isValid) {
                throw new Error(`Visualization update validation failed: ${validation.errors.join(', ')}`);
            }

            // Process updated data if provided
            let processedData = visualization.data;
            if (updateData.data) {
                processedData = await this.processData(updateData.data, updateData.chartType || visualization.chartType);
            }

            // Update visualization
            const updatedVisualization = {
                ...visualization,
                chartType: updateData.chartType || visualization.chartType,
                data: processedData,
                config: updateData.config ? this.buildChartConfig(updateData) : visualization.config,
                options: {
                    ...visualization.options,
                    ...updateData.options
                },
                metadata: {
                    ...visualization.metadata,
                    updated: new Date().toISOString(),
                    version: this.incrementVersion(visualization.metadata.version),
                    dataPoints: processedData.datasets?.[0]?.data?.length || 0
                }
            };

            // Store updated visualization
            this.visualizations.set(visualizationId, updatedVisualization);
            
            this.emit('visualizationUpdated', updatedVisualization);
            return updatedVisualization;
        } catch (error) {
            throw new Error(`Failed to update visualization: ${error.message}`);
        }
    }

    /**
     * Delete visualization
     */
    async deleteVisualization(visualizationId) {
        try {
            const visualization = this.visualizations.get(visualizationId);
            if (!visualization) {
                throw new Error('Visualization not found');
            }

            // Remove visualization
            this.visualizations.delete(visualizationId);
            
            this.emit('visualizationDeleted', visualizationId);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete visualization: ${error.message}`);
        }
    }

    /**
     * Process data for visualization
     */
    async processData(data, chartType) {
        try {
            const chartTypeConfig = this.chartTypes.get(chartType);
            if (!chartTypeConfig) {
                throw new Error(`Unsupported chart type: ${chartType}`);
            }

            // Handle different data formats
            if (Array.isArray(data)) {
                return this.processArrayData(data, chartType);
            } else if (data.datasets) {
                return this.processDatasetData(data, chartType);
            } else if (data.labels && data.values) {
                return this.processLabelValueData(data, chartType);
            } else {
                throw new Error('Unsupported data format');
            }
        } catch (error) {
            throw new Error(`Failed to process data: ${error.message}`);
        }
    }

    /**
     * Process array data
     */
    processArrayData(data, chartType) {
        const labels = data.map((item, index) => item.label || `Item ${index + 1}`);
        const values = data.map(item => item.value || item);
        
        return {
            labels,
            datasets: [{
                label: 'Data',
                data: values,
                backgroundColor: this.generateColors(values.length),
                borderColor: this.generateColors(values.length, 0.8),
                borderWidth: 1
            }]
        };
    }

    /**
     * Process dataset data
     */
    processDatasetData(data, chartType) {
        return {
            labels: data.labels || [],
            datasets: data.datasets.map((dataset, index) => ({
                label: dataset.label || `Dataset ${index + 1}`,
                data: dataset.data || [],
                backgroundColor: dataset.backgroundColor || this.generateColors(dataset.data?.length || 0),
                borderColor: dataset.borderColor || this.generateColors(dataset.data?.length || 0, 0.8),
                borderWidth: dataset.borderWidth || 1,
                ...dataset
            }))
        };
    }

    /**
     * Process label-value data
     */
    processLabelValueData(data, chartType) {
        return {
            labels: data.labels,
            datasets: [{
                label: data.label || 'Data',
                data: data.values,
                backgroundColor: this.generateColors(data.values.length),
                borderColor: this.generateColors(data.values.length, 0.8),
                borderWidth: 1
            }]
        };
    }

    /**
     * Build chart configuration
     */
    buildChartConfig(visualizationData) {
        const chartTypeConfig = this.chartTypes.get(visualizationData.chartType);
        if (!chartTypeConfig) {
            throw new Error(`Unsupported chart type: ${visualizationData.chartType}`);
        }

        return {
            type: visualizationData.chartType,
            data: visualizationData.data,
            options: {
                ...chartTypeConfig.config,
                ...visualizationData.options
            }
        };
    }

    /**
     * Build animation configuration
     */
    buildAnimationConfig(animationConfig) {
        if (!animationConfig || !this.options.enableAnimations) {
            return { duration: 0 };
        }

        const preset = this.animationPresets.get(animationConfig.preset);
        if (preset) {
            return {
                duration: animationConfig.duration || preset.duration,
                easing: animationConfig.easing || preset.easing,
                delay: animationConfig.delay || preset.delay
            };
        }

        return {
            duration: animationConfig.duration || 1000,
            easing: animationConfig.easing || 'easeInOut',
            delay: animationConfig.delay || 0
        };
    }

    /**
     * Generate colors for data points
     */
    generateColors(count, alpha = 1) {
        const palette = this.colorPalettes.get('default');
        const colors = [];
        
        for (let i = 0; i < count; i++) {
            const color = palette.colors[i % palette.colors.length];
            if (alpha < 1) {
                colors.push(this.hexToRgba(color, alpha));
            } else {
                colors.push(color);
            }
        }
        
        return colors;
    }

    /**
     * Convert hex color to rgba
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Export visualization
     */
    async exportVisualization(visualizationId, exportOptions = {}) {
        try {
            const visualization = this.visualizations.get(visualizationId);
            if (!visualization) {
                throw new Error('Visualization not found');
            }

            const exportData = {
                visualization: {
                    chartType: visualization.chartType,
                    data: visualization.data,
                    config: visualization.config,
                    options: visualization.options
                },
                metadata: {
                    exported: new Date().toISOString(),
                    version: '2.4.0',
                    format: exportOptions.format || 'json'
                }
            };

            return exportData;
        } catch (error) {
            throw new Error(`Failed to export visualization: ${error.message}`);
        }
    }

    /**
     * Get supported chart types
     */
    getSupportedChartTypes() {
        return Array.from(this.chartTypes.values());
    }

    /**
     * Get color palettes
     */
    getColorPalettes() {
        return Array.from(this.colorPalettes.values());
    }

    /**
     * Get animation presets
     */
    getAnimationPresets() {
        return Array.from(this.animationPresets.values());
    }

    /**
     * Validate visualization data
     */
    validateVisualizationData(data, isUpdate = false) {
        const errors = [];

        if (!isUpdate) {
            if (!data.chartType || typeof data.chartType !== 'string') {
                errors.push('Chart type is required');
            }

            if (!data.data) {
                errors.push('Data is required');
            }
        }

        if (data.chartType && !this.chartTypes.has(data.chartType)) {
            errors.push(`Unsupported chart type: ${data.chartType}`);
        }

        if (data.data && typeof data.data !== 'object') {
            errors.push('Data must be an object or array');
        }

        if (data.title && typeof data.title !== 'string') {
            errors.push('Title must be a string');
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
            totalVisualizations: this.visualizations.size,
            supportedChartTypes: this.chartTypes.size,
            colorPalettes: this.colorPalettes.size,
            animationPresets: this.animationPresets.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = VisualizationEngine;
