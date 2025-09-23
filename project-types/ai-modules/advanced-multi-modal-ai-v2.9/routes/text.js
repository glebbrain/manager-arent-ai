const express = require('express');
const multer = require('multer');
const textProcessor = require('../modules/text-processor');
const logger = require('../modules/logger');

const router = express.Router();

// Configure multer for text file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/json', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only text files are allowed.'));
    }
  }
});

// Process text from request body
router.post('/process', async (req, res) => {
  try {
    const { text, operations = ['sentiment', 'classification', 'keywords'] } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required',
        code: 'MISSING_TEXT'
      });
    }

    const results = {};
    const startTime = Date.now();

    // Process each requested operation
    for (const operation of operations) {
      try {
        switch (operation) {
          case 'sentiment':
            results.sentiment = await textProcessor.analyzeSentiment(text);
            break;
          case 'classification':
            results.classification = await textProcessor.classifyText(text);
            break;
          case 'keywords':
            results.keywords = await textProcessor.extractKeywords(text);
            break;
          case 'entities':
            results.entities = await textProcessor.extractEntities(text);
            break;
          case 'summary':
            results.summary = await textProcessor.summarizeText(text);
            break;
          case 'language':
            results.language = await textProcessor.detectLanguage(text);
            break;
          case 'translation':
            const { targetLanguage = 'en', sourceLanguage = 'auto' } = req.body;
            results.translation = await textProcessor.translateText(text, targetLanguage, sourceLanguage);
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
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      results: results,
      operations: operations,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Text processing failed:', { error: error.message });
    res.status(500).json({
      error: 'Text processing failed',
      message: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
});

// Process text from uploaded file
router.post('/upload', upload.single('textFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const text = req.file.buffer.toString('utf8');
    const { operations = ['sentiment', 'classification', 'keywords'] } = req.body;

    const results = {};
    const startTime = Date.now();

    // Process each requested operation
    for (const operation of operations) {
      try {
        switch (operation) {
          case 'sentiment':
            results.sentiment = await textProcessor.analyzeSentiment(text);
            break;
          case 'classification':
            results.classification = await textProcessor.classifyText(text);
            break;
          case 'keywords':
            results.keywords = await textProcessor.extractKeywords(text);
            break;
          case 'entities':
            results.entities = await textProcessor.extractEntities(text);
            break;
          case 'summary':
            results.summary = await textProcessor.summarizeText(text);
            break;
          case 'language':
            results.language = await textProcessor.detectLanguage(text);
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
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      results: results,
      operations: operations,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('File processing failed:', { error: error.message });
    res.status(500).json({
      error: 'File processing failed',
      message: error.message,
      code: 'FILE_PROCESSING_ERROR'
    });
  }
});

// Get available operations
router.get('/operations', (req, res) => {
  res.json({
    operations: [
      'sentiment',
      'classification', 
      'keywords',
      'entities',
      'summary',
      'language',
      'translation'
    ],
    descriptions: {
      sentiment: 'Analyze sentiment (positive, negative, neutral)',
      classification: 'Classify text into categories',
      keywords: 'Extract key terms and phrases',
      entities: 'Extract named entities (persons, organizations, etc.)',
      summary: 'Generate text summary',
      language: 'Detect language',
      translation: 'Translate text to target language'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Text Processing',
    version: '2.9.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
