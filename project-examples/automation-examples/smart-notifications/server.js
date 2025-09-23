/**
 * Smart Notifications Service Server
 * Express server for contextual notifications about important events
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const WebSocket = require('ws');

const IntegratedNotificationSystem = require('./integrated-notification-system');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3010;

// Configure logging
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

// Initialize integrated notification system
const notificationSystem = new IntegratedNotificationSystem({
    notification: {
        channels: ['email', 'slack', 'webhook', 'push', 'sms'],
        priorityLevels: ['low', 'medium', 'high', 'critical'],
        deliveryTimeout: 30000,
        retryAttempts: 3,
        batchSize: 100
    },
    context: {
        analysisInterval: 60000,
        contextWindow: 300000,
        learningRate: 0.1,
        confidenceThreshold: 0.7
    },
    routing: {
        intelligentRouting: true,
        userPreferences: true,
        escalationRules: true,
        deduplication: true
    },
    autoNotification: true,
    contextAnalysis: true,
    intelligentRouting: true
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'smart-notifications',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.post('/api/notify', async (req, res) => {
    try {
        const { event, context, recipients, priority = 'medium', channels = ['email'] } = req.body;
        
        if (!event || !context) {
            return res.status(400).json({
                success: false,
                error: 'Event and context are required'
            });
        }
        
        const notification = await notificationSystem.sendNotification(event, context, {
            recipients,
            priority,
            channels
        });
        
        res.json({
            success: true,
            notification,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error sending notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send notification',
            message: error.message
        });
    }
});

app.post('/api/batch-notify', async (req, res) => {
    try {
        const { notifications } = req.body;
        
        if (!notifications || !Array.isArray(notifications)) {
            return res.status(400).json({
                success: false,
                error: 'Notifications array is required'
            });
        }
        
        const results = await notificationSystem.sendBatchNotifications(notifications);
        
        res.json({
            success: true,
            results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error sending batch notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send batch notifications',
            message: error.message
        });
    }
});

app.get('/api/notifications', (req, res) => {
    try {
        const { userId, status, priority, limit = 50, offset = 0 } = req.query;
        
        const notifications = notificationSystem.getNotifications({
            userId,
            status,
            priority,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            success: true,
            notifications,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notifications',
            message: error.message
        });
    }
});

app.put('/api/notifications/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const updated = notificationSystem.updateNotificationStatus(id, status);
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Notification status updated',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error updating notification status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notification status',
            message: error.message
        });
    }
});

app.get('/api/analytics', (req, res) => {
    try {
        const analytics = notificationSystem.getAnalytics();
        
        res.json({
            success: true,
            analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get analytics',
            message: error.message
        });
    }
});

app.get('/api/channels', (req, res) => {
    try {
        const channels = notificationSystem.getAvailableChannels();
        
        res.json({
            success: true,
            channels,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting channels:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get channels',
            message: error.message
        });
    }
});

app.post('/api/channels/:channel/test', (req, res) => {
    try {
        const { channel } = req.params;
        const { testData } = req.body;
        
        const result = notificationSystem.testChannel(channel, testData);
        
        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error testing channel:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test channel',
            message: error.message
        });
    }
});

app.get('/api/templates', (req, res) => {
    try {
        const templates = notificationSystem.getTemplates();
        
        res.json({
            success: true,
            templates,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get templates',
            message: error.message
        });
    }
});

app.post('/api/templates', (req, res) => {
    try {
        const { template } = req.body;
        
        const created = notificationSystem.createTemplate(template);
        
        res.json({
            success: true,
            template: created,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error creating template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create template',
            message: error.message
        });
    }
});

app.get('/api/rules', (req, res) => {
    try {
        const rules = notificationSystem.getNotificationRules();
        
        res.json({
            success: true,
            rules,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting rules:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get rules',
            message: error.message
        });
    }
});

app.post('/api/rules', (req, res) => {
    try {
        const { rule } = req.body;
        
        const created = notificationSystem.createNotificationRule(rule);
        
        res.json({
            success: true,
            rule: created,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error creating rule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create rule',
            message: error.message
        });
    }
});

app.get('/api/system/status', (req, res) => {
    try {
        const status = {
            isRunning: notificationSystem.isRunning,
            lastUpdate: notificationSystem.lastUpdate,
            queueLength: notificationSystem.notificationQueue.length,
            activeChannels: notificationSystem.getActiveChannels().length,
            uptime: process.uptime()
        };
        
        res.json({
            success: true,
            status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting system status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve system status',
            message: error.message
        });
    }
});

// WebSocket for real-time notifications
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    logger.info('New WebSocket connection established');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'subscribe') {
                notificationSystem.subscribeToNotifications(ws, data.userId);
            } else if (data.type === 'unsubscribe') {
                notificationSystem.unsubscribeFromNotifications(ws, data.userId);
            }
        } catch (error) {
            logger.error('Error processing WebSocket message:', error);
        }
    });
    
    ws.on('close', () => {
        logger.info('WebSocket connection closed');
        notificationSystem.unsubscribeFromNotifications(ws);
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Smart Notifications Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`WebSocket server enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    notificationSystem.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    notificationSystem.stop();
    process.exit(0);
});

module.exports = app;
