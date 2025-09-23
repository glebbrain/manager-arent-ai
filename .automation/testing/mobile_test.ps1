# Mobile App Testing Script - IdealCompany
# Comprehensive testing for React Native mobile application

param(
    [string]$TestType = "all",
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$Verbose,
    [string]$Platform = "both"
)

Write-Host "🧪 Mobile App Testing - IdealCompany" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Set working directory to mobile app
$MobilePath = "src/mobile"
if (-not (Test-Path $MobilePath)) {
    Write-Error "Mobile app directory not found: $MobilePath"
    exit 1
}

Set-Location $MobilePath

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found in mobile directory"
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
    "components" {
        $TestCommand += " -- --testPathPattern=components"
    }
    "screens" {
        $TestCommand += " -- --testPathPattern=screens"
    }
    "contexts" {
        $TestCommand += " -- --testPathPattern=contexts"
    }
    "services" {
        $TestCommand += " -- --testPathPattern=services"
    }
    "navigation" {
        $TestCommand += " -- --testPathPattern=navigation"
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

Write-Host "🚀 Running mobile app tests..." -ForegroundColor Green
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

# Platform-specific testing
if ($Platform -ne "both") {
    Write-Host "📱 Running platform-specific tests for: $Platform" -ForegroundColor Yellow
    
    switch ($Platform.ToLower()) {
        "android" {
            Write-Host "🤖 Android testing..." -ForegroundColor Green
            # Add Android-specific test commands here
        }
        "ios" {
            Write-Host "🍎 iOS testing..." -ForegroundColor Green
            # Add iOS-specific test commands here
        }
    }
}

# Test summary
Write-Host "`n📋 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

if ($TestExitCode -eq 0) {
    Write-Host "✅ All mobile app tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some mobile app tests failed!" -ForegroundColor Red
}

# Return to original directory
Set-Location $PSScriptRoot\..\..

Write-Host "`n🏁 Mobile app testing completed!" -ForegroundColor Cyan
exit $TestExitCode
