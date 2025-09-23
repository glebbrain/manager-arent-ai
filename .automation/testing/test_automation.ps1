# FreeRPACapture Test Automation Script
# Version: 1.0.1
# Date: 2025-01-31
# Status: Production Ready

param(
    [string]$TestType = "all",
    [string]$BuildType = "Release",
    [switch]$Coverage,
    [switch]$Performance,
    [switch]$Integration,
    [switch]$Verbose,
    [switch]$GenerateReport
)

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BuildDir = Join-Path $ProjectRoot "build"
$TestResultsDir = Join-Path $ProjectRoot "test_results"
$CoverageDir = Join-Path $ProjectRoot "coverage"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Initialize-TestEnvironment {
    Write-ColorOutput "🔧 Initializing test environment..." "Info"
    
    # Create test results directory
    if (-not (Test-Path $TestResultsDir)) {
        New-Item -ItemType Directory -Path $TestResultsDir | Out-Null
    }
    
    # Create coverage directory if needed
    if ($Coverage -and -not (Test-Path $CoverageDir)) {
        New-Item -ItemType Directory -Path $CoverageDir | Out-Null
    }
    
    Write-ColorOutput "✅ Test environment initialized" "Success"
}

function Run-UnitTests {
    Write-ColorOutput "🧪 Running unit tests..." "Info"
    
    try {
        Push-Location $BuildDir
        
        $testArgs = @(
            "--output-on-failure"
            "--verbose"
            "-R", "unit_tests"
        )
        
        if ($Verbose) {
            $testArgs += "--extra-verbose"
        }
        
        $testOutput = & ctest @testArgs 2>&1
        $exitCode = $LASTEXITCODE
        
        # Save test results
        $testOutput | Out-File -FilePath (Join-Path $TestResultsDir "unit_tests.log") -Encoding UTF8
        
        if ($exitCode -eq 0) {
            Write-ColorOutput "✅ Unit tests passed" "Success"
            return $true
        } else {
            Write-ColorOutput "❌ Unit tests failed" "Error"
            Write-ColorOutput $testOutput "Error"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Unit test execution error: $_" "Error"
        return $false
    } finally {
        Pop-Location
    }
}

function Run-IntegrationTests {
    Write-ColorOutput "🔗 Running integration tests..." "Info"
    
    try {
        Push-Location $BuildDir
        
        $testArgs = @(
            "--output-on-failure"
            "--verbose"
            "-R", "integration_tests"
        )
        
        if ($Verbose) {
            $testArgs += "--extra-verbose"
        }
        
        $testOutput = & ctest @testArgs 2>&1
        $exitCode = $LASTEXITCODE
        
        # Save test results
        $testOutput | Out-File -FilePath (Join-Path $TestResultsDir "integration_tests.log") -Encoding UTF8
        
        if ($exitCode -eq 0) {
            Write-ColorOutput "✅ Integration tests passed" "Success"
            return $true
        } else {
            Write-ColorOutput "❌ Integration tests failed" "Error"
            Write-ColorOutput $testOutput "Error"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Integration test execution error: $_" "Error"
        return $false
    } finally {
        Pop-Location
    }
}

function Run-PerformanceTests {
    Write-ColorOutput "⚡ Running performance tests..." "Info"
    
    try {
        Push-Location $BuildDir
        
        $testArgs = @(
            "--output-on-failure"
            "--verbose"
            "-R", "performance_tests"
        )
        
        if ($Verbose) {
            $testArgs += "--extra-verbose"
        }
        
        $testOutput = & ctest @testArgs 2>&1
        $exitCode = $LASTEXITCODE
        
        # Save test results
        $testOutput | Out-File -FilePath (Join-Path $TestResultsDir "performance_tests.log") -Encoding UTF8
        
        if ($exitCode -eq 0) {
            Write-ColorOutput "✅ Performance tests passed" "Success"
            return $true
        } else {
            Write-ColorOutput "❌ Performance tests failed" "Error"
            Write-ColorOutput $testOutput "Error"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Performance test execution error: $_" "Error"
        return $false
    } finally {
        Pop-Location
    }
}

function Run-RealWorldTests {
    Write-ColorOutput "🌍 Running real-world application tests..." "Info"
    
    try {
        Push-Location $BuildDir
        
        $testArgs = @(
            "--output-on-failure"
            "--verbose"
            "-R", "real_world_tests"
        )
        
        if ($Verbose) {
            $testArgs += "--extra-verbose"
        }
        
        $testOutput = & ctest @testArgs 2>&1
        $exitCode = $LASTEXITCODE
        
        # Save test results
        $testOutput | Out-File -FilePath (Join-Path $TestResultsDir "real_world_tests.log") -Encoding UTF8
        
        if ($exitCode -eq 0) {
            Write-ColorOutput "✅ Real-world tests passed" "Success"
            return $true
        } else {
            Write-ColorOutput "❌ Real-world tests failed" "Error"
            Write-ColorOutput $testOutput "Error"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Real-world test execution error: $_" "Error"
        return $false
    } finally {
        Pop-Location
    }
}

function Generate-CoverageReport {
    Write-ColorOutput "📊 Generating coverage report..." "Info"
    
    try {
        # Check if coverage tools are available
        $lcovPath = Get-Command "lcov" -ErrorAction SilentlyContinue
        $genhtmlPath = Get-Command "genhtml" -ErrorAction SilentlyContinue
        
        if (-not $lcovPath -or -not $genhtmlPath) {
            Write-ColorOutput "⚠️ Coverage tools (lcov, genhtml) not found. Skipping coverage report." "Warning"
            return $true
        }
        
        Push-Location $BuildDir
        
        # Capture coverage data
        & lcov --capture --directory . --output-file coverage.info
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Failed to capture coverage data" "Error"
            return $false
        }
        
        # Remove system and test files from coverage
        & lcov --remove coverage.info '/usr/*' '*/vcpkg_installed/*' '*/tests/*' --output-file coverage_filtered.info
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Failed to filter coverage data" "Error"
            return $false
        }
        
        # Generate HTML report
        & genhtml coverage_filtered.info --output-directory $CoverageDir
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Coverage report generated: $CoverageDir" "Success"
            return $true
        } else {
            Write-ColorOutput "❌ Failed to generate coverage report" "Error"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Coverage generation error: $_" "Error"
        return $false
    } finally {
        Pop-Location
    }
}

function Generate-TestReport {
    Write-ColorOutput "📋 Generating test report..." "Info"
    
    try {
        $reportPath = Join-Path $TestResultsDir "test_report.html"
        
        $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>FreeRPACapture Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .info { color: blue; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FreeRPACapture Test Report</h1>
        <p><strong>Generated:</strong> $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        <p><strong>Test Type:</strong> $TestType</p>
        <p><strong>Build Type:</strong> $BuildType</p>
    </div>
    
    <div class="section">
        <h2>Test Summary</h2>
        <p>This report contains the results of automated testing for FreeRPACapture v1.0.1</p>
    </div>
    
    <div class="section">
        <h2>Test Results</h2>
        <p>Detailed test logs are available in the test_results directory:</p>
        <ul>
            <li>Unit Tests: <a href="unit_tests.log">unit_tests.log</a></li>
            <li>Integration Tests: <a href="integration_tests.log">integration_tests.log</a></li>
            <li>Performance Tests: <a href="performance_tests.log">performance_tests.log</a></li>
            <li>Real-World Tests: <a href="real_world_tests.log">real_world_tests.log</a></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Coverage Information</h2>
        <p>Code coverage reports are available in the coverage directory.</p>
    </div>
</body>
</html>
"@
        
        $html | Out-File -FilePath $reportPath -Encoding UTF8
        Write-ColorOutput "✅ Test report generated: $reportPath" "Success"
        return $true
    } catch {
        Write-ColorOutput "❌ Test report generation error: $_" "Error"
        return $false
    }
}

function Show-TestInfo {
    Write-ColorOutput "`n🧪 FreeRPACapture Test Information" "Header"
    Write-ColorOutput "=================================" "Header"
    Write-ColorOutput "Project Root: $ProjectRoot" "Info"
    Write-ColorOutput "Build Directory: $BuildDir" "Info"
    Write-ColorOutput "Test Type: $TestType" "Info"
    Write-ColorOutput "Build Type: $BuildType" "Info"
    Write-ColorOutput "Coverage: $Coverage" "Info"
    Write-ColorOutput "Performance: $Performance" "Info"
    Write-ColorOutput "Integration: $Integration" "Info"
    Write-ColorOutput "Verbose: $Verbose" "Info"
    Write-ColorOutput "Generate Report: $GenerateReport" "Info"
    Write-ColorOutput "`n"
}

# Main execution
function Main {
    Write-ColorOutput "🧪 FreeRPACapture Test Automation v1.0.1" "Header"
    Write-ColorOutput "=======================================" "Header"
    
    Show-TestInfo
    
    # Initialize test environment
    Initialize-TestEnvironment
    
    $allTestsPassed = $true
    
    # Run tests based on type
    switch ($TestType.ToLower()) {
        "unit" {
            if (-not (Run-UnitTests)) {
                $allTestsPassed = $false
            }
        }
        "integration" {
            if (-not (Run-IntegrationTests)) {
                $allTestsPassed = $false
            }
        }
        "performance" {
            if (-not (Run-PerformanceTests)) {
                $allTestsPassed = $false
            }
        }
        "real-world" {
            if (-not (Run-RealWorldTests)) {
                $allTestsPassed = $false
            }
        }
        "all" {
            if (-not (Run-UnitTests)) { $allTestsPassed = $false }
            if (-not (Run-IntegrationTests)) { $allTestsPassed = $false }
            if (-not (Run-PerformanceTests)) { $allTestsPassed = $false }
            if (-not (Run-RealWorldTests)) { $allTestsPassed = $false }
        }
        default {
            Write-ColorOutput "❌ Unknown test type: $TestType" "Error"
            Write-ColorOutput "Valid types: unit, integration, performance, real-world, all" "Info"
            exit 1
        }
    }
    
    # Generate coverage report if requested
    if ($Coverage) {
        if (-not (Generate-CoverageReport)) {
            $allTestsPassed = $false
        }
    }
    
    # Generate test report if requested
    if ($GenerateReport) {
        if (-not (Generate-TestReport)) {
            $allTestsPassed = $false
        }
    }
    
    if ($allTestsPassed) {
        Write-ColorOutput "`n🎉 All tests completed successfully!" "Success"
        Write-ColorOutput "=====================================" "Success"
    } else {
        Write-ColorOutput "`n❌ Some tests failed!" "Error"
        Write-ColorOutput "=====================" "Error"
        exit 1
    }
}

# Execute main function
Main
