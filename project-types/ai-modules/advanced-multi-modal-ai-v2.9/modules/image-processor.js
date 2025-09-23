const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class ImageProcessor {
  constructor() {
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff'];
    this.maxImageSize = 10 * 1024 * 1024; // 10MB
  }

  // Validate image file
  async validateImage(filePath) {
    try {
      const stats = fs.statSync(filePath);
      
      if (stats.size > this.maxImageSize) {
        throw new Error(`Image size ${stats.size} exceeds maximum allowed size ${this.maxImageSize}`);
      }

      const metadata = await sharp(filePath).metadata();
      
      if (!this.supportedFormats.includes(metadata.format)) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      return {
        valid: true,
        metadata: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          size: stats.size,
          channels: metadata.channels,
          density: metadata.density
        }
      };
    } catch (error) {
      logger.error('Image validation failed:', { error: error.message, filePath });
      throw error;
    }
  }

  // Image preprocessing
  async preprocessImage(inputPath, outputPath, options = {}) {
    try {
      const {
        resize = null,
        format = 'jpeg',
        quality = 90,
        grayscale = false,
        normalize = false
      } = options;

      let pipeline = sharp(inputPath);

      // Resize if specified
      if (resize) {
        pipeline = pipeline.resize(resize.width, resize.height, {
          fit: resize.fit || 'cover',
          position: resize.position || 'center'
        });
      }

      // Convert to grayscale if requested
      if (grayscale) {
        pipeline = pipeline.grayscale();
      }

      // Normalize if requested
      if (normalize) {
        pipeline = pipeline.normalize();
      }

      // Set output format and quality
      if (format === 'jpeg' || format === 'jpg') {
        pipeline = pipeline.jpeg({ quality });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      }

      await pipeline.toFile(outputPath);
      
      const metadata = await sharp(outputPath).metadata();
      
      return {
        success: true,
        outputPath,
        metadata: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          size: fs.statSync(outputPath).size
        }
      };
    } catch (error) {
      logger.error('Image preprocessing failed:', { error: error.message });
      throw error;
    }
  }

  // Object detection (mock implementation)
  async detectObjects(imagePath) {
    try {
      // Mock object detection - in real implementation, use YOLO, R-CNN, etc.
      const mockObjects = [
        { class: 'person', confidence: 0.95, bbox: { x: 100, y: 50, width: 200, height: 300 } },
        { class: 'car', confidence: 0.87, bbox: { x: 300, y: 200, width: 150, height: 100 } },
        { class: 'dog', confidence: 0.78, bbox: { x: 50, y: 150, width: 80, height: 120 } }
      ];

      return {
        objects: mockObjects,
        totalObjects: mockObjects.length,
        processingTime: Math.random() * 1000 + 500 // Mock processing time
      };
    } catch (error) {
      logger.error('Object detection failed:', { error: error.message });
      throw error;
    }
  }

  // Image classification
  async classifyImage(imagePath, categories = ['nature', 'urban', 'people', 'animals', 'vehicles', 'food']) {
    try {
      // Mock image classification
      const mockClassifications = {
        'nature': 0.85,
        'urban': 0.12,
        'people': 0.45,
        'animals': 0.23,
        'vehicles': 0.15,
        'food': 0.05
      };

      const sortedCategories = Object.entries(mockClassifications)
        .sort(([,a], [,b]) => b - a)
        .map(([category, confidence]) => ({ category, confidence }));

      return {
        predictions: sortedCategories,
        topPrediction: sortedCategories[0],
        processingTime: Math.random() * 800 + 300
      };
    } catch (error) {
      logger.error('Image classification failed:', { error: error.message });
      throw error;
    }
  }

  // OCR (Optical Character Recognition)
  async extractText(imagePath) {
    try {
      // Mock OCR - in real implementation, use Tesseract.js or similar
      const mockText = "Sample text extracted from image\nThis is a mock OCR result\nLine 3 of extracted text";
      
      return {
        text: mockText,
        confidence: 0.92,
        words: mockText.split(/\s+/).length,
        lines: mockText.split('\n').length,
        processingTime: Math.random() * 1200 + 800
      };
    } catch (error) {
      logger.error('OCR failed:', { error: error.message });
      throw error;
    }
  }

  // Face detection
  async detectFaces(imagePath) {
    try {
      // Mock face detection
      const mockFaces = [
        {
          bbox: { x: 120, y: 80, width: 100, height: 120 },
          confidence: 0.95,
          landmarks: {
            leftEye: { x: 140, y: 110 },
            rightEye: { x: 180, y: 110 },
            nose: { x: 160, y: 130 },
            leftMouth: { x: 150, y: 150 },
            rightMouth: { x: 170, y: 150 }
          }
        }
      ];

      return {
        faces: mockFaces,
        faceCount: mockFaces.length,
        processingTime: Math.random() * 600 + 400
      };
    } catch (error) {
      logger.error('Face detection failed:', { error: error.message });
      throw error;
    }
  }

  // Image enhancement
  async enhanceImage(inputPath, outputPath, options = {}) {
    try {
      const {
        brightness = 1.0,
        contrast = 1.0,
        saturation = 1.0,
        sharpness = 1.0,
        noiseReduction = false
      } = options;

      let pipeline = sharp(inputPath);

      // Adjust brightness and contrast
      if (brightness !== 1.0 || contrast !== 1.0) {
        pipeline = pipeline.modulate({
          brightness: brightness,
          contrast: contrast
        });
      }

      // Adjust saturation
      if (saturation !== 1.0) {
        pipeline = pipeline.modulate({
          saturation: saturation
        });
      }

      // Apply sharpening
      if (sharpness !== 1.0) {
        pipeline = pipeline.sharpen(sharpness);
      }

      // Apply noise reduction (mock)
      if (noiseReduction) {
        pipeline = pipeline.median(3);
      }

      await pipeline.toFile(outputPath);

      return {
        success: true,
        outputPath,
        enhancements: options
      };
    } catch (error) {
      logger.error('Image enhancement failed:', { error: error.message });
      throw error;
    }
  }

  // Generate thumbnails
  async generateThumbnail(inputPath, outputPath, size = { width: 200, height: 200 }) {
    try {
      await sharp(inputPath)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      return {
        success: true,
        thumbnailPath: outputPath,
        size: size
      };
    } catch (error) {
      logger.error('Thumbnail generation failed:', { error: error.message });
      throw error;
    }
  }

  // Image similarity comparison
  async compareImages(imagePath1, imagePath2) {
    try {
      // Mock image comparison - in real implementation, use perceptual hashing
      const similarity = Math.random() * 0.4 + 0.6; // Mock similarity between 0.6-1.0
      
      return {
        similarity: similarity,
        match: similarity > 0.8,
        confidence: similarity,
        processingTime: Math.random() * 500 + 200
      };
    } catch (error) {
      logger.error('Image comparison failed:', { error: error.message });
      throw error;
    }
  }

  // Extract image features
  async extractFeatures(imagePath) {
    try {
      // Mock feature extraction
      const features = {
        colors: {
          dominant: '#FF5733',
          palette: ['#FF5733', '#33FF57', '#3357FF', '#FF33F5'],
          histogram: Array(256).fill(0).map(() => Math.random())
        },
        textures: {
          contrast: Math.random(),
          energy: Math.random(),
          homogeneity: Math.random(),
          correlation: Math.random()
        },
        shapes: {
          aspectRatio: Math.random() * 2 + 0.5,
          circularity: Math.random(),
          rectangularity: Math.random()
        }
      };

      return {
        features,
        processingTime: Math.random() * 1000 + 500
      };
    } catch (error) {
      logger.error('Feature extraction failed:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ImageProcessor();
