const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const multiModalEngine = require('../modules/multi-modal-engine');
const logger = require('../modules/logger');

const router = express.Router();

// Configure multer for multi-modal uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = 'uploads/multi-modal';
    if (file.fieldname === 'textFile') uploadDir = 'uploads/text';
    else if (file.fieldname === 'imageFile') uploadDir = 'uploads/images';
    else if (file.fieldname === 'audioFile') uploadDir = 'uploads/audio';
    else if (file.fieldname === 'videoFile') uploadDir = 'uploads/video';
    
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
    // Allow all file types for multi-modal processing
    cb(null, true);
  }
});

// Process multiple modalities
router.post('/process', upload.fields([
  { name: 'textFile', maxCount: 1 },
  { name: 'imageFile', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      text, 
      operations = {},
      fusion = 'early',
      analysis = 'comprehensive'
    } = req.body;

    const inputs = {};
    const startTime = Date.now();

    // Process text input
    if (text) {
      inputs.text = {
        text: text,
        operations: operations.text || ['sentiment', 'classification', 'keywords']
      };
    }

    // Process uploaded files
    if (req.files) {
      if (req.files.textFile) {
        const textContent = fs.readFileSync(req.files.textFile[0].path, 'utf8');
        inputs.text = {
          text: textContent,
          operations: operations.text || ['sentiment', 'classification', 'keywords']
        };
      }

      if (req.files.imageFile) {
        inputs.image = {
          imagePath: req.files.imageFile[0].path,
          operations: operations.image || ['classification', 'objects']
        };
      }

      if (req.files.audioFile) {
        inputs.audio = {
          audioPath: req.files.audioFile[0].path,
          operations: operations.audio || ['transcription', 'classification']
        };
      }

      if (req.files.videoFile) {
        inputs.video = {
          videoPath: req.files.videoFile[0].path,
          operations: operations.video || ['objects', 'scenes']
        };
      }
    }

    if (Object.keys(inputs).length === 0) {
      return res.status(400).json({
        error: 'No input data provided',
        code: 'NO_INPUT'
      });
    }

    // Process multi-modal data
    const result = await multiModalEngine.processMultiModal(inputs, {
      fusion,
      analysis,
      startTime
    });

    res.json({
      success: true,
      inputs: Object.keys(inputs),
      result: result,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Multi-modal processing failed:', { error: error.message });
    res.status(500).json({
      error: 'Multi-modal processing failed',
      message: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
});

// Process single modality with multi-modal context
router.post('/process/:modality', upload.single('file'), async (req, res) => {
  try {
    const { modality } = req.params;
    const { operations = [], context = {} } = req.body;

    if (!multiModalEngine.getSupportedModalities().includes(modality)) {
      return res.status(400).json({
        error: `Unsupported modality: ${modality}`,
        code: 'UNSUPPORTED_MODALITY'
      });
    }

    let data = {};

    switch (modality) {
      case 'text':
        if (!req.body.text && !req.file) {
          return res.status(400).json({
            error: 'Text data is required',
            code: 'MISSING_TEXT'
          });
        }
        data = {
          text: req.body.text || (req.file ? fs.readFileSync(req.file.path, 'utf8') : ''),
          operations: operations
        };
        break;

      case 'image':
        if (!req.file) {
          return res.status(400).json({
            error: 'Image file is required',
            code: 'MISSING_IMAGE'
          });
        }
        data = {
          imagePath: req.file.path,
          operations: operations
        };
        break;

      case 'audio':
        if (!req.file) {
          return res.status(400).json({
            error: 'Audio file is required',
            code: 'MISSING_AUDIO'
          });
        }
        data = {
          audioPath: req.file.path,
          operations: operations
        };
        break;

      case 'video':
        if (!req.file) {
          return res.status(400).json({
            error: 'Video file is required',
            code: 'MISSING_VIDEO'
          });
        }
        data = {
          videoPath: req.file.path,
          operations: operations
        };
        break;
    }

    const result = await multiModalEngine.processModality(modality, data, {
      context,
      startTime: Date.now()
    });

    res.json({
      success: true,
      modality: modality,
      result: result
    });

  } catch (error) {
    logger.error(`Modality processing failed for ${req.params.modality}:`, { error: error.message });
    res.status(500).json({
      error: 'Modality processing failed',
      message: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
});

// Get supported modalities
router.get('/modalities', (req, res) => {
  res.json({
    modalities: multiModalEngine.getSupportedModalities(),
    descriptions: {
      text: 'Natural language processing and text analysis',
      image: 'Computer vision and image analysis',
      audio: 'Speech recognition and audio analysis',
      video: 'Video processing and analysis'
    }
  });
});

// Get operations for a modality
router.get('/modalities/:modality/operations', (req, res) => {
  const { modality } = req.params;
  
  if (!multiModalEngine.getSupportedModalities().includes(modality)) {
    return res.status(400).json({
      error: `Unsupported modality: ${modality}`,
      code: 'UNSUPPORTED_MODALITY'
    });
  }

  res.json({
    modality: modality,
    operations: multiModalEngine.getModalityOperations(modality)
  });
});

// Get fusion strategies
router.get('/fusion-strategies', (req, res) => {
  res.json({
    strategies: ['early', 'late', 'attention'],
    descriptions: {
      early: 'Combine features before processing',
      late: 'Combine results after processing',
      attention: 'Use attention mechanisms for fusion'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Multi-Modal Processing',
    version: '2.9.0',
    supportedModalities: multiModalEngine.getSupportedModalities(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
