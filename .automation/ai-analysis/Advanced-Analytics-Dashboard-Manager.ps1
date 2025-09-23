# Advanced Analytics Dashboard Manager v2.9
# Real-time AI Performance Monitoring & Analytics

param(
    [string]$Action = "start",
    [string]$Port = "3001",
    [switch]$Install,
    [switch]$Dev,
    [switch]$Docker,
    [switch]$Status,
    [switch]$Health,
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
    Write-ColorOutput "`n🚀 Advanced Analytics Dashboard Manager v2.9" -Color "Header"
    Write-ColorOutput "Real-time AI Performance Monitoring & Analytics" -Color "Info"
    Write-ColorOutput "=================================================" -Color "Info"
}

function Show-Help {
    Show-Header
    Write-ColorOutput "`nUsage: .\Advanced-Analytics-Dashboard-Manager.ps1 [options]" -Color "Info"
    Write-ColorOutput "`nOptions:" -Color "Info"
    Write-ColorOutput "  -Action <action>     Action to perform (start, stop, restart, status)" -Color "Info"
    Write-ColorOutput "  -Port <port>         Port to run on (default: 3001)" -Color "Info"
    Write-ColorOutput "  -Install             Install dependencies" -Color "Info"
    Write-ColorOutput "  -Dev                 Start in development mode" -Color "Info"
    Write-ColorOutput "  -Docker              Use Docker deployment" -Color "Info"
    Write-ColorOutput "  -Status              Check dashboard status" -Color "Info"
    Write-ColorOutput "  -Health              Check dashboard health" -Color "Info"
    Write-ColorOutput "  -Help                Show this help message" -Color "Info"
    Write-ColorOutput "`nExamples:" -Color "Info"
    Write-ColorOutput "  .\Advanced-Analytics-Dashboard-Manager.ps1 -Install" -Color "Info"
    Write-ColorOutput "  .\Advanced-Analytics-Dashboard-Manager.ps1 -Action start -Port 3001" -Color "Info"
    Write-ColorOutput "  .\Advanced-Analytics-Dashboard-Manager.ps1 -Docker" -Color "Info"
    Write-ColorOutput "  .\Advanced-Analytics-Dashboard-Manager.ps1 -Status" -Color "Info"
}

function Test-Prerequisites {
    Write-ColorOutput "`n🔍 Checking prerequisites..." -Color "Info"
    
    # Check if dashboard directory exists
    $dashboardPath = "..\..\advanced-analytics-dashboard-v2.9"
    if (-not (Test-Path $dashboardPath)) {
        Write-ColorOutput "❌ Dashboard directory not found: $dashboardPath" -Color "Error"
        return $false
    }
    
    Write-ColorOutput "✅ Dashboard directory found" -Color "Success"
    
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
    
    return $true
}

function Install-Dashboard {
    Write-ColorOutput "`n📦 Installing Advanced Analytics Dashboard..." -Color "Info"
    
    if (-not (Test-Prerequisites)) {
        return $false
    }
    
    $dashboardPath = "..\..\advanced-analytics-dashboard-v2.9"
    
    try {
        Push-Location $dashboardPath
        
        # Install dependencies
        Write-ColorOutput "Installing Node.js dependencies..." -Color "Info"
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Dependencies installed successfully" -Color "Success"
        } else {
            Write-ColorOutput "❌ Failed to install dependencies" -Color "Error"
            return $false
        }
        
        # Check if Docker is available
        try {
            docker --version 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ Docker found - Docker deployment available" -Color "Success"
            }
        }
        catch {
            Write-ColorOutput "ℹ️ Docker not found - Docker deployment not available" -Color "Info"
        }
        
        Pop-Location
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error installing dashboard: $_" -Color "Error"
        Pop-Location
        return $false
    }
}

