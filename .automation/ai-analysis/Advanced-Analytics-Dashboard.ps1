# Advanced Analytics Dashboard v2.9 - Management Script
# Real-time AI Performance Monitoring & Analytics

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "help", # help, start, stop, restart, status, install, test
    
    [Parameter(Mandatory=$false)]
    [string]$Port = "3001",
    
    [Parameter(Mandatory=$false)]
    [switch]$Development = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Production = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Background = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

# Configuration
$Config = @{
    DashboardPath = "advanced-analytics-dashboard"
    DefaultPort = 3001
    ProcessName = "node"
    LogFile = "logs/advanced-analytics-dashboard.log"
    Version = "2.9.0"
}

# Function to log messages
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    if ($Verbose -or $Level -eq "ERROR" -or $Level -eq "WARNING" -or $Level -eq "SUCCESS") {
        switch ($Level) {
            "ERROR" { Write-Host $logMessage -ForegroundColor Red }
            "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
            "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
            "INFO" { Write-Host $logMessage -ForegroundColor Cyan }
            default { Write-Host $logMessage -ForegroundColor White }
        }
    }
    
    # Log to file
    try {
        $logDir = Split-Path $Config.LogFile -Parent
        if (-not (Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        Add-Content -Path $Config.LogFile -Value $logMessage
    } catch {
        # Ignore logging errors
    }
}

# Function to show help
function Show-Help {
    Write-Host "🚀 Advanced Analytics Dashboard v2.9 - Management Script" -ForegroundColor Green
    Write-Host "Real-time AI Performance Monitoring & Analytics" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\Advanced-Analytics-Dashboard.ps1 -Action <action> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Cyan
    Write-Host "  help      Show this help message" -ForegroundColor White
    Write-Host "  start     Start the analytics dashboard" -ForegroundColor White
    Write-Host "  stop      Stop the analytics dashboard" -ForegroundColor White
    Write-Host "  restart   Restart the analytics dashboard" -ForegroundColor White
    Write-Host "  status    Show dashboard status" -ForegroundColor White
    Write-Host "  install   Install dependencies" -ForegroundColor White
    Write-Host "  test      Test dashboard functionality" -ForegroundColor White
    Write-Host "  deploy    Deploy dashboard to production" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Port <number>      Port to run on (default: 3001)" -ForegroundColor White
    Write-Host "  -Development        Run in development mode" -ForegroundColor White
    Write-Host "  -Production         Run in production mode" -ForegroundColor White
    Write-Host "  -Background         Run in background" -ForegroundColor White
    Write-Host "  -Verbose            Show detailed output" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\Advanced-Analytics-Dashboard.ps1 -Action start" -ForegroundColor White
    Write-Host "  .\Advanced-Analytics-Dashboard.ps1 -Action start -Port 8080 -Development" -ForegroundColor White
    Write-Host "  .\Advanced-Analytics-Dashboard.ps1 -Action status" -ForegroundColor White
    Write-Host "  .\Advanced-Analytics-Dashboard.ps1 -Action install" -ForegroundColor White
    Write-Host ""
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

# Function to check if dashboard is running
function Test-DashboardRunning {
    try {
        $processes = Get-Process -Name $Config.ProcessName -ErrorAction SilentlyContinue
        $dashboardProcess = $processes | Where-Object { $_.CommandLine -like "*advanced-analytics-dashboard*" }
        return $dashboardProcess -ne $null
    } catch {
        return $false
    }
}

# Function to get dashboard status
function Get-DashboardStatus {
    $isRunning = Test-DashboardRunning
    
    if ($isRunning) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method Get -TimeoutSec 5
            return @{
                Running = $true
                Status = "healthy"
                Version = $response.version
                Services = $response.services
                Timestamp = $response.timestamp
            }
        } catch {
            return @{
                Running = $true
                Status = "unhealthy"
                Error = $_.Exception.Message
            }
        }
    } else {
        return @{
            Running = $false
            Status = "stopped"
        }
    }
}

