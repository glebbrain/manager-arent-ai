param(
    [switch]$Quiet,
    [switch]$Detailed,
    [switch]$GenerateReport
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { if (-not $Quiet) { Write-Host $msg -ForegroundColor Cyan } }
function Write-Ok($msg)   { if (-not $Quiet) { Write-Host $msg -ForegroundColor Green } }
function Write-Warn($msg) { if (-not $Quiet) { Write-Host $msg -ForegroundColor Yellow } }
function Write-Err($msg)  { if (-not $Quiet) { Write-Host $msg -ForegroundColor Red } }

Write-Info "Project Problem Analysis"

# Get project root directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
    Write-Info "Python version: $pythonVersion"
} catch {
    Write-Err "Python is not installed or not in PATH"
    exit 1
}

# Check if problem analyzer exists
$analyzerPath = Join-Path $projectRoot "src\etl\project_problem_analyzer.py"
if (-not (Test-Path $analyzerPath)) {
    Write-Err "Problem analyzer not found at: $analyzerPath"
    exit 1
}

# Check if config exists
$configPath = Join-Path $projectRoot "config\problem_analysis_config.json"
if (-not (Test-Path $configPath)) {
    Write-Warn "Problem analysis config not found, using defaults"
}

# Check for metrics files
$metricsDir = Join-Path $projectRoot "temp\etl_out"
if (-not (Test-Path $metricsDir)) {
    Write-Err "Metrics directory not found: $metricsDir"
    exit 1
}

$metricsFiles = Get-ChildItem $metricsDir -Filter "project_metrics_*.json" | Sort-Object LastWriteTime -Descending
if ($metricsFiles.Count -eq 0) {
    Write-Err "No metrics files found in: $metricsDir"
    Write-Info "Run project metrics collection first"
    exit 1
}

$latestMetricsFile = $metricsFiles[0].FullName
Write-Info "Using metrics file: $($metricsFiles[0].Name)"

# Run problem analysis
Write-Info "Running project problem analysis..."
try {
    $output = python $analyzerPath 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Write-Ok "Problem analysis completed successfully"

        if (-not $Quiet) {
            Write-Host $output
        }

        # Check for analysis results
        $resultsFiles = Get-ChildItem $metricsDir -Filter "problem_analysis_*.json" | Sort-Object LastWriteTime -Descending
        if ($resultsFiles.Count -gt 0) {
            $latestResultsFile = $resultsFiles[0].FullName
            Write-Info "Analysis results saved to: $($resultsFiles[0].Name)"

            if ($Detailed) {
                try {
                    $results = Get-Content $latestResultsFile | ConvertFrom-Json

                    Write-Info "`nAnalysis Summary:"
                    Write-Host "  Total Problems: $($results.summary.total_problems)" -ForegroundColor White
                    Write-Host "  Total Anomalies: $($results.summary.total_anomalies)" -ForegroundColor White

                    if ($results.summary.problems_by_severity) {
                        Write-Info "`nProblems by Severity:"
                        foreach ($severity in $results.summary.problems_by_severity.PSObject.Properties) {
                            $color = switch ($severity.Name) {
                                "critical" { "Red" }
                                "high" { "Yellow" }
                                "medium" { "Cyan" }
                                "low" { "Green" }
                                default { "White" }
                            }
                            Write-Host "  $($severity.Name): $($severity.Value)" -ForegroundColor $color
                        }
                    }

                    if ($results.summary.problems_by_type) {
                        Write-Info "`nProblems by Type:"
                        foreach ($type in $results.summary.problems_by_type.PSObject.Properties) {
                            Write-Host "  $($type.Name): $($type.Value)" -ForegroundColor White
                        }
                    }

                    if ($results.problems -and $results.problems.Count -gt 0) {
                        Write-Info "`nDetailed Problems:"
                        foreach ($problem in $results.problems) {
                            $severityColor = switch ($problem.severity) {
                                "critical" { "Red" }
                                "high" { "Yellow" }
                                "medium" { "Cyan" }
                                "low" { "Green" }
                                default { "White" }
                            }

                            Write-Host "`n  [$($problem.severity.ToUpper())] $($problem.title)" -ForegroundColor $severityColor
                            Write-Host "    Project: $($problem.project_id)" -ForegroundColor White
                            Write-Host "    Type: $($problem.problem_type)" -ForegroundColor White
                            Write-Host "    Description: $($problem.description)" -ForegroundColor White
                            Write-Host "    Impact Score: $([math]::Round($problem.impact_score, 2))" -ForegroundColor White
                            Write-Host "    Confidence: $([math]::Round($problem.confidence_score, 2))" -ForegroundColor White

                            if ($problem.affected_metrics) {
                                Write-Host "    Affected Metrics: $($problem.affected_metrics -join ', ')" -ForegroundColor White
                            }

                            if ($problem.root_cause) {
                                Write-Host "    Root Cause: $($problem.root_cause)" -ForegroundColor Yellow
                            }
                        }
                    }

                    if ($results.anomalies -and $results.anomalies.Count -gt 0) {
                        Write-Info "`nDetected Anomalies:"
                        foreach ($anomaly in $results.anomalies) {
                            Write-Host "`n  Metric: $($anomaly.metric_name)" -ForegroundColor White
                            Write-Host "    Project: $($anomaly.project_id)" -ForegroundColor White
                            Write-Host "    Value: $($anomaly.value) (Expected: $($anomaly.expected_value))" -ForegroundColor White
                            Write-Host "    Deviation: $([math]::Round($anomaly.deviation_percentage, 1))%" -ForegroundColor White
                            Write-Host "    Type: $($anomaly.anomaly_type)" -ForegroundColor White
                            Write-Host "    Confidence: $([math]::Round($anomaly.confidence, 2))" -ForegroundColor White
                        }
                    }
                } catch {
                    Write-Warn "Could not parse analysis results: $($_.Exception.Message)"
                }
            }
        }

    } else {
        Write-Err "Problem analysis failed with exit code: $exitCode"
        Write-Host $output
        exit $exitCode
    }

} catch {
    Write-Err "Error running problem analysis: $($_.Exception.Message)"
    exit 1
}

