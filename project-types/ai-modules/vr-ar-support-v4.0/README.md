# VR/AR Support v4.0

## Overview

The VR/AR Support v4.0 module provides comprehensive Virtual and Augmented Reality functionality for the ManagerAgentAI system. This module includes support for VR sessions, AR experiences, 3D scene management, asset handling, interaction systems, spatial audio, hand tracking, and eye tracking.

## Features

### 🥽 Virtual Reality (VR)
- Multi-user VR session management
- Real-time user tracking and positioning
- VR device registration and management
- Session settings and configuration
- User avatar management

### 🔍 Augmented Reality (AR)
- AR session management
- Plane detection and anchoring
- Object placement and tracking
- Real-time AR object manipulation
- AR environment configuration

### 🎬 3D Scene Management
- Scene creation and editing
- 3D object management
- Lighting and camera systems
- Material and texture management
- Physics simulation support

### 📦 Asset Management
- 3D model loading and optimization
- Texture and material handling
- Audio and video asset support
- Asset categorization and tagging
- Asset streaming and compression

### 🎮 Interaction Systems
- Multi-modal interaction handling
- Gesture recognition and recording
- Haptic feedback systems
- Voice command processing
- Real-time interaction tracking

### 🔊 Spatial Audio
- 3D positional audio
- Audio source management
- Environmental audio effects
- Real-time audio processing
- Audio listener positioning

### ✋ Hand Tracking
- Real-time hand pose detection
- Gesture recognition (thumbs up, peace sign, fist, etc.)
- Hand calibration and customization
- Multi-hand tracking support
- Gesture library management

### 👁️ Eye Tracking
- Gaze point tracking
- Fixation and saccade detection
- Eye calibration systems
- Gaze heatmap generation
- Attention analysis

## Installation

```bash
npm install
```

## Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **morgan**: HTTP request logger
- **socket.io**: Real-time communication
- **three**: 3D graphics library
- **aframe**: WebVR framework
- **webxr-polyfill**: WebXR compatibility
- **multer**: File upload handling
- **uuid**: Unique identifier generation
- **ws**: WebSocket support

## Configuration

Create a `.env` file in the module directory:

```env
# Server Configuration
PORT=3004
NODE_ENV=development

# VR/AR Configuration
VR_ENABLED=true
AR_ENABLED=true
HAND_TRACKING_ENABLED=true
EYE_TRACKING_ENABLED=true
SPATIAL_AUDIO_ENABLED=true

# Performance Settings
MAX_USERS_PER_SESSION=10
MAX_ASSET_SIZE=100MB
TRACKING_UPDATE_RATE=60
AUDIO_BUFFER_SIZE=4096

# Security
CORS_ORIGIN=*
CONTENT_SECURITY_POLICY=true
```

## API Endpoints

### VR Management
- `POST /api/vr/session` - Create VR session
- `POST /api/vr/session/:sessionId/join` - Join VR session
- `POST /api/vr/session/:sessionId/leave` - Leave VR session
- `GET /api/vr/session/:sessionId` - Get session info
- `GET /api/vr/sessions` - List VR sessions
- `PUT /api/vr/session/:sessionId/settings` - Update session settings
- `POST /api/vr/device/register` - Register VR device
- `GET /api/vr/devices` - List VR devices

### AR Management
- `POST /api/ar/session` - Start AR session
- `POST /api/ar/session/:sessionId/stop` - Stop AR session
- `POST /api/ar/anchor` - Create AR anchor
- `PUT /api/ar/anchor/:anchorId` - Update AR anchor
- `DELETE /api/ar/anchor/:anchorId` - Delete AR anchor
- `POST /api/ar/plane/detect` - Detect AR planes
- `POST /api/ar/object/place` - Place AR object
- `PUT /api/ar/object/:objectId` - Update AR object
- `DELETE /api/ar/object/:objectId` - Remove AR object
- `GET /api/ar/session/:sessionId/objects` - Get session objects
- `GET /api/ar/session/:sessionId/anchors` - Get session anchors

### Scene Management
- `POST /api/scene` - Create 3D scene
- `GET /api/scene/:sceneId` - Get scene info
- `PUT /api/scene/:sceneId` - Update scene
- `GET /api/scene/:sceneId/objects` - Get scene objects
- `GET /api/scene/:sceneId/lights` - Get scene lights
- `POST /api/scene/:sceneId/object` - Add object to scene
- `PUT /api/scene/object/:objectId` - Update scene object
- `DELETE /api/scene/object/:objectId` - Remove scene object
- `POST /api/scene/:sceneId/light` - Add light to scene
- `POST /api/scene/:sceneId/camera` - Add camera to scene
- `POST /api/scene/material` - Create material
- `GET /api/scenes` - List scenes

