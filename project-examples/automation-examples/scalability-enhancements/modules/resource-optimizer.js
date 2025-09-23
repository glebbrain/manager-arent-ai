const winston = require('winston');
const sharp = require('sharp');
const zlib = require('zlib');
const _ = require('lodash');

class ResourceOptimizer {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/resource-optimizer.log' })
      ]
    });
    
    this.optimizationStrategies = new Map();
    this.compressionFormats = new Map();
    this.imageFormats = new Map();
    this.optimizationMetrics = {
      imagesOptimized: 0,
      filesCompressed: 0,
      bytesSaved: 0,
      optimizationTime: 0
    };
  }

  // Initialize resource optimizer
  async initialize() {
    try {
      this.initializeCompressionFormats();
      this.initializeImageFormats();
      this.initializeOptimizationStrategies();
      
      this.logger.info('Resource optimizer initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing resource optimizer:', error);
      throw error;
    }
  }

  // Initialize compression formats
  initializeCompressionFormats() {
    this.compressionFormats.set('gzip', {
      name: 'GZIP',
      extension: '.gz',
      compress: (data) => zlib.gzipSync(data),
      decompress: (data) => zlib.gunzipSync(data),
      level: 6
    });

    this.compressionFormats.set('deflate', {
      name: 'Deflate',
      extension: '.deflate',
      compress: (data) => zlib.deflateSync(data),
      decompress: (data) => zlib.inflateSync(data),
      level: 6
    });

    this.compressionFormats.set('brotli', {
      name: 'Brotli',
      extension: '.br',
      compress: (data) => zlib.brotliCompressSync(data),
      decompress: (data) => zlib.brotliDecompressSync(data),
      level: 6
    });
  }

  // Initialize image formats
  initializeImageFormats() {
    this.imageFormats.set('jpeg', {
      name: 'JPEG',
      extensions: ['.jpg', '.jpeg'],
      mimeType: 'image/jpeg',
      quality: 80,
      progressive: true
    });

    this.imageFormats.set('png', {
      name: 'PNG',
      extensions: ['.png'],
      mimeType: 'image/png',
      compressionLevel: 6,
      progressive: true
    });

    this.imageFormats.set('webp', {
      name: 'WebP',
      extensions: ['.webp'],
      mimeType: 'image/webp',
      quality: 80,
      lossless: false
    });

    this.imageFormats.set('avif', {
      name: 'AVIF',
      extensions: ['.avif'],
      mimeType: 'image/avif',
      quality: 80,
      lossless: false
    });
  }

  // Initialize optimization strategies
  initializeOptimizationStrategies() {
    this.optimizationStrategies.set('aggressive', {
      name: 'Aggressive',
      description: 'Maximum compression with quality loss',
      imageQuality: 60,
      compressionLevel: 9,
      removeMetadata: true,
      optimizeColors: true,
      progressive: true
    });

    this.optimizationStrategies.set('balanced', {
      name: 'Balanced',
      description: 'Good compression with minimal quality loss',
      imageQuality: 80,
      compressionLevel: 6,
      removeMetadata: true,
      optimizeColors: true,
      progressive: true
    });

    this.optimizationStrategies.set('conservative', {
      name: 'Conservative',
      description: 'Minimal compression with no quality loss',
      imageQuality: 95,
      compressionLevel: 3,
      removeMetadata: false,
      optimizeColors: false,
      progressive: false
    });
  }

  // Optimize image
  async optimizeImage(inputBuffer, options = {}) {
    try {
      const startTime = Date.now();
      const strategy = this.optimizationStrategies.get(options.strategy || 'balanced');
      const format = options.format || 'jpeg';
      const width = options.width;
      const height = options.height;

      let pipeline = sharp(inputBuffer);

      // Resize if dimensions specified
      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit: options.fit || 'inside',
          withoutEnlargement: true
        });
      }

      // Apply format-specific optimizations
      switch (format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality: strategy.imageQuality,
            progressive: strategy.progressive,
            mozjpeg: true
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            compressionLevel: strategy.compressionLevel,
            progressive: strategy.progressive,
            palette: true
          });
          break;
        case 'webp':
          pipeline = pipeline.webp({
            quality: strategy.imageQuality,
            lossless: false
          });
          break;
        case 'avif':
          pipeline = pipeline.avif({
            quality: strategy.imageQuality,
            lossless: false
          });
          break;
      }

      // Remove metadata if specified
      if (strategy.removeMetadata) {
        pipeline = pipeline.withMetadata({});
      }

      const optimizedBuffer = await pipeline.toBuffer();
      const optimizationTime = Date.now() - startTime;
      const originalSize = inputBuffer.length;
      const optimizedSize = optimizedBuffer.length;
      const savings = originalSize - optimizedSize;
      const savingsPercent = (savings / originalSize) * 100;

      // Update metrics
      this.optimizationMetrics.imagesOptimized++;
      this.optimizationMetrics.bytesSaved += savings;
      this.optimizationMetrics.optimizationTime += optimizationTime;

      this.logger.info('Image optimized successfully', {
        originalSize,
        optimizedSize,
        savings,
        savingsPercent: savingsPercent.toFixed(2),
        optimizationTime
      });

      return {
        buffer: optimizedBuffer,
        originalSize,
        optimizedSize,
        savings,
        savingsPercent: parseFloat(savingsPercent.toFixed(2)),
        optimizationTime,
        format
      };
    } catch (error) {
      this.logger.error('Error optimizing image:', error);
      throw error;
    }
  }

  // Compress data
  async compressData(data, format = 'gzip', level = 6) {
    try {
      const startTime = Date.now();
      const compressionFormat = this.compressionFormats.get(format);
      
      if (!compressionFormat) {
        throw new Error(`Unsupported compression format: ${format}`);
      }

      const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const compressedBuffer = compressionFormat.compress(inputBuffer);
      const compressionTime = Date.now() - startTime;
      const originalSize = inputBuffer.length;
      const compressedSize = compressedBuffer.length;
      const savings = originalSize - compressedSize;
      const savingsPercent = (savings / originalSize) * 100;

      // Update metrics
      this.optimizationMetrics.filesCompressed++;
      this.optimizationMetrics.bytesSaved += savings;
      this.optimizationMetrics.optimizationTime += compressionTime;

      this.logger.info('Data compressed successfully', {
        format,
        originalSize,
        compressedSize,
        savings,
        savingsPercent: savingsPercent.toFixed(2),
        compressionTime
      });

      return {
        buffer: compressedBuffer,
        originalSize,
        compressedSize,
        savings,
        savingsPercent: parseFloat(savingsPercent.toFixed(2)),
        compressionTime,
        format
      };
    } catch (error) {
      this.logger.error('Error compressing data:', error);
      throw error;
    }
  }

  // Decompress data
  async decompressData(compressedBuffer, format = 'gzip') {
    try {
      const compressionFormat = this.compressionFormats.get(format);
      
      if (!compressionFormat) {
        throw new Error(`Unsupported compression format: ${format}`);
      }

      const decompressedBuffer = compressionFormat.decompress(compressedBuffer);
      
      this.logger.info('Data decompressed successfully', {
        format,
        compressedSize: compressedBuffer.length,
        decompressedSize: decompressedBuffer.length
      });

      return decompressedBuffer;
    } catch (error) {
      this.logger.error('Error decompressing data:', error);
      throw error;
    }
  }

  // Optimize JSON data
  async optimizeJSON(data, options = {}) {
    try {
      const startTime = Date.now();
      
      // Remove unnecessary whitespace
      const minified = JSON.stringify(data);
      
      // Compress if requested
      let compressed = null;
      if (options.compress) {
        const compressionResult = await this.compressData(minified, options.compressionFormat || 'gzip');
        compressed = compressionResult;
      }

      const optimizationTime = Date.now() - startTime;
      const originalSize = JSON.stringify(data).length;
      const optimizedSize = minified.length;
      const savings = originalSize - optimizedSize;

      this.logger.info('JSON optimized successfully', {
        originalSize,
        optimizedSize,
        savings,
        compressionTime: compressed ? compressed.compressionTime : 0
      });

      return {
        minified,
        compressed,
        originalSize,
        optimizedSize,
        savings,
        optimizationTime
      };
    } catch (error) {
      this.logger.error('Error optimizing JSON:', error);
      throw error;
    }
  }

  // Optimize CSS
  async optimizeCSS(css, options = {}) {
    try {
      const startTime = Date.now();
      
      // Basic CSS minification
      let optimized = css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
        .replace(/\s*{\s*/g, '{') // Remove spaces around opening brace
        .replace(/;\s*/g, ';') // Remove spaces after semicolon
        .replace(/,\s*/g, ',') // Remove spaces after comma
        .replace(/:\s*/g, ':') // Remove spaces after colon
        .trim();

      // Compress if requested
      let compressed = null;
      if (options.compress) {
        const compressionResult = await this.compressData(optimized, options.compressionFormat || 'gzip');
        compressed = compressionResult;
      }

      const optimizationTime = Date.now() - startTime;
      const originalSize = css.length;
      const optimizedSize = optimized.length;
      const savings = originalSize - optimizedSize;

      this.logger.info('CSS optimized successfully', {
        originalSize,
        optimizedSize,
        savings,
        compressionTime: compressed ? compressed.compressionTime : 0
      });

      return {
        optimized,
        compressed,
        originalSize,
        optimizedSize,
        savings,
        optimizationTime
      };
    } catch (error) {
      this.logger.error('Error optimizing CSS:', error);
      throw error;
    }
  }

  // Optimize JavaScript
  async optimizeJavaScript(js, options = {}) {
    try {
      const startTime = Date.now();
      
      // Basic JavaScript minification
      let optimized = js
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\s*([{}();,=])\s*/g, '$1') // Remove spaces around operators
        .trim();

      // Compress if requested
      let compressed = null;
      if (options.compress) {
        const compressionResult = await this.compressData(optimized, options.compressionFormat || 'gzip');
        compressed = compressionResult;
      }

      const optimizationTime = Date.now() - startTime;
      const originalSize = js.length;
      const optimizedSize = optimized.length;
      const savings = originalSize - optimizedSize;

      this.logger.info('JavaScript optimized successfully', {
        originalSize,
        optimizedSize,
        savings,
        compressionTime: compressed ? compressed.compressionTime : 0
      });

      return {
        optimized,
        compressed,
        originalSize,
        optimizedSize,
        savings,
        optimizationTime
      };
    } catch (error) {
      this.logger.error('Error optimizing JavaScript:', error);
      throw error;
    }
  }

  // Optimize HTML
  async optimizeHTML(html, options = {}) {
    try {
      const startTime = Date.now();
      
      // Basic HTML minification
      let optimized = html
        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/>\s+</g, '><') // Remove spaces between tags
        .replace(/\s*=\s*/g, '=') // Remove spaces around equals
        .trim();

      // Compress if requested
      let compressed = null;
      if (options.compress) {
        const compressionResult = await this.compressData(optimized, options.compressionFormat || 'gzip');
        compressed = compressionResult;
      }

      const optimizationTime = Date.now() - startTime;
      const originalSize = html.length;
      const optimizedSize = optimized.length;
      const savings = originalSize - optimizedSize;

      this.logger.info('HTML optimized successfully', {
        originalSize,
        optimizedSize,
        savings,
        compressionTime: compressed ? compressed.compressionTime : 0
      });

      return {
        optimized,
        compressed,
        originalSize,
        optimizedSize,
        savings,
        optimizationTime
      };
    } catch (error) {
      this.logger.error('Error optimizing HTML:', error);
      throw error;
    }
  }

  // Batch optimize images
  async batchOptimizeImages(images, options = {}) {
    try {
      const results = [];
      const startTime = Date.now();

      for (const image of images) {
        try {
          const result = await this.optimizeImage(image.buffer, {
            ...options,
            ...image.options
          });
          results.push({
            ...result,
            filename: image.filename,
            success: true
          });
        } catch (error) {
          results.push({
            filename: image.filename,
            success: false,
            error: error.message
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      this.logger.info('Batch image optimization completed', {
        total: images.length,
        successful,
        failed,
        totalTime
      });

      return {
        results,
        summary: {
          total: images.length,
          successful,
          failed,
          totalTime
        }
      };
    } catch (error) {
      this.logger.error('Error in batch image optimization:', error);
      throw error;
    }
  }

  // Get optimization metrics
  async getOptimizationMetrics() {
    return {
      ...this.optimizationMetrics,
      averageOptimizationTime: this.optimizationMetrics.optimizationTime / 
        (this.optimizationMetrics.imagesOptimized + this.optimizationMetrics.filesCompressed) || 0
    };
  }

  // Reset metrics
  async resetMetrics() {
    this.optimizationMetrics = {
      imagesOptimized: 0,
      filesCompressed: 0,
      bytesSaved: 0,
      optimizationTime: 0
    };
    
    this.logger.info('Optimization metrics reset');
  }

  // Get supported formats
  async getSupportedFormats() {
    return {
      compression: Array.from(this.compressionFormats.keys()),
      image: Array.from(this.imageFormats.keys()),
      strategies: Array.from(this.optimizationStrategies.keys())
    };
  }

  // Generate unique ID
  generateId() {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new ResourceOptimizer();
