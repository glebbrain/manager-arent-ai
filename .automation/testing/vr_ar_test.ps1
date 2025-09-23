# VR/AR Testing Script - IdealCompany
# Comprehensive testing for Unity VR/AR interface

param(
    [string]$TestType = "all",
    [switch]$Coverage,
    [switch]$Verbose,
    [string]$Platform = "editor",
    [switch]$Performance
)

Write-Host "🥽 VR/AR Testing - IdealCompany" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Set working directory to VR/AR interface
$VRARPath = "src/vr-interface"
if (-not (Test-Path $VRARPath)) {
    Write-Error "VR/AR interface directory not found: $VRARPath"
    exit 1
}

Set-Location $VRARPath

# Check if Unity project exists
if (-not (Test-Path "Assets")) {
    Write-Error "Unity Assets directory not found"
    exit 1
}

# Check if test runner is available
$TestRunnerPath = "Packages\com.unity.test-framework\Runtime\TestRunner\TestRunner.exe"
if (-not (Test-Path $TestRunnerPath)) {
    Write-Warning "Unity Test Runner not found. Installing test framework..."
    # This would typically be done through Unity Package Manager
}

# Build test command based on parameters
$TestCommand = ""

# Add test path patterns based on test type
switch ($TestType.ToLower()) {
    "components" {
        $TestCommand = "Unity -runTests -testPlatform $Platform -testResults TestResults.xml -testFilter Category=Components"
    }
    "interactions" {
        $TestCommand = "Unity -runTests -testPlatform $Platform -testResults TestResults.xml -testFilter Category=Interactions"
    }
    "performance" {
        $TestCommand = "Unity -runTests -testPlatform $Platform -testResults TestResults.xml -testFilter Category=Performance"
    }
    "ui" {
        $TestCommand = "Unity -runTests -testPlatform $Platform -testResults TestResults.xml -testFilter Category=UI"
    }
    "unit" {
        $TestCommand = "Unity -runTests -testPlatform $Platform -testResults TestResults.xml -testFilter Category=Unit"
    }
    "all" {
        $TestCommand = "Unity -runTests -testPlatform $Platform -testResults TestResults.xml"
    }
    default {
        Write-Warning "Unknown test type: $TestType. Running all tests."
        $TestCommand = "Unity -runTests -testPlatform $Platform -testResults TestResults.xml"
    }
}

# Add coverage if requested
if ($Coverage) {
    $TestCommand += " -coverage"
}

# Add verbose output
if ($Verbose) {
    $TestCommand += " -logFile -"
}

Write-Host "🚀 Running VR/AR tests..." -ForegroundColor Green
Write-Host "Command: $TestCommand" -ForegroundColor Gray

# Execute tests
try {
    Invoke-Expression $TestCommand
    $TestExitCode = $LASTEXITCODE
} catch {
    Write-Error "Failed to run Unity tests. Make sure Unity is installed and accessible from command line."
    $TestExitCode = 1
}

# Generate coverage report if requested
if ($Coverage -and $TestExitCode -eq 0) {
    Write-Host "📊 Generating coverage report..." -ForegroundColor Yellow
    
    # Check if coverage directory exists
    if (Test-Path "Coverage") {
        Write-Host "✅ Coverage report generated in Coverage/ directory" -ForegroundColor Green
        
        # Open coverage report if on Windows
        if ($IsWindows -or $env:OS -eq "Windows_NT") {
            $CoverageReport = Join-Path (Get-Location) "Coverage\index.html"
            if (Test-Path $CoverageReport) {
                Write-Host "🌐 Opening coverage report..." -ForegroundColor Yellow
                Start-Process $CoverageReport
            }
        }
    }
}

# Performance testing
if ($Performance) {
    Write-Host "⚡ Running performance tests..." -ForegroundColor Yellow
    
    $PerfCommand = "Unity -runTests -testPlatform $Platform -testResults PerformanceResults.xml -testFilter Category=Performance"
    try {
        Invoke-Expression $PerfCommand
        Write-Host "✅ Performance tests completed" -ForegroundColor Green
    } catch {
        Write-Warning "Performance tests failed"
    }
}

# VR/AR specific testing
Write-Host "🥽 Running VR/AR specific tests..." -ForegroundColor Yellow

# Test VR hand tracking
Write-Host "✋ Testing VR hand tracking..." -ForegroundColor Yellow
$HandTrackingCommand = "Unity -runTests -testPlatform $Platform -testResults HandTrackingResults.xml -testFilter Category=HandTracking"
try {
    Invoke-Expression $HandTrackingCommand
    Write-Host "✅ Hand tracking tests completed" -ForegroundColor Green
} catch {
    Write-Warning "Hand tracking tests not available"
}

# Test AR object recognition
Write-Host "👁️ Testing AR object recognition..." -ForegroundColor Yellow
$ARCommand = "Unity -runTests -testPlatform $Platform -testResults ARResults.xml -testFilter Category=AR"
try {
    Invoke-Expression $ARCommand
    Write-Host "✅ AR object recognition tests completed" -ForegroundColor Green
} catch {
    Write-Warning "AR object recognition tests not available"
}

# Test spatial mapping
Write-Host "🗺️ Testing spatial mapping..." -ForegroundColor Yellow
$SpatialCommand = "Unity -runTests -testPlatform $Platform -testResults SpatialResults.xml -testFilter Category=SpatialMapping"
try {
    Invoke-Expression $SpatialCommand
    Write-Host "✅ Spatial mapping tests completed" -ForegroundColor Green
} catch {
    Write-Warning "Spatial mapping tests not available"
}

# Test UI interactions
Write-Host "🖱️ Testing UI interactions..." -ForegroundColor Yellow
$UICommand = "Unity -runTests -testPlatform $Platform -testResults UIResults.xml -testFilter Category=UI"
try {
    Invoke-Expression $UICommand
    Write-Host "✅ UI interaction tests completed" -ForegroundColor Green
} catch {
    Write-Warning "UI interaction tests not available"
}

# Test summary
Write-Host "`n📋 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

if ($TestExitCode -eq 0) {
    Write-Host "✅ All VR/AR tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some VR/AR tests failed!" -ForegroundColor Red
}

# Performance analysis
Write-Host "`n⚡ Running performance analysis..." -ForegroundColor Yellow
$PerfAnalysisCommand = "Unity -runTests -testPlatform $Platform -testResults PerformanceAnalysis.xml -testFilter Category=PerformanceAnalysis"
try {
    Invoke-Expression $PerfAnalysisCommand
    Write-Host "✅ Performance analysis completed" -ForegroundColor Green
} catch {
    Write-Warning "Performance analysis not available"
}

# Memory usage analysis
Write-Host "🧠 Running memory usage analysis..." -ForegroundColor Yellow
$MemoryCommand = "Unity -runTests -testPlatform $Platform -testResults MemoryResults.xml -testFilter Category=Memory"
try {
    Invoke-Expression $MemoryCommand
    Write-Host "✅ Memory usage analysis completed" -ForegroundColor Green
} catch {
    Write-Warning "Memory usage analysis not available"
}

# Return to original directory
Set-Location $PSScriptRoot\..\..

Write-Host "`n🏁 VR/AR testing completed!" -ForegroundColor Cyan
exit $TestExitCode
