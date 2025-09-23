# 🚀 Enhanced API Gateway v2.9

**Advanced Routing and Load Balancing for Microservices**

## 📋 Overview

Enhanced API Gateway v2.9 is a high-performance, enterprise-grade API gateway that provides advanced routing, load balancing, circuit breaking, and monitoring capabilities for microservices architectures. Built with Node.js and designed for scalability and reliability.

## ✨ Features

### 🔀 Advanced Routing
- **Intelligent Routing**: Path-based, method-based, and parameter-based routing
- **Wildcard Support**: Flexible path matching with wildcards and parameters
- **Route Configuration**: Dynamic route configuration and management
- **Middleware Support**: Custom middleware for request processing
- **Request Transformation**: Request/response transformation capabilities

### ⚖️ Load Balancing
- **Multiple Strategies**: Round-robin, least-connections, weighted, IP-hash, random, least-response-time
- **Health Checks**: Automatic health monitoring and service discovery
- **Circuit Breaker**: Automatic failure detection and recovery
- **Retry Logic**: Configurable retry policies with exponential backoff
- **Service Weights**: Weighted load balancing for different service capacities

### 🔒 Security & Performance
- **Rate Limiting**: Advanced rate limiting with sliding window
- **CORS Support**: Configurable cross-origin resource sharing
- **Helmet.js**: Security headers and protection
- **Compression**: Response compression for better performance
- **Request Validation**: Input validation and sanitization

### 📊 Monitoring & Analytics
- **Real-time Metrics**: Request/response metrics and performance data
- **Health Monitoring**: Service health checks and status monitoring
- **Logging**: Comprehensive logging with Winston
- **Redis Integration**: Optional Redis for caching and session storage
- **Cluster Support**: Multi-process clustering for high availability

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm 8+
- Redis (optional, for caching)

### Installation

1. **Navigate to the gateway directory**
```bash
cd api-gateway-enhanced-v2.9
```

2. **Install dependencies**
```powershell
.\start-gateway.ps1 -Install
```

3. **Start the gateway**
```powershell
.\start-gateway.ps1 -Action start
```

4. **Access the gateway**
The gateway will be available at `http://localhost:3000`

### Development Mode

```powershell
.\start-gateway.ps1 -Dev
```

### Cluster Mode

```powershell
.\start-gateway.ps1 -Cluster -Workers 4
```

## 📊 API Endpoints

### Health Check
```http
GET /health
```
Returns gateway health status and registered services.

### Metrics
```http
GET /metrics
```
Returns detailed performance metrics and statistics.

### Services
```http
GET /services
```
Returns list of registered services and their status.

### Proxy Routes
```http
GET|POST|PUT|DELETE /api/*
```
Proxies requests to appropriate backend services.

## 🔧 Configuration

### Environment Variables
```env
PORT=3000
WORKERS=4
NODE_ENV=production
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Load Balancing Strategies

#### Round Robin
```javascript
{
  loadBalancer: 'round-robin'
}
```

#### Least Connections
```javascript
{
  loadBalancer: 'least-connections'
}
```

#### Weighted Round Robin
```javascript
{
  loadBalancer: 'weighted-round-robin',
  services: [
    { endpoint: 'http://service1:3001', weight: 3 },
    { endpoint: 'http://service2:3001', weight: 1 }
  ]
}
```

#### IP Hash
```javascript
{
  loadBalancer: 'ip-hash'
}
```

#### Random
```javascript
{
  loadBalancer: 'random'
}
```

#### Least Response Time
```javascript
{
  loadBalancer: 'least-response-time'
}
```

## 📈 Usage Examples

### PowerShell Script Usage

```powershell
# Install dependencies
.\start-gateway.ps1 -Install

# Start gateway
.\start-gateway.ps1 -Action start -Port 3000

# Start in cluster mode
.\start-gateway.ps1 -Cluster -Workers 4

# Check status
.\start-gateway.ps1 -Status

# Check health
.\start-gateway.ps1 -Health

# View metrics
.\start-gateway.ps1 -Metrics

# Stop gateway
.\start-gateway.ps1 -Action stop
```

### JavaScript Integration

```javascript
// Register service
gateway.registerService('my-service', {
  endpoint: 'http://localhost:3001',
  health: '/health',
  weight: 1
});

// Add route
gateway.addRoute('/api/users/*', {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  services: [
    { endpoint: 'http://user-service:3001', weight: 2 },
    { endpoint: 'http://user-service-backup:3001', weight: 1 }
  ],
  loadBalancer: 'weighted-round-robin',
  timeout: 30000,
  retries: 3,
  circuitBreaker: true
});
```

## 🏗️ Architecture

### Load Balancer
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │───▶│   API Gateway   │───▶│   Service A     │
│                 │    │   (Load Balancer)│    │   (Weight: 3)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Service B     │
                       │   (Weight: 1)   │
                       └─────────────────┘
```

### Circuit Breaker States
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CLOSED    │───▶│   OPEN      │───▶│ HALF-OPEN   │
│ (Normal)    │    │ (Failing)   │    │ (Testing)   │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🔧 Advanced Features

### Circuit Breaker
- **Failure Threshold**: 5 consecutive failures
- **Timeout**: 60 seconds in open state
- **Half-Open Testing**: Single request to test recovery

### Retry Logic
- **Max Retries**: 3 attempts
- **Retry Delay**: 1000ms initial delay
- **Backoff Multiplier**: 2x exponential backoff

### Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 1000 per IP
- **Slow Down**: 500ms delay after 100 requests

### Health Checks
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Retry**: 3 attempts before marking unhealthy

## 📊 Monitoring

### Metrics Collected
- **Requests**: Total request count
- **Responses**: Total response count
- **Errors**: Total error count
- **Response Time**: Average response time
- **Active Connections**: Current active connections
- **Service Status**: Individual service health

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T10:00:00.000Z",
  "uptime": 3600,
  "version": "2.9.0",
  "services": ["service1", "service2", "service3"]
}
```

### Metrics Response
```json
{
  "requests": 10000,
  "responses": 9950,
  "errors": 50,
  "averageResponseTime": 150.5,
  "activeConnections": 25,
  "services": {
    "service1": { "requests": 5000, "errors": 20 },
    "service2": { "requests": 3000, "errors": 15 },
    "service3": { "requests": 2000, "errors": 15 }
  }
}
```

## 🛠️ Development

### Project Structure
```
api-gateway-enhanced-v2.9/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── start-gateway.ps1      # PowerShell management script
├── logs/                  # Log files
└── README.md              # This file
```

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server
npm run cluster    # Start in cluster mode
npm test           # Run tests
npm run lint       # Lint code
npm run format     # Format code
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: DDoS protection
- **CORS**: Cross-origin request handling
- **Input Validation**: Request validation
- **Error Handling**: Secure error responses

## 📈 Performance

### System Requirements
- **Memory**: 512MB minimum, 1GB recommended
- **CPU**: 1 core minimum, 2+ cores recommended
- **Network**: 100Mbps minimum for high throughput

### Scalability
- **Concurrent Requests**: 10,000+ requests per second
- **Services**: Unlimited service registration
- **Workers**: Auto-scaling based on CPU cores
- **Clustering**: Multi-process support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

**Enhanced API Gateway v2.9**  
**Advanced Routing and Load Balancing for Microservices**

**Version**: 2.9.0  
**Last Updated**: 2025-01-31  
**Status**: Production Ready
