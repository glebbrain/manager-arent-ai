const EventEmitter = require('events');
const WebSocket = require('ws');

/**
 * Real-time Updater v2.4
 * Handles real-time data updates and WebSocket connections
 */
class RealTimeUpdater extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            updateInterval: 1000, // 1 second
            maxConnections: 1000,
            connectionTimeout: 30000, // 30 seconds
            enableHeartbeat: true,
            heartbeatInterval: 30000, // 30 seconds
            ...options
        };
        
        this.connections = new Map();
        this.subscriptions = new Map();
        this.dashboardData = new Map();
        this.updateIntervals = new Map();
        this.heartbeatIntervals = new Map();
        
        this.startHeartbeat();
    }

    /**
     * Initialize dashboard for real-time updates
     */
    async initializeDashboard(dashboardId) {
        try {
            // Create dashboard data store
            this.dashboardData.set(dashboardId, {
                data: {},
                lastUpdate: new Date().toISOString(),
                subscribers: new Set()
            });

            // Start update interval for dashboard
            const interval = setInterval(() => {
                this.updateDashboardData(dashboardId);
            }, this.options.updateInterval);

            this.updateIntervals.set(dashboardId, interval);
            
            this.emit('dashboardInitialized', dashboardId);
            return true;
        } catch (error) {
            throw new Error(`Failed to initialize dashboard: ${error.message}`);
        }
    }

    /**
     * Cleanup dashboard
     */
    async cleanupDashboard(dashboardId) {
        try {
            // Clear update interval
            const interval = this.updateIntervals.get(dashboardId);
            if (interval) {
                clearInterval(interval);
                this.updateIntervals.delete(dashboardId);
            }

            // Clear dashboard data
            this.dashboardData.delete(dashboardId);

            // Remove all subscriptions for this dashboard
            const subscriptions = Array.from(this.subscriptions.entries())
                .filter(([_, sub]) => sub.dashboardId === dashboardId);
            
            subscriptions.forEach(([subId, _]) => {
                this.subscriptions.delete(subId);
            });

            this.emit('dashboardCleanedUp', dashboardId);
            return true;
        } catch (error) {
            throw new Error(`Failed to cleanup dashboard: ${error.message}`);
        }
    }

    /**
     * Subscribe to dashboard updates
     */
    async subscribeToUpdates(dashboardId, subscriptionData) {
        try {
            const subscriptionId = this.generateId();
            
            // Validate dashboard exists
            if (!this.dashboardData.has(dashboardId)) {
                await this.initializeDashboard(dashboardId);
            }

            // Create subscription
            const subscription = {
                id: subscriptionId,
                dashboardId,
                connectionId: subscriptionData.connectionId,
                userId: subscriptionData.userId,
                filters: subscriptionData.filters || {},
                createdAt: new Date().toISOString(),
                isActive: true
            };

            // Store subscription
            this.subscriptions.set(subscriptionId, subscription);
            
            // Add to dashboard subscribers
            const dashboardData = this.dashboardData.get(dashboardId);
            if (dashboardData) {
                dashboardData.subscribers.add(subscriptionId);
            }

            this.emit('subscriptionCreated', subscription);
            return subscription;
        } catch (error) {
            throw new Error(`Failed to subscribe to updates: ${error.message}`);
        }
    }

    /**
     * Unsubscribe from updates
     */
    async unsubscribeFromUpdates(dashboardId, connectionId) {
        try {
            // Find subscriptions for this dashboard and connection
            const subscriptions = Array.from(this.subscriptions.entries())
                .filter(([_, sub]) => sub.dashboardId === dashboardId && sub.connectionId === connectionId);

            // Remove subscriptions
            subscriptions.forEach(([subId, subscription]) => {
                this.subscriptions.delete(subId);
                
                // Remove from dashboard subscribers
                const dashboardData = this.dashboardData.get(dashboardId);
                if (dashboardData) {
                    dashboardData.subscribers.delete(subId);
                }

                this.emit('subscriptionRemoved', subscription);
            });

            return true;
        } catch (error) {
            throw new Error(`Failed to unsubscribe from updates: ${error.message}`);
        }
    }

    /**
     * Get real-time data for dashboard
     */
    async getRealTimeData(dashboardId) {
        try {
            const dashboardData = this.dashboardData.get(dashboardId);
            if (!dashboardData) {
                throw new Error('Dashboard not found');
            }

            return {
                dashboardId,
                data: dashboardData.data,
                lastUpdate: dashboardData.lastUpdate,
                subscribers: dashboardData.subscribers.size
            };
        } catch (error) {
            throw new Error(`Failed to get real-time data: ${error.message}`);
        }
    }

    /**
     * Update dashboard data
     */
    async updateDashboardData(dashboardId) {
        try {
            const dashboardData = this.dashboardData.get(dashboardId);
            if (!dashboardData) {
                return;
            }

            // Generate mock real-time data
            const newData = await this.generateRealTimeData(dashboardId);
            
            // Update dashboard data
            dashboardData.data = newData;
            dashboardData.lastUpdate = new Date().toISOString();

            // Notify subscribers
            await this.notifySubscribers(dashboardId, newData);

            this.emit('dataUpdated', { dashboardId, data: newData });
        } catch (error) {
            console.error(`Error updating dashboard data for ${dashboardId}:`, error);
        }
    }

    /**
     * Generate real-time data
     */
    async generateRealTimeData(dashboardId) {
        // This would typically fetch from actual data sources
        // For now, generate mock data
        const now = new Date();
        const timestamp = now.toISOString();
        
        return {
            timestamp,
            metrics: {
                activeUsers: Math.floor(Math.random() * 1000) + 500,
                revenue: Math.floor(Math.random() * 10000) + 50000,
                conversionRate: (Math.random() * 5 + 2).toFixed(2),
                pageViews: Math.floor(Math.random() * 10000) + 20000
            },
            charts: {
                userGrowth: this.generateTimeSeriesData(24),
                revenueTrend: this.generateTimeSeriesData(24),
                trafficSources: this.generatePieChartData(),
                performance: this.generateBarChartData()
            },
            alerts: this.generateAlerts(),
            status: {
                systemHealth: 'healthy',
                lastBackup: new Date(Date.now() - Math.random() * 3600000).toISOString(),
                uptime: Math.floor(Math.random() * 100) + 90
            }
        };
    }

    /**
     * Generate time series data
     */
    generateTimeSeriesData(hours) {
        const data = [];
        const now = new Date();
        
        for (let i = hours - 1; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
            data.push({
                timestamp: timestamp.toISOString(),
                value: Math.floor(Math.random() * 1000) + 500
            });
        }
        
        return data;
    }

    /**
     * Generate pie chart data
     */
    generatePieChartData() {
        const sources = ['Direct', 'Search', 'Social', 'Email', 'Referral'];
        const data = sources.map(source => ({
            label: source,
            value: Math.floor(Math.random() * 100) + 10
        }));
        
        return data;
    }

    /**
     * Generate bar chart data
     */
    generateBarChartData() {
        const categories = ['Q1', 'Q2', 'Q3', 'Q4'];
        const data = categories.map(category => ({
            category,
            value: Math.floor(Math.random() * 1000) + 500
        }));
        
        return data;
    }

    /**
     * Generate alerts
     */
    generateAlerts() {
        const alerts = [];
        const alertTypes = ['info', 'warning', 'error', 'success'];
        
        // Randomly generate 0-3 alerts
        const numAlerts = Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numAlerts; i++) {
            alerts.push({
                id: this.generateId(),
                type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
                message: `Alert ${i + 1}: System notification`,
                timestamp: new Date().toISOString(),
                isRead: false
            });
        }
        
        return alerts;
    }

    /**
     * Notify subscribers of data updates
     */
    async notifySubscribers(dashboardId, data) {
        try {
            const dashboardData = this.dashboardData.get(dashboardId);
            if (!dashboardData) {
                return;
            }

            // Get active subscriptions for this dashboard
            const activeSubscriptions = Array.from(this.subscriptions.values())
                .filter(sub => sub.dashboardId === dashboardId && sub.isActive);

            // Send updates to each subscriber
            for (const subscription of activeSubscriptions) {
                try {
                    await this.sendUpdateToSubscriber(subscription, data);
                } catch (error) {
                    console.error(`Error sending update to subscriber ${subscription.id}:`, error);
                    // Mark subscription as inactive if connection fails
                    subscription.isActive = false;
                }
            }
        } catch (error) {
            console.error(`Error notifying subscribers for dashboard ${dashboardId}:`, error);
        }
    }

    /**
     * Send update to specific subscriber
     */
    async sendUpdateToSubscriber(subscription, data) {
        // This would typically send via WebSocket
        // For now, emit an event that the server can handle
        this.emit('sendUpdate', {
            subscriptionId: subscription.id,
            connectionId: subscription.connectionId,
            dashboardId: subscription.dashboardId,
            data: this.filterDataForSubscription(data, subscription.filters)
        });
    }

    /**
     * Filter data based on subscription filters
     */
    filterDataForSubscription(data, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return data;
        }

        const filteredData = { ...data };

        // Filter metrics
        if (filters.metrics && Array.isArray(filters.metrics)) {
            filteredData.metrics = {};
            filters.metrics.forEach(metric => {
                if (data.metrics[metric]) {
                    filteredData.metrics[metric] = data.metrics[metric];
                }
            });
        }

        // Filter charts
        if (filters.charts && Array.isArray(filters.charts)) {
            filteredData.charts = {};
            filters.charts.forEach(chart => {
                if (data.charts[chart]) {
                    filteredData.charts[chart] = data.charts[chart];
                }
            });
        }

        // Filter alerts by type
        if (filters.alertTypes && Array.isArray(filters.alertTypes)) {
            filteredData.alerts = data.alerts.filter(alert => 
                filters.alertTypes.includes(alert.type)
            );
        }

        return filteredData;
    }

    /**
     * Register WebSocket connection
     */
    registerConnection(connectionId, ws) {
        try {
            this.connections.set(connectionId, {
                ws,
                connectedAt: new Date().toISOString(),
                lastPing: new Date().toISOString(),
                isActive: true
            });

            // Start heartbeat for this connection
            if (this.options.enableHeartbeat) {
                this.startConnectionHeartbeat(connectionId);
            }

            this.emit('connectionRegistered', connectionId);
            return true;
        } catch (error) {
            throw new Error(`Failed to register connection: ${error.message}`);
        }
    }

    /**
     * Unregister WebSocket connection
     */
    unregisterConnection(connectionId) {
        try {
            // Remove connection
            this.connections.delete(connectionId);

            // Clear heartbeat
            const heartbeatInterval = this.heartbeatIntervals.get(connectionId);
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                this.heartbeatIntervals.delete(connectionId);
            }

            // Remove all subscriptions for this connection
            const subscriptions = Array.from(this.subscriptions.entries())
                .filter(([_, sub]) => sub.connectionId === connectionId);
            
            subscriptions.forEach(([subId, subscription]) => {
                this.subscriptions.delete(subId);
                this.emit('subscriptionRemoved', subscription);
            });

            this.emit('connectionUnregistered', connectionId);
            return true;
        } catch (error) {
            throw new Error(`Failed to unregister connection: ${error.message}`);
        }
    }

    /**
     * Start connection heartbeat
     */
    startConnectionHeartbeat(connectionId) {
        const interval = setInterval(() => {
            this.pingConnection(connectionId);
        }, this.options.heartbeatInterval);

        this.heartbeatIntervals.set(connectionId, interval);
    }

    /**
     * Ping connection
     */
    async pingConnection(connectionId) {
        try {
            const connection = this.connections.get(connectionId);
            if (!connection || !connection.isActive) {
                return;
            }

            // Send ping
            this.emit('sendPing', {
                connectionId,
                timestamp: new Date().toISOString()
            });

            // Update last ping time
            connection.lastPing = new Date().toISOString();
        } catch (error) {
            console.error(`Error pinging connection ${connectionId}:`, error);
            // Mark connection as inactive
            if (connection) {
                connection.isActive = false;
            }
        }
    }

    /**
     * Start global heartbeat
     */
    startHeartbeat() {
        if (!this.options.enableHeartbeat) {
            return;
        }

        setInterval(() => {
            this.cleanupInactiveConnections();
        }, this.options.heartbeatInterval);
    }

    /**
     * Cleanup inactive connections
     */
    cleanupInactiveConnections() {
        const now = new Date();
        const timeout = this.options.connectionTimeout;

        for (const [connectionId, connection] of this.connections) {
            const lastPing = new Date(connection.lastPing);
            const timeSinceLastPing = now.getTime() - lastPing.getTime();

            if (timeSinceLastPing > timeout) {
                console.log(`Cleaning up inactive connection: ${connectionId}`);
                this.unregisterConnection(connectionId);
            }
        }
    }

    /**
     * Get active connections count
     */
    getActiveConnections() {
        return Array.from(this.connections.values()).filter(conn => conn.isActive).length;
    }

    /**
     * Get active subscriptions count
     */
    getActiveSubscriptions() {
        return Array.from(this.subscriptions.values()).filter(sub => sub.isActive).length;
    }

    /**
     * Get subscription by ID
     */
    getSubscription(subscriptionId) {
        return this.subscriptions.get(subscriptionId);
    }

    /**
     * Get subscriptions for dashboard
     */
    getDashboardSubscriptions(dashboardId) {
        return Array.from(this.subscriptions.values())
            .filter(sub => sub.dashboardId === dashboardId);
    }

    /**
     * Get connection by ID
     */
    getConnection(connectionId) {
        return this.connections.get(connectionId);
    }

    /**
     * Helper methods
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            isRunning: true,
            activeConnections: this.getActiveConnections(),
            activeSubscriptions: this.getActiveSubscriptions(),
            totalDashboards: this.dashboardData.size,
            updateInterval: this.options.updateInterval,
            heartbeatEnabled: this.options.enableHeartbeat,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }

    /**
     * Shutdown
     */
    async shutdown() {
        try {
            // Clear all intervals
            this.updateIntervals.forEach(interval => clearInterval(interval));
            this.heartbeatIntervals.forEach(interval => clearInterval(interval));

            // Clear all data
            this.connections.clear();
            this.subscriptions.clear();
            this.dashboardData.clear();
            this.updateIntervals.clear();
            this.heartbeatIntervals.clear();

            this.emit('shutdown');
        } catch (error) {
            throw new Error(`Failed to shutdown real-time updater: ${error.message}`);
        }
    }
}

module.exports = RealTimeUpdater;
