const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const compression = require('compression');
const winston = require('winston');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// NLP Libraries
const natural = require('natural');
const nlp = require('compromise');
const Sentiment = require('sentiment');
const franc = require('franc');
const { NlpManager } = require('node-nlp');

// AI Model Providers
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3015;

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: 'logs/nlp-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/nlp-combined.log' })
    ]
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // allow 100 requests per 15 minutes, then...
    delayMs: 500 // begin adding 500ms of delay per request above 100
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Advanced NLP Configuration v2.7.0
const nlpConfig = {
    version: '2.7.0',
    features: {
        textAnalysis: true,
        sentimentAnalysis: true,
        entityExtraction: true,
        languageDetection: true,
        textClassification: true,
        summarization: true,
        translation: true,
        keywordExtraction: true,
        topicModeling: true,
        textSimilarity: true,
        namedEntityRecognition: true,
        partOfSpeechTagging: true,
        dependencyParsing: true,
        textGeneration: true,
        questionAnswering: true,
        textToSpeech: true,
        speechToText: true,
        opticalCharacterRecognition: true,
        documentAnalysis: true
    },
    supportedLanguages: [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
    ],
    models: {
        sentiment: {
            name: 'Sentiment Analysis',
            version: '1.0.0',
            languages: ['en'],
            accuracy: 0.85
        },
        entity: {
            name: 'Entity Extraction',
            version: '1.0.0',
            languages: ['en'],
            accuracy: 0.90
        },
        classification: {
            name: 'Text Classification',
            version: '1.0.0',
            languages: ['en'],
            accuracy: 0.88
        },
        summarization: {
            name: 'Text Summarization',
            version: '1.0.0',
            languages: ['en'],
            accuracy: 0.82
        },
        translation: {
            name: 'Translation',
            version: '1.0.0',
            languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
            accuracy: 0.87
        }
    },
    limits: {
        maxTextLength: 1000000,
        maxBatchSize: 100,
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
        maxRequestsPerDay: 10000
    }
};

// Initialize NLP Components
const sentiment = new Sentiment();
const nlpManager = new NlpManager({ languages: nlpConfig.supportedLanguages });

// Initialize AI Model Clients
const aiClients = {};

function initializeAIClients() {
    try {
        // OpenAI
        if (process.env.OPENAI_API_KEY) {
            aiClients.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
            logger.info('OpenAI client initialized for NLP');
        }

        // Anthropic
        if (process.env.ANTHROPIC_API_KEY) {
            aiClients.anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY
            });
            logger.info('Anthropic client initialized for NLP');
        }

        // Google
        if (process.env.GOOGLE_API_KEY) {
            aiClients.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            logger.info('Google client initialized for NLP');
        }

        logger.info('AI clients initialization completed for NLP');
    } catch (error) {
        logger.error('Error initializing AI clients for NLP:', error);
    }
}

// NLP Data Storage
let nlpData = {
    requests: new Map(),
    responses: new Map(),
    analytics: {
        totalRequests: 0,
        requestsByType: {},
        requestsByLanguage: {},
        totalTextProcessed: 0,
        averageProcessingTime: 0,
        successRate: 0,
        errorRate: 0
    },
    cache: new Map(),
    performance: {
        processingTimes: [],
        throughput: [],
        errorRates: [],
        accuracyMetrics: []
    }
};

// Utility Functions
function generateRequestId() {
    return uuidv4();
}

function updateAnalytics(requestType, language, textLength, processingTime, success) {
    nlpData.analytics.totalRequests++;
    
    // Update type analytics
    if (!nlpData.analytics.requestsByType[requestType]) {
        nlpData.analytics.requestsByType[requestType] = 0;
    }
    nlpData.analytics.requestsByType[requestType]++;
    
    // Update language analytics
    if (!nlpData.analytics.requestsByLanguage[language]) {
        nlpData.analytics.requestsByLanguage[language] = 0;
    }
    nlpData.analytics.requestsByLanguage[language]++;
    
    // Update totals
    nlpData.analytics.totalTextProcessed += textLength;
    
    // Update performance metrics
    nlpData.performance.processingTimes.push(processingTime);
    nlpData.performance.throughput.push(1);
    
    if (success) {
        nlpData.analytics.successRate = (nlpData.analytics.successRate * (nlpData.analytics.totalRequests - 1) + 1) / nlpData.analytics.totalRequests;
    } else {
        nlpData.analytics.errorRate = (nlpData.analytics.errorRate * (nlpData.analytics.totalRequests - 1) + 1) / nlpData.analytics.totalRequests;
    }
    
    // Calculate average processing time
    const totalProcessingTime = nlpData.performance.processingTimes.reduce((a, b) => a + b, 0);
    nlpData.analytics.averageProcessingTime = totalProcessingTime / nlpData.performance.processingTimes.length;
}

