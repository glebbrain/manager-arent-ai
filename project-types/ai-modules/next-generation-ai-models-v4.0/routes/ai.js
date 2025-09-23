const express = require('express');
const router = express.Router();
const aiEngine = require('../modules/ai-engine');
const logger = require('../modules/logger');

// Text Generation
router.post('/generate-text', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await aiEngine.generateText(prompt, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Text generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Image Generation
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await aiEngine.generateImage(prompt, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Text Embeddings
router.post('/generate-embeddings', async (req, res) => {
  try {
    const { text, options = {} } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = await aiEngine.generateEmbeddings(text, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Embeddings generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Code Generation
router.post('/generate-code', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await aiEngine.generateCode(prompt, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Code generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Question Answering
router.post('/answer-question', async (req, res) => {
  try {
    const { question, context, options = {} } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    const result = await aiEngine.answerQuestion(question, context, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Question answering error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Text Summarization
router.post('/summarize-text', async (req, res) => {
  try {
    const { text, options = {} } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = await aiEngine.summarizeText(text, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Text summarization error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Text Translation
router.post('/translate-text', async (req, res) => {
  try {
    const { text, targetLanguage, options = {} } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Text and target language are required'
      });
    }

    const result = await aiEngine.translateText(text, targetLanguage, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Text translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Batch Processing
router.post('/batch-process', async (req, res) => {
  try {
    const { requests, options = {} } = req.body;
    
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Requests array is required'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < requests.length; i++) {
      try {
        const { type, data } = requests[i];
        let result;

        switch (type) {
          case 'generate-text':
            result = await aiEngine.generateText(data.prompt, data.options);
            break;
          case 'generate-embeddings':
            result = await aiEngine.generateEmbeddings(data.text, data.options);
            break;
          case 'summarize-text':
            result = await aiEngine.summarizeText(data.text, data.options);
            break;
          case 'translate-text':
            result = await aiEngine.translateText(data.text, data.targetLanguage, data.options);
            break;
          default:
            throw new Error(`Unsupported request type: ${type}`);
        }

        results.push({
          index: i,
          type,
          success: true,
          data: result
        });
      } catch (error) {
        errors.push({
          index: i,
          type: requests[i].type,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        total: requests.length,
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

// AI Engine Status
router.get('/status', async (req, res) => {
  try {
    const status = await aiEngine.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI Engine Capabilities
router.get('/capabilities', (req, res) => {
  try {
    const capabilities = {
      textGeneration: {
        models: ['gpt-4-turbo-preview', 'gpt-3.5-turbo'],
        providers: ['openai', 'huggingface'],
        features: ['conversation', 'code-generation', 'creative-writing']
      },
      imageGeneration: {
        models: ['dall-e-3'],
        providers: ['openai'],
        features: ['image-creation', 'image-editing', 'style-transfer']
      },
      embeddings: {
        models: ['text-embedding-3-large', 'sentence-transformers/all-MiniLM-L6-v2'],
        providers: ['openai', 'huggingface'],
        features: ['text-embeddings', 'similarity-search', 'clustering']
      },
      codeGeneration: {
        languages: ['javascript', 'python', 'java', 'c++', 'go', 'rust'],
        frameworks: ['react', 'vue', 'angular', 'express', 'django', 'flask'],
        features: ['code-generation', 'code-completion', 'bug-fixing', 'refactoring']
      },
      nlp: {
        features: ['question-answering', 'summarization', 'translation', 'sentiment-analysis'],
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
      }
    };

    res.json({
      success: true,
      data: capabilities
    });
  } catch (error) {
    logger.error('Capabilities check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