# Function to start dashboard
function Start-Dashboard {
    Write-Log "Starting Advanced Analytics Dashboard v2.9..." "INFO"
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Log "❌ Prerequisites check failed" "ERROR"
        return $false
    }
    
    # Check if already running
    if (Test-DashboardRunning) {
        Write-Log "⚠️ Dashboard is already running" "WARNING"
        return $true
    }
    
    # Check if dashboard directory exists
    if (-not (Test-Path $Config.DashboardPath)) {
        Write-Log "❌ Dashboard directory not found: $($Config.DashboardPath)" "ERROR"
        return $false
    }
    
    try {
        # Change to dashboard directory
        Push-Location $Config.DashboardPath
        
        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Log "Installing dependencies..." "INFO"
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Log "❌ Failed to install dependencies" "ERROR"
                Pop-Location
                return $false
            }
        }
        
        # Set environment variables
        $env:PORT = $Port
        if ($Development) {
            $env:NODE_ENV = "development"
        } elseif ($Production) {
            $env:NODE_ENV = "production"
        } else {
            $env:NODE_ENV = "production"
        }
        
        # Start dashboard
        if ($Background) {
            Write-Log "Starting dashboard in background..." "INFO"
            if ($Development) {
                Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
            } else {
                Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
            }
            
            # Wait a moment and check if started
            Start-Sleep -Seconds 3
            if (Test-DashboardRunning) {
                Write-Log "✅ Dashboard started successfully in background" "SUCCESS"
                Write-Log "🌐 Dashboard URL: http://localhost:$Port" "INFO"
                return $true
            } else {
                Write-Log "❌ Failed to start dashboard in background" "ERROR"
                return $false
            }
        } else {
            Write-Log "Starting dashboard..." "INFO"
            Write-Log "🌐 Dashboard URL: http://localhost:$Port" "INFO"
            Write-Log "Press Ctrl+C to stop" "INFO"
            
            if ($Development) {
                npm run dev
            } else {
                npm start
            }
        }
    } catch {
        Write-Log "❌ Error starting dashboard: $_" "ERROR"
        return $false
    } finally {
        Pop-Location
    }
}

# Function to stop dashboard
function Stop-Dashboard {
    Write-Log "Stopping Advanced Analytics Dashboard..." "INFO"
    
    try {
        $processes = Get-Process -Name $Config.ProcessName -ErrorAction SilentlyContinue
        $dashboardProcesses = $processes | Where-Object { $_.CommandLine -like "*advanced-analytics-dashboard*" }
        
        if ($dashboardProcesses) {
            foreach ($process in $dashboardProcesses) {
                Write-Log "Stopping process $($process.Id)..." "INFO"
                Stop-Process -Id $process.Id -Force
            }
            Write-Log "✅ Dashboard stopped successfully" "SUCCESS"
        } else {
            Write-Log "⚠️ Dashboard is not running" "WARNING"
        }
    } catch {
        Write-Log "❌ Error stopping dashboard: $_" "ERROR"
        return $false
    }
    
    return $true
}

# Function to restart dashboard
function Restart-Dashboard {
    Write-Log "Restarting Advanced Analytics Dashboard..." "INFO"
    
    Stop-Dashboard
    Start-Sleep -Seconds 2
    return Start-Dashboard
}

# Function to install dependencies
function Install-Dashboard {
    Write-Log "Installing Advanced Analytics Dashboard dependencies..." "INFO"
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Log "❌ Prerequisites check failed" "ERROR"
        return $false
    }
    
    # Check if dashboard directory exists
    if (-not (Test-Path $Config.DashboardPath)) {
        Write-Log "❌ Dashboard directory not found: $($Config.DashboardPath)" "ERROR"
        return $false
    }
    
    try {
        Push-Location $Config.DashboardPath
        
        Write-Log "Installing npm dependencies..." "INFO"
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Dependencies installed successfully" "SUCCESS"
            return $true
        } else {
            Write-Log "❌ Failed to install dependencies" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Error installing dependencies: $_" "ERROR"
        return $false
    } finally {
        Pop-Location
    }
}

# Function to test dashboard
function Test-Dashboard {
    Write-Log "Testing Advanced Analytics Dashboard..." "INFO"
    
    # Check if running
    $status = Get-DashboardStatus
    if (-not $status.Running) {
        Write-Log "❌ Dashboard is not running" "ERROR"
        return $false
    }
    
    try {
        # Test health endpoint
        Write-Log "Testing health endpoint..." "INFO"
        $healthResponse = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method Get -TimeoutSec 10
        
        if ($healthResponse.status -eq "healthy") {
            Write-Log "✅ Health check passed" "SUCCESS"
        } else {
            Write-Log "❌ Health check failed: $($healthResponse.status)" "ERROR"
            return $false
        }
        
        # Test API endpoints
        $endpoints = @(
            "/api/ai-performance/summary",
            "/api/ai-performance/models",
            "/api/ai-performance/alerts"
        )
        
        foreach ($endpoint in $endpoints) {
            Write-Log "Testing endpoint: $endpoint" "INFO"
            try {
                $response = Invoke-RestMethod -Uri "http://localhost:$Port$endpoint" -Method Get -TimeoutSec 5
                if ($response.success) {
                    Write-Log "✅ $endpoint - OK" "SUCCESS"
                } else {
                    Write-Log "❌ $endpoint - Failed: $($response.error)" "ERROR"
                    return $false
                }
            } catch {
                Write-Log "❌ $endpoint - Error: $($_.Exception.Message)" "ERROR"
                return $false
            }
        }
        
        Write-Log "✅ All tests passed" "SUCCESS"
        return $true
    } catch {
        Write-Log "❌ Error testing dashboard: $_" "ERROR"
        return $false
    }
}

