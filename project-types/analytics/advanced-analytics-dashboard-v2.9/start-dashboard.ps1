# Advanced Analytics Dashboard v2.9 - Start Script
# Real-time AI Performance Monitoring & Analytics

param(
    [string]$Action = "start",
    [int]$Port = 3001,
    [switch]$Install,
    [switch]$Dev,
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
    Write-ColorOutput "`n🚀 Advanced Analytics Dashboard v2.9" -Color "Header"
    Write-ColorOutput "Real-time AI Performance Monitoring & Analytics" -Color "Info"
    Write-ColorOutput "=================================================" -Color "Info"
}

function Show-Help {
    Show-Header
    Write-ColorOutput "`nUsage: .\start-dashboard.ps1 [options]" -Color "Info"
    Write-ColorOutput "`nOptions:" -Color "Info"
    Write-ColorOutput "  -Action <action>     Action to perform (start, stop, restart, status)" -Color "Info"
    Write-ColorOutput "  -Port <port>         Port to run on (default: 3001)" -Color "Info"
    Write-ColorOutput "  -Install             Install dependencies" -Color "Info"
    Write-ColorOutput "  -Dev                 Start in development mode" -Color "Info"
    Write-ColorOutput "  -Help                Show this help message" -Color "Info"
    Write-ColorOutput "`nExamples:" -Color "Info"
    Write-ColorOutput "  .\start-dashboard.ps1 -Install" -Color "Info"
    Write-ColorOutput "  .\start-dashboard.ps1 -Action start -Port 3001" -Color "Info"
    Write-ColorOutput "  .\start-dashboard.ps1 -Dev" -Color "Info"
    Write-ColorOutput "  .\start-dashboard.ps1 -Action stop" -Color "Info"
}

function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Node.js found: $nodeVersion" -Color "Success"
            return $true
        }
    }
    catch {
        Write-ColorOutput "❌ Node.js not found. Please install Node.js 16+ first." -Color "Error"
        return $false
    }
    return $false
}

function Test-NPM {
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ npm found: $npmVersion" -Color "Success"
            return $true
        }
    }
    catch {
        Write-ColorOutput "❌ npm not found. Please install npm first." -Color "Error"
        return $false
    }
    return $false
}

function Install-Dependencies {
    Write-ColorOutput "`n📦 Installing dependencies..." -Color "Info"
    
    if (-not (Test-NodeJS)) {
        return $false
    }
    
    if (-not (Test-NPM)) {
        return $false
    }
    
    try {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Dependencies installed successfully" -Color "Success"
            return $true
        } else {
            Write-ColorOutput "❌ Failed to install dependencies" -Color "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error installing dependencies: $_" -Color "Error"
        return $false
    }
}

function Start-Dashboard {
    param(
        [int]$Port = 3001,
        [switch]$Dev
    )
    
    Write-ColorOutput "`n🚀 Starting Advanced Analytics Dashboard..." -Color "Info"
    
    # Check if port is available
    $portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-ColorOutput "❌ Port $Port is already in use" -Color "Error"
        return $false
    }
    
    # Set environment variables
    $env:PORT = $Port
    $env:NODE_ENV = if ($Dev) { "development" } else { "production" }
    
    try {
        if ($Dev) {
            Write-ColorOutput "🔧 Starting in development mode..." -Color "Info"
            npm run dev
        } else {
            Write-ColorOutput "🏭 Starting in production mode..." -Color "Info"
            npm start
        }
    }
    catch {
        Write-ColorOutput "❌ Error starting dashboard: $_" -Color "Error"
        return $false
    }
}

function Stop-Dashboard {
    Write-ColorOutput "`n🛑 Stopping Advanced Analytics Dashboard..." -Color "Info"
    
    try {
        # Find and kill Node.js processes running the dashboard
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*advanced-analytics-dashboard*"
        }
        
        if ($processes) {
            $processes | Stop-Process -Force
            Write-ColorOutput "✅ Dashboard stopped successfully" -Color "Success"
        } else {
            Write-ColorOutput "ℹ️ No dashboard processes found" -Color "Info"
        }
    }
    catch {
        Write-ColorOutput "❌ Error stopping dashboard: $_" -Color "Error"
    }
}

function Get-DashboardStatus {
    Write-ColorOutput "`n📊 Dashboard Status:" -Color "Info"
    
    try {
        # Check if dashboard is running
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*advanced-analytics-dashboard*"
        }
        
        if ($processes) {
            Write-ColorOutput "✅ Dashboard is running" -Color "Success"
            Write-ColorOutput "   Process ID: $($processes.Id)" -Color "Info"
            Write-ColorOutput "   Port: $env:PORT" -Color "Info"
            Write-ColorOutput "   URL: http://localhost:$env:PORT" -Color "Info"
        } else {
            Write-ColorOutput "❌ Dashboard is not running" -Color "Error"
        }
        
        # Check if port is listening
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

function Test-DashboardHealth {
    Write-ColorOutput "`n🏥 Testing dashboard health..." -Color "Info"
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$env:PORT/api/health" -Method GET -TimeoutSec 10
        if ($response.status -eq "healthy") {
            Write-ColorOutput "✅ Dashboard is healthy" -Color "Success"
            Write-ColorOutput "   Version: $($response.version)" -Color "Info"
            Write-ColorOutput "   Uptime: $($response.uptime) seconds" -Color "Info"
        } else {
            Write-ColorOutput "❌ Dashboard health check failed" -Color "Error"
        }
    }
    catch {
        Write-ColorOutput "❌ Cannot connect to dashboard: $_" -Color "Error"
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Show-Header

switch ($Action.ToLower()) {
    "install" {
        if (Install-Dependencies) {
            Write-ColorOutput "`n✅ Installation completed successfully!" -Color "Success"
            Write-ColorOutput "Run '.\start-dashboard.ps1 -Action start' to start the dashboard" -Color "Info"
        } else {
            Write-ColorOutput "`n❌ Installation failed!" -Color "Error"
            exit 1
        }
    }
    
    "start" {
        if (Install-Dependencies) {
            Start-Dashboard -Port $Port -Dev:$Dev
        } else {
            Write-ColorOutput "`n❌ Failed to install dependencies" -Color "Error"
            exit 1
        }
    }
    
    "stop" {
        Stop-Dashboard
    }
    
    "restart" {
        Stop-Dashboard
        Start-Sleep -Seconds 2
        Start-Dashboard -Port $Port -Dev:$Dev
    }
    
    "status" {
        Get-DashboardStatus
        Test-DashboardHealth
    }
    
    default {
        Write-ColorOutput "❌ Unknown action: $Action" -Color "Error"
        Show-Help
        exit 1
    }
}

Write-ColorOutput "`n🎉 Operation completed!" -Color "Success"
