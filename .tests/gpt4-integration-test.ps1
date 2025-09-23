# GPT-4 Integration Test Suite
# Comprehensive testing for GPT-4 integration features
# Version: 2.5.0
# Author: Universal Automation Platform

param(
    [Parameter(Mandatory = $false)]
    [string]$TestType = "all",
    
    [Parameter(Mandatory = $false)]
    [string]$ApiKey = $env:OPENAI_API_KEY,
    
    [Parameter(Mandatory = $false)]
    [switch]$Verbose
)

# Test configuration
$TestConfig = @{
    TestTimeout = 300
    RetryAttempts = 3
    TestDataDir = "$PSScriptRoot\..\test-data"
    ResultsDir = "$PSScriptRoot\..\test-results"
    LogFile = "$PSScriptRoot\..\test-results\gpt4-integration-test.log"
}

# Test results tracking
$TestResults = @{
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
    SkippedTests = 0
    StartTime = Get-Date
    EndTime = $null
    Results = @()
}

# Logging function
function Write-TestLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] GPT4-TEST: $Message"
    
    if ($Verbose) {
        Write-Host $LogMessage
    }
    
    Add-Content -Path $TestConfig.LogFile -Value $LogMessage -ErrorAction SilentlyContinue
}

# Initialize test environment
function Initialize-TestEnvironment {
    Write-TestLog "Initializing GPT-4 integration test environment"
    
    # Create test directories
    $Directories = @($TestConfig.TestDataDir, $TestConfig.ResultsDir)
    
    foreach ($Dir in $Directories) {
        if (-not (Test-Path $Dir)) {
            New-Item -Path $Dir -ItemType Directory -Force | Out-Null
            Write-TestLog "Created directory: $Dir"
        }
    }
    
    # Clear previous test results
    if (Test-Path $TestConfig.LogFile) {
        Remove-Item $TestConfig.LogFile -Force
    }
    
    Write-TestLog "Test environment initialized"
}

# Test result tracking
function Add-TestResult {
    param(
        [string]$TestName,
        [string]$Status,
        [string]$Message = "",
        [object]$Details = $null
    )
    
    $TestResults.TotalTests++
    
    switch ($Status.ToLower()) {
        "pass" { $TestResults.PassedTests++ }
        "fail" { $TestResults.FailedTests++ }
        "skip" { $TestResults.SkippedTests++ }
    }
    
    $Result = @{
        TestName = $TestName
        Status = $Status
        Message = $Message
        Details = $Details
        Timestamp = Get-Date
    }
    
    $TestResults.Results += $Result
    
    $Color = switch ($Status.ToLower()) {
        "pass" { "Green" }
        "fail" { "Red" }
        "skip" { "Yellow" }
        default { "White" }
    }
    
    Write-Host "[$Status] $TestName" -ForegroundColor $Color
    if ($Message) {
        Write-Host "  $Message" -ForegroundColor Gray
    }
}

# Test API key validation
function Test-ApiKeyValidation {
    Write-TestLog "Testing API key validation"
    
    try {
        # Test with valid API key
        if ($ApiKey) {
            $Result = & "$PSScriptRoot\..\scripts\gpt4-api-integration.ps1" -Action "status" -ApiKey $ApiKey -Verbose:$Verbose
            if ($LASTEXITCODE -eq 0) {
                Add-TestResult -TestName "API Key Validation" -Status "Pass" -Message "API key validation successful"
            }
            else {
                Add-TestResult -TestName "API Key Validation" -Status "Fail" -Message "API key validation failed"
            }
        }
        else {
            Add-TestResult -TestName "API Key Validation" -Status "Skip" -Message "No API key provided"
        }
    }
    catch {
        Add-TestResult -TestName "API Key Validation" -Status "Fail" -Message "Exception: $($_.Exception.Message)"
    }
}

# Test API connection
function Test-ApiConnection {
    Write-TestLog "Testing API connection"
    
    try {
        if ($ApiKey) {
            $Result = & "$PSScriptRoot\..\scripts\gpt4-api-integration.ps1" -Action "status" -ApiKey $ApiKey -Verbose:$Verbose
            if ($LASTEXITCODE -eq 0) {
                Add-TestResult -TestName "API Connection" -Status "Pass" -Message "API connection successful"
            }
            else {
                Add-TestResult -TestName "API Connection" -Status "Fail" -Message "API connection failed"
            }
        }
        else {
            Add-TestResult -TestName "API Connection" -Status "Skip" -Message "No API key provided"
        }
    }
    catch {
        Add-TestResult -TestName "API Connection" -Status "Fail" -Message "Exception: $($_.Exception.Message)"
    }
}

