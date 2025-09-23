# FRDL Compiler Performance Analysis Script
# Analyzes compiler performance and provides optimization recommendations

param(
    [string[]]$TestFiles = @(),
    [int]$Iterations = 5,
    [string]$Output = "",
    [ValidateSet("json", "csharp", "python")]
    [string]$Format = "json",
    [switch]$CProfile,
    [switch]$Benchmark,
    [switch]$Help
)

function Show-Help {
    Write-Host "FRDL Compiler Performance Analysis" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\performance_analysis.ps1 [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  -TestFiles <files>     FRDL test files to analyze (default: examples/*.frdl)"
    Write-Host "  -Iterations <number>   Number of iterations per test (default: 5)"
    Write-Host "  -Output <file>         Output file for results"
    Write-Host "  -Format <format>       Output format: json, csharp, python (default: json)"
    Write-Host "  -CProfile              Run with cProfile for detailed analysis"
    Write-Host "  -Benchmark             Run comprehensive benchmark"
    Write-Host "  -Help                  Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\performance_analysis.ps1"
    Write-Host "  .\performance_analysis.ps1 -TestFiles @('examples/simple.frdl') -Iterations 10"
    Write-Host "  .\performance_analysis.ps1 -Benchmark -Output results.json"
    Write-Host "  .\performance_analysis.ps1 -CProfile -Format csharp"
}

function Test-FRDLPerformance {
    Write-Host "[ANALYSIS] FRDL Compiler Performance Analysis" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    
    # Check if Python is available
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "[OK] Python found: $pythonVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "[FAIL] Python not found. Please install Python 3.8 or higher." -ForegroundColor Red
        return 1
    }
    
    # Check if required modules are available
    $requiredModules = @("psutil", "tracemalloc")
    foreach ($module in $requiredModules) {
        try {
            python -c "import $module" 2>$null
            Write-Host "[OK] Module $module is available" -ForegroundColor Green
        }
        catch {
            Write-Host "[WARN] Module $module not found. Installing..." -ForegroundColor Yellow
            pip install $module
        }
    }
    
    # Build command arguments
    $args = @()
    
    if ($TestFiles.Count -gt 0) {
        $args += "--test-files"
        $args += $TestFiles
    }
    
    if ($Iterations -ne 5) {
        $args += "--iterations"
        $args += $Iterations.ToString()
    }
    
    if ($Output) {
        $args += "--output"
        $args += $Output
    }
    
    if ($Format -ne "json") {
        $args += "--format"
        $args += $Format
    }
    
    if ($CProfile) {
        $args += "--cprofile"
    }
    
    if ($Benchmark) {
        $args += "--benchmark"
    }
    
    # Run performance analysis
    Write-Host "🚀 Starting performance analysis..." -ForegroundColor Yellow
    
    try {
        $scriptPath = Join-Path $PSScriptRoot "..\..\scripts\performance_analysis.py"
        python $scriptPath @args
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Performance analysis completed successfully!" -ForegroundColor Green
            
            if ($Output) {
                Write-Host "[SAVED] Results saved to: $Output" -ForegroundColor Cyan
            }
        }
        else {
            Write-Host "[FAIL] Performance analysis failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            return $LASTEXITCODE
        }
    }
    catch {
        Write-Host "[ERROR] Error running performance analysis: $($_.Exception.Message)" -ForegroundColor Red
        return 1
    }
    
    return 0
}

function Get-PerformanceSummary {
    Write-Host "[SUMMARY] Performance Analysis Summary" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    
    # Check if results file exists
    $resultsFile = if ($Output) { $Output } else { "performance_results.json" }
    
    if (Test-Path $resultsFile) {
        try {
            $results = Get-Content $resultsFile | ConvertFrom-Json
            
            Write-Host "📈 Overall Performance Metrics:" -ForegroundColor Green
            if ($results.statistics) {
                $stats = $results.statistics
                Write-Host "  Average execution time: $($stats.overall_avg_execution_time.ToString('F3'))s" -ForegroundColor White
                Write-Host "  Min execution time: $($stats.overall_min_execution_time.ToString('F3'))s" -ForegroundColor White
                Write-Host "  Max execution time: $($stats.overall_max_execution_time.ToString('F3'))s" -ForegroundColor White
                Write-Host "  Average memory usage: $($stats.overall_avg_memory_usage.ToString('F1'))MB" -ForegroundColor White
                Write-Host "  Min memory usage: $($stats.overall_min_memory_usage.ToString('F1'))MB" -ForegroundColor White
                Write-Host "  Max memory usage: $($stats.overall_max_memory_usage.ToString('F1'))MB" -ForegroundColor White
            }
            
            Write-Host "📋 Test Files Analyzed:" -ForegroundColor Green
            foreach ($result in $results.results) {
                $file = Split-Path $result.file -Leaf
                $size = $result.source_size_bytes
                $avgTime = $result.statistics.avg_execution_time
                Write-Host "  $file ($size bytes) - $($avgTime.ToString('F3'))s avg" -ForegroundColor White
            }
        }
        catch {
            Write-Host "[WARN] Could not parse results file: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "[INFO] No results file found. Run performance analysis first." -ForegroundColor Yellow
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

# Run performance analysis
$exitCode = Test-FRDLPerformance

if ($exitCode -eq 0) {
    Get-PerformanceSummary
}

exit $exitCode
