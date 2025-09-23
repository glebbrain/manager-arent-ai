# Start Platform Script for ManagerAgentAI v2.5
# Cross-platform startup script for the Universal Automation Platform

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "api-gateway", "event-bus", "microservices", "dashboard", "notifications", "forecasting", "benchmarking", "data-export", "deadline-prediction", "sprint-planning", "task-distribution", "task-dependency", "status-updates")]
    [string]$Service = "all",
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 3000,
    
    [Parameter(Mandatory=$false)]
    [switch]$Production = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Docker = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Start-Platform"
$Version = "2.5.0"
$LogFile = "platform-start.log"

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

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "DEBUG")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    if ($Verbose -or $Level -eq "ERROR") {
        Write-ColorOutput $logEntry -Color $Level.ToLower()
    }
    
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

function Show-Header {
    Write-ColorOutput "🚀 ManagerAgentAI Universal Automation Platform v2.5" -Color Header
    Write-ColorOutput "=================================================" -Color Header
    Write-ColorOutput "Starting Universal Automation Platform..." -Color Info
    Write-ColorOutput ""
}

function Test-PlatformEnvironment {
    Write-ColorOutput "Testing platform environment..." -Color Info
    Write-Log "Testing platform environment" "INFO"
    
    $environmentOK = $true
    
    # Test PowerShell
    try {
        $psVersion = $PSVersionTable.PSVersion
        Write-ColorOutput "✅ PowerShell: $psVersion" -Color Success
        Write-Log "PowerShell version: $psVersion" "INFO"
    } catch {
        Write-ColorOutput "❌ PowerShell test failed" -Color Error
        Write-Log "PowerShell test failed: $($_.Exception.Message)" "ERROR"
        $environmentOK = $false
    }
    
    # Test Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Node.js: $nodeVersion" -Color Success
            Write-Log "Node.js version: $nodeVersion" "INFO"
        } else {
            Write-ColorOutput "❌ Node.js not found" -Color Error
            Write-Log "Node.js not found" "ERROR"
            $environmentOK = $false
        }
    } catch {
        Write-ColorOutput "❌ Node.js test failed" -Color Error
        Write-Log "Node.js test failed: $($_.Exception.Message)" "ERROR"
        $environmentOK = $false
    }
    
    # Test Python (optional for AI features)
    try {
        $pythonVersion = python --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Python: $pythonVersion" -Color Success
            Write-Log "Python version: $pythonVersion" "INFO"
        } else {
            $pythonVersion = python3 --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ Python3: $pythonVersion" -Color Success
                Write-Log "Python3 version: $pythonVersion" "INFO"
            } else {
                Write-ColorOutput "⚠️ Python not found (AI features may be limited)" -Color Warning
                Write-Log "Python not found - AI features may be limited" "WARN"
            }
        }
    } catch {
        Write-ColorOutput "⚠️ Python test failed (AI features may be limited)" -Color Warning
        Write-Log "Python test failed: $($_.Exception.Message)" "WARN"
    }
    
    return $environmentOK
}

