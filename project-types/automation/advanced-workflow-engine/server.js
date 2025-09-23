const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const compression = require('compression');
const winston = require('winston');
const axios = require('axios');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const cron = require('node-cron');
const Bull = require('bull');
const Redis = require('ioredis');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const yaml = require('yaml');
const xml2js = require('xml2js');
const csv = require('csv-parser');
const XLSX = require('xlsx');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3019;

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: 'logs/workflow-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/workflow-combined.log' })
    ]
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // allow 100 requests per 15 minutes, then...
    delayMs: 500 // begin adding 500ms of delay per request above 100
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /json|yaml|yml|xml|bpmn|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        
        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only JSON, YAML, XML, BPMN, and TXT files are allowed'));
        }
    }
});

// Advanced Workflow Engine Configuration v2.7.0
const workflowConfig = {
    version: '2.7.0',
    features: {
        workflowDesign: true,
        workflowExecution: true,
        workflowMonitoring: true,
        workflowScheduling: true,
        workflowVersioning: true,
        workflowTemplates: true,
        workflowCollaboration: true,
        workflowAnalytics: true,
        workflowOptimization: true,
        workflowIntegration: true,
        workflowSecurity: true,
        workflowCompliance: true,
        workflowAuditing: true,
        workflowReporting: true,
        workflowAutomation: true
    },
    supportedFormats: {
        workflow: ['json', 'yaml', 'xml', 'bpmn'],
        data: ['json', 'csv', 'xlsx', 'xml', 'txt']
    },
    workflowTypes: {
        sequential: 'Sequential workflow execution',
        parallel: 'Parallel workflow execution',
        conditional: 'Conditional workflow execution',
        loop: 'Loop-based workflow execution',
        event: 'Event-driven workflow execution',
        state: 'State machine workflow execution',
        hybrid: 'Hybrid workflow execution'
    },
    taskTypes: {
        api: 'API call task',
        script: 'Script execution task',
        data: 'Data processing task',
        decision: 'Decision making task',
        notification: 'Notification task',
        approval: 'Approval task',
        integration: 'System integration task',
        ai: 'AI/ML processing task',
        human: 'Human task',
        timer: 'Timer task',
        condition: 'Conditional task',
        loop: 'Loop task',
        parallel: 'Parallel task',
        subprocess: 'Subprocess task'
    },
    limits: {
        maxWorkflows: 1000,
        maxTasksPerWorkflow: 100,
        maxConcurrentExecutions: 100,
        maxExecutionTime: 24 * 60 * 60 * 1000, // 24 hours
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxWorkflowDepth: 10
    }
};

// Initialize Redis for job queues
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize job queues
const workflowQueue = new Bull('workflow execution', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    }
});

// Workflow Engine Data Storage
let workflowData = {
    workflows: new Map(),
    executions: new Map(),
    templates: new Map(),
    analytics: {
        totalWorkflows: 0,
        totalExecutions: 0,
        totalTasks: 0,
        averageExecutionTime: 0,
        successRate: 0,
        errorRate: 0
    },
    performance: {
        executionTimes: [],
        taskTimes: [],
        errorRates: [],
        throughput: []
    }
};

// Utility Functions
function generateWorkflowId() {
    return uuidv4();
}

function generateExecutionId() {
    return uuidv4();
}

function updateAnalytics(executionType, duration, success, taskCount = 0) {
    workflowData.analytics.totalExecutions++;
    
    if (executionType === 'workflow') {
        workflowData.analytics.totalWorkflows++;
    }
    
    if (taskCount > 0) {
        workflowData.analytics.totalTasks += taskCount;
    }
    
    // Update performance metrics
    workflowData.performance.executionTimes.push(duration);
    
    if (success) {
        workflowData.analytics.successRate = (workflowData.analytics.successRate * (workflowData.analytics.totalExecutions - 1) + 1) / workflowData.analytics.totalExecutions;
    } else {
        workflowData.analytics.errorRate = (workflowData.analytics.errorRate * (workflowData.analytics.totalExecutions - 1) + 1) / workflowData.analytics.totalExecutions;
    }
    
    // Calculate average execution time
    const totalExecutionTime = workflowData.performance.executionTimes.reduce((a, b) => a + b, 0);
    workflowData.analytics.averageExecutionTime = totalExecutionTime / workflowData.performance.executionTimes.length;
}

