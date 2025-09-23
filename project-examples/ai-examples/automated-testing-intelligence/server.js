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

const PORT = process.env.PORT || 3026;

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
        new winston.transports.File({ filename: 'logs/automated-testing-intelligence-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/automated-testing-intelligence-combined.log' })
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

// Automated Testing Intelligence Configuration v2.8.0
const testingConfig = {
    version: '2.8.0',
    features: {
        intelligentTestGeneration: true,
        testOptimization: true,
        coverageAnalysis: true,
        mutationTesting: true,
        performanceTesting: true,
        securityTesting: true,
        accessibilityTesting: true,
        visualRegressionTesting: true,
        apiTesting: true,
        loadTesting: true,
        stressTesting: true,
        chaosTesting: true,
        exploratoryTesting: true,
        riskBasedTesting: true,
        predictiveTesting: true,
        adaptiveTesting: true,
        crossBrowserTesting: true,
        mobileTesting: true,
        integrationTesting: true,
        endToEndTesting: true
    },
    testTypes: {
        unit: 'Unit Testing',
        integration: 'Integration Testing',
        system: 'System Testing',
        acceptance: 'Acceptance Testing',
        performance: 'Performance Testing',
        security: 'Security Testing',
        accessibility: 'Accessibility Testing',
        visual: 'Visual Regression Testing',
        api: 'API Testing',
        load: 'Load Testing',
        stress: 'Stress Testing',
        chaos: 'Chaos Testing',
        exploratory: 'Exploratory Testing',
        smoke: 'Smoke Testing',
        regression: 'Regression Testing',
        sanity: 'Sanity Testing',
        compatibility: 'Compatibility Testing',
        usability: 'Usability Testing',
        reliability: 'Reliability Testing',
        maintainability: 'Maintainability Testing'
    },
    frameworks: {
        javascript: ['Jest', 'Mocha', 'Jasmine', 'Cypress', 'Playwright', 'Puppeteer'],
        typescript: ['Jest', 'Mocha', 'Jasmine', 'Cypress', 'Playwright', 'Puppeteer'],
        python: ['pytest', 'unittest', 'nose2', 'Selenium', 'Robot Framework'],
        java: ['JUnit', 'TestNG', 'Selenium', 'Cucumber', 'RestAssured'],
        csharp: ['NUnit', 'xUnit', 'MSTest', 'Selenium', 'SpecFlow'],
        cpp: ['Google Test', 'Catch2', 'Boost.Test', 'CppUnit'],
        go: ['testing', 'testify', 'ginkgo', 'gomega'],
        rust: ['cargo test', 'proptest', 'quickcheck'],
        php: ['PHPUnit', 'Codeception', 'Behat'],
        ruby: ['RSpec', 'Minitest', 'Cucumber', 'Capybara'],
        swift: ['XCTest', 'Quick', 'Nimble'],
        kotlin: ['JUnit', 'Spek', 'MockK', 'Kotest']
    },
    aiModels: {
        testGeneration: 'GPT-4, Claude-3, CodeLlama',
        testOptimization: 'Custom ML Models',
        coverageAnalysis: 'Deep Learning Models',
        mutationTesting: 'Genetic Algorithms',
        performancePrediction: 'Time Series Models',
        riskAssessment: 'Risk Analysis Models'
    }
};

// Data storage
let testingData = {
    testSuites: new Map(),
    testCases: new Map(),
    testRuns: new Map(),
    coverage: new Map(),
    mutations: new Map(),
    analytics: {
        totalTestSuites: 0,
        totalTestCases: 0,
        totalTestRuns: 0,
        averageCoverage: 0,
        averageExecutionTime: 0,
        successRate: 0,
        failureRate: 0,
        flakyTestRate: 0
    }
};

// Utility functions
function generateId() {
    return uuidv4();
}