# Test code analysis functionality
function Test-CodeAnalysis {
    Write-TestLog "Testing code analysis functionality"
    
    try {
        # Create test code file
        $TestCode = @"
function Test-Function {
    param([string]`$Input)
    
    if (`$Input -eq "test") {
        return "success"
    }
    else {
        return "failure"
    }
}
"@
        
        $TestCodeFile = "$TestConfig.TestDataDir\test-code.ps1"
        $TestCode | Out-File -FilePath $TestCodeFile -Encoding UTF8
        
        if ($ApiKey) {
            $Result = & "$PSScriptRoot\..\scripts\gpt4-api-integration.ps1" -Action "analyze" -ApiKey $ApiKey -Prompt $TestCode -Verbose:$Verbose
            if ($LASTEXITCODE -eq 0) {
                Add-TestResult -TestName "Code Analysis" -Status "Pass" -Message "Code analysis completed successfully"
            }
            else {
                Add-TestResult -TestName "Code Analysis" -Status "Fail" -Message "Code analysis failed"
            }
        }
        else {
            Add-TestResult -TestName "Code Analysis" -Status "Skip" -Message "No API key provided"
        }
    }
    catch {
        Add-TestResult -TestName "Code Analysis" -Status "Fail" -Message "Exception: $($_.Exception.Message)"
    }
}

# Test documentation generation
function Test-DocumentationGeneration {
    Write-TestLog "Testing documentation generation"
    
    try {
        $TestCode = @"
function Get-UserData {
    param(
        [string]`$UserId,
        [switch]`$IncludeDetails
    )
    
    # Get user data from database
    return @{
        Id = `$UserId
        Name = "Test User"
        Details = if (`$IncludeDetails) { "Full details" } else { "Basic info" }
    }
}
"@
        
        if ($ApiKey) {
            $Result = & "$PSScriptRoot\..\scripts\gpt4-api-integration.ps1" -Action "document" -ApiKey $ApiKey -Prompt $TestCode -Verbose:$Verbose
            if ($LASTEXITCODE -eq 0) {
                Add-TestResult -TestName "Documentation Generation" -Status "Pass" -Message "Documentation generation completed successfully"
            }
            else {
                Add-TestResult -TestName "Documentation Generation" -Status "Fail" -Message "Documentation generation failed"
            }
        }
        else {
            Add-TestResult -TestName "Documentation Generation" -Status "Skip" -Message "No API key provided"
        }
    }
    catch {
        Add-TestResult -TestName "Documentation Generation" -Status "Fail" -Message "Exception: $($_.Exception.Message)"
    }
}

# Test test generation
function Test-TestGeneration {
    Write-TestLog "Testing test generation"
    
    try {
        $TestCode = @"
function Add-Numbers {
    param([int]`$a, [int]`$b)
    return `$a + `$b
}
"@
        
        if ($ApiKey) {
            $Result = & "$PSScriptRoot\..\scripts\gpt4-api-integration.ps1" -Action "test" -ApiKey $ApiKey -Prompt $TestCode -Verbose:$Verbose
            if ($LASTEXITCODE -eq 0) {
                Add-TestResult -TestName "Test Generation" -Status "Pass" -Message "Test generation completed successfully"
            }
            else {
                Add-TestResult -TestName "Test Generation" -Status "Fail" -Message "Test generation failed"
            }
        }
        else {
            Add-TestResult -TestName "Test Generation" -Status "Skip" -Message "No API key provided"
        }
    }
    catch {
        Add-TestResult -TestName "Test Generation" -Status "Fail" -Message "Exception: $($_.Exception.Message)"
    }
}

