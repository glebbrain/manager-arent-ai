# Enhanced API Gateway v2.9 - Start Script
# Advanced Routing and Load Balancing

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
    Write-ColorOutput "`n🚀 Enhanced API Gateway v2.9" -Color "Header"
    Write-ColorOutput "Advanced Routing and Load Balancing" -Color "Info"
    Write-ColorOutput "====================================" -Color "Info"
}

function Show-Help {
    Show-Header
    Write-ColorOutput "`nUsage: .\start-gateway.ps1 [options]" -Color "Info"
    Write-ColorOutput "`nOptions:" -Color "Info"
    Write-ColorOutput "  -Action <action>     Action to perform (start, stop, restart, status)" -Color "Info"
    Write-ColorOutput "  -Port <port>         Port to run on (default: 3000)" -Color "Info"
    Write-ColorOutput "  -Workers <count>     Number of worker processes (0 = auto)" -Color "Info"
    Write-ColorOutput "  -Install             Install dependencies" -Color "Info"
    Write-ColorOutput "  -Dev                 Start in development mode" -Color "Info"
    Write-ColorOutput "  -Cluster             Start in cluster mode" -Color "Info"
    Write-ColorOutput "  -Status              Check gateway status" -Color "Info"
    Write-ColorOutput "  -Health              Check gateway health" -Color "Info"
    Write-ColorOutput "  -Metrics             Show gateway metrics" -Color "Info"
    Write-ColorOutput "  -Help                Show this help message" -Color "Info"
    Write-ColorOutput "`nExamples:" -Color "Info"
    Write-ColorOutput "  .\start-gateway.ps1 -Install" -Color "Info"
    Write-ColorOutput "  .\start-gateway.ps1 -Action start -Port 3000" -Color "Info"
    Write-ColorOutput "  .\start-gateway.ps1 -Cluster -Workers 4" -Color "Info"
    Write-ColorOutput "  .\start-gateway.ps1 -Status" -Color "Info"
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
            Write-ColorOutput "ℹ️ Redis not found - Using in-memory cache" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "ℹ️ Redis not found - Using in-memory cache" -Color "Info"
    }
    
    return $true
}

function Install-Dependencies {
    Write-ColorOutput "`n📦 Installing Enhanced API Gateway dependencies..." -Color "Info"
    
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
        Write-ColorOutput "❌ Error installing dependencies: $_" -Color "Error"
        return $false
    }
}

function Start-Gateway {
    param(
        [int]$Port = 3000,
        [int]$Workers = 0,
        [switch]$Dev,
        [switch]$Cluster
    )
    
    Write-ColorOutput "`n🚀 Starting Enhanced API Gateway..." -Color "Info"
    
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
                Write-ColorOutput "✅ API Gateway started successfully" -Color "Success"
                Write-ColorOutput "🔗 Gateway URL: http://localhost:$Port" -Color "Info"
                Write-ColorOutput "📊 Metrics URL: http://localhost:$Port/metrics" -Color "Info"
                Write-ColorOutput "🔍 Services URL: http://localhost:$Port/services" -Color "Info"
            } else {
                Write-ColorOutput "❌ API Gateway health check failed" -Color "Error"
                return $false
            }
        }
        catch {
            Write-ColorOutput "❌ Cannot connect to API Gateway: $_" -Color "Error"
            return $false
        }
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error starting API Gateway: $_" -Color "Error"
        return $false
    }
}

function Stop-Gateway {
    Write-ColorOutput "`n🛑 Stopping Enhanced API Gateway..." -Color "Info"
    
    try {
        # Find and kill Node.js processes running the gateway
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*api-gateway*"
        }
        
        if ($processes) {
            $processes | Stop-Process -Force
            Write-ColorOutput "✅ API Gateway processes stopped" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ No API Gateway processes found" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "❌ Error stopping API Gateway: $_" -Color "Error"
    }
}

