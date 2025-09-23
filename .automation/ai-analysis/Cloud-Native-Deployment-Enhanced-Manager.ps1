# Cloud-Native Deployment Enhanced Manager v2.9
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
    Write-ColorOutput "`n☸️ Cloud-Native Deployment Enhanced Manager v2.9" -Color "Header"
    Write-ColorOutput "Kubernetes and Container Optimization" -Color "Info"
    Write-ColorOutput "=====================================" -Color "Info"
}

function Show-Help {
    Show-Header
    Write-ColorOutput "`nUsage: .\Cloud-Native-Deployment-Enhanced-Manager.ps1 [options]" -Color "Info"
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
    Write-ColorOutput "  .\Cloud-Native-Deployment-Enhanced-Manager.ps1 -Action deploy -Environment production" -Color "Info"
    Write-ColorOutput "  .\Cloud-Native-Deployment-Enhanced-Manager.ps1 -Action status" -Color "Info"
    Write-ColorOutput "  .\Cloud-Native-Deployment-Enhanced-Manager.ps1 -Action scale -Replicas 5" -Color "Info"
    Write-ColorOutput "  .\Cloud-Native-Deployment-Enhanced-Manager.ps1 -Action undeploy -Force" -Color "Info"
}

function Test-Prerequisites {
    Write-ColorOutput "`n🔍 Checking prerequisites..." -Color "Info"
    
    # Check if deployment directory exists
    $deploymentPath = "..\..\cloud-native-deployment-enhanced-v2.9"
    if (-not (Test-Path $deploymentPath)) {
        Write-ColorOutput "❌ Deployment directory not found: $deploymentPath" -Color "Error"
        return $false
    }
    
    Write-ColorOutput "✅ Deployment directory found" -Color "Success"
    
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

function Deploy-All {
    Write-ColorOutput "`n🚀 Deploying Cloud-Native Deployment Enhanced..." -Color "Info"
    
    if (-not (Test-Prerequisites)) {
        return $false
    }
    
    $deploymentPath = "..\..\cloud-native-deployment-enhanced-v2.9"
    
    try {
        Push-Location $deploymentPath
        
        # Run deployment script
        $deployArgs = @("-Action", $Action, "-Environment", $Environment, "-Namespace", $Namespace, "-ImageTag", $ImageTag)
        
        if ($DryRun) { $deployArgs += "-DryRun" }
        if ($Force) { $deployArgs += "-Force" }
        
        & ".\deploy-cloud-native.ps1" @deployArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Cloud-Native deployment completed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Cloud-Native deployment failed" -Color "Error"
            return $false
        }
        
        Pop-Location
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error deploying Cloud-Native: $_" -Color "Error"
        Pop-Location
        return $false
    }
}

function Get-DeploymentStatus {
    Write-ColorOutput "`n📊 Cloud-Native Deployment Status:" -Color "Info"
    
    $deploymentPath = "..\..\cloud-native-deployment-enhanced-v2.9"
    
    try {
        Push-Location $deploymentPath
        
        # Run status command
        & ".\deploy-cloud-native.ps1" -Action status
        
        Pop-Location
    }
    catch {
        Write-ColorOutput "❌ Error getting deployment status: $_" -Color "Error"
        Pop-Location
    }
}

function Get-DeploymentLogs {
    Write-ColorOutput "`n📋 Cloud-Native Deployment Logs:" -Color "Info"
    
    $deploymentPath = "..\..\cloud-native-deployment-enhanced-v2.9"
    
    try {
        Push-Location $deploymentPath
        
        # Run logs command
        & ".\deploy-cloud-native.ps1" -Action logs
        
        Pop-Location
    }
    catch {
        Write-ColorOutput "❌ Error getting deployment logs: $_" -Color "Error"
        Pop-Location
    }
}

function Scale-Deployments {
    param([int]$Replicas = 3)
    
    Write-ColorOutput "`n📈 Scaling Cloud-Native deployments to $Replicas replicas..." -Color "Info"
    
    $deploymentPath = "..\..\cloud-native-deployment-enhanced-v2.9"
    
    try {
        Push-Location $deploymentPath
        
        # Run scale command
        & ".\deploy-cloud-native.ps1" -Action scale -Replicas $Replicas
        
        Pop-Location
    }
    catch {
        Write-ColorOutput "❌ Error scaling deployments: $_" -Color "Error"
        Pop-Location
    }
}

function Undeploy-All {
    Write-ColorOutput "`n🗑️ Undeploying Cloud-Native Deployment Enhanced..." -Color "Info"
    
    if (-not $Force) {
        $confirmation = Read-Host "Are you sure you want to undeploy all components? (y/N)"
        if ($confirmation -ne "y" -and $confirmation -ne "Y") {
            Write-ColorOutput "❌ Undeployment cancelled" -Color "Warning"
            return $false
        }
    }
    
    $deploymentPath = "..\..\cloud-native-deployment-enhanced-v2.9"
    
    try {
        Push-Location $deploymentPath
        
        # Run undeploy command
        $undeployArgs = @("-Action", "undeploy")
        if ($Force) { $undeployArgs += "-Force" }
        
        & ".\deploy-cloud-native.ps1" @undeployArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Cloud-Native undeployment completed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Cloud-Native undeployment failed" -Color "Error"
            return $false
        }
        
        Pop-Location
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error undeploying Cloud-Native: $_" -Color "Error"
        Pop-Location
        return $false
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
            Write-ColorOutput "`n✅ Cloud-Native deployment completed successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ Cloud-Native deployment failed!" -Color "Error"
            exit 1
        }
    }
    
    "undeploy" {
        if (Undeploy-All) {
            Write-ColorOutput "`n✅ Cloud-Native undeployment completed successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ Cloud-Native undeployment failed!" -Color "Error"
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
