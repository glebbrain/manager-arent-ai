# FreeRPA Enterprise Environment Manager
# Enhanced with enterprise environment management

param(
    [switch]$Development,
    [switch]$Staging,
    [switch]$Production,
    [switch]$Validate,
    [switch]$Reset,
    [switch]$Show,
    [string]$CustomEnv = "",
    [switch]$Help
)

Write-Host "🌍 FreeRPA Enterprise Environment Manager - Starting..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Continue"

# Environment configurations
$environments = @{
    Development = @{
        NODE_ENV = "development"
        PORT = "3000"
        DATABASE_URL = "file:./dev.db"
        REDIS_URL = "redis://localhost:6379"
        NEXTAUTH_URL = "http://localhost:3000"
        NEXTAUTH_SECRET = "development-secret-key"
        LOG_LEVEL = "debug"
        ENABLE_MONITORING = "false"
        ENABLE_ANALYTICS = "false"
    }
    Staging = @{
        NODE_ENV = "staging"
        PORT = "3000"
        DATABASE_URL = "postgresql://user:password@localhost:5432/freerpa_staging"
        REDIS_URL = "redis://localhost:6379"
        NEXTAUTH_URL = "https://staging.freerpa.com"
        NEXTAUTH_SECRET = "staging-secret-key"
        LOG_LEVEL = "info"
        ENABLE_MONITORING = "true"
        ENABLE_ANALYTICS = "true"
    }
    Production = @{
        NODE_ENV = "production"
        PORT = "3000"
        DATABASE_URL = "postgresql://user:password@localhost:5432/freerpa_production"
        REDIS_URL = "redis://localhost:6379"
        NEXTAUTH_URL = "https://freerpa.com"
        NEXTAUTH_SECRET = "production-secret-key"
        LOG_LEVEL = "error"
        ENABLE_MONITORING = "true"
        ENABLE_ANALYTICS = "true"
    }
}

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

# Function to show help
function Show-Help {
    Write-Host "`n🌍 FreeRPA Enterprise Environment Manager" -ForegroundColor Green
    Write-Host "`nUsage:" -ForegroundColor Yellow
    Write-Host "  .\.manager\env.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host "`nOptions:" -ForegroundColor Yellow
    Write-Host "  -Development     Set development environment" -ForegroundColor White
    Write-Host "  -Staging         Set staging environment" -ForegroundColor White
    Write-Host "  -Production      Set production environment" -ForegroundColor White
    Write-Host "  -CustomEnv       Set custom environment (specify name)" -ForegroundColor White
    Write-Host "  -Validate        Validate current environment" -ForegroundColor White
    Write-Host "  -Reset           Reset environment to defaults" -ForegroundColor White
    Write-Host "  -Show            Show current environment" -ForegroundColor White
    Write-Host "  -Help            Show this help message" -ForegroundColor White
    Write-Host "`nExamples:" -ForegroundColor Yellow
    Write-Host "  .\.manager\env.ps1 -Development" -ForegroundColor White
    Write-Host "  .\.manager\env.ps1 -Production -Validate" -ForegroundColor White
    Write-Host "  .\.manager\env.ps1 -Show" -ForegroundColor White
    Write-Host "  .\.manager\env.ps1 -Reset" -ForegroundColor White
}

