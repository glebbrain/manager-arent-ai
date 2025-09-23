const textProcessor = require('./text-processor');
const imageProcessor = require('./image-processor');
const audioProcessor = require('./audio-processor');
const videoProcessor = require('./video-processor');
const logger = require('./logger');

class MultiModalEngine {
  constructor() {
    this.processors = {
      text: textProcessor,
      image: imageProcessor,
      audio: audioProcessor,
      video: videoProcessor
    };
  }

  // Process multiple modalities together
  async processMultiModal(inputs, options = {}) {
    try {
      const { fusion = 'early', analysis = 'comprehensive' } = options;
      
      logger.info('Starting multi-modal processing', { 
        modalities: Object.keys(inputs),
        fusion: fusion,
        analysis: analysis
      });

      const results = {};
      const processingPromises = [];

      // Process each modality
      for (const [modality, data] of Object.entries(inputs)) {
        if (this.processors[modality]) {
          processingPromises.push(
            this.processModality(modality, data, options)
              .then(result => ({ modality, result }))
              .catch(error => ({ modality, error: error.message }))
          );
        }
      }

      const modalityResults = await Promise.all(processingPromises);
      
      // Organize results by modality
      modalityResults.forEach(({ modality, result, error }) => {
        if (error) {
          results[modality] = { error };
        } else {
          results[modality] = result;
        }
      });

      // Apply fusion strategy
      const fusedResult = await this.applyFusion(results, fusion);

      return {
        modalities: results,
        fused: fusedResult,
        processingTime: Date.now() - (options.startTime || Date.now()),
        success: true
      };
    } catch (error) {
      logger.error('Multi-modal processing failed:', { error: error.message });
      throw error;
    }
  }

  // Process individual modality
  async processModality(modality, data, options = {}) {
    try {
      const processor = this.processors[modality];
      if (!processor) {
        throw new Error(`Unsupported modality: ${modality}`);
      }

      switch (modality) {
        case 'text':
          return await this.processText(data, options);
        case 'image':
          return await this.processImage(data, options);
        case 'audio':
          return await this.processAudio(data, options);
        case 'video':
          return await this.processVideo(data, options);
        default:
          throw new Error(`Unknown modality: ${modality}`);
      }
    } catch (error) {
      logger.error(`Modality processing failed for ${modality}:`, { error: error.message });
      throw error;
    }
  }

  // Process text data
  async processText(data, options = {}) {
    try {
      const { text, operations = ['sentiment', 'classification', 'keywords'] } = data;
      
      const results = {};
      
      if (operations.includes('sentiment')) {
        results.sentiment = await textProcessor.analyzeSentiment(text);
      }
      
      if (operations.includes('classification')) {
        results.classification = await textProcessor.classifyText(text);
      }
      
      if (operations.includes('keywords')) {
        results.keywords = await textProcessor.extractKeywords(text);
      }
      
      if (operations.includes('entities')) {
        results.entities = await textProcessor.extractEntities(text);
      }
      
      if (operations.includes('summary')) {
        results.summary = await textProcessor.summarizeText(text);
      }
      
      if (operations.includes('language')) {
        results.language = await textProcessor.detectLanguage(text);
      }

      return {
        modality: 'text',
        results: results,
        processingTime: Date.now() - (options.startTime || Date.now())
      };
    } catch (error) {
      logger.error('Text processing failed:', { error: error.message });
      throw error;
    }
  }

  // Process image data
  async processImage(data, options = {}) {
    try {
      const { imagePath, operations = ['classification', 'objects'] } = data;
      
      const results = {};
      
      if (operations.includes('classification')) {
        results.classification = await imageProcessor.classifyImage(imagePath);
      }
      
      if (operations.includes('objects')) {
        results.objects = await imageProcessor.detectObjects(imagePath);
      }
      
      if (operations.includes('faces')) {
        results.faces = await imageProcessor.detectFaces(imagePath);
      }
      
      if (operations.includes('ocr')) {
        results.ocr = await imageProcessor.extractText(imagePath);
      }
      
      if (operations.includes('features')) {
        results.features = await imageProcessor.extractFeatures(imagePath);
      }

      return {
        modality: 'image',
        results: results,
        processingTime: Date.now() - (options.startTime || Date.now())
      };
    } catch (error) {
      logger.error('Image processing failed:', { error: error.message });
      throw error;
    }
  }

  // Process audio data
  async processAudio(data, options = {}) {
    try {
      const { audioPath, operations = ['transcription', 'classification'] } = data;
      
      const results = {};
      
      if (operations.includes('transcription')) {
        results.transcription = await audioProcessor.transcribeSpeech(audioPath);
      }
      
      if (operations.includes('classification')) {
        results.classification = await audioProcessor.classifyAudio(audioPath);
      }
      
      if (operations.includes('music')) {
        results.music = await audioProcessor.analyzeMusic(audioPath);
      }
      
      if (operations.includes('speaker')) {
        results.speaker = await audioProcessor.identifySpeaker(audioPath);
      }
      
      if (operations.includes('emotion')) {
        results.emotion = await audioProcessor.detectEmotion(audioPath);
      }
      
      if (operations.includes('features')) {
        results.features = await audioProcessor.extractFeatures(audioPath);
      }

      return {
        modality: 'audio',
        results: results,
        processingTime: Date.now() - (options.startTime || Date.now())
      };
    } catch (error) {
      logger.error('Audio processing failed:', { error: error.message });
      throw error;
    }
  }

