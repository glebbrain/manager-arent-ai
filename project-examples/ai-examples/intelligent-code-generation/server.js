const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3025;

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
        new winston.transports.File({ filename: 'logs/intelligent-code-generation-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/intelligent-code-generation-combined.log' })
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

// Intelligent Code Generation Configuration v2.8.0
const codeGenConfig = {
    version: '2.8.0',
    features: {
        contextAwareGeneration: true,
        multiLanguageSupport: true,
        intelligentCompletion: true,
        codeRefactoring: true,
        patternRecognition: true,
        syntaxAnalysis: true,
        semanticAnalysis: true,
        codeOptimization: true,
        errorDetection: true,
        suggestionEngine: true,
        learningCapability: true,
        customizationSupport: true
    },
    supportedLanguages: {
        javascript: 'JavaScript',
        typescript: 'TypeScript',
        python: 'Python',
        java: 'Java',
        csharp: 'C#',
        cpp: 'C++',
        go: 'Go',
        rust: 'Rust',
        php: 'PHP',
        ruby: 'Ruby',
        swift: 'Swift',
        kotlin: 'Kotlin',
        scala: 'Scala',
        r: 'R',
        sql: 'SQL',
        html: 'HTML',
        css: 'CSS',
        xml: 'XML',
        json: 'JSON',
        yaml: 'YAML'
    },
    generationTypes: {
        function: 'Function Generation',
        class: 'Class Generation',
        module: 'Module Generation',
        test: 'Test Generation',
        documentation: 'Documentation Generation',
        refactor: 'Code Refactoring',
        optimization: 'Code Optimization',
        migration: 'Code Migration',
        completion: 'Code Completion',
        suggestion: 'Code Suggestions'
    },
    aiModels: {
        gpt4: 'GPT-4',
        claude3: 'Claude-3',
        gemini: 'Gemini',
        llama: 'Llama',
        codellama: 'CodeLlama',
        starcoder: 'StarCoder',
        wizardcoder: 'WizardCoder',
        deepseek: 'DeepSeek'
    }
};

// Data storage
let codeGenData = {
    generations: new Map(),
    patterns: new Map(),
    suggestions: new Map(),
    analytics: {
        totalGenerations: 0,
        successfulGenerations: 0,
        averageQuality: 0,
        popularPatterns: [],
        languageDistribution: {}
    }
};

// Utility functions
function generateId() {
    return uuidv4();
}

function updateAnalytics(type, success, quality = 0) {
    codeGenData.analytics.totalGenerations++;
    if (success) {
        codeGenData.analytics.successfulGenerations++;
    }
    if (quality > 0) {
        const currentAvg = codeGenData.analytics.averageQuality;
        const total = codeGenData.analytics.totalGenerations;
        codeGenData.analytics.averageQuality = (currentAvg * (total - 1) + quality) / total;
    }
}

// Intelligent Code Generation Engine
class IntelligentCodeGenerator {
    constructor() {
        this.generations = new Map();
        this.patterns = new Map();
        this.suggestions = new Map();
    }

