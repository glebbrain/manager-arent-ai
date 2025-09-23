// Universal Automation Platform - Advanced Charts Manager
// Version: 2.2 - AI Enhanced

class ChartsManager {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.charts = {};
        this.chartConfigs = {};
        this.dataCache = {};
        this.updateIntervals = {};
        
        this.init();
    }

    init() {
        console.log('📊 Initializing Charts Manager...');
        this.setupChartConfigs();
        this.initAllCharts();
    }

    setupChartConfigs() {
        // Performance Chart Configuration
        this.chartConfigs.performance = {
            type: 'line',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Usage (%)'
                        },
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    },
                    line: {
                        tension: 0.4
                    }
                }
            }
        };

        // Test Coverage Chart Configuration
        this.chartConfigs.testCoverage = {
            type: 'doughnut',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                cutout: '60%'
            }
        };

        // Build Status Chart Configuration
        this.chartConfigs.buildStatus = {
            type: 'bar',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Builds'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Duration (minutes)'
                        },
                        beginAtZero: true
                    }
                }
            }
        };

        // Project Activity Chart Configuration
        this.chartConfigs.projectActivity = {
            type: 'radar',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        };
    }

    initAllCharts() {
        this.initPerformanceChart();
        this.initTestCoverageChart();
        this.initBuildStatusChart();
        this.initProjectActivityChart();
    }

    initPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        const chartCtx = ctx.getContext('2d');
        
        this.charts.performance = new Chart(chartCtx, {
            type: this.chartConfigs.performance.type,
            data: {
                labels: this.generateTimeLabels(24),
                datasets: [
                    {
                        label: 'CPU Usage',
                        data: this.generateRandomData(24, 20, 80),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Memory Usage',
                        data: this.generateRandomData(24, 40, 90),
                        borderColor: '#48bb78',
                        backgroundColor: 'rgba(72, 187, 120, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Disk Usage',
                        data: this.generateRandomData(24, 50, 85),
                        borderColor: '#ed8936',
                        backgroundColor: 'rgba(237, 137, 54, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: this.chartConfigs.performance.options
        });

        // Start real-time updates
        this.startPerformanceUpdates();
    }

    initTestCoverageChart() {
        const ctx = document.getElementById('testCoverageChart');
        if (!ctx) return;

        const chartCtx = ctx.getContext('2d');
        
        this.charts.testCoverage = new Chart(chartCtx, {
            type: this.chartConfigs.testCoverage.type,
            data: {
                labels: ['Passed', 'Failed', 'Skipped', 'Pending'],
                datasets: [{
                    data: [85, 10, 3, 2],
                    backgroundColor: [
                        '#48bb78',
                        '#f56565',
                        '#ed8936',
                        '#a0aec0'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: this.chartConfigs.testCoverage.options
        });
    }

    initBuildStatusChart() {
        const ctx = document.getElementById('buildStatusChart');
        if (!ctx) return;

        const chartCtx = ctx.getContext('2d');
        
        this.charts.buildStatus = new Chart(chartCtx, {
            type: this.chartConfigs.buildStatus.type,
            data: {
                labels: ['Build #40', 'Build #41', 'Build #42', 'Build #43', 'Build #44'],
                datasets: [{
                    label: 'Build Duration',
                    data: [120, 95, 150, 80, 110],
                    backgroundColor: [
                        '#48bb78',
                        '#48bb78',
                        '#f56565',
                        '#48bb78',
                        '#48bb78'
                    ],
                    borderColor: [
                        '#38a169',
                        '#38a169',
                        '#e53e3e',
                        '#38a169',
                        '#38a169'
                    ],
                    borderWidth: 2
                }]
            },
            options: this.chartConfigs.buildStatus.options
        });
    }

    initProjectActivityChart() {
        const ctx = document.getElementById('projectActivityChart');
        if (!ctx) return;

        const chartCtx = ctx.getContext('2d');
        
        this.charts.projectActivity = new Chart(chartCtx, {
            type: this.chartConfigs.projectActivity.type,
            data: {
                labels: ['Development', 'Testing', 'Deployment', 'Monitoring', 'Maintenance'],
                datasets: [
                    {
                        label: 'ManagerAgentAI',
                        data: [85, 90, 75, 80, 70],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#667eea'
                    },
                    {
                        label: 'Web Dashboard',
                        data: [70, 85, 90, 85, 75],
                        borderColor: '#48bb78',
                        backgroundColor: 'rgba(72, 187, 120, 0.2)',
                        pointBackgroundColor: '#48bb78',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#48bb78'
                    }
                ]
            },
            options: this.chartConfigs.projectActivity.options
        });
    }

    startPerformanceUpdates() {
        this.updateIntervals.performance = setInterval(() => {
            this.updatePerformanceChart();
        }, 5000);
    }

    updatePerformanceChart() {
        if (!this.charts.performance) return;

        const chart = this.charts.performance;
        const timeRange = document.getElementById('timeRange')?.value || '24h';
        let hours = 24;
        
        switch (timeRange) {
            case '1h': hours = 1; break;
            case '6h': hours = 6; break;
            case '24h': hours = 24; break;
            case '7d': hours = 168; break;
        }

        // Update labels
        chart.data.labels = this.generateTimeLabels(hours);
        
        // Update data
        chart.data.datasets[0].data = this.generateRandomData(hours + 1, 20, 80);
        chart.data.datasets[1].data = this.generateRandomData(hours + 1, 40, 90);
        chart.data.datasets[2].data = this.generateRandomData(hours + 1, 50, 85);
        
        chart.update('none');
    }

    updateTestCoverageChart() {
        if (!this.charts.testCoverage) return;

        const chart = this.charts.testCoverage;
        
        // Simulate test results
        const passed = Math.floor(Math.random() * 20) + 70;
        const failed = Math.floor(Math.random() * 15) + 5;
        const skipped = Math.floor(Math.random() * 10) + 1;
        const pending = Math.floor(Math.random() * 5) + 1;
        
        chart.data.datasets[0].data = [passed, failed, skipped, pending];
        chart.update('none');
    }

    updateBuildStatusChart() {
        if (!this.charts.buildStatus) return;

        const chart = this.charts.buildStatus;
        
        // Simulate new build data
        const newData = chart.data.datasets[0].data.slice(1);
        newData.push(Math.floor(Math.random() * 100) + 50);
        
        chart.data.datasets[0].data = newData;
        chart.update('none');
    }

    generateTimeLabels(hours) {
        const labels = [];
        const now = new Date();
        
        for (let i = hours; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
            labels.push(time.getHours().toString().padStart(2, '0') + ':00');
        }
        
        return labels;
    }

    generateRandomData(count, min, max) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return data;
    }

    // Public methods for external use
    updateChart(chartName) {
        switch (chartName) {
            case 'performance':
                this.updatePerformanceChart();
                break;
            case 'testCoverage':
                this.updateTestCoverageChart();
                break;
            case 'buildStatus':
                this.updateBuildStatusChart();
                break;
            default:
                console.warn('Unknown chart name:', chartName);
        }
    }

    refreshAllCharts() {
        Object.keys(this.charts).forEach(chartName => {
            this.updateChart(chartName);
        });
    }

    exportChart(chartName, format = 'png') {
        if (!this.charts[chartName]) {
            console.error('Chart not found:', chartName);
            return;
        }

        const chart = this.charts[chartName];
        const url = chart.toBase64Image();
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${chartName}_${new Date().toISOString().slice(0, 10)}.${format}`;
        link.href = url;
        link.click();
    }

    exportAllCharts(format = 'png') {
        Object.keys(this.charts).forEach(chartName => {
            this.exportChart(chartName, format);
        });
    }

    getChartData(chartName) {
        if (!this.charts[chartName]) {
            console.error('Chart not found:', chartName);
            return null;
        }

        return this.charts[chartName].data;
    }

    setChartData(chartName, data) {
        if (!this.charts[chartName]) {
            console.error('Chart not found:', chartName);
            return false;
        }

        this.charts[chartName].data = data;
        this.charts[chartName].update();
        return true;
    }

    addDataPoint(chartName, datasetIndex, value) {
        if (!this.charts[chartName]) {
            console.error('Chart not found:', chartName);
            return false;
        }

        const chart = this.charts[chartName];
        chart.data.datasets[datasetIndex].data.push(value);
        
        // Remove oldest data point if we have too many
        if (chart.data.datasets[datasetIndex].data.length > 100) {
            chart.data.datasets[datasetIndex].data.shift();
        }
        
        chart.update('none');
        return true;
    }

    destroy() {
        // Clear all update intervals
        Object.values(this.updateIntervals).forEach(interval => {
            clearInterval(interval);
        });
        
        // Destroy all charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        
        this.charts = {};
        this.updateIntervals = {};
    }

    // Advanced chart features
    createCustomChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas not found:', canvasId);
            return null;
        }

        const chart = new Chart(canvas.getContext('2d'), config);
        this.charts[canvasId] = chart;
        return chart;
    }

    addAnnotation(chartName, annotation) {
        if (!this.charts[chartName]) {
            console.error('Chart not found:', chartName);
            return false;
        }

        // This would require Chart.js annotation plugin
        console.log('Annotation feature requires Chart.js annotation plugin');
        return false;
    }

    setChartTheme(theme) {
        const themes = {
            light: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                textColor: '#2d3748',
                gridColor: 'rgba(0, 0, 0, 0.1)'
            },
            dark: {
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                textColor: '#e2e8f0',
                gridColor: 'rgba(255, 255, 255, 0.1)'
            }
        };

        const themeConfig = themes[theme];
        if (!themeConfig) {
            console.error('Unknown theme:', theme);
            return false;
        }

        // Apply theme to all charts
        Object.values(this.charts).forEach(chart => {
            if (chart.options.scales) {
                Object.values(chart.options.scales).forEach(scale => {
                    if (scale.grid) {
                        scale.grid.color = themeConfig.gridColor;
                    }
                });
            }
            chart.update();
        });

        return true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartsManager;
}
