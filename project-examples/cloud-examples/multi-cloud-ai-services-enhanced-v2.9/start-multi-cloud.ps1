# Multi-Cloud AI Services Enhanced v2.9 - Start Script
# Cross-cloud AI service deployment and orchestration

param(
    [string]$Action = "start",
    [int]$Port = 3000,
    [int]$Workers = 0,
    [switch]$Install,
    [switch]$Dev,
    [switch]$Cluster,
    [switch]$Status,
    [switch]$Health,
    [switch]$Metrics,
    [switch]$Deploy,
    [string]$ServiceName = "",
    [string]$CloudProvider = "",
    [string]$Region = "",
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
    Write-ColorOutput "`n🌐 Multi-Cloud AI Services Enhanced v2.9" -Color "Header"
    Write-ColorOutput "Cross-cloud AI service deployment and orchestration" -Color "Info"
    Write-ColorOutput "===============================================" -Color "Info"
}

function Show-Help {
    Show-Header
    Write-ColorOutput "`nUsage: .\start-multi-cloud.ps1 [options]" -Color "Info"
    Write-ColorOutput "`nOptions:" -Color "Info"
    Write-ColorOutput "  -Action <action>     Action to perform (start, stop, restart, status)" -Color "Info"
    Write-ColorOutput "  -Port <port>         Port to run on (default: 3000)" -Color "Info"
    Write-ColorOutput "  -Workers <count>     Number of worker processes (0 = auto)" -Color "Info"
    Write-ColorOutput "  -Install             Install dependencies" -Color "Info"
    Write-ColorOutput "  -Dev                 Start in development mode" -Color "Info"
    Write-ColorOutput "  -Cluster             Start in cluster mode" -Color "Info"
    Write-ColorOutput "  -Status              Check orchestrator status" -Color "Info"
    Write-ColorOutput "  -Health              Check orchestrator health" -Color "Info"
    Write-ColorOutput "  -Metrics             Show orchestrator metrics" -Color "Info"
    Write-ColorOutput "  -Deploy              Deploy AI service" -Color "Info"
    Write-ColorOutput "  -ServiceName <name>  Name of AI service to deploy" -Color "Info"
    Write-ColorOutput "  -CloudProvider <prov> Cloud provider (aws, azure, gcp)" -Color "Info"
    Write-ColorOutput "  -Region <region>     Cloud region" -Color "Info"
    Write-ColorOutput "  -Help                Show this help message" -Color "Info"
    Write-ColorOutput "`nExamples:" -Color "Info"
    Write-ColorOutput "  .\start-multi-cloud.ps1 -Install" -Color "Info"
    Write-ColorOutput "  .\start-multi-cloud.ps1 -Action start -Port 3000" -Color "Info"
    Write-ColorOutput "  .\start-multi-cloud.ps1 -Cluster -Workers 4" -Color "Info"
    Write-ColorOutput "  .\start-multi-cloud.ps1 -Deploy -ServiceName text-analysis -CloudProvider aws -Region us-east-1" -Color "Info"
    Write-ColorOutput "  .\start-multi-cloud.ps1 -Status" -Color "Info"
}

function Test-Prerequisites {
    Write-ColorOutput "`n🔍 Checking prerequisites..." -Color "Info"
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Node.js found: $nodeVersion" -Color "Success"
        } else {
            Write-ColorOutput "❌ Node.js not found. Please install Node.js 16+ first." -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Node.js not found. Please install Node.js 16+ first." -Color "Error"
        return $false
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ npm found: $npmVersion" -Color "Success"
        } else {
            Write-ColorOutput "❌ npm not found. Please install npm first." -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ npm not found. Please install npm first." -Color "Error"
        return $false
    }
    
    # Check AWS CLI (optional)
    try {
        aws --version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ AWS CLI found - AWS integration enabled" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ AWS CLI not found - AWS integration disabled" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "ℹ️ AWS CLI not found - AWS integration disabled" -Color "Info"
    }
    
    # Check Azure CLI (optional)
    try {
        az --version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Azure CLI found - Azure integration enabled" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ Azure CLI not found - Azure integration disabled" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "ℹ️ Azure CLI not found - Azure integration disabled" -Color "Info"
    }
    
    # Check Google Cloud CLI (optional)
    try {
        gcloud --version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Google Cloud CLI found - GCP integration enabled" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ Google Cloud CLI not found - GCP integration disabled" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "ℹ️ Google Cloud CLI not found - GCP integration disabled" -Color "Info"
    }
    
    # Check Redis (optional)
    try {
        redis-cli ping 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Redis found - Distributed features enabled" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ Redis not found - Using in-memory storage" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "ℹ️ Redis not found - Using in-memory storage" -Color "Info"
    }
    
    return $true
}

