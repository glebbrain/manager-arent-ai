# FreeRPA Enterprise Project Startup Script
# Enhanced with enterprise startup features

param(
    [switch]$Production,
    [switch]$Development,
    [switch]$Staging,
    [switch]$Monitor,
    [switch]$Background,
    [string]$Port = "3000",
    [string]$Environment = "development"
)

Write-Host "🚀 FreeRPA Enterprise Project Startup - Starting..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to log messages
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default { Write-Host $logMessage -ForegroundColor White }
    }
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "INFO"
    
    $prerequisites = @{
        "Node.js" = @{ Command = "node --version"; Required = $true }
        "npm" = @{ Command = "npm --version"; Required = $true }
        "Git" = @{ Command = "git --version"; Required = $true }
    }
    
    foreach ($tool in $prerequisites.Keys) {
        try {
            $version = Invoke-Expression $prerequisites[$tool].Command 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ $tool is installed: $version" "SUCCESS"
            } else {
                if ($prerequisites[$tool].Required) {
                    Write-Log "❌ $tool is required but not installed" "ERROR"
                    return $false
                }
            }
        } catch {
            if ($prerequisites[$tool].Required) {
                Write-Log "❌ $tool is required but not installed" "ERROR"
                return $false
            }
        }
    }
    
    return $true
}

# Function to setup environment
function Set-Environment {
    Write-Log "Setting up environment..." "INFO"
    
    # Determine environment
    if ($Production) {
        $env:NODE_ENV = "production"
        $env:PORT = $Port
        Write-Log "✅ Production environment configured" "SUCCESS"
    } elseif ($Staging) {
        $env:NODE_ENV = "staging"
        $env:PORT = $Port
        Write-Log "✅ Staging environment configured" "SUCCESS"
    } else {
        $env:NODE_ENV = "development"
        $env:PORT = $Port
        Write-Log "✅ Development environment configured" "SUCCESS"
    }
    
    # Set additional environment variables
    $env:HOSTNAME = "localhost"
    $env:VERCEL_URL = "localhost:$Port"
    
    # Check for .env file
    if (Test-Path ".env") {
        Write-Log "✅ Environment file found" "SUCCESS"
    } else {
        Write-Log "⚠️ .env file not found, using defaults" "WARNING"
    }
}

# Function to check dependencies
function Test-Dependencies {
    Write-Log "Checking dependencies..." "INFO"
    
    if (-not (Test-Path "node_modules")) {
        Write-Log "❌ Dependencies not installed. Run 'npm install' first." "ERROR"
        return $false
    }
    
    if (-not (Test-Path "package.json")) {
        Write-Log "❌ package.json not found" "ERROR"
        return $false
    }
    
    Write-Log "✅ Dependencies are installed" "SUCCESS"
    return $true
}

# Function to start database services
function Start-DatabaseServices {
    Write-Log "Starting database services..." "INFO"
    
    # Check if Docker is available
    if (Get-Command "docker" -ErrorAction SilentlyContinue) {
        try {
            # Start PostgreSQL if not running
            $postgresRunning = docker ps --filter "name=freerpa-postgres" --format "table {{.Names}}" | Select-String "freerpa-postgres"
            if (-not $postgresRunning) {
                Write-Log "Starting PostgreSQL container..." "INFO"
                docker run --name freerpa-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=freerpa -p 5432:5432 -d postgres:15
                Start-Sleep -Seconds 5
                Write-Log "✅ PostgreSQL started" "SUCCESS"
            } else {
                Write-Log "✅ PostgreSQL already running" "SUCCESS"
            }
            
            # Start Redis if not running
            $redisRunning = docker ps --filter "name=freerpa-redis" --format "table {{.Names}}" | Select-String "freerpa-redis"
            if (-not $redisRunning) {
                Write-Log "Starting Redis container..." "INFO"
                docker run --name freerpa-redis -p 6379:6379 -d redis:7-alpine
                Start-Sleep -Seconds 3
                Write-Log "✅ Redis started" "SUCCESS"
            } else {
                Write-Log "✅ Redis already running" "SUCCESS"
            }
            
        } catch {
            Write-Log "⚠️ Failed to start database services: $($_.Exception.Message)" "WARNING"
        }
    } else {
        Write-Log "⚠️ Docker not available, skipping database services" "WARNING"
    }
}

