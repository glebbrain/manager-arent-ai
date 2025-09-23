const express = require('express');
const router = express.Router();
const cognitiveServices = require('../modules/cognitive-services');
const logger = require('../modules/logger');

// POST /api/v2.8/cognitive/text
router.post('/text', async (req, res) => {
  try {
    const { text, options } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await cognitiveServices.processText(text, options || {});

    res.json(result);
  } catch (error) {
    logger.error(`[COGNITIVE-ROUTE] Text processing error: ${error.message}`);
    res.status(500).json({ 
      error: 'Text processing failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/cognitive/image
router.post('/image', async (req, res) => {
  try {
    const { imageData, options } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const result = await cognitiveServices.processImage(imageData, options || {});

    res.json(result);
  } catch (error) {
    logger.error(`[COGNITIVE-ROUTE] Image processing error: ${error.message}`);
    res.status(500).json({ 
      error: 'Image processing failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/cognitive/speech
router.post('/speech', async (req, res) => {
  try {
    const { audioData, options } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const result = await cognitiveServices.processSpeech(audioData, options || {});

    res.json(result);
  } catch (error) {
    logger.error(`[COGNITIVE-ROUTE] Speech processing error: ${error.message}`);
    res.status(500).json({ 
      error: 'Speech processing failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/cognitive/knowledge
router.post('/knowledge', async (req, res) => {
  try {
    const { query, options } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await cognitiveServices.queryKnowledge(query, options || {});

    res.json(result);
  } catch (error) {
    logger.error(`[COGNITIVE-ROUTE] Knowledge query error: ${error.message}`);
    res.status(500).json({ 
      error: 'Knowledge query failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/cognitive/reasoning
router.post('/reasoning', async (req, res) => {
  try {
    const { problem, options } = req.body;
    
    if (!problem) {
      return res.status(400).json({ error: 'Problem is required' });
    }

    const result = await cognitiveServices.performReasoning(problem, options || {});

    res.json(result);
  } catch (error) {
    logger.error(`[COGNITIVE-ROUTE] Reasoning error: ${error.message}`);
    res.status(500).json({ 
      error: 'Reasoning failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/cognitive/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { content, contentType, analysisTypes, options } = req.body;
    
    if (!content || !contentType) {
      return res.status(400).json({ 
        error: 'Content and contentType are required' 
      });
    }

    const results = {};
    const analysisTypesList = analysisTypes || ['sentiment', 'emotion', 'keywords'];

    for (const analysisType of analysisTypesList) {
      try {
        let result;
        switch (contentType) {
          case 'text':
            result = await cognitiveServices.processText(content, { analysisType, ...options });
            break;
          case 'image':
            result = await cognitiveServices.processImage(content, { analysisType, ...options });
            break;
          case 'speech':
            result = await cognitiveServices.processSpeech(content, { analysisType, ...options });
            break;
          default:
            throw new Error(`Unsupported content type: ${contentType}`);
        }
        results[analysisType] = result;
      } catch (error) {
        results[analysisType] = { error: error.message };
      }
    }

    res.json({
      success: true,
      contentType,
      analysisTypes: analysisTypesList,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[COGNITIVE-ROUTE] Analysis error: ${error.message}`);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

// GET /api/v2.8/cognitive/services
router.get('/services', async (req, res) => {
  try {
    const status = await cognitiveServices.getServiceStatus();
    res.json({
      success: true,
      services: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[COGNITIVE-ROUTE] Services status error: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to get services status',
      message: error.message 
    });
  }
});

// GET /api/v2.8/cognitive/health
router.get('/health', async (req, res) => {
  try {
    const health = await cognitiveServices.healthCheck();
    res.json(health);
  } catch (error) {
    logger.error(`[COGNITIVE-ROUTE] Health check error: ${error.message}`);
    res.status(500).json({ 
      error: 'Health check failed',
      message: error.message 
    });
  }
});

module.exports = router;
