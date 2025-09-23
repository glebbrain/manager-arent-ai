# 🐳 ManagerAgentAI Containerization Guide v2.4

Complete containerization implementation for ManagerAgentAI with Docker and Kubernetes support.

## 🎯 Overview

This guide covers the full containerization of all ManagerAgentAI components including:
- **API Gateway** - Centralized API management
- **Dashboard** - Real-time monitoring dashboard
- **Event Bus** - Event-driven communication
- **Microservices** - All business logic services
- **Infrastructure** - PostgreSQL, Redis, Nginx, Monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │───▶│   API Gateway   │───▶│   Microservices │
│   (Nginx)       │    │   (Docker)      │    │   (Docker)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Event Bus     │    │   Monitoring    │
│   (Docker)      │    │   (Docker)      │    │   (Prometheus)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites

```powershell
# Check Docker installation
docker --version
docker-compose --version

# Check Kubernetes (optional)
kubectl version --client
```

### 2. Build and Start

```powershell
# Build all images
.\scripts\containerization-manager.ps1 -Action build

# Start all services
.\scripts\containerization-manager.ps1 -Action start

# Check status
.\scripts\containerization-manager.ps1 -Action status

# Health check
.\scripts\containerization-manager.ps1 -Action health
```

### 3. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| **API Gateway** | http://localhost:3000 | Main API endpoint |
| **Dashboard** | http://localhost:3001 | Real-time dashboard |
| **Event Bus** | http://localhost:4000 | Event management |
| **Prometheus** | http://localhost:9090 | Metrics monitoring |
| **Grafana** | http://localhost:3001 | Visualization dashboard |

## 📋 Container Management

### Docker Compose Commands

```powershell
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d api-gateway

# Scale service
docker-compose up -d --scale project-manager=3

# View logs
docker-compose logs -f api-gateway

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Container Manager Script

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

# Scale service
.\scripts\containerization-manager.ps1 -Action scale -Service project-manager -Replicas 3

# Health check
.\scripts\containerization-manager.ps1 -Action health

# Clean up
.\scripts\containerization-manager.ps1 -Action clean
```

## ☸️ Kubernetes Deployment

### 1. Deploy to Kubernetes

```powershell
# Deploy all services
.\scripts\containerization-manager.ps1 -Action deploy-k8s

# Check deployment status
kubectl get pods -n manager-agent-ai

# Check services
kubectl get services -n manager-agent-ai

# View logs
kubectl logs -f deployment/api-gateway -n manager-agent-ai
```

### 2. Scale Services

```powershell
# Scale API Gateway
kubectl scale deployment api-gateway --replicas=3 -n manager-agent-ai

# Scale Project Manager
kubectl scale deployment project-manager --replicas=5 -n manager-agent-ai
```

### 3. Access Services

```powershell
# Port forward for local access
kubectl port-forward service/api-gateway-service 3000:3000 -n manager-agent-ai
kubectl port-forward service/dashboard-service 3001:3000 -n manager-agent-ai
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `LOG_LEVEL` | Logging level | `info` |
| `PORT` | Service port | `3000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://postgres:password@postgres:5432/manager_agent_ai` |
| `REDIS_URL` | Redis connection | `redis://redis:6379` |
| `EVENT_BUS_URL` | Event bus connection | `http://event-bus:4000` |

### Docker Compose Configuration

```yaml
# Key configuration options
services:
  api-gateway:
    build:
      context: .
      dockerfile: Dockerfile.api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    volumes:
      - ./api-gateway/config:/app/config:ro
    networks:
      - manager-agent-ai-network
    restart: unless-stopped
```

### Kubernetes Configuration

```yaml
# Resource limits and requests
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"

# Health checks
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

## 📊 Monitoring and Observability

### Prometheus Metrics

- **API Gateway**: Request rate, response time, error rate
- **Services**: CPU usage, memory usage, request count
- **Database**: Connection pool, query performance
- **Redis**: Cache hit rate, memory usage

### Grafana Dashboards

- **System Overview**: Overall system health
- **Service Metrics**: Individual service performance
- **Database Metrics**: Database performance
- **Error Tracking**: Error rates and types

### Health Checks

```powershell
# Check all services
.\scripts\containerization-manager.ps1 -Action health

# Check specific service
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:4000/health
```

## 🔒 Security Features

### Container Security

- **Non-root users**: All containers run as non-root
- **Read-only filesystems**: Immutable container filesystems
- **Resource limits**: CPU and memory limits
- **Network isolation**: Custom Docker networks

### Secrets Management

```yaml
# Kubernetes secrets
apiVersion: v1
kind: Secret
metadata:
  name: manager-agent-ai-secrets
data:
  postgres-password: <base64-encoded>
  jwt-secret: <base64-encoded>
  event-bus-token: <base64-encoded>
```

### Network Security

- **TLS encryption**: All inter-service communication
- **Network policies**: Kubernetes network policies
- **Firewall rules**: Restricted port access
- **Rate limiting**: Nginx rate limiting

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
docker-compose up -d --scale project-manager=5

# Kubernetes HPA
kubectl autoscale deployment project-manager --cpu-percent=70 --min=2 --max=10 -n manager-agent-ai
```

### Caching

- **Redis**: Session storage and caching
- **Nginx**: Static content caching
- **Application**: In-memory caching

## 🚨 Troubleshooting

### Common Issues

1. **Container Won't Start**
   ```powershell
   # Check logs
   docker-compose logs api-gateway
   
   # Check resource usage
   docker stats
   
   # Check configuration
   docker-compose config
   ```

2. **Service Unreachable**
   ```powershell
   # Check network connectivity
   docker network ls
   docker network inspect manager-agent-ai-network
   
   # Check service discovery
   docker-compose ps
   ```

3. **High Resource Usage**
   ```powershell
   # Check resource usage
   docker stats --no-stream
   
   # Scale services
   docker-compose up -d --scale project-manager=3
   ```

4. **Database Connection Issues**
   ```powershell
   # Check database status
   docker-compose logs postgres
   
   # Check connection string
   echo $DATABASE_URL
   ```

### Debug Commands

```powershell
# Container management
docker ps -a
docker logs <container-name>
docker exec -it <container-name> /bin/sh

# Kubernetes debugging
kubectl get pods -n manager-agent-ai
kubectl describe pod <pod-name> -n manager-agent-ai
kubectl logs <pod-name> -n manager-agent-ai
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
          docker build -t manager-agent-ai/api-gateway:latest -f Dockerfile.api-gateway .
          docker build -t manager-agent-ai/dashboard:latest -f Dockerfile.dashboard .
      - name: Push to registry
        run: |
          docker push manager-agent-ai/api-gateway:latest
          docker push manager-agent-ai/dashboard:latest
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

---

**ManagerAgentAI Containerization v2.4** - Complete containerization solution for scalable, maintainable, and secure deployment.
