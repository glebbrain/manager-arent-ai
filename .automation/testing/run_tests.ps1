# FreeRPA Enterprise Test Suite Runner
# Enhanced with comprehensive test suite management

param(
    [switch]$All,
    [switch]$Unit,
    [switch]$Integration,
    [switch]$E2E,
    [switch]$Visual,
    [switch]$Performance,
    [switch]$Mobile,
    [switch]$Security,
    [switch]$Load,
    [switch]$Coverage,
    [switch]$CI,
    [string]$OutputFormat = "console",
    [string]$TestPattern = "*"
)

Write-Host "🧪 FreeRPA Enterprise Test Suite - Starting..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Continue"

# Test results
$testResults = @{
    Unit = @{ Passed = 0; Failed = 0; Skipped = 0; Duration = 0 }
    Integration = @{ Passed = 0; Failed = 0; Skipped = 0; Duration = 0 }
    E2E = @{ Passed = 0; Failed = 0; Skipped = 0; Duration = 0 }
    Visual = @{ Passed = 0; Failed = 0; Skipped = 0; Duration = 0 }
    Performance = @{ Passed = 0; Failed = 0; Skipped = 0; Duration = 0 }
    Mobile = @{ Passed = 0; Failed = 0; Skipped = 0; Duration = 0 }
    Security = @{ Passed = 0; Failed = 0; Skipped = 0; Duration = 0 }
    Load = @{ Passed = 0; Failed = 0; Skipped = 0; Duration = 0 }
}

# Function to log test results
function Write-TestResult {
    param(
        [string]$TestType,
        [string]$TestName,
        [string]$Status,
        [string]$Duration = "0ms",
        [string]$Message = ""
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    switch ($Status) {
        "PASS" { 
            $testResults[$TestType].Passed++
            Write-Host "[$timestamp] ✅ $TestName ($Duration)" -ForegroundColor Green
        }
        "FAIL" { 
            $testResults[$TestType].Failed++
            Write-Host "[$timestamp] ❌ $TestName ($Duration)" -ForegroundColor Red
            if ($Message) { Write-Host "    $Message" -ForegroundColor Red }
        }
        "SKIP" { 
            $testResults[$TestType].Skipped++
            Write-Host "[$timestamp] ⏭️ $TestName (SKIPPED)" -ForegroundColor Yellow
        }
    }
}

# Function to run unit tests
function Invoke-UnitTests {
    Write-Host "`n🔬 Running Unit Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        if ($CI) {
            $result = npm run test:ci 2>&1
        } else {
            $result = npm run test:unit 2>&1
        }
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult "Unit" "Unit Tests" "PASS" "$($duration.TotalSeconds.ToString('F2'))s"
        } else {
            Write-TestResult "Unit" "Unit Tests" "FAIL" "$($duration.TotalSeconds.ToString('F2'))s" "Unit tests failed"
        }
        
        $testResults.Unit.Duration = $duration.TotalSeconds
        
    } catch {
        Write-TestResult "Unit" "Unit Tests" "FAIL" "0s" $_.Exception.Message
    }
}

# Function to run integration tests
function Invoke-IntegrationTests {
    Write-Host "`n🔗 Running Integration Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        $result = npm run test:integration 2>&1
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult "Integration" "Integration Tests" "PASS" "$($duration.TotalSeconds.ToString('F2'))s"
        } else {
            Write-TestResult "Integration" "Integration Tests" "FAIL" "$($duration.TotalSeconds.ToString('F2'))s" "Integration tests failed"
        }
        
        $testResults.Integration.Duration = $duration.TotalSeconds
        
    } catch {
        Write-TestResult "Integration" "Integration Tests" "FAIL" "0s" $_.Exception.Message
    }
}