function Start-APIGateway {
    param([int]$Port = 3000)
    
    Write-ColorOutput "Starting API Gateway on port $Port..." -Color Info
    Write-Log "Starting API Gateway on port: $Port" "INFO"
    
    try {
        if (Test-Path "api-gateway/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "api-gateway/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ API Gateway started on port $Port" -Color Success
            Write-Log "API Gateway started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ API Gateway server not found" -Color Error
            Write-Log "API Gateway server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start API Gateway" -Color Error
        Write-Log "Failed to start API Gateway: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-EventBus {
    param([int]$Port = 3001)
    
    Write-ColorOutput "Starting Event Bus on port $Port..." -Color Info
    Write-Log "Starting Event Bus on port: $Port" "INFO"
    
    try {
        if (Test-Path "event-bus/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "event-bus/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Event Bus started on port $Port" -Color Success
            Write-Log "Event Bus started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Event Bus server not found" -Color Error
            Write-Log "Event Bus server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Event Bus" -Color Error
        Write-Log "Failed to start Event Bus: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-Microservices {
    param([int]$Port = 3002)
    
    Write-ColorOutput "Starting Microservices on port $Port..." -Color Info
    Write-Log "Starting Microservices on port: $Port" "INFO"
    
    try {
        if (Test-Path "microservices/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "microservices/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Microservices started on port $Port" -Color Success
            Write-Log "Microservices started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Microservices server not found" -Color Error
            Write-Log "Microservices server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Microservices" -Color Error
        Write-Log "Failed to start Microservices: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-Dashboard {
    param([int]$Port = 3003)
    
    Write-ColorOutput "Starting Dashboard on port $Port..." -Color Info
    Write-Log "Starting Dashboard on port: $Port" "INFO"
    
    try {
        if (Test-Path "dashboard/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "dashboard/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Dashboard started on port $Port" -Color Success
            Write-Log "Dashboard started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Dashboard server not found" -Color Error
            Write-Log "Dashboard server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Dashboard" -Color Error
        Write-Log "Failed to start Dashboard: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-SmartNotifications {
    param([int]$Port = 3004)
    
    Write-ColorOutput "Starting Smart Notifications on port $Port..." -Color Info
    Write-Log "Starting Smart Notifications on port: $Port" "INFO"
    
    try {
        if (Test-Path "smart-notifications/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "smart-notifications/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Smart Notifications started on port $Port" -Color Success
            Write-Log "Smart Notifications started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Smart Notifications server not found" -Color Error
            Write-Log "Smart Notifications server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Smart Notifications" -Color Error
        Write-Log "Failed to start Smart Notifications: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-Forecasting {
    param([int]$Port = 3005)
    
    Write-ColorOutput "Starting Forecasting on port $Port..." -Color Info
    Write-Log "Starting Forecasting on port: $Port" "INFO"
    
    try {
        if (Test-Path "forecasting/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "forecasting/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Forecasting started on port $Port" -Color Success
            Write-Log "Forecasting started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Forecasting server not found" -Color Error
            Write-Log "Forecasting server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Forecasting" -Color Error
        Write-Log "Failed to start Forecasting: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-Benchmarking {
    param([int]$Port = 3006)
    
    Write-ColorOutput "Starting Benchmarking on port $Port..." -Color Info
    Write-Log "Starting Benchmarking on port: $Port" "INFO"
    
    try {
        if (Test-Path "benchmarking/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "benchmarking/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Benchmarking started on port $Port" -Color Success
            Write-Log "Benchmarking started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Benchmarking server not found" -Color Error
            Write-Log "Benchmarking server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Benchmarking" -Color Error
        Write-Log "Failed to start Benchmarking: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-DataExport {
    param([int]$Port = 3007)
    
    Write-ColorOutput "Starting Data Export on port $Port..." -Color Info
    Write-Log "Starting Data Export on port: $Port" "INFO"
    
    try {
        if (Test-Path "data-export/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "data-export/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Data Export started on port $Port" -Color Success
            Write-Log "Data Export started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Data Export server not found" -Color Error
            Write-Log "Data Export server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Data Export" -Color Error
        Write-Log "Failed to start Data Export: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-DeadlinePrediction {
    param([int]$Port = 3008)
    
    Write-ColorOutput "Starting Deadline Prediction on port $Port..." -Color Info
    Write-Log "Starting Deadline Prediction on port: $Port" "INFO"
    
    try {
        if (Test-Path "deadline-prediction/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "deadline-prediction/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Deadline Prediction started on port $Port" -Color Success
            Write-Log "Deadline Prediction started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Deadline Prediction server not found" -Color Error
            Write-Log "Deadline Prediction server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Deadline Prediction" -Color Error
        Write-Log "Failed to start Deadline Prediction: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-SprintPlanning {
    param([int]$Port = 3009)
    
    Write-ColorOutput "Starting Sprint Planning on port $Port..." -Color Info
    Write-Log "Starting Sprint Planning on port: $Port" "INFO"
    
    try {
        if (Test-Path "sprint-planning/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "sprint-planning/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Sprint Planning started on port $Port" -Color Success
            Write-Log "Sprint Planning started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Sprint Planning server not found" -Color Error
            Write-Log "Sprint Planning server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Sprint Planning" -Color Error
        Write-Log "Failed to start Sprint Planning: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-TaskDistribution {
    param([int]$Port = 3010)
    
    Write-ColorOutput "Starting Task Distribution on port $Port..." -Color Info
    Write-Log "Starting Task Distribution on port: $Port" "INFO"
    
    try {
        if (Test-Path "task-distribution/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "task-distribution/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Task Distribution started on port $Port" -Color Success
            Write-Log "Task Distribution started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Task Distribution server not found" -Color Error
            Write-Log "Task Distribution server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Task Distribution" -Color Error
        Write-Log "Failed to start Task Distribution: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-TaskDependencyManagement {
    param([int]$Port = 3011)
    
    Write-ColorOutput "Starting Task Dependency Management on port $Port..." -Color Info
    Write-Log "Starting Task Dependency Management on port: $Port" "INFO"
    
    try {
        if (Test-Path "task-dependency-management/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "task-dependency-management/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Task Dependency Management started on port $Port" -Color Success
            Write-Log "Task Dependency Management started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Task Dependency Management server not found" -Color Error
            Write-Log "Task Dependency Management server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Task Dependency Management" -Color Error
        Write-Log "Failed to start Task Dependency Management: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-AutomaticStatusUpdates {
    param([int]$Port = 3012)
    
    Write-ColorOutput "Starting Automatic Status Updates on port $Port..." -Color Info
    Write-Log "Starting Automatic Status Updates on port: $Port" "INFO"
    
    try {
        if (Test-Path "automatic-status-updates/server.js") {
            $env:PORT = $Port
            Start-Process -FilePath "node" -ArgumentList "automatic-status-updates/server.js" -NoNewWindow -PassThru
            Write-ColorOutput "✅ Automatic Status Updates started on port $Port" -Color Success
            Write-Log "Automatic Status Updates started successfully on port: $Port" "INFO"
            return $true
        } else {
            Write-ColorOutput "❌ Automatic Status Updates server not found" -Color Error
            Write-Log "Automatic Status Updates server not found" "ERROR"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to start Automatic Status Updates" -Color Error
        Write-Log "Failed to start Automatic Status Updates: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-AllServices {
    Write-ColorOutput "Starting all ManagerAgentAI services..." -Color Info
    Write-Log "Starting all services" "INFO"
    
    $services = @(
        @{ Name = "API Gateway"; Function = { Start-APIGateway -Port 3000 } },
        @{ Name = "Event Bus"; Function = { Start-EventBus -Port 3001 } },
        @{ Name = "Microservices"; Function = { Start-Microservices -Port 3002 } },
        @{ Name = "Dashboard"; Function = { Start-Dashboard -Port 3003 } },
        @{ Name = "Smart Notifications"; Function = { Start-SmartNotifications -Port 3004 } },
        @{ Name = "Forecasting"; Function = { Start-Forecasting -Port 3005 } },
        @{ Name = "Benchmarking"; Function = { Start-Benchmarking -Port 3006 } },
        @{ Name = "Data Export"; Function = { Start-DataExport -Port 3007 } },
        @{ Name = "Deadline Prediction"; Function = { Start-DeadlinePrediction -Port 3008 } },
        @{ Name = "Sprint Planning"; Function = { Start-SprintPlanning -Port 3009 } },
        @{ Name = "Task Distribution"; Function = { Start-TaskDistribution -Port 3010 } },
        @{ Name = "Task Dependency Management"; Function = { Start-TaskDependencyManagement -Port 3011 } },
        @{ Name = "Automatic Status Updates"; Function = { Start-AutomaticStatusUpdates -Port 3012 } }
    )
    
    $startedServices = 0
    $totalServices = $services.Count
    
    foreach ($service in $services) {
        Write-ColorOutput "Starting $($service.Name)..." -Color Info
        if (& $service.Function) {
            $startedServices++
            Start-Sleep -Seconds 2  # Give each service time to start
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Service Startup Summary:" -Color Header
    Write-ColorOutput "=======================" -Color Header
    Write-ColorOutput "Total Services: $totalServices" -Color Info
    Write-ColorOutput "Started: $startedServices" -Color Success
    Write-ColorOutput "Failed: $($totalServices - $startedServices)" -Color Error
    Write-ColorOutput "Success Rate: $([math]::Round(($startedServices / $totalServices) * 100, 2))%" -Color Info
    
    if ($startedServices -eq $totalServices) {
        Write-ColorOutput "🎉 All services started successfully!" -Color Success
        Write-Log "All services started successfully" "INFO"
    } else {
        Write-ColorOutput "⚠️ Some services failed to start" -Color Warning
        Write-Log "Some services failed to start" "WARN"
    }
    
    return $startedServices -eq $totalServices
}

function Show-Usage {
    Write-ColorOutput "Usage: .\start-platform.ps1 -Service <service> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Services:" -Color Info
    Write-ColorOutput "  all                    - Start all services" -Color Info
    Write-ColorOutput "  api-gateway           - Start API Gateway only" -Color Info
    Write-ColorOutput "  event-bus             - Start Event Bus only" -Color Info
    Write-ColorOutput "  microservices         - Start Microservices only" -Color Info
    Write-ColorOutput "  dashboard             - Start Dashboard only" -Color Info
    Write-ColorOutput "  notifications         - Start Smart Notifications only" -Color Info
    Write-ColorOutput "  forecasting           - Start Forecasting only" -Color Info
    Write-ColorOutput "  benchmarking          - Start Benchmarking only" -Color Info
    Write-ColorOutput "  data-export           - Start Data Export only" -Color Info
    Write-ColorOutput "  deadline-prediction   - Start Deadline Prediction only" -Color Info
    Write-ColorOutput "  sprint-planning       - Start Sprint Planning only" -Color Info
    Write-ColorOutput "  task-distribution     - Start Task Distribution only" -Color Info
    Write-ColorOutput "  task-dependency       - Start Task Dependency Management only" -Color Info
    Write-ColorOutput "  status-updates        - Start Automatic Status Updates only" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Port       - Starting port number (default: 3000)" -Color Info
    Write-ColorOutput "  -Production - Run in production mode" -Color Info
    Write-ColorOutput "  -Docker     - Run in Docker mode" -Color Info
    Write-ColorOutput "  -Verbose    - Show detailed output" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\start-platform.ps1 -Service all" -Color Info
    Write-ColorOutput "  .\start-platform.ps1 -Service api-gateway -Port 3000" -Color Info
    Write-ColorOutput "  .\start-platform.ps1 -Service all -Production -Verbose" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    # Test platform environment
    if (-not (Test-PlatformEnvironment)) {
        Write-ColorOutput "❌ Platform environment test failed" -Color Error
        exit 1
    }
    
    # Set environment variables
    if ($Production) {
        $env:NODE_ENV = "production"
        Write-Log "Running in production mode" "INFO"
    } else {
        $env:NODE_ENV = "development"
        Write-Log "Running in development mode" "INFO"
    }
    
    if ($Docker) {
        $env:DOCKER_MODE = "true"
        Write-Log "Running in Docker mode" "INFO"
    }
    
    # Start requested service(s)
    switch ($Service) {
        "all" {
            Start-AllServices
        }
        "api-gateway" {
            Start-APIGateway -Port $Port
        }
        "event-bus" {
            Start-EventBus -Port $Port
        }
        "microservices" {
            Start-Microservices -Port $Port
        }
        "dashboard" {
            Start-Dashboard -Port $Port
        }
        "notifications" {
            Start-SmartNotifications -Port $Port
        }
        "forecasting" {
            Start-Forecasting -Port $Port
        }
        "benchmarking" {
            Start-Benchmarking -Port $Port
        }
        "data-export" {
            Start-DataExport -Port $Port
        }
        "deadline-prediction" {
            Start-DeadlinePrediction -Port $Port
        }
        "sprint-planning" {
            Start-SprintPlanning -Port $Port
        }
        "task-distribution" {
            Start-TaskDistribution -Port $Port
        }
        "task-dependency" {
            Start-TaskDependencyManagement -Port $Port
        }
        "status-updates" {
            Start-AutomaticStatusUpdates -Port $Port
        }
        default {
            Write-ColorOutput "❌ Unknown service: $Service" -Color Error
            Show-Usage
            exit 1
        }
    }
    
    Write-Log "Platform startup completed for service: $Service" "INFO"
}

# Run main function
Main