# Function to deploy dashboard
function Deploy-Dashboard {
    Write-Log "Deploying Advanced Analytics Dashboard to production..." "INFO"
    
    # Install dependencies
    if (-not (Install-Dashboard)) {
        Write-Log "❌ Failed to install dependencies" "ERROR"
        return $false
    }
    
    # Start in production mode
    $Production = $true
    if (Start-Dashboard) {
        Write-Log "✅ Dashboard deployed successfully" "SUCCESS"
        Write-Log "🌐 Production URL: http://localhost:$Port" "INFO"
        return $true
    } else {
        Write-Log "❌ Failed to deploy dashboard" "ERROR"
        return $false
    }
}

# Main execution
Write-Log "🚀 Advanced Analytics Dashboard v2.9 - Management Script" "INFO"
Write-Log "Real-time AI Performance Monitoring & Analytics" "INFO"

switch ($Action.ToLower()) {
    "help" {
        Show-Help
    }
    "start" {
        if (Start-Dashboard) {
            Write-Log "✅ Dashboard started successfully" "SUCCESS"
        } else {
            Write-Log "❌ Failed to start dashboard" "ERROR"
            exit 1
        }
    }
    "stop" {
        if (Stop-Dashboard) {
            Write-Log "✅ Dashboard stopped successfully" "SUCCESS"
        } else {
            Write-Log "❌ Failed to stop dashboard" "ERROR"
            exit 1
        }
    }
    "restart" {
        if (Restart-Dashboard) {
            Write-Log "✅ Dashboard restarted successfully" "SUCCESS"
        } else {
            Write-Log "❌ Failed to restart dashboard" "ERROR"
            exit 1
        }
    }
    "status" {
        $status = Get-DashboardStatus
        Write-Host ""
        Write-Host "📊 Advanced Analytics Dashboard Status" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host "Running: $($status.Running)" -ForegroundColor $(if ($status.Running) { "Green" } else { "Red" })
        Write-Host "Status: $($status.Status)" -ForegroundColor $(if ($status.Status -eq "healthy") { "Green" } else { "Yellow" })
        
        if ($status.Version) {
            Write-Host "Version: $($status.Version)" -ForegroundColor Cyan
        }
        
        if ($status.Services) {
            Write-Host "Services:" -ForegroundColor Cyan
            foreach ($service in $status.Services.PSObject.Properties) {
                Write-Host "  $($service.Name): $($service.Value)" -ForegroundColor White
            }
        }
        
        if ($status.Error) {
            Write-Host "Error: $($status.Error)" -ForegroundColor Red
        }
        
        Write-Host ""
        if ($status.Running) {
            Write-Host "🌐 Dashboard URL: http://localhost:$Port" -ForegroundColor Yellow
            Write-Host "🔍 Health Check: http://localhost:$Port/health" -ForegroundColor Yellow
        }
    }
    "install" {
        if (Install-Dashboard) {
            Write-Log "✅ Installation completed successfully" "SUCCESS"
        } else {
            Write-Log "❌ Installation failed" "ERROR"
            exit 1
        }
    }
    "test" {
        if (Test-Dashboard) {
            Write-Log "✅ All tests passed" "SUCCESS"
        } else {
            Write-Log "❌ Tests failed" "ERROR"
            exit 1
        }
    }
    "deploy" {
        if (Deploy-Dashboard) {
            Write-Log "✅ Deployment completed successfully" "SUCCESS"
        } else {
            Write-Log "❌ Deployment failed" "ERROR"
            exit 1
        }
    }
    default {
        Write-Log "❌ Unknown action: $Action" "ERROR"
        Write-Log "Use -Action help to see available actions" "INFO"
        exit 1
    }
}
