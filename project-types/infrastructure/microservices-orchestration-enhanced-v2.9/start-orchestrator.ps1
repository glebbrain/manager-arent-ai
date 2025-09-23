# Microservices Orchestration Enhanced v2.9 - Start Script
# Enhanced Service Mesh Orchestration and Management

param(
    [string]$Action = "start",
    [int]$Port = 8080,
    [int]$Workers = 0,
    [switch]$Install,
    [switch]$Dev,
    [switch]$Cluster,
    [switch]$Status,
    [switch]$Health,
    [switch]$Metrics,
    [switch]$Services,
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
    Write-ColorOutput "`n🚀 Microservices Orchestration Enhanced v2.9" -Color "Header"
    Write-ColorOutput "Enhanced Service Mesh Orchestration and Management" -Color "Info"
    Write-ColorOutput "=================================================" -Color "Info"
}

function Show-Help {
    Show-Header
    Write-ColorOutput "`nUsage: .\start-orchestrator.ps1 [options]" -Color "Info"
    Write-ColorOutput "`nOptions:" -Color "Info"
    Write-ColorOutput "  -Action <action>     Action to perform (start, stop, restart, status)" -Color "Info"
    Write-ColorOutput "  -Port <port>         Port to run on (default: 8080)" -Color "Info"
    Write-ColorOutput "  -Workers <count>     Number of worker processes (0 = auto)" -Color "Info"
    Write-ColorOutput "  -Install             Install dependencies" -Color "Info"
    Write-ColorOutput "  -Dev                 Start in development mode" -Color "Info"
    Write-ColorOutput "  -Cluster             Start in cluster mode" -Color "Info"
    Write-ColorOutput "  -Status              Check orchestrator status" -Color "Info"
    Write-ColorOutput "  -Health              Check orchestrator health" -Color "Info"
    Write-ColorOutput "  -Metrics             Show orchestrator metrics" -Color "Info"
    Write-ColorOutput "  -Services            List registered services" -Color "Info"
    Write-ColorOutput "  -Help                Show this help message" -Color "Info"
    Write-ColorOutput "`nExamples:" -Color "Info"
    Write-ColorOutput "  .\start-orchestrator.ps1 -Install" -Color "Info"
    Write-ColorOutput "  .\start-orchestrator.ps1 -Action start -Port 8080" -Color "Info"
    Write-ColorOutput "  .\start-orchestrator.ps1 -Cluster -Workers 4" -Color "Info"
    Write-ColorOutput "  .\start-orchestrator.ps1 -Status" -Color "Info"
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
    
    # Check Redis (optional)
    try {
        redis-cli ping 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Redis found - Caching enabled" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ Redis not found - Using in-memory storage" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "ℹ️ Redis not found - Using in-memory storage" -Color "Info"
    }
    
    # Check Docker (optional)
    try {
        docker --version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Docker found - Container orchestration available" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ Docker not found - Container orchestration not available" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "ℹ️ Docker not found - Container orchestration not available" -Color "Info"
    }
    
    return $true
}

function Install-Orchestrator {
    Write-ColorOutput "`n📦 Installing Microservices Orchestration Enhanced..." -Color "Info"
    
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
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error installing orchestrator: $_" -Color "Error"
        return $false
    }
}

function Start-Orchestrator {
    param(
        [int]$Port = 8080,
        [int]$Workers = 0,
        [switch]$Dev,
        [switch]$Cluster
    )
    
    Write-ColorOutput "`n🚀 Starting Microservices Orchestration Enhanced..." -Color "Info"
    
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
                Write-ColorOutput "✅ Orchestrator started successfully" -Color "Success"
                Write-ColorOutput "🔗 Orchestrator URL: http://localhost:$Port" -Color "Info"
                Write-ColorOutput "📊 Metrics URL: http://localhost:$Port/api/metrics" -Color "Info"
                Write-ColorOutput "🔍 Services URL: http://localhost:$Port/api/services" -Color "Info"
            } else {
                Write-ColorOutput "❌ Orchestrator health check failed" -Color "Error"
                return $false
            }
        }
        catch {
            Write-ColorOutput "❌ Cannot connect to orchestrator: $_" -Color "Error"
            return $false
        }
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error starting orchestrator: $_" -Color "Error"
        return $false
    }
}

function Stop-Orchestrator {
    Write-ColorOutput "`n🛑 Stopping Microservices Orchestration Enhanced..." -Color "Info"
    
    try {
        # Find and kill Node.js processes running the orchestrator
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*orchestrator*"
        }
        
        if ($processes) {
            $processes | Stop-Process -Force
            Write-ColorOutput "✅ Orchestrator processes stopped" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ No orchestrator processes found" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "❌ Error stopping orchestrator: $_" -Color "Error"
    }
}

