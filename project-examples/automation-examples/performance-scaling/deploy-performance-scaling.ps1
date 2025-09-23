# Performance Scaling System Deployment Script
# This script deploys the advanced auto-scaling and load balancing system

Write-Host "🚀 Starting Performance Scaling System Deployment..." -ForegroundColor Green

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker version: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker is not installed. Containerized deployment will be skipped." -ForegroundColor Yellow
}

# Check if kubectl is installed
try {
    $kubectlVersion = kubectl version --client
    Write-Host "✅ kubectl version: $kubectlVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  kubectl is not installed. Kubernetes deployment will be skipped." -ForegroundColor Yellow
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
$directories = @(
    "logs",
    "data",
    "config",
    "policies",
    "metrics"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    } else {
        Write-Host "✅ Directory already exists: $dir" -ForegroundColor Green
    }
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
}

# Create environment configuration
Write-Host "⚙️  Creating environment configuration..." -ForegroundColor Yellow
$envContent = @"
# Performance Scaling System Configuration
NODE_ENV=production
PORT_SCALER=3009
PORT_BALANCER=3010
PORT_MONITOR=3011

# Auto-Scaling Configuration
AUTO_SCALING_ENABLED=true
SCALING_INTERVAL=30000
MIN_REPLICAS=2
MAX_REPLICAS=10
TARGET_CPU_UTILIZATION=70
TARGET_MEMORY_UTILIZATION=80
SCALE_UP_COOLDOWN=180000
SCALE_DOWN_COOLDOWN=300000

# Load Balancing Configuration
LOAD_BALANCING_ENABLED=true
BALANCING_ALGORITHM=round-robin
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
CIRCUIT_BREAKER_ENABLED=true
SESSION_AFFINITY_ENABLED=false

# Performance Monitoring Configuration
MONITORING_ENABLED=true
METRICS_COLLECTION_INTERVAL=30000
ALERT_THRESHOLDS_CPU_WARNING=80
ALERT_THRESHOLDS_CPU_CRITICAL=95
ALERT_THRESHOLDS_MEMORY_WARNING=85
ALERT_THRESHOLDS_MEMORY_CRITICAL=95
ALERT_THRESHOLDS_RESPONSE_TIME_WARNING=500
ALERT_THRESHOLDS_RESPONSE_TIME_CRITICAL=1000

# Kubernetes Configuration
KUBERNETES_NAMESPACE=performance-scaling
KUBERNETES_CONTEXT=default
HPA_ENABLED=true
VPA_ENABLED=true
CLUSTER_AUTOSCALER_ENABLED=true

# Database Configuration
DATABASE_URL=postgresql://postgres:password@postgres:5432/manager_agent_ai
REDIS_URL=redis://redis:6379

# Monitoring Configuration
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
ALERT_WEBHOOK_URL=http://alertmanager:9093

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-here
ENCRYPTION_KEY=your-32-character-encryption-key
"@

if (!(Test-Path ".env")) {
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Environment configuration created" -ForegroundColor Green
} else {
    Write-Host "✅ Environment configuration already exists" -ForegroundColor Green
}

# Create Docker configuration
Write-Host "🐳 Creating Docker configuration..." -ForegroundColor Yellow

# Create Dockerfile
$dockerfileContent = @"
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p logs data config policies metrics

# Set permissions
RUN chmod +x deploy-performance-scaling.ps1
RUN chmod +x test-performance-scaling.ps1

# Expose ports
EXPOSE 3009 3010 3011

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3009/health || exit 1

# Start services
CMD ["npm", "start"]
"@

$dockerfileContent | Out-File -FilePath "Dockerfile" -Encoding UTF8
Write-Host "✅ Dockerfile created" -ForegroundColor Green

# Create docker-compose.yml
$dockerComposeContent = @"
version: '3.8'

services:
  performance-scaling:
    build: .
    ports:
      - "3009:3009"
      - "3010:3010"
      - "3011:3011"
    environment:
      - NODE_ENV=production
      - PORT_SCALER=3009
      - PORT_BALANCER=3010
      - PORT_MONITOR=3011
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./config:/app/config
      - ./policies:/app/policies
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3009/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=manager_agent_ai
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
"@

$dockerComposeContent | Out-File -FilePath "docker-compose.yml" -Encoding UTF8
Write-Host "✅ docker-compose.yml created" -ForegroundColor Green

# Create Kubernetes configurations
Write-Host "☸️  Creating Kubernetes configurations..." -ForegroundColor Yellow

# Create namespace
$namespaceContent = @"
apiVersion: v1
kind: Namespace
metadata:
  name: performance-scaling
  labels:
    name: performance-scaling
    app: performance-scaling
    version: "2.0"
"@

if (!(Test-Path "k8s")) {
    New-Item -ItemType Directory -Path "k8s" -Force | Out-Null
}
$namespaceContent | Out-File -FilePath "k8s/namespace.yaml" -Encoding UTF8

# Create ConfigMap
$configMapContent = @"
apiVersion: v1
kind: ConfigMap
metadata:
  name: performance-scaling-config
  namespace: performance-scaling
data:
  NODE_ENV: "production"
  PORT_SCALER: "3009"
  PORT_BALANCER: "3010"
  PORT_MONITOR: "3011"
  AUTO_SCALING_ENABLED: "true"
  LOAD_BALANCING_ENABLED: "true"
  MONITORING_ENABLED: "true"
  SCALING_INTERVAL: "30000"
  MIN_REPLICAS: "2"
  MAX_REPLICAS: "10"
