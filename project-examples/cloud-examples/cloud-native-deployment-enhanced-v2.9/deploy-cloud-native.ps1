# Cloud-Native Deployment Enhanced v2.9 - Deploy Script
# Kubernetes and Container Optimization

param(
    [string]$Action = "deploy",
    [string]$Environment = "production",
    [string]$Namespace = "manager-agent-ai-v2.9",
    [string]$ImageTag = "2.9.0",
    [switch]$DryRun,
    [switch]$Force,
    [switch]$Status,
    [switch]$Logs,
    [switch]$Scale,
    [int]$Replicas = 0,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Header {
    Write-ColorOutput "`n☸️ Cloud-Native Deployment Enhanced v2.9" -Color "Header"
    Write-ColorOutput "Kubernetes and Container Optimization" -Color "Info"
    Write-ColorOutput "=====================================" -Color "Info"
}

function Show-Help {
    Show-Header
    Write-ColorOutput "`nUsage: .\deploy-cloud-native.ps1 [options]" -Color "Info"
    Write-ColorOutput "`nOptions:" -Color "Info"
    Write-ColorOutput "  -Action <action>     Action to perform (deploy, undeploy, status, logs)" -Color "Info"
    Write-ColorOutput "  -Environment <env>   Environment (production, staging, development)" -Color "Info"
    Write-ColorOutput "  -Namespace <ns>      Kubernetes namespace (default: manager-agent-ai-v2.9)" -Color "Info"
    Write-ColorOutput "  -ImageTag <tag>      Docker image tag (default: 2.9.0)" -Color "Info"
    Write-ColorOutput "  -DryRun             Show what would be deployed without deploying" -Color "Info"
    Write-ColorOutput "  -Force              Force deployment even if resources exist" -Color "Info"
    Write-ColorOutput "  -Status             Show deployment status" -Color "Info"
    Write-ColorOutput "  -Logs               Show deployment logs" -Color "Info"
    Write-ColorOutput "  -Scale              Scale deployments" -Color "Info"
    Write-ColorOutput "  -Replicas <count>   Number of replicas for scaling" -Color "Info"
    Write-ColorOutput "  -Help               Show this help message" -Color "Info"
    Write-ColorOutput "`nExamples:" -Color "Info"
    Write-ColorOutput "  .\deploy-cloud-native.ps1 -Action deploy -Environment production" -Color "Info"
    Write-ColorOutput "  .\deploy-cloud-native.ps1 -Action status" -Color "Info"
    Write-ColorOutput "  .\deploy-cloud-native.ps1 -Action scale -Replicas 5" -Color "Info"
    Write-ColorOutput "  .\deploy-cloud-native.ps1 -Action undeploy -Force" -Color "Info"
}

function Test-Prerequisites {
    Write-ColorOutput "`n🔍 Checking prerequisites..." -Color "Info"
    
    # Check kubectl
    try {
        $kubectlVersion = kubectl version --client --short 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ kubectl found: $kubectlVersion" -Color "Success"
        } else {
            Write-ColorOutput "❌ kubectl not found. Please install kubectl first." -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ kubectl not found. Please install kubectl first." -Color "Error"
        return $false
    }
    
    # Check Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Docker found: $dockerVersion" -Color "Success"
        } else {
            Write-ColorOutput "❌ Docker not found. Please install Docker first." -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Docker not found. Please install Docker first." -Color "Error"
        return $false
    }
    
    # Check Kubernetes cluster connection
    try {
        $clusterInfo = kubectl cluster-info 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Kubernetes cluster connected" -Color "Success"
        } else {
            Write-ColorOutput "❌ Cannot connect to Kubernetes cluster" -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Cannot connect to Kubernetes cluster" -Color "Error"
        return $false
    }
    
    return $true
}

function Deploy-Namespace {
    Write-ColorOutput "`n📦 Deploying namespace..." -Color "Info"
    
    try {
        if ($DryRun) {
            Write-ColorOutput "🔍 Dry run: Would deploy namespace $Namespace" -Color "Info"
            return $true
        }
        
        kubectl apply -f "kubernetes-manifests/namespace.yaml"
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Namespace deployed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Failed to deploy namespace" -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error deploying namespace: $_" -Color "Error"
        return $false
    }
}

