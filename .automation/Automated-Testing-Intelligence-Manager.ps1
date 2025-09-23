# 🧪 Automated Testing Intelligence Manager v2.8.0
# PowerShell script for managing the Automated Testing Intelligence service.
# Version: 2.8.0
# Last Updated: 2025-02-01

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "status", # Possible actions: status, start, stop, restart, deploy, get-config, generate-tests, run-tests, get-suites, get-runs, get-analytics
    
    [Parameter(Mandatory=$false)]
    [string]$Language = "javascript", # Language for test generation
    
    [Parameter(Mandatory=$false)]
    [string]$Framework = "jest", # Testing framework
    
    [Parameter(Mandatory=$false)]
    [string]$Type = "unit", # Type of testing
    
    [Parameter(Mandatory=$false)]
    [string]$SourceCode = "function add(a, b) { return a + b; }", # Source code to test
    
    [Parameter(Mandatory=$false)]
    [string]$SuiteId, # Test suite ID for running tests
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceUrl = "http://localhost:3026",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 Automated Testing Intelligence Manager v2.8.0" -ForegroundColor Cyan
Write-Host "📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

function Invoke-HttpRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        $Body = $null
    )
    
    $params = @{
        Uri = $Uri
        Method = $Method
        Headers = $Headers
        ContentType = "application/json"
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Error "HTTP Request failed: $($_.Exception.Message)"
        return $null
    }
}

function Get-ServiceStatus {
    Write-Host "Checking service status at $ServiceUrl/health..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/health"
    if ($response) {
        Write-Host "Service Status: $($response.status)" -ForegroundColor Green
        Write-Host "Version: $($response.version)" -ForegroundColor Green
        Write-Host "Features: $($response.features.Count) enabled" -ForegroundColor Green
        Write-Host "Test Suites: $($response.testSuites)" -ForegroundColor Green
        Write-Host "Test Cases: $($response.testCases)" -ForegroundColor Green
        Write-Host "Test Runs: $($response.testRuns)" -ForegroundColor Green
    } else {
        Write-Host "Service is not reachable or returned an error." -ForegroundColor Red
    }
}

function Get-ServiceConfig {
    Write-Host "Retrieving Automated Testing Intelligence configuration from $ServiceUrl/api/config..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/config"
    if ($response) {
        Write-Host "Configuration:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5 | Write-Host
    } else {
        Write-Host "Failed to retrieve service config." -ForegroundColor Red
    }
}

function Generate-TestSuite {
    param(
        [string]$Lang,
        [string]$TestFramework,
        [string]$TestType,
        [string]$Code
    )
    Write-Host "Generating $TestType tests in $Lang using $TestFramework for code: $Code" -ForegroundColor Yellow
    
    $body = @{
        language = $Lang
        framework = $TestFramework
        type = $TestType
        sourceCode = $Code
        requirements = @{
            coverage = 80
            includeEdgeCases = $true
            includePerformanceTests = $false
        }
    }
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/generate-tests" -Method "POST" -Body $body
    if ($response) {
        Write-Host "Test Generation Result:" -ForegroundColor Green
        Write-Host "Success: $($response.success)" -ForegroundColor Green
        Write-Host "Test Suite ID: $($response.testSuite.id)" -ForegroundColor Green
        Write-Host "Coverage: $($response.testSuite.coverage)%" -ForegroundColor Green
        Write-Host "Complexity: $($response.testSuite.complexity)" -ForegroundColor Green
        Write-Host "Maintainability: $($response.testSuite.maintainability)" -ForegroundColor Green
        Write-Host "Processing Time: $($response.metadata.processingTime)ms" -ForegroundColor Green
        Write-Host "Test Cases Generated: $($response.testSuite.testSuite.testCases.Count)" -ForegroundColor Yellow
        Write-Host "Generated Test Suite:" -ForegroundColor Cyan
        $response.testSuite.testSuite | ConvertTo-Json -Depth 3 | Write-Host
    } else {
        Write-Host "Test generation failed." -ForegroundColor Red
    }
}

function Run-TestSuite {
    param(
        [string]$Id
    )
    Write-Host "Running test suite with ID: $Id" -ForegroundColor Yellow
    
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/run-tests/$Id" -Method "POST"
    if ($response) {
        Write-Host "Test Execution Result:" -ForegroundColor Green
        Write-Host "Success: $($response.success)" -ForegroundColor Green
        Write-Host "Status: $($response.testRun.status)" -ForegroundColor Green
        Write-Host "Total Tests: $($response.summary.total)" -ForegroundColor Green
        Write-Host "Passed: $($response.summary.passed)" -ForegroundColor Green
        Write-Host "Failed: $($response.summary.failed)" -ForegroundColor Green
        Write-Host "Skipped: $($response.summary.skipped)" -ForegroundColor Green
        Write-Host "Execution Time: $($response.summary.executionTime)ms" -ForegroundColor Green
        Write-Host "Coverage: $($response.summary.coverage)%" -ForegroundColor Green
    } else {
        Write-Host "Test execution failed." -ForegroundColor Red
    }
}

