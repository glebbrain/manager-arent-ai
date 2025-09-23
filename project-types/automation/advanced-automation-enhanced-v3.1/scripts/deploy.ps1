# Advanced Automation Enhanced v3.1 Deployment Script (PowerShell)
# This script deploys the Advanced Automation Enhanced v3.1 module to Kubernetes

param(
    [string]$Namespace = "advanced-automation-v3-1",
    [string]$AppName = "advanced-automation",
    [string]$Version = "3.1"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

Write-Host "🚀 Starting Advanced Automation Enhanced v3.1 deployment..." -ForegroundColor $Blue

# Check if kubectl is available
try {
    $kubectlVersion = kubectl version --client --short 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "kubectl not found"
    }
    Write-Host "✅ kubectl is available" -ForegroundColor $Green
} catch {
    Write-Host "❌ kubectl is not installed or not in PATH" -ForegroundColor $Red
    exit 1
}

# Check if we can connect to Kubernetes cluster
try {
    kubectl cluster-info 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot connect to cluster"
    }
    Write-Host "✅ Kubernetes cluster connection verified" -ForegroundColor $Green
} catch {
    Write-Host "❌ Cannot connect to Kubernetes cluster" -ForegroundColor $Red
    exit 1
}

# Create namespace
Write-Host "📦 Creating namespace..." -ForegroundColor $Yellow
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap
Write-Host "⚙️  Applying configuration..." -ForegroundColor $Yellow
kubectl apply -f k8s/configmap.yaml

# Apply Deployment
Write-Host "🚀 Deploying application..." -ForegroundColor $Yellow
kubectl apply -f k8s/deployment.yaml

# Apply Service
Write-Host "🌐 Creating service..." -ForegroundColor $Yellow
kubectl apply -f k8s/service.yaml

# Apply HPA
Write-Host "📈 Setting up autoscaling..." -ForegroundColor $Yellow
kubectl apply -f k8s/hpa.yaml

# Wait for deployment to be ready
Write-Host "⏳ Waiting for deployment to be ready..." -ForegroundColor $Yellow
kubectl wait --for=condition=available --timeout=300s deployment/advanced-automation-deployment -n $Namespace

# Get deployment status
Write-Host "✅ Deployment completed successfully!" -ForegroundColor $Green
Write-Host "📊 Deployment status:" -ForegroundColor $Blue
kubectl get deployment advanced-automation-deployment -n $Namespace

Write-Host "🔍 Pod status:" -ForegroundColor $Blue
kubectl get pods -n $Namespace -l app=advanced-automation

Write-Host "🌐 Service status:" -ForegroundColor $Blue
kubectl get service advanced-automation-service -n $Namespace

Write-Host "📈 HPA status:" -ForegroundColor $Blue
kubectl get hpa advanced-automation-hpa -n $Namespace

Write-Host "🎉 Advanced Automation Enhanced v3.1 is now running!" -ForegroundColor $Green
Write-Host "💡 To access the service, use port-forward:" -ForegroundColor $Yellow
Write-Host "   kubectl port-forward service/advanced-automation-service 3000:80 -n $Namespace" -ForegroundColor $Yellow