# Test code optimization
function Test-CodeOptimization {
    Write-TestLog "Testing code optimization"
    
    try {
        $TestCode = @"
function Process-Items {
    param([array]`$Items)
    
    `$Result = @()
    foreach (`$Item in `$Items) {
        if (`$Item -ne `$null) {
            `$Result += `$Item.ToUpper()
        }
    }
    return `$Result
}
"@
        
        if ($ApiKey) {
            $Result = & "$PSScriptRoot\..\scripts\gpt4-api-integration.ps1" -Action "optimize" -ApiKey $ApiKey -Prompt $TestCode -Verbose:$Verbose
            if ($LASTEXITCODE -eq 0) {
                Add-TestResult -TestName "Code Optimization" -Status "Pass" -Message "Code optimization completed successfully"
            }
            else {
                Add-TestResult -TestName "Code Optimization" -Status "Fail" -Message "Code optimization failed"
            }
        }
        else {
            Add-TestResult -TestName "Code Optimization" -Status "Skip" -Message "No API key provided"
        }
    }
    catch {
        Add-TestResult -TestName "Code Optimization" -Status "Fail" -Message "Exception: $($_.Exception.Message)"
    }
}

# Test GPT-4 code analysis module
function Test-GPT4CodeAnalysisModule {
    Write-TestLog "Testing GPT-4 code analysis module"
    
    try {
        $TestCodeFile = "$TestConfig.TestDataDir\test-module.ps1"
        $TestCode = @"
function Test-Module {
    param([string]`$Input)
    return "Processed: `$Input"
}
"@
        $TestCode | Out-File -FilePath $TestCodeFile -Encoding UTF8
        
        if ($ApiKey) {
            $Result = & "$PSScriptRoot\..\.automation\ai-analysis\GPT4-Code-Analysis.ps1" -CodePath $TestCodeFile -ApiKey $ApiKey -Verbose:$Verbose
            if ($LASTEXITCODE -eq 0) {
                Add-TestResult -TestName "GPT-4 Code Analysis Module" -Status "Pass" -Message "GPT-4 code analysis module test completed successfully"
            }
            else {
                Add-TestResult -TestName "GPT-4 Code Analysis Module" -Status "Fail" -Message "GPT-4 code analysis module test failed"
            }
        }
        else {
            Add-TestResult -TestName "GPT-4 Code Analysis Module" -Status "Skip" -Message "No API key provided"
        }
    }
    catch {
        Add-TestResult -TestName "GPT-4 Code Analysis Module" -Status "Fail" -Message "Exception: $($_.Exception.Message)"
    }
}

# Test error handling
function Test-ErrorHandling {
    Write-TestLog "Testing error handling"
    
    try {
        # Test with invalid API key
        $Result = & "$PSScriptRoot\..\scripts\gpt4-api-integration.ps1" -Action "status" -ApiKey "invalid-key" -Verbose:$Verbose
        if ($LASTEXITCODE -ne 0) {
            Add-TestResult -TestName "Error Handling - Invalid API Key" -Status "Pass" -Message "Correctly handled invalid API key"
        }
        else {
            Add-TestResult -TestName "Error Handling - Invalid API Key" -Status "Fail" -Message "Should have failed with invalid API key"
        }
        
        # Test with empty prompt
        if ($ApiKey) {
            $Result = & "$PSScriptRoot\..\scripts\gpt4-api-integration.ps1" -Action "analyze" -ApiKey $ApiKey -Prompt "" -Verbose:$Verbose
            if ($LASTEXITCODE -ne 0) {
                Add-TestResult -TestName "Error Handling - Empty Prompt" -Status "Pass" -Message "Correctly handled empty prompt"
            }
            else {
                Add-TestResult -TestName "Error Handling - Empty Prompt" -Status "Fail" -Message "Should have failed with empty prompt"
            }
        }
        else {
            Add-TestResult -TestName "Error Handling - Empty Prompt" -Status "Skip" -Message "No API key provided"
        }
    }
    catch {
        Add-TestResult -TestName "Error Handling" -Status "Fail" -Message "Exception: $($_.Exception.Message)"
    }
}

# Test performance
function Test-Performance {
    Write-TestLog "Testing performance"
    
    try {
        if ($ApiKey) {
            $StartTime = Get-Date
            $Result = & "$PSScriptRoot\..\scripts\gpt4-api-integration.ps1" -Action "call" -ApiKey $ApiKey -Prompt "Hello, this is a test." -MaxTokens 100 -Verbose:$Verbose
            $EndTime = Get-Date
            $Duration = ($EndTime - $StartTime).TotalSeconds
            
            if ($LASTEXITCODE -eq 0 -and $Duration -lt 30) {
                Add-TestResult -TestName "Performance Test" -Status "Pass" -Message "API call completed in $([math]::Round($Duration, 2)) seconds"
            }
            else {
                Add-TestResult -TestName "Performance Test" -Status "Fail" -Message "API call took too long ($([math]::Round($Duration, 2)) seconds) or failed"
            }
        }
        else {
            Add-TestResult -TestName "Performance Test" -Status "Skip" -Message "No API key provided"
        }
    }
    catch {
        Add-TestResult -TestName "Performance Test" -Status "Fail" -Message "Exception: $($_.Exception.Message)"
    }
}

