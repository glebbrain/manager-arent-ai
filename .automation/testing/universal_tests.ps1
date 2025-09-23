# Universal Test Suite Runner
# Supports multiple project types: Node.js, Python, C++, .NET, Java, Go, Rust, PHP
# Enhanced with comprehensive test suite management

param(
    [string]$ProjectType = "auto",
    [string]$ProjectPath = ".",
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
    [string]$TestPattern = "*",
    [switch]$Quiet
)

# Load project configuration
$configPath = Join-Path $PSScriptRoot "..\config\project-config.json"
$projectConfig = Get-Content $configPath | ConvertFrom-Json

Write-Host "🧪 Universal Test Suite - Starting..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Continue"

# Function to detect project type
function Get-ProjectType {
    param([string]$Path)
    
    if ($ProjectType -ne "auto") {
        return $ProjectType
    }
    
    $detectScript = Join-Path $PSScriptRoot "..\utilities\detect-project-type.ps1"
    $result = & $detectScript -ProjectPath $Path -Json -Quiet
    $projectInfo = $result | ConvertFrom-Json
    
    if ($projectInfo.Error) {
        Write-Host "❌ Failed to detect project type: $($projectInfo.Error)" -ForegroundColor Red
        return "unknown"
    }
    
    return $projectInfo.Type
}

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
    
    if (-not $Quiet) {
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
}

# Function to run unit tests
function Invoke-UnitTests {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n🔬 Running Unit Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    
    try {
        Push-Location $Path
        
        # Determine test command based on project type
        $testCommand = switch ($ProjectType) {
            "nodejs" {
                if ($CI) { "npm run test:ci" } else { "npm test" }
            }
            "python" {
                "pytest tests/ -v"
            }
            "cpp" {
                "ctest --test-dir build"
            }
            "dotnet" {
                "dotnet test --logger console"
            }
            "java" {
                "mvn test"
            }
            "go" {
                "go test ./..."
            }
            "rust" {
                "cargo test"
            }
            "php" {
                "phpunit"
            }
            default {
                $typeConfig.testCommand
            }
        }
        
        if ($Verbose) {
            Write-Host "Running: $testCommand" -ForegroundColor Cyan
        }
        
        $result = Invoke-Expression $testCommand 2>&1
        
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
    } finally {
        Pop-Location
    }
}

# Function to run integration tests
function Invoke-IntegrationTests {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n🔗 Running Integration Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        Push-Location $Path
        
        # Determine integration test command based on project type
        $testCommand = switch ($ProjectType) {
            "nodejs" {
                "npm run test:integration"
            }
            "python" {
                "pytest tests/integration/ -v"
            }
            "cpp" {
                "ctest --test-dir build -L integration"
            }
            "dotnet" {
                "dotnet test --filter Category=Integration"
            }
            "java" {
                "mvn test -Dtest=*IntegrationTest"
            }
            "go" {
                "go test ./... -tags=integration"
            }
            "rust" {
                "cargo test --test integration"
            }
            "php" {
                "phpunit --testsuite=integration"
            }
            default {
                "echo 'Integration tests not configured for this project type'"
            }
        }
        
        $result = Invoke-Expression $testCommand 2>&1
        
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
    } finally {
        Pop-Location
    }
}

# Function to run E2E tests
function Invoke-E2ETests {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n🌐 Running E2E Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        Push-Location $Path
        
        # Determine E2E test command based on project type
        $testCommand = switch ($ProjectType) {
            "nodejs" {
                "npm run test:e2e"
            }
            "python" {
                "pytest tests/e2e/ -v"
            }
            "dotnet" {
                "dotnet test --filter Category=E2E"
            }
            "java" {
                "mvn test -Dtest=*E2ETest"
            }
            default {
                "echo 'E2E tests not configured for this project type'"
            }
        }
        
        $result = Invoke-Expression $testCommand 2>&1
        
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
    } finally {
        Pop-Location
    }
}

# Function to run visual tests
function Invoke-VisualTests {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n👁️ Running Visual Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        Push-Location $Path
        
        # Determine visual test command based on project type
        $testCommand = switch ($ProjectType) {
            "nodejs" {
                "npm run test:visual"
            }
            "python" {
                "pytest tests/visual/ -v"
            }
            default {
                "echo 'Visual tests not configured for this project type'"
            }
        }
        
        $result = Invoke-Expression $testCommand 2>&1
        
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
    } finally {
        Pop-Location
    }
}

# Function to run performance tests
function Invoke-PerformanceTests {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n⚡ Running Performance Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        Push-Location $Path
        
        # Determine performance test command based on project type
        $testCommand = switch ($ProjectType) {
            "nodejs" {
                "npm run test:performance"
            }
            "python" {
                "pytest tests/performance/ -v"
            }
            "go" {
                "go test -bench=."
            }
            "rust" {
                "cargo bench"
            }
            default {
                "echo 'Performance tests not configured for this project type'"
            }
        }
        
        $result = Invoke-Expression $testCommand 2>&1
        
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
    } finally {
        Pop-Location
    }
}

