/**
 * Automatic Sprint Planning Service Server
 * Express server for AI-powered sprint planning
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const IntegratedSprintPlanningSystem = require('./integrated-sprint-planning-system');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3011;

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

// Initialize integrated sprint planning system
const sprintPlanningSystem = new IntegratedSprintPlanningSystem({
    planning: {
        sprintDuration: 14, // days
        workingDaysPerWeek: 5,
        workingHoursPerDay: 8,
        capacityBuffer: 0.2, // 20% buffer
        velocityWindow: 3, // sprints
        confidenceThreshold: 0.7
    },
    ai: {
        modelType: 'ensemble',
        learningRate: 0.01,
        adaptationRate: 0.1,
        predictionAccuracy: 0.8,
        contextWindow: 30 // days
    },
    optimization: {
        maxIterations: 1000,
        convergenceThreshold: 0.001,
        geneticAlgorithm: true,
        simulatedAnnealing: true,
        particleSwarm: true
    },
    autoPlanning: true,
    aiEnabled: true,
    optimizationEnabled: true
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
        service: 'sprint-planning',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.post('/api/plan-sprint', async (req, res) => {
    try {
        const { 
            projectId, 
            teamId, 
            sprintNumber, 
            startDate, 
            endDate, 
            goals, 
            constraints = {},
            options = {}
        } = req.body;
        
        if (!projectId || !teamId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId, teamId, startDate, and endDate are required'
            });
        }
        
        const sprintPlan = await sprintPlanningSystem.planSprint({
            projectId,
            teamId,
            sprintNumber,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            goals,
            constraints,
            options
        });
        
        res.json({
            success: true,
            sprintPlan,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error planning sprint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to plan sprint',
            message: error.message
        });
    }
});

app.post('/api/optimize-sprint', async (req, res) => {
    try {
        const { sprintPlanId, optimizationType = 'comprehensive' } = req.body;
        
        if (!sprintPlanId) {
            return res.status(400).json({
                success: false,
                error: 'SprintPlanId is required'
            });
        }
        
        const optimizedPlan = await sprintPlanningSystem.optimizeSprint(sprintPlanId, optimizationType);
        
        res.json({
            success: true,
            optimizedPlan,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error optimizing sprint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to optimize sprint',
            message: error.message
        });
    }
});

app.get('/api/sprints', (req, res) => {
    try {
        const { projectId, teamId, status, limit = 50, offset = 0 } = req.query;
        
        const sprints = sprintPlanningSystem.getSprints({
            projectId,
            teamId,
            status,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            success: true,
            sprints,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting sprints:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get sprints',
            message: error.message
        });
    }
});

app.get('/api/sprints/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        const sprint = sprintPlanningSystem.getSprint(id);
        
        if (!sprint) {
            return res.status(404).json({
                success: false,
                error: 'Sprint not found'
            });
        }
        
        res.json({
            success: true,
            sprint,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting sprint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get sprint',
            message: error.message
        });
    }
});

app.put('/api/sprints/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const updatedSprint = await sprintPlanningSystem.updateSprint(id, updates);
        
        if (!updatedSprint) {
            return res.status(404).json({
                success: false,
                error: 'Sprint not found'
            });
        }
        
        res.json({
            success: true,
            sprint: updatedSprint,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error updating sprint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update sprint',
            message: error.message
        });
    }
});

app.post('/api/sprints/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await sprintPlanningSystem.executeSprint(id);
        
        res.json({
            success: true,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error executing sprint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute sprint',
            message: error.message
        });
    }
});

app.get('/api/analytics', (req, res) => {
    try {
        const analytics = sprintPlanningSystem.getAnalytics();
        
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

app.get('/api/velocity', (req, res) => {
    try {
        const { teamId, projectId, sprintCount = 5 } = req.query;
        
        const velocity = sprintPlanningSystem.getVelocity(teamId, projectId, parseInt(sprintCount));
        
        res.json({
            success: true,
            velocity,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting velocity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get velocity',
            message: error.message
        });
    }
});

app.get('/api/capacity', (req, res) => {
    try {
        const { teamId, startDate, endDate } = req.query;
        
        if (!teamId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'TeamId, startDate, and endDate are required'
            });
        }
        
        const capacity = sprintPlanningSystem.getTeamCapacity(teamId, new Date(startDate), new Date(endDate));
        
        res.json({
            success: true,
            capacity,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting capacity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get capacity',
            message: error.message
        });
    }
});

app.post('/api/simulate', async (req, res) => {
    try {
        const { 
            projectId, 
            teamId, 
            sprintCount = 1, 
            simulationType = 'monte_carlo',
            options = {}
        } = req.body;
        
        if (!projectId || !teamId) {
            return res.status(400).json({
                success: false,
                error: 'ProjectId and teamId are required'
            });
        }
        
        const simulation = await sprintPlanningSystem.simulateSprints({
            projectId,
            teamId,
            sprintCount,
            simulationType,
            options
        });
        
        res.json({
            success: true,
            simulation,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error simulating sprints:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to simulate sprints',
            message: error.message
        });
    }
});

app.get('/api/templates', (req, res) => {
    try {
        const templates = sprintPlanningSystem.getTemplates();
        
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
        
        const created = sprintPlanningSystem.createTemplate(template);
        
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

app.get('/api/system/status', (req, res) => {
    try {
        const status = {
            isRunning: sprintPlanningSystem.isRunning,
            lastUpdate: sprintPlanningSystem.lastUpdate,
            activeSprints: sprintPlanningSystem.getActiveSprints().length,
            plannedSprints: sprintPlanningSystem.getPlannedSprints().length,
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
    logger.info(`Sprint Planning Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`AI Planning enabled: ${sprintPlanningSystem.config.aiEnabled}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    sprintPlanningSystem.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    sprintPlanningSystem.stop();
    process.exit(0);
});

module.exports = app;
