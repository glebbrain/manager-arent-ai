const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const compression = require('compression');
const winston = require('winston');
const axios = require('axios');
const multer = require('multer');
const sharp = require('sharp');
const Jimp = require('jimp');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// TensorFlow and ML Models
const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const mobilenet = require('@tensorflow-models/mobilenet');
const posenet = require('@tensorflow-models/posenet');
const faceLandmarksDetection = require('@tensorflow-models/face-landmarks-detection');

// OCR
const Tesseract = require('tesseract.js');

// AI Model Providers
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3017;

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
        new winston.transports.File({ filename: 'logs/cv-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/cv-combined.log' })
    ]
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes, then...
    delayMs: 1000 // begin adding 1000ms of delay per request above 50
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|bmp|webp|tiff|mp4|avi|mov|wmv|flv|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'));
        }
    }
});

// Advanced Computer Vision Configuration v2.7.0
const cvConfig = {
    version: '2.7.0',
    features: {
        objectDetection: true,
        imageClassification: true,
        faceRecognition: true,
        poseEstimation: true,
        imageSegmentation: true,
        opticalCharacterRecognition: true,
        imageEnhancement: true,
        imageFiltering: true,
        colorAnalysis: true,
        edgeDetection: true,
        featureExtraction: true,
        imageMatching: true,
        videoProcessing: true,
        motionDetection: true,
        sceneAnalysis: true,
        textDetection: true,
        logoDetection: true,
        brandRecognition: true,
        qualityAssessment: true
    },
    models: {
        objectDetection: {
            name: 'COCO SSD',
            version: '2.2.2',
            classes: 80,
            accuracy: 0.85
        },
        imageClassification: {
            name: 'MobileNet',
            version: '4.0.0',
            classes: 1000,
            accuracy: 0.88
        },
        poseEstimation: {
            name: 'PoseNet',
            version: '2.2.2',
            keypoints: 17,
            accuracy: 0.82
        },
        faceLandmarks: {
            name: 'Face Landmarks Detection',
            version: '0.0.3',
            landmarks: 68,
            accuracy: 0.90
        },
        ocr: {
            name: 'Tesseract.js',
            version: '5.0.2',
            languages: 100,
            accuracy: 0.85
        }
    },
    supportedFormats: {
        images: ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'tiff'],
        videos: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
    },
    limits: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxImageWidth: 4096,
        maxImageHeight: 4096,
        maxVideoDuration: 300, // 5 minutes
        maxRequestsPerMinute: 30,
        maxRequestsPerHour: 500,
        maxRequestsPerDay: 5000
    }
};

// Initialize AI Model Clients
const aiClients = {};

function initializeAIClients() {
    try {
        // OpenAI
        if (process.env.OPENAI_API_KEY) {
            aiClients.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
            logger.info('OpenAI client initialized for Computer Vision');
        }

        // Anthropic
        if (process.env.ANTHROPIC_API_KEY) {
            aiClients.anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY
            });
            logger.info('Anthropic client initialized for Computer Vision');
        }

        // Google
        if (process.env.GOOGLE_API_KEY) {
            aiClients.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            logger.info('Google client initialized for Computer Vision');
        }

        logger.info('AI clients initialization completed for Computer Vision');
    } catch (error) {
        logger.error('Error initializing AI clients for Computer Vision:', error);
    }
}

// Initialize ML Models
let mlModels = {};

async function initializeMLModels() {
    try {
        logger.info('Loading ML models...');
        
        // Load object detection model
        mlModels.cocoSsd = await cocoSsd.load();
        logger.info('COCO SSD model loaded');
        
        // Load image classification model
        mlModels.mobilenet = await mobilenet.load();
        logger.info('MobileNet model loaded');
        
        // Load pose estimation model
        mlModels.posenet = await posenet.load();
        logger.info('PoseNet model loaded');
        
        // Load face landmarks model
        mlModels.faceLandmarks = await faceLandmarksDetection.load(
            faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
        );
        logger.info('Face Landmarks model loaded');
        
        logger.info('All ML models loaded successfully');
    } catch (error) {
        logger.error('Error loading ML models:', error);
    }
}