function Deploy-ConfigMap {
    Write-ColorOutput "`n⚙️ Deploying ConfigMap..." -Color "Info"
    
    try {
        if ($DryRun) {
            Write-ColorOutput "🔍 Dry run: Would deploy ConfigMap" -Color "Info"
            return $true
        }
        
        kubectl apply -f "kubernetes-manifests/configmap.yaml"
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ ConfigMap deployed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Failed to deploy ConfigMap" -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error deploying ConfigMap: $_" -Color "Error"
        return $false
    }
}

function Deploy-Secrets {
    Write-ColorOutput "`n🔐 Deploying Secrets..." -Color "Info"
    
    try {
        if ($DryRun) {
            Write-ColorOutput "🔍 Dry run: Would deploy Secrets" -Color "Info"
            return $true
        }
        
        kubectl apply -f "kubernetes-manifests/secrets.yaml"
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Secrets deployed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Failed to deploy Secrets" -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error deploying Secrets: $_" -Color "Error"
        return $false
    }
}

function Deploy-API-Gateway {
    Write-ColorOutput "`n🚀 Deploying API Gateway Enhanced..." -Color "Info"
    
    try {
        if ($DryRun) {
            Write-ColorOutput "🔍 Dry run: Would deploy API Gateway Enhanced" -Color "Info"
            return $true
        }
        
        kubectl apply -f "kubernetes-manifests/api-gateway-deployment.yaml"
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ API Gateway Enhanced deployed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Failed to deploy API Gateway Enhanced" -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error deploying API Gateway Enhanced: $_" -Color "Error"
        return $false
    }
}

function Deploy-Analytics-Dashboard {
    Write-ColorOutput "`n📊 Deploying Analytics Dashboard Enhanced..." -Color "Info"
    
    try {
        if ($DryRun) {
            Write-ColorOutput "🔍 Dry run: Would deploy Analytics Dashboard Enhanced" -Color "Info"
            return $true
        }
        
        kubectl apply -f "kubernetes-manifests/analytics-dashboard-deployment.yaml"
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Analytics Dashboard Enhanced deployed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Failed to deploy Analytics Dashboard Enhanced" -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error deploying Analytics Dashboard Enhanced: $_" -Color "Error"
        return $false
    }
}

function Deploy-Orchestrator {
    Write-ColorOutput "`n🎯 Deploying Microservices Orchestrator Enhanced..." -Color "Info"
    
    try {
        if ($DryRun) {
            Write-ColorOutput "🔍 Dry run: Would deploy Microservices Orchestrator Enhanced" -Color "Info"
            return $true
        }
        
        kubectl apply -f "kubernetes-manifests/orchestrator-deployment.yaml"
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Microservices Orchestrator Enhanced deployed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Failed to deploy Microservices Orchestrator Enhanced" -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error deploying Microservices Orchestrator Enhanced: $_" -Color "Error"
        return $false
    }
}

function Deploy-All {
    Write-ColorOutput "`n🚀 Deploying all components..." -Color "Info"
    
    if (-not (Test-Prerequisites)) {
        return $false
    }
    
    $components = @(
        @{ Name = "Namespace"; Function = { Deploy-Namespace } },
        @{ Name = "ConfigMap"; Function = { Deploy-ConfigMap } },
        @{ Name = "Secrets"; Function = { Deploy-Secrets } },
        @{ Name = "API Gateway Enhanced"; Function = { Deploy-API-Gateway } },
        @{ Name = "Analytics Dashboard Enhanced"; Function = { Deploy-Analytics-Dashboard } },
        @{ Name = "Microservices Orchestrator Enhanced"; Function = { Deploy-Orchestrator } }
    )
    
    foreach ($component in $components) {
        Write-ColorOutput "`n📦 Deploying $($component.Name)..." -Color "Info"
        if (-not (& $component.Function)) {
            Write-ColorOutput "❌ Failed to deploy $($component.Name)" -Color "Error"
            return $false
        }
    }
    
    Write-ColorOutput "`n✅ All components deployed successfully!" -Color "Success"
    return $true
}

