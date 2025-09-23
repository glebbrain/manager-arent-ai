/**
 * Smart Notification System for Task Distribution
 * Provides intelligent notifications for task assignments and updates
 */

class SmartNotificationSystem {
    constructor(options = {}) {
        this.notifications = new Map();
        this.subscribers = new Map();
        this.preferences = new Map();
        this.channels = new Map();
        this.templates = new Map();
        
        // Configuration
        this.defaultChannels = options.defaultChannels || ['email', 'in-app', 'slack'];
        this.batchInterval = options.batchInterval || 30000; // 30 seconds
        this.priorityThresholds = options.priorityThresholds || {
            'critical': 0.9,
            'high': 0.7,
            'medium': 0.5,
            'low': 0.3
        };
        
        // Initialize notification channels
        this.initializeChannels();
        this.initializeTemplates();
        
        // Start batch processing
        this.startBatchProcessing();
    }

    /**
     * Initialize notification channels
     */
    initializeChannels() {
        this.channels.set('email', {
            name: 'Email',
            enabled: true,
            priority: 1,
            config: {
                smtp: process.env.SMTP_SERVER,
                from: process.env.EMAIL_FROM
            }
        });
        
        this.channels.set('in-app', {
            name: 'In-App',
            enabled: true,
            priority: 2,
            config: {
                websocket: process.env.WEBSOCKET_URL
            }
        });
        
        this.channels.set('slack', {
            name: 'Slack',
            enabled: true,
            priority: 3,
            config: {
                webhook: process.env.SLACK_WEBHOOK,
                channel: process.env.SLACK_CHANNEL
            }
        });
        
        this.channels.set('sms', {
            name: 'SMS',
            enabled: false,
            priority: 4,
            config: {
                provider: process.env.SMS_PROVIDER,
                apiKey: process.env.SMS_API_KEY
            }
        });
    }

    /**
     * Initialize notification templates
     */
    initializeTemplates() {
        this.templates.set('task-assigned', {
            subject: 'New Task Assigned: {{taskTitle}}',
            body: `
                <h2>New Task Assignment</h2>
                <p>Hello {{developerName}},</p>
                <p>You have been assigned a new task:</p>
                <ul>
                    <li><strong>Task:</strong> {{taskTitle}}</li>
                    <li><strong>Project:</strong> {{projectName}}</li>
                    <li><strong>Priority:</strong> {{priority}}</li>
                    <li><strong>Estimated Hours:</strong> {{estimatedHours}}</li>
                    <li><strong>Deadline:</strong> {{deadline}}</li>
                </ul>
                <p>Please review the task details and start working on it.</p>
                <p>Best regards,<br>ManagerAgentAI</p>
            `,
            channels: ['email', 'in-app']
        });
        
        this.templates.set('task-updated', {
            subject: 'Task Updated: {{taskTitle}}',
            body: `
                <h2>Task Update</h2>
                <p>Hello {{developerName}},</p>
                <p>Your task has been updated:</p>
                <ul>
                    <li><strong>Task:</strong> {{taskTitle}}</li>
                    <li><strong>Changes:</strong> {{changes}}</li>
                    <li><strong>Updated By:</strong> {{updatedBy}}</li>
                </ul>
            `,
            channels: ['in-app']
        });
        
        this.templates.set('deadline-reminder', {
            subject: 'Deadline Reminder: {{taskTitle}}',
            body: `
                <h2>Deadline Reminder</h2>
                <p>Hello {{developerName}},</p>
                <p>This is a reminder that your task is due soon:</p>
                <ul>
                    <li><strong>Task:</strong> {{taskTitle}}</li>
                    <li><strong>Deadline:</strong> {{deadline}}</li>
                    <li><strong>Time Remaining:</strong> {{timeRemaining}}</li>
                </ul>
                <p>Please ensure you complete the task on time.</p>
            `,
            channels: ['email', 'in-app', 'slack']
        });
        
        this.templates.set('workload-warning', {
            subject: 'Workload Warning',
            body: `
                <h2>Workload Warning</h2>
                <p>Hello {{developerName}},</p>
                <p>Your current workload is {{workloadPercentage}}% of your capacity.</p>
                <p>Consider discussing workload distribution with your manager.</p>
            `,
            channels: ['in-app']
        });
    }