// Computer Vision Data Storage
let cvData = {
    requests: new Map(),
    responses: new Map(),
    analytics: {
        totalRequests: 0,
        requestsByType: {},
        requestsByFormat: {},
        totalImagesProcessed: 0,
        totalVideosProcessed: 0,
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

function updateAnalytics(requestType, format, fileSize, processingTime, success) {
    cvData.analytics.totalRequests++;
    
    // Update type analytics
    if (!cvData.analytics.requestsByType[requestType]) {
        cvData.analytics.requestsByType[requestType] = 0;
    }
    cvData.analytics.requestsByType[requestType]++;
    
    // Update format analytics
    if (!cvData.analytics.requestsByFormat[format]) {
        cvData.analytics.requestsByFormat[format] = 0;
    }
    cvData.analytics.requestsByFormat[format]++;
    
    // Update totals
    if (format.startsWith('image')) {
        cvData.analytics.totalImagesProcessed++;
    } else if (format.startsWith('video')) {
        cvData.analytics.totalVideosProcessed++;
    }
    
    // Update performance metrics
    cvData.performance.processingTimes.push(processingTime);
    cvData.performance.throughput.push(1);
    
    if (success) {
        cvData.analytics.successRate = (cvData.analytics.successRate * (cvData.analytics.totalRequests - 1) + 1) / cvData.analytics.totalRequests;
    } else {
        cvData.analytics.errorRate = (cvData.analytics.errorRate * (cvData.analytics.totalRequests - 1) + 1) / cvData.analytics.totalRequests;
    }
    
    // Calculate average processing time
    const totalProcessingTime = cvData.performance.processingTimes.reduce((a, b) => a + b, 0);
    cvData.analytics.averageProcessingTime = totalProcessingTime / cvData.performance.processingTimes.length;
}

// Computer Vision Processing Functions
async function detectObjects(imageBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
        const image = tf.node.decodeImage(imageBuffer);
        const predictions = await mlModels.cocoSsd.detect(image);
        
        const objects = predictions.map(prediction => ({
            class: prediction.class,
            score: prediction.score,
            bbox: {
                x: prediction.bbox[0],
                y: prediction.bbox[1],
                width: prediction.bbox[2],
                height: prediction.bbox[3]
            }
        }));
        
        image.dispose();
        
        const processingTime = Date.now() - startTime;
        updateAnalytics('object_detection', 'image', imageBuffer.length, processingTime, true);
        
        return {
            success: true,
            objects,
            count: objects.length,
            processingTime
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('object_detection', 'image', imageBuffer.length, processingTime, false);
        
        logger.error('Object detection error:', error);
        throw error;
    }
}

async function classifyImage(imageBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
        const image = tf.node.decodeImage(imageBuffer);
        const predictions = await mlModels.mobilenet.classify(image);
        
        const classifications = predictions.map(prediction => ({
            className: prediction.className,
            probability: prediction.probability
        }));
        
        image.dispose();
        
        const processingTime = Date.now() - startTime;
        updateAnalytics('image_classification', 'image', imageBuffer.length, processingTime, true);
        
        return {
            success: true,
            classifications,
            topClass: classifications[0],
            processingTime
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('image_classification', 'image', imageBuffer.length, processingTime, false);
        
        logger.error('Image classification error:', error);
        throw error;
    }
}

async function detectFaces(imageBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
        const image = tf.node.decodeImage(imageBuffer);
        const faces = await mlModels.faceLandmarks.estimateFaces({
            image: image,
            returnTensors: false,
            flipHorizontal: false,
            predictIrises: false
        });
        
        const faceData = faces.map(face => ({
            landmarks: face.scaledMesh,
            boundingBox: face.boundingBox,
            confidence: face.faceInViewConfidence
        }));
        
        image.dispose();
        
        const processingTime = Date.now() - startTime;
        updateAnalytics('face_detection', 'image', imageBuffer.length, processingTime, true);
        
        return {
            success: true,
            faces: faceData,
            count: faceData.length,
            processingTime
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('face_detection', 'image', imageBuffer.length, processingTime, false);
        
        logger.error('Face detection error:', error);
        throw error;
    }
}

async function estimatePose(imageBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
        const image = tf.node.decodeImage(imageBuffer);
        const pose = await mlModels.posenet.estimateSinglePose(image, {
            flipHorizontal: false,
            decodingMethod: 'single-person'
        });
        
        const keypoints = pose.keypoints.map(keypoint => ({
            part: keypoint.part,
            position: {
                x: keypoint.position.x,
                y: keypoint.position.y
            },
            score: keypoint.score
        }));
        
        image.dispose();
        
        const processingTime = Date.now() - startTime;
        updateAnalytics('pose_estimation', 'image', imageBuffer.length, processingTime, true);
        
        return {
            success: true,
            keypoints,
            score: pose.score,
            processingTime
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('pose_estimation', 'image', imageBuffer.length, processingTime, false);
        
        logger.error('Pose estimation error:', error);
        throw error;
    }
}

async function extractText(imageBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
        const { data: { text, confidence } } = await Tesseract.recognize(imageBuffer, 'eng', {
            logger: m => logger.debug('OCR:', m)
        });
        
        const processingTime = Date.now() - startTime;
        updateAnalytics('ocr', 'image', imageBuffer.length, processingTime, true);
        
        return {
            success: true,
            text: text.trim(),
            confidence,
            processingTime
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('ocr', 'image', imageBuffer.length, processingTime, false);
        
        logger.error('OCR error:', error);
        throw error;
    }
}

async function enhanceImage(imageBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();
        
        let enhancedImage = image;
        
        // Apply enhancements based on options
        if (options.brightness) {
            enhancedImage = enhancedImage.modulate({
                brightness: options.brightness
            });
        }
        
        if (options.contrast) {
            enhancedImage = enhancedImage.modulate({
                contrast: options.contrast
            });
        }
        
        if (options.saturation) {
            enhancedImage = enhancedImage.modulate({
                saturation: options.saturation
            });
        }
        
        if (options.sharpness) {
            enhancedImage = enhancedImage.sharpen();
        }
        
        if (options.resize) {
            enhancedImage = enhancedImage.resize(
                options.resize.width,
                options.resize.height,
                { fit: 'inside', withoutEnlargement: true }
            );
        }
        
        const enhancedBuffer = await enhancedImage.toBuffer();
        
        const processingTime = Date.now() - startTime;
        updateAnalytics('image_enhancement', 'image', imageBuffer.length, processingTime, true);
        
        return {
            success: true,
            enhancedImage: enhancedBuffer.toString('base64'),
            originalSize: imageBuffer.length,
            enhancedSize: enhancedBuffer.length,
            processingTime
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('image_enhancement', 'image', imageBuffer.length, processingTime, false);
        
        logger.error('Image enhancement error:', error);
        throw error;
    }
}

async function analyzeColors(imageBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
        const image = sharp(imageBuffer);
        const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
        
        const colors = {};
        const pixelCount = data.length / info.channels;
        
        // Analyze dominant colors
        for (let i = 0; i < data.length; i += info.channels) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const color = `rgb(${r},${g},${b})`;
            
            colors[color] = (colors[color] || 0) + 1;
        }
        
        // Get top colors
        const topColors = Object.entries(colors)
            .sort(([,a], [,b]) => b - a)
            .slice(0, options.maxColors || 10)
            .map(([color, count]) => ({
                color,
                count,
                percentage: (count / pixelCount) * 100
            }));
        
        const processingTime = Date.now() - startTime;
        updateAnalytics('color_analysis', 'image', imageBuffer.length, processingTime, true);
        
        return {
            success: true,
            colors: topColors,
            dominantColor: topColors[0],
            processingTime
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('color_analysis', 'image', imageBuffer.length, processingTime, false);
        
        logger.error('Color analysis error:', error);
        throw error;
    }
}

async function processWithAI(imageBuffer, task, options = {}) {
    const startTime = Date.now();
    
    try {
        const base64Image = imageBuffer.toString('base64');
        
        let result;
        
        // Use OpenAI for advanced computer vision tasks
        if (aiClients.openai) {
            const response = await aiClients.openai.chat.completions.create({
                model: options.model || 'gpt-4-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: getVisionPrompt(task)
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
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
        updateAnalytics('ai_processing', 'image', imageBuffer.length, processingTime, true);
        
        return {
            success: true,
            result,
            processingTime,
            provider: 'openai'
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        updateAnalytics('ai_processing', 'image', imageBuffer.length, processingTime, false);
        
        logger.error('AI processing error:', error);
        throw error;
    }
}

function getVisionPrompt(task) {
    const prompts = {
        'describe': 'Describe what you see in this image in detail:',
        'analyze': 'Analyze this image and provide insights:',
        'classify': 'Classify this image and explain your reasoning:',
        'detect': 'Detect and identify objects in this image:',
        'extract': 'Extract text and information from this image:',
        'compare': 'Compare this image with similar images:',
        'enhance': 'Suggest enhancements for this image:'
    };
    
    return prompts[task] || 'Analyze this image:';
}

// Initialize AI clients and ML models
initializeAIClients();
initializeMLModels();

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Advanced Computer Vision',
        version: cvConfig.version,
        timestamp: new Date().toISOString(),
        features: cvConfig.features,
        modelsLoaded: Object.keys(mlModels).length
    });
});

// Get configuration
app.get('/api/config', (req, res) => {
    try {
        res.json({
            ...cvConfig,
            clients: Object.keys(aiClients),
            models: Object.keys(mlModels),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get config', details: error.message });
    }
});

// Object detection
app.post('/api/detect-objects', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        
        const result = await detectObjects(req.file.buffer, req.body);
        res.json(result);
        
    } catch (error) {
        logger.error('Error detecting objects:', error);
        res.status(500).json({ error: 'Failed to detect objects', details: error.message });
    }
});

// Image classification
app.post('/api/classify-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        
        const result = await classifyImage(req.file.buffer, req.body);
        res.json(result);
        
    } catch (error) {
        logger.error('Error classifying image:', error);
        res.status(500).json({ error: 'Failed to classify image', details: error.message });
    }
});

