# Edge Computing Enhanced v3.1 Deployment Script
# Version: 3.1.0

param(
    [Parameter(Position=0)]
    [ValidateSet("deploy", "cleanup", "status", "help")]
    [string]$Command = "deploy"
)

# Configuration
$NAMESPACE = "edge-computing"
$APP_NAME = "edge-computing-enhanced"
$VERSION = "3.1.0"
$IMAGE_NAME = "${APP_NAME}:${VERSION}"

# Functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if kubectl is available
function Test-Kubectl {
    try {
        kubectl version --client | Out-Null
        Write-Success "kubectl is available"
        return $true
    }
    catch {
        Write-Error "kubectl is not installed or not in PATH"
        return $false
    }
}

# Check if Docker is available
function Test-Docker {
    try {
        docker --version | Out-Null
        Write-Success "Docker is available"
        return $true
    }
    catch {
        Write-Error "Docker is not installed or not in PATH"
        return $false
    }
}

# Build Docker image
function Build-Image {
    Write-Info "Building Docker image: $IMAGE_NAME"
    try {
        docker build -t $IMAGE_NAME .
        Write-Success "Docker image built successfully"
    }
    catch {
        Write-Error "Failed to build Docker image"
        throw
    }
}

# Create namespace
function New-Namespace {
    Write-Info "Creating namespace: $NAMESPACE"
    try {
        kubectl apply -f k8s/namespace.yaml
        Write-Success "Namespace created successfully"
    }
    catch {
        Write-Error "Failed to create namespace"
        throw
    }
}

# Deploy ConfigMap
function Deploy-ConfigMap {
    Write-Info "Deploying ConfigMap"
    try {
        kubectl apply -f k8s/configmap.yaml
        Write-Success "ConfigMap deployed successfully"
    }
    catch {
        Write-Error "Failed to deploy ConfigMap"
        throw
    }
}

# Deploy application
function Deploy-App {
    Write-Info "Deploying application"
    try {
        kubectl apply -f k8s/deployment.yaml
        Write-Success "Application deployed successfully"
    }
    catch {
        Write-Error "Failed to deploy application"
        throw
    }
}

# Deploy services
function Deploy-Services {
    Write-Info "Deploying services"
    try {
        kubectl apply -f k8s/service.yaml
        Write-Success "Services deployed successfully"
    }
    catch {
        Write-Error "Failed to deploy services"
        throw
    }
}

# Deploy HPA
function Deploy-HPA {
    Write-Info "Deploying HorizontalPodAutoscaler"
    try {
        kubectl apply -f k8s/hpa.yaml
        Write-Success "HPA deployed successfully"
    }
    catch {
        Write-Error "Failed to deploy HPA"
        throw
    }
}

# Wait for deployment
function Wait-ForDeployment {
    Write-Info "Waiting for deployment to be ready"
    try {
        kubectl wait --for=condition=available --timeout=300s deployment/$APP_NAME -n $NAMESPACE
        Write-Success "Deployment is ready"
    }
    catch {
        Write-Error "Deployment failed to become ready"
        throw
    }
}

# Get deployment status
function Get-Status {
    Write-Info "Getting deployment status"
    try {
        Write-Host "`nPods:" -ForegroundColor Cyan
        kubectl get pods -n $NAMESPACE
        
        Write-Host "`nServices:" -ForegroundColor Cyan
        kubectl get services -n $NAMESPACE
        
        Write-Host "`nHPA:" -ForegroundColor Cyan
        kubectl get hpa -n $NAMESPACE
    }
    catch {
        Write-Error "Failed to get deployment status"
    }
}

# Main deployment function
function Deploy {
    Write-Info "Starting deployment of Edge Computing Enhanced v3.1"
    
    if (-not (Test-Kubectl)) { exit 1 }
    if (-not (Test-Docker)) { exit 1 }
    
    Build-Image
    New-Namespace
    Deploy-ConfigMap
    Deploy-App
    Deploy-Services
    Deploy-HPA
    
    Wait-ForDeployment
    Get-Status
    
    Write-Success "Deployment completed successfully!"
    Write-Info "Application is available at: http://localhost:3000"
    Write-Info "Health check: http://localhost:3000/health"
    Write-Info "Status: http://localhost:3000/status"
}

# Cleanup function
function Remove-Deployment {
    Write-Info "Cleaning up deployment"
    try {
        kubectl delete -f k8s/ --ignore-not-found=true
        Write-Success "Cleanup completed"
    }
    catch {
        Write-Error "Failed to cleanup deployment"
    }
}

# Show help
function Show-Help {
    Write-Host "Edge Computing Enhanced v3.1 Deployment Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [COMMAND]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  deploy     Deploy the application"
    Write-Host "  cleanup    Clean up the deployment"
    Write-Host "  status     Show deployment status"
    Write-Host "  help       Show this help message"
    Write-Host ""
}

# Main script logic
switch ($Command) {
    "deploy" {
        Deploy
    }
    "cleanup" {
        Remove-Deployment
    }
    "status" {
        Get-Status
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Show-Help
        exit 1
    }
}
