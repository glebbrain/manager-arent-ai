/**
 * API Version 1 Configuration
 * Initial version of ManagerAgentAI API
 */

const v1Config = {
    version: 'v1',
    description: 'Initial version of ManagerAgentAI API',
    baseUrl: '/api/v1',
    deprecationDate: null,
    sunsetDate: null,
    migrationGuide: {
        v2: [
            'Update API version header to v2',
            'Replace /api/v1 with /api/v2 in all requests',
            'Update response format to include new fields',
            'Handle new error response structure'
        ]
    },
    breakingChanges: {
        v2: [
            'Response format changed',
            'Error response structure updated',
            'New required fields added'
        ]
    },
    changelog: [
        {
            version: '1.0.0',
            date: '2025-01-01',
            changes: [
                'Initial API release',
                'Project management endpoints',
                'Task management endpoints',
                'Basic authentication'
            ]
        }
    ],
    endpoints: {
        '/projects': {
            methods: ['GET', 'POST'],
            description: 'Project management endpoints',
            schema: {
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    type: { type: 'string', enum: ['web', 'mobile', 'desktop', 'api'] }
                }
            },
            examples: {
                GET: {
                    description: 'List all projects',
                    response: {
                        status: 200,
                        body: {
                            projects: [
                                {
                                    id: 'proj_123',
                                    name: 'My Project',
                                    description: 'Project description',
                                    type: 'web',
                                    createdAt: '2025-01-01T00:00:00Z',
                                    updatedAt: '2025-01-01T00:00:00Z'
                                }
                            ],
                            total: 1,
                            page: 1,
                            limit: 10
                        }
                    }
                },
                POST: {
                    description: 'Create new project',
                    request: {
                        body: {
                            name: 'New Project',
                            description: 'Project description',
                            type: 'web'
                        }
                    },
                    response: {
                        status: 201,
                        body: {
                            id: 'proj_123',
                            name: 'New Project',
                            description: 'Project description',
                            type: 'web',
                            createdAt: '2025-01-01T00:00:00Z',
                            updatedAt: '2025-01-01T00:00:00Z'
                        }
                    }
                }
            }
        },
        '/projects/:id': {
            methods: ['GET', 'PUT', 'DELETE'],
            description: 'Individual project management',
            schema: {
                required: ['id'],
                properties: {
                    id: { type: 'string', pattern: '^proj_[a-zA-Z0-9]+$' }
                }
            }
        },
        '/tasks': {
            methods: ['GET', 'POST'],
            description: 'Task management endpoints',
            schema: {
                required: ['title'],
                properties: {
                    title: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                    status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] }
                }
            }
        },
        '/tasks/:id': {
            methods: ['GET', 'PUT', 'DELETE'],
            description: 'Individual task management',
            schema: {
                required: ['id'],
                properties: {
                    id: { type: 'string', pattern: '^task_[a-zA-Z0-9]+$' }
                }
            }
        },
        '/workflows': {
            methods: ['GET', 'POST'],
            description: 'Workflow management endpoints',
            schema: {
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    steps: { type: 'array', items: { type: 'object' } }
                }
            }
        },
        '/notifications': {
            methods: ['GET', 'POST'],
            description: 'Notification management endpoints',
            schema: {
                required: ['message'],
                properties: {
                    message: { type: 'string', minLength: 1 },
                    type: { type: 'string', enum: ['info', 'warning', 'error', 'success'] },
                    recipients: { type: 'array', items: { type: 'string' } }
                }
            }
        }
    },
    middleware: [
        // Basic authentication middleware
        (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Bearer token required'
                });
            }
            next();
        },
        // Request logging middleware
        (req, res, next) => {
            console.log(`[v1] ${req.method} ${req.path} - ${new Date().toISOString()}`);
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
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'name', 'createdAt', 'updatedAt']
        },
        Task: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'title', 'createdAt', 'updatedAt']
        },
        Error: {
            type: 'object',
            properties: {
                error: { type: 'string' },
                message: { type: 'string' },
                code: { type: 'string' },
                details: { type: 'object' }
            },
            required: ['error', 'message']
        }
    }
};

module.exports = v1Config;
