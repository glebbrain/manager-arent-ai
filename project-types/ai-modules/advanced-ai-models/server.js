const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const compression = require('compression');
const winston = require('winston');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// AI Model Providers
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { HfInference } = require('@huggingface/inference');
const Replicate = require('replicate');
const cohere = require('cohere-ai');

const app = express();
const PORT = process.env.PORT || 3014;

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
        new winston.transports.File({ filename: 'logs/ai-models-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/ai-models-combined.log' })
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

// Advanced AI Models Configuration v2.7.0
const aiModelsConfig = {
    version: '2.7.0',
    providers: {
        openai: {
            name: 'OpenAI',
            apiKey: process.env.OPENAI_API_KEY,
            models: {
                'gpt-4o': {
                    name: 'GPT-4o (Omni)',
                    version: '2024-05-13',
                    capabilities: ['text', 'vision', 'audio', 'function_calling', 'reasoning'],
                    maxTokens: 128000,
                    contextWindow: 128000,
                    costPer1kTokens: 0.005,
                    features: {
                        multimodal: true,
                        reasoning: true,
                        codeGeneration: true,
                        analysis: true,
                        creativity: true
                    }
                },
                'gpt-4o-mini': {
                    name: 'GPT-4o Mini',
                    version: '2024-07-18',
                    capabilities: ['text', 'vision', 'function_calling'],
                    maxTokens: 128000,
                    contextWindow: 128000,
                    costPer1kTokens: 0.00015,
                    features: {
                        multimodal: true,
                        efficiency: true,
                        costEffective: true
                    }
                },
                'gpt-4-turbo': {
                    name: 'GPT-4 Turbo',
                    version: '2024-04-09',
                    capabilities: ['text', 'vision', 'function_calling'],
                    maxTokens: 4096,
                    contextWindow: 128000,
                    costPer1kTokens: 0.01,
                    features: {
                        multimodal: true,
                        reasoning: true,
                        codeGeneration: true
                    }
                }
            }
        },
        anthropic: {
            name: 'Anthropic',
            apiKey: process.env.ANTHROPIC_API_KEY,
            models: {
                'claude-3-5-sonnet-20241022': {
                    name: 'Claude 3.5 Sonnet',
                    version: '2024-10-22',
                    capabilities: ['text', 'vision', 'reasoning', 'analysis'],
                    maxTokens: 8192,
                    contextWindow: 200000,
                    costPer1kTokens: 0.003,
                    features: {
                        reasoning: true,
                        analysis: true,
                        codeGeneration: true,
                        creativity: true,
                        safety: true
                    }
                },
                'claude-3-5-haiku-20241022': {
                    name: 'Claude 3.5 Haiku',
                    version: '2024-10-22',
                    capabilities: ['text', 'vision', 'reasoning'],
                    maxTokens: 4096,
                    contextWindow: 200000,
                    costPer1kTokens: 0.00025,
                    features: {
                        efficiency: true,
                        speed: true,
                        costEffective: true
                    }
                }
            }
        },
        google: {
            name: 'Google',
            apiKey: process.env.GOOGLE_API_KEY,
            models: {
                'gemini-2.0-flash-exp': {
                    name: 'Gemini 2.0 Flash (Experimental)',
                    version: '2024-12-11',
                    capabilities: ['text', 'vision', 'audio', 'video', 'reasoning'],
                    maxTokens: 1048576,
                    contextWindow: 1048576,
                    costPer1kTokens: 0.000075,
                    features: {
                        multimodal: true,
                        longContext: true,
                        reasoning: true,
                        efficiency: true
                    }
                },
                'gemini-1.5-pro': {
                    name: 'Gemini 1.5 Pro',
                    version: '2024-02-15',
                    capabilities: ['text', 'vision', 'audio', 'reasoning'],
                    maxTokens: 8192,
                    contextWindow: 2000000,
                    costPer1kTokens: 0.00125,
                    features: {
                        multimodal: true,
                        longContext: true,
                        reasoning: true
                    }
                }
            }
        },
        huggingface: {
            name: 'Hugging Face',
            apiKey: process.env.HUGGINGFACE_API_KEY,
            models: {
                'meta-llama/Llama-3.1-405B-Instruct': {
                    name: 'Llama 3.1 405B',
                    version: '2024-07-23',
                    capabilities: ['text', 'reasoning', 'code'],
                    maxTokens: 8192,
                    contextWindow: 131072,
                    costPer1kTokens: 0.0027,
                    features: {
                        openSource: true,
                        reasoning: true,
                        codeGeneration: true,
                        multilingual: true
                    }
                },
                'mistralai/Mixtral-8x22B-Instruct-v0.1': {
                    name: 'Mixtral 8x22B',
                    version: '2024-12-19',
                    capabilities: ['text', 'reasoning', 'code'],
                    maxTokens: 65536,
                    contextWindow: 65536,
                    costPer1kTokens: 0.002,
                    features: {
                        openSource: true,
                        efficiency: true,
                        multilingual: true,
                        specializedTasks: true
                    }
                }
            }
        },
        replicate: {
            name: 'Replicate',
            apiKey: process.env.REPLICATE_API_TOKEN,
            models: {
                'meta/llama-3.1-405b-instruct': {
                    name: 'Llama 3.1 405B (Replicate)',
                    version: '2024-07-23',
                    capabilities: ['text', 'reasoning', 'code'],
                    maxTokens: 8192,
                    contextWindow: 131072,
                    costPer1kTokens: 0.0027,
                    features: {
                        openSource: true,
                        reasoning: true,
                        codeGeneration: true
                    }
                }
            }
        },
        cohere: {
            name: 'Cohere',
            apiKey: process.env.COHERE_API_KEY,
            models: {
                'command-r-plus': {
                    name: 'Command R+',
                    version: '2024-03-07',
                    capabilities: ['text', 'reasoning', 'tool_use'],
                    maxTokens: 4096,
                    contextWindow: 128000,
                    costPer1kTokens: 0.003,
                    features: {
                        reasoning: true,
                        toolUse: true,
                        multilingual: true,
                        efficiency: true
                    }
                }
            }
        }
    },
    features: {
        multiModel: true,
        loadBalancing: true,
        failover: true,
        caching: true,
        analytics: true,
        costOptimization: true,
        performanceMonitoring: true,
        customModels: true,
        localModels: true,
        edgeDeployment: true
    },
    limits: {
        maxConcurrentRequests: 100,
        maxTokensPerRequest: 1000000,
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
        maxRequestsPerDay: 10000
    }
};