// Workflow Engine Functions
class WorkflowEngine {
    constructor() {
        this.workflows = new Map();
        this.executions = new Map();
        this.tasks = new Map();
        this.schedules = new Map();
    }
    
    async createWorkflow(workflowData) {
        const workflowId = generateWorkflowId();
        const workflow = {
            id: workflowId,
            name: workflowData.name,
            description: workflowData.description,
            type: workflowData.type || 'sequential',
            version: '1.0.0',
            status: 'draft',
            tasks: workflowData.tasks || [],
            connections: workflowData.connections || [],
            variables: workflowData.variables || {},
            settings: workflowData.settings || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: workflowData.createdBy || 'system'
        };
        
        this.workflows.set(workflowId, workflow);
        return workflow;
    }
    
    async executeWorkflow(workflowId, inputData = {}, options = {}) {
        const executionId = generateExecutionId();
        const startTime = Date.now();
        
        try {
            const workflow = this.workflows.get(workflowId);
            if (!workflow) {
                throw new Error('Workflow not found');
            }
            
            // Create execution record
            const execution = {
                id: executionId,
                workflowId,
                status: 'running',
                startTime: new Date().toISOString(),
                inputData,
                outputData: {},
                tasks: [],
                logs: [],
                progress: 0,
                error: null
            };
            
            this.executions.set(executionId, execution);
            
            // Execute workflow
            const result = await this.executeWorkflowTasks(workflow, execution, inputData, options);
            
            // Update execution status
            execution.status = 'completed';
            execution.endTime = new Date().toISOString();
            execution.progress = 100;
            execution.outputData = result;
            
            this.executions.set(executionId, execution);
            
            const duration = Date.now() - startTime;
            updateAnalytics('workflow', duration, true, workflow.tasks.length);
            
            return {
                success: true,
                executionId,
                result,
                duration
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            updateAnalytics('workflow', duration, false);
            
            logger.error('Workflow execution error:', error);
            throw error;
        }
    }
    
    async executeWorkflowTasks(workflow, execution, inputData, options) {
        const results = {};
        const taskCount = workflow.tasks.length;
        
        for (let i = 0; i < taskCount; i++) {
            const task = workflow.tasks[i];
            
            try {
                // Update progress
                execution.progress = Math.round(((i + 1) / taskCount) * 100);
                execution.logs.push(`Executing task: ${task.name}`);
                
                // Execute task
                const taskResult = await this.executeTask(task, inputData, results, options);
                
                // Store task result
                execution.tasks.push({
                    taskId: task.id,
                    name: task.name,
                    type: task.type,
                    status: 'completed',
                    result: taskResult,
                    startTime: new Date().toISOString(),
                    endTime: new Date().toISOString()
                });
                
                results[task.id] = taskResult;
                
            } catch (error) {
                execution.tasks.push({
                    taskId: task.id,
                    name: task.name,
                    type: task.type,
                    status: 'failed',
                    error: error.message,
                    startTime: new Date().toISOString(),
                    endTime: new Date().toISOString()
                });
                
                throw error;
            }
        }
        
        return results;
    }
    
    async executeTask(task, inputData, previousResults, options) {
        switch (task.type) {
            case 'api':
                return await this.executeApiTask(task, inputData, previousResults);
            case 'script':
                return await this.executeScriptTask(task, inputData, previousResults);
            case 'data':
                return await this.executeDataTask(task, inputData, previousResults);
            case 'decision':
                return await this.executeDecisionTask(task, inputData, previousResults);
            case 'notification':
                return await this.executeNotificationTask(task, inputData, previousResults);
            case 'approval':
                return await this.executeApprovalTask(task, inputData, previousResults);
            case 'integration':
                return await this.executeIntegrationTask(task, inputData, previousResults);
            case 'ai':
                return await this.executeAITask(task, inputData, previousResults);
            case 'human':
                return await this.executeHumanTask(task, inputData, previousResults);
            case 'timer':
                return await this.executeTimerTask(task, inputData, previousResults);
            case 'condition':
                return await this.executeConditionTask(task, inputData, previousResults);
            case 'loop':
                return await this.executeLoopTask(task, inputData, previousResults);
            case 'parallel':
                return await this.executeParallelTask(task, inputData, previousResults);
            case 'subprocess':
                return await this.executeSubprocessTask(task, inputData, previousResults);
            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }
    }
    
    async executeApiTask(task, inputData, previousResults) {
        const { url, method = 'GET', headers = {}, body = null, timeout = 30000 } = task.config;
        
        try {
            const response = await axios({
                method,
                url,
                headers,
                data: body,
                timeout
            });
            
            return {
                status: response.status,
                data: response.data,
                headers: response.headers
            };
        } catch (error) {
            throw new Error(`API call failed: ${error.message}`);
        }
    }
    
    async executeScriptTask(task, inputData, previousResults) {
        const { script, language = 'javascript', timeout = 30000 } = task.config;
        
        try {
            // In a real implementation, you would execute the script in a sandbox
            // For now, we'll simulate script execution
            const result = eval(script);
            
            return {
                result,
                executionTime: Date.now()
            };
        } catch (error) {
            throw new Error(`Script execution failed: ${error.message}`);
        }
    }
    
    async executeDataTask(task, inputData, previousResults) {
        const { operation, data, config = {} } = task.config;
        
        try {
            let result;
            
            switch (operation) {
                case 'transform':
                    result = this.transformData(data, config);
                    break;
                case 'filter':
                    result = this.filterData(data, config);
                    break;
                case 'aggregate':
                    result = this.aggregateData(data, config);
                    break;
                case 'validate':
                    result = this.validateData(data, config);
                    break;
                default:
                    throw new Error(`Unknown data operation: ${operation}`);
            }
            
            return {
                operation,
                result,
                processedAt: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Data processing failed: ${error.message}`);
        }
    }
    
    async executeDecisionTask(task, inputData, previousResults) {
        const { condition, truePath, falsePath } = task.config;
        
        try {
            // Evaluate condition
            const conditionResult = this.evaluateCondition(condition, inputData, previousResults);
            
            return {
                condition,
                result: conditionResult,
                path: conditionResult ? truePath : falsePath
            };
        } catch (error) {
            throw new Error(`Decision evaluation failed: ${error.message}`);
        }
    }
    
    async executeNotificationTask(task, inputData, previousResults) {
        const { type, recipient, subject, message, config = {} } = task.config;
        
        try {
            // In a real implementation, you would send actual notifications
            const notification = {
                type,
                recipient,
                subject,
                message,
                sentAt: new Date().toISOString(),
                status: 'sent'
            };
            
            return notification;
        } catch (error) {
            throw new Error(`Notification failed: ${error.message}`);
        }
    }
    
    async executeApprovalTask(task, inputData, previousResults) {
        const { approver, message, timeout = 86400000 } = task.config; // 24 hours default
        
        try {
            // In a real implementation, you would create an approval request
            const approval = {
                approver,
                message,
                status: 'pending',
                requestedAt: new Date().toISOString(),
                timeout
            };
            
            return approval;
        } catch (error) {
            throw new Error(`Approval request failed: ${error.message}`);
        }
    }
    
    async executeIntegrationTask(task, inputData, previousResults) {
        const { system, operation, data, config = {} } = task.config;
        
        try {
            // In a real implementation, you would integrate with external systems
            const integration = {
                system,
                operation,
                data,
                status: 'completed',
                executedAt: new Date().toISOString()
            };
            
            return integration;
        } catch (error) {
            throw new Error(`Integration failed: ${error.message}`);
        }
    }
    
    async executeAITask(task, inputData, previousResults) {
        const { model, prompt, config = {} } = task.config;
        
        try {
            // In a real implementation, you would call AI services
            const aiResult = {
                model,
                prompt,
                result: 'AI processing completed',
                confidence: 0.95,
                processedAt: new Date().toISOString()
            };
            
            return aiResult;
        } catch (error) {
            throw new Error(`AI processing failed: ${error.message}`);
        }
    }
    
    async executeHumanTask(task, inputData, previousResults) {
        const { assignee, description, form, config = {} } = task.config;
        
        try {
            // In a real implementation, you would create a human task
            const humanTask = {
                assignee,
                description,
                form,
                status: 'assigned',
                assignedAt: new Date().toISOString()
            };
            
            return humanTask;
        } catch (error) {
            throw new Error(`Human task creation failed: ${error.message}`);
        }
    }
    
    async executeTimerTask(task, inputData, previousResults) {
        const { duration, unit = 'seconds' } = task.config;
        
        try {
            const milliseconds = this.convertToMilliseconds(duration, unit);
            await new Promise(resolve => setTimeout(resolve, milliseconds));
            
            return {
                duration,
                unit,
                completedAt: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Timer task failed: ${error.message}`);
        }
    }
    
    async executeConditionTask(task, inputData, previousResults) {
        const { condition, trueTasks, falseTasks } = task.config;
        
        try {
            const conditionResult = this.evaluateCondition(condition, inputData, previousResults);
            const tasksToExecute = conditionResult ? trueTasks : falseTasks;
            
            const results = [];
            for (const subTask of tasksToExecute) {
                const result = await this.executeTask(subTask, inputData, previousResults, {});
                results.push(result);
            }
            
            return {
                condition,
                result: conditionResult,
                executedTasks: tasksToExecute.length,
                results
            };
        } catch (error) {
            throw new Error(`Condition task failed: ${error.message}`);
        }
    }
    
    async executeLoopTask(task, inputData, previousResults) {
        const { condition, tasks, maxIterations = 100 } = task.config;
        
        try {
            const results = [];
            let iteration = 0;
            
            while (iteration < maxIterations) {
                const conditionResult = this.evaluateCondition(condition, inputData, previousResults);
                if (!conditionResult) break;
                
                const iterationResults = [];
                for (const subTask of tasks) {
                    const result = await this.executeTask(subTask, inputData, previousResults, {});
                    iterationResults.push(result);
                }
                
                results.push({
                    iteration,
                    results: iterationResults
                });
                
                iteration++;
            }
            
            return {
                iterations: iteration,
                results
            };
        } catch (error) {
            throw new Error(`Loop task failed: ${error.message}`);
        }
    }
    
    async executeParallelTask(task, inputData, previousResults) {
        const { tasks } = task.config;
        
        try {
            const promises = tasks.map(subTask => 
                this.executeTask(subTask, inputData, previousResults, {})
            );
            
            const results = await Promise.all(promises);
            
            return {
                tasks: tasks.length,
                results
            };
        } catch (error) {
            throw new Error(`Parallel task failed: ${error.message}`);
        }
    }
    
    async executeSubprocessTask(task, inputData, previousResults) {
        const { workflowId, inputMapping } = task.config;
        
        try {
            // Execute subprocess workflow
            const subprocessResult = await this.executeWorkflow(workflowId, inputData, {});
            
            return {
                workflowId,
                result: subprocessResult
            };
        } catch (error) {
            throw new Error(`Subprocess task failed: ${error.message}`);
        }
    }
    
    // Helper methods
    transformData(data, config) {
        // Implement data transformation logic
        return data;
    }
    
    filterData(data, config) {
        // Implement data filtering logic
        return data;
    }
    
    aggregateData(data, config) {
        // Implement data aggregation logic
        return data;
    }
    
    validateData(data, config) {
        // Implement data validation logic
        return { valid: true, errors: [] };
    }
    
    evaluateCondition(condition, inputData, previousResults) {
        // Implement condition evaluation logic
        return true;
    }
    
    convertToMilliseconds(duration, unit) {
        const multipliers = {
            'milliseconds': 1,
            'seconds': 1000,
            'minutes': 60 * 1000,
            'hours': 60 * 60 * 1000,
            'days': 24 * 60 * 60 * 1000
        };
        
        return duration * (multipliers[unit] || 1000);
    }
}

// Initialize workflow engine
const workflowEngine = new WorkflowEngine();

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    logger.info('Client connected to workflow engine');
    
