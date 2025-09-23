const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import modules
const quantumNeuralNetwork = require('./modules/quantum-neural-network');
const quantumOptimization = require('./modules/quantum-optimization');
const quantumAlgorithms = require('./modules/quantum-algorithms');
const quantumSimulator = require('./modules/quantum-simulator');
const realTimeFineTuning = require('./modules/real-time-fine-tuning');
const advancedSecurity = require('./modules/advanced-security');
const edgeComputing = require('./modules/edge-computing');
const federatedLearning = require('./modules/federated-learning');
const aiModelMarketplace = require('./modules/ai-model-marketplace');
const logger = require('./modules/logger');

// Import routes
const quantumNNRoutes = require('./routes/quantum-nn');
const quantumOptRoutes = require('./routes/quantum-optimization');
const quantumAlgRoutes = require('./routes/quantum-algorithms');
const quantumSimRoutes = require('./routes/quantum-simulator');
const realTimeFineTuningRoutes = require('./routes/real-time-fine-tuning');
const advancedSecurityRoutes = require('./routes/advanced-security');
const edgeComputingRoutes = require('./routes/edge-computing');
const federatedLearningRoutes = require('./routes/federated-learning');
const aiModelMarketplaceRoutes = require('./routes/ai-model-marketplace');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3010;

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
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Create upload directories
const uploadDirs = ['uploads/data', 'uploads/models', 'uploads/results'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'dataFile') uploadPath += 'data/';
    else if (file.fieldname === 'modelFile') uploadPath += 'models/';
    else if (file.fieldname === 'resultFile') uploadPath += 'results/';
    else uploadPath += 'general/';
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common data formats
    const allowedTypes = /json|csv|txt|dat/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/json' || 
                    file.mimetype === 'text/csv' || 
                    file.mimetype === 'text/plain' ||
                    file.mimetype === 'application/octet-stream';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JSON, CSV, TXT, and DAT files are allowed'));
    }
  }
});

// Routes
app.use('/api/quantum-nn', quantumNNRoutes);
app.use('/api/quantum-optimization', quantumOptRoutes);
app.use('/api/quantum-algorithms', quantumAlgRoutes);
app.use('/api/quantum-simulator', quantumSimRoutes);
app.use('/api/real-time-fine-tuning', realTimeFineTuningRoutes);
app.use('/api/advanced-security', advancedSecurityRoutes);
app.use('/api/edge-computing', edgeComputingRoutes);
app.use('/api/federated-learning', federatedLearningRoutes);
app.use('/api/ai-model-marketplace', aiModelMarketplaceRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Advanced Quantum Machine Learning v2.9',
    version: '2.9.0',
    status: 'operational',
    capabilities: [
      'Quantum Neural Networks (QNN)',
      'Quantum Optimization Algorithms',
      'Quantum Machine Learning Algorithms',
      'Quantum Circuit Simulation',
      'Quantum State Preparation',
      'Quantum Error Correction',
      'Quantum Feature Maps',
      'Quantum Kernel Methods',
      'Variational Quantum Eigensolver (VQE)',
      'Quantum Approximate Optimization Algorithm (QAOA)',
      'Grover Search Algorithm',
      'Quantum Fourier Transform (QFT)',
      'Quantum Phase Estimation',
      'Quantum Support Vector Machine (QSVM)',
      'Quantum Clustering Algorithms',
      'Real-time Model Fine-tuning',
      'Live Model Adaptation',
      'Adaptive Learning Rate',
      'Performance Monitoring',
      'Advanced Security Features',
      'Enhanced Encryption',
      'Security Protocols',
      'Rate Limiting',
      'Brute Force Protection',
      'Security Auditing',
      'Edge Computing Support',
      'Lightweight Model Deployment',
      'Distributed Task Processing',
      'Real-time Synchronization',
      'Bandwidth Optimization',
      'Offline Processing',
      'Federated Learning',
      'Distributed AI Training',
      'Privacy Preservation',
      'Secure Aggregation',
      'Differential Privacy',
      'Model Aggregation',
      'AI Model Marketplace',
      'Model Sharing & Trading',
      'Model Discovery',
      'Rating & Review System',
      'Transaction Processing',
      'Model Versioning'
    ],
    endpoints: {
      quantumNN: '/api/quantum-nn',
      quantumOptimization: '/api/quantum-optimization',
      quantumAlgorithms: '/api/quantum-algorithms',
      quantumSimulator: '/api/quantum-simulator',
      realTimeFineTuning: '/api/real-time-fine-tuning',
      advancedSecurity: '/api/advanced-security',
      edgeComputing: '/api/edge-computing',
      federatedLearning: '/api/federated-learning',
      aiModelMarketplace: '/api/ai-model-marketplace',
      health: '/api/health'
    },
    documentation: '/api/docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size exceeds 100MB limit',
        code: 'FILE_TOO_LARGE'
      });
    }
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Advanced Quantum Machine Learning v2.9 server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Upload directories created: ${uploadDirs.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