# Function to run E2E tests
function Invoke-E2ETests {
    Write-Host "`n🌐 Running E2E Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        $result = npm run test:e2e 2>&1
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult "E2E" "E2E Tests" "PASS" "$($duration.TotalSeconds.ToString('F2'))s"
        } else {
            Write-TestResult "E2E" "E2E Tests" "FAIL" "$($duration.TotalSeconds.ToString('F2'))s" "E2E tests failed"
        }
        
        $testResults.E2E.Duration = $duration.TotalSeconds
        
    } catch {
        Write-TestResult "E2E" "E2E Tests" "FAIL" "0s" $_.Exception.Message
    }
}

# Function to run visual tests
function Invoke-VisualTests {
    Write-Host "`n👁️ Running Visual Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        $result = npm run test:visual 2>&1
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult "Visual" "Visual Tests" "PASS" "$($duration.TotalSeconds.ToString('F2'))s"
        } else {
            Write-TestResult "Visual" "Visual Tests" "FAIL" "$($duration.TotalSeconds.ToString('F2'))s" "Visual tests failed"
        }
        
        $testResults.Visual.Duration = $duration.TotalSeconds
        
    } catch {
        Write-TestResult "Visual" "Visual Tests" "FAIL" "0s" $_.Exception.Message
    }
}

# Function to run performance tests
function Invoke-PerformanceTests {
    Write-Host "`n⚡ Running Performance Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        $result = npm run test:performance 2>&1
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult "Performance" "Performance Tests" "PASS" "$($duration.TotalSeconds.ToString('F2'))s"
        } else {
            Write-TestResult "Performance" "Performance Tests" "FAIL" "$($duration.TotalSeconds.ToString('F2'))s" "Performance tests failed"
        }
        
        $testResults.Performance.Duration = $duration.TotalSeconds
        
    } catch {
        Write-TestResult "Performance" "Performance Tests" "FAIL" "0s" $_.Exception.Message
    }
}

# Function to run mobile tests
function Invoke-MobileTests {
    Write-Host "`n📱 Running Mobile Tests..." -ForegroundColor Cyan
    
    if (-not (Test-Path "mobile")) {
        Write-TestResult "Mobile" "Mobile Tests" "SKIP" "0s" "Mobile directory not found"
        return
    }
    
    $startTime = Get-Date
    
    try {
        Set-Location "mobile"
        $result = npm test 2>&1
        Set-Location ".."
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult "Mobile" "Mobile Tests" "PASS" "$($duration.TotalSeconds.ToString('F2'))s"
        } else {
            Write-TestResult "Mobile" "Mobile Tests" "FAIL" "$($duration.TotalSeconds.ToString('F2'))s" "Mobile tests failed"
        }
        
        $testResults.Mobile.Duration = $duration.TotalSeconds
        
    } catch {
        Set-Location ".."
        Write-TestResult "Mobile" "Mobile Tests" "FAIL" "0s" $_.Exception.Message
    }
}

# Function to run security tests
function Invoke-SecurityTests {
    Write-Host "`n🔐 Running Security Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        $result = npm run test:security 2>&1
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult "Security" "Security Tests" "PASS" "$($duration.TotalSeconds.ToString('F2'))s"
        } else {
            Write-TestResult "Security" "Security Tests" "FAIL" "$($duration.TotalSeconds.ToString('F2'))s" "Security tests failed"
        }
        
        $testResults.Security.Duration = $duration.TotalSeconds
        
    } catch {
        Write-TestResult "Security" "Security Tests" "FAIL" "0s" $_.Exception.Message
    }
}

# Function to run load tests
function Invoke-LoadTests {
    Write-Host "`n🏋️ Running Load Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        $result = npm run test:load 2>&1
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult "Load" "Load Tests" "PASS" "$($duration.TotalSeconds.ToString('F2'))s"
        } else {
            Write-TestResult "Load" "Load Tests" "FAIL" "$($duration.TotalSeconds.ToString('F2'))s" "Load tests failed"
        }
        
        $testResults.Load.Duration = $duration.TotalSeconds
        
    } catch {
        Write-TestResult "Load" "Load Tests" "FAIL" "0s" $_.Exception.Message
    }
}

