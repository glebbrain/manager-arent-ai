const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');
const { Pool } = require('pg');
const Redis = require('redis');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import components
const IntegratedExportSystem = require('./integrated-export-system');
const ExportEngine = require('./export-engine');
const FormatConverter = require('./format-converter');
const DataProcessor = require('./data-processor');
const ExportScheduler = require('./export-scheduler');
const ExportValidator = require('./export-validator');
const ExportMonitor = require('./export-monitor');
const ExportSecurity = require('./export-security');
const ExportOptimizer = require('./export-optimizer');
const ExportAnalytics = require('./export-analytics');

const app = express();
const PORT = process.env.PORT || 3018;
const SERVICE_NAME = process.env.SERVICE_NAME || 'data-export-service';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/manager_agent_ai',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis connection
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/data-export.log' }),
    new winston.transports.File({ filename: 'logs/data-export-error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize components
const integratedExportSystem = new IntegratedExportSystem(pool, redis, logger);
const exportEngine = new ExportEngine(pool, redis, logger);
const formatConverter = new FormatConverter(logger);
const dataProcessor = new DataProcessor(pool, logger);
const exportScheduler = new ExportScheduler(pool, redis, logger);
const exportValidator = new ExportValidator(logger);
const exportMonitor = new ExportMonitor(pool, redis, logger);
const exportSecurity = new ExportSecurity(logger);
const exportOptimizer = new ExportOptimizer(pool, logger);
const exportAnalytics = new ExportAnalytics(pool, logger);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 3019 });

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  logger.info('New WebSocket connection established');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleWebSocketMessage(ws, data);
    } catch (error) {
      logger.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.4.0'
  });
});

// Status endpoint
app.get('/status', async (req, res) => {
  try {
    const status = await integratedExportSystem.getSystemStatus();
    res.json(status);
  } catch (error) {
    logger.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Export endpoints
app.post('/export', async (req, res) => {
  try {
    const { data, format, options = {} } = req.body;
    
    // Validate request
    const validation = await exportValidator.validateExportRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    // Security check
    const securityCheck = await exportSecurity.validateRequest(req);
    if (!securityCheck.allowed) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Process export
    const result = await integratedExportSystem.exportData(data, format, options);
    
    res.json({
      success: true,
      exportId: result.exportId,
      downloadUrl: result.downloadUrl,
      expiresAt: result.expiresAt
    });
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Batch export endpoint
app.post('/export/batch', async (req, res) => {
  try {
    const { exports } = req.body;
    
    const results = await integratedExportSystem.batchExport(exports);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    logger.error('Batch export error:', error);
    res.status(500).json({ error: 'Batch export failed' });
  }
});

// Scheduled export endpoints
app.post('/export/schedule', async (req, res) => {
  try {
    const { schedule, data, format, options = {} } = req.body;
    
    const result = await exportScheduler.scheduleExport(schedule, data, format, options);
    
    res.json({
      success: true,
      scheduleId: result.scheduleId,
      nextRun: result.nextRun
    });
  } catch (error) {
    logger.error('Schedule export error:', error);
    res.status(500).json({ error: 'Failed to schedule export' });
  }
});

app.get('/export/schedule', async (req, res) => {
  try {
    const schedules = await exportScheduler.getSchedules();
    res.json(schedules);
  } catch (error) {
    logger.error('Get schedules error:', error);
    res.status(500).json({ error: 'Failed to get schedules' });
  }
});

app.delete('/export/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await exportScheduler.cancelSchedule(id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Cancel schedule error:', error);
    res.status(500).json({ error: 'Failed to cancel schedule' });
  }
});

// Export history
app.get('/export/history', async (req, res) => {
  try {
    const { page = 1, limit = 20, format, status } = req.query;
    const history = await integratedExportSystem.getExportHistory({
      page: parseInt(page),
      limit: parseInt(limit),
      format,
      status
    });
    res.json(history);
  } catch (error) {
    logger.error('Get export history error:', error);
    res.status(500).json({ error: 'Failed to get export history' });
  }
});

// Download endpoint
app.get('/export/download/:exportId', async (req, res) => {
  try {
    const { exportId } = req.params;
    const filePath = await integratedExportSystem.getExportFile(exportId);
    
    if (!filePath) {
      return res.status(404).json({ error: 'Export not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    logger.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Format support
app.get('/formats', (req, res) => {
  const formats = formatConverter.getSupportedFormats();
  res.json(formats);
});

// Data sources
app.get('/data-sources', async (req, res) => {
  try {
    const sources = await dataProcessor.getDataSources();
    res.json(sources);
  } catch (error) {
    logger.error('Get data sources error:', error);
    res.status(500).json({ error: 'Failed to get data sources' });
  }
});

// Analytics
app.get('/analytics', async (req, res) => {
  try {
    const analytics = await exportAnalytics.getAnalytics();
    res.json(analytics);
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Optimization
app.post('/optimize', async (req, res) => {
  try {
    const { exportId } = req.body;
    const optimization = await exportOptimizer.optimizeExport(exportId);
    res.json(optimization);
  } catch (error) {
    logger.error('Optimization error:', error);
    res.status(500).json({ error: 'Optimization failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// WebSocket message handler
async function handleWebSocketMessage(ws, data) {
  try {
    switch (data.type) {
      case 'subscribe':
        // Subscribe to export updates
        ws.exportId = data.exportId;
        break;
      case 'unsubscribe':
        ws.exportId = null;
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  } catch (error) {
    logger.error('WebSocket message handling error:', error);
    ws.send(JSON.stringify({ error: 'Message handling failed' }));
  }
}

// Start server
async function startServer() {
  try {
    // Connect to Redis
    await redis.connect();
    logger.info('Connected to Redis');
    
    // Initialize database
    await integratedExportSystem.initialize();
    logger.info('Database initialized');
    
    // Start scheduled exports
    await exportScheduler.start();
    logger.info('Export scheduler started');
    
    // Start monitoring
    await exportMonitor.start();
    logger.info('Export monitor started');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`${SERVICE_NAME} server running on port ${PORT}`);
      logger.info(`WebSocket server running on port 3019`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await exportScheduler.stop();
    await exportMonitor.stop();
    await redis.quit();
    await pool.end();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    await exportScheduler.stop();
    await exportMonitor.stop();
    await redis.quit();
    await pool.end();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();
