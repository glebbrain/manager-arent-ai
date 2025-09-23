# Frontend Testing Script - IdealCompany
# Comprehensive testing for React/Next.js frontend application

param(
    [string]$TestType = "all",
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$Verbose,
    [switch]$E2E,
    [string]$Browser = "chrome"
)

Write-Host "🌐 Frontend Testing - IdealCompany" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Set working directory to frontend
$FrontendPath = "src/frontend"
if (-not (Test-Path $FrontendPath)) {
    Write-Error "Frontend directory not found: $FrontendPath"
    exit 1
}

Set-Location $FrontendPath

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found in frontend directory"
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
    "pages" {
        $TestCommand += " -- --testPathPattern=pages"
    }
    "hooks" {
        $TestCommand += " -- --testPathPattern=hooks"
    }
    "utils" {
        $TestCommand += " -- --testPathPattern=utils"
    }
    "api" {
        $TestCommand += " -- --testPathPattern=api"
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

Write-Host "🚀 Running frontend tests..." -ForegroundColor Green
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

# E2E testing
if ($E2E) {
    Write-Host "🎭 Running E2E tests..." -ForegroundColor Yellow
    
    # Check if Playwright is available
    $PlaywrightCommand = "npx playwright test"
    try {
        Invoke-Expression $PlaywrightCommand
        Write-Host "✅ E2E tests completed" -ForegroundColor Green
    } catch {
        Write-Warning "E2E tests not available or failed"
    }
}

# Visual regression testing
Write-Host "🖼️ Running visual regression tests..." -ForegroundColor Yellow
$VisualTestCommand = "npm run test:visual"
if (Get-Command npm -ErrorAction SilentlyContinue) {
    try {
        Invoke-Expression $VisualTestCommand
        Write-Host "✅ Visual regression tests completed" -ForegroundColor Green
    } catch {
        Write-Warning "Visual regression tests not available"
    }
}

# Accessibility testing
Write-Host "♿ Running accessibility tests..." -ForegroundColor Yellow
$A11yTestCommand = "npm run test:a11y"
try {
    Invoke-Expression $A11yTestCommand
    Write-Host "✅ Accessibility tests completed" -ForegroundColor Green
} catch {
    Write-Warning "Accessibility tests not available"
}

# Performance testing
Write-Host "⚡ Running performance tests..." -ForegroundColor Yellow
$PerfTestCommand = "npm run test:performance"
try {
    Invoke-Expression $PerfTestCommand
    Write-Host "✅ Performance tests completed" -ForegroundColor Green
} catch {
    Write-Warning "Performance tests not available"
}

# Test summary
Write-Host "`n📋 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

if ($TestExitCode -eq 0) {
    Write-Host "✅ All frontend tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some frontend tests failed!" -ForegroundColor Red
}

# Bundle analysis
Write-Host "`n📦 Running bundle analysis..." -ForegroundColor Yellow
$BundleCommand = "npm run analyze"
try {
    Invoke-Expression $BundleCommand
    Write-Host "✅ Bundle analysis completed" -ForegroundColor Green
} catch {
    Write-Warning "Bundle analysis not available"
}

# Return to original directory
Set-Location $PSScriptRoot\..\..

Write-Host "`n🏁 Frontend testing completed!" -ForegroundColor Cyan
exit $TestExitCode
