# Advanced Analytics Dashboard v2.9 - Startup Script
# Real-time AI Performance Monitoring

param(
    [string]$Port = "3001",
    [switch]$Development = $false,
    [switch]$Production = $false,
    [switch]$Background = $false,
    [switch]$Install = $false,
    [switch]$Help = $false
)

# Function to display help
function Show-Help {
    Write-Host "🚀 Advanced Analytics Dashboard v2.9 - Startup Script" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\start-dashboard.ps1 [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Port <number>      Port to run the dashboard on (default: 3001)" -ForegroundColor White
    Write-Host "  -Development        Run in development mode with auto-reload" -ForegroundColor White
    Write-Host "  -Production         Run in production mode" -ForegroundColor White
    Write-Host "  -Background         Run in background" -ForegroundColor White
    Write-Host "  -Install            Install dependencies before starting" -ForegroundColor White
    Write-Host "  -Help               Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\start-dashboard.ps1                    # Start on default port 3001" -ForegroundColor White
    Write-Host "  .\start-dashboard.ps1 -Port 8080         # Start on port 8080" -ForegroundColor White
    Write-Host "  .\start-dashboard.ps1 -Development       # Start in dev mode" -ForegroundColor White
    Write-Host "  .\start-dashboard.ps1 -Production        # Start in production mode" -ForegroundColor White
    Write-Host "  .\start-dashboard.ps1 -Install           # Install deps and start" -ForegroundColor White
    Write-Host ""
}

# Function to log messages
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        "INFO" { Write-Host $logMessage -ForegroundColor Cyan }
        default { Write-Host $logMessage -ForegroundColor White }
    }
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "INFO"
    
    $prerequisites = @{
        "Node.js" = @{ Command = "node --version"; Required = $true }
        "npm" = @{ Command = "npm --version"; Required = $true }
    }
    
    $allGood = $true
    
    foreach ($tool in $prerequisites.Keys) {
        try {
            $version = Invoke-Expression $prerequisites[$tool].Command 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ $tool is installed: $version" "SUCCESS"
            } else {
                if ($prerequisites[$tool].Required) {
                    Write-Log "❌ $tool is required but not installed" "ERROR"
                    $allGood = $false
                } else {
                    Write-Log "⚠️ $tool is optional but not installed" "WARNING"
                }
            }
        } catch {
            if ($prerequisites[$tool].Required) {
                Write-Log "❌ $tool is required but not installed" "ERROR"
                $allGood = $false
            } else {
                Write-Log "⚠️ $tool is optional but not installed" "WARNING"
            }
        }
    }
    
    return $allGood
}

# Function to install dependencies
function Install-Dependencies {
    Write-Log "Installing dependencies..." "INFO"
    
    try {
        if (Test-Path "package.json") {
            Write-Log "Running npm install..." "INFO"
            npm install
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Dependencies installed successfully" "SUCCESS"
                return $true
            } else {
                Write-Log "❌ Failed to install dependencies" "ERROR"
                return $false
            }
        } else {
            Write-Log "❌ package.json not found" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Error installing dependencies: $_" "ERROR"
        return $false
    }
}

# Function to start the dashboard
function Start-Dashboard {
    param(
        [string]$Mode = "production"
    )
    
    Write-Log "Starting Advanced Analytics Dashboard v2.9..." "INFO"
    Write-Log "Mode: $Mode" "INFO"
    Write-Log "Port: $Port" "INFO"
    
    # Set environment variables
    $env:PORT = $Port
    $env:NODE_ENV = $Mode
    
    try {
        if ($Mode -eq "development") {
            Write-Log "Starting in development mode with nodemon..." "INFO"
            if ($Background) {
                Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
                Write-Log "✅ Dashboard started in background on port $Port" "SUCCESS"
            } else {
                npm run dev
            }
        } else {
            Write-Log "Starting in production mode..." "INFO"
            if ($Background) {
                Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
                Write-Log "✅ Dashboard started in background on port $Port" "SUCCESS"
            } else {
                npm start
            }
        }
    } catch {
        Write-Log "❌ Error starting dashboard: $_" "ERROR"
        exit 1
    }
}

# Function to check if port is available
function Test-Port {
    param([int]$PortNumber)
    
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $PortNumber)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

# Function to display startup information
function Show-StartupInfo {
    Write-Host ""
    Write-Host "🚀 Advanced Analytics Dashboard v2.9" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Real-time AI Performance Monitoring" -ForegroundColor Cyan
    Write-Host "🌐 Dashboard URL: http://localhost:$Port" -ForegroundColor Yellow
    Write-Host "🔍 Health Check: http://localhost:$Port/health" -ForegroundColor Yellow
    Write-Host "📡 WebSocket: ws://localhost:$Port" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Features:" -ForegroundColor Cyan
    Write-Host "  • Real-time AI model performance monitoring" -ForegroundColor White
    Write-Host "  • Interactive dashboards and charts" -ForegroundColor White
    Write-Host "  • Multi-model support" -ForegroundColor White
    Write-Host "  • Alert system with configurable thresholds" -ForegroundColor White
    Write-Host "  • WebSocket integration for live updates" -ForegroundColor White
    Write-Host "  • RESTful API for data access" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the dashboard" -ForegroundColor Yellow
    Write-Host ""
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Write-Log "🚀 Advanced Analytics Dashboard v2.9 - Startup Script" "INFO"
Write-Log "Real-time AI Performance Monitoring" "INFO"
Write-Log "=====================================" "INFO"

# Check prerequisites
if (-not (Test-Prerequisites)) {
    Write-Log "❌ Prerequisites check failed. Please install required tools." "ERROR"
    exit 1
}

# Check if port is available
if (-not (Test-Port $Port)) {
    Write-Log "❌ Port $Port is already in use. Please choose a different port." "ERROR"
    exit 1
}

# Install dependencies if requested
if ($Install) {
    if (-not (Install-Dependencies)) {
        Write-Log "❌ Failed to install dependencies" "ERROR"
        exit 1
    }
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Log "⚠️ Dependencies not found. Installing..." "WARNING"
    if (-not (Install-Dependencies)) {
        Write-Log "❌ Failed to install dependencies" "ERROR"
        exit 1
    }
}

# Determine mode
$mode = "production"
if ($Development) {
    $mode = "development"
}

# Display startup information
Show-StartupInfo

# Start the dashboard
Start-Dashboard -Mode $mode