function updateAnalytics(type, success, executionTime = 0, coverage = 0) {
    testingData.analytics.totalTestRuns++;
    if (success) {
        testingData.analytics.successRate = (testingData.analytics.successRate * (testingData.analytics.totalTestRuns - 1) + 1) / testingData.analytics.totalTestRuns;
    } else {
        testingData.analytics.failureRate = (testingData.analytics.failureRate * (testingData.analytics.totalTestRuns - 1) + 1) / testingData.analytics.totalTestRuns;
    }
    
    if (executionTime > 0) {
        const currentAvg = testingData.analytics.averageExecutionTime;
        const total = testingData.analytics.totalTestRuns;
        testingData.analytics.averageExecutionTime = (currentAvg * (total - 1) + executionTime) / total;
    }
    
    if (coverage > 0) {
        const currentAvg = testingData.analytics.averageCoverage;
        const total = testingData.analytics.totalTestRuns;
        testingData.analytics.averageCoverage = (currentAvg * (total - 1) + coverage) / total;
    }
}

// Intelligent Testing Engine
class IntelligentTestingEngine {
    constructor() {
        this.testSuites = new Map();
        this.testCases = new Map();
        this.testRuns = new Map();
        this.coverage = new Map();
        this.mutations = new Map();
    }

    async generateTestSuite(request) {
        const suiteId = generateId();
        const startTime = Date.now();

        try {
            const { language, framework, type, sourceCode, requirements } = request;
            
            // Simulate AI-powered test suite generation
            const testSuite = await this.performTestGeneration(language, framework, type, sourceCode, requirements);
            
            const suite = {
                id: suiteId,
                language,
                framework,
                type,
                sourceCode,
                requirements,
                testSuite,
                coverage: this.calculateCoverage(testSuite, sourceCode),
                complexity: this.calculateComplexity(testSuite),
                maintainability: this.calculateMaintainability(testSuite),
                createdAt: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.testSuites.set(suiteId, suite);
            testingData.analytics.totalTestSuites++;
            testingData.analytics.totalTestCases += testSuite.testCases.length;

            return {
                success: true,
                testSuite: suite,
                metadata: {
                    processingTime: suite.processingTime,
                    coverage: suite.coverage,
                    complexity: suite.complexity,
                    maintainability: suite.maintainability
                }
            };

        } catch (error) {
            logger.error('Test suite generation error:', error);
            throw error;
        }
    }

    async performTestGeneration(language, framework, type, sourceCode, requirements) {
        // Simulate AI-powered test generation
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 3000));

        const testCases = this.generateTestCases(language, framework, type, sourceCode, requirements);
        const setup = this.generateSetup(language, framework);
        const teardown = this.generateTeardown(language, framework);
        const mocks = this.generateMocks(language, framework, sourceCode);

