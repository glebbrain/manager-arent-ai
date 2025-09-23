/**
 * @fileoverview dashboard.js
 * @author GlebBrain
 * @created 04.09.2025
 * @lastmodified 04.09.2025
 * @copyright (c) 2025 GlebBrain. All rights reserved.
 */

// Universal Automation Platform - Real-time Dashboard
// Version: 2.2 - AI Enhanced

class DashboardManager {
    constructor() {
        this.isOnline = true;
        this.lastUpdate = new Date();
        this.metrics = {
            cpuUsage: 0,
            memoryUsage: 0,
            diskUsage: 0,
            networkLatency: 0
        };
        this.projects = [];
        this.builds = [];
        this.activities = [];
        this.alerts = [];
        this.charts = {};
        this.updateInterval = null;
        this.websocket = null;
        this.chartsManager = null;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Universal Automation Platform Dashboard...');
        
        // Initialize WebSocket connection
        this.initWebSocket();
        
        // Load initial data
        this.loadInitialData();
        
        // Start real-time updates
        this.startRealTimeUpdates();
        
        // Initialize charts manager
        this.chartsManager = new ChartsManager(this);
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ Dashboard initialized successfully');
    }

    initWebSocket() {
        try {
            // Try to connect to WebSocket server
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('🔌 WebSocket connected');
                this.isOnline = true;
                this.updateStatusIndicator();
            };
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };
            