# Function to run database migrations
function Invoke-DatabaseMigrations {
    Write-Log "Running database migrations..." "INFO"
    
    try {
        # Generate Prisma client
        Write-Log "Generating Prisma client..." "INFO"
        npx prisma generate
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Prisma client generated" "SUCCESS"
        } else {
            Write-Log "❌ Failed to generate Prisma client" "ERROR"
            return $false
        }
        
        # Run migrations
        Write-Log "Running database migrations..." "INFO"
        npx prisma migrate dev --name startup
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Database migrations completed" "SUCCESS"
        } else {
            Write-Log "❌ Database migrations failed" "ERROR"
            return $false
        }
        
        return $true
        
    } catch {
        Write-Log "❌ Error running database migrations: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to start monitoring services
function Start-MonitoringServices {
    if (-not $Monitor) { return }
    
    Write-Log "Starting monitoring services..." "INFO"
    
    if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
        try {
            if (Test-Path "docker-compose.monitoring.yml") {
                Write-Log "Starting monitoring stack..." "INFO"
                docker-compose -f docker-compose.monitoring.yml up -d
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "✅ Monitoring services started" "SUCCESS"
                    Write-Log "📊 Grafana: http://localhost:3001" "INFO"
                    Write-Log "📈 Prometheus: http://localhost:9090" "INFO"
                    Write-Log "📋 Loki: http://localhost:3100" "INFO"
                } else {
                    Write-Log "❌ Failed to start monitoring services" "ERROR"
                }
            } else {
                Write-Log "⚠️ Monitoring configuration not found" "WARNING"
            }
        } catch {
            Write-Log "⚠️ Failed to start monitoring services: $($_.Exception.Message)" "WARNING"
        }
    } else {
        Write-Log "⚠️ Docker Compose not available, skipping monitoring" "WARNING"
    }
}

# Function to start the application
function Start-Application {
    Write-Log "Starting FreeRPA application..." "INFO"
    
    $startCommand = if ($Production) {
        "npm run start"
    } else {
        "npm run dev"
    }
    
    Write-Log "Running command: $startCommand" "INFO"
    
    if ($Background) {
        Write-Log "Starting application in background..." "INFO"
        Start-Process -FilePath "npm" -ArgumentList "run", $(if ($Production) { "start" } else { "dev" }) -WindowStyle Hidden
        Write-Log "✅ Application started in background" "SUCCESS"
    } else {
        Write-Log "Starting application in foreground..." "INFO"
        Write-Host "`n🌐 Application will be available at: http://localhost:$Port" -ForegroundColor Green
        Write-Host "📚 API Documentation: http://localhost:$Port/api/docs" -ForegroundColor Blue
        Write-Host "🔍 Health Check: http://localhost:$Port/api/health" -ForegroundColor Blue
        Write-Host "`nPress Ctrl+C to stop the application`n" -ForegroundColor Yellow
        
        # Start the application
        Invoke-Expression $startCommand
    }
}

# Function to display startup information
function Show-StartupInfo {
    Write-Host "`n🎉 FreeRPA Enterprise Platform Started!" -ForegroundColor Green
    Write-Host "`n📋 Application Information:" -ForegroundColor Yellow
    Write-Host "  🌐 URL: http://localhost:$Port" -ForegroundColor White
    Write-Host "  📚 API Docs: http://localhost:$Port/api/docs" -ForegroundColor White
    Write-Host "  🔍 Health: http://localhost:$Port/api/health" -ForegroundColor White
    Write-Host "  📊 Metrics: http://localhost:$Port/api/metrics" -ForegroundColor White
    
    if ($Monitor) {
        Write-Host "`n📊 Monitoring Services:" -ForegroundColor Cyan
        Write-Host "  📈 Grafana: http://localhost:3001" -ForegroundColor White
        Write-Host "  📊 Prometheus: http://localhost:9090" -ForegroundColor White
        Write-Host "  📋 Loki: http://localhost:3100" -ForegroundColor White
    }
    
    Write-Host "`n🔧 Environment: $env:NODE_ENV" -ForegroundColor Blue
    Write-Host "🚀 Mode: $(if ($Production) { 'Production' } elseif ($Staging) { 'Staging' } else { 'Development' })" -ForegroundColor Blue
    
    Write-Host "`n📚 Quick Commands:" -ForegroundColor Yellow
    Write-Host "  Check Status: .\.automation\project-management\Check-ProjectStatus.ps1" -ForegroundColor White
    Write-Host "  Run Tests: .\.automation\testing\run_tests.ps1" -ForegroundColor White
    Write-Host "  Validate: .\.automation\validation\validate_project.ps1" -ForegroundColor White
}

# Main execution
try {
    Write-Log "Starting FreeRPA Enterprise Project Startup..." "INFO"
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Log "❌ Prerequisites check failed" "ERROR"
        exit 1
    }
    
    # Setup environment
    Set-Environment
    
    # Check dependencies
    if (-not (Test-Dependencies)) {
        Write-Log "❌ Dependencies check failed" "ERROR"
        exit 1
    }
    
    # Start database services
    Start-DatabaseServices
    
    # Run database migrations
    if (-not (Invoke-DatabaseMigrations)) {
        Write-Log "❌ Database setup failed" "ERROR"
        exit 1
    }
    
    # Start monitoring services
    Start-MonitoringServices
    
    # Show startup information
    Show-StartupInfo
    
    # Start the application
    Start-Application
    
} catch {
    Write-Log "❌ Startup failed with error: $($_.Exception.Message)" "ERROR"
    exit 1
}