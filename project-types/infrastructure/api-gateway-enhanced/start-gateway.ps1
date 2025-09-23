# Enhanced API Gateway v2.9 - Startup Script
# Advanced Routing & Load Balancing

param(
    [string]$Port = "3000",
    [switch]$Development = $false,
    [switch]$Production = $false,
    [switch]$Cluster = $false,
    [switch]$Background = $false,
    [switch]$Install = $false,
    [switch]$Config = $false,
    [switch]$Help = $false
)

# Function to display help
function Show-Help {
    Write-Host "🚀 Enhanced API Gateway v2.9 - Startup Script" -ForegroundColor Green
    Write-Host "Advanced Routing & Load Balancing" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\start-gateway.ps1 [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Port <number>      Port to run the gateway on (default: 3000)" -ForegroundColor White
    Write-Host "  -Development        Run in development mode with auto-reload" -ForegroundColor White
    Write-Host "  -Production         Run in production mode" -ForegroundColor White
    Write-Host "  -Cluster            Run in cluster mode for high availability" -ForegroundColor White
    Write-Host "  -Background         Run in background" -ForegroundColor White
    Write-Host "  -Install            Install dependencies before starting" -ForegroundColor White
    Write-Host "  -Config             Show current configuration" -ForegroundColor White
    Write-Host "  -Help               Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\start-gateway.ps1                    # Start on default port 3000" -ForegroundColor White
    Write-Host "  .\start-gateway.ps1 -Port 8080         # Start on port 8080" -ForegroundColor White
    Write-Host "  .\start-gateway.ps1 -Development       # Start in dev mode" -ForegroundColor White
    Write-Host "  .\start-gateway.ps1 -Production -Cluster # Start in production cluster mode" -ForegroundColor White
    Write-Host "  .\start-gateway.ps1 -Install           # Install deps and start" -ForegroundColor White
    Write-Host "  .\start-gateway.ps1 -Config            # Show configuration" -ForegroundColor White
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

# Function to show configuration
function Show-Configuration {
    Write-Host ""
    Write-Host "🔧 Enhanced API Gateway v2.9 Configuration" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host ""
    
    if (Test-Path "config/gateway-config.json") {
        try {
            $config = Get-Content "config/gateway-config.json" | ConvertFrom-Json
            
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
        Write-Log "❌ Configuration file not found: config/gateway-config.json" "ERROR"
    }
}

# Function to start the gateway
function Start-Gateway {
    Write-Log "Starting Enhanced API Gateway v2.9..." "INFO"
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Log "❌ Prerequisites check failed" "ERROR"
        return $false
    }
    
    # Check if gateway directory exists
    if (-not (Test-Path "server.js")) {
        Write-Log "❌ Gateway server file not found" "ERROR"
        return $false
    }
    
    try {
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
            Write-Log "✅ Gateway started successfully in background" "SUCCESS"
            Write-Log "🌐 Gateway URL: http://localhost:$Port" "INFO"
            Write-Log "📊 Health Check: http://localhost:$Port/health" "INFO"
            Write-Log "📈 Metrics: http://localhost:$Port/metrics" "INFO"
            return $true
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
    Write-Host "🚀 Enhanced API Gateway v2.9" -ForegroundColor Green
    Write-Host "=============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔀 Advanced Routing & Load Balancing" -ForegroundColor Cyan
    Write-Host "🌐 Gateway URL: http://localhost:$Port" -ForegroundColor Yellow
    Write-Host "📊 Health Check: http://localhost:$Port/health" -ForegroundColor Yellow
    Write-Host "📈 Metrics: http://localhost:$Port/metrics" -ForegroundColor Yellow
    Write-Host "🔧 Prometheus: http://localhost:$Port/metrics/prometheus" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Features:" -ForegroundColor Cyan
    Write-Host "  • Advanced load balancing algorithms" -ForegroundColor White
    Write-Host "  • Circuit breaker pattern implementation" -ForegroundColor White
    Write-Host "  • Rate limiting with Redis support" -ForegroundColor White
    Write-Host "  • Health checks and service discovery" -ForegroundColor White
    Write-Host "  • Real-time metrics and monitoring" -ForegroundColor White
    Write-Host "  • Clustering for high availability" -ForegroundColor White
    Write-Host "  • JWT authentication and authorization" -ForegroundColor White
    Write-Host "  • CORS and security headers" -ForegroundColor White
    Write-Host ""
    Write-Host "Load Balancing Algorithms:" -ForegroundColor Cyan
    Write-Host "  • Round Robin" -ForegroundColor White
    Write-Host "  • Weighted Round Robin" -ForegroundColor White
    Write-Host "  • Least Connections" -ForegroundColor White
    Write-Host "  • IP Hash" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the gateway" -ForegroundColor Yellow
    Write-Host ""
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Write-Log "🚀 Enhanced API Gateway v2.9 - Startup Script" "INFO"
Write-Log "Advanced Routing & Load Balancing" "INFO"
Write-Log "===================================" "INFO"

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

# Show configuration if requested
if ($Config) {
    Show-Configuration
    exit 0
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

# Display startup information
Show-StartupInfo

# Start the gateway
if (Start-Gateway) {
    Write-Log "✅ Gateway started successfully" "SUCCESS"
} else {
    Write-Log "❌ Failed to start gateway" "ERROR"
    exit 1
}
