const express = require('express');
const router = express.Router();
const aiEngine = require('../modules/ai-engine');
const logger = require('../modules/logger');

// POST /api/v2.8/ai/process
router.post('/process', async (req, res) => {
  try {
    const { prompt, model, temperature, maxTokens, context, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await aiEngine.processRequest({
      prompt,
      model: model || 'gpt4',
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2000,
      context: context || '',
      options: options || {}
    });

    res.json(result);
  } catch (error) {
    logger.error(`[AI-ROUTE] Process error: ${error.message}`);
    res.status(500).json({ 
      error: 'AI processing failed',
      message: error.message 
    });
  }
});

// GET /api/v2.8/ai/models
router.get('/models', async (req, res) => {
  try {
    const models = await aiEngine.getModelStatus();
    res.json({
      success: true,
      models,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[AI-ROUTE] Models error: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to get model status',
      message: error.message 
    });
  }
});

// POST /api/v2.8/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { messages, model, temperature, maxTokens } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Convert messages to prompt
    const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    const result = await aiEngine.processRequest({
      prompt,
      model: model || 'gpt4',
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2000,
      context: 'You are a helpful AI assistant.',
      options: {}
    });

    res.json({
      success: true,
      response: result.response,
      model: result.model,
      processingTime: result.processingTime,
      timestamp: result.timestamp
    });
  } catch (error) {
    logger.error(`[AI-ROUTE] Chat error: ${error.message}`);
    res.status(500).json({ 
      error: 'Chat processing failed',
      message: error.message 
    });
  }
});

// POST /api/v2.8/ai/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { text, analysisType, model } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const analysisPrompts = {
      sentiment: `Analyze the sentiment of the following text and provide a score from -1 (negative) to 1 (positive): "${text}"`,
      emotion: `Identify the emotions in the following text: "${text}"`,
      intent: `Determine the intent behind the following text: "${text}"`,
      summary: `Provide a concise summary of the following text: "${text}"`,
      keywords: `Extract the key keywords from the following text: "${text}"`,
      language: `Identify the language of the following text: "${text}"`
    };

    const prompt = analysisPrompts[analysisType] || analysisPrompts.summary;
    
    const result = await aiEngine.processRequest({
      prompt,
      model: model || 'gpt4',
      temperature: 0.3,
      maxTokens: 500,
      context: 'You are an expert text analyst.',
      options: {}
    });

    res.json({
      success: true,
      analysisType,
      text,
      result: result.response,
      model: result.model,
      processingTime: result.processingTime,
      timestamp: result.timestamp
    });
  } catch (error) {
    logger.error(`[AI-ROUTE] Analysis error: ${error.message}`);
    res.status(500).json({ 
      error: 'Text analysis failed',
      message: error.message 
    });
  }
});

// GET /api/v2.8/ai/health
router.get('/health', async (req, res) => {
  try {
    const health = await aiEngine.healthCheck();
    res.json(health);
  } catch (error) {
    logger.error(`[AI-ROUTE] Health check error: ${error.message}`);
    res.status(500).json({ 
      error: 'Health check failed',
      message: error.message 
    });
  }
});

module.exports = router;
