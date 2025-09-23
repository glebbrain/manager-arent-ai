/**
 * Task Distribution Service Server
 * Express server for automatic task distribution
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const IntegratedDistributionSystem = require('./integrated-distribution-system');

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

// Initialize integrated distribution system
const distributionSystem = new IntegratedDistributionSystem({
    distribution: {
        workloadThreshold: 0.8,
        balanceThreshold: 0.2,
        learningWeight: 0.3,
        efficiencyWeight: 0.7,
        aiWeight: 0.4
    },
    notifications: {
        defaultChannels: ['email', 'in-app', 'slack'],
        batchInterval: 30000
    },
    monitoring: {
        monitoringInterval: 60000,
        alertCooldown: 300000
    },
    autoDistribution: true,
    notificationEnabled: true,
    monitoringEnabled: true
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
        service: 'task-distribution',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.post('/api/developers', (req, res) => {
    try {
        const developer = req.body;
        const developerId = distributionSystem.registerDeveloper(developer);
        
        res.json({
            success: true,
            developerId,
            message: 'Developer registered successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error registering developer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register developer',
            message: error.message
        });
    }
});

app.post('/api/tasks', (req, res) => {
    try {
        const task = req.body;
        const taskId = distributionSystem.registerTask(task);
        
        res.json({
            success: true,
            taskId,
            message: 'Task registered successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error registering task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register task',
            message: error.message
        });
    }
});

app.post('/api/distribute', async (req, res) => {
    try {
        const { strategy, options = {} } = req.body;
        const result = await distributionSystem.distributeTasks({ strategy, ...options });
        
        res.json({
            success: result.success,
            message: result.message,
            distribution: result.distribution,
            summary: result.summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error distributing tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to distribute tasks',
            message: error.message
        });
    }
});

app.get('/api/developers', (req, res) => {
    try {
        const developers = Array.from(distributionSystem.distributionEngine.developers.values()).map(dev => ({
            id: dev.id,
            name: dev.name,
            email: dev.email,
            skills: dev.skills,
            currentWorkload: dev.currentWorkload,
            availability: dev.availability,
            performance: dev.performance
        }));
        
        res.json({
            success: true,
            developers,
            count: developers.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting developers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get developers',
            message: error.message
        });
    }
});

app.get('/api/tasks', (req, res) => {
    try {
        const { assigned, unassigned } = req.query;
        let tasks = Array.from(distributionSystem.distributionEngine.tasks.values());
        
        if (assigned === 'true') {
            tasks = tasks.filter(task => task.assignedTo);
        } else if (unassigned === 'true') {
            tasks = tasks.filter(task => !task.assignedTo);
        }
        
        res.json({
            success: true,
            tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                complexity: task.complexity,
                estimatedHours: task.estimatedHours,
                assignedTo: task.assignedTo,
                assignedAt: task.assignedAt,
                estimatedCompletion: task.estimatedCompletion
            })),
            count: tasks.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get tasks',
            message: error.message
        });
    }
});

app.get('/api/analytics', (req, res) => {
    try {
        const analytics = distributionSystem.getAnalytics();
        
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

// New API endpoints for enhanced functionality
app.post('/api/projects', (req, res) => {
    try {
        const project = req.body;
        const projectId = distributionSystem.registerProject(project);
        
        res.json({
            success: true,
            projectId,
            message: 'Project registered successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error registering project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register project',
            message: error.message
        });
    }
});

app.put('/api/tasks/:taskId/status', (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, data } = req.body;
        
        const success = distributionSystem.updateTaskStatus(taskId, status, data);
        
        if (success) {
            res.json({
                success: true,
                message: 'Task status updated successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Task not found',
                message: 'Task with the specified ID was not found'
            });
        }
    } catch (error) {
        logger.error('Error updating task status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update task status',
            message: error.message
        });
    }
});

app.get('/api/developers/:developerId/workload', (req, res) => {
    try {
        const { developerId } = req.params;
        const workload = distributionSystem.getDeveloperWorkload(developerId);
        
        if (workload) {
            res.json({
                success: true,
                workload,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Developer not found',
                message: 'Developer with the specified ID was not found'
            });
        }
    } catch (error) {
        logger.error('Error getting developer workload:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve developer workload',
            message: error.message
        });
    }
});

app.get('/api/system/status', (req, res) => {
    try {
        const status = distributionSystem.getSystemStatus();
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

app.get('/api/history', (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const history = distributionSystem.getDistributionHistory(parseInt(limit));
        
        res.json({
            success: true,
            history,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting distribution history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve distribution history',
            message: error.message
        });
    }
});

app.post('/api/optimize', async (req, res) => {
    try {
        await distributionSystem.optimizeDistribution();
        
        res.json({
            success: true,
            message: 'Distribution optimized successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error optimizing distribution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to optimize distribution',
            message: error.message
        });
    }
});

app.get('/api/skills', (req, res) => {
    try {
        const skills = {};
        for (const [skill, developers] of distributionSystem.distributionEngine.skillsMatrix) {
            skills[skill] = Array.from(developers);
        }
        
        res.json({
            success: true,
            skills,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting skills matrix:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get skills matrix',
            message: error.message
        });
    }
});

app.put('/api/developers/:developerId/workload', (req, res) => {
    try {
        const { developerId } = req.params;
        const { workload } = req.body;
        
        const developer = distributionSystem.distributionEngine.developers.get(developerId);
        if (!developer) {
            return res.status(404).json({
                success: false,
                error: 'Developer not found'
            });
        }
        
        developer.currentWorkload = workload;
        
        res.json({
            success: true,
            message: 'Developer workload updated successfully',
            developer: {
                id: developer.id,
                name: developer.name,
                currentWorkload: developer.currentWorkload
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error updating developer workload:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update developer workload',
            message: error.message
        });
    }
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
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Task Distribution Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Workload threshold: ${distributionSystem.distributionEngine.workloadThreshold}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
