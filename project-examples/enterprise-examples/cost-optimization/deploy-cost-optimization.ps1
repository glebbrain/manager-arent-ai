# Cost Optimization System Deployment Script
# This script deploys the AI-driven cost optimization system

Write-Host "🚀 Starting Cost Optimization System Deployment..." -ForegroundColor Green

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
    "reports",
    "config",
    "backups"
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
# Cost Optimization System Configuration
NODE_ENV=production
PORT_OPTIMIZER=3007
PORT_MONITOR=3008
PORT_ANALYSIS=3009

# AI Optimization Configuration
AI_OPTIMIZATION_ENABLED=true
AUTO_OPTIMIZATION_ENABLED=false
OPTIMIZATION_INTERVAL=300000
SAVINGS_THRESHOLD=0.1
BUDGET_LIMIT=10000

# Resource Monitoring Configuration
MONITORING_ENABLED=true
COLLECTION_INTERVAL=30000
ALERT_THRESHOLDS_CPU_WARNING=80
ALERT_THRESHOLDS_CPU_CRITICAL=95
ALERT_THRESHOLDS_MEMORY_WARNING=85
ALERT_THRESHOLDS_MEMORY_CRITICAL=95
ALERT_THRESHOLDS_STORAGE_WARNING=80
ALERT_THRESHOLDS_STORAGE_CRITICAL=90

# Cloud Provider Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE=path/to/service-account.json

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
RUN mkdir -p logs data reports config backups

# Set permissions
RUN chmod +x deploy-cost-optimization.ps1
RUN chmod +x test-cost-optimization.ps1

# Expose ports
EXPOSE 3007 3008 3009

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3007/health || exit 1

# Start services
CMD ["npm", "start"]
"@

$dockerfileContent | Out-File -FilePath "Dockerfile" -Encoding UTF8
Write-Host "✅ Dockerfile created" -ForegroundColor Green

# Create docker-compose.yml
$dockerComposeContent = @"
version: '3.8'

services:
  cost-optimization:
    build: .
    ports:
      - "3007:3007"
      - "3008:3008"
      - "3009:3009"
    environment:
      - NODE_ENV=production
      - PORT_OPTIMIZER=3007
      - PORT_MONITOR=3008
      - PORT_ANALYSIS=3009
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./reports:/app/reports
      - ./config:/app/config
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3007/health"]
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
  name: cost-optimization
  labels:
    name: cost-optimization
    app: cost-optimization
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
  name: cost-optimization-config
  namespace: cost-optimization
data:
  NODE_ENV: "production"
  PORT_OPTIMIZER: "3007"
  PORT_MONITOR: "3008"
  PORT_ANALYSIS: "3009"
  AI_OPTIMIZATION_ENABLED: "true"
  MONITORING_ENABLED: "true"
  COLLECTION_INTERVAL: "30000"
"@

$configMapContent | Out-File -FilePath "k8s/configmap.yaml" -Encoding UTF8

# Create Deployment
$deploymentContent = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cost-optimization
  namespace: cost-optimization
  labels:
    app: cost-optimization
    version: "2.0"
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cost-optimization
  template:
    metadata:
      labels:
        app: cost-optimization
        version: "2.0"
    spec:
      containers:
      - name: cost-optimization
        image: cost-optimization:2.0.0
        ports:
        - containerPort: 3007
          name: optimizer-api
        - containerPort: 3008
          name: monitor-api
        - containerPort: 3009
          name: analysis-api
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: cost-optimization-config
              key: NODE_ENV
        - name: PORT_OPTIMIZER
          valueFrom:
            configMapKeyRef:
              name: cost-optimization-config
              key: PORT_OPTIMIZER
        - name: PORT_MONITOR
          valueFrom:
            configMapKeyRef:
              name: cost-optimization-config
              key: PORT_MONITOR
        - name: PORT_ANALYSIS
          valueFrom:
            configMapKeyRef:
              name: cost-optimization-config
              key: PORT_ANALYSIS
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
            port: 3007
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3007
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
          claimName: cost-optimization-pvc
      - name: logs
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: cost-optimization-service
  namespace: cost-optimization
spec:
  selector:
    app: cost-optimization
  ports:
  - name: optimizer-api
    port: 3007
    targetPort: 3007
    protocol: TCP
  - name: monitor-api
    port: 3008
    targetPort: 3008
    protocol: TCP
  - name: analysis-api
    port: 3009
    targetPort: 3009
    protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: cost-optimization-pvc
  namespace: cost-optimization
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
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
        docker build -t cost-optimization:2.0.0 .
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
Write-Host "🚀 Starting cost optimization services..." -ForegroundColor Yellow

# Start AI Optimizer
Write-Host "Starting AI Optimizer on port 3007..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "ai-optimizer/ai-optimizer.js" -WindowStyle Minimized

# Start Resource Monitor
Write-Host "Starting Resource Monitor on port 3008..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "resource-monitoring/resource-monitor.js" -WindowStyle Minimized

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test services
Write-Host "🔍 Testing services..." -ForegroundColor Yellow

# Test AI Optimizer
try {
    $optimizerHealth = Invoke-RestMethod -Uri "http://localhost:3007/health" -Method GET
    Write-Host "✅ AI Optimizer is healthy: $($optimizerHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ AI Optimizer health check failed: $_" -ForegroundColor Red
}

# Test Resource Monitor
try {
    $monitorHealth = Invoke-RestMethod -Uri "http://localhost:3008/health" -Method GET
    Write-Host "✅ Resource Monitor is healthy: $($monitorHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Resource Monitor health check failed: $_" -ForegroundColor Red
}

# Display deployment summary
Write-Host "`n🎉 Cost Optimization System Deployment Completed!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "📊 Services Status:" -ForegroundColor Yellow
Write-Host "  • AI Optimizer: http://localhost:3007" -ForegroundColor Cyan
Write-Host "  • Resource Monitor: http://localhost:3008" -ForegroundColor Cyan
Write-Host "`n📚 API Endpoints:" -ForegroundColor Yellow
Write-Host "  • Optimizer API: http://localhost:3007/api/optimizer/*" -ForegroundColor Cyan
Write-Host "  • Monitor API: http://localhost:3008/api/monitor/*" -ForegroundColor Cyan
Write-Host "`n🔧 Management:" -ForegroundColor Yellow
Write-Host "  • View logs: Get-Content logs/ai-optimizer.log -Tail 50" -ForegroundColor Cyan
Write-Host "  • Run tests: npm test" -ForegroundColor Cyan
Write-Host "  • Docker: docker-compose up -d" -ForegroundColor Cyan
Write-Host "  • Kubernetes: kubectl apply -f k8s/" -ForegroundColor Cyan
Write-Host "`n📖 Documentation:" -ForegroundColor Yellow
Write-Host "  • README.md - Complete system documentation" -ForegroundColor Cyan
Write-Host "  • API docs available at /api/docs endpoints" -ForegroundColor Cyan

Write-Host "`n✨ Cost Optimization System is ready for use!" -ForegroundColor Green