    socket.on('disconnect', () => {
        logger.info('Client disconnected from workflow engine');
    });
    
    socket.on('subscribe-workflow', (workflowId) => {
        socket.join(`workflow-${workflowId}`);
    });
    
    socket.on('unsubscribe-workflow', (workflowId) => {
        socket.leave(`workflow-${workflowId}`);
    });
});

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Advanced Workflow Engine',
        version: workflowConfig.version,
        timestamp: new Date().toISOString(),
        features: workflowConfig.features,
        workflows: workflowData.workflows.size
    });
});

// Get configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...workflowConfig,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
    }
});

// Create workflow
app.post('/api/workflows', async (req, res) => {
    try {
        const { workflowData } = req.body;
        
        if (!workflowData) {
            return res.status(400).json({ error: 'Workflow data is required' });
        }
        
        const workflow = await workflowEngine.createWorkflow(workflowData);
        res.json(workflow);
        
    } catch (error) {
        logger.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Failed to create workflow', details: error.message });
    }
});

// Execute workflow
app.post('/api/workflows/:workflowId/execute', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { inputData = {}, options = {} } = req.body;
        
        const result = await workflowEngine.executeWorkflow(workflowId, inputData, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error executing workflow:', error);
        res.status(500).json({ error: 'Failed to execute workflow', details: error.message });
    }
});