    async generateCode(request) {
        const generationId = generateId();
        const startTime = Date.now();

        try {
            const { language, type, context, requirements, style } = request;
            
            // Simulate AI-powered code generation
            const generatedCode = await this.performCodeGeneration(language, type, context, requirements, style);
            
            const generation = {
                id: generationId,
                language,
                type,
                context,
                requirements,
                style,
                generatedCode,
                quality: this.calculateQuality(generatedCode),
                confidence: this.calculateConfidence(generatedCode, context),
                suggestions: this.generateSuggestions(generatedCode),
                createdAt: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.generations.set(generationId, generation);
            updateAnalytics('generation', true, generation.quality);

            return {
                success: true,
                generation,
                metadata: {
                    processingTime: generation.processingTime,
                    quality: generation.quality,
                    confidence: generation.confidence
                }
            };

        } catch (error) {
            logger.error('Code generation error:', error);
            updateAnalytics('generation', false);
            throw error;
        }
    }

    async performCodeGeneration(language, type, context, requirements, style) {
        // Simulate AI-powered code generation
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const templates = {
            function: this.generateFunction(language, requirements),
            class: this.generateClass(language, requirements),
            module: this.generateModule(language, requirements),
            test: this.generateTest(language, requirements),
            documentation: this.generateDocumentation(language, requirements)
        };

        return templates[type] || this.generateGenericCode(language, requirements);
    }

    generateFunction(language, requirements) {
        const templates = {
            javascript: `function ${requirements.name || 'processData'}(data) {
    // ${requirements.description || 'Process the input data'}
    try {
        ${requirements.logic || 'return data.map(item => item.value);'}
    } catch (error) {
        console.error('Error processing data:', error);
        throw error;
    }
}`,
            python: `def ${requirements.name || 'process_data'}(data):
    """
    ${requirements.description || 'Process the input data'}
    """
    try:
        ${requirements.logic || 'return [item["value"] for item in data]'}
    except Exception as e:
        print(f"Error processing data: {e}")
        raise e`,
            java: `public static ${requirements.returnType || 'List<String>'} ${requirements.name || 'processData'}(${requirements.paramType || 'List<Map<String, Object>>'} data) {
    // ${requirements.description || 'Process the input data'}
    try {
        ${requirements.logic || 'return data.stream().map(item -> item.get("value").toString()).collect(Collectors.toList());'}
    } catch (Exception e) {
        System.err.println("Error processing data: " + e.getMessage());
        throw e;
    }
}`
        };

        return templates[language] || templates.javascript;
    }

    generateClass(language, requirements) {
        const templates = {
            javascript: `class ${requirements.name || 'DataProcessor'} {
    constructor(${requirements.constructorParams || 'config'}) {
        this.config = config;
        this.initialized = false;
    }

    async initialize() {
        // ${requirements.description || 'Initialize the processor'}
        this.initialized = true;
    }

    async process(data) {
        if (!this.initialized) {
            await this.initialize();
        }
        // ${requirements.logic || 'Process the data'}
        return data;
    }
}`,
            python: `class ${requirements.name || 'DataProcessor'}:
    def __init__(self, ${requirements.constructorParams || 'config'}):
        self.config = config
        self.initialized = False

    async def initialize(self):
        """${requirements.description || 'Initialize the processor'}"""
        self.initialized = True

    async def process(self, data):
        if not self.initialized:
            await self.initialize()
        # ${requirements.logic || 'Process the data'}
        return data`,
            java: `public class ${requirements.name || 'DataProcessor'} {
    private final ${requirements.configType || 'Map<String, Object>'} config;
    private boolean initialized = false;

    public ${requirements.name || 'DataProcessor'}(${requirements.configType || 'Map<String, Object>'} config) {
        this.config = config;
    }

    public void initialize() {
        // ${requirements.description || 'Initialize the processor'}
        this.initialized = true;
    }

    public ${requirements.returnType || 'List<Object>'} process(${requirements.paramType || 'List<Object>'} data) {
        if (!initialized) {
            initialize();
        }
        // ${requirements.logic || 'Process the data'}
        return data;
    }
}`
        };

        return templates[language] || templates.javascript;
    }

    generateModule(language, requirements) {
        return `// ${requirements.name || 'Module'} - ${requirements.description || 'A utility module'}
${this.generateFunction(language, requirements)}`;
    }

    generateTest(language, requirements) {
        const templates = {
            javascript: `describe('${requirements.name || 'DataProcessor'}', () => {
    test('should process data correctly', () => {
        const processor = new ${requirements.name || 'DataProcessor'}({});
        const data = [${requirements.testData || '{ value: "test" }'}];
        const result = processor.process(data);
        expect(result).toBeDefined();
    });
});`,
            python: `import unittest

class Test${requirements.name || 'DataProcessor'}(unittest.TestCase):
    def test_process_data(self):
        processor = ${requirements.name || 'DataProcessor'}({})
        data = [${requirements.testData || '{"value": "test"}'}]
        result = processor.process(data)
        self.assertIsNotNone(result)`,
            java: `@Test
public void testProcessData() {
    ${requirements.name || 'DataProcessor'} processor = new ${requirements.name || 'DataProcessor'}(new HashMap<>());
    List<Object> data = Arrays.asList(${requirements.testData || 'new HashMap<>()'});
    List<Object> result = processor.process(data);
    assertNotNull(result);
}`
        };

        return templates[language] || templates.javascript;
    }

    generateDocumentation(language, requirements) {
        return `/**
 * ${requirements.name || 'Function'} - ${requirements.description || 'A utility function'}
 * 
 * @param {${requirements.paramType || 'Array'}} data - ${requirements.paramDescription || 'Input data to process'}
 * @returns {${requirements.returnType || 'Array'}} ${requirements.returnDescription || 'Processed data'}
 * 
 * @example
 * const result = ${requirements.name || 'processData'}([1, 2, 3]);
 * console.log(result); // [1, 2, 3]
 */`;
    }

    generateGenericCode(language, requirements) {
        return `// ${requirements.name || 'Generated Code'} - ${requirements.description || 'AI-generated code'}
// Language: ${language}
// Requirements: ${JSON.stringify(requirements, null, 2)}

${this.generateFunction(language, requirements)}`;
    }

    calculateQuality(code) {
        // Simple quality calculation based on code characteristics
        const lines = code.split('\n').length;
        const comments = (code.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length;
        const functions = (code.match(/function|def|public|private|protected/g) || []).length;
        const errorHandling = (code.match(/try|catch|throw|error/i) || []).length;
        
        let quality = 0.5; // Base quality
        
        // Add points for good practices
        if (comments > 0) quality += 0.1;
        if (functions > 0) quality += 0.1;
        if (errorHandling > 0) quality += 0.1;
        if (lines > 10) quality += 0.1;
        if (code.includes('async') || code.includes('await')) quality += 0.1;
        
        return Math.min(1.0, quality);
    }

    calculateConfidence(code, context) {
        // Simple confidence calculation
        const contextMatch = context ? 0.3 : 0.1;
        const codeQuality = this.calculateQuality(code);
        const lengthFactor = Math.min(0.2, code.split('\n').length / 100);
        
        return Math.min(1.0, contextMatch + codeQuality + lengthFactor);
    }

    generateSuggestions(code) {
        const suggestions = [];
        
        if (!code.includes('try') && !code.includes('catch')) {
            suggestions.push({
                type: 'error_handling',
                message: 'Consider adding error handling',
                priority: 'medium'
            });
        }
        
        if (!code.includes('//') && !code.includes('/*')) {
            suggestions.push({
                type: 'documentation',
                message: 'Consider adding comments for better readability',
                priority: 'low'
            });
        }
        
        if (code.includes('var ')) {
            suggestions.push({
                type: 'modern_syntax',
                message: 'Consider using let/const instead of var',
                priority: 'medium'
            });
        }
        
        return suggestions;
    }
}

// Initialize code generator
const codeGenerator = new IntelligentCodeGenerator();

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    logger.info('Client connected to intelligent code generation engine');
    
    socket.on('disconnect', () => {
        logger.info('Client disconnected from intelligent code generation engine');
    });
    
    socket.on('subscribe-generation', (generationId) => {
        socket.join(`generation-${generationId}`);
    });
});

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Intelligent Code Generation',
        version: codeGenConfig.version,
        timestamp: new Date().toISOString(),
        features: codeGenConfig.features,
        generations: codeGenData.generations.size,
        patterns: codeGenData.patterns.size,
        suggestions: codeGenData.suggestions.size
    });
});