            this.websocket.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.isOnline = false;
                this.updateStatusIndicator();
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.initWebSocket(), 5000);
            };
            
            this.websocket.onerror = (error) => {
                console.error('🔌 WebSocket error:', error);
                this.isOnline = false;
                this.updateStatusIndicator();
            };
        } catch (error) {
            console.warn('🔌 WebSocket not available, using polling mode');
            this.isOnline = false;
            this.updateStatusIndicator();
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'metrics':
                this.updateMetrics(data.payload);
                break;
            case 'project':
                this.updateProject(data.payload);
                break;
            case 'build':
                this.updateBuild(data.payload);
                break;
            case 'activity':
                this.addActivity(data.payload);
                break;
            case 'alert':
                this.addAlert(data.payload);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    loadInitialData() {
        // Load projects
        this.loadProjects();
        
        // Load builds
        this.loadBuilds();
        
        // Load activities
        this.loadActivities();
        
        // Load alerts
        this.loadAlerts();
        
        // Update metrics
        this.updateMetrics();
    }

    async loadProjects() {
        try {
            // Simulate API call - in real implementation, this would fetch from backend
            this.projects = [
                {
                    id: 1,
                    name: 'ManagerAgentAI',
                    type: 'AI/ML Platform',
                    status: 'active',
                    lastBuild: new Date(Date.now() - 300000), // 5 minutes ago
                    progress: 85
                },
                {
                    id: 2,
                    name: 'Web Dashboard',
                    type: 'Frontend',
                    status: 'building',
                    lastBuild: new Date(Date.now() - 120000), // 2 minutes ago
                    progress: 45
                },
                {
                    id: 3,
                    name: 'API Gateway',
                    type: 'Backend',
                    status: 'active',
                    lastBuild: new Date(Date.now() - 600000), // 10 minutes ago
                    progress: 100
                }
            ];
            
            this.renderProjects();
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    async loadBuilds() {
        try {
            // Simulate API call
            this.builds = [
                {
                    id: 1,
                    name: 'ManagerAgentAI Build #42',
                    status: 'success',
                    duration: 120,
                    timestamp: new Date(Date.now() - 300000),
                    progress: 100
                },
                {
                    id: 2,
                    name: 'Web Dashboard Build #15',
                    status: 'building',
                    duration: 45,
                    timestamp: new Date(Date.now() - 120000),
                    progress: 45
                },
                {
                    id: 3,
                    name: 'API Gateway Build #8',
                    status: 'success',
                    duration: 90,
                    timestamp: new Date(Date.now() - 600000),
                    progress: 100
                }
            ];
            
            this.renderBuilds();
        } catch (error) {
            console.error('Error loading builds:', error);
        }
    }

    async loadActivities() {
        try {
            // Simulate API call
            this.activities = [
                {
                    id: 1,
                    type: 'build',
                    message: 'Build completed successfully',
                    timestamp: new Date(Date.now() - 300000),
                    icon: '🔨'
                },
                {
                    id: 2,
                    type: 'test',
                    message: 'All tests passed',
                    timestamp: new Date(Date.now() - 240000),
                    icon: '🧪'
                },
                {
                    id: 3,
                    type: 'deploy',
                    message: 'Deployment to staging successful',
                    timestamp: new Date(Date.now() - 180000),
                    icon: '🚀'
                }
            ];
            
            this.renderActivities();
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    }

    async loadAlerts() {
        try {
            // Simulate API call
            this.alerts = [
                {
                    id: 1,
                    type: 'warning',
                    title: 'High Memory Usage',
                    description: 'Memory usage is above 80%',
                    timestamp: new Date(Date.now() - 600000),
                    icon: '⚠️'
                },
                {
                    id: 2,
                    type: 'info',
                    title: 'New Version Available',
                    description: 'Dashboard v2.3 is ready for deployment',
                    timestamp: new Date(Date.now() - 1200000),
                    icon: 'ℹ️'
                }
            ];
            
            this.renderAlerts();
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    updateMetrics(data = null) {
        if (data) {
            this.metrics = { ...this.metrics, ...data };
        } else {
            // Simulate real-time metrics
            this.metrics = {
                cpuUsage: Math.floor(Math.random() * 40) + 20, // 20-60%
                memoryUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
                diskUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
                networkLatency: Math.floor(Math.random() * 50) + 10 // 10-60ms
            };
        }
        
        this.renderMetrics();
        this.lastUpdate = new Date();
        this.updateLastUpdatedTime();
    }

    updateProject(project) {
        const index = this.projects.findIndex(p => p.id === project.id);
        if (index >= 0) {
            this.projects[index] = { ...this.projects[index], ...project };
        } else {
            this.projects.push(project);
        }
        this.renderProjects();
    }

    updateBuild(build) {
        const index = this.builds.findIndex(b => b.id === build.id);
        if (index >= 0) {
            this.builds[index] = { ...this.builds[index], ...build };
        } else {
            this.builds.push(build);
        }
        this.renderBuilds();
    }

    addActivity(activity) {
        activity.id = Date.now();
        activity.timestamp = new Date();
        this.activities.unshift(activity);
        
        // Keep only last 50 activities
        if (this.activities.length > 50) {
            this.activities = this.activities.slice(0, 50);
        }
        
        this.renderActivities();
    }

    addAlert(alert) {
        alert.id = Date.now();
        alert.timestamp = new Date();
        this.alerts.unshift(alert);
        
        // Keep only last 20 alerts
        if (this.alerts.length > 20) {
            this.alerts = this.alerts.slice(0, 20);
        }
        
        this.renderAlerts();
    }

    renderMetrics() {
        document.getElementById('cpuUsage').textContent = `${this.metrics.cpuUsage}%`;
        document.getElementById('memoryUsage').textContent = `${this.metrics.memoryUsage}%`;
        document.getElementById('diskUsage').textContent = `${this.metrics.diskUsage}%`;
        document.getElementById('networkLatency').textContent = `${this.metrics.networkLatency}ms`;
    }

    renderProjects() {
        const container = document.getElementById('projectList');
        container.innerHTML = this.projects.map(project => `
            <div class="project-item">
                <div class="project-info">
                    <div class="project-name">${project.name}</div>
                    <div class="project-type">${project.type}</div>
                </div>
                <div class="project-status ${project.status}">${project.status}</div>
            </div>
        `).join('');
    }

    renderBuilds() {
        const container = document.getElementById('buildStatus');
        container.innerHTML = this.builds.map(build => `
            <div class="build-item">
                <div class="build-info">
                    <div class="build-name">${build.name}</div>
                    <div class="build-time">${this.formatTime(build.timestamp)}</div>
                </div>
                <div class="build-progress">
                    <div class="build-progress-bar" style="width: ${build.progress}%"></div>
                </div>
            </div>
        `).join('');
    }

    renderActivities() {
        const container = document.getElementById('activityFeed');
        container.innerHTML = this.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    renderAlerts() {
        const container = document.getElementById('alertsList');
        const countElement = document.getElementById('alertCount');
        
        container.innerHTML = this.alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <div class="alert-icon">${alert.icon}</div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-description">${alert.description}</div>
                    <div class="alert-time">${this.formatTime(alert.timestamp)}</div>
                </div>
            </div>
        `).join('');
        
        countElement.textContent = this.alerts.length;
    }

    updateStatusIndicator() {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (this.isOnline) {
            statusDot.className = 'status-dot online';
            statusText.textContent = 'System Online';
        } else {
            statusDot.className = 'status-dot offline';
            statusText.textContent = 'System Offline';
        }
    }

    updateLastUpdatedTime() {
        const element = document.getElementById('lastUpdated');
        element.textContent = this.formatTime(this.lastUpdate);
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    // Charts are now managed by ChartsManager

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

    startRealTimeUpdates() {
        // Update metrics every 5 seconds
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
            
            // Simulate random activities
            if (Math.random() < 0.3) {
                this.simulateActivity();
            }
        }, 5000);
        
        // Update uptime every second
        setInterval(() => {
            this.updateUptime();
        }, 1000);
    }

    simulateActivity() {
        const activities = [
            { type: 'build', message: 'Build process started', icon: '🔨' },
            { type: 'test', message: 'Running unit tests', icon: '🧪' },
            { type: 'deploy', message: 'Deploying to staging', icon: '🚀' },
            { type: 'build', message: 'Build completed successfully', icon: '✅' }
        ];
        
        const activity = activities[Math.floor(Math.random() * activities.length)];
        this.addActivity(activity);
    }

    updateUptime() {
        const element = document.getElementById('uptime');
        // This would be calculated from actual system start time
        element.textContent = '2d 14h 32m';
    }

    setupEventListeners() {
        // Chart time range change
        const timeRangeSelect = document.getElementById('timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', () => {
                this.updateChart();
            });
        }
    }

    updateChart() {
        if (this.chartsManager) {
            this.chartsManager.updateChart('performance');
        }
    }

    refreshChart(chartName) {
        if (this.chartsManager) {
            this.chartsManager.updateChart(chartName);
        }
    }

    exportChart(chartName) {
        if (this.chartsManager) {
            this.chartsManager.exportChart(chartName);
        }
    }

    // Public methods for button actions
    refreshData() {
        console.log('🔄 Refreshing data...');
        this.loadInitialData();
    }

    refreshBuilds() {
        console.log('🔄 Refreshing builds...');
        this.loadBuilds();
    }

    refreshTestData() {
        console.log('🔄 Refreshing test data...');
        if (this.charts.testCoverage) {
            this.charts.testCoverage.data.datasets[0].data = [
                Math.floor(Math.random() * 20) + 70, // Passed
                Math.floor(Math.random() * 15) + 5,  // Failed
                Math.floor(Math.random() * 10) + 1   // Skipped
            ];
            this.charts.testCoverage.update();
        }
    }

    addProject() {
        console.log('➕ Adding new project...');
        // This would open a modal or form
        alert('Add Project functionality would be implemented here');
    }

    clearActivity() {
        console.log('🗑️ Clearing activity feed...');
        this.activities = [];
        this.renderActivities();
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.websocket) {
            this.websocket.close();
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

// Global functions for HTML onclick handlers
function refreshData() {
    if (window.dashboard) {
        window.dashboard.refreshData();
    }
}

function refreshBuilds() {
    if (window.dashboard) {
        window.dashboard.refreshBuilds();
    }
}

function refreshTestData() {
    if (window.dashboard) {
        window.dashboard.refreshChart('testCoverage');
    }
}

function refreshChart(chartName) {
    if (window.dashboard) {
        window.dashboard.refreshChart(chartName);
    }
}

function exportChart(chartName) {
    if (window.dashboard) {
        window.dashboard.exportChart(chartName);
    }
}

function addProject() {
    if (window.dashboard) {
        window.dashboard.addProject();
    }
}

function clearActivity() {
    if (window.dashboard) {
        window.dashboard.clearActivity();
    }
}

function updateChart() {
    if (window.dashboard) {
        window.dashboard.updateChart();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.destroy();
    }
});
