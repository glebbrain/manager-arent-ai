const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const imageProcessor = require('../modules/image-processor');
const logger = require('../modules/logger');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images';
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|tiff/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Process uploaded image
router.post('/process', upload.single('imageFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file uploaded',
        code: 'NO_FILE'
      });
    }

    const imagePath = req.file.path;
    const { operations = ['classification', 'objects'] } = req.body;

    // Validate image
    const validation = await imageProcessor.validateImage(imagePath);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid image file',
        code: 'INVALID_IMAGE'
      });
    }

    const results = {};
    const startTime = Date.now();

    // Process each requested operation
    for (const operation of operations) {
      try {
        switch (operation) {
          case 'classification':
            results.classification = await imageProcessor.classifyImage(imagePath);
            break;
          case 'objects':
            results.objects = await imageProcessor.detectObjects(imagePath);
            break;
          case 'faces':
            results.faces = await imageProcessor.detectFaces(imagePath);
            break;
          case 'ocr':
            results.ocr = await imageProcessor.extractText(imagePath);
            break;
          case 'features':
            results.features = await imageProcessor.extractFeatures(imagePath);
            break;
          case 'enhancement':
            const { brightness, contrast, saturation, sharpness } = req.body;
            const enhancedPath = imagePath.replace('.', '_enhanced.');
            results.enhancement = await imageProcessor.enhanceImage(imagePath, enhancedPath, {
              brightness, contrast, saturation, sharpness
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
      imagePath: imagePath,
      metadata: validation.metadata,
      results: results,
      operations: operations,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Image processing failed:', { error: error.message });
    res.status(500).json({
      error: 'Image processing failed',
      message: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
});

// Generate thumbnail
router.post('/thumbnail', upload.single('imageFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file uploaded',
        code: 'NO_FILE'
      });
    }

    const imagePath = req.file.path;
    const { width = 200, height = 200 } = req.body;
    const thumbnailPath = imagePath.replace('.', '_thumb.');

    const result = await imageProcessor.generateThumbnail(imagePath, thumbnailPath, {
      width: parseInt(width),
      height: parseInt(height)
    });

    res.json({
      success: true,
      thumbnailPath: result.thumbnailPath,
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

// Compare images
router.post('/compare', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files.image1 || !req.files.image2) {
      return res.status(400).json({
        error: 'Two image files are required for comparison',
        code: 'MISSING_FILES'
      });
    }

    const image1Path = req.files.image1[0].path;
    const image2Path = req.files.image2[0].path;

    const result = await imageProcessor.compareImages(image1Path, image2Path);

    res.json({
      success: true,
      comparison: result
    });

  } catch (error) {
    logger.error('Image comparison failed:', { error: error.message });
    res.status(500).json({
      error: 'Image comparison failed',
      message: error.message,
      code: 'COMPARISON_ERROR'
    });
  }
});

// Get available operations
router.get('/operations', (req, res) => {
  res.json({
    operations: [
      'classification',
      'objects',
      'faces',
      'ocr',
      'features',
      'enhancement'
    ],
    descriptions: {
      classification: 'Classify image content into categories',
      objects: 'Detect and locate objects in image',
      faces: 'Detect and analyze faces',
      ocr: 'Extract text from image',
      features: 'Extract visual features',
      enhancement: 'Enhance image quality'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Image Processing',
    version: '2.9.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