// Initialize AI Model Clients
const aiClients = {};

function initializeAIClients() {
    try {
        // OpenAI
        if (aiModelsConfig.providers.openai.apiKey) {
            aiClients.openai = new OpenAI({
                apiKey: aiModelsConfig.providers.openai.apiKey
            });
            logger.info('OpenAI client initialized');
        }

        // Anthropic
        if (aiModelsConfig.providers.anthropic.apiKey) {
            aiClients.anthropic = new Anthropic({
                apiKey: aiModelsConfig.providers.anthropic.apiKey
            });
            logger.info('Anthropic client initialized');
        }

        // Google
        if (aiModelsConfig.providers.google.apiKey) {
            aiClients.google = new GoogleGenerativeAI(aiModelsConfig.providers.google.apiKey);
            logger.info('Google client initialized');
        }

        // Hugging Face
        if (aiModelsConfig.providers.huggingface.apiKey) {
            aiClients.huggingface = new HfInference(aiModelsConfig.providers.huggingface.apiKey);
            logger.info('Hugging Face client initialized');
        }

        // Replicate
        if (aiModelsConfig.providers.replicate.apiKey) {
            aiClients.replicate = new Replicate({
                auth: aiModelsConfig.providers.replicate.apiKey
            });
            logger.info('Replicate client initialized');
        }

        // Cohere
        if (aiModelsConfig.providers.cohere.apiKey) {
            cohere.init(aiModelsConfig.providers.cohere.apiKey);
            aiClients.cohere = cohere;
            logger.info('Cohere client initialized');
        }

        logger.info('AI clients initialization completed');
    } catch (error) {
        logger.error('Error initializing AI clients:', error);
    }
}