function Install-MultiCloud {
    Write-ColorOutput "`n📦 Installing Multi-Cloud AI Services Enhanced..." -Color "Info"
    
    if (-not (Test-Prerequisites)) {
        return $false
    }
    
    try {
        # Install dependencies
        Write-ColorOutput "Installing Node.js dependencies..." -Color "Info"
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Dependencies installed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Failed to install dependencies" -Color "Error"
            return $false
        }
        
        # Create logs directory
        if (-not (Test-Path "logs")) {
            New-Item -ItemType Directory -Path "logs" -Force | Out-Null
            Write-ColorOutput "✅ Logs directory created" -Color "Success"
        }
        
        # Create config directory
        if (-not (Test-Path "config")) {
            New-Item -ItemType Directory -Path "config" -Force | Out-Null
            Write-ColorOutput "✅ Config directory created" -Color "Success"
        }
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error installing Multi-Cloud AI Services: $_" -Color "Error"
        return $false
    }
}

function Start-MultiCloud {
    param(
        [int]$Port = 3000,
        [int]$Workers = 0,
        [switch]$Dev,
        [switch]$Cluster
    )
    
    Write-ColorOutput "`n🚀 Starting Multi-Cloud AI Services Enhanced..." -Color "Info"
    
    # Check if port is available
    $portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-ColorOutput "❌ Port $Port is already in use" -Color "Error"
        return $false
    }
    
    # Set environment variables
    $env:PORT = $Port
    $env:WORKERS = if ($Workers -gt 0) { $Workers } else { (Get-WmiObject -Class Win32_Processor).NumberOfCores }
    $env:NODE_ENV = if ($Dev) { "development" } else { "production" }
    
    try {
        if ($Cluster) {
            Write-ColorOutput "🔄 Starting in cluster mode with $($env:WORKERS) workers..." -Color "Info"
            Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow
        } elseif ($Dev) {
            Write-ColorOutput "🔧 Starting in development mode..." -Color "Info"
            Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
        } else {
            Write-ColorOutput "🏭 Starting in production mode..." -Color "Info"
            Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow
        }
        
        # Wait a moment for the server to start
        Start-Sleep -Seconds 3
        
        # Check if the server is running
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method GET -TimeoutSec 5
            if ($response.status -eq "healthy") {
                Write-ColorOutput "✅ Multi-Cloud AI Services started successfully" -Color "Success"
                Write-ColorOutput "🔗 Services URL: http://localhost:$Port" -Color "Info"
                Write-ColorOutput "📊 Metrics URL: http://localhost:$Port/api/performance" -Color "Info"
                Write-ColorOutput "🌐 Cloud Providers URL: http://localhost:$Port/api/cloud-providers" -Color "Info"
            } else {
                Write-ColorOutput "❌ Multi-Cloud AI Services health check failed" -Color "Error"
                return $false
            }
        }
        catch {
            Write-ColorOutput "❌ Cannot connect to Multi-Cloud AI Services: $_" -Color "Error"
            return $false
        }
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error starting Multi-Cloud AI Services: $_" -Color "Error"
        return $false
    }
}

function Stop-MultiCloud {
    Write-ColorOutput "`n🛑 Stopping Multi-Cloud AI Services Enhanced..." -Color "Info"
    
    try {
        # Find and kill Node.js processes running the multi-cloud services
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*multi-cloud*"
        }
        
        if ($processes) {
            $processes | Stop-Process -Force
            Write-ColorOutput "✅ Multi-Cloud AI Services processes stopped" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ No Multi-Cloud AI Services processes found" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "❌ Error stopping Multi-Cloud AI Services: $_" -Color "Error"
    }
}

function Get-MultiCloudStatus {
    Write-ColorOutput "`n📊 Multi-Cloud AI Services Status:" -Color "Info"
    
    try {
        # Check if services are running
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*multi-cloud*"
        }
        
        if ($processes) {
            Write-ColorOutput "✅ Multi-Cloud AI Services is running" -Color "Success"
            Write-ColorOutput "   Process ID: $($processes.Id)" -Color "Info"
            Write-ColorOutput "   Port: $env:PORT" -Color "Info"
            Write-ColorOutput "   URL: http://localhost:$env:PORT" -Color "Info"
        } else {
            Write-ColorOutput "❌ Multi-Cloud AI Services is not running" -Color "Error"
        }
        
        # Check port status
        $portCheck = Get-NetTCPConnection -LocalPort $env:PORT -ErrorAction SilentlyContinue
        if ($portCheck) {
            Write-ColorOutput "✅ Port $($env:PORT) is listening" -Color "Success"
        } else {
            Write-ColorOutput "❌ Port $($env:PORT) is not listening" -Color "Error"
        }
    }
    catch {
        Write-ColorOutput "❌ Error checking status: $_" -Color "Error"
    }
}

