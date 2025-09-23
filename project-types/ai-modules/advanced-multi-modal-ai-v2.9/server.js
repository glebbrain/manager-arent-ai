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
const textProcessor = require('./modules/text-processor');
const imageProcessor = require('./modules/image-processor');
const audioProcessor = require('./modules/audio-processor');
const videoProcessor = require('./modules/video-processor');
const multiModalEngine = require('./modules/multi-modal-engine');
const logger = require('./modules/logger');

// Import routes
const textRoutes = require('./routes/text');
const imageRoutes = require('./routes/image');
const audioRoutes = require('./routes/audio');
const videoRoutes = require('./routes/video');
const multiModalRoutes = require('./routes/multi-modal');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3009;

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
const uploadDirs = ['uploads/text', 'uploads/images', 'uploads/audio', 'uploads/video'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'textFile') uploadPath += 'text/';
    else if (file.fieldname === 'imageFile') uploadPath += 'images/';
    else if (file.fieldname === 'audioFile') uploadPath += 'audio/';
    else if (file.fieldname === 'videoFile') uploadPath += 'video/';
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
    // Allow all file types for multi-modal processing
    cb(null, true);
  }
});

// Routes
app.use('/api/text', textRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/multi-modal', multiModalRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Advanced Multi-Modal AI Processing v2.9',
    version: '2.9.0',
    status: 'operational',
    capabilities: [
      'Text Processing (NLP, Sentiment, Translation)',
      'Image Processing (Classification, Object Detection, OCR)',
      'Audio Processing (Speech Recognition, Music Analysis)',
      'Video Processing (Object Tracking, Scene Analysis)',
      'Multi-Modal Fusion (Cross-modal understanding)',
      'Real-time Processing (WebSocket support)'
    ],
    endpoints: {
      text: '/api/text',
      image: '/api/image',
      audio: '/api/audio',
      video: '/api/video',
      multiModal: '/api/multi-modal',
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
  logger.info(`Advanced Multi-Modal AI Processing v2.9 server running on port ${PORT}`);
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
