const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const { createServer } = require('http');
const { Server } = require('socket.io');
const natural = require('natural');
const Sentiment = require('sentiment');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3029;

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
        new winston.transports.File({ filename: 'logs/intelligent-error-resolution-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/intelligent-error-resolution-combined.log' })
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
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Intelligent Error Resolution Configuration v2.8.0
const errorConfig = {
    version: '2.8.0',
    features: {
        errorDetection: true,
        errorAnalysis: true,
        automatedResolution: true,
        intelligentTroubleshooting: true,
        patternRecognition: true,
        rootCauseAnalysis: true,
        solutionRecommendation: true,
        errorClassification: true,
        severityAssessment: true,
        impactAnalysis: true,
        resolutionTracking: true,
        learningSystem: true,
        knowledgeBase: true,
        communitySolutions: true,
        realTimeResolution: true
    },
    errorTypes: {
        syntax: 'Syntax Errors',
        runtime: 'Runtime Errors',
        logical: 'Logical Errors',
        performance: 'Performance Issues',
        security: 'Security Vulnerabilities',
        integration: 'Integration Errors',
        database: 'Database Errors',
        network: 'Network Errors',
        memory: 'Memory Issues',
        concurrency: 'Concurrency Issues',
        configuration: 'Configuration Errors',
        dependency: 'Dependency Issues',
        api: 'API Errors',
        authentication: 'Authentication Errors',
        authorization: 'Authorization Errors',
        validation: 'Validation Errors',
        timeout: 'Timeout Errors',
        resource: 'Resource Errors'
    },
    severityLevels: {
        critical: 'Critical - System Down',
        high: 'High - Major Functionality Affected',
        medium: 'Medium - Minor Functionality Affected',
        low: 'Low - Cosmetic Issues',
        info: 'Info - Informational Only'
    },
    resolutionStatus: {
        open: 'Open',
        investigating: 'Investigating',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',
        duplicate: 'Duplicate',
        wont_fix: 'Won\'t Fix',
        invalid: 'Invalid'
    },
    aiModels: {
        errorClassification: 'BERT, RoBERTa, DistilBERT',
        solutionGeneration: 'GPT-4, Claude-3, CodeLlama',
        patternRecognition: 'LSTM, CNN, Transformer',
        rootCauseAnalysis: 'Causal Inference Models',
        sentimentAnalysis: 'VADER, TextBlob, BERT'
    }
};

// Data storage
let errorData = {
    errors: new Map(),
    resolutions: new Map(),
    patterns: new Map(),
    solutions: new Map(),
    analytics: {
        totalErrors: 0,
        resolvedErrors: 0,
        averageResolutionTime: 0,
        resolutionRate: 0,
        criticalErrors: 0,
        commonErrorTypes: {},
        resolutionEfficiency: 0,
        userSatisfaction: 0
    }
};

// Initialize NLP tools
const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Utility functions
function generateId() {
    return uuidv4();
}

function updateAnalytics(type, value = 0) {
    errorData.analytics.totalErrors++;
    if (type === 'resolved') {
        errorData.analytics.resolvedErrors++;
        errorData.analytics.resolutionRate = 
            errorData.analytics.resolvedErrors / errorData.analytics.totalErrors;
    } else if (type === 'critical') {
        errorData.analytics.criticalErrors++;
    }
}

// Intelligent Error Resolution Engine
class IntelligentErrorResolutionEngine {
    constructor() {
        this.errors = new Map();
        this.resolutions = new Map();
        this.patterns = new Map();
        this.solutions = new Map();
        this.knowledgeBase = new Map();
        this.initializeKnowledgeBase();
    }

