const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const audioProcessor = require('../modules/audio-processor');
const logger = require('../modules/logger');

const router = express.Router();

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/audio';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|flac|aac|ogg|m4a|wma/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('audio/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Process uploaded audio
router.post('/process', upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file uploaded',
        code: 'NO_FILE'
      });
    }

    const audioPath = req.file.path;
    const { operations = ['transcription', 'classification'] } = req.body;

    // Validate audio
    const validation = await audioProcessor.validateAudio(audioPath);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid audio file',
        code: 'INVALID_AUDIO'
      });
    }

    const results = {};
    const startTime = Date.now();

    // Process each requested operation
    for (const operation of operations) {
      try {
        switch (operation) {
          case 'transcription':
            const { language = 'en' } = req.body;
            results.transcription = await audioProcessor.transcribeSpeech(audioPath, language);
            break;
          case 'classification':
            results.classification = await audioProcessor.classifyAudio(audioPath);
            break;
          case 'music':
            results.music = await audioProcessor.analyzeMusic(audioPath);
            break;
          case 'speaker':
            results.speaker = await audioProcessor.identifySpeaker(audioPath);
            break;
          case 'emotion':
            results.emotion = await audioProcessor.detectEmotion(audioPath);
            break;
          case 'features':
            results.features = await audioProcessor.extractFeatures(audioPath);
            break;
          case 'enhancement':
            const { noiseReduction, echoCancellation, volumeBoost } = req.body;
            const enhancedPath = audioPath.replace('.', '_enhanced.');
            results.enhancement = await audioProcessor.enhanceAudio(audioPath, enhancedPath, {
              noiseReduction: noiseReduction === 'true',
              echoCancellation: echoCancellation === 'true',
              volumeBoost: parseFloat(volumeBoost) || 1.0
            });
            break;
          default:
            logger.warn(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        logger.error(`Operation ${operation} failed:`, { error: error.message });
        results[operation] = { error: error.message };
      }
    }

    res.json({
      success: true,
      filename: req.file.originalname,
      audioPath: audioPath,
      metadata: validation.metadata,
      results: results,
      operations: operations,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Audio processing failed:', { error: error.message });
    res.status(500).json({
      error: 'Audio processing failed',
      message: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
});

// Convert audio format
router.post('/convert', upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file uploaded',
        code: 'NO_FILE'
      });
    }

    const audioPath = req.file.path;
    const { 
      format = 'mp3', 
      sampleRate = 44100, 
      channels = 2, 
      bitrate = '128k' 
    } = req.body;

    const outputPath = audioPath.replace(path.extname(audioPath), `.${format}`);

    const result = await audioProcessor.preprocessAudio(audioPath, outputPath, {
      format,
      sampleRate: parseInt(sampleRate),
      channels: parseInt(channels),
      bitrate
    });

    res.json({
      success: true,
      originalPath: audioPath,
      convertedPath: outputPath,
      format: format,
      options: { sampleRate, channels, bitrate }
    });

  } catch (error) {
    logger.error('Audio conversion failed:', { error: error.message });
    res.status(500).json({
      error: 'Audio conversion failed',
      message: error.message,
      code: 'CONVERSION_ERROR'
    });
  }
});

// Compare audio files
router.post('/compare', upload.fields([
  { name: 'audio1', maxCount: 1 },
  { name: 'audio2', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files.audio1 || !req.files.audio2) {
      return res.status(400).json({
        error: 'Two audio files are required for comparison',
        code: 'MISSING_FILES'
      });
    }

    const audio1Path = req.files.audio1[0].path;
    const audio2Path = req.files.audio2[0].path;

    const result = await audioProcessor.compareAudio(audio1Path, audio2Path);

    res.json({
      success: true,
      comparison: result
    });

  } catch (error) {
    logger.error('Audio comparison failed:', { error: error.message });
    res.status(500).json({
      error: 'Audio comparison failed',
      message: error.message,
      code: 'COMPARISON_ERROR'
    });
  }
});

// Get available operations
router.get('/operations', (req, res) => {
  res.json({
    operations: [
      'transcription',
      'classification',
      'music',
      'speaker',
      'emotion',
      'features',
      'enhancement'
    ],
    descriptions: {
      transcription: 'Convert speech to text',
      classification: 'Classify audio content type',
      music: 'Analyze music characteristics',
      speaker: 'Identify speaker',
      emotion: 'Detect emotional state from speech',
      features: 'Extract audio features',
      enhancement: 'Improve audio quality'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Audio Processing',
    version: '2.9.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