// AI Model Data Storage
let aiData = {
    requests: new Map(),
    responses: new Map(),
    analytics: {
        totalRequests: 0,
        requestsByProvider: {},
        requestsByModel: {},
        requestsByType: {},
        totalTokens: 0,
        totalCost: 0,
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0
    },
    cache: new Map(),
    performance: {
        responseTimes: [],
        throughput: [],
        errorRates: [],
        costTracking: []
    }
};

// Utility Functions
function generateRequestId() {
    return uuidv4();
}

function calculateCost(provider, model, tokens) {
    const modelConfig = aiModelsConfig.providers[provider]?.models[model];
    if (!modelConfig) return 0;
    
    const costPer1k = modelConfig.costPer1kTokens || 0;
    return (tokens / 1000) * costPer1k;
}

function updateAnalytics(provider, model, requestType, tokens, cost, responseTime, success) {
    aiData.analytics.totalRequests++;
    
    // Update provider analytics
    if (!aiData.analytics.requestsByProvider[provider]) {
        aiData.analytics.requestsByProvider[provider] = 0;
    }
    aiData.analytics.requestsByProvider[provider]++;
    
    // Update model analytics
    if (!aiData.analytics.requestsByModel[model]) {
        aiData.analytics.requestsByModel[model] = 0;
    }
    aiData.analytics.requestsByModel[model]++;
    
    // Update type analytics
    if (!aiData.analytics.requestsByType[requestType]) {
        aiData.analytics.requestsByType[requestType] = 0;
    }
    aiData.analytics.requestsByType[requestType]++;
    
    // Update totals
    aiData.analytics.totalTokens += tokens;
    aiData.analytics.totalCost += cost;
    
    // Update performance metrics
    aiData.performance.responseTimes.push(responseTime);
    aiData.performance.throughput.push(1);
    aiData.performance.costTracking.push(cost);
    
    if (success) {
        aiData.analytics.successRate = (aiData.analytics.successRate * (aiData.analytics.totalRequests - 1) + 1) / aiData.analytics.totalRequests;
    } else {
        aiData.analytics.errorRate = (aiData.analytics.errorRate * (aiData.analytics.totalRequests - 1) + 1) / aiData.analytics.totalRequests;
    }
    
    // Calculate average response time
    const totalResponseTime = aiData.performance.responseTimes.reduce((a, b) => a + b, 0);
    aiData.analytics.averageResponseTime = totalResponseTime / aiData.performance.responseTimes.length;
}

