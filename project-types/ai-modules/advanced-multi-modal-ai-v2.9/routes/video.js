const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const videoProcessor = require('../modules/video-processor');
const logger = require('../modules/logger');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/video';
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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|mkv|webm|flv|wmv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Process uploaded video
router.post('/process', upload.single('videoFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No video file uploaded',
        code: 'NO_FILE'
      });
    }

    const videoPath = req.file.path;
    const { operations = ['objects', 'scenes'] } = req.body;

    // Validate video
    const validation = await videoProcessor.validateVideo(videoPath);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid video file',
        code: 'INVALID_VIDEO'
      });
    }

    const results = {};
    const startTime = Date.now();

    // Process each requested operation
    for (const operation of operations) {
      try {
        switch (operation) {
          case 'objects':
            results.objects = await videoProcessor.trackObjects(videoPath);
            break;
          case 'scenes':
            results.scenes = await videoProcessor.detectScenes(videoPath);
            break;
          case 'motion':
            const { threshold, minArea } = req.body;
            results.motion = await videoProcessor.detectMotion(videoPath, {
              threshold: parseFloat(threshold) || 0.1,
              minArea: parseInt(minArea) || 100
            });
            break;
          case 'classification':
            results.classification = await videoProcessor.classifyVideo(videoPath);
            break;
          case 'frames':
            const { interval = 1, format = 'jpg' } = req.body;
            const framesDir = path.join('temp', 'frames', Date.now().toString());
            results.frames = await videoProcessor.extractFrames(videoPath, framesDir, {
              interval: parseInt(interval),
              format
            });
            break;
          case 'enhancement':
            const { denoise, sharpen, stabilize, colorCorrect, upscale } = req.body;
            const enhancedPath = videoPath.replace('.', '_enhanced.');
            results.enhancement = await videoProcessor.enhanceVideo(videoPath, enhancedPath, {
              denoise: denoise === 'true',
              sharpen: sharpen === 'true',
              stabilize: stabilize === 'true',
              colorCorrect: colorCorrect === 'true',
              upscale: upscale === 'true'
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
      videoPath: videoPath,
      metadata: validation.metadata,
      results: results,
      operations: operations,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Video processing failed:', { error: error.message });
    res.status(500).json({
      error: 'Video processing failed',
      message: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
});

// Generate thumbnail
router.post('/thumbnail', upload.single('videoFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No video file uploaded',
        code: 'NO_FILE'
      });
    }

    const videoPath = req.file.path;
    const { time = '00:00:01', width = 320, height = 240 } = req.body;
    const thumbnailPath = videoPath.replace(path.extname(videoPath), '_thumb.jpg');

    const result = await videoProcessor.generateThumbnail(videoPath, thumbnailPath, {
      time,
      size: `${width}x${height}`
    });

    res.json({
      success: true,
      thumbnailPath: result.thumbnailPath,
      time: result.time,
      size: result.size
    });

  } catch (error) {
    logger.error('Thumbnail generation failed:', { error: error.message });
    res.status(500).json({
      error: 'Thumbnail generation failed',
      message: error.message,
      code: 'THUMBNAIL_ERROR'
    });
  }
});

// Extract audio from video
router.post('/extract-audio', upload.single('videoFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No video file uploaded',
        code: 'NO_FILE'
      });
    }

    const videoPath = req.file.path;
    const { format = 'mp3', bitrate = '128k' } = req.body;
    const audioPath = videoPath.replace(path.extname(videoPath), `.${format}`);

    const result = await videoProcessor.extractAudio(videoPath, audioPath, {
      format,
      bitrate
    });

    res.json({
      success: true,
      videoPath: videoPath,
      audioPath: result.audioPath,
      format: result.format
    });

  } catch (error) {
    logger.error('Audio extraction failed:', { error: error.message });
    res.status(500).json({
      error: 'Audio extraction failed',
      message: error.message,
      code: 'EXTRACTION_ERROR'
    });
  }
});

// Convert video format
router.post('/convert', upload.single('videoFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No video file uploaded',
        code: 'NO_FILE'
      });
    }

    const videoPath = req.file.path;
    const { 
      format = 'mp4', 
      resolution = null, 
      fps = null, 
      bitrate = '1000k' 
    } = req.body;

    const outputPath = videoPath.replace(path.extname(videoPath), `.${format}`);

    const result = await videoProcessor.preprocessVideo(videoPath, outputPath, {
      format,
      resolution: resolution ? JSON.parse(resolution) : null,
      fps: fps ? parseInt(fps) : null,
      bitrate
    });

    res.json({
      success: true,
      originalPath: videoPath,
      convertedPath: outputPath,
      format: format,
      options: { resolution, fps, bitrate }
    });

  } catch (error) {
    logger.error('Video conversion failed:', { error: error.message });
    res.status(500).json({
      error: 'Video conversion failed',
      message: error.message,
      code: 'CONVERSION_ERROR'
    });
  }
});

// Compare videos
router.post('/compare', upload.fields([
  { name: 'video1', maxCount: 1 },
  { name: 'video2', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files.video1 || !req.files.video2) {
      return res.status(400).json({
        error: 'Two video files are required for comparison',
        code: 'MISSING_FILES'
      });
    }

    const video1Path = req.files.video1[0].path;
    const video2Path = req.files.video2[0].path;

    const result = await videoProcessor.compareVideos(video1Path, video2Path);

    res.json({
      success: true,
      comparison: result
    });

  } catch (error) {
    logger.error('Video comparison failed:', { error: error.message });
    res.status(500).json({
      error: 'Video comparison failed',
      message: error.message,
      code: 'COMPARISON_ERROR'
    });
  }
});

// Get available operations
router.get('/operations', (req, res) => {
  res.json({
    operations: [
      'objects',
      'scenes',
      'motion',
      'classification',
      'frames',
      'enhancement'
    ],
    descriptions: {
      objects: 'Track objects across video frames',
      scenes: 'Detect scene changes and segments',
      motion: 'Detect motion and movement',
      classification: 'Classify video content type',
      frames: 'Extract individual frames',
      enhancement: 'Improve video quality'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Video Processing',
    version: '2.9.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
