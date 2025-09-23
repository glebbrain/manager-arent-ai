# 🚀 ManagerAgentAI API Gateway

Centralized API gateway for all ManagerAgentAI services providing unified access, routing, monitoring, and security.

## 🎯 Overview

The API Gateway serves as the single entry point for all ManagerAgentAI services, providing:

- **Unified API Access**: Single endpoint for all services
- **Request Routing**: Intelligent routing to appropriate services
- **Authentication & Authorization**: Centralized security management
- **Rate Limiting**: Protection against abuse and overload
- **Monitoring & Metrics**: Real-time performance monitoring
- **Health Checks**: Service availability monitoring
- **CORS Support**: Cross-origin request handling
- **Load Balancing**: Distribution of requests across services

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│   API Gateway   │───▶│   Services      │
│                 │    │   (Port 3000)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Monitoring    │
                       │   & Metrics     │
                       └─────────────────┘
```

## 🔌 Registered Services

| Service | Port | Description | Endpoints |
|---------|------|-------------|-----------|
| **Project Manager** | 3001 | Project creation and management | `/api/projects`, `/api/templates`, `/api/scan` |
| **AI Planner** | 3002 | AI task planning and prioritization | `/api/tasks`, `/api/plans`, `/api/prioritize` |
| **Workflow Orchestrator** | 3003 | Workflow execution and management | `/api/workflows`, `/api/workflows/*/execute` |
| **Smart Notifications** | 3004 | Notification system | `/api/notifications`, `/api/notifications/*/send` |
| **Template Generator** | 3005 | Template generation and validation | `/api/templates`, `/api/templates/*/generate` |
| **Consistency Manager** | 3006 | Code consistency validation | `/api/consistency/validate`, `/api/consistency/fix` |

## 🚀 Quick Start

### 1. Initialize Gateway
```powershell
# PowerShell
.\scripts\api-gateway.ps1 init

# JavaScript
node scripts\api-gateway.js init
```

### 2. Start Gateway
```powershell
# PowerShell
.\scripts\api-gateway.ps1 start

# JavaScript
node scripts\api-gateway.js start
```

### 3. Check Status
```powershell
# PowerShell
.\scripts\api-gateway.ps1 status

# JavaScript
node scripts\api-gateway.js status
```

## 📋 Commands

### Gateway Management
```powershell
# Initialize gateway
.\scripts\api-gateway.ps1 init

# Start gateway server
.\scripts\api-gateway.ps1 start

# Stop gateway server
.\scripts\api-gateway.ps1 stop

# Show gateway status
.\scripts\api-gateway.ps1 status
```

### Health & Monitoring
```powershell
# Check service health
.\scripts\api-gateway.ps1 health

# Show metrics
.\scripts\api-gateway.ps1 metrics

# Show logs
.\scripts\api-gateway.ps1 logs
```

### Service Management
```powershell
# List registered services
.\scripts\api-gateway.ps1 list

# Route request to service
.\scripts\api-gateway.ps1 route project-manager /api/projects GET

# Register new service
.\scripts\api-gateway.ps1 register my-service '{"name":"My Service","endpoint":"http://localhost:3007"}'

# Unregister service
.\scripts\api-gateway.ps1 unregister my-service
```

## 🔧 Configuration

### Gateway Configuration (`api-gateway/config/gateway.json`)
```json
{
  "port": 3000,
  "host": "localhost",
  "timeout": 30000,
  "retries": 3,
  "rateLimit": {
    "enabled": true,
    "requests": 1000,
    "window": 3600000
  },
  "cors": {
    "enabled": true,
    "origins": ["*"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "headers": ["Content-Type", "Authorization", "X-Requested-With"]
  },
  "auth": {
    "enabled": true,
    "type": "jwt",
    "secret": "manager-agent-ai-secret-key",
    "expiresIn": "24h"
  },
  "logging": {
    "enabled": true,
    "level": "info",
    "file": "api-gateway.log"
  },
  "monitoring": {
    "enabled": true,
    "metrics": true,
    "health": true
  }
}
```

### Service Registry (`api-gateway/config/services.json`)
```json
{
  "project-manager": {
    "name": "Project Manager",
    "endpoint": "http://localhost:3001",
    "health": "/health",
    "routes": [
      { "path": "/api/projects", "methods": ["GET", "POST"] },
      { "path": "/api/projects/*", "methods": ["GET", "PUT", "DELETE"] }
    ],
    "script": "project-manager.ps1"
  }
}
```

## 🌐 API Endpoints

### Gateway Endpoints
- `GET /gateway/status` - Gateway status and information
- `GET /gateway/health` - Health check for all services
- `GET /gateway/metrics` - Gateway metrics and statistics

### Service Endpoints
All service endpoints are automatically routed through the gateway:

```
http://localhost:3000/api/projects          → Project Manager
http://localhost:3000/api/tasks             → AI Planner
http://localhost:3000/api/workflows         → Workflow Orchestrator
http://localhost:3000/api/notifications     → Smart Notifications
http://localhost:3000/api/templates         → Template Generator
http://localhost:3000/api/consistency       → Consistency Manager
```

## 🔒 Security Features

### Authentication
- JWT-based authentication
- Configurable secret key
- Token expiration handling
- Automatic token validation

### Rate Limiting
- Configurable request limits
- Time window-based limiting
- Per-IP rate limiting
- Automatic request blocking

### CORS Support
- Configurable origins
- Method restrictions
- Header validation
- Preflight request handling

## 📊 Monitoring & Metrics

### Real-time Metrics
- Request count and rate
- Error rate and types
- Response times
- Service availability
- Memory usage

### Health Monitoring
- Service health checks
- Automatic failure detection
- Service status reporting
- Uptime tracking

### Logging
- Request/response logging
- Error logging
- Performance logging
- Configurable log levels

## 🔄 Request Flow

1. **Client Request** → API Gateway (Port 3000)
2. **Authentication** → JWT validation (if enabled)
3. **Rate Limiting** → Request rate validation
4. **Routing** → Service identification and routing
5. **Forwarding** → Request forwarded to target service
6. **Response** → Response returned to client
7. **Logging** → Request/response logged
8. **Metrics** → Performance metrics updated

## 🛠️ Development

### Adding New Services
1. Add service configuration to `services.json`
2. Define routes and methods
3. Set health check endpoint
4. Restart gateway to load new service

### Custom Middleware
- Authentication middleware
- Rate limiting middleware
- Logging middleware
- Error handling middleware

### Service Discovery
- Automatic service registration
- Health check integration
- Dynamic service updates
- Service dependency management

## 🚨 Troubleshooting

### Common Issues
1. **Service Unreachable**
   - Check service is running
   - Verify endpoint configuration
   - Check network connectivity

2. **Authentication Errors**
   - Verify JWT secret configuration
   - Check token expiration
   - Validate token format

3. **Rate Limiting**
   - Check rate limit configuration
   - Verify request patterns
   - Adjust limits if needed

4. **CORS Issues**
   - Check CORS configuration
   - Verify allowed origins
   - Check preflight requests

### Debug Commands
```powershell
# Check gateway status
.\scripts\api-gateway.ps1 status

# Check service health
.\scripts\api-gateway.ps1 health

# View logs
.\scripts\api-gateway.ps1 logs

# Show metrics
.\scripts\api-gateway.ps1 metrics
```

## 📈 Performance

### Optimization Features
- Connection pooling
- Request caching
- Response compression
- Load balancing
- Circuit breaker pattern

### Monitoring
- Real-time performance metrics
- Service health monitoring
- Error rate tracking
- Response time analysis

## 🔮 Future Enhancements

- [ ] Service mesh integration
- [ ] Advanced load balancing
- [ ] API versioning support
- [ ] GraphQL gateway support
- [ ] WebSocket support
- [ ] Advanced authentication methods
- [ ] Distributed tracing
- [ ] Auto-scaling support

---

**ManagerAgentAI API Gateway** - Centralized API management for all services