function Undeploy-All {
    Write-ColorOutput "`n🗑️ Undeploying all components..." -Color "Info"
    
    if (-not $Force) {
        $confirmation = Read-Host "Are you sure you want to undeploy all components? (y/N)"
        if ($confirmation -ne "y" -and $confirmation -ne "Y") {
            Write-ColorOutput "❌ Undeployment cancelled" -Color "Warning"
            return $false
        }
    }
    
    try {
        # Delete deployments
        kubectl delete deployment --all -n $Namespace
        kubectl delete service --all -n $Namespace
        kubectl delete hpa --all -n $Namespace
        kubectl delete pvc --all -n $Namespace
        kubectl delete configmap --all -n $Namespace
        kubectl delete secret --all -n $Namespace
        kubectl delete namespace $Namespace
        
        Write-ColorOutput "✅ All components undeployed successfully" -Color "Success"
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error undeploying components: $_" -Color "Error"
        return $false
    }
}

function Get-DeploymentStatus {
    Write-ColorOutput "`n📊 Deployment Status:" -Color "Info"
    
    try {
        # Check namespace
        $namespace = kubectl get namespace $Namespace -o json 2>$null | ConvertFrom-Json
        if ($namespace) {
            Write-ColorOutput "✅ Namespace $Namespace exists" -Color "Success"
        } else {
            Write-ColorOutput "❌ Namespace $Namespace does not exist" -Color "Error"
            return
        }
        
        # Check deployments
        Write-ColorOutput "`n🚀 Deployments:" -Color "Info"
        kubectl get deployments -n $Namespace
        
        # Check services
        Write-ColorOutput "`n🔗 Services:" -Color "Info"
        kubectl get services -n $Namespace
        
        # Check pods
        Write-ColorOutput "`n📦 Pods:" -Color "Info"
        kubectl get pods -n $Namespace
        
        # Check HPA
        Write-ColorOutput "`n📈 Horizontal Pod Autoscalers:" -Color "Info"
        kubectl get hpa -n $Namespace
        
        # Check PVC
        Write-ColorOutput "`n💾 Persistent Volume Claims:" -Color "Info"
        kubectl get pvc -n $Namespace
    }
    catch {
        Write-ColorOutput "❌ Error getting deployment status: $_" -Color "Error"
    }
}

function Get-DeploymentLogs {
    Write-ColorOutput "`n📋 Deployment Logs:" -Color "Info"
    
    try {
        # Get pods
        $pods = kubectl get pods -n $Namespace -o json | ConvertFrom-Json
        foreach ($pod in $pods.items) {
            Write-ColorOutput "`n📦 Pod: $($pod.metadata.name)" -Color "Info"
            kubectl logs $pod.metadata.name -n $Namespace --tail=50
        }
    }
    catch {
        Write-ColorOutput "❌ Error getting deployment logs: $_" -Color "Error"
    }
}

function Scale-Deployments {
    param([int]$Replicas = 3)
    
    Write-ColorOutput "`n📈 Scaling deployments to $Replicas replicas..." -Color "Info"
    
    try {
        $deployments = @(
            "api-gateway-enhanced",
            "analytics-dashboard-enhanced",
            "microservices-orchestrator-enhanced"
        )
        
        foreach ($deployment in $deployments) {
            kubectl scale deployment $deployment -n $Namespace --replicas=$Replicas
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ Scaled $deployment to $Replicas replicas" -Color "Success"
            } else {
                Write-ColorOutput "❌ Failed to scale $deployment" -Color "Error"
            }
        }
    }
    catch {
        Write-ColorOutput "❌ Error scaling deployments: $_" -Color "Error"
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Show-Header

switch ($Action.ToLower()) {
    "deploy" {
        if (Deploy-All) {
            Write-ColorOutput "`n✅ Deployment completed successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ Deployment failed!" -Color "Error"
            exit 1
        }
    }
    
    "undeploy" {
        if (Undeploy-All) {
            Write-ColorOutput "`n✅ Undeployment completed successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ Undeployment failed!" -Color "Error"
            exit 1
        }
    }
    
    "status" {
        Get-DeploymentStatus
    }
    
    "logs" {
        Get-DeploymentLogs
    }
    
    "scale" {
        if ($Replicas -gt 0) {
            Scale-Deployments -Replicas $Replicas
        } else {
            Write-ColorOutput "❌ Please specify number of replicas with -Replicas parameter" -Color "Error"
            exit 1
        }
    }
    
    default {
        Write-ColorOutput "❌ Unknown action: $Action" -Color "Error"
        Show-Help
        exit 1
    }
}

Write-ColorOutput "`n🎉 Operation completed!" -Color "Success"
