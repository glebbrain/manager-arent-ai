# Backend Testing Script - IdealCompany
# Comprehensive testing for Node.js/TypeScript backend API

param(
    [string]$TestType = "all",
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$Verbose,
    [switch]$Integration,
    [string]$Environment = "test"
)

Write-Host "🔧 Backend Testing - IdealCompany" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Set working directory to backend
$BackendPath = "src/backend"
if (-not (Test-Path $BackendPath)) {
    Write-Error "Backend directory not found: $BackendPath"
    exit 1
}

Set-Location $BackendPath

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found in backend directory"
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
}

# Set environment
$env:NODE_ENV = $Environment

# Build test command based on parameters
$TestCommand = "npm test"

if ($Coverage) {
    $TestCommand += " -- --coverage"
}

if ($Watch) {
    $TestCommand += " -- --watch"
} else {
    $TestCommand += " -- --watchAll=false"
}

if ($Verbose) {
    $TestCommand += " -- --verbose"
}

# Add test path patterns based on test type
switch ($TestType.ToLower()) {
    "controllers" {
        $TestCommand += " -- --testPathPattern=controllers"
    }
    "services" {
        $TestCommand += " -- --testPathPattern=services"
    }
    "middleware" {
        $TestCommand += " -- --testPathPattern=middleware"
    }
    "routes" {
        $TestCommand += " -- --testPathPattern=routes"
    }
    "utils" {
        $TestCommand += " -- --testPathPattern=utils"
    }
    "models" {
        $TestCommand += " -- --testPathPattern=models"
    }
    "unit" {
        $TestCommand += " -- --testPathPattern=__tests__"
    }
    "all" {
        # Run all tests
    }
    default {
        Write-Warning "Unknown test type: $TestType. Running all tests."
    }
}

Write-Host "🚀 Running backend tests..." -ForegroundColor Green
Write-Host "Command: $TestCommand" -ForegroundColor Gray

# Execute tests
Invoke-Expression $TestCommand
$TestExitCode = $LASTEXITCODE

# Generate coverage report if requested
if ($Coverage -and $TestExitCode -eq 0) {
    Write-Host "📊 Generating coverage report..." -ForegroundColor Yellow
    
    # Check if coverage directory exists
    if (Test-Path "coverage") {
        Write-Host "✅ Coverage report generated in coverage/ directory" -ForegroundColor Green
        
        # Open coverage report if on Windows
        if ($IsWindows -or $env:OS -eq "Windows_NT") {
            $CoverageReport = Join-Path (Get-Location) "coverage\lcov-report\index.html"
            if (Test-Path $CoverageReport) {
                Write-Host "🌐 Opening coverage report..." -ForegroundColor Yellow
                Start-Process $CoverageReport
            }
        }
    }
}

# Integration testing
if ($Integration) {
    Write-Host "🔗 Running integration tests..." -ForegroundColor Yellow
    
    $IntegrationCommand = "npm run test:integration"
    try {
        Invoke-Expression $IntegrationCommand
        Write-Host "✅ Integration tests completed" -ForegroundColor Green
    } catch {
        Write-Warning "Integration tests not available or failed"
    }
}

# API contract testing
Write-Host "📋 Running API contract tests..." -ForegroundColor Yellow
$ContractCommand = "npm run test:contract"
try {
    Invoke-Expression $ContractCommand
    Write-Host "✅ API contract tests completed" -ForegroundColor Green
} catch {
    Write-Warning "API contract tests not available"
}

# Load testing
Write-Host "⚡ Running load tests..." -ForegroundColor Yellow
$LoadCommand = "npm run test:load"
try {
    Invoke-Expression $LoadCommand
    Write-Host "✅ Load tests completed" -ForegroundColor Green
} catch {
    Write-Warning "Load tests not available"
}

# Security testing
Write-Host "🔒 Running security tests..." -ForegroundColor Yellow
$SecurityCommand = "npm run test:security"
try {
    Invoke-Expression $SecurityCommand
    Write-Host "✅ Security tests completed" -ForegroundColor Green
} catch {
    Write-Warning "Security tests not available"
}

# Database testing
Write-Host "🗄️ Running database tests..." -ForegroundColor Yellow
$DbCommand = "npm run test:database"
try {
    Invoke-Expression $DbCommand
    Write-Host "✅ Database tests completed" -ForegroundColor Green
} catch {
    Write-Warning "Database tests not available"
}

# Test summary
Write-Host "`n📋 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

if ($TestExitCode -eq 0) {
    Write-Host "✅ All backend tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some backend tests failed!" -ForegroundColor Red
}

# Performance analysis
Write-Host "`n⚡ Running performance analysis..." -ForegroundColor Yellow
$PerfCommand = "npm run analyze:performance"
try {
    Invoke-Expression $PerfCommand
    Write-Host "✅ Performance analysis completed" -ForegroundColor Green
} catch {
    Write-Warning "Performance analysis not available"
}

# Memory leak detection
Write-Host "🧠 Running memory leak detection..." -ForegroundColor Yellow
$MemoryCommand = "npm run test:memory"
try {
    Invoke-Expression $MemoryCommand
    Write-Host "✅ Memory leak detection completed" -ForegroundColor Green
} catch {
    Write-Warning "Memory leak detection not available"
}

# Return to original directory
Set-Location $PSScriptRoot\..\..

Write-Host "`n🏁 Backend testing completed!" -ForegroundColor Cyan
exit $TestExitCode
