const logger = require('./logger');
const axios = require('axios');

class AIEngine {
  constructor() {
    this.models = {
      gpt4: {
        endpoint: process.env.GPT4_ENDPOINT || 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.GPT4_API_KEY,
        model: 'gpt-4-turbo-preview'
      },
      claude: {
        endpoint: process.env.CLAUDE_ENDPOINT || 'https://api.anthropic.com/v1/messages',
        apiKey: process.env.CLAUDE_API_KEY,
        model: 'claude-3-5-sonnet-20241022'
      },
      gemini: {
        endpoint: process.env.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.0-flash-exp'
      },
      llama: {
        endpoint: process.env.LLAMA_ENDPOINT || 'https://api.together.xyz/v1/chat/completions',
        apiKey: process.env.LLAMA_API_KEY,
        model: 'meta-llama/Llama-3.1-405B-Instruct-Turbo'
      },
      mixtral: {
        endpoint: process.env.MIXTRAL_ENDPOINT || 'https://api.together.xyz/v1/chat/completions',
        apiKey: process.env.MIXTRAL_API_KEY,
        model: 'mistralai/Mixtral-8x22B-Instruct-v0.1'
      }
    };
    this.isInitialized = false;
  }

  async initialize() {
    try {
      logger.info('[AI-ENGINE] Initializing AI Engine v2.8...');
      
      // Validate API keys
      for (const [modelName, config] of Object.entries(this.models)) {
        if (!config.apiKey) {
          logger.warn(`[AI-ENGINE] API key not found for ${modelName}`);
        } else {
          logger.info(`[AI-ENGINE] ${modelName} configured successfully`);
        }
      }
      
      this.isInitialized = true;
      logger.info('[AI-ENGINE] AI Engine initialized successfully');
    } catch (error) {
      logger.error(`[AI-ENGINE] Initialization failed: ${error.message}`);
      throw error;
    }
  }

  async processRequest(requestData) {
    if (!this.isInitialized) {
      throw new Error('AI Engine not initialized');
    }

    const { 
      prompt, 
      model = 'gpt4', 
      temperature = 0.7, 
      maxTokens = 2000,
      context = '',
      options = {} 
    } = requestData;

    try {
      logger.info(`[AI-ENGINE] Processing request with ${model}`);
      
      const startTime = Date.now();
      const result = await this.callModel(model, {
        prompt,
        temperature,
        maxTokens,
        context,
        options
      });
      
      const processingTime = Date.now() - startTime;
      
      logger.info(`[AI-ENGINE] Request processed in ${processingTime}ms`);
      
      return {
        success: true,
        model,
        response: result,
        processingTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[AI-ENGINE] Request processing failed: ${error.message}`);
      throw error;
    }
  }

  async callModel(modelName, params) {
    const modelConfig = this.models[modelName];
    if (!modelConfig || !modelConfig.apiKey) {
      throw new Error(`Model ${modelName} not available or not configured`);
    }

    try {
      switch (modelName) {
        case 'gpt4':
          return await this.callGPT4(modelConfig, params);
        case 'claude':
          return await this.callClaude(modelConfig, params);
        case 'gemini':
          return await this.callGemini(modelConfig, params);
        case 'llama':
          return await this.callLlama(modelConfig, params);
        case 'mixtral':
          return await this.callMixtral(modelConfig, params);
        default:
          throw new Error(`Unsupported model: ${modelName}`);
      }
    } catch (error) {
      logger.error(`[AI-ENGINE] Model ${modelName} call failed: ${error.message}`);
      throw error;
    }
  }

  async callGPT4(config, params) {
    const response = await axios.post(config.endpoint, {
      model: config.model,
      messages: [
        { role: 'system', content: params.context || 'You are a helpful AI assistant.' },
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature,
      max_tokens: params.maxTokens
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  }

  async callClaude(config, params) {
    const response = await axios.post(config.endpoint, {
      model: config.model,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      messages: [
        { role: 'user', content: `${params.context}\n\n${params.prompt}` }
      ]
    }, {
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    return response.data.content[0].text;
  }

  async callGemini(config, params) {
    const response = await axios.post(`${config.endpoint}?key=${config.apiKey}`, {
      contents: [{
        parts: [{
          text: `${params.context}\n\n${params.prompt}`
        }]
      }],
      generationConfig: {
        temperature: params.temperature,
        maxOutputTokens: params.maxTokens
      }
    });

    return response.data.candidates[0].content.parts[0].text;
  }

  async callLlama(config, params) {
    const response = await axios.post(config.endpoint, {
      model: config.model,
      messages: [
        { role: 'system', content: params.context || 'You are a helpful AI assistant.' },
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature,
      max_tokens: params.maxTokens
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  }

  async callMixtral(config, params) {
    const response = await axios.post(config.endpoint, {
      model: config.model,
      messages: [
        { role: 'system', content: params.context || 'You are a helpful AI assistant.' },
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature,
      max_tokens: params.maxTokens
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  }

  async getModelStatus() {
    const status = {};
    
    for (const [modelName, config] of Object.entries(this.models)) {
      status[modelName] = {
        configured: !!config.apiKey,
        endpoint: config.endpoint,
        model: config.model
      };
    }
    
    return status;
  }

  async healthCheck() {
    try {
      const testPrompt = "Hello, this is a health check. Please respond with 'OK'.";
      const result = await this.processRequest({
        prompt: testPrompt,
        model: 'gpt4',
        maxTokens: 10
      });
      
      return {
        status: 'healthy',
        response: result.response,
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

module.exports = new AIEngine();