# Generate test report
function Generate-TestReport {
    Write-TestLog "Generating test report"
    
    $TestResults.EndTime = Get-Date
    $Duration = ($TestResults.EndTime - $TestResults.StartTime).TotalSeconds
    
    $Report = @{
        TestSuite = "GPT-4 Integration Test Suite"
        Version = "2.5.0"
        StartTime = $TestResults.StartTime
        EndTime = $TestResults.EndTime
        Duration = $Duration
        Summary = @{
            Total = $TestResults.TotalTests
            Passed = $TestResults.PassedTests
            Failed = $TestResults.FailedTests
            Skipped = $TestResults.SkippedTests
            PassRate = if ($TestResults.TotalTests -gt 0) { [math]::Round(($TestResults.PassedTests / $TestResults.TotalTests) * 100, 2) } else { 0 }
        }
        Results = $TestResults.Results
    }
    
    # Save JSON report
    $JsonReport = $Report | ConvertTo-Json -Depth 10
    $JsonReportFile = "$TestConfig.ResultsDir\gpt4-integration-test-report.json"
    $JsonReport | Out-File -FilePath $JsonReportFile -Encoding UTF8
    
    # Generate HTML report
    $HtmlReport = @"
<!DOCTYPE html>
<html>
<head>
    <title>GPT-4 Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e9ecef; padding: 15px; border-radius: 5px; text-align: center; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .skip { color: #ffc107; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .test-result.pass { border-left-color: #28a745; background: #d4edda; }
        .test-result.fail { border-left-color: #dc3545; background: #f8d7da; }
        .test-result.skip { border-left-color: #ffc107; background: #fff3cd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>GPT-4 Integration Test Report</h1>
        <p>Generated: $($Report.EndTime)</p>
        <p>Duration: $([math]::Round($Duration, 2)) seconds</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <p>$($Report.Summary.Total)</p>
        </div>
        <div class="metric pass">
            <h3>Passed</h3>
            <p>$($Report.Summary.Passed)</p>
        </div>
        <div class="metric fail">
            <h3>Failed</h3>
            <p>$($Report.Summary.Failed)</p>
        </div>
        <div class="metric skip">
            <h3>Skipped</h3>
            <p>$($Report.Summary.Skipped)</p>
        </div>
        <div class="metric">
            <h3>Pass Rate</h3>
            <p>$($Report.Summary.PassRate)%</p>
        </div>
    </div>
    
    <h2>Test Results</h2>
    $(foreach ($Result in $Report.Results) {
        "<div class='test-result $($Result.Status.ToLower())'><strong>$($Result.TestName)</strong> - $($Result.Status.ToUpper())<br><small>$($Result.Message)</small></div>"
    })
</body>
</html>
"@
    
    $HtmlReportFile = "$TestConfig.ResultsDir\gpt4-integration-test-report.html"
    $HtmlReport | Out-File -FilePath $HtmlReportFile -Encoding UTF8
    
    Write-TestLog "Test report generated: $JsonReportFile"
    Write-TestLog "HTML report generated: $HtmlReportFile"
    
    return $Report
}

# Main test execution
try {
    Write-Host "GPT-4 Integration Test Suite v2.5.0" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    
    Initialize-TestEnvironment
    
    # Run tests based on type
    switch ($TestType.ToLower()) {
        "all" {
            Test-ApiKeyValidation
            Test-ApiConnection
            Test-CodeAnalysis
            Test-DocumentationGeneration
            Test-TestGeneration
            Test-CodeOptimization
            Test-GPT4CodeAnalysisModule
            Test-ErrorHandling
            Test-Performance
        }
        "api" {
            Test-ApiKeyValidation
            Test-ApiConnection
            Test-ErrorHandling
            Test-Performance
        }
        "features" {
            Test-CodeAnalysis
            Test-DocumentationGeneration
            Test-TestGeneration
            Test-CodeOptimization
        }
        "module" {
            Test-GPT4CodeAnalysisModule
        }
        default {
            Write-Host "Unknown test type: $TestType" -ForegroundColor Red
            Write-Host "Available types: all, api, features, module" -ForegroundColor Yellow
            exit 1
        }
    }
    
    # Generate test report
    $Report = Generate-TestReport
    
    # Display summary
    Write-Host ""
    Write-Host "Test Summary" -ForegroundColor Cyan
    Write-Host "============" -ForegroundColor Cyan
    Write-Host "Total Tests: $($Report.Summary.Total)" -ForegroundColor White
    Write-Host "Passed: $($Report.Summary.Passed)" -ForegroundColor Green
    Write-Host "Failed: $($Report.Summary.Failed)" -ForegroundColor Red
    Write-Host "Skipped: $($Report.Summary.Skipped)" -ForegroundColor Yellow
    Write-Host "Pass Rate: $($Report.Summary.PassRate)%" -ForegroundColor $(if ($Report.Summary.PassRate -ge 80) { "Green" } else { "Red" })
    Write-Host "Duration: $([math]::Round($Report.Duration, 2)) seconds" -ForegroundColor Gray
    
    # Exit with appropriate code
    if ($Report.Summary.Failed -eq 0) {
        Write-Host "All tests passed!" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Host "Some tests failed!" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-TestLog "Fatal error: $($_.Exception.Message)" "ERROR"
    Write-Host "Fatal error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