  // Process video data
  async processVideo(data, options = {}) {
    try {
      const { videoPath, operations = ['objects', 'scenes'] } = data;
      
      const results = {};
      
      if (operations.includes('objects')) {
        results.objects = await videoProcessor.trackObjects(videoPath);
      }
      
      if (operations.includes('scenes')) {
        results.scenes = await videoProcessor.detectScenes(videoPath);
      }
      
      if (operations.includes('motion')) {
        results.motion = await videoProcessor.detectMotion(videoPath);
      }
      
      if (operations.includes('classification')) {
        results.classification = await videoProcessor.classifyVideo(videoPath);
      }
      
      if (operations.includes('frames')) {
        results.frames = await videoProcessor.extractFrames(videoPath, 'temp/frames');
      }

      return {
        modality: 'video',
        results: results,
        processingTime: Date.now() - (options.startTime || Date.now())
      };
    } catch (error) {
      logger.error('Video processing failed:', { error: error.message });
      throw error;
    }
  }

  // Apply fusion strategy
  async applyFusion(results, strategy = 'early') {
    try {
      switch (strategy) {
        case 'early':
          return this.earlyFusion(results);
        case 'late':
          return this.lateFusion(results);
        case 'attention':
          return this.attentionFusion(results);
        default:
          return this.earlyFusion(results);
      }
    } catch (error) {
      logger.error('Fusion failed:', { error: error.message });
      throw error;
    }
  }

  // Early fusion - combine features before processing
  earlyFusion(results) {
    const features = {};
    
    // Extract features from each modality
    Object.entries(results).forEach(([modality, result]) => {
      if (result.results && result.results.features) {
        features[modality] = result.results.features;
      }
    });

    // Combine features
    const combinedFeatures = this.combineFeatures(features);

    return {
      strategy: 'early',
      features: combinedFeatures,
      modalities: Object.keys(features),
      confidence: this.calculateConfidence(results)
    };
  }

  // Late fusion - combine results after processing
  lateFusion(results) {
    const predictions = {};
    
    // Extract predictions from each modality
    Object.entries(results).forEach(([modality, result]) => {
      if (result.results && result.results.classification) {
        predictions[modality] = result.results.classification;
      }
    });

    // Combine predictions
    const combinedPrediction = this.combinePredictions(predictions);

    return {
      strategy: 'late',
      predictions: combinedPrediction,
      modalities: Object.keys(predictions),
      confidence: this.calculateConfidence(results)
    };
  }

  // Attention-based fusion
  attentionFusion(results) {
    const attentionWeights = this.calculateAttentionWeights(results);
    
    return {
      strategy: 'attention',
      weights: attentionWeights,
      modalities: Object.keys(results),
      confidence: this.calculateConfidence(results)
    };
  }

  // Combine features from different modalities
  combineFeatures(features) {
    const combined = {};
    
    Object.entries(features).forEach(([modality, featureSet]) => {
      Object.entries(featureSet).forEach(([key, value]) => {
        combined[`${modality}_${key}`] = value;
      });
    });

    return combined;
  }

  // Combine predictions from different modalities
  combinePredictions(predictions) {
    const allCategories = new Set();
    
    // Collect all unique categories
    Object.values(predictions).forEach(pred => {
      if (pred.predictions) {
        pred.predictions.forEach(p => allCategories.add(p.category));
      }
    });

    const combinedScores = {};
    
    // Calculate weighted average scores
    allCategories.forEach(category => {
      let totalScore = 0;
      let totalWeight = 0;
      
      Object.entries(predictions).forEach(([modality, pred]) => {
        if (pred.predictions) {
          const categoryPred = pred.predictions.find(p => p.category === category);
          if (categoryPred) {
            totalScore += categoryPred.confidence;
            totalWeight += 1;
          }
        }
      });
      
      combinedScores[category] = totalWeight > 0 ? totalScore / totalWeight : 0;
    });

    // Sort by confidence
    const sortedCategories = Object.entries(combinedScores)
      .sort(([,a], [,b]) => b - a)
      .map(([category, confidence]) => ({ category, confidence }));

    return {
      predictions: sortedCategories,
      topPrediction: sortedCategories[0]
    };
  }

  // Calculate attention weights
  calculateAttentionWeights(results) {
    const weights = {};
    const totalConfidence = Object.values(results).reduce((sum, result) => {
      return sum + (result.results ? this.calculateModalityConfidence(result.results) : 0);
    }, 0);

    Object.entries(results).forEach(([modality, result]) => {
      const confidence = result.results ? this.calculateModalityConfidence(result.results) : 0;
      weights[modality] = totalConfidence > 0 ? confidence / totalConfidence : 0;
    });

    return weights;
  }

  // Calculate confidence for a modality
  calculateModalityConfidence(results) {
    let totalConfidence = 0;
    let count = 0;

    Object.values(results).forEach(result => {
      if (result.confidence) {
        totalConfidence += result.confidence;
        count++;
      }
    });

    return count > 0 ? totalConfidence / count : 0.5;
  }

  // Calculate overall confidence
  calculateConfidence(results) {
    const confidences = Object.values(results).map(result => 
      this.calculateModalityConfidence(result.results || {})
    );

    return confidences.length > 0 
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length 
      : 0.5;
  }

  // Get supported modalities
  getSupportedModalities() {
    return Object.keys(this.processors);
  }

  // Get available operations for a modality
  getModalityOperations(modality) {
    const operations = {
      text: ['sentiment', 'classification', 'keywords', 'entities', 'summary', 'language', 'translation'],
      image: ['classification', 'objects', 'faces', 'ocr', 'features', 'enhancement'],
      audio: ['transcription', 'classification', 'music', 'speaker', 'emotion', 'features'],
      video: ['objects', 'scenes', 'motion', 'classification', 'frames', 'enhancement']
    };

    return operations[modality] || [];
  }
}

module.exports = new MultiModalEngine();