# Generate report if requested
if ($GenerateReport) {
    Write-Info "Generating problem analysis report..."

    $reportDir = Join-Path $projectRoot "reports"
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportFile = Join-Path $reportDir "problem_analysis_report_$timestamp.html"

    try {
        # Create HTML report
        $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Project Problem Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .problem { margin: 15px 0; padding: 15px; border-left: 4px solid #ccc; }
        .critical { border-left-color: #dc3545; }
        .high { border-left-color: #fd7e14; }
        .medium { border-left-color: #ffc107; }
        .low { border-left-color: #28a745; }
        .anomaly { margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Project Problem Analysis Report</h1>
        <p>Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
    </div>
"@

        if ($resultsFiles.Count -gt 0) {
            $results = Get-Content $latestResultsFile | ConvertFrom-Json

            $html += @"
    <div class="summary">
        <h2>Summary</h2>
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Problems</td><td>$($results.summary.total_problems)</td></tr>
            <tr><td>Total Anomalies</td><td>$($results.summary.total_anomalies)</td></tr>
        </table>
    </div>
"@

            if ($results.problems -and $results.problems.Count -gt 0) {
                $html += "<h2>Detected Problems</h2>"
                foreach ($problem in $results.problems) {
                    $html += @"
    <div class="problem $($problem.severity)">
        <h3>[$($problem.severity.ToUpper())] $($problem.title)</h3>
        <p><strong>Project:</strong> $($problem.project_id)</p>
        <p><strong>Type:</strong> $($problem.problem_type)</p>
        <p><strong>Description:</strong> $($problem.description)</p>
        <p><strong>Impact Score:</strong> $([math]::Round($problem.impact_score, 2))</p>
        <p><strong>Confidence:</strong> $([math]::Round($problem.confidence_score, 2))</p>
        <p><strong>Affected Metrics:</strong> $($problem.affected_metrics -join ', ')</p>
        $(if ($problem.root_cause) { "<p><strong>Root Cause:</strong> $($problem.root_cause)</p>" })
    </div>
"@
                }
            }

            if ($results.anomalies -and $results.anomalies.Count -gt 0) {
                $html += "<h2>Detected Anomalies</h2>"
                foreach ($anomaly in $results.anomalies) {
                    $html += @"
    <div class="anomaly">
        <h4>$($anomaly.metric_name) - $($anomaly.anomaly_type)</h4>
        <p><strong>Project:</strong> $($anomaly.project_id)</p>
        <p><strong>Value:</strong> $($anomaly.value) (Expected: $($anomaly.expected_value))</p>
        <p><strong>Deviation:</strong> $([math]::Round($anomaly.deviation_percentage, 1))%</p>
        <p><strong>Confidence:</strong> $([math]::Round($anomaly.confidence, 2))</p>
    </div>
"@
                }
            }
        }

        $html += @"
</body>
</html>
"@

        $html | Out-File -FilePath $reportFile -Encoding UTF8
        Write-Ok "Report generated: $reportFile"

    } catch {
        Write-Warn "Could not generate report: $($_.Exception.Message)"
    }
}

Write-Ok "Project problem analysis completed"
exit 0
