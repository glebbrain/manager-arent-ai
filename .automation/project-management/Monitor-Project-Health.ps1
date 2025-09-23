param(
    [switch]$Quiet,
    [switch]$Detailed,
    [switch]$GenerateReport,
    [switch]$ShowDashboard
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { if (-not $Quiet) { Write-Host $msg -ForegroundColor Cyan } }
function Write-Ok($msg)   { if (-not $Quiet) { Write-Host $msg -ForegroundColor Green } }
function Write-Warn($msg) { if (-not $Quiet) { Write-Host $msg -ForegroundColor Yellow } }
function Write-Err($msg)  { if (-not $Quiet) { Write-Host $msg -ForegroundColor Red } }

Write-Info "Project Health Monitoring"

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

# Check if health monitor exists
$monitorPath = Join-Path $projectRoot "src\etl\project_health_monitor.py"
if (-not (Test-Path $monitorPath)) {
    Write-Err "Health monitor not found at: $monitorPath"
    exit 1
}

# Check if config exists
$configPath = Join-Path $projectRoot "config\health_monitoring_config.json"
if (-not (Test-Path $configPath)) {
    Write-Warn "Health monitoring config not found, using defaults"
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

# Run health monitoring
Write-Info "Running project health monitoring..."
try {
    $output = python $monitorPath 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Write-Ok "Health monitoring completed successfully"

        if (-not $Quiet) {
            Write-Host $output
        }

        # Check for health reports
        $reportFiles = Get-ChildItem $metricsDir -Filter "health_report_*.json" | Sort-Object LastWriteTime -Descending
        if ($reportFiles.Count -gt 0) {
            $latestReportFile = $reportFiles[0].FullName
            Write-Info "Health report saved to: $($reportFiles[0].Name)"

            if ($Detailed -or $ShowDashboard) {
                try {
                    $report = Get-Content $latestReportFile | ConvertFrom-Json

                    Write-Info "`n🏥 Project Health Dashboard"
                    Write-Host "=" * 50 -ForegroundColor Cyan

                    # Summary
                    Write-Info "`n[SUMMARY] Health Summary:"
                    Write-Host "  Total Projects: $($report.summary.total_projects)" -ForegroundColor White
                    Write-Host "  [OK] Healthy: $($report.summary.healthy_projects)" -ForegroundColor Green
                    Write-Host "  [WARN] Warning: $($report.summary.warning_projects)" -ForegroundColor Yellow
                    Write-Host "  [CRIT] Critical: $($report.summary.critical_projects)" -ForegroundColor Red
                    Write-Host "  [?] Unknown: $($report.summary.unknown_projects)" -ForegroundColor Gray
                    Write-Host "  [ALERTS] Active Alerts: $($report.summary.active_alerts)" -ForegroundColor Magenta

                    # Health scores
                    if ($report.health_scores -and $report.health_scores.Count -gt 0) {
                        Write-Info "`n[SCORES] Project Health Scores:"
                        foreach ($health in $report.health_scores) {
                            $statusEmoji = switch ($health.status) {
                                "healthy" { "[OK]" }
                                "warning" { "[WARN]" }
                                "critical" { "[CRIT]" }
                                "unknown" { "[?]" }
                                default { "[?]" }
                            }

                            $scoreColor = switch ($health.status) {
                                "healthy" { "Green" }
                                "warning" { "Yellow" }
                                "critical" { "Red" }
                                "unknown" { "Gray" }
                                default { "White" }
                            }

                            Write-Host "`n  $statusEmoji $($health.project_id)" -ForegroundColor $scoreColor
                            Write-Host "    Overall Score: $([math]::Round($health.overall_score, 1))" -ForegroundColor White
                            Write-Host "    Status: $($health.status)" -ForegroundColor $scoreColor

                            # Component scores
                            if ($health.component_scores) {
                                Write-Host "    Components:" -ForegroundColor White
                                foreach ($component in $health.component_scores.PSObject.Properties) {
                                    $compScore = [math]::Round($component.Value, 1)
                                    $compColor = if ($compScore -ge 80) { "Green" } elseif ($compScore -ge 60) { "Yellow" } else { "Red" }
                                    Write-Host "      $($component.Name): $compScore" -ForegroundColor $compColor
                                }
                            }

                            # Trends
                            if ($health.trends) {
                                Write-Host "    Trends:" -ForegroundColor White
                                foreach ($trend in $health.trends.PSObject.Properties) {
                                    $trendEmoji = switch ($trend.Value) {
                                        "improving" { "[UP]" }
                                        "degrading" { "[DOWN]" }
                                        "stable" { "[STABLE]" }
                                        default { "[?]" }
                                    }
                                    Write-Host "      $($trend.Name): $trendEmoji $($trend.Value)" -ForegroundColor White
                                }
                            }

                            # Issues
                            if ($health.issues -and $health.issues.Count -gt 0) {
                                Write-Host "    Issues:" -ForegroundColor Red
                                foreach ($issue in $health.issues[0..2]) {  # Show first 3 issues
                                    Write-Host "      • $issue" -ForegroundColor Red
                                }
                                if ($health.issues.Count -gt 3) {
                                    Write-Host "      ... and $($health.issues.Count - 3) more" -ForegroundColor Gray
                                }
                            }

                            # Recommendations
                            if ($health.recommendations -and $health.recommendations.Count -gt 0) {
                                Write-Host "    Recommendations:" -ForegroundColor Green
                                foreach ($rec in $health.recommendations[0..2]) {  # Show first 3 recommendations
                                    Write-Host "      • $rec" -ForegroundColor Green
                                }
                                if ($health.recommendations.Count -gt 3) {
                                    Write-Host "      ... and $($health.recommendations.Count - 3) more" -ForegroundColor Gray
                                }
                            }
                        }
                    }

                    # Alerts
                    if ($report.alerts -and $report.alerts.Count -gt 0) {
                        Write-Info "`n[ALERTS] Active Health Alerts:"
                        foreach ($alert in $report.alerts) {
                            if (-not $alert.resolved_at) {
                                $alertEmoji = switch ($alert.severity) {
                                    "critical" { "[CRIT]" }
                                    "high" { "[HIGH]" }
                                    "medium" { "[MED]" }
                                    "low" { "[LOW]" }
                                    default { "[?]" }
                                }

                                $alertColor = switch ($alert.severity) {
                                    "critical" { "Red" }
                                    "high" { "Yellow" }
                                    "medium" { "Cyan" }
                                    "low" { "Green" }
                                    default { "White" }
                                }

                                Write-Host "`n  $alertEmoji [$($alert.severity.ToUpper())] $($alert.message)" -ForegroundColor $alertColor
                                Write-Host "    Project: $($alert.project_id)" -ForegroundColor White
                                Write-Host "    Type: $($alert.alert_type)" -ForegroundColor White
                                Write-Host "    Components: $($alert.affected_components -join ', ')" -ForegroundColor White
                                Write-Host "    Health Score: $([math]::Round($alert.health_score_after, 1))" -ForegroundColor White
                            }
                        }
                    }

                    Write-Host "`n" + "=" * 50 -ForegroundColor Cyan

                } catch {
                    Write-Warn "Could not parse health report: $($_.Exception.Message)"
                }
            }
        }

    } else {
        Write-Err "Health monitoring failed with exit code: $exitCode"
        Write-Host $output
        exit $exitCode
    }

} catch {
    Write-Err "Error running health monitoring: $($_.Exception.Message)"
    exit 1
}

# Generate report if requested
if ($GenerateReport) {
    Write-Info "Generating health monitoring report..."

    $reportDir = Join-Path $projectRoot "reports"
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportFile = Join-Path $reportDir "health_monitoring_report_$timestamp.html"

    try {
        # Create HTML report
        $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Project Health Monitoring Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .project { margin: 15px 0; padding: 15px; border-left: 4px solid #ccc; }
        .healthy { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .critical { border-left-color: #dc3545; }
        .unknown { border-left-color: #6c757d; }
        .alert { margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .score { font-weight: bold; }
        .healthy-score { color: #28a745; }
        .warning-score { color: #ffc107; }
        .critical-score { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Project Health Monitoring Report</h1>
        <p>Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
    </div>
"@

        if ($reportFiles.Count -gt 0) {
            $report = Get-Content $latestReportFile | ConvertFrom-Json

            $html += @"
    <div class="summary">
        <h2>Health Summary</h2>
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Projects</td><td>$($report.summary.total_projects)</td></tr>
            <tr><td>Healthy Projects</td><td>$($report.summary.healthy_projects)</td></tr>
            <tr><td>Warning Projects</td><td>$($report.summary.warning_projects)</td></tr>
            <tr><td>Critical Projects</td><td>$($report.summary.critical_projects)</td></tr>
            <tr><td>Unknown Projects</td><td>$($report.summary.unknown_projects)</td></tr>
            <tr><td>Active Alerts</td><td>$($report.summary.active_alerts)</td></tr>
        </table>
    </div>
"@

            if ($report.health_scores -and $report.health_scores.Count -gt 0) {
                $html += "<h2>Project Health Details</h2>"
                foreach ($health in $report.health_scores) {
                    $scoreClass = switch ($health.status) {
                        "healthy" { "healthy-score" }
                        "warning" { "warning-score" }
                        "critical" { "critical-score" }
                        default { "" }
                    }

                    $html += @"
    <div class="project $($health.status)">
        <h3>$($health.project_id) - <span class="score $scoreClass">$([math]::Round($health.overall_score, 1))</span></h3>
        <p><strong>Status:</strong> $($health.status)</p>
        <p><strong>Last Updated:</strong> $($health.last_updated)</p>

        <h4>Component Scores:</h4>
        <table>
            <tr><th>Component</th><th>Score</th></tr>
"@

                    if ($health.component_scores) {
                        foreach ($component in $health.component_scores.PSObject.Properties) {
                            $compScore = [math]::Round($component.Value, 1)
                            $html += "<tr><td>$($component.Name)</td><td>$compScore</td></tr>"
                        }
                    }

                    $html += @"
        </table>

        <h4>Trends:</h4>
        <ul>
"@

                    if ($health.trends) {
                        foreach ($trend in $health.trends.PSObject.Properties) {
                            $html += "<li><strong>$($trend.Name):</strong> $($trend.Value)</li>"
                        }
                    }

                    $html += @"
        </ul>

        <h4>Issues:</h4>
        <ul>
"@

                    if ($health.issues) {
                        foreach ($issue in $health.issues) {
                            $html += "<li>$issue</li>"
                        }
                    }

                    $html += @"
        </ul>

        <h4>Recommendations:</h4>
        <ul>
"@

                    if ($health.recommendations) {
                        foreach ($rec in $health.recommendations) {
                            $html += "<li>$rec</li>"
                        }
                    }

                    $html += @"
        </ul>
    </div>
"@
                }
            }

            if ($report.alerts -and $report.alerts.Count -gt 0) {
                $html += "<h2>Active Alerts</h2>"
                foreach ($alert in $report.alerts) {
                    if (-not $alert.resolved_at) {
                        $html += @"
    <div class="alert">
        <h4>[$($alert.severity.ToUpper())] $($alert.message)</h4>
        <p><strong>Project:</strong> $($alert.project_id)</p>
        <p><strong>Type:</strong> $($alert.alert_type)</p>
        <p><strong>Components:</strong> $($alert.affected_components -join ', ')</p>
        <p><strong>Health Score:</strong> $([math]::Round($alert.health_score_after, 1))</p>
    </div>
"@
                    }
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

Write-Ok "Project health monitoring completed"
exit 0
