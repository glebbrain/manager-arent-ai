# Advanced Multi-Modal AI Processing v2.9

A comprehensive multi-modal AI processing system that integrates text, image, audio, and video processing capabilities with advanced fusion techniques.

## 🚀 Features

### Text Processing
- **Sentiment Analysis**: Analyze emotional tone (positive, negative, neutral)
- **Text Classification**: Categorize text into predefined categories
- **Keyword Extraction**: Extract key terms and phrases
- **Named Entity Recognition**: Identify persons, organizations, locations, dates, money
- **Text Summarization**: Generate concise summaries
- **Language Detection**: Detect text language with confidence scores
- **Text Translation**: Translate between multiple languages

### Image Processing
- **Object Detection**: Detect and locate objects in images
- **Image Classification**: Classify image content into categories
- **Face Detection**: Detect and analyze human faces
- **OCR (Optical Character Recognition)**: Extract text from images
- **Feature Extraction**: Extract visual features and characteristics
- **Image Enhancement**: Improve image quality and appearance
- **Image Comparison**: Compare similarity between images

### Audio Processing
- **Speech Recognition**: Convert speech to text
- **Audio Classification**: Classify audio content type
- **Music Analysis**: Analyze music characteristics and properties
- **Speaker Identification**: Identify speakers in audio
- **Emotion Detection**: Detect emotional state from speech
- **Feature Extraction**: Extract audio features and characteristics
- **Audio Enhancement**: Improve audio quality

### Video Processing
- **Object Tracking**: Track objects across video frames
- **Scene Detection**: Detect scene changes and segments
- **Motion Detection**: Detect motion and movement
- **Video Classification**: Classify video content type
- **Frame Extraction**: Extract individual frames
- **Video Enhancement**: Improve video quality
- **Audio Extraction**: Extract audio from video files

### Multi-Modal Fusion
- **Early Fusion**: Combine features before processing
- **Late Fusion**: Combine results after processing
- **Attention-based Fusion**: Use attention mechanisms for fusion
- **Cross-modal Understanding**: Understand relationships between modalities
- **Unified Processing**: Process multiple modalities together

## 🛠️ Installation

### Prerequisites
- Node.js 18.0.0 or higher
- FFmpeg (for audio/video processing)
- Python 3.8+ (for some processing tasks)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd advanced-multi-modal-ai-v2.9

# Install dependencies
npm install

# Install FFmpeg (Ubuntu/Debian)
sudo apt update
sudo apt install ffmpeg

# Install FFmpeg (macOS)
brew install ffmpeg

# Install FFmpeg (Windows)
# Download from https://ffmpeg.org/download.html

# Start the server
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3009
```

### Text Processing API

#### Process Text
```http
POST /api/text/process
Content-Type: application/json

{
  "text": "Your text here",
  "operations": ["sentiment", "classification", "keywords"]
}
```

#### Upload Text File
```http
POST /api/text/upload
Content-Type: multipart/form-data

textFile: <file>
operations: ["sentiment", "classification", "keywords"]
```

### Image Processing API

#### Process Image
```http
POST /api/image/process
Content-Type: multipart/form-data

imageFile: <file>
operations: ["classification", "objects", "faces"]
```

#### Generate Thumbnail
```http
POST /api/image/thumbnail
Content-Type: multipart/form-data

imageFile: <file>
width: 200
height: 200
```

### Audio Processing API

#### Process Audio
```http
POST /api/audio/process
Content-Type: multipart/form-data

audioFile: <file>
operations: ["transcription", "classification", "music"]
language: "en"
```

#### Convert Audio Format
```http
POST /api/audio/convert
Content-Type: multipart/form-data

audioFile: <file>
format: "mp3"
sampleRate: 44100
channels: 2
```

### Video Processing API

#### Process Video
```http
POST /api/video/process
Content-Type: multipart/form-data

videoFile: <file>
operations: ["objects", "scenes", "motion"]
```

#### Generate Thumbnail
```http
POST /api/video/thumbnail
Content-Type: multipart/form-data

videoFile: <file>
time: "00:00:01"
width: 320
height: 240
```

### Multi-Modal Processing API

#### Process Multiple Modalities
```http
POST /api/multi-modal/process
Content-Type: multipart/form-data

textFile: <file>
imageFile: <file>
audioFile: <file>
videoFile: <file>
operations: {
  "text": ["sentiment", "classification"],
  "image": ["objects", "faces"],
  "audio": ["transcription", "emotion"],
  "video": ["scenes", "motion"]
}
fusion: "early"
```

#### Process Single Modality
```http
POST /api/multi-modal/process/text
Content-Type: application/json

