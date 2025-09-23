const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import modules
const logger = require('./modules/logger');
const vrManager = require('./modules/vr-manager');
const arManager = require('./modules/ar-manager');
const sceneManager = require('./modules/scene-manager');
const assetManager = require('./modules/asset-manager');
const interactionManager = require('./modules/interaction-manager');
const spatialAudioManager = require('./modules/spatial-audio-manager');
const handTrackingManager = require('./modules/hand-tracking-manager');
const eyeTrackingManager = require('./modules/eye-tracking-manager');

// Import routes
const vrRoutes = require('./routes/vr');
const arRoutes = require('./routes/ar');
const sceneRoutes = require('./routes/scene');
const assetRoutes = require('./routes/asset');
const interactionRoutes = require('./routes/interaction');
const audioRoutes = require('./routes/audio');
const trackingRoutes = require('./routes/tracking');
const healthRoutes = require('./routes/health');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.use('/textures', express.static(path.join(__dirname, 'textures')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Routes
app.use('/api/vr', vrRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/scene', sceneRoutes);
app.use('/api/asset', assetRoutes);
app.use('/api/interaction', interactionRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/health', healthRoutes);

// Serve VR/AR applications
app.get('/vr/:appId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'vr-app.html'));
});

app.get('/ar/:appId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ar-app.html'));
});

app.get('/webxr/:appId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'webxr-app.html'));
});

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // VR session management
  socket.on('vr:join-session', async (data) => {
    try {
      const result = await vrManager.joinSession(socket.id, data);
      socket.emit('vr:session-joined', result);
      socket.broadcast.emit('vr:user-joined', { userId: socket.id, ...result });
    } catch (error) {
      socket.emit('vr:error', { message: error.message });
    }
  });

  socket.on('vr:leave-session', async (data) => {
    try {
      await vrManager.leaveSession(socket.id, data);
      socket.emit('vr:session-left');
      socket.broadcast.emit('vr:user-left', { userId: socket.id });
    } catch (error) {
      socket.emit('vr:error', { message: error.message });
    }
  });

  // AR session management
  socket.on('ar:start-session', async (data) => {
    try {
      const result = await arManager.startSession(socket.id, data);
      socket.emit('ar:session-started', result);
    } catch (error) {
      socket.emit('ar:error', { message: error.message });
    }
  });

  socket.on('ar:stop-session', async (data) => {
    try {
      await arManager.stopSession(socket.id, data);
      socket.emit('ar:session-stopped');
    } catch (error) {
      socket.emit('ar:error', { message: error.message });
    }
  });

  // Scene updates
  socket.on('scene:update', async (data) => {
    try {
      const result = await sceneManager.updateScene(socket.id, data);
      socket.broadcast.emit('scene:updated', result);
    } catch (error) {
      socket.emit('scene:error', { message: error.message });
    }
  });

  // Asset loading
  socket.on('asset:load', async (data) => {
    try {
      const result = await assetManager.loadAsset(socket.id, data);
      socket.emit('asset:loaded', result);
    } catch (error) {
      socket.emit('asset:error', { message: error.message });
    }
  });

  // Interaction events
  socket.on('interaction:trigger', async (data) => {
    try {
      const result = await interactionManager.handleInteraction(socket.id, data);
      socket.emit('interaction:result', result);
      socket.broadcast.emit('interaction:triggered', { userId: socket.id, ...result });
    } catch (error) {
      socket.emit('interaction:error', { message: error.message });
    }
  });

  // Hand tracking
  socket.on('tracking:hand-data', async (data) => {
    try {
      const result = await handTrackingManager.processHandData(socket.id, data);
      socket.broadcast.emit('tracking:hand-updated', { userId: socket.id, ...result });
    } catch (error) {
      socket.emit('tracking:error', { message: error.message });
    }
  });

  // Eye tracking
  socket.on('tracking:eye-data', async (data) => {
    try {
      const result = await eyeTrackingManager.processEyeData(socket.id, data);
      socket.broadcast.emit('tracking:eye-updated', { userId: socket.id, ...result });
    } catch (error) {
      socket.emit('tracking:error', { message: error.message });
    }
  });

  // Spatial audio
  socket.on('audio:spatial-update', async (data) => {
    try {
      const result = await spatialAudioManager.updateSpatialAudio(socket.id, data);
      socket.broadcast.emit('audio:spatial-updated', { userId: socket.id, ...result });
    } catch (error) {
      socket.emit('audio:error', { message: error.message });
    }
  });

  socket.on('disconnect', async () => {
    logger.info(`Client disconnected: ${socket.id}`);
    
    // Clean up sessions
    try {
      await vrManager.leaveSession(socket.id);
      await arManager.stopSession(socket.id);
      await sceneManager.cleanupUser(socket.id);
      await assetManager.cleanupUser(socket.id);
      await interactionManager.cleanupUser(socket.id);
      await handTrackingManager.cleanupUser(socket.id);
      await eyeTrackingManager.cleanupUser(socket.id);
      await spatialAudioManager.cleanupUser(socket.id);
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Initialize services
async function initializeServices() {
  try {
    logger.info('Initializing VR/AR Support v4.0...');
    
    // Initialize VR Manager
    await vrManager.initialize();
    logger.info('VR Manager initialized');
    
    // Initialize AR Manager
    await arManager.initialize();
    logger.info('AR Manager initialized');
    
    // Initialize Scene Manager
    await sceneManager.initialize();
    logger.info('Scene Manager initialized');
    
    // Initialize Asset Manager
    await assetManager.initialize();
    logger.info('Asset Manager initialized');
    
    // Initialize Interaction Manager
    await interactionManager.initialize();
    logger.info('Interaction Manager initialized');
    
    // Initialize Spatial Audio Manager
    await spatialAudioManager.initialize();
    logger.info('Spatial Audio Manager initialized');
    
    // Initialize Hand Tracking Manager
    await handTrackingManager.initialize();
    logger.info('Hand Tracking Manager initialized');
    
    // Initialize Eye Tracking Manager
    await eyeTrackingManager.initialize();
    logger.info('Eye Tracking Manager initialized');
    
    logger.info('All VR/AR services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize VR/AR services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await initializeServices();
  
  server.listen(PORT, () => {
    logger.info(`VR/AR Support v4.0 server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`WebSocket server: ws://localhost:${PORT}`);
    logger.info(`API Documentation: http://localhost:${PORT}/api/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await vrManager.cleanup();
  await arManager.cleanup();
  await sceneManager.cleanup();
  await assetManager.cleanup();
  await interactionManager.cleanup();
  await spatialAudioManager.cleanup();
  await handTrackingManager.cleanup();
  await eyeTrackingManager.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await vrManager.cleanup();
  await arManager.cleanup();
  await sceneManager.cleanup();
  await assetManager.cleanup();
  await interactionManager.cleanup();
  await spatialAudioManager.cleanup();
  await handTrackingManager.cleanup();
  await eyeTrackingManager.cleanup();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = { app, server, io };