# Function to run mobile tests
function Invoke-MobileTests {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n📱 Running Mobile Tests..." -ForegroundColor Cyan
    
    if (-not (Test-Path (Join-Path $Path "mobile"))) {
        Write-TestResult "Mobile" "Mobile Tests" "SKIP" "0s" "Mobile directory not found"
        return
    }
    
    $startTime = Get-Date
    
    try {
        Push-Location (Join-Path $Path "mobile")
        
        # Determine mobile test command based on project type
        $testCommand = switch ($ProjectType) {
            "nodejs" {
                "npm test"
            }
            "python" {
                "pytest tests/ -v"
            }
            default {
                "echo 'Mobile tests not configured for this project type'"
            }
        }
        
        $result = Invoke-Expression $testCommand 2>&1
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestResult "Mobile" "Mobile Tests" "PASS" "$($duration.TotalSeconds.ToString('F2'))s"
        } else {
            Write-TestResult "Mobile" "Mobile Tests" "FAIL" "$($duration.TotalSeconds.ToString('F2'))s" "Mobile tests failed"
        }
        
        $testResults.Mobile.Duration = $duration.TotalSeconds
        
    } catch {
        Write-TestResult "Mobile" "Mobile Tests" "FAIL" "0s" $_.Exception.Message
    } finally {
        Pop-Location
    }
}

# Function to run security tests
function Invoke-SecurityTests {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n🔐 Running Security Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        Push-Location $Path
        
        # Determine security test command based on project type
        $testCommand = switch ($ProjectType) {
            "nodejs" {
                "npm audit"
            }
            "python" {
                "safety check"
            }
            "dotnet" {
                "dotnet list package --vulnerable"
            }
            "java" {
                "mvn org.owasp:dependency-check-maven:check"
            }
            "go" {
                "gosec ./..."
            }
            "rust" {
                "cargo audit"
            }
            "php" {
                "composer audit"
            }
            default {
                "echo 'Security tests not configured for this project type'"
            }
        }
        
        $result = Invoke-Expression $testCommand 2>&1
        
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
    } finally {
        Pop-Location
    }
}

# Function to run load tests
function Invoke-LoadTests {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n🏋️ Running Load Tests..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        Push-Location $Path
        
        # Determine load test command based on project type
        $testCommand = switch ($ProjectType) {
            "nodejs" {
                "npm run test:load"
            }
            "python" {
                "pytest tests/load/ -v"
            }
            default {
                "echo 'Load tests not configured for this project type'"
            }
        }
        
        $result = Invoke-Expression $testCommand 2>&1
        
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
    } finally {
        Pop-Location
    }
}

# Function to generate coverage report
function New-CoverageReport {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n📊 Generating Coverage Report..." -ForegroundColor Cyan
    
    try {
        Push-Location $Path
        
        # Determine coverage command based on project type
        $coverageCommand = switch ($ProjectType) {
            "nodejs" {
                "npm run test:coverage"
            }
            "python" {
                "pytest --cov=. --cov-report=html"
            }
            "cpp" {
                "gcov -r ."
            }
            "dotnet" {
                "dotnet test --collect:\"XPlat Code Coverage\""
            }
            "java" {
                "mvn jacoco:report"
            }
            "go" {
                "go test -coverprofile=coverage.out ./...; go tool cover -html=coverage.out"
            }
            "rust" {
                "cargo tarpaulin --out Html"
            }
            "php" {
                "phpunit --coverage-html coverage"
            }
            default {
                "echo 'Coverage reporting not configured for this project type'"
            }
        }
        
        $result = Invoke-Expression $coverageCommand 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Coverage report generated successfully" -ForegroundColor Green
            
            # Check for common coverage report locations
            $coveragePaths = @("coverage", "coverage/lcov-report", "coverage/html", "target/site/jacoco")
            foreach ($coveragePath in $coveragePaths) {
                if (Test-Path $coveragePath) {
                    Write-Host "📄 Coverage report available at: $coveragePath" -ForegroundColor Blue
                    break
                }
            }
        } else {
            Write-Host "❌ Failed to generate coverage report" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "❌ Error generating coverage report: $($_.Exception.Message)" -ForegroundColor Red
    } finally {
        Pop-Location
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
    Write-Host "Starting Universal Test Suite..." -ForegroundColor Green
    
    # Detect project type
    $detectedType = Get-ProjectType -Path $ProjectPath
    if ($detectedType -eq "unknown") {
        Write-Host "❌ Could not detect project type" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Detected project type: $detectedType" -ForegroundColor Green
    
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
    if ($runUnit) { Invoke-UnitTests -ProjectType $detectedType -Path $ProjectPath }
    if ($runIntegration) { Invoke-IntegrationTests -ProjectType $detectedType -Path $ProjectPath }
    if ($runE2E) { Invoke-E2ETests -ProjectType $detectedType -Path $ProjectPath }
    if ($runVisual) { Invoke-VisualTests -ProjectType $detectedType -Path $ProjectPath }
    if ($runPerformance) { Invoke-PerformanceTests -ProjectType $detectedType -Path $ProjectPath }
    if ($runMobile) { Invoke-MobileTests -ProjectType $detectedType -Path $ProjectPath }
    if ($runSecurity) { Invoke-SecurityTests -ProjectType $detectedType -Path $ProjectPath }
    if ($runLoad) { Invoke-LoadTests -ProjectType $detectedType -Path $ProjectPath }
    
    # Generate coverage report if requested
    if ($Coverage) { New-CoverageReport -ProjectType $detectedType -Path $ProjectPath }
    
    # Generate test report
    $exitCode = New-TestReport
    
    Write-Host "`n✅ Universal test suite completed!" -ForegroundColor Green
    exit $exitCode
    
} catch {
    Write-Host "❌ Test suite failed with error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
