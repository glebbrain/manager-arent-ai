# 🐳 ManagerAgentAI Containerization v2.4

Complete containerization solution for ManagerAgentAI with enhanced monitoring, security, and scalability.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop 4.0+
- Docker Compose 2.0+
- PowerShell 7.0+ (Windows) or Bash (Linux/macOS)

### 1. Build and Start All Services
```powershell
# Build all container images
.\scripts\containerization-manager.ps1 -Action build

# Start all services
.\scripts\containerization-manager.ps1 -Action start

# Check service health
.\scripts\containerization-manager.ps1 -Action health
```

### 2. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| **API Gateway** | http://localhost:3000 | Main API endpoint |
| **Dashboard** | http://localhost:3001 | Real-time dashboard |
| **Event Bus** | http://localhost:4000 | Event management |
| **Project Manager** | http://localhost:3002 | Project management service |
| **AI Planner** | http://localhost:3003 | AI planning service |
| **Workflow Orchestrator** | http://localhost:3004 | Workflow orchestration |
| **Smart Notifications** | http://localhost:3005 | Smart notification service |
| **Template Generator** | http://localhost:3006 | Template generation |
| **Consistency Manager** | http://localhost:3007 | Data consistency management |
| **API Versioning** | http://localhost:3008 | API versioning service |
| **Deadline Prediction** | http://localhost:3009 | Deadline prediction service |
| **Task Distribution** | http://localhost:3010 | Task distribution service |
| **Automatic Status Updates** | http://localhost:3011 | Automatic status updates |
| **Sprint Planning** | http://localhost:3012 | Sprint planning service |
| **Task Dependency Management** | http://localhost:3013 | Task dependency management |
| **Benchmarking** | http://localhost:3014 | Industry benchmarking and performance analysis |
| **Forecasting** | http://localhost:3016 | Advanced forecasting and scenario planning |
| **Interactive Dashboards** | http://localhost:3017 | Interactive dashboards and visualization |
| **Data Export** | http://localhost:3018 | Data export and format conversion |
| **Prometheus** | http://localhost:9090 | Metrics monitoring |
| **Grafana** | http://localhost:3001 | Visualization dashboard |
| **Jaeger** | http://localhost:16686 | Distributed tracing |
| **Elasticsearch** | http://localhost:9200 | Search and analytics |
| **Kibana** | http://localhost:5601 | Log visualization |
| **Redis Commander** | http://localhost:8081 | Redis management |
| **pgAdmin** | http://localhost:8080 | PostgreSQL management |

## 🛠️ Management Commands

### Basic Operations
```powershell
# Build images
.\scripts\containerization-manager.ps1 -Action build

# Start services
.\scripts\containerization-manager.ps1 -Action start

# Stop services
.\scripts\containerization-manager.ps1 -Action stop

# Restart services
.\scripts\containerization-manager.ps1 -Action restart

# Check status
.\scripts\containerization-manager.ps1 -Action status

# View logs
.\scripts\containerization-manager.ps1 -Action logs

# Clean up
.\scripts\containerization-manager.ps1 -Action clean
```

### Advanced Operations
```powershell
# Scale services
.\scripts\containerization-manager.ps1 -Action scale -Service project-manager -Replicas 3

# Health check
.\scripts\containerization-manager.ps1 -Action health

# Backup containers
.\scripts\containerization-manager.ps1 -Action backup

# Restore from backup
.\scripts\containerization-manager.ps1 -Action restore -Service backups/2025-01-31-10-30-00
```

### Service-Specific Operations
```powershell
# Start specific service
.\scripts\containerization-manager.ps1 -Action start -Service api-gateway

# View specific service logs
.\scripts\containerization-manager.ps1 -Action logs -Service api-gateway

# Scale specific service
.\scripts\containerization-manager.ps1 -Action scale -Service ai-planner -Replicas 5
```

## 🏗️ Architecture

### Core Services
- **API Gateway**: Centralized API management and routing
- **Dashboard**: Real-time monitoring and visualization
- **Event Bus**: Event-driven communication system
- **Microservices**: Business logic services (Project Manager, AI Planner, etc.)

### Infrastructure Services
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **Nginx**: Load balancer and reverse proxy

### Monitoring Stack
- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and dashboards
- **Jaeger**: Distributed tracing
- **Elasticsearch**: Log storage and search
- **Kibana**: Log visualization and analysis
- **Logstash**: Log processing and transformation

### Management Tools
- **Redis Commander**: Redis database management
- **pgAdmin**: PostgreSQL database management

## 🔧 Configuration

### Environment Variables
```yaml
# Core services
NODE_ENV: production
LOG_LEVEL: info
PORT: 3000

# Database
DATABASE_URL: postgresql://postgres:password@postgres:5432/manager_agent_ai
REDIS_URL: redis://redis:6379

# Event Bus
EVENT_BUS_URL: http://event-bus:4000

# Security
JWT_SECRET: your-secret-key
```

### Resource Limits
```yaml
# CPU and Memory limits per service
api-gateway:
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
```

## 📊 Monitoring and Observability

### Metrics
- **Application Metrics**: Request rate, response time, error rate
- **System Metrics**: CPU usage, memory usage, disk I/O
- **Database Metrics**: Connection pool, query performance
- **Cache Metrics**: Hit rate, memory usage