{
  "text": "Your text here",
  "operations": ["sentiment", "classification"]
}
```

### Health Check API

#### Basic Health Check
```http
GET /api/health
```

#### Detailed Health Check
```http
GET /api/health/detailed
```

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
PORT=3009
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# File Upload Limits
MAX_FILE_SIZE=100MB
MAX_TEXT_SIZE=10MB
MAX_IMAGE_SIZE=10MB
MAX_AUDIO_SIZE=50MB
MAX_VIDEO_SIZE=100MB
```

### Supported File Formats

#### Text
- Plain text (.txt)
- JSON (.json)
- CSV (.csv)

#### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- TIFF (.tiff)

#### Audio
- MP3 (.mp3)
- WAV (.wav)
- FLAC (.flac)
- AAC (.aac)
- OGG (.ogg)
- M4A (.m4a)
- WMA (.wma)

#### Video
- MP4 (.mp4)
- AVI (.avi)
- MOV (.mov)
- MKV (.mkv)
- WebM (.webm)
- FLV (.flv)
- WMV (.wmv)

## 🚀 Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Process text
const textResponse = await axios.post('http://localhost:3009/api/text/process', {
  text: "This is a great product!",
  operations: ["sentiment", "classification", "keywords"]
});

console.log(textResponse.data);

// Process image
const formData = new FormData();
formData.append('imageFile', imageFile);
formData.append('operations', JSON.stringify(['classification', 'objects']));

const imageResponse = await axios.post('http://localhost:3009/api/image/process', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

console.log(imageResponse.data);
```

### Python
```python
import requests

# Process text
text_data = {
    "text": "This is a great product!",
    "operations": ["sentiment", "classification", "keywords"]
}

response = requests.post('http://localhost:3009/api/text/process', json=text_data)
print(response.json())

# Process image
with open('image.jpg', 'rb') as f:
    files = {'imageFile': f}
    data = {'operations': '["classification", "objects"]'}
    response = requests.post('http://localhost:3009/api/image/process', files=files, data=data)
    print(response.json())
```

### cURL
```bash
# Process text
curl -X POST http://localhost:3009/api/text/process \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a great product!", "operations": ["sentiment", "classification"]}'

# Process image
curl -X POST http://localhost:3009/api/image/process \
  -F "imageFile=@image.jpg" \
  -F "operations=[\"classification\", \"objects\"]"
```

## 🔍 Error Handling

The API returns structured error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `MISSING_TEXT`: Text input is required
- `MISSING_IMAGE`: Image file is required
- `MISSING_AUDIO`: Audio file is required
- `MISSING_VIDEO`: Video file is required
- `INVALID_IMAGE`: Invalid image file format
- `INVALID_AUDIO`: Invalid audio file format
- `INVALID_VIDEO`: Invalid video file format
- `FILE_TOO_LARGE`: File size exceeds limit
- `PROCESSING_ERROR`: Processing failed
- `UNSUPPORTED_MODALITY`: Unsupported modality

## 📊 Performance

### Processing Times
- Text processing: < 100ms
- Image processing: 500ms - 2s
- Audio processing: 1s - 5s
- Video processing: 2s - 10s
- Multi-modal processing: 3s - 15s

### Resource Requirements
- RAM: 2GB minimum, 8GB recommended
- CPU: 2 cores minimum, 8 cores recommended
- Storage: 10GB for temporary files
- Network: 100Mbps for file uploads

## 🔒 Security

- Rate limiting: 1000 requests per 15 minutes per IP
- File size limits: Configurable per modality
- CORS protection: Configurable allowed origins
- Input validation: All inputs are validated
- Error handling: Secure error messages

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test
npm test -- --grep "text processing"
```

## 📈 Monitoring

### Health Endpoints
- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system status
- `/api/health/text` - Text processor status
- `/api/health/image` - Image processor status
- `/api/health/audio` - Audio processor status
- `/api/health/video` - Video processor status
- `/api/health/multi-modal` - Multi-modal engine status

### Logging
- All operations are logged
- Logs are stored in `logs/` directory
- Log levels: info, warn, error, debug

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API examples

## 🔄 Version History

### v2.9.0
- Initial release
- Multi-modal AI processing
- Text, image, audio, video processing
- Advanced fusion techniques
- Comprehensive API
- Health monitoring
- Security features

---

**Advanced Multi-Modal AI Processing v2.9** - Empowering AI with multi-modal understanding and processing capabilities.