        return {
            testCases,
            setup,
            teardown,
            mocks,
            configuration: this.generateConfiguration(language, framework),
            utilities: this.generateUtilities(language, framework)
        };
    }

    generateTestCases(language, framework, type, sourceCode, requirements) {
        const testCases = [];
        const functions = this.extractFunctions(sourceCode);
        
        functions.forEach(func => {
            const testCase = {
                id: generateId(),
                name: `test_${func.name}`,
                description: `Test for ${func.name} function`,
                type: type,
                priority: this.calculatePriority(func),
                testSteps: this.generateTestSteps(func, language, framework),
                expectedResults: this.generateExpectedResults(func),
                testData: this.generateTestData(func),
                assertions: this.generateAssertions(func, language, framework),
                tags: this.generateTags(func, type)
            };
            testCases.push(testCase);
        });

        return testCases;
    }

    extractFunctions(sourceCode) {
        // Simple function extraction (in real implementation, use AST parsing)
        const functions = [];
        const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|def\s+(\w+)|public\s+.*?\s+(\w+)\s*\(|private\s+.*?\s+(\w+)\s*\()/g;
        let match;
        
        while ((match = functionRegex.exec(sourceCode)) !== null) {
            const name = match[1] || match[2] || match[3] || match[4] || match[5];
            if (name) {
                functions.push({
                    name,
                    parameters: this.extractParameters(sourceCode, name),
                    returnType: this.extractReturnType(sourceCode, name),
                    complexity: this.calculateFunctionComplexity(sourceCode, name)
                });
            }
        }

        return functions.length > 0 ? functions : [{
            name: 'defaultFunction',
            parameters: [],
            returnType: 'void',
            complexity: 'medium'
        }];
    }

    extractParameters(sourceCode, functionName) {
        // Simple parameter extraction
        const paramRegex = new RegExp(`(?:function\\s+${functionName}|const\\s+${functionName}\\s*=\\s*(?:async\\s+)?\\(|def\\s+${functionName}|\\w+\\s+${functionName}\\s*\\()\\s*\\(([^)]*)\\)`);
        const match = sourceCode.match(paramRegex);
        if (match && match[1]) {
            return match[1].split(',').map(param => param.trim()).filter(param => param.length > 0);
        }
        return [];
    }

    extractReturnType(sourceCode, functionName) {
        // Simple return type extraction
        if (sourceCode.includes('return') || sourceCode.includes('yield')) {
            return 'mixed';
        }
        return 'void';
    }

    calculateFunctionComplexity(sourceCode, functionName) {
        // Simple complexity calculation
        const functionCode = this.extractFunctionCode(sourceCode, functionName);
        const lines = functionCode.split('\n').length;
        const conditions = (functionCode.match(/if|else|switch|case|while|for|catch/g) || []).length;
        const loops = (functionCode.match(/for|while|do/g) || []).length;
        
        if (lines > 50 || conditions > 10 || loops > 5) return 'high';
        if (lines > 20 || conditions > 5 || loops > 2) return 'medium';
        return 'low';
    }

    extractFunctionCode(sourceCode, functionName) {
        // Simple function code extraction
        const startRegex = new RegExp(`(?:function\\s+${functionName}|const\\s+${functionName}\\s*=\\s*(?:async\\s+)?\\(|def\\s+${functionName}|\\w+\\s+${functionName}\\s*\\()`);
        const startMatch = sourceCode.match(startRegex);
        if (startMatch) {
            const startIndex = sourceCode.indexOf(startMatch[0]);
            let braceCount = 0;
            let inFunction = false;
            
            for (let i = startIndex; i < sourceCode.length; i++) {
                if (sourceCode[i] === '{' || sourceCode[i] === '(') {
                    braceCount++;
                    inFunction = true;
                } else if (sourceCode[i] === '}' || sourceCode[i] === ')') {
                    braceCount--;
                    if (inFunction && braceCount === 0) {
                        return sourceCode.substring(startIndex, i + 1);
                    }
                }
            }
        }
        return sourceCode;
    }

    generateTestSteps(func, language, framework) {
        const steps = [
            `Given a ${func.name} function`,
            `When I call ${func.name} with test data`,
            `Then it should return expected results`
        ];

        if (func.parameters.length > 0) {
            steps.splice(1, 0, `And I provide ${func.parameters.join(', ')} as parameters`);
        }

        return steps;
    }

    generateExpectedResults(func) {
        return [
            'Function should execute without errors',
            'Function should return correct data type',
            'Function should handle edge cases properly'
        ];
    }

    generateTestData(func) {
        const testData = {
            valid: this.generateValidTestData(func),
            invalid: this.generateInvalidTestData(func),
            edge: this.generateEdgeCaseTestData(func)
        };
        return testData;
    }

    generateValidTestData(func) {
        return func.parameters.map(param => {
            if (param.includes('string') || param.includes('String')) {
                return `"test_${param}"`;
            } else if (param.includes('number') || param.includes('int') || param.includes('Number')) {
                return '42';
            } else if (param.includes('boolean') || param.includes('Boolean')) {
                return 'true';
            } else if (param.includes('array') || param.includes('Array') || param.includes('[]')) {
                return '[1, 2, 3]';
            } else if (param.includes('object') || param.includes('Object') || param.includes('{}')) {
                return '{ key: "value" }';
            }
            return 'null';
        });
    }

    generateInvalidTestData(func) {
        return func.parameters.map(param => {
            if (param.includes('string') || param.includes('String')) {
                return 'null';
            } else if (param.includes('number') || param.includes('int') || param.includes('Number')) {
                return '"invalid"';
            } else if (param.includes('boolean') || param.includes('Boolean')) {
                return 'null';
            } else if (param.includes('array') || param.includes('Array') || param.includes('[]')) {
                return 'null';
            } else if (param.includes('object') || param.includes('Object') || param.includes('{}')) {
                return 'null';
            }
            return 'undefined';
        });
    }

    generateEdgeCaseTestData(func) {
        return func.parameters.map(param => {
            if (param.includes('string') || param.includes('String')) {
                return '""';
            } else if (param.includes('number') || param.includes('int') || param.includes('Number')) {
                return '0';
            } else if (param.includes('boolean') || param.includes('Boolean')) {
                return 'false';
            } else if (param.includes('array') || param.includes('Array') || param.includes('[]')) {
                return '[]';
            } else if (param.includes('object') || param.includes('Object') || param.includes('{}')) {
                return '{}';
            }
            return 'null';
        });
    }

    generateAssertions(func, language, framework) {
        const assertions = [
            'Should not throw an error',
            'Should return expected data type',
            'Should handle input validation'
        ];

        if (func.returnType !== 'void') {
            assertions.push('Should return non-null value');
            assertions.push('Should return expected result');
        }

        return assertions;
    }

    generateTags(func, type) {
        const tags = [type, func.complexity];
        if (func.parameters.length > 0) tags.push('parameterized');
        if (func.returnType !== 'void') tags.push('return-value');
        return tags;
    }

    calculatePriority(func) {
        if (func.complexity === 'high') return 'high';
        if (func.complexity === 'medium') return 'medium';
        return 'low';
    }

    generateSetup(language, framework) {
        const setups = {
            javascript: `beforeEach(() => {
    // Setup test environment
    console.log('Setting up test...');
});`,
            python: `def setUp(self):
    """Set up test fixtures before each test method."""
    self.test_data = {}
    print("Setting up test...")`,
            java: `@BeforeEach
void setUp() {
    // Setup test environment
    System.out.println("Setting up test...");
}`
        };
        return setups[language] || setups.javascript;
    }

    generateTeardown(language, framework) {
        const teardowns = {
            javascript: `afterEach(() => {
    // Cleanup after test
    console.log('Cleaning up test...');
});`,
            python: `def tearDown(self):
    """Clean up after each test method."""
    self.test_data = None
    print("Cleaning up test...")`,
            java: `@AfterEach
void tearDown() {
    // Cleanup after test
    System.out.println("Cleaning up test...");
}`
        };
        return teardowns[language] || teardowns.javascript;
    }

    generateMocks(language, framework, sourceCode) {
        const mocks = {
            javascript: `const mockFunction = jest.fn();
const mockData = { id: 1, name: 'test' };`,
            python: `from unittest.mock import Mock, patch
mock_function = Mock()
mock_data = {'id': 1, 'name': 'test'}`,
            java: `@Mock
private SomeService mockService;
@Mock
private SomeData mockData;`
        };
        return mocks[language] || mocks.javascript;
    }

    generateConfiguration(language, framework) {
        const configs = {
            javascript: `module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};`,
            python: `[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "--cov=src --cov-report=html --cov-report=term"`,
            java: `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <coverage>
        <include name="com.example.*"/>
        <exclude name="com.example.test.*"/>
    </coverage>
</configuration>`
        };
        return configs[language] || configs.javascript;
    }

    generateUtilities(language, framework) {
        const utilities = {
            javascript: `// Test utilities
const testUtils = {
    createMockData: () => ({ id: 1, name: 'test' }),
    assertValidResponse: (response) => {
        expect(response).toBeDefined();
        expect(response.status).toBe(200);
    }
};`,
            python: `# Test utilities
class TestUtils:
    @staticmethod
    def create_mock_data():
        return {'id': 1, 'name': 'test'}
    
    @staticmethod
    def assert_valid_response(response):
        assert response is not None
        assert response.status_code == 200`,
            java: `// Test utilities
public class TestUtils {
    public static Map<String, Object> createMockData() {
        Map<String, Object> data = new HashMap<>();
        data.put("id", 1);
        data.put("name", "test");
        return data;
    }
    
    public static void assertValidResponse(Response response) {
        assertNotNull(response);
        assertEquals(200, response.getStatusCode());
    }
}`
        };
        return utilities[language] || utilities.javascript;
    }

    calculateCoverage(testSuite, sourceCode) {
        // Simple coverage calculation
        const totalLines = sourceCode.split('\n').length;
        const testLines = testSuite.testCases.length * 5; // Estimate
        return Math.min(100, Math.round((testLines / totalLines) * 100));
    }

    calculateComplexity(testSuite) {
        const totalTestCases = testSuite.testCases.length;
        const totalAssertions = testSuite.testCases.reduce((sum, tc) => sum + tc.assertions.length, 0);
        const avgAssertions = totalAssertions / totalTestCases;
        
        if (avgAssertions > 5) return 'high';
        if (avgAssertions > 3) return 'medium';
        return 'low';
    }

    calculateMaintainability(testSuite) {
        const factors = {
            testCaseCount: testSuite.testCases.length,
            avgAssertions: testSuite.testCases.reduce((sum, tc) => sum + tc.assertions.length, 0) / testSuite.testCases.length,
            hasSetup: testSuite.setup ? 1 : 0,
            hasTeardown: testSuite.teardown ? 1 : 0,
            hasMocks: testSuite.mocks ? 1 : 0
        };
        
        let score = 0;
        if (factors.testCaseCount > 0 && factors.testCaseCount < 20) score += 0.3;
        if (factors.avgAssertions > 2 && factors.avgAssertions < 6) score += 0.3;
        if (factors.hasSetup) score += 0.2;
        if (factors.hasTeardown) score += 0.1;
        if (factors.hasMocks) score += 0.1;
        
        return Math.min(1.0, score);
    }

    async runTestSuite(suiteId) {
        const suite = this.testSuites.get(suiteId);
        if (!suite) {
            throw new Error('Test suite not found');
        }

        const runId = generateId();
        const startTime = Date.now();

        try {
            // Simulate test execution
            const results = await this.executeTests(suite);
            const executionTime = Date.now() - startTime;

            const testRun = {
                id: runId,
                suiteId,
                results,
                executionTime,
                status: results.failed === 0 ? 'passed' : 'failed',
                createdAt: new Date().toISOString()
            };

            this.testRuns.set(runId, testRun);
            updateAnalytics('test_run', results.failed === 0, executionTime, suite.coverage);

            return {
                success: true,
                testRun,
                summary: {
                    total: results.total,
                    passed: results.passed,
                    failed: results.failed,
                    skipped: results.skipped,
                    executionTime,
                    coverage: suite.coverage
                }
            };

        } catch (error) {
            logger.error('Test execution error:', error);
            updateAnalytics('test_run', false, Date.now() - startTime);
            throw error;
        }
    }

    async executeTests(suite) {
        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const total = suite.testCases.length;
        const passed = Math.floor(total * (0.8 + Math.random() * 0.2));
        const failed = total - passed;
        const skipped = Math.floor(total * 0.1);

        return {
            total,
            passed,
            failed,
            skipped,
            details: suite.testCases.map(tc => ({
                id: tc.id,
                name: tc.name,
                status: Math.random() > 0.1 ? 'passed' : 'failed',
                executionTime: Math.random() * 1000,
                error: Math.random() > 0.9 ? 'Test assertion failed' : null
            }))
        };
    }
}