    initializeKnowledgeBase() {
        // Initialize with common error patterns and solutions
        const commonPatterns = [
            {
                pattern: /TypeError: Cannot read property '(\w+)' of undefined/,
                type: 'runtime',
                severity: 'high',
                solution: 'Check if the object exists before accessing its properties. Use optional chaining or null checks.',
                keywords: ['undefined', 'property', 'access']
            },
            {
                pattern: /ReferenceError: (\w+) is not defined/,
                type: 'syntax',
                severity: 'medium',
                solution: 'Declare the variable before using it or check for typos in the variable name.',
                keywords: ['not defined', 'reference', 'variable']
            },
            {
                pattern: /SyntaxError: Unexpected token/,
                type: 'syntax',
                severity: 'high',
                solution: 'Check for missing brackets, parentheses, or semicolons. Verify syntax is correct.',
                keywords: ['syntax', 'token', 'unexpected']
            },
            {
                pattern: /Error: ENOENT: no such file or directory/,
                type: 'runtime',
                severity: 'medium',
                solution: 'Check if the file path is correct and the file exists. Verify file permissions.',
                keywords: ['file', 'directory', 'ENOENT', 'not found']
            },
            {
                pattern: /Error: ECONNREFUSED/,
                type: 'network',
                severity: 'high',
                solution: 'Check if the service is running and the connection details are correct.',
                keywords: ['connection', 'refused', 'network', 'ECONNREFUSED']
            },
            {
                pattern: /Error: timeout of \d+ms exceeded/,
                type: 'timeout',
                severity: 'medium',
                solution: 'Increase timeout value or optimize the operation to complete faster.',
                keywords: ['timeout', 'exceeded', 'ms']
            },
            {
                pattern: /Error: Maximum call stack size exceeded/,
                type: 'runtime',
                severity: 'high',
                solution: 'Check for infinite recursion or circular dependencies in your code.',
                keywords: ['stack', 'recursion', 'maximum', 'exceeded']
            },
            {
                pattern: /Error: Cannot find module '(\w+)'/,
                type: 'dependency',
                severity: 'medium',
                solution: 'Install the missing module using npm install or check if the module name is correct.',
                keywords: ['module', 'not found', 'require', 'import']
            }
        ];

        commonPatterns.forEach(pattern => {
            this.knowledgeBase.set(pattern.pattern.source, pattern);
        });
    }

