/**
 * API Version 2 Configuration
 * Enhanced version with improved features and performance
 */

const v2Config = {
    version: 'v2',
    description: 'Enhanced version of ManagerAgentAI API with improved features',
    baseUrl: '/api/v2',
    deprecationDate: null,
    sunsetDate: null,
    migrationGuide: {
        v1: [
            'Update API version header to v1',
            'Replace /api/v2 with /api/v1 in all requests',
            'Remove new fields from requests',
            'Handle simplified response format'
        ]
    },
    breakingChanges: {
        v1: [
            'Response format simplified',
            'Error response structure changed',
            'Some fields removed'
        ]
    },
    changelog: [
        {
            version: '2.0.0',
            date: '2025-01-31',
            changes: [
                'Enhanced project management with templates',
                'Advanced task prioritization with AI',
                'Workflow automation improvements',
                'Real-time notifications with WebSocket support',
                'Improved error handling and validation',
                'Enhanced security with JWT tokens',
                'Performance optimizations',
                'New analytics endpoints'
            ]
        }
    ],
    endpoints: {
        '/projects': {
            methods: ['GET', 'POST'],
            description: 'Enhanced project management with templates and analytics',
            schema: {
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    type: { type: 'string', enum: ['web', 'mobile', 'desktop', 'api', 'ai', 'blockchain'] },
                    template: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    settings: { type: 'object' }
                }
            },
            examples: {
                GET: {
                    description: 'List all projects with enhanced filtering',
                    query: {
                        type: 'web',
                        tags: 'frontend,react',
                        status: 'active',
                        page: 1,
                        limit: 10,
                        sort: 'createdAt',
                        order: 'desc'
                    },
                    response: {
                        status: 200,
                        body: {
                            projects: [
                                {
                                    id: 'proj_123',
                                    name: 'My Project',
                                    description: 'Project description',
                                    type: 'web',
                                    template: 'react-app',
                                    tags: ['frontend', 'react'],
                                    status: 'active',
                                    analytics: {
                                        tasksCompleted: 15,
                                        tasksTotal: 20,
                                        completionRate: 75,
                                        lastActivity: '2025-01-31T10:30:00Z'
                                    },
                                    createdAt: '2025-01-01T00:00:00Z',
                                    updatedAt: '2025-01-31T10:30:00Z'
                                }
                            ],
                            pagination: {
                                total: 1,
                                page: 1,
                                limit: 10,
                                totalPages: 1
                            },
                            filters: {
                                type: 'web',
                                tags: 'frontend,react',
                                status: 'active'
                            }
                        }
                    }
                },
                POST: {
                    description: 'Create new project with template support',
                    request: {
                        body: {
                            name: 'New Project',
                            description: 'Project description',
                            type: 'web',
                            template: 'react-app',
                            tags: ['frontend', 'react'],
                            settings: {
                                autoDeploy: true,
                                notifications: true
                            }
                        }
                    },
                    response: {
                        status: 201,
                        body: {
                            id: 'proj_123',
                            name: 'New Project',
                            description: 'Project description',
                            type: 'web',
                            template: 'react-app',
                            tags: ['frontend', 'react'],
                            status: 'active',
                            settings: {
                                autoDeploy: true,
                                notifications: true
                            },
                            createdAt: '2025-01-01T00:00:00Z',
                            updatedAt: '2025-01-01T00:00:00Z'
                        }
                    }
                }
            }
        },
        '/projects/:id': {
            methods: ['GET', 'PUT', 'DELETE', 'PATCH'],
            description: 'Enhanced individual project management',
            schema: {
                required: ['id'],
                properties: {
                    id: { type: 'string', pattern: '^proj_[a-zA-Z0-9]+$' }
                }
            }
        },
        '/projects/:id/analytics': {
            methods: ['GET'],
            description: 'Project analytics and metrics',
            schema: {
                required: ['id'],
                properties: {
                    id: { type: 'string', pattern: '^proj_[a-zA-Z0-9]+$' },
                    period: { type: 'string', enum: ['7d', '30d', '90d', '1y'] }
                }
            }
        },
        '/tasks': {
            methods: ['GET', 'POST'],
            description: 'Enhanced task management with AI prioritization',
            schema: {
                required: ['title'],
                properties: {
                    title: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                    status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
                    assignee: { type: 'string' },
                    dueDate: { type: 'string', format: 'date-time' },
                    tags: { type: 'array', items: { type: 'string' } },
                    dependencies: { type: 'array', items: { type: 'string' } },
                    aiPriority: { type: 'number', minimum: 0, maximum: 100 }
                }
            }
        },
        '/tasks/:id': {
            methods: ['GET', 'PUT', 'DELETE', 'PATCH'],
            description: 'Enhanced individual task management',
            schema: {
                required: ['id'],
                properties: {
                    id: { type: 'string', pattern: '^task_[a-zA-Z0-9]+$' }
                }
            }
        },
        '/tasks/ai-prioritize': {
            methods: ['POST'],
            description: 'AI-powered task prioritization',
            schema: {
                required: ['tasks'],
                properties: {
                    tasks: { type: 'array', items: { type: 'string' } },
                    context: { type: 'object' }
                }
            }
        },
        '/workflows': {
            methods: ['GET', 'POST'],
            description: 'Enhanced workflow management with automation',
            schema: {
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    steps: { type: 'array', items: { type: 'object' } },
                    triggers: { type: 'array', items: { type: 'object' } },
                    conditions: { type: 'array', items: { type: 'object' } },
                    automation: { type: 'boolean' }
                }
            }
        },
        '/workflows/:id/execute': {
            methods: ['POST'],
            description: 'Execute workflow with enhanced monitoring',
            schema: {
                required: ['id'],
                properties: {
                    id: { type: 'string', pattern: '^workflow_[a-zA-Z0-9]+$' },
                    parameters: { type: 'object' },
                    async: { type: 'boolean' }
                }
            }
        },
        '/notifications': {
            methods: ['GET', 'POST'],
            description: 'Enhanced notification system with real-time support',
            schema: {
                required: ['message'],
                properties: {
                    message: { type: 'string', minLength: 1 },
                    type: { type: 'string', enum: ['info', 'warning', 'error', 'success'] },
                    recipients: { type: 'array', items: { type: 'string' } },
                    channels: { type: 'array', items: { type: 'string', enum: ['email', 'sms', 'push', 'websocket'] } },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                    scheduledAt: { type: 'string', format: 'date-time' }
                }
            }
        },
        '/notifications/ws': {
            methods: ['GET'],
            description: 'WebSocket endpoint for real-time notifications',
            schema: {
                properties: {
                    token: { type: 'string' }
                }
            }
        },
        '/analytics': {
            methods: ['GET'],
            description: 'System analytics and metrics',
            schema: {
                properties: {
                    period: { type: 'string', enum: ['7d', '30d', '90d', '1y'] },
                    metrics: { type: 'array', items: { type: 'string' } }
                }
            }
        },
        '/health': {
            methods: ['GET'],
            description: 'Enhanced health check with detailed status',
            schema: {},
            examples: {
                GET: {
                    description: 'System health check',
                    response: {
                        status: 200,
                        body: {
                            status: 'healthy',
                            version: '2.0.0',
                            timestamp: '2025-01-31T10:30:00Z',
                            services: {
                                database: { status: 'healthy', latency: '5ms' },
                                redis: { status: 'healthy', latency: '2ms' },
                                eventBus: { status: 'healthy', latency: '1ms' }
                            },
                            metrics: {
                                uptime: '99.9%',
                                responseTime: '45ms',
                                requestsPerSecond: 150
                            }
                        }
                    }
                }
            }
        }
    },
    middleware: [
        // JWT authentication middleware
        (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'JWT token required',
                    code: 'AUTH_REQUIRED'
                });
            }
            
            const token = authHeader.substring(7);
            // JWT validation logic would go here
            req.user = { id: 'user_123', role: 'admin' }; // Mock user
            next();
        },
        // Enhanced request logging middleware
        (req, res, next) => {
            const startTime = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                console.log(`[v2] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${new Date().toISOString()}`);
            });
            next();
        },
        // Rate limiting middleware
        (req, res, next) => {
            // Rate limiting logic would go here
            next();
        }
    ],
    schemas: {
        Project: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string' },
                template: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                status: { type: 'string' },
                settings: { type: 'object' },
                analytics: { type: 'object' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'name', 'status', 'createdAt', 'updatedAt']
        },
        Task: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string' },
                status: { type: 'string' },
                assignee: { type: 'string' },
                dueDate: { type: 'string', format: 'date-time' },
                tags: { type: 'array', items: { type: 'string' } },
                dependencies: { type: 'array', items: { type: 'string' } },
                aiPriority: { type: 'number' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'title', 'status', 'createdAt', 'updatedAt']
        },
        Error: {
            type: 'object',
            properties: {
                error: { type: 'string' },
                message: { type: 'string' },
                code: { type: 'string' },
                details: { type: 'object' },
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
            },
            required: ['error', 'message', 'code', 'timestamp']
        }
    }
};

module.exports = v2Config;