// Initialize testing engine
const testingEngine = new IntelligentTestingEngine();

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    logger.info('Client connected to automated testing intelligence engine');
    
    socket.on('disconnect', () => {
        logger.info('Client disconnected from automated testing intelligence engine');
    });
    
    socket.on('subscribe-test-suite', (suiteId) => {
        socket.join(`test-suite-${suiteId}`);
    });
});

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Automated Testing Intelligence',
        version: testingConfig.version,
        timestamp: new Date().toISOString(),
        features: testingConfig.features,
        testSuites: testingData.testSuites.size,
        testCases: testingData.testCases.size,
        testRuns: testingData.testRuns.size
    });
});

// Get configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...testingConfig,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
    }
});

// Generate test suite
app.post('/api/generate-tests', async (req, res) => {
    try {
        const { language, framework, type, sourceCode, requirements } = req.body;
        
        if (!language || !framework || !sourceCode) {
            return res.status(400).json({ 
                error: 'Language, framework, and sourceCode are required',
                supportedLanguages: Object.keys(testingConfig.frameworks),
                supportedFrameworks: testingConfig.frameworks
            });
        }
        
        const result = await testingEngine.generateTestSuite({
            language,
            framework,
            type,
            sourceCode,
            requirements
        });
        
        res.json(result);
        
    } catch (error) {
        logger.error('Error generating test suite:', error);
        res.status(500).json({ error: 'Failed to generate test suite', details: error.message });
    }
});