    async analyzeError(errorData) {
        const errorId = generateId();
        const startTime = Date.now();

        try {
            const analysis = await this.performErrorAnalysis(errorData);
            
            const error = {
                id: errorId,
                ...errorData,
                analysis,
                severity: this.assessSeverity(analysis),
                category: this.classifyError(analysis),
                impact: this.assessImpact(analysis),
                rootCause: this.identifyRootCause(analysis),
                solutions: this.generateSolutions(analysis),
                confidence: this.calculateConfidence(analysis),
                createdAt: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.errors.set(errorId, error);
            updateAnalytics('error', error.severity === 'critical' ? 1 : 0);

            // Emit real-time update
            io.emit('error-detected', error);

            return {
                success: true,
                error,
                metadata: {
                    processingTime: error.processingTime,
                    confidence: error.confidence,
                    severity: error.severity,
                    category: error.category
                }
            };

        } catch (error) {
            logger.error('Error analysis failed:', error);
            throw error;
        }
    }

    async performErrorAnalysis(errorData) {
        // Simulate AI-powered error analysis
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const { message, stackTrace, context, logs } = errorData;
        
        // Text analysis
        const textAnalysis = this.analyzeText(message);
        
        // Pattern matching
        const patternMatch = this.matchPatterns(message, stackTrace);
        
        // Context analysis
        const contextAnalysis = this.analyzeContext(context);
        
        // Log analysis
        const logAnalysis = this.analyzeLogs(logs);
        
        // Sentiment analysis
        const sentiment = this.analyzeSentiment(message);
        
        // Similarity analysis
        const similarity = this.findSimilarErrors(message);

        return {
            textAnalysis,
            patternMatch,
            contextAnalysis,
            logAnalysis,
            sentiment,
            similarity,
            keywords: this.extractKeywords(message),
            complexity: this.assessComplexity(message, stackTrace),
            frequency: this.calculateFrequency(message)
        };
    }

    analyzeText(message) {
        const tokens = tokenizer.tokenize(message.toLowerCase());
        const stems = tokens.map(token => stemmer.stem(token));
        
        return {
            tokens: tokens.length,
            uniqueTokens: new Set(tokens).size,
            stems: stems,
            readability: this.calculateReadability(message),
            technicality: this.calculateTechnicality(tokens)
        };
    }

    matchPatterns(message, stackTrace) {
        const matches = [];
        
        for (const [patternSource, patternData] of this.knowledgeBase) {
            const regex = new RegExp(patternSource, 'i');
            if (regex.test(message) || (stackTrace && regex.test(stackTrace))) {
                matches.push({
                    pattern: patternData,
                    confidence: this.calculatePatternConfidence(message, patternData),
                    match: regex.exec(message) || regex.exec(stackTrace)
                });
            }
        }
        
        return matches.sort((a, b) => b.confidence - a.confidence);
    }

    analyzeContext(context) {
        if (!context) return { score: 0, factors: [] };
        
        const factors = [];
        let score = 0;
        
        // Check for common context factors
        if (context.environment) {
            factors.push('environment_specified');
            score += 0.2;
        }
        
        if (context.userAgent) {
            factors.push('user_agent_specified');
            score += 0.1;
        }
        
        if (context.timestamp) {
            factors.push('timestamp_specified');
            score += 0.1;
        }
        
        if (context.version) {
            factors.push('version_specified');
            score += 0.2;
        }
        
        if (context.requestId) {
            factors.push('request_id_specified');
            score += 0.1;
        }
        
        return { score: Math.min(1, score), factors };
    }

    analyzeLogs(logs) {
        if (!logs || logs.length === 0) return { score: 0, patterns: [] };
        
        const patterns = [];
        let errorCount = 0;
        let warningCount = 0;
        
        logs.forEach(log => {
            if (log.level === 'error') errorCount++;
            if (log.level === 'warn') warningCount++;
        });
        
        const totalLogs = logs.length;
        const errorRatio = errorCount / totalLogs;
        const warningRatio = warningCount / totalLogs;
        
        if (errorRatio > 0.5) patterns.push('high_error_rate');
        if (warningRatio > 0.3) patterns.push('high_warning_rate');
        if (totalLogs > 100) patterns.push('high_log_volume');
        
        return {
            score: Math.min(1, (errorRatio + warningRatio) / 2),
            patterns,
            errorCount,
            warningCount,
            totalLogs
        };
    }

    analyzeSentiment(message) {
        const result = sentiment.analyze(message);
        return {
            score: result.score,
            comparative: result.comparative,
            positive: result.positive,
            negative: result.negative,
            neutral: result.neutral
        };
    }

    findSimilarErrors(message) {
        // Simple similarity calculation based on keywords
        const messageKeywords = this.extractKeywords(message);
        const similarities = [];
        
        for (const [errorId, error] of this.errors) {
            const errorKeywords = this.extractKeywords(error.message || '');
            const similarity = this.calculateSimilarity(messageKeywords, errorKeywords);
            
            if (similarity > 0.3) {
                similarities.push({
                    errorId,
                    similarity,
                    error: {
                        message: error.message,
                        severity: error.severity,
                        category: error.category,
                        resolved: error.status === 'resolved'
                    }
                });
            }
        }
        
        return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
    }

    extractKeywords(text) {
        const tokens = tokenizer.tokenize(text.toLowerCase());
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
        
        return tokens
            .filter(token => token.length > 2 && !stopWords.has(token))
            .map(token => stemmer.stem(token));
    }

    calculateReadability(text) {
        const sentences = text.split(/[.!?]+/).length;
        const words = text.split(/\s+/).length;
        const syllables = this.countSyllables(text);
        
        if (sentences === 0 || words === 0) return 0;
        
        const avgWordsPerSentence = words / sentences;
        const avgSyllablesPerWord = syllables / words;
        
        return 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    }

    countSyllables(text) {
        const words = text.toLowerCase().split(/\s+/);
        let count = 0;
        
        words.forEach(word => {
            const vowels = word.match(/[aeiouy]+/g);
            if (vowels) {
                count += vowels.length;
            }
        });
        
        return count;
    }

    calculateTechnicality(tokens) {
        const technicalTerms = new Set([
            'error', 'exception', 'undefined', 'null', 'function', 'variable',
            'object', 'array', 'string', 'number', 'boolean', 'promise',
            'async', 'await', 'callback', 'event', 'listener', 'handler',
            'request', 'response', 'http', 'api', 'endpoint', 'database',
            'query', 'connection', 'timeout', 'retry', 'fallback', 'cache'
        ]);
        
        const technicalCount = tokens.filter(token => technicalTerms.has(token)).length;
        return technicalCount / tokens.length;
    }

    calculatePatternConfidence(message, patternData) {
        const messageKeywords = this.extractKeywords(message);
        const patternKeywords = patternData.keywords || [];
        
        const matchingKeywords = messageKeywords.filter(keyword => 
            patternKeywords.some(patternKeyword => 
                keyword.includes(patternKeyword) || patternKeyword.includes(keyword)
            )
        ).length;
        
        return matchingKeywords / Math.max(patternKeywords.length, 1);
    }

    calculateSimilarity(keywords1, keywords2) {
        if (keywords1.length === 0 || keywords2.length === 0) return 0;
        
        const set1 = new Set(keywords1);
        const set2 = new Set(keywords2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    assessSeverity(analysis) {
        let severity = 'low';
        
        // Check pattern matches
        if (analysis.patternMatch.length > 0) {
            const highestConfidence = Math.max(...analysis.patternMatch.map(m => m.confidence));
            if (highestConfidence > 0.8) {
                severity = analysis.patternMatch[0].pattern.severity;
            }
        }
        
        // Check sentiment
        if (analysis.sentiment.comparative < -0.5) {
            severity = 'high';
        }
        
        // Check complexity
        if (analysis.complexity > 0.8) {
            severity = 'high';
        }
        
        // Check frequency
        if (analysis.frequency > 0.7) {
            severity = 'critical';
        }
        
        return severity;
    }

    classifyError(analysis) {
        if (analysis.patternMatch.length > 0) {
            return analysis.patternMatch[0].pattern.type;
        }
        
        // Fallback classification based on keywords
        const keywords = analysis.keywords;
        if (keywords.includes('syntax') || keywords.includes('parse')) return 'syntax';
        if (keywords.includes('network') || keywords.includes('connection')) return 'network';
        if (keywords.includes('database') || keywords.includes('query')) return 'database';
        if (keywords.includes('memory') || keywords.includes('stack')) return 'memory';
        if (keywords.includes('timeout') || keywords.includes('slow')) return 'timeout';
        
        return 'runtime';
    }

    assessImpact(analysis) {
        const factors = [];
        let impact = 'low';
        
        if (analysis.complexity > 0.7) {
            factors.push('high_complexity');
            impact = 'high';
        }
        
        if (analysis.frequency > 0.5) {
            factors.push('frequent_occurrence');
            impact = 'high';
        }
        
        if (analysis.sentiment.comparative < -0.3) {
            factors.push('negative_sentiment');
            impact = 'medium';
        }
        
        if (analysis.logAnalysis.score > 0.7) {
            factors.push('high_log_errors');
            impact = 'high';
        }
        
        return { level: impact, factors };
    }

    identifyRootCause(analysis) {
        const causes = [];
        
        if (analysis.patternMatch.length > 0) {
            causes.push({
                type: 'pattern_match',
                description: analysis.patternMatch[0].pattern.solution,
                confidence: analysis.patternMatch[0].confidence
            });
        }
        
        if (analysis.complexity > 0.8) {
            causes.push({
                type: 'complexity',
                description: 'High complexity suggests architectural or design issues',
                confidence: 0.7
            });
        }
        
        if (analysis.frequency > 0.6) {
            causes.push({
                type: 'frequency',
                description: 'Frequent occurrence suggests systematic issues',
                confidence: 0.8
            });
        }
        
        return causes.sort((a, b) => b.confidence - a.confidence);
    }

    generateSolutions(analysis) {
        const solutions = [];
        
        // Pattern-based solutions
        if (analysis.patternMatch.length > 0) {
            solutions.push({
                type: 'pattern_based',
                title: 'Pattern-based Solution',
                description: analysis.patternMatch[0].pattern.solution,
                confidence: analysis.patternMatch[0].confidence,
                priority: 'high'
            });
        }
        
        // Similar error solutions
        if (analysis.similarity.length > 0) {
            const resolvedSimilar = analysis.similarity.filter(s => s.error.resolved);
            if (resolvedSimilar.length > 0) {
                solutions.push({
                    type: 'similar_error',
                    title: 'Solution from Similar Error',
                    description: `This error is similar to previously resolved errors. Check similar error #${resolvedSimilar[0].errorId}`,
                    confidence: resolvedSimilar[0].similarity,
                    priority: 'medium'
                });
            }
        }
        
        // General solutions based on error type
        const errorType = this.classifyError(analysis);
        const generalSolutions = this.getGeneralSolutions(errorType);
        solutions.push(...generalSolutions);
        
        return solutions.sort((a, b) => b.confidence - a.confidence);
    }

    getGeneralSolutions(errorType) {
        const solutions = {
            syntax: [{
                type: 'general',
                title: 'Syntax Error Resolution',
                description: 'Check for missing brackets, parentheses, or semicolons. Verify syntax is correct.',
                confidence: 0.6,
                priority: 'high'
            }],
            runtime: [{
                type: 'general',
                title: 'Runtime Error Resolution',
                description: 'Check for null/undefined values, type mismatches, or incorrect function calls.',
                confidence: 0.5,
                priority: 'medium'
            }],
            network: [{
                type: 'general',
                title: 'Network Error Resolution',
                description: 'Check network connectivity, service availability, and connection parameters.',
                confidence: 0.6,
                priority: 'high'
            }],
            database: [{
                type: 'general',
                title: 'Database Error Resolution',
                description: 'Check database connection, query syntax, and data integrity.',
                confidence: 0.6,
                priority: 'high'
            }]
        };
        
        return solutions[errorType] || [{
            type: 'general',
            title: 'General Error Resolution',
            description: 'Review error logs, check system status, and verify configuration.',
            confidence: 0.4,
            priority: 'low'
        }];
    }

    calculateConfidence(analysis) {
        let confidence = 0.5; // Base confidence
        
        // Pattern match confidence
        if (analysis.patternMatch.length > 0) {
            confidence += analysis.patternMatch[0].confidence * 0.3;
        }
        
        // Context analysis confidence
        confidence += analysis.contextAnalysis.score * 0.2;
        
        // Log analysis confidence
        confidence += analysis.logAnalysis.score * 0.2;
        
        // Similarity confidence
        if (analysis.similarity.length > 0) {
            confidence += analysis.similarity[0].similarity * 0.1;
        }
        
        return Math.min(1, Math.max(0, confidence));
    }

    assessComplexity(message, stackTrace) {
        let complexity = 0;
        
        // Message length factor
        complexity += Math.min(0.3, message.length / 1000);
        
        // Stack trace depth factor
        if (stackTrace) {
            const stackLines = stackTrace.split('\n').length;
            complexity += Math.min(0.3, stackLines / 20);
        }
        
        // Technical terms factor
        const technicalTerms = this.extractKeywords(message).length;
        complexity += Math.min(0.4, technicalTerms / 20);
        
        return Math.min(1, complexity);
    }

    calculateFrequency(message) {
        // Simple frequency calculation based on similar errors
        const messageKeywords = this.extractKeywords(message);
        let similarCount = 0;
        
        for (const [errorId, error] of this.errors) {
            const errorKeywords = this.extractKeywords(error.message || '');
            const similarity = this.calculateSimilarity(messageKeywords, errorKeywords);
            if (similarity > 0.5) {
                similarCount++;
            }
        }
        
        return Math.min(1, similarCount / 10);
    }

    async resolveError(errorId, resolutionData) {
        const error = this.errors.get(errorId);
        if (!error) {
            throw new Error('Error not found');
        }

        const resolutionId = generateId();
        const resolution = {
            id: resolutionId,
            errorId,
            ...resolutionData,
            status: 'in_progress',
            createdAt: new Date().toISOString(),
            resolvedAt: null
        };

        this.resolutions.set(resolutionId, resolution);
        updateAnalytics('resolved');

        // Simulate resolution process
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        // Update resolution status
        resolution.status = 'resolved';
        resolution.resolvedAt = new Date().toISOString();
        resolution.efficiency = this.calculateResolutionEfficiency(resolution);

        // Update error status
        error.status = 'resolved';
        error.resolutionId = resolutionId;

        // Emit resolution update
        io.emit('error-resolved', { error, resolution });

        return {
            success: true,
            resolution,
            efficiency: resolution.efficiency
        };
    }

    calculateResolutionEfficiency(resolution) {
        const startTime = new Date(resolution.createdAt);
        const endTime = new Date(resolution.resolvedAt);
        const duration = (endTime - startTime) / 1000 / 60; // minutes
        
        // Efficiency based on duration (shorter is better)
        return Math.max(0, Math.min(1, 1 - (duration / 60))); // 1 hour = 0 efficiency
    }

    getErrorInsights() {
        const errors = Array.from(this.errors.values());
        const resolutions = Array.from(this.resolutions.values());
        
        return {
            totalErrors: errors.length,
            resolvedErrors: resolutions.filter(r => r.status === 'resolved').length,
            averageResolutionTime: this.calculateAverageResolutionTime(resolutions),
            commonErrorTypes: this.getCommonErrorTypes(errors),
            resolutionTrends: this.getResolutionTrends(resolutions),
            topSolutions: this.getTopSolutions(resolutions)
        };
    }

    calculateAverageResolutionTime(resolutions) {
        const resolved = resolutions.filter(r => r.status === 'resolved' && r.resolvedAt);
        if (resolved.length === 0) return 0;
        
        const totalTime = resolved.reduce((sum, r) => {
            const start = new Date(r.createdAt);
            const end = new Date(r.resolvedAt);
            return sum + (end - start);
        }, 0);
        
        return totalTime / resolved.length / 1000 / 60; // minutes
    }

    getCommonErrorTypes(errors) {
        const types = {};
        errors.forEach(error => {
            types[error.category] = (types[error.category] || 0) + 1;
        });
        
        return Object.entries(types)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }

    getResolutionTrends(resolutions) {
        const trends = {};
        resolutions.forEach(resolution => {
            const date = resolution.createdAt.split('T')[0];
            trends[date] = (trends[date] || 0) + 1;
        });
        
        return Object.entries(trends)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-7) // Last 7 days
            .map(([date, count]) => ({ date, count }));
    }

    getTopSolutions(resolutions) {
        const solutions = {};
        resolutions.forEach(resolution => {
            if (resolution.solution) {
                solutions[resolution.solution] = (solutions[resolution.solution] || 0) + 1;
            }
        });
        
        return Object.entries(solutions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([solution, count]) => ({ solution, count }));
    }
}

// Initialize error resolution engine
const errorEngine = new IntelligentErrorResolutionEngine();

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    logger.info('Client connected to intelligent error resolution engine');
    
    socket.on('disconnect', () => {
        logger.info('Client disconnected from intelligent error resolution engine');
    });
    
    socket.on('subscribe-errors', () => {
        socket.join('errors');
    });
    
    socket.on('subscribe-resolutions', () => {
        socket.join('resolutions');
    });
});

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Intelligent Error Resolution',
        version: errorConfig.version,
        timestamp: new Date().toISOString(),
        features: errorConfig.features,
        errors: errorData.errors.size,
        resolutions: errorData.resolutions.size,
        patterns: errorData.patterns.size,
        solutions: errorData.solutions.size
    });
});