# Function to generate coverage report
function New-CoverageReport {
    Write-Host "`n📊 Generating Coverage Report..." -ForegroundColor Cyan
    
    try {
        $result = npm run test:coverage 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Coverage report generated successfully" -ForegroundColor Green
            
            if (Test-Path "coverage/lcov-report/index.html") {
                Write-Host "📄 Coverage report available at: coverage/lcov-report/index.html" -ForegroundColor Blue
            }
        } else {
            Write-Host "❌ Failed to generate coverage report" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "❌ Error generating coverage report: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to generate test report
function New-TestReport {
    Write-Host "`n📊 Test Results Summary:" -ForegroundColor Yellow
    
    $totalPassed = 0
    $totalFailed = 0
    $totalSkipped = 0
    $totalDuration = 0
    
    foreach ($testType in $testResults.Keys) {
        $results = $testResults[$testType]
        $totalPassed += $results.Passed
        $totalFailed += $results.Failed
        $totalSkipped += $results.Skipped
        $totalDuration += $results.Duration
        
        if ($results.Passed -gt 0 -or $results.Failed -gt 0 -or $results.Skipped -gt 0) {
            Write-Host "`n$testType Tests:" -ForegroundColor Cyan
            Write-Host "  ✅ Passed: $($results.Passed)" -ForegroundColor Green
            Write-Host "  ❌ Failed: $($results.Failed)" -ForegroundColor Red
            Write-Host "  ⏭️ Skipped: $($results.Skipped)" -ForegroundColor Yellow
            Write-Host "  ⏱️ Duration: $($results.Duration.ToString('F2'))s" -ForegroundColor Blue
        }
    }
    
    Write-Host "`n📈 Overall Results:" -ForegroundColor Yellow
    Write-Host "  ✅ Total Passed: $totalPassed" -ForegroundColor Green
    Write-Host "  ❌ Total Failed: $totalFailed" -ForegroundColor Red
    Write-Host "  ⏭️ Total Skipped: $totalSkipped" -ForegroundColor Yellow
    Write-Host "  ⏱️ Total Duration: $($totalDuration.ToString('F2'))s" -ForegroundColor Blue
    
    $successRate = if (($totalPassed + $totalFailed) -gt 0) {
        [math]::Round(($totalPassed / ($totalPassed + $totalFailed)) * 100, 2)
    } else { 0 }
    
    Write-Host "  📊 Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
    
    # Save report to file if requested
    if ($OutputFormat -eq "json") {
        $reportPath = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        $testResults | ConvertTo-Json -Depth 10 | Out-File $reportPath
        Write-Host "`n📄 Report saved to: $reportPath" -ForegroundColor Green
    }
    
    # Return exit code based on results
    if ($totalFailed -gt 0) {
        return 1
    } else {
        return 0
    }
}

# Main execution
try {
    Write-Host "Starting FreeRPA Enterprise Test Suite..." -ForegroundColor Green
    
    # Determine which tests to run
    $runAll = $All
    $runUnit = $Unit -or $runAll
    $runIntegration = $Integration -or $runAll
    $runE2E = $E2E -or $runAll
    $runVisual = $Visual -or $runAll
    $runPerformance = $Performance -or $runAll
    $runMobile = $Mobile -or $runAll
    $runSecurity = $Security -or $runAll
    $runLoad = $Load -or $runAll
    
    # Run tests
    if ($runUnit) { Invoke-UnitTests }
    if ($runIntegration) { Invoke-IntegrationTests }
    if ($runE2E) { Invoke-E2ETests }
    if ($runVisual) { Invoke-VisualTests }
    if ($runPerformance) { Invoke-PerformanceTests }
    if ($runMobile) { Invoke-MobileTests }
    if ($runSecurity) { Invoke-SecurityTests }
    if ($runLoad) { Invoke-LoadTests }
    
    # Generate coverage report if requested
    if ($Coverage) { New-CoverageReport }
    
    # Generate test report
    $exitCode = New-TestReport
    
    Write-Host "`n✅ Test suite completed!" -ForegroundColor Green
    exit $exitCode
    
} catch {
    Write-Host "❌ Test suite failed with error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}