function Start-Dashboard {
    param(
        [string]$Port = "3001",
        [switch]$Dev,
        [switch]$Docker
    )
    
    Write-ColorOutput "`n🚀 Starting Advanced Analytics Dashboard..." -Color "Info"
    
    $dashboardPath = "..\..\advanced-analytics-dashboard-v2.9"
    
    if (-not (Test-Path $dashboardPath)) {
        Write-ColorOutput "❌ Dashboard directory not found: $dashboardPath" -Color "Error"
        return $false
    }
    
    try {
        Push-Location $dashboardPath
        
        if ($Docker) {
            Write-ColorOutput "🐳 Starting with Docker..." -Color "Info"
            
            # Check if Docker is running
            try {
                docker ps 2>$null | Out-Null
                if ($LASTEXITCODE -ne 0) {
                    Write-ColorOutput "❌ Docker is not running" -Color "Error"
                    return $false
                }
            }
            catch {
                Write-ColorOutput "❌ Docker is not available" -Color "Error"
                return $false
            }
            
            # Build and start with Docker Compose
            docker-compose up -d --build
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ Dashboard started with Docker" -Color "Success"
                Write-ColorOutput "🔗 Dashboard URL: http://localhost:$Port" -Color "Info"
            } else {
                Write-ColorOutput "❌ Failed to start dashboard with Docker" -Color "Error"
                return $false
            }
        } else {
            Write-ColorOutput "🔧 Starting with Node.js..." -Color "Info"
            
            # Set environment variables
            $env:PORT = $Port
            $env:NODE_ENV = if ($Dev) { "development" } else { "production" }
            
            if ($Dev) {
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
                $response = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -Method GET -TimeoutSec 5
                if ($response.status -eq "healthy") {
                    Write-ColorOutput "✅ Dashboard started successfully" -Color "Success"
                    Write-ColorOutput "🔗 Dashboard URL: http://localhost:$Port" -Color "Info"
                } else {
                    Write-ColorOutput "❌ Dashboard health check failed" -Color "Error"
                    return $false
                }
            }
            catch {
                Write-ColorOutput "❌ Cannot connect to dashboard: $_" -Color "Error"
                return $false
            }
        }
        
        Pop-Location
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error starting dashboard: $_" -Color "Error"
        Pop-Location
        return $false
    }
}

function Stop-Dashboard {
    param([switch]$Docker)
    
    Write-ColorOutput "`n🛑 Stopping Advanced Analytics Dashboard..." -Color "Info"
    
    $dashboardPath = "..\..\advanced-analytics-dashboard-v2.9"
    
    try {
        Push-Location $dashboardPath
        
        if ($Docker) {
            Write-ColorOutput "🐳 Stopping Docker containers..." -Color "Info"
            docker-compose down
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ Docker containers stopped" -Color "Success"
            } else {
                Write-ColorOutput "❌ Failed to stop Docker containers" -Color "Error"
            }
        } else {
            Write-ColorOutput "🔧 Stopping Node.js processes..." -Color "Info"
            
            # Find and kill Node.js processes running the dashboard
            $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
                $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*advanced-analytics-dashboard*"
            }
            
            if ($processes) {
                $processes | Stop-Process -Force
                Write-ColorOutput "✅ Dashboard processes stopped" -Color "Success"
            } else {
                Write-ColorOutput "ℹ️ No dashboard processes found" -Color "Info"
            }
        }
        
        Pop-Location
    }
    catch {
        Write-ColorOutput "❌ Error stopping dashboard: $_" -Color "Error"
        Pop-Location
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
        
        # Check Docker containers
        try {
            $containers = docker ps -a --filter "name=advanced-analytics-dashboard" --format "table {{.Names}}\t{{.Status}}" 2>$null
            if ($containers -and $containers.Count -gt 1) {
                Write-ColorOutput "`n🐳 Docker Containers:" -Color "Info"
                Write-ColorOutput $containers -Color "Info"
            }
        }
        catch {
            # Docker not available or not running
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

# Set default port if not specified
if (-not $env:PORT) {
    $env:PORT = $Port
}

switch ($Action.ToLower()) {
    "install" {
        if (Install-Dashboard) {
            Write-ColorOutput "`n✅ Installation completed successfully!" -Color "Success"
            Write-ColorOutput "Run '.\Advanced-Analytics-Dashboard-Manager.ps1 -Action start' to start the dashboard" -Color "Info"
        } else {
            Write-ColorOutput "`n❌ Installation failed!" -Color "Error"
            exit 1
        }
    }
    
    "start" {
        if (Start-Dashboard -Port $env:PORT -Dev:$Dev -Docker:$Docker) {
            Write-ColorOutput "`n✅ Dashboard started successfully!" -Color "Success"
        } else {
            Write-ColorOutput "`n❌ Failed to start dashboard!" -Color "Error"
            exit 1
        }
    }
    
    "stop" {
        Stop-Dashboard -Docker:$Docker
    }
    
    "restart" {
        Stop-Dashboard -Docker:$Docker
        Start-Sleep -Seconds 2
        Start-Dashboard -Port $env:PORT -Dev:$Dev -Docker:$Docker
    }
    
    "status" {
        Get-DashboardStatus
    }
    
    "health" {
        Test-DashboardHealth
    }
    
    default {
        Write-ColorOutput "❌ Unknown action: $Action" -Color "Error"
        Show-Help
        exit 1
    }
}

Write-ColorOutput "`n🎉 Operation completed!" -Color "Success"
