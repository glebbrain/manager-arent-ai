# Blockchain Testing Script - IdealCompany
# Comprehensive testing for smart contracts and blockchain integration

param(
    [string]$TestType = "all",
    [string]$Network = "hardhat",
    [switch]$Gas,
    [switch]$Coverage,
    [switch]$Verbose,
    [string]$Contract = ""
)

Write-Host "⛓️ Blockchain Testing - IdealCompany" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Set working directory to blockchain
$BlockchainPath = "src/blockchain"
if (-not (Test-Path $BlockchainPath)) {
    Write-Error "Blockchain directory not found: $BlockchainPath"
    exit 1
}

Set-Location $BlockchainPath

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found in blockchain directory"
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
$TestCommand = "npx hardhat test"

# Add network parameter
if ($Network -ne "hardhat") {
    $TestCommand += " --network $Network"
}

# Add gas reporting
if ($Gas) {
    $TestCommand += " --gas-report"
}

# Add coverage
if ($Coverage) {
    $TestCommand += " --coverage"
}

# Add verbose output
if ($Verbose) {
    $TestCommand += " --verbose"
}

# Add specific contract testing
if ($Contract) {
    $TestCommand += " test/$Contract"
}

# Add test path patterns based on test type
switch ($TestType.ToLower()) {
    "tokens" {
        $TestCommand += " test/tokens/"
    }
    "governance" {
        $TestCommand += " test/governance/"
    }
    "rewards" {
        $TestCommand += " test/rewards/"
    }
    "performance" {
        $TestCommand += " test/performance/"
    }
    "integration" {
        $TestCommand += " test/integration/"
    }
    "unit" {
        $TestCommand += " test/"
    }
    "all" {
        # Run all tests
    }
    default {
        Write-Warning "Unknown test type: $TestType. Running all tests."
    }
}

Write-Host "🚀 Running blockchain tests..." -ForegroundColor Green
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

# Gas optimization analysis
if ($Gas -and $TestExitCode -eq 0) {
    Write-Host "⛽ Gas optimization analysis completed!" -ForegroundColor Green
}

# Contract verification
Write-Host "🔍 Verifying smart contracts..." -ForegroundColor Yellow
$VerifyCommand = "npx hardhat verify --help"
try {
    Invoke-Expression $VerifyCommand | Out-Null
    Write-Host "✅ Contract verification tools available" -ForegroundColor Green
} catch {
    Write-Warning "Contract verification tools not available"
}

# Test summary
Write-Host "`n📋 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

if ($TestExitCode -eq 0) {
    Write-Host "✅ All blockchain tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some blockchain tests failed!" -ForegroundColor Red
}

# Security analysis
Write-Host "`n🔒 Running security analysis..." -ForegroundColor Yellow
$SecurityCommand = "npx hardhat run scripts/security-analysis.js"
if (Test-Path "scripts/security-analysis.js") {
    try {
        Invoke-Expression $SecurityCommand
        Write-Host "✅ Security analysis completed" -ForegroundColor Green
    } catch {
        Write-Warning "Security analysis script not found or failed"
    }
}

# Return to original directory
Set-Location $PSScriptRoot\..\..

Write-Host "`n🏁 Blockchain testing completed!" -ForegroundColor Cyan
exit $TestExitCode