### Asset Management
- `POST /api/asset/load` - Load asset
- `GET /api/asset/:assetId` - Get asset info
- `PUT /api/asset/:assetId` - Update asset
- `DELETE /api/asset/:assetId` - Delete asset
- `GET /api/asset/search?q=query` - Search assets
- `GET /api/asset/category/:category` - Get assets by category
- `GET /api/asset/type/:type` - Get assets by type
- `GET /api/asset/user/:userId` - Get user assets
- `POST /api/asset/category` - Create category
- `GET /api/asset/categories` - Get categories
- `GET /api/asset/stats` - Get asset statistics

### Interaction Management
- `POST /api/interaction/handle` - Handle interaction
- `POST /api/interaction/gesture/record` - Record gesture
- `POST /api/interaction/haptic/trigger` - Trigger haptic feedback
- `GET /api/interaction/history/:userId` - Get interaction history
- `GET /api/interaction/gestures/:userId` - Get gesture library
- `GET /api/interaction/haptics/:userId` - Get haptic history

### Spatial Audio
- `POST /api/audio/source` - Create audio source
- `PUT /api/audio/source/:sourceId` - Update audio source
- `POST /api/audio/source/:sourceId/play` - Play audio
- `POST /api/audio/source/:sourceId/pause` - Pause audio
- `POST /api/audio/source/:sourceId/stop` - Stop audio
- `POST /api/audio/listener` - Create audio listener
- `PUT /api/audio/listener/:listenerId` - Update listener
- `POST /api/audio/environment` - Create audio environment
- `POST /api/audio/effect` - Add audio effect
- `GET /api/audio/sources/:userId` - Get user audio sources
- `POST /api/audio/spatial/calculate` - Calculate spatial audio

### Hand Tracking
- `POST /api/tracking/hand/process` - Process hand data
- `POST /api/tracking/hand/gesture/record` - Record hand gesture
- `POST /api/tracking/hand/calibrate` - Calibrate hand tracking
- `GET /api/tracking/hand/data/:userId` - Get hand tracking data
- `GET /api/tracking/hand/gestures/:userId` - Get hand gestures
- `GET /api/tracking/hand/calibrations/:userId` - Get hand calibrations

### Eye Tracking
- `POST /api/tracking/eye/process` - Process eye data
- `POST /api/tracking/eye/calibrate` - Calibrate eye tracking
- `GET /api/tracking/eye/data/:userId` - Get eye tracking data
- `GET /api/tracking/eye/fixations/:userId` - Get eye fixations
- `GET /api/tracking/eye/saccades/:userId` - Get eye saccades
- `GET /api/tracking/eye/calibrations/:userId` - Get eye calibrations
- `GET /api/tracking/eye/heatmap/:userId` - Get gaze heatmap

### Health Monitoring
- `GET /api/health/` - Basic health check
- `GET /api/health/detailed` - Detailed health check
- `GET /api/health/vr` - VR service health
- `GET /api/health/ar` - AR service health
- `GET /api/health/tracking` - Tracking service health

## WebSocket Events

### VR Events
- `vr:join-session` - Join VR session
- `vr:leave-session` - Leave VR session
- `vr:user-joined` - User joined session
- `vr:user-left` - User left session

### AR Events
- `ar:start-session` - Start AR session
- `ar:stop-session` - Stop AR session
- `ar:session-started` - AR session started
- `ar:session-stopped` - AR session stopped

### Scene Events
- `scene:update` - Scene updated
- `scene:updated` - Scene update broadcast

### Asset Events
- `asset:load` - Load asset
- `asset:loaded` - Asset loaded
- `asset:error` - Asset loading error

### Interaction Events
- `interaction:trigger` - Interaction triggered
- `interaction:result` - Interaction result
- `interaction:triggered` - Interaction broadcast

### Tracking Events
- `tracking:hand-data` - Hand tracking data
- `tracking:hand-updated` - Hand tracking update
- `tracking:eye-data` - Eye tracking data
- `tracking:eye-updated` - Eye tracking update

### Audio Events
- `audio:spatial-update` - Spatial audio update
- `audio:spatial-updated` - Spatial audio broadcast

## Usage Examples

### Create VR Session

```javascript
// Create VR session
const response = await fetch('http://localhost:3004/api/vr/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My VR Session',
    description: 'A collaborative VR experience',
    maxUsers: 8,
    settings: {
      physics: true,
      audio: true,
      handTracking: true
    }
  })
});

const session = await response.json();
console.log('VR Session created:', session.sessionId);
```

### Join VR Session

```javascript
// Join VR session via WebSocket
const socket = io('http://localhost:3004');

socket.emit('vr:join-session', {
  sessionId: 'session-id',
  userInfo: {
    name: 'User Name',
    avatar: 'avatar-id'
  }
});

socket.on('vr:session-joined', (data) => {
  console.log('Joined VR session:', data);
});
```

### Create AR Session

```javascript
// Start AR session
const response = await fetch('http://localhost:3004/api/ar/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    type: 'world-tracking',
    settings: {
      planeDetection: true,
      lightEstimation: true,
      handTracking: true
    }
  })
});

const session = await response.json();
console.log('AR Session started:', session.sessionId);
```