// Get workflows
app.get('/api/workflows', (req, res) => {
    try {
        const { status, type, limit = 50, offset = 0 } = req.query;
        
        let workflows = Array.from(workflowEngine.workflows.values());
        
        // Apply filters
        if (status) {
            workflows = workflows.filter(workflow => workflow.status === status);
        }
        
        if (type) {
            workflows = workflows.filter(workflow => workflow.type === type);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedWorkflows = workflows.slice(startIndex, endIndex);
        
        res.json({
            workflows: paginatedWorkflows,
            total: workflows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting workflows:', error);
        res.status(500).json({ error: 'Failed to get workflows', details: error.message });
    }
});

// Get specific workflow
app.get('/api/workflows/:workflowId', (req, res) => {
    try {
        const { workflowId } = req.params;
        const workflow = workflowEngine.workflows.get(workflowId);
        
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        
        res.json(workflow);
        
    } catch (error) {
        logger.error('Error getting workflow:', error);
        res.status(500).json({ error: 'Failed to get workflow', details: error.message });
    }
});

// Get executions
app.get('/api/executions', (req, res) => {
    try {
        const { status, workflowId, limit = 50, offset = 0 } = req.query;
        
        let executions = Array.from(workflowEngine.executions.values());
        
        // Apply filters
        if (status) {
            executions = executions.filter(execution => execution.status === status);
        }
        
        if (workflowId) {
            executions = executions.filter(execution => execution.workflowId === workflowId);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedExecutions = executions.slice(startIndex, endIndex);
        
        res.json({
            executions: paginatedExecutions,
            total: executions.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting executions:', error);
        res.status(500).json({ error: 'Failed to get executions', details: error.message });
    }
});

// Get specific execution
app.get('/api/executions/:executionId', (req, res) => {
    try {
        const { executionId } = req.params;
        const execution = workflowEngine.executions.get(executionId);
        
        if (!execution) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        
        res.json(execution);
        
    } catch (error) {
        logger.error('Error getting execution:', error);
        res.status(500).json({ error: 'Failed to get execution', details: error.message });
    }
});

// Get analytics
app.get('/api/analytics', (req, res) => {
    try {
        const { period = '24h' } = req.query;
        
        const now = new Date();
        let startDate;
        
        switch (period) {
            case '1h':
                startDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        const analytics = {
            period,
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            overview: {
                totalWorkflows: workflowData.analytics.totalWorkflows,
                totalExecutions: workflowData.analytics.totalExecutions,
                totalTasks: workflowData.analytics.totalTasks,
                averageExecutionTime: workflowData.analytics.averageExecutionTime,
                successRate: workflowData.analytics.successRate,
                errorRate: workflowData.analytics.errorRate
            },
            performance: {
                averageExecutionTime: workflowData.analytics.averageExecutionTime,
                executionTimes: workflowData.performance.executionTimes,
                taskTimes: workflowData.performance.taskTimes,
                errorRates: workflowData.performance.errorRates
            }
        };
        
        res.json(analytics);
        
    } catch (error) {
        logger.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics', details: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`⚙️ Advanced Workflow Engine v2.7.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`🔄 Features: Workflow Design, Execution, Monitoring, Scheduling`);
    console.log(`📈 Capabilities: Templates, Collaboration, Analytics, Automation`);
    console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
});

module.exports = app;