function Get-OrchestratorStatus {
    Write-ColorOutput "`n📊 Orchestrator Status:" -Color "Info"
    
    try {
        # Check if orchestrator is running
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*orchestrator*"
        }
        
        if ($processes) {
            Write-ColorOutput "✅ Orchestrator is running" -Color "Success"
            Write-ColorOutput "   Process ID: $($processes.Id)" -Color "Info"
            Write-ColorOutput "   Port: $env:PORT" -Color "Info"
            Write-ColorOutput "   URL: http://localhost:$env:PORT" -Color "Info"
        } else {
            Write-ColorOutput "❌ Orchestrator is not running" -Color "Error"
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

function Test-OrchestratorHealth {
    Write-ColorOutput "`n🏥 Testing orchestrator health..." -Color "Info"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/health" -Method GET -TimeoutSec 10
        if ($response.status -eq "healthy") {
            Write-ColorOutput "✅ Orchestrator is healthy" -Color "Success"
            Write-ColorOutput "   Version: $($response.version)" -Color "Info"
            Write-ColorOutput "   Uptime: $($response.uptime) seconds" -Color "Info"
            Write-ColorOutput "   Services: $($response.services.Count)" -Color "Info"
            Write-ColorOutput "   Mesh Status: $($response.meshStatus.totalServices) total, $($response.meshStatus.healthyServices) healthy" -Color "Info"
        } else {
            Write-ColorOutput "❌ Orchestrator health check failed" -Color "Error"
        }
    }
    catch {
        Write-ColorOutput "❌ Cannot connect to orchestrator: $_" -Color "Error"
    }
}

function Get-OrchestratorMetrics {
    Write-ColorOutput "`n📈 Orchestrator Metrics:" -Color "Info"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/api/metrics" -Method GET -TimeoutSec 10
        
        Write-ColorOutput "📊 Mesh Metrics:" -Color "Info"
        Write-ColorOutput "   Total Services: $($response.mesh.totalServices)" -Color "Info"
        Write-ColorOutput "   Healthy Services: $($response.mesh.healthyServices)" -Color "Info"
        Write-ColorOutput "   Unhealthy Services: $($response.mesh.unhealthyServices)" -Color "Info"
        Write-ColorOutput "   Circuit Breakers Open: $($response.mesh.circuitBreakersOpen)" -Color "Info"
        Write-ColorOutput "   Average Response Time: $([math]::Round($response.mesh.averageResponseTime, 2))ms" -Color "Info"
        
        if ($response.services) {
            Write-ColorOutput "`n🔧 Service Metrics:" -Color "Info"
            foreach ($service in $response.services.PSObject.Properties) {
                $serviceData = $service.Value
                $statusColor = if ($serviceData.status -eq "healthy") { "Success" } else { "Error" }
                Write-ColorOutput "   $($service.Name):" -Color "Info"
                Write-ColorOutput "     Status: $($serviceData.status)" -Color $statusColor
                Write-ColorOutput "     Requests: $($serviceData.requests)" -Color "Info"
                Write-ColorOutput "     Errors: $($serviceData.errors)" -Color "Info"
                Write-ColorOutput "     Response Time: $($serviceData.responseTime)ms" -Color "Info"
            }
        }
    }
    catch {
        Write-ColorOutput "❌ Cannot retrieve metrics: $_" -Color "Error"
    }
}

function Get-Services {
    Write-ColorOutput "`n🔧 Registered Services:" -Color "Info"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/api/services" -Method GET -TimeoutSec 10
        
        if ($response.Count -gt 0) {
            foreach ($service in $response) {
                $statusColor = if ($service.status -eq "healthy") { "Success" } else { "Error" }
                Write-ColorOutput "   $($service.name): $($service.endpoint)" -Color "Info"
                Write-ColorOutput "     Status: $($service.status)" -Color $statusColor
                Write-ColorOutput "     Last Check: $($service.lastCheck)" -Color "Info"
                Write-ColorOutput "     Requests: $($service.metrics.requests)" -Color "Info"
                Write-ColorOutput "     Errors: $($service.metrics.errors)" -Color "Info"
            }
        } else {
            Write-ColorOutput "   No services registered" -Color "Warning"
        }
    }
    catch {
        Write-ColorOutput "❌ Cannot retrieve services: $_" -Color "Error"
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
        if (Install-Orchestrator) {
            Write-ColorOutput "`n✅ Installation completed successfully!" -Color "Success"
            Write-ColorOutput "Run '.\start-orchestrator.ps1 -Action start' to start the orchestrator" -Color "Info"
        } else {
            Write-ColorOutput "`n❌ Installation failed!" -Color "Error"
            exit 1
        }
    }
    
    "start" {
        if (Start-Orchestrator -Port $env:PORT -Workers $Workers -Dev:$Dev -Cluster:$Cluster) {
            Write-ColorOutput "`n✅ Orchestrator started successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ Failed to start orchestrator!" -Color "Error"
            exit 1
        }
    }
    
    "stop" {
        Stop-Orchestrator
    }
    
    "restart" {
        Stop-Orchestrator
        Start-Sleep -Seconds 2
        Start-Orchestrator -Port $env:PORT -Workers $Workers -Dev:$Dev -Cluster:$Cluster
    }
    
    "status" {
        Get-OrchestratorStatus
    }
    
    "health" {
        Test-OrchestratorHealth
    }
    
    "metrics" {
        Get-OrchestratorMetrics
    }
    
    "services" {
        Get-Services
    }
    
    default {
        Write-ColorOutput "❌ Unknown action: $Action" -Color "Error"
        Show-Help
        exit 1
    }
}

Write-ColorOutput "`n🎉 Operation completed!" -Color "Success"
