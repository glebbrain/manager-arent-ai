/**
 * Integrated Smart Notification System
 * Orchestrates contextual notifications with AI-powered analysis
 */

const NotificationEngine = require('./notification-engine');
const ContextAnalyzer = require('./context-analyzer');
const IntelligentRouter = require('./intelligent-router');

class IntegratedNotificationSystem {
    constructor(options = {}) {
        this.notificationEngine = new NotificationEngine(options.notification);
        this.contextAnalyzer = new ContextAnalyzer(options.context);
        this.intelligentRouter = new IntelligentRouter(options.routing);
        
        this.isRunning = true;
        this.lastUpdate = new Date();
        this.notificationQueue = [];
        this.activeSubscriptions = new Map();
        
        this.config = {
            autoNotification: options.autoNotification || false,
            contextAnalysis: options.contextAnalysis || false,
            intelligentRouting: options.intelligentRouting || false,
            ...options
        };
        
        // Start background processes
        this.startBackgroundProcesses();
    }

    /**
     * Send a single notification
     */
    async sendNotification(event, context, options = {}) {
        try {
            // Analyze context if enabled
            let enhancedContext = context;
            if (this.config.contextAnalysis) {
                enhancedContext = await this.contextAnalyzer.analyzeContext(event, context);
            }
            
            // Determine recipients if not provided
            let recipients = options.recipients;
            if (!recipients && this.config.intelligentRouting) {
                recipients = await this.intelligentRouter.determineRecipients(event, enhancedContext);
            }
            
            // Create notification
            const notification = {
                id: this.generateId(),
                event,
                context: enhancedContext,
                recipients: recipients || [],
                priority: options.priority || 'medium',
                channels: options.channels || ['email'],
                status: 'pending',
                createdAt: new Date(),
                scheduledFor: options.scheduledFor || new Date(),
                metadata: {
                    source: 'smart-notifications',
                    version: '2.4.0',
                    contextAnalysis: this.config.contextAnalysis,
                    intelligentRouting: this.config.intelligentRouting
                }
            };
            
            // Send notification
            const result = await this.notificationEngine.send(notification);
            
            // Update notification status
            notification.status = result.success ? 'sent' : 'failed';
            notification.sentAt = new Date();
            notification.result = result;
            
            // Store notification
            this.storeNotification(notification);
            
            // Send real-time update if WebSocket subscribers exist
            this.broadcastToSubscribers(notification);
            
            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }

    /**
     * Send batch notifications
     */
    async sendBatchNotifications(notifications) {
        const results = [];
        
        for (const notificationData of notifications) {
            try {
                const result = await this.sendNotification(
                    notificationData.event,
                    notificationData.context,
                    notificationData.options || {}
                );
                results.push({ success: true, notification: result });
            } catch (error) {
                results.push({ 
                    success: false, 
                    error: error.message,
                    notification: notificationData
                });
            }
        }
        
        return {
            total: notifications.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    /**
     * Get notifications with filtering
     */
    getNotifications(filters = {}) {
        let notifications = [...this.notificationQueue];
        
        if (filters.userId) {
            notifications = notifications.filter(n => 
                n.recipients.some(r => r.id === filters.userId)
            );
        }
        
        if (filters.status) {
            notifications = notifications.filter(n => n.status === filters.status);
        }
        
        if (filters.priority) {
            notifications = notifications.filter(n => n.priority === filters.priority);
        }
        
        // Apply pagination
        const offset = filters.offset || 0;
        const limit = filters.limit || 50;
        
        return notifications
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(offset, offset + limit);
    }

    /**
     * Update notification status
     */
    updateNotificationStatus(notificationId, status) {
        const notification = this.notificationQueue.find(n => n.id === notificationId);
        if (notification) {
            notification.status = status;
            notification.updatedAt = new Date();
            return true;
        }
        return false;
    }

    /**
     * Get analytics
     */
    getAnalytics() {
        const notifications = this.notificationQueue;
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const recentNotifications = notifications.filter(n => 
            new Date(n.createdAt) >= last24h
        );
        
        const weeklyNotifications = notifications.filter(n => 
            new Date(n.createdAt) >= last7d
        );
        
        return {
            total: notifications.length,
            recent: recentNotifications.length,
            weekly: weeklyNotifications.length,
            byStatus: this.groupBy(notifications, 'status'),
            byPriority: this.groupBy(notifications, 'priority'),
            byChannel: this.groupByChannels(notifications),
            successRate: this.calculateSuccessRate(notifications),
            averageDeliveryTime: this.calculateAverageDeliveryTime(notifications),
            contextAnalysis: {
                enabled: this.config.contextAnalysis,
                totalAnalyzed: notifications.filter(n => n.context.analyzed).length,
                accuracy: this.contextAnalyzer.getAccuracy()
            },
            intelligentRouting: {
                enabled: this.config.intelligentRouting,
                totalRouted: notifications.filter(n => n.metadata.intelligentRouting).length,
                efficiency: this.intelligentRouter.getEfficiency()
            }
        };
    }

    /**
     * Get available channels
     */
    getAvailableChannels() {
        return this.notificationEngine.getAvailableChannels();
    }

    /**
     * Test a notification channel
     */
    async testChannel(channel, testData) {
        return await this.notificationEngine.testChannel(channel, testData);
    }

    /**
     * Get notification templates
     */
    getTemplates() {
        return this.notificationEngine.getTemplates();
    }

    /**
     * Create notification template
     */
    createTemplate(template) {
        return this.notificationEngine.createTemplate(template);
    }

    /**
     * Get notification rules
     */
    getNotificationRules() {
        return this.intelligentRouter.getRules();
    }

    /**
     * Create notification rule
     */
    createNotificationRule(rule) {
        return this.intelligentRouter.createRule(rule);
    }

    /**
     * Get active channels
     */
    getActiveChannels() {
        return this.notificationEngine.getActiveChannels();
    }

    /**
     * Subscribe to real-time notifications
     */
    subscribeToNotifications(ws, userId) {
        if (!this.activeSubscriptions.has(ws)) {
            this.activeSubscriptions.set(ws, new Set());
        }
        this.activeSubscriptions.get(ws).add(userId);
    }

    /**
     * Unsubscribe from notifications
     */
    unsubscribeFromNotifications(ws, userId) {
        if (userId) {
            const subscriptions = this.activeSubscriptions.get(ws);
            if (subscriptions) {
                subscriptions.delete(userId);
            }
        } else {
            this.activeSubscriptions.delete(ws);
        }
    }

    /**
     * Broadcast to WebSocket subscribers
     */
    broadcastToSubscribers(notification) {
        for (const [ws, userIds] of this.activeSubscriptions) {
            if (ws.readyState === ws.OPEN) {
                const relevantUsers = notification.recipients
                    .filter(r => userIds.has(r.id))
                    .map(r => r.id);
                
                if (relevantUsers.length > 0) {
                    ws.send(JSON.stringify({
                        type: 'notification',
                        notification: {
                            id: notification.id,
                            event: notification.event,
                            priority: notification.priority,
                            status: notification.status,
                            createdAt: notification.createdAt
                        }
                    }));
                }
            }
        }
    }

    /**
     * Store notification
     */
    storeNotification(notification) {
        this.notificationQueue.push(notification);
        
        // Keep only last 1000 notifications to prevent memory issues
        if (this.notificationQueue.length > 1000) {
            this.notificationQueue = this.notificationQueue.slice(-1000);
        }
    }

    /**
     * Start background processes
     */
    startBackgroundProcesses() {
        // Process notification queue
        setInterval(() => {
            this.processNotificationQueue();
        }, 5000);
        
        // Update context analysis
        if (this.config.contextAnalysis) {
            setInterval(() => {
                this.contextAnalyzer.updateAnalysis();
            }, this.config.context.analysisInterval || 60000);
        }
        
        // Clean up old notifications
        setInterval(() => {
            this.cleanupOldNotifications();
        }, 300000); // 5 minutes
    }

    /**
     * Process notification queue
     */
    async processNotificationQueue() {
        const pendingNotifications = this.notificationQueue.filter(n => 
            n.status === 'pending' && new Date(n.scheduledFor) <= new Date()
        );
        
        for (const notification of pendingNotifications) {
            try {
                await this.notificationEngine.send(notification);
                notification.status = 'sent';
                notification.sentAt = new Date();
            } catch (error) {
                notification.status = 'failed';
                notification.error = error.message;
            }
        }
    }

    /**
     * Clean up old notifications
     */
    cleanupOldNotifications() {
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        this.notificationQueue = this.notificationQueue.filter(n => 
            new Date(n.createdAt) > cutoffDate
        );
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Group notifications by field
     */
    groupBy(notifications, field) {
        return notifications.reduce((groups, notification) => {
            const value = notification[field];
            groups[value] = (groups[value] || 0) + 1;
            return groups;
        }, {});
    }

    /**
     * Group notifications by channels
     */
    groupByChannels(notifications) {
        const channelCounts = {};
        notifications.forEach(notification => {
            notification.channels.forEach(channel => {
                channelCounts[channel] = (channelCounts[channel] || 0) + 1;
            });
        });
        return channelCounts;
    }

    /**
     * Calculate success rate
     */
    calculateSuccessRate(notifications) {
        if (notifications.length === 0) return 0;
        const successful = notifications.filter(n => n.status === 'sent').length;
        return successful / notifications.length;
    }

    /**
     * Calculate average delivery time
     */
    calculateAverageDeliveryTime(notifications) {
        const sentNotifications = notifications.filter(n => 
            n.status === 'sent' && n.sentAt
        );
        
        if (sentNotifications.length === 0) return 0;
        
        const totalTime = sentNotifications.reduce((sum, n) => {
            const deliveryTime = new Date(n.sentAt) - new Date(n.createdAt);
            return sum + deliveryTime;
        }, 0);
        
        return totalTime / sentNotifications.length;
    }

    /**
     * Stop the notification system
     */
    stop() {
        this.isRunning = false;
        this.notificationEngine.stop();
        this.contextAnalyzer.stop();
        this.intelligentRouter.stop();
    }
}

module.exports = IntegratedNotificationSystem;