function Test-MultiCloudHealth {
    Write-ColorOutput "`n🏥 Testing Multi-Cloud AI Services health..." -Color "Info"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/health" -Method GET -TimeoutSec 10
        if ($response.status -eq "healthy") {
            Write-ColorOutput "✅ Multi-Cloud AI Services is healthy" -Color "Success"
            Write-ColorOutput "   Version: $($response.version)" -Color "Info"
            Write-ColorOutput "   Uptime: $($response.uptime) seconds" -Color "Info"
            Write-ColorOutput "   Cloud Providers: $($response.cloudProviders.Count)" -Color "Info"
            Write-ColorOutput "   AI Services: $($response.aiServices.Count)" -Color "Info"
            Write-ColorOutput "   Deployments: $($response.deployments)" -Color "Info"
        } else {
            Write-ColorOutput "❌ Multi-Cloud AI Services health check failed" -Color "Error"
        }
    }
    catch {
        Write-ColorOutput "❌ Cannot connect to Multi-Cloud AI Services: $_" -Color "Error"
    }
}

function Get-MultiCloudMetrics {
    Write-ColorOutput "`n📈 Multi-Cloud AI Services Metrics:" -Color "Info"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/api/performance" -Method GET -TimeoutSec 10
        
        Write-ColorOutput "📊 Performance Metrics:" -Color "Info"
        Write-ColorOutput "   Total Services: $($response.totalServices)" -Color "Info"
        Write-ColorOutput "   Healthy Services: $($response.healthyServices)" -Color "Info"
        Write-ColorOutput "   Total Deployments: $($response.totalDeployments)" -Color "Info"
        Write-ColorOutput "   Average Latency: $([math]::Round($response.averageLatency, 2))ms" -Color "Info"
        Write-ColorOutput "   Total Throughput: $($response.totalThroughput) req/s" -Color "Info"
        
        if ($response.cloudProviderDistribution) {
            Write-ColorOutput "`n🌐 Cloud Provider Distribution:" -Color "Info"
            foreach ($provider in $response.cloudProviderDistribution.PSObject.Properties) {
                Write-ColorOutput "   $($provider.Name): $($provider.Value) services" -Color "Info"
            }
        }
    }
    catch {
        Write-ColorOutput "❌ Cannot retrieve metrics: $_" -Color "Error"
    }
}

function Deploy-AIService {
    param(
        [string]$ServiceName,
        [string]$CloudProvider,
        [string]$Region
    )
    
    Write-ColorOutput "`n🚀 Deploying AI Service: $ServiceName..." -Color "Info"
    
    if (-not $ServiceName -or -not $CloudProvider -or -not $Region) {
        Write-ColorOutput "❌ Please specify ServiceName, CloudProvider, and Region" -Color "Error"
        return $false
    }
    
    try {
        $deployData = @{
            serviceName = $ServiceName
            serviceType = "ai-service"
            cloudProvider = $CloudProvider
            region = $Region
            config = @{
                replicas = 1
                resources = @{
                    cpu = "500m"
                    memory = "1Gi"
                }
            }
        } | ConvertTo-Json -Depth 3
        
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/api/ai-services/deploy" -Method POST -Body $deployData -ContentType "application/json" -TimeoutSec 30
        
        if ($response.success) {
            Write-ColorOutput "✅ AI Service deployed successfully" -Color "Success"
            Write-ColorOutput "   Service: $($response.serviceName)" -Color "Info"
            Write-ColorOutput "   Cloud Provider: $($response.cloudProvider)" -Color "Info"
            Write-ColorOutput "   Region: $($response.region)" -Color "Info"
        } else {
            Write-ColorOutput "❌ AI Service deployment failed: $($response.error)" -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error deploying AI Service: $_" -Color "Error"
        return $false
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Show-Header

# Set default port if not specified
if (-not $env:PORT) {
    $env:PORT = $Port
}

switch ($Action.ToLower()) {
    "install" {
        if (Install-MultiCloud) {
            Write-ColorOutput "`n✅ Installation completed successfully!" -Color "Success"
            Write-ColorOutput "Run '.\start-multi-cloud.ps1 -Action start' to start the services" -Color "Info"
        } else {
            Write-ColorOutput "`n❌ Installation failed!" -Color "Error"
            exit 1
        }
    }
    
    "start" {
        if (Start-MultiCloud -Port $env:PORT -Workers $Workers -Dev:$Dev -Cluster:$Cluster) {
            Write-ColorOutput "`n✅ Multi-Cloud AI Services started successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ Failed to start Multi-Cloud AI Services!" -Color "Error"
            exit 1
        }
    }
    
    "stop" {
        Stop-MultiCloud
    }
    
    "restart" {
        Stop-MultiCloud
        Start-Sleep -Seconds 2
        Start-MultiCloud -Port $env:PORT -Workers $Workers -Dev:$Dev -Cluster:$Cluster
    }
    
    "status" {
        Get-MultiCloudStatus
    }
    
    "health" {
        Test-MultiCloudHealth
    }
    
    "metrics" {
        Get-MultiCloudMetrics
    }
    
    "deploy" {
        if (Deploy-AIService -ServiceName $ServiceName -CloudProvider $CloudProvider -Region $Region) {
            Write-ColorOutput "`n✅ AI Service deployment completed successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ AI Service deployment failed!" -Color "Error"
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
