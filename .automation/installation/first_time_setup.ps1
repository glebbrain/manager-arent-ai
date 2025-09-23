# FreeRPA Enterprise First-Time Setup Script
# Enhanced with comprehensive setup process and enterprise features

param(
    [switch]$Enterprise,
    [switch]$Production,
    [switch]$Development,
    [string]$Environment = "development"
)

Write-Host "🚀 FreeRPA Enterprise Setup - Starting..." -ForegroundColor Green

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
        "Docker" = @{ Command = "docker --version"; Required = $false }
        "Docker Compose" = @{ Command = "docker-compose --version"; Required = $false }
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
                } else {
                    Write-Log "⚠️ $tool is optional and not installed" "WARNING"
                }
            }
        } catch {
            if ($prerequisites[$tool].Required) {
                Write-Log "❌ $tool is required but not installed" "ERROR"
                return $false
            } else {
                Write-Log "⚠️ $tool is optional and not installed" "WARNING"
            }
        }
    }
    
    return $true
}

# Function to setup environment
function Set-Environment {
    Write-Log "Setting up environment..." "INFO"
    
    # Create .env file if it doesn't exist
    if (-not (Test-Path ".env")) {
        Write-Log "Creating .env file from template..." "INFO"
        Copy-Item "env.example" ".env"
        Write-Log "✅ .env file created" "SUCCESS"
    } else {
        Write-Log "✅ .env file already exists" "SUCCESS"
    }
    
    # Set environment variables
    if ($Enterprise) {
        $env:NODE_ENV = "production"
        $env:ENTERPRISE_MODE = "true"
        Write-Log "✅ Enterprise mode enabled" "SUCCESS"
    } elseif ($Production) {
        $env:NODE_ENV = "production"
        Write-Log "✅ Production mode enabled" "SUCCESS"
    } else {
        $env:NODE_ENV = "development"
        Write-Log "✅ Development mode enabled" "SUCCESS"
    }
}

# Function to install dependencies
function Install-Dependencies {
    Write-Log "Installing dependencies..." "INFO"
    
    try {
        # Install Node.js dependencies
        Write-Log "Installing Node.js dependencies..." "INFO"
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Node.js dependencies installed successfully" "SUCCESS"
        } else {
            Write-Log "❌ Failed to install Node.js dependencies" "ERROR"
            return $false
        }
        
        # Install mobile dependencies if mobile directory exists
        if (Test-Path "mobile") {
            Write-Log "Installing mobile dependencies..." "INFO"
            Set-Location "mobile"
            npm install
            Set-Location ".."
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Mobile dependencies installed successfully" "SUCCESS"
            } else {
                Write-Log "❌ Failed to install mobile dependencies" "ERROR"
                return $false
            }
        }
        
        return $true
    } catch {
        Write-Log "❌ Error installing dependencies: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to setup database
function Set-Database {
    Write-Log "Setting up database..." "INFO"
    
    try {
        # Generate Prisma client
        Write-Log "Generating Prisma client..." "INFO"
        npx prisma generate
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Prisma client generated successfully" "SUCCESS"
        } else {
            Write-Log "❌ Failed to generate Prisma client" "ERROR"
            return $false
        }
        
        # Run database migrations
        Write-Log "Running database migrations..." "INFO"
        npx prisma migrate dev --name init
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Database migrations completed successfully" "SUCCESS"
        } else {
            Write-Log "❌ Failed to run database migrations" "ERROR"
            return $false
        }
        
        return $true
    } catch {
        Write-Log "❌ Error setting up database: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to setup Docker services
function Set-DockerServices {
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        Write-Log "⚠️ Docker not available, skipping Docker setup" "WARNING"
        return $true
    }
    
    Write-Log "Setting up Docker services..." "INFO"
    
    try {
        # Start core services
        Write-Log "Starting core Docker services..." "INFO"
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Core Docker services started successfully" "SUCCESS"
        } else {
            Write-Log "❌ Failed to start core Docker services" "ERROR"
            return $false
        }
        
        # Start monitoring services if enterprise mode
        if ($Enterprise) {
            Write-Log "Starting monitoring services..." "INFO"
            docker-compose -f docker-compose.monitoring.yml up -d
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Monitoring services started successfully" "SUCCESS"
            } else {
                Write-Log "❌ Failed to start monitoring services" "ERROR"
                return $false
            }
        }
        
        return $true
    } catch {
        Write-Log "❌ Error setting up Docker services: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to validate setup
function Test-Setup {
    Write-Log "Validating setup..." "INFO"
    
    $validationChecks = @(
        @{ Name = "Node.js Dependencies"; Path = "node_modules"; Type = "Directory" },
        @{ Name = "Environment File"; Path = ".env"; Type = "File" },
        @{ Name = "Prisma Client"; Path = "node_modules/.prisma"; Type = "Directory" },
        @{ Name = "Package.json"; Path = "package.json"; Type = "File" }
    )
    
    $allValid = $true
    
    foreach ($check in $validationChecks) {
        if (Test-Path $check.Path) {
            Write-Log "✅ $($check.Name) is present" "SUCCESS"
        } else {
            Write-Log "❌ $($check.Name) is missing" "ERROR"
            $allValid = $false
        }
    }
    
    return $allValid
}

# Function to display next steps
function Show-NextSteps {
    Write-Host "`n🎉 Setup completed successfully!" -ForegroundColor Green
    Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Start the development server: npm run dev" -ForegroundColor White
    Write-Host "2. Open http://localhost:3000 in your browser" -ForegroundColor White
    Write-Host "3. Check project status: .\.automation\project-management\Check-ProjectStatus.ps1" -ForegroundColor White
    
    if ($Enterprise) {
        Write-Host "`n🏢 Enterprise Features:" -ForegroundColor Cyan
        Write-Host "- Monitoring: http://localhost:3001 (Grafana)" -ForegroundColor White
        Write-Host "- Metrics: http://localhost:9090 (Prometheus)" -ForegroundColor White
        Write-Host "- Logs: http://localhost:3100 (Loki)" -ForegroundColor White
    }
    
    Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
    Write-Host "- README.md: Project overview and quick start" -ForegroundColor White
    Write-Host "- docs/: Comprehensive documentation" -ForegroundColor White
    Write-Host "- .automation/: Automation scripts and tools" -ForegroundColor White
}

# Main execution
try {
    Write-Log "Starting FreeRPA Enterprise Setup..." "INFO"
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Log "❌ Prerequisites check failed" "ERROR"
        exit 1
    }
    
    # Setup environment
    Set-Environment
    
    # Install dependencies
    if (-not (Install-Dependencies)) {
        Write-Log "❌ Dependency installation failed" "ERROR"
        exit 1
    }
    
    # Setup database
    if (-not (Set-Database)) {
        Write-Log "❌ Database setup failed" "ERROR"
        exit 1
    }
    
    # Setup Docker services
    if (-not (Set-DockerServices)) {
        Write-Log "❌ Docker services setup failed" "ERROR"
        exit 1
    }
    
    # Validate setup
    if (-not (Test-Setup)) {
        Write-Log "❌ Setup validation failed" "ERROR"
        exit 1
    }
    
    # Show next steps
    Show-NextSteps
    
    Write-Log "✅ FreeRPA Enterprise Setup completed successfully!" "SUCCESS"
    
} catch {
    Write-Log "❌ Setup failed with error: $($_.Exception.Message)" "ERROR"
    exit 1
}