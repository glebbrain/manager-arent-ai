const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const multimodalProcessor = require('../modules/multimodal-processor');
const logger = require('../modules/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', file.fieldname);
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
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type based on fieldname
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
      video: ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'],
      text: ['text/plain', 'text/csv', 'application/json']
    };

    if (allowedTypes[file.fieldname] && allowedTypes[file.fieldname].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}`), false);
    }
  }
});

// Image Processing
router.post('/image/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
    }

    const { operation = 'analyze', ...options } = req.body;
    const imagePath = req.file.path;

    const result = await multimodalProcessor.processImage(imagePath, {
      operation,
      ...options
    });

    // Clean up uploaded file
    try {
      await fs.unlink(imagePath);
    } catch (error) {
      logger.warn('Failed to clean up uploaded file:', error);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Image processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Audio Processing
router.post('/audio/process', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    const { operation = 'analyze', ...options } = req.body;
    const audioPath = req.file.path;

    const result = await multimodalProcessor.processAudio(audioPath, {
      operation,
      ...options
    });

    // Clean up uploaded file
    try {
      await fs.unlink(audioPath);
    } catch (error) {
      logger.warn('Failed to clean up uploaded file:', error);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Audio processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Video Processing
router.post('/video/process', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required'
      });
    }

    const { operation = 'analyze', ...options } = req.body;
    const videoPath = req.file.path;

    const result = await multimodalProcessor.processVideo(videoPath, {
      operation,
      ...options
    });

    // Clean up uploaded file
    try {
      await fs.unlink(videoPath);
    } catch (error) {
      logger.warn('Failed to clean up uploaded file:', error);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Video processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Text Processing
router.post('/text/process', async (req, res) => {
  try {
    const { text, operation = 'analyze', ...options } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = await multimodalProcessor.processText(text, {
      operation,
      ...options
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Text processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Batch Processing
router.post('/batch/process', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'audios', maxCount: 10 },
  { name: 'videos', maxCount: 10 }
]), async (req, res) => {
  try {
    const { texts, options = {} } = req.body;
    const results = [];
    const errors = [];

    // Process images
    if (req.files.images) {
      for (const image of req.files.images) {
        try {
          const result = await multimodalProcessor.processImage(image.path, {
            operation: options.imageOperation || 'analyze',
            ...options.imageOptions
          });
          results.push({
            type: 'image',
            filename: image.originalname,
            result
          });
        } catch (error) {
          errors.push({
            type: 'image',
            filename: image.originalname,
            error: error.message
          });
        } finally {
          // Clean up file
          try {
            await fs.unlink(image.path);
          } catch (error) {
            logger.warn('Failed to clean up image file:', error);
          }
        }
      }
    }

    // Process audios
    if (req.files.audios) {
      for (const audio of req.files.audios) {
        try {
          const result = await multimodalProcessor.processAudio(audio.path, {
            operation: options.audioOperation || 'analyze',
            ...options.audioOptions
          });
          results.push({
            type: 'audio',
            filename: audio.originalname,
            result
          });
        } catch (error) {
          errors.push({
            type: 'audio',
            filename: audio.originalname,
            error: error.message
          });
        } finally {
          // Clean up file
          try {
            await fs.unlink(audio.path);
          } catch (error) {
            logger.warn('Failed to clean up audio file:', error);
          }
        }
      }
    }

    // Process videos
    if (req.files.videos) {
      for (const video of req.files.videos) {
        try {
          const result = await multimodalProcessor.processVideo(video.path, {
            operation: options.videoOperation || 'analyze',
            ...options.videoOptions
          });
          results.push({
            type: 'video',
            filename: video.originalname,
            result
          });
        } catch (error) {
          errors.push({
            type: 'video',
            filename: video.originalname,
            error: error.message
          });
        } finally {
          // Clean up file
          try {
            await fs.unlink(video.path);
          } catch (error) {
            logger.warn('Failed to clean up video file:', error);
          }
        }
      }
    }

    // Process texts
    if (texts && Array.isArray(texts)) {
      for (let i = 0; i < texts.length; i++) {
        try {
          const result = await multimodalProcessor.processText(texts[i], {
            operation: options.textOperation || 'analyze',
            ...options.textOptions
          });
          results.push({
            type: 'text',
            index: i,
            result
          });
        } catch (error) {
          errors.push({
            type: 'text',
            index: i,
            error: error.message
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        total: results.length + errors.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    logger.error('Batch processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get supported operations
router.get('/operations', (req, res) => {
  try {
    const operations = {
      image: [
        'analyze',
        'resize',
        'crop',
        'rotate',
        'filter',
        'metadata'
      ],
      audio: [
        'analyze',
        'convert',
        'extract',
        'metadata',
        'transcribe'
      ],
      video: [
        'analyze',
        'convert',
        'thumbnail',
        'extract',
        'metadata',
        'transcribe'
      ],
      text: [
        'analyze',
        'tokenize',
        'stem',
        'lemmatize',
        'sentiment',
        'language',
        'extract',
        'summarize'
      ]
    };

    res.json({
      success: true,
      data: {
        operations,
        total: Object.values(operations).flat().length
      }
    });
  } catch (error) {
    logger.error('Operations listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get supported file types
router.get('/file-types', (req, res) => {
  try {
    const fileTypes = {
      image: {
        extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        maxSize: '50MB'
      },
      audio: {
        extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
        mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
        maxSize: '50MB'
      },
      video: {
        extensions: ['.mp4', '.webm', '.avi', '.mov'],
        mimeTypes: ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'],
        maxSize: '50MB'
      },
      text: {
        extensions: ['.txt', '.csv', '.json'],
        mimeTypes: ['text/plain', 'text/csv', 'application/json'],
        maxSize: '10MB'
      }
    };

    res.json({
      success: true,
      data: {
        fileTypes,
        total: Object.keys(fileTypes).length
      }
    });
  } catch (error) {
    logger.error('File types listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get processing capabilities
router.get('/capabilities', (req, res) => {
  try {
    const capabilities = {
      image: {
        operations: ['analyze', 'resize', 'crop', 'rotate', 'filter', 'metadata'],
        formats: ['JPEG', 'PNG', 'WebP', 'GIF'],
        maxDimensions: '2048x2048',
        features: ['color-analysis', 'metadata-extraction', 'format-conversion']
      },
      audio: {
        operations: ['analyze', 'convert', 'extract', 'metadata', 'transcribe'],
        formats: ['MP3', 'WAV', 'OGG', 'M4A'],
        maxDuration: '5 minutes',
        features: ['feature-extraction', 'transcription', 'format-conversion']
      },
      video: {
        operations: ['analyze', 'convert', 'thumbnail', 'extract', 'metadata', 'transcribe'],
        formats: ['MP4', 'WebM', 'AVI', 'MOV'],
        maxDuration: '10 minutes',
        maxResolution: '1920x1080',
        features: ['frame-extraction', 'motion-analysis', 'transcription']
      },
      text: {
        operations: ['analyze', 'tokenize', 'stem', 'lemmatize', 'sentiment', 'language', 'extract', 'summarize'],
        languages: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean'],
        maxLength: '100,000 characters',
        features: ['nlp', 'sentiment-analysis', 'language-detection', 'summarization']
      }
    };

    res.json({
      success: true,
      data: {
        capabilities,
        total: Object.keys(capabilities).length
      }
    });
  } catch (error) {
    logger.error('Capabilities listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Multimodal Processor Status
router.get('/status', async (req, res) => {
  try {
    const status = await multimodalProcessor.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Multimodal processor status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