### Logging
- **Centralized Logging**: All logs collected in Elasticsearch
- **Structured Logging**: JSON format with consistent fields
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Log Rotation**: Automatic log rotation and cleanup

### Tracing
- **Distributed Tracing**: End-to-end request tracing
- **Service Dependencies**: Visual service dependency map
- **Performance Analysis**: Request timing and bottlenecks

## 🔒 Security Features

### Container Security
- **Non-root Users**: All containers run as non-root
- **Read-only Filesystems**: Immutable container filesystems
- **Resource Limits**: CPU and memory limits
- **Network Isolation**: Custom Docker networks

### Secrets Management
- **Environment Variables**: Sensitive data via environment
- **Volume Mounts**: Configuration files mounted as read-only
- **Network Policies**: Restricted inter-service communication

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Rate Limiting**: API rate limiting
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers

## 📈 Performance Optimization

### Resource Allocation
| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| **API Gateway** | 500m | 1000m | 512Mi | 1Gi |
| **Dashboard** | 250m | 500m | 256Mi | 512Mi |
| **Event Bus** | 500m | 1000m | 512Mi | 1Gi |
| **Project Manager** | 1000m | 2000m | 1Gi | 2Gi |
| **AI Planner** | 2000m | 4000m | 2Gi | 4Gi |

### Scaling Strategies
```powershell
# Horizontal scaling
.\scripts\containerization-manager.ps1 -Action scale -Service project-manager -Replicas 5

# Auto-scaling (Kubernetes)
kubectl autoscale deployment project-manager --cpu-percent=70 --min=2 --max=10
```

### Caching
- **Redis**: Session storage and application caching
- **Nginx**: Static content caching
- **Application**: In-memory caching

## 🚨 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```powershell
# Check logs
.\scripts\containerization-manager.ps1 -Action logs -Service api-gateway

# Check resource usage
docker stats

# Check configuration
docker-compose config
```

#### 2. Service Unreachable
```powershell
# Check network connectivity
docker network ls
docker network inspect manager-agent-ai-network

# Check service discovery
.\scripts\containerization-manager.ps1 -Action status
```

#### 3. High Resource Usage
```powershell
# Check resource usage
docker stats --no-stream

# Scale services
.\scripts\containerization-manager.ps1 -Action scale -Service project-manager -Replicas 3
```

#### 4. Database Connection Issues
```powershell
# Check database status
.\scripts\containerization-manager.ps1 -Action logs -Service postgres

# Check connection string
echo $DATABASE_URL
```

### Debug Commands
```powershell
# Container management
docker ps -a
docker logs <container-name>
docker exec -it <container-name> /bin/sh

# Service health
.\scripts\containerization-manager.ps1 -Action health

# Resource monitoring
docker stats
```

## 🔄 CI/CD Integration

### Docker Build Pipeline
```yaml
# GitHub Actions example
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build images
        run: |
          .\scripts\containerization-manager.ps1 -Action build
      - name: Test containers
        run: |
          .\scripts\containerization-manager.ps1 -Action test
      - name: Deploy
        run: |
          .\scripts\containerization-manager.ps1 -Action start
```

### Kubernetes Deployment
```yaml
# ArgoCD application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: manager-agent-ai
spec:
  source:
    repoURL: https://github.com/your-org/manager-agent-ai
    path: kubernetes
  destination:
    server: https://kubernetes.default.svc
    namespace: manager-agent-ai
```

## 📚 Best Practices

### Container Design
1. **Multi-stage builds** for smaller images
2. **Non-root users** for security
3. **Health checks** for reliability
4. **Resource limits** for stability
5. **Read-only filesystems** when possible

### Orchestration
1. **Service discovery** for dynamic environments
2. **Load balancing** for high availability
3. **Auto-scaling** for performance
4. **Rolling updates** for zero downtime
5. **Monitoring** for observability

### Security
1. **Secrets management** for sensitive data
2. **Network policies** for isolation
3. **Image scanning** for vulnerabilities
4. **Regular updates** for security patches
5. **Access control** for resource management

## 🎉 Success Metrics

### Performance KPIs
- **Startup Time**: < 30 seconds
- **Response Time**: < 100ms
- **Availability**: 99.9%
- **Resource Usage**: < 80% CPU/Memory
- **Error Rate**: < 0.1%

### Operational KPIs
- **Deployment Time**: < 5 minutes
- **Rollback Time**: < 2 minutes
- **Scaling Time**: < 1 minute
- **Recovery Time**: < 5 minutes
- **Monitoring Coverage**: 100%

## 🆘 Support

### Get Help
```powershell
# Comprehensive project check
.\scripts\containerization-manager.ps1 -Action status

# View all available commands
.\scripts\containerization-manager.ps1 -Action help

# Check service health
.\scripts\containerization-manager.ps1 -Action health
```

### Documentation
- **Project Documentation**: `README.md`
- **Containerization Guide**: `CONTAINERIZATION.md`
- **API Documentation**: `api-gateway/README.md`
- **Monitoring Guide**: `monitoring/README.md`

---

**ManagerAgentAI Containerization v2.4** - Complete containerization solution for scalable, maintainable, and secure deployment.