// Get configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...codeGenConfig,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
    }
});

// Generate code
app.post('/api/generate', async (req, res) => {
    try {
        const { language, type, context, requirements, style } = req.body;
        
        if (!language || !type) {
            return res.status(400).json({ 
                error: 'Language and type are required',
                supportedLanguages: Object.keys(codeGenConfig.supportedLanguages),
                supportedTypes: Object.keys(codeGenConfig.generationTypes)
            });
        }
        
        const result = await codeGenerator.generateCode({
            language,
            type,
            context,
            requirements,
            style
        });
        
        res.json(result);
        
    } catch (error) {
        logger.error('Error generating code:', error);
        res.status(500).json({ error: 'Failed to generate code', details: error.message });
    }
});

// Get generations
app.get('/api/generations', (req, res) => {
    try {
        const { language, type, limit = 50, offset = 0 } = req.query;
        
        let generations = Array.from(codeGenerator.generations.values());
        
        // Apply filters
        if (language) {
            generations = generations.filter(gen => gen.language === language);
        }
        
        if (type) {
            generations = generations.filter(gen => gen.type === type);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedGenerations = generations.slice(startIndex, endIndex);
        
        res.json({
            generations: paginatedGenerations,
            total: generations.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting generations:', error);
        res.status(500).json({ error: 'Failed to get generations', details: error.message });
    }
});

// Get specific generation
app.get('/api/generations/:generationId', (req, res) => {
    try {
        const { generationId } = req.params;
        const generation = codeGenerator.generations.get(generationId);
        
        if (!generation) {
            return res.status(404).json({ error: 'Generation not found' });
        }
        
        res.json(generation);
        
    } catch (error) {
        logger.error('Error getting generation:', error);
        res.status(500).json({ error: 'Failed to get generation', details: error.message });
    }
});

// Get analytics
app.get('/api/analytics', (req, res) => {
    try {
        res.json({
            analytics: codeGenData.analytics,
            timestamp: new Date().toISOString()
        });
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
    console.log(`🤖 Intelligent Code Generation Service v2.8.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`✨ Features: Context-Aware Generation, Multi-Language Support, AI-Powered Completion`);
    console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
});

module.exports = app;