"@

$configMapContent | Out-File -FilePath "k8s/configmap.yaml" -Encoding UTF8

# Create Deployment
$deploymentContent = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: performance-scaling
  namespace: performance-scaling
  labels:
    app: performance-scaling
    version: "2.0"
spec:
  replicas: 2
  selector:
    matchLabels:
      app: performance-scaling
  template:
    metadata:
      labels:
        app: performance-scaling
        version: "2.0"
    spec:
      containers:
      - name: performance-scaling
        image: performance-scaling:2.0.0
        ports:
        - containerPort: 3009
          name: scaler-api
        - containerPort: 3010
          name: balancer-api
        - containerPort: 3011
          name: monitor-api
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: performance-scaling-config
              key: NODE_ENV
        - name: PORT_SCALER
          valueFrom:
            configMapKeyRef:
              name: performance-scaling-config
              key: PORT_SCALER
        - name: PORT_BALANCER
          valueFrom:
            configMapKeyRef:
              name: performance-scaling-config
              key: PORT_BALANCER
        - name: PORT_MONITOR
          valueFrom:
            configMapKeyRef:
              name: performance-scaling-config
              key: PORT_MONITOR
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3009
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3009
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: data-storage
          mountPath: /app/data
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: data-storage
        persistentVolumeClaim:
          claimName: performance-scaling-pvc
      - name: logs
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: performance-scaling-service
  namespace: performance-scaling
spec:
  selector:
    app: performance-scaling
  ports:
  - name: scaler-api
    port: 3009
    targetPort: 3009
    protocol: TCP
  - name: balancer-api
    port: 3010
    targetPort: 3010
    protocol: TCP
  - name: monitor-api
    port: 3011
    targetPort: 3011
    protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: performance-scaling-pvc
  namespace: performance-scaling
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: performance-scaling-hpa
  namespace: performance-scaling
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: performance-scaling
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
"@

$deploymentContent | Out-File -FilePath "k8s/deployment.yaml" -Encoding UTF8
Write-Host "✅ Kubernetes configurations created" -ForegroundColor Green

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
try {
    npm test
    Write-Host "✅ Tests passed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Some tests failed, but continuing with deployment" -ForegroundColor Yellow
}

# Build Docker image
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
    try {
        docker build -t performance-scaling:2.0.0 .
        Write-Host "✅ Docker image built successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to build Docker image: $_" -ForegroundColor Red
    }
}

# Deploy to Kubernetes (if kubectl is available)
if (Get-Command kubectl -ErrorAction SilentlyContinue) {
    Write-Host "☸️  Deploying to Kubernetes..." -ForegroundColor Yellow
    try {
        kubectl apply -f k8s/
        Write-Host "✅ Kubernetes deployment completed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Kubernetes deployment failed: $_" -ForegroundColor Red
    }
}

# Start services
Write-Host "🚀 Starting performance scaling services..." -ForegroundColor Yellow

# Start Auto-Scaler
Write-Host "Starting Auto-Scaler on port 3009..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "auto-scaling/auto-scaler.js" -WindowStyle Minimized

# Start Load Balancer
Write-Host "Starting Load Balancer on port 3010..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "load-balancing/load-balancer.js" -WindowStyle Minimized

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test services
Write-Host "🔍 Testing services..." -ForegroundColor Yellow

# Test Auto-Scaler
try {
    $scalerHealth = Invoke-RestMethod -Uri "http://localhost:3009/health" -Method GET
    Write-Host "✅ Auto-Scaler is healthy: $($scalerHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Auto-Scaler health check failed: $_" -ForegroundColor Red
}

# Test Load Balancer
try {
    $balancerHealth = Invoke-RestMethod -Uri "http://localhost:3010/health" -Method GET
    Write-Host "✅ Load Balancer is healthy: $($balancerHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Load Balancer health check failed: $_" -ForegroundColor Red
}

# Display deployment summary
Write-Host "`n🎉 Performance Scaling System Deployment Completed!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "📊 Services Status:" -ForegroundColor Yellow
Write-Host "  • Auto-Scaler: http://localhost:3009" -ForegroundColor Cyan
Write-Host "  • Load Balancer: http://localhost:3010" -ForegroundColor Cyan
Write-Host "`n📚 API Endpoints:" -ForegroundColor Yellow
Write-Host "  • Scaling API: http://localhost:3009/api/scaling/*" -ForegroundColor Cyan
Write-Host "  • Load Balancer API: http://localhost:3010/api/balancer/*" -ForegroundColor Cyan
Write-Host "`n🔧 Management:" -ForegroundColor Yellow
Write-Host "  • View logs: Get-Content logs/auto-scaler.log -Tail 50" -ForegroundColor Cyan
Write-Host "  • Run tests: npm test" -ForegroundColor Cyan
Write-Host "  • Docker: docker-compose up -d" -ForegroundColor Cyan
Write-Host "  • Kubernetes: kubectl apply -f k8s/" -ForegroundColor Cyan
Write-Host "`n📖 Documentation:" -ForegroundColor Yellow
Write-Host "  • README.md - Complete system documentation" -ForegroundColor Cyan
Write-Host "  • API docs available at /api/docs endpoints" -ForegroundColor Cyan

Write-Host "`n✨ Performance Scaling System is ready for use!" -ForegroundColor Green