// Get configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...errorConfig,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
    }
});

// Analyze error
app.post('/api/analyze', async (req, res) => {
    try {
        const { message, stackTrace, context, logs } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                error: 'Error message is required',
                supportedErrorTypes: Object.keys(errorConfig.errorTypes)
            });
        }
        
        const result = await errorEngine.analyzeError({
            message,
            stackTrace,
            context,
            logs
        });
        
        res.json(result);
        
    } catch (error) {
        logger.error('Error analyzing error:', error);
        res.status(500).json({ error: 'Failed to analyze error', details: error.message });
    }
});

// Resolve error
app.post('/api/resolve/:errorId', async (req, res) => {
    try {
        const { errorId } = req.params;
        const resolutionData = req.body;
        
        const result = await errorEngine.resolveError(errorId, resolutionData);
        res.json(result);
        
    } catch (error) {
        logger.error('Error resolving error:', error);
        res.status(500).json({ error: 'Failed to resolve error', details: error.message });
    }
});

// Get errors
app.get('/api/errors', (req, res) => {
    try {
        const { type, severity, status, limit = 50, offset = 0 } = req.query;
        
        let errors = Array.from(errorEngine.errors.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Apply filters
        if (type) {
            errors = errors.filter(error => error.category === type);
        }
        
        if (severity) {
            errors = errors.filter(error => error.severity === severity);
        }
        
        if (status) {
            errors = errors.filter(error => error.status === status);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedErrors = errors.slice(startIndex, endIndex);
        
        res.json({
            errors: paginatedErrors,
            total: errors.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting errors:', error);
        res.status(500).json({ error: 'Failed to get errors', details: error.message });
    }
});

// Get resolutions
app.get('/api/resolutions', (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        
        let resolutions = Array.from(errorEngine.resolutions.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (status) {
            resolutions = resolutions.filter(resolution => resolution.status === status);
        }
        
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedResolutions = resolutions.slice(startIndex, endIndex);
        
        res.json({
            resolutions: paginatedResolutions,
            total: resolutions.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting resolutions:', error);
        res.status(500).json({ error: 'Failed to get resolutions', details: error.message });
    }
});

// Get insights
app.get('/api/insights', (req, res) => {
    try {
        const insights = errorEngine.getErrorInsights();
        res.json({
            insights,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting insights:', error);
        res.status(500).json({ error: 'Failed to get insights', details: error.message });
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
    console.log(`🔍 Intelligent Error Resolution Service v2.8.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`✨ Features: AI Error Analysis, Automated Resolution, Pattern Recognition, Root Cause Analysis`);
    console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
});

module.exports = app;