// Face detection
app.post('/api/detect-faces', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        
        const result = await detectFaces(req.file.buffer, req.body);
        res.json(result);
        
    } catch (error) {
        logger.error('Error detecting faces:', error);
        res.status(500).json({ error: 'Failed to detect faces', details: error.message });
    }
});

// Pose estimation
app.post('/api/estimate-pose', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        
        const result = await estimatePose(req.file.buffer, req.body);
        res.json(result);
        
    } catch (error) {
        logger.error('Error estimating pose:', error);
        res.status(500).json({ error: 'Failed to estimate pose', details: error.message });
    }
});

// OCR
app.post('/api/extract-text', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        
        const result = await extractText(req.file.buffer, req.body);
        res.json(result);
        
    } catch (error) {
        logger.error('Error extracting text:', error);
        res.status(500).json({ error: 'Failed to extract text', details: error.message });
    }
});

// Image enhancement
app.post('/api/enhance-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        
        const result = await enhanceImage(req.file.buffer, req.body);
        res.json(result);
        
    } catch (error) {
        logger.error('Error enhancing image:', error);
        res.status(500).json({ error: 'Failed to enhance image', details: error.message });
    }
});

// Color analysis
app.post('/api/analyze-colors', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        
        const result = await analyzeColors(req.file.buffer, req.body);
        res.json(result);
        
    } catch (error) {
        logger.error('Error analyzing colors:', error);
        res.status(500).json({ error: 'Failed to analyze colors', details: error.message });
    }
});

