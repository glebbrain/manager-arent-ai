const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const natural = require('natural');
const sentiment = require('sentiment');
const logger = require('./logger');

class MultimodalProcessor {
  constructor() {
    this.isInitialized = false;
    this.processors = new Map();
    this.config = {
      image: {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 90,
        formats: ['jpeg', 'png', 'webp', 'gif'],
        supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      },
      audio: {
        maxDuration: 300, // 5 minutes
        sampleRate: 44100,
        channels: 2,
        formats: ['mp3', 'wav', 'ogg', 'm4a'],
        supportedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
      },
      video: {
        maxDuration: 600, // 10 minutes
        maxWidth: 1920,
        maxHeight: 1080,
        formats: ['mp4', 'webm', 'avi', 'mov'],
        supportedMimeTypes: ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime']
      },
      text: {
        maxLength: 100000,
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
        encodings: ['utf-8', 'ascii', 'latin1']
      }
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Multimodal Processor...');
      
      // Initialize image processor
      await this.initializeImageProcessor();
      
      // Initialize audio processor
      await this.initializeAudioProcessor();
      
      // Initialize video processor
      await this.initializeVideoProcessor();
      
      // Initialize text processor
      await this.initializeTextProcessor();
      
      this.isInitialized = true;
      logger.info('Multimodal Processor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Multimodal Processor:', error);
      throw error;
    }
  }

  async initializeImageProcessor() {
    const imageProcessor = {
      name: 'image',
      sharp: sharp,
      capabilities: ['resize', 'crop', 'rotate', 'filter', 'format', 'metadata', 'analysis']
    };
    
    this.processors.set('image', imageProcessor);
    logger.info('Image processor initialized');
  }

  async initializeAudioProcessor() {
    const audioProcessor = {
      name: 'audio',
      ffmpeg: ffmpeg,
      capabilities: ['convert', 'extract', 'analyze', 'metadata', 'transcribe']
    };
    
    this.processors.set('audio', audioProcessor);
    logger.info('Audio processor initialized');
  }

  async initializeVideoProcessor() {
    const videoProcessor = {
      name: 'video',
      ffmpeg: ffmpeg,
      capabilities: ['convert', 'extract', 'analyze', 'metadata', 'thumbnail', 'transcribe']
    };
    
    this.processors.set('video', videoProcessor);
    logger.info('Video processor initialized');
  }

  async initializeTextProcessor() {
    const textProcessor = {
      name: 'text',
      natural: natural,
      sentiment: new sentiment(),
      capabilities: ['tokenize', 'stem', 'lemmatize', 'sentiment', 'language', 'extract', 'summarize']
    };
    
    this.processors.set('text', textProcessor);
    logger.info('Text processor initialized');
  }

  // Image Processing
  async processImage(input, options = {}) {
    try {
      const {
        operation = 'analyze',
        width = null,
        height = null,
        quality = this.config.image.quality,
        format = 'jpeg',
        filters = []
      } = options;

      const imageProcessor = this.processors.get('image');
      if (!imageProcessor) {
        throw new Error('Image processor not available');
      }

      let result;
      switch (operation) {
        case 'analyze':
          result = await this.analyzeImage(input, imageProcessor);
          break;
        case 'resize':
          result = await this.resizeImage(input, imageProcessor, { width, height, quality, format });
          break;
        case 'crop':
          result = await this.cropImage(input, imageProcessor, options);
          break;
        case 'rotate':
          result = await this.rotateImage(input, imageProcessor, options);
          break;
        case 'filter':
          result = await this.applyImageFilters(input, imageProcessor, filters);
          break;
        case 'metadata':
          result = await this.extractImageMetadata(input, imageProcessor);
          break;
        default:
          throw new Error(`Unsupported image operation: ${operation}`);
      }

      return result;
    } catch (error) {
      logger.error('Image processing failed:', error);
      throw error;
    }
  }

  async analyzeImage(input, processor) {
    const image = processor.sharp(input);
    const metadata = await image.metadata();
    
    // Basic image analysis
    const analysis = {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      isAnimated: metadata.pages > 1,
      colorSpace: metadata.space,
      depth: metadata.depth
    };

    // Color analysis
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const colors = this.analyzeColors(data, info);
    analysis.colors = colors;

    return {
      type: 'image',
      operation: 'analyze',
      result: analysis,
      timestamp: new Date().toISOString()
    };
  }