# Function to set environment
function Set-Environment {
    param([string]$EnvironmentName)
    
    Write-Log "Setting environment to: $EnvironmentName" "INFO"
    
    if (-not $environments.ContainsKey($EnvironmentName)) {
        Write-Log "❌ Unknown environment: $EnvironmentName" "ERROR"
        return $false
    }
    
    $envConfig = $environments[$EnvironmentName]
    
    # Set environment variables
    foreach ($key in $envConfig.Keys) {
        $value = $envConfig[$key]
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Log "✅ Set $key = $value" "SUCCESS"
    }
    
    # Update .env file
    try {
        $envContent = @()
        foreach ($key in $envConfig.Keys) {
            $value = $envConfig[$key]
            $envContent += "$key=$value"
        }
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Log "✅ Updated .env file" "SUCCESS"
        
        return $true
    } catch {
        Write-Log "❌ Failed to update .env file: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to validate environment
function Test-Environment {
    Write-Log "Validating current environment..." "INFO"
    
    $requiredVars = @(
        "NODE_ENV",
        "PORT",
        "DATABASE_URL",
        "NEXTAUTH_URL",
        "NEXTAUTH_SECRET"
    )
    
    $missingVars = @()
    $invalidVars = @()
    
    foreach ($var in $requiredVars) {
        $value = [Environment]::GetEnvironmentVariable($var, "Process")
        
        if (-not $value) {
            $missingVars += $var
            Write-Log "❌ Missing required variable: $var" "ERROR"
        } else {
            Write-Log "✅ Found variable: $var" "SUCCESS"
            
            # Validate specific variables
            switch ($var) {
                "NODE_ENV" {
                    if ($value -notin @("development", "staging", "production")) {
                        $invalidVars += "$var (invalid value: $value)"
                        Write-Log "❌ Invalid NODE_ENV value: $value" "ERROR"
                    }
                }
                "PORT" {
                    if (-not ($value -match '^\d+$') -or [int]$value -lt 1 -or [int]$value -gt 65535) {
                        $invalidVars += "$var (invalid port: $value)"
                        Write-Log "❌ Invalid PORT value: $value" "ERROR"
                    }
                }
                "DATABASE_URL" {
                    if (-not $value.StartsWith("postgresql://") -and -not $value.StartsWith("file:")) {
                        $invalidVars += "$var (invalid format)"
                        Write-Log "❌ Invalid DATABASE_URL format" "ERROR"
                    }
                }
                "NEXTAUTH_URL" {
                    if (-not $value.StartsWith("http://") -and -not $value.StartsWith("https://")) {
                        $invalidVars += "$var (invalid format)"
                        Write-Log "❌ Invalid NEXTAUTH_URL format" "ERROR"
                    }
                }
            }
        }
    }
    
    # Summary
    if ($missingVars.Count -eq 0 -and $invalidVars.Count -eq 0) {
        Write-Log "✅ Environment validation passed" "SUCCESS"
        return $true
    } else {
        Write-Log "❌ Environment validation failed" "ERROR"
        Write-Log "Missing variables: $($missingVars -join ', ')" "ERROR"
        Write-Log "Invalid variables: $($invalidVars -join ', ')" "ERROR"
        return $false
    }
}

# Function to show current environment
function Show-CurrentEnvironment {
    Write-Host "`n🌍 Current Environment Configuration:" -ForegroundColor Green
    
    $envVars = @(
        "NODE_ENV",
        "PORT",
        "DATABASE_URL",
        "REDIS_URL",
        "NEXTAUTH_URL",
        "NEXTAUTH_SECRET",
        "LOG_LEVEL",
        "ENABLE_MONITORING",
        "ENABLE_ANALYTICS"
    )
    
    foreach ($var in $envVars) {
        $value = [Environment]::GetEnvironmentVariable($var, "Process")
        if ($value) {
            # Mask sensitive values
            $displayValue = if ($var -match "SECRET|PASSWORD|KEY") {
                "***masked***"
            } else {
                $value
            }
            Write-Host "  $var = $displayValue" -ForegroundColor White
        } else {
            Write-Host "  $var = (not set)" -ForegroundColor Yellow
        }
    }
    
    # Show .env file status
    if (Test-Path ".env") {
        Write-Host "`n📄 .env file: Present" -ForegroundColor Green
    } else {
        Write-Host "`n📄 .env file: Missing" -ForegroundColor Red
    }
}

# Function to reset environment
function Reset-Environment {
    Write-Log "Resetting environment to defaults..." "INFO"
    
    # Remove .env file if it exists
    if (Test-Path ".env") {
        Remove-Item ".env" -Force
        Write-Log "✅ Removed .env file" "SUCCESS"
    }
    
    # Clear environment variables
    $envVars = @(
        "NODE_ENV",
        "PORT",
        "DATABASE_URL",
        "REDIS_URL",
        "NEXTAUTH_URL",
        "NEXTAUTH_SECRET",
        "LOG_LEVEL",
        "ENABLE_MONITORING",
        "ENABLE_ANALYTICS"
    )
    
    foreach ($var in $envVars) {
        [Environment]::SetEnvironmentVariable($var, $null, "Process")
    }
    
    Write-Log "✅ Environment reset completed" "SUCCESS"
}

# Function to validate prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "INFO"
    
    # Check if we're in the right directory
    if (-not (Test-Path "package.json")) {
        Write-Log "❌ Not in FreeRPA project directory" "ERROR"
        return $false
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Node.js version: $nodeVersion" "SUCCESS"
        } else {
            Write-Log "❌ Node.js not found" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Node.js not found" "ERROR"
        return $false
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ npm version: $npmVersion" "SUCCESS"
        } else {
            Write-Log "❌ npm not found" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ npm not found" "ERROR"
        return $false
    }
    
    return $true
}

# Main execution
try {
    Write-Log "Starting FreeRPA Enterprise Environment Manager..." "INFO"
    
    # Show help if requested
    if ($Help) {
        Show-Help
        exit 0
    }
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Log "❌ Prerequisites check failed" "ERROR"
    exit 1
}

    # Determine action
    $action = "none"
    $environment = ""
    
    if ($Development) {
        $action = "set"
        $environment = "Development"
    } elseif ($Staging) {
        $action = "set"
        $environment = "Staging"
    } elseif ($Production) {
        $action = "set"
        $environment = "Production"
    } elseif ($CustomEnv) {
        $action = "set"
        $environment = $CustomEnv
    } elseif ($Validate) {
        $action = "validate"
    } elseif ($Show) {
        $action = "show"
    } elseif ($Reset) {
        $action = "reset"
    } else {
        Write-Log "No action specified. Use -Help for usage information." "WARNING"
        Show-Help
        exit 0
    }
    
    # Execute action
    switch ($action) {
        "set" {
            if (Set-Environment $environment) {
                Write-Log "✅ Environment set to: $environment" "SUCCESS"
                
                if ($Validate) {
                    Test-Environment
                }
            } else {
                Write-Log "❌ Failed to set environment" "ERROR"
                exit 1
            }
        }
        "validate" {
            Test-Environment
        }
        "show" {
            Show-CurrentEnvironment
        }
        "reset" {
            Reset-Environment
        }
    }
    
    Write-Log "✅ Environment management completed!" "SUCCESS"
    
} catch {
    Write-Log "❌ Environment management failed with error: $($_.Exception.Message)" "ERROR"
    exit 1
}