### Place AR Object

```javascript
// Place AR object
const response = await fetch('http://localhost:3004/api/ar/object/place', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-id',
    anchorId: 'anchor-id',
    assetId: 'asset-id',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  })
});

const object = await response.json();
console.log('AR Object placed:', object.objectId);
```

### Load 3D Asset

```javascript
// Load 3D asset
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('name', 'My 3D Model');
formData.append('type', 'model');
formData.append('category', 'furniture');

const response = await fetch('http://localhost:3004/api/asset/load', {
  method: 'POST',
  body: formData
});

const asset = await response.json();
console.log('Asset loaded:', asset.assetId);
```

### Create Spatial Audio Source

```javascript
// Create spatial audio source
const response = await fetch('http://localhost:3004/api/audio/source', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    name: 'Background Music',
    type: 'positional',
    position: { x: 0, y: 0, z: 0 },
    audioUrl: 'https://example.com/audio.mp3',
    settings: {
      volume: 0.8,
      loop: true,
      maxDistance: 50
    }
  })
});

const audioSource = await response.json();
console.log('Audio source created:', audioSource.sourceId);
```

### Process Hand Tracking

```javascript
// Process hand tracking data via WebSocket
const socket = io('http://localhost:3004');

socket.emit('tracking:hand-data', {
  hand: 'right',
  landmarks: handLandmarks,
  confidence: 0.95,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 }
});

socket.on('tracking:hand-updated', (data) => {
  console.log('Hand tracking updated:', data);
});
```

### Process Eye Tracking

```javascript
// Process eye tracking data via WebSocket
const socket = io('http://localhost:3004');

socket.emit('tracking:eye-data', {
  leftEye: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    pupilSize: 3.5,
    confidence: 0.9
  },
  rightEye: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    pupilSize: 3.5,
    confidence: 0.9
  },
  gazePoint: { x: 0, y: 0, z: 0 },
  confidence: 0.85
});

socket.on('tracking:eye-updated', (data) => {
  console.log('Eye tracking updated:', data);
});
```

## Data Storage

The module stores data in the following locations:
- `data/vr-sessions.json` - VR session data
- `data/vr-users.json` - VR user data
- `data/vr-devices.json` - VR device data
- `data/ar-sessions.json` - AR session data
- `data/ar-anchors.json` - AR anchor data
- `data/ar-planes.json` - AR plane data
- `data/ar-objects.json` - AR object data
- `data/scenes.json` - 3D scene data
- `data/scene-objects.json` - Scene object data
- `data/scene-lights.json` - Scene light data
- `data/scene-cameras.json` - Scene camera data
- `data/materials.json` - Material data
- `data/assets.json` - Asset data
- `data/asset-categories.json` - Asset category data
- `data/interactions.json` - Interaction data
- `data/gestures.json` - Gesture data
- `data/haptics.json` - Haptic data
- `data/audio-sources.json` - Audio source data
- `data/audio-listeners.json` - Audio listener data
- `data/audio-environments.json` - Audio environment data
- `data/audio-effects.json` - Audio effect data
- `data/hand-tracking.json` - Hand tracking data
- `data/hand-gestures.json` - Hand gesture data
- `data/hand-calibrations.json` - Hand calibration data
- `data/eye-tracking.json` - Eye tracking data
- `data/eye-gaze-points.json` - Eye gaze point data
- `data/eye-fixations.json` - Eye fixation data
- `data/eye-saccades.json` - Eye saccade data
- `data/eye-calibrations.json` - Eye calibration data
- `logs/` - Application logs

## Security Considerations

1. **Content Security Policy**: Configured for VR/AR content
2. **File Upload Security**: Limited file types and sizes
3. **WebSocket Security**: CORS and origin validation
4. **Data Privacy**: User tracking data protection
5. **Access Control**: User-specific data isolation

## Performance Optimization

1. **Asset Compression**: Automatic 3D model optimization
2. **LOD Support**: Level-of-detail for 3D objects
3. **Streaming**: Progressive asset loading
4. **Caching**: Asset and scene data caching
5. **Rate Limiting**: API request throttling

## Development

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test
```

## Production Deployment

1. Set up environment variables
2. Configure VR/AR device support
3. Set up asset storage (local or cloud)
4. Configure WebSocket scaling
5. Set up monitoring and logging
6. Deploy with process manager (PM2, Docker, etc.)

## Browser Support

- **WebXR**: Chrome, Edge, Firefox (with polyfill)
- **WebVR**: Chrome, Firefox, Oculus Browser
- **WebGL**: All modern browsers
- **WebRTC**: For hand/eye tracking
- **Web Audio API**: For spatial audio

## License

This module is part of the ManagerAgentAI system and follows the same licensing terms.

## Support

For issues and questions related to this module, please refer to the main ManagerAgentAI documentation or create an issue in the project repository.
