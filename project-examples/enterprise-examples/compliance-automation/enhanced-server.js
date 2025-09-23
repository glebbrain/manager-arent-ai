const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

// Import enhanced compliance engine
const EnhancedComplianceEngine = require('./modules/enhanced-compliance-engine');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'enhanced-compliance-automation' },
  transports: [
    new winston.transports.File({ filename: 'logs/enhanced-compliance.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/enhanced-compliance-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3010;

// Initialize enhanced compliance engine
const complianceEngine = new EnhancedComplianceEngine();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true
}));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Enhanced Compliance Automation',
    version: '2.7.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes

// Get all compliance frameworks
app.get('/api/frameworks', (req, res) => {
  try {
    const frameworks = complianceEngine.getAllFrameworks();
    res.json({
      success: true,
      data: frameworks,
      count: frameworks.length
    });
  } catch (error) {
    logger.error('Error getting frameworks:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get specific framework
app.get('/api/frameworks/:id', (req, res) => {
  try {
    const framework = complianceEngine.getFramework(req.params.id);
    if (!framework) {
      return res.status(404).json({
        success: false,
        error: 'Framework not found',
        message: `Framework with ID ${req.params.id} not found`
      });
    }

    res.json({
      success: true,
      data: framework
    });
  } catch (error) {
    logger.error('Error getting framework:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Run compliance assessment
app.post('/api/assessments', async (req, res) => {
  try {
    const { frameworkId, scope = {} } = req.body;

    if (!frameworkId) {
      return res.status(400).json({
        success: false,
        error: 'Framework ID is required',
        message: 'Please specify the compliance framework to assess'
      });
    }

    const assessment = await complianceEngine.runComplianceAssessment(frameworkId, scope);

    res.json({
      success: true,
      data: assessment,
      message: 'Compliance assessment completed successfully'
    });
  } catch (error) {
    logger.error('Error running compliance assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get assessment results
app.get('/api/assessments/:id', (req, res) => {
  try {
    const assessment = complianceEngine.getAssessment(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found',
        message: `Assessment with ID ${req.params.id} not found`
      });
    }

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    logger.error('Error getting assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get all assessments
app.get('/api/assessments', (req, res) => {
  try {
    const assessments = complianceEngine.getAllAssessments();
    res.json({
      success: true,
      data: assessments,
      count: assessments.length
    });
  } catch (error) {
    logger.error('Error getting assessments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get compliance status
app.get('/api/status', (req, res) => {
  try {
    const status = complianceEngine.getComplianceStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting compliance status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Run specific framework assessment
app.post('/api/frameworks/:id/assess', async (req, res) => {
  try {
    const { scope = {} } = req.body;
    const assessment = await complianceEngine.runComplianceAssessment(req.params.id, scope);

    res.json({
      success: true,
      data: assessment,
      message: `Compliance assessment for ${req.params.id} completed successfully`
    });
  } catch (error) {
    logger.error('Error running framework assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get compliance metrics
app.get('/api/metrics', (req, res) => {
  try {
    const status = complianceEngine.getComplianceStatus();
    res.json({
      success: true,
      data: {
        overall: status.overall,
        frameworks: status.frameworks,
        metrics: status.metrics
      }
    });
  } catch (error) {
    logger.error('Error getting compliance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Generate compliance report
app.post('/api/reports/generate', async (req, res) => {
  try {
    const { frameworkId, format = 'json', includeDetails = true } = req.body;

    if (!frameworkId) {
      return res.status(400).json({
        success: false,
        error: 'Framework ID is required',
        message: 'Please specify the compliance framework for the report'
      });
    }

    const framework = complianceEngine.getFramework(frameworkId);
    if (!framework) {
      return res.status(404).json({
        success: false,
        error: 'Framework not found',
        message: `Framework with ID ${frameworkId} not found`
      });
    }

    // Run fresh assessment for report
    const assessment = await complianceEngine.runComplianceAssessment(frameworkId, req.body.scope || {});

    const report = {
      id: uuidv4(),
      frameworkId,
      frameworkName: framework.name,
      generatedAt: new Date().toISOString(),
      assessment,
      summary: {
        score: assessment.score,
        status: assessment.status,
        totalControls: Object.keys(assessment.results).length,
        passedControls: Object.values(assessment.results).filter(r => r.status === 'passed').length,
        failedControls: Object.values(assessment.results).filter(r => r.status === 'failed').length,
        criticalViolations: assessment.violations.filter(v => v.level === 'critical').length,
        highViolations: assessment.violations.filter(v => v.level === 'high').length,
        mediumViolations: assessment.violations.filter(v => v.level === 'medium').length,
        lowViolations: assessment.violations.filter(v => v.level === 'low').length
      },
      recommendations: assessment.recommendations
    };

    if (format === 'json') {
      res.json({
        success: true,
        data: report
      });
    } else {
      // For other formats, you would implement specific formatters
      res.json({
        success: true,
        data: report,
        message: 'Report generated successfully'
      });
    }
  } catch (error) {
    logger.error('Error generating compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
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
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Initialize and start server
async function startServer() {
  try {
    await complianceEngine.initialize();
    
    app.listen(PORT, () => {
      logger.info(`🔒 Enhanced Compliance Automation Server v2.7.0 running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔍 API documentation: http://localhost:${PORT}/api/frameworks`);
      logger.info(`🤖 AI-Enhanced Compliance Analysis: Enabled`);
      logger.info(`🛡️ Enterprise Compliance Features: Active`);
      logger.info(`🔐 Supported Frameworks: GDPR, HIPAA, SOC2, PCI-DSS`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