function Get-TestSuites {
    Write-Host "Retrieving test suites..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/test-suites"
    if ($response) {
        Write-Host "Test Suites (Total: $($response.total)):" -ForegroundColor Green
        $response.testSuites | ForEach-Object {
            Write-Host "  ID: $($_.id)" -ForegroundColor White
            Write-Host "  Language: $($_.language)" -ForegroundColor White
            Write-Host "  Framework: $($_.framework)" -ForegroundColor White
            Write-Host "  Type: $($_.type)" -ForegroundColor White
            Write-Host "  Coverage: $($_.coverage)%" -ForegroundColor White
            Write-Host "  Complexity: $($_.complexity)" -ForegroundColor White
            Write-Host "  Maintainability: $($_.maintainability)" -ForegroundColor White
            Write-Host "  Created: $($_.createdAt)" -ForegroundColor White
            Write-Host "  ---" -ForegroundColor Gray
        }
    } else {
        Write-Host "Failed to retrieve test suites." -ForegroundColor Red
    }
}

function Get-TestRuns {
    Write-Host "Retrieving test runs..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/test-runs"
    if ($response) {
        Write-Host "Test Runs (Total: $($response.total)):" -ForegroundColor Green
        $response.testRuns | ForEach-Object {
            Write-Host "  ID: $($_.id)" -ForegroundColor White
            Write-Host "  Suite ID: $($_.suiteId)" -ForegroundColor White
            Write-Host "  Status: $($_.status)" -ForegroundColor White
            Write-Host "  Execution Time: $($_.executionTime)ms" -ForegroundColor White
            Write-Host "  Created: $($_.createdAt)" -ForegroundColor White
            Write-Host "  ---" -ForegroundColor Gray
        }
    } else {
        Write-Host "Failed to retrieve test runs." -ForegroundColor Red
    }
}

function Get-Analytics {
    Write-Host "Retrieving testing analytics..." -ForegroundColor Yellow
    $response = Invoke-HttpRequest -Uri "$ServiceUrl/api/analytics"
    if ($response) {
        Write-Host "Testing Analytics:" -ForegroundColor Green
        Write-Host "  Total Test Suites: $($response.analytics.totalTestSuites)" -ForegroundColor White
        Write-Host "  Total Test Cases: $($response.analytics.totalTestCases)" -ForegroundColor White
        Write-Host "  Total Test Runs: $($response.analytics.totalTestRuns)" -ForegroundColor White
        Write-Host "  Average Coverage: $([math]::Round($response.analytics.averageCoverage, 2))%" -ForegroundColor White
        Write-Host "  Average Execution Time: $([math]::Round($response.analytics.averageExecutionTime, 2))ms" -ForegroundColor White
        Write-Host "  Success Rate: $([math]::Round($response.analytics.successRate * 100, 2))%" -ForegroundColor White
        Write-Host "  Failure Rate: $([math]::Round($response.analytics.failureRate * 100, 2))%" -ForegroundColor White
        Write-Host "  Flaky Test Rate: $([math]::Round($response.analytics.flakyTestRate * 100, 2))%" -ForegroundColor White
    } else {
        Write-Host "Failed to retrieve analytics." -ForegroundColor Red
    }
}

switch ($Action) {
    "status" {
        Get-ServiceStatus
    }
    "start" {
        Write-Host "Starting Automated Testing Intelligence service (manual action required for actual process start)..." -ForegroundColor Yellow
        Write-Host "Please navigate to 'automated-testing-intelligence' directory and run 'npm start' or 'npm run dev'." -ForegroundColor DarkYellow
    }
    "stop" {
        Write-Host "Stopping Automated Testing Intelligence service (manual action required for actual process stop)..." -ForegroundColor Yellow
        Write-Host "Please manually stop the running Node.js process." -ForegroundColor DarkYellow
    }
    "restart" {
        Write-Host "Restarting Automated Testing Intelligence service (manual action required)..." -ForegroundColor Yellow
        Write-Host "Please manually stop and then start the running Node.js process." -ForegroundColor DarkYellow
    }
    "deploy" {
        Write-Host "Deployment of Automated Testing Intelligence service (placeholder - implement actual deployment logic)..." -ForegroundColor Yellow
        Write-Host "This would typically involve Docker/Kubernetes deployment scripts." -ForegroundColor DarkYellow
    }
    "get-config" {
        Get-ServiceConfig
    }
    "generate-tests" {
        Generate-TestSuite -Lang $Language -TestFramework $Framework -TestType $Type -Code $SourceCode
    }
    "run-tests" {
        if (-not $SuiteId) {
            Write-Error "SuiteId is required for 'run-tests' action."
            break
        }
        Run-TestSuite -Id $SuiteId
    }
    "get-suites" {
        Get-TestSuites
    }
    "get-runs" {
        Get-TestRuns
    }
    "get-analytics" {
        Get-Analytics
    }
    default {
        Write-Host "Invalid action specified. Supported actions: status, start, stop, restart, deploy, get-config, generate-tests, run-tests, get-suites, get-runs, get-analytics." -ForegroundColor Red
    }
}

Write-Host "🧪 Automated Testing Intelligence Manager finished." -ForegroundColor Cyan