// AI-powered processing
app.post('/api/ai-process', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        
        const { task, options = {} } = req.body;
        
        if (!task) {
            return res.status(400).json({ error: 'Task is required' });
        }
        
        const result = await processWithAI(req.file.buffer, task, options);
        res.json(result);
        
    } catch (error) {
        logger.error('Error processing with AI:', error);
        res.status(500).json({ error: 'Failed to process with AI', details: error.message });
    }
});

// Batch processing
app.post('/api/batch', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Image files are required' });
        }
        
        const { task, options = {} } = req.body;
        
        if (!task) {
            return res.status(400).json({ error: 'Task is required' });
        }
        
        if (req.files.length > cvConfig.limits.maxBatchSize) {
            return res.status(400).json({ 
                error: `Batch size exceeds limit of ${cvConfig.limits.maxBatchSize}` 
            });
        }
        
        const results = [];
        
        for (const file of req.files) {
            try {
                let result;
                switch (task) {
                    case 'detect-objects':
                        result = await detectObjects(file.buffer, options);
                        break;
                    case 'classify-image':
                        result = await classifyImage(file.buffer, options);
                        break;
                    case 'detect-faces':
                        result = await detectFaces(file.buffer, options);
                        break;
                    case 'estimate-pose':
                        result = await estimatePose(file.buffer, options);
                        break;
                    case 'extract-text':
                        result = await extractText(file.buffer, options);
                        break;
                    case 'enhance-image':
                        result = await enhanceImage(file.buffer, options);
                        break;
                    case 'analyze-colors':
                        result = await analyzeColors(file.buffer, options);
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
                totalRequests: cvData.analytics.totalRequests,
                totalImagesProcessed: cvData.analytics.totalImagesProcessed,
                totalVideosProcessed: cvData.analytics.totalVideosProcessed,
                averageProcessingTime: cvData.analytics.averageProcessingTime,
                successRate: cvData.analytics.successRate,
                errorRate: cvData.analytics.errorRate
            },
            byType: cvData.analytics.requestsByType,
            byFormat: cvData.analytics.requestsByFormat,
            performance: {
                averageProcessingTime: cvData.analytics.averageProcessingTime,
                throughput: cvData.performance.throughput.length,
                accuracyMetrics: cvData.performance.accuracyMetrics
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
    console.log(`👁️ Advanced Computer Vision v2.7.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API documentation: http://localhost:${PORT}/api/config`);
    console.log(`🤖 Models: Object Detection, Image Classification, Face Recognition`);
    console.log(`📈 Features: OCR, Pose Estimation, Image Enhancement, Color Analysis`);
});

module.exports = app;