// AI Model Processing Functions
async function processWithOpenAI(model, messages, options = {}) {
    const startTime = Date.now();
    
    try {
        const response = await aiClients.openai.chat.completions.create({
            model: model,
            messages: messages,
            max_tokens: options.maxTokens || 4096,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 1,
            frequency_penalty: options.frequencyPenalty || 0,
            presence_penalty: options.presencePenalty || 0,
            ...options
        });
        
        const responseTime = Date.now() - startTime;
        const tokens = response.usage?.total_tokens || 0;
        const cost = calculateCost('openai', model, tokens);
        
        updateAnalytics('openai', model, 'text_generation', tokens, cost, responseTime, true);
        
        return {
            success: true,
            content: response.choices[0].message.content,
            usage: response.usage,
            cost: cost,
            responseTime: responseTime,
            model: model,
            provider: 'openai'
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        updateAnalytics('openai', model, 'text_generation', 0, 0, responseTime, false);
        
        logger.error('OpenAI API error:', error);
        throw error;
    }
}

async function processWithAnthropic(model, messages, options = {}) {
    const startTime = Date.now();
    
    try {
        const response = await aiClients.anthropic.messages.create({
            model: model,
            max_tokens: options.maxTokens || 4096,
            temperature: options.temperature || 0.7,
            messages: messages,
            ...options
        });
        
        const responseTime = Date.now() - startTime;
        const tokens = response.usage?.input_tokens + response.usage?.output_tokens || 0;
        const cost = calculateCost('anthropic', model, tokens);
        
        updateAnalytics('anthropic', model, 'text_generation', tokens, cost, responseTime, true);
        
        return {
            success: true,
            content: response.content[0].text,
            usage: response.usage,
            cost: cost,
            responseTime: responseTime,
            model: model,
            provider: 'anthropic'
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        updateAnalytics('anthropic', model, 'text_generation', 0, 0, responseTime, false);
        
        logger.error('Anthropic API error:', error);
        throw error;
    }
}

async function processWithGoogle(model, messages, options = {}) {
    const startTime = Date.now();
    
    try {
        const genAI = aiClients.google;
        const genModel = genAI.getGenerativeModel({ model: model });
        
        const response = await genModel.generateContent({
            contents: messages,
            generationConfig: {
                maxOutputTokens: options.maxTokens || 4096,
                temperature: options.temperature || 0.7,
                topP: options.topP || 1,
                ...options
            }
        });
        
        const responseTime = Date.now() - startTime;
        const tokens = response.usageMetadata?.totalTokenCount || 0;
        const cost = calculateCost('google', model, tokens);
        
        updateAnalytics('google', model, 'text_generation', tokens, cost, responseTime, true);
        
        return {
            success: true,
            content: response.response.text(),
            usage: response.usageMetadata,
            cost: cost,
            responseTime: responseTime,
            model: model,
            provider: 'google'
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        updateAnalytics('google', model, 'text_generation', 0, 0, responseTime, false);
        
        logger.error('Google API error:', error);
        throw error;
    }
}

async function processWithHuggingFace(model, inputs, options = {}) {
    const startTime = Date.now();
    
    try {
        const response = await aiClients.huggingface.textGeneration({
            model: model,
            inputs: inputs,
            parameters: {
                max_new_tokens: options.maxTokens || 512,
                temperature: options.temperature || 0.7,
                top_p: options.topP || 1,
                ...options
            }
        });
        
        const responseTime = Date.now() - startTime;
        const tokens = response.length || 0;
        const cost = calculateCost('huggingface', model, tokens);
        
        updateAnalytics('huggingface', model, 'text_generation', tokens, cost, responseTime, true);
        
        return {
            success: true,
            content: response[0].generated_text,
            usage: { total_tokens: tokens },
            cost: cost,
            responseTime: responseTime,
            model: model,
            provider: 'huggingface'
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        updateAnalytics('huggingface', model, 'text_generation', 0, 0, responseTime, false);
        
        logger.error('Hugging Face API error:', error);
        throw error;
    }
}

async function processWithReplicate(model, inputs, options = {}) {
    const startTime = Date.now();
    
    try {
        const response = await aiClients.replicate.run(model, {
            input: {
                prompt: inputs,
                max_tokens: options.maxTokens || 512,
                temperature: options.temperature || 0.7,
                ...options
            }
        });
        
        const responseTime = Date.now() - startTime;
        const tokens = response.length || 0;
        const cost = calculateCost('replicate', model, tokens);
        
        updateAnalytics('replicate', model, 'text_generation', tokens, cost, responseTime, true);
        
        return {
            success: true,
            content: response.join(''),
            usage: { total_tokens: tokens },
            cost: cost,
            responseTime: responseTime,
            model: model,
            provider: 'replicate'
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        updateAnalytics('replicate', model, 'text_generation', 0, 0, responseTime, false);
        
        logger.error('Replicate API error:', error);
        throw error;
    }
}

async function processWithCohere(model, inputs, options = {}) {
    const startTime = Date.now();
    
    try {
        const response = await aiClients.cohere.generate({
            model: model,
            prompt: inputs,
            max_tokens: options.maxTokens || 512,
            temperature: options.temperature || 0.7,
            ...options
        });
        
        const responseTime = Date.now() - startTime;
        const tokens = response.meta?.billed_units?.input_tokens + response.meta?.billed_units?.output_tokens || 0;
        const cost = calculateCost('cohere', model, tokens);
        
        updateAnalytics('cohere', model, 'text_generation', tokens, cost, responseTime, true);
        
        return {
            success: true,
            content: response.generations[0].text,
            usage: response.meta?.billed_units,
            cost: cost,
            responseTime: responseTime,
            model: model,
            provider: 'cohere'
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        updateAnalytics('cohere', model, 'text_generation', 0, 0, responseTime, false);
        
        logger.error('Cohere API error:', error);
        throw error;
    }
}

// Smart Model Selection
function selectBestModel(requestType, requirements = {}) {
    const availableModels = [];
    
    // Collect all available models
    Object.entries(aiModelsConfig.providers).forEach(([provider, config]) => {
        if (aiClients[provider]) {
            Object.entries(config.models).forEach(([modelId, modelConfig]) => {
                availableModels.push({
                    provider,
                    modelId,
                    ...modelConfig,
                    capabilities: modelConfig.capabilities || []
                });
            });
        }
    });
    
    // Filter by requirements
    let filteredModels = availableModels;
    
    if (requirements.capabilities) {
        filteredModels = filteredModels.filter(model => 
            requirements.capabilities.every(cap => model.capabilities.includes(cap))
        );
    }
    
    if (requirements.maxCost) {
        filteredModels = filteredModels.filter(model => 
            model.costPer1kTokens <= requirements.maxCost
        );
    }
    
    if (requirements.maxTokens) {
        filteredModels = filteredModels.filter(model => 
            model.maxTokens >= requirements.maxTokens
        );
    }
    
    // Sort by priority (cost, performance, capabilities)
    filteredModels.sort((a, b) => {
        // First by cost
        if (a.costPer1kTokens !== b.costPer1kTokens) {
            return a.costPer1kTokens - b.costPer1kTokens;
        }
        
        // Then by max tokens
        if (a.maxTokens !== b.maxTokens) {
            return b.maxTokens - a.maxTokens;
        }
        
        // Finally by capabilities match
        const aCapabilities = a.capabilities.length;
        const bCapabilities = b.capabilities.length;
        return bCapabilities - aCapabilities;
    });
    
    return filteredModels[0] || null;
}

// Load Balancing
function getLoadBalancedModel(provider) {
    const models = Object.keys(aiModelsConfig.providers[provider]?.models || {});
    if (models.length === 0) return null;
    
    // Simple round-robin load balancing
    const requestCount = aiData.analytics.requestsByProvider[provider] || 0;
    const modelIndex = requestCount % models.length;
    
    return {
        provider,
        modelId: models[modelIndex],
        ...aiModelsConfig.providers[provider].models[models[modelIndex]]
    };
}

// Caching
function getCachedResponse(cacheKey) {
    const cached = aiData.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 3600000) { // 1 hour cache
        return cached.data;
    }
    return null;
}

function setCachedResponse(cacheKey, data) {
    aiData.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
    });
}

// Initialize AI clients
initializeAIClients();

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Advanced AI Models',
        version: aiModelsConfig.version,
        timestamp: new Date().toISOString(),
        providers: Object.keys(aiClients),
        features: aiModelsConfig.features
    });
});