function Get-GatewayStatus {
    Write-ColorOutput "`n📊 API Gateway Status:" -Color "Info"
    
    try {
        # Check if gateway is running
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*api-gateway*"
        }
        
        if ($processes) {
            Write-ColorOutput "✅ API Gateway is running" -Color "Success"
            Write-ColorOutput "   Process ID: $($processes.Id)" -Color "Info"
            Write-ColorOutput "   Port: $env:PORT" -Color "Info"
            Write-ColorOutput "   URL: http://localhost:$env:PORT" -Color "Info"
        } else {
            Write-ColorOutput "❌ API Gateway is not running" -Color "Error"
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

function Test-GatewayHealth {
    Write-ColorOutput "`n🏥 Testing API Gateway health..." -Color "Info"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/health" -Method GET -TimeoutSec 10
        if ($response.status -eq "healthy") {
            Write-ColorOutput "✅ API Gateway is healthy" -Color "Success"
            Write-ColorOutput "   Version: $($response.version)" -Color "Info"
            Write-ColorOutput "   Uptime: $($response.uptime) seconds" -Color "Info"
            Write-ColorOutput "   Services: $($response.services.Count)" -Color "Info"
        } else {
            Write-ColorOutput "❌ API Gateway health check failed" -Color "Error"
        }
    }
    catch {
        Write-ColorOutput "❌ Cannot connect to API Gateway: $_" -Color "Error"
    }
}

function Get-GatewayMetrics {
    Write-ColorOutput "`n📈 API Gateway Metrics:" -Color "Info"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/metrics" -Method GET -TimeoutSec 10
        
        Write-ColorOutput "📊 Request Metrics:" -Color "Info"
        Write-ColorOutput "   Total Requests: $($response.requests)" -Color "Info"
        Write-ColorOutput "   Total Responses: $($response.responses)" -Color "Info"
        Write-ColorOutput "   Total Errors: $($response.errors)" -Color "Info"
        Write-ColorOutput "   Average Response Time: $([math]::Round($response.averageResponseTime, 2))ms" -Color "Info"
        Write-ColorOutput "   Active Connections: $($response.activeConnections)" -Color "Info"
        
        if ($response.services) {
            Write-ColorOutput "`n🔧 Service Metrics:" -Color "Info"
            foreach ($service in $response.services.PSObject.Properties) {
                Write-ColorOutput "   $($service.Name): $($service.Value)" -Color "Info"
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
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/services" -Method GET -TimeoutSec 10
        
        if ($response.Count -gt 0) {
            foreach ($service in $response) {
                $statusColor = if ($service.status -eq "healthy") { "Success" } else { "Error" }
                Write-ColorOutput "   $($service.name): $($service.endpoint)" -Color "Info"
                Write-ColorOutput "     Status: $($service.status)" -Color $statusColor
                Write-ColorOutput "     Last Check: $($service.lastCheck)" -Color "Info"
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
        if (Install-Dependencies) {
            Write-ColorOutput "`n✅ Installation completed successfully!" -Color "Success"
            Write-ColorOutput "Run '.\start-gateway.ps1 -Action start' to start the gateway" -Color "Info"
        } else {
            Write-ColorOutput "`n❌ Installation failed!" -Color "Error"
            exit 1
        }
    }
    
    "start" {
        if (Start-Gateway -Port $env:PORT -Workers $Workers -Dev:$Dev -Cluster:$Cluster) {
            Write-ColorOutput "`n✅ API Gateway started successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ Failed to start API Gateway!" -Color "Error"
            exit 1
        }
    }
    
    "stop" {
        Stop-Gateway
    }
    
    "restart" {
        Stop-Gateway
        Start-Sleep -Seconds 2
        Start-Gateway -Port $env:PORT -Workers $Workers -Dev:$Dev -Cluster:$Cluster
    }
    
    "status" {
        Get-GatewayStatus
    }
    
    "health" {
        Test-GatewayHealth
    }
    
    "metrics" {
        Get-GatewayMetrics
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
