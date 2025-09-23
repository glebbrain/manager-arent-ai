# API Gateway Enhanced v2.9 - Management Script
# Advanced Routing & Load Balancing

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "help", # help, start, stop, restart, status, install, test, config
    
    [Parameter(Mandatory=$false)]
    [string]$Port = "3000",
    
    [Parameter(Mandatory=$false)]
    [switch]$Development = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Production = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Cluster = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Background = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

# Configuration
$Config = @{
    GatewayPath = "api-gateway-enhanced"
    DefaultPort = 3000
    ProcessName = "node"
    LogFile = "logs/api-gateway-enhanced.log"
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
    Write-Host "🚀 API Gateway Enhanced v2.9 - Management Script" -ForegroundColor Green
    Write-Host "Advanced Routing & Load Balancing" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\API-Gateway-Enhanced.ps1 -Action <action> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Cyan
    Write-Host "  help      Show this help message" -ForegroundColor White
    Write-Host "  start     Start the API gateway" -ForegroundColor White
    Write-Host "  stop      Stop the API gateway" -ForegroundColor White
    Write-Host "  restart   Restart the API gateway" -ForegroundColor White
    Write-Host "  status    Show gateway status" -ForegroundColor White
    Write-Host "  install   Install dependencies" -ForegroundColor White
    Write-Host "  test      Test gateway functionality" -ForegroundColor White
    Write-Host "  config    Show configuration" -ForegroundColor White
    Write-Host "  deploy    Deploy gateway to production" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Port <number>      Port to run on (default: 3000)" -ForegroundColor White
    Write-Host "  -Development        Run in development mode" -ForegroundColor White
    Write-Host "  -Production         Run in production mode" -ForegroundColor White
    Write-Host "  -Cluster            Run in cluster mode" -ForegroundColor White
    Write-Host "  -Background         Run in background" -ForegroundColor White
    Write-Host "  -Verbose            Show detailed output" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\API-Gateway-Enhanced.ps1 -Action start" -ForegroundColor White
    Write-Host "  .\API-Gateway-Enhanced.ps1 -Action start -Port 8080 -Cluster" -ForegroundColor White
    Write-Host "  .\API-Gateway-Enhanced.ps1 -Action status" -ForegroundColor White
    Write-Host "  .\API-Gateway-Enhanced.ps1 -Action config" -ForegroundColor White
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

# Function to check if gateway is running
function Test-GatewayRunning {
    try {
        $processes = Get-Process -Name $Config.ProcessName -ErrorAction SilentlyContinue
        $gatewayProcess = $processes | Where-Object { $_.CommandLine -like "*api-gateway-enhanced*" }
        return $gatewayProcess -ne $null
    } catch {
        return $false
    }
}

# Function to get gateway status
function Get-GatewayStatus {
    $isRunning = Test-GatewayRunning
    
    if ($isRunning) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method Get -TimeoutSec 5
            return @{
                Running = $true
                Status = "healthy"
                Version = $response.version
                Services = $response.services
                Timestamp = $response.timestamp
                Uptime = $response.uptime
                Memory = $response.memory
                CPU = $response.cpu
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

# Function to start gateway
function Start-Gateway {
    Write-Log "Starting API Gateway Enhanced v2.9..." "INFO"
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Log "❌ Prerequisites check failed" "ERROR"
        return $false
    }
    
    # Check if already running
    if (Test-GatewayRunning) {
        Write-Log "⚠️ Gateway is already running" "WARNING"
        return $true
    }
    
    # Check if gateway directory exists
    if (-not (Test-Path $Config.GatewayPath)) {
        Write-Log "❌ Gateway directory not found: $($Config.GatewayPath)" "ERROR"
        return $false
    }
    
    try {
        # Change to gateway directory
        Push-Location $Config.GatewayPath
        
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
        
        if ($Cluster) {
            $env:CLUSTER_MODE = "true"
        }
        
        # Start gateway
        if ($Background) {
            Write-Log "Starting gateway in background..." "INFO"
            if ($Development) {
                Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
            } elseif ($Cluster) {
                Start-Process -FilePath "npm" -ArgumentList "run", "cluster" -WindowStyle Hidden
            } else {
                Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
            }
            
            # Wait a moment and check if started
            Start-Sleep -Seconds 3
            if (Test-GatewayRunning) {
                Write-Log "✅ Gateway started successfully in background" "SUCCESS"
                Write-Log "🌐 Gateway URL: http://localhost:$Port" "INFO"
                Write-Log "📊 Health Check: http://localhost:$Port/health" "INFO"
                Write-Log "📈 Metrics: http://localhost:$Port/metrics" "INFO"
                return $true
            } else {
                Write-Log "❌ Failed to start gateway in background" "ERROR"
                return $false
            }
        } else {
            Write-Log "Starting gateway..." "INFO"
            Write-Log "🌐 Gateway URL: http://localhost:$Port" "INFO"
            Write-Log "📊 Health Check: http://localhost:$Port/health" "INFO"
            Write-Log "📈 Metrics: http://localhost:$Port/metrics" "INFO"
            Write-Log "Press Ctrl+C to stop" "INFO"
            
            if ($Development) {
                npm run dev
            } elseif ($Cluster) {
                npm run cluster
            } else {
                npm start
            }
        }
    } catch {
        Write-Log "❌ Error starting gateway: $_" "ERROR"
        return $false
    } finally {
        Pop-Location
    }
}

# Function to stop gateway
function Stop-Gateway {
    Write-Log "Stopping API Gateway Enhanced..." "INFO"
    
    try {
        $processes = Get-Process -Name $Config.ProcessName -ErrorAction SilentlyContinue
        $gatewayProcesses = $processes | Where-Object { $_.CommandLine -like "*api-gateway-enhanced*" }
        
        if ($gatewayProcesses) {
            foreach ($process in $gatewayProcesses) {
                Write-Log "Stopping process $($process.Id)..." "INFO"
                Stop-Process -Id $process.Id -Force
            }
            Write-Log "✅ Gateway stopped successfully" "SUCCESS"
        } else {
            Write-Log "⚠️ Gateway is not running" "WARNING"
        }
    } catch {
        Write-Log "❌ Error stopping gateway: $_" "ERROR"
        return $false
    }
    
    return $true
}

# Function to restart gateway
function Restart-Gateway {
    Write-Log "Restarting API Gateway Enhanced..." "INFO"
    
    Stop-Gateway
    Start-Sleep -Seconds 2
    return Start-Gateway
}

# Function to install dependencies
function Install-Gateway {
    Write-Log "Installing API Gateway Enhanced dependencies..." "INFO"
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Log "❌ Prerequisites check failed" "ERROR"
        return $false
    }
    
    # Check if gateway directory exists
    if (-not (Test-Path $Config.GatewayPath)) {
        Write-Log "❌ Gateway directory not found: $($Config.GatewayPath)" "ERROR"
        return $false
    }
    
    try {
        Push-Location $Config.GatewayPath
        
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

# Function to test gateway
function Test-Gateway {
    Write-Log "Testing API Gateway Enhanced..." "INFO"
    
    # Check if running
    $status = Get-GatewayStatus
    if (-not $status.Running) {
        Write-Log "❌ Gateway is not running" "ERROR"
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
        
        # Test metrics endpoint
        Write-Log "Testing metrics endpoint..." "INFO"
        try {
            $metricsResponse = Invoke-RestMethod -Uri "http://localhost:$Port/metrics" -Method Get -TimeoutSec 5
            Write-Log "✅ Metrics endpoint - OK" "SUCCESS"
        } catch {
            Write-Log "❌ Metrics endpoint - Error: $($_.Exception.Message)" "ERROR"
            return $false
        }
        
        # Test Prometheus metrics endpoint
        Write-Log "Testing Prometheus metrics endpoint..." "INFO"
        try {
            $prometheusResponse = Invoke-WebRequest -Uri "http://localhost:$Port/metrics/prometheus" -Method Get -TimeoutSec 5
            if ($prometheusResponse.StatusCode -eq 200) {
                Write-Log "✅ Prometheus metrics endpoint - OK" "SUCCESS"
            } else {
                Write-Log "❌ Prometheus metrics endpoint - Failed: $($prometheusResponse.StatusCode)" "ERROR"
                return $false
            }
        } catch {
            Write-Log "❌ Prometheus metrics endpoint - Error: $($_.Exception.Message)" "ERROR"
            return $false
        }
        
        Write-Log "✅ All tests passed" "SUCCESS"
        return $true
    } catch {
        Write-Log "❌ Error testing gateway: $_" "ERROR"
        return $false
    }
}

# Function to show configuration
function Show-Configuration {
    Write-Host ""
    Write-Host "🔧 API Gateway Enhanced v2.9 Configuration" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host ""
    
    if (Test-Path "$($Config.GatewayPath)/config/gateway-config.json") {
        try {
            $config = Get-Content "$($Config.GatewayPath)/config/gateway-config.json" | ConvertFrom-Json
            
            Write-Host "Gateway Settings:" -ForegroundColor Cyan
            Write-Host "  Port: $($config.gateway.port)" -ForegroundColor White
            Write-Host "  Cluster Mode: $($config.gateway.clusterMode)" -ForegroundColor White
            Write-Host "  Max Request Size: $($config.gateway.maxRequestSize)" -ForegroundColor White
            Write-Host "  Rate Limit: $($config.gateway.rateLimit.max) requests per $($config.gateway.rateLimit.windowMs/1000) seconds" -ForegroundColor White
            Write-Host ""
            
            Write-Host "Services:" -ForegroundColor Cyan
            foreach ($service in $config.services.PSObject.Properties) {
                $serviceConfig = $service.Value
                Write-Host "  $($service.Name):" -ForegroundColor White
                Write-Host "    Instances: $($serviceConfig.instances.Count)" -ForegroundColor Gray
                Write-Host "    Timeout: $($serviceConfig.timeout)ms" -ForegroundColor Gray
                Write-Host "    Retries: $($serviceConfig.retries)" -ForegroundColor Gray
                Write-Host "    Load Balancing: $($serviceConfig.loadBalancing.algorithm)" -ForegroundColor Gray
                Write-Host "    Circuit Breaker: $($serviceConfig.circuitBreaker.errorThresholdPercentage)% error threshold" -ForegroundColor Gray
            }
            Write-Host ""
            
            Write-Host "Load Balancing:" -ForegroundColor Cyan
            Write-Host "  Health Check Interval: $($config.loadBalancing.healthCheck.interval)ms" -ForegroundColor White
            Write-Host "  Health Check Timeout: $($config.loadBalancing.healthCheck.timeout)ms" -ForegroundColor White
            Write-Host "  Available Algorithms:" -ForegroundColor White
            foreach ($algorithm in $config.loadBalancing.algorithms.PSObject.Properties) {
                Write-Host "    - $($algorithm.Name): $($algorithm.Value.description)" -ForegroundColor Gray
            }
            Write-Host ""
            
            Write-Host "Security:" -ForegroundColor Cyan
            Write-Host "  CORS Enabled: $($config.security.cors.enabled)" -ForegroundColor White
            Write-Host "  Rate Limiting: $($config.security.authentication.rateLimiting.enabled)" -ForegroundColor White
            Write-Host "  Helmet: $($config.security.helmet.enabled)" -ForegroundColor White
            Write-Host ""
            
            Write-Host "Monitoring:" -ForegroundColor Cyan
            Write-Host "  Metrics: $($config.monitoring.metrics.enabled)" -ForegroundColor White
            Write-Host "  Prometheus: $($config.gateway.monitoring.enablePrometheus)" -ForegroundColor White
            Write-Host "  Log Level: $($config.gateway.monitoring.logLevel)" -ForegroundColor White
            Write-Host ""
            
            Write-Host "Clustering:" -ForegroundColor Cyan
            Write-Host "  Enabled: $($config.clustering.enabled)" -ForegroundColor White
            Write-Host "  Workers: $($config.clustering.workers)" -ForegroundColor White
            Write-Host "  Graceful Shutdown: $($config.clustering.gracefulShutdown)" -ForegroundColor White
            
        } catch {
            Write-Log "❌ Error reading configuration: $_" "ERROR"
        }
    } else {
        Write-Log "❌ Configuration file not found: $($Config.GatewayPath)/config/gateway-config.json" "ERROR"
    }
}

# Function to deploy gateway
function Deploy-Gateway {
    Write-Log "Deploying API Gateway Enhanced to production..." "INFO"
    
    # Install dependencies
    if (-not (Install-Gateway)) {
        Write-Log "❌ Failed to install dependencies" "ERROR"
        return $false
    }
    
    # Start in production cluster mode
    $Production = $true
    $Cluster = $true
    if (Start-Gateway) {
        Write-Log "✅ Gateway deployed successfully" "SUCCESS"
        Write-Log "🌐 Production URL: http://localhost:$Port" "INFO"
        Write-Log "📊 Health Check: http://localhost:$Port/health" "INFO"
        Write-Log "📈 Metrics: http://localhost:$Port/metrics" "INFO"
        return $true
    } else {
        Write-Log "❌ Failed to deploy gateway" "ERROR"
        return $false
    }
}

# Main execution
Write-Log "🚀 API Gateway Enhanced v2.9 - Management Script" "INFO"
Write-Log "Advanced Routing & Load Balancing" "INFO"

switch ($Action.ToLower()) {
    "help" {
        Show-Help
    }
    "start" {
        if (Start-Gateway) {
            Write-Log "✅ Gateway started successfully" "SUCCESS"
        } else {
            Write-Log "❌ Failed to start gateway" "ERROR"
            exit 1
        }
    }
    "stop" {
        if (Stop-Gateway) {
            Write-Log "✅ Gateway stopped successfully" "SUCCESS"
        } else {
            Write-Log "❌ Failed to stop gateway" "ERROR"
            exit 1
        }
    }
    "restart" {
        if (Restart-Gateway) {
            Write-Log "✅ Gateway restarted successfully" "SUCCESS"
        } else {
            Write-Log "❌ Failed to restart gateway" "ERROR"
            exit 1
        }
    }
    "status" {
        $status = Get-GatewayStatus
        Write-Host ""
        Write-Host "📊 API Gateway Enhanced Status" -ForegroundColor Green
        Write-Host "==============================" -ForegroundColor Green
        Write-Host "Running: $($status.Running)" -ForegroundColor $(if ($status.Running) { "Green" } else { "Red" })
        Write-Host "Status: $($status.Status)" -ForegroundColor $(if ($status.Status -eq "healthy") { "Green" } else { "Yellow" })
        
        if ($status.Version) {
            Write-Host "Version: $($status.Version)" -ForegroundColor Cyan
        }
        
        if ($status.Uptime) {
            Write-Host "Uptime: $([math]::Round($status.Uptime, 2)) seconds" -ForegroundColor Cyan
        }
        
        if ($status.Memory) {
            Write-Host "Memory Usage:" -ForegroundColor Cyan
            Write-Host "  RSS: $([math]::Round($status.Memory.rss / 1024 / 1024, 2)) MB" -ForegroundColor White
            Write-Host "  Heap Used: $([math]::Round($status.Memory.heapUsed / 1024 / 1024, 2)) MB" -ForegroundColor White
            Write-Host "  Heap Total: $([math]::Round($status.Memory.heapTotal / 1024 / 1024, 2)) MB" -ForegroundColor White
        }
        
        if ($status.Services) {
            Write-Host "Services:" -ForegroundColor Cyan
            foreach ($service in $status.Services.PSObject.Properties) {
                Write-Host "  $($service.Name): $($service.Value.healthyInstances)/$($service.Value.totalInstances) healthy" -ForegroundColor White
            }
        }
        
        if ($status.Error) {
            Write-Host "Error: $($status.Error)" -ForegroundColor Red
        }
        
        Write-Host ""
        if ($status.Running) {
            Write-Host "🌐 Gateway URL: http://localhost:$Port" -ForegroundColor Yellow
            Write-Host "📊 Health Check: http://localhost:$Port/health" -ForegroundColor Yellow
            Write-Host "📈 Metrics: http://localhost:$Port/metrics" -ForegroundColor Yellow
        }
    }
    "install" {
        if (Install-Gateway) {
            Write-Log "✅ Installation completed successfully" "SUCCESS"
        } else {
            Write-Log "❌ Installation failed" "ERROR"
            exit 1
        }
    }
    "test" {
        if (Test-Gateway) {
            Write-Log "✅ All tests passed" "SUCCESS"
        } else {
            Write-Log "❌ Tests failed" "ERROR"
            exit 1
        }
    }
    "config" {
        Show-Configuration
    }
    "deploy" {
        if (Deploy-Gateway) {
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