// Get available models
app.get('/api/models', (req, res) => {
    try {
        const models = {};
        
        Object.entries(aiModelsConfig.providers).forEach(([provider, config]) => {
            if (aiClients[provider]) {
                models[provider] = {
                    name: config.name,
                    models: config.models
                };
            }
        });
        
        res.json({
            providers: models,
            totalModels: Object.values(models).reduce((sum, provider) => sum + Object.keys(provider.models).length, 0),
            features: aiModelsConfig.features,
            limits: aiModelsConfig.limits
        });
    } catch (error) {
        logger.error('Error getting models:', error);
        res.status(500).json({ error: 'Failed to get models', details: error.message });
    }
});

// Process AI request
app.post('/api/process', async (req, res) => {
    try {
        const { 
            prompt, 
            model, 
            provider, 
            options = {}, 
            requestType = 'text_generation',
            useCache = true,
            requirements = {}
        } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        const requestId = generateRequestId();
        const startTime = Date.now();
        
        // Create cache key
        const cacheKey = crypto.createHash('sha256')
            .update(JSON.stringify({ prompt, model, provider, options }))
            .digest('hex');
        
        // Check cache first
        if (useCache) {
            const cached = getCachedResponse(cacheKey);
            if (cached) {
                return res.json({
                    requestId,
                    ...cached,
                    cached: true,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        // Select model if not specified
        let selectedModel = null;
        if (provider && model) {
            selectedModel = {
                provider,
                modelId: model,
                ...aiModelsConfig.providers[provider]?.models[model]
            };
        } else {
            selectedModel = selectBestModel(requestType, requirements);
        }
        
        if (!selectedModel) {
            return res.status(400).json({ error: 'No suitable model available' });
        }
        
        // Store request
        aiData.requests.set(requestId, {
            id: requestId,
            prompt,
            model: selectedModel.modelId,
            provider: selectedModel.provider,
            options,
            requestType,
            timestamp: new Date().toISOString(),
            status: 'processing'
        });
        
        let result;
        
        // Process with selected provider
        switch (selectedModel.provider) {
            case 'openai':
                result = await processWithOpenAI(selectedModel.modelId, prompt, options);
                break;
            case 'anthropic':
                result = await processWithAnthropic(selectedModel.modelId, prompt, options);
                break;
            case 'google':
                result = await processWithGoogle(selectedModel.modelId, prompt, options);
                break;
            case 'huggingface':
                result = await processWithHuggingFace(selectedModel.modelId, prompt, options);
                break;
            case 'replicate':
                result = await processWithReplicate(selectedModel.modelId, prompt, options);
                break;
            case 'cohere':
                result = await processWithCohere(selectedModel.modelId, prompt, options);
                break;
            default:
                throw new Error(`Unsupported provider: ${selectedModel.provider}`);
        }
        
        // Store response
        aiData.responses.set(requestId, {
            requestId,
            ...result,
            timestamp: new Date().toISOString()
        });
        
        // Update request status
        const request = aiData.requests.get(requestId);
        request.status = 'completed';
        aiData.requests.set(requestId, request);
        
        // Cache response
        if (useCache) {
            setCachedResponse(cacheKey, result);
        }
        
        res.json({
            requestId,
            ...result,
            cached: false,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Error processing AI request:', error);
        res.status(500).json({ error: 'Failed to process request', details: error.message });
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
        
        // Filter requests by period
        const recentRequests = Array.from(aiData.requests.values())
            .filter(req => new Date(req.timestamp) >= startDate);
        
        const analytics = {
            period,
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            overview: {
                totalRequests: recentRequests.length,
                totalTokens: aiData.analytics.totalTokens,
                totalCost: aiData.analytics.totalCost,
                averageResponseTime: aiData.analytics.averageResponseTime,
                successRate: aiData.analytics.successRate,
                errorRate: aiData.analytics.errorRate
            },
            byProvider: aiData.analytics.requestsByProvider,
            byModel: aiData.analytics.requestsByModel,
            byType: aiData.analytics.requestsByType,
            performance: {
                averageResponseTime: aiData.analytics.averageResponseTime,
                throughput: aiData.performance.throughput.length,
                costTrend: aiData.performance.costTracking
            },
            cache: {
                size: aiData.cache.size,
                hitRate: 0 // Calculate based on cache hits
            }
        };
        
        res.json(analytics);
        
    } catch (error) {
        logger.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics', details: error.message });
    }
});

// Get request status
app.get('/api/requests/:requestId', (req, res) => {
    try {
        const { requestId } = req.params;
        const request = aiData.requests.get(requestId);
        const response = aiData.responses.get(requestId);
        
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json({
            request,
            response,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Error getting request status:', error);
        res.status(500).json({ error: 'Failed to get request status', details: error.message });
    }
});

// Get configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...aiModelsConfig,
            clients: Object.keys(aiClients),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
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
app.listen(PORT, () => {
    console.log(`🤖 Advanced AI Models v2.7.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`🧠 Providers: ${Object.keys(aiClients).join(', ')}`);
    console.log(`⚡ Features: Multi-Model, Load Balancing, Caching, Analytics`);
});

module.exports = app;
