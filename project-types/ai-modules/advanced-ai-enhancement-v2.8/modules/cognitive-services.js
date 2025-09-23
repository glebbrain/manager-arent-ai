const logger = require('./logger');

class CognitiveServices {
  constructor() {
    this.isInitialized = false;
    this.services = {
      nlp: require('./services/nlp-service'),
      vision: require('./services/vision-service'),
      speech: require('./services/speech-service'),
      knowledge: require('./services/knowledge-service'),
      reasoning: require('./services/reasoning-service')
    };
  }

  async initialize() {
    try {
      logger.info('[COGNITIVE] Initializing Cognitive Services v2.8...');
      
      // Initialize all cognitive services
      for (const [serviceName, service] of Object.entries(this.services)) {
        await service.initialize();
        logger.info(`[COGNITIVE] ${serviceName} service initialized`);
      }
      
      this.isInitialized = true;
      logger.info('[COGNITIVE] Cognitive Services initialized successfully');
    } catch (error) {
      logger.error(`[COGNITIVE] Initialization failed: ${error.message}`);
      throw error;
    }
  }

  async processText(text, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Cognitive Services not initialized');
    }

    try {
      logger.info('[COGNITIVE] Processing text with NLP service');
      
      const startTime = Date.now();
      const result = await this.services.nlp.process(text, options);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        service: 'nlp',
        result,
        processingTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[COGNITIVE] Text processing failed: ${error.message}`);
      throw error;
    }
  }

  async processImage(imageData, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Cognitive Services not initialized');
    }

    try {
      logger.info('[COGNITIVE] Processing image with Vision service');
      
      const startTime = Date.now();
      const result = await this.services.vision.process(imageData, options);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        service: 'vision',
        result,
        processingTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[COGNITIVE] Image processing failed: ${error.message}`);
      throw error;
    }
  }

  async processSpeech(audioData, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Cognitive Services not initialized');
    }

    try {
      logger.info('[COGNITIVE] Processing speech with Speech service');
      
      const startTime = Date.now();
      const result = await this.services.speech.process(audioData, options);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        service: 'speech',
        result,
        processingTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[COGNITIVE] Speech processing failed: ${error.message}`);
      throw error;
    }
  }

  async queryKnowledge(query, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Cognitive Services not initialized');
    }

    try {
      logger.info('[COGNITIVE] Querying knowledge base');
      
      const startTime = Date.now();
      const result = await this.services.knowledge.query(query, options);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        service: 'knowledge',
        result,
        processingTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[COGNITIVE] Knowledge query failed: ${error.message}`);
      throw error;
    }
  }

  async performReasoning(problem, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Cognitive Services not initialized');
    }

    try {
      logger.info('[COGNITIVE] Performing reasoning with Reasoning service');
      
      const startTime = Date.now();
      const result = await this.services.reasoning.solve(problem, options);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        service: 'reasoning',
        result,
        processingTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[COGNITIVE] Reasoning failed: ${error.message}`);
      throw error;
    }
  }

  async getServiceStatus() {
    const status = {};
    
    for (const [serviceName, service] of Object.entries(this.services)) {
      try {
        status[serviceName] = await service.getStatus();
      } catch (error) {
        status[serviceName] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    return status;
  }

  async healthCheck() {
    try {
      const testResult = await this.processText("This is a health check test.");
      
      return {
        status: 'healthy',
        services: Object.keys(this.services),
        testResult: testResult.success,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new CognitiveServices();