    /**
     * Subscribe to notifications
     */
    subscribe(userId, preferences = {}) {
        this.subscribers.set(userId, {
            userId,
            channels: preferences.channels || this.defaultChannels,
            frequency: preferences.frequency || 'immediate',
            quietHours: preferences.quietHours || { start: 22, end: 8 },
            preferences: preferences
        });
        
        this.preferences.set(userId, preferences);
    }

    /**
     * Send notification
     */
    async sendNotification(notification) {
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store notification
        this.notifications.set(notificationId, {
            id: notificationId,
            ...notification,
            createdAt: new Date(),
            status: 'pending'
        });
        
        // Process notification
        await this.processNotification(notificationId);
        
        return notificationId;
    }

    /**
     * Process notification
     */
    async processNotification(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification) return;
        
        try {
            // Determine channels based on priority and user preferences
            const channels = this.selectChannels(notification);
            
            // Send to each channel
            for (const channelName of channels) {
                await this.sendToChannel(notification, channelName);
            }
            
            // Update status
            notification.status = 'sent';
            notification.sentAt = new Date();
            
        } catch (error) {
            notification.status = 'failed';
            notification.error = error.message;
            console.error('Notification failed:', error);
        }
    }

    /**
     * Select appropriate channels for notification
     */
    selectChannels(notification) {
        const channels = [];
        const priority = notification.priority || 'medium';
        const threshold = this.priorityThresholds[priority];
        
        // Get user preferences
        const userPrefs = this.preferences.get(notification.userId);
        const userChannels = userPrefs?.channels || this.defaultChannels;
        
        // Select channels based on priority
        for (const channelName of userChannels) {
            const channel = this.channels.get(channelName);
            if (channel && channel.enabled && channel.priority <= threshold) {
                channels.push(channelName);
            }
        }
        
        return channels;
    }

    /**
     * Send notification to specific channel
     */
    async sendToChannel(notification, channelName) {
        const channel = this.channels.get(channelName);
        if (!channel || !channel.enabled) return;
        
        switch (channelName) {
            case 'email':
                await this.sendEmail(notification);
                break;
            case 'in-app':
                await this.sendInApp(notification);
                break;
            case 'slack':
                await this.sendSlack(notification);
                break;
            case 'sms':
                await this.sendSMS(notification);
                break;
        }
    }

    /**
     * Send email notification
     */
    async sendEmail(notification) {
        const template = this.templates.get(notification.type);
        if (!template) return;
        
        const content = this.renderTemplate(template, notification.data);
        
        // Simulate email sending
        console.log(`Email sent to ${notification.userId}: ${content.subject}`);
        
        // In real implementation, use email service like SendGrid, AWS SES, etc.
        // await emailService.send({
        //     to: notification.userId,
        //     subject: content.subject,
        //     html: content.body
        // });
    }

    /**
     * Send in-app notification
     */
    async sendInApp(notification) {
        const template = this.templates.get(notification.type);
        if (!template) return;
        
        const content = this.renderTemplate(template, notification.data);
        
        // Simulate in-app notification
        console.log(`In-app notification for ${notification.userId}: ${content.subject}`);
        
        // In real implementation, use WebSocket or push notification service
        // await websocketService.send(notification.userId, {
        //     type: 'notification',
        //     data: content
        // });
    }

    /**
     * Send Slack notification
     */
    async sendSlack(notification) {
        const template = this.templates.get(notification.type);
        if (!template) return;
        
        const content = this.renderTemplate(template, notification.data);
        
        // Simulate Slack notification
        console.log(`Slack notification: ${content.subject}`);
        
        // In real implementation, use Slack webhook
        // await fetch(channel.config.webhook, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         text: content.subject,
        //         blocks: this.formatSlackBlocks(content)
        //     })
        // });
    }

    /**
     * Send SMS notification
     */
    async sendSMS(notification) {
        const template = this.templates.get(notification.type);
        if (!template) return;
        
        const content = this.renderTemplate(template, notification.data);
        
        // Simulate SMS sending
        console.log(`SMS sent to ${notification.userId}: ${content.subject}`);
        
        // In real implementation, use SMS service like Twilio
        // await smsService.send({
        //     to: notification.userId,
        //     message: content.body
        // });
    }

    /**
     * Render template with data
     */
    renderTemplate(template, data) {
        let subject = template.subject;
        let body = template.body;
        
        // Replace placeholders
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            subject = subject.replace(new RegExp(placeholder, 'g'), value || '');
            body = body.replace(new RegExp(placeholder, 'g'), value || '');
        }
        
        return { subject, body };
    }

    /**
     * Start batch processing for notifications
     */
    startBatchProcessing() {
        setInterval(() => {
            this.processBatchNotifications();
        }, this.batchInterval);
    }

    /**
     * Process batch notifications
     */
    async processBatchNotifications() {
        const pendingNotifications = Array.from(this.notifications.values())
            .filter(n => n.status === 'pending');
        
        if (pendingNotifications.length === 0) return;
        
        // Group by user and type
        const grouped = this.groupNotificationsByUser(pendingNotifications);
        
        // Process each group
        for (const [userId, notifications] of grouped) {
            await this.processUserNotificationBatch(userId, notifications);
        }
    }

    /**
     * Group notifications by user
     */
    groupNotificationsByUser(notifications) {
        const grouped = new Map();
        
        for (const notification of notifications) {
            const userId = notification.userId;
            if (!grouped.has(userId)) {
                grouped.set(userId, []);
            }
            grouped.get(userId).push(notification);
        }
        
        return grouped;
    }

    /**
     * Process batch notifications for a user
     */
    async processUserNotificationBatch(userId, notifications) {
        const userPrefs = this.preferences.get(userId);
        const frequency = userPrefs?.frequency || 'immediate';
        
        if (frequency === 'immediate') {
            // Send each notification immediately
            for (const notification of notifications) {
                await this.processNotification(notification.id);
            }
        } else if (frequency === 'batched') {
            // Send as a single batch notification
            await this.sendBatchNotification(userId, notifications);
        }
    }

    /**
     * Send batch notification
     */
    async sendBatchNotification(userId, notifications) {
        const batchData = {
            userId,
            type: 'batch',
            data: {
                count: notifications.length,
                notifications: notifications.map(n => ({
                    type: n.type,
                    title: n.data.taskTitle || 'Task Update',
                    timestamp: n.createdAt
                }))
            },
            priority: 'medium'
        };
        
        await this.sendNotification(batchData);
        
        // Mark individual notifications as sent
        for (const notification of notifications) {
            notification.status = 'sent';
            notification.sentAt = new Date();
        }
    }

    /**
     * Get notification history for user
     */
    getNotificationHistory(userId, limit = 50) {
        return Array.from(this.notifications.values())
            .filter(n => n.userId === userId)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    /**
     * Mark notification as read
     */
    markAsRead(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (notification) {
            notification.readAt = new Date();
            notification.status = 'read';
        }
    }

    /**
     * Get notification statistics
     */
    getNotificationStats() {
        const notifications = Array.from(this.notifications.values());
        
        return {
            total: notifications.length,
            sent: notifications.filter(n => n.status === 'sent').length,
            pending: notifications.filter(n => n.status === 'pending').length,
            failed: notifications.filter(n => n.status === 'failed').length,
            read: notifications.filter(n => n.status === 'read').length,
            byType: this.groupByType(notifications),
            byChannel: this.groupByChannel(notifications)
        };
    }

    /**
     * Group notifications by type
     */
    groupByType(notifications) {
        const grouped = {};
        for (const notification of notifications) {
            const type = notification.type;
            grouped[type] = (grouped[type] || 0) + 1;
        }
        return grouped;
    }

    /**
     * Group notifications by channel
     */
    groupByChannel(notifications) {
        const grouped = {};
        for (const notification of notifications) {
            const channels = notification.channels || [];
            for (const channel of channels) {
                grouped[channel] = (grouped[channel] || 0) + 1;
            }
        }
        return grouped;
    }
}

module.exports = SmartNotificationSystem;
