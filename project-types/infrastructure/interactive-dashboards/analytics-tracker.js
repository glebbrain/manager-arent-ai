const EventEmitter = require('events');

/**
 * Analytics Tracker v2.4
 * Tracks analytics and usage statistics for dashboards
 */
class AnalyticsTracker extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            enableTracking: true,
            enableRealTimeAnalytics: true,
            enableUserTracking: true,
            enablePerformanceTracking: true,
            dataRetentionDays: 365,
            ...options
        };
        
        this.events = new Map();
        this.dashboardAnalytics = new Map();
        this.userAnalytics = new Map();
        this.performanceMetrics = new Map();
        this.sessionData = new Map();
    }

    /**
     * Track event
     */
    async trackEvent(eventType, eventData = {}) {
        try {
            if (!this.options.enableTracking) {
                return;
            }

            const eventId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const event = {
                id: eventId,
                type: eventType,
                data: eventData,
                timestamp,
                userId: eventData.userId || 'anonymous',
                sessionId: eventData.sessionId || this.generateSessionId(),
                metadata: {
                    userAgent: eventData.userAgent || 'unknown',
                    ip: eventData.ip || 'unknown',
                    referrer: eventData.referrer || null,
                    page: eventData.page || null
                }
            };

            // Store event
            if (!this.events.has(eventType)) {
                this.events.set(eventType, []);
            }
            
            const events = this.events.get(eventType);
            events.push(event);

            // Keep only recent events (based on retention policy)
            this.cleanupOldEvents(eventType);

            // Update analytics
            await this.updateAnalytics(event);

            this.emit('eventTracked', event);
            return event;
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }

    /**
     * Track dashboard analytics
     */
    async trackDashboardEvent(dashboardId, eventType, eventData = {}) {
        try {
            const event = await this.trackEvent(`dashboard_${eventType}`, {
                ...eventData,
                dashboardId,
                userId: eventData.userId || 'anonymous'
            });

            // Update dashboard-specific analytics
            await this.updateDashboardAnalytics(dashboardId, eventType, eventData);

            return event;
        } catch (error) {
            throw new Error(`Failed to track dashboard event: ${error.message}`);
        }
    }

    /**
     * Track user analytics
     */
    async trackUserEvent(userId, eventType, eventData = {}) {
        try {
            const event = await this.trackEvent(`user_${eventType}`, {
                ...eventData,
                userId
            });

            // Update user-specific analytics
            await this.updateUserAnalytics(userId, eventType, eventData);

            return event;
        } catch (error) {
            throw new Error(`Failed to track user event: ${error.message}`);
        }
    }

    /**
     * Track performance metrics
     */
    async trackPerformance(metricType, metricData) {
        try {
            if (!this.options.enablePerformanceTracking) {
                return;
            }

            const metricId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const metric = {
                id: metricId,
                type: metricType,
                data: metricData,
                timestamp,
                dashboardId: metricData.dashboardId,
                userId: metricData.userId || 'anonymous'
            };

            // Store performance metric
            if (!this.performanceMetrics.has(metricType)) {
                this.performanceMetrics.set(metricType, []);
            }
            
            const metrics = this.performanceMetrics.get(metricType);
            metrics.push(metric);

            // Keep only recent metrics
            this.cleanupOldMetrics(metricType);

            this.emit('performanceTracked', metric);
            return metric;
        } catch (error) {
            console.error('Error tracking performance:', error);
        }
    }

    /**
     * Get dashboard analytics
     */
    async getDashboardAnalytics(dashboardId, filters = {}) {
        try {
            const analytics = this.dashboardAnalytics.get(dashboardId) || this.initializeDashboardAnalytics(dashboardId);
            
            // Apply filters
            let filteredAnalytics = { ...analytics };
            
            if (filters.startDate) {
                filteredAnalytics = this.filterAnalyticsByDate(filteredAnalytics, filters.startDate, filters.endDate);
            }
            
            if (filters.metrics && Array.isArray(filters.metrics)) {
                filteredAnalytics = this.filterAnalyticsByMetrics(filteredAnalytics, filters.metrics);
            }

            return filteredAnalytics;
        } catch (error) {
            throw new Error(`Failed to get dashboard analytics: ${error.message}`);
        }
    }

    /**
     * Get user analytics
     */
    async getUserAnalytics(userId, filters = {}) {
        try {
            const analytics = this.userAnalytics.get(userId) || this.initializeUserAnalytics(userId);
            
            // Apply filters
            let filteredAnalytics = { ...analytics };
            
            if (filters.startDate) {
                filteredAnalytics = this.filterAnalyticsByDate(filteredAnalytics, filters.startDate, filters.endDate);
            }
            
            if (filters.metrics && Array.isArray(filters.metrics)) {
                filteredAnalytics = this.filterAnalyticsByMetrics(filteredAnalytics, filters.metrics);
            }

            return filteredAnalytics;
        } catch (error) {
            throw new Error(`Failed to get user analytics: ${error.message}`);
        }
    }

    /**
     * Get system analytics
     */
    async getSystemAnalytics(filters = {}) {
        try {
            const analytics = {
                overview: {
                    totalEvents: this.getTotalEvents(),
                    totalDashboards: this.dashboardAnalytics.size,
                    totalUsers: this.userAnalytics.size,
                    totalSessions: this.sessionData.size
                },
                events: this.getEventStatistics(filters),
                dashboards: this.getDashboardStatistics(filters),
                users: this.getUserStatistics(filters),
                performance: this.getPerformanceStatistics(filters),
                trends: this.getTrendAnalytics(filters)
            };

            return analytics;
        } catch (error) {
            throw new Error(`Failed to get system analytics: ${error.message}`);
        }
    }

    /**
     * Update analytics
     */
    async updateAnalytics(event) {
        try {
            // Update dashboard analytics if applicable
            if (event.data.dashboardId) {
                await this.updateDashboardAnalytics(event.data.dashboardId, event.type, event.data);
            }

            // Update user analytics if applicable
            if (event.userId && event.userId !== 'anonymous') {
                await this.updateUserAnalytics(event.userId, event.type, event.data);
            }

            // Update session data
            await this.updateSessionData(event.sessionId, event);
        } catch (error) {
            console.error('Error updating analytics:', error);
        }
    }

    /**
     * Update dashboard analytics
     */
    async updateDashboardAnalytics(dashboardId, eventType, eventData) {
        try {
            let analytics = this.dashboardAnalytics.get(dashboardId);
            if (!analytics) {
                analytics = this.initializeDashboardAnalytics(dashboardId);
            }

            // Update view count
            if (eventType.includes('view')) {
                analytics.views.total++;
                analytics.views.unique = this.getUniqueViewers(dashboardId);
            }

            // Update interaction count
            if (eventType.includes('interact')) {
                analytics.interactions.total++;
            }

            // Update share count
            if (eventType.includes('share')) {
                analytics.shares.total++;
            }

            // Update performance metrics
            if (eventData.loadTime) {
                analytics.performance.loadTime = this.updateAverage(analytics.performance.loadTime, eventData.loadTime);
            }

            if (eventData.renderTime) {
                analytics.performance.renderTime = this.updateAverage(analytics.performance.renderTime, eventData.renderTime);
            }

            // Update daily statistics
            const today = new Date().toISOString().split('T')[0];
            if (!analytics.daily[today]) {
                analytics.daily[today] = {
                    views: 0,
                    interactions: 0,
                    shares: 0,
                    uniqueUsers: new Set()
                };
            }

            analytics.daily[today].views++;
            if (eventData.userId) {
                analytics.daily[today].uniqueUsers.add(eventData.userId);
            }

            // Store updated analytics
            this.dashboardAnalytics.set(dashboardId, analytics);
        } catch (error) {
            console.error('Error updating dashboard analytics:', error);
        }
    }

    /**
     * Update user analytics
     */
    async updateUserAnalytics(userId, eventType, eventData) {
        try {
            let analytics = this.userAnalytics.get(userId);
            if (!analytics) {
                analytics = this.initializeUserAnalytics(userId);
            }

            // Update activity count
            analytics.activity.total++;
            analytics.activity.lastActivity = new Date().toISOString();

            // Update dashboard interactions
            if (eventData.dashboardId) {
                if (!analytics.dashboards[eventData.dashboardId]) {
                    analytics.dashboards[eventData.dashboardId] = {
                        views: 0,
                        interactions: 0,
                        lastViewed: null
                    };
                }

                analytics.dashboards[eventData.dashboardId].views++;
                analytics.dashboards[eventData.dashboardId].lastViewed = new Date().toISOString();
            }

            // Update session data
            if (eventData.sessionId) {
                analytics.sessions.add(eventData.sessionId);
            }

            // Store updated analytics
            this.userAnalytics.set(userId, analytics);
        } catch (error) {
            console.error('Error updating user analytics:', error);
        }
    }

    /**
     * Update session data
     */
    async updateSessionData(sessionId, event) {
        try {
            let session = this.sessionData.get(sessionId);
            if (!session) {
                session = {
                    id: sessionId,
                    startTime: event.timestamp,
                    lastActivity: event.timestamp,
                    events: [],
                    userId: event.userId,
                    dashboardIds: new Set()
                };
            }

            session.lastActivity = event.timestamp;
            session.events.push(event);
            
            if (event.data.dashboardId) {
                session.dashboardIds.add(event.data.dashboardId);
            }

            this.sessionData.set(sessionId, session);
        } catch (error) {
            console.error('Error updating session data:', error);
        }
    }

    /**
     * Initialize dashboard analytics
     */
    initializeDashboardAnalytics(dashboardId) {
        return {
            dashboardId,
            views: {
                total: 0,
                unique: 0,
                today: 0,
                thisWeek: 0,
                thisMonth: 0
            },
            interactions: {
                total: 0,
                today: 0,
                thisWeek: 0,
                thisMonth: 0
            },
            shares: {
                total: 0,
                today: 0,
                thisWeek: 0,
                thisMonth: 0
            },
            performance: {
                loadTime: 0,
                renderTime: 0,
                errorRate: 0
            },
            daily: {},
            weekly: {},
            monthly: {},
            metadata: {
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            }
        };
    }

    /**
     * Initialize user analytics
     */
    initializeUserAnalytics(userId) {
        return {
            userId,
            activity: {
                total: 0,
                lastActivity: null,
                firstActivity: new Date().toISOString()
            },
            dashboards: {},
            sessions: new Set(),
            preferences: {},
            metadata: {
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            }
        };
    }

    /**
     * Get unique viewers for dashboard
     */
    getUniqueViewers(dashboardId) {
        const events = this.events.get(`dashboard_view`) || [];
        const viewers = new Set();
        
        events.forEach(event => {
            if (event.data.dashboardId === dashboardId && event.userId !== 'anonymous') {
                viewers.add(event.userId);
            }
        });
        
        return viewers.size;
    }

    /**
     * Update average value
     */
    updateAverage(currentAverage, newValue) {
        if (currentAverage === 0) {
            return newValue;
        }
        return (currentAverage + newValue) / 2;
    }

    /**
     * Get total events
     */
    getTotalEvents() {
        let total = 0;
        for (const events of this.events.values()) {
            total += events.length;
        }
        return total;
    }

    /**
     * Get event statistics
     */
    getEventStatistics(filters = {}) {
        const stats = {};
        
        for (const [eventType, events] of this.events) {
            stats[eventType] = {
                total: events.length,
                today: this.getEventsToday(events),
                thisWeek: this.getEventsThisWeek(events),
                thisMonth: this.getEventsThisMonth(events)
            };
        }
        
        return stats;
    }

    /**
     * Get dashboard statistics
     */
    getDashboardStatistics(filters = {}) {
        const stats = {
            totalDashboards: this.dashboardAnalytics.size,
            mostViewed: this.getMostViewedDashboards(),
            mostInteractive: this.getMostInteractiveDashboards(),
            recentlyCreated: this.getRecentlyCreatedDashboards()
        };
        
        return stats;
    }

    /**
     * Get user statistics
     */
    getUserStatistics(filters = {}) {
        const stats = {
            totalUsers: this.userAnalytics.size,
            activeUsers: this.getActiveUsers(),
            mostActive: this.getMostActiveUsers(),
            newUsers: this.getNewUsers()
        };
        
        return stats;
    }

    /**
     * Get performance statistics
     */
    getPerformanceStatistics(filters = {}) {
        const stats = {};
        
        for (const [metricType, metrics] of this.performanceMetrics) {
            if (metrics.length > 0) {
                const values = metrics.map(m => m.data.value || m.data);
                stats[metricType] = {
                    average: values.reduce((sum, val) => sum + val, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    count: values.length
                };
            }
        }
        
        return stats;
    }

    /**
     * Get trend analytics
     */
    getTrendAnalytics(filters = {}) {
        const trends = {
            views: this.getTrendData('views'),
            interactions: this.getTrendData('interactions'),
            users: this.getTrendData('users'),
            performance: this.getTrendData('performance')
        };
        
        return trends;
    }

    /**
     * Get trend data for specific metric
     */
    getTrendData(metric) {
        // This would typically calculate trends over time
        // For now, return mock data
        return {
            trend: 'up',
            change: 12.5,
            period: '7d'
        };
    }

    /**
     * Helper methods for filtering and calculations
     */
    filterAnalyticsByDate(analytics, startDate, endDate) {
        // Implementation would filter analytics by date range
        return analytics;
    }

    filterAnalyticsByMetrics(analytics, metrics) {
        // Implementation would filter analytics by specific metrics
        return analytics;
    }

    getEventsToday(events) {
        const today = new Date().toISOString().split('T')[0];
        return events.filter(event => event.timestamp.startsWith(today)).length;
    }

    getEventsThisWeek(events) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return events.filter(event => new Date(event.timestamp) >= weekAgo).length;
    }

    getEventsThisMonth(events) {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return events.filter(event => new Date(event.timestamp) >= monthAgo).length;
    }

    getMostViewedDashboards() {
        const dashboards = Array.from(this.dashboardAnalytics.values());
        return dashboards
            .sort((a, b) => b.views.total - a.views.total)
            .slice(0, 10)
            .map(d => ({ id: d.dashboardId, views: d.views.total }));
    }

    getMostInteractiveDashboards() {
        const dashboards = Array.from(this.dashboardAnalytics.values());
        return dashboards
            .sort((a, b) => b.interactions.total - a.interactions.total)
            .slice(0, 10)
            .map(d => ({ id: d.dashboardId, interactions: d.interactions.total }));
    }

    getRecentlyCreatedDashboards() {
        const dashboards = Array.from(this.dashboardAnalytics.values());
        return dashboards
            .sort((a, b) => new Date(b.metadata.created) - new Date(a.metadata.created))
            .slice(0, 10)
            .map(d => ({ id: d.dashboardId, created: d.metadata.created }));
    }

    getActiveUsers() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        return Array.from(this.userAnalytics.values())
            .filter(user => new Date(user.activity.lastActivity) >= weekAgo).length;
    }

    getMostActiveUsers() {
        const users = Array.from(this.userAnalytics.values());
        return users
            .sort((a, b) => b.activity.total - a.activity.total)
            .slice(0, 10)
            .map(u => ({ id: u.userId, activity: u.activity.total }));
    }

    getNewUsers() {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        return Array.from(this.userAnalytics.values())
            .filter(user => new Date(user.activity.firstActivity) >= monthAgo).length;
    }

    /**
     * Cleanup old events
     */
    cleanupOldEvents(eventType) {
        const events = this.events.get(eventType);
        if (!events) return;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.options.dataRetentionDays);

        const filteredEvents = events.filter(event => 
            new Date(event.timestamp) >= cutoffDate
        );

        this.events.set(eventType, filteredEvents);
    }

    /**
     * Cleanup old metrics
     */
    cleanupOldMetrics(metricType) {
        const metrics = this.performanceMetrics.get(metricType);
        if (!metrics) return;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.options.dataRetentionDays);

        const filteredMetrics = metrics.filter(metric => 
            new Date(metric.timestamp) >= cutoffDate
        );

        this.performanceMetrics.set(metricType, filteredMetrics);
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate ID
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
            totalEvents: this.getTotalEvents(),
            totalDashboards: this.dashboardAnalytics.size,
            totalUsers: this.userAnalytics.size,
            totalSessions: this.sessionData.size,
            trackingEnabled: this.options.enableTracking,
            realTimeEnabled: this.options.enableRealTimeAnalytics,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = AnalyticsTracker;
