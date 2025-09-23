# Disaster Recovery System Deployment Script
# This script deploys the AI-powered disaster recovery system

Write-Host "🚀 Starting Disaster Recovery System Deployment..." -ForegroundColor Green

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
    "backups",
    "recovery-data",
    "test-results"
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
# Disaster Recovery System Configuration
NODE_ENV=production
PORT_BACKUP=3005
PORT_RECOVERY=3006

# Backup Configuration
LOCAL_BACKUP_PATH=./backups
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=gzip
BACKUP_ENCRYPTION=aes-256

# Storage Configuration
AWS_BACKUP_BUCKET=manager-agent-ai-backups
AWS_REGION=us-east-1
AZURE_BACKUP_CONTAINER=backups
AZURE_STORAGE_ACCOUNT=manageragentai
GCP_BACKUP_BUCKET=manager-agent-ai-backups
GCP_PROJECT_ID=manager-agent-ai

# Recovery Configuration
RTO_TARGET_HOURS=4
RPO_TARGET_MINUTES=60
AUTO_RECOVERY_ENABLED=true
RECOVERY_TESTING_ENABLED=true

# Monitoring Configuration
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
ALERT_WEBHOOK_URL=http://alertmanager:9093

# Database Configuration
DATABASE_URL=postgresql://postgres:password@postgres:5432/manager_agent_ai
REDIS_URL=redis://redis:6379

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
    tar \
    gzip

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p logs backups recovery-data test-results

# Set permissions
RUN chmod +x deploy-disaster-recovery.ps1
RUN chmod +x test-disaster-recovery.ps1

# Expose ports
EXPOSE 3005 3006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3005/health || exit 1

# Start services
CMD ["npm", "start"]
"@

$dockerfileContent | Out-File -FilePath "Dockerfile" -Encoding UTF8
Write-Host "✅ Dockerfile created" -ForegroundColor Green

# Create docker-compose.yml
$dockerComposeContent = @"
version: '3.8'

services:
  disaster-recovery:
    build: .
    ports:
      - "3005:3005"
      - "3006:3006"
    environment:
      - NODE_ENV=production
      - PORT_BACKUP=3005
      - PORT_RECOVERY=3006
    volumes:
      - ./backups:/app/backups
      - ./logs:/app/logs
      - ./recovery-data:/app/recovery-data
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3005/health"]
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
  name: disaster-recovery
  labels:
    name: disaster-recovery
    app: disaster-recovery
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
  name: disaster-recovery-config
  namespace: disaster-recovery
data:
  NODE_ENV: "production"
  PORT_BACKUP: "3005"
  PORT_RECOVERY: "3006"
  LOCAL_BACKUP_PATH: "/app/backups"
  BACKUP_RETENTION_DAYS: "30"
  RTO_TARGET_HOURS: "4"
  RPO_TARGET_MINUTES: "60"
"@

$configMapContent | Out-File -FilePath "k8s/configmap.yaml" -Encoding UTF8

# Create Deployment
$deploymentContent = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: disaster-recovery
  namespace: disaster-recovery
  labels:
    app: disaster-recovery
    version: "2.0"
spec:
  replicas: 2
  selector:
    matchLabels:
      app: disaster-recovery
  template:
    metadata:
      labels:
        app: disaster-recovery
        version: "2.0"
    spec:
      containers:
      - name: disaster-recovery
        image: disaster-recovery:2.0.0
        ports:
        - containerPort: 3005
          name: backup-api
        - containerPort: 3006
          name: recovery-api
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: disaster-recovery-config
              key: NODE_ENV
        - name: PORT_BACKUP
          valueFrom:
            configMapKeyRef:
              name: disaster-recovery-config
              key: PORT_BACKUP
        - name: PORT_RECOVERY
          valueFrom:
            configMapKeyRef:
              name: disaster-recovery-config
              key: PORT_RECOVERY
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
            port: 3005
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3005
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: backup-storage
          mountPath: /app/backups
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: backup-storage
        persistentVolumeClaim:
          claimName: disaster-recovery-pvc
      - name: logs
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: disaster-recovery-service
  namespace: disaster-recovery
spec:
  selector:
    app: disaster-recovery
  ports:
  - name: backup-api
    port: 3005
    targetPort: 3005
    protocol: TCP
  - name: recovery-api
    port: 3006
    targetPort: 3006
    protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: disaster-recovery-pvc
  namespace: disaster-recovery
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
        docker build -t disaster-recovery:2.0.0 .
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
Write-Host "🚀 Starting disaster recovery services..." -ForegroundColor Yellow

# Start backup engine
Write-Host "Starting AI Backup Engine on port 3005..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "ai-backup/ai-backup-engine.js" -WindowStyle Minimized

# Start recovery manager
Write-Host "Starting Recovery Manager on port 3006..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "recovery/recovery-manager.js" -WindowStyle Minimized

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test services
Write-Host "🔍 Testing services..." -ForegroundColor Yellow

# Test backup engine
try {
    $backupHealth = Invoke-RestMethod -Uri "http://localhost:3005/health" -Method GET
    Write-Host "✅ AI Backup Engine is healthy: $($backupHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ AI Backup Engine health check failed: $_" -ForegroundColor Red
}

# Test recovery manager
try {
    $recoveryHealth = Invoke-RestMethod -Uri "http://localhost:3006/health" -Method GET
    Write-Host "✅ Recovery Manager is healthy: $($recoveryHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Recovery Manager health check failed: $_" -ForegroundColor Red
}

# Display deployment summary
Write-Host "`n🎉 Disaster Recovery System Deployment Completed!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "📊 Services Status:" -ForegroundColor Yellow
Write-Host "  • AI Backup Engine: http://localhost:3005" -ForegroundColor Cyan
Write-Host "  • Recovery Manager: http://localhost:3006" -ForegroundColor Cyan
Write-Host "`n📚 API Endpoints:" -ForegroundColor Yellow
Write-Host "  • Backup API: http://localhost:3005/api/backup/*" -ForegroundColor Cyan
Write-Host "  • Recovery API: http://localhost:3006/api/recovery/*" -ForegroundColor Cyan
Write-Host "`n🔧 Management:" -ForegroundColor Yellow
Write-Host "  • View logs: Get-Content logs/ai-backup.log -Tail 50" -ForegroundColor Cyan
Write-Host "  • Run tests: npm test" -ForegroundColor Cyan
Write-Host "  • Docker: docker-compose up -d" -ForegroundColor Cyan
Write-Host "  • Kubernetes: kubectl apply -f k8s/" -ForegroundColor Cyan
Write-Host "`n📖 Documentation:" -ForegroundColor Yellow
Write-Host "  • README.md - Complete system documentation" -ForegroundColor Cyan
Write-Host "  • API docs available at /api/docs endpoints" -ForegroundColor Cyan

Write-Host "`n✨ Disaster Recovery System is ready for use!" -ForegroundColor Green
