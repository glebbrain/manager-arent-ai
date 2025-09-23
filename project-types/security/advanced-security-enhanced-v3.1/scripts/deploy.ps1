# Advanced Security Enhancement v3.1 Deployment Script (PowerShell)
# Version: 3.1.0

param(
    [Parameter(Position=0)]
    [ValidateSet("deploy", "status", "logs", "cleanup")]
    [string]$Action = "deploy"
)

# Configuration
$NAMESPACE = "advanced-security"
$APP_NAME = "advanced-security"
$VERSION = "3.1.0"
$IMAGE_NAME = "advanced-security-v3.1"

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

# Check if kubectl is installed
function Test-Kubectl {
    try {
        $null = Get-Command kubectl -ErrorAction Stop
        Write-Success "kubectl is available"
        return $true
    }
    catch {
        Write-Error "kubectl is not installed or not in PATH"
        return $false
    }
}

# Check if cluster is accessible
function Test-Cluster {
    try {
        $null = kubectl cluster-info 2>$null
        Write-Success "Kubernetes cluster is accessible"
        return $true
    }
    catch {
        Write-Error "Cannot connect to Kubernetes cluster"
        return $false
    }
}

# Create namespace
function New-Namespace {
    Write-Info "Creating namespace: $NAMESPACE"
    kubectl apply -f k8s/namespace.yaml
    Write-Success "Namespace created"
}

# Create secrets
function New-Secrets {
    Write-Info "Creating secrets"
    
    # Check if blockchain secrets exist
    $secretsExist = kubectl get secret blockchain-secrets -n $NAMESPACE 2>$null
    if (-not $secretsExist) {
        kubectl create secret generic blockchain-secrets `
            --from-literal=contract-address="0x0000000000000000000000000000000000000000" `
            --from-literal=private-key="0x0000000000000000000000000000000000000000000000000000000000000000" `
            -n $NAMESPACE
        Write-Success "Blockchain secrets created"
    }
    else {
        Write-Warning "Blockchain secrets already exist"
    }
}

# Deploy application
function Deploy-App {
    Write-Info "Deploying Advanced Security Enhancement v3.1"
    
    # Apply ConfigMap
    kubectl apply -f k8s/configmap.yaml
    Write-Success "ConfigMap applied"
    
    # Apply Deployment
    kubectl apply -f k8s/deployment.yaml
    Write-Success "Deployment applied"
    
    # Apply Service
    kubectl apply -f k8s/service.yaml
    Write-Success "Service applied"
    
    # Apply HPA
    kubectl apply -f k8s/hpa.yaml
    Write-Success "HPA applied"
}

# Wait for deployment
function Wait-ForDeployment {
    Write-Info "Waiting for deployment to be ready"
    kubectl wait --for=condition=available --timeout=300s deployment/$APP_NAME -n $NAMESPACE
    Write-Success "Deployment is ready"
}

# Show status
function Show-Status {
    Write-Info "Deployment status:"
    kubectl get pods -n $NAMESPACE
    Write-Host ""
    kubectl get services -n $NAMESPACE
    Write-Host ""
    kubectl get hpa -n $NAMESPACE
}

# Show logs
function Show-Logs {
    Write-Info "Showing logs for $APP_NAME:"
    kubectl logs -l app=$APP_NAME -n $NAMESPACE --tail=50
}

# Cleanup
function Remove-Deployment {
    Write-Info "Cleaning up deployment"
    kubectl delete -f k8s/ --ignore-not-found=true
    Write-Success "Cleanup completed"
}

# Main deployment function
function Start-Deployment {
    Write-Info "Starting Advanced Security Enhancement v3.1 deployment"
    
    if (-not (Test-Kubectl)) { exit 1 }
    if (-not (Test-Cluster)) { exit 1 }
    
    New-Namespace
    New-Secrets
    Deploy-App
    Wait-ForDeployment
    Show-Status
    
    Write-Success "Deployment completed successfully!"
    Write-Info "You can access the application at:"
    $service = kubectl get service advanced-security-nodeport -n $NAMESPACE -o jsonpath='{.spec.clusterIP}:{.spec.ports[0].port}'
    Write-Host $service
}

# Main function
switch ($Action) {
    "deploy" {
        Start-Deployment
    }
    "status" {
        Show-Status
    }
    "logs" {
        Show-Logs
    }
    "cleanup" {
        Remove-Deployment
    }
    default {
        Write-Host "Usage: .\deploy.ps1 {deploy|status|logs|cleanup}"
        Write-Host "  deploy  - Deploy the application (default)"
        Write-Host "  status  - Show deployment status"
        Write-Host "  logs    - Show application logs"
        Write-Host "  cleanup - Remove the deployment"
        exit 1
    }
}
