const express = require('express');
const multiModalEngine = require('../modules/multi-modal-engine');
const logger = require('../modules/logger');

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Advanced Multi-Modal AI Processing v2.9',
    version: '2.9.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      service: 'Advanced Multi-Modal AI Processing v2.9',
      version: '2.9.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      components: {
        multiModalEngine: {
          status: 'operational',
          supportedModalities: multiModalEngine.getSupportedModalities()
        },
        textProcessor: {
          status: 'operational',
          supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi']
        },
        imageProcessor: {
          status: 'operational',
          supportedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff']
        },
        audioProcessor: {
          status: 'operational',
          supportedFormats: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']
        },
        videoProcessor: {
          status: 'operational',
          supportedFormats: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']
        }
      },
      capabilities: {
        textProcessing: [
          'Sentiment Analysis',
          'Text Classification',
          'Keyword Extraction',
          'Named Entity Recognition',
          'Text Summarization',
          'Language Detection',
          'Text Translation'
        ],
        imageProcessing: [
          'Object Detection',
          'Image Classification',
          'Face Detection',
          'OCR (Optical Character Recognition)',
          'Feature Extraction',
          'Image Enhancement',
          'Image Comparison'
        ],
        audioProcessing: [
          'Speech Recognition',
          'Audio Classification',
          'Music Analysis',
          'Speaker Identification',
          'Emotion Detection',
          'Feature Extraction',
          'Audio Enhancement'
        ],
        videoProcessing: [
          'Object Tracking',
          'Scene Detection',
          'Motion Detection',
          'Video Classification',
          'Frame Extraction',
          'Video Enhancement',
          'Audio Extraction'
        ],
        multiModalFusion: [
          'Early Fusion',
          'Late Fusion',
          'Attention-based Fusion',
          'Cross-modal Understanding',
          'Unified Processing'
        ]
      }
    };

    res.json(health);

  } catch (error) {
    logger.error('Detailed health check failed:', { error: error.message });
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Component-specific health checks
router.get('/text', (req, res) => {
  res.json({
    status: 'healthy',
    component: 'Text Processor',
    version: '2.9.0',
    capabilities: [
      'Sentiment Analysis',
      'Text Classification',
      'Keyword Extraction',
      'Named Entity Recognition',
      'Text Summarization',
      'Language Detection',
      'Text Translation'
    ],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'],
    timestamp: new Date().toISOString()
  });
});

router.get('/image', (req, res) => {
  res.json({
    status: 'healthy',
    component: 'Image Processor',
    version: '2.9.0',
    capabilities: [
      'Object Detection',
      'Image Classification',
      'Face Detection',
      'OCR (Optical Character Recognition)',
      'Feature Extraction',
      'Image Enhancement',
      'Image Comparison'
    ],
    supportedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff'],
    timestamp: new Date().toISOString()
  });
});

router.get('/audio', (req, res) => {
  res.json({
    status: 'healthy',
    component: 'Audio Processor',
    version: '2.9.0',
    capabilities: [
      'Speech Recognition',
      'Audio Classification',
      'Music Analysis',
      'Speaker Identification',
      'Emotion Detection',
      'Feature Extraction',
      'Audio Enhancement'
    ],
    supportedFormats: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'],
    timestamp: new Date().toISOString()
  });
});

router.get('/video', (req, res) => {
  res.json({
    status: 'healthy',
    component: 'Video Processor',
    version: '2.9.0',
    capabilities: [
      'Object Tracking',
      'Scene Detection',
      'Motion Detection',
      'Video Classification',
      'Frame Extraction',
      'Video Enhancement',
      'Audio Extraction'
    ],
    supportedFormats: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'],
    timestamp: new Date().toISOString()
  });
});

router.get('/multi-modal', (req, res) => {
  res.json({
    status: 'healthy',
    component: 'Multi-Modal Engine',
    version: '2.9.0',
    capabilities: [
      'Early Fusion',
      'Late Fusion',
      'Attention-based Fusion',
      'Cross-modal Understanding',
      'Unified Processing'
    ],
    supportedModalities: multiModalEngine.getSupportedModalities(),
    fusionStrategies: ['early', 'late', 'attention'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
