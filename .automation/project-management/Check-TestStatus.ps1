param(
    [switch]$Detailed,
    [switch]$GenerateReport,
    [string]$OutputFile = "frdl_test_status_report.md"
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 Analyzing FRDL Test Status..." -ForegroundColor Cyan

$report = @"
# 🧪 FRDL Test Status Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Project**: FRDL (FreeRPA DSL) Compiler

## 📋 Executive Summary

Analysis of test coverage, test execution status, and testing infrastructure for the FRDL compiler project.

## 🔍 Test Infrastructure Analysis

"@

# Check if tests directory exists
if (Test-Path "tests/") {
    $report += "`n### ✅ Tests Directory`n"
    $report += "- **Location**: tests/`n"
    $report += "- **Status**: Present`n"
    
    # Count test files
    $testFiles = Get-ChildItem "tests/*.py" -ErrorAction SilentlyContinue
    if ($testFiles) {
        $report += "- **Test Files**: $($testFiles.Count) files`n"
        foreach ($test in $testFiles) {
            $report += "  - **$($test.Name)**: Test file`n"
        }
    } else {
        $report += "- **Test Files**: No .py test files found`n"
    }
    
    # Check for conftest.py
    if (Test-Path "tests/conftest.py") {
        $report += "- **Configuration**: conftest.py present`n"
    } else {
        $report += "- **Configuration**: conftest.py missing`n"
    }
} else {
    $report += "`n### ❌ Tests Directory Missing`n"
    $report += "- **Status**: No tests/ directory found`n"
}

# Check pytest configuration
if (Test-Path "pytest.ini") {
    $report += "`n### ✅ Pytest Configuration`n"
    $report += "- **File**: pytest.ini present`n"
    $report += "- **Status**: Configured`n"
} else {
    $report += "`n### ⚠️ Pytest Configuration`n"
    $report += "- **File**: pytest.ini missing`n"
    $report += "- **Status**: May need configuration`n"
}

# Check pyproject.toml for test configuration
if (Test-Path "pyproject.toml") {
    $report += "`n### ✅ Project Configuration`n"
    $report += "- **File**: pyproject.toml present`n"
    $report += "- **Status**: May contain test configuration`n"
}

# Test execution analysis
$report += "`n## 🚀 Test Execution Analysis`n"

# Check if pytest is available
try {
    $pytestVersion = python -m pytest --version 2>&1
    if ($pytestVersion -match "pytest") {
        $report += "`n### ✅ Pytest Available`n"
        $report += "- **Status**: Pytest is installed and accessible`n"
        $report += "- **Version**: $pytestVersion`n"
    } else {
        $report += "`n### ❌ Pytest Not Available`n"
        $report += "- **Status**: Pytest not found or not working`n"
    }
} catch {
    $report += "`n### ❌ Pytest Not Available`n"
    $report += "- **Status**: Error running pytest: $($_.Exception.Message)`n"
}

# Try to run tests if pytest is available
if (Test-Path "tests/") {
    $report += "`n### 🧪 Test Execution Results`n"
    try {
        Write-Host "Running FRDL tests..." -ForegroundColor Yellow
        $testOutput = python -m pytest tests/ -v --tb=short 2>&1
        $testExitCode = $LASTEXITCODE
        
        if ($testExitCode -eq 0) {
            $report += "- **Status**: ✅ All tests passed`n"
            $report += "- **Exit Code**: 0`n"
        } else {
            $report += "- **Status**: ❌ Some tests failed`n"
            $report += "- **Exit Code**: $testExitCode`n"
        }
        
        # Extract test summary
        $testSummary = $testOutput | Select-String "failed|passed|skipped|error" | Select-Object -Last 1
        if ($testSummary) {
            $report += "- **Summary**: $testSummary`n"
        }
        
        if ($Detailed) {
            $report += "`n#### Detailed Test Output`n"
            $report += "```\n$testOutput\n```\n"
        }
    } catch {
        $report += "- **Status**: ❌ Error running tests`n"
        $report += "- **Error**: $($_.Exception.Message)`n"
    }
}

# Test coverage analysis
$report += "`n## 📊 Test Coverage Analysis`n"

try {
    Write-Host "Analyzing test coverage..." -ForegroundColor Yellow
    $coverageOutput = python -m pytest tests/ --cov=src --cov-report=term-missing 2>&1
    $coverageExitCode = $LASTEXITCODE
    
    if ($coverageExitCode -eq 0) {
        $report += "`n### ✅ Coverage Analysis Successful`n"
        $report += "- **Status**: Coverage analysis completed`n"
        
        # Extract coverage percentage
        $coverageLine = $coverageOutput | Select-String "TOTAL" | Select-Object -Last 1
        if ($coverageLine) {
            $report += "- **Coverage**: $coverageLine`n"
        }
        
        if ($Detailed) {
            $report += "`n#### Coverage Details`n"
            $report += "```\n$coverageOutput\n```\n"
        }
    } else {
        $report += "`n### ⚠️ Coverage Analysis Issues`n"
        $report += "- **Status**: Coverage analysis had issues`n"
        $report += "- **Exit Code**: $coverageExitCode`n"
    }
} catch {
    $report += "`n### ❌ Coverage Analysis Failed`n"
    $report += "- **Status**: Error running coverage analysis`n"
    $report += "- **Error**: $($_.Exception.Message)`n"
}

# Test health assessment
$report += "`n## 🎯 Test Health Assessment`n"

$healthScore = 0
$maxScore = 8

# Check test infrastructure
if (Test-Path "tests/") { $healthScore += 2 }
if (Test-Path "pytest.ini") { $healthScore += 1 }
if (Test-Path "pyproject.toml") { $healthScore += 1 }

# Check test execution
try {
    python -m pytest --version > $null 2>&1
    if ($LASTEXITCODE -eq 0) { $healthScore += 2 }
} catch {}

# Check if tests can run
if (Test-Path "tests/") {
    try {
        python -m pytest tests/ --collect-only > $null 2>&1
        if ($LASTEXITCODE -eq 0) { $healthScore += 2 }
    } catch {}
}

$healthPercentage = [math]::Round(($healthScore / $maxScore) * 100)

if ($healthPercentage -ge 80) {
    $healthStatus = "🟢 Excellent"
} elseif ($healthPercentage -ge 60) {
    $healthStatus = "🟡 Good"
} elseif ($healthPercentage -ge 40) {
    $healthStatus = "🟠 Needs Improvement"
} else {
    $healthStatus = "🔴 Critical Issues"
}

$report += "- **Overall Health**: $healthStatus ($healthPercentage%)`n"
$report += "- **Score**: $healthScore/$maxScore`n"

# Recommendations
$report += "`n## 💡 Recommendations`n"

if (-not (Test-Path "tests/")) {
    $report += "- 🔴 **Critical**: Create tests/ directory and add test files`n"
}
if (-not (Test-Path "pytest.ini")) {
    $report += "- 🟠 **High**: Create pytest.ini configuration file`n"
}
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    $report += "- 🔴 **Critical**: Python not found - install Python first`n"
} else {
    try {
        python -m pytest --version > $null 2>&1
        if ($LASTEXITCODE -ne 0) {
            $report += "- 🟠 **High**: Install pytest: pip install pytest`n"
        }
    } catch {
        $report += "- 🟠 **High**: Install pytest: pip install pytest`n"
    }
}

$report += "`n## 🚀 Next Steps`n"
$report += "1. Ensure all test files are in tests/ directory`n"
$report += "2. Configure pytest.ini for optimal test execution`n"
$report += "3. Add test coverage reporting`n"
$report += "4. Implement continuous integration testing`n"
$report += "5. Add performance and integration tests`n"

$report += "`n---`n"
$report += "*Report generated by FRDL Test Status Analyzer*`n"

# Output report
if ($GenerateReport) {
    $report | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Host "📄 Test status report saved to: $OutputFile" -ForegroundColor Green
} else {
    Write-Host $report -ForegroundColor White
}

Write-Host "`n✅ FRDL Test Status analysis completed!" -ForegroundColor Green
Write-Host "📊 Test Health Score: $healthScore/$maxScore ($healthPercentage%)" -ForegroundColor Cyan

exit 0