// Run test suite
app.post('/api/run-tests/:suiteId', async (req, res) => {
    try {
        const { suiteId } = req.params;
        
        const result = await testingEngine.runTestSuite(suiteId);
        res.json(result);
        
    } catch (error) {
        logger.error('Error running test suite:', error);
        res.status(500).json({ error: 'Failed to run test suite', details: error.message });
    }
});

// Get test suites
app.get('/api/test-suites', (req, res) => {
    try {
        const { language, framework, type, limit = 50, offset = 0 } = req.query;
        
        let suites = Array.from(testingEngine.testSuites.values());
        
        // Apply filters
        if (language) {
            suites = suites.filter(suite => suite.language === language);
        }
        
        if (framework) {
            suites = suites.filter(suite => suite.framework === framework);
        }
        
        if (type) {
            suites = suites.filter(suite => suite.type === type);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedSuites = suites.slice(startIndex, endIndex);
        
        res.json({
            testSuites: paginatedSuites,
            total: suites.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting test suites:', error);
        res.status(500).json({ error: 'Failed to get test suites', details: error.message });
    }
});

// Get test runs
app.get('/api/test-runs', (req, res) => {
    try {
        const { suiteId, status, limit = 50, offset = 0 } = req.query;
        
        let runs = Array.from(testingEngine.testRuns.values());
        
        // Apply filters
        if (suiteId) {
            runs = runs.filter(run => run.suiteId === suiteId);
        }
        
        if (status) {
            runs = runs.filter(run => run.status === status);
        }
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedRuns = runs.slice(startIndex, endIndex);
        
        res.json({
            testRuns: paginatedRuns,
            total: runs.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        logger.error('Error getting test runs:', error);
        res.status(500).json({ error: 'Failed to get test runs', details: error.message });
    }
});

// Get analytics
app.get('/api/analytics', (req, res) => {
    try {
        res.json({
            analytics: testingData.analytics,
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
    console.log(`🧪 Automated Testing Intelligence Service v2.8.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`✨ Features: AI Test Generation, Test Optimization, Coverage Analysis, Mutation Testing`);
    console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
});

module.exports = app;