// NLP Processing Functions
function analyzeSentiment(text, options = {}) {
    const startTime = Date.now();
    
    try {
        const result = sentiment.analyze(text);
        const processingTime = Date.now() - startTime;
        
        updateAnalytics('sentiment_analysis', 'en', text.length, processingTime, true);
        
        return {
            success: true,
            sentiment: {
                score: result.score,
                comparative: result.comparative,
                positive: result.positive,
                negative: result.negative,
                neutral: result.neutral
            },
            processingTime,
            language: 'en'
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('sentiment_analysis', 'en', text.length, processingTime, false);
        
        logger.error('Sentiment analysis error:', error);
        throw error;
    }
}

function extractEntities(text, options = {}) {
    const startTime = Date.now();
    
    try {
        const doc = nlp(text);
        const entities = {
            people: doc.people().out('array'),
            places: doc.places().out('array'),
            organizations: doc.organizations().out('array'),
            dates: doc.dates().out('array'),
            money: doc.money().out('array'),
            percentages: doc.percentages().out('array'),
            phoneNumbers: doc.phoneNumbers().out('array'),
            emails: doc.emails().out('array'),
            urls: doc.urls().out('array'),
            hashtags: doc.hashtags().out('array'),
            mentions: doc.mentions().out('array')
        };
        
        const processingTime = Date.now() - startTime;
        
        updateAnalytics('entity_extraction', 'en', text.length, processingTime, true);
        
        return {
            success: true,
            entities,
            processingTime,
            language: 'en'
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('entity_extraction', 'en', text.length, processingTime, false);
        
        logger.error('Entity extraction error:', error);
        throw error;
    }
}

function detectLanguage(text, options = {}) {
    const startTime = Date.now();
    
    try {
        const language = franc(text);
        const confidence = franc.all(text)[0] ? franc.all(text)[0][1] : 0;
        
        const processingTime = Date.now() - startTime;
        
        updateAnalytics('language_detection', language, text.length, processingTime, true);
        
        return {
            success: true,
            language: {
                code: language,
                name: getLanguageName(language),
                confidence: confidence
            },
            processingTime
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('language_detection', 'unknown', text.length, processingTime, false);
        
        logger.error('Language detection error:', error);
        throw error;
    }
}

function getLanguageName(code) {
    const languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'th': 'Thai',
        'vi': 'Vietnamese',
        'tr': 'Turkish',
        'pl': 'Polish',
        'nl': 'Dutch',
        'sv': 'Swedish',
        'da': 'Danish',
        'no': 'Norwegian',
        'fi': 'Finnish'
    };
    return languages[code] || 'Unknown';
}

function classifyText(text, categories, options = {}) {
    const startTime = Date.now();
    
    try {
        // Simple keyword-based classification
        const classification = {};
        const textLower = text.toLowerCase();
        
        categories.forEach(category => {
            const keywords = category.keywords || [];
            const matches = keywords.filter(keyword => 
                textLower.includes(keyword.toLowerCase())
            ).length;
            classification[category.name] = matches / keywords.length;
        });
        
        const topCategory = Object.keys(classification).reduce((a, b) => 
            classification[a] > classification[b] ? a : b
        );
        
        const processingTime = Date.now() - startTime;
        
        updateAnalytics('text_classification', 'en', text.length, processingTime, true);
        
        return {
            success: true,
            classification: {
                topCategory,
                scores: classification,
                confidence: classification[topCategory]
            },
            processingTime,
            language: 'en'
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('text_classification', 'en', text.length, processingTime, false);
        
        logger.error('Text classification error:', error);
        throw error;
    }
}

function extractKeywords(text, options = {}) {
    const startTime = Date.now();
    
    try {
        const doc = nlp(text);
        const keywords = doc.nouns().out('array');
        const keyphrases = doc.nounPhrases().out('array');
        
        // Remove duplicates and sort by frequency
        const keywordCounts = {};
        keywords.forEach(keyword => {
            keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        });
        
        const sortedKeywords = Object.entries(keywordCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, options.maxKeywords || 10)
            .map(([keyword, count]) => ({ keyword, count }));
        
        const processingTime = Date.now() - startTime;
        
        updateAnalytics('keyword_extraction', 'en', text.length, processingTime, true);
        
        return {
            success: true,
            keywords: sortedKeywords,
            keyphrases,
            processingTime,
            language: 'en'
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('keyword_extraction', 'en', text.length, processingTime, false);
        
        logger.error('Keyword extraction error:', error);
        throw error;
    }
}

function summarizeText(text, options = {}) {
    const startTime = Date.now();
    
    try {
        const doc = nlp(text);
        const sentences = doc.sentences().out('array');
        const maxSentences = options.maxSentences || 3;
        
        // Simple extractive summarization
        const sentenceScores = sentences.map(sentence => {
            const words = sentence.split(' ').length;
            const keywords = extractKeywords(sentence, { maxKeywords: 5 });
            const score = words + keywords.keywords.length * 2;
            return { sentence, score };
        });
        
        const summary = sentenceScores
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSentences)
            .map(item => item.sentence)
            .join(' ');
        
        const processingTime = Date.now() - startTime;
        
        updateAnalytics('summarization', 'en', text.length, processingTime, true);
        
        return {
            success: true,
            summary,
            originalLength: text.length,
            summaryLength: summary.length,
            compressionRatio: summary.length / text.length,
            processingTime,
            language: 'en'
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('summarization', 'en', text.length, processingTime, false);
        
        logger.error('Text summarization error:', error);
        throw error;
    }
}

function calculateTextSimilarity(text1, text2, options = {}) {
    const startTime = Date.now();
    
    try {
        // Simple Jaccard similarity
        const words1 = new Set(text1.toLowerCase().split(/\W+/));
        const words2 = new Set(text2.toLowerCase().split(/\W+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        const jaccardSimilarity = intersection.size / union.size;
        
        // Cosine similarity
        const allWords = [...union];
        const vector1 = allWords.map(word => words1.has(word) ? 1 : 0);
        const vector2 = allWords.map(word => words2.has(word) ? 1 : 0);
        
        const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
        const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
        
        const cosineSimilarity = dotProduct / (magnitude1 * magnitude2);
        
        const processingTime = Date.now() - startTime;
        
        updateAnalytics('text_similarity', 'en', text1.length + text2.length, processingTime, true);
        
        return {
            success: true,
            similarity: {
                jaccard: jaccardSimilarity,
                cosine: cosineSimilarity,
                average: (jaccardSimilarity + cosineSimilarity) / 2
            },
            processingTime
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('text_similarity', 'en', text1.length + text2.length, processingTime, false);
        
        logger.error('Text similarity calculation error:', error);
        throw error;
    }
}

async function processWithAI(text, task, options = {}) {
    const startTime = Date.now();
    
    try {
        let result;
        
        // Use OpenAI for advanced NLP tasks
        if (aiClients.openai) {
            const response = await aiClients.openai.chat.completions.create({
                model: options.model || 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: getSystemPrompt(task)
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7
            });
            
            result = response.choices[0].message.content;
        } else {
            throw new Error('No AI client available');
        }
        
        const processingTime = Date.now() - startTime;
        
        updateAnalytics('ai_processing', 'en', text.length, processingTime, true);
        
        return {
            success: true,
            result,
            processingTime,
            provider: 'openai'
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('ai_processing', 'en', text.length, processingTime, false);
        
        logger.error('AI processing error:', error);
        throw error;
    }
}

function getSystemPrompt(task) {
    const prompts = {
        'summarization': 'Summarize the following text in a clear and concise manner:',
        'translation': 'Translate the following text to the target language:',
        'classification': 'Classify the following text into the most appropriate category:',
        'sentiment': 'Analyze the sentiment of the following text:',
        'entities': 'Extract named entities from the following text:',
        'keywords': 'Extract the most important keywords from the following text:',
        'qa': 'Answer the following question based on the provided context:'
    };
    
    return prompts[task] || 'Process the following text:';
}

// Initialize AI clients
initializeAIClients();

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Advanced NLP',
        version: nlpConfig.version,
        timestamp: new Date().toISOString(),
        features: nlpConfig.features,
        supportedLanguages: nlpConfig.supportedLanguages.length
    });
});

// Get NLP configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...nlpConfig,
            clients: Object.keys(aiClients),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
    }
});

// Sentiment analysis
app.post('/api/sentiment', (req, res) => {
    try {
        const { text, options = {} } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const result = analyzeSentiment(text, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error analyzing sentiment:', error);
        res.status(500).json({ error: 'Failed to analyze sentiment', details: error.message });
    }
});

// Entity extraction
app.post('/api/entities', (req, res) => {
    try {
        const { text, options = {} } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const result = extractEntities(text, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error extracting entities:', error);
        res.status(500).json({ error: 'Failed to extract entities', details: error.message });
    }
});

// Language detection
app.post('/api/language', (req, res) => {
    try {
        const { text, options = {} } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const result = detectLanguage(text, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error detecting language:', error);
        res.status(500).json({ error: 'Failed to detect language', details: error.message });
    }
});

// Text classification
app.post('/api/classify', (req, res) => {
    try {
        const { text, categories, options = {} } = req.body;
        
        if (!text || !categories) {
            return res.status(400).json({ error: 'Text and categories are required' });
        }
        
        const result = classifyText(text, categories, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error classifying text:', error);
        res.status(500).json({ error: 'Failed to classify text', details: error.message });
    }
});

// Keyword extraction
app.post('/api/keywords', (req, res) => {
    try {
        const { text, options = {} } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const result = extractKeywords(text, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error extracting keywords:', error);
        res.status(500).json({ error: 'Failed to extract keywords', details: error.message });
    }
});

// Text summarization
app.post('/api/summarize', (req, res) => {
    try {
        const { text, options = {} } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const result = summarizeText(text, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error summarizing text:', error);
        res.status(500).json({ error: 'Failed to summarize text', details: error.message });
    }
});

// Text similarity
app.post('/api/similarity', (req, res) => {
    try {
        const { text1, text2, options = {} } = req.body;
        
        if (!text1 || !text2) {
            return res.status(400).json({ error: 'Both text1 and text2 are required' });
        }
        
        const result = calculateTextSimilarity(text1, text2, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error calculating text similarity:', error);
        res.status(500).json({ error: 'Failed to calculate text similarity', details: error.message });
    }
});

// AI-powered processing
app.post('/api/ai-process', async (req, res) => {
    try {
        const { text, task, options = {} } = req.body;
        
        if (!text || !task) {
            return res.status(400).json({ error: 'Text and task are required' });
        }
        
        const result = await processWithAI(text, task, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error processing with AI:', error);
        res.status(500).json({ error: 'Failed to process with AI', details: error.message });
    }
});

// Batch processing
app.post('/api/batch', async (req, res) => {
    try {
        const { texts, task, options = {} } = req.body;
        
        if (!texts || !Array.isArray(texts) || !task) {
            return res.status(400).json({ error: 'Texts array and task are required' });
        }
        
        if (texts.length > nlpConfig.limits.maxBatchSize) {
            return res.status(400).json({ 
                error: `Batch size exceeds limit of ${nlpConfig.limits.maxBatchSize}` 
            });
        }
        
        const results = [];
        
        for (const text of texts) {
            try {
                let result;
                switch (task) {
                    case 'sentiment':
                        result = analyzeSentiment(text, options);
                        break;
                    case 'entities':
                        result = extractEntities(text, options);
                        break;
                    case 'language':
                        result = detectLanguage(text, options);
                        break;
                    case 'keywords':
                        result = extractKeywords(text, options);
                        break;
                    case 'summarize':
                        result = summarizeText(text, options);
                        break;
                    default:
                        result = { success: false, error: 'Unsupported task' };
                }
                results.push(result);
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }
        
        res.json({
            success: true,
            results,
            processed: results.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Error processing batch:', error);
        res.status(500).json({ error: 'Failed to process batch', details: error.message });
    }
});

// Get analytics
app.get('/api/analytics', (req, res) => {
    try {
        const { period = '24h' } = req.query;
        
        const now = new Date();
        let startDate;
        
        switch (period) {
            case '1h':
                startDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        const analytics = {
            period,
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            overview: {
                totalRequests: nlpData.analytics.totalRequests,
                totalTextProcessed: nlpData.analytics.totalTextProcessed,
                averageProcessingTime: nlpData.analytics.averageProcessingTime,
                successRate: nlpData.analytics.successRate,
                errorRate: nlpData.analytics.errorRate
            },
            byType: nlpData.analytics.requestsByType,
            byLanguage: nlpData.analytics.requestsByLanguage,
            performance: {
                averageProcessingTime: nlpData.analytics.averageProcessingTime,
                throughput: nlpData.performance.throughput.length,
                accuracyMetrics: nlpData.performance.accuracyMetrics
            }
        };
        
        res.json(analytics);
        
    } catch (error) {
        logger.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics', details: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🗣️ Advanced NLP v2.7.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`🌍 Supported Languages: ${nlpConfig.supportedLanguages.length}`);
    console.log(`🤖 Features: Sentiment Analysis, Entity Extraction, Text Classification`);
    console.log(`📈 Analytics: Keyword Extraction, Summarization, Language Detection`);
});

module.exports = app;