  analyzeColors(data, info) {
    const { width, height, channels } = info;
    const pixelCount = width * height;
    
    let r = 0, g = 0, b = 0;
    let minR = 255, minG = 255, minB = 255;
    let maxR = 0, maxG = 0, maxB = 0;
    
    for (let i = 0; i < data.length; i += channels) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      
      r += red;
      g += green;
      b += blue;
      
      minR = Math.min(minR, red);
      minG = Math.min(minG, green);
      minB = Math.min(minB, blue);
      
      maxR = Math.max(maxR, red);
      maxG = Math.max(maxG, green);
      maxB = Math.max(maxB, blue);
    }
    
    return {
      average: {
        r: Math.round(r / pixelCount),
        g: Math.round(g / pixelCount),
        b: Math.round(b / pixelCount)
      },
      min: { r: minR, g: minG, b: minB },
      max: { r: maxR, g: maxG, b: maxB }
    };
  }

  async resizeImage(input, processor, options) {
    const { width, height, quality, format } = options;
    
    const resized = await processor.sharp(input)
      .resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality })
      .toBuffer();
    
    return {
      type: 'image',
      operation: 'resize',
      result: {
        buffer: resized,
        format,
        size: resized.length
      },
      timestamp: new Date().toISOString()
    };
  }

  async cropImage(input, processor, options) {
    const { left, top, width, height } = options;
    
    const cropped = await processor.sharp(input)
      .extract({ left, top, width, height })
      .toBuffer();
    
    return {
      type: 'image',
      operation: 'crop',
      result: {
        buffer: cropped,
        size: cropped.length
      },
      timestamp: new Date().toISOString()
    };
  }

  async rotateImage(input, processor, options) {
    const { angle = 90 } = options;
    
    const rotated = await processor.sharp(input)
      .rotate(angle)
      .toBuffer();
    
    return {
      type: 'image',
      operation: 'rotate',
      result: {
        buffer: rotated,
        angle,
        size: rotated.length
      },
      timestamp: new Date().toISOString()
    };
  }

  async applyImageFilters(input, processor, filters) {
    let image = processor.sharp(input);
    
    for (const filter of filters) {
      switch (filter.type) {
        case 'blur':
          image = image.blur(filter.value || 1);
          break;
        case 'sharpen':
          image = image.sharpen(filter.value || 1);
          break;
        case 'brightness':
          image = image.modulate({ brightness: filter.value || 1 });
          break;
        case 'contrast':
          image = image.modulate({ contrast: filter.value || 1 });
          break;
        case 'saturation':
          image = image.modulate({ saturation: filter.value || 1 });
          break;
        case 'hue':
          image = image.modulate({ hue: filter.value || 0 });
          break;
        case 'gamma':
          image = image.gamma(filter.value || 1);
          break;
        case 'negate':
          image = image.negate();
          break;
        case 'grayscale':
          image = image.grayscale();
          break;
      }
    }
    
    const filtered = await image.toBuffer();
    
    return {
      type: 'image',
      operation: 'filter',
      result: {
        buffer: filtered,
        filters: filters.map(f => f.type),
        size: filtered.length
      },
      timestamp: new Date().toISOString()
    };
  }

  async extractImageMetadata(input, processor) {
    const metadata = await processor.sharp(input).metadata();
    
    return {
      type: 'image',
      operation: 'metadata',
      result: metadata,
      timestamp: new Date().toISOString()
    };
  }

  // Audio Processing
  async processAudio(input, options = {}) {
    try {
      const {
        operation = 'analyze',
        format = 'mp3',
        quality = 'high',
        sampleRate = this.config.audio.sampleRate,
        channels = this.config.audio.channels
      } = options;

      const audioProcessor = this.processors.get('audio');
      if (!audioProcessor) {
        throw new Error('Audio processor not available');
      }

      let result;
      switch (operation) {
        case 'analyze':
          result = await this.analyzeAudio(input, audioProcessor);
          break;
        case 'convert':
          result = await this.convertAudio(input, audioProcessor, { format, quality, sampleRate, channels });
          break;
        case 'extract':
          result = await this.extractAudioFeatures(input, audioProcessor);
          break;
        case 'metadata':
          result = await this.extractAudioMetadata(input, audioProcessor);
          break;
        case 'transcribe':
          result = await this.transcribeAudio(input, audioProcessor, options);
          break;
        default:
          throw new Error(`Unsupported audio operation: ${operation}`);
      }

      return result;
    } catch (error) {
      logger.error('Audio processing failed:', error);
      throw error;
    }
  }

  async analyzeAudio(input, processor) {
    return new Promise((resolve, reject) => {
      processor.ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const analysis = {
          duration: metadata.format.duration,
          bitrate: metadata.format.bit_rate,
          sampleRate: metadata.streams[0].sample_rate,
          channels: metadata.streams[0].channels,
          codec: metadata.streams[0].codec_name,
          format: metadata.format.format_name,
          size: metadata.format.size
        };

        resolve({
          type: 'audio',
          operation: 'analyze',
          result: analysis,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async convertAudio(input, processor, options) {
    const { format, quality, sampleRate, channels } = options;
    
    return new Promise((resolve, reject) => {
      const outputPath = `./temp/converted_${Date.now()}.${format}`;
      
      processor.ffmpeg(input)
        .audioCodec(format === 'mp3' ? 'libmp3lame' : 'aac')
        .audioBitrate(quality === 'high' ? '320k' : '128k')
        .audioFrequency(sampleRate)
        .audioChannels(channels)
        .on('end', () => {
          resolve({
            type: 'audio',
            operation: 'convert',
            result: {
              outputPath,
              format,
              quality,
              sampleRate,
              channels
            },
            timestamp: new Date().toISOString()
          });
        })
        .on('error', reject)
        .save(outputPath);
    });
  }

  async extractAudioFeatures(input, processor) {
    // Placeholder for audio feature extraction
    return {
      type: 'audio',
      operation: 'extract',
      result: {
        features: {
          mfcc: [],
          spectralCentroid: 0,
          spectralRolloff: 0,
          zeroCrossingRate: 0,
          energy: 0
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  async extractAudioMetadata(input, processor) {
    return new Promise((resolve, reject) => {
      processor.ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          type: 'audio',
          operation: 'metadata',
          result: metadata,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async transcribeAudio(input, processor, options) {
    // Placeholder for audio transcription
    return {
      type: 'audio',
      operation: 'transcribe',
      result: {
        transcription: 'Audio transcription would go here',
        confidence: 0.95,
        language: options.language || 'en'
      },
      timestamp: new Date().toISOString()
    };
  }

  // Video Processing
  async processVideo(input, options = {}) {
    try {
      const {
        operation = 'analyze',
        format = 'mp4',
        quality = 'high',
        width = this.config.video.maxWidth,
        height = this.config.video.maxHeight,
        fps = 30
      } = options;

      const videoProcessor = this.processors.get('video');
      if (!videoProcessor) {
        throw new Error('Video processor not available');
      }

      let result;
      switch (operation) {
        case 'analyze':
          result = await this.analyzeVideo(input, videoProcessor);
          break;
        case 'convert':
          result = await this.convertVideo(input, videoProcessor, { format, quality, width, height, fps });
          break;
        case 'thumbnail':
          result = await this.generateVideoThumbnail(input, videoProcessor, options);
          break;
        case 'extract':
          result = await this.extractVideoFeatures(input, videoProcessor);
          break;
        case 'metadata':
          result = await this.extractVideoMetadata(input, videoProcessor);
          break;
        case 'transcribe':
          result = await this.transcribeVideo(input, videoProcessor, options);
          break;
        default:
          throw new Error(`Unsupported video operation: ${operation}`);
      }

      return result;
    } catch (error) {
      logger.error('Video processing failed:', error);
      throw error;
    }
  }

  async analyzeVideo(input, processor) {
    return new Promise((resolve, reject) => {
      processor.ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        const analysis = {
          duration: metadata.format.duration,
          bitrate: metadata.format.bit_rate,
          size: metadata.format.size,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: eval(videoStream.r_frame_rate),
            bitrate: videoStream.bit_rate
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels,
            bitrate: audioStream.bit_rate
          } : null
        };

        resolve({
          type: 'video',
          operation: 'analyze',
          result: analysis,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async convertVideo(input, processor, options) {
    const { format, quality, width, height, fps } = options;
    
    return new Promise((resolve, reject) => {
      const outputPath = `./temp/converted_${Date.now()}.${format}`;
      
      processor.ffmpeg(input)
        .videoCodec(format === 'mp4' ? 'libx264' : 'libvpx')
        .videoBitrate(quality === 'high' ? '2000k' : '1000k')
        .size(`${width}x${height}`)
        .fps(fps)
        .on('end', () => {
          resolve({
            type: 'video',
            operation: 'convert',
            result: {
              outputPath,
              format,
              quality,
              width,
              height,
              fps
            },
            timestamp: new Date().toISOString()
          });
        })
        .on('error', reject)
        .save(outputPath);
    });
  }

  async generateVideoThumbnail(input, processor, options) {
    const { time = '00:00:01', width = 320, height = 240 } = options;
    
    return new Promise((resolve, reject) => {
      const outputPath = `./temp/thumbnail_${Date.now()}.jpg`;
      
      processor.ffmpeg(input)
        .seekInput(time)
        .frames(1)
        .size(`${width}x${height}`)
        .on('end', () => {
          resolve({
            type: 'video',
            operation: 'thumbnail',
            result: {
              outputPath,
              time,
              width,
              height
            },
            timestamp: new Date().toISOString()
          });
        })
        .on('error', reject)
        .save(outputPath);
    });
  }

  async extractVideoFeatures(input, processor) {
    // Placeholder for video feature extraction
    return {
      type: 'video',
      operation: 'extract',
      result: {
        features: {
          motionVectors: [],
          colorHistogram: [],
          edgeDensity: 0,
          brightness: 0,
          contrast: 0
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  async extractVideoMetadata(input, processor) {
    return new Promise((resolve, reject) => {
      processor.ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          type: 'video',
          operation: 'metadata',
          result: metadata,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async transcribeVideo(input, processor, options) {
    // Placeholder for video transcription
    return {
      type: 'video',
      operation: 'transcribe',
      result: {
        transcription: 'Video transcription would go here',
        confidence: 0.95,
        language: options.language || 'en'
      },
      timestamp: new Date().toISOString()
    };
  }

  // Text Processing
  async processText(input, options = {}) {
    try {
      const {
        operation = 'analyze',
        language = 'en',
        encoding = 'utf-8'
      } = options;

      const textProcessor = this.processors.get('text');
      if (!textProcessor) {
        throw new Error('Text processor not available');
      }

      let result;
      switch (operation) {
        case 'analyze':
          result = await this.analyzeText(input, textProcessor);
          break;
        case 'tokenize':
          result = await this.tokenizeText(input, textProcessor);
          break;
        case 'stem':
          result = await this.stemText(input, textProcessor);
          break;
        case 'lemmatize':
          result = await this.lemmatizeText(input, textProcessor);
          break;
        case 'sentiment':
          result = await this.analyzeSentiment(input, textProcessor);
          break;
        case 'language':
          result = await this.detectLanguage(input, textProcessor);
          break;
        case 'extract':
          result = await this.extractTextFeatures(input, textProcessor);
          break;
        case 'summarize':
          result = await this.summarizeText(input, textProcessor, options);
          break;
        default:
          throw new Error(`Unsupported text operation: ${operation}`);
      }

      return result;
    } catch (error) {
      logger.error('Text processing failed:', error);
      throw error;
    }
  }

  async analyzeText(input, processor) {
    const tokens = processor.natural.WordTokenizer().tokenize(input);
    const sentences = processor.natural.SentenceTokenizer().tokenize(input);
    
    const analysis = {
      length: input.length,
      wordCount: tokens.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: tokens.length / sentences.length,
      averageWordLength: tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length,
      uniqueWords: new Set(tokens.map(t => t.toLowerCase())).size,
      vocabularyDiversity: new Set(tokens.map(t => t.toLowerCase())).size / tokens.length
    };

    return {
      type: 'text',
      operation: 'analyze',
      result: analysis,
      timestamp: new Date().toISOString()
    };
  }

  async tokenizeText(input, processor) {
    const tokens = processor.natural.WordTokenizer().tokenize(input);
    
    return {
      type: 'text',
      operation: 'tokenize',
      result: {
        tokens,
        count: tokens.length
      },
      timestamp: new Date().toISOString()
    };
  }

  async stemText(input, processor) {
    const tokens = processor.natural.WordTokenizer().tokenize(input);
    const stems = tokens.map(token => processor.natural.PorterStemmer.stem(token));
    
    return {
      type: 'text',
      operation: 'stem',
      result: {
        original: tokens,
        stems,
        count: stems.length
      },
      timestamp: new Date().toISOString()
    };
  }

  async lemmatizeText(input, processor) {
    const tokens = processor.natural.WordTokenizer().tokenize(input);
    const lemmas = tokens.map(token => processor.natural.WordNet.lemmatize(token));
    
    return {
      type: 'text',
      operation: 'lemmatize',
      result: {
        original: tokens,
        lemmas,
        count: lemmas.length
      },
      timestamp: new Date().toISOString()
    };
  }

  async analyzeSentiment(input, processor) {
    const result = processor.sentiment.analyze(input);
    
    return {
      type: 'text',
      operation: 'sentiment',
      result: {
        score: result.score,
        comparative: result.comparative,
        positive: result.positive,
        negative: result.negative,
        neutral: result.neutral,
        sentiment: result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral'
      },
      timestamp: new Date().toISOString()
    };
  }

  async detectLanguage(input, processor) {
    // Placeholder for language detection
    return {
      type: 'text',
      operation: 'language',
      result: {
        language: 'en',
        confidence: 0.95
      },
      timestamp: new Date().toISOString()
    };
  }

  async extractTextFeatures(input, processor) {
    const tokens = processor.natural.WordTokenizer().tokenize(input);
    const sentences = processor.natural.SentenceTokenizer().tokenize(input);
    
    const features = {
      wordCount: tokens.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: tokens.length / sentences.length,
      averageWordLength: tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length,
      uniqueWords: new Set(tokens.map(t => t.toLowerCase())).size,
      vocabularyDiversity: new Set(tokens.map(t => t.toLowerCase())).size / tokens.length,
      punctuationCount: (input.match(/[.,!?;:]/g) || []).length,
      uppercaseCount: (input.match(/[A-Z]/g) || []).length,
      lowercaseCount: (input.match(/[a-z]/g) || []).length,
      digitCount: (input.match(/\d/g) || []).length,
      whitespaceCount: (input.match(/\s/g) || []).length
    };

    return {
      type: 'text',
      operation: 'extract',
      result: {
        features
      },
      timestamp: new Date().toISOString()
    };
  }

  async summarizeText(input, processor, options) {
    const { maxSentences = 3 } = options;
    const sentences = processor.natural.SentenceTokenizer().tokenize(input);
    
    // Simple extractive summarization
    const summary = sentences.slice(0, maxSentences).join(' ');
    
    return {
      type: 'text',
      operation: 'summarize',
      result: {
        summary,
        originalLength: input.length,
        summaryLength: summary.length,
        compressionRatio: summary.length / input.length,
        maxSentences
      },
      timestamp: new Date().toISOString()
    };
  }

  // Health Check
  async healthCheck() {
    try {
      const status = {
        initialized: this.isInitialized,
        processors: Array.from(this.processors.keys()),
        capabilities: {
          image: this.processors.get('image')?.capabilities || [],
          audio: this.processors.get('audio')?.capabilities || [],
          video: this.processors.get('video')?.capabilities || [],
          text: this.processors.get('text')?.capabilities || []
        },
        memoryUsage: process.memoryUsage()
      };

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: status
      };
    } catch (error) {
      logger.error('Multimodal Processor health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Cleanup
  async cleanup() {
    try {
      logger.info('Cleaning up Multimodal Processor...');
      
      this.processors.clear();
      this.isInitialized = false;
      
      logger.info('Multimodal Processor cleanup completed');
    } catch (error) {
      logger.error('Multimodal Processor cleanup failed:', error);
    }
  }
}

module.exports = new MultimodalProcessor();
